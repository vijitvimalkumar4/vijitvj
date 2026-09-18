/* Generative brand art: deterministic node meshes in Alepo's palette.
   Used for the hero background (animated) and for every post's cover (static, seeded). */
(function (global) {
  'use strict';

  const PALETTE = {
    indigo: ['#2d1d8f', '#5b3fe8', '#55cbe3'],
    violet: ['#5b3fe8', '#2d1d8f', '#bcecf1'],
    cyan: ['#55cbe3', '#2d1d8f', '#36eee0'],
    mint: ['#36eee0', '#008686', '#2d1d8f'],
    teal: ['#008686', '#36b9bd', '#2d1d8f']
  };

  function rng(seed) {
    let s = (seed * 9301 + 49297) % 233280;
    return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  }

  function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgba(hex, a) { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; }

  function fit(canvas) {
    const dpr = Math.min(global.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width)), h = Math.max(1, Math.round(rect.height));
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr; canvas.height = h * dpr;
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h };
  }

  /* Static cover: a dark field, a soft brand bloom, a constellation of linked nodes,
     and a few "protocol lanes" (curved traces) like the fibre bundles in Alepo's renders. */
  function cover(canvas, seed, hue) {
    const { ctx, w, h } = fit(canvas);
    const rand = rng(seed || 1);
    const cols = PALETTE[hue] || PALETTE.indigo;

    ctx.fillStyle = '#0a0d26';
    ctx.fillRect(0, 0, w, h);

    // bloom
    const bx = w * (0.2 + rand() * 0.6), by = h * (0.2 + rand() * 0.6);
    const g = ctx.createRadialGradient(bx, by, 0, bx, by, Math.max(w, h) * 0.7);
    g.addColorStop(0, rgba(cols[0], 0.55));
    g.addColorStop(0.5, rgba(cols[1], 0.18));
    g.addColorStop(1, 'rgba(10,13,38,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

    // lanes
    const lanes = 3 + Math.floor(rand() * 3);
    for (let i = 0; i < lanes; i++) {
      const y0 = h * rand(), y1 = h * rand();
      const c = cols[i % cols.length];
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, rgba(c, 0)); grad.addColorStop(0.5, rgba(c, 0.55)); grad.addColorStop(1, rgba(c, 0));
      ctx.strokeStyle = grad; ctx.lineWidth = 1 + rand() * 1.5;
      ctx.beginPath();
      ctx.moveTo(-10, y0);
      ctx.bezierCurveTo(w * 0.33, y0 + (rand() - 0.5) * h * 0.8, w * 0.66, y1 + (rand() - 0.5) * h * 0.8, w + 10, y1);
      ctx.stroke();
    }

    // nodes
    const n = 18 + Math.floor(rand() * 14);
    const pts = [];
    for (let i = 0; i < n; i++) pts.push({ x: rand() * w, y: rand() * h, r: 1 + rand() * 2.2 });
    ctx.lineWidth = 0.8;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
        const d = Math.hypot(dx, dy), lim = Math.min(w, h) * 0.32;
        if (d < lim) {
          ctx.strokeStyle = rgba(cols[2], (1 - d / lim) * 0.5);
          ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke();
        }
      }
    }
    for (const p of pts) {
      ctx.fillStyle = rgba(cols[2], 0.9);
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = rgba(cols[2], 0.18);
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2); ctx.fill();
    }

    // dashed panel: the diagram frame motif
    ctx.setLineDash([4, 6]); ctx.strokeStyle = 'rgba(188,236,241,0.28)'; ctx.lineWidth = 1;
    const pw = w * (0.28 + rand() * 0.25), ph = h * (0.3 + rand() * 0.3);
    const px = w * rand() * 0.6, py = h * rand() * 0.55;
    roundRect(ctx, px, py, pw, ph, 10); ctx.stroke(); ctx.setLineDash([]);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  /* Animated hero mesh: slow drifting nodes, links fade with distance, a pointer well pulls them. */
  function mesh(canvas, opts) {
    opts = opts || {};
    let { ctx, w, h } = fit(canvas);
    const reduced = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const count = Math.round(Math.min(110, Math.max(40, (w * h) / 16000)));
    const rand = rng(7);
    const pts = [];
    for (let i = 0; i < count; i++) {
      pts.push({ x: rand() * w, y: rand() * h, vx: (rand() - 0.5) * 0.25, vy: (rand() - 0.5) * 0.25, r: 0.8 + rand() * 1.6, p: rand() * Math.PI * 2 });
    }
    const pointer = { x: -9999, y: -9999 };
    let raf = 0, running = true, t = 0;

    function colors() {
      const dark = getComputedStyle(document.documentElement).colorScheme !== 'light';
      return dark
        ? { link: [85, 203, 227], node: [188, 236, 241], bloom: 'rgba(45,29,143,0.55)' }
        : { link: [45, 29, 143], node: [0, 134, 134], bloom: 'rgba(85,203,227,0.35)' };
    }

    function draw() {
      const c = colors();
      ctx.clearRect(0, 0, w, h);
      const g = ctx.createRadialGradient(w * 0.7, h * 0.3, 0, w * 0.7, h * 0.3, Math.max(w, h) * 0.6);
      g.addColorStop(0, c.bloom); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

      const lim = Math.min(220, Math.max(120, w * 0.12));
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        if (!reduced) {
          a.x += a.vx; a.y += a.vy;
          const dx = pointer.x - a.x, dy = pointer.y - a.y, d = Math.hypot(dx, dy);
          if (d < 260) { a.x += dx / d * 0.6 * (1 - d / 260); a.y += dy / d * 0.6 * (1 - d / 260); }
          if (a.x < -20) a.x = w + 20; if (a.x > w + 20) a.x = -20;
          if (a.y < -20) a.y = h + 20; if (a.y > h + 20) a.y = -20;
        }
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j];
          const dx = a.x - b.x, dy = a.y - b.y; if (Math.abs(dx) > lim || Math.abs(dy) > lim) continue;
          const d = Math.hypot(dx, dy);
          if (d < lim) {
            ctx.strokeStyle = `rgba(${c.link[0]},${c.link[1]},${c.link[2]},${(1 - d / lim) * 0.35})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (const a of pts) {
        const tw = 0.6 + 0.4 * Math.sin(t * 0.02 + a.p);
        ctx.fillStyle = `rgba(${c.node[0]},${c.node[1]},${c.node[2]},${0.9 * tw})`;
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
      }
      t++;
      if (running && !reduced) raf = global.requestAnimationFrame(draw);
    }

    function resize() { ({ ctx, w, h } = fit(canvas)); if (reduced) draw(); }
    global.addEventListener('resize', resize);
    if (opts.pointerTarget) {
      opts.pointerTarget.addEventListener('pointermove', (e) => {
        const r = canvas.getBoundingClientRect(); pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top;
      });
      opts.pointerTarget.addEventListener('pointerleave', () => { pointer.x = -9999; pointer.y = -9999; });
    }
    if ('IntersectionObserver' in global) {
      new IntersectionObserver((entries) => {
        running = entries[0].isIntersecting;
        if (running && !reduced && !raf) raf = global.requestAnimationFrame(draw);
        if (!running) { global.cancelAnimationFrame(raf); raf = 0; }
      }).observe(canvas);
    }
    draw();
    return { redraw: draw };
  }

  global.AlepoArt = { cover, mesh, PALETTE };
})(window);
