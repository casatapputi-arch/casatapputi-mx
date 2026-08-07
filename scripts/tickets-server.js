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
// Admin API key — la teclea el operador en admin.html / validar.html.
// NUNCA debe incrustarse en esas páginas: son públicas (GitHub Pages).
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '';

function requireAdmin(req) {
  const key = (req.headers['x-admin-key'] || '').trim();
  if (!ADMIN_API_KEY || !key) return false;
  // Comparación en tiempo constante: evita distinguir la clave por latencia.
  const a = Buffer.from(key);
  const b = Buffer.from(ADMIN_API_KEY);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/* ── Límite de intentos ──────────────────────────────────────────────────────
   El código de boleto es de 4 dígitos y validarlo MARCA el boleto como usado.
   Sin límite, recorrer las 10 000 combinaciones quema todos los boletos de un
   evento en minutos. Ventana deslizante por IP con bloqueo progresivo; un
   acierto limpia el historial de fallos. En memoria: el servidor es un solo
   proceso, y si se reinicia el peor caso es olvidar bloqueos, no aplicarlos de más. */
const VENTANA_MS = 10 * 60 * 1000;
const MAX_FALLOS = 10;
const CASTIGOS_MS = [60e3, 5 * 60e3, 15 * 60e3, 60 * 60e3];
const buckets = new Map();

/* El dominio está detrás de Cloudflare y de un proxy local, así que
   socket.remoteAddress es la IP del proxy, no la del visitante: sin esto todo
   el tráfico caería en un solo bucket. Se prefiere CF-Connecting-IP, que
   Cloudflare fija y sobrescribe en cada petición; X-Forwarded-For queda como
   respaldo y sólo se toma el primer valor.

   OJO: estas cabeceras son falsificables si alguien alcanza el origen sin pasar
   por Cloudflare. Conviene que el origen sólo acepte tráfico de Cloudflare
   (firewall o Authenticated Origin Pulls) — anotado como pendiente. */
function clientIP(req) {
  const cf = (req.headers['cf-connecting-ip'] || '').trim();
  if (cf) return cf;
  const fwd = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return fwd || (req.socket && req.socket.remoteAddress) || 'desconocida';
}

function limiteAlcanzado(ip) {
  const b = buckets.get(ip);
  if (!b) return 0;
  const ahora = Date.now();
  if (b.bloqueadoHasta > ahora) return Math.ceil((b.bloqueadoHasta - ahora) / 1000);
  return 0;
}

function registrarFallo(ip) {
  const ahora = Date.now();
  const b = buckets.get(ip) || { fallos: [], castigos: 0, bloqueadoHasta: 0 };
  b.fallos = b.fallos.filter(t => ahora - t < VENTANA_MS);
  b.fallos.push(ahora);
  if (b.fallos.length >= MAX_FALLOS) {
    const castigo = CASTIGOS_MS[Math.min(b.castigos, CASTIGOS_MS.length - 1)];
    b.bloqueadoHasta = ahora + castigo;
    b.castigos += 1;
    b.fallos = [];
    console.warn(`[rate-limit] ${ip} bloqueada ${castigo / 1000}s (castigo #${b.castigos})`);
  }
  buckets.set(ip, b);
}

function registrarExito(ip) {
  const b = buckets.get(ip);
  if (b) { b.fallos = []; buckets.set(ip, b); }
}

// Purga periódica para que el Map no crezca sin límite.
setInterval(() => {
  const ahora = Date.now();
  for (const [ip, b] of buckets) {
    const inactiva = (!b.fallos.length || ahora - b.fallos[b.fallos.length - 1] > VENTANA_MS);
    if (inactiva && b.bloqueadoHasta < ahora) buckets.delete(ip);
  }
}, VENTANA_MS).unref();

function loadDB() {
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); } catch { return []; }
}

/* Código de 4 dígitos único entre los boletos VIGENTES (los ya canjeados
   pueden repetirlo sin causar ambigüedad). Se sortea con crypto, no con
   Math.random. Si el espacio se saturara, se avisa en vez de fallar en
   silencio: el canje por código detecta el duplicado y pide el QR. */
function generarShortCode(db) {
  const ocupados = new Set(db.filter(t => t && !t.usado).map(t => t.short_code));
  for (let i = 0; i < 200; i++) {
    const c = String(1000 + crypto.randomInt(9000));
    if (!ocupados.has(c)) return c;
  }
  console.warn('[short-code] espacio de 4 dígitos saturado; se emite uno repetido');
  return String(1000 + crypto.randomInt(9000));
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

/* ── Autorización para emitir boletos ────────────────────────────────────────
   Emitir un boleto vale dinero, así que `generate` exige una de dos vías y
   ninguna la puede fabricar el visitante:

   A) El operador, con `X-Admin-Key` — cortesías y emisión manual.
   B) Un cliente que ya pagó, comprobando el pago CONTRA MercadoPago.

   Lo que NO sirve como prueba de pago es el `status=approved` de la URL de
   retorno: lo teclea cualquiera. Antes bastaba con eso, y ni siquiera hacía
   falta — `generate` no pedía nada en absoluto.

   Sin `MP_ACCESS_TOKEN` la vía B queda CERRADA, no abierta: mientras
   MercadoPago siga congelado, sólo el operador emite. */
function cupoDelPago(pago) {
  // Cuántos boletos ampara este pago. Sale del pago real, no del navegador:
  // así un `payment_id` legítimo no puede emitir boletos ilimitados.
  const items = (pago && pago.additional_info && pago.additional_info.items) || [];
  const total = items.reduce((n, it) => n + (parseInt(it.quantity, 10) || 0), 0);
  return total > 0 ? total : 1;
}

async function autorizarEmision(req, body, db) {
  if (requireAdmin(req)) return { ok: true, via: 'admin', paymentId: '' };

  const paymentId = String((body && body.payment_id) || '').trim();
  if (!paymentId) {
    return { ok: false, code: 401, error: 'Se requiere payment_id de MercadoPago o clave de administrador' };
  }
  if (!MP_ACCESS_TOKEN) {
    return { ok: false, code: 503, error: 'Verificacion de pagos no disponible; solicita tu boleto a Casa Tapputi' };
  }

  let pago;
  try {
    pago = await mpRequest('GET', '/v1/payments/' + encodeURIComponent(paymentId), null);
  } catch {
    return { ok: false, code: 502, error: 'No se pudo verificar el pago con MercadoPago' };
  }
  if (!pago || pago.status !== 'approved') {
    return { ok: false, code: 402, error: 'El pago no esta aprobado' };
  }

  const emitidos = db.filter(t => t.payment_id === paymentId).length;
  if (emitidos >= cupoDelPago(pago)) {
    return { ok: false, code: 409, error: 'Este pago ya tiene todos sus boletos emitidos' };
  }
  return { ok: true, via: 'mercadopago', paymentId };
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
    {
      // El bloqueo pesa sobre quien NO se autentica; una clave válida nunca
      // queda atrapada por los intentos fallidos de un tercero en la misma IP.
      const ip = clientIP(req);
      if (!requireAdmin(req)) {
        const espera = limiteAlcanzado(ip);
        if (espera) {
          res.setHeader('Retry-After', String(espera));
          return json(res, 429, { error: 'Demasiados intentos. Espera un momento.', retry_after: espera });
        }
        registrarFallo(ip);
        return json(res, 401, { error: 'No autorizado' });
      }
      registrarExito(ip);
    }
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

  // POST /tickets/verify-code/:code — canjear por código de 4 dígitos.
  // Operación DESTRUCTIVA (marca el boleto usado): exige clave de staff y
  // está sujeta al límite de intentos.
  const codeMatch = pathname.match(/^\/tickets\/verify-code\/(\d{4})$/);
  if (req.method === 'POST' && codeMatch) {
    const ip = clientIP(req);
    // El bloqueo pesa sobre quien NO se autentica. Si se evaluara antes de la
    // clave, un atacante en la misma IP saliente que el staff (misma red del
    // recinto) dejaría al staff sin poder validar en plena puerta.
    if (!requireAdmin(req)) {
      const espera = limiteAlcanzado(ip);
      if (espera) {
        res.setHeader('Retry-After', String(espera));
        return json(res, 429, { error: 'Demasiados intentos. Espera un momento.', retry_after: espera });
      }
      registrarFallo(ip);
      return json(res, 401, { error: 'No autorizado' });
    }
    registrarExito(ip);

    const shortCode = codeMatch[1];
    const db = loadDB();

    // Sólo compiten los boletos vigentes: un código reutilizado por uno ya
    // canjeado no debe estorbar.
    const candidatos = db.filter(t => t.short_code === shortCode && !t.usado);

    if (candidatos.length === 0) {
      const yaUsado = db.find(t => t.short_code === shortCode && t.usado);
      registrarFallo(ip);
      if (yaUsado) return json(res, 409, { error: 'Este ticket ya fue usado', usado_en: yaUsado.usado_en });
      return json(res, 404, { error: 'Código no encontrado' });
    }

    // Códigos históricos generados sin garantía de unicidad: canjear "el
    // primero que coincida" podría consumir el boleto de otra persona.
    if (candidatos.length > 1) {
      res.setHeader('X-Motivo', 'codigo-duplicado');
      return json(res, 409, {
        error: 'Hay más de un boleto vigente con ese código. Escanea el QR para validar el correcto.',
        duplicados: candidatos.length,
      });
    }

    const ticket = candidatos[0];
    ticket.usado = true;
    ticket.usado_en = new Date().toISOString();
    saveDB(db);
    registrarExito(ip);
    return json(res, 200, { valido: true, usado: true, usado_en: ticket.usado_en, name: ticket.name || '', last_name: ticket.last_name || '' });
  }

  // GET /tickets/stats (requiere X-Admin-Key)
  if (req.method === 'GET' && pathname === '/tickets/stats') {
    {
      // El bloqueo pesa sobre quien NO se autentica; una clave válida nunca
      // queda atrapada por los intentos fallidos de un tercero en la misma IP.
      const ip = clientIP(req);
      if (!requireAdmin(req)) {
        const espera = limiteAlcanzado(ip);
        if (espera) {
          res.setHeader('Retry-After', String(espera));
          return json(res, 429, { error: 'Demasiados intentos. Espera un momento.', retry_after: espera });
        }
        registrarFallo(ip);
        return json(res, 401, { error: 'No autorizado' });
      }
      registrarExito(ip);
    }
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
    {
      // El bloqueo pesa sobre quien NO se autentica; una clave válida nunca
      // queda atrapada por los intentos fallidos de un tercero en la misma IP.
      const ip = clientIP(req);
      if (!requireAdmin(req)) {
        const espera = limiteAlcanzado(ip);
        if (espera) {
          res.setHeader('Retry-After', String(espera));
          return json(res, 429, { error: 'Demasiados intentos. Espera un momento.', retry_after: espera });
        }
        registrarFallo(ip);
        return json(res, 401, { error: 'No autorizado' });
      }
      registrarExito(ip);
    }
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
    const db = loadDB();
    const auth = await autorizarEmision(req, body, db);
    if (!auth.ok) {
      return json(res, auth.code, { error: auth.error });
    }
    const rawToken = crypto.randomBytes(TOKEN_BYTES).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    // Short code: 4 dígitos para ingreso manual si el QR no escanea.
    // Debe ser único ENTRE LOS VIGENTES: antes se sorteaba sin comprobar nada y,
    // por la paradoja del cumpleaños, con ~118 boletos ya había 50% de colisión
    // en 9 000 valores — y el canje consumía "el primero que coincidiera".
    const shortCode = generarShortCode(db);
    db.push({
      id: db.length + 1,
      order_id: body.order_id,
      // Pago que ampara el boleto (vacío si lo emitió el operador). Es lo que
      // permite contar cuántos boletos lleva emitidos un mismo pago.
      payment_id: auth.paymentId,
      emitido_por: auth.via,
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
