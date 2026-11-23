// Fixes from "Alepo.com redesign: UX and lead-generation audit" (findings 1-20).
// Runs in the browser at the end of transform.js, after links are final and the head is written.
// window.__alepoLead(cfg, doc) mutates the document in place.
window.__alepoLead = function (cfg, doc) {
  const ES = cfg.lang === 'es';
  const T = (en, es) => (ES ? es : en);
  const pre = ES ? '/es' : '';
  const sc = cfg.siteConfig;
  const BRAND = 'rgb(45, 29, 143)', INK = 'rgb(32, 36, 45)', MUTED = 'rgb(86, 91, 107)', RULE = 'rgb(220, 222, 232)';
  const textOf = e => (e ? e.textContent.replace(/\s+/g, ' ').trim() : '');
  const el = (tag, style, text) => { const e = doc.createElement(tag); if (style) e.setAttribute('style', style); if (text != null) e.textContent = text; return e; };
  const contact = pre + '/contact-us/';
  const main = doc.querySelector('main');
  const isProduct = /^\/products\/[^/]+\/$/.test(cfg.self.replace(/^\/es/, '')) && cfg.file && cfg.file.startsWith('p-');
  const slug = isProduct ? cfg.self.replace(/\/$/, '').split('/').pop() : null;

  // ---------- head: stylesheet + runtime script ----------
  const css = el('link'); css.setAttribute('rel', 'stylesheet'); css.setAttribute('href', '/assets/css/site-fixes.css');
  doc.head.appendChild(css);
  const js = el('script'); js.setAttribute('src', '/assets/js/site.js'); js.setAttribute('defer', '');
  doc.head.appendChild(js);

  // ---------- 4. top bar: expire past events ----------
  const top = doc.querySelector('.util a');
  if (top && sc.topbar) {
    top.setAttribute('data-ends', sc.topbar.ends);
    top.setAttribute('data-fallback', ES ? sc.topbar.fallback.es : sc.topbar.fallback.en);
    top.setAttribute('data-fallback-href', pre + sc.topbar.href);
    if (cfg.today > sc.topbar.ends) {
      [...top.childNodes].filter(n => n.nodeType === 3).forEach(n => n.remove());
      top.appendChild(doc.createTextNode(ES ? sc.topbar.fallback.es : sc.topbar.fallback.en));
      top.setAttribute('href', pre + sc.topbar.href);
    }
  }

  // ---------- 5. remove the search button that does nothing ----------
  doc.querySelectorAll('button[aria-label="Search"], button[aria-label="Buscar"]').forEach(b => b.remove());

  // ---------- 6 + 18. Products menu: label + brand only (descriptors stay on the Products hub) ----------
  const prodMenu = [...doc.querySelectorAll('.mm')].find(m => /^(Products|Productos)$/.test(textOf(m.querySelector('.mb'))));
  if (prodMenu) prodMenu.querySelectorAll('a.mt').forEach(a => {
    const spans = [...a.querySelectorAll(':scope > span:last-child > span')];
    spans.slice(1).forEach(s => { if (!s.hasAttribute('data-brand')) s.remove(); });
  });
  doc.querySelectorAll('.mm > .mb').forEach(b => b.setAttribute('aria-expanded', 'false'));

  // ---------- 20. language switch as plain links ----------
  const alt = cfg.alt || { en: '/', es: '/es/' };
  doc.querySelectorAll('button[aria-label="English"], button[aria-label="Español"]').forEach(b => {
    const toEs = b.getAttribute('aria-label') === 'Español';
    const a = el('a', b.getAttribute('style'), textOf(b));
    a.setAttribute('href', toEs ? alt.es : alt.en);
    a.setAttribute('hreflang', toEs ? 'es' : 'en');
    a.setAttribute('lang', toEs ? 'es' : 'en');
    a.setAttribute('aria-label', b.getAttribute('aria-label'));
    a.style.display = 'inline-flex'; a.style.alignItems = 'center'; a.style.justifyContent = 'center';
    if (toEs === ES) a.setAttribute('aria-current', 'true');
    b.replaceWith(a);
  });

  // ---------- 2. every demo button lands on the form, with the product ----------
  doc.querySelectorAll('a[href]').forEach(a => {
    const h = a.getAttribute('href');
    if (h !== contact) return;
    const t = textOf(a);
    if (/^(Request a demo|Solicitar una demo)$/.test(t)) a.setAttribute('href', contact + (slug ? `?product=${slug}` : '') + '#demo');
    else if (/^(Contact sales|Contactar a ventas|Hablar con ventas)$/.test(t)) a.setAttribute('href', contact + '?request=sales#demo');
  });

  // ---------- 10. phone numbers become tappable ----------
  const phoneRe = /\+\d{1,3}[\d \-]{7,14}\d/g;
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const hits = [];
  const phoneTest = /\+\d{1,3}[\d \-]{7,14}\d/;
  let n; while ((n = walker.nextNode())) if (phoneTest.test(n.nodeValue) && !n.parentElement.closest('a, script, style, textarea, option')) hits.push(n);
  hits.forEach(node => {
    const frag = doc.createDocumentFragment(); let last = 0; const s = node.nodeValue;
    s.replace(phoneRe, (m, i) => {
      frag.appendChild(doc.createTextNode(s.slice(last, i)));
      const a = el('a', 'color: inherit; text-decoration: underline; text-underline-offset: 3px;', m);
      a.setAttribute('href', 'tel:' + m.replace(/[^\d+]/g, ''));
      frag.appendChild(a); last = i + m.length; return m;
    });
    frag.appendChild(doc.createTextNode(s.slice(last)));
    node.replaceWith(frag);
  });

  // ---------- 1 + 12. forms: real submit, validation, autofill, consent ----------
  const consentText = T("By sending this form you agree that Alepo may contact you about your request, as described in Alepo's privacy policy.",
    'Al enviar este formulario acepta que Alepo le contacte sobre su solicitud, según la política de privacidad de Alepo.');
  function consentLine(color) {
    const p = el('p', `margin: 0; font-size: 13px; line-height: 1.5; color: ${color || MUTED};`);
    p.setAttribute('data-consent', '');
    if (sc.privacyUrl) {
      const [before] = consentText.split(T('privacy policy', 'política de privacidad'));
      p.appendChild(doc.createTextNode(before));
      const a = el('a', 'text-decoration: underline;', T('privacy policy', 'política de privacidad')); a.setAttribute('href', sc.privacyUrl);
      p.appendChild(a); p.appendChild(doc.createTextNode('.'));
    } else p.textContent = consentText;
    return p;
  }
  function wire(form, kind, opts) {
    const endpoint = `${sc.forms.endpoint}/${kind}`;
    form.setAttribute('data-form', kind);
    form.setAttribute('method', 'post');
    form.setAttribute('action', endpoint); // works without JavaScript too (server answers with a redirect)
    form.setAttribute('novalidate', '');
    form.setAttribute('data-endpoint', endpoint);
    // spam trap: people never see or fill it; bots usually do
    const trap = el('input', 'position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0;');
    trap.type = 'text'; trap.name = 'website'; trap.tabIndex = -1; trap.setAttribute('autocomplete', 'off'); trap.setAttribute('aria-hidden', 'true');
    form.appendChild(trap);
    const lang = el('input'); lang.type = 'hidden'; lang.name = 'lang'; lang.value = cfg.lang; form.appendChild(lang);
    if (opts.thanks) { const t = el('input'); t.type = 'hidden'; t.name = 'thanks'; t.value = opts.thanks; form.appendChild(t); }
    if (opts.thanks) form.setAttribute('data-thanks', opts.thanks);
    form.setAttribute('data-msg-required', T('Please fill in this field.', 'Complete este campo.'));
    form.setAttribute('data-msg-email', T('Enter a work email, for example name@operator.com.', 'Escriba un correo de trabajo, por ejemplo nombre@operador.com.'));
    form.setAttribute('data-msg-error', T('We could not send this. Please try again in a moment.', 'No pudimos enviarlo. Inténtelo de nuevo en un momento.'));
    form.setAttribute('data-msg-sending', T('Sending…', 'Enviando…'));
    if (opts.success) form.setAttribute('data-msg-success', opts.success);
    form.setAttribute('data-consent-text', consentText);
    const btn = form.querySelector('button');
    if (btn) btn.setAttribute('type', 'submit');
    const status = el('p', 'margin: 0; font-size: 14px; font-weight: 600; min-height: 0;');
    status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); status.setAttribute('data-status', '');
    (opts.statusAfter || btn || form.lastChild).after(status);
  }
  // contact form
  const contactForm = main && [...main.querySelectorAll('form')].find(f => f.querySelector('textarea'));
  if (contactForm) {
    const set = (sel, name, ac, req) => { const i = contactForm.querySelector(sel); if (!i) return; i.setAttribute('name', name); if (ac) i.setAttribute('autocomplete', ac); if (req) { i.required = true; i.setAttribute('aria-required', 'true'); } };
    set('#h-name', 'fullname', 'name', true);
    set('#h-email', 'email', 'email', true);
    set('#h-co', 'company', 'organization', true);
    set('#h-why', 'request', null, false);
    set('#h-msg', 'message', null, false);
    const sel = contactForm.querySelector('#h-why');
    if (sel) {
      const vals = ['demo', 'sales', 'partner', 'other'];
      [...sel.options].forEach((o, i) => o.value = vals[i] || 'other');
      const extra = [['engineer', T('Talk to an engineer', 'Hablar con un ingeniero')], ['rfp', T('Submit an RFP', 'Enviar una RFP')], ['estimate', T('Get a pricing estimate', 'Pedir una estimación de precio')], ['datasheet', T('Get a data sheet', 'Recibir una ficha técnica')]];
      const other = sel.querySelector('option[value="other"]');
      extra.forEach(([v, t]) => { const o = el('option', null, t); o.value = v; sel.insertBefore(o, other); });
    }
    const hidden = el('input'); hidden.type = 'hidden'; hidden.name = 'product'; hidden.value = '';
    contactForm.appendChild(hidden);
    const h2 = contactForm.querySelector('h2');
    // 19. say what happens next
    if (h2) h2.after(el('p', `margin: -6px 0 0; font-size: 15px; line-height: 1.5; color: ${MUTED};`,
      T('What happens next: a specialist reads your request and contacts you to agree a time.', 'Qué sigue: un especialista lee su solicitud y le contacta para acordar un horario.')));
    const btn = contactForm.querySelector('button');
    btn.before(consentLine());
    wire(contactForm, 'demo', { thanks: pre + '/contact-us/thank-you/' });
    // 2. move the form into the hero, in place of the photo
    const hero = main.querySelector(':scope > section');
    const card = contactForm.parentElement;
    const heroCols = hero.querySelector(':scope > div').children;
    const imgCol = [...heroCols].find(c => c.querySelector('img'));
    const textCol = [...heroCols].find(c => c.querySelector('h1'));
    if (imgCol && card) {
      card.id = 'demo'; card.style.scrollMarginTop = '96px'; card.style.width = '100%';
      card.classList.remove('hv');
      imgCol.replaceWith(card);
      card.style.flex = '1 1 460px';
      textCol.querySelectorAll('a[href*="#demo"]').forEach(a => { const wrap = a.parentElement; a.remove(); if (wrap && !wrap.children.length) wrap.remove(); });
      hero.querySelector(':scope > div').style.alignItems = 'flex-start';
      // the message box must not stretch inside the column form
      const ta = contactForm.querySelector('textarea'); if (ta) ta.parentElement.style.flex = '0 0 auto';
      // fill the hero's left column with the support numbers (moved from the section below)
      const sh = [...main.querySelectorAll('h2')].find(h => /^(Customer support|Soporte al cliente)$/.test(textOf(h)));
      if (sh) {
        const head = sh.parentElement, rows = [head.nextElementSibling, head.nextElementSibling && head.nextElementSibling.nextElementSibling].filter(Boolean);
        const box = el('div', 'width: 100%; max-width: 34em; display: flex; flex-direction: column; margin-top: 16px;');
        box.append(head, ...rows);
        textCol.appendChild(box);
      }
    }
  }
  // newsletter (footer)
  doc.querySelectorAll('footer form').forEach(f => {
    const i = f.querySelector('input[type="email"]');
    if (i) { i.setAttribute('name', 'email'); i.setAttribute('autocomplete', 'email'); i.required = true; i.setAttribute('aria-required', 'true'); }
    const c = consentLine('rgb(201, 196, 232)'); c.style.fontSize = '12px';
    const row = i && i.parentElement; if (row) row.after(c);
    wire(f, 'newsletter', { success: T('Thanks. You are subscribed.', 'Gracias. Ya está suscrito.'), statusAfter: c });
    const st = f.querySelector('[data-status]'); if (st) st.style.color = 'rgb(255, 255, 255)';
  });

  // ---------- 3 + 9. product pages: pricing explainer + data sheet offer ----------
  if (isProduct && main) {
    const label = cfg.productLabel;
    const sec = el('section', 'padding: 88px 0px; background: rgb(243, 244, 248); color: inherit;');
    sec.id = 'pricing';
    const wrap = el('div', 'max-width: 1280px; margin: 0px auto; padding-left: 32px; padding-right: 32px; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(420px, 100%), 1fr)); gap: 24px;');
    const card = () => el('div', `background: rgb(255, 255, 255); border: 1px solid ${RULE}; border-radius: 24px; padding: 32px; display: flex; flex-direction: column; gap: 16px; min-width: 0px;`);
    const h2s = 'margin: 0px; font-family: "Plus Jakarta Sans", Arial, sans-serif; font-size: 28px; line-height: 1.15; font-weight: 700; letter-spacing: -0.025em; color: rgb(32, 36, 45);';
    const ps = `margin: 0px; font-size: 17px; line-height: 1.6; color: ${INK};`;
    const btnS = `display: inline-flex; align-items: center; justify-content: center; gap: 10px; min-height: 48px; padding: 0px 24px; border-radius: 12px; font-weight: 600; font-size: 16px; white-space: nowrap; background: ${BRAND}; color: rgb(255, 255, 255); border: 0px; cursor: pointer; font-family: inherit;`;
    // pricing
    const pc = card();
    pc.appendChild(el('h2', h2s, T('How pricing works', 'Cómo se fija el precio')));
    pc.appendChild(el('p', ps, T('Every Alepo product is sold by subscription, whether it runs in the cloud or on premises.', 'Todos los productos de Alepo se venden por suscripción, ya sea en la nube o en sus instalaciones.')));
    const ul = el('ul', `margin: 0px; padding: 0px 0px 0px 20px; display: flex; flex-direction: column; gap: 8px; font-size: 16px; line-height: 1.5; color: ${MUTED};`);
    [T('The price depends on the products you take, your subscriber numbers and how it is deployed.', 'El precio depende de los productos que tome, su número de suscriptores y el modelo de despliegue.'),
     T('Managed and self-managed SaaS both include customer success.', 'El SaaS administrado y el autoadministrado incluyen éxito del cliente.'),
     T('Every offering is backed by 24x7 technical support from GTAC.', 'Cada oferta incluye soporte técnico 24x7 de GTAC.')].forEach(t => ul.appendChild(el('li', null, t)));
    pc.appendChild(ul);
    const est = el('a', btnS + ' align-self: flex-start;', T('Get an estimate', 'Pedir una estimación'));
    est.setAttribute('href', `${contact}?product=${slug}&request=estimate#demo`);
    pc.appendChild(est);
    // data sheet
    const dc = card(); dc.id = 'datasheet'; dc.style.scrollMarginTop = '136px';
    const f = el('form', 'display: flex; flex-direction: column; gap: 16px;');
    f.appendChild(el('h2', h2s, T('Get the data sheet', 'Reciba la ficha técnica')));
    f.appendChild(el('p', ps, T(`We email you the ${label} data sheet. Only a work email is needed.`, `Le enviamos por correo la ficha técnica de ${label}. Solo necesitamos un correo de trabajo.`)));
    const lab = el('label', 'font-size: 14px; font-weight: 600;', T('Work email', 'Correo de trabajo')); lab.setAttribute('for', 'ds-email');
    const inp = el('input', 'width: 100%; min-height: 48px; padding: 10px 14px; border: 1.5px solid rgb(169, 165, 196); border-radius: 12px; font: inherit; font-size: 16px; background: rgb(255, 255, 255); color: inherit;');
    inp.id = 'ds-email'; inp.type = 'email'; inp.name = 'email'; inp.required = true; inp.setAttribute('autocomplete', 'email'); inp.setAttribute('aria-required', 'true');
    const field = el('div', 'display: flex; flex-direction: column; gap: 6px;'); field.append(lab, inp);
    const hid = el('input'); hid.type = 'hidden'; hid.name = 'product'; hid.value = slug;
    const sb = el('button', btnS + ' align-self: flex-start;', T('Email me the data sheet', 'Enviarme la ficha técnica')); sb.type = 'submit';
    f.append(field, hid, consentLine(), sb);
    dc.appendChild(f);
    wire(f, 'datasheet', { success: T('Thanks. The data sheet is on its way to your inbox.', 'Gracias. La ficha técnica va camino a su bandeja de entrada.') });
    f.setAttribute('data-msg-success-manual', T('Thanks. Our team will email you the data sheet.', 'Gracias. Nuestro equipo le enviará la ficha técnica por correo.'));
    wrap.append(pc, dc); sec.appendChild(wrap);
    const lastCta = [...main.children].pop();
    main.insertBefore(sec, lastCta);
    // data sheet links in Resources pointed at the generic library: send them to the offer
    main.querySelectorAll('a[href="https://alepo.com/library/"]').forEach(a => { if (/data ?sheet|ficha/i.test(textOf(a))) a.setAttribute('href', '#datasheet'); });
    // page menu gets the new anchor
    const sub = doc.querySelector('.subnav > div');
    if (sub && sub.querySelector('a')) { const a = sub.querySelector('a').cloneNode(false); a.setAttribute('href', '#pricing'); a.textContent = T('Pricing', 'Precio'); sub.appendChild(a); }
    // 11. sticky demo bar on mobile
    const bar = el('div'); bar.className = 'mcta'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', T('Request a demo', 'Solicitar una demo'));
    const ba = el('a', null, T('Request a demo', 'Solicitar una demo')); ba.setAttribute('href', `${contact}?product=${slug}#demo`);
    bar.appendChild(ba); doc.body.appendChild(bar); doc.body.classList.add('has-mcta');
  }

  // ---------- 16. customer names: one static list (the loop copies are removed) ----------
  doc.querySelectorAll('.mq').forEach(mq => {
    mq.querySelectorAll(':scope > span[aria-hidden="true"]').forEach(s => s.remove());
    const seen = new Set();
    mq.querySelectorAll(':scope > span > span').forEach(s => { const t = textOf(s); if (seen.has(t)) s.remove(); else seen.add(t); });
  });

  // ---------- 17. accessibility defects ----------
  doc.querySelectorAll('main [role="img"]').forEach(e => { if (e.querySelector('a, button')) e.setAttribute('role', 'group'); });
  if (main) [...main.querySelectorAll('div')].forEach(d => {
    const s = getComputedStyle(d);
    if (/(auto|scroll)/.test(s.overflowX) && d.scrollWidth > d.clientWidth + 1 && !d.closest('.mqw')) {
      d.setAttribute('tabindex', '0'); d.setAttribute('role', 'region');
      const h = d.closest('[id]') && d.closest('[id]').querySelector('h2, h3');
      d.setAttribute('aria-label', h ? textOf(h) : T('Scrollable table', 'Tabla desplazable'));
    }
  });

  // ---------- 13. images: lazy below the fold, rendered width for srcset (images.py) ----------
  let first = true;
  doc.querySelectorAll('img').forEach(i => {
    if (i.closest('.mp')) return;
    const r = i.getBoundingClientRect();
    if (r.width) i.setAttribute('data-w', String(Math.round(r.width)));
    if (r.top + scrollY > 900 || i.closest('footer')) { i.setAttribute('loading', 'lazy'); i.setAttribute('decoding', 'async'); }
    else if (first && r.width > 300) { i.setAttribute('fetchpriority', 'high'); first = false; }
  });
};
