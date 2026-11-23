const S = process.argv[2], OUT = process.argv[3];
const fs = await import('node:fs');
const C = await import(S + '/src/lib/content.mjs');
const E = await import(S + '/src/lib/edits.mjs');
const Q = await import(S + '/src/lib/questions.mjs');
const A = await import(S + '/src/lib/arch.mjs');
const SP = await import(S + '/src/lib/spanish.mjs');
const SEO = await import(S + '/src/lib/seo.mjs');
const SITE = await import(S + '/src/lib/site.mjs');
const txt = n => (n ? n.text ?? (n.parts || []).filter(x => typeof x === 'string').join(' ') : '');
const boxes = page => (page.sections || []).filter(s => s.t === 'box');
const hero = page => boxes(page).find(s => s.tag !== 'nav');
const byId = (page, id) => boxes(page).find(s => s.id === id);
const ps = box => (box ? (box.children || []).filter(c => c.t === 'p').map(c => c.text).filter(x => typeof x === 'string') : []);
const findAll = (node, pred, out = []) => { if (Array.isArray(node)) node.forEach(n => findAll(n, pred, out)); else if (node && typeof node === 'object') { if (pred(node)) out.push(node); for (const v of Object.values(node)) if (typeof v === 'object') findAll(v, pred, out); } return out; };
const qaOf = page => findAll(page, n => n.t === 'box' && n.tag === 'details').map(d => [txt((d.children || []).find(c => c.t === 'h3')), txt((d.children || []).find(c => c.t === 'p'))]).filter(x => x[0] && x[1]);
// a simple HTML rendering for pages we add whole (accessibility statement)
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const render = (n) => {
  if (Array.isArray(n)) return n.map(render).join('');
  if (!n || typeof n !== 'object') return '';
  if (n.t === 'h2') return `<h2>${esc(n.text)}</h2>`; if (n.t === 'h3') return `<h3>${esc(n.text)}</h3>`;
  if (n.t === 'p') return `<p>${esc(n.text)}</p>`; if (n.t === 'li') return `<li>${esc(n.text)}</li>`;
  if (n.t === 'box' && (n.tag === 'ul' || n.tag === 'ol')) return `<${n.tag}>${render(n.children)}</${n.tag}>`;
  if (n.t === 'box') return render(n.children);
  if (n.t === 'a' && n.href && /^(mailto:|https?:)/.test(n.href)) return `<p><a href="${esc(n.href)}">${esc(txt(n))}</a></p>`;
  return '';
};
const files = Object.keys(SITE.ROUTES);
const out = { pages: {}, edits: E.EDITS.map(e => ({ g: e.g, files: e.files || null, en: e.en || null, es: e.es || null })), drops: E.DROPS, prod: {}, groups: A.GROUPS.map(g => ({ key: g.key, name: g.name, line: g.line, subs: (g.subs || []).map(s => s.name) })), spanish: { exact: SP.EXACT, phrases: SP.PHRASES }, routes: {}, guides: Q.GUIDES, guideHead: Q.GUIDE_HEAD, qaHead: Q.QA_HEAD };
for (const [f, p] of Object.entries(A.PROD)) out.prod[f] = { old: p.old, label: p.label, h1: p.h1, lede: p.lede };
for (const f of files) {
  out.routes[f] = { en: '/' + (SITE.routePath(f, 'en') ? SITE.routePath(f, 'en') + '/' : ''), es: '/' + SITE.routePath(f, 'es') + '/' };
  out.pages[f] = {};
  for (const lang of ['en', 'es']) {
    let fin; try { fin = C.loadPage(f, lang); } catch (e) { out.pages[f][lang] = { error: String(e).slice(0, 150) }; continue; }
    let raw = null; try { raw = C.readJson('pages/' + f + '.' + lang + '.json'); } catch (e) {}
    const seo = SEO.seoFor(f, lang, fin);
    const rec = { title: seo.title, desc: seo.description, h1: txt((hero(fin).children || []).find(c => c.t === 'h1')), lede: ps(hero(fin))[0] || null, qa: qaOf(fin), pairs: [] };
    if (raw) {
      const rh = hero(raw);
      if (rh) { const a = (rh.children || []).find(c => c.t === 'h1'); if (a && txt(a) !== rec.h1) rec.pairs.push([txt(a), rec.h1]); const rl = ps(rh)[0]; if (rl && rec.lede && rl !== rec.lede) rec.pairs.push([rl, rec.lede]); }
      for (const id of ['overview', 'agent']) {
        const r = ps(byId(raw, id)), o = ps(byId(fin, id === 'agent' ? 'agent' : id) || byId(fin, id === 'agent' ? 'ai' : id));
        r.forEach((t, i) => { if (o[i] !== undefined && o[i] !== t) rec.pairs.push([t, o[i]]); if (o[i] === undefined && id === 'overview') rec.pairs.push([t, '']); });
      }
    }
    if (f === 'h-accessibility' || f === 'h-thanks') rec.html = render(boxes(fin).filter(b => b !== hero(fin) && b.tag !== 'nav'));
    out.pages[f][lang] = rec;
  }
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log('pages', files.length, 'edits', out.edits.length, 'drops', out.drops.length, 'prod', Object.keys(out.prod).length);
