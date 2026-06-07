// Auto-déconfliction : re-forme les glyphes en doublon (raster) avec des FORMES CLAIRES (dev only).
const fs = require('fs'), p = 'data/glyphes-anciens.json';
const d = JSON.parse(fs.readFileSync(p, 'utf8')); const G = d.glyphes, A = d.atomes;
const { NODES } = require('../src/core/ecriture/glyphRenderer');
const res = g => [].concat((g.atomes || []).flatMap(a => A[a] || []), g.edges || []);
const R = 9, STEP = 3;
function sig(edges) {
  const F = new Set();
  const mark = (x, y) => { for (let gx = Math.floor((x - R) / STEP) * STEP; gx <= x + R; gx += STEP) for (let gy = Math.floor((y - R) / STEP) * STEP; gy <= y + R; gy += STEP) if ((gx - x) ** 2 + (gy - y) ** 2 <= R * R) F.add(gx + ',' + gy); };
  for (const e of edges) {
    const [a, b] = e, [x1, y1] = NODES[a], [x2, y2] = NODES[b];
    if (a === b) { mark(x1, y1); continue; }
    if (e.length === 3) { const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, cx = mx - dy / L * e[2], cy = my + dx / L * e[2]; for (let t = 0; t <= 1; t += 0.05) { const u = 1 - t, px = u * u * x1 + 2 * u * t * cx + t * t * x2, py = u * u * y1 + 2 * u * t * cy + t * t * y2; mark(px, py); } }
    else { for (let t = 0; t <= 1; t += 0.04) mark(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t); }
  }
  return [...F].sort().join(';');
}
// Groupes de doublons + cibles à re-former (on garde le 1er de chaque groupe comme base).
const by = {}; for (const [k, g] of Object.entries(G)) (by[sig(res(g))] = by[sig(res(g))] || []).push(k);
const groups = Object.values(by).filter(a => a.length > 1);
const targets = []; for (const grp of groups) for (let i = 1; i < grp.length; i++) targets.push(grp[i]);
const tset = new Set(targets);
const used = new Set(); for (const [k, g] of Object.entries(G)) if (!tset.has(k)) used.add(sig(res(g)));
// Palette de FORMES CLAIRES (singles d'abord, puis forme + marque visible).
const SINGLES = ['anneau', 'carre', 'triangle', 'losange', 'croix', 'plus', 'chevron', 'chevroni', 'tick', 'flechehd', 'demicercleh', 'coeurV', 'voute', 'mainY', 'maison', 'figure', 'fleche', 'vague', 'oeil', 'goutte'];
const MARKS = ['point', 'traitV', 'traitH', 'tirethaut', 'tiretdiag', 'jambe', 'tick'];
const FORMS = ['carre', 'losange', 'triangle', 'anneau', 'chevron', 'croix', 'demicercleh', 'coeurV', 'maison', 'oeil', 'plus'];
const cands = SINGLES.map(s => [s]);
for (const f of FORMS) for (const m of MARKS) cands.push([f, m]);
// + combos FORME + FORME (deux formes claires superposées) pour élargir l'espace.
const FORMS2 = ['carre', 'losange', 'triangle', 'anneau', 'chevron', 'chevroni', 'croix', 'plus', 'tick', 'demicercleh', 'coeurV', 'voute', 'mainY', 'flechehd', 'maison'];
for (const f1 of FORMS2) for (const f2 of FORMS2) if (f1 < f2) cands.push([f1, f2]);
// Assignation : 1re forme dont la sig rasterisée est libre.
let done = 0; const fail = [];
for (const k of targets) {
  let ok = false;
  for (const c of cands) { const s = sig(c.flatMap(a => A[a] || [])); if (!used.has(s)) { G[k] = { fr: G[k].fr, type: G[k].type, atomes: c.slice() }; used.add(s); done++; ok = true; break; } }
  if (!ok) fail.push(k);
}
fs.writeFileSync(p, JSON.stringify(d, null, 2));
const by2 = {}; for (const [k, g] of Object.entries(G)) (by2[sig(res(g))] = by2[sig(res(g))] || []).push(k);
const rem = Object.values(by2).filter(a => a.length > 1);
console.log('cibles:', targets.length, '| reformés:', done, '| échecs:', fail.length, '| DOUBLONS restants:', rem.length);
if (rem.length) console.log(rem.map(a => a.join('=')).join(' · '));
if (fail.length) console.log('échecs:', fail.join(', '));
