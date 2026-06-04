#!/usr/bin/env node
/**
 * Glyphes du Gouffre — générateur de glyphes (MÉTHODE VALIDÉE par Alexi, base pour la suite).
 *
 * PRINCIPE (logographique, par le SENS, jamais par le son) :
 *   1 racine = 1 glyphe · 1 particule = 1 glyphe · 1 liaison = 1 glyphe. Un glyphe se COMPOSE
 *   d'« atomes de sens » abstraits, pas dessiné un par un. Kit fini d'atomes -> infinité de glyphes.
 *
 * ARCHITECTURE MODULAIRE (data : data/glyphes-anciens.json) :
 *   - atomes = marques réutilisables (nom -> edges). glyphes = concept -> liste d'atomes.
 *   - resolveEdges(glyphe) = concat des edges de ses atomes -> on COMBINE ~25 atomes, pas 250 glyphes.
 *   - composeText(tokens) = COLLIER horizontal G->D (nœuds début/fin + cordelette) : écrire une phrase
 *     = lookup chaque token dans le registre + agencer. (Branchera la décompo morpho du traducteur.)
 *   - FORMAT PORTRAIT : grille resserrée en x (collier horizontal -> glyphes plus hauts que larges).
 *
 * CONSTRUCTION GÉOMÉTRIQUE :
 *   - NODES : grille PORTRAIT de nœuds (centre + cardinaux + diagonales, x resserré).
 *   - edges : [nodeA, nodeB] (trait) ou [nodeA, nodeB, courbure] (arc).
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
 * SUITE À FAIRE : REMPLIR le registre (data/glyphes-anciens.json) — mapper MANUELLEMENT (Alexi+moi,
 *   par lots validés) les 231 racines + 9 particules + 16 liaisons en compositions d'atomes.
 * USAGE : node scripts/glyphes-font.js  -> public/glyphes-font.html
 */
'use strict';
const fs = require('fs');
const path = require('path');

const U = 100; // unité de grille du glyphe

// Grille de NŒUDS partagés (centre + cardinaux + diagonales). Tout glyphe se construit dessus,
// et chaque atome touche le centre -> n'importe quelle combinaison reste CONNECTÉE (d'un seul tenant).
// Grille PORTRAIT (collier horizontal G->D -> glyphes verticaux) : x resserré, y étiré.
const NODES = {
  c: [50, 50], n: [50, 14], s: [50, 86], e: [68, 50], w: [32, 50],
  ne: [64, 26], nw: [36, 26], se: [64, 74], sw: [36, 74],
};
const seg = (a, b) => { const [x1, y1] = NODES[a], [x2, y2] = NODES[b]; return `M${x1},${y1} L${x2},${y2}`; };
const arc = (a, b, bend) => {
  const [x1, y1] = NODES[a], [x2, y2] = NODES[b];
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
  return `M${x1},${y1} Q${(mx - dy / L * bend).toFixed(1)},${(my + dx / L * bend).toFixed(1)} ${x2},${y2}`;
};

// Registre MODULAIRE (source unique : data/glyphes-anciens.json) :
//   atomes = marques réutilisables (concept -> edges) ; glyphes = concept -> liste d'atomes.
// Le rendu ET la composition de texte lisent ce registre. On combine ~25 atomes, pas 250 glyphes.
const REG = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'glyphes-anciens.json'), 'utf-8'));
const ATOMS_LIB = REG.atomes, GLYPHS = REG.glyphes;
// Résout un glyphe en edges : concatène les atomes qu'il référence (+ edges bruts éventuels).
const resolveEdges = (g) => [].concat((g.atomes || []).flatMap(a => ATOMS_LIB[a] || []), g.edges || []);

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

function svg(edges, uid, h = 180) {
  const sr = Math.floor(Math.random() * 9999), sg = Math.floor(Math.random() * 9999);
  const ropes = `<g filter="url(#rough${uid})">${strokes(edges, 16)}</g>`;
  // Cellule PORTRAIT (plus haute que large) -> les glyphes s'enchaînent bien dans le collier horizontal.
  const VBX = 14, VBY = -6, VBW = 72, VBH = 112, w = Math.round(h * VBW / VBH);
  return `<svg viewBox="${VBX} ${VBY} ${VBW} ${VBH}" width="${w}" height="${h}">${defs(uid, sr, sg)}${ropes}</svg>`;
}

// COMPOSEUR de texte : une suite de tokens Confluent -> séquence de glyphes du registre (collier).
// Modulaire : lit uniquement le REGISTRY. (La résolution morpho auto viendra brancher decomposeWord.)
function composeText(tokens) {
  const cord = '<div style="width:16px;height:4px;background:#7a5c38;align-self:center;margin-top:-14px"></div>';
  // Nœud d'argile : le gauche (début) est plus gros = marque le début (canon T16).
  const knot = (debut) => `<div title="${debut ? 'début' : 'fin'}" style="width:${debut ? 24 : 16}px;height:${debut ? 24 : 16}px;border-radius:50%;background:#8a6a40;align-self:center;margin-top:-14px;box-shadow:inset -2px -2px 4px rgba(0,0,0,.45),0 1px 2px rgba(0,0,0,.4)"></div>`;
  const glyphs = tokens.map((tok, i) => {
    const g = GLYPHS[tok];
    const glyph = g ? svg(resolveEdges(g), 't' + i, 110) : `<div style="width:110px;height:110px;border:1px dashed #5a4226;color:#5a4226;display:flex;align-items:center;justify-content:center;font-size:11px">?${tok}</div>`;
    return `<div style="text-align:center"><div>${glyph}</div><div style="color:#7a6a4a;font-size:10px">${tok}</div></div>`;
  }).join(cord);
  return knot(true) + cord + glyphs + cord + knot(false);
}

function main() {
  const cell = (label, edges, uid) => `<div style="text-align:center;margin:18px">`
    + `<div>${svg(edges, uid)}</div>`
    + `<div style="color:#c9a86a;font-size:13px;margin-top:4px">${label}</div></div>`;
  // Bibliothèque d'atomes (les marques de base).
  const atomsView = Object.entries(ATOMS_LIB).map(([n, e], i) => cell(n, e, 'a' + i)).join('');
  // Registre : chaque concept résolu en glyphe (depuis ses atomes).
  const entries = Object.entries(GLYPHS);
  // VÉRIF DOUBLONS : deux concepts produisant le MÊME glyphe (mêmes edges normalisés) = collision.
  const sig = (edges) => edges.map(e => orient(e).join('|')).sort().join(';');
  const bySig = {};
  for (const [cf, g] of entries) { const s = sig(resolveEdges(g)); (bySig[s] = bySig[s] || []).push(cf + '=' + g.fr); }
  const dups = Object.values(bySig).filter(a => a.length > 1);
  console.log(dups.length ? '⚠ DOUBLONS (' + dups.length + ') : ' + dups.map(a => a.join('/')).join(' · ') : '✓ aucun doublon');
  const dupWarn = dups.length
    ? `<div style="background:#3a1a1a;color:#f0a0a0;padding:10px;text-align:center;border-radius:8px;margin:0 auto 14px;max-width:700px">⚠ ${dups.length} doublon(s) : ${dups.map(a => a.join(' = ')).join(' · ')}</div>`
    : `<div style="color:#7aa05a;text-align:center;margin-bottom:14px">✓ aucun doublon</div>`;
  // Revue GROUPÉE par type (validation par catégorie).
  const sectionOf = (...types) => entries.filter(([, g]) => types.includes(g.type))
    .map(([cf, g], i) => cell(cf + ' = ' + g.fr, resolveEdges(g), types[0] + i)).join('');
  const sec = (titre, contenu) => `<hr style="border-color:#3a2c1c;margin:22px 0">`
    + `<h3 style="color:#c9a86a;text-align:center">${titre}</h3>`
    + `<div style="display:flex;flex-wrap:wrap;justify-content:center">${contenu}</div>`;
  const collier = composeText(['va', 'naki', 'vo', 'ura', 'mirak', 'u']);
  const html = `<!doctype html><meta charset="utf-8"><body style="background:#15110c;font-family:system-ui;padding:30px">`
    + `<h2 style="color:#c9a86a;text-align:center">Glyphes du Gouffre — registre (${entries.length})</h2>`
    + dupWarn
    + `<div style="display:flex;justify-content:center;align-items:flex-start;background:#1c150d;padding:14px;border-radius:12px;margin:0 auto;max-width:fit-content">${collier}</div>`
    + sec('PARTICULES (9)', sectionOf('particule'))
    + sec('LIAISONS (16)', sectionOf('liaison'))
    + sec('Racines (échantillon, déjà composées)', sectionOf('racine', 'verbe'))
    + sec('Atomes (palette de marques)', atomsView)
    + `</body>`;
  const name = 'glyphes-font.html';
  fs.writeFileSync(path.join(__dirname, '..', 'public', name), html, 'utf-8');
  console.log(name);
}
main();
