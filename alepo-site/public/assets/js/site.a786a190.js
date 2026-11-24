/* Alepo.com runtime: forms (posted to Alepo's own /api/forms), menu, top bar, sticky demo bar. No dependencies, no tracking. */
(function () {
  'use strict';

  // ---- Forms: validate, post to /api/forms/<kind>, confirm ----
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    function fieldError(input, msg) {
    var id = input.id ? input.id + '-err' : null;
    var old = input.parentElement.querySelector('.f-err');
    if (old) old.remove();
    input.removeAttribute('aria-invalid');
    if (!msg) return;
    var p = document.createElement('p');
    p.className = 'f-err'; p.textContent = msg;
    if (id) { p.id = id; input.setAttribute('aria-describedby', id); }
    input.setAttribute('aria-invalid', 'true');
    input.parentElement.appendChild(p);
  }
  function check(form, i) {
    var v = (i.value || '').trim(), msg = '';
    if (i.required && !v) msg = form.dataset.msgRequired;
    else if (i.type === 'email' && v && !EMAIL.test(v)) msg = form.dataset.msgEmail;
    fieldError(i, msg);
    return !msg;
  }
  function validate(form) {
    var firstBad = null;
    form.querySelectorAll('input:not([type=hidden]), textarea, select').forEach(function (i) {
      var v = (i.value || '').trim(), msg = '';
      if (i.required && !v) msg = form.dataset.msgRequired;
      else if (i.type === 'email' && v && !EMAIL.test(v)) msg = form.dataset.msgEmail;
      fieldError(i, msg);
      if (msg && !firstBad) firstBad = i;
    });
    if (firstBad) firstBad.focus();
    return !firstBad;
  }
  // ---- Lead attribution: where the visitor first came from (campaign tags, referring site, landing page) ----
  // kept in this browser only (sessionStorage, first visit of the session) and sent with a form
  var attr = (function () {
    var KEY = 'x-attr', a = null;
    try { a = JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) {}
    if (!a) {
      var q = new URLSearchParams(location.search), ref = document.referrer, own = false;
      try { own = ref && new URL(ref).host === location.host; } catch (e) {}
      a = { s: q.get('utm_source') || '', m: q.get('utm_medium') || '', c: q.get('utm_campaign') || '', t: q.get('utm_term') || '', o: q.get('utm_content') || '', r: own ? '' : (ref || '').slice(0, 500), l: (location.pathname + location.search).slice(0, 500) };
      try { sessionStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {}
    } else {
      // campaign tags that arrive later in the session are still recorded (the first landing page stays)
      var q2 = new URLSearchParams(location.search);
      if (q2.get('utm_source') && !a.s) { a.s = q2.get('utm_source') || ''; a.m = q2.get('utm_medium') || ''; a.c = q2.get('utm_campaign') || ''; a.t = q2.get('utm_term') || ''; a.o = q2.get('utm_content') || ''; try { sessionStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {} }
    }
    return a;
  })();
  window.__xAttr = attr;

  function payload(form) {
    var get = function (n) { var e = form.elements[n]; return e ? (e.value || '').trim() : ''; };
    var sel = form.elements.request;
    return {
      fullname: get('fullname'), email: get('email'), company: get('company'), country: get('country'),
      request: get('request'), requestLabel: sel && sel.selectedIndex >= 0 ? sel.options[sel.selectedIndex].text : '',
      product: get('product'), operatorType: get('operatorType'), message: get('message'), website: get('website'),
      lang: get('lang'), page: location.href, title: document.title, consent: form.dataset.consentText,
      utmSource: attr.s, utmMedium: attr.m, utmCampaign: attr.c, utmTerm: attr.t, utmContent: attr.o, referrer: attr.r, landing: attr.l
    };
  }
  document.querySelectorAll('form[data-form]').forEach(function (form) {
    if (form.hasAttribute('data-gate-form')) return; // the Library data sheet dialog has its own handler
    var status = form.querySelector('[data-status]');
    var btn = form.querySelector('button[type=submit]');
    form.addEventListener('input', function (e) { e.target.dataset.touched = '1'; if (e.target.getAttribute('aria-invalid')) check(form, e.target); });
    // validate a field when the visitor leaves it (only once they have typed in it)
    form.addEventListener('focusout', function (e) { var i = e.target; if (i.matches && i.matches('input:not([type=hidden]):not([name=website]), textarea') && i.dataset.touched) check(form, i); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate(form)) return;
      var endpoint = form.dataset.endpoint;
      if (!endpoint) { if (status) status.textContent = form.dataset.msgError; return; }
      if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = form.dataset.msgSending; }
      if (status) status.textContent = '';
      fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload(form)) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json().catch(function () { return {}; }); })
        .then(function (res) {
          if (form.dataset.thanks) { location.href = form.dataset.thanks; return; }
          var msg = res && res.delivery === 'manual' && form.dataset.msgSuccessManual ? form.dataset.msgSuccessManual : form.dataset.msgSuccess;
          if (status) status.textContent = msg || '';
          form.querySelectorAll('input, button, select, textarea').forEach(function (i) { i.disabled = true; });
        })
        .catch(function () {
          if (status) status.textContent = form.dataset.msgError;
          if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label; }
        });
    });
  });

  // ---- Contact page: prefill from ?product= and ?request= ----
  var q = new URLSearchParams(location.search);
  var demo = document.querySelector('form[data-form=demo]');
  if (q.get('form-error')) { var st = document.querySelector('form[data-form] [data-status]'); var fm = st && st.closest('form'); if (st) st.textContent = fm.dataset.msgError; }
  if (demo) {
    var pq = (q.get('product') || '').replace(/[^a-z0-9-]/g, ''), ps = demo.elements.product;
    if (pq && ps) {
      // a product page the short list does not name (for example CRM): add it, named after the product page link that led here
      if (ps.tagName === 'SELECT' && ![].some.call(ps.options, function (o) { return o.value === pq; })) {
        var a = document.querySelector('header a.mt[href$="/products/' + pq + '/"]'), o = document.createElement('option');
        o.value = pq; o.textContent = a ? a.querySelector('span:last-child > span').textContent : pq; ps.appendChild(o);
      }
      ps.value = pq;
    }
    if (q.get('request') && demo.elements.request) demo.elements.request.value = q.get('request');
  }

  // ---- Mega menus: click toggles, Esc closes, aria-expanded follows ----
  document.querySelectorAll('.mm').forEach(function (mm) {
    var b = mm.querySelector('.mb');
    if (!b) return;
    var set = function () { b.setAttribute('aria-expanded', mm.matches(':hover, :focus-within') && !mm.classList.contains('is-closed') ? 'true' : 'false'); };
    mm.addEventListener('mouseenter', function () { mm.classList.remove('is-closed'); set(); });
    mm.addEventListener('mouseleave', set);
    mm.addEventListener('focusin', set);
    mm.addEventListener('focusout', function () { setTimeout(set, 0); });
    b.addEventListener('click', function () {
      if (b.getAttribute('aria-expanded') === 'true' && document.activeElement === b && mm.dataset.opened) { mm.classList.add('is-closed'); delete mm.dataset.opened; }
      else { mm.classList.remove('is-closed'); mm.dataset.opened = '1'; b.focus(); }
      set();
    });
    mm.addEventListener('keydown', function (e) { if (e.key === 'Escape') { mm.classList.add('is-closed'); b.focus(); set(); } });
  });

  // ---- Top bar: hide an event once it has ended ----
  var tb = document.querySelector('.util a[data-ends]');
  if (tb && new Date().toISOString().slice(0, 10) > tb.dataset.ends && tb.dataset.fallback) {
    Array.prototype.slice.call(tb.childNodes).forEach(function (n) { if (n.nodeType === 3) n.remove(); });
    tb.appendChild(document.createTextNode(tb.dataset.fallback));
    tb.href = tb.dataset.fallbackHref;
  }

  // ---- Sticky demo bar: hidden while the hero is on screen ----
  var bar = document.querySelector('.mcta');
  var hero = document.querySelector('main > section');
  if (bar && hero && 'IntersectionObserver' in window) {
    bar.classList.add('is-hidden');
    new IntersectionObserver(function (es) { bar.classList.toggle('is-hidden', es[0].isIntersecting); }).observe(hero);
  }

  // ---- Library filters (UI audit 3) ----
  var list = document.querySelector('[data-filter-list]');
  if (list) {
    var empty = document.querySelector('[data-filter-empty]');
    document.querySelectorAll('button[data-filter]').forEach(function (b) {
      b.addEventListener('click', function () {
        var v = b.dataset.filter, shown = 0;
        document.querySelectorAll('[role=group] button[data-filter]').forEach(function (x) { x.setAttribute('aria-pressed', x.dataset.filter === v ? 'true' : 'false'); });
        list.querySelectorAll('[data-kind]').forEach(function (a) { var on = v === 'all' || a.dataset.kind === v; a.hidden = !on; if (on) shown++; });
        if (empty) empty.hidden = shown > 0;
      });
    });
  }

  // ---- Blog: topic filters with a "Show more" button (without JavaScript every post is listed) ----
  var paged = document.querySelector('[data-page-size]');
  if (paged) {
    var size = +paged.dataset.pageSize, limit = size, cur = 'all', more = document.querySelector('[data-more]'), status = document.querySelector('.x-blog-status');
    var es = document.documentElement.lang === 'es';
    var search = document.querySelector('[data-search]'), query = '';
    function applyPage(focusFrom) {
      var total = 0, shown = 0, firstNew = null;
      paged.querySelectorAll('[data-kind]').forEach(function (a) {
        var t = a.querySelector('.x-post-title');
        var match = (cur === 'all' || a.dataset.kind === cur) && (!query || (t && t.textContent.toLowerCase().indexOf(query) > -1)); if (match) total++;
        var on = match && total <= limit;
        if (on && a.hidden && focusFrom && !firstNew) firstNew = a;
        a.hidden = !on; if (on) shown++;
        a.classList.toggle('x-post-featured', cur === 'all' && !query && a === paged.firstElementChild);
      });
      if (more) more.hidden = total <= limit;
      if (status) status.textContent = (es ? status.dataset.tplEs : status.dataset.tplEn).replace('{shown}', shown).replace('{total}', total);
      if (firstNew) firstNew.focus();
    }
    document.querySelectorAll('[role=group] button[data-filter]').forEach(function (b) { b.addEventListener('click', function () { cur = b.dataset.filter; limit = size; applyPage(false); }); });
    if (!document.querySelector('[role=group] button[data-filter]')) cur = 'all';
    if (more) more.addEventListener('click', function () { limit += size * 2 - 2; applyPage(true); });
    if (search) { var st; search.addEventListener('input', function () { clearTimeout(st); st = setTimeout(function () { query = search.value.trim().toLowerCase(); limit = size; applyPage(false); }, 120); }); }
    applyPage(false);
  }

  // ---- Library data sheets: a work email, then the PDF ----
  var gate = document.getElementById('x-gate');
  if (gate && gate.showModal) {
    var gf = gate.querySelector('form'), gEmail = gate.querySelector('input[type=email]'), gErr = gate.querySelector('[data-gate-err]'), gDone = gate.querySelector('[data-gate-done]'), gLink = gate.querySelector('[data-gate-link]'), gGo = gate.querySelector('.x-gate-go'), current = null, opener = null;
    var reset = function () { gErr.hidden = true; gDone.hidden = true; gGo.hidden = false; gEmail.disabled = false; gEmail.removeAttribute('aria-invalid'); };
    document.querySelectorAll('[data-gate]').forEach(function (card) {
      card.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault(); opener = card; current = { title: card.dataset.doc, url: card.href };
        gate.querySelector('[data-gate-doc]').textContent = current.title; gf.elements.docTitle.value = current.title; gf.elements.docUrl.value = current.url; reset(); gate.showModal(); gEmail.focus();
      });
    });
    gate.querySelectorAll('[data-gate-close]').forEach(function (b) { b.addEventListener('click', function () { gate.close(); }); });
    gate.addEventListener('close', function () { if (opener) opener.focus(); });
    gate.addEventListener('click', function (e) { if (e.target === gate) gate.close(); });
    var show = function (url) { gLink.href = url; gDone.hidden = false; gGo.hidden = true; gEmail.disabled = true; gLink.focus(); };
    gf.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = gEmail.value.trim();
      if (!EMAIL.test(email)) { gErr.textContent = gate.dataset.msgInvalid; gErr.hidden = false; gEmail.setAttribute('aria-invalid', 'true'); gEmail.focus(); return; }
      gErr.hidden = true; gGo.disabled = true;
      var body = { email: email, website: gf.elements.website.value, request: 'datasheet', docTitle: current.title, docUrl: current.url, lang: document.documentElement.lang, page: location.href, title: document.title,
        consent: gate.querySelector('.x-gate-consent').textContent, utmSource: attr.s, utmMedium: attr.m, utmCampaign: attr.c, utmTerm: attr.t, utmContent: attr.o, referrer: attr.r, landing: attr.l };
      fetch('/api/forms/datasheet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        .then(function (r) { return r.json().catch(function () { return {}; }); })
        .then(function (res) { gGo.disabled = false; if (res && res.ok) show(res.download || current.url); else { gErr.textContent = gate.dataset.msgOffline; gErr.hidden = false; show(current.url); } })
        .catch(function () { gGo.disabled = false; gErr.textContent = gate.dataset.msgOffline; gErr.hidden = false; show(current.url); });
    });
  }

  // ---- Events: the "Upcoming" badge goes once the event has ended (UI audit 6) ----
  var today = new Date().toISOString().slice(0, 10);
  document.querySelectorAll('[data-event-ends]').forEach(function (c) { if (today > c.dataset.eventEnds) { var b = c.querySelector('[data-upcoming-badge]'); if (b) b.remove(); } });

  // ---- Footer columns collapse on phones (UI audit 7); always open on wider screens ----
  var small = window.matchMedia('(max-width: 1000px)');
  function footerMode() { document.querySelectorAll('footer .fcol').forEach(function (c) { var t = c.querySelector('.fcol-t'); c.classList.toggle('is-closed', small.matches); if (t) t.setAttribute('aria-expanded', small.matches ? 'false' : 'true'); }); }
  document.querySelectorAll('footer .fcol-t').forEach(function (t) { t.addEventListener('click', function () { var c = t.closest('.fcol'); var open = c.classList.toggle('is-closed') === false; t.setAttribute('aria-expanded', open ? 'true' : 'false'); }); });
  footerMode(); if (small.addEventListener) small.addEventListener('change', footerMode);

  // ---- Mobile menu: tap outside or press Esc to close (UI audit 10) ----
  var mnav = document.querySelector('.mnav');
  if (mnav) {
    document.addEventListener('click', function (e) { if (mnav.open && !mnav.contains(e.target)) mnav.open = false; });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && mnav.open) { mnav.open = false; mnav.querySelector('summary').focus(); } });
  }

  // ---- Page sub-menu: mark the current section, keep it in view, hide while scrolling down on phones (UI audit 9, 11) ----
  var sub = document.querySelector('.subnav');
  if (sub) {
    var strip = sub.querySelector(':scope > div'), tabs = [].slice.call(sub.querySelectorAll('a[href^="#"]'));
    var secs = tabs.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
    function mark() {
      var y = 160, cur = null;
      secs.forEach(function (s, i) { if (s && s.getBoundingClientRect().top <= y) cur = i; });
      tabs.forEach(function (a, i) { if (i === cur) { a.setAttribute('aria-current', 'true'); if (strip) strip.scrollLeft = Math.max(0, a.offsetLeft - 24); } else a.removeAttribute('aria-current'); });
      if (strip) strip.classList.toggle('at-end', strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 4);
    }
    var lastY = window.scrollY;
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      if (small.matches) { if (y > lastY + 8 && y > 400) sub.classList.add('is-hidden'); else if (y < lastY - 8) sub.classList.remove('is-hidden'); }
      lastY = y; mark();
    }, { passive: true });
    if (strip) strip.addEventListener('scroll', function () { strip.classList.toggle('at-end', strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 4); }, { passive: true });
    mark();
  }

  // ---- Visual polish: header shadow once scrolled, sections fade in as they arrive ----
  var hdr = document.querySelector('.x-header');
  if (hdr) { var onS = function () { hdr.classList.toggle('is-scrolled', window.scrollY > 8); }; window.addEventListener('scroll', onS, { passive: true }); onS(); }
})();

/* Motion: back to top and a quiet reveal on scroll.
   Everything is visible without JavaScript; with reduced motion nothing moves. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('js-on');

  // Lenis smooth scrolling: wheel and trackpad only (touch stays native), not with reduced motion
  if (!reduce && window.Lenis && !window.__lenis) {
    var headerOffset = function () { var h = document.querySelector('header'); return -((h ? h.getBoundingClientRect().height : 0) + 16); };
    var lenis = window.__lenis = new window.Lenis({
      duration: 0.9,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      autoRaf: true,
      // menus and other inner scroll areas keep native scrolling
      prevent: function (node) { return !!(node.closest && node.closest('.mp, .mnav, [data-lenis-prevent]')); }
    });
    // in-page anchors glide to their section (links like #!/page in the single-file copy are routes, not anchors)
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a) return;
      var h = a.getAttribute('href'); if (h.length < 2 || h.charAt(1) === '!') return;
      var t = document.getElementById(decodeURIComponent(h.slice(1))); if (!t) return;
      e.preventDefault();
      lenis.scrollTo(t, { offset: headerOffset() });
      if (history.pushState) history.pushState(null, '', h);
    });
    document.documentElement.classList.add('x-lenis');
  }

  document.querySelectorAll('[data-top]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (window.__lenis) window.__lenis.scrollTo(0); else window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      var first = document.querySelector('header a'); if (first) first.focus({ preventScroll: true });
    });
  });

  // Products menu: pointing at or focusing a family shows its products (a short delay so a diagonal move to the list does not switch)
  document.querySelectorAll('.xm').forEach(function (xm) {
    var tabs = xm.querySelectorAll('.xm-tab'), timer;
    function show(tab) { tabs.forEach(function (x) { var on = x === tab, pane = x.nextElementSibling; x.classList.toggle('is-active', on); if (pane && pane.classList.contains('xm-pane')) pane.classList.toggle('is-active', on); }); }
    tabs.forEach(function (tab) {
      tab.addEventListener('mouseenter', function () { clearTimeout(timer); timer = setTimeout(function () { show(tab); }, 90); });
      tab.addEventListener('mouseleave', function () { clearTimeout(timer); });
      tab.addEventListener('focus', function () { show(tab); });
      tab.addEventListener('click', function (e) { if (tab.tagName === 'BUTTON') { e.preventDefault(); show(tab); } });
    });
  });

  if (!window.__xPrint) { window.__xPrint = true; window.addEventListener('beforeprint', function () { document.querySelectorAll('.rv').forEach(function (e) { e.classList.add('rv-in'); }); }); }
  if (reduce || !('IntersectionObserver' in window)) return;
  root.classList.add('x-motion');

  function done(el) { setTimeout(function () { el.classList.remove('rv', 'rv-in'); el.style.removeProperty('--rv-d'); }, 1400 + (parseInt(el.style.getPropertyValue('--rv-d'), 10) || 0)); }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (!en.isIntersecting) return; io.unobserve(en.target); en.target.classList.add('rv-in'); done(en.target); });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });

  var sel = 'main .x-h2, main .x-h2 + p, main .x-card, main .x-statcard, main .x-post, main .x-fact, main .x-job, main .x-steps > li, main .x-row, main .x-cardgrid > div, main .x-media, main .x-cta > div:not(.x-orbs), main blockquote, main details, main form, main [role="img"], main .dia-m > div';
  var list = Array.prototype.slice.call(document.querySelectorAll(sel)).filter(function (e) {
    return !e.closest('.x-hero, .x-in, .rv') && e.getBoundingClientRect().top > window.innerHeight * 0.92;
  });
  list.forEach(function (e) {
    var sibs = e.parentElement ? Array.prototype.filter.call(e.parentElement.children, function (c) { return list.indexOf(c) > -1; }) : [];
    e.style.setProperty('--rv-d', Math.min(sibs.indexOf(e), 5) * 110 + 'ms');
    e.classList.add('rv');
    io.observe(e);
  });
  // Odometer: each digit of a result figure rolls up to its value when the figure comes into view
  // (screen readers get the plain value; the original text is put back when the roll ends)
  function odoPrep(el) {
    var txt = el.textContent.trim(); if (el.dataset.odo || !/\d/.test(txt)) return;
    el.dataset.odo = txt; el.classList.add('odo');
    var html = '<span class="x-sr">' + txt.replace(/</g, '&lt;') + '</span>', k = 0;
    for (var i = 0; i < txt.length; i++) {
      var ch = txt.charAt(i);
      if (/\d/.test(ch)) {
        var strip = ''; for (var n = 0; n < 20; n++) strip += '<span>' + (n % 10) + '</span>';
        html += '<span class="odo-d" aria-hidden="true" data-d="' + ch + '" style="--k:' + (k++) + '"><span class="odo-w">' + ch + '</span><span class="odo-s">' + strip + '</span></span>';
      } else html += '<span class="odo-c" aria-hidden="true">' + ch + '</span>';
    }
    el.innerHTML = html; el.dataset.odoN = k;
  }
  function odoRun(el) {
    if (!el.dataset.odo || el.classList.contains('odo-run')) return;
    el.classList.add('odo-run');
    el.querySelectorAll('.odo-d').forEach(function (d) { d.querySelector('.odo-s').style.transform = 'translateY(' + (-(10 + +d.dataset.d) * 1.1) + 'em)'; });
    setTimeout(function () { el.textContent = el.dataset.odo; el.classList.remove('odo', 'odo-run'); }, 2000 + 90 * (+el.dataset.odoN || 1));
  }
  var odoIo = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { odoIo.unobserve(en.target); setTimeout(function () { odoRun(en.target); }, 250); } }); }, { threshold: 0.6 });
  document.querySelectorAll('main .x-stat, main .x-fact-n').forEach(function (el) { odoPrep(el); if (el.dataset.odo) odoIo.observe(el); });

  // Demo band: its glows drift once (5 s) when the band comes into view
  var ctaIo = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { ctaIo.unobserve(en.target); en.target.classList.add('is-live'); } }); }, { threshold: 0.4 });
  document.querySelectorAll('.x-cta').forEach(function (c) { ctaIo.observe(c); });

  // Headline colour sweep: section headings start pale and the fill sweeps across when they scroll in (page titles run on load, in CSS)
  var swIo = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { swIo.unobserve(en.target); en.target.classList.add('is-swept'); } }); }, { threshold: 0.6 });
  document.querySelectorAll('main .x-sweep:not(.x-sweep-load)').forEach(function (h) {
    if (h.getBoundingClientRect().top < window.innerHeight * 0.85 && h.getBoundingClientRect().bottom > 0) h.classList.add('is-swept', 'no-sweep'); else { h.classList.add('sweep-wait'); swIo.observe(h); }
  });

  // after a jump (End key, scrollbar drag, anchor) show anything at or above the screen at once
  function sweep() {
    document.querySelectorAll('.rv:not(.rv-in)').forEach(function (e) {
      if (e.getBoundingClientRect().top < window.innerHeight) { e.style.setProperty('--rv-d', '0ms'); io.unobserve(e); e.classList.add('rv-in'); done(e); }
    });
    document.querySelectorAll('.sweep-wait:not(.is-swept)').forEach(function (h) {
      if (h.getBoundingClientRect().bottom < 0) { swIo.unobserve(h); h.classList.add('is-swept', 'no-sweep'); }
      else if (h.getBoundingClientRect().top < window.innerHeight) { swIo.unobserve(h); h.classList.add('is-swept'); }
    });
    document.querySelectorAll('.odo:not(.odo-run)').forEach(function (el) { if (el.getBoundingClientRect().top < window.innerHeight) { odoIo.unobserve(el); odoRun(el); } });
  }
  window.__xSweepFn = sweep;
  if (!window.__xSweep) { window.__xSweep = true; var settle; window.addEventListener('scroll', function () { clearTimeout(settle); settle = setTimeout(function () { if (window.__xSweepFn) window.__xSweepFn(); }, 160); }, { passive: true }); }
})();

// ---- Blog and Library topic filters (copy deck): show the posts of one topic; on the blog, all pages' posts ----
(function () {
  var group = document.querySelector('[data-topics]'); if (!group) return;
  var feed = document.querySelector('.c-feed'), status = document.querySelector('[data-topic-status]');
  var btns = [].slice.call(group.querySelectorAll('[data-topic-btn]')); if (!feed || !btns.length) return;
  function pick(k) {
    btns.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.topicBtn === k ? 'true' : 'false'); });
    var n = 0;
    [].forEach.call(feed.children, function (c) { var on = k === 'all' || c.dataset.topic === k; c.classList.toggle('is-match', on); if (on) n++; });
    feed.classList.toggle('is-filtering', k !== 'all');
    if (status) status.textContent = n + (document.documentElement.lang === 'es' ? ' resultados' : ' results');
  }
  btns.forEach(function (b) { b.addEventListener('click', function () { pick(b.dataset.topicBtn); }); });
  var q = new URLSearchParams(location.search).get('topic');
  if (q && btns.some(function (b) { return b.dataset.topicBtn === q; })) pick(q);
})();
