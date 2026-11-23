// Visual polish: tags the design's building blocks with classes that site-polish.css styles.
// Runs in the browser after uifixes.js. Adds classes only; no content or layout changes.
window.__alepoPolish = function (cfg, doc) {
  const css = doc.createElement('link'); css.rel = 'stylesheet'; css.href = '/assets/css/site-polish.css';
  doc.head.appendChild(css);
  const main = doc.querySelector('main');
  if (!main) return;
  const bg = e => getComputedStyle(e).backgroundColor;
  const sections = [...main.querySelectorAll(':scope > section')];
  sections.forEach((s, i) => {
    const c = bg(s);
    if (c === 'rgb(243, 244, 248)') s.classList.add(i === 0 ? 'x-hero' : 'x-tint');
    else if (c === 'rgb(18, 13, 61)') s.classList.add('x-dark');
    else if (c === 'rgb(45, 29, 143)') s.classList.add('x-cta');
    // section heading gets the accent bar (not in heroes or the demo band)
    if (i > 0 && !s.classList.contains('x-cta')) {
      const h2 = s.querySelector('h2');
      if (h2 && !h2.closest('a') && !h2.closest('[style*="border: 1px solid"]')) h2.classList.add('x-h2');
    }
  });
  // cards: framed boxes with a large radius
  main.querySelectorAll('div, a').forEach(e => {
    const st = e.getAttribute('style') || '';
    if (!/border: 1(\.5)?px solid rgb\((220, 222, 232|221, 218, 234)\)/.test(st)) return;
    const r = parseFloat(getComputedStyle(e).borderTopLeftRadius);
    if (r >= 16 && e.getBoundingClientRect().height > 80 && !e.closest('[role="img"], .dia-d')) e.classList.add('x-card');
  });
  // icon tiles
  doc.querySelectorAll('span, div').forEach(e => {
    if (bg(e) !== 'rgb(233, 234, 244)') return;
    const r = e.getBoundingClientRect();
    if (r.width > 0 && r.width <= 56 && r.height <= 56 && e.querySelector('svg')) e.classList.add('x-icon');
  });
  // framed photos
  main.querySelectorAll('img').forEach(i => {
    const box = i.parentElement;
    if (box && getComputedStyle(box).overflow === 'hidden' && parseFloat(getComputedStyle(box).borderTopLeftRadius) >= 16 && !box.classList.contains('x-card')) box.classList.add('x-media');
  });
  // buttons
  doc.querySelectorAll('a, button').forEach(b => {
    const h = b.getBoundingClientRect().height, c = bg(b), col = getComputedStyle(b).color;
    if (h < 40 && !b.closest('.mcta')) return;
    if (c === 'rgb(45, 29, 143)') b.classList.add('x-btn');
    else if (c === 'rgb(255, 255, 255)' && col === 'rgb(45, 29, 143)' && b.closest('.on-dark, .x-cta, .x-dark')) b.classList.add('x-btn-light');
  });
  // big numbers (results)
  main.querySelectorAll('span, div, p').forEach(e => {
    if (e.children.length || !/^[\d.,]+[xX%MK+]?$/.test(e.textContent.trim())) return;
    if (parseFloat(getComputedStyle(e).fontSize) >= 40 && !e.closest('.on-dark, .x-dark, .x-cta')) e.classList.add('x-stat');
  });
  // product rows on hub and category pages become light cards (rows inside cards stay as they are)
  main.querySelectorAll('a').forEach(a => {
    const st = a.getAttribute('style') || '';
    if (/border-top: 1px solid/.test(st) && /display: flex/.test(st) && !a.closest('.x-card, .mp, footer')) {
      a.classList.add('x-row');
      a.parentElement.classList.add('x-rows');
      const ic = a.querySelector(':scope > span:first-child');
      if (ic && ic.querySelector('svg') && !ic.textContent.trim()) ic.classList.add('x-row-icon');
    }
  });
  main.querySelectorAll('.x-rows').forEach(g => { const h = g.parentElement.querySelector('h2'); if (h) h.classList.add('x-h2'); });
  // runs of 4 or more framed text rows (offices, "Why Alepo") are grouped into a card grid
  const isRow = k => k.tagName === 'DIV' && /border-top: 1px solid/.test(k.getAttribute('style') || '') && !k.querySelector('a, button, input, h2, h3');
  main.querySelectorAll('div').forEach(d => {
    let run = [];
    const flush = () => {
      if (run.length >= 4) { const g = doc.createElement('div'); g.className = 'x-cardgrid'; run[0].before(g); run.forEach(k => g.appendChild(k)); }
      run = [];
    };
    [...d.children].forEach(k => { if (isRow(k)) run.push(k); else flush(); });
    flush();
  });
  // round 2: plain white bands, result cards
  sections.forEach((s, i) => { if (i > 0 && bg(s) === 'rgb(255, 255, 255)' && !s.classList.length) s.classList.add('x-plain'); });
  main.querySelectorAll('.x-stat').forEach(n => { const c = n.parentElement; if (c && /border-top: 2px solid/.test(c.getAttribute('style') || '')) c.classList.add('x-statcard'); });

  // ---------- motion hooks ----------
  // hero entrance: text column items and the media rise in turn
  const h1 = sections[0] && sections[0].querySelector('h1');
  if (h1) {
    const col = h1.parentElement, row = col.parentElement;
    let n = 0;
    [...col.children].forEach(c => { c.classList.add('x-in'); c.style.setProperty('--i', n++); });
    if (row) [...row.children].filter(c => c !== col).forEach(c => { c.classList.add('x-in', 'x-in-side'); c.style.setProperty('--i', n++); });
  }

  // ---------- footer: brand and newsletter on top, link columns, offices, bottom bar ----------
  const ft = doc.querySelector('footer');
  const wrap = ft && ft.firstElementChild;
  if (wrap && !wrap.querySelector('.xf-top')) {
    const es = doc.documentElement.lang === 'es';
    const T = es ? { tag: 'Alepo hace software para proveedores de servicios de comunicación.', offices: 'Oficinas', top: 'Volver arriba' }
                 : { tag: 'Alepo makes software for communication service providers.', offices: 'Offices', top: 'Back to top' };
    const [grid, offices, bottom] = [...wrap.children];
    const form = grid.querySelector(':scope > form');
    const cols = [...grid.querySelectorAll(':scope > .fcol')];
    const logo = bottom.querySelector('img');
    const support = form && [...form.querySelectorAll(':scope > div')].find(d => d.querySelector('a[href^="tel:"]'));
    const office = form && [...form.querySelectorAll(':scope > div')].find(d => !d.children.length && d.textContent.trim());
    const el = (t, c) => { const e = doc.createElement(t); if (c) e.className = c; return e; };
    const top = el('div', 'xf-top'), brand = el('div', 'xf-brand'), news = el('div', 'xf-news');
    const home = doc.querySelector('header a[aria-label]');
    const logoLink = el('a', 'xf-logo'); logoLink.href = home ? home.getAttribute('href') : '/';
    logoLink.setAttribute('aria-label', home ? home.getAttribute('aria-label') : 'Alepo');
    if (logo) { logo.alt = ''; logoLink.appendChild(logo); }
    const tag = el('p', 'xf-tag'); tag.textContent = T.tag;
    brand.append(logoLink, tag);
    const demo = doc.querySelector('header a[href*="#demo"]');
    if (demo) { const b = el('a', 'xf-btn'); b.href = demo.getAttribute('href'); b.innerHTML = demo.textContent.trim() + '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>'; brand.appendChild(b); }
    const contact = el('div', 'xf-contact');
    [support, office].forEach(d => { if (d) { d.removeAttribute('style'); contact.appendChild(d); } });
    brand.appendChild(contact);
    if (form) news.appendChild(form);
    top.append(brand, news);
    const colsBox = el('div', 'xf-cols');
    cols.forEach(c => { c.removeAttribute('style'); colsBox.appendChild(c); });
    const off = el('div', 'xf-offices');
    const oh = el('div', 'xf-oh'); oh.textContent = T.offices;
    offices.removeAttribute('style'); offices.className = 'xf-olist';
    off.append(oh, offices);
    colsBox.appendChild(off);
    bottom.removeAttribute('style'); bottom.className = 'xf-bottom';
    const up = el('button', 'xf-up'); up.type = 'button'; up.setAttribute('data-top', ''); up.setAttribute('aria-label', T.top);
    up.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"></path></svg>';
    bottom.appendChild(up);
    const mark = el('div', 'xf-mark'); mark.setAttribute('aria-hidden', 'true');
    if (logo) { const m = logo.cloneNode(); m.alt = ''; m.removeAttribute('style'); m.removeAttribute('loading'); mark.appendChild(m); }
    wrap.removeAttribute('style'); wrap.className = 'xf-wrap';
    grid.remove();
    wrap.append(top, colsBox, bottom);
    ft.classList.add('x-footer');
    ft.appendChild(mark);
  }
  // home product families: one tall card beside a 2 x 2 grid (a swipe row on phones)
  main.querySelectorAll('.x-card').forEach(c => {
    const g = c.parentElement;
    if (!g || g.classList.contains('x-prodrow')) return;
    const kids = [...g.children];
    if (!(kids.length >= 4 && kids.every(k => k.classList.contains('x-card') && k.querySelector('h3') && k.querySelectorAll('a').length >= 3))) return;
    g.classList.add('x-prodrow');
    // the family with the most products becomes the tall left card; the rest fill two rows beside it,
    // paired by size so each row is balanced. DOM order follows the visual order (keyboard and screen readers).
    const n = k => k.querySelectorAll('a').length;
    const sorted = kids.slice().sort((a, b) => n(b) - n(a));
    sorted[0].classList.add('x-prod-main');
    sorted.forEach(k => g.appendChild(k));
  });
  // header
  const hdr = doc.querySelector('header.hdr, .hdr');
  if (hdr) hdr.classList.add('x-header');
};
