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
  // round 2: plain white bands, result cards, card top accents, home's dark hero panel
  sections.forEach((s, i) => { if (i > 0 && bg(s) === 'rgb(255, 255, 255)' && !s.classList.length) s.classList.add('x-plain'); });
  main.querySelectorAll('.x-stat').forEach(n => { const c = n.parentElement; if (c && /border-top: 2px solid/.test(c.getAttribute('style') || '')) c.classList.add('x-statcard'); });
  main.querySelectorAll('.x-card').forEach(c => { const f = c.firstElementChild; if (f && (f.tagName === 'IMG' || f.querySelector(':scope > img'))) c.classList.add('x-card-top'); });
  if (sections[0]) sections[0].querySelectorAll('div').forEach(d => {
    const r = d.getBoundingClientRect(), cs = getComputedStyle(d);
    if (r.height > 400 && parseFloat(cs.borderTopLeftRadius) >= 16 && cs.overflow === 'hidden' && !d.parentElement.closest('.x-herocard')) { d.classList.add('x-herocard'); if (cs.position === 'static') d.style.position = 'relative'; }
  });
  // header
  const hdr = doc.querySelector('header.hdr, .hdr');
  if (hdr) hdr.classList.add('x-header');
};
