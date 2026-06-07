// CRÉE de nouveaux glyphes (fr/type depuis le lexique si trouvés). 1re forme libre (raster).
// Usage: node _new.js '{"miki":[["figure","point"]], "k":[["jambe"]]}'
const fs = require('fs'), path = require('path'), p = 'data/glyphes-anciens.json';
const d = JSON.parse(fs.readFileSync(p, 'utf8')); const G = d.glyphes, A = d.atomes;
const { NODES } = require('../src/core/ecriture/glyphRenderer');
const { loadAllLexiques } = require('../src/utils/lexiqueLoader');
const { ancien } = loadAllLexiques(path.join(__dirname, '..', '..'));
// Index confluent → {fr,type} depuis le lexique.
const info = {};
for (const e of Object.values(ancien.dictionnaire)) for (const t of (e.traductions || [])) if (t.confluent && !info[t.confluent]) info[t.confluent] = { fr: e.mot_francais || t.confluent, type: t.type || 'racine' };
const res = ed => ed.flatMap(a => A[a] || []);
const resG = g => [].concat((g.atomes || []).flatMap(a => A[a] || []), g.edges || []);
const R = 9, STEP = 3;
function sig(edges) {
  const F = new Set();
  const mk = (x, y) => { for (let gx = Math.floor((x - R) / STEP) * STEP; gx <= x + R; gx += STEP) for (let gy = Math.floor((y - R) / STEP) * STEP; gy <= y + R; gy += STEP) if ((gx - x) ** 2 + (gy - y) ** 2 <= R * R) F.add(gx + ',' + gy); };
  for (const e of edges) { const [a, b] = e, [x1, y1] = NODES[a], [x2, y2] = NODES[b]; if (a === b) { mk(x1, y1); continue; } if (e.length === 3) { const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, cx = mx - dy / L * e[2], cy = my + dx / L * e[2]; for (let t = 0; t <= 1; t += 0.05) { const u = 1 - t; mk(u * u * x1 + 2 * u * t * cx + t * t * x2, u * u * y1 + 2 * u * t * cy + t * t * y2); } } else { for (let t = 0; t <= 1; t += 0.04) mk(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t); } }
  return [...F].sort().join(';');
}
const used = new Set(); for (const g of Object.values(G)) used.add(sig(resG(g)));
const assign = JSON.parse(process.argv[2] || '{}');
const out = [], fail = [];
for (const k in assign) {
  let picked = null;
  for (const c of assign[k]) { const s = sig(res(c)); if (!used.has(s)) { picked = c; used.add(s); break; } }
  if (picked) { const i = info[k] || { fr: k, type: 'suffixe' }; G[k] = { fr: i.fr, type: i.type, atomes: picked }; out.push(k + '(' + i.fr + ')=' + picked.join('+')); }
  else fail.push(k);
}
fs.writeFileSync(p, JSON.stringify(d, null, 2));
console.log('CRÉÉS: ' + out.join(' · '));
if (fail.length) console.log('ÉCHEC: ' + fail.join(' · '));
