// Fixes from "Alepo.com redesign: UI audit" (main tab findings 1-11, design system) and its
// "Website checklist (67 rules)" tab. Runs in the browser after leadfixes.js; async.
window.__alepoUI = async function (cfg, doc) {
  const ES = cfg.lang === 'es';
  const T = (en, es) => (ES ? es : en);
  const pre = ES ? '/es' : '';
  const BRAND = 'rgb(45, 29, 143)', INK = 'rgb(32, 36, 45)', MUTED = 'rgb(86, 91, 107)';
  const main = doc.querySelector('main');
  const textOf = e => (e ? e.textContent.replace(/\s+/g, ' ').trim() : '');
  const el = (tag, style, text) => { const e = doc.createElement(tag); if (style) e.setAttribute('style', style); if (text != null) e.textContent = text; return e; };
  const isProduct = !!(cfg.file && cfg.file.startsWith('p-') && cfg.kind === 'page');
  const inDiagram = e => !!e.closest('[role="img"], .dia-d, .mq'); // diagrams are drawn to fixed sizes; leave them as designed

  // ---------- checklist 2: desktop navigation from 1001 px (was 1061) ----------
  doc.querySelectorAll('head style').forEach(s => { if (s.textContent.includes('max-width:1060px')) s.textContent = s.textContent.replace(/max-width:1060px/g, 'max-width:1000px'); });

  // ---------- UI 1: mark dark areas so the focus ring can switch colour ----------
  const lum = c => { const m = c.match(/\d+(\.\d+)?/g); if (!m) return 1; const [r, g, b] = m.map(Number); const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  doc.querySelectorAll('header .util, footer, main section, main div, .mcta').forEach(e => {
    const bg = getComputedStyle(e).backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && !/rgba\(.*, 0\)$/.test(bg) && lum(bg) < 0.12) e.classList.add('on-dark');
  });

  // ---------- UI 3: indigo is for links and buttons; static text goes to ink ----------
  if (main) main.querySelectorAll('[style*="color: rgb(45, 29, 143)"]').forEach(e => {
    if (e.closest('a, button, summary, label, [role="button"]') || e.querySelector('a, button')) return;
    if (!/(^|;)\s*color: rgb\(45, 29, 143\)/.test(e.getAttribute('style'))) return; // only text colour, not borders
    if (e.hasAttribute('data-brand')) { e.style.color = MUTED; return; }
    if (e.tagName === 'svg' || e.closest('svg') || e.querySelector('svg') && !textOf(e)) return; // icons keep the brand colour
    e.style.color = INK;
  });

  // ---------- UI 3 + checklist 29: Library chips become real filters ----------
  const chipRow = main && [...main.querySelectorAll('div')].find(d => d.children.length >= 3 && [...d.children].every(c => c.tagName === 'SPAN') && /^(All|Todos|Todo)$/.test(textOf(d.children[0])));
  if (chipRow) {
    const list = chipRow.nextElementSibling;
    const kindOf = t => (/data ?sheet|ficha/i.test(t) ? 'ds' : /case|caso/i.test(t) ? 'cs' : /white|documento|libro/i.test(t) ? 'wp' : 'other');
    chipRow.setAttribute('role', 'group'); chipRow.setAttribute('aria-label', T('Filter the library', 'Filtrar la biblioteca'));
    [...chipRow.children].forEach((s, i) => {
      const bt = el('button', s.getAttribute('style') + '; cursor: pointer; font: inherit; font-size: 16px; min-height: 44px;', textOf(s));
      bt.type = 'button'; bt.setAttribute('data-filter', i === 0 ? 'all' : kindOf(textOf(s)));
      bt.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
      s.replaceWith(bt);
    });
    if (list) {
      list.setAttribute('data-filter-list', '');
      [...list.querySelectorAll(':scope > a')].forEach(a => a.setAttribute('data-kind', kindOf(textOf(a.querySelector('span')))));
      const empty = el('p', `margin: 16px 0 0; font-size: 16px; color: ${MUTED};`, T('Nothing of this type yet. ', 'Todavía no hay nada de este tipo. '));
      empty.setAttribute('data-filter-empty', ''); empty.hidden = true;
      const all = el('button', `border: 0; background: none; padding: 0; font: inherit; color: ${BRAND}; text-decoration: underline; cursor: pointer;`, T('Show everything', 'Ver todo'));
      all.type = 'button'; all.setAttribute('data-filter', 'all'); empty.appendChild(all);
      list.after(empty);
    }
  }

  // ---------- UI 6 + checklist 57: event status from the date ----------
  const MONTHS = { january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12, enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12 };
  const endDate = t => { const m = t.toLowerCase().match(/(\d{1,2})(?:\s*(?:to|al|a|-|–)\s*(\d{1,2}))?\s+(?:de\s+)?([a-záé]+)(?:\s+de)?\s+(\d{4})/); if (!m || !MONTHS[m[3]]) return null; return `${m[4]}-${String(MONTHS[m[3]]).padStart(2, '0')}-${String(m[2] || m[1]).padStart(2, '0')}`; };
  if (main) main.querySelectorAll('span').forEach(s => {
    if (!/^(Upcoming|Próximo|Próximamente)$/.test(textOf(s)) || s.children.length) return;
    const card = s.closest('a, li, div.hv') || s.parentElement.parentElement;
    const end = endDate(textOf(card));
    if (!end) return;
    card.setAttribute('data-event-ends', end);
    const badge = s.parentElement.tagName === 'SPAN' && s.parentElement.children.length === 1 ? s.parentElement : s;
    badge.setAttribute('data-upcoming-badge', '');
    if (cfg.today > end) badge.remove();
  });

  // ---------- UI 5 + checklist 31: one primary per section (Get an estimate becomes secondary) ----------
  const est = doc.querySelector('#pricing a[href*="request=estimate"]');
  if (est) { est.style.background = 'transparent'; est.style.color = BRAND; est.style.boxShadow = `${BRAND} 0px 0px 0px 1.5px inset`; }

  // ---------- checklist 33: reassurance next to the hero CTA on product pages ----------
  if (isProduct && main) {
    const hero = main.querySelector(':scope > section');
    const cta = hero && [...hero.querySelectorAll('a')].find(a => /#demo$/.test(a.getAttribute('href') || ''));
    const bandP = [...main.querySelectorAll(':scope > section')].pop().querySelector('p');
    if (cta && bandP) cta.parentElement.after(el('p', `margin: -8px 0 0; font-size: 15px; line-height: 1.5; color: ${MUTED};`, textOf(bandP)));
  }

  // ---------- UI 2 + checklist 37/34: contact form single column, optional fields marked, trust next to it ----------
  const demo = doc.querySelector('form[data-form="demo"]');
  if (demo) {
    demo.querySelectorAll('input:not([type=hidden]), select, textarea').forEach(i => {
      const wrap = i.parentElement; if (wrap && wrap.style.flex) wrap.style.flex = '1 1 100%';
      if (!i.required && i.labels && i.labels[0] && i.name !== 'website') {
        const lab = i.labels[0]; if (!/optional|opcional/i.test(lab.textContent)) lab.appendChild(el('span', `font-weight: 400; color: ${MUTED};`, T(' (optional)', ' (opcional)')));
      }
    });
    // operators that run on Alepo, from the Home page's own list
    try {
      const home = new DOMParser().parseFromString(await (await fetch(ES ? '/es/index.html' : '/index.html')).text(), 'text/html');
      const mq = home.querySelector('.mq'); const label = mq && mq.closest('section').querySelector('span');
      const names = mq ? [...new Set([...mq.querySelectorAll(':scope > span:first-child > span')].map(textOf))] : [];
      const col = main.querySelector(':scope > section h1').parentElement;
      if (names.length && label) {
        const box = el('div', 'width: 100%; max-width: 34em; display: flex; flex-direction: column; gap: 8px; margin-top: 8px;');
        box.appendChild(el('div', `font-size: 13px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: ${MUTED};`, textOf(label)));
        box.appendChild(el('div', `font-size: 16px; font-weight: 600; line-height: 1.6; color: ${INK};`, names.join(' · ')));
        col.appendChild(box);
      }
    } catch (e) { /* the list is a nice-to-have */ }
  }
  // field borders (UI 2): 5.0:1 instead of 2.4:1
  doc.querySelectorAll('input, select, textarea').forEach(i => { if (/rgb\(169, 165, 196\)/.test(i.getAttribute('style') || '')) i.style.borderColor = 'rgb(112, 108, 140)'; });

  // ---------- checklist 9 + 55: footer carries the head-office address ----------
  const support = [...doc.querySelectorAll('footer form div')].find(d => /\+1 737|\+91/.test(d.textContent) && !d.querySelector('div'));
  if (support) support.after(el('div', 'font-size: 13px; line-height: 1.5; color: rgb(201, 196, 232);', T('Head office: 1606 Headway Circle, Suite #9137, Austin, TX 78754, USA', 'Sede central: 1606 Headway Circle, Suite #9137, Austin, TX 78754, EE. UU.')));

  // ---------- UI 7: footer columns collapse on phones; a separate toggle button keeps the heading link usable ----------
  const grid = doc.querySelector('footer > div > div:first-child');
  if (grid) [...grid.children].filter(c => c.tagName === 'DIV' && c.children.length === 2).forEach((c, i) => {
    const [head, links] = c.children;
    c.classList.add('fcol'); head.classList.add('fcol-h'); links.classList.add('fcol-list'); links.id = 'fcol-' + i;
    const t = el('button', null); t.type = 'button'; t.className = 'fcol-t';
    t.setAttribute('aria-expanded', 'true'); t.setAttribute('aria-controls', links.id);
    t.setAttribute('aria-label', T('Show or hide ', 'Mostrar u ocultar ') + textOf(head));
    head.appendChild(t);
  });

  // ---------- UI 10: mobile menu marks the current page ----------
  doc.querySelectorAll('.mnav a[href]').forEach(a => { if (a.getAttribute('href') === cfg.self) { a.setAttribute('aria-current', 'page'); a.style.fontWeight = '700'; a.style.color = BRAND; } });
  doc.querySelectorAll('.mp a[href]').forEach(a => { if (a.getAttribute('href') === cfg.self) a.setAttribute('aria-current', 'page'); });

  // ---------- UI 8: desktop-wide diagrams get a stacked version for phones ----------
  if (main) main.querySelectorAll('[role="img"], [role="group"]').forEach(dia => {
    if (dia.offsetWidth < 700 || dia.closest('.mp')) return;
    const kids = [...dia.children].filter(k => getComputedStyle(k).position === 'absolute');
    const txt = k => (k.innerText || k.textContent).replace(/\s*\n+\s*/g, ': ').replace(/\s+/g, ' ').trim();
    const boxes = kids.map(k => ({ e: k, x: k.offsetLeft, y: k.offsetTop, w: k.offsetWidth, h: k.offsetHeight, t: txt(k), a: k.tagName === 'A' ? k : k.querySelector('a') }));
    const labels = boxes.filter(b => b.x < 160 && b.t && b.w <= 180);
    const items = boxes.filter(b => b.t && !labels.includes(b));
    const groups = [];
    if (labels.length >= 3) { // layered map: rows by label
      labels.sort((p, q) => p.y - q.y).forEach(l => groups.push({ title: l.t, items: [] }));
      items.forEach(it => { const cy = it.y + it.h / 2; let best = 0; labels.forEach((l, i) => { if (Math.abs(l.y + l.h / 2 - cy) < Math.abs(labels[best].y + labels[best].h / 2 - cy)) best = i; }); groups[best].items.push(it); });
    } else { // side-by-side containers: group by the empty framed boxes
      const frames = boxes.filter(b => !b.t && b.w > 300 && b.h > 150).sort((p, q) => p.x - q.x);
      if (!frames.length) return;
      frames.forEach(() => groups.push({ title: null, items: [] }));
      items.forEach(it => { const cx = it.x + it.w / 2; let gi = frames.findIndex(f => cx >= f.x && cx <= f.x + f.w); if (gi < 0) gi = 0; groups[gi].items.push(it); });
      // a caption sits at the top of its frame, with no box of its own
      groups.forEach((g, gi) => { g.items.sort((p, q) => p.y - q.y || p.x - q.x); const f = frames[gi], c = g.items[0]; if (c && c.y - f.y < 32 && !/border|background/.test(c.e.getAttribute('style') || '')) g.title = g.items.shift().t; });
    }
    groups.forEach(g => g.items.sort((p, q) => p.y - q.y || p.x - q.x));
    const m = el('div', null); m.className = 'dia-m'; m.setAttribute('aria-label', dia.getAttribute('aria-label') || '');
    groups.filter(g => g.items.length).forEach(g => {
      const card = el('div', 'border: 1px solid rgb(220, 222, 232); border-radius: 12px; background: rgb(255, 255, 255); padding: 16px; display: flex; flex-direction: column; gap: 8px;');
      if (g.title) card.appendChild(el('div', `font-size: 13px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: ${MUTED};`, g.title));
      const ul = el('ul', 'margin: 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: 8px;');
      g.items.forEach(it => {
        const li = el('li', null);
        const inner = it.a ? el('a', `display: inline-flex; align-items: center; min-height: 44px; padding: 8px 12px; border-radius: 8px; border: 1.5px solid ${BRAND}; font-weight: 600; font-size: 15px;`, it.t) : el('span', `display: inline-flex; align-items: center; min-height: 44px; padding: 8px 12px; border-radius: 8px; background: rgb(243, 244, 248); color: ${MUTED}; font-size: 15px;`, it.t);
        if (it.a) inner.setAttribute('href', it.a.getAttribute('href'));
        li.appendChild(inner); ul.appendChild(li);
      });
      card.appendChild(ul); m.appendChild(card);
    });
    const scroller = dia.parentElement.style.overflowX ? dia.parentElement : dia;
    scroller.classList.add('dia-d');
    scroller.after(m);
  });

  // ---------- design system: type scale (1.25), 4/8-point spacing, 4 corner radii ----------
  const fontTok = (px, tag) => {
    if (tag === 'H3') return px < 27 ? 25 : 31;
    if (tag === 'H2') return px <= 32 ? 31 : 39;
    if (px <= 13.5) return 13; if (px < 18) return 16; if (px < 22) return 20; if (px < 27) return 25; if (px < 34) return 31; if (px < 44) return 39; if (px < 55) return 49; return 61;
  };
  const space = v => { if (v <= 2) return v; if (v < 8) return v <= 4 ? 4 : 8; if (v <= 24) { const lo = Math.floor(v / 4) * 4, hi = lo + 4; return v - lo < hi - v ? lo : hi - v < v - lo ? hi : (lo % 8 === 0 ? lo : hi); } const lo = Math.floor(v / 8) * 8; return v - lo < 4 ? lo : lo + 8; };
  const radius = v => (v <= 9 ? 8 : v <= 15 ? 12 : v < 40 ? 20 : v);
  const SPACE_PROPS = /^(padding|margin|gap|row-gap|column-gap|padding-(top|right|bottom|left)|margin-(top|right|bottom|left))$/;
  doc.querySelectorAll('body [style]').forEach(e => {
    if (inDiagram(e) || e.closest('svg')) return;
    const st = e.style;
    const fs = st.fontSize;
    if (fs) {
      if (/^[\d.]+px$/.test(fs)) st.fontSize = fontTok(parseFloat(fs), e.tagName) + 'px';
      else if (/^clamp\(/.test(fs)) st.fontSize = fs.replace(/(clamp\([^,]+,[^,]+,\s*)([\d.]+)px\)/, (m, a, max) => a + fontTok(+max, e.tagName === 'H1' ? 'X' : e.tagName) + 'px)').replace(/^clamp\(([\d.]+)px/, (m, min) => 'clamp(' + fontTok(+min, 'X') + 'px');
    }
    for (let i = 0; i < st.length; i++) {
      const prop = st[i];
      if (SPACE_PROPS.test(prop)) { const v = st.getPropertyValue(prop); const nv = v.replace(/(-?[\d.]+)px/g, (m, n) => (n < 0 ? '-' : '') + space(Math.abs(+n)) + 'px'); if (nv !== v) st.setProperty(prop, nv); }
      else if (/^border-(top|bottom)-(left|right)-radius$/.test(prop)) { const v = st.getPropertyValue(prop); if (/^[\d.]+px$/.test(v)) st.setProperty(prop, radius(parseFloat(v)) + 'px'); }
    }
  });
  doc.querySelectorAll('header .mb').forEach(b => b.classList.add('mb-c'));

  // ---------- checklist 26: visited items in content lists ----------
  if (main && /^\/(es\/)?(blog|library|news)\/$/.test(cfg.self)) main.classList.add('track-visited');

  // ---------- page sub-menu: current tab (UI 9) ----------
  doc.querySelectorAll('.subnav a').forEach(a => a.setAttribute('data-subnav', ''));

  // ---------- images again: lazy below the fold and rendered width, after the type and spacing changes ----------
  let first = true;
  doc.querySelectorAll('img').forEach(i => {
    if (i.closest('.mp')) return;
    i.removeAttribute('loading'); i.removeAttribute('fetchpriority');
    const r = i.getBoundingClientRect();
    if (r.width) i.setAttribute('data-w', String(Math.round(r.width)));
    if (r.top + scrollY > 900 || i.closest('footer')) { i.setAttribute('loading', 'lazy'); i.setAttribute('decoding', 'async'); }
    else if (first && r.width > 300) { i.setAttribute('fetchpriority', 'high'); first = false; }
  });
};
