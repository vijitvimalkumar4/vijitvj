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

// ---------- render ----------
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.cpSync(path.join(SNAP, 'assets'), path.join(OUT, 'assets'), { recursive: true });
fs.cpSync(path.join(HERE, 'static'), path.join(OUT, 'assets'), { recursive: true });

const browser = await chromium.launch();
const shared = { urls: urls.pages, categories: urls.categories, anchors: urls.anchors, catalog, origin: ORIGIN, schema, siteConfig, today: TODAY };
const report = [];
for (const j of jobs) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto(`${BASE}/${j.lang === 'es' ? 'es/' : ''}${j.file}`, { waitUntil: 'domcontentloaded' });
  await page.addScriptTag({ path: path.join(HERE, 'transform.js') });
  await page.addScriptTag({ path: path.join(HERE, 'leadfixes.js') });
  await page.addScriptTag({ path: path.join(HERE, 'uifixes.js') });
  const html = await page.evaluate(c => window.__alepo(c), { ...shared, ...j.cfg });
  await page.close();
  const dest = j.out.endsWith('.html') ? path.join(OUT, j.out) : path.join(OUT, j.out, 'index.html');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, html);
  report.push({ out: j.out, lang: j.lang, title: j.cfg.title, meta: j.cfg.meta, h1: j.cfg.h1, errs });
  if (errs.length) console.error('ERR', j.out, errs);
}
await browser.close();
server.close();

// ---------- sitemap.xml, robots.txt, redirects, llms.txt ----------
const indexable = jobs.filter(j => j.cfg.alt && !j.cfg.noindex && j.lang === 'en');
const sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'];
for (const j of indexable) for (const loc of [j.cfg.alt.en, j.cfg.alt.es]) {
  sm.push(`  <url><loc>${ORIGIN}${loc}</loc>` +
    `<xhtml:link rel="alternate" hreflang="en" href="${ORIGIN}${j.cfg.alt.en}"/>` +
    `<xhtml:link rel="alternate" hreflang="es" href="${ORIGIN}${j.cfg.alt.es}"/>` +
    `<xhtml:link rel="alternate" hreflang="x-default" href="${ORIGIN}${j.cfg.alt.en}"/></url>`);
}
sm.push('</urlset>');
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), sm.join('\n') + '\n');
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`);
fs.copyFileSync(path.join(HERE, 'redirects.csv'), path.join(OUT, 'redirects.csv'));
const red = fs.readFileSync(path.join(HERE, 'redirects.csv'), 'utf8').trim().split('\n').slice(1).map(l => l.split(','))
  .filter(([from, to, status]) => status === '301');
fs.writeFileSync(path.join(OUT, '_redirects'), red.map(([from, to]) => `${from} ${to} 301`).join('\n') + '\n/es/* /es/404.html 404\n/* /404.html 404\n');
const llms = ['# Alepo', '', '> AAA and BSS software for telecom operators and ISPs, with AI built in.', ''];
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

// descriptive WebP images with fixed dimensions (blueprint 6.1)
const { execFileSync } = await import('node:child_process');
process.stdout.write(execFileSync('python3', [path.join(HERE, 'images.py')]).toString().split('\n')[0] + '\n');
console.log(`built ${jobs.length} pages into ${path.relative(ROOT, OUT)}`);
