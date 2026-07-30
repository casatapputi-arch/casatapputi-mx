const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const url = require('url');
const https = require('https');

const PORT = 3001;
const DB_PATH = path.join(__dirname, 'tickets.json');
const TOKEN_BYTES = 16;

// MercadoPago — TEST sandbox (cambiar a APP_USR-... para producción)
const MP_ACCESS_TOKEN = 'TEST-1483647169966812-071518-81581533140d35b4daa1c17d1e4e4280-1465544737';

function loadDB() {
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); } catch { return []; }
}

function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

function json(res, code, data) {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': 'https://casatapputi.com.mx',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
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
      'Access-Control-Allow-Headers': 'Content-Type',
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

  // GET /tickets/stats
  if (req.method === 'GET' && pathname === '/tickets/stats') {
    const db = loadDB();
    const total = db.length;
    const usados = db.filter(t => t.usado).length;
    return json(res, 200, { total, usados });
  }

  // POST /tickets/generate
  if (req.method === 'POST' && pathname === '/tickets/generate') {
    const body = await parseBody(req);
    if (!body || !body.order_id) {
      return json(res, 400, { error: 'order_id required' });
    }
    const rawToken = crypto.randomBytes(TOKEN_BYTES).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const db = loadDB();
    db.push({
      id: db.length + 1,
      order_id: body.order_id,
      email: body.email || '',
      name: body.name || '',
      last_name: body.last_name || '',
      whatsapp: body.whatsapp || '',
      token_hash: tokenHash,
      raw_token: rawToken,
      usado: false,
      creado_en: new Date().toISOString(),
    });
    saveDB(db);
    return json(res, 200, { ticket_id: db.length, token: rawToken });
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
});
