const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const url = require('url');
const https = require('https');

const PORT = 3001;
const DB_PATH = path.join(__dirname, 'tickets.json');
const DISCOUNTS_PATH = path.join(__dirname, 'discounts.json');
const TOKEN_BYTES = 16;

// MercadoPago — token en variable de entorno (nunca hardcodeado)
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || '';
// Admin API key — compartida entre server y admin.html para proteger /tickets/all
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '';

function requireAdmin(req) {
  const key = (req.headers['x-admin-key'] || '').trim();
  return ADMIN_API_KEY && key === ADMIN_API_KEY;
}

function loadDB() {
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); } catch { return []; }
}

function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

function loadDiscounts() {
  try { return JSON.parse(fs.readFileSync(DISCOUNTS_PATH, 'utf8')); } catch { return []; }
}

function saveDiscounts(discounts) {
  fs.writeFileSync(DISCOUNTS_PATH, JSON.stringify(discounts, null, 2), 'utf8');
}

function json(res, code, data) {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': 'https://casatapputi.com.mx',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); } catch { resolve(null); }
    });
  });
}

function mpRequest(method, endpoint, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.mercadopago.com',
      path: endpoint,
      method: method,
      headers: {
        'Authorization': 'Bearer ' + MP_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      }
    };
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); } catch { resolve(null); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': 'https://casatapputi.com.mx',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
    });
    return res.end();
  }

  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  // POST /tickets/create-preference
  if (req.method === 'POST' && pathname === '/tickets/create-preference') {
    const body = await parseBody(req);
    if (!body || !body.amount || !body.quantity) {
      return json(res, 400, { error: 'amount and quantity required' });
    }

    // Construir título descriptivo con los nombres si vienen
    let title = 'Florecer 5ª Edición — ' + body.quantity + ' boleto(s)';
    if (body.attendees && body.attendees.length > 0) {
      const names = body.attendees.map(a => a.name).join(', ');
      title += ' — ' + names;
    }

    try {
      const preference = await mpRequest('POST', '/checkout/preferences', {
        items: [{
          title: title,
          quantity: 1,
          unit_price: body.amount,
          currency_id: 'MXN',
        }],
        back_urls: {
          success: 'https://casatapputi.com.mx/eventos/florecer-5/?status=approved',
          failure: 'https://casatapputi.com.mx/eventos/florecer-5/?status=rejected',
          pending: 'https://casatapputi.com.mx/eventos/florecer-5/?status=pending',
        },
        auto_return: 'approved',
        external_reference: body.event || 'florecer-5',
      });

      if (preference && preference.init_point) {
        return json(res, 200, { checkout_url: preference.init_point, preference_id: preference.id });
      } else {
        console.error('MP preference error:', JSON.stringify(preference));
        return json(res, 500, { error: 'No se pudo crear la preferencia de pago' });
      }
    } catch(e) {
      console.error('MP create-preference error:', e);
      return json(res, 500, { error: 'Error al conectar con MercadoPago' });
    }
  }

  // GET /tickets/all — admin endpoint (requiere X-Admin-Key)
  if (req.method === 'GET' && pathname === '/tickets/all') {
    if (!requireAdmin(req)) return json(res, 401, { error: 'No autorizado' });
    const db = loadDB();
    const safe = db.map(t => ({
      id: t.id,
      order_id: t.order_id,
      name: t.name || '',
      last_name: t.last_name || '',
      whatsapp: t.whatsapp || '',
      short_code: t.short_code || '',
      usado: t.usado,
      creado_en: t.creado_en,
      usado_en: t.usado_en || null,
    }));
    return json(res, 200, safe);
  }

  // POST /tickets/verify-code/:code — validar por código de 4 dígitos
  const codeMatch = pathname.match(/^\/tickets\/verify-code\/(\d{4})$/);
  if (req.method === 'POST' && codeMatch) {
    const shortCode = codeMatch[1];
    const db = loadDB();
    const ticket = db.find(t => t.short_code === shortCode);
    if (!ticket) return json(res, 404, { error: 'Código no encontrado' });
    if (ticket.usado) return json(res, 409, { error: 'Este ticket ya fue usado', usado_en: ticket.usado_en });
    ticket.usado = true;
    ticket.usado_en = new Date().toISOString();
    saveDB(db);
    return json(res, 200, { valido: true, usado: true, usado_en: ticket.usado_en, name: ticket.name || '', last_name: ticket.last_name || '' });
  }

  // GET /tickets/stats (requiere X-Admin-Key)
  if (req.method === 'GET' && pathname === '/tickets/stats') {
    if (!requireAdmin(req)) return json(res, 401, { error: 'No autorizado' });
    const db = loadDB();
    const total = db.length;
    const usados = db.filter(t => t.usado).length;
    return json(res, 200, { total, usados });
  }

  // POST /tickets/validate-discount
  if (req.method === 'POST' && pathname === '/tickets/validate-discount') {
    const body = await parseBody(req);
    if (!body || !body.code) {
      return json(res, 400, { error: 'code required' });
    }
    const code = body.code.toUpperCase().trim();
    const discounts = loadDiscounts();
    const discount = discounts.find(d => d.code === code);
    if (!discount) return json(res, 404, { error: 'Código no válido' });
    if (discount.used) return json(res, 409, { error: 'Este código ya fue usado', usado_en: discount.usado_en });
    // No marcar como usado todavía — se marca al completar la compra
    return json(res, 200, {
      valid: true,
      type: discount.type,
      value: discount.value,
      desc: discount.desc
    });
  }

  // POST /tickets/apply-discount — marcar código como usado tras compra exitosa
  if (req.method === 'POST' && pathname === '/tickets/apply-discount') {
    const body = await parseBody(req);
    if (!body || !body.code) {
      return json(res, 400, { error: 'code required' });
    }
    const code = body.code.toUpperCase().trim();
    const discounts = loadDiscounts();
    const discount = discounts.find(d => d.code === code);
    if (!discount) return json(res, 404, { error: 'Código no encontrado' });
    if (discount.used) return json(res, 409, { error: 'Este código ya fue usado', usado_en: discount.usado_en });
    discount.used = true;
    discount.usado_en = new Date().toISOString();
    saveDiscounts(discounts);
    return json(res, 200, { applied: true, code: discount.code });
  }

  // GET /tickets/discounts — admin endpoint (requiere X-Admin-Key)
  if (req.method === 'GET' && pathname === '/tickets/discounts') {
    if (!requireAdmin(req)) return json(res, 401, { error: 'No autorizado' });
    const discounts = loadDiscounts();
    // Agrupar por tipo de descuento para mejor visibilidad
    const summary = {
      total: discounts.length,
      usados: discounts.filter(d => d.used).length,
      disponibles: discounts.filter(d => !d.used).length,
      codigos: discounts.map(d => ({
        code: d.code,
        type: d.type,
        value: d.value,
        desc: d.desc,
        used: d.used,
        usado_en: d.usado_en || null
      }))
    };
    return json(res, 200, summary);
  }

  // POST /tickets/generate
  if (req.method === 'POST' && pathname === '/tickets/generate') {
    const body = await parseBody(req);
    if (!body || !body.order_id) {
      return json(res, 400, { error: 'order_id required' });
    }
    const rawToken = crypto.randomBytes(TOKEN_BYTES).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    // Short code: 4 dígitos para ingreso manual si el QR no escanea
    const shortCode = String(Math.floor(1000 + Math.random() * 9000));
    const db = loadDB();
    db.push({
      id: db.length + 1,
      order_id: body.order_id,
      email: body.email || '',
      name: body.name || '',
      last_name: body.last_name || '',
      whatsapp: body.whatsapp || '',
      token_hash: tokenHash,
      // El token crudo NO se persiste: se entrega una sola vez en la respuesta.
      // Guardarlo junto al hash anulaba el propósito del hash — quien leyera
      // tickets.json obtenía todos los boletos válidos. Consecuencia asumida:
      // un token perdido no se puede recuperar, sólo reemitir.
      short_code: shortCode,
      usado: false,
      creado_en: new Date().toISOString(),
    });
    saveDB(db);
    return json(res, 200, { ticket_id: db.length, token: rawToken, short_code: shortCode });
  }

  // GET /tickets/verify/:token
  const verifyMatch = pathname.match(/^\/tickets\/verify\/([a-f0-9]+)$/);
  if (req.method === 'GET' && verifyMatch) {
    const rawToken = verifyMatch[1];
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const db = loadDB();
    const ticket = db.find(t => t.token_hash === tokenHash);
    if (!ticket) return json(res, 404, { error: 'Token no encontrado' });
    return json(res, 200, {
      valido: true,
      usado: ticket.usado,
      order_id: ticket.order_id,
      creado_en: ticket.creado_en,
      usado_en: ticket.usado_en || null,
      name: ticket.name || '',
      last_name: ticket.last_name || '',
      short_code: ticket.short_code || '',
    });
  }

  // POST /tickets/use/:token
  const useMatch = pathname.match(/^\/tickets\/use\/([a-f0-9]+)$/);
  if (req.method === 'POST' && useMatch) {
    const rawToken = useMatch[1];
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const db = loadDB();
    const ticket = db.find(t => t.token_hash === tokenHash);
    if (!ticket) return json(res, 404, { error: 'Token no encontrado' });
    if (ticket.usado) return json(res, 409, { error: 'Este ticket ya fue usado', usado_en: ticket.usado_en });
    ticket.usado = true;
    ticket.usado_en = new Date().toISOString();
    saveDB(db);
    return json(res, 200, { valido: true, usado: true, usado_en: ticket.usado_en });
  }

  json(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`Tickets API running on port ${PORT}`);
  if (!MP_ACCESS_TOKEN) console.error('FATAL: MP_ACCESS_TOKEN no configurado — MercadoPago no funcionara');
  if (!ADMIN_API_KEY) console.error('FATAL: ADMIN_API_KEY no configurado — /tickets/all rechazara todo');
  if (MP_ACCESS_TOKEN && ADMIN_API_KEY) console.log('MP_ACCESS_TOKEN + ADMIN_API_KEY configurados');
});
