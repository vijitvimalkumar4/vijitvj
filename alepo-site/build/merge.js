// Merge of the team package "alepo-website-v1-2026-11-23-final" (Jonathan's words checked against
// Sandeep Patel's portfolio, Nava's names and SEO, Vaishnavee's questions, the Spanish review).
// The package's own pipeline was run on the design data (build/merge/extract.mjs) and its result is
// in build/merge/package-v1.json. This step applies that result to our pages, in the browser, after
// the lead and UI fixes and before the visual polish. Each change below names where it comes from.
window.__alepoMerge = function (cfg, doc) {
  const M = cfg.merge;
  if (!M) return;
  const L = cfg.lang === 'es' ? 'es' : 'en';
  const ES = L === 'es';
  const P = M.page || {};
  const main = doc.querySelector('main');
  const norm = s => String(s).replace(/\s+/g, ' ').trim();
  const report = { swaps: 0, drops: 0, qa: 0, guides: 0, spanish: 0 };
  const SKIP = 'script, style, noscript';

  // 1. Line changes (package EDITS), page pairs (opening line, overview, AI section), Nava's product names
  const swaps = new Map();
  (M.edits || []).forEach(e => { const p = e[L]; if (p && p[0] && p[0] !== p[1]) swaps.set(norm(p[0]), p[1]); });
  // sentence rewordings from the package's own before-and-after (menus and footer on every page, then this page)
  const soft = (a, b) => { const k = norm(a); if (k && !swaps.has(k)) swaps.set(k, b); };
  ((M.chromePairs || {})[L] || []).forEach(([a, b]) => soft(a, b));
  (P.diffPairs || []).forEach(([a, b]) => soft(a, b));
  (P.pairs || []).forEach(([a, b]) => { if (a) swaps.set(norm(a), b); });
  // the same line with a closing full stop
  [...swaps].forEach(([a, b]) => { if (b && !/[.?!]$/.test(a) && !swaps.has(a + '.')) swaps.set(a + '.', /[.?!]$/.test(b) ? b : b + '.'); });

  const textNodes = root => { const w = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT); const out = []; while (w.nextNode()) out.push(w.currentNode); return out.filter(n => !n.parentElement.closest(SKIP)); };
  const setText = (n, v) => { n.nodeValue = n.nodeValue.replace(/\S(?:[\s\S]*\S)?/, v); };
  const done = new Set();
  textNodes(doc.body).forEach(n => {
    const t = norm(n.nodeValue); if (!t || !swaps.has(t)) return;
    const v = swaps.get(t);
    if (v === '') { const el = n.parentElement; if (el && norm(el.textContent) === t) el.remove(); else n.nodeValue = ''; }
    else setText(n, v);
    done.add(t); report.swaps++;
  });
  // lines split over several nodes (a link or a bold word inside): match the whole element
  doc.body.querySelectorAll('p, li, h1, h2, h3, h4, span, a, div, td, dd, dt, figcaption, blockquote').forEach(el => {
    if (el.closest(SKIP) || el.querySelector('p, li, h1, h2, h3, div, section, ul, ol')) return;
    const t = norm(el.textContent); if (!t || done.has(t) || !swaps.has(t)) return;
    const v = swaps.get(t);
    if (v === '') el.remove(); else el.textContent = v;
    done.add(t); report.swaps++;
  });

  // 1b. Nava's product names in page headings only (the menus keep the design's brand names on their second line, as in the package)
  if (main) main.querySelectorAll('h1, h2, h3').forEach(h => {
    const t = norm(h.textContent);
    Object.values(M.prod || {}).forEach(p => { if (p.old && p.label && p.old !== p.label && t === p.old) { h.textContent = p.label; report.swaps++; } });
  });
  // 1c. Nava's group names everywhere (menus, footer, breadcrumbs, cards), and on Home her group lines under each card
  const CAT = { aaa: 'access', bss: 'billing', prov: 'provisioning', care: 'care' };
  const groupBy = Object.fromEntries((M.groups || []).map(g => [g.key, g]));
  const rename = new Map();
  Object.entries(cfg.categories || {}).forEach(([k, c]) => { const g = groupBy[CAT[k]]; if (!g) return; const ours = ES ? c.label_es : c.label; if (ours && ours !== g.name[L]) rename.set(norm(ours), g.name[L]); });
  if (rename.size) {
    textNodes(doc.body).forEach(n => { const t = norm(n.nodeValue); if (rename.has(t)) { setText(n, rename.get(t)); report.swaps++; } });
    doc.querySelectorAll('[aria-label]').forEach(el => { const t = norm(el.getAttribute('aria-label')); if (rename.has(t)) el.setAttribute('aria-label', rename.get(t)); });
  }
  if (main && M.key === 'Main') {
    const sec = main.querySelector('section#products');
    if (sec) {
      const intro = (P.diffPairs || []).find(([a]) => /^(Access control and BSS software|Software de control de acceso y BSS)/.test(a));
      const lead = sec.querySelector('h2') && sec.querySelector('h2').parentElement.querySelector('p');
      if (intro && lead) lead.textContent = intro[1];
      (M.groups || []).forEach(g => sec.querySelectorAll('h3').forEach(h => { if (norm(h.textContent) === g.name[L]) { const pp = h.parentElement.querySelector(':scope > p') || (h.nextElementSibling && h.nextElementSibling.tagName === 'P' ? h.nextElementSibling : null); if (pp) pp.textContent = g.line[L]; } }));
    }
  }

  // 2. Spanish review fixes (package spanish.mjs: whole strings, then phrases)
  if (ES && M.spanish) {
    const EX = M.spanish.exact || {}, PH = M.spanish.phrases || [];
    const fix = s => { const t = norm(s); if (Object.prototype.hasOwnProperty.call(EX, t)) return s.replace(t, EX[t]); let o = s; for (const [a, b] of PH) if (o.includes(a)) o = o.split(a).join(b); return o; };
    textNodes(doc.body).forEach(n => { const v = fix(n.nodeValue); if (v !== n.nodeValue) { n.nodeValue = v; report.spanish++; } });
    doc.querySelectorAll('[alt], [aria-label], [title]').forEach(el => ['alt', 'aria-label', 'title'].forEach(a => { const v = el.getAttribute(a); if (v) { const f = fix(v); if (f !== v) el.setAttribute(a, f); } }));
  }

  // 3. Lines and blocks left out (package DROPS): withdrawn data sheets, SaaS lines, the Kubernetes picture
  const prune = el => { let p = el.parentElement; el.remove(); for (let i = 0; i < 3 && p && p !== main; i++) { const up = p.parentElement; if (!norm(p.textContent) && !p.querySelector('img, input, select, textarea, button')) { p.remove(); p = up; } else break; } };
  (M.drops || []).forEach(d => {
    if (d.id) return; // the Events block: polish.js hides past events by date, so it comes back when a new event is added
    if (d.label) {
      const el = doc.querySelector(`[aria-label="${String(d.label[L]).replace(/"/g, '\\"')}"]`);
      if (el) { const box = el.closest('.dia-d') ? el.closest('.dia-d').parentElement : el; box.querySelectorAll('.dia-d, .dia-m').forEach(x => x.remove()); if (box.isConnected && el.isConnected) prune(el); report.drops++; }
      return;
    }
    const want = d[L]; if (!want || !main) return;
    if (d.g === 'datasheets') {
      // a withdrawn data sheet comes off every page that lists it: the row or card whose title is that data sheet
      const title = want.replace(/^(Datasheet|Ficha técnica)\s+/, '');
      main.querySelectorAll('a').forEach(a => { if ([...a.querySelectorAll('*')].some(x => norm(x.textContent) === title) || norm(a.textContent) === want) { prune(a); report.drops++; } });
      return;
    }
    const cands = [...main.querySelectorAll('a, p, li, h3, h4, span, div')].filter(el => norm(el.textContent) === want);
    const hit = cands.find(el => !cands.some(o => o !== el && el.contains(o)));
    if (hit) { prune(hit); report.drops++; }
  });

  // 4. Section id renamed on Services (#saas becomes #subscription), and every link to it
  doc.querySelectorAll('#saas').forEach(el => { el.id = 'subscription'; });
  doc.querySelectorAll('a[href$="#saas"]').forEach(a => a.setAttribute('href', a.getAttribute('href').replace(/#saas$/, '#subscription')));

  // 5. Questions and answers (Vaishnavee's copy checked against the portfolio): the package's full set per page
  const QA = P.qa || [];
  if (main && QA.length) {
    const qText = (ES ? M.qaHead.es : M.qaHead.en);
    const item = (q, a) => `<details class="rx-q" style="border-top: 1px solid rgb(220, 222, 232);"><summary style="display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 20px 0px; min-height: 44px;"><h3 style="margin: 0px; font-family: &quot;Plus Jakarta Sans&quot;, Arial, sans-serif; font-size: 19px; line-height: 1.1; font-weight: 700; letter-spacing: -0.025em; color: rgb(32, 36, 45);"></h3><span class="rx-pm" aria-hidden="true" style="flex: 0 0 auto; color: rgb(45, 29, 143); font-size: 26px; line-height: 1; font-weight: 400;">+</span></summary><div style="padding: 0px 0px 22px;"><p style="margin: 0px; font-size: 17px; line-height: 1.6; color: rgb(32, 36, 45); max-width: 40em;"></p></div></details>`;
    let sec = main.querySelector('section#questions') || [...main.querySelectorAll('section')].find(s => s.querySelector('details.rx-q'));
    if (!sec) {
      sec = doc.createElement('section'); sec.id = 'questions'; sec.setAttribute('style', 'padding: 96px 0px; background: transparent; color: inherit;');
      sec.innerHTML = `<div style="max-width: 1280px; margin: 0px auto; padding-left: 32px; padding-right: 32px;"><div style="display: flex; flex-wrap: wrap; gap: 28px 64px; align-items: flex-start;"><div style="flex: 1 1 300px;"><h2 style="margin: 0px; font-family: &quot;Plus Jakarta Sans&quot;, Arial, sans-serif; font-size: clamp(30px, 3.4vw, 44px); line-height: 1.1; font-weight: 700; letter-spacing: -0.025em; color: rgb(32, 36, 45);"></h2></div><div style="flex: 2 1 560px; min-width: 0px; display: flex; flex-direction: column;"></div></div></div>`;
      sec.querySelector('h2').textContent = qText.h2;
      const secs = [...main.querySelectorAll(':scope > section')];
      const before = secs.find(s => /^(Related products|Productos relacionados|Request a demo|Solicitar una demo|Talk to us|Hable con nosotros)$/.test(norm((s.querySelector('h2') || {}).textContent || ''))) || secs.at(-1);
      before.before(sec);
      const sub = doc.querySelector('.subnav > div');
      if (sub && !sub.querySelector('a[href="#questions"]')) { const tpl = sub.querySelector('a'); if (tpl) { const a = tpl.cloneNode(true); a.setAttribute('href', '#questions'); a.textContent = qText.toc; a.removeAttribute('aria-current'); sub.appendChild(a); } }
    }
    const list = sec.querySelector('details.rx-q') ? sec.querySelector('details.rx-q').parentElement : sec.querySelector('div[style*="flex: 2 1"]');
    list.querySelectorAll(':scope > details').forEach(d => d.remove());
    QA.forEach(([q, a], i) => { const w = doc.createElement('div'); w.innerHTML = item(); const d = w.firstElementChild; d.querySelector('h3').textContent = q; d.querySelector('p').textContent = a; if (i === 0) d.setAttribute('open', ''); list.appendChild(d); });
    report.qa = QA.length;
  }

  // 6. Product pages link to the blog guides that already rank (Nava's rule)
  const G = (M.guides || {})[M.key];
  if (main && G && G.length) {
    const GH = ES ? M.guideHead.es : M.guideHead.en;
    let res = main.querySelector('section#resources');
    if (!res) {
      res = doc.createElement('section'); res.id = 'resources'; res.setAttribute('style', 'padding: 96px 0px; background: rgb(243, 244, 248); color: inherit;');
      res.innerHTML = `<div style="max-width: 1280px; margin: 0px auto; padding-left: 32px; padding-right: 32px;"><div style="display: flex; flex-wrap: wrap; gap: 28px 64px; align-items: flex-start;"><div style="flex: 1 1 300px; display: flex; flex-direction: column; gap: 14px; align-items: flex-start;"><h2 style="margin: 0px; font-family: &quot;Plus Jakarta Sans&quot;, Arial, sans-serif; font-size: clamp(30px, 3.4vw, 44px); line-height: 1.1; font-weight: 700; letter-spacing: -0.025em; color: rgb(32, 36, 45);"></h2></div><div style="flex: 2 1 560px; min-width: 0px; display: flex; flex-direction: column;"></div></div></div>`;
      res.querySelector('h2').textContent = GH.h2;
      const q = main.querySelector('section#questions');
      (q || [...main.querySelectorAll(':scope > section')].at(-1)).before(res);
    }
    const list = res.querySelector('div[style*="flex: 2 1"]');
    G.forEach(([title, href]) => {
      if (list.querySelector(`a[href="${href}"]`)) return;
      const a = doc.createElement('a'); a.href = href; a.setAttribute('style', 'display: flex; align-items: center; gap: 24px; padding: 22px 0px; border-top: 1px solid rgb(220, 222, 232);');
      a.innerHTML = '<span style="flex: 0 0 110px; font-size: 13.5px; font-weight: 600; color: rgb(86, 91, 107);"></span><span style="flex: 1 1 auto; min-width: 0px; font-weight: 600; font-size: 18px; line-height: 1.35;"></span><span style="flex: 0 0 auto; color: rgb(45, 29, 143);"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex: 0 0 auto;"><path d="M5 12h14M13 6l6 6-6 6"></path></svg></span>';
      a.children[0].textContent = GH.kind; a.children[1].textContent = title; a.lang = 'en';
      list.appendChild(a); report.guides++;
    });
  }

  // 7. Titles and descriptions (Nava's, with the package's accuracy fixes and Spanish keywords)
  if (P.title) {
    const t = doc.querySelector('title'); if (t) t.textContent = P.title;
    doc.querySelectorAll('meta[property="og:title"], meta[name="twitter:title"]').forEach(m => m.setAttribute('content', P.title));
  }
  if (P.desc) doc.querySelectorAll('meta[name="description"], meta[property="og:description"], meta[name="twitter:description"]').forEach(m => m.setAttribute('content', P.desc));

  // 8. Category pages: Nava's H1 and the package's opening line
  if (main && /^h-c-/.test(M.key || '')) {
    const h1 = main.querySelector('h1'); if (h1 && P.h1) h1.textContent = P.h1;
    const lede = h1 && h1.parentElement.querySelector(':scope > p'); if (lede && P.lede) lede.textContent = P.lede;
  }

  // 9. News: the newest item in the top bar, and on Home and About the three newest items
  const N = cfg.latestNews;
  if (N) {
    const bar = doc.querySelector('.util a[href*="/news/"]');
    if (bar) { const node = textNodes(bar).find(n => norm(n.nodeValue)); if (node) setText(node, N.title); bar.setAttribute('href', N.url); bar.lang = 'en'; ['data-ends', 'data-fallback', 'data-fallback-href'].forEach(a => bar.removeAttribute(a)); }
    const news = main && main.querySelector('section#news');
    if (news && (M.key === 'Main' || M.key === 'h-about')) {
      const cards = [...news.querySelectorAll('a.hv, a.x-card')].filter(a => !a.hasAttribute('data-event-ends') && a.querySelectorAll('span').length >= 2);
      const tpl = cards[0];
      if (tpl && !cards.some(c => c.textContent.includes(N.title.slice(0, 30)))) {
        const c = tpl.cloneNode(true); c.setAttribute('href', N.url); c.lang = 'en';
        const sp = [...c.querySelectorAll('span')].filter(s => !s.children.length || s.children.length === 1 && s.querySelector('svg'));
        const tag = sp.find(s => norm(s.textContent).length < 20 && !s.querySelector('svg')); const title = sp.find(s => norm(s.textContent).length > 30);
        if (tag) tag.textContent = ES ? 'Premio' : 'Award';
        if (title) title.textContent = N.title;
        tpl.before(c);
        const all = [...news.querySelectorAll('a.hv, a.x-card')].filter(a => !a.hasAttribute('data-event-ends'));
        if (all.length > 3) all.at(-1).remove();
      }
    }
  }
  doc.documentElement.setAttribute('data-merge', JSON.stringify(report));
};
