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
  function payload(form) {
    var get = function (n) { var e = form.elements[n]; return e ? (e.value || '').trim() : ''; };
    var sel = form.elements.request;
    return {
      fullname: get('fullname'), email: get('email'), company: get('company'),
      request: get('request'), requestLabel: sel && sel.selectedIndex >= 0 ? sel.options[sel.selectedIndex].text : '',
      product: get('product'), message: get('message'), website: get('website'),
      lang: get('lang'), page: location.href, title: document.title, consent: form.dataset.consentText
    };
  }
  document.querySelectorAll('form[data-form]').forEach(function (form) {
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
    if (q.get('product') && demo.elements.product) demo.elements.product.value = q.get('product');
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
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('main > section').forEach(function (s, i) { if (i > 0 && s.getBoundingClientRect().top > window.innerHeight) { s.classList.add('x-reveal'); io.observe(s); } });
  }
})();
