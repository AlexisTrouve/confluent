#!/usr/bin/env node
/**
 * Glyphes du Gouffre — GÉNÉRATEUR de la page de revue (registre + détecteur de doublons).
 *
 * QUOI : bâtit public/glyphes-font.html — la gallery de revue (atomes, particules, liaisons,
 *   racines) + un collier de démonstration, et signale les DOUBLONS (deux concepts → même glyphe).
 * POURQUOI : valider visuellement le registre, par catégorie, et garantir l'unicité des glyphes.
 * COMMENT : le RENDU (géométrie, boudins, filtre, collier) vit dans src/core/ecriture/glyphRenderer.js
 *   (source unique, partagée avec l'endpoint /api/ecriture) ; ce script ne fait que MISE EN PAGE.
 * USAGE : node scripts/glyphes-font.js  →  public/glyphes-font.html
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { GLYPHS, ATOMS_LIB, NODES, resolveEdges, orient, renderGlyph, renderCollier } = require('../src/core/ecriture/glyphRenderer');

function main() {
  // Cellule de revue : un glyphe + son label (id optionnel pour cibler en capture E2E).
  const cell = (label, edges, uid, id = '') => `<div ${id ? `id="${id}"` : ''} style="text-align:center;margin:18px">`
    + `<div>${renderGlyph(edges, uid)}</div>`
    + `<div style="color:#c9a86a;font-size:13px;margin-top:4px">${label}</div></div>`;

  // Bibliothèque d'atomes (les marques de base).
  const atomsView = Object.entries(ATOMS_LIB).map(([n, e], i) => cell(n, e, 'a' + i)).join('');
  const entries = Object.entries(GLYPHS);

  // VÉRIF DOUBLONS : deux concepts produisant le MÊME glyphe (mêmes edges normalisés) = collision.
  // Signature RASTERISÉE : on « peint » le glyphe avec l'ÉPAISSEUR réelle des boudins (rayon R) sur
  // une grille, et on compare les images. POURQUOI : la sig géométrique ratait les doublons visuels
  // quand un petit repère (point/pip) tombe SOUS un trait épais (centre OU n'importe où) → invisible.
  // COMMENT : pour chaque arête (trait/arc/point) on remplit les cellules à distance ≤ R ; deux
  // glyphes au même ensemble de cellules sont identiques à l'œil. (R ≈ demi-largeur du boudin.)
  const R = 9, STEP = 3;
  const sig = (edges) => {
    const F = new Set();
    const mark = (x, y) => { for (let gx = Math.floor((x - R) / STEP) * STEP; gx <= x + R; gx += STEP) for (let gy = Math.floor((y - R) / STEP) * STEP; gy <= y + R; gy += STEP) if ((gx - x) ** 2 + (gy - y) ** 2 <= R * R) F.add(gx + ',' + gy); };
    for (const e of edges) {
      const [a, b] = e, [x1, y1] = NODES[a], [x2, y2] = NODES[b];
      if (a === b) { mark(x1, y1); continue; }
      if (e.length === 3) { const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, cx = mx - dy / L * e[2], cy = my + dx / L * e[2]; for (let t = 0; t <= 1; t += 0.05) { const u = 1 - t, px = u * u * x1 + 2 * u * t * cx + t * t * x2, py = u * u * y1 + 2 * u * t * cy + t * t * y2; mark(px, py); } }
      else { for (let t = 0; t <= 1; t += 0.04) mark(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t); }
    }
    return [...F].sort().join(';');
  };
  const bySig = {};
  for (const [cf, g] of entries) { const s = sig(resolveEdges(g)); (bySig[s] = bySig[s] || []).push(cf + '=' + g.fr); }
  const dups = Object.values(bySig).filter(a => a.length > 1);
  console.log(dups.length ? '⚠ DOUBLONS (' + dups.length + ') : ' + dups.map(a => a.join('/')).join(' · ') : '✓ aucun doublon');
  const dupWarn = dups.length
    ? `<div style="background:#3a1a1a;color:#f0a0a0;padding:10px;text-align:center;border-radius:8px;margin:0 auto 14px;max-width:700px">⚠ ${dups.length} doublon(s) : ${dups.map(a => a.join(' = ')).join(' · ')}</div>`
    : `<div style="color:#7aa05a;text-align:center;margin-bottom:14px">✓ aucun doublon</div>`;

  // Revue GROUPÉE par type (validation par catégorie).
  const sectionOf = (...types) => entries.filter(([, g]) => types.includes(g.type))
    .map(([cf, g], i) => cell(cf + ' = ' + g.fr, resolveEdges(g), types[0] + i, 'g-' + cf)).join('');
  const sec = (titre, contenu) => `<hr style="border-color:#3a2c1c;margin:22px 0">`
    + `<h3 style="color:#c9a86a;text-align:center">${titre}</h3>`
    + `<div style="display:flex;flex-wrap:wrap;justify-content:center">${contenu}</div>`;

  // Collier de démonstration (mapping direct token→glyphe ; la vraie résolution morpho vit dans l'UI).
  const demo = ['va', 'naki', 'vo', 'ura', 'mirak', 'u'].map(t => ({ word: t, glyphes: [t] }));
  const collier = renderCollier(demo);

  const html = `<!doctype html><meta charset="utf-8"><body style="background:#15110c;font-family:system-ui;padding:30px">`
    + `<h2 style="color:#c9a86a;text-align:center">Glyphes du Gouffre — registre (${entries.length})</h2>`
    + dupWarn
    + `<div style="display:flex;justify-content:center;margin:0 auto 10px;max-width:fit-content">${collier}</div>`
    + sec('PARTICULES + CONJUGATEURS', sectionOf('particule', 'conjugateur'))
    + sec('LIAISONS (16)', sectionOf('liaison'))
    + sec('NOMBRES (base 12)', sectionOf('nombre'))
    + sec('Racines (échantillon, déjà composées)', sectionOf('racine', 'verbe'))
    + sec('Atomes (palette de marques)', atomsView)
    + `</body>`;
  fs.writeFileSync(path.join(__dirname, '..', 'public', 'glyphes-font.html'), html, 'utf-8');
  console.log('glyphes-font.html');
}
main();
