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
    arrow: '<circle cx="12" cy="12" r="9"/><path d="M9 12h6M13 9l3 3-3 3"/>'
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


  // 1b. Blog page: every post from alepo.com (build/blog/posts.json, collected by fetch_blog.py)
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
      const fmt = d => new Date(d + 'T12:00:00Z').toLocaleDateString(ES ? 'es-ES' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
      const mk = (tag, cls, text) => { const e = doc.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
      const cards = cfg.blogPosts.map((p, i) => {
        const a = mk('a', 'x-post x-post-article' + (i === 0 ? ' x-post-featured' : ''));
        a.href = p.url; a.lang = 'en'; a.dataset.kind = topicOf(p.categories);
        const cover = mk('span', 'x-cover x-cover-img');
        if (p.image) { const im = doc.createElement('img'); im.src = '/assets/img/' + p.image; im.alt = ''; if (p.w) { im.width = p.w; im.height = p.h; } im.loading = i < 4 ? 'eager' : 'lazy'; im.decoding = 'async'; cover.appendChild(im); }
        const label = p.categories.find(c => c !== 'Blog' && c !== 'Alepo') || p.categories[0] || 'Blog';
        cover.appendChild(mk('span', 'x-post-tag', label));
        const body = mk('span', 'x-post-body');
        if (p.date) { const t = mk('time', 'x-post-date', fmt(p.date)); t.setAttribute('datetime', p.date); t.lang = L(); body.appendChild(t); }
        body.appendChild(mk('span', 'x-post-title', p.title.replace(/^Alepo\s*[-–]\s*/, '')));
        if (p.excerpt) body.appendChild(mk('span', 'x-post-excerpt', p.excerpt));
        const go = mk('span', 'x-post-go', ES ? 'Leer el artículo' : 'Read the article'); go.lang = L();
        go.insertAdjacentHTML('beforeend', '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>');
        body.appendChild(go);
        a.append(cover, body);
        return a;
      });
      function L() { return ES ? 'es' : 'en'; }
      feed.replaceChildren(...cards);
      feed.classList.add('x-blog'); feed.setAttribute('data-filter-list', ''); feed.dataset.pageSize = '13';
      // topic filters (same buttons as the Library) and a count
      const bar = mk('div', 'x-blog-bar');
      const grp = mk('div', 'x-blog-filters'); grp.setAttribute('role', 'group'); grp.setAttribute('aria-label', ES ? 'Filtrar por tema' : 'Filter by topic');
      [['all', ES ? 'Todos' : 'All']].concat(TOPICS.map(t => [t[0], t[1]])).forEach(([k, lab], i) => {
        const n = k === 'all' ? cards.length : cards.filter(c => c.dataset.kind === k).length;
        if (!n) return;
        const b = mk('button', null, lab); b.type = 'button'; b.dataset.filter = k; b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
        b.appendChild(mk('span', 'x-count', String(n)));
        grp.appendChild(b);
      });
      const status = mk('p', 'x-blog-status', (ES ? `${cards.length} artículos` : `${cards.length} articles`)); status.setAttribute('aria-live', 'polite'); status.dataset.tplEn = '{shown} of {total} articles'; status.dataset.tplEs = '{shown} de {total} artículos';
      bar.append(grp, status);
      feed.before(bar);
      const more = mk('button', 'x-btn-outline x-more', ES ? 'Ver más artículos' : 'Show more articles'); more.type = 'button'; more.setAttribute('data-more', ''); more.hidden = true;
      feed.after(more);
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
  // header
  const hdr = doc.querySelector('header.hdr, .hdr');
  if (hdr) hdr.classList.add('x-header');
};
