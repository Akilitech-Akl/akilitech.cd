# Site Web AKILITECH

Site vitrine complet, animé et responsive pour **AKILITECH** — "Pour une innovation à l'africaine".

Construit en **HTML / CSS / JavaScript pur** (aucune installation, aucune dépendance, aucun serveur
requis) : vous pouvez l'ouvrir, le modifier et le déployer immédiatement.

---

## 1. Contenu du dossier

```
akilitech-website/
├── index.html              → toute la structure du site (une seule page)
├── css/
│   └── style.css           → tous les styles + animations
├── js/
│   └── script.js            → menu, carrousel, compteurs, formulaire, animations au scroll
├── assets/
│   ├── img/                 → logo, favicon, images de la page (voir LISEZ-MOI.txt)
│   ├── team/                → photos de l'équipe (voir LISEZ-MOI.txt)
│   └── partners/            → (optionnel) vrais logos des partenaires
└── README.md                → ce guide
```

### Ce que contient déjà le site
- Page d'accueil avec **carrousel d'images en fondu enchaîné** + effet machine à écrire
- Bande déroulante animée des partenaires (**marquee**)
- Section "Qui sommes-nous", "Notre mission", "Nos domaines d'expertise" (6 cartes)
- Bannière "Créez votre entreprise à partir de 350 $"
- Section "Programmes" (Bootcamp Employabilité des jeunes) avec mini-galerie cliquable
- Section "Notre équipe" (Aline Selemani, Philip Nawej Kayomb)
- Section "Partenaires" (Wallonie-Bruxelles International, AUF, Ovation, FMPP, Province du
  Haut-Katanga, Kamoto Copper Company, Brasimba)
- Formulaire de contact + coordonnées + **liens réseaux sociaux** (LinkedIn, Facebook, Instagram,
  WhatsApp) dans l'en-tête, le pied de page et un **bouton WhatsApp flottant**
- Animations au défilement, compteurs animés, menu mobile, bouton "retour en haut"
- Site 100% **responsive** (mobile, tablette, ordinateur)

---

## 2. Ouvrir et modifier le site dans VS Code

1. **Installez VS Code** si ce n'est pas déjà fait : https://code.visualstudio.com
2. Décompressez le dossier `akilitech-website` reçu, puis dans VS Code :
   `Fichier > Ouvrir le dossier...` → sélectionnez `akilitech-website`
3. Installez l'extension **Live Server** (par Ritwick Dey) depuis l'onglet Extensions (icône carrés à gauche).
4. Faites un clic droit sur `index.html` → **"Open with Live Server"**.
   → Le site s'ouvre dans votre navigateur et se recharge automatiquement à chaque modification.

### Modifier les textes
Tout le texte est directement dans `index.html`. Cherchez le texte à changer (Ctrl+F) et modifiez-le.

### Ajouter vos vraies photos
Suivez les fichiers `LISEZ-MOI.txt` dans `assets/img/` et `assets/team/` : déposez vos photos avec
les **mêmes noms de fichiers** (ex: `hero-1.jpg`, `aline.jpg`...) et elles apparaîtront automatiquement.
Tant qu'une image n'est pas ajoutée, un joli fond dégradé s'affiche à la place (aucune erreur visuelle).

### Changer les couleurs
En haut du fichier `css/style.css`, la section `:root` regroupe toutes les couleurs du site :
```css
--navy: #16283f;     /* bleu marine principal */
--yellow: #f4c024;   /* jaune Akilitech */
--teal: #17a2a0;      /* couleur d'accent */
```
Changez ces codes couleur et tout le site se met à jour automatiquement.

### Mettre à jour les liens réseaux sociaux
Dans `index.html`, remplacez les `href="https://www.linkedin.com/"` etc. par vos vraies pages
(recherchez `linkedin.com`, `facebook.com`, `instagram.com`, `wa.me` avec Ctrl+F — il y a 3 blocs
identiques : en-tête, pied de page, et bouton flottant WhatsApp).

Le numéro WhatsApp est déjà relié à **+243 90 49 83 794** via le format `https://wa.me/243904983794`.

### Formulaire de contact
Par défaut, le formulaire ouvre le client mail du visiteur avec le message pré-rempli (aucun
serveur requis). Si vous voulez un **envoi automatique sans ouvrir de client mail**, connectez le
formulaire à un service gratuit comme :
- [Formspree](https://formspree.io) (le plus simple)
- [EmailJS](https://www.emailjs.com)
- [Netlify Forms](https://docs.netlify.com/forms/setup/) (si vous hébergez sur Netlify)

Il suffit de suivre leur documentation et de remplacer l'attribut `action` du `<form>` dans
`index.html`.

---

## 3. Déployer gratuitement sur GitHub Pages

### Étape 1 — Créer un dépôt GitHub
1. Créez un compte sur https://github.com si besoin.
2. Cliquez sur **"New repository"**, nommez-le par exemple `akilitech-site`, laissez-le public,
   puis cliquez sur **"Create repository"**.

### Étape 2 — Envoyer le code depuis VS Code
Dans VS Code, ouvrez un terminal (`Terminal > Nouveau terminal`) puis tapez :

```bash
git init
git add .
git commit -m "Premier envoi du site AKILITECH"
git branch -M main
git remote add origin https://github.com/VOTRE-NOM-UTILISATEUR/akilitech-site.git
git push -u origin main
```
(Remplacez `VOTRE-NOM-UTILISATEUR` par votre nom d'utilisateur GitHub.)

> Astuce : VS Code propose aussi un bouton "Publish to GitHub" directement dans l'onglet
> **Source Control** (icône branche à gauche) — plus simple si vous découvrez Git.

### Étape 3 — Activer GitHub Pages
1. Sur la page de votre dépôt GitHub, allez dans **Settings > Pages**.
2. Sous "Build and deployment" → **Source**, choisissez `Deploy from a branch`.
3. Sous "Branch", choisissez `main` et le dossier `/ (root)`, puis **Save**.
4. Patientez 1 à 2 minutes : votre site sera disponible à l'adresse :
   `https://VOTRE-NOM-UTILISATEUR.github.io/akilitech-site/`

### Étape 4 (optionnel) — Nom de domaine personnalisé
Si vous achetez un domaine (ex: `akilitech.org`), dans **Settings > Pages > Custom domain**,
entrez votre domaine puis configurez chez votre registrar un enregistrement CNAME pointant vers
`VOTRE-NOM-UTILISATEUR.github.io`.

---

## 4. Mettre à jour le site après modifications

Chaque fois que vous modifiez le site dans VS Code :

```bash
git add .
git commit -m "Mise à jour du site"
git push
```

GitHub Pages republie automatiquement le site en 1 à 2 minutes.

---

## 5. Autres options d'hébergement gratuit

Si vous préférez ne pas utiliser GitHub Pages :
- **Netlify** (https://app.netlify.com) : glissez-déposez simplement le dossier `akilitech-website`
- **Vercel** (https://vercel.com) : connectez votre dépôt GitHub, déploiement automatique
- **Cloudflare Pages** (https://pages.cloudflare.com)

Toutes ces options fonctionnent avec le même code sans aucune modification.

---

## 6. Bon à savoir

- Le site utilise les polices Google Fonts (Poppins & Manrope) et les icônes Font Awesome via
  des liens CDN — une **connexion internet est nécessaire** pour que ces éléments s'affichent
  correctement (le reste du site fonctionne hors-ligne).
- Le contenu (services, équipe, partenaires, coordonnées) provient des documents que vous avez
  fournis (présentation Akilitech, TDR Bootcamp, flyer de présentation). Vérifiez et ajustez les
  informations avant la mise en ligne définitive (numéros, adresse email, etc.).
- N'oubliez pas de remplacer `og-cover.jpg` par un vrai visuel pour un bel aperçu quand le lien
  du site est partagé sur WhatsApp, Facebook ou LinkedIn.

Bonne mise en ligne ! 🚀
