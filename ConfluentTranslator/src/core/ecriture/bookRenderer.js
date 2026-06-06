'use strict';
/**
 * Mise en page « livre » des Glyphes du Gouffre — pages paginées, THÈME MODULABLE.
 *
 * QUOI : transforme des mots résolus (sortie de convert()) en pages prêtes à imprimer (→ PDF).
 * POURQUOI : un gros texte doit se lire comme un livre (pages, marges, numéros), pas un collier qui déborde.
 * COMMENT : on réutilise renderGlyph() (la « police » argile) ; THEMES = registre de skins de PAGE
 *   (modulable comme la police : ajouter une entrée = un nouveau look) ; on découpe les glyphes en
 *   pages de capacité fixe ; CSS @page + break-after rend une page = une feuille à l'impression.
 */
const { GLYPHS, resolveEdges, renderGlyph } = require('./glyphRenderer');

// Registre de THÈMES de page (skin) — découplé de la police. Glyphes dessinés sur `surface`.
const THEMES = {
  tablette: { nom: "Tablette d'argile", pageBg: '#6f5230', surface: '#241a10', frame: '16px solid #8a6a40', shadow: 'inset 0 0 50px rgba(0,0,0,.65)', label: '#c9a86a' },
  parchemin: { nom: 'Parchemin sombre', pageBg: '#1c150d', surface: '#15110c', frame: '1px solid #3a2c1c', shadow: 'none', label: '#c9a86a' },
  clair: { nom: 'Manuscrit clair', pageBg: '#cdb78c', surface: '#efe4cf', frame: '1px solid #b8a070', shadow: 'inset 0 0 30px rgba(120,90,40,.22)', label: '#5a4226' },
};

// Aplatit les mots en « perles » (un glyphe chacun), en marquant le DÉBUT de chaque mot (pour l'espace).
function toBeads(words) {
  const beads = [];
  for (const w of words) (w.glyphes || []).forEach((k, i) => beads.push({ key: k, wordStart: i === 0, word: w.word }));
  return beads;
}

// Une perle d'argile (glyphe rendu, redessiné à neuf via renderGlyph). h compact pour densité livre.
function bead(b, uid, h) {
  const g = GLYPHS[b.key];
  const inner = g ? renderGlyph(resolveEdges(g), uid, h)
    : `<div style="width:${Math.round(h * .66)}px;height:${h}px;border:1px dashed #5a4226;color:#5a4226;display:flex;align-items:center;justify-content:center;font-size:10px">?${b.key}</div>`;
  // marge gauche élargie en début de mot = séparation des mots (lecture).
  return `<div style="margin-left:${b.wordStart ? 18 : 4}px">${inner}</div>`;
}

/**
 * renderBook(words, opts) → document HTML complet, paginé, prêt à imprimer (PDF).
 * @param {Array} words  - [{ word, glyphes:[clé...] }] (sortie de confluent2glyphes.convert)
 * @param {Object} opts  - { theme='tablette', perPage=80, glyphH=80, title='' }
 */
function renderBook(words, opts = {}) {
  const th = THEMES[opts.theme] || THEMES.tablette;
  const perPage = opts.perPage || 80, glyphH = opts.glyphH || 80, title = opts.title || '';
  const beads = toBeads(words);

  // Découpe en pages de capacité fixe (les perles se répartissent en flex-wrap dans la feuille A4).
  const pages = [];
  for (let i = 0; i < beads.length; i += perPage) pages.push(beads.slice(i, i + perPage));
  if (!pages.length) pages.push([]);

  const pageHtml = (pg, n) => {
    const cells = pg.map((b, i) => bead(b, `p${n}_${i}`, glyphH)).join('');
    return `<section class="page">`
      + (n === 0 && title ? `<div class="title">${title}</div>` : '')
      + `<div class="flow">${cells}</div>`
      + `<div class="folio">${n + 1} / ${pages.length}</div></section>`;
  };

  // CSS : @page A4 sans marge ; chaque .page = une feuille (break-after) ; thème appliqué.
  const css = `
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #0c0a07; font-family: system-ui, sans-serif; }
    .page { width: 210mm; height: 297mm; background: ${th.pageBg}; border: ${th.frame}; box-shadow: ${th.shadow};
            margin: 8mm auto; padding: 16mm 14mm 12mm; position: relative; overflow: hidden; break-after: page; }
    .surface { }
    .flow { background: ${th.surface}; height: 100%; border-radius: 6px; padding: 14mm 10mm;
            display: flex; flex-wrap: wrap; align-content: flex-start; align-items: flex-start; gap: 12px 0; }
    .title { color: ${th.label}; text-align: center; font-size: 22px; letter-spacing: 1px; margin-bottom: 8mm; }
    .folio { position: absolute; bottom: 6mm; right: 12mm; color: ${th.label}; font-size: 12px; opacity: .8; }
    @media print { body { background: #fff; } .page { margin: 0; box-shadow: ${th.shadow}; } }`;

  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${title || 'Livre'} — Glyphes du Gouffre</title>`
    + `<style>${css}</style></head><body>${pages.map(pageHtml).join('')}</body></html>`;
}

module.exports = { renderBook, THEMES };
