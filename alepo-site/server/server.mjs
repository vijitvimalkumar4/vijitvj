// Alepo.com web server: serves alepo-site/public and receives the site's forms.
// No dependencies (Node 18+).  Run:  node alepo-site/server/server.mjs
//
// Environment:
//   PORT              port to listen on (default 8080)
//   LEADS_DIR         where submissions are stored (default alepo-site/data)
//   ADMIN_TOKEN       required to download leads at /api/leads.csv (no token set = download disabled)
//   LEAD_WEBHOOK_URL  optional: each new lead is POSTed here as {"text": "..."}
//                     (works with a Microsoft Teams or Slack incoming webhook)
//   TRUST_PROXY=1     use X-Forwarded-For for the client IP when behind a load balancer
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.resolve(HERE, '..', 'public');
const LEADS_DIR = path.resolve(process.env.LEADS_DIR || path.join(HERE, '..', 'data'));
const LEADS_FILE = path.join(LEADS_DIR, 'leads.ndjson');
const PORT = Number(process.env.PORT || 8080);
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const WEBHOOK = process.env.LEAD_WEBHOOK_URL || '';
fs.mkdirSync(LEADS_DIR, { recursive: true });

// ---------- form rules ----------
const KINDS = {
  demo: { required: ['fullname', 'email', 'company'], label: 'Demo request' },
  datasheet: { required: ['email'], label: 'Data sheet request' },
  newsletter: { required: ['email'], label: 'Newsletter sign-up' },
};
const FIELDS = { fullname: 120, email: 254, company: 160, request: 40, requestLabel: 80, product: 80, message: 4000, lang: 5, page: 500, title: 200, consent: 400, thanks: 200, website: 200 };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const REQUESTS = new Set(['demo', 'sales', 'engineer', 'rfp', 'estimate', 'datasheet', 'partner', 'other', '']);

function clean(input) {
  const out = {};
  for (const [k, max] of Object.entries(FIELDS)) {
    const v = input[k];
    out[k] = typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max) : '';
  }
  return out;
}
function validate(kind, f) {
  const errors = {};
  for (const r of KINDS[kind].required) if (!f[r]) errors[r] = 'required';
  if (f.email && !EMAIL.test(f.email)) errors.email = 'invalid';
  if (!REQUESTS.has(f.request)) errors.request = 'invalid';
  return errors;
}

// ---------- abuse limits: 8 submissions per IP per 10 minutes ----------
const hits = new Map();
function limited(ip) {
  const now = Date.now(), win = 10 * 60 * 1000;
  const list = (hits.get(ip) || []).filter(t => now - t < win);
  list.push(now); hits.set(ip, list);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some(t => now - t < win)) hits.delete(k);
  return list.length > 8;
}
const clientIp = req => (process.env.TRUST_PROXY && req.headers['x-forwarded-for'] ? String(req.headers['x-forwarded-for']).split(',')[0].trim() : req.socket.remoteAddress) || '';

// ---------- storage + notification ----------
function store(kind, f, req) {
  const lead = {
    id: crypto.randomUUID(), receivedAt: new Date().toISOString(), form: kind,
    fullname: f.fullname, email: f.email, company: f.company, request: f.request, requestLabel: f.requestLabel,
    product: f.product, message: f.message, lang: f.lang, page: f.page, consentText: f.consent,
    userAgent: String(req.headers['user-agent'] || '').slice(0, 300),
  };
  fs.appendFileSync(LEADS_FILE, JSON.stringify(lead) + '\n', { mode: 0o600 });
  return lead;
}
function notify(lead) {
  if (!WEBHOOK) return;
  const lines = [`New ${KINDS[lead.form].label} from alepo.com`, `${lead.fullname || '(no name)'} <${lead.email}>${lead.company ? ', ' + lead.company : ''}`];
  if (lead.requestLabel) lines.push(`Request: ${lead.requestLabel}`);
  if (lead.product) lines.push(`Product: ${lead.product}`);
  if (lead.message) lines.push('', lead.message.slice(0, 1000));
  lines.push('', `Page: ${lead.page}`);
  fetch(WEBHOOK, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: lines.join('\n') }) })
    .catch(err => console.error('webhook failed:', err.message));
}
function csv() {
  const cols = ['receivedAt', 'form', 'fullname', 'email', 'company', 'requestLabel', 'product', 'message', 'lang', 'page', 'consentText', 'id'];
  // values starting with = + - @ are prefixed with ' so spreadsheets never run them as formulas
  const esc = v => { let s = String(v ?? ''); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const rows = fs.existsSync(LEADS_FILE) ? fs.readFileSync(LEADS_FILE, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)) : [];
  return '﻿' + [cols.join(','), ...rows.reverse().map(r => cols.map(c => esc(r[c])).join(','))].join('\r\n') + '\r\n';
}

// ---------- request body ----------
function readBody(req, limit = 32 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => {
      size += c.length;
      if (size > limit) { req.removeAllListeners('data'); req.resume(); reject(Object.assign(new Error('too large'), { status: 413 })); }
      else chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}
function parse(req, raw) {
  const type = String(req.headers['content-type'] || '');
  if (type.includes('application/json')) return JSON.parse(raw || '{}');
  if (type.includes('application/x-www-form-urlencoded')) return Object.fromEntries(new URLSearchParams(raw));
  throw Object.assign(new Error('unsupported content type'), { status: 415 });
}

// ---------- static files ----------
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.csv': 'text/csv; charset=utf-8' };
const redirects = new Map();
try {
  for (const line of fs.readFileSync(path.join(PUBLIC, '_redirects'), 'utf8').split('\n')) {
    const [from, to, code] = line.trim().split(/\s+/);
    if (from && to && code === '301' && !from.includes('*')) redirects.set(from, to);
  }
} catch {}
const SECURITY = { 'x-content-type-options': 'nosniff', 'referrer-policy': 'strict-origin-when-cross-origin', 'x-frame-options': 'SAMEORIGIN', 'permissions-policy': 'camera=(), microphone=(), geolocation=()' };

function sendFile(res, file, status = 200) {
  const ext = path.extname(file);
  const cache = /\/assets\//.test(file) ? 'public, max-age=604800' : 'no-cache';
  res.writeHead(status, { 'content-type': MIME[ext] || 'application/octet-stream', 'cache-control': cache, ...SECURITY });
  fs.createReadStream(file).pipe(res);
}
function serveStatic(req, res, pathname) {
  if (redirects.has(pathname)) { res.writeHead(301, { location: redirects.get(pathname), ...SECURITY }); return res.end(); }
  let rel = decodeURIComponent(pathname);
  if (rel.includes('\0')) { res.writeHead(400); return res.end(); }
  let file = path.join(PUBLIC, rel);
  if (!file.startsWith(PUBLIC)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    if (!rel.endsWith('/')) { res.writeHead(301, { location: rel + '/', ...SECURITY }); return res.end(); }
    file = path.join(file, 'index.html');
  }
  if (fs.existsSync(file) && fs.statSync(file).isFile()) return sendFile(res, file);
  const nf = path.join(PUBLIC, rel.startsWith('/es/') ? 'es/404.html' : '404.html');
  return fs.existsSync(nf) ? sendFile(res, nf, 404) : (res.writeHead(404), res.end('Not found'));
}

// ---------- server ----------
const json = (res, status, body) => { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...SECURITY }); res.end(JSON.stringify(body)); };

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const m = url.pathname.match(/^\/api\/forms\/([a-z]+)\/?$/);
  try {
    if (m) {
      const kind = m[1];
      if (!KINDS[kind]) return json(res, 404, { ok: false, error: 'unknown form' });
      if (req.method !== 'POST') { res.writeHead(405, { allow: 'POST' }); return res.end(); }
      const host = req.headers.host;
      const origin = req.headers.origin;
      if (origin && host && new URL(origin).host !== host) return json(res, 403, { ok: false, error: 'cross-site request' });
      const isJson = String(req.headers['content-type'] || '').includes('application/json');
      const f = clean(parse(req, await readBody(req)));
      const back = (ok) => { // no-JavaScript fallback: answer with a page, not JSON
        const safe = p => (/^\/[a-z0-9\-/]*$/i.test(p) ? p : '/');
        const target = ok ? safe(f.thanks || (f.lang === 'es' ? '/es/contact-us/thank-you/' : '/contact-us/thank-you/')) : safe(new URL(f.page || '/', 'http://x').pathname) + '?form-error=1';
        res.writeHead(303, { location: target, ...SECURITY }); res.end();
      };
      if (f.website) return isJson ? json(res, 200, { ok: true }) : back(true); // spam trap: accept silently, store nothing
      if (limited(clientIp(req))) return isJson ? json(res, 429, { ok: false, error: 'too many requests' }) : back(false);
      const errors = validate(kind, f);
      if (Object.keys(errors).length) return isJson ? json(res, 422, { ok: false, errors }) : back(false);
      const lead = store(kind, f, req);
      notify(lead);
      console.log(`lead ${lead.id} ${kind} ${lead.email}`);
      return isJson ? json(res, 200, { ok: true, id: lead.id }) : back(true);
    }
    if (url.pathname === '/api/leads.csv') {
      const auth = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '') || url.searchParams.get('token') || '';
      const ok = ADMIN_TOKEN && auth.length === ADMIN_TOKEN.length && crypto.timingSafeEqual(Buffer.from(auth), Buffer.from(ADMIN_TOKEN));
      if (!ok) return json(res, ADMIN_TOKEN ? 401 : 404, { ok: false });
      res.writeHead(200, { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="alepo-leads-${new Date().toISOString().slice(0, 10)}.csv"`, 'cache-control': 'no-store', ...SECURITY });
      return res.end(csv());
    }
    if (url.pathname.startsWith('/api/')) return json(res, 404, { ok: false });
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { allow: 'GET, HEAD' }); return res.end(); }
    return serveStatic(req, res, url.pathname);
  } catch (err) {
    const status = err.status || (err instanceof SyntaxError ? 400 : 500);
    if (status === 500) console.error(err);
    if (status === 413) res.setHeader('connection', 'close');
    if (!res.headersSent) json(res, status, { ok: false, error: status === 500 ? 'server error' : err.message });
  }
});

server.listen(PORT, () => console.log(`Alepo site on http://localhost:${PORT}  (leads -> ${LEADS_FILE})`));
