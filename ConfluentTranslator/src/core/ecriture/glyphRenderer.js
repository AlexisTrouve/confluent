'use strict';
/**
 * Renderer des « Glyphes du Gouffre » — module RÉUTILISABLE (gallery de revue + serveur/UI).
 *
 * QUOI : transforme des edges (ou des glyphes du registre) en SVG « argile », et une suite de
 *   mots résolus en COLLIER horizontal G→D. Source UNIQUE du rendu (la gallery ET l'endpoint
 *   /api/ecriture l'utilisent) — pas de duplication de la logique de dessin.
 * POURQUOI : la méthode de rendu est validée (boudins par couches + filtre organique aléatoire) ;
 *   elle doit vivre à un seul endroit pour ne jamais diverger entre la revue et l'UI publique.
 * COMMENT : grille de nœuds PORTRAIT → atomes (edges) → connect() d'un seul tenant → strokes()
 *   dessine PAR COUCHES (jonctions fusionnées) → renderGlyph() enveloppe dans un filtre #rough
 *   UNIQUE par instance (seed random) : chaque caractère est redessiné à neuf, déformation
 *   différente à chaque écriture (argile vivante). renderCollier() enfile les glyphes (nœuds aux bouts).
 *
 * NB : 4 helpers de l'ancienne version (pointsForEdge/jitter/pointsToPath/rngSeed) étaient DEAD
 *   (strokes() ne les appelait pas) → non repris ici.
 */
const fs = require('fs');
const path = require('path');

// Grille de NŒUDS partagés (centre + cardinaux + diagonales), PORTRAIT (x resserré, y étiré) :
// collier horizontal G→D ⇒ glyphes plus hauts que larges, qui s'enchaînent dans la ligne.
const NODES = {
  c: [50, 50], n: [50, 18], s: [50, 82], e: [82, 50], w: [18, 50],
  ne: [73, 27], nw: [27, 27], se: [73, 73], sw: [27, 73],
};
const seg = (a, b) => { const [x1, y1] = NODES[a], [x2, y2] = NODES[b]; return `M${x1},${y1} L${x2},${y2}`; };
// VRAI arc de cercle : on déduit le rayon de la corde + la flèche (bend) et on émet une commande SVG
// 'A' (arc circulaire). POURQUOI : l'ancien arc quadratique faisait des POINTES aux jonctions → un
// « cercle » de 4 arcs ressortait en étoile. Avec 'A' à rayon constant, 4 quarts forment un vrai rond.
const arc = (a, b, bend) => {
  const [x1, y1] = NODES[a], [x2, y2] = NODES[b];
  const c = Math.hypot(x2 - x1, y2 - y1) || 1, sag = Math.abs(bend) || 0.01;
  const R = (c * c / 4 + sag * sag) / (2 * sag);
  const sweep = bend > 0 ? 1 : 0;
  return `M${x1},${y1} A${R.toFixed(1)},${R.toFixed(1)} 0 0 ${sweep} ${x2},${y2}`;
};

// Registre MODULAIRE (source unique : data/glyphes-anciens.json) : atomes (marque→edges) + glyphes (concept→atomes).
const REG = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', 'data', 'glyphes-anciens.json'), 'utf-8'));
const ATOMS_LIB = REG.atomes, GLYPHS = REG.glyphes;
// Résout un glyphe en edges : concatène les atomes qu'il référence (+ edges bruts éventuels).
const resolveEdges = (g) => [].concat((g.atomes || []).flatMap(a => ATOMS_LIB[a] || []), g.edges || []);

// Défs : bruit/impuretés UNIQUES par glyphe (id + seed propres) → déformation différente à chaque
// instance (sinon tous partagent #rough → même déformation partout). userSpaceOnUse + zone FIXE :
// indispensable, sinon sur un glyphe PLAT la zone en % de bbox s'effondre et tranche le haut.
function defs(uid, seedR, seedG) {
  return `<defs>
  <filter id="rough${uid}" filterUnits="userSpaceOnUse" x="-40" y="-40" width="180" height="180" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.035 0.045" numOctaves="2" seed="${seedR}" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="10" xChannelSelector="R" yChannelSelector="G" result="disp"/>
    <feMorphology in="SourceAlpha" operator="dilate" radius="11" result="mask"/>
    <feComposite in="disp" in2="mask" operator="in" result="clay"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.45" numOctaves="2" seed="${seedG}" result="gr"/>
    <feColorMatrix in="gr" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.4 -0.2" result="grA"/>
    <feComposite in="grA" in2="clay" operator="in" result="grClip"/>
    <feMerge><feMergeNode in="clay"/><feMergeNode in="grClip"/></feMerge>
  </filter>
</defs>`;
}

// Oriente une arête : toujours du nœud HAUT-GAUCHE vers BAS-DROITE (tracé cohérent, jonctions nettes).
function orient(e) {
  const [a, b] = e, [ax, ay] = NODES[a], [bx, by] = NODES[b];
  const swap = ay > by || (ay === by && ax > bx);
  return swap ? (e.length === 3 ? [b, a, -e[2]] : [b, a]) : e;
}

const edgePath = e => e.length === 3 ? arc(e[0], e[1], e[2]) : seg(e[0], e[1]);

// connect() : garantit un glyphe d'un seul tenant en ajoutant le pont le plus court entre
// composantes séparées (union-find), sans imposer de hub central.
function connect(edges) {
  const par = {}, find = x => par[x] === undefined ? (par[x] = x) : (par[x] === x ? x : (par[x] = find(par[x])));
  const uni = (a, b) => { par[find(a)] = find(b); };
  const nodes = new Set();
  edges.forEach(e => { nodes.add(e[0]); nodes.add(e[1]); uni(e[0], e[1]); });
  const comps = () => { const m = {}; nodes.forEach(n => (m[find(n)] = m[find(n)] || []).push(n)); return Object.values(m); };
  const out = edges.slice();
  let guard = 0;
  while (comps().length > 1 && guard++ < 20) {
    const cs = comps(); let best = null;
    for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++)
      for (const a of cs[i]) for (const b of cs[j]) {
        const [ax, ay] = NODES[a], [bx, by] = NODES[b], d = Math.hypot(ax - bx, ay - by);
        if (!best || d < best.d) best = { a, b, d };
      }
    if (!best) break;
    out.push([best.a, best.b]); uni(best.a, best.b);
  }
  return out;
}

// Glyphe d'un seul tenant, dessiné PAR COUCHES (toutes les ombres, puis corps, puis crêtes) :
// les jonctions fusionnent au lieu de se couper. Largeur ~16 = boudins épais (style validé).
function strokes(edges, w) {
  const paths = connect(edges).map(e => edgePath(orient(e)));
  const cap = `stroke-linecap="round" stroke-linejoin="round" fill="none"`;
  const layer = (color, sw, dx, dy) =>
    `<g transform="translate(${dx},${dy})">` + paths.map(d => `<path d="${d}" stroke="${color}" stroke-width="${sw}" ${cap}/>`).join('') + `</g>`;
  return layer('#4a3416', w + 3, 0.6, 1.8)     // ombre portée
    + layer('#8f6f3c', w, 0, 0)                // bord du boudin
    + layer('#c2a06a', w * 0.66, 0, 0)         // corps
    + layer('#e7cf92', w * 0.32, 0, 0);        // centre clair
}

// renderGlyph : edges → un <svg> argile complet. uid UNIQUE + seed random ⇒ chaque appel (donc
// chaque caractère, à chaque écriture) produit une déformation différente. PAS de dalle de fond.
function renderGlyph(edges, uid, h = 180, weight = 16) {
  const sr = Math.floor(Math.random() * 9999), sg = Math.floor(Math.random() * 9999);
  const ropes = `<g filter="url(#rough${uid})">${strokes(edges, weight)}</g>`;
  // Cellule PORTRAIT (plus haute que large) → les glyphes s'enchaînent bien dans le collier horizontal.
  const VBX = 6, VBY = 6, VBW = 88, VBH = 88, w = Math.round(h * VBW / VBH);
  return `<svg viewBox="${VBX} ${VBY} ${VBW} ${VBH}" width="${w}" height="${h}">${defs(uid, sr, sg)}${ropes}</svg>`;
}

// renderCollier : mots résolus → COLLIER horizontal (cordelette + nœuds aux bouts, gauche = début).
// words = [{ word, glyphes:[clé,...] }] (sortie de confluent2glyphes.convert). Un mot = un groupe
// de perles (ses morphèmes), groupes séparés par un cordon plus large ; le mot romanisé sous chaque groupe.
function renderCollier(words) {
  const cord = '<div style="width:16px;height:4px;background:#7a5c38;align-self:center;margin-top:-14px"></div>';
  const wordGap = '<div style="width:34px;height:4px;background:#6a4f30;align-self:center;margin-top:-14px"></div>';
  // Nœud d'argile : le gauche (début) plus gros = marque le début de lecture (canon T16).
  const knot = (debut) => `<div title="${debut ? 'début' : 'fin'}" style="width:${debut ? 26 : 18}px;height:${debut ? 26 : 18}px;border-radius:50%;background:#8a6a40;align-self:center;margin-top:-14px;box-shadow:inset -2px -2px 4px rgba(0,0,0,.45),0 1px 2px rgba(0,0,0,.4)"></div>`;
  // Une perle = un morphème glyphé. showKey n'affiche l'étiquette du morphème que si le mot en a plusieurs.
  const bead = (key, uid, showKey) => {
    const g = GLYPHS[key];
    const inner = g ? renderGlyph(resolveEdges(g), uid, 110)
      : `<div style="width:72px;height:110px;border:1px dashed #5a4226;color:#5a4226;display:flex;align-items:center;justify-content:center;font-size:11px">?${key}</div>`;
    const lbl = showKey ? `<div style="color:#7a6a4a;font-size:10px">${key}</div>` : '';
    return `<div style="text-align:center"><div>${inner}</div>${lbl}</div>`;
  };
  const groups = words.map((w, wi) => {
    const multi = (w.glyphes || []).length > 1;
    const beads = (w.glyphes || []).map((k, ki) => bead(k, `w${wi}_${ki}`, multi)).join(cord);
    return `<div style="display:flex;flex-direction:column;align-items:center">`
      + `<div style="display:flex;align-items:flex-start">${beads}</div>`
      + `<div style="color:#9a7a4a;font-size:13px;margin-top:2px">${w.word}</div></div>`;
  }).join(wordGap);
  return `<div style="display:flex;justify-content:center;align-items:flex-start;flex-wrap:wrap;background:#1c150d;padding:18px;border-radius:12px">`
    + knot(true) + cord + groups + cord + knot(false) + `</div>`;
}

module.exports = { NODES, GLYPHS, ATOMS_LIB, resolveEdges, orient, renderGlyph, renderCollier };
