// Builds the public site (alepo-site/public) from the design snapshot (alepo-redesign/).
// Usage: node alepo-site/build/build.mjs
// Needs Playwright with Chromium. Serves the snapshot on a local port while it runs.
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// require() so a globally installed Playwright is found through NODE_PATH as well as a local one
const { chromium } = createRequire(import.meta.url)('playwright');
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const SNAP = path.join(ROOT, 'alepo-redesign');
const OUT = path.join(HERE, '..', 'public');
const ORIGIN = 'https://alepo.com';
const read = f => JSON.parse(fs.readFileSync(path.join(HERE, f), 'utf8'));
const urls = read('urls.json');
const catalog = read('catalog.json');
const ov = read('overrides.json');
const siteConfig = read('site-config.json');
const TODAY = new Date().toISOString().slice(0, 10);
const bp = Object.fromEntries(read('source/blueprint.json').map(p => [p.id.padStart(2, '0'), p]));

// ---------- page data ----------
const NO_SUFFIX = new Set(['08', '12']); // blueprint: brand pages skip " | Alepo"
function pageData(id, lang) {
  const b = bp[id] || {};
  const o = (ov[lang] || {})[id] || {};
  const oe = ov.en[id] || {};
  if (lang === 'en') {
    const title = oe.title || (b.title_en + (NO_SUFFIX.has(id) ? '' : ' | Alepo'));
    return { title, meta: oe.meta || b.meta_en, h1: oe.h1 || b.h1_en };
  }
  return { title: o.title, meta: o.meta, h1: o.h1 };
}
const pad = id => id.padStart(2, '0');

// ---------- static server for the snapshot ----------
const MIME = { '.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const p = path.join(SNAP, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(SNAP) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, r));
const BASE = `http://localhost:${server.address().port}`;

const schema = {
  organization: {
    '@context': 'https://schema.org', '@type': 'Organization', name: 'Alepo Technologies', url: ORIGIN + '/',
    logo: ORIGIN + '/assets/img/3e3ebf594e76d8759bbe4ff47f7c56dc.svg',
    address: { '@type': 'PostalAddress', streetAddress: '1606 Headway Circle, Suite #9137', addressLocality: 'Austin', addressRegion: 'TX', postalCode: '78754', addressCountry: 'US' },
    contactPoint: [
      { '@type': 'ContactPoint', telephone: '+1-737-313-3952', contactType: 'technical support', areaServed: 'US', availableLanguage: ['en', 'es'] },
      { '@type': 'ContactPoint', telephone: '+91-22-61085013', contactType: 'technical support', areaServed: 'IN', availableLanguage: 'en' }
    ]
  },
  website: { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Alepo', url: ORIGIN + '/', inLanguage: ['en', 'es'] }
};

const jobs = [];
for (const [file, info] of Object.entries(urls.pages)) {
  const id = pad(info.id);
  for (const lang of ['en', 'es']) {
    const pre = lang === 'es' ? '/es' : '';
    const d = pageData(id, lang);
    let crumbs = null;
    const catKey = info.cat;
    const catLabel = k => lang === 'es' ? urls.categories[k].label_es : urls.categories[k].label;
    const home = { name: lang === 'es' ? 'Inicio' : 'Home', href: 'index.html' };
    const products = { name: lang === 'es' ? 'Productos' : 'Products', href: 'products.html' };
    if (file.startsWith('p-')) crumbs = [home, products, { name: catLabel(catKey), href: pre + urls.categories[catKey].url }, { name: catalog.products[file].label }];
    if (file === 'ai.html') crumbs = [home, products, { name: catLabel('ai') }];
    jobs.push({ file, lang, cfg: { kind: 'page', file, id, lang, ...d, eyebrow: catalog.eyebrow[file] || null, crumbs, productLabel: file.startsWith('p-') ? catalog.products[file].label : null,
      self: pre + info.url, alt: { en: info.url, es: '/es' + info.url }, isHome: file === 'index.html' }, out: pre + info.url });
  }
}
for (const [k, c] of Object.entries(urls.categories)) {
  if (k === 'ai') continue; // AI for Telecom is the design's AI page (ai.html)
  for (const lang of ['en', 'es']) {
    const pre = lang === 'es' ? '/es' : '';
    const d = pageData(pad(c.id), lang);
    const label = lang === 'es' ? c.label_es : c.label;
    jobs.push({ file: 'products.html', lang, cfg: { kind: 'category', cat: k, file: 'products.html', id: c.id, lang, ...d,
      crumbs: [{ name: lang === 'es' ? 'Inicio' : 'Home', href: 'index.html' }, { name: lang === 'es' ? 'Productos' : 'Products', href: 'products.html' }, { name: label }],
      self: pre + c.url, alt: { en: c.url, es: '/es' + c.url } }, out: pre + c.url });
  }
}

// HTML sitemap (T7) and 404 (T8)
function sitemapGroups(lang) {
  const pre = lang === 'es' ? '/es' : '';
  const tl = f => { const id = pad(urls.pages[f].id); return pageData(id, lang).h1; };
  const L = (en, es) => lang === 'es' ? es : en;
  const link = f => ({ text: f.startsWith('p-') ? catalog.products[f].label : tl(f), href: pre + urls.pages[f].url });
  const catLink = k => ({ text: lang === 'es' ? urls.categories[k].label_es : urls.categories[k].label, href: pre + urls.categories[k].url });
  const groups = [{ title: L('Main pages', 'Páginas principales'), links: ['index.html', 'products.html', 'solutions.html', 'services.html', 'contact.html'].map(link) }];
  for (const g of catalog.groups) groups.push({ title: (catLink(g.cat)).text, links: [catLink(g.cat), ...g.sub.flatMap(s => s.items).map(link)] });
  groups.push({ title: L('Solutions', 'Soluciones'), links: ['s-ftth.html', 's-mno.html', 's-mvno.html', 's-wifi.html', 's-ent.html'].map(link) });
  groups.push({ title: L('Resources', 'Recursos'), links: ['resources.html', 'blog.html', 'library.html', 'customers.html', 'news.html'].map(link) });
  groups.push({ title: L('Company', 'Empresa'), links: ['about.html', 'leadership.html', 'partners.html', 'security.html', 'careers.html'].map(link) });
  return groups;
}
for (const lang of ['en', 'es']) {
  const pre = lang === 'es' ? '/es' : '';
  const L = (en, es) => lang === 'es' ? es : en;
  const home = { name: L('Home', 'Inicio'), href: 'index.html' };
  jobs.push({ file: 'products.html', lang, out: pre + '/sitemap/', cfg: { kind: 'utility', file: 'products.html', lang,
    h1: L('Sitemap', 'Mapa del sitio'), title: L('Sitemap | Alepo', 'Mapa del sitio | Alepo'),
    meta: L('Every page on alepo.com: products by group, solutions, services, resources and company pages.', 'Todas las páginas de alepo.com: productos por grupo, soluciones, servicios, recursos y empresa.'),
    intro: L('Every page on this site, grouped the same way as the menus.', 'Todas las páginas de este sitio, agrupadas igual que los menús.'),
    crumbs: [home, { name: L('Sitemap', 'Mapa del sitio') }], linkGroups: sitemapGroups(lang),
    self: pre + '/sitemap/', alt: { en: '/sitemap/', es: '/es/sitemap/' } } });
  jobs.push({ file: 'products.html', lang, out: pre + '/404.html', cfg: { kind: 'utility', file: 'products.html', lang, noindex: true,
    h1: L('Page not found', 'Página no encontrada'), title: L('Page Not Found | Alepo', 'Página no encontrada | Alepo'),
    meta: L('The page you asked for is not on alepo.com.', 'La página que buscó no está en alepo.com.'),
    intro: L('The page may have moved. These are the most visited places on the site.', 'Es posible que la página se haya movido. Estos son los lugares más visitados del sitio.'),
    crumbs: [home, { name: L('Page not found', 'Página no encontrada') }],
    linkGroups: [{ title: L('Top tasks', 'Tareas principales'), links: [
      { text: L('Products', 'Productos'), href: pre + '/products/' }, { text: L('Solutions', 'Soluciones'), href: pre + '/solutions/' },
      { text: L('Contact Alepo', 'Contacto con Alepo'), href: pre + '/contact-us/' }, { text: L('Sitemap', 'Mapa del sitio'), href: pre + '/sitemap/' }] }],
    self: pre + '/404.html', alt: null } });
}

// Privacy Policy and Cookie Policy: the text published on alepo.com (build/fetch_company.py), at the same addresses
for (const lang of ['en', 'es']) {
  const pre = lang === 'es' ? '/es' : '';
  const L = (en, es) => lang === 'es' ? es : en;
  for (const [slug, legal, en, es, metaEn, metaEs] of [
    ['privacy-policy', 'privacy', 'Privacy Policy', 'Política de privacidad', 'How Alepo collects, uses and protects personal information on alepo.com.', 'Cómo Alepo recopila, usa y protege la información personal en alepo.com.'],
    ['cookie-policy', 'cookie', 'Cookie Policy', 'Política de cookies', 'Which cookies alepo.com uses and how to turn them off.', 'Qué cookies usa alepo.com y cómo desactivarlas.']]) {
    jobs.push({ file: 'products.html', lang, out: `${pre}/${slug}/`, cfg: { kind: 'utility', file: 'products.html', lang, legal,
      h1: L(en, es), title: L(`${en} | Alepo`, `${es} | Alepo`), meta: L(metaEn, metaEs),
      intro: L(metaEn, metaEs + ' El texto legal se publica en inglés.'),
      crumbs: [{ name: L('Home', 'Inicio'), href: 'index.html' }, { name: L(en, es) }], linkGroups: [],
      self: `${pre}/${slug}/`, alt: { en: `/${slug}/`, es: `/es/${slug}/` } } });
  }
}

// Accessibility statement: from the team package (its wording still needs sign-off)
for (const lang of ['en', 'es']) {
  const pre = lang === 'es' ? '/es' : '';
  const L = (en, es) => lang === 'es' ? es : en;
  jobs.push({ file: 'products.html', lang, out: `${pre}/accessibility/`, cfg: { kind: 'utility', file: 'products.html', lang, legal: 'accessibility.' + lang,
    h1: L('Accessibility statement', 'Declaración de accesibilidad'), title: L('Accessibility Statement | Alepo', 'Declaración de accesibilidad | Alepo'),
    meta: L('How Alepo works to make this website usable for everyone, the standard it aims to meet and how to tell us about a barrier.', 'Cómo trabaja Alepo para que este sitio web sirva a todas las personas, el estándar que busca cumplir y cómo avisarnos de una barrera.'),
    intro: L('How Alepo works to make this website usable for everyone.', 'Cómo trabaja Alepo para que este sitio web sirva a todas las personas.'),
    crumbs: [{ name: L('Home', 'Inicio'), href: 'index.html' }, { name: L('Accessibility statement', 'Declaración de accesibilidad') }], linkGroups: [],
    self: `${pre}/accessibility/`, alt: { en: '/accessibility/', es: '/es/accessibility/' } } });
}

// Thank-you page (blueprint T4; audit finding 1): noindex, offers next steps
for (const lang of ['en', 'es']) {
  const pre = lang === 'es' ? '/es' : '';
  const L = (en, es) => lang === 'es' ? es : en;
  jobs.push({ file: 'products.html', lang, out: pre + '/contact-us/thank-you/', cfg: { kind: 'utility', file: 'products.html', lang, noindex: true,
    h1: L('Thank you', 'Gracias'), title: L('Thank You | Alepo', 'Gracias | Alepo'),
    meta: L('Your request reached Alepo.', 'Su solicitud llegó a Alepo.'),
    intro: L('Your request reached us. A specialist reads it and contacts you to agree a time.', 'Su solicitud nos llegó. Un especialista la lee y le contacta para acordar un horario.'),
    crumbs: [{ name: L('Home', 'Inicio'), href: 'index.html' }, { name: L('Contact', 'Contacto'), href: 'contact.html' }, { name: L('Thank you', 'Gracias') }],
    linkGroups: [{ title: L('While you wait', 'Mientras tanto'), links: [
      { text: L('Data sheets and white papers', 'Fichas técnicas y documentos'), href: pre + '/library/' },
      { text: L('Customer stories', 'Casos de clientes'), href: pre + '/customers/' },
      { text: L('All products', 'Todos los productos'), href: pre + '/products/' },
      { text: L('Services and support', 'Servicios y soporte'), href: pre + '/services/' }] }],
    self: pre + '/contact-us/thank-you/', alt: { en: '/contact-us/thank-you/', es: '/es/contact-us/thank-you/' } } });
}

// ---------- the website copy deck (24 Nov 2026): page models made by copy/parse.py ----------
const COPY = { en: {}, es: {} };
for (const lang of ['en', 'es']) {
  const dir = path.join(HERE, 'copy', lang);
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'strings.json')) {
    const m = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    COPY[lang][m.source.startsWith('02-') ? '_nav' : m.url] = m;
  }
}
const plainCopy = t => String(t || '').replace(/\{\{link:[^|]*\|([^}]*)\}\}/g, '$1').replace(/\*\*/g, '').trim();
const copyFor = (lang, enPath) => (COPY[lang] && COPY[lang][enPath]) || (lang === 'es' ? null : null);
// the thank-you page is written inside 17 · Contact
for (const lang of ['en', 'es']) {
  const c = COPY[lang]['/contact-us/']; if (!c) continue;
  const t = c.sections.find(s => s.role === 'thanks'); if (!t) continue;
  const ps = t.blocks.filter(b => b.t === 'p');
  COPY[lang]['/contact-us/thank-you/'] = { source: '17-contact-thanks', url: '/contact-us/thank-you/', sections: [],
    hero: { crumbs: null, h1: plainCopy(ps[0].text).replace(/^H1:\s*/, ''), lede: ps.slice(1).map(b => b.text), buttons: [], subnav: [], extra: t.blocks.filter(b => b.t === 'more') } };
}
// every page and post the copy links to: dates, for the lists that show them; leadership photos by name
const DATES = { news: {}, posts: {} };
for (const x of JSON.parse(fs.readFileSync(path.join(HERE, 'news/items.json'), 'utf8'))) DATES.news[x.url] = x.date;
for (const x of JSON.parse(fs.readFileSync(path.join(HERE, 'blog/posts.json'), 'utf8'))) DATES.posts[x.url] = x.date;
const LEADERS = JSON.parse(fs.readFileSync(path.join(HERE, 'legal/leaders.json'), 'utf8'));
const leaderPhoto = name => { const w = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/); for (const k of [w.join('-'), w[0] + '-' + w[w.length - 1], w[0]]) if (LEADERS[k]) return '/assets/img/' + LEADERS[k]; return null; };

// ---------- blog: the copy's titles for retitled posts, a topic per post, and crawlable pages of 24 ----------
const POSTS_ALL = JSON.parse(fs.readFileSync(path.join(HERE, 'blog/posts.json'), 'utf8'));
const BLOG_PER = 24;
const TOPIC_RULES = [['tacacs', /TACACS/i], ['mvno', /\bMVN[OE]s?\b/i], ['wifi', /Wi-?Fi|hotspot|captive portal|offload/i],
  ['prov', /provision|TR-?069|TR-?369|\bUSP\b|\bONTs?\b|router|\bCPE\b|device management|service activation/i],
  ['charging', /charging|\bOCS\b|policy control|PCRF|\bPCF\b|prepaid|voucher|top-?up|rating/i],
  ['bss', /\bBSS\b|billing|invoice|dunning|collections|settlement|\bCRM\b|self-care|revenue|mediation/i],
  ['radius', /RADIUS|\bAAA\b|Diameter|authentication|\bHSS\b|subscriber data|\bEAP\b|802\.1X|\bNAS\b/i]];
const CAT_TOPIC = { 'TACACS+': 'tacacs', 'WiFi Monetization': 'wifi', 'Converged Policy Control': 'charging', 'Business Support Systems': 'bss', 'Digital BSS': 'bss',
  'AAA server': 'radius', 'Network Access Control': 'radius', 'RADIUS AAA Basics': 'radius', 'Subscriber Data Management': 'radius' };
const topicOf = p => { for (const [k, rx] of TOPIC_RULES) if (rx.test(p.title)) return k; for (const c of p.categories || []) if (CAT_TOPIC[c]) return CAT_TOPIC[c]; return null; };
const blogModel = COPY.en['/blog/'];
const RETITLE = {};
if (blogModel) for (const b of blogModel.sections.flatMap(s => s.blocks)) if (b.t === 'table' && b.kind === 'posts') b.rows.forEach((r, i) => { if (b.hrefs[i]) RETITLE[b.hrefs[i]] = plainCopy(r[1]); });
const POSTS = POSTS_ALL.map(p => ({ ...p, title: RETITLE[p.url] || p.title, liveTitle: p.title, topic: topicOf(p) }));
const BLOG_PAGES = Math.ceil(POSTS.length / BLOG_PER);
for (const j of jobs.filter(j => j.file === 'blog.html' && !j.cfg.blogPage)) {
  j.cfg.blogPage = 1;
  for (let n = 2; n <= BLOG_PAGES; n++) {
    const pre = j.lang === 'es' ? '/es' : '';
    jobs.push({ file: 'blog.html', lang: j.lang, out: `${pre}/blog/page/${n}/`, cfg: { ...j.cfg, blogPage: n, paged: true,
      self: `${pre}/blog/page/${n}/`, alt: { en: `/blog/page/${n}/`, es: `/es/blog/page/${n}/` } } });
  }
}

// ---------- render ----------
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.cpSync(path.join(SNAP, 'assets'), path.join(OUT, 'assets'), { recursive: true });
fs.cpSync(path.join(HERE, 'static'), path.join(OUT, 'assets'), { recursive: true });

const browser = await chromium.launch();
const shared = { urls: urls.pages, categories: urls.categories, anchors: urls.anchors, catalog, origin: ORIGIN, schema, siteConfig, today: TODAY };
const report = [];
const mergeTotals = {};
for (const j of jobs) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto(`${BASE}/${j.lang === 'es' ? 'es/' : ''}${j.file}`, { waitUntil: 'domcontentloaded' });
  await page.addScriptTag({ path: path.join(HERE, 'transform.js') });
  await page.addScriptTag({ path: path.join(HERE, 'leadfixes.js') });
  await page.addScriptTag({ path: path.join(HERE, 'uifixes.js') });
  await page.addScriptTag({ path: path.join(HERE, 'merge.js') });
  await page.addScriptTag({ path: path.join(HERE, 'polish.js') });
  await page.addScriptTag({ path: path.join(HERE, 'copy', 'render.js') });
  // collected content from alepo.com (fetch_blog.py, fetch_resources.py)
  const data = f => { const p = path.join(HERE, f); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null; };
  const blogPosts = j.file === 'blog.html' ? (j.cfg.blogPage > 1 ? POSTS.slice((j.cfg.blogPage - 1) * BLOG_PER, j.cfg.blogPage * BLOG_PER) : POSTS) : null;
  // every page: post dates and photos for "Latest posts" lists, the newest news item, leadership photos, legal text
  const blogIndex = Object.fromEntries((data('blog/posts.json') || []).map(p => [p.url, { date: p.date, image: p.image, w: p.w, h: p.h }]));
  const latestNews = (data('news/items.json') || []).filter(x => !/\bSE 14\b/.test(x.title))[0] || null;
  const leaders = j.file === 'leadership.html' ? data('legal/leaders.json') : null;
  const legalHtml = j.cfg.legal ? fs.readFileSync(path.join(HERE, 'legal', j.cfg.legal + '.html'), 'utf8') : null;
  // the team package's content and SEO for this page (build/merge.js)
  const pkgKey = j.cfg.kind === 'category' ? { aaa: 'h-c-access', bss: 'h-c-billing', prov: 'h-c-provisioning', care: 'h-c-care' }[j.cfg.cat]
    : /thank-you/.test(j.out || '') ? 'h-thanks' : j.cfg.kind === 'utility' ? null : j.file === 'index.html' ? 'Main' : 'h-' + j.file.replace(/\.html$/, '');
  const PKG = data('merge/package-v1.json');
  // pages with no counterpart in the package (legal, sitemap, 404, accessibility) still get its menu, footer, names and Spanish fixes
  const merge = PKG ? { key: pkgKey && PKG.pages[pkgKey] ? pkgKey : '_chrome', page: pkgKey && PKG.pages[pkgKey] ? PKG.pages[pkgKey][j.lang === 'es' ? 'es' : 'en'] : {}, chromePairs: PKG.chromePairs,
    edits: PKG.edits.filter(e => !e.files || (pkgKey && e.files.includes(pkgKey)) || e.files.includes('_header') || e.files.includes('_footer')),
    drops: PKG.drops.filter(d => d.g === 'datasheets' || (pkgKey && (!d.files || d.files.includes(pkgKey)))), prod: PKG.prod, groups: PKG.groups, spanish: PKG.spanish, qaHead: PKG.qaHead, guides: PKG.guides, guideHead: PKG.guideHead } : null;
  // team package: data sheets withdrawn until Sandeep Patel approves new versions; SE 14 held (multitenant claim)
  const LIB_NEW_NAME = { 'Converged Policy Control Datasheet': 'Policy Control Datasheet', 'WiFi Monetization Datasheet': 'Wi-Fi Offload and Calling Datasheet',
    'BSS Now Datasheet': 'BSS in a Box Datasheet', 'AI Powered CX Datasheet': 'AI Customer Assistant Datasheet' }; // the last two decided 24 Nov 2026
  const libOrder = (COPY.en['/library/'] || { sections: [] }).sections.flatMap(s => s.blocks).filter(b => b.kind === 'library').flatMap(b => b.hrefs || []);
  const libTitle = Object.fromEntries((COPY.en['/library/'] || { sections: [] }).sections.flatMap(s => s.blocks).filter(b => b.kind === 'library').flatMap(b => b.rows.map((r, i) => [b.hrefs[i], plainCopy(r[1]).replace(/\s*\(was .*\)$/, '')])));
  const libraryItems = j.file === 'library.html' ? (data('library/items.json') || []).map(x => ({ ...x, title: libTitle[x.url] || LIB_NEW_NAME[x.title] || x.title }))
    .sort((a, b) => (libOrder.includes(a.url) ? libOrder.indexOf(a.url) : 999) - (libOrder.includes(b.url) ? libOrder.indexOf(b.url) : 999)) : null;
  const newsItems = j.file === 'news.html' ? (data('news/items.json') || []).filter(x => !/\bSE 14\b/.test(x.title)) : null;
  // the copy deck replaces the page's words; the team package merge is no longer applied (the copy deck supersedes it)
  const enPath = ((j.cfg.self || '').replace(/^\/es(?=\/)/, '') || (j.out || '').replace(/^\/es(?=\/)/, '')).replace(/^\/blog\/page\/\d+\/$/, '/blog/');
  const model = COPY[j.lang][enPath] || null;
  const nav = COPY[j.lang]._nav || COPY.en._nav || null;
  if (model) {
    if (model.title) j.cfg.title = plainCopy(model.title);
    if (j.cfg.blogPage > 1) j.cfg.title = j.cfg.title.replace(/\s*\|\s*Alepo$/, '') + (j.lang === 'es' ? ` Página ${j.cfg.blogPage}` : ` Page ${j.cfg.blogPage}`) + ' | Alepo';
    if (model.desc) j.cfg.meta = plainCopy(model.desc);
    if (j.cfg.blogPage > 1) j.cfg.meta = (j.lang === 'es' ? `Página ${j.cfg.blogPage} de ${BLOG_PAGES}. ` : `Page ${j.cfg.blogPage} of ${BLOG_PAGES}. `) + j.cfg.meta.replace(/:.*$/, '.');
    if (model.hero && model.hero.h1) j.cfg.h1 = plainCopy(model.hero.h1);
  }
  const home = COPY[j.lang]['/'] || COPY.en['/'];
  const newsTable = home && home.sections.flatMap(s => s.blocks).find(b => b.t === 'table' && b.kind === 'newsrows');
  const topNews = newsTable ? { title: plainCopy(newsTable.rows[0][1]).replace(/\s*·\s*(Read|Leer)\s*→$/, ''), href: newsTable.hrefs[0] } : null;
  const leadersData = model && model.sections ? Object.fromEntries(model.sections.flatMap(s => s.blocks).filter(b => b.kind === 'people').flatMap(b => b.rows.map(r => [plainCopy(r[0]), leaderPhoto(plainCopy(r[0]))]))) : {};
  // the sitemap page lists every copy page under its H1, in the menu's groups
  const sitemapPages = /\/sitemap\/$/.test(j.cfg.self || '') ? Object.values(COPY[j.lang]).filter(m => m.url && m.hero && m.hero.h1 && !/thank-you/.test(m.url)).map(m => ({ url: m.url, h1: plainCopy(m.hero.h1), n: m.source })) : null;
  const blog = j.file === 'blog.html' ? { page: j.cfg.blogPage, pages: BLOG_PAGES, per: BLOG_PER, topics: Object.fromEntries(POSTS.map(p => [p.url, p.topic])) } : null;
  // newsletter consent: the consent line of 17 · Contact (added to the footer form on request, 24 Nov 2026)
  const contactM = COPY[j.lang]['/contact-us/'] || COPY.en['/contact-us/'];
  const consentLine = contactM ? (contactM.sections.find(x => x.role === 'form').blocks.flatMap(b => b.t === 'sub' ? b.blocks : [b]).find(b => b.t === 'p') || {}).text : null;
  const copy = (model || nav) ? { page: model, nav, topNews, blog, sitemapPages, consentLine, products: enPath === '/' ? (COPY[j.lang]['/products/'] || COPY.en['/products/']) : null, data: { news: DATES.news, posts: DATES.posts, leaders: leadersData } } : null;
  let html = await page.evaluate(c => window.__alepo(c), { ...shared, ...j.cfg, blogPosts, libraryItems, newsItems, blogIndex, latestNews, leaders, legalHtml, merge: copy ? null : merge, copy });
  const mr = html.match(/ data-merge="([^"]*)"/);
  if (mr) { const r = JSON.parse(mr[1].replace(/&quot;/g, '"')); for (const k in r) mergeTotals[k] = (mergeTotals[k] || 0) + r[k]; html = html.replace(mr[0], ''); }
  await page.close();
  const dest = j.out.endsWith('.html') ? path.join(OUT, j.out) : path.join(OUT, j.out, 'index.html');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, html);
  report.push({ out: j.out, lang: j.lang, title: j.cfg.title, meta: j.cfg.meta, h1: j.cfg.h1, errs });
  if (errs.length) console.error('ERR', j.out, errs);
}
await browser.close();
server.close();
console.log('team package merged:', JSON.stringify(mergeTotals));

// ---------- sitemap.xml, robots.txt, redirects, llms.txt ----------
const indexable = jobs.filter(j => j.cfg.alt && !j.cfg.noindex && !j.cfg.paged && j.lang === 'en');
const sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'];
for (const j of indexable) for (const loc of [j.cfg.alt.en, j.cfg.alt.es]) {
  sm.push(`  <url><loc>${ORIGIN}${loc}</loc><lastmod>${TODAY}</lastmod>` +
    `<xhtml:link rel="alternate" hreflang="en" href="${ORIGIN}${j.cfg.alt.en}"/>` +
    `<xhtml:link rel="alternate" hreflang="es" href="${ORIGIN}${j.cfg.alt.es}"/>` +
    `<xhtml:link rel="alternate" hreflang="x-default" href="${ORIGIN}${j.cfg.alt.en}"/></url>`);
}
sm.push('</urlset>');
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), sm.join('\n') + '\n');
// security.txt, as the Security page (11 · Security) says it is published (RFC 9116); renew "Expires" within a year
fs.mkdirSync(path.join(OUT, '.well-known'), { recursive: true });
const secExp = new Date(Date.now() + 360 * 864e5).toISOString().replace(/\.\d+Z$/, 'Z');
fs.writeFileSync(path.join(OUT, '.well-known', 'security.txt'), `Contact: mailto:security@alepo.com\nExpires: ${secExp}\nPreferred-Languages: en, es\nCanonical: ${ORIGIN}/.well-known/security.txt\nPolicy: ${ORIGIN}/company/security/#vulnerability-disclosure\n`);
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`);
fs.copyFileSync(path.join(HERE, 'redirects.csv'), path.join(OUT, 'redirects.csv'));
const red = fs.readFileSync(path.join(HERE, 'redirects.csv'), 'utf8').trim().split('\n').slice(1).map(l => l.split(','))
  .filter(([from, to, status]) => status === '301');
fs.writeFileSync(path.join(OUT, '_redirects'), red.map(([from, to]) => `${from} ${to} 301`).join('\n') + '\n/es/* /es/404.html 404\n/* /404.html 404\n');
// note for hosts other than server.mjs: /blog/<post>/, /news/<item>/, /library/<item>/, /credits/ and /legal-agreements/ go to the WordPress site (LEGACY_ORIGIN)
const llms = ['# Alepo', '', '> Alepo makes network access, billing, provisioning and customer care software for communication service providers, with AI built in. Operators of every size run it, from MVNOs preparing a launch to tier-1 groups with millions of subscribers on several continents.', ''];
for (const j of indexable) llms.push(`- [${j.cfg.h1}](${ORIGIN}${j.cfg.alt.en}): ${j.cfg.meta}`);
fs.writeFileSync(path.join(OUT, 'llms.txt'), llms.join('\n') + '\n');
fs.writeFileSync(path.join(HERE, 'last-build.json'), JSON.stringify(report, null, 1));
// products the data sheet emails can name (slug -> label), for alepo-site/server
const productsForServer = {};
for (const [file, info] of Object.entries(urls.pages)) if (file.startsWith('p-')) productsForServer[info.url.split('/').filter(Boolean).pop()] = { label: catalog.products[file].label, url: info.url };
fs.writeFileSync(path.join(HERE, '..', 'server', 'products.json'), JSON.stringify(productsForServer, null, 2) + '\n');
const pdfDir = path.join(HERE, 'static', 'datasheets', 'en');
const missingPdf = Object.keys(productsForServer).filter(s => !fs.existsSync(path.join(pdfDir, s + '.pdf')));
if (missingPdf.length) console.log(`data sheet PDFs missing (${missingPdf.length}/${Object.keys(productsForServer).length}): put them in build/static/datasheets/en/<slug>.pdf`);

// past events are hidden (polish.js); while the newsroom lists none, links to /news/#events open the newsroom itself
for (const pre of ['', '/es']) {
  const newsPage = path.join(OUT, pre, 'news', 'index.html');
  if (fs.existsSync(newsPage) && !fs.readFileSync(newsPage, 'utf8').includes('id="events"')) {
    const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.html') ? [path.join(d, e.name)] : []);
    for (const f of walk(OUT)) {
      const s = fs.readFileSync(f, 'utf8'), t = s.split(`"${pre}/news/#events"`).join(`"${pre}/news/"`);
      if (t !== s) fs.writeFileSync(f, t);
    }
  }
}

// descriptive WebP images with fixed dimensions (blueprint 6.1)
const { execFileSync } = await import('node:child_process');
process.stdout.write(execFileSync('python3', [path.join(HERE, 'images.py')]).toString().split('\n')[0] + '\n');
process.stdout.write(execFileSync('python3', [path.join(HERE, 'finish.py')]).toString().split('\n').filter(Boolean).at(-1) + '\n');
console.log(`built ${jobs.length} pages into ${path.relative(ROOT, OUT)}`);
