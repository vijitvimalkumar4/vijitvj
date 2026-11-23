// Automatic data sheet emails for the "Get the data sheet" form.
// The PDF for each product lives at public/assets/datasheets/<lang>/<slug>.pdf
// (source: build/static/datasheets/<lang>/<slug>.pdf; English is used when the Spanish file is missing).
// The email carries a link to the PDF, not an attachment.
import fs from 'node:fs';
import path from 'node:path';
import { sendMail, mailConfigured } from './mailer.mjs';

const env = process.env;
const SITE_URL = (env.SITE_URL || 'https://alepo.com').replace(/\/$/, '');
// after the first try: 1 min, then 5 min (MAIL_RETRY_DELAYS=ms,ms overrides, for tests)
const RETRY_DELAYS = env.MAIL_RETRY_DELAYS ? env.MAIL_RETRY_DELAYS.split(',').map(Number) : [60_000, 5 * 60_000];
const DAY = 24 * 60 * 60 * 1000;
const PER_ADDRESS_PER_DAY = 5;

export function createDatasheets({ publicDir, here, logFile, alert }) {
  const products = JSON.parse(fs.readFileSync(path.join(here, 'products.json'), 'utf8'));
  const sentTo = new Map(); // email -> [{t, slug}]
  const log = entry => fs.appendFileSync(logFile, JSON.stringify({ at: new Date().toISOString(), ...entry }) + '\n', { mode: 0o600 });

  function sheet(slug, lang) {
    for (const l of [lang === 'es' ? 'es' : 'en', 'en']) {
      const file = path.join(publicDir, 'assets', 'datasheets', l, `${slug}.pdf`);
      if (fs.existsSync(file)) return { lang: l, url: `${SITE_URL}/assets/datasheets/${l}/${slug}.pdf` };
    }
    return null;
  }

  function recentlySent(email, slug) {
    const now = Date.now();
    const list = (sentTo.get(email) || []).filter(x => now - x.t < DAY);
    sentTo.set(email, list);
    return { same: list.some(x => x.slug === slug), count: list.length };
  }

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  function compose(lead, product, sh) {
    const es = lead.lang === 'es';
    const name = (lead.fullname || '').split(/\s+/)[0];
    const demo = `${SITE_URL}${es ? '/es' : ''}/contact-us/?product=${encodeURIComponent(lead.product)}#demo`;
    const canReply = !!env.MAIL_REPLY_TO;
    const t = es ? {
      subject: `Su ficha técnica de ${product.label}`,
      hello: name ? `Hola ${name}:` : 'Hola:',
      intro: `Aquí tiene la ficha técnica de ${product.label} que pidió en alepo.com:`,
      button: 'Descargar la ficha técnica (PDF)',
      fallback: 'La versión en español aún no está disponible, así que le enviamos la ficha en inglés.',
      next: canReply ? `Si quiere ver ${product.label} en un caso como el suyo, responda a este correo o solicite una demo:` : `Si quiere ver ${product.label} en un caso como el suyo, solicite una demo:`,
      demo: 'Solicitar una demo',
      why: 'Recibe este correo porque esta dirección pidió la ficha técnica en alepo.com.',
    } : {
      subject: `Your ${product.label} data sheet`,
      hello: name ? `Hello ${name},` : 'Hello,',
      intro: `Here is the ${product.label} data sheet you asked for on alepo.com:`,
      button: 'Download the data sheet (PDF)',
      fallback: '',
      next: canReply ? `To see ${product.label} on a case like yours, reply to this email or request a demo:` : `To see ${product.label} on a case like yours, request a demo:`,
      demo: 'Request a demo',
      why: 'You receive this email because this address asked for the data sheet on alepo.com.',
    };
    const fallback = es && sh.lang === 'en' ? t.fallback : '';
    const address = 'Alepo Technologies · 1606 Headway Circle, Suite #9137, Austin, TX 78754, USA';
    const text = [t.hello, '', t.intro, sh.url, ...(fallback ? ['', fallback] : []), '', t.next, demo, '', 'Alepo Technologies', address.replace('Alepo Technologies · ', ''), '', t.why].join('\n');
    const html = `<!doctype html><html lang="${es ? 'es' : 'en'}"><body style="margin:0;padding:24px;background:#f3f4f8;font-family:Arial,Helvetica,sans-serif;color:#20242d;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #dcdee8;border-radius:16px;">
<tr><td style="padding:32px;">
<p style="margin:0 0 16px;font-size:16px;line-height:1.6;">${esc(t.hello)}</p>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;">${esc(t.intro)}</p>
<p style="margin:0 0 24px;"><a href="${esc(sh.url)}" style="display:inline-block;padding:14px 24px;border-radius:12px;background:#2d1d8f;color:#ffffff;font-weight:bold;text-decoration:none;font-size:16px;">${esc(t.button)}</a></p>
${fallback ? `<p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#565b6b;">${esc(fallback)}</p>` : ''}
<p style="margin:0 0 8px;font-size:16px;line-height:1.6;">${esc(t.next)}</p>
<p style="margin:0 0 24px;"><a href="${esc(demo)}" style="color:#2d1d8f;font-weight:bold;font-size:16px;">${esc(t.demo)}</a></p>
<p style="margin:0;font-size:12px;line-height:1.6;color:#565b6b;">${esc(address)}<br>${esc(t.why)}</p>
</td></tr></table></td></tr></table></body></html>`;
    return { subject: t.subject, text, html };
  }

  async function deliver(lead, product, sh, attempt = 0) {
    try {
      const msg = compose(lead, product, sh);
      const r = await sendMail({ to: lead.email, ...msg });
      log({ leadId: lead.id, to: lead.email, product: lead.product, status: 'sent', attempt: attempt + 1, transport: r.transport, sheet: sh.url });
    } catch (err) {
      log({ leadId: lead.id, to: lead.email, product: lead.product, status: 'failed', attempt: attempt + 1, error: err.message });
      if (attempt < RETRY_DELAYS.length) setTimeout(() => deliver(lead, product, sh, attempt + 1), RETRY_DELAYS[attempt]).unref();
      else alert(`Data sheet email FAILED after ${attempt + 1} tries. Please send it by hand.\n${lead.email}: ${product.label}\n${sh.url}\nLast error: ${err.message}`);
    }
  }

  // Called for every stored datasheet lead. Returns 'email' when an automatic email is on its way,
  // otherwise 'manual' (the team is alerted to send it).
  function handle(lead) {
    const product = products[lead.product];
    const sh = product && sheet(lead.product, lead.lang);
    const email = lead.email.toLowerCase();
    let reason = null;
    if (!product) reason = `unknown product "${lead.product}"`;
    else if (!sh) reason = `no PDF yet at build/static/datasheets/en/${lead.product}.pdf`;
    else if (!mailConfigured()) reason = 'automatic email is not configured (MAIL_FROM and SMTP or Microsoft Graph settings)';
    if (!reason) {
      const r = recentlySent(email, lead.product);
      if (r.same) { log({ leadId: lead.id, to: email, product: lead.product, status: 'skipped-duplicate' }); return 'email'; }
      if (r.count >= PER_ADDRESS_PER_DAY) reason = `more than ${PER_ADDRESS_PER_DAY} data sheets to this address today; check before sending`;
    }
    if (reason) {
      log({ leadId: lead.id, to: email, product: lead.product, status: 'manual', reason });
      alert(`Data sheet to send by hand: ${product ? product.label : lead.product} to ${lead.email}\nReason: ${reason}`);
      return 'manual';
    }
    sentTo.get(email).push({ t: Date.now(), slug: lead.product });
    deliver(lead, product, sh);
    return 'email';
  }

  return { handle, products, sheet };
}
