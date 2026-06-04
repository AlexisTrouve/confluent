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
 *   - chaque trait = BOUDIN d'argile en relief = 3 traits superposés : ombre (#4a3416, +épais, +0.6/+2),
 *     corps (#bf9c60), crête éclairée (#e9d3a4, fin, -0.6/-1.4). Boudins ÉPAIS (stroke-width ~14).
 *   - dessiné PAR COUCHES (toutes les ombres, puis tous les corps, puis toutes les crêtes) -> les
 *     jonctions FUSIONNENT au lieu de se couper (clé : ne PAS dessiner boudin par boudin).
 *   - filtre #rough (turbulence + displacement) = bords d'argile qui ondulent ; #grain = impuretés.
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
  eau:  [['w', 'e', -13], ['w', 'e', 13]],          // double onde
  feu:  [['s', 'n'], ['n', 'ne'], ['n', 'nw']],     // axe montant + couronne
  oeil: [['w', 'e', -15], ['w', 'e', 15]],          // lentille
  lien: [['nw', 'se'], ['ne', 'sw']],               // croix
  ciel: [['nw', 'n'], ['n', 'ne']],                 // voûte
  terre:[['sw', 'se'], ['w', 'e']],                 // double base
};

// Défs : bruit/impuretés (déplacement organique + grain) pour le mode argile.
function defs() {
  return `<defs>
  <filter id="rough" x="-20%" y="-20%" width="140%" height="140%">
    <feTurbulence type="fractalNoise" baseFrequency="0.035 0.045" numOctaves="2" seed="3" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="10" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
  <filter id="clayrope" x="-40%" y="-40%" width="180%" height="180%">
    <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="4" result="nz"/>
    <feDisplacementMap in="SourceGraphic" in2="nz" scale="5" result="src"/>
    <feGaussianBlur in="src" stdDeviation="3" result="blur"/>
    <feSpecularLighting in="blur" surfaceScale="5" specularConstant="0.85" specularExponent="16" lighting-color="#fff3d8" result="spec">
      <feDistantLight azimuth="225" elevation="58"/>
    </feSpecularLighting>
    <feComposite in="spec" in2="src" operator="in" result="specClip"/>
    <feMerge><feMergeNode in="src"/><feMergeNode in="specClip"/></feMerge>
  </filter>
  <filter id="grain" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" seed="11" result="g"/>
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

// Glyphe d'un seul tenant, dessiné PAR COUCHES (toutes les ombres, puis corps, puis crêtes) :
// les jonctions fusionnent au lieu de se couper.
function strokes(atomNames, w) {
  const paths = connect(atomNames.flatMap(nm => ATOMS[nm] || [])).map(e => edgePath(orient(e)));
  const cap = `stroke-linecap="round" stroke-linejoin="round" fill="none"`;
  const layer = (color, sw, dx, dy) =>
    `<g transform="translate(${dx},${dy})">` + paths.map(d => `<path d="${d}" stroke="${color}" stroke-width="${sw}" ${cap}/>`).join('') + `</g>`;
  return layer('#4a3416', w + 4, 0.6, 2)      // ombre (toutes)
    + layer('#bf9c60', w, 0, 0)               // corps (tous)
    + layer('#e9d3a4', w * 0.42, -0.6, -1.4); // crête (toutes)
}

function svg(atoms) {
  const bg = `<rect width="${U}" height="${U}" fill="#1c150d"/>`;
  const ropes = `<g filter="url(#rough)">${strokes(atoms, 14)}</g>`;
  const grain = `<rect width="${U}" height="${U}" fill="#000" filter="url(#grain)" opacity="0.5"/>`;
  return `<svg viewBox="0 0 ${U} ${U}" width="180" height="180">${defs()}${bg}${ropes}${grain}</svg>`;
}

function main() {
  const items = [
    ['eau', ['eau']], ['regard = œil', ['oeil']], ['pleurer = œil+eau', ['oeil', 'eau']],
    ['feu', ['feu']], ['ciel', ['ciel']], ['monde = ciel+terre', ['ciel', 'terre']],
    ['union = lien', ['lien']], ['source = eau+terre', ['eau', 'terre']],
  ];
  const cell = (label, atoms) => `<div style="text-align:center;margin:10px">`
    + `<div>${svg(atoms)}</div>`
    + `<div style="color:#c9a86a;font-size:13px;margin-top:4px">${label}</div></div>`;
  const html = `<!doctype html><meta charset="utf-8"><body style="background:#15110c;font-family:system-ui;padding:30px">`
    + `<h2 style="color:#c9a86a;text-align:center">Glyphes stroke-based — propre (clair) + argile (bruité)</h2>`
    + `<div style="display:flex;flex-wrap:wrap;justify-content:center">${items.map(([l, a]) => cell(l, a)).join('')}</div></body>`;
  const name = 'glyphes-font.html';
  fs.writeFileSync(path.join(__dirname, '..', 'public', name), html, 'utf-8');
  console.log(name);
}
main();
