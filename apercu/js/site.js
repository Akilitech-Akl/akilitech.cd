/* AKILITECH — interactions du site */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  var WA_NUMBER = '243904983794';
  var FORM_ENDPOINT = 'https://formsubmit.co/ajax/info@akilitech.org';
  function waLink(text) { return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text); }

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* Menu mobile */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!open));
      burger.setAttribute('aria-label', open ? 'Ouvrir le menu' : 'Fermer le menu');
      nav.classList.toggle('is-open', !open);
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        burger.setAttribute('aria-expanded', 'false');
        burger.setAttribute('aria-label', 'Ouvrir le menu');
        nav.classList.remove('is-open');
      }
    });
  }

  /* Rubrique en cours dans le menu */
  if ('IntersectionObserver' in window && nav) {
    var links = {};
    nav.querySelectorAll('a').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var a = links[en.target.id];
        if (!a) return;
        if (en.isIntersecting) {
          Object.keys(links).forEach(function (k) { links[k].removeAttribute('aria-current'); });
          a.setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(links).forEach(function (id) { var s = document.getElementById(id); if (s) obs.observe(s); });
  }

  /* Tampons du dossier : une seule animation, au chargement */
  var dossier = document.querySelector('.dossier');
  if (dossier) requestAnimationFrame(function () { dossier.classList.add('is-stamped'); });

  /* Bande de photos */
  var strip = document.querySelector('.strip');
  document.querySelectorAll('.strip__btn').forEach(function (b) {
    b.addEventListener('click', function () {
      if (!strip) return;
      var step = Math.max(strip.clientWidth * 0.8, 280);
      strip.scrollBy({ left: step * Number(b.dataset.dir), behavior: 'smooth' });
    });
  });

  /* Formulaire de contact */
  var form = document.getElementById('contactForm');
  var note = document.getElementById('formNote');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nom = form.querySelector('#f-nom');
      var tel = form.querySelector('#f-tel');
      var mail = form.querySelector('#f-mail');
      var msg = form.querySelector('#f-msg');
      var besoin = form.querySelector('#f-objet').value;
      var errors = [];
      [nom, msg, tel, mail].forEach(function (el) { el.closest('.field2').classList.remove('has-error'); el.removeAttribute('aria-invalid'); });
      if (!nom.value.trim()) errors.push([nom, 'votre nom']);
      if (!tel.value.trim() && !mail.value.trim()) errors.push([tel, 'un téléphone ou un e-mail']);
      if (mail.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.value.trim())) errors.push([mail, 'un e-mail valide']);
      if (!msg.value.trim()) errors.push([msg, 'votre message']);
      note.className = 'form__note';
      if (errors.length) {
        errors.forEach(function (er) { er[0].closest('.field2').classList.add('has-error'); er[0].setAttribute('aria-invalid', 'true'); });
        note.classList.add('is-err');
        note.textContent = 'Il manque ' + errors.map(function (er) { return er[1]; }).join(', ') + '.';
        errors[0][0].focus();
        return;
      }
      if (form.querySelector('[name="_honey"]').value) return;

      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true; btn.textContent = 'Envoi en cours…';
      var data = {
        'Nom': nom.value.trim(),
        'Téléphone': tel.value.trim(),
        'email': mail.value.trim(),
        'Besoin': besoin,
        'Message': msg.value.trim(),
        '_subject': 'Site akilitech.org : ' + besoin,
        '_template': 'table'
      };
      fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          if (res.ok && String(res.j.success) === 'true') {
            note.classList.add('is-ok');
            note.textContent = 'Message envoyé. Nous revenons vers vous rapidement.';
            form.reset();
          } else { throw new Error('envoi'); }
        })
        .catch(function () {
          var text = 'Bonjour Akilitech, je suis ' + data['Nom'] + '. Besoin : ' + besoin + '. ' + data['Message'];
          note.classList.add('is-err');
          note.innerHTML = 'L\'envoi n\'a pas abouti. Envoyez le même message <a href="' + waLink(text) + '" target="_blank" rel="noopener">sur WhatsApp</a> ou écrivez à <a href="mailto:info@akilitech.org">info@akilitech.org</a>.';
        })
        .then(function () { btn.disabled = false; btn.textContent = 'Envoyer le message'; });
    });
  }

  /* ---------- Assistant ---------- */
  var toggle = document.getElementById('botToggle');
  var panel = document.getElementById('botPanel');
  var closeBtn = document.getElementById('botClose');
  var log = document.getElementById('botLog');
  var chipsBox = document.getElementById('botChips');
  var botForm = document.getElementById('botForm');
  var input = document.getElementById('botText');
  if (!toggle || !panel) return;

  var CONTACTS = '<p>WhatsApp : <a href="https://wa.me/243904983794" target="_blank" rel="noopener">+243 904 983 794</a><br>Téléphone : +243 976 494 507, +243 896 628 382<br>Belgique : +32 496 88 29 03<br>E-mail : <a href="mailto:info@akilitech.org">info@akilitech.org</a></p><p>Bureau : N°46 E, avenue Yav Tshibal, Golf Kabulameshi, commune Annexe, Lubumbashi.</p>';

  var MENU = [
    ['Créer mon entreprise', 'creation'],
    ['Certificat ARSP', 'arsp'],
    ['Déclarations DGI, CNSS, ONEM', 'declarations'],
    ['Permis de travail, visa', 'immigration'],
    ['Formations', 'formations'],
    ['Coaching', 'coaching'],
    ['Tarifs', 'tarifs'],
    ['Adresse et contacts', 'contact']
  ];

  var FORMES = {
    ets: ['Établissement', 'C\'est une entreprise individuelle, en votre nom propre. La plus simple à créer, mais vos biens personnels ne sont pas séparés de ceux de l\'activité.'],
    sarlu: ['SARLU', 'Une SARL à associé unique : vous êtes seul, et votre responsabilité est limitée à ce que vous apportez à la société.'],
    sarl: ['SARL', 'Deux associés ou plus, responsabilité limitée aux apports. C\'est la forme la plus courante pour les PME.'],
    sa: ['SA', 'Adaptée aux projets plus importants, avec des organes de direction plus lourds et un capital minimum plus élevé.'],
    asbl: ['ASBL', 'Une association sans but lucratif, pour un projet social, communautaire ou associatif.']
  };

  var FLOWS = {
    menu: function () {
      say('<p>Voici ce sur quoi je peux vous renseigner. Choisissez un sujet, ou écrivez votre question.</p>');
      chips(MENU);
    },
    creation: function () {
      say('<p>Nous prenons en charge toute la création : choix de la forme juridique, statuts, RCCM, identification nationale et NIF, puis l\'affiliation CNSS et ONEM si vous embauchez.</p><p>À partir de <strong>500 $</strong>.</p><p>Quelle forme envisagez-vous ?</p>');
      chips([['Établissement', 'forme:ets'], ['SARLU (seul)', 'forme:sarlu'], ['SARL (à plusieurs)', 'forme:sarl'], ['SA', 'forme:sa'], ['ASBL', 'forme:asbl'], ['Je ne sais pas encore', 'forme:nsp']]);
    },
    arsp: function () {
      say('<p>Le certificat ARSP est demandé pour travailler en sous-traitance avec les entreprises du secteur privé, notamment les minières. Nous constituons votre dossier et le suivons jusqu\'à l\'obtention.</p><p>Tarif : <strong>100 $</strong>.</p><p>Votre entreprise a-t-elle déjà son RCCM, son ID NAT et son NIF ?</p>');
      chips([['Oui, tout est prêt', 'arsp:oui'], ['Non, pas encore', 'arsp:non'], ['Je ne suis pas sûr', 'arsp:nsp']]);
    },
    declarations: function () {
      say('<p>Avec notre abonnement mensuel, nous préparons et suivons vos déclarations DGI, CNSS et ONEM pour que vous ne ratiez plus d\'échéance.</p><p>À partir de <strong>80 $ par mois</strong>.</p><p>Combien de salariés avez-vous ?</p>');
      chips([['Aucun', 'decl:aucun salarié'], ['1 à 5', 'decl:1 à 5 salariés'], ['6 à 20', 'decl:6 à 20 salariés'], ['Plus de 20', 'decl:plus de 20 salariés']]);
    },
    immigration: function () {
      say('<p>Nous préparons et suivons vos dossiers d\'immigration professionnelle : permis de travail, visas congolais, cartes de séjour et visas pour la Chine.</p><p>De quoi avez-vous besoin ?</p>');
      chips([['Permis de travail', 'immig:un permis de travail'], ['Visa ou carte de séjour en RDC', 'immig:un visa ou une carte de séjour en RDC'], ['Visa pour la Chine', 'immig:un visa pour la Chine']]);
    },
    formations: function () {
      say('<p>Nos formations sont pratiques, en petits groupes ou directement dans votre entreprise : leadership, gestion du temps, communication, intelligence émotionnelle, management, éducation financière, IA au travail, et bien d\'autres.</p><p>En ce moment : la <strong>formation GRH intensive</strong> de trois jours (décomptes, paie et IA appliquée aux RH).</p>');
      chips([['Formation GRH', 'grh'], ['Former mon équipe', 'form:former mon équipe'], ['Recevoir le catalogue', 'form:recevoir le catalogue complet']]);
    },
    grh: function () {
      say('<p><strong>Formation GRH intensive, 3 jours</strong> : calcul des décomptes finaux, paie et outils d\'IA pour les RH.</p><p>Inscription 20 $, formation 150 $. Les places sont limitées.</p>');
      handoff('Bonjour Akilitech, je souhaite m\'inscrire à la formation GRH.', 'Réserver ma place sur WhatsApp');
      chips([['Autre question', 'menu']]);
    },
    coaching: function () {
      say('<p>Nous proposons du coaching individuel (objectifs, transitions, confiance en soi), du coaching entrepreneurial et éducation financière, et du coaching d\'équipe.</p><p>C\'est pour vous ou pour une équipe ?</p>');
      chips([['Pour moi', 'coach:un coaching individuel'], ['Pour mon projet d\'entreprise', 'coach:un coaching entrepreneurial'], ['Pour mon équipe', 'coach:un coaching d\'équipe']]);
    },
    rse: function () {
      say('<p>Nous concevons et exécutons des programmes RSE pour vos communautés : employabilité des jeunes, entrepreneuriat, alphabétisation, AVEC, formation de formateurs.</p>');
      handoff('Bonjour Akilitech, je souhaite échanger sur un programme RSE pour notre entreprise.', 'En parler avec un conseiller');
      chips([['Autre question', 'menu']]);
    },
    tarifs: function () {
      say('<ul><li>Création d\'entreprise : à partir de 500 $</li><li>Certificat ARSP : 100 $</li><li>Déclarations DGI, CNSS, ONEM : dès 80 $ par mois</li><li>Formation GRH : 20 $ d\'inscription et 150 $</li></ul><p>Pour le reste (immigration, coaching, programmes RSE), nous établissons un devis selon votre situation.</p>');
      chips([['Demander un devis', 'devis'], ['Autre question', 'menu']]);
    },
    devis: function () {
      say('<p>Un conseiller vous répond sur WhatsApp. Décrivez-lui votre besoin en une phrase.</p>');
      handoff('Bonjour Akilitech, je souhaite un devis pour : ', 'Ouvrir WhatsApp');
      chips([['Autre question', 'menu']]);
    },
    contact: function () {
      say(CONTACTS);
      chips([['Parler à un conseiller', 'humain'], ['Autre question', 'menu']]);
    },
    humain: function () {
      say('<p>Un conseiller d\'AKILITECH vous répond sur WhatsApp, aux heures de bureau.</p>');
      handoff('Bonjour Akilitech, ', 'Ouvrir WhatsApp');
      chips([['Autre question', 'menu']]);
    }
  };

  function resolve(key) {
    var parts = key.split(':');
    var kind = parts[0], val = parts.slice(1).join(':');
    if (!val && FLOWS[kind]) return FLOWS[kind]();
    if (kind === 'forme') {
      if (val === 'nsp') {
        say('<p>C\'est souvent la première question. Le bon choix dépend de votre activité, du nombre d\'associés et de vos clients. Un conseiller vous aide à trancher.</p>');
        handoff('Bonjour Akilitech, je souhaite créer mon entreprise mais je ne sais pas encore quelle forme juridique choisir.', 'Être conseillé sur WhatsApp');
      } else {
        var f = FORMES[val];
        say('<p><strong>' + f[0] + '</strong> : ' + f[1] + '</p><p>Nous nous occupons des statuts et de l\'immatriculation complète.</p>');
        handoff('Bonjour Akilitech, je souhaite créer une ' + f[0] + '. Pouvez-vous m\'indiquer les pièces à fournir et le devis ?', 'Lancer ma création sur WhatsApp');
      }
      return chips([['Certificat ARSP', 'arsp'], ['Autre question', 'menu']]);
    }
    if (kind === 'arsp') {
      if (val === 'oui') {
        say('<p>Parfait, nous pouvons lancer le dossier ARSP tout de suite. Préparez vos documents d\'entreprise : un conseiller vous dira exactement quoi envoyer.</p>');
        handoff('Bonjour Akilitech, mon entreprise a son RCCM, son ID NAT et son NIF. Je souhaite lancer mon dossier ARSP.', 'Lancer mon dossier ARSP');
      } else if (val === 'non') {
        say('<p>Aucun problème : on commence par créer et immatriculer l\'entreprise, puis on enchaîne avec l\'ARSP. Un seul interlocuteur pour tout.</p>');
        handoff('Bonjour Akilitech, je souhaite créer mon entreprise puis obtenir le certificat ARSP.', 'Démarrer sur WhatsApp');
      } else {
        say('<p>Envoyez-nous ce que vous avez : nous vérifions votre situation et vous disons ce qui manque.</p>');
        handoff('Bonjour Akilitech, je souhaite obtenir le certificat ARSP et vérifier les documents de mon entreprise.', 'Faire vérifier ma situation');
      }
      return chips([['Déclarations mensuelles', 'declarations'], ['Autre question', 'menu']]);
    }
    if (kind === 'decl') {
      say('<p>Noté. Nous vous proposons une formule adaptée à votre entreprise.</p>');
      handoff('Bonjour Akilitech, je m\'intéresse à l\'abonnement pour mes déclarations DGI, CNSS et ONEM. Nous avons ' + val + '.', 'Recevoir ma proposition');
      return chips([['Autre question', 'menu']]);
    }
    if (kind === 'immig') {
      say('<p>Un conseiller vous indique la liste des pièces et les délais pour ' + val + '.</p>');
      handoff('Bonjour Akilitech, j\'ai besoin d\'aide pour ' + val + '.', 'Poser ma question sur WhatsApp');
      return chips([['Autre question', 'menu']]);
    }
    if (kind === 'form') {
      handoff('Bonjour Akilitech, je souhaite ' + val + '.', 'Continuer sur WhatsApp');
      return chips([['Formation GRH', 'grh'], ['Autre question', 'menu']]);
    }
    if (kind === 'coach') {
      say('<p>Le premier échange sert à comprendre votre situation et vos objectifs.</p>');
      handoff('Bonjour Akilitech, je suis intéressé par ' + val + '.', 'Prendre contact sur WhatsApp');
      return chips([['Autre question', 'menu']]);
    }
    FLOWS.menu();
  }

  var KEYWORDS = [
    ['arsp', ['arsp', 'sous-traitance', 'sous traitance', 'soustraitance', 'sous-traitant']],
    ['declarations', ['declaration', 'dgi', 'cnss', 'onem', 'impot', 'fiscal', 'taxe', 'abonnement', '~mensuel']],
    ['creation', ['creer', 'creation', '~entreprise', 'societe', 'rccm', 'id nat', 'idnat', 'identification', 'nif', 'sarl', 'sarlu', 'asbl', 'statut', 'etablissement', 'formaliser', 'regulariser', '~papiers']],
    ['immigration', ['permis', '~travail', 'visa', 'sejour', 'immigration', 'chine', 'expatrie', 'work permit']],
    ['grh', ['grh', 'ressources humaines', 'paie', 'payroll', 'decompte']],
    ['formations', ['formation', 'former', 'cours', 'atelier', 'catalogue', 'ia ', 'intelligence artificielle', 'leadership']],
    ['coaching', ['coach', 'coaching', 'accompagnement', 'mentor']],
    ['rse', ['rse', 'rso', 'csr', 'communaute', 'alphabetisation', 'societale']],
    ['tarifs', ['prix', 'tarif', 'cout', 'combien', 'devis', 'frais']],
    ['contact', ['adresse', 'ou etes', 'ou se trouve', 'bureau', 'situe', 'contact', 'telephone', 'numero', 'mail', 'joindre', 'whatsapp']],
    ['humain', ['conseiller', 'humain', 'quelqu', 'appeler', 'parler']]
  ];

  function norm(s) { return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' '); }

  function understand(text) {
    var t = ' ' + norm(text) + ' ';
    if (/^\s*(bonjour|bonsoir|salut|hello|hi|mbote|jambo)\b/.test(t.trim()) && t.trim().split(/\s+/).length <= 3) {
      say('<p>Bonjour ! Comment puis-je vous aider ?</p>');
      return chips(MENU);
    }
    if (/\b(merci|super|parfait|ok merci)\b/.test(t)) {
      say('<p>Avec plaisir. Autre chose ?</p>');
      return chips(MENU);
    }
    var forme = t.match(/ (sarlu|sarl|asbl|sa|ets|etablissement) /);
    if (forme && / (creer|creation|cree|monter|ouvrir|combien|prix|cout|tarif|statut) /.test(t)) {
      var map = { sarlu: 'sarlu', sarl: 'sarl', asbl: 'asbl', sa: 'sa', ets: 'ets', etablissement: 'ets' };
      say('<p>La création d\'entreprise, c\'est à partir de <strong>500 $</strong>.</p>');
      return resolve('forme:' + map[forme[1]]);
    }
    var best = null, bestScore = 0;
    KEYWORDS.forEach(function (k) {
      var score = 0;
      k[1].forEach(function (w) {
        var weak = w.charAt(0) === '~';
        var word = (weak ? w.slice(1) : w).replace(/-/g, ' ');
        if (t.indexOf(' ' + word) !== -1) score += weak ? 1 : 2;
      });
      if (score > bestScore) { bestScore = score; best = k[0]; }
    });
    if (best) return FLOWS[best]();
    say('<p>Je n\'ai pas bien compris votre question. Un conseiller peut vous répondre directement, ou choisissez un sujet ci-dessous.</p>');
    handoff('Bonjour Akilitech, ' + text, 'Envoyer ma question sur WhatsApp');
    chips(MENU);
  }

  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function add(html, who) {
    var d = document.createElement('div');
    d.className = 'msg msg--' + who;
    d.innerHTML = html;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
    return d;
  }
  function say(html) { add(html, 'bot'); }
  function handoff(text, label) {
    add('<a class="msg__wa" href="' + waLink(text) + '" target="_blank" rel="noopener">' + esc(label) + '</a>', 'bot');
  }
  function chips(list) {
    chipsBox.innerHTML = '';
    list.forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip' + (c[1] === 'menu' ? ' chip--ghost' : '');
      b.textContent = c[0];
      b.addEventListener('click', function () {
        add('<p>' + esc(c[0]) + '</p>', 'me');
        chipsBox.innerHTML = '';
        reply(function () { resolve(c[1]); });
      });
      chipsBox.appendChild(b);
    });
  }
  function reply(fn) {
    var t = add('<p>…</p>', 'bot msg--typing');
    setTimeout(function () { t.remove(); fn(); }, 380);
  }

  var started = false;
  function openBot() {
    panel.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    if (!started) {
      started = true;
      say('<p>Bonjour, je suis l\'assistant d\'AKILITECH. Je réponds tout de suite aux questions courantes, et je vous mets en relation avec un conseiller quand il le faut.</p>');
      FLOWS.menu();
    }
    setTimeout(function () { input.focus(); }, 50);
  }
  function closeBot() {
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.focus();
  }
  toggle.addEventListener('click', openBot);
  closeBtn.addEventListener('click', closeBot);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) closeBot(); });
  botForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text) return;
    add('<p>' + esc(text) + '</p>', 'me');
    input.value = '';
    chipsBox.innerHTML = '';
    reply(function () { understand(text); });
  });
})();
