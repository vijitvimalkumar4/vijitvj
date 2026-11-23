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
    form.addEventListener('input', function (e) { if (e.target.getAttribute('aria-invalid')) fieldError(e.target, ''); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate(form)) return;
      var endpoint = form.dataset.endpoint;
      if (!endpoint) { if (status) status.textContent = form.dataset.msgError; return; }
      if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = form.dataset.msgSending; }
      if (status) status.textContent = '';
      fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload(form)) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r; })
        .then(function () {
          if (form.dataset.thanks) { location.href = form.dataset.thanks; return; }
          if (status) status.textContent = form.dataset.msgSuccess || '';
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
})();
