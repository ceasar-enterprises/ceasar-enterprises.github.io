(function () {
  'use strict';

  /* ── Loader ── */
  var loader = document.getElementById('loader');
  if (loader) {
    window.addEventListener('load', function () {
      setTimeout(function () {
        loader.classList.add('done');
        setTimeout(function () { if (loader.parentNode) loader.parentNode.removeChild(loader); }, 600);
      }, 500);
    });
    setTimeout(function () { // safety: never trap the page
      if (!loader.classList.contains('done')) loader.classList.add('done');
    }, 3500);
  }

  /* ── Topbar state ── */
  var topbar = document.querySelector('.topbar');
  if (topbar) {
    var onScroll = function () { topbar.classList.toggle('scrolled', window.scrollY > 24); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── Mobile menu ── */
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('mobileMenu');
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ── Reveal on scroll ── */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ── Animated counters ── */
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    var run = function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var suffix = el.getAttribute('data-suffix') || '';
      var dur = 1100, start = null;
      var step = function (ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        el.textContent = Math.floor(target * (1 - Math.pow(1 - p, 3))) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { run(e.target); cio.unobserve(e.target); } });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* ── Footer year ── */
  var yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ── Sliding gold underline beneath the active tab ── */
  var nav = document.querySelector('.nav');
  var underline = document.getElementById('navUnderline');
  if (nav && underline) {
    var activeLink = nav.querySelector('a.active');
    var place = function (el) {
      var nr = nav.getBoundingClientRect();
      if (!el || nr.width === 0) return;
      var er = el.getBoundingClientRect();
      underline.style.left = (er.left - nr.left) + 'px';
      underline.style.width = er.width + 'px';
      underline.classList.add('show');
    };
    underline.style.left = '0px';
    setTimeout(function () {
      underline.classList.add('show');
      place(activeLink);
    }, 1200);
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('mouseenter', function () { place(a); });
      a.addEventListener('mouseleave', function () { place(activeLink); });
    });
  }

  /* ── Contact form → WhatsApp + mailto ── */
  var form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
      var name = f('cf-name');
      var email = f('cf-email');
      var org = f('cf-org');
      var service = f('cf-service');
      var budget = f('cf-budget');
      var msg = f('cf-msg');

      var lines = [
        'New project inquiry — ceasar-enterprises.github.io',
        '',
        'Name: ' + (name || '—'),
        org ? 'Organization: ' + org : null,
        'Email: ' + (email || '—'),
        'Service: ' + (service || '—'),
        budget ? 'Budget range: ' + budget : null,
        '',
        msg || ''
      ].filter(function (l) { return l !== null; });

      var text = encodeURIComponent(lines.join('\n'));
      var wa = 'https://wa.me/256702246854?text=' + text;
      var mail = 'mailto:charlvan042@gmail.com?subject=' + encodeURIComponent('Project inquiry — ' + (service || 'General')) + '&body=' + text;

      var btn = form.querySelector('.btn[type="submit"]');
      var original = btn ? btn.textContent : '';
      if (btn) { btn.textContent = 'Opening WhatsApp…'; btn.disabled = true; }

      window.open(wa, '_blank');

      // Respect users without WhatsApp: also offer email
      setTimeout(function () { window.location.href = mail; }, 1200);

      if (btn) { btn.textContent = original; btn.disabled = false; }
    });
  }
})();