/* AKILITECH — interactions du site */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Préchargeur */
  var preloader = document.getElementById('preloader');
  function hidePreloader() { if (preloader) preloader.classList.add('hide'); }
  window.addEventListener('load', function () { setTimeout(hidePreloader, 300); });
  setTimeout(hidePreloader, 2500);

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* En-tête et retour en haut */
  var header = document.getElementById('header');
  var backToTop = document.getElementById('backToTop');
  function onScroll() {
    var s = window.scrollY > 60;
    header.classList.toggle('scrolled', s);
    backToTop.classList.toggle('show', window.scrollY > 600);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  backToTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });

  /* Menu mobile */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');
  function setMenu(open) {
    burger.classList.toggle('open', open);
    nav.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  }
  burger.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
  nav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });

  /* Lien actif */
  var links = {};
  nav.querySelectorAll('a[href^="#"]').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    var secObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && links[en.target.id]) {
          Object.keys(links).forEach(function (k) { links[k].classList.remove('active'); });
          links[en.target.id].classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(links).forEach(function (id) { var s = document.getElementById(id); if (s) secObs.observe(s); });
  }

  /* Machine à écrire */
  var typingEl = document.getElementById('typing-text');
  var phrases = [
    'Vos démarches, notre affaire.',
    'Créez votre entreprise en toute sérénité.',
    'RCCM, ID NAT, NIF, ARSP : on s\'en occupe.',
    'Visas, permis de travail, formation.'
  ];
  if (typingEl && !reduce) {
    var pi = 0, ci = phrases[0].length, del = true;
    setTimeout(function loop() {
      var cur = phrases[pi];
      if (del) {
        ci--; typingEl.textContent = cur.slice(0, ci);
        if (ci === 0) { del = false; pi = (pi + 1) % phrases.length; }
        setTimeout(loop, 28);
      } else {
        cur = phrases[pi]; ci++; typingEl.textContent = cur.slice(0, ci);
        if (ci === cur.length) { del = true; setTimeout(loop, 2400); } else setTimeout(loop, 55);
      }
    }, 3200);
  }

  /* Apparitions au défilement, compteurs, frise */
  var revealEls = document.querySelectorAll('.reveal-left, .reveal-right, .reveal-up');
  if ('IntersectionObserver' in window && !reduce) {
    var rObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in-view'); rObs.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { rObs.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
  }

  var timeline = document.querySelector('.timeline');
  if (timeline) {
    if ('IntersectionObserver' in window && !reduce) {
      var tObs = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { timeline.classList.add('in-line'); tObs.disconnect(); } }, { threshold: 0.3 });
      tObs.observe(timeline);
    } else timeline.classList.add('in-line');
  }

  function animateCounter(el) {
    var target = parseInt(el.dataset.target, 10);
    var from = target > 1000 ? target - 30 : 0;
    var start = performance.now(), dur = 1500;
    (function step(now) {
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (target - from) * eased);
      if (p < 1) requestAnimationFrame(step);
    })(start);
  }
  var counters = document.querySelectorAll('.counter');
  if ('IntersectionObserver' in window && !reduce) {
    var cObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { animateCounter(en.target); cObs.unobserve(en.target); } });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { cObs.observe(c); });
  }

  /* Publications des réseaux sociaux */
  function buildFeed(grid) {
    if (grid.dataset.built) return;
    grid.dataset.built = '1';
    var type = grid.dataset.feed;
    var items = grid.dataset.items.split(',');
    items.forEach(function (it) {
      var card = document.createElement('div');
      card.className = 'feed-card';
      var f = document.createElement('iframe');
      f.loading = 'lazy';
      f.setAttribute('allowfullscreen', '');
      if (type === 'linkedin') {
        f.src = 'https://www.linkedin.com/embed/feed/update/' + it.trim();
        f.height = 620; f.title = 'Publication LinkedIn d\'AKILITECH';
      } else if (type === 'instagram') {
        f.src = 'https://www.instagram.com/p/' + it.trim() + '/embed/captioned/';
        f.height = 640; f.title = 'Publication Instagram d\'AKILITECH';
        f.setAttribute('scrolling', 'no');
      } else if (type === 'facebook') {
        card.style.maxWidth = '500px'; card.style.width = '100%';
        f.src = 'https://www.facebook.com/plugins/page.php?href=' + encodeURIComponent(it.trim()) + '&tabs=timeline&width=500&height=720&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true&locale=fr_FR';
        f.height = 720; f.title = 'Page Facebook d\'AKILITECH';
        f.setAttribute('scrolling', 'no');
      }
      var sk = document.createElement('div'); sk.className = 'feed-skeleton';
      card.appendChild(sk);
      f.addEventListener('load', function () { sk.remove(); });
      card.appendChild(f);
      grid.appendChild(card);
    });
  }
  var feedSection = document.getElementById('actualites');
  if (feedSection) {
    var tabs = feedSection.querySelectorAll('.feed-tab');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
        tab.classList.add('active'); tab.setAttribute('aria-selected', 'true');
        feedSection.querySelectorAll('.feed-panel').forEach(function (p) {
          var on = p.id === tab.getAttribute('aria-controls');
          p.hidden = !on; p.classList.toggle('active', on);
          if (on) buildFeed(p.querySelector('.feed-grid'));
        });
      });
    });
    var first = feedSection.querySelector('.feed-panel.active .feed-grid');
    if ('IntersectionObserver' in window) {
      var fObs = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { buildFeed(first); fObs.disconnect(); } }, { rootMargin: '700px 0px' });
      fObs.observe(feedSection);
    } else buildFeed(first);
  }

  /* Formulaire de contact */
  var form = document.getElementById('contactForm');
  var note = document.getElementById('formNote');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nom = form.querySelector('#f-nom'), tel = form.querySelector('#f-tel'), mail = form.querySelector('#f-mail'), msg = form.querySelector('#f-msg');
      var besoin = form.querySelector('#f-objet').value;
      var errors = [];
      [nom, tel, mail, msg].forEach(function (el) { el.closest('.form-group').classList.remove('has-error'); el.removeAttribute('aria-invalid'); });
      if (!nom.value.trim()) errors.push([nom, 'votre nom']);
      if (!tel.value.trim() && !mail.value.trim()) errors.push([tel, 'un téléphone ou un e-mail']);
      if (mail.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.value.trim())) errors.push([mail, 'un e-mail valide']);
      if (!msg.value.trim()) errors.push([msg, 'votre message']);
      note.className = 'form-note';
      if (errors.length) {
        errors.forEach(function (er) { er[0].closest('.form-group').classList.add('has-error'); er[0].setAttribute('aria-invalid', 'true'); });
        note.classList.add('err');
        note.textContent = 'Il manque ' + errors.map(function (er) { return er[1]; }).join(', ') + '.';
        errors[0][0].focus();
        return;
      }
      if (form.querySelector('[name="_honey"]').value) return;
      var btn = form.querySelector('button[type="submit"]');
      var label = btn.innerHTML;
      btn.disabled = true; btn.textContent = 'Envoi en cours…';
      window.AKL_sendLead({
        'Nom': nom.value.trim(), 'Téléphone': tel.value.trim(), 'email': mail.value.trim(),
        'Besoin': besoin, 'Message': msg.value.trim(), '_subject': 'Site akilitech.org : ' + besoin
      }).then(function () {
        note.classList.add('ok');
        note.textContent = 'Message envoyé. Nous revenons vers vous rapidement.';
        form.reset();
      }).catch(function () {
        var t = 'Bonjour Akilitech, je suis ' + nom.value.trim() + '. Besoin : ' + besoin + '. ' + msg.value.trim();
        note.classList.add('err');
        note.innerHTML = 'L\'envoi n\'a pas abouti. Envoyez le même message <a href="https://wa.me/243904983794?text=' + encodeURIComponent(t) + '" target="_blank" rel="noopener">sur WhatsApp</a> ou à <a href="mailto:info@akilitech.org">info@akilitech.org</a>.';
      }).then(function () { btn.disabled = false; btn.innerHTML = label; });
    });
  }

  /* Envoi vers info@akilitech.org (partagé avec l'assistant) */
  window.AKL_sendLead = function (data) {
    data._template = 'table';
    return fetch('https://formsubmit.co/ajax/info@akilitech.org', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok || String(j.success) !== 'true') throw new Error('envoi');
        return j;
      });
    });
  };

})();
