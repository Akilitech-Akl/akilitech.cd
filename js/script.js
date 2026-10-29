/* =========================================================
   AKILITECH — script.js
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Préchargeur ---------- */
  const preloader = document.getElementById('preloader');
  window.addEventListener('load', () => {
    setTimeout(() => preloader.classList.add('hide'), 400);
  });

  /* ---------- Année automatique dans le footer ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Header au scroll ---------- */
  const header = document.getElementById('header');
  const backToTop = document.getElementById('backToTop');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      header.classList.add('scrolled');
      backToTop.classList.add('show');
    } else {
      header.classList.remove('scrolled');
      backToTop.classList.remove('show');
    }
  });
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---------- Menu mobile (burger) ---------- */
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  burger.addEventListener('click', () => {
    burger.classList.toggle('open');
    nav.classList.toggle('open');
  });
  document.querySelectorAll('#nav a').forEach(link => {
    link.addEventListener('click', () => {
      burger.classList.remove('open');
      nav.classList.remove('open');
    });
  });

  /* ---------- Lien actif selon la section visible ---------- */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('#nav a[href^="#"]');
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(sec => {
      const top = sec.offsetTop - 140;
      if (window.scrollY >= top) current = sec.getAttribute('id');
    });
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + current) link.classList.add('active');
    });
  });

  /* ---------- Effet machine à écrire (hero) ---------- */
  const typingEl = document.getElementById('typing-text');
  const phrases = [
    "AKILITECH, POUR UNE INNOVATION À L'AFRICAINE",
    "COACHING • FORMATION • ENTREPRENEURIAT",
    "VOTRE PARTENAIRE STRATÉGIQUE DE TRANSFORMATION"
  ];
  let phraseIndex = 0, charIndex = 0, isDeleting = false;

  function typeLoop() {
    const current = phrases[phraseIndex];
    if (!isDeleting) {
      charIndex++;
      typingEl.textContent = current.slice(0, charIndex);
      if (charIndex === current.length) {
        isDeleting = true;
        setTimeout(typeLoop, 1800);
        return;
      }
    } else {
      charIndex--;
      typingEl.textContent = current.slice(0, charIndex);
      if (charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
      }
    }
    setTimeout(typeLoop, isDeleting ? 35 : 55);
  }
  if (typingEl) typeLoop();

  /* ---------- Animations au scroll (reveal) ---------- */
  const revealEls = document.querySelectorAll('.reveal-left, .reveal-right, .reveal-up');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => revealObserver.observe(el));

  /* ---------- Compteurs animés (stats) ---------- */
  const counters = document.querySelectorAll('.counter');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });
  counters.forEach(c => counterObserver.observe(c));

  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const duration = 1400;
    const start = performance.now();
    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const value = Math.floor(progress * target);
      el.textContent = value;
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    requestAnimationFrame(step);
  }

  /* ---------- Galerie du programme (miniatures) ---------- */
  const galleryMain = document.getElementById('galleryMain');
  const thumbs = document.querySelectorAll('.gallery-thumbs img');
  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      thumbs.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      if (galleryMain) galleryMain.src = thumb.src;
    });
  });

  /* ---------- Formulaire de contact ---------- */
  const form = document.getElementById('contactForm');
  const formNote = document.getElementById('formNote');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const subject = document.getElementById('subject').value.trim() || 'Message depuis le site AKILITECH';
      const message = document.getElementById('message').value.trim();
      const phone = document.getElementById('phone').value.trim();

      // Ouvre le client mail par défaut avec les infos pré-remplies.
      // Pour un envoi automatique sans client mail, connecter ce formulaire
      // à un service comme Formspree, EmailJS ou Netlify Forms (voir README).
      const body = `Nom: ${name}%0ATéléphone: ${phone}%0AEmail: ${email}%0A%0AMessage:%0A${message}`;
      window.location.href = `mailto:nyota@akilitech.org?subject=${encodeURIComponent(subject)}&body=${body}`;

      formNote.textContent = "Votre client mail va s'ouvrir pour finaliser l'envoi. Merci de nous avoir contactés !";
      form.reset();
    });
  }

});
