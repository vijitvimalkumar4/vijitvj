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
//   FORCE_HTTPS=1     redirect http:// (per X-Forwarded-Proto) to https:// and send HSTS (set it in production)
//   LEGACY_ORIGIN     address of the existing WordPress site (for example https://legacy.alepo.com). Every address
//                     the new build does not answer and the redirect map does not move (blog posts, news items,
//                     library items, /credits/, /legal-agreements/, WordPress uploads and admin, ?p= links) is passed
//                     through to it, so every old alepo.com URL keeps working. Unset = those URLs show the 404 page.
//   LEADS_RETENTION_DAYS  delete leads older than this many days (default 730); checked at start and daily
//   LEADS_BACKUP_DAYS     keep this many daily backups in LEADS_DIR/backup (default 30)
//   Data sheet emails (see datasheets.mjs and mailer.mjs):
//   MAIL_FROM, MAIL_FROM_NAME, MAIL_REPLY_TO, SITE_URL, and either SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS
//   or MS_TENANT_ID/MS_CLIENT_ID/MS_CLIENT_SECRET (Microsoft 365 through Graph)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { createDatasheets } from './datasheets.mjs';
import { mailConfigured, transportName } from './mailer.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.resolve(HERE, '..', 'public');
const LEADS_DIR = path.resolve(process.env.LEADS_DIR || path.join(HERE, '..', 'data'));
const LEADS_FILE = path.join(LEADS_DIR, 'leads.ndjson');
const PORT = Number(process.env.PORT || 8080);
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const WEBHOOK = process.env.LEAD_WEBHOOK_URL || '';
fs.mkdirSync(LEADS_DIR, { recursive: true });
const postWebhook = text => { if (!WEBHOOK) return; fetch(WEBHOOK, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text }) }).catch(err => console.error('webhook failed:', err.message)); };
const datasheets = createDatasheets({ publicDir: PUBLIC, here: HERE, logFile: path.join(LEADS_DIR, 'mail.ndjson'), alert: text => { console.warn(text.split('\n')[0]); postWebhook(text); } });

// ---------- form rules ----------
const KINDS = {
  demo: { required: ['fullname', 'email', 'company'], label: 'Demo request' },
  datasheet: { required: ['email'], label: 'Data sheet request' },
  newsletter: { required: ['email'], label: 'Newsletter sign-up' },
};
const FIELDS = { fullname: 120, email: 254, company: 160, request: 40, requestLabel: 80, product: 80, operatorType: 80, message: 4000, lang: 5, page: 500, title: 200, consent: 400, thanks: 200, website: 200,
  docTitle: 200, docUrl: 500, utmSource: 120, utmMedium: 120, utmCampaign: 160, utmTerm: 160, utmContent: 160, referrer: 500, landing: 500 };
// personal mailboxes: accepted, but flagged so sales can triage
const FREE_MAIL = new Set(['gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.in', 'hotmail.com', 'outlook.com', 'live.com', 'msn.com', 'icloud.com', 'me.com', 'aol.com', 'proton.me', 'protonmail.com', 'gmx.com', 'gmx.de', 'mail.com', 'yandex.com', 'yandex.ru', 'zoho.com', 'rediffmail.com', 'qq.com', '163.com', 'web.de', 'hotmail.es', 'yahoo.es', 'outlook.es']);
// library PDFs a data sheet request may unlock (the same files alepo.com links publicly)
const DOC_HOSTS = new Set(['alepo.com', 'www.alepo.com', 'cdn.alepo.com']);
const docLink = u => { try { const x = new URL(u); return DOC_HOSTS.has(x.hostname) && /\.pdf$/i.test(x.pathname) && x.protocol === 'https:' ? x.href : ''; } catch { return ''; } };
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
    product: f.product || f.docTitle, operatorType: f.operatorType, message: f.message, lang: f.lang, page: f.page, consentText: f.consent,
    freeMail: FREE_MAIL.has(String(f.email).split('@')[1]?.toLowerCase() || ''),
    utmSource: f.utmSource, utmMedium: f.utmMedium, utmCampaign: f.utmCampaign, utmTerm: f.utmTerm, utmContent: f.utmContent,
    referrer: f.referrer, landing: f.landing, docUrl: docLink(f.docUrl),
    userAgent: String(req.headers['user-agent'] || '').slice(0, 300),
  };
  fs.appendFileSync(LEADS_FILE, JSON.stringify(lead) + '\n', { mode: 0o600 });
  return lead;
}
function notify(lead, delivery) {
  if (!WEBHOOK) return;
  const lines = [`New ${KINDS[lead.form].label} from alepo.com`, `${lead.fullname || '(no name)'} <${lead.email}>${lead.company ? ', ' + lead.company : ''}`];
  if (lead.requestLabel) lines.push(`Request: ${lead.requestLabel}`);
  if (lead.product) lines.push(`Product: ${lead.product}`);
  if (lead.operatorType) lines.push(`Operator type: ${lead.operatorType}`);
  if (lead.freeMail) lines.push('Note: personal email address');
  const src = [lead.utmSource, lead.utmMedium, lead.utmCampaign].filter(Boolean).join(' / ');
  if (src || lead.referrer) lines.push(`Source: ${src || lead.referrer}`);
  if (delivery === 'email') lines.push('Data sheet: emailed automatically');
  if (lead.message) lines.push('', lead.message.slice(0, 1000));
  lines.push('', `Page: ${lead.page}`);
  postWebhook(lines.join('\n'));
}
function csv() {
  const cols = ['receivedAt', 'form', 'fullname', 'email', 'freeMail', 'company', 'operatorType', 'requestLabel', 'product', 'message', 'lang', 'page', 'landing', 'referrer', 'utmSource', 'utmMedium', 'utmCampaign', 'utmTerm', 'utmContent', 'consentText', 'id'];
  // values starting with = + - @ are prefixed with ' so spreadsheets never run them as formulas
  const esc = v => { let s = String(v ?? ''); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const rows = readLeads();
  return '﻿' + [cols.join(','), ...rows.reverse().map(r => cols.map(c => esc(r[c])).join(','))].join('\r\n') + '\r\n';
}

// ---------- retention and backups (GDPR: keep leads only as long as needed) ----------
const RETENTION_DAYS = Number(process.env.LEADS_RETENTION_DAYS || 730);
const BACKUP_DAYS = Number(process.env.LEADS_BACKUP_DAYS || 30);
const BACKUP_DIR = path.join(LEADS_DIR, 'backup');
function readLeads() { return fs.existsSync(LEADS_FILE) ? fs.readFileSync(LEADS_FILE, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)) : []; }
function writeLeads(rows) { const tmp = LEADS_FILE + '.tmp'; fs.writeFileSync(tmp, rows.map(r => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : ''), { mode: 0o600 }); fs.renameSync(tmp, LEADS_FILE); }
function housekeeping() {
  try {
    const rows = readLeads(), cutoff = Date.now() - RETENTION_DAYS * 864e5;
    const kept = rows.filter(r => Date.parse(r.receivedAt) >= cutoff);
    if (kept.length !== rows.length) { writeLeads(kept); console.log(`retention: removed ${rows.length - kept.length} leads older than ${RETENTION_DAYS} days`); }
    if (fs.existsSync(LEADS_FILE)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true, mode: 0o700 });
      fs.copyFileSync(LEADS_FILE, path.join(BACKUP_DIR, `leads-${new Date().toISOString().slice(0, 10)}.ndjson`));
      fs.readdirSync(BACKUP_DIR).filter(n => /^leads-\d{4}-\d{2}-\d{2}\.ndjson$/.test(n)).sort().slice(0, -BACKUP_DAYS).forEach(n => fs.unlinkSync(path.join(BACKUP_DIR, n)));
    }
  } catch (err) { console.error('housekeeping', err.message); }
}
housekeeping();
setInterval(housekeeping, 864e5).unref();
// a person's leads can be erased on request: DELETE /api/leads?email=... with the admin token (backups age out within LEADS_BACKUP_DAYS)
function eraseLeads(email) { const rows = readLeads(); const kept = rows.filter(r => String(r.email).toLowerCase() !== email.toLowerCase()); writeLeads(kept); return rows.length - kept.length; }

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
const redirects = new Map(), prefixes = [];
try {
  for (const line of fs.readFileSync(path.join(PUBLIC, '_redirects'), 'utf8').split('\n')) {
    const [from, to, code] = line.trim().split(/\s+/);
    if (from && to && code === '301' && !from.includes('*')) redirects.set(from, to);
    else if (from && to && code === '301' && from.endsWith('/*')) prefixes.push([from.slice(0, -1), to]);
  }
} catch {}
function prefixRedirect(p) { const hit = prefixes.find(([pre]) => p.startsWith(pre) && p !== pre); return hit ? hit[1] : ''; }
// Content-Security-Policy: everything comes from this site; inline styles are needed by the design's markup
const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'self'; base-uri 'self'; object-src 'none'";
const SECURITY = { 'x-content-type-options': 'nosniff', 'referrer-policy': 'strict-origin-when-cross-origin', 'x-frame-options': 'SAMEORIGIN', 'permissions-policy': 'camera=(), microphone=(), geolocation=()', 'content-security-policy': CSP };
// checklist 58: FORCE_HTTPS=1 behind a TLS-terminating proxy sends http:// visitors to https:// and turns on HSTS
const FORCE_HTTPS = process.env.FORCE_HTTPS === '1';
if (FORCE_HTTPS) { SECURITY['strict-transport-security'] = 'max-age=31536000; includeSubDomains'; SECURITY['content-security-policy'] += '; upgrade-insecure-requests'; }

// text files are sent compressed (Brotli or gzip); compressed copies are kept in memory per file version
const COMPRESSIBLE = new Set(['.html', '.css', '.js', '.json', '.svg', '.xml', '.txt', '.csv']);
const packed = new Map();
function compressed(file, enc) {
  const st = fs.statSync(file), key = `${file}|${enc}`, hit = packed.get(key);
  if (hit && hit.mtime === st.mtimeMs) return hit.buf;
  const raw = fs.readFileSync(file);
  const buf = enc === 'br' ? zlib.brotliCompressSync(raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 9 } }) : zlib.gzipSync(raw, { level: 9 });
  if (packed.size > 500) packed.clear();
  packed.set(key, { mtime: st.mtimeMs, buf });
  return buf;
}
function sendFile(req, res, file, status = 200) {
  const ext = path.extname(file);
  // file names with a content hash (site-polish.3f9c2a1b.css) never change: cache them for a year
  const cache = /\.[0-9a-f]{8}\.(css|js)$/.test(file) ? 'public, max-age=31536000, immutable' : /\/assets\//.test(file) ? 'public, max-age=604800' : 'no-cache';
  const headers = { 'content-type': MIME[ext] || 'application/octet-stream', 'cache-control': cache, ...SECURITY };
  if (COMPRESSIBLE.has(ext)) {
    headers.vary = 'Accept-Encoding';
    const accept = String(req.headers['accept-encoding'] || '');
    const enc = /\bbr\b/.test(accept) ? 'br' : /\bgzip\b/.test(accept) ? 'gzip' : '';
    if (enc) { const buf = compressed(file, enc); res.writeHead(status, { ...headers, 'content-encoding': enc, 'content-length': buf.length }); return res.end(req.method === 'HEAD' ? undefined : buf); }
  }
  res.writeHead(status, headers);
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(file).pipe(res);
}

// ---------- the existing WordPress site behind this one (see LEGACY_ORIGIN) ----------
const LEGACY_ORIGIN = (process.env.LEGACY_ORIGIN || '').replace(/\/$/, '');
async function proxyLegacy(req, res, url) {
  const up = await fetch(LEGACY_ORIGIN + url.pathname + url.search, { method: req.method, redirect: 'manual', headers: { accept: String(req.headers.accept || '*/*'), 'user-agent': String(req.headers['user-agent'] || 'alepo-site'), 'accept-language': String(req.headers['accept-language'] || '') } });
  const headers = { ...SECURITY, 'content-type': up.headers.get('content-type') || 'application/octet-stream', 'cache-control': up.headers.get('cache-control') || 'public, max-age=600' };
  delete headers['content-security-policy']; // WordPress pages load their own scripts and styles
  const loc = up.headers.get('location'); if (loc) headers.location = loc.replace(LEGACY_ORIGIN, '');
  res.writeHead(up.status, headers);
  if (req.method === 'HEAD' || !up.body) return res.end();
  res.end(Buffer.from(await up.arrayBuffer()));
}
function serveStatic(req, res, pathname) {
  // exact rule first; the same address with or without its trailing slash only when no page exists there
  const exists = q => { try { const f = path.join(PUBLIC, decodeURIComponent(q)); return f.startsWith(PUBLIC) && fs.existsSync(f); } catch { return false; } };
  let to = redirects.get(pathname);
  if (!to && !exists(pathname)) to = redirects.get(pathname.endsWith('/') ? pathname.slice(0, -1) : pathname + '/') || prefixRedirect(pathname);
  if (to && to !== pathname) { res.writeHead(301, { location: to, ...SECURITY }); return res.end(); }
  let rel = decodeURIComponent(pathname);
  if (rel.includes('\0')) { res.writeHead(400); return res.end(); }
  let file = path.join(PUBLIC, rel);
  if (!file.startsWith(PUBLIC)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    if (!rel.endsWith('/')) { res.writeHead(301, { location: rel + '/', ...SECURITY }); return res.end(); }
    file = path.join(file, 'index.html');
  }
  if (fs.existsSync(file) && fs.statSync(file).isFile()) return sendFile(req, res, file);
  // the team package's host rule: anything the new build does not answer goes to WordPress as today
  if (LEGACY_ORIGIN && !/^\/(assets|api)\//.test(pathname)) return proxyLegacy(req, res, new URL(req.url, 'http://x'));
  const nf = path.join(PUBLIC, rel.startsWith('/es/') ? 'es/404.html' : '404.html');
  return fs.existsSync(nf) ? sendFile(req, res, nf, 404) : (res.writeHead(404), res.end('Not found'));
}

// ---------- server ----------
const json = (res, status, body) => { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...SECURITY }); res.end(JSON.stringify(body)); };

const server = http.createServer(async (req, res) => {
  if (FORCE_HTTPS && String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'http') {
    res.writeHead(301, { location: `https://${req.headers.host}${req.url}` }); return res.end();
  }
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
      const delivery = kind === 'datasheet' && !lead.docUrl ? datasheets.handle(lead) : undefined;
      notify(lead, delivery);
      console.log(`lead ${lead.id} ${kind} ${lead.email}`);
      return isJson ? json(res, 200, { ok: true, id: lead.id, ...(delivery ? { delivery } : {}), ...(lead.docUrl ? { download: lead.docUrl } : {}) }) : back(true);
    }
    if (url.pathname === '/api/leads' && req.method === 'DELETE') {
      const auth = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
      const ok = ADMIN_TOKEN && auth.length === ADMIN_TOKEN.length && crypto.timingSafeEqual(Buffer.from(auth), Buffer.from(ADMIN_TOKEN));
      if (!ok) return json(res, ADMIN_TOKEN ? 401 : 404, { ok: false });
      const email = url.searchParams.get('email') || '';
      if (!EMAIL.test(email)) return json(res, 422, { ok: false, error: 'email required' });
      return json(res, 200, { ok: true, removed: eraseLeads(email) });
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
    // WordPress links on the home address (?p=123, ?page_id=, ?s=search, previews) stay on WordPress
    if (LEGACY_ORIGIN && url.pathname === '/' && /(^|&)(p|page_id|s|preview|cat|tag|author|feed)=/.test(url.search.slice(1))) return proxyLegacy(req, res, url);
    return serveStatic(req, res, url.pathname);
  } catch (err) {
    const status = err.status || (err instanceof SyntaxError ? 400 : 500);
    if (status === 500) console.error(err);
    if (status === 413) res.setHeader('connection', 'close');
    if (!res.headersSent) json(res, status, { ok: false, error: status === 500 ? 'server error' : err.message });
  }
});

server.listen(PORT, () => {
  console.log(`Alepo site on http://localhost:${PORT}  (leads -> ${LEADS_FILE})`);
  const missing = Object.keys(datasheets.products).filter(slug => !datasheets.sheet(slug, 'en'));
  console.log(mailConfigured() ? `Data sheet emails: on (${transportName()}, from ${process.env.MAIL_FROM})` : 'Data sheet emails: off (set MAIL_FROM plus SMTP_* or MS_* variables); the team is alerted instead');
  if (missing.length) console.log(`Data sheet PDFs missing for ${missing.length} of ${Object.keys(datasheets.products).length} products: ${missing.join(', ')}`);
});
