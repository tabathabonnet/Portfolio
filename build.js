#!/usr/bin/env node
/* ============================================================
   build.js — génère le site à partir des fiches de contenu.

   Entrée  : content/site.json
             content/projets/*.json   (une fiche = un projet)
             pages/*.html             (accueil + à propos, avec jetons {{…}})
             style.css, script.js, _img/
   Sortie  : dist/                    (le site prêt à publier)

   Aucune dépendance : seul Node.js (>= 18) est nécessaire.
   Commande : node build.js
   ============================================================ */

'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'dist');
const warnings = [];
const warn = (m) => warnings.push(m);

/* ---------- utilitaires ---------- */

const esc = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Retire l'éventuel "/" initial et encode les caractères spéciaux (espaces, accents…)
const normPath = (p) => encodeURI(String(p || '').trim().replace(/^\.?\/+/, ''));
const diskPath = (p) => path.join(ROOT, decodeURI(normPath(p)));

const slugify = (s) =>
  String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Texte multi-lignes -> paragraphes (une ligne vide = nouveau paragraphe)
const paragraphs = (text, indent = '') =>
  String(text || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `${indent}<p>${esc(p).replace(/\n/g, ' ')}</p>`)
    .join('\n');

const readJSON = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    throw new Error(`Fichier illisible : ${path.relative(ROOT, file)} (${e.message})`);
  }
};

/* ---------- dimensions des images (détection portrait/paysage) ---------- */

const sizeCache = new Map();

function readSize(file) {
  if (sizeCache.has(file)) return sizeCache.get(file);
  let size = null;
  try {
    const b = fs.readFileSync(file);
    if (b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP') {
      const kind = b.slice(12, 16).toString();
      if (kind === 'VP8 ') {
        size = { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
      } else if (kind === 'VP8L') {
        size = {
          w: 1 + (b[21] | ((b[22] & 0x3f) << 8)),
          h: 1 + ((b[22] >> 6) | (b[23] << 2) | ((b[24] & 0x0f) << 10)),
        };
      } else if (kind === 'VP8X') {
        size = { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
      }
    } else if (b[0] === 0x89 && b.slice(1, 4).toString() === 'PNG') {
      size = { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
    } else if (b[0] === 0xff && b[1] === 0xd8) {
      let i = 2;
      while (i < b.length - 9) {
        if (b[i] !== 0xff) { i++; continue; }
        const m = b[i + 1];
        if (m === 0xff) { i++; continue; }
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
          size = { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
          break;
        }
        if (m === 0x01 || (m >= 0xd0 && m <= 0xd9)) { i += 2; continue; }
        i += 2 + b.readUInt16BE(i + 2);
      }
    }
  } catch (_) { /* fichier absent : signalé ailleurs */ }
  sizeCache.set(file, size);
  return size;
}

const isPortrait = (src) => {
  const s = readSize(diskPath(src));
  return !!(s && s.h > s.w);
};

/* ---------- morceaux de page communs ---------- */

const head = (title, description) => `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
</head>
<body>
`;

const header = (active) => {
  const cur = (k) => (active === k ? ' aria-current="page"' : '');
  return `<header class="site-header">
  <div class="wrap grid-12">
    <a class="logo" href="index.html">Tabatha <span>— Portfolio</span></a>
    <nav class="main-nav" id="main-nav">
      <a href="index.html"${cur('home')}>Accueil</a>
      <a href="projets.html"${cur('projects')}>Projets</a>
      <a href="apropos.html"${cur('about')}>À propos</a>
      <a href="apropos.html#contact">Contact</a>
    </nav>
    <button class="nav-toggle" aria-expanded="false" aria-controls="main-nav">Menu</button>
  </div>
</header>
`;
};

const footer = (site) => `<footer class="site-footer wrap">
  <div class="grid-12">
    <div class="footer-col">
      <h3>Contact</h3>
      <a href="mailto:${esc(site.email)}">${esc(site.email)}</a>
      <a href="apropos.html#contact">Formulaire de contact</a>
    </div>
    <div class="footer-col">
      <h3>Réseaux</h3>
      <a href="${esc(site.instagram)}">Instagram</a>
      <a href="${esc(site.linkedin)}">LinkedIn</a>
      <a href="${esc(site.behance)}">Behance</a>
    </div>
    <div class="footer-col">
      <h3>Site</h3>
      <a href="index.html">Accueil</a>
      <a href="projets.html">Projets</a>
      <a href="apropos.html">À propos</a>
    </div>
  </div>
</footer>

<script src="script.js"></script>
</body>
</html>
`;

/* ---------- données ---------- */

function loadSite() {
  const s = readJSON(path.join(ROOT, 'content', 'site.json'));
  const link = (v) => (v && String(v).trim()) || '#';
  return {
    email: (s.email || 'hello@tabatha.ch').trim(),
    instagram: link(s.instagram),
    linkedin: link(s.linkedin),
    behance: link(s.behance),
  };
}

function loadProjects() {
  const dir = path.join(ROOT, 'content', 'projets');
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')) : [];
  const list = [];
  for (const f of files) {
    const d = readJSON(path.join(dir, f));
    if (d.published === false) continue; // brouillon : non publié
    const slug = slugify(path.basename(f, '.json'));
    if (!d.title) { warn(`${f} : pas de titre, projet ignoré.`); continue; }
    list.push({
      ...d,
      slug,
      file: `projet-${slug}.html`,
      layout: d.layout || 'photo',
      categories: Array.isArray(d.categories) ? d.categories : [],
      order: Number.isFinite(Number(d.order)) && d.order !== '' && d.order != null ? Number(d.order) : 999,
    });
  }
  list.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, 'fr'));
  return list;
}

const checkImage = (src, where) => {
  if (!src) return;
  if (!fs.existsSync(diskPath(src))) warn(`${where} : image introuvable → ${src}`);
};

const eyebrowOf = (p) => [p.discipline, p.year].filter(Boolean).join(' — ');
const imgAlt = (p, n) => `${p.title} — image ${n}`;

/* ---------- vidéo (Vimeo / YouTube) ---------- */

function videoSrc(v) {
  const s = String(v || '').trim();
  if (!s) return null;
  let m;
  if ((m = s.match(/vimeo\.com\/(?:video\/)?(\d+)/)) || /^\d+$/.test(s)) {
    const id = m ? m[1] : s;
    return `https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0`;
  }
  if ((m = s.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/))) {
    return `https://www.youtube.com/embed/${m[1]}`;
  }
  if (/^[\w-]{11}$/.test(s)) return `https://www.youtube.com/embed/${s}`;
  return null;
}

/* ---------- éléments d'en-tête de projet ---------- */

function metaRow(p) {
  const items = [
    ['Rôle', p.role],
    ['Client', p.client],
    ['Outils', p.tools],
    ['Année', p.year],
  ].filter(([, v]) => v && String(v).trim());
  return items
    .map(
      ([k, v]) => `        <div>
          <span class="eyebrow">${k}</span><br>
          ${esc(v)}
        </div>`
    )
    .join('\n');
}

function projectHead(p) {
  return `  <section class="project-head wrap">
    <div class="grid-12">
      <span class="eyebrow project-eyebrow">${esc(eyebrowOf(p))}</span>
      <h1 class="project-title">${esc(p.title)}</h1>
      <div class="project-meta-row">
${metaRow(p)}
      </div>
    </div>
  </section>
`;
}

function projectNav(p, all) {
  const i = all.findIndex((x) => x.slug === p.slug);
  const next = all.length > 1 ? all[(i + 1) % all.length] : null;
  return `  <div class="wrap">
    <nav class="project-nav">
      <a href="projets.html">← Retour aux projets</a>${next ? `\n      <a href="${esc(next.file)}">Projet suivant →</a>` : ''}
    </nav>
  </div>
`;
}

/* ---------- mise en page 1 : PHOTO (hero + texte + galerie) ---------- */

function renderPhoto(p, all) {
  checkImage(p.cover, p.title + ' (couverture)');
  const gallery = (p.gallery || []).filter(Boolean);
  const imgs = gallery
    .map((src, i) => {
      checkImage(src, p.title + ' (galerie)');
      return `        <img src="${esc(normPath(src))}" alt="${esc(imgAlt(p, i + 1))}" loading="lazy"${isPortrait(src) ? ' class="portrait"' : ''}>`;
    })
    .join('\n');
  const intro = paragraphs(p.intro, '        ');
  return `<main>

${projectHead(p)}
  <div class="wrap">
    <div class="project-hero-img${p.cover_vertical ? ' portrait' : ''}"><img src="${esc(normPath(p.cover))}" alt="${esc(p.title)} — image principale" style="width:100%;height:100%;object-fit:cover;"></div>
  </div>

  <section class="project-body wrap">
    <div class="grid-12">${intro ? `
      <div class="project-text">
${intro}
      </div>
` : ''}
      <div class="project-gallery">
${imgs}
      </div>
    </div>
  </section>

${projectNav(p, all)}
</main>
`;
}

/* ---------- mise en page 2 : BLOCS (étude de cas) ---------- */

const RATIOS = ['16-9', '3-2', '4-3', '4-5', '3-4', '1-1', '9-16'];
const ratioOf = (r, fallback) => (RATIOS.includes(String(r)) ? String(r) : fallback);

const section = (inner) => `  <section class="block wrap">
    <div class="grid-12">
${inner}
    </div>
  </section>
`;

const figure = (src, alt, ratio, spanClass, caption, lazy = true) => `      <figure class="media-fig ${spanClass}">
        <div class="media ratio-${ratio}">
          <img src="${esc(normPath(src))}" alt="${esc(alt)}"${lazy ? ' loading="lazy"' : ''}>
        </div>${caption ? `
        <figcaption class="caption">${esc(caption)}</figcaption>` : ''}
      </figure>`;

const swatches = (colors) => {
  const ok = (colors || []).map((c) => String(c).trim()).filter((c) => /^#[0-9a-fA-F]{3,8}$/.test(c));
  if (!ok.length) return '';
  return `      <div class="swatches">
${ok
  .map(
    (c) => `        <div class="swatch"><div class="chip-color" style="background:${c};"></div><span>${c.toUpperCase()}</span></div>`
  )
  .join('\n')}
      </div>`;
};

// Un bloc peut arriver à plat ({type, label, body…}) ou rangé sous son nom ({type, text:{…}})
const flat = (b) => {
  const inner = b && b[b.type];
  return inner && typeof inner === 'object' && !Array.isArray(inner) ? { ...b, ...inner } : b;
};

function renderBlock(raw, p, n) {
  const b = flat(raw);
  const t = b.type;
  const w = `${p.title} (bloc ${n})`;

  if (t === 'text') {
    if (!String(b.body || '').trim()) return '';
    return section(`      <span class="eyebrow block-label">${esc(b.label || '')}</span>
      <div class="block-copy">
${paragraphs(b.body, '        ')}
      </div>`);
  }
  if (t === 'image') {
    checkImage(b.image, w);
    if (!b.image) return '';
    return section(figure(b.image, b.alt || `${p.title} — visuel`, ratioOf(b.ratio, '16-9'), 'span-12', b.caption));
  }
  if (t === 'logo') {
    checkImage(b.image, w);
    if (!b.image) return '';
    const variant = ['tinted', 'dark', 'ruled'].includes(b.style) ? ` ${b.style}` : '';
    return section(`      <figure class="media-fig span-12">
        <div class="block-logo${variant}">
          <img src="${esc(normPath(b.image))}" alt="${esc(b.alt || `Logo ${p.title}`)}">
        </div>
      </figure>`);
  }
  if (t === 'duo' || t === 'trio') {
    const n_ = t === 'duo' ? 2 : 3;
    const span = t === 'duo' ? 'span-6' : 'span-4';
    const ratio = ratioOf(b.ratio, t === 'duo' ? '4-5' : '3-4');
    const figs = [];
    for (let i = 1; i <= n_; i++) {
      const src = b[`image${i}`];
      if (!src) continue;
      checkImage(src, w);
      figs.push(figure(src, b[`alt${i}`] || `${p.title} — visuel ${i}`, ratio, span, b[`caption${i}`]));
    }
    return figs.length ? section(figs.join('\n')) : '';
  }
  if (t === 'offset') {
    checkImage(b.image, w);
    if (!b.image) return '';
    return section(figure(b.image, b.alt || `${p.title} — visuel`, ratioOf(b.ratio, '3-2'), 'span-8 start-5', b.caption));
  }
  if (t === 'gallery') {
    const list = (b.images || []).filter(Boolean);
    if (!list.length) return '';
    const imgs = list
      .map((src, i) => {
        checkImage(src, w);
        return `      <img src="${esc(normPath(src))}" alt="${esc(imgAlt(p, i + 1))}" loading="lazy"${isPortrait(src) ? ' class="portrait"' : ''}>`;
      })
      .join('\n');
    return `  <section class="block wrap">
    <div class="project-gallery">
${imgs}
    </div>
  </section>
`;
  }
  if (t === 'video') {
    const src = videoSrc(b.url);
    if (!src) { if (b.url) warn(`${w} : lien vidéo non reconnu → ${b.url}`); return ''; }
    return section(`      <figure class="media-fig span-12">
        <div class="video-frame${b.vertical ? ' vertical' : ''}">
          <iframe src="${esc(src)}" title="${esc(`Vidéo — ${p.title}`)}" loading="lazy" allow="fullscreen; picture-in-picture" allowfullscreen></iframe>
        </div>${b.caption ? `
        <figcaption class="caption">${esc(b.caption)}</figcaption>` : ''}
      </figure>`);
  }
  if (t === 'palette') {
    const s = swatches(b.colors);
    return s ? section(s) : '';
  }
  warn(`${w} : type de bloc inconnu « ${t} »`);
  return '';
}

function renderBlocks(p, all) {
  checkImage(p.cover, p.title + ' (couverture)');
  const lead = p.lead && String(p.lead).trim()
    ? section(`      <p class="block-lead">${esc(p.lead)}</p>`)
    : '';
  const cover = p.cover
    ? section(figure(p.cover, `${p.title} — visuel principal`, '16-9', 'span-12', '', false))
    : '';
  const blocks = (p.blocks || []).map((b, i) => renderBlock(b, p, i + 1)).join('\n');
  return `<main>

${projectHead(p)}
${lead}${cover}
${blocks}
${projectNav(p, all)}
</main>
`;
}

/* ---------- mise en page 3 : COLONNE FIXE (infos à gauche, visuels à droite) ---------- */

function renderSplit(p, all) {
  checkImage(p.cover, p.title + ' (couverture)');
  const figs = [];
  const sideTexts = [];
  const half = (src, alt, ratio, caption) => {
    checkImage(src, p.title);
    return `        <figure>
          <div class="media ratio-${ratio}">
            <img src="${esc(normPath(src))}" alt="${esc(alt)}" loading="lazy">
          </div>${caption ? `
          <figcaption class="caption">${esc(caption)}</figcaption>` : ''}
        </figure>`;
  };
  const full = (src, alt, ratio, caption, lazy = true) => {
    checkImage(src, p.title);
    return `        <figure class="full">
          <div class="media ratio-${ratio}">
            <img src="${esc(normPath(src))}" alt="${esc(alt)}"${lazy ? ' loading="lazy"' : ''}>
          </div>${caption ? `
          <figcaption class="caption">${esc(caption)}</figcaption>` : ''}
        </figure>`;
  };

  if (p.cover) figs.push(full(p.cover, `${p.title} — visuel principal`, '16-9', '', false));

  (p.blocks || []).forEach((raw, i) => {
    const b = flat(raw);
    switch (b.type) {
      case 'text': {
        const paras = String(b.body || '').split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
        paras.forEach((para, k) =>
          sideTexts.push(`          <p>${esc(k === 0 && b.label ? `${b.label} : ${para}` : para)}</p>`)
        );
        break;
      }
      case 'image':
      case 'offset':
        if (b.image) figs.push(full(b.image, b.alt || `${p.title} — visuel`, ratioOf(b.ratio, b.type === 'offset' ? '3-2' : '16-9'), b.caption));
        break;
      case 'duo':
      case 'trio':
        for (let k = 1; k <= (b.type === 'duo' ? 2 : 3); k++) {
          if (b[`image${k}`])
            figs.push(half(b[`image${k}`], b[`alt${k}`] || `${p.title} — visuel ${k}`, ratioOf(b.ratio, b.type === 'duo' ? '4-5' : '3-4'), b[`caption${k}`]));
        }
        break;
      case 'gallery':
        (b.images || []).filter(Boolean).forEach((src, k) =>
          figs.push(half(src, imgAlt(p, k + 1), isPortrait(src) ? '3-4' : '3-2', ''))
        );
        break;
      case 'logo':
        if (b.image) {
          checkImage(b.image, p.title);
          const variant = ['tinted', 'dark', 'ruled'].includes(b.style) ? ` ${b.style}` : '';
          figs.push(`        <figure class="full">
          <div class="block-logo${variant}">
            <img src="${esc(normPath(b.image))}" alt="${esc(b.alt || `Logo ${p.title}`)}">
          </div>
        </figure>`);
        }
        break;
      case 'video': {
        const src = videoSrc(b.url);
        if (src)
          figs.push(`        <figure class="full">
          <div class="video-frame${b.vertical ? ' vertical' : ''}">
            <iframe src="${esc(src)}" title="${esc(`Vidéo — ${p.title}`)}" loading="lazy" allow="fullscreen; picture-in-picture" allowfullscreen></iframe>
          </div>${b.caption ? `
          <figcaption class="caption">${esc(b.caption)}</figcaption>` : ''}
        </figure>`);
        else if (b.url) warn(`${p.title} : lien vidéo non reconnu → ${b.url}`);
        break;
      }
      case 'palette': {
        const s = swatches(b.colors);
        if (s) figs.push(s.replace(/^ {6}/gm, '        '));
        break;
      }
      default:
        warn(`${p.title} (bloc ${i + 1}) : type « ${b.type} » ignoré dans cette mise en page.`);
    }
  });

  const metaItems = [['Rôle', p.role], ['Client', p.client], ['Outils', p.tools], ['Année', p.year]].filter(
    ([, v]) => v && String(v).trim()
  );
  return `<main>

  <section class="split wrap">
    <div class="grid-12">

      <aside class="split-side">
        <span class="eyebrow">${esc(eyebrowOf(p))}</span>
        <h1 class="side-title">${esc(p.title)}</h1>${p.lead && String(p.lead).trim() ? `
        <p class="side-lead">${esc(p.lead)}</p>` : ''}

        <dl class="side-meta">
${metaItems.map(([k, v]) => `          <div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('\n')}
        </dl>
${sideTexts.length ? `
        <div class="side-text">
${sideTexts.join('\n')}
        </div>
` : ''}
        <a class="side-back" href="projets.html">← Retour aux projets</a>
      </aside>

      <div class="split-media">

${figs.join('\n\n')}

      </div>
    </div>
  </section>

${projectNav(p, all)}
</main>
`;
}

/* ---------- pages ---------- */

function buildProjectPage(p, all, site) {
  const body =
    p.layout === 'blocks' ? renderBlocks(p, all) : p.layout === 'split' ? renderSplit(p, all) : renderPhoto(p, all);
  const desc =
    (p.description && p.description.trim()) ||
    `${p.title} — ${[p.discipline, p.year].filter(Boolean).join(', ')}. Portfolio de Tabatha, interactive media designer.`;
  return head(`${p.title} — Tabatha`, desc) + '\n' + header('') + '\n' + body + '\n' + footer(site);
}

function buildProjectsIndex(all, site) {
  const cards = all
    .map(
      (p) => `      <a class="work-card" href="${esc(p.file)}" data-category="${esc(p.categories.join(' '))}">
        <div class="thumb"><img src="${esc(normPath(p.cover))}" alt="${esc(p.title)}"></div>
        <h3>${esc(p.title)}</h3>
        <span class="meta">${esc(eyebrowOf(p))}</span>
      </a>`
    )
    .join('\n\n');
  return (
    head('Projets — Tabatha', 'Index des projets de Tabatha — photo, illustration, vidéo, graphisme et QoQa.') +
    '\n' +
    header('projects') +
    `
<main>

  <section class="page-head wrap">
    <div class="grid-12">
      <h1 class="page-title">Projets</h1>
      <div class="filters" role="group" aria-label="Filtrer par catégorie">
        <button class="filter-btn active" data-filter="all">Tout</button>
        <button class="filter-btn" data-filter="photo">Photographie</button>
        <button class="filter-btn" data-filter="illustration">Illustration</button>
        <button class="filter-btn" data-filter="video">Vidéo</button>
        <button class="filter-btn" data-filter="graphisme">Graphisme</button>
        <button class="filter-btn" data-filter="qoqa">QoQa</button>
      </div>
    </div>
  </section>

  <section class="work-grid wrap">
    <div class="grid-12">

${cards}

    </div>
  </section>

</main>

` +
    footer(site)
  );
}

function workIndexRows(all) {
  return all
    .filter((p) => p.featured !== false && p.featured !== 'false' && p.featured)
    .map((p, i) => {
      const thumb = p.home_thumb || p.cover;
      checkImage(thumb, p.title + ' (aperçu accueil)');
      return `    <a class="index-row" href="${esc(p.file)}" data-thumb="${esc(normPath(thumb))}">
      <span class="index-num">${String(i + 1).padStart(2, '0')}</span>
      <span class="index-name">${esc(p.title)}</span>
      <span class="index-cat">${esc(p.discipline || '')}</span>
      <span class="index-year">${esc(p.year || '')}</span>
    </a>`;
    })
    .join('\n');
}

function buildStaticPage(file, all, site) {
  let html = fs.readFileSync(file, 'utf8');
  const tokens = {
    '{{header:home}}': header('home'),
    '{{header:about}}': header('about'),
    '{{footer}}': footer(site),
    '{{email}}': esc(site.email),
    '{{instagram}}': esc(site.instagram),
    '{{linkedin}}': esc(site.linkedin),
    '{{behance}}': esc(site.behance),
    '{{work_index}}': workIndexRows(all),
  };
  for (const [k, v] of Object.entries(tokens)) html = html.split(k).join(v);
  const left = html.match(/\{\{[^}]+\}\}/g);
  if (left) warn(`${path.basename(file)} : jetons non remplacés ${[...new Set(left)].join(', ')}`);
  return html;
}

/* ---------- copie des fichiers statiques ---------- */

function copyStatic(src, dst) {
  const skip = (name) => name.startsWith('.') || name.startsWith('._') || name.endsWith('.af~lock~') || name === 'Thumbs.db';
  const st = fs.statSync(src);
  if (st.isDirectory()) {
    fs.mkdirSync(dst, { recursive: true });
    for (const name of fs.readdirSync(src)) if (!skip(name)) copyStatic(path.join(src, name), path.join(dst, name));
  } else {
    fs.copyFileSync(src, dst);
  }
}

/* ---------- main ---------- */

function main() {
  const t0 = Date.now();
  const site = loadSite();
  const projects = loadProjects();

  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  for (const p of projects) fs.writeFileSync(path.join(OUT, p.file), buildProjectPage(p, projects, site));
  fs.writeFileSync(path.join(OUT, 'projets.html'), buildProjectsIndex(projects, site));

  const pagesDir = path.join(ROOT, 'pages');
  for (const f of fs.readdirSync(pagesDir).filter((x) => x.endsWith('.html'))) {
    fs.writeFileSync(path.join(OUT, f), buildStaticPage(path.join(pagesDir, f), projects, site));
  }

  for (const f of ['style.css', 'script.js']) fs.copyFileSync(path.join(ROOT, f), path.join(OUT, f));
  if (fs.existsSync(path.join(ROOT, '_img'))) copyStatic(path.join(ROOT, '_img'), path.join(OUT, '_img'));

  console.log(`✔ ${projects.length} projet(s) généré(s) en ${Date.now() - t0} ms → dist/`);
  projects.forEach((p) => console.log(`   · ${p.file}  [${p.layout}]  ${p.title}`));
  if (warnings.length) {
    console.log(`\n⚠ ${warnings.length} avertissement(s) :`);
    warnings.forEach((w) => console.log('   - ' + w));
  }
}

main();
