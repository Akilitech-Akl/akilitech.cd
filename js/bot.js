/* Akili, assistant automatique d'AKILITECH
   Fonctionne entièrement dans le navigateur : base de connaissances, compréhension
   tolérante aux fautes, suivi du contexte, parcours guidés et prise de contact. */
(function () {
  'use strict';

  var WA_NUM = '243904983794';
  var STORE = 'akl-bot-v3';
  var root = document.getElementById('akili');
  if (!root) return;
  var toggle = document.getElementById('akiliToggle');
  var panel = document.getElementById('akiliPanel');
  var log = document.getElementById('akiliLog');
  var chipsBox = document.getElementById('akiliChips');
  var form = document.getElementById('akiliForm');
  var input = document.getElementById('akiliText');
  var teaser = document.getElementById('akiliTeaser');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Outils ---------- */
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function norm(s) {
    return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/['’`]/g, ' ').replace(/[^a-z0-9+$ ]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function stem(w) { return w.length > 4 ? w.replace(/(s|x)$/, '') : w; }
  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 9;
    var d = [], i, j;
    for (i = 0; i <= a.length; i++) d[i] = [i];
    for (j = 0; j <= b.length; j++) d[0][j] = j;
    for (i = 1; i <= a.length; i++) for (j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
    return d[a.length][b.length];
  }
  function now() { var d = new Date(); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  function waUrl(text) { return 'https://wa.me/' + WA_NUM + '?text=' + encodeURIComponent(text); }
  function waBtn(text, label) {
    return '<a class="msg-wa" href="' + waUrl(text) + '" target="_blank" rel="noopener"><svg aria-hidden="true"><use href="#i-whatsapp"/></svg>' + (label || 'Continuer sur WhatsApp') + '</a>';
  }
  function link(hash, label) { return '<a href="' + hash + '" data-close>' + label + '</a>'; }
  function ul(items) { return '<ul><li>' + items.join('</li><li>') + '</li></ul>'; }

  /* ---------- Mémoire de la conversation (onglet en cours) ---------- */
  var S = { log: [], topic: null, flow: null, step: 0, data: {}, expect: null, misses: 0, chips: null, lead: {} };
  function save() {
    try { S.log = S.log.slice(-70); sessionStorage.setItem(STORE, JSON.stringify(S)); } catch (e) {}
  }
  function load() {
    try { var raw = sessionStorage.getItem(STORE); if (raw) { var o = JSON.parse(raw); if (o && o.log) S = Object.assign(S, o); } } catch (e) {}
  }

  /* ---------- Affichage ---------- */
  function bubble(entry, animate) {
    var el = document.createElement('div');
    if (entry.k === 'card') { el.className = 'msg-card'; el.innerHTML = entry.h; }
    else {
      el.className = 'msg ' + (entry.w === 'me' ? 'msg-me' : 'msg-bot');
      el.innerHTML = entry.h + '<span class="msg-time">' + entry.t + '</span>';
    }
    if (!animate) el.style.animation = 'none';
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
  }
  function push(who, html, kind) {
    var e = { w: who, h: html, t: now(), k: kind || 'msg' };
    S.log.push(e); bubble(e, true); save();
  }
  function setChips(list) {
    S.chips = list || null;
    chipsBox.innerHTML = '';
    (list || []).forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip' + (c.ghost ? ' chip-ghost' : '');
      b.textContent = c.l;
      b.addEventListener('click', function () { userSays(c.l, c.v); });
      chipsBox.appendChild(b);
    });
    save();
  }

  var queue = Promise.resolve();
  function botSay(reply) {
    var parts = [].concat(reply.say || []);
    setChips(null);
    queue = queue.then(function () {
      var p = Promise.resolve();
      parts.forEach(function (html, i) {
        p = p.then(function () {
          var dots = document.createElement('div');
          dots.className = 'typing-dots'; dots.setAttribute('aria-label', 'Akili écrit');
          dots.innerHTML = '<i></i><i></i><i></i>';
          log.appendChild(dots); log.scrollTop = log.scrollHeight;
          var plain = html.replace(/<[^>]+>/g, '');
          var wait = reduce ? 120 : Math.min(450 + plain.length * 6, 1500) + (i ? 150 : 0);
          return new Promise(function (r) { setTimeout(function () { dots.remove(); push('bot', html); r(); }, wait); });
        });
      });
      return p.then(function () {
        if (reply.card) push('bot', reply.card, 'card');
        setChips(reply.chips || MAIN);
      });
    });
    return queue;
  }

  /* ---------- Réponses fréquentes ---------- */
  var CALLBACK = { l: 'Être rappelé', v: '@lead' };
  var HUMAN = { l: 'Parler à un conseiller', v: '@lead', ghost: true };
  var MAIN = [
    { l: 'Créer mon entreprise', v: 'creation' },
    { l: 'Certificat ARSP', v: 'arsp' },
    { l: 'Taxes et déclarations', v: 'taxes' },
    { l: 'Permis de travail, visas', v: 'immigration' },
    { l: 'Formations', v: 'formation' },
    { l: 'Tarifs', v: 'tarifs' },
    HUMAN
  ];

  /* Attributs : permettent les questions de suivi (« et le prix ? ») */
  var ATTR = {
    price: ['prix', 'cout', 'coute', 'combien', 'tarif', 'frais', 'montant', 'cher', 'budget', 'dollar', '$', 'payer', 'devis', 'price', 'cost'],
    docs: ['document a fournir', 'pieces', 'piece', 'fournir', 'necessaire', 'requis', 'besoin de quoi', 'quels documents', 'dossier complet', 'apporter', 'conditions'],
    delay: ['delai', 'combien de temps', 'duree', 'rapide', 'jours', 'semaine', 'quand', 'vite', 'temps']
  };

  /* Sujets : mots-clés, réponse principale et réponses par attribut */
  var T = {};
  function topic(id, def) { def.id = id; T[id] = def; }

  topic('greet', {
    kw: ['bonjour', 'bonsoir', 'salut', 'hello', 'coucou', 'hey', 'mbote', 'mbotama', 'sango nini', 'jambo', 'habari', 'hujambo', 'mambo', 'yo', 'hi', 'bjr', 'slt', 'cc'],
    keepTopic: true,
    main: function (q) {
      var hi = /mbote|sango/.test(q) ? 'Mbote !' : /jambo|habari|hujambo|mambo/.test(q) ? 'Jambo !' : /bonsoir/.test(q) ? 'Bonsoir !' : 'Bonjour !';
      return { say: [hi + ' Je suis Akili, l\'assistant automatique d\'AKILITECH. Quelle démarche puis-je vous expliquer ?'] };
    }
  });
  topic('cava', {
    kw: ['ca va', 'comment allez', 'comment vas', 'vous allez bien', 'tu vas bien', 'sango'],
    keepTopic: true,
    main: { say: ['Très bien, merci ! Et vous ? Dites-moi ce qui vous amène : une création d\'entreprise, un document, un visa, une formation ?'] }
  });
  topic('thanks', {
    kw: ['merci', 'matondo', 'asante', 'thanks', 'thank', 'super', 'parfait', 'genial', 'top', 'cool', 'ok merci', 'nickel'],
    keepTopic: true,
    main: { say: ['Avec plaisir ! Si vous voulez avancer sur votre dossier, un conseiller peut vous rappeler.'], chips: [CALLBACK, { l: 'Autre question', v: '@menu', ghost: true }] }
  });
  topic('bye', {
    kw: ['au revoir', 'bye', 'a bientot', 'bonne journee', 'bonne soiree', 'a plus', 'ciao', 'kwaheri', 'tokomonana'],
    keepTopic: true,
    main: { say: ['Au revoir et à bientôt ! Vous pouvez rouvrir cette fenêtre à tout moment : la conversation reste là tant que l\'onglet est ouvert.'] }
  });
  topic('bot', {
    kw: ['robot', 'bot', 'humain', 'intelligence artificielle', 'ia', 'chatgpt', 'qui es tu', 'tu es qui', 'vrai personne', 'une personne', 'automatique', 'akili'],
    keepTopic: true,
    main: { say: ['Je suis un assistant automatique : je connais bien les services d\'AKILITECH, mais je ne remplace pas un conseiller. Pour un dossier précis, l\'équipe vous répond sur WhatsApp ou vous rappelle.'], chips: [CALLBACK, { l: 'Voir les services', v: 'services' }] }
  });

  topic('about', {
    kw: ['akilitech c est quoi', 'qui etes vous', 'vous etes qui', 'presentation', 'a propos', 'votre entreprise', 'votre cabinet', 'new vialo', 'depuis quand', 'histoire', 'cabinet'],
    main: { say: ['AKILITECH est un cabinet de solutions administratives et RH, basé à Lubumbashi et créé en 2024. C\'est un département de NEW VIALO SARLU.', 'Notre rôle : vous décharger des démarches. Création de société, documents officiels, calcul des taxes, contacts avec les services de l\'État, mais aussi visas, permis de travail, formation et coaching.'], chips: [{ l: 'Nos services', v: 'services' }, { l: 'L\'équipe', v: 'equipe' }, { l: 'Nos partenaires', v: 'partenaires' }] }
  });
  topic('services', {
    kw: ['service', 'que faites vous', 'vous faites quoi', 'proposez', 'offre', 'activite', 'domaine', 'aide', 'help', 'menu', 'quoi'],
    main: {
      say: ['Deux métiers, un seul interlocuteur :<p><strong>Administratif</strong></p>' + ul(['création d\'entreprise et d\'ASBL', 'obtention des documents officiels (RCCM, ID NAT, NIF…)', 'calcul et déclaration des taxes DGI, CNSS, ONEM', 'certificat ARSP', 'démarches auprès des services de l\'État']) + '<p><strong>Ressources humaines</strong></p>' + ul(['permis de travail, visas, cartes de séjour', 'paie et décomptes finaux', 'formations en entreprise', 'coaching individuel et scolaire'])],
      chips: MAIN
    }
  });

  topic('creation', {
    label: 'Création d\'entreprise',
    kw: ['creer', 'creation', 'cree', 'entreprise', 'societe', 'ouvrir une entreprise', 'monter une', 'lancer mon', 'formaliser', 'enregistrer mon', 'immatriculer', 'business', 'startup', 'company', 'statuts', 'statut', 'capital', 'guichet unique'],
    main: {
      say: ['Oui, c\'est notre cœur de métier. On s\'occupe de tout, en cinq étapes :' + ul(['choix de la forme et rédaction des statuts', 'ouverture du compte de l\'entreprise dans la banque de votre choix', 'immatriculation : RCCM, ID NAT et NIF', 'déclaration employeur : CNSS et ONEM', 'certificat ARSP si vous visez la sous-traitance']) + '<p>À partir de <strong>500 $</strong>.</p>', 'Voulez-vous que je vous aide à choisir la forme qui vous convient ? Trois questions suffisent.'],
      chips: [{ l: 'Oui, m\'aider à choisir', v: '@diag' }, { l: 'Documents à fournir', v: 'documents a fournir creation' }, { l: 'Délais', v: 'delai creation' }, CALLBACK],
      expect: { yes: '@diag' }
    },
    price: { say: ['La création démarre à <strong>500 $</strong>. Le montant exact dépend de la forme, du capital et des démarches que vous souhaitez inclure (ARSP, déclaration employeur…). On vous envoie un devis précis après un court échange.'], chips: [{ l: 'Choisir ma forme', v: '@diag' }, CALLBACK] },
    docs: { say: ['Pour démarrer, on a en général besoin de :' + ul(['la pièce d\'identité du gérant et de chaque associé', 'le nom envisagé et l\'activité de l\'entreprise', 'l\'adresse du siège', 'le montant du capital']) + '<p>Les statuts et les formulaires, c\'est nous qui les rédigeons. La liste exacte vous est confirmée selon la forme choisie.</p>'], chips: [{ l: 'Choisir ma forme', v: '@diag' }, { l: 'Prix', v: 'prix creation' }, CALLBACK] },
    delay: { say: ['Le délai dépend surtout des services de l\'État (guichet unique, banque). Dès que le dossier est complet, on le dépose sans attendre et on vous tient informé à chaque étape. Vous recevez une estimation précise avec le devis.'], chips: [{ l: 'Documents à fournir', v: 'documents a fournir creation' }, CALLBACK] }
  });
  topic('formes', {
    label: 'Choix de la forme juridique',
    kw: ['sarl', 'sarlu', 'sas', 'sasu', 'ets', 'etablissement', 'forme juridique', 'quelle forme', 'difference', 'entreprise individuelle', 'sa', 'associe', 'associes', 'unipersonnelle'],
    main: {
      say: ['En bref :' + ul(['<strong>Établissement (Ets)</strong> : entreprise individuelle, la plus simple pour démarrer seul.', '<strong>SARLU / SASU</strong> : une société avec un seul associé, qui sépare vos biens personnels de ceux de l\'entreprise.', '<strong>SARL / SAS</strong> : pour créer à plusieurs associés.', '<strong>ASBL</strong> : pour un projet sans but lucratif.']), 'Je peux vous orienter en trois questions.'],
      chips: [{ l: 'Me conseiller', v: '@diag' }, { l: 'Prix', v: 'prix creation' }],
      expect: { yes: '@diag' }
    },
    price: function () { return T.creation.price; }
  });
  topic('asbl', {
    label: 'Création d\'ASBL',
    kw: ['asbl', 'association', 'ong', 'sans but lucratif', 'fondation', 'organisation non'],
    main: {
      say: ['Oui, on crée aussi les ASBL : rédaction des statuts et du procès-verbal de l\'assemblée constitutive, dossier d\'autorisation de fonctionnement, puis identification (ID NAT, NIF).', 'Si l\'ASBL emploie du personnel, on fait aussi l\'affiliation CNSS et la déclaration ONEM.'],
      chips: [CALLBACK, { l: 'Prix', v: 'prix creation' }]
    },
    price: function () { return T.creation.price; }
  });

  topic('documents', {
    label: 'Obtention d\'un document officiel',
    kw: ['document', 'documents', 'attestation', 'certificat', 'renouveler', 'renouvellement', 'papier', 'papiers', 'obtenir', 'obtention', 'mise a jour', 'modification', 'duplicata'],
    main: {
      say: ['On obtient pour vous les documents officiels de l\'entreprise : RCCM, ID NAT, NIF, affiliation CNSS, enregistrement ONEM, certificat ARSP, attestations et renouvellements.', 'Quel document vous faut-il ?'],
      chips: [{ l: 'RCCM', v: 'rccm' }, { l: 'ID NAT', v: 'id nat' }, { l: 'NIF', v: 'nif' }, { l: 'ARSP', v: 'arsp' }, { l: 'Autre document', v: '@lead' }]
    },
    docs: function () { return T.creation.docs; }
  });
  topic('rccm', {
    label: 'RCCM',
    kw: ['rccm', 'registre du commerce', 'registre', 'credit mobilier'],
    main: { say: ['Le RCCM (Registre du commerce et du crédit mobilier) immatricule votre entreprise. On prépare le dossier, on le dépose et on le suit jusqu\'à la délivrance. Il est compris dans notre offre de création, à partir de 500 $.'], chips: [{ l: 'ID NAT', v: 'id nat' }, { l: 'NIF', v: 'nif' }, CALLBACK] },
    price: function () { return T.creation.price; }, docs: function () { return T.creation.docs; }, delay: function () { return T.creation.delay; }
  });
  topic('idnat', {
    label: 'Identification nationale',
    kw: ['id nat', 'idnat', 'identification nationale', 'numero d identification'],
    main: { say: ['L\'identification nationale (ID NAT) est le numéro qui identifie votre entreprise auprès de l\'administration. On l\'obtient avec le RCCM et le NIF lors de la création.'], chips: [{ l: 'NIF', v: 'nif' }, { l: 'Créer mon entreprise', v: 'creation' }] },
    price: function () { return T.creation.price; }
  });
  topic('nif', {
    label: 'NIF',
    kw: ['nif', 'numero impot', 'numero d impot', 'numero fiscal', 'identifiant fiscal'],
    main: { say: ['Le NIF est votre numéro d\'impôt, délivré par la DGI. Il est indispensable pour facturer et déclarer. On l\'obtient pour vous, puis on peut gérer vos déclarations chaque mois, dès 80 $ / mois.'], chips: [{ l: 'Déclarations mensuelles', v: 'taxes' }, CALLBACK] },
    price: function () { return T.creation.price; }
  });
  topic('banque', {
    label: 'Compte bancaire de l\'entreprise',
    kw: ['banque', 'compte bancaire', 'compte en banque', 'ouvrir un compte', 'bank', 'depot du capital', 'equity', 'rawbank', 'tmb', 'ecobank', 'fbn'],
    main: { say: ['Le compte de l\'entreprise s\'ouvre dans la banque de votre choix : il sert à déposer le capital et à recevoir vos paiements. C\'est la deuxième étape de la création. On vous indique les pièces demandées et on prépare les documents de l\'entreprise à présenter.'], chips: [{ l: 'Les 5 étapes', v: 'creation' }, CALLBACK] }
  });

  topic('taxes', {
    label: 'Taxes et déclarations',
    kw: ['taxe', 'taxes', 'impot', 'impots', 'dgi', 'tva', 'ipr', 'fiscal', 'fiscalite', 'declaration', 'declarer', 'comptabilite', 'comptable', 'penalite', 'amende', 'redressement', 'calcul'],
    main: {
      say: ['On calcule et on déclare chaque mois vos taxes et cotisations :' + ul(['DGI : impôts, dont l\'IPR sur les salaires, et TVA', 'CNSS : cotisations sociales', 'ONEM']) + '<p>Abonnement <strong>dès 80 $ / mois</strong>, selon la taille de l\'entreprise et le nombre de salariés. Vous évitez les oublis et les pénalités.</p>'],
      chips: [{ l: 'Souscrire', v: '@lead' }, { l: 'CNSS et ONEM', v: 'cnss onem' }, { l: 'Paie', v: 'paie' }]
    },
    price: { say: ['L\'abonnement pour vos déclarations DGI, CNSS et ONEM démarre à <strong>80 $ / mois</strong>. Le montant dépend du nombre de salariés et du volume de factures.'], chips: [{ l: 'Demander un devis', v: '@lead' }] }
  });
  topic('cnss', {
    label: 'CNSS et ONEM',
    kw: ['cnss', 'onem', 'securite sociale', 'employeur', 'salarie', 'salaries', 'embaucher', 'embauche', 'recruter', 'premier employe', 'affiliation', 'affilier', 'cotisation', 'inpp'],
    main: { say: ['Dès votre premier salarié, l\'entreprise doit être affiliée à la CNSS et déclarée à l\'ONEM. On fait l\'affiliation, puis on peut prendre en charge les déclarations mensuelles, dès 80 $ / mois.'], chips: [{ l: 'Paie et bulletins', v: 'paie' }, CALLBACK] },
    price: function () { return T.taxes.price; }
  });
  topic('arsp', {
    label: 'Certificat ARSP',
    kw: ['arsp', 'sous traitance', 'soustraitance', 'sous traitant', 'sous-traitance', 'minier', 'miniere', 'mines', 'mine', 'gecamines', 'kcc', 'tfm', 'regulation de la sous'],
    main: {
      say: ['Le certificat ARSP (Autorité de régulation de la sous-traitance dans le secteur privé) est demandé aux entreprises qui travaillent en sous-traitance, notamment pour les sociétés minières. La loi réserve cette activité aux entreprises à capitaux majoritairement congolais : on vérifie avec vous que votre structure est éligible.', 'On monte et on suit votre dossier pour <strong>100 $</strong>. Votre entreprise a-t-elle déjà son RCCM, son ID NAT et son NIF ?'],
      chips: [{ l: 'Oui, déjà immatriculée', v: '@arsp-yes' }, { l: 'Non, pas encore', v: '@arsp-no' }],
      expect: { yes: '@arsp-yes', no: '@arsp-no' }
    },
    price: { say: ['Le certificat ARSP, c\'est <strong>100 $</strong> pour la constitution et le suivi du dossier.'], chips: [{ l: 'Lancer mon dossier', v: '@lead' }, { l: 'Documents à fournir', v: 'documents arsp' }] },
    docs: { say: ['En général : les documents de l\'entreprise (statuts, RCCM, ID NAT, NIF), la pièce d\'identité des dirigeants et la répartition du capital. On vous confirme la liste exacte avant le dépôt.'], chips: [{ l: 'Lancer mon dossier', v: '@lead' }] }
  });
  topic('etat', {
    label: 'Démarches auprès de l\'État',
    kw: ['etat', 'administration', 'ministere', 'mairie', 'gouvernorat', 'services publics', 'administratif', 'administrative', 'demarche', 'demarches', 'dgm', 'migration', 'faire la queue', 'suivi de dossier', 'relancer'],
    main: { say: ['On fait les démarches auprès des services de l\'État à votre place : guichet unique, DGI, CNSS, ONEM, ARSP, Direction générale de migration… Vous n\'avez ni à faire la queue ni à relancer : on dépose, on suit, et on vous informe à chaque étape.'], chips: [{ l: 'Créer mon entreprise', v: 'creation' }, { l: 'Un document précis', v: 'documents' }, CALLBACK] }
  });

  topic('immigration', {
    label: 'Permis de travail et visas',
    kw: ['immigration', 'expatrie', 'expat', 'etranger', 'etrangers', 'permis', 'work permit', 'permis de travail', 'carte de travail', 'travailler en rdc', 'cnee', 'visa', 'visas'],
    main: {
      say: ['Pour vos équipes et vos déplacements, on s\'occupe de :' + ul(['work permit (carte de travail pour étranger)', 'visas pour la RDC et renouvellements', 'visas pour la Chine', 'cartes de séjour professionnelles']) + '<p>On vérifie le dossier avant dépôt, on le dépose et on le suit jusqu\'à l\'obtention.</p>', 'De quoi avez-vous besoin ?'],
      chips: [{ l: 'Work permit', v: 'work permit' }, { l: 'Visa RDC', v: 'visa rdc' }, { l: 'Visa Chine', v: 'visa chine' }, { l: 'Carte de séjour', v: 'carte de sejour' }]
    },
    price: { say: ['Le tarif dépend du type de document, de sa durée et de la nationalité. Envoyez-nous la situation : on vous fait un devis après avoir vu le dossier.'], chips: [{ l: 'Demander un devis', v: '@lead' }] },
    docs: { say: ['La liste dépend du cas, mais prévoyez au minimum le passeport, le contrat ou l\'offre d\'emploi et les documents de l\'entreprise qui recrute. On vérifie tout avant le dépôt pour éviter un refus.'], chips: [{ l: 'Faire vérifier mon dossier', v: '@lead' }] },
    delay: { say: ['Les délais dépendent de l\'administration concernée et de la période. Prévenez-nous le plus tôt possible : on vous donne une estimation et on suit le dossier de près.'], chips: [CALLBACK] }
  });
  topic('permis', {
    label: 'Work permit',
    parent: 'immigration',
    kw: ['work permit', 'permis de travail', 'carte de travail', 'workpermit', 'permit'],
    main: {
      say: ['Un expatrié qui travaille en RDC a besoin d\'une carte de travail pour étranger, le « work permit », en plus de son visa et de sa carte de séjour.', 'On vérifie le dossier, on le dépose et on le suit jusqu\'à l\'obtention. Vous êtes l\'employeur ou l\'expatrié ?'],
      chips: [{ l: 'Je suis l\'employeur', v: '@permit-emp' }, { l: 'Je suis l\'expatrié', v: '@permit-exp' }]
    }
  });
  topic('visardc', {
    label: 'Visa pour la RDC',
    parent: 'immigration',
    kw: ['visa rdc', 'visa congo', 'visa congolais', 'visa d affaires', 'visa d etablissement', 'visa volant', 'prolongation', 'prolonger', 'entrer en rdc', 'venir en rdc'],
    main: { say: ['On prépare les demandes de visa pour la RDC (affaires, établissement…) et leur prolongation, puis on suit le dossier auprès de la Direction générale de migration. Dites-nous la nationalité, le motif et la date d\'arrivée prévue.'], chips: [{ l: 'Envoyer ma situation', v: '@lead' }, { l: 'Work permit', v: 'work permit' }] }
  });
  topic('visachine', {
    label: 'Visa pour la Chine',
    parent: 'immigration',
    kw: ['chine', 'chinois', 'china', 'visa chine', 'canton', 'guangzhou', 'yiwu', 'shanghai', 'pekin', 'foire'],
    main: { say: ['Vous partez en Chine pour un fournisseur, une foire ou des affaires ? On prépare votre dossier de visa chinois : formulaire, pièces justificatives, lettre d\'invitation et prise de rendez-vous.', 'Indiquez-nous votre date de départ : les délais consulaires comptent.'], chips: [{ l: 'Préparer mon visa', v: '@lead' }, { l: 'Documents à fournir', v: 'documents visa' }] },
    docs: { say: ['En général : passeport valide avec des pages libres, photo, formulaire de demande, lettre d\'invitation de l\'entreprise chinoise, réservation et justificatifs d\'activité. On vérifie tout avec vous avant le rendez-vous.'], chips: [{ l: 'Préparer mon visa', v: '@lead' }] }
  });
  topic('sejour', {
    label: 'Carte de séjour',
    parent: 'immigration',
    kw: ['carte de sejour', 'sejour', 'carte de resident', 'resident', 'residence', 'titre de sejour'],
    main: { say: ['La carte de séjour permet à vos collaborateurs étrangers de résider légalement en RDC. On monte la demande ou le renouvellement et on suit le dossier jusqu\'à la remise.'], chips: [{ l: 'Work permit', v: 'work permit' }, CALLBACK] }
  });

  topic('paie', {
    label: 'Paie et décomptes finaux',
    kw: ['paie', 'payroll', 'salaire', 'salaires', 'bulletin', 'fiche de paie', 'decompte', 'decomptes', 'decompte final', 'fin de contrat', 'licenciement', 'demission', 'preavis', 'indemnite', 'conge', 'code du travail', 'contrat de travail'],
    main: { say: ['On établit la paie de vos salariés (bulletins, IPR, CNSS) et les décomptes finaux en fin de contrat : préavis, congés, indemnités. Les montants sont justes et conformes au Code du travail.'], chips: [{ l: 'Demander un devis', v: '@lead' }, { l: 'Formation paie et GRH', v: 'formation grh' }] },
    price: { say: ['Le tarif dépend du nombre de salariés et de la fréquence. On vous fait un devis rapide.'], chips: [{ l: 'Demander un devis', v: '@lead' }] }
  });

  topic('formation', {
    label: 'Formation',
    kw: ['formation', 'formations', 'former', 'session', 'atelier', 'seminaire', 'training', 'catalogue', 'programme', 'inscription', 'inscrire', 'leadership', 'management', 'communication', 'intelligence emotionnelle', 'prise de parole', 'employabilite', 'education financiere'],
    main: {
      say: ['Nos sessions intensives :' + ul(['<strong>Formation en GRH</strong> : décomptes finaux, paie et outils d\'IA pour les RH, en trois jours', '<strong>Gestion des conflits</strong> en entreprise : prévention, médiation, négociation', '<strong>Coaching scolaire</strong> pour les élèves']) + '<p>Au catalogue aussi : leadership, gestion du temps, communication, intelligence émotionnelle, conduite du changement, prise de parole… En petits groupes ou directement dans votre entreprise.</p>'],
      chips: [{ l: 'Formation GRH', v: 'formation grh' }, { l: 'Gestion des conflits', v: 'gestion des conflits' }, { l: 'Coaching scolaire', v: 'coaching scolaire' }, { l: 'Recevoir le catalogue', v: '@wa-catalogue' }]
    },
    price: { say: ['Le prix dépend de la session, du nombre de participants et du lieu (chez nous ou dans votre entreprise). Demandez le programme et le devis : on vous répond vite.'], chips: [{ l: 'Recevoir le catalogue', v: '@wa-catalogue' }, CALLBACK] }
  });
  topic('grh', {
    label: 'Formation en GRH',
    parent: 'formation',
    kw: ['grh', 'ressources humaines', 'rh', 'formation grh', 'gestion des ressources', 'ia rh', 'outils d ia'],
    main: { say: ['La formation en GRH dure trois jours : calcul des décomptes finaux, paie et outils d\'intelligence artificielle appliqués aux ressources humaines. Idéale pour les responsables RH, gestionnaires et assistants administratifs.'], chips: [{ l: 'Réserver ma place', v: '@wa-grh' }, { l: 'Autres formations', v: 'formation' }] }
  });
  topic('conflits', {
    label: 'Gestion des conflits',
    parent: 'formation',
    kw: ['conflit', 'conflits', 'gestion des conflits', 'mediation', 'negociation', 'tension', 'climat social'],
    main: { say: ['La session « Gestion des conflits en entreprise » apprend à prévenir les tensions, conduire une médiation et négocier gagnant-gagnant. Elle peut se faire directement avec vos équipes.'], chips: [{ l: 'Réserver ma place', v: '@wa-conflits' }, { l: 'Autres formations', v: 'formation' }] }
  });
  topic('scolaire', {
    label: 'Coaching scolaire',
    kw: ['scolaire', 'eleve', 'eleves', 'enfant', 'enfants', 'ecole', 'etudes', 'examen', 'exetat', 'orientation', 'lycee', 'college', 'parent', 'fils', 'fille'],
    main: { say: ['Le coaching scolaire aide les élèves à progresser : méthodes de travail, motivation, confiance en soi et orientation. Les séances sont adaptées à l\'âge et aux besoins de l\'enfant.'], chips: [{ l: 'Réserver une place', v: '@wa-scolaire' }, { l: 'Coaching individuel', v: 'coaching' }] }
  });
  topic('coaching', {
    label: 'Coaching individuel',
    kw: ['coaching', 'coach', 'icf', 'developpement personnel', 'confiance en soi', 'accompagnement personnel', 'seance'],
    main: { say: ['Le coaching individuel se fait avec notre coach certifiée ICF : <strong>25 $ la séance d\'1 h 30</strong>, du lundi au vendredi, de 9 h à 15 h.', 'On propose aussi le coaching scolaire pour les élèves.'], chips: [{ l: 'Réserver une séance', v: '@wa-coaching' }, { l: 'Coaching scolaire', v: 'coaching scolaire' }] },
    price: { say: ['<strong>25 $</strong> la séance d\'1 h 30, du lundi au vendredi, de 9 h à 15 h.'], chips: [{ l: 'Réserver une séance', v: '@wa-coaching' }] }
  });
  topic('horsoffre', {
    kw: ['business plan', 'incubation', 'incubateur', 'pre incubation', 'preincubation', 'coaching entrepreneurial', 'financement', 'subvention', 'investisseur', 'pret', 'credit', 'levee de fonds'],
    main: { say: ['Ce n\'est pas un service que nous proposons. En revanche, on prend en charge toute la partie administrative de votre projet : forme juridique, statuts, compte bancaire, RCCM, ID NAT, NIF et déclarations.'], chips: [{ l: 'Créer mon entreprise', v: 'creation' }, { l: 'Nos services', v: 'services' }] }
  });
  topic('emploi', {
    kw: ['emploi', 'travail', 'job', 'stage', 'stagiaire', 'cv', 'candidature', 'postuler', 'recrutez', 'offre d emploi', 'chercher du travail'],
    main: { say: ['AKILITECH ne publie pas d\'offres d\'emploi. Nous animons en revanche des programmes d\'employabilité (recherche d\'emploi, CV, entretiens) avec nos partenaires : suivez nos pages pour ne pas manquer les prochaines sessions.'], chips: [{ l: 'Nos actualités', v: '@go-actualites' }, { l: 'Formations', v: 'formation' }] }
  });

  topic('tarifs', {
    kw: ['tarifs', 'grille', 'liste des prix', 'vos prix', 'combien coutent'],
    main: function () { return priceAll(); }
  });
  topic('contact', {
    kw: ['contact', 'contacter', 'joindre', 'telephone', 'numero', 'appeler', 'whatsapp', 'mail', 'email', 'e mail', 'courriel', 'ecrire', 'rappeler', 'rappel'],
    main: {
      say: ['Vous pouvez nous joindre :' + ul(['WhatsApp : <a href="https://wa.me/' + WA_NUM + '" target="_blank" rel="noopener">+243 904 983 794</a>', 'Téléphone : <a href="tel:+243976494507">+243 976 494 507</a> ou <a href="tel:+243896628382">+243 896 628 382</a>', 'Belgique : <a href="tel:+32496882903">+32 496 88 29 03</a>', 'E-mail : <a href="mailto:info@akilitech.org">info@akilitech.org</a>']), 'Ou laissez-moi votre numéro : un conseiller vous rappelle.'],
      chips: [CALLBACK, { l: 'Adresse du bureau', v: 'adresse' }]
    }
  });
  topic('adresse', {
    kw: ['adresse', 'ou etes vous', 'ou se trouve', 'situe', 'bureau', 'localisation', 'venir', 'passer', 'plan', 'maps', 'golf', 'lubumbashi', 'ou vous trouver'],
    main: { say: ['Notre bureau : N°46 E, avenue Yav Tshibal, Golf Kabulameshi, commune Annexe, Lubumbashi. <a href="https://www.google.com/maps/search/?api=1&query=Avenue+Yav+Tshibal+Golf+Kabulameshi+Lubumbashi" target="_blank" rel="noopener">Ouvrir dans Google Maps</a>', 'Prévenez-nous avant de passer, pour être sûr qu\'un conseiller vous reçoive.'], chips: [{ l: 'Prévenir sur WhatsApp', v: '@wa-visite' }, { l: 'Autre question', v: '@menu', ghost: true }] }
  });
  topic('ville', {
    kw: ['kinshasa', 'kolwezi', 'likasi', 'goma', 'bukavu', 'kisangani', 'autre ville', 'a distance', 'en ligne', 'depuis l etranger', 'belgique', 'europe', 'diaspora'],
    main: { say: ['Nous sommes basés à Lubumbashi, avec un contact en Belgique (+32 496 88 29 03). Beaucoup de démarches se suivent à distance : décrivez votre cas et on vous dit tout de suite si on peut le prendre en charge.'], chips: [CALLBACK, { l: 'Écrire sur WhatsApp', v: '@wa-general' }] }
  });
  topic('horaires', {
    kw: ['horaire', 'horaires', 'heure', 'heures', 'ouvert', 'ouverture', 'samedi', 'dimanche', 'week end', 'disponible'],
    main: { say: ['Écrivez-nous sur WhatsApp à toute heure : l\'équipe répond pendant les heures de bureau. Pour le coaching individuel, les séances ont lieu du lundi au vendredi, de 9 h à 15 h.'], chips: [{ l: 'Écrire sur WhatsApp', v: '@wa-general' }, CALLBACK] }
  });
  topic('paiement', {
    kw: ['paiement', 'payer comment', 'mode de paiement', 'mobile money', 'm pesa', 'mpesa', 'airtel money', 'orange money', 'cash', 'virement', 'acompte', 'avance'],
    main: { say: ['Les modalités de paiement (acompte, solde, moyen de paiement) sont précisées dans le devis que vous recevez avant le lancement du dossier. Rien n\'est engagé sans votre accord.'], chips: [{ l: 'Demander un devis', v: '@lead' }] }
  });
  topic('equipe', {
    kw: ['equipe', 'aline', 'nyota', 'selemani', 'philip', 'philippe', 'nawej', 'alain', 'kazadi', 'directrice', 'fondatrice', 'responsable', 'qui travaille', 'gerant', 'patron'],
    main: { say: ['L\'équipe :' + ul(['<strong>Aline Selemani (Nyota)</strong>, directrice générale, coach certifiée ICF et conseillère en ressources humaines', '<strong>Philip Nawej Kayomb</strong>, business developer : communication digitale, outils de suivi numérique, coach', '<strong>Kazadi Mbolela Alain</strong>, assistant administratif et digital, il suit les dossiers au quotidien'])], chips: [{ l: 'Voir l\'équipe', v: '@go-equipe' }, CALLBACK] }
  });
  topic('partenaires', {
    kw: ['partenaire', 'partenaires', 'reference', 'references', 'clients', 'wbi', 'wallonie', 'auf', 'unilu', 'universite', 'experience', 'confiance', 'fiable', 'serieux', 'avis', 'temoignage'],
    main: { say: ['Nous avons animé des programmes d\'employabilité avec Wallonie-Bruxelles International, l\'Agence universitaire de la Francophonie et l\'Université de Lubumbashi. Plus de 200 personnes ont été formées.', 'Vous trouverez aussi les témoignages de nos clients sur cette page.'], chips: [{ l: 'Voir les témoignages', v: '@go-temoignages' }, { l: 'Nos services', v: 'services' }] }
  });

  function priceAll() {
    return {
      say: ['Nos tarifs de référence :' + ul(['Création d\'entreprise : à partir de <strong>500 $</strong>', 'Certificat ARSP : <strong>100 $</strong>', 'Déclarations DGI, CNSS, ONEM : dès <strong>80 $ / mois</strong>', 'Coaching individuel : <strong>25 $</strong> la séance d\'1 h 30']) + '<p>Pour les visas, permis de travail, la paie et les formations, le devis dépend du dossier.</p>'],
      chips: [{ l: 'Demander un devis', v: '@lead' }, { l: 'Créer mon entreprise', v: 'creation' }, { l: 'Certificat ARSP', v: 'arsp' }]
    };
  }

  /* ---------- Compréhension ---------- */
  var INDEX = [];
  Object.keys(T).forEach(function (id) {
    T[id].kw.forEach(function (k) {
      var n = norm(k);
      INDEX.push({ id: id, k: n, phrase: n.indexOf(' ') > -1, s: stem(n) });
    });
  });
  function scoreTopics(q) {
    var toks = q.split(' ').map(stem), scores = {};
    INDEX.forEach(function (e) {
      var s = 0;
      if (e.phrase) { if ((' ' + q + ' ').indexOf(' ' + e.k + ' ') > -1) s = 3 + e.k.length / 10; }
      else {
        for (var i = 0; i < toks.length; i++) {
          var t = toks[i];
          if (t === e.s) { s = Math.max(s, 2); }
          else if (e.s.length >= 4 && t.length >= 4 && (t.indexOf(e.s) === 0 || e.s.indexOf(t) === 0) && Math.min(t.length, e.s.length) / Math.max(t.length, e.s.length) > 0.6) { s = Math.max(s, 1.6); }
          else if (e.s.length >= 5 && t.length >= 4) {
            var d = lev(t, e.s);
            if (d === 1 || (d === 2 && e.s.length >= 8)) s = Math.max(s, 1.3);
          }
        }
      }
      if (s) scores[e.id] = (scores[e.id] || 0) + s;
    });
    return scores;
  }
  function detectAttr(q) {
    var best = null;
    Object.keys(ATTR).forEach(function (a) {
      ATTR[a].forEach(function (k) {
        var n = norm(k) || k;
        if ((' ' + q + ' ').indexOf(' ' + n + ' ') > -1 || (n.length > 4 && q.split(' ').some(function (t) { return t.length > 4 && lev(t, n) <= 1; }))) best = best || a;
      });
    });
    return best;
  }
  var YES = /^(oui|ouais|yes|ok|okay|d accord|daccord|volontiers|bien sur|exactement|c est ca|ndio|eyo|iyo|go|vas y|allons y)( .*)?$/;
  var NO = /^(non|no|pas maintenant|plus tard|non merci|pas encore|hapana|te)( .*)?$/;

  function asReply(r, q) { return typeof r === 'function' ? asReply(r(q), q) : r; }

  function understand(text) {
    var q = norm(text);
    if (!q) return null;
    if (S.expect) {
      var ex = S.expect; S.expect = null;
      if (YES.test(q) && ex.yes) return action(ex.yes);
      if (NO.test(q) && ex.no) return action(ex.no);
      if (NO.test(q)) return { say: ['Entendu. Autre chose que je peux vous expliquer ?'] };
    }
    var scores = scoreTopics(q);
    var ids = Object.keys(scores).sort(function (a, b) { return scores[b] - scores[a]; });
    var attr = detectAttr(q);
    /* les salutations ne gagnent que si rien d'autre n'est demandé */
    var social = ['greet', 'cava', 'thanks', 'bye'];
    var main = ids.filter(function (i) { return social.indexOf(i) === -1; });
    var best = main.length && scores[main[0]] >= 1.6 ? main[0] : null;
    if (best && T[best].parent && scores[T[best].parent] > scores[best]) best = T[best].parent;

    if (!best && ids.length && scores[ids[0]] >= 1.6 && !attr) {
      S.misses = 0;
      return asReply(T[ids[0]].main, q);
    }
    if (!best && attr && S.topic && T[S.topic]) best = S.topic;
    if (!best && attr === 'price') { S.misses = 0; return priceAll(); }
    if (!best) {
      if (YES.test(q)) return { say: ['Parfait ! Dites-moi ce que vous souhaitez savoir, ou choisissez un sujet.'] };
      return null;
    }
    S.misses = 0;
    var t = T[best];
    if (!t.keepTopic) S.topic = best;
    var r = (attr && t[attr]) ? t[attr] : (attr && t.parent && T[t.parent][attr]) ? T[t.parent][attr] : t.main;
    r = asReply(r, q);
    if (attr === 'price' && r === asReply(t.main, q) && !t.price) {
      r = { say: [].concat(r.say || []), chips: r.chips };
      r.say.push('Pour ce service, le prix dépend du dossier : demandez un devis, c\'est gratuit et sans engagement.');
    }
    if (r.expect) S.expect = r.expect;
    /* petite touche si le message commence par une salutation */
    if (scores.greet && main.length && !S.greeted) {
      S.greeted = true;
      r = { say: ['Bonjour !'].concat(r.say || []), chips: r.chips, card: r.card, expect: r.expect };
    }
    return r;
  }

  function fallback(text) {
    S.misses++;
    if (S.misses >= 2) {
      S.misses = 0;
      return {
        say: ['Je n\'ai pas la réponse à cette question, mais un conseiller l\'aura. Envoyez-la directement sur WhatsApp, elle est déjà rédigée :' + '<br>' + waBtn('Bonjour Akilitech, j\'ai une question : ' + text, 'Envoyer ma question')],
        chips: [CALLBACK, { l: 'Revenir au menu', v: '@menu', ghost: true }]
      };
    }
    return { say: ['Je ne suis pas sûr de bien comprendre. Pouvez-vous reformuler ? Je peux vous renseigner sur ces sujets :'], chips: MAIN };
  }

  /* ---------- Parcours guidés ---------- */
  function startDiag() {
    S.flow = 'diag'; S.step = 1; S.data = {}; S.topic = 'creation';
    return { say: ['C\'est parti. Première question : vous créez seul ou à plusieurs ?'], chips: [{ l: 'Seul(e)', v: '@d1-seul' }, { l: 'À plusieurs associés', v: '@d1-plusieurs' }, { l: 'Projet sans but lucratif', v: '@d1-asbl' }, { l: 'Annuler', v: '@cancel', ghost: true }] };
  }
  function diagStep(v) {
    if (S.step === 1) {
      S.data.who = v;
      if (v === 'asbl') { S.step = 3; return askHire(); }
      S.step = 2;
      return { say: ['Dans quel domaine allez-vous travailler ?'], chips: [{ l: 'Commerce', v: '@d2-commerce' }, { l: 'Services', v: '@d2-services' }, { l: 'Sous-traitance (mines, industrie)', v: '@d2-soustraitance' }, { l: 'BTP ou transport', v: '@d2-btp' }, { l: 'Autre', v: '@d2-autre' }] };
    }
    if (S.step === 2) { S.data.sector = v; S.step = 3; return askHire(); }
    if (S.step === 3) { S.data.hire = v; S.flow = null; return diagResult(); }
  }
  function askHire() {
    return { say: ['Dernière question : comptez-vous embaucher du personnel ?'], chips: [{ l: 'Oui, rapidement', v: '@d3-oui' }, { l: 'Pas tout de suite', v: '@d3-non' }] };
  }
  function diagResult() {
    var d = S.data, forme, why, steps = [], budget = ['Création : à partir de 500 $'];
    if (d.who === 'seul') { forme = 'Établissement ou SARLU'; why = 'L\'Établissement est le plus simple pour démarrer seul. La SARLU (ou la SASU) protège vos biens personnels et rassure davantage les grands clients.'; }
    else if (d.who === 'plusieurs') { forme = 'SARL ou SAS'; why = 'La SARL est la plus courante entre associés. La SAS laisse plus de liberté dans l\'organisation et l\'entrée de nouveaux associés.'; }
    else { forme = 'ASBL'; why = 'Pour un projet sans but lucratif : association, ONG, initiative sociale ou culturelle.'; }
    if (d.who !== 'asbl' && d.sector === 'soustraitance') { forme = d.who === 'seul' ? 'SARLU' : 'SARL ou SAS'; why += ' Pour la sous-traitance, une société est préférable à un Établissement.'; }
    steps.push(d.who === 'asbl' ? 'Statuts et PV de l\'assemblée constitutive' : 'Statuts de la ' + forme.split(' ')[0]);
    if (d.who !== 'asbl') steps.push('Compte bancaire de l\'entreprise');
    steps.push(d.who === 'asbl' ? 'Autorisation de fonctionnement, ID NAT, NIF' : 'RCCM, ID NAT, NIF');
    if (d.hire === 'oui') { steps.push('Affiliation CNSS et déclaration ONEM'); budget.push('Déclarations mensuelles : dès 80 $ / mois'); }
    if (d.sector === 'soustraitance') { steps.push('Certificat ARSP'); budget.push('Certificat ARSP : 100 $'); }
    S.data.summary = 'Forme conseillée : ' + forme + '. Étapes : ' + steps.join(', ') + '.';
    var card = '<h4>Votre feuille de route</h4><dl><dt>Forme</dt><dd>' + esc(forme) + '</dd><dt>Étapes</dt><dd>' + steps.map(esc).join('<br>') + '</dd><dt>Budget</dt><dd>' + budget.map(esc).join('<br>') + '</dd></dl>';
    return {
      say: ['Merci ! Voici ce que je vous conseille. ' + why, 'C\'est une première orientation : la forme définitive se choisit avec un conseiller, selon votre capital et vos projets.'],
      card: card,
      chips: [{ l: 'Être rappelé pour lancer', v: '@lead' }, { l: 'Envoyer sur WhatsApp', v: '@wa-diag' }, { l: 'Recommencer', v: '@diag', ghost: true }]
    };
  }

  function startLead() {
    S.flow = 'lead'; S.step = 1;
    S.lead = { besoin: S.topic && T[S.topic] && T[S.topic].label ? T[S.topic].label : '' };
    if (S.data && S.data.summary && S.topic === 'creation') S.lead.besoin = 'Création d\'entreprise. ' + S.data.summary;
    return { say: ['Avec plaisir. Un conseiller vous rappelle rapidement. Quel est votre nom ?'], chips: [{ l: 'Annuler', v: '@cancel', ghost: true }] };
  }
  function leadStep(text) {
    var t = text.trim();
    if (S.step === 1) {
      if (t.replace(/[^a-zA-ZÀ-ÿ]/g, '').length < 2) return { say: ['Pouvez-vous m\'indiquer votre nom ?'], chips: [{ l: 'Annuler', v: '@cancel', ghost: true }] };
      S.lead.nom = t.slice(0, 80); S.step = 2;
      return { say: ['Merci ' + esc(S.lead.nom.split(' ')[0]) + '. Votre numéro WhatsApp ou de téléphone ?'], chips: [{ l: 'Annuler', v: '@cancel', ghost: true }] };
    }
    if (S.step === 2) {
      var digits = t.replace(/[^0-9]/g, '');
      if (digits.length < 9 || digits.length > 15) return { say: ['Ce numéro ne semble pas complet. Exemple : +243 970 000 000.'], chips: [{ l: 'Annuler', v: '@cancel', ghost: true }] };
      S.lead.tel = t.slice(0, 30); S.step = 3;
      var chips = [];
      if (S.lead.besoin) chips.push({ l: S.lead.besoin.split('.')[0], v: '@keep-need' });
      chips.push({ l: 'Annuler', v: '@cancel', ghost: true });
      return { say: ['En une phrase, quel est votre besoin ?' + (S.lead.besoin ? ' Vous pouvez aussi garder le sujet dont nous parlions.' : '')], chips: chips };
    }
    if (S.step === 3) {
      if (t && t !== '@keep-need') S.lead.besoin = t.slice(0, 500);
      if (!S.lead.besoin) return { say: ['Décrivez votre besoin en quelques mots, par exemple : « créer une SARL » ou « work permit pour un ingénieur ».'] };
      S.step = 4;
      var card = '<h4>Récapitulatif</h4><dl><dt>Nom</dt><dd>' + esc(S.lead.nom) + '</dd><dt>Téléphone</dt><dd>' + esc(S.lead.tel) + '</dd><dt>Besoin</dt><dd>' + esc(S.lead.besoin) + '</dd></dl>';
      return { say: ['Je transmets ceci à l\'équipe ?'], card: card, chips: [{ l: 'Envoyer', v: '@lead-send' }, { l: 'Corriger', v: '@lead' }, { l: 'Annuler', v: '@cancel', ghost: true }], expect: { yes: '@lead-send', no: '@cancel' } };
    }
  }
  function leadSummary() {
    return 'Bonjour Akilitech, je suis ' + S.lead.nom + ' (' + S.lead.tel + '). Mon besoin : ' + S.lead.besoin;
  }
  function sendLead() {
    S.flow = null;
    var summary = leadSummary();
    var send = window.AKL_sendLead ? window.AKL_sendLead({
      'Nom': S.lead.nom, 'Téléphone': S.lead.tel, 'Besoin': S.lead.besoin,
      'Source': 'Assistant Akili du site', '_subject': 'Demande de rappel : ' + S.lead.besoin.slice(0, 60)
    }) : Promise.reject();
    var typing = document.createElement('div');
    typing.className = 'typing-dots'; typing.innerHTML = '<i></i><i></i><i></i>';
    log.appendChild(typing); log.scrollTop = log.scrollHeight;
    setChips(null);
    return send.then(function () {
      typing.remove();
      return botSay({ say: ['C\'est transmis. Un conseiller vous rappelle au ' + esc(S.lead.tel) + ' dès que possible.', 'Pour aller plus vite, vous pouvez aussi envoyer le même message sur WhatsApp :<br>' + waBtn(summary)], chips: [{ l: 'Autre question', v: '@menu' }] });
    }, function () {
      typing.remove();
      return botSay({ say: ['L\'envoi automatique n\'a pas abouti. Votre message est prêt : envoyez-le sur WhatsApp en un clic.<br>' + waBtn(summary, 'Envoyer sur WhatsApp')], chips: [{ l: 'Autre question', v: '@menu' }] });
    });
  }

  var WA_TEXT = {
    'catalogue': 'Bonjour Akilitech, pouvez-vous m\'envoyer votre catalogue de formations ?',
    'grh': 'Bonjour Akilitech, je souhaite m\'inscrire à la formation en GRH.',
    'conflits': 'Bonjour Akilitech, je souhaite m\'inscrire à la formation en gestion des conflits.',
    'scolaire': 'Bonjour Akilitech, je souhaite inscrire mon enfant au coaching scolaire.',
    'coaching': 'Bonjour Akilitech, je souhaite réserver une séance de coaching individuel.',
    'visite': 'Bonjour Akilitech, je souhaite passer à votre bureau. Quand puis-je venir ?',
    'general': 'Bonjour Akilitech, '
  };

  function action(v) {
    var a = v.slice(1);
    if (a === 'menu') { S.flow = null; return { say: ['Que voulez-vous savoir ?'], chips: MAIN }; }
    if (a === 'cancel') { S.flow = null; S.expect = null; return { say: ['C\'est annulé. Autre chose ?'], chips: MAIN }; }
    if (a === 'diag') return startDiag();
    if (a.indexOf('d1-') === 0 || a.indexOf('d2-') === 0 || a.indexOf('d3-') === 0) {
      if (S.flow !== 'diag') return startDiag();
      return diagStep(a.slice(3));
    }
    if (a === 'lead') return startLead();
    if (a === 'keep-need') return S.flow === 'lead' ? leadStep('@keep-need') : startLead();
    if (a === 'lead-send') { if (S.lead && S.lead.tel) { sendLead(); return 'async'; } return startLead(); }
    if (a === 'arsp-yes') return { say: ['Parfait, on peut lancer le dossier ARSP directement. Laissez-moi vos coordonnées, ou écrivez-nous sur WhatsApp.'], chips: [CALLBACK, { l: 'WhatsApp', v: '@wa-arsp' }] };
    if (a === 'arsp-no') return { say: ['Pas de souci : on commence par créer et immatriculer l\'entreprise (RCCM, ID NAT, NIF), puis on enchaîne avec l\'ARSP. Tout se suit dans un seul dossier.'], chips: [{ l: 'Choisir ma forme', v: '@diag' }, CALLBACK] };
    if (a === 'permit-emp') return { say: ['Très bien. Préparez le passeport du collaborateur, son contrat ou sa lettre d\'engagement et les documents de votre entreprise. On vérifie le tout avant le dépôt pour éviter un refus.'], chips: [{ l: 'Faire vérifier le dossier', v: '@lead' }, { l: 'Carte de séjour', v: 'carte de sejour' }] };
    if (a === 'permit-exp') return { say: ['Le work permit est demandé par l\'employeur, mais on peut vous aider à rassembler vos pièces et à suivre le dossier avec lui. On s\'occupe aussi de votre visa et de votre carte de séjour.'], chips: [{ l: 'Être accompagné', v: '@lead' }, { l: 'Visa RDC', v: 'visa rdc' }] };
    if (a.indexOf('wa-') === 0) {
      var key = a.slice(3), text;
      if (key === 'diag') text = 'Bonjour Akilitech, je souhaite créer mon entreprise. ' + (S.data.summary || '');
      else if (key === 'arsp') text = 'Bonjour Akilitech, je souhaite obtenir le certificat ARSP pour mon entreprise.';
      else text = WA_TEXT[key] || WA_TEXT.general;
      return { say: ['Votre message est prêt :<br>' + waBtn(text)], chips: [{ l: 'Autre question', v: '@menu', ghost: true }] };
    }
    if (a.indexOf('go-') === 0) {
      var target = document.getElementById(a.slice(3));
      if (target) { closePanel(); setTimeout(function () { target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }, 150); }
      return 'none';
    }
    return null;
  }

  /* ---------- Boucle principale ---------- */
  function userSays(label, value) {
    var text = (label || '').trim();
    if (!text) return;
    push('me', esc(text));
    var v = value || text;
    var r = null;
    /* un numéro ou un libellé de bouton tapé au clavier */
    if (!value && S.chips && S.chips.length) {
      var n = parseInt(text, 10);
      if (String(n) === text && S.chips[n - 1]) v = S.chips[n - 1].v;
      else S.chips.forEach(function (c) { if (norm(c.l) === norm(text)) v = c.v; });
    }
    if (/^(annuler|stop|laisse tomber|quitter)$/.test(norm(text))) v = '@cancel';
    if (v.charAt(0) === '@') r = action(v);
    else if (S.flow === 'lead') r = leadStep(text);
    else if (S.flow === 'diag') {
      var q = norm(text), map = { 1: { seul: /seul|moi|unique|un associe|1/, plusieurs: /plusieurs|associes|nous|deux|trois|2|3/, asbl: /asbl|ong|association|non lucratif|sans but/ }, 2: { soustraitance: /sous|mine|minier|industri/, commerce: /commerce|vente|boutique|import|export/, btp: /btp|construction|transport|logistique/, services: /service|conseil|informatique|nettoyage|consult/ }, 3: { oui: /oui|bientot|rapidement|yes|embauch/, non: /non|pas|plus tard|seul/ } }[S.step], hit = null;
      if (map) Object.keys(map).forEach(function (k) { if (!hit && map[k].test(q)) hit = k; });
      r = hit ? diagStep(hit) : (S.step === 2 ? diagStep('autre') : { say: ['Choisissez l\'une des réponses ci-dessous, ou tapez « annuler ».'], chips: S.chips });
    }
    else r = understand(v);
    if (r === 'async' || r === 'none') return;
    botSay(r || fallback(text));
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var t = input.value;
    input.value = '';
    userSays(t);
  });

  /* ---------- Ouverture, fermeture ---------- */
  function welcome() {
    botSay({
      say: ['Bonjour, je suis Akili, l\'assistant automatique d\'AKILITECH.', 'Je réponds tout de suite sur nos démarches : création d\'entreprise, documents officiels, taxes, ARSP, visas, paie, formations. Que puis-je faire pour vous ?'],
      chips: MAIN
    });
  }
  function openPanel() {
    panel.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    teaser.hidden = true;
    try { sessionStorage.setItem('akl-teaser', '1'); } catch (e) {}
    document.body.classList.add('akili-open');
    if (!S.log.length) welcome();
    log.scrollTop = log.scrollHeight;
    setTimeout(function () { if (window.innerWidth > 640) input.focus(); }, 60);
  }
  function closePanel() {
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('akili-open');
    toggle.focus({ preventScroll: true });
  }
  toggle.addEventListener('click', openPanel);
  document.getElementById('akiliClose').addEventListener('click', closePanel);
  document.getElementById('akiliReset').addEventListener('click', function () {
    S = { log: [], topic: null, flow: null, step: 0, data: {}, expect: null, misses: 0, chips: null, lead: {} };
    log.innerHTML = ''; save(); welcome();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) closePanel(); });
  log.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-close]');
    if (a) closePanel();
  });

  teaser.addEventListener('click', function (e) {
    if (e.target.id === 'akiliTeaserClose') { teaser.hidden = true; try { sessionStorage.setItem('akl-teaser', '1'); } catch (er) {} return; }
    openPanel();
  });

  /* Restauration de la conversation */
  load();
  if (S.log.length) {
    S.log.forEach(function (e) { bubble(e, false); });
    setChips(S.chips || MAIN);
  }
  var seen = false;
  try { seen = sessionStorage.getItem('akl-teaser') === '1'; } catch (e) {}
  if (!seen && !S.log.length) setTimeout(function () { if (panel.hidden) teaser.hidden = false; }, 7000);

  /* Pour les tests */
  window.AKL_bot = { ask: userSays, understand: understand, state: function () { return S; } };
})();
