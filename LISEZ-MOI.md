# Ton portfolio — mode d'emploi

Le design n'a pas changé : `style.css` et `script.js` sont exactement ceux de ta version actuelle.
Ce qui change, c'est la façon d'ajouter du contenu : **plus besoin d'ouvrir le code**.

## Comment ça marche

```
Tu remplis un formulaire (Pages CMS)
        ↓
la fiche du projet et tes images sont enregistrées dans ton dépôt GitHub
        ↓
l'hébergeur lance build.js, qui fabrique les pages (même HTML qu'avant)
        ↓
le site est à jour, environ 1 minute plus tard
```

Chaque projet = une petite fiche dans `content/projets/`. Les pages `projet-….html`, la grille de la page Projets, l'index de l'accueil et les liens « Projet suivant » sont générés automatiquement à partir de ces fiches.

---

## Mise en place (une seule fois, environ 30 minutes)

### 1. Mettre le site sur GitHub
1. Crée un compte gratuit sur github.com.
2. Installe **GitHub Desktop** (desktop.github.com), puis : *File → Add local repository* → choisis ce dossier → *Publish repository* → coche **Keep this code private**.
   (L'envoi par le site web de GitHub est limité à 100 fichiers à la fois : GitHub Desktop évite ce souci.)

### 2. Brancher l'hébergeur
Le fichier `netlify.toml` contient déjà tous les réglages.
- **Netlify** : *Add new site → Import an existing project → GitHub* → choisis le dépôt → *Deploy*.
- Ton nom de domaine : *Site configuration → Domain management → Add a domain*, puis suis les instructions DNS chez ton registrar.
- Le formulaire de contact de la page À propos fonctionne tel quel sur Netlify.
- Sur Cloudflare Pages ou autre, les réglages sont : commande de build `node build.js`, dossier de sortie `dist`. Le formulaire de contact devra alors passer par un autre service (Formspree par exemple).

### 3. Ouvrir l'interface d'édition
1. Va sur **app.pagescms.org** et connecte-toi avec GitHub.
2. Autorise l'application sur ton dépôt, puis ouvre-le.
3. Tu vois quatre rubriques : **Projets**, **Page d'accueil**, **Page À propos** et **Coordonnées et réseaux**.

---

## Ajouter un projet (au quotidien, environ 3 minutes)

1. **Prépare tes images** comme d'habitude depuis Affinity : WebP, qualité 80, environ 1800 px (galerie), 2400 px (couverture). Les originaux lourds restent sur ton ordinateur.
2. Dans Pages CMS : **Projets → Ajouter**.
3. Remplis le formulaire :
   - **Titre**, **Discipline**, **Année**, **Rôle**, **Client**
   - **Catégories** (les filtres de la page Projets) : tu peux en cocher plusieurs
   - **Image de couverture**
   - **Mise en page** (voir ci-dessous)
   - **Ordre d'affichage** (1 = en premier) et **Afficher sur l'accueil**
4. **Enregistre**. Attends environ une minute, puis vérifie sur le site.

Pour travailler sans publier : décoche **Publié**. Le projet reste en brouillon.

### Les trois mises en page

| Mise en page | Pour quoi | Ce que tu remplis |
|---|---|---|
| **Photo** | Séries photo | Texte de présentation + **Galerie** (tu sélectionnes toutes les images d'un coup, l'ordre de la liste = l'ordre du site) |
| **Étude de cas — blocs empilés** | Graphisme, branding, motion (comme Qasual) | Accroche + **Blocs** : texte avec étiquette, image pleine largeur, logo, duo, trio, image décalée, galerie, vidéo, palette de couleurs |
| **Étude de cas — colonne fixe** | Projets très visuels | Les mêmes blocs ; les textes vont dans la colonne de gauche, les visuels défilent à droite |

Dans les mises en page « étude de cas », **la couverture s'affiche automatiquement en premier**. Ensuite tu ajoutes, supprimes et réordonnes les blocs comme tu veux.

### Ce qui est automatique
- **Portrait ou paysage** : détecté image par image dans les galeries, plus besoin de `class="portrait"`.
- **Projet suivant** : suit l'ordre que tu as défini.
- **Numéros de l'accueil** (01, 02, 03…) : recalculés.
- **Vidéo** : colle simplement le lien Vimeo ou YouTube.
- **Palette** : saisis des codes comme `#8FD6BD`.

### Rangement des images
Garde un dossier par projet (`_img/2026-NomDuProjet/`). Les noms de fichiers n'ont plus besoin d'être `img-1.webp`, `img-2.webp`… Les espaces et accents sont nettoyés automatiquement.

---

## Si quelque chose ne va pas
- **Une image n'apparaît pas** : dans Netlify, ouvre *Deploys → dernier déploiement → Deploy log*. Le générateur y liste les « avertissements » (image introuvable, lien vidéo non reconnu…).
- **Le site ne se met pas à jour** : vérifie dans Netlify que le dernier déploiement est en vert.
- **Un changement de design** (couleurs, espacements) : `style.css` s'édite comme avant. Tu peux aussi le modifier directement sur GitHub.

## Dans ce dossier
| Élément | Rôle |
|---|---|
| `content/projets/*.json` | Une fiche par projet (écrites par l'interface) |
| `content/accueil.json` | Titre, phrase et pastilles de l'accueil |
| `content/apropos.json` | Photo, textes et colonnes de la page À propos |
| `content/site.json` | Email et liens réseaux (pied de page + À propos) |
| `pages/` | Accueil et À propos (modèles) |
| `build.js` | Le générateur (aucune dépendance) |
| `.pages.yml` | Les formulaires de l'interface d'édition |
| `gabarits/` | Anciens gabarits HTML, gardés pour mémoire (plus utilisés) |

## À savoir
- **Chaque enregistrement dans l'interface = une mise en ligne.** Sur le plan gratuit actuel de Netlify, une mise en ligne coûte 15 crédits sur 300 par mois (la bande passante en consomme aussi : 20 crédits par Go). Regroupe tes modifications et n'enregistre pas à chaque petite correction. Vérifie ton plan dans *Netlify → Billing*.
- Les textes d'exemple restent à remplacer dans les fiches des 3 projets photo (« Décris ici le contexte du projet… ») et sur la page À propos.
