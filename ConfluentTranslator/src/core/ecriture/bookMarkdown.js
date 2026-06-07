'use strict';
/**
 * Moteur de mise en page « livre » à partir de MARKDOWN — Glyphes du Gouffre.
 *
 * QUOI : texte markdown → document HTML paginé (titres gros/centrés/filet, paragraphes, listes,
 *   citations, filets, emphase) prêt à imprimer (PDF). Échec FRANC si une pièce n'a pas de glyphe.
 * POURQUOI : structurer un vrai livre (chapitres/sections) au lieu d'un bloc continu.
 * COMMENT : parseMarkdown → blocs ; resolveWord pour chaque mot (glyphes ou échec précis) ;
 *   chaque bloc → lignes STYLÉES de hauteur connue (mm) ; pagination HAUTEUR-AWARE (accumulation,
 *   saut quand ça dépasse, pas d'orphelin de titre, jamais de contenu coupé).
 */
const { GLYPHS, resolveEdges, renderGlyph } = require('./glyphRenderer');
const { THEMES, ruledLine, ruledMargin, grain } = require('./bookRenderer');
const { parseMarkdown } = require('./markdown');
const { resolveWord } = require('../../../scripts/confluent2glyphes');

const PX_MM = 3.7795;                 // px → mm à 96 dpi (impression Chromium)
const USABLE_MM = 297 - 20 - 16;      // A4 moins paddings haut/bas
const W_TEXT = 640;                   // largeur de la zone de texte (px)
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

// Styles par type de bloc : taille relative des glyphes, centrage, filet, marges (mm), indent, puce, barre.
const STY = {
  h1: { scale: 1.6, center: 1, rule: 1, mTop: 7, mBot: 4 },
  h2: { scale: 1.35, center: 1, rule: 1, mTop: 6, mBot: 3 },
  h3: { scale: 1.18, center: 1, rule: 0, mTop: 5, mBot: 2 },
  p: { scale: 1, center: 0, rule: 0, mTop: 0, mBot: 3 },
  li: { scale: 1, center: 0, rule: 0, mTop: 0, mBot: 1.5, indent: 24, bullet: 1 },
  quote: { scale: 1, center: 0, rule: 0, mTop: 1.5, mBot: 2, indent: 24, bar: 1 },
};

// Une perle (glyphe redessiné). Emphase : gras → +12% de taille ; italique → inclinaison CSS.
function bead(b, uid, baseH) {
  const h = Math.round(baseH * (b.bold ? 1.12 : 1));
  const g = GLYPHS[b.key];
  const inner = g ? renderGlyph(resolveEdges(g), uid, h)
    : `<div style="width:${Math.round(h * .62)}px;height:${h}px;border:1px dashed #5a4226;color:#5a4226;display:flex;align-items:center;justify-content:center;font-size:9px">?${b.key}</div>`;
  const ml = b.wordStart ? 2 : -Math.round(baseH * 0.2);   // début de mot = espace ; intra-mot = chevauchement (serré)
  const skew = b.italic ? 'transform:skewX(-11deg);' : '';
  return `<div style="margin-left:${ml}px;line-height:0;${skew}">${inner}</div>`;
}

// Résout les runs d'un bloc en perles (lance {word,piece,raison} si une pièce n'a pas de glyphe).
function resolveBlock(block) {
  if (!block.runs) return;
  const beads = [];
  for (const r of block.runs) {
    // Le Confluent ne s'écrit qu'en lettres → on retire la ponctuation latine (., ! ? …) avant résolution.
    const word = r.word.replace(/[^a-zA-Z]/g, '').toLowerCase();
    if (!word) continue;
    resolveWord(word).forEach((k, i) => beads.push({ key: k, wordStart: i === 0, bold: r.bold, italic: r.italic }));
  }
  block._beads = beads;
}

// Word-wrap : regroupe les perles en mots, puis remplit des lignes en gardant chaque MOT entier.
function wrapBeads(beads, perLine) {
  const words = []; let w = null;
  for (const b of beads) { if (b.wordStart) { w = [b]; words.push(w); } else if (w) w.push(b); }
  const lines = []; let cur = [];
  for (const wd of words) { if (cur.length && cur.length + wd.length > perLine) { lines.push(cur); cur = []; } wd.forEach(x => cur.push(x)); }
  if (cur.length) lines.push(cur);
  return lines.length ? lines : [[]];
}

// Un bloc → lignes {html, hMm, keep}. keep=true (titres) → ne pas rester orphelin en bas de page.
function blockLines(block, glyphH, th, idx) {
  if (block.type === 'hr') return [{ html: `<div class="ln hr">${ruledLine(W_TEXT, th.rule, 2)}</div>`, hMm: 12, keep: false }];
  const sty = STY[block.type] || STY.p;
  const h = Math.round(glyphH * sty.scale);
  const perLine = Math.max(4, Math.floor(18 / sty.scale));     // glyphes plus gros → moins par ligne
  const wlines = wrapBeads(block._beads, perLine);
  const lineMm = (h + 16) / PX_MM;
  const out = [];
  wlines.forEach((ln, i) => {
    const first = i === 0, last = i === wlines.length - 1;
    const beads = ln.map((b, j) => bead(b, `b${idx}_${i}_${j}`, h)).join('');
    const ruleHtml = last && sty.rule
      ? `<div class="rule" style="${sty.center ? 'display:flex;justify-content:center;' : ''}">${ruledLine(Math.round(W_TEXT * (sty.center ? 0.5 : 1)), th.rule, 1.8)}</div>` : '';
    const bullet = sty.bullet ? `<span class="bullet" ${first ? '' : 'style="visibility:hidden"'}></span>` : '';
    const wrap = `display:flex;align-items:flex-end;${sty.center ? 'justify-content:center;' : ''}`
      + (sty.indent ? `padding-left:${sty.indent}px;` : '')
      + (sty.bar ? `border-left:3px solid ${th.rule};` : '')
      + `margin-top:${first ? sty.mTop : 0}mm;margin-bottom:${last ? sty.mBot : 0}mm;`;
    out.push({
      html: `<div class="ln" style="${wrap}">${bullet}${beads}</div>${ruleHtml}`,
      hMm: lineMm + (first ? sty.mTop : 0) + (last ? sty.mBot : 0) + (ruleHtml ? 4 : 0),
      keep: block.type[0] === 'h',
    });
  });
  return out;
}

/**
 * renderMarkdownBook(mdText, opts) → { ok:true, html } OU { erreur:{ mot, piece, raison } }.
 * @param {Object} opts - { theme='tablette', glyphH=52 }
 */
function renderMarkdownBook(mdText, opts = {}) {
  const th = THEMES[opts.theme] || THEMES.tablette;
  const glyphH = opts.glyphH || 52;
  const blocks = parseMarkdown(mdText);

  // Résolution glyphes (échec franc : 1re pièce manquante → on signale mot/pièce/raison).
  for (const b of blocks) {
    try { resolveBlock(b); }
    catch (e) { return { erreur: { mot: e.word, piece: e.piece, raison: e.raison } }; }
  }

  // Blocs → lignes stylées (hauteur mm connue).
  const lines = [];
  blocks.forEach((b, idx) => blockLines(b, glyphH, th, idx).forEach((L) => lines.push(L)));
  if (!lines.length) lines.push({ html: '', hMm: 0, keep: false });
  // Titre du livre = TEXTE lisible (caption), pas des glyphes → en tête de la 1re page.
  if (opts.title) lines.unshift({ html: `<div class="booktitle">${esc(opts.title)}</div>`, hMm: 16, keep: true });

  // Pagination HAUTEUR-AWARE : accumulation ; saut quand ça dépasse ; titre jamais orphelin ; jamais coupé.
  const pages = []; let cur = [], h = 0;
  for (let i = 0; i < lines.length; i++) {
    const L = lines[i], next = lines[i + 1];
    const orphan = L.keep && next && (h + L.hMm + next.hMm > USABLE_MM);
    if (cur.length && (h + L.hMm > USABLE_MM || orphan)) { pages.push(cur); cur = []; h = 0; }
    cur.push(L); h += L.hMm;
  }
  if (cur.length) pages.push(cur);

  const pageHtml = (pg, n) => `<section class="page" style="--grain:${th.grain != null ? th.grain : 0.5}">`
    + `${grain()}<div class="margin">${ruledMargin(900, th.rule)}</div>`
    + `<div class="col">${pg.map((L) => L.html).join('')}</div>`
    + `<div class="folio">${n + 1} / ${pages.length}</div></section>`;

  const css = `
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #0c0a07; font-family: system-ui, sans-serif; }
    .page { width: 210mm; height: 297mm; background: ${th.page}; border: ${th.frame};
            margin: 8mm auto; padding: 20mm 18mm 16mm 26mm; position: relative; overflow: hidden; break-after: page; }
    .grain { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 0; opacity: var(--grain,.5); mix-blend-mode: overlay; pointer-events: none; }
    .margin { position: absolute; left: 16mm; top: 18mm; bottom: 14mm; }
    .col { position: relative; z-index: 1; }
    .booktitle { color: ${th.label}; text-align: center; font-size: 26px; letter-spacing: 1px; margin: 0 0 6mm; }
    .ln.hr { margin: 5mm 0; }
    .rule { line-height: 0; margin-top: -8px; }
    .bullet { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: ${th.rule}; align-self: center; margin: 0 8px 7px 0; }
    .folio { position: absolute; bottom: 7mm; right: 18mm; color: ${th.label}; font-size: 12px; opacity: .75; }
    @media print { body { background: #fff; } .page { margin: 0; } }`;

  return { ok: true, html: `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Livre — Glyphes du Gouffre</title><style>${css}</style></head><body>${pages.map(pageHtml).join('')}</body></html>` };
}

module.exports = { renderMarkdownBook };
