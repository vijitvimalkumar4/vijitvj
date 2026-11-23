// Visual polish: tags the design's building blocks with classes that site-polish.css styles.
// Runs in the browser after uifixes.js. Adds classes only; no content or layout changes.
window.__alepoPolish = function (cfg, doc) {
  const css = doc.createElement('link'); css.rel = 'stylesheet'; css.href = '/assets/css/site-polish.css';
  doc.head.appendChild(css);
  // Lenis smooth scrolling (local copy, MIT), loaded before site.js
  const siteJs = doc.head.querySelector('script[src="/assets/js/site.js"]');
  if (siteJs && !doc.head.querySelector('script[src="/assets/js/lenis.min.js"]')) { const l = doc.createElement('script'); l.src = '/assets/js/lenis.min.js'; l.defer = true; siteJs.before(l); }
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
    // balance the columns against Billing & BSS (the longest): short groups share a column
    // order: Network, Billing, Provisioning, Care, AI, Solutions, Services, Resources, Company
    if (cols.length === 9) {
      [[0, 2], [1], [3, 4], [5, 6], [7, 8]].forEach(ix => { const st = el('div', 'xf-stack'); ix.forEach(i => st.appendChild(cols[i])); colsBox.appendChild(st); });
      colsBox.classList.add('xf-balanced');
    }
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
  // home solutions: the first solution is a tall card beside a 2 x 2 grid of the rest (a swipe row on phones)
  main.querySelectorAll('a.x-card').forEach(c => {
    const g = c.parentElement;
    if (!g || g.classList.contains('x-solgrid') || g.classList.contains('x-prodrow')) return;
    const kids = [...g.children];
    if (kids.length === 5 && kids.every(k => k.matches('a.x-card') && k.querySelector('h3') && k.querySelector('img'))) {
      g.classList.add('x-solgrid');
      kids[0].classList.add('x-sol-main');
    }
  });
  // customer names strip: a quieter label and evenly spaced names
  main.querySelectorAll('.mqw').forEach(w => {
    const sec = w.closest('section'); if (!sec) return;
    sec.classList.add('x-logos');
    const lab = w.parentElement.querySelector(':scope > span'); if (lab) lab.classList.add('x-logos-label');
  });

  // Two-pane menus (Products, Solutions): groups on the left, the chosen group's items in the middle, promo on the right.
  // groups: [{ label, href (optional), list }]
  const chevron = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"></path></svg>';
  const makeXm = (inner, groups, side) => {
    const xm = doc.createElement('div'); xm.className = 'xm';
    groups.forEach((g, k) => {
      // a group with its own page is a link; a plain heading becomes a button that shows its items
      const tab = doc.createElement(g.href ? 'a' : 'button');
      if (g.href) tab.href = g.href; else tab.type = 'button';
      tab.className = 'xm-tab' + (k === 0 ? ' is-active' : '');
      tab.style.gridRow = String(k + 1);
      tab.innerHTML = '<span></span>' + chevron;
      tab.firstChild.textContent = g.label;
      const pane = doc.createElement('div');
      pane.className = 'xm-pane' + (k === 0 ? ' is-active' : '');
      pane.setAttribute('role', 'group'); pane.setAttribute('aria-label', g.label);
      const list = g.list;
      if (list.querySelector('div[style*="text-transform: uppercase"]')) {
        pane.classList.add('xm-pane-sub');
        [...list.children].forEach(col => {
          let block = null;
          [...col.children].forEach(ch => {
            if (ch.tagName !== 'A') { block = doc.createElement('div'); block.className = 'xm-sub'; ch.removeAttribute('style'); ch.className = 'xm-sublabel'; block.appendChild(ch); pane.appendChild(block); }
            else if (block) block.appendChild(ch);
          });
        });
        // reading order row by row: first block of each column, then the second
        const blocks = [...pane.children], half = Math.ceil(blocks.length / 2), reordered = [];
        for (let r = 0; r < half; r++) { if (blocks[r]) reordered.push(blocks[r]); if (blocks[r + half]) reordered.push(blocks[r + half]); }
        reordered.forEach(x => pane.appendChild(x));
      } else {
        const l = doc.createElement('div'); l.className = 'xm-list';
        list.querySelectorAll('a').forEach(x => l.appendChild(x));
        pane.appendChild(l);
      }
      xm.append(tab, pane);
    });
    if (side) {
      // a promo that is itself the card keeps its look inside a new side column
      if (side.tagName === 'A') { const w = doc.createElement('div'); w.className = 'xm-side'; w.appendChild(side); xm.appendChild(w); }
      else { side.removeAttribute('style'); side.className = 'xm-side'; xm.appendChild(side); }
    }
    inner.replaceChildren(xm);
    inner.classList.add('xm-host');
  };
  const headDivs = inner => [...inner.querySelectorAll('div[style*="border-bottom: 1px"][style*="font-size: 13px"]')];
  doc.querySelectorAll('.dnav .mp').forEach(mp => {
    const inner = mp.querySelector(':scope > div > div');
    if (!inner || inner.querySelector('.xm')) return;
    const heads = headDivs(inner);
    const side = [...inner.children].find(c => !headDivs(c).length && !c.matches('div[style*="border-bottom: 1px"]'));
    // Products: every heading links to a product family page
    const famLinks = heads.map(h => h.querySelector(':scope > a'));
    if (heads.length >= 4 && famLinks.every(a => a && /\/products\/[^/]+\/$/.test(a.getAttribute('href') || ''))) {
      // family order as in the footer (Network, Billing, Provisioning, Care, AI)
      const order = [...doc.querySelectorAll('footer .fcol-h a')].map(a => a.getAttribute('href'));
      const rank = a => { const i = order.indexOf(a.getAttribute('href')); return i < 0 ? 99 : i; };
      famLinks.sort((x, y) => rank(x) - rank(y));
      makeXm(inner, famLinks.map(a => ({ label: a.textContent.trim(), href: a.getAttribute('href'), list: a.parentElement.parentElement.children[1] })), side);
      mp.classList.add('xm-products');
      return;
    }
    // Solutions: two plain headings ("By operator", "By need"); the first group's items are solution pages
    if (heads.length === 2 && !famLinks.some(Boolean)) {
      const firstList = heads[0].nextElementSibling;
      const hrefs = firstList ? [...firstList.querySelectorAll('a')].map(a => a.getAttribute('href') || '') : [];
      if (hrefs.length && hrefs.every(h => /\/solutions\//.test(h))) {
        makeXm(inner, heads.map(h => ({ label: h.textContent.trim(), list: h.nextElementSibling })), side);
        mp.classList.add('xm-solutions');
      }
    }
  });

  // Other menus (Services, Resources, Company): the promo card's label becomes its column heading, so the card lines up with the first items
  doc.querySelectorAll('.dnav .mp').forEach(mp => {
    const inner = mp.querySelector(':scope > div > div');
    if (!inner || inner.classList.contains('xm-host') || inner.querySelector('.xm-sidecol')) return;
    const card = [...inner.children].find(c => c.tagName === 'A');
    const head = inner.querySelector('div[style*="border-bottom: 1px"][style*="font-size: 13px"]');
    const eyebrow = card && card.firstElementChild;
    if (!card || !head || !eyebrow || eyebrow.textContent.trim().length > 30) return;
    const col = doc.createElement('div'); col.className = 'xm-sidecol';
    const h = doc.createElement('div'); h.setAttribute('style', head.getAttribute('style')); h.textContent = eyebrow.textContent.trim();
    eyebrow.remove();
    card.replaceWith(col); col.append(h, card);
    card.classList.add('xm-promo');
    mp.classList.add('xm-cols');
  });
  // demo band: drifting glows (styled in site-polish.css, motion only when allowed)
  main.querySelectorAll('.x-cta').forEach(c => { if (c.querySelector(':scope > .x-orbs')) return; const o = doc.createElement('div'); o.className = 'x-orbs'; o.setAttribute('aria-hidden', 'true'); o.innerHTML = '<i></i><i></i><i></i>'; c.prepend(o); });
  // ================= child pages =================
  const ES = doc.documentElement.lang === 'es';
  const page = cfg.file || '';
  const svg = (d, n) => `<svg width="${n || 24}" height="${n || 24}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const I = {
    doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    chart: '<path d="M4 20V11M10 20V5M16 20v-6M21 20H3"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/>',
    paper: '<path d="M6 3h9l4 4v14H6z"/><path d="M9 9h6M9 13h6M9 17h6"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3"/>',
    eyeoff: '<path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A9.8 9.8 0 0 1 12 5c5 0 9 5 9 7a10.6 10.6 0 0 1-2.4 3.4M6.6 6.6C4.4 8 3 10.4 3 12c0 2 4 7 9 7a9.7 9.7 0 0 0 4.4-1"/>',
    activity: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    alert: '<path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17v.5"/>',
    zap: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6"/>',
    antenna: '<path d="M12 12v9M8 21h8"/><circle cx="12" cy="9" r="2"/><path d="M7.8 4.8a6 6 0 0 0 0 8.4M16.2 4.8a6 6 0 0 1 0 8.4M5 2a10 10 0 0 0 0 14M19 2a10 10 0 0 1 0 14"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    handshake: '<path d="M2 12l4-4 4 2 3-2 4 1 5 3"/><path d="M6 8v6l5 4 2-1 2 1 3-3"/><path d="M11 13l2 2"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/>',
    map: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    lifebuoy: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M5.6 5.6l3.6 3.6M14.8 14.8l3.6 3.6M18.4 5.6l-3.6 3.6M9.2 14.8l-3.6 3.6"/>',
    arrow: '<circle cx="12" cy="12" r="9"/><path d="M9 12h6M13 9l3 3-3 3"/>',
    megaphone: '<path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15 8a5 5 0 0 1 0 8M18 5a9 9 0 0 1 0 14"/>'
  };

  // 1. content lists (blog posts, library documents, resources on product pages) become cards with a typed cover
  const kindOf = t => /data ?sheet|ficha/i.test(t) ? 'doc' : /case|caso/i.test(t) ? 'chart' : /white|blanco|informe/i.test(t) ? 'paper' : 'book';
  const tagOf = a => {
    const k = [...a.children];
    if (k.length !== 3 || k[0].tagName !== 'SPAN' || k[0].querySelector('svg') || k[1].querySelector('svg')) return null;
    const t = k[0].textContent.trim();
    return t && t.length <= 24 ? t : null;
  };
  main.querySelectorAll('.x-rows').forEach(list => {
    const rows = [...list.children];
    if (!rows.length || !rows.every(r => r.matches('a.x-row') && tagOf(r))) return;
    list.classList.remove('x-rows'); list.classList.add('x-feed');
    rows.forEach((a, i) => {
      const [tag, title, go] = [...a.children];
      const kind = kindOf(tag.textContent);
      a.classList.remove('x-row'); a.classList.add('x-post', 'x-post-' + kind);
      const cover = doc.createElement('span'); cover.className = 'x-cover';
      tag.removeAttribute('style'); tag.className = 'x-post-tag';
      const pill = tag.querySelector('span'); if (pill) { tag.textContent = pill.textContent.trim(); }
      const ic = doc.createElement('span'); ic.className = 'x-cover-icon'; ic.innerHTML = svg(I[kind], 40);
      cover.append(tag, ic);
      title.className = 'x-post-title'; title.removeAttribute('style');
      go.className = 'x-post-go'; go.removeAttribute('style');
      a.prepend(cover);
      if (page === 'blog.html' && i === 0) a.classList.add('x-post-featured');
    });
  });


  // 1b. Blog, Library and News pages: the items collected from alepo.com (build/*/ *.json)
  const mk = (tag, cls, text) => { const e = doc.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const LANG = ES ? 'es' : 'en';
  const fmtDate = d => new Date(d + 'T12:00:00Z').toLocaleDateString(ES ? 'es-ES' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  const arrow = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>';
  // o: { url, title, date, summary, tag, image, w, h, kind, go, chips, fallback, featured, eager }
  const card = o => {
    const a = mk('a', 'x-post x-post-article' + (o.featured ? ' x-post-featured' : '') + (o.image ? '' : ' x-post-' + (o.fallback || 'doc')));
    a.href = o.url; a.lang = 'en'; if (o.kind) a.dataset.kind = o.kind;
    if (/\.pdf$/i.test(o.url)) { a.target = '_blank'; a.rel = 'noopener'; }
    const cover = mk('span', 'x-cover' + (o.image ? ' x-cover-img' : ' x-cover-plain'));
    if (o.image) { const im = doc.createElement('img'); im.src = '/assets/img/' + o.image; im.alt = ''; if (o.w) { im.width = o.w; im.height = o.h; } im.loading = o.eager ? 'eager' : 'lazy'; im.decoding = 'async'; cover.appendChild(im); }
    else { const ic = mk('span', 'x-cover-icon'); ic.innerHTML = svg(I[o.fallbackIcon || 'doc'], 40); cover.appendChild(ic); }
    if (o.tag) { const t = mk('span', 'x-post-tag', o.tag); t.lang = o.tagLang || 'en'; cover.appendChild(t); }
    const body = mk('span', 'x-post-body');
    if (o.date) { const t = mk('time', 'x-post-date', fmtDate(o.date)); t.setAttribute('datetime', o.date); t.lang = LANG; body.appendChild(t); }
    body.appendChild(mk('span', 'x-post-title', o.title));
    if (o.chips && o.chips.length) { const c = mk('span', 'x-post-chips'); o.chips.forEach(x => c.appendChild(mk('span', null, x))); body.appendChild(c); }
    if (o.summary) body.appendChild(mk('span', 'x-post-excerpt', o.summary));
    const go = mk('span', 'x-post-go', o.go); go.lang = LANG; go.insertAdjacentHTML('beforeend', arrow); body.appendChild(go);
    a.append(cover, body);
    return a;
  };
  // "Show more" (13 first) with a live count; site.js runs it, and without JavaScript every item is listed
  const paging = (feed, n, tplEn, tplEs, moreEn, moreEs) => {
    feed.setAttribute('data-filter-list', ''); feed.dataset.pageSize = '13';
    const status = mk('p', 'x-blog-status', ES ? tplEs.replace('{shown} de ', '') .replace('{total}', n) : tplEn.replace('{shown} of ', '').replace('{total}', n));
    status.setAttribute('aria-live', 'polite'); status.dataset.tplEn = tplEn; status.dataset.tplEs = tplEs;
    const more = mk('button', 'x-more', ES ? moreEs : moreEn); more.type = 'button'; more.setAttribute('data-more', ''); more.hidden = true;
    feed.after(more);
    return status;
  };

  if (page === 'blog.html' && Array.isArray(cfg.blogPosts) && cfg.blogPosts.length) {
    const feed = main.querySelector('.x-feed');
    if (feed) {
      const TOPICS = [
        ['aaa', ES ? 'Acceso a la red y AAA' : 'Network access and AAA', ['AAA server', 'Network Access Control', 'TACACS+', 'RADIUS AAA Basics', 'Subscriber Data Management']],
        ['bss', ES ? 'BSS y facturación' : 'BSS and billing', ['Business Support Systems', 'Digital BSS', 'Converged Policy Control', 'WiFi Monetization']],
        ['ai', ES ? 'IA' : 'AI', ['AI Agent Assistant', 'AI Customer Assistant', 'AI Powered CX']],
        ['news', ES ? 'Premios y noticias' : 'Awards and news', ['Awards']]
      ];
      // a post belongs to the topic of its first specific category (the order the post itself lists them)
      const topicOf = cats => { for (const c of cats) { const t = TOPICS.find(([, , list]) => list.includes(c)); if (t) return t[0]; } return 'other'; };
      const cards = cfg.blogPosts.map((p, i) => card({ url: p.url, title: p.title.replace(/^Alepo\s*[-–]\s*/, ''), date: p.date, summary: p.excerpt,
        tag: p.categories.find(c => c !== 'Blog' && c !== 'Alepo') || p.categories[0] || 'Blog', image: p.image, w: p.w, h: p.h,
        kind: topicOf(p.categories), go: ES ? 'Leer el artículo' : 'Read the article', featured: i === 0, eager: i < 4, fallback: 'book', fallbackIcon: 'book' }));
      feed.replaceChildren(...cards);
      feed.classList.add('x-blog');
      const bar = mk('div', 'x-blog-bar');
      const grp = mk('div', 'x-blog-filters'); grp.setAttribute('role', 'group'); grp.setAttribute('aria-label', ES ? 'Filtrar por tema' : 'Filter by topic');
      [['all', ES ? 'Todos' : 'All']].concat(TOPICS.map(t => [t[0], t[1]])).forEach(([k, lab], i) => {
        const n = k === 'all' ? cards.length : cards.filter(c => c.dataset.kind === k).length;
        if (!n) return;
        const b = mk('button', null, lab); b.type = 'button'; b.dataset.filter = k; b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
        b.appendChild(mk('span', 'x-count', String(n)));
        grp.appendChild(b);
      });
      const search = mk('label', 'x-search');
      search.appendChild(mk('span', 'x-sr', ES ? 'Buscar artículos' : 'Search articles'));
      const q = mk('input'); q.type = 'search'; q.setAttribute('data-search', ''); q.placeholder = ES ? 'Buscar por título' : 'Search by title'; q.autocomplete = 'off';
      search.appendChild(q);
      bar.append(grp, search, paging(feed, cards.length, '{shown} of {total} articles', '{shown} de {total} artículos', 'Show more articles', 'Ver más artículos'));
      feed.before(bar);
      if (ES) bar.before(mk('p', 'x-blog-note', 'Los artículos se publican en inglés.'));
    }
  }

  if (page === 'library.html' && Array.isArray(cfg.libraryItems) && cfg.libraryItems.length) {
    const feed = main.querySelector('.x-feed');
    if (feed) {
      const K = { 'datasheet': 'ds', 'case-study': 'cs', 'white-paper': 'wp' };
      const btn = k => { const b = main.querySelector(`button[data-filter="${k}"]`); return b ? b.firstChild.textContent.trim() : null; };
      const TAG = { ds: (ES ? 'Ficha técnica' : 'Datasheet'), cs: (ES ? 'Caso de éxito' : 'Case study'), wp: (ES ? 'Documento técnico' : 'White paper') };
      const GO = { ds: (ES ? 'Descargar el PDF' : 'Download the PDF'), cs: (ES ? 'Leer el caso' : 'Read the case study'), wp: (ES ? 'Leer el documento' : 'Read the white paper') };
      const cards = cfg.libraryItems.map((x, i) => {
        const k = K[x.type] || 'other';
        return card({ url: x.url, title: x.title, summary: k === 'cs' ? null : x.summary, chips: k === 'cs' ? [x.country, x.operator].filter(Boolean) : null,
          tag: TAG[k], tagLang: LANG, image: x.image, w: x.w, h: x.h, kind: k, go: x.pdf ? GO.ds : (GO[k] || GO.wp), eager: i < 4, fallback: k === 'cs' ? 'chart' : 'doc', fallbackIcon: k === 'cs' ? 'chart' : 'doc' });
      });
      feed.replaceChildren(...cards);
      feed.classList.add('x-blog', 'x-library');
      if (ES) feed.parentElement.insertBefore(mk('p', 'x-blog-note', 'Los documentos se publican en inglés.'), feed.parentElement.firstChild);
      // data sheets: a work email first, then the PDF (the card still links the PDF when JavaScript is off)
      cards.forEach(c => { if (c.dataset.kind === 'ds') { c.dataset.gate = ''; c.dataset.doc = c.querySelector('.x-post-title').textContent; c.removeAttribute('target'); } });
      const dlg = mk('dialog', 'x-gate'); dlg.id = 'x-gate'; dlg.setAttribute('aria-labelledby', 'x-gate-h');
      const privacy = (ES ? '/es' : '') + (cfg.siteConfig && cfg.siteConfig.privacyUrl || '/privacy-policy/');
      const consentTxt = ES ? 'Al enviar este formulario acepta que Alepo pueda contactarle sobre su solicitud, según la política de privacidad de Alepo.' : "By sending this form you agree that Alepo may contact you about your request, as described in Alepo's privacy policy.";
      dlg.innerHTML = `<form class="x-gate-form" data-gate-form data-form="datasheet" data-endpoint="/api/forms/datasheet" data-consent-text="${consentTxt.replace(/"/g, '&quot;')}" action="/api/forms/datasheet" method="post" novalidate>
        <input type="hidden" name="lang" value="${ES ? 'es' : 'en'}"><input type="hidden" name="request" value="datasheet"><input type="hidden" name="docTitle" value=""><input type="hidden" name="docUrl" value="">
        <button type="button" class="x-gate-x" data-gate-close aria-label="${ES ? 'Cerrar' : 'Close'}">×</button>
        <h2 id="x-gate-h">${ES ? 'Obtener la ficha técnica' : 'Get the data sheet'}</h2>
        <p class="x-gate-doc" data-gate-doc></p>
        <label for="x-gate-email">${ES ? 'Correo de trabajo' : 'Work email'}</label>
        <input id="x-gate-email" name="email" type="email" autocomplete="email" required aria-required="true">
        <p class="f-err" data-gate-err hidden></p>
        <input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" class="x-hp">
        <p class="x-gate-consent">${ES ? 'Al enviar este formulario acepta que Alepo pueda contactarle sobre su solicitud, según la <a href="' + privacy + '">política de privacidad</a> de Alepo.' : 'By sending this form you agree that Alepo may contact you about your request, as described in Alepo\'s <a href="' + privacy + '">privacy policy</a>.'}</p>
        <button type="submit" class="x-btn x-gate-go">${ES ? 'Obtener el PDF' : 'Get the PDF'}</button>
        <div class="x-gate-done" data-gate-done hidden><p>${ES ? 'Gracias. Su descarga está lista.' : 'Thank you. Your download is ready.'}</p><a class="x-btn" data-gate-link target="_blank" rel="noopener">${ES ? 'Descargar el PDF' : 'Download the PDF'}</a></div>
      </form>`;
      dlg.dataset.msgInvalid = ES ? 'Escriba un correo válido.' : 'Please enter a valid email address.';
      dlg.dataset.msgOffline = ES ? 'No pudimos guardar sus datos. Puede descargar el PDF igualmente.' : 'We could not save your details. You can still download the PDF.';
      main.appendChild(dlg);
      // filter counts
      main.querySelectorAll('button[data-filter]').forEach(b => { if (b.closest('[data-filter-empty]')) return; const k = b.dataset.filter; const n = k === 'all' ? cards.length : cards.filter(c => c.dataset.kind === k).length; b.appendChild(mk('span', 'x-count', String(n))); });
    }
  }

  if (page === 'news.html' && Array.isArray(cfg.newsItems) && cfg.newsItems.length) {
    const h = [...main.querySelectorAll('h2')].find(x => /^(News|Noticias)$/.test(x.textContent.trim()));
    const wrap = h && h.closest('section') && h.parentElement.nextElementSibling;
    if (wrap) {
      const feed = mk('div', 'x-feed x-blog x-news');
      const cards = cfg.newsItems.map((x, i) => card({ url: x.url, title: x.title, date: x.date, summary: x.summary, image: x.image, w: x.w, h: x.h, kind: 'news',
        go: ES ? 'Leer la noticia' : 'Read the news', featured: i === 0, eager: i < 2, fallback: 'chart', fallbackIcon: 'megaphone' }));
      feed.append(...cards);
      wrap.replaceWith(feed);
      if (ES) feed.before(mk('p', 'x-blog-note', 'Las noticias se publican en inglés.'));
      const bar = mk('div', 'x-blog-bar');
      bar.appendChild(paging(feed, cards.length, '{shown} of {total} news items', '{shown} de {total} noticias', 'Show more news', 'Ver más noticias'));
      feed.before(bar);
    }
  }

  // 2. text-only cards get an icon (company pages); partner cards get a monogram
  const CARD_ICONS = [[/encrypt|cifrado/i, 'lock'], [/access|acceso/i, 'key'], [/privacy|privacidad/i, 'eyeoff'], [/monitor/i, 'activity'], [/\bAI\b|\bIA\b/, 'sparkle'], [/incident/i, 'alert'],
    [/impact/i, 'zap'], [/^team$|^equipo$/i, 'users'], [/learn|aprend/i, 'book'], [/telecom/i, 'antenna'], [/open|abiertos/i, 'layers'], [/partnership|largo plazo/i, 'handshake']];
  main.querySelectorAll('.x-card').forEach(c => {
    const h = c.querySelector('h3'); if (!h || c.querySelector('img, svg, .x-icon')) return;
    const t = h.textContent.trim();
    const hit = CARD_ICONS.find(([re]) => re.test(t));
    const tile = doc.createElement('span'); tile.className = 'x-icon x-icon-lg'; tile.setAttribute('aria-hidden', 'true');
    if (hit) tile.innerHTML = svg(I[hit[1]], 22);
    else if (page === 'partners.html') { tile.classList.add('x-mono'); tile.textContent = t.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase(); }
    else return;
    h.parentElement.insertBefore(tile, h);
  });

  // 3. numbered steps become a row of step cards
  main.querySelectorAll('ol').forEach(ol => {
    const li = [...ol.children];
    if (li.length >= 3 && li.every(x => x.tagName === 'LI' && /^\d+$/.test((x.firstElementChild || {}).textContent || ''))) {
      ol.classList.add('x-steps'); li.forEach(x => x.firstElementChild.classList.add('x-step-n'));
    }
  });

  // 4. leadership: larger avatars
  if (page === 'leadership.html') main.querySelectorAll('.x-card').forEach(c => {
    const av = [...c.querySelectorAll('span')].find(sp => /^[A-Z]{2,3}$/.test(sp.textContent.trim()) && !sp.children.length);
    if (av) { c.classList.add('x-person'); av.classList.add('x-avatar'); }
  });

  // 5. careers: open roles as job cards
  if (page === 'careers.html') main.querySelectorAll('.x-rows').forEach(l => { if ([...l.children].every(a => a.matches('a.x-row') && a.children.length === 2)) { l.classList.add('x-jobs'); [...l.children].forEach(a => a.classList.add('x-job')); } });

  // 6. about: a short facts row from figures already on the site (two decades, the office list, five continents)
  if (page === 'about.html') {
    const who = main.querySelector(':scope > section:nth-of-type(2) p');
    const offices = doc.querySelectorAll('.xf-olist > span').length;
    if (who && offices) {
      const facts = ES ? [['20+', 'años creando software de telecomunicaciones'], [String(offices), 'oficinas'], ['5', 'continentes con operadores en Alepo']]
                       : [['20+', 'years building telecom software'], [String(offices), 'offices'], ['5', 'continents with operators on Alepo']];
      const row = doc.createElement('div'); row.className = 'x-facts';
      facts.forEach(([n, l]) => { const f = doc.createElement('div'); f.className = 'x-fact'; const a = doc.createElement('span'); a.className = 'x-fact-n'; a.textContent = n; const b = doc.createElement('span'); b.className = 'x-fact-l'; b.textContent = l; f.append(a, b); row.appendChild(f); });
      who.parentElement.appendChild(row);
    }
  }

  // 7. pull quotes (quotes that are not set over a photo)
  main.querySelectorAll('blockquote').forEach(q => { if (!q.closest('section').querySelector('img')) q.classList.add('x-quote'); });

  // 8. long two-column sections: the heading column stays in view while the text scrolls (desktop)
  main.querySelectorAll('h2').forEach(h => {
    const col = h.closest('div[style*="flex: 1 1 280px"]'); if (!col) return;
    const next = col.nextElementSibling;
    // the column stretches to its neighbour's height, so measure what is inside it
    const top = col.getBoundingClientRect().top;
    const used = Math.max(...[...col.children].map(x => x.getBoundingClientRect().bottom)) - top;
    const nh = next ? next.getBoundingClientRect().height : 0;
    if (nh > used * 1.8 && nh > 360) col.classList.add('x-sticky');
  });
  // long checklists read in two columns on wide screens
  main.querySelectorAll('ul').forEach(u => { const li = [...u.children]; if (li.length >= 5 && !u.closest('.x-card') && li.every(x => x.textContent.trim().length < 90)) u.classList.add('x-checks2'); });

  // 9. resources hub cards: the whole card is the link
  if (page === 'resources.html') main.querySelectorAll('.x-card').forEach(c => { const links = c.querySelectorAll('a'); if (links.length === 1 && c.querySelector('h3')) c.classList.add('x-hubcard'); });

  // 10. 404 and thank-you: the next steps as large tiles
  if (cfg.kind === 'utility' && cfg.noindex) main.querySelectorAll('.x-rows').forEach(l => {
    const rows = [...l.children]; if (!rows.length || rows.length > 6) return;
    l.classList.remove('x-rows'); l.classList.add('x-tiles');
    rows.forEach(a => {
      a.classList.remove('x-row'); a.classList.add('x-tile');
      if (!a.firstElementChild.querySelector('svg') || a.firstElementChild.nextElementSibling === null) return;
      const first = a.firstElementChild;
      if (first.children.length === 1 && first.querySelector('svg') && !first.textContent.trim()) { first.className = 'x-icon x-icon-lg'; first.removeAttribute('style'); }
    });
    rows.forEach(a => {
      if (a.querySelector('.x-icon')) return;
      const h = a.getAttribute('href') || '';
      const k = /product/.test(h) ? 'grid' : /solution/.test(h) ? 'layers' : /contact/.test(h) ? 'chat' : /sitemap/.test(h) ? 'map' : /library/.test(h) ? 'doc' : /customer/.test(h) ? 'star' : /service/.test(h) ? 'lifebuoy' : 'arrow';
      const t = doc.createElement('span'); t.className = 'x-icon x-icon-lg'; t.setAttribute('aria-hidden', 'true'); t.innerHTML = svg(I[k], 22); a.prepend(t);
    });
  });
  // heading order: card titles that follow the page title directly become level 2 (same look)
  (() => {
    let last = 1;
    [...main.querySelectorAll('h1, h2, h3, h4')].forEach(h => {
      const lvl = +h.tagName[1];
      if (lvl === 3 && last === 1) {
        const sec = h.closest('section') || main;
        sec.querySelectorAll('h3').forEach(x => { const n = doc.createElement('h2'); [...x.attributes].forEach(a => n.setAttribute(a.name, a.value)); n.append(...x.childNodes); x.replaceWith(n); });
        last = 2; return;
      }
      last = lvl;
    });
  })();
  // headline colour sweep: page titles (on load) and section headings (when they scroll in); dark variant on dark backgrounds
  const isLight = e => { const m = getComputedStyle(e).color.match(/\d+/g); return m && +m[0] > 200 && +m[1] > 200 && +m[2] > 200; };
  main.querySelectorAll('h1, .x-cta h2').forEach(h => {
    if (h.closest('a, .x-card, .x-post')) return;
    h.classList.add('x-sweep');
    if (h.tagName === 'H1') h.classList.add('x-sweep-load');
    if (h.closest('.on-dark, .x-dark, .x-cta') || isLight(h)) h.classList.add('x-sweep-dark');
  });

  // ================= council audit fixes =================
  const PRE = ES ? '/es' : '';
  // --- events: dated; past events step aside (rebuild weekly so the dates stay current) ---
  const MONTHS = { january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
    enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12 };
  const endOf = t => {
    const m = String(t).toLowerCase().match(/(\d{1,2})(?:\s*(?:to|al|a|-|–)\s*(\d{1,2}))?\s+(?:de\s+)?([a-záéíóú]+)\s+(?:de\s+)?(\d{4})/);
    if (!m || !MONTHS[m[3]]) return null;
    return `${m[4]}-${String(MONTHS[m[3]]).padStart(2, '0')}-${String(m[2] || m[1]).padStart(2, '0')}`;
  };
  const today = cfg.today || new Date().toISOString().slice(0, 10);
  const isPast = card => { const e = card.getAttribute('data-event-ends') || endOf(card.textContent); return e && e < today; };
  const evH = [...main.querySelectorAll('h2')].find(h => /^(Events|Eventos)$/.test(h.textContent.trim()));
  if (evH) {
    const sec = evH.closest('section');
    const cards = [...sec.querySelectorAll('a, div.x-card')].filter(c => endOf(c.textContent) && !c.parentElement.closest('a'));
    const past = cards.filter(isPast);
    past.forEach(c => { c.classList.add('x-past'); c.querySelectorAll('[data-upcoming-badge]').forEach(b => b.remove()); const chip = mk('span', 'x-past-chip', ES ? 'Pasado' : 'Past'); (c.querySelector('div') || c).prepend(chip); });
    if (cards.length && past.length === cards.length) {
      evH.textContent = ES ? 'Eventos recientes' : 'Recent events';
      evH.after(mk('p', 'x-ev-note', ES ? 'Los próximos eventos se anunciarán aquí.' : 'Upcoming events will be announced here.'));
    }
  }
  // elsewhere (Home, About): a past event card leaves the news grid
  main.querySelectorAll('[data-event-ends], a[href$="#events"].x-card').forEach(c => { if ((!evH || !evH.closest('section').contains(c)) && isPast(c)) c.remove(); });
  // menu card "Meet us": once the event is over, it shows the newest news item instead
  doc.querySelectorAll('.xm-sidecol').forEach(col => {
    const card = col.querySelector('.xm-promo'); if (!card || !/#events$/.test(card.getAttribute('href') || '') || !isPast(card) || !cfg.latestNews) return;
    const n = cfg.latestNews, sp = card.querySelectorAll(':scope > span');
    col.firstElementChild.textContent = ES ? 'Sala de prensa' : 'Newsroom';
    card.setAttribute('href', n.url); card.lang = 'en';
    if (sp[0]) sp[0].textContent = n.title.length > 70 ? n.title.slice(0, 67).replace(/\s+\S*$/, '') + '…' : n.title;
    if (sp[1]) { sp[1].textContent = new Date(n.date + 'T12:00:00Z').toLocaleDateString(ES ? 'es-ES' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); sp[1].lang = ES ? 'es' : 'en'; }
    if (sp[2] && sp[2].firstChild) { sp[2].firstChild.textContent = ES ? 'Leer la noticia' : 'Read the news'; sp[2].lang = ES ? 'es' : 'en'; }
  });

  // --- leadership: photos from alepo.com; the placeholder note goes ---
  main.querySelectorAll('p').forEach(p => { if (/Photographs to be added|fotograf[ií]as/i.test(p.textContent)) p.remove(); });
  if (cfg.leaders) main.querySelectorAll('.x-person').forEach(c => {
    const av = c.querySelector('.x-avatar'); const name = av && av.nextElementSibling && av.nextElementSibling.firstElementChild;
    if (!name) return;
    const slugN = name.textContent.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');
    const first = slugN.split('-')[0], parts = slugN.split('-');
    const key = cfg.leaders[slugN] ? slugN : cfg.leaders[parts[0] + '-' + parts.at(-1)] ? parts[0] + '-' + parts.at(-1) : cfg.leaders[first] ? first : null;
    if (!key) return;
    const img = doc.createElement('img'); img.src = '/assets/img/' + cfg.leaders[key]; img.alt = ''; img.width = 320; img.height = 320; img.loading = 'lazy'; img.decoding = 'async';
    av.textContent = ''; av.appendChild(img); av.classList.add('x-avatar-photo');
  });

  // --- News and events belongs to Resources (menu, breadcrumb, current section) ---
  if (page === 'news.html') {
    const crumb = main.querySelector('[data-role="breadcrumb"] a:nth-of-type(2)');
    if (crumb) { crumb.textContent = ES ? 'Recursos' : 'Resources'; crumb.setAttribute('href', PRE + '/resources/'); }
    doc.querySelectorAll('script[type="application/ld+json"]').forEach(sc => {
      try { const d = JSON.parse(sc.textContent); if (d['@type'] === 'BreadcrumbList' && d.itemListElement[1]) { d.itemListElement[1].name = ES ? 'Recursos' : 'Resources'; d.itemListElement[1].item = (cfg.origin || 'https://alepo.com') + PRE + '/resources/'; sc.textContent = JSON.stringify(d); } } catch (e) {}
    });
    const mbs = [...doc.querySelectorAll('.dnav .mm > .mb')];
    const cur = mbs.find(b => /Company|Empresa/.test(b.textContent)), res = mbs.find(b => /Resources|Recursos/.test(b.textContent));
    const plain = mbs.find(b => b !== cur && b !== res);
    if (cur && res) { ['boxShadow', 'color'].forEach(k => { res.style[k] = cur.style[k]; cur.style[k] = plain ? plain.style[k] : ''; }); if (cur.hasAttribute('aria-current')) { res.setAttribute('aria-current', cur.getAttribute('aria-current')); cur.removeAttribute('aria-current'); } }
  }
  {
    const company = [...doc.querySelectorAll('.dnav .mm')].find(m => /Company|Empresa/.test((m.querySelector('.mb') || {}).textContent || ''));
    if (company) company.querySelectorAll('a.mt[href$="/news/"]').forEach(a => a.remove());
    doc.querySelectorAll('footer .fcol').forEach(col => { const h = col.querySelector('.fcol-h'); if (h && /Company|Empresa/.test(h.textContent)) col.querySelectorAll('.fcol-list a[href$="/news/"]').forEach(a => a.remove()); });
    doc.querySelectorAll('.mnav details').forEach(d => { const sm = d.querySelector(':scope > summary'); if (sm && /Company|Empresa/.test(sm.textContent)) d.querySelectorAll(':scope > div > a[href$="/news/"]').forEach(a => a.remove()); });
  }
  // phone menu: one section open at a time
  doc.querySelectorAll('.mnav > div > details').forEach(d => d.setAttribute('name', 'x-mnav'));

  // --- "Latest posts" lists: the post's date and photo from the blog ---
  if (cfg.blogIndex) main.querySelectorAll('a.x-post:not(.x-post-article)').forEach(a => {
    const b = cfg.blogIndex[a.getAttribute('href')]; if (!b) return;
    const cover = a.querySelector('.x-cover');
    if (b.image && cover) { const im = doc.createElement('img'); im.src = '/assets/img/' + b.image; im.alt = ''; if (b.w) { im.width = b.w; im.height = b.h; } im.loading = 'lazy'; im.decoding = 'async'; cover.querySelectorAll('.x-cover-icon').forEach(x => x.remove()); cover.classList.add('x-cover-img'); cover.prepend(im); }
    if (b.date) { const t = mk('time', 'x-post-date', fmtDate(b.date)); t.setAttribute('datetime', b.date); t.lang = LANG; const title = a.querySelector('.x-post-title'); if (title) title.before(t); }
  });

  // --- demo form: one optional qualifying question ---
  doc.querySelectorAll('form[data-form="demo"]').forEach(f => {
    const co = f.querySelector('[name="company"]'); if (!co || f.querySelector('[name="operatorType"]')) return;
    const wrap = co.parentElement, row = wrap.parentElement;
    const nw = wrap.cloneNode(false); const lab = doc.createElement('label'); lab.setAttribute('for', co.id + '-op'); lab.setAttribute('style', (wrap.querySelector('label') || {}).getAttribute ? wrap.querySelector('label').getAttribute('style') : '');
    lab.textContent = ES ? 'Tipo de operador' : 'Operator type';
    const opt = mk('span', null, ES ? ' (opcional)' : ' (optional)'); opt.setAttribute('style', 'font-weight: 400; color: rgb(86, 91, 107);'); lab.appendChild(opt);
    const sel = doc.createElement('select'); sel.id = co.id + '-op'; sel.name = 'operatorType'; sel.setAttribute('style', co.getAttribute('style'));
    const OPTS = ES ? ['', 'ISP de fibra o cable', 'Operador móvil', 'OMV u OMVE', 'Wi-Fi o recintos', 'Empresa o gobierno', 'Otro'] : ['', 'Fibre or cable ISP', 'Mobile operator', 'MVNO or MVNE', 'Wi-Fi or venue provider', 'Enterprise or government', 'Other'];
    OPTS.forEach((o, i) => { const op = doc.createElement('option'); op.value = o; op.textContent = i ? o : (ES ? 'Elegir' : 'Choose'); sel.appendChild(op); });
    nw.append(lab, sel);
    const r2 = row.cloneNode(false); r2.appendChild(nw); row.after(r2);
  });

  // --- footer: real policy links and Alepo's social channels ---
  doc.querySelectorAll('.xf-bottom span').forEach(sp => {
    if (/^(Privacy policy|Política de privacidad)$/.test(sp.textContent.trim()) && !sp.children.length) {
      const a = doc.createElement('a'); a.href = PRE + '/privacy-policy/'; a.textContent = sp.textContent.trim(); sp.replaceWith(a);
      const c2 = doc.createElement('a'); c2.href = PRE + '/cookie-policy/'; c2.textContent = ES ? 'Política de cookies' : 'Cookie policy'; a.after(c2);
    }
  });
  const SOC = cfg.siteConfig && cfg.siteConfig.social;
  const contactBox = doc.querySelector('.xf-contact');
  if (SOC && contactBox && !doc.querySelector('.xf-social')) {
    const ICON = {
      LinkedIn: '<path d="M4 9h3v11H4zM5.5 4a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5zM10 9h3v1.6c.5-.9 1.7-1.8 3.4-1.8 3.2 0 3.6 2.1 3.6 4.8V20h-3v-5.6c0-1.3 0-3-1.8-3s-2.2 1.4-2.2 2.9V20h-3z" fill="currentColor" stroke="none"/>',
      X: '<path d="M4 4l16 16M20 4L4 20" />',
      YouTube: '<rect x="3" y="6" width="18" height="12" rx="3.5"/><path d="M10.5 9.5v5l4-2.5z" fill="currentColor"/>',
      Facebook: '<path d="M14 8h2V5h-2.5C11 5 10 6.7 10 9v2H8v3h2v6h3v-6h2.5l.5-3H13V9.2c0-.7.3-1.2 1-1.2z" fill="currentColor" stroke="none"/>',
      Instagram: '<rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.6"/><circle cx="17" cy="7" r="1" fill="currentColor"/>' };
    const row = mk('div', 'xf-social');
    Object.entries(SOC).forEach(([name, url]) => { if (name.startsWith('_') || !ICON[name]) return; const a = doc.createElement('a'); a.href = url; a.rel = 'me noopener'; a.target = '_blank'; a.setAttribute('aria-label', `Alepo on ${name}`); a.innerHTML = svg(ICON[name], 20); row.appendChild(a); });
    contactBox.after(row);
  }

  // --- structured data: FAQ answers and product details (rich results) ---
  const addLd = obj => { const sc = doc.createElement('script'); sc.type = 'application/ld+json'; sc.textContent = JSON.stringify(obj); doc.head.appendChild(sc); };
  const faqs = [...main.querySelectorAll('details')].map(d => { const q = d.querySelector('summary'); if (!q) return null; const a = [...d.childNodes].filter(n => n !== q).map(n => n.textContent).join(' ').replace(/\s+/g, ' ').trim(); return a ? { q: q.textContent.replace(/\s+/g, ' ').trim(), a } : null; }).filter(Boolean);
  if (faqs.length >= 2) addLd({ '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: ES ? 'es' : 'en', mainEntity: faqs.map(x => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })) });
  if (/^p-/.test(page)) {
    const canon = doc.querySelector('link[rel="canonical"]'), desc = doc.querySelector('meta[name="description"]');
    const crumbs = [...main.querySelectorAll('[data-role="breadcrumb"] > *')].map(x => x.textContent.trim()).filter(t => t && t !== '/');
    addLd({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: crumbs.at(-1) || (main.querySelector('h1') || {}).textContent, applicationCategory: 'BusinessApplication', applicationSubCategory: crumbs.at(-2) || undefined,
      description: desc ? desc.getAttribute('content') : undefined, url: canon ? canon.getAttribute('href') : undefined, inLanguage: ES ? 'es' : 'en',
      publisher: { '@type': 'Organization', name: 'Alepo Technologies', url: 'https://alepo.com/' } });
  }
  // fonts are self-hosted (site-polish.css); no Google Fonts request
  doc.querySelectorAll('link[href*="fonts.googleapis.com"], link[href*="fonts.gstatic.com"]').forEach(l => l.remove());
  // header
  const hdr = doc.querySelector('header.hdr, .hdr');
  if (hdr) hdr.classList.add('x-header');
};
