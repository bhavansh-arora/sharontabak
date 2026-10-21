/* ==========================================================================
   Sharon Tabak Coaching: interactions
   Plain JavaScript, no framework. Every effect degrades gracefully.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- Settings you may want to change ---------- */
  var CONFIG = {
    calendly: 'https://calendly.com/sharontabak-sharontabak/30min',
    email: 'sharontabak@sharontabak.com',
    // Optional: paste a Formspree / Basin / Getform endpoint to receive form
    // messages directly. Leave empty to open the visitor's email app instead.
    formEndpoint: ''
  };

  var doc = document;
  var root = doc.documentElement;
  var body = doc.body;
  var mq = function (q) { return window.matchMedia(q).matches; };
  var reduced = mq('(prefers-reduced-motion: reduce)');
  var finePointer = mq('(hover: hover) and (pointer: fine)');
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  root.classList.remove('no-js');

  /* ---------- Year ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Preloader & page transitions ---------- */
  var preloader = $('.preloader');
  var curtain = $('.curtain');

  var introDone = false;
  function finishIntro() {
    if (introDone) return;
    introDone = true;
    if (root.classList.contains('is-preloading') && preloader) {
      preloader.classList.add('is-done');
      setTimeout(function () { root.classList.remove('is-preloading'); }, 1000);
    }
    if (!root.classList.contains('is-entering')) setTimeout(startReveals, root.classList.contains('is-preloading') ? 650 : 120);
  }

  function landOnHash() {
    if (!location.hash || location.hash.length < 2) return;
    var el = doc.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (!el) return;
    el.scrollIntoView({ behavior: 'instant', block: 'start' });
    lastY = window.scrollY; // a jump is not "scrolling down": keep the header visible
    if (header) header.classList.remove('is-hidden');
  }

  if (!root.classList.contains('is-entering') && location.hash && doc.fonts && doc.fonts.ready) doc.fonts.ready.then(landOnHash);

  /* Arriving from another page: lift the branded curtain as soon as the page
     and its fonts are ready (no need to wait for every image). */
  if (root.classList.contains('is-entering') && curtain) {
    var lifted = false;
    var lift = function () {
      if (lifted) return; lifted = true;
      landOnHash();
      curtain.classList.add('is-out');
      setTimeout(startReveals, 650);
      setTimeout(function () { root.classList.remove('is-entering'); curtain.classList.remove('is-out'); }, 1500);
    };
    var fontsReady = doc.fonts && doc.fonts.ready ? doc.fonts.ready : Promise.resolve();
    Promise.race([fontsReady, new Promise(function (r) { setTimeout(r, 700); })]).then(function () { setTimeout(lift, 180); });
    setTimeout(lift, 1600);
  }

  var introDelay = root.classList.contains('is-preloading') && !reduced ? 1700 : 0;
  if (doc.readyState === 'complete') setTimeout(finishIntro, introDelay);
  else {
    var introStart = Date.now();
    window.addEventListener('load', function () {
      setTimeout(finishIntro, Math.max(0, introDelay - (Date.now() - introStart)));
    });
    // Never let a slow asset hold the page hostage
    setTimeout(finishIntro, 3200);
  }

  doc.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (a.hasAttribute('data-book') || a.target === '_blank' || a.hasAttribute('download')) return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#' || /^(mailto|tel|javascript):/i.test(href)) return;
    var url;
    try { url = new URL(a.href, location.href); } catch (err) { return; }
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.hash) return;
    if (reduced || !curtain) return;
    e.preventDefault();
    var dest = pageLabel(url);
    var labelEl = $('[data-curtain-label]'), chapterEl = $('[data-curtain-chapter]');
    if (labelEl) labelEl.textContent = dest[0];
    if (chapterEl) chapterEl.textContent = dest[1];
    try { sessionStorage.setItem('st-transition', dest[0] + '|' + dest[1]); } catch (err) {}
    closeMenu();
    root.classList.remove('is-entering');
    curtain.classList.remove('is-out');
    if (lenis) lenis.stop(); // nothing should scroll under the curtain
    root.classList.add('is-leaving');
    setTimeout(function () { location.href = url.href; }, 1050);
  });
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) { root.classList.remove('is-leaving', 'is-entering'); if (curtain) curtain.classList.remove('is-out'); if (lenis) lenis.start(); }
  });

  // Destination name + "chapter" shown on the branded page transition
  function pageLabel(url) {
    var file = url.pathname.split('/').pop() || 'index.html';
    var pages = {
      'index.html': ['Home', 'Chapter 01'],
      'about.html': ['About Sharon', 'Chapter 02'],
      'services.html': ['Coaching', 'Chapter 03'],
      'stories.html': ['Client stories', 'Chapter 04'],
      'community.html': ['Women for Women\u2019s Truths', 'Chapter 05'],
      'contact.html': ['Let\u2019s talk', 'Chapter 06'],
      'terms-and-conditions.html': ['Terms', 'Sharon Tabak Coaching']
    };
    return pages[file] || ['Sharon Tabak', 'Sharon Tabak Coaching'];
  }

  /* ---------- Smooth scroll (desktop only) ---------- */
  var lenis = null;
  if (!reduced && finePointer && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.16, wheelMultiplier: 1.05, smoothWheel: true });
    var rafLenis = function (t) { lenis.raf(t); requestAnimationFrame(rafLenis); };
    requestAnimationFrame(rafLenis);
  }
  function scrollToEl(el) {
    if (lenis) lenis.scrollTo(el, { offset: -80 });
    else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  }
  doc.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    if (id.length < 2) return;
    var el = doc.getElementById(id.slice(1));
    if (!el) return;
    e.preventDefault();
    scrollToEl(el);
  });

  /* ---------- Header ---------- */
  var header = $('[data-header]');
  var lastY = window.scrollY;
  var darkZones = $$('[data-header-theme="light"]');
  function updateHeader(y, light) {
    if (!header) return;
    header.classList.toggle('is-scrolled', y > 40);
    var delta = y - lastY;
    if (!root.classList.contains('menu-open') && Math.abs(delta) > 4) header.classList.toggle('is-hidden', delta > 0 && y > 400);
    lastY = y;
    header.classList.toggle('is-light', !!light);
  }

  /* ---------- Mobile menu ---------- */
  var burger = $('[data-burger]');
  var menu = $('[data-menu]');
  function openMenu() {
    root.classList.add('menu-open');
    if (menu) menu.removeAttribute('inert');
    if (burger) { burger.setAttribute('aria-expanded', 'true'); burger.setAttribute('aria-label', 'Close menu'); }
    if (lenis) lenis.stop();
    body.style.overflow = 'hidden';
  }
  function closeMenu() {
    if (!root.classList.contains('menu-open')) return;
    root.classList.remove('menu-open');
    if (menu) menu.setAttribute('inert', '');
    if (burger) { burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Open menu'); }
    if (lenis) lenis.start();
    body.style.overflow = '';
  }
  if (burger) burger.addEventListener('click', function () {
    root.classList.contains('menu-open') ? closeMenu() : openMenu();
  });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  window.addEventListener('resize', function () { if (window.innerWidth > 1024) closeMenu(); });

  /* ---------- Split headings into words ---------- */
  function splitWords(el) {
    var i = 0;
    function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var parts = child.textContent.split(/(\s+)/);
          var frag = doc.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(doc.createTextNode(' ')); return; }
            var w = doc.createElement('span'); w.className = 'w';
            var inner = doc.createElement('span'); inner.className = 'w__i'; inner.style.setProperty('--i', i++);
            inner.textContent = p; w.appendChild(inner); frag.appendChild(w);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && !child.matches('svg, br, img')) {
          walk(child);
        }
      });
    }
    walk(el);
    el.classList.add('is-split');
  }
  $$('[data-split]').forEach(splitWords);

  /* Words that light up while scrolling */
  var scrubs = $$('[data-scrub]').map(function (el) {
    el.classList.add('scrub');
    var words = [];
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = doc.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(doc.createTextNode(' ')); return; }
            var s = doc.createElement('span'); s.className = 'sw'; s.textContent = p; words.push(s); frag.appendChild(s);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) walk(child);
      });
    })(el);
    return { el: el, words: words, lit: -1 };
  });
  if (reduced) root.classList.add('no-scrub');

  /* ---------- Reveal on scroll ---------- */
  var revealTargets = $$('[data-reveal], [data-stagger], .is-split');
  var io = null;
  function startReveals() {
    root.classList.add('intro-done');
    if (!('IntersectionObserver' in window) || reduced) {
      revealTargets.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    if (io) return;
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealTargets.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Count up ---------- */
  var counters = $$('[data-count]');
  if (counters.length && 'IntersectionObserver' in window && !reduced) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target; cio.unobserve(el);
        var end = parseFloat(el.getAttribute('data-count'));
        if (reduced) { el.textContent = end; return; }
        var t0 = null, dur = 1600;
        (function step(t) {
          if (!t0) t0 = t;
          var p = clamp((t - t0) / dur, 0, 1);
          el.textContent = Math.round(end * (1 - Math.pow(1 - p, 4)));
          if (p < 1) requestAnimationFrame(step);
        })(performance.now());
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { el.textContent = '0'; cio.observe(el); });
  }

  /* ---------- Marquee: duplicate content for a seamless loop ---------- */
  $$('.marquee__track').forEach(function (track) {
    var group = track.querySelector('.marquee__group');
    if (!group) return;
    var clone = group.cloneNode(true); clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
  });

  /* ---------- Scroll-driven effects ---------- */
  var parallax = $$('[data-parallax]');
  var progressEls = $$('[data-progress]');
  var hscroll = $('[data-hscroll]');
  var hTrack = hscroll ? $('[data-hscroll-track]', hscroll) : null;
  var hBar = hscroll ? $('.journey__progress', hscroll) : null;
  var hEnabled = false;
  var hDistance = 0;

  function setupHScroll() {
    if (!hscroll || !hTrack) return;
    hEnabled = !reduced && window.innerWidth > 1024;
    hscroll.classList.toggle('is-static', !hEnabled);
    if (!hEnabled) { hscroll.style.height = ''; hTrack.style.transform = ''; return; }
    hDistance = Math.max(0, hTrack.scrollWidth - window.innerWidth);
    hscroll.style.height = (window.innerHeight + hDistance * 0.7) + 'px';
  }

  var dock = $('[data-dock]');
  var ctaBlock = $('.cta');
  var footerEl = $('.footer');
  var vh = window.innerHeight;
  // Parallax only where it is cheap and pleasant: large screens with a mouse.
  var parallaxOn = function () { return !reduced && finePointer && window.innerWidth > 1024; };

  /* One pass per frame: read every measurement first, then write. Mixing the
     two forces the browser to recalculate layout repeatedly, which is what
     makes scrolling feel heavy. */
  function onScroll() {
    var y = window.scrollY;
    var i;

    // ---- read ----
    var px = [];
    if (parallaxOn()) {
      for (i = 0; i < parallax.length; i++) {
        // measure the untransformed parent so the element never chases itself
        var host = parallax[i].parentElement || parallax[i];
        var r = host.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) continue;
        px.push([parallax[i], r.top + r.height / 2 - vh / 2, parseFloat(parallax[i].getAttribute('data-parallax')) || 0.12]);
      }
    }
    var pv = [];
    for (i = 0; i < progressEls.length; i++) {
      var pr = progressEls[i].getBoundingClientRect();
      if (pr.bottom < 0 || pr.top > vh) continue;
      pv.push([progressEls[i], clamp((vh - pr.top) / (vh + pr.height), 0, 1)]);
    }
    var sv = [];
    for (i = 0; i < scrubs.length; i++) {
      var sr = scrubs[i].el.getBoundingClientRect();
      if (sr.bottom < -vh || sr.top > vh * 2) continue;
      sv.push([scrubs[i], clamp((vh * 0.92 - sr.top) / (sr.height * 0.85 + vh * 0.12), 0, 1)]);
    }
    var hp = null;
    if (hEnabled) {
      var hr = hscroll.getBoundingClientRect();
      hp = clamp(-hr.top / Math.max(1, hscroll.offsetHeight - vh), 0, 1);
    }
    var headerLight = false;
    for (i = 0; i < darkZones.length; i++) {
      var z = darkZones[i].getBoundingClientRect();
      if (z.top <= 40 && z.bottom >= 40) { headerLight = true; break; }
    }
    var dockShow = y > vh * 0.7;
    if (dockShow && ctaBlock) { var cr = ctaBlock.getBoundingClientRect(); if (cr.top < vh && cr.bottom > 0) dockShow = false; }
    if (dockShow && footerEl && footerEl.getBoundingClientRect().top < vh) dockShow = false;

    // ---- write ----
    updateHeader(y, headerLight);
    for (i = 0; i < px.length; i++) px[i][0].style.transform = 'translate3d(0,' + (px[i][1] * -px[i][2]).toFixed(1) + 'px,0)';
    for (i = 0; i < pv.length; i++) pv[i][0].style.setProperty('--p', pv[i][1].toFixed(3));
    for (i = 0; i < sv.length; i++) {
      var sc = sv[i][0];
      var lit = Math.floor(sv[i][1] * sc.words.length);
      if (lit === sc.lit) continue;
      var from = Math.max(0, Math.min(lit, sc.lit)), to = Math.max(lit, sc.lit);
      for (var w = from; w < to && w < sc.words.length; w++) sc.words[w].classList.toggle('lit', w < lit);
      sc.lit = lit;
    }
    if (hp !== null) {
      hTrack.style.transform = 'translate3d(' + (-hp * hDistance).toFixed(1) + 'px,0,0)';
      if (hBar) hBar.style.setProperty('--p', hp.toFixed(3));
    }
    if (dock) dock.classList.toggle('is-on', dockShow);
  }

  var ticking = false;
  function requestTick() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; onScroll(); });
  }
  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', function () {
    vh = window.innerHeight; setupHScroll();
    if (!parallaxOn()) parallax.forEach(function (el) { el.style.transform = ''; });
    requestTick();
  });
  window.addEventListener('load', function () { setupHScroll(); requestTick(); });
  setupHScroll();
  onScroll();

  /* ---------- Background videos: load lazily, play only when visible ---------- */
  var bgVideos = $$('[data-bg-video]');
  var saveData = navigator.connection && navigator.connection.saveData;
  if (bgVideos.length && 'IntersectionObserver' in window && !saveData) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting) {
          if (!v.dataset.loaded) {
            $$('source[data-src]', v).forEach(function (s) { s.src = s.getAttribute('data-src'); });
            v.load(); v.dataset.loaded = '1';
          }
          if (!reduced) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
        } else if (!v.paused) v.pause();
      });
    }, { rootMargin: '200px 0px' });
    bgVideos.forEach(function (v) {
      v.muted = true;
      // purely decorative videos stay as still images on phones and tablets
      if (v.getAttribute('data-bg-video') === 'desktop' && !finePointer) return;
      vio.observe(v);
    });
  }

  /* ---------- Inline film (click to play with sound) ---------- */
  $$('[data-film]').forEach(function (film) {
    var btn = $('.film__play', film);
    if (!btn) return;
    btn.addEventListener('click', function () {
      var src = film.getAttribute('data-film');
      var v = doc.createElement('video');
      v.src = src; v.controls = true; v.playsInline = true; v.autoplay = true;
      v.setAttribute('playsinline', '');
      $('.film__frame', film).appendChild(v);
      film.classList.add('is-playing');
      var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
    });
  });

  /* ---------- Modals ---------- */
  function openDialog(dlg) {
    if (!dlg) return;
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    root.classList.add('modal-open');
    if (lenis) lenis.stop();
    requestAnimationFrame(function () { requestAnimationFrame(function () { dlg.classList.add('is-open'); }); });
  }
  function closeDialog(dlg) {
    if (!dlg || !dlg.hasAttribute('open')) return;
    dlg.classList.remove('is-open');
    var v = $('video', dlg); if (v) v.pause();
    setTimeout(function () {
      if (typeof dlg.close === 'function') dlg.close(); else dlg.removeAttribute('open');
      root.classList.remove('modal-open');
      if (lenis) lenis.start();
    }, 450);
  }
  $$('dialog.modal').forEach(function (dlg) {
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg || e.target.closest('[data-close]')) closeDialog(dlg);
    });
    dlg.addEventListener('cancel', function (e) { e.preventDefault(); closeDialog(dlg); });
  });

  /* Booking drawer with Calendly inside */
  var bookModal = $('[data-book-modal]');
  var bookFrame = bookModal ? $('[data-book-frame]', bookModal) : null;
  function calendlyUrl() {
    var u = CONFIG.calendly + '?hide_gdpr_banner=1&background_color=faf7f2&text_color=0f0e0d&primary_color=0c4c98&embed_type=Inline&embed_domain=' + encodeURIComponent(location.hostname || 'sharontabak.com');
    return u;
  }
  doc.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-book]');
    if (!t || !bookModal) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey) return; // let power users open a tab
    e.preventDefault();
    closeMenu();
    if (bookFrame && !bookFrame.querySelector('iframe')) {
      var f = doc.createElement('iframe');
      f.src = calendlyUrl();
      f.title = 'Book a free call with Sharon Tabak';
      f.setAttribute('loading', 'eager');
      f.addEventListener('load', function () { var l = $('.modal__loading', bookFrame); if (l) l.remove(); });
      bookFrame.appendChild(f);
    }
    openDialog(bookModal);
  });

  /* Inline calendar on the contact page */
  $$('[data-calendar]').forEach(function (box) {
    function load() {
      if (box.querySelector('iframe')) return;
      var f = doc.createElement('iframe');
      f.src = calendlyUrl(); f.title = 'Book a free call with Sharon Tabak';
      f.addEventListener('load', function () { var ph = $('.calendar__placeholder', box); if (ph) ph.remove(); });
      box.appendChild(f);
    }
    if ('IntersectionObserver' in window) {
      var o = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { load(); o.disconnect(); } }, { rootMargin: '300px' });
      o.observe(box);
    } else load();
  });

  /* Testimonial video lightbox */
  var videoModal = $('[data-video-modal]');
  doc.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-video]');
    if (!t || !videoModal) return;
    if (t.closest('.rail__track.is-dragged')) { e.preventDefault(); return; }
    e.preventDefault();
    var v = $('video', videoModal);
    v.src = t.getAttribute('data-video');
    if (t.getAttribute('data-poster')) v.poster = t.getAttribute('data-poster');
    openDialog(videoModal);
    var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
  });

  /* ---------- Rails (drag + buttons + progress) ---------- */
  $$('[data-rail]').forEach(function (rail) {
    var track = $('.rail__track', rail);
    var prev = $('[data-rail-prev]', rail);
    var next = $('[data-rail-next]', rail);
    var bar = $('.rail__bar', rail);
    if (!track) return;
    function step() { var c = track.firstElementChild; return c ? c.getBoundingClientRect().width + 20 : 300; }
    function update() {
      var max = track.scrollWidth - track.clientWidth;
      var p = max > 0 ? track.scrollLeft / max : 1;
      if (bar) bar.style.setProperty('--p', clamp(0.15 + p * 0.85, 0, 1).toFixed(3));
      if (prev) prev.disabled = track.scrollLeft < 4;
      if (next) next.disabled = track.scrollLeft > max - 4;
    }
    if (prev) prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
    if (next) next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();

    if (!finePointer) return;
    var down = false, startX = 0, startL = 0, moved = 0;
    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = 0; startX = e.clientX; startL = track.scrollLeft;
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - startX; moved = Math.max(moved, Math.abs(dx));
      if (moved > 6) { track.classList.add('is-drag'); track.scrollLeft = startL - dx; }
    });
    window.addEventListener('pointerup', function () {
      if (!down) return; down = false;
      if (moved > 6) { track.classList.add('is-dragged'); setTimeout(function () { track.classList.remove('is-dragged'); }, 60); }
      track.classList.remove('is-drag');
    });
  });

  /* ---------- "You belong here" floating image ---------- */
  $$('[data-hover-list]').forEach(function (list) {
    var float = $('.belong__float', list.parentNode);
    if (!float || !finePointer || reduced) return;
    var imgs = $$('img', float);
    var x = 0, y = 0, fx = 0, fy = 0, raf = null, on = false;
    function loop() {
      fx = lerp(fx, x, 0.14); fy = lerp(fy, y, 0.14);
      float.style.left = fx + 'px'; float.style.top = fy + 'px';
      raf = on || Math.abs(fx - x) > 0.5 ? requestAnimationFrame(loop) : null;
    }
    $$('.belong__item', list).forEach(function (item, idx) {
      item.addEventListener('mouseenter', function (e) {
        imgs.forEach(function (im, j) { im.classList.toggle('is-active', j === idx % imgs.length); });
        if (!on) { fx = x = e.clientX; fy = y = e.clientY; }
        on = true; float.classList.add('is-on');
        if (!raf) raf = requestAnimationFrame(loop);
      });
    });
    list.addEventListener('mousemove', function (e) { x = e.clientX; y = e.clientY; });
    list.addEventListener('mouseleave', function () { on = false; float.classList.remove('is-on'); });
  });

  /* ---------- Magnetic buttons ---------- */
  if (finePointer && !reduced) {
    $$('[data-magnetic]').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = 'translate(' + (dx * 0.22).toFixed(1) + 'px,' + (dy * 0.3).toFixed(1) + 'px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }

  /* ---------- Custom cursor ---------- */
  var cursor = $('.cursor');
  if (cursor && finePointer && !reduced) {
    root.classList.add('has-cursor');
    var dot = $('.cursor__dot', cursor), ring = $('.cursor__ring', cursor), label = $('.cursor__label', cursor);
    var mx = -100, my = -100, rx = -100, ry = -100;
    window.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; cursor.classList.remove('is-hidden'); }, { passive: true });
    doc.addEventListener('mouseleave', function () { cursor.classList.add('is-hidden'); });
    (function loop() {
      rx = lerp(rx, mx, 0.18); ry = lerp(ry, my, 0.18);
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)';
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)';
      requestAnimationFrame(loop);
    })();
    doc.addEventListener('mouseover', function (e) {
      var t = e.target.closest ? e.target.closest('[data-cursor], a, button, summary, label, input, textarea') : null;
      cursor.classList.remove('is-link', 'is-label');
      if (!t) return;
      var txt = t.getAttribute('data-cursor');
      if (txt) { label.textContent = txt; cursor.classList.add('is-label'); }
      else cursor.classList.add('is-link');
    });
  }

  /* ---------- FAQ: smooth open/close ---------- */
  $$('.faq details').forEach(function (d) {
    var s = $('summary', d), a = $('.faq__a', d);
    if (!s || !a || reduced) return;
    s.addEventListener('click', function (e) {
      e.preventDefault();
      if (d.open) {
        a.style.height = a.scrollHeight + 'px';
        requestAnimationFrame(function () { a.style.transition = 'height .5s cubic-bezier(.22,1,.36,1)'; a.style.height = '0px'; });
        setTimeout(function () { d.open = false; a.style.cssText = ''; }, 500);
      } else {
        d.open = true;
        var h = a.scrollHeight;
        a.style.height = '0px';
        requestAnimationFrame(function () { a.style.transition = 'height .6s cubic-bezier(.22,1,.36,1)'; a.style.height = h + 'px'; });
        setTimeout(function () { a.style.cssText = ''; }, 620);
      }
    });
  });

  /* ---------- Forms ---------- */
  $$('[data-form]').forEach(function (form) {
    var status = $('.form__status', form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var data = new FormData(form);
      var subject = form.getAttribute('data-subject') || 'Message from sharontabak.com';
      var lines = [];
      data.forEach(function (v, k) { if (k.charAt(0) !== '_' && String(v).trim()) lines.push(k.charAt(0).toUpperCase() + k.slice(1) + ': ' + v); });

      function done(msg) { if (status) { status.textContent = msg; status.classList.add('is-on'); } }

      if (CONFIG.formEndpoint) {
        data.append('_subject', subject);
        fetch(CONFIG.formEndpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
          .then(function (r) {
            if (!r.ok) throw new Error('bad');
            form.reset(); done(form.getAttribute('data-success') || 'Thank you. Sharon will be in touch soon.');
          })
          .catch(function () { done('Something went wrong. Please email ' + CONFIG.email + ' directly.'); });
        return;
      }
      var href = 'mailto:' + CONFIG.email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n\n'));
      window.location.href = href;
      done('Your email app should open with your message ready to send. If it doesn’t, write to ' + CONFIG.email + '.');
    });
  });
})();
