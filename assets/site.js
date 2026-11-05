/* Portfolio Matis Sonzini : comportements. Le contenu reste lisible si ce script échoue. */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- révélations au défilement (échelonnées par groupe) ---------- */
  $$('[data-stagger]').forEach(function (g) {
    $$('[data-r]', g).forEach(function (el, i) { if (!el.style.getPropertyValue('--d')) el.style.setProperty('--d', (i * 90) + 'ms'); });
  });
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    $$('[data-r]').forEach(function (el) { io.observe(el); });
  } else {
    $$('[data-r]').forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- compteurs ---------- */
  function fmt(el, v) { el.textContent = (el.getAttribute('data-prefix') || '') + Math.round(v) + (el.getAttribute('data-suffix') || ''); }
  var counters = $$('[data-count]');
  if (!reduce && 'IntersectionObserver' in window) {
    counters.forEach(function (el) { fmt(el, 0); });
    var co = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        if (!e.isIntersecting) return;
        co.unobserve(e.target);
        var el = e.target, to = parseFloat(el.getAttribute('data-count')), t0 = null, dur = 1400;
        (function step(t) {
          if (t0 === null) t0 = t;
          var p = Math.min(1, (t - t0) / dur), k = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
          fmt(el, to * k);
          if (p < 1) requestAnimationFrame(step);
        })(performance.now());
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { co.observe(el); });
  }

  /* ---------- plateformes qui défilent ---------- */
  var words = $$('.cycle-w');
  if (words.length) {
    var cur = 0;
    words[0].classList.add('is-on');
    if (!reduce) {
      setInterval(function () {
        var out = words[cur];
        out.classList.remove('is-on'); out.classList.add('is-out');
        cur = (cur + 1) % words.length;
        var nxt = words[cur];
        nxt.classList.remove('is-out'); nxt.style.transition = 'none'; nxt.style.transform = 'translateY(110%)';
        void nxt.offsetWidth; nxt.style.transition = ''; nxt.style.transform = '';
        nxt.classList.add('is-on');
        setTimeout(function () { out.classList.remove('is-out'); }, 520);
      }, 2200);
    }
  }

  /* ---------- carrousel de campagnes ---------- */
  var V = [ // [fichier, vignette, marque, titre]
    ['campaigns/bensimon-video-prix.mp4.mp4', 'campaigns/posters/bensimon-video-prix.jpg', 'Bensimon', 'Vidéo prix'],
    ['campaigns/bricolage direct noel.mp4', 'campaigns/posters/bricolage-direct-noel.jpg', 'Bricolage Direct', 'Noël'],
    ['campaigns/Steiner80%.mp4', 'campaigns/posters/Steiner80-.jpg', 'Bricolage Direct', 'Steiner'],
    ['campaigns/dr-pierre-ricaud-creme-zoom.mp4', 'campaigns/posters/dr-pierre-ricaud-creme-zoom.jpg', 'Dr Pierre Ricaud', 'Crème, zoom produit'],
    ['campaigns/pierre-ricaud-sonia.mp4', 'campaigns/posters/pierre-ricaud-sonia.jpg', 'Dr Pierre Ricaud', 'Sonia'],
    ['campaigns/ekoi cofidis.mp4', 'campaigns/posters/ekoi-cofidis.jpg', 'Ekoi', 'Cofidis'],
    ['campaigns/ekoi-city-style.mp4', 'campaigns/posters/ekoi-city-style.jpg', 'Ekoi', 'City style'],
    ['campaigns/lyly-et-oli-sapin-noel.mp4', 'campaigns/posters/lyly-et-oli-sapin-noel.jpg', 'Lyly & Oli', 'Sapin de Noël'],
    ['campaigns/mincidelice-regime.mp4', 'campaigns/posters/mincidelice-regime.jpg', 'Mincidélice', 'Régime'],
    ['campaigns/pmu-crea.mp4', 'campaigns/posters/pmu-crea.jpg', 'PMU', 'Créa'],
    ['campaigns/simone-perele-pre-soldes.mp4', 'campaigns/posters/simone-perele-pre-soldes.jpg', 'Simone Pérèle', 'Pré-soldes'],
    ['campaigns/simone-perele-soldes.mp4', 'campaigns/posters/simone-perele-soldes.jpg', 'Simone Pérèle', 'Soldes']
  ];
  var I = [ // [image, marque, titre]
    ['campaigns/bensimon-la-tennis.jpg', 'Bensimon', 'La Tennis'],
    ['campaigns/bricolage-direct-steiner.jpg', 'Bricolage Direct', 'Steiner'],
    ['campaigns/fitadium.jpg', 'Fitadium', 'Social proof'],
    ['campaigns/ekoi-city-style.jpg', 'Ekoi', 'City style'],
    ['campaigns/tourtel-twist.jpg', 'Tourtel Twist', 'Twist'],
    ['campaigns/bensimon-soldes.jpg', 'Bensimon', 'Soldes'],
    ['campaigns/lashile-good-hair.jpg', 'Lashilé Beauty', 'Good hair'],
    ['campaigns/mincidelice.jpg', 'Mincidélice', 'Acquisition']
  ];
  var rail = $('#rail');
  var active = null;

  function stop(media) {
    if (!media) return;
    var v = $('video', media); if (!v) return;
    v.pause(); v.muted = true; media.classList.remove('is-live', 'is-active');
    $('.cmp-bar i', media).style.width = '0';
    if (active === media) active = null;
  }
  function el(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html !== undefined) n.innerHTML = html; return n; }
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  function card(item) {
    var c = el('article', 'cmp-card');
    var media;
    if (item.v) {
      media = el('button', 'cmp-media');
      media.type = 'button';
      media.setAttribute('aria-label', 'Lire la vidéo : ' + item.brand + ', ' + item.title);
      var img = new Image(); img.src = item.poster; img.alt = ''; img.loading = 'lazy'; img.width = 420; img.height = 746;
      var vid = document.createElement('video');
      vid.muted = true; vid.loop = true; vid.playsInline = true; vid.preload = 'none'; vid.setAttribute('playsinline', '');
      vid.dataset.src = encodeURI(item.v);
      media.appendChild(img); media.appendChild(vid);
      media.appendChild(el('span', 'cmp-play', '<svg class="ico" aria-hidden="true"><use href="#i-play"/></svg>'));
      media.appendChild(el('span', 'cmp-bar', '<i></i>'));
      var load = function () { if (!vid.src) { vid.src = vid.dataset.src; } };
      var preview = function () {
        if (active === media) return;
        load(); media.classList.add('is-live');
        var p = vid.play(); if (p && p.catch) p.catch(function () {});
      };
      var leave = function () { if (active !== media) { vid.pause(); media.classList.remove('is-live'); } };
      media.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') preview(); });
      media.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') leave(); });
      media.addEventListener('focus', preview);
      media.addEventListener('blur', leave);
      media.addEventListener('click', function () {
        if (active === media) { // second clic : pause
          if (vid.paused) { vid.play(); } else { vid.pause(); }
          return;
        }
        stop(active); load();
        active = media; media.classList.add('is-live', 'is-active');
        vid.muted = false; vid.currentTime = 0;
        var p = vid.play(); if (p && p.catch) p.catch(function () { vid.muted = true; vid.play(); });
      });
      vid.addEventListener('timeupdate', function () { if (vid.duration) $('.cmp-bar i', media).style.width = (vid.currentTime / vid.duration * 100) + '%'; });
    } else {
      media = el('div', 'cmp-media');
      var im = new Image(); im.src = item.poster; im.alt = item.brand + ', ' + item.title; im.loading = 'lazy'; im.width = 338; im.height = 600;
      media.appendChild(im);
    }
    c.appendChild(media);
    c.appendChild(el('div', 'cmp-cap', '<strong>' + esc(item.brand) + '</strong><span>' + esc(item.title) + '</span>'));
    return c;
  }

  if (rail) {
    var items = [], i = 0;
    while (i < V.length || i < I.length) {
      if (i < V.length) items.push({ v: V[i][0], poster: V[i][1], brand: V[i][2], title: V[i][3] });
      if (i < I.length) items.push({ poster: I[i][0], brand: I[i][1], title: I[i][2] });
      i++;
    }
    items.forEach(function (it) { rail.appendChild(card(it)); });
    var step = function () { var c = $('.cmp-card', rail); return c ? c.getBoundingClientRect().width * 2 + 32 : 400; };
    $('#railPrev').addEventListener('click', function () { rail.scrollBy({ left: -step(), behavior: reduce ? 'auto' : 'smooth' }); });
    $('#railNext').addEventListener('click', function () { rail.scrollBy({ left: step(), behavior: reduce ? 'auto' : 'smooth' }); });
    rail.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { rail.scrollBy({ left: step() / 2, behavior: 'smooth' }); }
      if (e.key === 'ArrowLeft') { rail.scrollBy({ left: -step() / 2, behavior: 'smooth' }); }
    });
    // pause la vidéo active quand elle sort de l'écran
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { if (!en[0].isIntersecting) stop(active); }, { threshold: 0 }).observe(rail);
    }
  }

  /* ---------- formulaire de brief : prépare le mail ---------- */
  var send = $('#send');
  function sel(id) { return $$('#' + id + ' .pick[aria-pressed="true"]').map(function (b) { return b.textContent.trim(); }); }
  function refresh() {
    if (!send) return;
    var needs = sel('needs'), budget = sel('budgets');
    var subject = 'Projet' + (needs.length ? ' : ' + needs.join(', ') : '');
    var body = 'Bonjour Matis,\n\n' +
      (needs.length ? 'Mon besoin : ' + needs.join(', ') + '.\n' : '') +
      (budget.length ? 'Budget média mensuel : ' + budget[0] + '.\n' : '') +
      '\nVoici quelques mots sur mon projet :\n\n';
    send.href = 'mailto:sonzini.matis@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  }
  $$('#needs .pick').forEach(function (b) {
    b.addEventListener('click', function () { b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); refresh(); });
  });
  $$('#budgets .pick').forEach(function (b) {
    b.addEventListener('click', function () {
      var was = b.getAttribute('aria-pressed') === 'true';
      $$('#budgets .pick').forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
      b.setAttribute('aria-pressed', was ? 'false' : 'true'); refresh();
    });
  });
  refresh();
})();
