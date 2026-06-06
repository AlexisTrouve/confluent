'use strict';
/**
 * Mise en page « livre » des Glyphes du Gouffre — pages réglées, THÈME MODULABLE.
 *
 * QUOI : mots résolus → pages A4 prêtes à imprimer (→ PDF), en LIGNES réglées (écriture serrée).
 * POURQUOI : un gros texte se lit comme un manuscrit — lignes régulières + éléments « meta »
 *   (règles tracées à la main, marge) — pas un collier qui déborde ni des glyphes éclatés.
 * COMMENT : renderGlyph() = la « police » argile ; THEMES = registre de skins de PAGE (modulable) ;
 *   on découpe en LIGNES (perLine glyphes) puis PAGES (linesPerPage) ; chaque ligne a une RÉGLURE
 *   ondulée (tracée « à la main », re-seedée à chaque requête) ; marge gauche tracée pareil.
 */
const { GLYPHS, resolveEdges, renderGlyph } = require('./glyphRenderer');

// Registre de THÈMES de page (skin), découplé de la police. `rule` = couleur des réglures/marge.
// `page` = couleur de fond ; `grain` = intensité de la texture (0 = lisse). Défaut = clay cendré texturé.
const THEMES = {
  tablette: { nom: 'Clay cendré', page: '#3a352d', frame: '14px solid #645a4a', rule: '#564e40', label: '#cdbf9a', grain: 0.55 },
  parchemin: { nom: 'Parchemin sombre', page: '#15110c', frame: '1px solid #3a2c1c', rule: '#4a3a22', label: '#c9a86a', grain: 0.4 },
  clair: { nom: 'Manuscrit clair', page: '#e8dcc0', frame: '1px solid #b8a070', rule: '#b39b6a', label: '#5a4226', grain: 0.35 },
};

const W_TEXT = 640; // largeur (px) de la zone de texte → longueur des réglures.

// Réglure tracée « à la main » : ligne horizontale légèrement ondulée (jitter re-seedé chaque requête).
function ruledLine(width, color, thick) {
  const n = Math.max(8, Math.floor(width / 38));
  let d = `M2,6`;
  for (let i = 1; i <= n; i++) {
    const x = 2 + (width - 4) * i / n, y = 6 + (Math.random() - 0.5) * 2.6;
    d += ` L${x.toFixed(1)},${y.toFixed(1)}`;
  }
  return `<svg width="${width}" height="12" viewBox="0 0 ${width} 12" style="display:block">`
    + `<path d="${d}" fill="none" stroke="${color}" stroke-width="${thick || 1.3}" stroke-linecap="round" opacity="0.75"/></svg>`;
}

// Marge verticale tracée à la main (filet gauche du manuscrit).
function ruledMargin(height, color) {
  const n = Math.max(8, Math.floor(height / 38));
  let d = `M6,2`;
  for (let i = 1; i <= n; i++) {
    const y = 2 + (height - 4) * i / n, x = 6 + (Math.random() - 0.5) * 2.6;
    d += ` L${x.toFixed(1)},${y.toFixed(1)}`;
  }
  return `<svg width="12" height="${height}" viewBox="0 0 12 ${height}" style="display:block">`
    + `<path d="${d}" fill="none" stroke="${color}" stroke-width="1.3" stroke-linecap="round" opacity="0.6"/></svg>`;
}

// Grain de texture (argile/papier) : turbulence sombre semi-transparente, re-seedée par page (organique).
function grain() {
  const s = Math.floor(Math.random() * 9999);
  return `<svg class="grain" preserveAspectRatio="none"><filter id="gr${s}">`
    + `<feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="3" seed="${s}" stitchTiles="stitch"/>`
    + `<feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 -0.22"/></filter>`
    + `<rect width="100%" height="100%" filter="url(#gr${s})"/></svg>`;
}

// Aplatit les mots en perles, en marquant le début de chaque mot (espace de séparation).
function toBeads(words) {
  const beads = [];
  for (const w of words) (w.glyphes || []).forEach((k, i) => beads.push({ key: k, wordStart: i === 0 }));
  return beads;
}

// Une perle (glyphe redessiné à neuf). Marge gauche élargie en début de mot = séparation des mots.
function bead(b, uid, h) {
  const g = GLYPHS[b.key];
  const inner = g ? renderGlyph(resolveEdges(g), uid, h)
    : `<div style="width:${Math.round(h * .62)}px;height:${h}px;border:1px dashed #5a4226;color:#5a4226;display:flex;align-items:center;justify-content:center;font-size:9px">?${b.key}</div>`;
  return `<div style="margin-left:${b.wordStart ? 2 : -12}px;line-height:0">${inner}</div>`;
}

/**
 * renderBook(words, opts) → document HTML complet, réglé, paginé, prêt à imprimer (PDF).
 * @param {Array} words - [{ word, glyphes:[clé...] }]
 * @param {Object} opts - { theme='tablette', perLine=12, linesPerPage=13, glyphH=58, title='' }
 */
function renderBook(words, opts = {}) {
  const th = THEMES[opts.theme] || THEMES.tablette;
  const perLine = opts.perLine || 18, linesPerPage = opts.linesPerPage || 13, glyphH = opts.glyphH || 58, title = opts.title || '';
  const beads = toBeads(words);

  // Découpe en LIGNES (serrées) puis en PAGES.
  const lines = [];
  for (let i = 0; i < beads.length; i += perLine) lines.push(beads.slice(i, i + perLine));
  const pages = [];
  for (let i = 0; i < lines.length; i += linesPerPage) pages.push(lines.slice(i, i + linesPerPage));
  if (!pages.length) pages.push([]);

  const lineHtml = (ln, li) => `<div class="line">`
    + `<div class="grow">${ln.map((b, i) => bead(b, `l${li}_${i}`, glyphH)).join('')}</div>`
    + `<div class="rule">${ruledLine(W_TEXT, th.rule)}</div></div>`;

  const pageHtml = (pg, n) => `<section class="page" style="--grain:${th.grain != null ? th.grain : 0.5}">${grain()}<div class="margin">${ruledMargin(900, th.rule)}</div>`
    + (n === 0 && title ? `<div class="title">${title}</div><div class="rule">${ruledLine(W_TEXT, th.rule, 1.8)}</div>` : '')
    + `<div class="col">${pg.map((ln, li) => lineHtml(ln, n * linesPerPage + li)).join('')}</div>`
    + `<div class="folio">${n + 1} / ${pages.length}</div></section>`;

  // CSS : @page A4 ; chaque .page = une feuille (break-after) ; réglures + marge gauche.
  const css = `
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #0c0a07; font-family: system-ui, sans-serif; }
    .page { width: 210mm; height: 297mm; background: ${th.page}; border: ${th.frame};
            margin: 8mm auto; padding: 20mm 18mm 16mm 26mm; position: relative; overflow: hidden; break-after: page; }
    .margin { position: absolute; left: 16mm; top: 18mm; bottom: 14mm; }
    .grain { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 0; opacity: var(--grain,.5); mix-blend-mode: overlay; pointer-events: none; }
    .col { position: relative; z-index: 1; }
    .line { margin-bottom: 3px; }
    .grow { display: flex; align-items: flex-end; min-height: ${glyphH}px; }
    .rule { line-height: 0; margin-top: -11px; }
    .title { color: ${th.label}; text-align: center; font-size: 21px; letter-spacing: 1px; margin: 2mm 0 3mm; }
    .folio { position: absolute; bottom: 7mm; right: 18mm; color: ${th.label}; font-size: 12px; opacity: .75; }
    @media print { body { background: #fff; } .page { margin: 0; } }`;

  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${title || 'Livre'} — Glyphes du Gouffre</title>`
    + `<style>${css}</style></head><body>${pages.map(pageHtml).join('')}</body></html>`;
}

module.exports = { renderBook, THEMES };
