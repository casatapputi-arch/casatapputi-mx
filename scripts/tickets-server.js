const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3001;
const DB_PATH = path.join(__dirname, 'tickets.json');
const TOKEN_BYTES = 16;

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
