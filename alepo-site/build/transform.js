// Runs inside the page (Chromium) on a design snapshot and turns it into a public page.
// Entry point: window.__alepo(cfg) -> Promise<html string>.
// cfg is assembled by build.mjs (see there for fields).
window.__alepo = async function (cfg) {
  const L = cfg.lang;                 // 'en' | 'es'
  const ES = L === 'es';
  const doc = document;
  const T = (en, es) => (ES ? es : en);
  const pre = ES ? '/es' : '';
  const cat = cfg.catalog;
  const urls = cfg.urls;              // snapshot file -> EN path
  const cats = cfg.categories;        // key -> {url,label,label_es}
  const catLabel = k => (ES ? cats[k].label_es : cats[k].label);
  const catHref = k => pre + cats[k].url;
  const prodHref = f => pre + urls[f].url;
  const BRAND = 'rgb(45, 29, 143)';
  const MUTED = 'rgb(86, 91, 107)';

  // ---------- helpers ----------
  const snapshotBase = ES ? '/es/' : '/';
  const cache = {};
  async function snapshot(file) {
    if (!cache[file]) {
      const r = await fetch(snapshotBase + file);
      cache[file] = new DOMParser().parseFromString(await r.text(), 'text/html');
    }
    return cache[file];
  }
  const imp = n => doc.importNode(n, true);
  const textOf = el => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
  function setText(el, t) { el.textContent = t; }
  function el(tag, style, text) { const e = doc.createElement(tag); if (style) e.setAttribute('style', style); if (text != null) e.textContent = text; return e; }
  const productFileOfHref = h => { const m = (h || '').match(/^(?:\.\.\/)?(p-[a-z]+\.html)/); return m ? m[1] : null; };

  // Collect the design's own descriptor line for each product (from the mega-menu cards).
  // Only the Products panel: other panels (Solutions "By need") link products with different text.
  const desc = {};
  const productsPanel = [...doc.querySelectorAll('.mm')].find(m => /^(Products|Productos)$/.test(textOf(m.querySelector('.mb'))));
  (productsPanel ? productsPanel.querySelectorAll('.mp a.mt') : []).forEach(a => {
    const f = productFileOfHref(a.getAttribute('href'));
    const spans = a.querySelectorAll(':scope > span:last-child > span');
    if (f && spans.length > 1 && !desc[f]) desc[f] = textOf(spans[1]);
  });

  // ---------- 1. page-specific composition (before link rewriting) ----------
  if (cfg.kind === 'category') await composeCategory();
  if (cfg.kind === 'utility') composeUtility();
  if (cfg.file === 'products.html' && cfg.kind === 'page') regroupHub();
  if (cfg.kind === 'utility') {
    // utility pages are built on the Products hub layout: clear its "current section" underline in the main nav
    doc.querySelectorAll('.mb').forEach(btn => { btn.style.boxShadow = 'none'; btn.style.color = 'inherit'; });
  }
  if (cfg.file === 'index.html') await homeCards();
  if (cfg.file === 'services.html') servicesSections();
  if (cfg.file === 's-ent.html') {
    const h = [...doc.querySelectorAll('main *')].find(e => e.children.length === 0 && /^(Cisco ACS replacement|Reemplazo de Cisco ACS)$/.test(textOf(e)));
    const box = h && h.parentElement;
    if (box) { box.id = 'cisco-acs-replacement'; box.style.scrollMarginTop = '136px'; }
  }

  // ---------- 2. navigation: Products mega menu, mobile menu, footer ----------
  rebuildMegaMenu();
  rebuildMobileMenu();
  rebuildFooter();
  retargetShortcuts();

  // ---------- 3. product names in link text ----------
  doc.querySelectorAll('a[href]').forEach(a => {
    const f = productFileOfHref(a.getAttribute('href'));
    if (!f || !cat.products[f]) return;
    const p = cat.products[f];
    const walker = doc.createTreeWalker(a, NodeFilter.SHOW_TEXT);
    let n; while ((n = walker.nextNode())) {
      if (n.parentElement.closest('[data-brand]')) continue; // brand lines keep the brand name
      const t = n.nodeValue.trim();
      if (t && p.old.includes(t) && t !== p.label) n.nodeValue = n.nodeValue.replace(t, p.label);
    }
  });

  // ---------- 4. hero: breadcrumb, brand line, H1 ----------
  const h1 = doc.querySelector('main h1');
  if (h1 && cfg.h1) h1.textContent = cfg.h1;
  if (h1) fixBreadcrumb(h1);
  if (h1 && cfg.eyebrow) {
    const e = el('div', `font-size: 15px; font-weight: 600; letter-spacing: 0.01em; color: ${BRAND};`, cfg.eyebrow);
    e.setAttribute('data-role', 'brand-line'); e.setAttribute('data-brand', '');
    h1.parentNode.insertBefore(e, h1);
  }

  // ---------- 5. links, images, language switch ----------
  doc.querySelectorAll('a[href]').forEach(a => {
    const h = a.getAttribute('href');
    const m = h.match(/^(?:\.\.\/|es\/)?([a-z-]+\.html)(#.*)?$/);
    if (!m) return;
    if (m[1] === 'menu.html') return;
    let frag = m[2] || '';
    const amap = (cfg.anchors[m[1]] || {});
    if (frag && amap[frag.slice(1)]) frag = '#' + amap[frag.slice(1)];
    if (urls[m[1]]) a.setAttribute('href', pre + urls[m[1]].url + frag);
  });
  doc.querySelectorAll('img[src]').forEach(i => {
    const s = i.getAttribute('src').replace(/^(\.\.\/)+/, '');
    if (s.startsWith('assets/')) i.setAttribute('src', '/' + s);
  });
  doc.querySelectorAll('button[aria-label="English"], button[aria-label="Español"]').forEach(b => {
    const toEs = b.getAttribute('aria-label') === 'Español';
    b.removeAttribute('onclick');
    const alt = cfg.alt || { en: '/', es: '/es/' };
    if (toEs !== ES) b.setAttribute('onclick', `location.href='${toEs ? alt.es : alt.en}'`);
  });
  const legal = [...doc.querySelectorAll('footer span')].find(s => ['Sitemap', 'Mapa del sitio'].includes(textOf(s)) && s.children.length === 0);
  if (legal) { const a = el('a', null, textOf(legal)); a.setAttribute('href', pre + '/sitemap/'); legal.replaceWith(a); }

  // ---------- 6. head ----------
  const head = doc.head;
  doc.querySelectorAll('script').forEach(s => s.remove()); // includes this build script tag
  head.querySelectorAll('title, meta[name="description"], meta[name="viewport"], link[rel="canonical"], link[rel="alternate"], meta[property^="og:"], meta[name^="twitter:"], script[type="application/ld+json"], meta[name="robots"]').forEach(e => e.remove());
  const charset = head.querySelector('meta[charset]');
  const add = (tag, attrs) => { const e = doc.createElement(tag); for (const k in attrs) e.setAttribute(k, attrs[k]); head.insertBefore(e, charset ? charset.nextSibling : head.firstChild); return e; };
  // inserted in reverse order after <meta charset>
  const ld = [];
  if (cfg.isHome) ld.push(cfg.schema.organization, cfg.schema.website);
  const crumbs = readCrumbs();
  if (!cfg.isHome && crumbs.length) ld.push({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => Object.assign({ '@type': 'ListItem', position: i + 1, name: c.name }, c.href ? { item: cfg.origin + c.href } : {})) });
  for (const obj of ld.reverse()) { const s = doc.createElement('script'); s.type = 'application/ld+json'; s.textContent = JSON.stringify(obj); head.insertBefore(s, charset ? charset.nextSibling : head.firstChild); }
  if (cfg.noindex) add('meta', { name: 'robots', content: 'noindex' });
  add('meta', { property: 'og:locale', content: ES ? 'es_419' : 'en_US' });
  add('meta', { property: 'og:site_name', content: 'Alepo' });
  add('meta', { property: 'og:type', content: 'website' });
  add('meta', { property: 'og:url', content: cfg.origin + cfg.self });
  add('meta', { property: 'og:description', content: cfg.meta });
  add('meta', { property: 'og:title', content: cfg.title });
  if (cfg.alt) {
    add('link', { rel: 'alternate', hreflang: 'x-default', href: cfg.origin + cfg.alt.en });
    add('link', { rel: 'alternate', hreflang: 'es', href: cfg.origin + cfg.alt.es });
    add('link', { rel: 'alternate', hreflang: 'en', href: cfg.origin + cfg.alt.en });
  }
  add('link', { rel: 'canonical', href: cfg.origin + cfg.self });
  if (cfg.meta) add('meta', { name: 'description', content: cfg.meta });
  const title = doc.createElement('title'); title.textContent = cfg.title; head.insertBefore(title, charset ? charset.nextSibling : head.firstChild);
  add('meta', { name: 'viewport', content: 'width=device-width, initial-scale=1' });
  doc.documentElement.setAttribute('lang', L);
  if (window.__alepoLead) window.__alepoLead(cfg, doc); // audit fixes (leadfixes.js)
  if (window.__alepoUI) await window.__alepoUI(cfg, doc); // UI audit fixes (uifixes.js)

  return '<!doctype html>\n' + doc.documentElement.outerHTML;

  // ================= functions =================
  function readCrumbs() {
    const bc = doc.querySelector('[data-role="breadcrumb"]');
    if (!bc) return [];
    return [...bc.children].filter(c => c.tagName === 'A' || (c.tagName === 'SPAN' && textOf(c) !== '/')).map(c => ({ name: textOf(c), href: c.tagName === 'A' ? c.getAttribute('href') : null }));
  }

  function fixBreadcrumb(h1) {
    let bc = h1.previousElementSibling;
    if (!bc || !bc.querySelector('span') || ![...bc.children].some(c => textOf(c) === '/')) return;
    bc.setAttribute('data-role', 'breadcrumb');
    bc.setAttribute('aria-label', T('Breadcrumb', 'Ruta de navegación'));
    const linkTpl = bc.querySelector('a');
    const sepTpl = [...bc.children].find(c => textOf(c) === '/');
    const list = cfg.crumbs ? cfg.crumbs.slice() : [...bc.children].filter(c => textOf(c) !== '/').map(c => ({ name: textOf(c), href: c.tagName === 'A' ? c.getAttribute('href') : null }));
    // Home first (blueprint 9.1 row 0: Home > Products > [Category] > [Product])
    if (!list.length || !['Home', 'Inicio'].includes(list[0].name)) list.unshift({ name: T('Home', 'Inicio'), href: 'index.html' });
    else if (list[0].name) list[0].href = 'index.html';
    bc.innerHTML = '';
    list.forEach((c, i) => {
      if (i) bc.appendChild(sepTpl.cloneNode(true));
      if (i < list.length - 1 && c.href) { const a = linkTpl.cloneNode(false); a.setAttribute('href', c.href); a.textContent = c.name; bc.appendChild(a); }
      else { const s = el('span', null, c.name); if (i === list.length - 1) s.setAttribute('aria-current', 'page'); bc.appendChild(s); }
    });
  }

  function productCard(tpl, f) {
    // tpl: an existing .mt card in the mega menu
    const p = cat.products[f];
    const a = tpl.cloneNode(true);
    a.setAttribute('href', f);
    const txt = a.querySelector(':scope > span:last-child');
    const spans = txt.querySelectorAll(':scope > span');
    spans[0].textContent = p.label;
    if (spans[1]) spans[1].textContent = desc[f] || '';
    if (p.brand) { const br = el('span', `font-size: 12.5px; font-style: italic; color: ${MUTED};`, p.brand); br.setAttribute('data-brand', ''); txt.insertBefore(br, spans[1] || null); }
    // icon: reuse the design's icon for this product
    const src = [...doc.querySelectorAll('.mp a.mt')].find(x => productFileOfHref(x.getAttribute('href')) === f);
    if (src) a.querySelector(':scope > span:first-child').replaceWith(src.querySelector(':scope > span:first-child').cloneNode(true));
    return a;
  }

  function rebuildMegaMenu() {
    const panel = [...doc.querySelectorAll('.mm')].find(m => /^(Products|Productos)$/.test(textOf(m.querySelector('.mb'))));
    if (!panel) return;
    const grid = panel.querySelector('.mp > div > div');
    const cols = [...grid.children];               // [access, bss, care+ai, promo]
    const headTpl = cols[0].querySelector(':scope > div:first-child');
    const listTpl1 = cols[0].querySelector(':scope > div:nth-child(2)');
    const cardTpl = cols[0].querySelector('a.mt');
    const cards = {};
    for (const f in cat.products) cards[f] = productCard(cardTpl, f);
    function group(k, twoCol) {
      const g = cat.groups.find(x => x.cat === k);
      const wrap = cols[0].cloneNode(false);
      const head = headTpl.cloneNode(false);
      const ha = el('a', 'color: inherit;', catLabel(k)); ha.setAttribute('href', 'CAT:' + k);
      head.appendChild(ha);
      wrap.appendChild(head);
      if (!twoCol) {
        const list = listTpl1.cloneNode(false);
        g.sub.forEach(s => s.items.forEach(f => list.appendChild(cards[f])));
        wrap.appendChild(list);
      } else {
        const list = listTpl1.cloneNode(false);
        list.style.gridTemplateColumns = 'repeat(2, minmax(0px, 1fr))';
        const halves = [g.sub.slice(0, 2), g.sub.slice(2)];
        halves.forEach(h => {
          const colEl = el('div', 'display: flex; flex-direction: column; gap: 10px; min-width: 0px;');
          h.forEach(s => {
            colEl.appendChild(el('div', `font-size: 11.5px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: ${MUTED}; padding-top: 2px;`, ES ? s.label_es : s.label));
            s.items.forEach(f => colEl.appendChild(cards[f]));
          });
          list.appendChild(colEl);
        });
        wrap.appendChild(list);
      }
      return wrap;
    }
    const c1 = el('div', 'display: flex; flex-direction: column; gap: 28px; min-width: 0px;'); c1.append(group('aaa'), group('prov'));
    const c2 = group('bss', true);
    const c3 = el('div', 'display: flex; flex-direction: column; gap: 28px; min-width: 0px;'); c3.append(group('care'), group('ai'));
    grid.replaceChildren(c1, c2, c3, cols[3]);
    grid.querySelectorAll('a[href^="CAT:"]').forEach(a => a.setAttribute('href', catHref(a.getAttribute('href').slice(4))));
  }

  function rebuildMobileMenu() {
    const det = [...doc.querySelectorAll('.mnav details')].find(d => /^(Products|Productos)$/.test(textOf(d.querySelector('summary'))));
    if (!det) return;
    const box = det.querySelector(':scope > div');
    const tpl = box.querySelector('a');
    const all = [...box.querySelectorAll('a')].pop();      // "All products"
    box.innerHTML = '';
    cat.groups.forEach(g => {
      const h = tpl.cloneNode(false); h.setAttribute('href', catHref(g.cat)); h.textContent = catLabel(g.cat);
      h.style.fontWeight = '600'; h.style.fontSize = '13px'; h.style.color = BRAND; h.style.marginTop = '6px';
      box.appendChild(h);
      g.sub.forEach(s => s.items.forEach(f => { const a = tpl.cloneNode(false); a.setAttribute('href', f); a.textContent = cat.products[f].label; a.style.paddingLeft = '12px'; box.appendChild(a); }));
    });
    box.appendChild(all);
  }

  function rebuildFooter() {
    const grid = doc.querySelector('footer > div > div:first-child');
    if (!grid) return;
    const cols = [...grid.children];
    const form = cols.find(c => c.tagName === 'FORM');
    const colTpl = cols[0], headTpl = colTpl.children[0], listTpl = colTpl.children[1];
    const solutions = cols[3], company = cols[4];
    const mk = (label, href, links) => {
      const c = colTpl.cloneNode(false), h = headTpl.cloneNode(false), l = listTpl.cloneNode(false);
      if (href) { const a = el('a', 'color: inherit;', label); a.setAttribute('href', href); h.appendChild(a); } else h.textContent = label;
      links.forEach(([t, u]) => { const a = el('a', null, t); a.setAttribute('href', u); l.appendChild(a); });
      c.append(h, l); return c;
    };
    const groupCols = cat.groups.map(g => mk(catLabel(g.cat), catHref(g.cat), g.sub.flatMap(s => s.items.map(f => [cat.products[f].label, f]))));
    // AI for Telecom: hub plus 2 (blueprint 5.5)
    const aiCol = groupCols[4];
    const hubLink = el('a', null, T('AI for Telecom overview', 'Resumen de IA para telecomunicaciones')); hubLink.setAttribute('href', catHref('ai'));
    aiCol.children[1].prepend(hubLink);
    // Solutions (5): drop the 6th link (Services and support), which now has its own column
    const solLinks = solutions.children[1];
    [...solLinks.children].forEach(a => { if (/^services\.html/.test(a.getAttribute('href'))) a.remove(); });
    // Services (4) and Resources (4), labels taken from the header menus
    const menuLinks = re => [...doc.querySelectorAll('.mp a')].filter(a => re.test(a.getAttribute('href')));
    const firstText = a => textOf(a.querySelector('span span') || a);
    const svc = ['#deployment', '#saas', '#professional', '#support'].map(fr => menuLinks(/^services\.html/).find(a => a.getAttribute('href').endsWith(fr))).filter(Boolean).map(a => [firstText(a), a.getAttribute('href')]);
    const resItems = ['blog.html', 'library.html', 'customers.html', 'news.html'];
    const resPanel = [...doc.querySelectorAll('.mm')].find(m => /^(Resources|Recursos)$/.test(textOf(m.querySelector('.mb'))));
    const res = resItems.map(f => [...resPanel.querySelectorAll('a')].find(a => a.getAttribute('href') === f)).filter(Boolean).map(a => [firstText(a), a.getAttribute('href')]);
    const svcCol = mk(T('Services', 'Servicios'), 'services.html', svc);
    const resCol = mk(T('Resources', 'Recursos'), 'resources.html', res);
    grid.replaceChildren(...groupCols, solutions, svcCol, resCol, company, form);
  }

  function retargetShortcuts() {
    // N3: "Replace Cisco ACS" goes to the page that owns "cisco acs replacement" (keyword map row N3)
    const target = 's-ent.html#cisco-acs-replacement';
    const label = T('Enterprise and government networks', 'Redes empresariales y de gobierno');
    doc.querySelectorAll('a[href="p-tacacs.html"]').forEach(a => {
      const t = textOf(a);
      if (/^(Replace Cisco ACS|Reemplazar Cisco ACS)/.test(t)) {
        a.setAttribute('href', target);
        const w = doc.createTreeWalker(a, NodeFilter.SHOW_TEXT); let n;
        while ((n = w.nextNode())) if (n.nodeValue.trim() === 'TACACS+ Server') n.nodeValue = label;
      }
    });
    // 05g: Services menu "Customer success" goes to the new Services section
    doc.querySelectorAll('.mp a[href="customers.html"]').forEach(a => {
      if (/^(Customer success|Éxito del cliente)/.test(textOf(a))) a.setAttribute('href', 'services.html#customer-success');
    });
  }

  function hubRow(tpl, f) {
    const p = cat.products[f];
    const a = tpl.cloneNode(true);
    a.setAttribute('href', f);
    const txt = a.querySelector(':scope > span:nth-child(2)');
    const spans = txt.querySelectorAll(':scope > span');
    spans[0].textContent = p.label;
    if (spans[1]) spans[1].textContent = desc[f] || '';
    if (p.brand) { const br = el('span', `font-size: 13.5px; font-style: italic; color: ${MUTED}; line-height: 1.4;`, p.brand); br.setAttribute('data-brand', ''); txt.insertBefore(br, spans[1] || null); }
    const icon = doc.querySelector(`main a[href="${f}"] > span:first-child`);
    if (icon) a.querySelector(':scope > span:first-child').replaceWith(icon.cloneNode(true));
    return a;
  }

  function hubGroups(rowsWrap, specs) {
    // rowsWrap: container holding the design's group rows (div with border-top)
    const rows = [...rowsWrap.children];
    const rowTpl = rows[0];
    const linkTpl = rowTpl.querySelector('a');
    const icons = {};
    rows.forEach(r => r.querySelectorAll('a').forEach(a => { const f = productFileOfHref(a.getAttribute('href')); if (f) icons[f] = a.querySelector(':scope > span:first-child').cloneNode(true); }));
    const out = specs.map(sp => {
      const r = rowTpl.cloneNode(true);
      const h2 = r.querySelector('h2');
      if (sp.href) { h2.textContent = ''; const a = el('a', 'color: inherit;', sp.title); a.setAttribute('href', sp.href); h2.appendChild(a); }
      else h2.textContent = sp.title;
      const grid = r.querySelector(':scope > div:nth-child(2)');
      grid.innerHTML = '';
      sp.items.forEach(f => { const a = hubRow(linkTpl, f); if (icons[f]) a.querySelector(':scope > span:first-child').replaceWith(icons[f].cloneNode(true)); grid.appendChild(a); });
      return r;
    });
    rowsWrap.replaceChildren(...out);
  }

  function regroupHub() {
    const sec = doc.querySelectorAll('main > section')[1];
    hubGroups(sec.querySelector(':scope > div'), cat.groups.map(g => ({ title: catLabel(g.cat), href: catHref(g.cat), items: g.sub.flatMap(s => s.items) })));
  }

  async function composeCategory() {
    const k = cfg.cat;
    const g = cat.groups.find(x => x.cat === k);
    const rep = cat.category_pages[k].rep;
    const main = doc.querySelector('main');
    const secs = [...main.children];
    const hero = secs[0], groupsSec = secs[1], platform = secs[2], cta = secs[3];
    // hero: definition sentence = blueprint meta for the category; image from the representative product page
    hero.querySelector('p').textContent = cfg.meta;
    const repDoc = await snapshot(rep);
    const repImg = repDoc.querySelector('main section img');
    const img = hero.querySelector('img');
    if (img && repImg) { img.setAttribute('src', repImg.getAttribute('src')); img.setAttribute('alt', repImg.getAttribute('alt')); }
    // product grid by sub-group
    const specs = g.sub.length > 1
      ? g.sub.map(s => ({ title: ES ? s.label_es : s.label, items: s.items }))
      : [{ title: T('Products', 'Productos'), items: g.sub[0].items }];
    hubGroups(groupsSec.querySelector(':scope > div'), specs);
    // sections reused from the design
    const pick = (d, sel) => { const s = d.querySelector(sel); return s ? imp(s) : null; };
    const agent = pick(repDoc, 'main section#agent');
    const story = pick(repDoc, 'main section#story');
    const resources = pick(repDoc, 'main section#resources');
    const home = await snapshot('index.html');
    const solH2 = [...home.querySelectorAll('main section h2')].find(h => /^(Solutions|Soluciones)$/.test(textOf(h)));
    const solutions = solH2 ? imp(solH2.closest('section')) : null;
    if (solutions) solutions.removeAttribute('id');
    // audit finding 14: the product map and Solutions grid stay on the hub and Home only
    main.replaceChildren(...[hero, groupsSec, agent, story, resources, cta].filter(Boolean));
  }

  function composeUtility() {
    // HTML sitemap and 404: hero + link groups, built from the Products hub layout.
    const main = doc.querySelector('main');
    const [hero, groupsSec, , cta] = [...main.children];
    hero.querySelector('p').textContent = cfg.intro;
    const rowsWrap = groupsSec.querySelector(':scope > div');
    const rowTpl = rowsWrap.children[0];
    const linkTpl = rowTpl.querySelector('a');
    const rows = cfg.linkGroups.map(gr => {
      const r = rowTpl.cloneNode(true);
      r.querySelector('h2').textContent = gr.title;
      const grid = r.querySelector(':scope > div:nth-child(2)');
      grid.innerHTML = '';
      gr.links.forEach(l => {
        const a = linkTpl.cloneNode(true);
        a.setAttribute('href', l.href);
        a.querySelector(':scope > span:first-child').innerHTML = '';
        const spans = a.querySelectorAll(':scope > span:nth-child(2) > span');
        spans[0].textContent = l.text;
        spans[1].textContent = l.note || '';
        if (!l.note) spans[1].remove();
        grid.appendChild(a);
      });
      return r;
    });
    rowsWrap.replaceChildren(...rows);
    main.replaceChildren(hero, groupsSec, cta);
  }

  async function homeCards() {
    const sec = doc.querySelector('main section#products');
    if (!sec) return;
    const grid = sec.querySelector(':scope > div > div:nth-child(2)');
    const cardsEl = [...grid.children];
    const tpl = cardsEl[0];
    const linkTpl = tpl.querySelector('a');
    const known = { aaa: cardsEl[0], bss: cardsEl[1] };
    const icons = {};
    cardsEl.forEach(cd => cd.querySelectorAll('a').forEach(x => { const f = productFileOfHref(x.getAttribute('href')); if (f && !icons[f]) icons[f] = x.querySelector(':scope > span:first-child').cloneNode(true); }));
    const out = [];
    for (const g of cat.groups) {
      const c = tpl.cloneNode(true);
      const info = cat.home_cards[g.cat];
      const src = known[g.cat];
      const img = c.querySelector('img');
      if (src) { const si = src.querySelector('img'); img.setAttribute('src', si.getAttribute('src')); img.setAttribute('alt', si.getAttribute('alt')); }
      else { const d = await snapshot(info.img_from); const ri = d.querySelector('main section img'); img.setAttribute('src', ri.getAttribute('src')); img.setAttribute('alt', ri.getAttribute('alt')); }
      const h3 = c.querySelector('h3'); h3.textContent = ''; const ha = el('a', 'color: inherit;', catLabel(g.cat)); ha.setAttribute('href', 'CAT:' + g.cat); h3.appendChild(ha);
      c.querySelector('p').textContent = src ? textOf(src.querySelector('p')) : (ES ? info.desc_es : info.desc);
      const list = c.querySelector(':scope > div:nth-child(3)');
      list.innerHTML = '';
      g.sub.flatMap(s => s.items).forEach(f => { const a = linkTpl.cloneNode(true); a.setAttribute('href', f); a.querySelector(':scope > span:nth-child(2) > span').textContent = cat.products[f].label; const ic = a.querySelector(':scope > span:first-child');
        if (icons[f]) ic.replaceWith(icons[f].cloneNode(true));
        else { const m = [...doc.querySelectorAll('.mp a.mt')].find(x => productFileOfHref(x.getAttribute('href')) === f); const svg = m && m.querySelector(':scope > span:first-child svg'); if (svg) ic.replaceChildren(svg.cloneNode(true)); }
        list.appendChild(a); });
      out.push(c);
    }
    grid.replaceChildren(...out);
    grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(min(360px, 100%), 1fr))';
    out.forEach(c => c.querySelectorAll('a[href^="CAT:"]').forEach(a => a.setAttribute('href', catHref(a.getAttribute('href').slice(4)))));
    const sub = sec.querySelector('p');
    if (sub && cfg.homeProductsSub) sub.textContent = cfg.homeProductsSub;
  }

  function servicesSections() {
    for (const [from, to] of Object.entries(cfg.anchors['services.html'] || {})) {
      const e = doc.getElementById(from); if (e) e.id = to;
    }
    const integ = doc.getElementById('integration');
    if (!integ) return;
    const cs = integ.cloneNode(true);
    cs.id = 'customer-success';
    const c = cat.customer_success[L];
    cs.querySelector('h2').textContent = c.h2;
    cs.querySelector('p').textContent = c.p;
    const items = cs.querySelectorAll('li');
    items.forEach((li, i) => { if (c.li[i] != null) li.querySelector('span:last-child').textContent = c.li[i]; else li.remove(); });
    const supIcon = doc.querySelector('#support > div:first-child > span');
    if (supIcon) cs.querySelector(':scope > div:first-child > span').replaceWith(supIcon.cloneNode(true));
    integ.parentNode.insertBefore(cs, integ.nextSibling);
    doc.querySelectorAll('main [id]').forEach(e => { if (e.tagName !== 'SECTION' && e.id !== 'main') e.style.scrollMarginTop = '136px'; });
  }
};
