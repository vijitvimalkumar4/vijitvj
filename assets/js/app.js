/* Alepo Signal — application
   Stack: JSON feed → DOM · GSAP + ScrollTrigger (scroll choreography) · Lenis (smooth scroll)
          Motion (spring micro-interactions) · Canvas (brand art)
   Everything degrades: without JS the markup is readable; without the libraries, content still renders. */
(function () {
  'use strict';

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  const hasMotion = typeof Motion !== 'undefined' && typeof Motion.animate === 'function';
  const hasLenis = typeof Lenis !== 'undefined';

  if (hasGsap) { gsap.registerPlugin(ScrollTrigger); document.documentElement.classList.add('js-motion'); }

  const state = { data: null, filter: 'all', query: '', lenis: null, ctx: null, mesh: null };

  /* ---------------- data ---------------- */
  async function loadData() {
    try {
      const res = await fetch('data/posts.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error(res.status);
      return await res.json();
    } catch (e) {
      if (window.ALEPO_POSTS) return window.ALEPO_POSTS;
      throw e;
    }
  }

  const fmtDate = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const cat = (id) => state.data.categories.find((c) => c.id === id) || { label: id, hue: 'indigo' };
  const hueVar = (hue) => ({ indigo: '#5b3fe8', violet: '#7c63ff', cyan: '#55cbe3', mint: '#36eee0', teal: '#36b9bd' }[hue] || '#55cbe3');
  const initials = (name) => name.split(' ').map((n) => n[0]).slice(0, 2).join('');
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const inlineCode = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>');

  /* ---------------- smooth scroll ---------------- */
  function initLenis() {
    if (!hasLenis || reduced) return;
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    state.lenis = lenis;
    if (hasGsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }
  function scrollTo(target, opts) {
    if (state.lenis) state.lenis.scrollTo(target, Object.assign({ offset: -80, duration: 1.1 }, opts || {}));
    else if (typeof target === 'number') window.scrollTo({ top: target, behavior: reduced ? 'auto' : 'smooth' });
    else { const el = typeof target === 'string' ? $(target) : target; el && el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }); }
  }

  /* ---------------- theme ---------------- */
  function initTheme() {
    const btn = $('#themeBtn');
    btn.addEventListener('click', () => {
      const root = document.documentElement;
      const current = root.getAttribute('data-theme') || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
      const next = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('alepo-theme', next); } catch (e) { /* private mode */ }
      if (hasMotion && !reduced) Motion.animate(btn, { rotate: [0, 360] }, { duration: 0.6, easing: 'ease-in-out' });
      $('meta[name="theme-color"]').setAttribute('content', next === 'dark' ? '#080b1f' : '#f4f6fc');
      if (state.mesh) state.mesh.redraw();
    });
  }

  /* ---------------- pointer glow + magnetic buttons (Motion) ---------------- */
  function initPointer() {
    if (!window.matchMedia('(pointer: fine)').matches || reduced) return;
    const glow = $('#cursorGlow');
    document.body.classList.add('has-glow');
    let x = 0, y = 0, tx = 0, ty = 0;
    window.addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    (function loop() { x += (tx - x) * 0.12; y += (ty - y) * 0.12; glow.style.transform = `translate3d(${x}px,${y}px,0)`; requestAnimationFrame(loop); })();
  }
  function magnetize(root) {
    if (!hasMotion || reduced || !window.matchMedia('(pointer: fine)').matches) return;
    $$('[data-magnetic]', root).forEach((el) => {
      if (el.__mag) return; el.__mag = true;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) * 0.25, dy = (e.clientY - (r.top + r.height / 2)) * 0.35;
        Motion.animate(el, { x: dx, y: dy }, { easing: Motion.spring({ stiffness: 300, damping: 20 }) });
      });
      el.addEventListener('pointerleave', () => Motion.animate(el, { x: 0, y: 0 }, { easing: Motion.spring({ stiffness: 200, damping: 14 }) }));
    });
  }
  function tiltCards(root) {
    if (!hasMotion || reduced || !window.matchMedia('(pointer: fine)').matches) return;
    $$('.post-card', root).forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        Motion.animate(card, { rotateX: -py * 6, rotateY: px * 8, y: -4 }, { easing: Motion.spring({ stiffness: 260, damping: 22 }) });
      });
      card.addEventListener('pointerleave', () => Motion.animate(card, { rotateX: 0, rotateY: 0, y: 0 }, { easing: Motion.spring({ stiffness: 200, damping: 18 }) }));
    });
  }

  /* ---------------- rendering: shared card ---------------- */
  function postCard(p) {
    const c = cat(p.category);
    const el = document.createElement('article');
    el.className = 'post-card';
    el.setAttribute('data-reveal', '');
    el.innerHTML = `
      <div class="art"><canvas data-seed="${p.seed}" data-hue="${c.hue}" aria-hidden="true"></canvas>
        <span class="chip" style="--chip-hue:${hueVar(c.hue)}">${esc(c.label)}</span></div>
      <div class="content">
        <h3><a class="stretch" href="#/post/${esc(p.slug)}">${esc(p.title)}</a></h3>
        <p class="dek">${esc(p.dek)}</p>
        <div class="tags">${p.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
        <div class="meta"><span>${esc(p.author.name)}</span><span class="dot"></span><span>${fmtDate(p.date)}</span><span class="dot"></span><span>${p.readTime} min</span></div>
      </div>`;
    return el;
  }
  function paintCovers(root) {
    $$('canvas[data-seed]', root).forEach((cv) => {
      const draw = () => window.AlepoArt && AlepoArt.cover(cv, +cv.dataset.seed, cv.dataset.hue);
      draw();
      if ('ResizeObserver' in window) { const ro = new ResizeObserver(draw); ro.observe(cv.parentElement); }
    });
  }

  /* ---------------- home view ---------------- */
  function renderHome() {
    const d = state.data;
    $('#heroLede').textContent = d.site.description;
    $('#footTagline').textContent = d.site.tagline + ' ' + d.site.description;
    $('#year').textContent = new Date().getFullYear();
    $('#navLinks').innerHTML = `<a href="#/">Blog</a>` + d.site.nav.map((n) => `<a href="${esc(n.href)}">${esc(n.label)}</a>`).join('');

    // ticker (duplicated for a seamless loop)
    const items = d.site.ticker.map((t) => `<span class="ticker-item">${esc(t)}</span>`).join('');
    $('#ticker').innerHTML = items + items;

    // featured rail
    const rail = $('#featuredRail');
    $$('.feature-card', rail).forEach((n) => n.remove());
    d.posts.filter((p) => p.featured).forEach((p, i) => {
      const c = cat(p.category);
      const card = document.createElement('a');
      card.className = 'feature-card'; card.href = `#/post/${p.slug}`;
      card.innerHTML = `
        <canvas data-seed="${p.seed}" data-hue="${c.hue}" aria-hidden="true"></canvas>
        <span class="chip" style="--chip-hue:${hueVar(c.hue)}">${esc(c.label)}</span>
        <span class="index">${String(i + 1).padStart(2, '0')} / 03</span>
        <div class="body">
          <h3>${esc(p.title)}</h3>
          <p class="dek">${esc(p.dek)}</p>
          <div class="meta mono"><span>${esc(p.author.name)}</span><span>·</span><span>${p.readTime} min read</span></div>
        </div>
        <span class="go" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>`;
      rail.appendChild(card);
    });

    // stats
    $('#stats').innerHTML = d.site.stats.map((s) => `
      <div class="stat" data-reveal>
        <div class="num"><span data-count="${s.value}" data-decimals="${s.decimals || 0}">0</span><sup>${esc(s.suffix)}</sup></div>
        <div class="label">${esc(s.label)}</div>
      </div>`).join('');

    // filters
    const filters = $('#filters');
    filters.innerHTML = [{ id: 'all', label: 'All posts' }].concat(d.categories).map((c) =>
      `<button class="filter" type="button" data-id="${c.id}" aria-pressed="${c.id === state.filter}">${esc(c.label)}</button>`).join('');
    filters.addEventListener('click', (e) => {
      const b = e.target.closest('.filter'); if (!b) return;
      state.filter = b.dataset.id;
      $$('.filter', filters).forEach((x) => x.setAttribute('aria-pressed', x === b));
      renderGrid(true);
    });
    const search = $('#search');
    let deb;
    search.addEventListener('input', () => { clearTimeout(deb); deb = setTimeout(() => { state.query = search.value.trim().toLowerCase(); renderGrid(true); }, 140); });

    // subscribe form
    $('#subForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const email = $('#subEmail'), note = $('#subNote');
      if (!email.validity.valid || !email.value) { note.textContent = 'Enter a work email address to subscribe.'; email.focus(); return; }
      note.textContent = `Subscribed. The next Signal goes to ${email.value}.`;
      email.value = '';
      if (hasMotion && !reduced) Motion.animate(note, { opacity: [0, 1], y: [6, 0] }, { duration: 0.5 });
    });

    renderGrid(false);
    paintCovers($('#viewHome'));
    magnetize(document);
    heroSignals();
  }

  function renderGrid(animate) {
    const grid = $('#posts');
    const list = state.data.posts.filter((p) => (state.filter === 'all' || p.category === state.filter) &&
      (!state.query || (p.title + ' ' + p.dek + ' ' + p.tags.join(' ') + ' ' + p.author.name).toLowerCase().includes(state.query)));
    grid.innerHTML = '';
    if (!list.length) { grid.innerHTML = '<p class="empty">No posts match that yet. Try a protocol name, like RADIUS or Diameter.</p>'; return; }
    list.forEach((p) => grid.appendChild(postCard(p)));
    paintCovers(grid);
    tiltCards(grid);
    if (animate && hasGsap && !reduced) {
      gsap.fromTo($$('.post-card', grid), { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: 'power3.out', clearProps: 'opacity,transform' });
    }
    if (hasGsap) ScrollTrigger.refresh();
  }

  /* live signal cards in the hero: a plausible auth-rate trace */
  function heroSignals() {
    const rps = $('#rps'), line = $('#traceLine'), area = $('#traceArea');
    const pts = Array.from({ length: 40 }, (_, i) => 22 + Math.sin(i / 3) * 8 + Math.random() * 6);
    let base = 48210;
    function paint() {
      const step = 200 / (pts.length - 1);
      const d = pts.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)} ${(44 - v).toFixed(1)}`).join(' ');
      line.setAttribute('d', d);
      area.setAttribute('d', d + ' L200 44 L0 44 Z');
    }
    function tick() {
      pts.push(22 + Math.sin(Date.now() / 900) * 8 + Math.random() * 6); pts.shift();
      base += Math.round((Math.random() - 0.5) * 600);
      rps.textContent = base.toLocaleString('en-US');
      paint();
    }
    paint(); rps.textContent = base.toLocaleString('en-US');
    if (!reduced) setInterval(tick, 1200);
  }

  /* ---------------- home scroll choreography (GSAP) ---------------- */
  function animateHome() {
    if (!hasGsap) return;
    state.ctx && state.ctx.revert();
    state.ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      // hero title words are pre-split in the markup (.word > span)
      if (!reduced) {
        gsap.from('#heroTitle .word > span', { yPercent: 110, duration: 1.1, ease: 'power4.out', stagger: 0.08, delay: 0.1 });
        gsap.from('.hero [data-reveal]', { y: 24, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1, delay: 0.45, clearProps: 'all' });
        gsap.to('.hero canvas.mesh', { yPercent: 18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
      }

      // ticker loop
      const track = $('#ticker');
      if (!reduced) gsap.to(track, { xPercent: -50, duration: 40, ease: 'none', repeat: -1 });

      // featured rail: pinned horizontal scroll on desktop
      mm.add('(min-width: 861px)', () => {
        const rail = $('#featuredRail'), pin = $('#featuredPin');
        const dist = () => rail.scrollWidth - pin.clientWidth;
        gsap.to(rail, {
          x: () => -dist(), ease: 'none',
          scrollTrigger: { trigger: pin, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: reduced ? false : 0.6, invalidateOnRefresh: true, anticipatePin: 1 }
        });
        $$('.feature-card canvas', rail).forEach((cv) => {
          gsap.fromTo(cv, { xPercent: -6 }, { xPercent: 6, ease: 'none', scrollTrigger: { trigger: pin, start: 'top top', end: () => '+=' + dist(), scrub: true } });
        });
      });

      // generic reveals
      if (!reduced) {
        ScrollTrigger.batch('#viewHome [data-reveal]:not(.hero [data-reveal])', {
          start: 'top 88%', once: true,
          onEnter: (els) => gsap.fromTo(els, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.07, clearProps: 'opacity,transform' })
        });
      }

      // counters
      $$('[data-count]').forEach((el) => {
        const target = parseFloat(el.dataset.count), dec = +el.dataset.decimals;
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target, duration: reduced ? 0 : 1.8, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          onUpdate: () => { el.textContent = obj.v.toFixed(dec); }
        });
      });
    }, '#viewHome');
    ScrollTrigger.refresh();
  }

  /* ---------------- article view ---------------- */
  function renderArticle(slug) {
    const d = state.data;
    const p = d.posts.find((x) => x.slug === slug);
    if (!p) { location.hash = '#/'; return; }
    const c = cat(p.category);

    $('#aCategory').textContent = c.label;
    $('#aTitle').textContent = p.title;
    $('#aDek').textContent = p.dek;
    $('#aAvatar').textContent = initials(p.author.name);
    $('#aAuthor').textContent = p.author.name;
    $('#aRole').textContent = p.author.role;
    $('#aDate').textContent = fmtDate(p.date);
    $('#aRead').textContent = `${p.readTime} min read`;
    $('#aTags').innerHTML = p.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join(' ');
    document.title = `${p.title} · Alepo Signal`;

    const art = $('#aArt'); art.dataset.seed = p.seed; art.dataset.hue = c.hue;
    paintCovers($('.article-art'));

    const body = $('#aBody'), toc = $('#toc');
    body.innerHTML = ''; toc.innerHTML = '';
    let hIdx = 0;
    p.body.forEach((b) => {
      let el;
      switch (b.type) {
        case 'h2':
          el = document.createElement('h2'); el.id = `s-${++hIdx}`; el.textContent = b.text;
          toc.insertAdjacentHTML('beforeend', `<li><a href="#${el.id}" data-toc="${el.id}">${esc(b.text)}</a></li>`);
          break;
        case 'quote':
          el = document.createElement('blockquote'); el.innerHTML = `${esc(b.text)}<cite>${esc(b.cite)}</cite>`; break;
        case 'list':
          el = document.createElement('ul'); el.innerHTML = b.items.map((i) => `<li>${inlineCode(i)}</li>`).join(''); break;
        case 'callout':
          el = document.createElement('aside'); el.className = 'callout'; el.innerHTML = `<span class="mono">${esc(b.title)}</span><p>${inlineCode(b.text)}</p>`; break;
        default:
          el = document.createElement('p'); el.innerHTML = inlineCode(b.text);
      }
      el.setAttribute('data-reveal', '');
      body.appendChild(el);
    });

    // TOC clicks use Lenis when present
    toc.addEventListener('click', (e) => {
      const a = e.target.closest('a[data-toc]'); if (!a) return;
      e.preventDefault(); scrollTo('#' + a.dataset.toc);
    });

    // share
    const url = location.href;
    $('#shareX').href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(p.title)}&url=${encodeURIComponent(url)}`;
    $('#shareLi').href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    const copy = $('#copyLink');
    copy.onclick = async () => {
      try { await navigator.clipboard.writeText(url); copy.setAttribute('aria-label', 'Link copied'); if (hasMotion && !reduced) Motion.animate(copy, { scale: [1, 1.2, 1] }, { duration: 0.4 }); }
      catch (e) { /* clipboard unavailable */ }
    };

    // related: same category first, then most recent
    const rel = $('#related'); rel.innerHTML = '';
    d.posts.filter((x) => x.slug !== p.slug)
      .sort((a, b) => (b.category === p.category) - (a.category === p.category) || b.date.localeCompare(a.date))
      .slice(0, 3).forEach((x) => rel.appendChild(postCard(x)));
    paintCovers(rel); tiltCards(rel);
    magnetize($('#viewArticle'));
  }

  function animateArticle() {
    if (!hasGsap) return;
    state.ctx && state.ctx.revert();
    state.ctx = gsap.context(() => {
      if (!reduced) {
        gsap.from('.article-hero .wrap > *:not(.article-art)', { y: 26, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, clearProps: 'all' });
        gsap.from('.article-art', { clipPath: 'inset(0 0 100% 0 round 24px)', duration: 1.2, ease: 'power4.out', delay: 0.3, clearProps: 'clipPath' });
        gsap.to('#aArt', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.article-art', start: 'top bottom', end: 'bottom top', scrub: true } });
        ScrollTrigger.batch('#aBody [data-reveal]', {
          start: 'top 90%', once: true,
          onEnter: (els) => gsap.fromTo(els, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', stagger: 0.06, clearProps: 'opacity,transform' })
        });
        ScrollTrigger.batch('#related .post-card', {
          start: 'top 90%', once: true,
          onEnter: (els) => gsap.fromTo(els, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: 'power3.out', clearProps: 'opacity,transform' })
        });
      }
      // active TOC item
      $$('#aBody h2').forEach((h) => {
        ScrollTrigger.create({
          trigger: h, start: 'top 30%', end: () => `+=${(h.nextElementSibling ? h.nextElementSibling.offsetHeight : 0) + h.offsetHeight + 200}`,
          onToggle: (self) => { if (self.isActive) { $$('#toc a').forEach((a) => a.classList.toggle('active', a.dataset.toc === h.id)); } }
        });
      });
    }, '#viewArticle');
    ScrollTrigger.refresh();
  }

  /* ---------------- progress bar ---------------- */
  function initProgress() {
    const bar = $('#progress');
    if (hasGsap) {
      gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 } });
    } else {
      window.addEventListener('scroll', () => { const h = document.documentElement; bar.style.transform = `scaleX(${h.scrollTop / (h.scrollHeight - h.clientHeight)})`; }, { passive: true });
    }
  }

  /* ---------------- router ---------------- */
  function route() {
    const hash = location.hash || '#/';
    const m = hash.match(/^#\/post\/([\w-]+)/);
    const home = $('#viewHome'), article = $('#viewArticle');
    if (m) {
      home.classList.remove('is-active'); article.classList.add('is-active');
      renderArticle(m[1]);
      window.scrollTo(0, 0); state.lenis && state.lenis.scrollTo(0, { immediate: true });
      animateArticle();
    } else {
      article.classList.remove('is-active'); home.classList.add('is-active');
      document.title = 'Alepo Signal';
      const anchor = hash.length > 2 && hash !== '#/' ? $(hash) : null;
      animateHome();
      if (anchor) requestAnimationFrame(() => scrollTo(anchor));
      else { window.scrollTo(0, 0); state.lenis && state.lenis.scrollTo(0, { immediate: true }); }
    }
  }

  // in-page anchors (#latest, #subscribe) go through Lenis; routes go through the router
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const href = a.getAttribute('href');
    if (href === '#/' || href.startsWith('#/post/')) return; // router handles
    const target = $(href); if (!target) return;
    e.preventDefault(); scrollTo(target);
  });

  /* ---------------- boot ---------------- */
  async function boot() {
    initTheme(); initPointer(); initLenis(); initProgress();
    try { state.data = await loadData(); }
    catch (err) {
      $('#posts').innerHTML = '<p class="empty">The post feed could not be loaded. Serve this folder over HTTP (for example <code>npx http-server</code>) so <code>data/posts.json</code> can be fetched.</p>';
      console.error('Alepo Signal: data load failed', err); return;
    }
    renderHome();
    if (window.AlepoArt) state.mesh = AlepoArt.mesh($('#mesh'), { pointerTarget: $('.hero') });
    window.addEventListener('hashchange', route);
    route();
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', boot) : boot();
})();
