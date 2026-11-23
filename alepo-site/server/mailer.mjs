// Outgoing email with no dependencies. Two transports:
//   smtp   any SMTP server (Microsoft 365, Google Workspace, SendGrid, Amazon SES, Postmark...)
//          SMTP_HOST, SMTP_PORT (587 = STARTTLS, 465 = TLS), SMTP_USER, SMTP_PASS
//   graph  Microsoft 365 through Microsoft Graph (app registration with Mail.Send permission)
//          MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET; MAIL_FROM must be a mailbox in that tenant
// MAIL_TRANSPORT=smtp|graph picks one; otherwise it is detected from the variables that are set.
import net from 'node:net';
import tls from 'node:tls';
import os from 'node:os';
import crypto from 'node:crypto';

const env = process.env;
export function transportName() {
  if (env.MAIL_TRANSPORT) return env.MAIL_TRANSPORT;
  if (env.MS_TENANT_ID && env.MS_CLIENT_ID && env.MS_CLIENT_SECRET) return 'graph';
  if (env.SMTP_HOST) return 'smtp';
  return null;
}
export const mailConfigured = () => !!(transportName() && env.MAIL_FROM);

// message = { to, subject, text, html }
export async function sendMail(message) {
  const t = transportName();
  if (!t || !env.MAIL_FROM) throw new Error('email is not configured (MAIL_FROM and a transport)');
  return t === 'graph' ? sendGraph(message) : sendSmtp(message);
}

// ---------------- Microsoft Graph ----------------
let graphToken = null, tokenInFlight = null;
function token() {
  if (graphToken && graphToken.exp > Date.now() + 60_000) return Promise.resolve(graphToken.value);
  if (!tokenInFlight) tokenInFlight = fetchToken().finally(() => { tokenInFlight = null; });
  return tokenInFlight;
}
async function fetchToken() {
  const base = env.MS_LOGIN_URL || 'https://login.microsoftonline.com';
  const r = await fetch(`${base}/${encodeURIComponent(env.MS_TENANT_ID)}/oauth2/v2.0/token`, {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: env.MS_CLIENT_ID, client_secret: env.MS_CLIENT_SECRET, grant_type: 'client_credentials', scope: 'https://graph.microsoft.com/.default' }),
  });
  if (!r.ok) throw new Error(`Graph token ${r.status}`);
  const j = await r.json();
  graphToken = { value: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 };
  return graphToken.value;
}
async function sendGraph({ to, subject, text, html }) {
  const base = env.MS_GRAPH_URL || 'https://graph.microsoft.com';
  const r = await fetch(`${base}/v1.0/users/${encodeURIComponent(env.MAIL_FROM)}/sendMail`, {
    method: 'POST',
    headers: { authorization: `Bearer ${await token()}`, 'content-type': 'application/json' },
    body: JSON.stringify({ message: { subject, body: { contentType: html ? 'HTML' : 'Text', content: html || text }, toRecipients: [{ emailAddress: { address: to } }], ...(env.MAIL_REPLY_TO ? { replyTo: [{ emailAddress: { address: env.MAIL_REPLY_TO } }] } : {}) }, saveToSentItems: true }),
  });
  if (r.status !== 202) throw new Error(`Graph sendMail ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return { transport: 'graph' };
}

// ---------------- SMTP ----------------
const b64 = s => Buffer.from(s, 'utf8').toString('base64');
const wrap76 = s => s.replace(/.{1,76}/g, '$&\r\n');
const header = s => (/^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${b64(s)}?=`);
const addr = s => s.replace(/[\r\n<>]/g, '');

export function buildMime({ from, fromName, to, replyTo, subject, text, html }) {
  const boundary = 'alepo-' + crypto.randomBytes(12).toString('hex');
  const domain = (from.split('@')[1] || 'localhost').replace(/[^a-z0-9.-]/gi, '');
  const lines = [
    `From: ${fromName ? `${header(fromName)} ` : ''}<${addr(from)}>`,
    `To: <${addr(to)}>`,
    ...(replyTo ? [`Reply-To: <${addr(replyTo)}>`] : []),
    `Subject: ${header(subject)}`,
    `Date: ${new Date().toUTCString().replace('GMT', '+0000')}`,
    `Message-ID: <${crypto.randomUUID()}@${domain}>`,
    'MIME-Version: 1.0',
    'Auto-Submitted: auto-generated',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`, 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', wrap76(b64(text)).trimEnd(),
    ...(html ? [`--${boundary}`, 'Content-Type: text/html; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', wrap76(b64(html)).trimEnd()] : []),
    `--${boundary}--`, '',
  ];
  return lines.join('\r\n');
}

function smtpSession(socket) {
  let buf = '', waiting = null;
  const replies = [];
  const onData = d => {
    buf += d.toString('utf8');
    let m;
    while ((m = buf.match(/^(?:\d{3}-.*\r\n)*\d{3} .*\r\n/))) { replies.push(m[0]); buf = buf.slice(m[0].length); }
    if (waiting && replies.length) { const w = waiting; waiting = null; w.resolve(replies.shift()); }
  };
  socket.on('data', onData);
  socket.on('error', e => { if (waiting) { const w = waiting; waiting = null; w.reject(e); } });
  const read = () => new Promise((resolve, reject) => {
    if (replies.length) return resolve(replies.shift());
    waiting = { resolve, reject };
    setTimeout(() => { if (waiting) { waiting = null; reject(new Error('SMTP timeout')); } }, 30_000);
  });
  const cmd = async (line, expect) => {
    if (line != null) socket.write(line + '\r\n');
    const r = await read();
    const code = Number(r.slice(0, 3));
    if (expect && !expect.includes(code)) throw new Error(`SMTP ${line ? line.split(' ')[0] : 'greeting'} -> ${r.trim().split('\r\n').pop()}`);
    return r;
  };
  return { cmd, detach: () => socket.off('data', onData) };
}

async function sendSmtp({ to, subject, text, html }) {
  const host = env.SMTP_HOST, port = Number(env.SMTP_PORT || 587);
  const implicitTls = port === 465 || env.SMTP_SECURE === 'tls';
  const insecure = env.SMTP_ALLOW_INSECURE === '1'; // tests only: plain connection, no STARTTLS required
  const helo = env.SMTP_HELO || os.hostname();
  let socket = await new Promise((resolve, reject) => {
    const s = implicitTls ? tls.connect({ host, port, servername: host }, () => resolve(s)) : net.connect({ host, port }, () => resolve(s));
    s.once('error', reject);
    s.setTimeout(60_000, () => s.destroy(new Error('SMTP connection timeout')));
  });
  let sess = smtpSession(socket);
  try {
    await sess.cmd(null, [220]);
    let ehlo = await sess.cmd(`EHLO ${helo}`, [250]);
    if (!implicitTls && !insecure) {
      if (!/STARTTLS/i.test(ehlo)) throw new Error('SMTP server does not offer STARTTLS');
      await sess.cmd('STARTTLS', [220]);
      sess.detach();
      socket = await new Promise((resolve, reject) => { const s = tls.connect({ socket, servername: host }, () => resolve(s)); s.once('error', reject); });
      sess = smtpSession(socket);
      ehlo = await sess.cmd(`EHLO ${helo}`, [250]);
    }
    if (env.SMTP_USER) {
      if (/AUTH[ =][^\r\n]*PLAIN/i.test(ehlo)) await sess.cmd(`AUTH PLAIN ${b64(`\0${env.SMTP_USER}\0${env.SMTP_PASS || ''}`)}`, [235]);
      else { await sess.cmd('AUTH LOGIN', [334]); await sess.cmd(b64(env.SMTP_USER), [334]); await sess.cmd(b64(env.SMTP_PASS || ''), [235]); }
    }
    await sess.cmd(`MAIL FROM:<${addr(env.MAIL_FROM)}>`, [250]);
    await sess.cmd(`RCPT TO:<${addr(to)}>`, [250, 251]);
    await sess.cmd('DATA', [354]);
    const mime = buildMime({ from: env.MAIL_FROM, fromName: env.MAIL_FROM_NAME || 'Alepo', to, replyTo: env.MAIL_REPLY_TO, subject, text, html });
    const body = mime.replace(/\r\n\./g, '\r\n..'); // dot-stuffing
    await sess.cmd(body + '\r\n.', [250]);
    await sess.cmd('QUIT', [221]).catch(() => {});
    return { transport: 'smtp' };
  } finally {
    socket.end();
  }
}
