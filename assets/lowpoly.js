/* Low poly : petit moteur 3D maison, sans dépendance.
   Formes à facettes, ombrage à plat, rotation, réaction au pointeur.
   Les objets sont décoratifs : les canvas sont aria-hidden. */
(function () {
  'use strict';

  /* ---------- palettes : [ombre, ton moyen, lumière] ---------- */
  var PAL = {
    blue:   ['#0F2F9E', '#1F5BFF', '#86AAFF'],
    green:  ['#0B6B45', '#22A865', '#A6EBC9'],
    coral:  ['#B8213A', '#FF5C6C', '#FFBDB6'],
    gold:   ['#B87A00', '#FFC236', '#FFEAA0'],
    ink:    ['#060C22', '#12204A', '#4A5C9E'],
    paper:  ['#AEBBE0', '#DCE6FB', '#FFFFFF']
  };
  function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
  function shade(pal, t) {
    var a = hex(pal[0]), b = hex(pal[1]), c = hex(pal[2]), r;
    t = Math.max(0, Math.min(1, t));
    if (t < 0.5) { var k = t * 2; r = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; }
    else { var k2 = (t - 0.5) * 2; r = [b[0] + (c[0] - b[0]) * k2, b[1] + (c[1] - b[1]) * k2, b[2] + (c[2] - b[2]) * k2]; }
    return 'rgb(' + (r[0] | 0) + ',' + (r[1] | 0) + ',' + (r[2] | 0) + ')';
  }

  /* ---------- maths ---------- */
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function norm(a) { var l = Math.sqrt(dot(a, a)) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
  function rot(p, ax, ay) {
    var cy = Math.cos(ay), sy = Math.sin(ay), cx = Math.cos(ax), sx = Math.sin(ax);
    var x = p[0] * cy + p[2] * sy, z = -p[0] * sy + p[2] * cy, y = p[1];
    var y2 = y * cx - z * sx, z2 = y * sx + z * cx;
    return [x, y2, z2];
  }
  function seeded(seed) { var s = seed; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

  /* ---------- Mesh : faces orientées vers l'extérieur grâce au centre de leur pièce ---------- */
  function Mesh() { this.faces = []; }
  Mesh.prototype.add = function (pts, tone, center) {
    // pts : tableau de [x,y,z] ; orientation corrigée pour regarder vers l'extérieur de "center"
    var n = norm(cross(sub(pts[1], pts[0]), sub(pts[2], pts[0])));
    var m = [0, 0, 0];
    for (var i = 0; i < pts.length; i++) { m[0] += pts[i][0]; m[1] += pts[i][1]; m[2] += pts[i][2]; }
    m = [m[0] / pts.length, m[1] / pts.length, m[2] / pts.length];
    if (dot(n, sub(m, center)) < 0) { pts = pts.slice().reverse(); n = [-n[0], -n[1], -n[2]]; }
    this.faces.push({ p: pts, n: n, tone: tone || 0 });
    return this;
  };

  /* ---------- formes ---------- */
  function icosphere(r, seed, jitter) {
    var t = (1 + Math.sqrt(5)) / 2, rnd = seeded(seed || 7);
    var v = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(norm);
    var f = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
    if ((jitter === undefined ? 0 : jitter) >= 0 && seed !== 0) { // une subdivision
      var cache = {}, nf = [];
      var mid = function (a, b) {
        var k = a < b ? a + '_' + b : b + '_' + a;
        if (cache[k] === undefined) { var p = norm([(v[a][0] + v[b][0]) / 2, (v[a][1] + v[b][1]) / 2, (v[a][2] + v[b][2]) / 2]); v.push(p); cache[k] = v.length - 1; }
        return cache[k];
      };
      f.forEach(function (q) { var a = mid(q[0], q[1]), b = mid(q[1], q[2]), c = mid(q[2], q[0]); nf.push([q[0], a, c], [q[1], b, a], [q[2], c, b], [a, b, c]); });
      f = nf;
    }
    var jr = jitter === undefined ? 0.07 : jitter;
    var vv = v.map(function (p) { var s = r * (1 + (rnd() - 0.5) * 2 * jr); return [p[0] * s, p[1] * s, p[2] * s]; });
    var m = new Mesh();
    f.forEach(function (q) { m.add([vv[q[0]], vv[q[1]], vv[q[2]]], 0, [0, 0, 0]); });
    return m;
  }

  function gem(r, h, sides) {
    var m = new Mesh(), n = sides || 8, c = [0, 0, 0];
    var ring = function (rad, y, off) { var a = []; for (var i = 0; i < n; i++) { var t = (i + (off || 0)) / n * Math.PI * 2; a.push([Math.cos(t) * rad, y, Math.sin(t) * rad]); } return a; };
    var table = ring(r * 0.52, h * 0.5, 0.5), girdle = ring(r, h * 0.12, 0), tip = [0, -h, 0];
    m.add(table.slice(), 2, c);
    for (var i = 0; i < n; i++) {
      var j = (i + 1) % n;
      m.add([table[i], table[j], girdle[j], girdle[i]], 1, c);
      m.add([girdle[i], girdle[j], tip], 0, c);
    }
    return m;
  }

  function shield() {
    var m = new Mesh(), c = [0, 0.05, 0];
    var outline = [[-0.92, 0.88], [0, 1.08], [0.92, 0.88], [0.92, 0.12], [0.58, -0.52], [0, -1.08], [-0.58, -0.52], [-0.92, 0.12]];
    var n = outline.length, d = 0.16;
    var at = function (s, z) { return outline.map(function (p) { return [p[0] * s, p[1] * s + 0.04, z]; }); };
    var back = at(1, -d), outer = at(1, d), inner = at(0.62, d + 0.2);
    var capC = [0, 0.04, d + 0.34];
    for (var i = 0; i < n; i++) {
      var j = (i + 1) % n;
      m.add([outer[i], outer[j], back[j], back[i]], 0, c);          // tranche
      m.add([outer[i], outer[j], inner[j], inner[i]], 1, c);        // biseau
      m.add([inner[i], inner[j], capC], 2, c);                       // dôme
      m.add([back[i], back[j], [0, 0.04, -d - 0.04]], 0, c);         // dos
    }
    return m;
  }

  function box(m, x, y0, y1, w, d) {
    var c = [x, (y0 + y1) / 2, 0], hw = w / 2, hd = d / 2;
    var P = function (sx, y, sz) { return [x + sx * hw, y, sz * hd]; };
    m.add([P(-1, y1, -1), P(1, y1, -1), P(1, y1, 1), P(-1, y1, 1)], 2, c);
    m.add([P(-1, y0, 1), P(1, y0, 1), P(1, y1, 1), P(-1, y1, 1)], 1, c);
    m.add([P(1, y0, -1), P(1, y0, 1), P(1, y1, 1), P(1, y1, -1)], 0, c);
    m.add([P(-1, y0, -1), P(-1, y0, 1), P(-1, y1, 1), P(-1, y1, -1)], 0, c);
    m.add([P(-1, y0, -1), P(1, y0, -1), P(1, y1, -1), P(-1, y1, -1)], 1, c);
    m.add([P(-1, y0, -1), P(1, y0, -1), P(1, y0, 1), P(-1, y0, 1)], 0, c);
  }
  function bars() {
    var m = new Mesh(), hs = [0.7, 1.15, 1.7, 2.35], i;
    for (i = 0; i < hs.length; i++) box(m, -1.35 + i * 0.9, -1.2, -1.2 + hs[i], 0.62, 0.62);
    return m;
  }
  function coin(r, th, sides) {
    var m = new Mesh(), n = sides || 10, c = [0, 0, 0], top = [], bot = [];
    for (var i = 0; i < n; i++) { var t = i / n * Math.PI * 2; top.push([Math.cos(t) * r, th / 2, Math.sin(t) * r]); bot.push([Math.cos(t) * r, -th / 2, Math.sin(t) * r]); }
    m.add(top, 2, c);
    var inner = top.map(function (p) { return [p[0] * 0.62, p[1] + 0.02, p[2] * 0.62]; });
    m.add(inner, 1, [0, 1, 0]);
    for (var j = 0; j < n; j++) { var k = (j + 1) % n; m.add([top[j], top[k], bot[k], bot[j]], 0, c); }
    m.add(bot, 0, c);
    return m;
  }
  function pyramid(r, h) {
    var m = new Mesh(), c = [0, 0, 0], a = [[-r, -h / 2, -r], [r, -h / 2, -r], [r, -h / 2, r], [-r, -h / 2, r]], t = [0, h / 2, 0];
    m.add(a, 0, c);
    for (var i = 0; i < 4; i++) m.add([a[i], a[(i + 1) % 4], t], i % 2 ? 1 : 2, c);
    return m;
  }

  var SHAPES = { icosphere: icosphere, gem: gem, shield: shield, bars: bars, coin: coin, pyramid: pyramid };

  /* ---------- scènes : liste d'objets {mesh, pal, pos, scale, spin, orbit, bob} ---------- */
  function sceneHero() {
    return [
      { mesh: shield(), pal: [PAL.blue, PAL.blue, PAL.paper], pos: [0, 0, 0], scale: 1.18, spinY: 0, sway: 0.5 },
      { mesh: icosphere(0.34, 5, 0.1), pal: [PAL.green], pos: [0, 0, 0], orbit: { r: 1.9, y: 0.55, speed: 0.55, ph: 0.2 }, spinY: 0.9 },
      { mesh: gem(0.3, 0.5, 6), pal: [PAL.coral], pos: [0, 0, 0], orbit: { r: 1.85, y: -0.35, speed: 0.55, ph: 2.3 }, spinY: 1.1 },
      { mesh: coin(0.3, 0.1, 10), pal: [PAL.gold], pos: [0, 0, 0], orbit: { r: 1.95, y: 0.1, speed: 0.55, ph: 4.4 }, spinY: 1.4, tilt: 0.9 }
    ];
  }
  var SCENES = {
    hero: sceneHero,
    marketing: function () { return [{ mesh: icosphere(1.25, 11, 0.09), pal: [PAL.green], scale: 1, spinY: 0.35 }, { mesh: pyramid(0.22, 0.5), pal: [PAL.gold], orbit: { r: 1.9, y: 0.7, speed: 0.6, ph: 0 }, spinY: 1.2 }]; },
    ads: function () { return [{ mesh: bars(), pal: [PAL.blue], scale: 0.95, spinY: 0.28 }, { mesh: coin(0.42, 0.14, 10), pal: [PAL.gold], pos: [1.2, 1.55, 0], bob: { amp: 0.14, speed: 1.6 }, spinY: 1.6, tilt: 0.7 }]; },
    adsw: function () { return [{ mesh: bars(), pal: [PAL.paper], scale: 0.95, spinY: 0.28 }, { mesh: coin(0.42, 0.14, 10), pal: [PAL.gold], pos: [1.2, 1.55, 0], bob: { amp: 0.14, speed: 1.6 }, spinY: 1.6, tilt: 0.7 }]; },
    crea: function () { return [{ mesh: gem(1.05, 1.3, 8), pal: [PAL.coral], scale: 1, spinY: 0.5 }, { mesh: gem(0.28, 0.4, 5), pal: [PAL.blue], orbit: { r: 1.7, y: 0.5, speed: 0.7, ph: 1 }, spinY: 1.1 }, { mesh: pyramid(0.2, 0.45), pal: [PAL.gold], orbit: { r: 1.6, y: -0.6, speed: 0.7, ph: 4 }, spinY: 1.3 }]; },
    ia: function () { return [{ mesh: icosphere(1.2, 0, 0), pal: [PAL.paper], scale: 1, spinY: 0.4 }, { mesh: icosphere(0.4, 3, 0.05), pal: [PAL.blue], orbit: { r: 1.9, y: 0.2, speed: 0.8, ph: 0 }, spinY: 1 }]; },
    shield: function () { return [{ mesh: shield(), pal: [PAL.blue, PAL.blue, PAL.paper], scale: 1.1, spinY: 0, sway: 0.55 }]; }
  };

  /* ---------- rendu ---------- */
  var LIGHT = norm([-0.45, 0.75, 0.62]);

  function Stage(canvas, name, opts) {
    this.c = canvas; this.ctx = canvas.getContext('2d');
    this.objs = SCENES[name](); this.t = Math.random() * 10; this.px = 0; this.py = 0; this.tx = 0; this.ty = 0;
    this.opts = opts || {}; this.visible = false; this.last = 0; this.raf = 0;
    this.baseTilt = this.opts.tilt === undefined ? 0.3 : this.opts.tilt;
    this.resize();
  }
  Stage.prototype.resize = function () {
    var r = this.c.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
    this.w = Math.max(60, r.width); this.h = Math.max(60, r.height);
    this.c.width = Math.round(this.w * d); this.c.height = Math.round(this.h * d);
    this.ctx.setTransform(d, 0, 0, d, 0, 0);
  };
  Stage.prototype.draw = function (t) {
    var ctx = this.ctx, W = this.w, H = this.h, polys = [], self = this;
    ctx.clearRect(0, 0, W, H);
    var unit = Math.min(W, H) / 4.5, fl = 9;
    this.px += (this.tx - this.px) * 0.08; this.py += (this.ty - this.py) * 0.08;
    var worldY = this.py * 0.9, worldX = this.baseTilt + this.px * 0.5;
    this.objs.forEach(function (o, oi) {
      var scale = o.scale || 1, pos = o.pos ? o.pos.slice() : [0, 0, 0];
      var spin = (o.spinY || 0) * t + (o.sway ? Math.sin(t * 0.8) * o.sway : 0);
      if (o.orbit) { var a = t * o.orbit.speed + o.orbit.ph; pos = [Math.cos(a) * o.orbit.r, o.orbit.y, Math.sin(a) * o.orbit.r]; }
      if (o.bob) pos[1] += Math.sin(t * o.bob.speed) * o.bob.amp;
      var pal = o.pal;
      o.mesh.faces.forEach(function (f) {
        var pts = f.p.map(function (p) {
          var q = rot([p[0] * scale, p[1] * scale, p[2] * scale], o.tilt || 0, spin);
          q = [q[0] + pos[0], q[1] + pos[1], q[2] + pos[2]];
          return rot(q, worldX, worldY);
        });
        var n = rot(rot(f.n, o.tilt || 0, spin), worldX, worldY);
        if (n[2] <= 0) return; // face cachée
        var zc = 0; pts.forEach(function (p) { zc += p[2]; }); zc /= pts.length;
        var lit = Math.max(0, dot(n, LIGHT));
        var P = pal[Math.min(f.tone, pal.length - 1)];
        polys.push({ z: zc, pts: pts, col: shade(P, 0.12 + lit * 0.9) });
      });
    });
    polys.sort(function (a, b) { return a.z - b.z; });
    polys.forEach(function (pl) {
      ctx.beginPath();
      pl.pts.forEach(function (p, i) {
        var s = fl / (fl - p[2] * 0.35), x = W / 2 + p[0] * unit * s, y = H / 2 - p[1] * unit * s;
        if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      });
      ctx.closePath(); ctx.fillStyle = pl.col; ctx.strokeStyle = pl.col; ctx.lineWidth = 0.9; ctx.lineJoin = 'round';
      ctx.fill(); ctx.stroke();
    });
  };
  Stage.prototype.loop = function (now) {
    var self = this;
    if (!this.visible) { this.raf = 0; return; }
    var dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 0.016; this.last = now;
    this.t += dt; this.draw(this.t);
    this.raf = requestAnimationFrame(function (n) { self.loop(n); });
  };

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var stages = [];

  function mount(canvas) {
    if (!canvas.getContext) return;
    var s = new Stage(canvas, canvas.getAttribute('data-lowpoly') || 'hero', { tilt: parseFloat(canvas.getAttribute('data-tilt')) });
    if (isNaN(s.opts.tilt)) s.baseTilt = 0.3;
    stages.push(s);
    s.draw(s.t);
    if (reduce) return;
    var host = canvas.closest('[data-lowpoly-host]') || canvas.parentElement;
    host.addEventListener('pointermove', function (e) {
      var r = host.getBoundingClientRect();
      s.ty = ((e.clientX - r.left) / r.width - 0.5) * 1.6;
      s.tx = ((e.clientY - r.top) / r.height - 0.5) * 0.9;
    });
    host.addEventListener('pointerleave', function () { s.tx = 0; s.ty = 0; });
    var io = new IntersectionObserver(function (en) {
      s.visible = en[0].isIntersecting;
      if (s.visible && !s.raf) { s.last = 0; s.raf = requestAnimationFrame(function (n) { s.loop(n); }); }
    }, { rootMargin: '80px' });
    io.observe(canvas);
  }

  var rz;
  window.addEventListener('resize', function () {
    clearTimeout(rz);
    rz = setTimeout(function () { stages.forEach(function (s) { s.resize(); s.draw(s.t); }); }, 120);
  });

  window.LowPoly = { mount: mount, PAL: PAL };
  document.querySelectorAll('canvas[data-lowpoly]').forEach(mount);
})();
