// Puts the website copy deck (build/copy/<lang>/*.json, made by parse.py from the 24 Nov 2026 Word files) on the page.
// Runs in the browser after polish.js: the page's <main> is rebuilt from the copy, and the menus, top bar and footer from
// 02 · Navigation. The markup uses the site's own classes, so the motion (reveals, odometer, headline sweep, demo band) and
// the forms keep working. Lists made from alepo.com data (blog, library, news) are kept from the polished page.
window.__alepoCopy = function (cfg, doc) {
  const C = cfg.copy; if (!C) return;
  const P = C.page, NAV = C.nav, ES = cfg.lang === 'es', pre = ES ? '/es' : '';
  const main = doc.querySelector('main');
  if (!doc.querySelector('link[href$="site-copy.css"]')) { const l = doc.createElement('link'); l.rel = 'stylesheet'; l.href = '/assets/css/site-copy.css'; doc.head.appendChild(l); }
  const U = ES ? { on: 'En esta página', menu: 'Menú', read: 'Leer', all: 'Todos', status: 'Estado', newsroom: 'Sala de prensa', open: 'Abrir', posts: 'artículos', home: 'Inicio de Alepo Technologies', show: 'Mostrar u ocultar' }
               : { on: 'On this page', menu: 'Menu', read: 'Read', all: 'All', status: 'Status', newsroom: 'Newsroom', open: 'Open', posts: 'posts', home: 'Alepo Technologies home', show: 'Show or hide' };
  // ---------- text ----------
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const plain = s => String(s || '').replace(/\{\{link:[^|]*\|([^}]*)\}\}/g, '$1').replace(/\*\*/g, '').trim();
  const T = s => esc(plain(s)); // keyword bold is not shown (copy deck: "remove the bold on keywords")
  const noArrow = s => plain(s).replace(/\s*→\s*$/, '');
  const href = h => !h ? null : /^(https?:|mailto:|tel:|#)/.test(h) ? h : pre + h;
  const ext = h => /^https?:/.test(h || '') ? ' target="_blank" rel="noopener"' : '';
  const isPdf = h => /\.pdf(\?|$)/i.test(h || '');
  const svg = (d, s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const ARROW = svg('<path d="M5 12h14M13 6l6 6-6 6"/>', 16), CHEV = svg('<path d="m9 6 6 6-6 6"/>', 16), CHECK = svg('<path d="M20 6 9 17l-5-5"/>', 16);
  const today = cfg.today || new Date().toISOString().slice(0, 10);
  const MONTHS = { january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
    enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12 };
  const endOf = t => { // "17 to 19 November 2026" -> 2026-11-19
    const m = plain(t).toLowerCase().match(/(\d{1,2})(?:\s*(?:to|al|a|-|–)\s*(\d{1,2}))?\s+(?:de\s+)?([a-záéíóú]+)\s+(?:de\s+)?(\d{4})/);
    return m && MONTHS[m[3]] ? `${m[4]}-${String(MONTHS[m[3]]).padStart(2, '0')}-${String(m[2] || m[1]).padStart(2, '0')}` : null;
  };
  const past = t => { const e = endOf(t); return e && e < today; };
  const fmtDate = d => d ? new Date(d + 'T12:00:00Z').toLocaleDateString(ES ? 'es-ES' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : '';
  const tel = s => 'tel:' + String(s).replace(/[^\d+]/g, '');
  const productSlug = ((P && P.url) || '').match(/^\/products\/([^/]+)\/$/);
  const demoHref = productSlug && !/(network-access-aaa|billing-bss|provisioning-devices|customer-care-channels|ai-for-telecom)/.test(productSlug[1]) ? `/contact-us/?product=${productSlug[1]}#demo` : '/contact-us/#demo';
  const btnHref = b => b.href === '/contact-us/#demo' ? href(demoHref) : href(b.href || '#');
  const D = C.data || {}; // dates and images of linked posts and news (from alepo.com), leadership photos
  // ---------- blocks ----------
  const para = (b, cls) => `<p${cls ? ` class="${cls}"` : ''}>${T(b.text).replace(/\n/g, '<br>')}</p>`;
  const more = b => b.href ? `<a class="c-more" href="${esc(href(b.href))}"${ext(b.href)}>${esc(noArrow(b.text))}${ARROW}</a>` : `<p class="c-more">${esc(noArrow(b.text))}</p>`;
  const buttons = (items, dark) => `<div class="c-btns">${items.map((b, i) => b.href || b.label ? `<a class="${i === 0 ? (dark ? 'x-btn-light c-btn' : 'x-btn c-btn') : (dark ? 'c-btn c-btn-ghost-d' : 'c-btn c-btn-ghost')}" href="${esc(btnHref(b))}">${T(b.label)}</a>` : '').join('')}</div>`;
  const status = t => `<span class="c-pill">${T(t)}</span>`;
  const labelled = t => { // "**Label:** text" -> label and text; "Name: text" -> name and text
    const m = String(t).match(/^\*\*([^*]+?):?\*\*:?\s*(.*)$/s) || plain(t).match(/^([^:]{2,60}):\s(.+)$/s);
    return m ? [plain(m[1]).replace(/:$/, ''), plain(m[2])] : null;
  };
  function list(b, mode) {
    const hrefs = b.hrefs || [];
    if (mode === 'chips' || (hrefs.length && hrefs.every(Boolean) && b.items.every(i => plain(i).length < 40)))
      return `<div class="c-chips">${b.items.map((it, i) => hrefs[i] ? `<a class="c-chip" href="${esc(href(hrefs[i]))}">${T(it)}</a>` : `<span class="c-chip">${T(it)}</span>`).join('')}</div>`;
    if (hrefs.some(Boolean)) // product lines: "AAA Server: RADIUS and Diameter AAA for broadband and mobile"
      return `<ul class="c-links${mode === 'wide' ? ' c-links-2' : ''}">${b.items.map((it, i) => { const lp = labelled(it); const inner = lp ? `<span class="c-links-n">${esc(lp[0])}</span><span class="c-links-d">${esc(lp[1])}</span>` : `<span class="c-links-n">${T(it)}</span>`;
        return `<li>${hrefs[i] ? `<a href="${esc(href(hrefs[i]))}">${inner}${CHEV}</a>` : `<div>${inner}</div>`}</li>`; }).join('')}</ul>`;
    if (b.items.every(i => /^\*\*[^*]+\*\*/.test(i) || /^[^:]{2,40}:\s/.test(plain(i))) && b.items.length > 2)
      return `<dl class="c-feats">${b.items.map(it => { const lp = labelled(it); return lp ? `<div><dt>${esc(lp[0])}</dt><dd>${esc(lp[1])}</dd></div>` : `<div><dd>${T(it)}</dd></div>`; }).join('')}</dl>`;
    return `<ul class="c-checks">${b.items.map(it => `<li>${CHECK}<span>${T(it)}</span></li>`).join('')}</ul>`;
  }
  const facts = b => `<dl class="c-facts x-card">${b.rows.map(r => `<div><dt>${T(r[0])}</dt><dd>${T(r[1])}</dd></div>`).join('')}</dl>`;
  function storyTable(b) {
    const f = Object.fromEntries(b.fields.map((k, i) => [k, b.rows[i][1]]));
    const res = plain(f.Result || ''); const m = res.match(/^(\S+)\s+(.*)$/);
    const hl = plain(f.Highlights || '').split(' · ').filter(Boolean);
    return `<article class="c-story x-card"><div class="c-story-a"><p class="c-eyebrow">${T(f.Customer)}</p>
      ${m ? `<p class="c-story-n"><span class="x-stat">${esc(m[1])}</span></p><p class="c-story-r">${esc(m[2])}</p>` : `<p class="c-story-r">${esc(res)}</p>`}</div>
      <div class="c-story-b">${f.Project ? `<p class="c-story-p">${T(f.Project)}</p>` : ''}${hl.length ? `<ul class="c-checks">${hl.map(h => `<li>${CHECK}<span>${esc(h)}</span></li>`).join('')}</ul>` : ''}
      ${b.rows.filter((r, i) => b.fields[i] === 'Profile').map(r => /→\s*$/.test(r[1]) ? `<a class="c-more c-story-f" href="${href('/customers/')}">${esc(noArrow(r[1]))}${ARROW}</a>` : `<p class="c-story-f">${T(r[1])}</p>`).join('')}</div></article>`;
  }
  const rowLink = (h, inner, cls) => h ? `<a class="c-row ${cls || ''}" href="${esc(href(h))}"${ext(h)}>${inner}<span class="c-row-go">${ARROW}</span></a>` : `<div class="c-row ${cls || ''}">${inner}</div>`;
  function table(b, sec) {
    const H = b.hrefs || [];
    switch (b.kind) {
      case 'facts': return facts(b);
      case 'story': return storyTable(b);
      case 'stats': return `<div class="c-stats">${b.rows.map(r => `<div class="c-stat x-statcard"><p class="x-stat">${T(r[0])}</p><p class="c-stat-r">${T(r[1])}</p><p class="c-stat-c">${T(r[2])}</p></div>`).join('')}</div>`;
      case 'products': return `<div class="c-grid c-grid-${Math.min(b.rows.length, 4)}">${b.rows.map((r, i) => `<a class="x-card c-card c-card-link" href="${esc(href(H[i] || '#'))}"><h3>${T(r[0])}</h3><p>${T(r[1])}</p><span class="c-more">${CHEV}</span></a>`).join('')}</div>`;
      case 'layers': return `<div class="c-layers">${b.rows.map(r => `<div class="c-layer"><p class="c-layer-n">${T(r[0])}</p><div class="c-chips">${plain(r[1]).split(' · ').map(x => `<span class="c-chip">${esc(x)}</span>`).join('')}</div></div>`).join('')}</div>`;
      case 'chat': return `<figure class="c-console x-media"><div class="c-console-bar"><i></i><i></i><i></i>${b.title ? `<span>${esc(b.title)}</span>` : ''}</div><div class="c-console-body">${b.rows.map((r, i) => `<div class="c-msg ${i % 2 ? 'c-msg-ai' : ''}"><span class="c-msg-who">${T(r[0])}</span><p>${T(r[1])}</p></div>`).join('')}</div>${b.caption ? `<figcaption>${T(b.caption)}</figcaption>` : ''}</figure>`;
      case 'assistants': return `<figure class="c-assist">${b.rows.map(r => `<div class="c-console x-media"><div class="c-console-bar"><i></i><i></i><i></i><span>${T(r[0])}</span><span class="c-pill c-pill-s">${T(r[3])}</span></div><div class="c-console-body"><div class="c-msg"><p>${T(r[1])}</p></div><div class="c-msg c-msg-ai"><p>${T(r[2])}</p></div></div></div>`).join('')}${b.caption ? `<figcaption>${T(b.caption)}</figcaption>` : ''}</figure>`;
      case 'newsrows': case 'newslist': {
        const rows = b.rows.map((r, i) => ({ r, h: H[i] })).filter(({ r }) => !past(r.join(' ')));
        if (!rows.length) return '';
        return `<div class="c-rows">${rows.map(({ r, h }) => { const one = r.length === 1; const title = plain(one ? r[0] : r[1]).replace(/\s*·\s*(Read|Leer)\s*→$/, ''); const d = h && D.news && D.news[h];
          const showDate = PAGE === '13-news-events'; // 13 · News and events: "Each item shows its publication date beside the tag"
          return rowLink(h, `${one ? '' : `<span class="c-tag">${T(r[0])}</span>`}<span class="c-row-t">${esc(title)}</span>${d && showDate ? `<time datetime="${d}">${fmtDate(d)}</time>` : ''}`); }).join('')}</div>`;
      }
      case 'events': { const rows = b.rows.filter(r => !past(r[0])); return rows.length ? `<div class="c-rows">${rows.map(r => rowLink(null, `<span class="c-tag">${T(r[0])}</span><span class="c-row-t">${T(r[1])}</span>`)).join('')}</div>` : ''; }
      case 'posts': case 'resources': case 'rows': case 'needs':
        return `<div class="c-rows">${b.rows.map((r, i) => rowLink(H[i], `<span class="c-tag">${T(r[0])}</span><span class="c-row-t">${T(r[1])}</span>`, b.kind === 'needs' ? 'c-row-need' : '')).join('')}</div>`;
      case 'roles': return `<div class="c-rows" id="open-roles">${b.rows.map((r, i) => rowLink(H[i], `<span class="c-row-t">${T(r[0])}</span><span class="c-tag c-tag-plain">${T(r[1])}</span>`)).join('')}</div>`;
      case 'phones': return `<div class="c-grid c-grid-2">${b.rows.map(r => `<div class="x-card c-card"><p class="c-eyebrow">${T(r[0])}</p><p class="c-big"><a href="${tel(r[1])}">${T(r[1])}</a></p></div>`).join('')}</div>`;
      case 'offices': return `<div class="c-grid c-grid-4 c-offices">${b.rows.map(r => { const both = plain(r[1]).split(' · '); const city = sec === 'about' ? both[0] : plain(r[0]); const sub = sec === 'about' ? [plain(r[0])].concat(both.slice(1)) : [plain(r[1])];
          return `<div class="x-card c-card"><h3>${esc(city)}</h3>${sub.map(x => `<p>${esc(x)}</p>`).join('')}</div>`; }).join('')}</div>`;
      case 'people': return `<div class="c-people">${b.rows.map(r => { const ph = D.leaders && D.leaders[plain(r[0])];
          return `<div class="x-card c-person">${ph ? `<img src="${esc(ph)}" alt="${esc(plain(r[0]))}, ${esc(plain(r[1]))} ${ES ? 'en' : 'at'} Alepo Technologies" width="320" height="320" loading="lazy" decoding="async">` : `<span class="c-person-i" aria-hidden="true">${esc(plain(r[0]).split(/\s+/).map(w => w[0]).join('').slice(0, 2))}</span>`}<h3>${T(r[0])}</h3><p>${T(r[1])}</p></div>`; }).join('')}</div>`;
      default: return `<div class="c-rows">${b.rows.map((r, i) => rowLink(H[i], `<span class="c-tag">${T(r[0])}</span><span class="c-row-t">${T(r.slice(1).join(' · '))}</span>`)).join('')}</div>`;
    }
  }
  const diagram = b => `<div class="c-diagram">${b.boxes.map(bx => `<div class="c-dia-box x-card"><p class="c-eyebrow">${esc(bx[0])}</p><div class="c-dia-stack">${bx.slice(1).map((x, i) => `<span class="${i === 0 ? 'c-dia-prod' : i === bx.length - 2 ? 'c-dia-run' : 'c-dia-k8s'}">${esc(x)}</span>`).join('')}</div></div>`).join('')}</div>`;
  function faq(b) {
    return `<div class="c-faq">${b.items.map(q => `<details class="c-qa"><summary><span>${T(q.q)}</span><i aria-hidden="true"></i></summary><div><p>${T(q.a)}</p></div></details>`).join('')}</div>`;
  }
  function block(b, sec, dark) {
    switch (b.t) {
      case 'p': return para(b);
      case 'more': return more(b);
      case 'buttons': return buttons(b.items, dark);
      case 'status': return `<p>${status(b.text)}</p>`;
      case 'product': return b.href ? `<a class="c-chip c-chip-prod" href="${esc(href(b.href))}">${T(b.text)}${CHEV}</a>` : `<span class="c-chip">${T(b.text)}</span>`;
      case 'list': return list(b, sec === 'wide' ? 'wide' : undefined);
      case 'ul': return `<ul class="c-checks">${b.items.map(it => `<li>${CHECK}<span>${T(it)}</span></li>`).join('')}</ul>`;
      case 'table': return table(b, sec);
      case 'faq': return faq(b);
      case 'diagram': return diagram(b);
      case 'sub': return card(b, sec, dark);
      default: return '';
    }
  }
  function card(s, sec, dark) {
    if (s.kind === 'story') { // "STC · Saudi Arabia" / "**3x** AAA performance..." / project / highlights / profile
      const ps = s.blocks.filter(b => b.t === 'p'); const first = ps[0];
      const m = first.text.match(/^\*\*([^*]+)\*\*\s*(.*)$/);
      return `<article class="c-story x-card"><div class="c-story-a"><p class="c-eyebrow">${T(s.h3)}</p><p class="c-story-n"><span class="x-stat">${esc(plain(m ? m[1] : ''))}</span></p><p class="c-story-r">${esc(plain(m ? m[2] : first.text))}</p></div>
        <div class="c-story-b">${ps[1] ? `<p class="c-story-p">${T(ps[1].text)}</p>` : ''}${s.blocks.filter(b => b.t === 'ul').map(block).join('')}${ps[2] ? `<p class="c-story-f">${T(ps[2].text)}</p>` : ''}</div></article>`;
    }
    const moreB = s.blocks.filter(b => b.t === 'more');
    const link = moreB.length === 1 && moreB[0].href && !s.blocks.some(b => b.t === 'list' && (b.hrefs || []).some(Boolean)) ? moreB[0].href : null;
    const inner = `${s.blocks.filter(b => b.t === 'status').map(b => status(b.text)).join('')}<h3>${T(s.h3)}</h3>${s.blocks.filter(b => b.t !== 'status' && !(link && b.t === 'more')).map(b => block(b, sec, dark)).join('')}${link ? `<span class="c-more">${esc(noArrow(moreB[0].text))}${ARROW}</span>` : ''}`;
    const photo = link && forHref(link);
    if (photo) return `<a class="x-card c-card c-card-link c-has-img" href="${esc(href(link))}"${ext(link)}><span class="c-card-img">${imgTag(photo)}</span><span class="c-card-b">${inner}</span></a>`;
    return link ? `<a class="x-card c-card c-card-link" href="${esc(href(link))}"${ext(link)}>${inner}</a>` : `<div class="x-card c-card">${inner}</div>`;
  }
  if (!P && C.sitemapPages && NAV) sitemapPage();
  if (!P) { if (NAV) navigation(); return; } // legal pages, sitemap, 404: only the menus and footer come from the copy
  // Sitemap: the footer's "Sitemap" as heading, the menu names as groups, each page under the H1 of its Word file
  function sitemapPage() {
    const navSec = id => NAV.sections.find(x => x.id === id) || { blocks: [] };
    const labels = plain((navSec('header').blocks.find(b => b.t === 'p' && / · /.test(b.text) && !/Search|EN/.test(b.text)) || {}).text || '').split(' · ');
    const foot = navSec('footer').blocks.filter(b => b.t === 'sub'), legalP = foot[7] && foot[7].blocks[0];
    const legalNames = legalP ? plain(legalP.text).split(' · ') : [];
    const title = legalNames[(legalP.hrefs || []).indexOf('/sitemap/')] || 'Sitemap';
    const homeName = plain((C.sitemapPages.find(x => x.url === '/') || {}).h1 || '');
    const G = [[labels[0], u => /^\/products\//.test(u)], [labels[1], u => /^\/solutions\//.test(u)], [labels[2], u => /^\/services\//.test(u)],
      [labels[3], u => /^\/(resources|blog|library|customers|news)\//.test(u)], [labels[4], u => /^\/(company|contact-us)\//.test(u)]];
    const pages = C.sitemapPages.slice().sort((a, b) => a.n.localeCompare(b.n));
    const groups = G.map(([name, test]) => `<div class="x-card c-card"><h2 class="c-sm-h">${esc(name || '')}</h2><ul class="c-sm">${pages.filter(x => test(x.url)).map(x => `<li><a href="${esc(href(x.url))}">${esc(x.h1)}</a></li>`).join('')}</ul></div>`).join('');
    main.innerHTML = `<section class="x-hero c-hero c-hero-solo"><div class="c-wrap"><div class="c-hero-in"><div class="c-hero-t"><h1 class="x-sweep x-sweep-load">${esc(title)}</h1><p class="c-lede"><a href="${href('/')}">${esc(homeName)}</a></p></div></div></div></section>
      <section class="c-sec"><div class="c-wrap"><div class="c-grid c-grid-3 c-sitemap">${groups}</div></div></section>`;
    doc.title = title + ' | Alepo';
  }
  // photos of the page before the copy went in: a card's photo by the page it links to, the rest for the text sections
  const POOL = { byHref: {}, loose: [] }, usedImg = new Set();
  (() => {
    const seen = new Set();
    main.querySelectorAll('img').forEach(im => {
      const src = im.getAttribute('src') || '';
      if (!src || /logo|\.svg$/i.test(src) || seen.has(src) || im.closest('.x-hero, .x-feed, .x-post, .x-person, .x-avatar, .x-logos, dialog, .xm, footer') || im.closest('main > section:first-of-type')) return;
      if ((+im.getAttribute('width') || 999) < 160) return;
      seen.add(src);
      const o = { src, alt: im.getAttribute('alt') || '', srcset: im.getAttribute('srcset') || '', w: im.getAttribute('width') || '', h: im.getAttribute('height') || '' };
      let a = im.closest('a[href]');
      // a photo outside any link belongs to the card whose heading links to a page
      for (let c = im.parentElement, n = 0; !a && c && n < 4; c = c.parentElement, n++) a = c.querySelector('h3 a[href]');
      const h = a && (a.getAttribute('href') || '').replace(/^\/es(?=\/)/, '').replace(/[?#].*/, '');
      if (h && h.startsWith('/') && !POOL.byHref[h]) POOL.byHref[h] = o; else POOL.loose.push(o);
    });
  })();
  const imgTag = (o, cls) => `<img src="${esc(o.src)}"${o.srcset ? ` srcset="${esc(o.srcset)}" sizes="(max-width: 760px) 100vw, 640px"` : ''} alt="${esc(o.alt)}"${o.w ? ` width="${o.w}" height="${o.h}"` : ''} loading="lazy" decoding="async" class="g-zm${cls ? ' ' + cls : ''}">`;
  const takeLoose = () => { const o = POOL.loose.find(x => !usedImg.has(x.src)); if (o) usedImg.add(o.src); return o || null; };
  const forHref = h => { const o = POOL.byHref[(h || '').replace(/^\/es(?=\/)/, '').replace(/[?#].*/, '')]; if (o && !usedImg.has(o.src)) { usedImg.add(o.src); return o; } return null; };
  // ---------- sections ----------
  const PAGE = (P.source || '').replace(/\.docx$/, '');
  function section(s, i, all) {
    const role = s.role, dark = s.tone === 'dark';
    const id = s.id ? ` id="${s.id}"` : '';
    const subs = s.blocks.filter(b => b.t === 'sub'), rest = s.blocks.filter(b => b.t !== 'sub');
    if (role === 'thanks' || role === 'filters' || role === 'form' && PAGE !== '17-contact') return '';
    if (role === 'cta') {
      const ps = s.blocks.filter(b => b.t === 'p'), bt = s.blocks.find(b => b.t === 'buttons');
      return `<section class="on-dark x-cta c-cta"${id}><div class="x-orbs" aria-hidden="true"><i></i><i></i><i></i></div><div class="c-wrap"><div class="c-cta-in"><div><h2 class="x-sweep x-sweep-dark">${T(s.h2)}</h2>${ps.map(b => para(b)).join('')}</div>${bt ? buttons(bt.items, true) : ''}</div></div></section>`;
    }
    if (role === 'quote') {
      const ps = s.blocks.filter(b => b.t === 'p');
      return `<section class="c-sec c-quote-sec"${id}><div class="c-wrap"><h2 class="x-sr">${T(s.h2)}</h2><blockquote class="c-quote"><p>${T(ps[0].text)}</p>${ps[1] ? `<footer>${T(ps[1].text)}</footer>` : ''}</blockquote></div></section>`;
    }
    if (role === 'feed') return `<section class="c-sec c-feed-sec"${id}><div class="c-wrap"><h2 class="x-h2">${T(s.h2)}</h2><div data-feed-slot></div></div></section>`;
    if (role === 'form') return `<section class="c-sec c-form-sec"${id}><div class="c-wrap" data-form-slot></div></section>`;
    // emptied by past events: no section
    let body = '';
    const tone = dark ? ' on-dark x-dark c-dark' : (s.tint ? ' x-tint c-tint' : '');
    if (PAGE === '01-home' && s.id === 'products') return homeProducts(s);
    if (role === 'faq') {
      body = `<div class="c-split"><div><h2 class="x-h2">${T(s.h2)}</h2>${rest.filter(b => b.t === 'p').map(b => para(b, 'c-lead')).join('')}</div><div>${rest.filter(b => b.t !== 'p').map(b => block(b, PAGE, dark)).join('')}</div></div>`;
    } else if (subs.length) {
      const story = subs.every(x => x.kind === 'story');
      const n = subs.length, cols = story ? Math.min(n, 3) : n === 4 ? 4 : n >= 3 ? 3 : n;
      const intro = rest.map(b => block(b, PAGE, dark)).join('');
      body = `<div class="c-head"><h2 class="x-h2">${T(s.h2)}</h2>${intro ? `<div class="c-head-x">${intro}</div>` : ''}</div><div class="c-grid c-grid-${cols}${story ? ' c-grid-story' : ''}">${subs.map(x => card(x, PAGE, dark)).join('')}</div>`;
    } else {
      const html = rest.map(b => block(b, PAGE === '08-about' && b.kind === 'offices' ? 'about' : PAGE, dark)).filter(Boolean);
      if (!html.length) return '';
      const wide = rest.some(b => b.t === 'table' && !['facts', 'chat'].includes(b.kind)) || rest.some(b => b.t === 'list' && (role === 'chips' || (b.hrefs || []).some(Boolean))) || rest.some(b => b.t === 'diagram');
      const hasTable = rest.some(b => b.t === 'table' && b.kind !== 'facts');
      if (wide || hasTable) {
        const lead = rest.filter(b => b.t === 'p' || b.t === 'more' || b.t === 'status');
        const other = rest.filter(b => !lead.includes(b));
        body = `<div class="c-head"><h2 class="x-h2">${T(s.h2)}</h2>${lead.length ? `<div class="c-head-x">${lead.map(b => block(b, PAGE, dark)).join('')}</div>` : ''}</div>${other.map(b => block(b, PAGE === '08-about' && b.kind === 'offices' ? 'about' : b.t === 'list' ? 'wide' : PAGE, dark)).join('')}`;
      } else {
        const ph = takeLoose();
        body = `<div class="c-split${ph ? ' c-split-img' : ''}"><div><h2 class="x-h2">${T(s.h2)}</h2>${ph ? `<figure class="c-fig x-media">${imgTag(ph)}</figure>` : ''}</div><div class="c-prose">${html.join('')}</div></div>`;
      }
    }
    if (!body.replace(/<[^>]+>/g, '').trim()) return '';
    return `<section class="c-sec${tone}"${id}><div class="c-wrap">${body}</div></section>`;
  }
  // Home "Products": exactly the two groups in 01 · Home; the long BSS list runs in two columns so both cards end level
  function homeProducts(s) {
    const subs = s.blocks.filter(b => b.t === 'sub'), lead = s.blocks.filter(b => b.t !== 'sub');
    const gcard = (g, wide) => { const ph = forHref(g.href); const l = g.blocks.find(b => b.t === 'list');
      return `<div class="x-card c-card c-pgroup${wide ? ' c-pgroup-w' : ''}">${ph ? `<a class="c-card-img" href="${esc(href(g.href))}" tabindex="-1" aria-hidden="true">${imgTag(ph)}</a>` : ''}<div class="c-card-b"><h3>${g.href ? `<a href="${esc(href(g.href))}">${T(g.h3)}</a>` : T(g.h3)}</h3>${g.blocks.filter(b => b.t === 'p').map(b => para(b)).join('')}${l ? list(l, wide ? 'wide' : undefined) : ''}</div></div>`; };
    return `<section class="c-sec c-tint" id="products"><div class="c-wrap"><div class="c-head"><h2 class="x-h2">${T(s.h2)}</h2><div class="c-head-x">${lead.map(b => block(b, PAGE)).join('')}</div></div>
      <div class="c-pcols c-pcols-2">${subs.map((g, i) => gcard(g, i === 1)).join('')}</div></div></section>`;
  }
  // tint every other non-text section, so the page has a rhythm
  let prevTint = false;
  P.sections.forEach(s => {
    const visual = s.blocks.some(b => b.t === 'sub' || b.t === 'table' && b.kind !== 'facts' || b.t === 'list' && (b.hrefs || []).some(Boolean)) || s.role === 'chips';
    s.tint = !s.tone && !['cta', 'quote', 'faq', 'feed', 'form'].includes(s.role) && visual && !prevTint && !(PAGE === '01-home' && s.id === 'products');
    if (PAGE === '01-home' && s.id === 'products') { prevTint = true; return; }
    prevTint = !!s.tint || s.tone === 'dark';
  });
  // ---------- hero ----------
  const H = P.hero || {};
  const oldHero = main.querySelector('.x-hero');
  const media = oldHero && [...oldHero.querySelectorAll('img')].find(im => !/logo/i.test(im.getAttribute('src') || ''));
  const crumbs = H.crumbs ? H.crumbs.map((c, i) => ({ name: plain(c), href: (H.crumbHrefs || [])[i] })) : null;
  const assist = (H.extra || []).find(b => b.kind === 'assistants');
  const heroMedia = assist ? table(assist) : media ? `<div class="c-hero-media x-media"><img src="${esc(media.getAttribute('src'))}" alt="${esc(media.getAttribute('alt') || '')}" ${media.getAttribute('srcset') ? `srcset="${esc(media.getAttribute('srcset'))}" sizes="(max-width: 900px) 100vw, 560px"` : ''} width="${media.getAttribute('width') || 1200}" height="${media.getAttribute('height') || 800}" fetchpriority="high"></div>` : '';
  const heroHtml = `<section class="x-hero c-hero${heroMedia ? '' : ' c-hero-solo'}"><div class="c-wrap"><div class="c-hero-in"><div class="c-hero-t">
    ${crumbs ? `<nav class="c-crumbs" aria-label="${ES ? 'Ruta de navegación' : 'Breadcrumb'}"><ol>${crumbs.map((c, i) => `<li>${i < crumbs.length - 1 && c.href ? `<a href="${esc(href(c.href))}">${esc(c.name)}</a>` : `<span${i === crumbs.length - 1 ? ' aria-current="page"' : ''}>${esc(c.name)}</span>`}</li>`).join('')}</ol></nav>` : ''}
    ${H.badge ? `<p class="c-badge">${T(H.badge)}</p>` : ''}${H.eyebrow ? `<p class="c-eyebrow c-hero-eb">${T(H.eyebrow)}</p>` : ''}
    <h1 class="x-sweep x-sweep-load">${T(H.h1)}</h1>${(H.lede || []).map(t => `<p class="c-lede">${T(t)}</p>`).join('')}
    ${(H.extra || []).filter(b => b.t === 'more').map(more).join('')}${H.buttons && H.buttons.length ? buttons(H.buttons) : ''}</div>${heroMedia}</div>
    ${H.customers ? `<div class="c-logos"><p>${T(H.customersLabel || '')}</p><ul>${H.customers.map(c => `<li>${esc(c)}</li>`).join('')}</ul></div>` : ''}</div></section>`;
  const subnav = H.subnav && H.subnav.length ? `<nav class="subnav c-subnav" aria-label="${U.on}"><div>${H.subnav.map((l, i) => (H.subnavTargets || [])[i] ? `<a href="#${H.subnavTargets[i]}" data-subnav>${T(l)}</a>` : '').join('')}</div></nav>` : '';
  // keep what the polished page built from alepo.com data
  const keep = { feed: [...main.querySelectorAll('.x-blog-bar, .x-blog-note, .x-feed')], gate: main.querySelector('dialog.x-gate'), form: main.querySelector('form[data-form="demo"]') };
  main.innerHTML = heroHtml + subnav + P.sections.map(section).join('');
  // first screen: text settles in, then the picture (site-polish.css .x-in, .x-in-side)
  const heroEl = main.querySelector('.c-hero');
  if (heroEl) {
    let k = 0;
    heroEl.querySelectorAll('.c-hero-t > *').forEach(e => { e.classList.add('x-in'); e.style.setProperty('--i', k++); });
    const md = heroEl.querySelector('.c-hero-media, .c-assist'); if (md) { md.classList.add('x-in', 'x-in-side'); md.style.setProperty('--i', 1); }
    const hi = heroEl.querySelector('.c-hero-media img'); if (hi) hi.classList.add('g-kb');
    const lg = heroEl.querySelector('.c-logos'); if (lg) { lg.classList.add('x-in'); lg.style.setProperty('--i', k); }
  }
  const feedSlot = main.querySelector('[data-feed-slot]');
  if (feedSlot) { const f = keep.feed.filter(e => !e.classList.contains('x-blog-bar') && !e.classList.contains('x-blog-note')); if (f.length) feedSlot.replaceWith(...f); else feedSlot.remove(); }
  // topic filters (the copy's labels, in its order) and, on the blog, crawlable pages
  const filt = P.sections.find(s => s.role === 'filters'), feed = main.querySelector('.x-feed');
  if (filt && feed) {
    const isBlog = PAGE === '15-blog', B = C.blog || {};
    const KEYS = isBlog ? ['all', 'radius', 'tacacs', 'charging', 'bss', 'prov', 'wifi', 'mvno'] : ['all', 'ds', 'cs', 'wp'];
    const labels = plain(filt.blocks[0].text).split(' · ');
    const cards = [...feed.children];
    cards.forEach((c, i) => { const t = isBlog ? (B.topics || {})[c.getAttribute('href')] : c.dataset.kind; if (t) c.dataset.topic = t; if (isBlog && B.page === 1 && i >= B.per) c.classList.add('c-later'); });
    const count = k => k === 'all' ? (isBlog ? Object.keys(B.topics || {}).length : cards.length) : isBlog ? Object.values(B.topics || {}).filter(v => v === k).length : cards.filter(c => c.dataset.topic === k).length;
    const paged = isBlog && B.page > 1;
    const chips = labels.map((l, i) => { const k = KEYS[i] || 'all'; const n = count(k); if (!n && k !== 'all') return '';
      return paged ? `<a class="c-topic" href="${href('/blog/')}${k === 'all' ? '' : '?topic=' + k}">${esc(l)}<span class="x-count">${n}</span></a>`
                   : `<button type="button" class="c-topic" data-topic-btn="${k}" aria-pressed="${i === 0}">${esc(l)}<span class="x-count">${n}</span></button>`; }).join('');
    // cards show what the copy's Posts / Items tables show: a type and a title
    const tagOf = {};
    P.sections.flatMap(x => x.blocks).filter(b => b.t === 'table' && (b.kind === 'posts' || b.kind === 'library')).forEach(b => b.rows.forEach((r, i) => { if ((b.hrefs || [])[i]) tagOf[b.hrefs[i]] = plain(r[0]); }));
    const kindOfHref = Object.fromEntries(cards.map(c => [c.getAttribute('href'), c.dataset.kind]));
    const kindTag = {}; P.sections.flatMap(x => x.blocks).filter(b => b.kind === 'library').forEach(b => b.rows.forEach((r, i) => { const k = kindOfHref[(b.hrefs || [])[i]]; if (k && !kindTag[k]) kindTag[k] = plain(r[0]); }));
    cards.forEach(c => {
      c.querySelectorAll('.x-post-excerpt, .x-post-go, .x-post-chips, .x-post-date').forEach(e => e.remove());
      const tag = c.querySelector('.x-post-tag'), u = c.getAttribute('href');
      const t = tagOf[u] || (isBlog ? (c.dataset.topic ? labels[KEYS.indexOf(c.dataset.topic)] : null) : (kindTag[c.dataset.kind] || labels[KEYS.indexOf(c.dataset.kind)]));
      if (tag) { if (t) { tag.textContent = t; tag.lang = cfg.lang; } else tag.remove(); }
      c.removeAttribute('data-gate'); c.removeAttribute('data-doc');
      if (isPdf(u)) { c.target = '_blank'; c.rel = 'noopener'; }
    });
    const bar = doc.createElement('div'); bar.className = 'c-topics';
    bar.innerHTML = `<div role="group" aria-label="${T(filt.h2)}" data-topics>${chips}</div><p class="x-sr" role="status" aria-live="polite" data-topic-status></p>`;
    feed.before(bar);
    feed.classList.add('c-feed'); if (isBlog && B.page === 1) feed.classList.add('c-feed-p1');
    ['data-page-size', 'data-filter-list'].forEach(a => feed.removeAttribute(a)); main.querySelectorAll('[data-more], .x-blog-status, [data-filter-empty]').forEach(e => e.remove());
    if (isBlog && B.pages > 1) {
      const pg = n => n === 1 ? href('/blog/') : href(`/blog/page/${n}/`);
      const cur = B.page, nums = []; for (let n = 1; n <= B.pages; n++) nums.push(n);
      const nav = doc.createElement('nav'); nav.className = 'c-pager'; nav.setAttribute('aria-label', ES ? 'Páginas del blog' : 'Blog pages');
      nav.innerHTML = (cur > 1 ? `<a href="${pg(cur - 1)}" rel="prev">${ES ? 'Anterior' : 'Previous'}</a>` : `<span class="is-off">${ES ? 'Anterior' : 'Previous'}</span>`)
        + nums.map(n => n === cur ? `<span aria-current="page">${n}</span>` : `<a href="${pg(n)}">${n}</a>`).join('')
        + (cur < B.pages ? `<a href="${pg(cur + 1)}" rel="next">${ES ? 'Siguiente' : 'Next'}</a>` : `<span class="is-off">${ES ? 'Siguiente' : 'Next'}</span>`);
      feed.after(nav);
      if (cur > 1) { const l = doc.createElement('link'); l.rel = 'prev'; l.href = cfg.origin + pg(cur - 1); doc.head.appendChild(l); }
      if (cur < B.pages) { const l = doc.createElement('link'); l.rel = 'next'; l.href = cfg.origin + pg(cur + 1); doc.head.appendChild(l); }
    }
  }
  // the copy deck has no sign-up step before a data sheet: the Library links straight to each PDF
  // the contact form, with the fields the copy lists
  const formSlot = main.querySelector('[data-form-slot]');
  if (formSlot) formSlot.outerHTML = contactForm(P.sections.find(s => s.role === 'form'), keep.form);
  function contactForm(s, old) {
    const g = s.blocks.find(b => b.t === 'sub') || s; const lst = g.blocks.find(b => b.t === 'list');
    const consent = g.blocks.find(b => b.t === 'p'), send = g.blocks.find(b => b.t === 'buttons');
    // the list holds the fields; the "Country" line also carries the two choice lists, written as a small table
    const fields = [], selects = [];
    lst.items.forEach(it => {
      const lines = String(it).split('\n'); fields.push(plain(lines[0]));
      lines.slice(1).filter(l => /^\|/.test(l) && !/^\|\s*-/.test(l)).slice(1).forEach(l => {
        const cells = l.split('|').map(c => c.trim()).filter(Boolean); const m = cells[0].match(/^(.+?):\s*(.+)$/);
        if (m) selects.push({ label: m[1], options: [m[2]].concat(cells.slice(1).join(' · ').split(' · ')).map(x => x.trim()).filter(Boolean) });
      });
    });
    const at = old ? [...old.attributes].filter(a => a.name.startsWith('data-') && a.name !== 'data-consent-text').map(a => ` ${a.name}="${esc(a.value)}"`).join('') : ' data-form="demo" data-endpoint="/api/forms/demo"';
    const hidden = old ? [...old.querySelectorAll('input[type=hidden], input[name=website]')].filter(i => i.name !== 'product').map(i => i.outerHTML).join('') : '';
    const cText = plain(consent ? consent.text : '').replace(/^(Consent|Consentimiento):\s*/, '');
    const privacy = cText.replace(/(Privacy policy|política de privacidad|Política de privacidad)/, m => `<a href="${href('/privacy-policy/')}">${m}</a>`);
    const KEYS = [['fullname', 'text', 'name', true], ['email', 'email', 'email', true], ['company', 'text', 'organization', true], ['country', 'text', 'country-name', false]];
    const VALUES = [['demo', 'sales', 'rfp', 'partner'], ['aaa-server', 'tacacs-server', 'digital-bss', 'bss-in-a-box', 'online-charging', 'ai', 'other']];
    const inp = (i, lab) => { const [n, ty, ac, req] = KEYS[i]; return `<div class="c-field"><label for="f-${n}">${esc(lab)}${req ? '<span aria-hidden="true"> *</span>' : ''}</label><input id="f-${n}" name="${n}" type="${ty}" autocomplete="${ac}"${req ? ' required aria-required="true"' : ''}></div>`; };
    const sel = (i, x) => `<div class="c-field"><label for="f-${i ? 'product' : 'request'}">${esc(x.label)}</label><select id="f-${i ? 'product' : 'request'}" name="${i ? 'product' : 'request'}">${i ? '<option value=""></option>' : ''}${x.options.map((o, k) => `<option value="${VALUES[i][k] || 'other'}">${esc(o)}</option>`).join('')}</select></div>`;
    const sv = s.blocks.filter(b => b.t === 'sub');
    return `<div class="c-wrap"><div class="c-form-grid"><div class="x-card c-form-card"><form method="post" action="/api/forms/demo" novalidate${at} data-consent-text="${esc(cText)}">
      <h2 class="c-form-h" id="demo">${T(g.h3 || s.h2)}</h2>
      <div class="c-fields">${fields.slice(0, 4).map((f, i) => inp(i, f)).join('')}${selects.map((x, i) => sel(i, x)).join('')}
      <div class="c-field c-field-w"><label for="f-message">${esc(fields[4] || '')}</label><textarea id="f-message" name="message" rows="4"></textarea></div></div>
      <p class="c-consent" data-consent>${privacy}</p><p role="status" aria-live="polite" data-status></p>
      <button type="submit" class="x-btn c-btn">${T(send ? send.items[0].label : 'Send')}</button>${hidden}</form></div>
      <div class="c-form-side">${sv.slice(1).map(x => card(x, PAGE)).join('')}</div></div></div>`;
  }
  // ---------- head: title, description, structured data ----------
  // the build already took the title and description from the copy (cfg.title, cfg.meta); paged blog pages add their number
  const title = cfg.title || plain(P.title), desc = cfg.meta || plain(P.desc);
  if (title) { doc.title = title; doc.querySelectorAll('meta[property="og:title"], meta[name="twitter:title"]').forEach(m => m.setAttribute('content', title)); }
  if (desc) doc.querySelectorAll('meta[name="description"], meta[property="og:description"], meta[name="twitter:description"]').forEach(m => m.setAttribute('content', desc));
  doc.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
    let j; try { j = JSON.parse(s.textContent); } catch (e) { return; }
    if (j['@type'] === 'FAQPage') s.remove();
    if (j['@type'] === 'BreadcrumbList') {
      if (!crumbs) return; // no breadcrumb in the copy (thank-you page): keep the one the build made
      const items = [{ name: ES ? 'Inicio' : 'Home', href: '/' }].concat(crumbs[0].name === (ES ? 'Inicio' : 'Home') ? crumbs.slice(1) : crumbs);
      j.itemListElement = items.map((c, i) => Object.assign({ '@type': 'ListItem', position: i + 1, name: c.name }, (c.href || i === items.length - 1) ? { item: cfg.origin + (i === items.length - 1 ? cfg.self : href(c.href)) } : {}));
      s.textContent = JSON.stringify(j);
    }
    if (j['@type'] === 'SoftwareApplication') { j.name = plain(P.doc).replace(/^\d+\s*·\s*/, ''); j.description = plain(P.desc); s.textContent = JSON.stringify(j); }
  });
  const qa = P.sections.flatMap(s => s.blocks.filter(b => b.t === 'faq').flatMap(b => b.items));
  if (qa.length) {
    const s = doc.createElement('script'); s.type = 'application/ld+json';
    s.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: qa.map(q => ({ '@type': 'Question', name: plain(q.q), acceptedAnswer: { '@type': 'Answer', text: plain(q.a) } })) });
    doc.head.appendChild(s);
  }
  // ---------- navigation (02 · Navigation) ----------
  if (NAV) navigation();
  function navigation() {
    const ID = { 'Utility bar': 'utility-bar', 'Header': 'header', 'Products menu': 'products-menu', 'Solutions menu': 'solutions-menu', 'Services menu': 'services-menu',
      'Resources menu': 'resources-menu', 'Company menu': 'company-menu', 'Footer': 'footer' };
    const sec = name => NAV.sections.find(s => s.id === (ID[name] || name));
    const subOf = (s, i) => s.blocks.filter(b => b.t === 'sub')[i];
    const icons = {}; doc.querySelectorAll('header a.mt').forEach(a => { const ic = a.querySelector(':scope > span:first-child'); if (ic) icons[a.getAttribute('href').replace(/^\/es/, '')] = ic.innerHTML; });
    const DEF_ICON = svg('<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/>', 18);
    // the menu's look lives in inline styles on the original markup: take them from there
    const st = sel => { const e = doc.querySelector(sel); return e ? (e.getAttribute('style') || '') : ''; };
    const A = (s, cls) => (s ? ` style="${esc(s)}"` : '') + (cls ? ` class="${cls}"` : '');
    const mtD = [...doc.querySelectorAll('header .mp a.mt')].find(a => a.querySelectorAll(':scope > span:last-child > span').length > 1);
    const S = { mt: st('header .mp a.mt'), ic: st('header .mp a.mt > span:first-child'), tx: st('header .mp a.mt > span:last-child'), nm: st('header .mp a.mt > span:last-child > span:first-child'),
      ds: mtD ? (mtD.querySelector(':scope > span:last-child > span:nth-child(2)').getAttribute('style') || '') : 'font-size: 13px; line-height: 1.4; color: rgb(86, 91, 107);',
      grp: st('header .mp.xm-cols > div > div > div:not(.xm-sidecol)'), gt: st('header .mp.xm-cols > div > div > div:not(.xm-sidecol) > div:first-child'),
      gl: st('header .mp.xm-cols > div > div > div:not(.xm-sidecol) > div:nth-child(2)'), sct: st('header .xm-sidecol > div'), pr: st('header a.xm-promo'),
      pr1: st('header a.xm-promo > span:nth-child(1)'), pr2: st('header a.xm-promo > span:nth-child(2)'), pr3: st('header a.xm-promo > span:nth-child(3)'),
      sa: st('header .xm-side > a:first-child'), sa0: st('header .xm-side > a:first-child > span:first-child'), sall: st('header .xm-side > a:last-child') };
    const mt = (h, name, desc) => `<a href="${esc(href(h))}"${A(S.mt, 'mt')}><span${A(S.ic)}>${icons[(h || '').replace(/#.*/, '')] || icons[h] || DEF_ICON}</span><span${A(S.tx)}><span${A(S.nm)}>${esc(name)}</span>${desc ? `<span${A(S.ds)}>${esc(desc)}</span>` : ''}</span></a>`;
    const items = b => b.items.map((it, i) => { const lp = labelled(it) || [plain(it), '']; return mt((b.hrefs || [])[i] || '#', lp[0], lp[1]); }).join('');
    const promoA = (h, title, text, link) => `<a href="${esc(href(h))}"${A(S.pr, 'xm-promo')}><span${A(S.pr1)}>${esc(title)}</span><span${A(S.pr2)}>${esc(text)}</span><span${A(S.pr3)}>${esc(link)}${ARROW}</span></a>`;
    const promo = (b, fallbackHref) => {
      const f = Object.fromEntries(b.rows.map((r, i) => [['Eyebrow', 'Title', 'Text', 'Link'][i] || r[0], r[1]]));
      if (past(f.Text || '') || past(f.Title || '')) return null;
      return promoA(b.linkHref || fallbackHref, plain(f.Title), plain(f.Text), noArrow(f.Link));
    };
    // Products: one tab per group, a promo, "All products"
    const pm = sec('Products menu'), groups = pm.blocks.filter(b => b.t === 'sub' && b.blocks.some(x => x.t === 'list'));
    const pPromo = pm.blocks.find(b => b.t === 'sub' && b.blocks.some(x => x.t === 'table' && x.kind === 'promo'));
    const pPromoT = pPromo && pPromo.blocks.find(x => x.kind === 'promo');
    const pAll = pm.blocks.find(b => b.t === 'more') || (pPromo && pPromo.blocks.find(b => b.t === 'more'));
    const groupHref = g => g.href || '/products/';
    const products = `<div class="xm">${groups.map((g, i) => `<a href="${esc(href(groupHref(g)))}" class="xm-tab${i === 0 ? ' is-active' : ''}" style="grid-row: ${i + 1};"><span>${T(g.h3)}</span>${CHEV}</a><div class="xm-pane${i === 0 ? ' is-active' : ''}" role="group" aria-label="${esc(plain(g.h3))}"><div class="xm-list">${items(g.blocks.find(x => x.t === 'list'))}</div></div>`).join('')}
      <div class="xm-side">${pPromoT ? (() => { const f = pPromoT.rows.map(r => r[1]); return `<a href="${esc(href('/products/bss-in-a-box/'))}"${A(S.sa)}><span${A(S.sa0)}>${T(f[0])}</span><span${A(S.pr1)}>${T(f[1])}</span><span${A(S.pr2)}>${T(f[2])}</span><span${A(S.pr3)}>${esc(noArrow(f[3]))}${ARROW}</span></a>`; })() : ''}${pAll ? `<a href="${esc(href('/products/'))}"${A(S.sall)}>${esc(noArrow(pAll.text))}${ARROW}</a>` : ''}</div></div>`;
    const PROMO_HREF = { 'services-menu': '/services/#support', 'resources-menu': '/customers/', 'company-menu': '/news/', 'solutions-menu': '/customers/' };
    const cols = s => s.blocks.filter(b => b.t === 'sub').map(g => {
      const lst = g.blocks.find(x => x.t === 'list'), tb = g.blocks.find(x => x.t === 'table'), pr = tb && tb.kind === 'promo';
      if (pr) { const card = promo(tb, PROMO_HREF[s.id]); return card ? `<div class="xm-sidecol"><div${A(S.sct)}>${T(tb.rows[0][1])}</div>${card}</div>` : ''; }
      if (!lst && !tb) { // a promo written as lines (eyebrow, title, text, link)
        const ps = g.blocks.filter(x => x.t === 'p'), mo = g.blocks.find(x => x.t === 'more');
        return `<div class="xm-sidecol"><div${A(S.sct)}>${T(ps[0] && ps[0].text)}</div>${promoA(mo && mo.href || '/customers/', plain(ps[1] && ps[1].text), plain(ps[2] && ps[2].text), noArrow(mo ? mo.text : ''))}</div>`;
      }
      let inner = '', n = 0;
      if (lst) { inner = items(lst); n = lst.items.length; }
      else if (tb && tb.kind === 'newslist') { inner = tb.rows.map((r, i) => mt((tb.hrefs || [])[i] || '/news/', plain(r[0]), '')).join(''); n = tb.rows.length; }
      else if (tb) { inner = tb.rows.map((r, i) => mt((tb.hrefs || [])[i] || '#', plain(r[0]), plain(r[1]))).join(''); n = tb.rows.length; }
      const two = n > 5 && (s.id !== 'resources-menu');
      return `<div${A(S.grp)}><div${A(S.gt)}>${T(g.h3)}</div><div${A(two ? S.gl : 'display: grid; grid-template-columns: minmax(0px, 1fr); gap: 8px;')}>${inner}</div></div>`;
    }).join('');
    const panes = { Products: products, Solutions: cols(sec('Solutions menu')), Services: cols(sec('Services menu')), Resources: cols(sec('Resources menu')), Company: cols(sec('Company menu')) };
    const headerLine = plain((sec('Header').blocks.find(b => b.t === 'p' && / · /.test(b.text) && !/Search|EN/.test(b.text)) || {}).text || '');
    const labels = headerLine.split(' · ');
    const mbs = [...doc.querySelectorAll('header .dnav > .mm')];
    mbs.forEach((mm, i) => {
      const key = ['Products', 'Solutions', 'Services', 'Resources', 'Company'][i];
      const btn = mm.querySelector('.mb'); if (btn && labels[i]) btn.firstChild.textContent = labels[i];
      const mp = mm.querySelector('.mp'), host = mp && mp.firstElementChild && mp.firstElementChild.firstElementChild;
      if (!host || !panes[key]) return;
      host.innerHTML = panes[key];
      if (key !== 'Products') { mp.className = 'mp xm-cols'; host.className = ''; host.style.gridTemplateColumns = host.children.length === 2 ? 'minmax(0px, 1.7fr) minmax(0px, 1.6fr)' : 'minmax(0px, 1.7fr) minmax(0px, 1.4fr) minmax(0px, 1.1fr)'; }
    });
    // mobile menu: the same groups, as lists
    const mnav = doc.querySelector('.mnav > div');
    if (mnav) {
      const det = (name, links) => `<details name="x-mnav"><summary>${esc(name)}${svg('<path d="m6 9 6 6 6-6"/>', 16)}</summary><div>${links.map(([h, t]) => `<a href="${esc(href(h))}">${esc(t)}</a>`).join('')}</div></details>`;
      const linksOf = s => s.blocks.filter(b => b.t === 'sub').flatMap(g => { const l = g.blocks.find(x => x.t === 'list'); return l ? l.items.map((it, i) => [(l.hrefs || [])[i] || '#', (labelled(it) || [plain(it)])[0]]) : []; });
      const extra = [...mnav.children].filter(c => c.tagName !== 'DETAILS');
      mnav.innerHTML = [['Products menu', 0], ['Solutions menu', 1], ['Services menu', 2], ['Resources menu', 3], ['Company menu', 4]].map(([n, i]) => det(labels[i] || n, linksOf(sec(n)))).join('');
      extra.forEach(e => mnav.appendChild(e));
    }
    // top bar: the event line while it lasts, then the newest news item in the copy; the utility links
    const ub = sec('Utility bar'), util = doc.querySelector('.util');
    if (ub && util) {
      const ev = ub.blocks[0], links = ub.blocks[1];
      const lead = util.querySelector('a');
      if (lead) {
        if (ev && !past(ev.text)) { lead.lastChild.textContent = plain(ev.text); lead.setAttribute('href', href('/news/')); }
        else if (C.topNews) { lead.lastChild.textContent = C.topNews.title; lead.setAttribute('href', C.topNews.href); lead.setAttribute('lang', cfg.lang); }
        ['data-ends', 'data-fallback', 'data-fallback-href'].forEach(a => lead.removeAttribute(a));
      }
      const span = util.querySelector('span');
      if (span && links) span.innerHTML = plain(links.text).split(' · ').map((t, i) => `<a href="${esc(href((links.hrefs || [])[i] || '/'))}">${esc(t)}</a>`).join('');
    }
    const logo = doc.querySelector('header a[aria-label] img');
    if (logo) logo.closest('a').setAttribute('aria-label', U.home);
    const hdrBtn = doc.querySelector('header .x-btn'); const hb = sec('Header').blocks.find(b => b.t === 'buttons');
    if (hdrBtn && hb) hdrBtn.textContent = plain(hb.items[0].label);
    // footer: product, solution and company columns; newsletter; support numbers; offices; legal bar
    const fs = sec('Footer'), foot = doc.querySelector('footer.x-footer') || doc.querySelector('body > footer');
    if (fs && foot) {
      const subs = fs.blocks.filter(b => b.t === 'sub');
      const colOf = (g, i) => { const p0 = g.blocks[0]; const names = plain(p0.text).split(' · '); return `<div class="fcol"><div class="fcol-h"><a href="${esc(href(g.href || ['/products/network-access-aaa/', '/products/billing-bss/', '/products/customer-care-channels/', '/solutions/', '/company/about/'][i]))}">${T(g.h3)}</a><button type="button" class="fcol-t" aria-expanded="true" aria-controls="fcol-${i}" aria-label="${U.show} ${esc(plain(g.h3))}"></button></div><div class="fcol-list" id="fcol-${i}">${names.map((n, k) => `<a href="${esc(href((p0.hrefs || [])[k] || '#'))}">${esc(n)}</a>`).join('')}</div></div>`; };
      const ORDER = ['access', 'bss', 'care', 'solutions', 'company', 'newsletter', 'offices', 'legal'];
      const named = n => subs[ORDER.indexOf(n)];
      const colsEl = foot.querySelector('.xf-cols');
      const prodCols = ['access', 'bss', 'care', 'solutions', 'company'].map(named).filter(Boolean);
      if (colsEl) colsEl.innerHTML = prodCols.map((g, i) => `<div class="xf-stack">${colOf(g, i)}</div>`).join('');
      const nl = named('newsletter'), offices = named('offices'), legal = named('legal');
      const brand = foot.querySelector('.xf-brand');
      if (brand) {
        const tag = brand.querySelector('.xf-tag'); if (tag) tag.remove();
        const btn = brand.querySelector('.xf-btn'); if (btn) btn.remove();
        const contact = brand.querySelector('.xf-contact');
        const sup = nl && nl.blocks.find(b => b.t === 'p' && /\+\d/.test(b.text));
        if (contact) contact.innerHTML = `${sup ? `<div>${esc(plain(sup.text)).replace(/(\+[\d ]{8,}\d)/g, m => `<a href="${tel(m)}">${m}</a>`)}</div>` : ''}${offices ? `<div class="xf-offices-l"><span>${T(offices.h3)}:</span> ${T(offices.blocks[0].text)}</div>` : ''}`;
      }
      const news = foot.querySelector('.xf-news');
      if (news) news.querySelectorAll('[data-consent]').forEach(e => e.remove()); // 02 · Navigation: "Work email [Subscribe]" only
      if (news && nl) { const lab = news.querySelector('label'); if (lab) lab.textContent = plain(nl.h3); const inp = news.querySelector('input[type=email]'); const wl = plain(nl.blocks[0].text).replace(/\s*\[[^\]]+\]\s*/, '').trim(); if (inp && wl) inp.setAttribute('placeholder', wl); const sb = news.querySelector('button[type=submit]'); const bl = (nl.blocks[0].text.match(/\[([^\]]+)\]/) || [])[1]; if (sb && bl) sb.textContent = bl; }
      // compact layout: newsletter band on top (lighter), brand and the link columns in one row, legal bar on a darker band
      const wrap = foot.querySelector('.xf-wrap'), topEl = foot.querySelector('.xf-top'), brandEl = foot.querySelector('.xf-brand'), newsEl = foot.querySelector('.xf-news'), colsEl2 = foot.querySelector('.xf-cols');
      if (wrap && topEl && brandEl && newsEl && colsEl2) {
        const band = doc.createElement('div'); band.className = 'xf-band'; const bi = doc.createElement('div'); bi.className = 'xf-band-in'; bi.appendChild(newsEl); band.appendChild(bi);
        foot.insertBefore(band, wrap);
        colsEl2.classList.add('xf-cols-c'); colsEl2.prepend(brandEl); topEl.remove();
      }
      const mark = foot.querySelector('.xf-mark'); if (mark) mark.remove();
      const bottom = foot.querySelector('.xf-bottom');
      if (bottom && legal) {
        const parts = plain(legal.blocks[0].text).split(' · ').filter(p => !/^alepo$/i.test(p));
        const copy = parts.find(p => /©/.test(p)); const links = parts.filter(p => p !== copy);
        const nav = bottom.querySelector('nav, div:last-child') || bottom;
        const keepLinks = []; // the legal bar lists only what 02 · Navigation lists
        const lp = legal.blocks[0], all = plain(lp.text).split(' · ');
        bottom.innerHTML = `<p>${esc(copy || '')}</p><nav aria-label="Legal">${links.map(l => `<a href="${esc(href((lp.hrefs || [])[all.indexOf(l)] || '#'))}">${esc(l)}</a>`).join('')}${keepLinks.join('')}</nav>`;
        const strip = doc.createElement('div'); strip.className = 'xf-legal'; const si = doc.createElement('div'); si.className = 'xf-legal-in'; si.appendChild(bottom); strip.appendChild(si); foot.appendChild(strip);
      }
    }
  }
};
