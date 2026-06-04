#!/usr/bin/env node
/**
 * Glyphes du Gouffre — générateur de glyphes (MÉTHODE VALIDÉE par Alexi, base pour la suite).
 *
 * PRINCIPE (logographique, par le SENS, jamais par le son) :
 *   1 racine = 1 glyphe · 1 particule = 1 glyphe · 1 liaison = 1 glyphe. Un glyphe se COMPOSE
 *   d'« atomes de sens » abstraits, pas dessiné un par un. Kit fini d'atomes -> infinité de glyphes.
 *
 * CONSTRUCTION GÉOMÉTRIQUE :
 *   - NODES : grille de nœuds partagés (centre + cardinaux + diagonales).
 *   - ATOMS : chaque atome = liste d'ARÊTES [nodeA, nodeB] (trait) ou [nodeA, nodeB, courbure] (arc).
 *   - connect() : garantit un glyphe « d'un seul tenant » en ajoutant le PONT le plus court entre
 *     composantes séparées (union-find). PAS de hub central (l'étoile au centre était moche).
 *   - orient() : chaque arête tracée HAUT->BAS / GAUCHE->DROITE (cohérence des jonctions).
 *
 * RENDU « ARGILE » (le style validé) :
 *   - chaque trait = BOUDIN d'argile = couches concentriques : ombre portée (#4a3416), bord (#8f6f3c),
 *     corps (#bf9c60), centre clair (#e7cf92). Dessiné PAR COUCHES (toutes les ombres, puis tous les
 *     bords, etc.) -> les jonctions FUSIONNENT (clé : ne PAS dessiner boudin par boudin).
 *   - filtre #rough = feTurbulence + feDisplacementMap (bords d'argile organiques) + grain de surface
 *     (turbulence compositée IN la forme = pores sur l'argile, pas un rectangle).
 *   - déformation ALÉATOIRE par instance : chaque glyphe a son filtre #rough<uid> avec un seed random
 *     (sinon tous partagent #rough -> déformation identique partout).
 *   - PAS de dalle/rectangle de fond (ça faisait les « bords » par glyphe). Les glyphes flottent.
 *
 * PIÈGES RÉSOLUS (ne pas régresser) :
 *   - feDisplacementMap peint une BOÎTE de zone -> on clippe la sortie à la forme dilatée
 *     (feMorphology dilate radius 11 + feComposite "in").
 *   - zone du filtre en % de bbox -> sur un glyphe PLAT (bbox courte), la hauteur s'effondre et le
 *     déplacement est tranché droit en haut. FIX : filterUnits="userSpaceOnUse" + zone FIXE généreuse.
 *   - vérifier le rendu SOI-MÊME via Playwright (screenshot d'un .html) plutôt que deviner à l'aveugle.
 *
 * SUITE À FAIRE : étendre le kit d'atomes ; mapping racine->atomes (assisté LLM via le sens FR) pour
 *   couvrir les 231 racines + particules + liaisons ; puis rendu d'une phrase (collier/tablette).
 * USAGE : node scripts/glyphes-font.js  -> public/glyphes-font.html
 */
'use strict';
const fs = require('fs');
const path = require('path');

const U = 100; // unité de grille du glyphe

// Grille de NŒUDS partagés (centre + cardinaux + diagonales). Tout glyphe se construit dessus,
// et chaque atome touche le centre -> n'importe quelle combinaison reste CONNECTÉE (d'un seul tenant).
const NODES = {
  c: [50, 50], n: [50, 18], s: [50, 82], e: [82, 50], w: [18, 50],
  ne: [73, 27], nw: [27, 27], se: [73, 73], sw: [27, 73],
};
const seg = (a, b) => { const [x1, y1] = NODES[a], [x2, y2] = NODES[b]; return `M${x1},${y1} L${x2},${y2}`; };
const arc = (a, b, bend) => {
  const [x1, y1] = NODES[a], [x2, y2] = NODES[b];
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
  return `M${x1},${y1} Q${(mx - dy / L * bend).toFixed(1)},${(my + dx / L * bend).toFixed(1)} ${x2},${y2}`;
};

// Atomes = arêtes (paire de nœuds, + courbure optionnelle). Pas de centre forcé : connect() relie.
const ATOMS = {
  eau:       [['w', 'c', -8], ['c', 'e', 8]],                   // vague en S (sans cusp)
  feu:       [['s', 'n'], ['n', 'ne'], ['n', 'nw']],            // gerbe montante
  terre:     [['sw', 'se'], ['w', 'e']],                        // double base
  ciel:      [['nw', 'n'], ['n', 'ne']],                        // voûte
  oeil:      [['n', 'e', 9], ['e', 's', 9], ['s', 'w', 9], ['w', 'n', 9], ['c', 'c']], // anneau + pupille
  parole:    [['nw', 'ne'], ['w', 'e'], ['sw', 'se']],          // bandes empilées (voix)
  mouvement: [['w', 'e'], ['e', 'ne'], ['e', 'se']],            // flèche ->
  lien:      [['nw', 'se'], ['ne', 'sw']],                      // croix
  cycle:     [['n', 'e', 9], ['e', 's', 9], ['s', 'w', 9], ['w', 'n', 9]], // boucle (temps)
  personne:  [['n', 'c'], ['c', 'sw'], ['c', 'se']],            // figure (tête + jambes)
};

// Défs : bruit/impuretés UNIQUES par glyphe (id + seed propres) -> déformation différente à chaque
// instance et à chaque génération (sinon tous partagent #rough -> même déformation partout).
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
  <filter id="grain${uid}" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" seed="${seedG}" result="g"/>
    <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .9 -.45"/>
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

// PRNG déterministe (sortie stable entre runs).
function rngSeed(s) { let x = s; return () => { x = (x * 1103515245 + 12345) & 0x7fffffff; return x / 0x7fffffff; }; }

// Échantillonne une arête (ligne ou arc) en points.
function pointsForEdge(e, n = 16) {
  const [a, b] = e, [x1, y1] = NODES[a], [x2, y2] = NODES[b], pts = [];
  if (e.length === 3) {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
    const cx = mx - dy / L * e[2], cy = my + dx / L * e[2];
    for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; pts.push([u * u * x1 + 2 * u * t * cx + t * t * x2, u * u * y1 + 2 * u * t * cy + t * t * y2]); }
  } else for (let i = 0; i <= n; i++) { const t = i / n; pts.push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]); }
  return pts;
}

// Tremblement perpendiculaire (impuretés organiques) — endpoints FIGÉS (connexions intactes).
function jitter(pts, amp, rng) {
  return pts.map((p, i) => {
    if (i === 0 || i === pts.length - 1) return p;
    const pr = pts[i - 1], nx = pts[i + 1], dx = nx[0] - pr[0], dy = nx[1] - pr[1], L = Math.hypot(dx, dy) || 1, o = (rng() - 0.5) * 2 * amp;
    return [p[0] - dy / L * o, p[1] + dx / L * o];
  });
}

// Points -> path quadratique lissé (trait d'argile organique).
function pointsToPath(pts) {
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length - 1; i++) { const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2; d += ` Q${pts[i][0].toFixed(1)},${pts[i][1].toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)}`; }
  const e = pts[pts.length - 1]; return d + ` L${e[0].toFixed(1)},${e[1].toFixed(1)}`;
}

// Glyphe d'un seul tenant, dessiné PAR COUCHES (toutes les ombres, puis corps, puis crêtes) :
// les jonctions fusionnent au lieu de se couper. Bruit = géométrie (pas de filtre = pas de bord).
function strokes(atomNames, w) {
  const paths = connect(atomNames.flatMap(nm => ATOMS[nm] || [])).map(e => edgePath(orient(e)));
  const cap = `stroke-linecap="round" stroke-linejoin="round" fill="none"`;
  const layer = (color, sw, dx, dy) =>
    `<g transform="translate(${dx},${dy})">` + paths.map(d => `<path d="${d}" stroke="${color}" stroke-width="${sw}" ${cap}/>`).join('') + `</g>`;
  return layer('#4a3416', w + 3, 0.6, 1.8)     // ombre portée
    + layer('#8f6f3c', w, 0, 0)                // bord du boudin
    + layer('#c2a06a', w * 0.66, 0, 0)         // corps
    + layer('#e7cf92', w * 0.32, 0, 0);        // centre clair
}

function svg(atoms, uid) {
  const sr = Math.floor(Math.random() * 9999), sg = Math.floor(Math.random() * 9999);
  // Marge transparente (viewBox élargie) : aucune dalle/rectangle, le boudin (texturé lui-même) flotte.
  const M = 9, VB = U + 2 * M;
  const ropes = `<g filter="url(#rough${uid})">${strokes(atoms, 16)}</g>`;
  return `<svg viewBox="${-M} ${-M} ${VB} ${VB}" width="180" height="180">${defs(uid, sr, sg)}${ropes}</svg>`;
}

function main() {
  const items = [
    ['eau', ['eau']], ['feu', ['feu']], ['regard = œil', ['oeil']],
    ['parole', ['parole']], ['aller = mouv', ['mouvement']], ['personne', ['personne']],
    ['temps = cycle', ['cycle']], ['union = lien', ['lien']], ['ciel', ['ciel']],
    ['voir = œil+mouv', ['oeil', 'mouvement']], ['pleurer = œil+eau', ['oeil', 'eau']],
    ['soleil = feu+ciel', ['feu', 'ciel']], ['rivière = eau+mouv', ['eau', 'mouvement']],
    ['vie = personne+cycle', ['personne', 'cycle']], ['monde = ciel+terre', ['ciel', 'terre']],
  ];
  const cell = (label, atoms, uid) => `<div style="text-align:center;margin:22px">`
    + `<div>${svg(atoms, uid)}</div>`
    + `<div style="color:#c9a86a;font-size:13px;margin-top:4px">${label}</div></div>`;
  // Rangée démo : le MÊME glyphe (eau) 4× -> déformation différente à chaque écriture.
  const demo = [0, 1, 2, 3].map(k => cell('eau', ['eau'], 'd' + k)).join('');
  // Fond d'argile CONTINU : mouchetures douces (tons d'argile) + grain fin subtil -> vraie matière.
  const pageBg = `<svg style="position:fixed;inset:0;width:100%;height:100%;z-index:0" preserveAspectRatio="none">`
    + `<defs>`
    + `<filter id="pgMottle"><feTurbulence type="fractalNoise" baseFrequency="0.014 0.017" numOctaves="5" seed="7" result="t"/>`
    + `<feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.5 -0.22"/></filter>`
    + `<filter id="pgFine"><feTurbulence type="fractalNoise" baseFrequency="0.4" numOctaves="2" seed="19" result="t"/>`
    + `<feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.25 -0.12"/></filter>`
    + `</defs>`
    + `<rect width="100%" height="100%" fill="#231a0f"/>`
    + `<rect width="100%" height="100%" fill="#0c0905" filter="url(#pgMottle)"/>`     // creux d'argile sombres
    + `<rect width="100%" height="100%" fill="#000" filter="url(#pgFine)" opacity="0.45"/></svg>`; // grain fin
  const html = `<!doctype html><meta charset="utf-8"><body style="background:#15110c;font-family:system-ui;padding:30px">`
    + `<h2 style="color:#c9a86a;text-align:center">Glyphes argile — déformation aléatoire par instance</h2>`
    + `<p style="color:#8a7a5a;text-align:center">Même glyphe « eau » ×4 (chacun déformé différemment) :</p>`
    + `<div style="display:flex;flex-wrap:wrap;justify-content:center">${demo}</div>`
    + `<hr style="border-color:#3a2c1c;margin:20px 0">`
    + `<div style="display:flex;flex-wrap:wrap;justify-content:center">${items.map(([l, a], i) => cell(l, a, i)).join('')}</div></body>`;
  const name = 'glyphes-font.html';
  fs.writeFileSync(path.join(__dirname, '..', 'public', name), html, 'utf-8');
  console.log(name);
}
main();
