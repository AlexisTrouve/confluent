// Assigne des formes à des glyphes + valide les collisions (raster). Usage: node _set.js '{"kari":["carre"]}'
const fs = require('fs'), p = 'data/glyphes-anciens.json';
const d = JSON.parse(fs.readFileSync(p, 'utf8')); const G = d.glyphes, A = d.atomes;
const { NODES } = require('../src/core/ecriture/glyphRenderer');
const res = g => [].concat((g.atomes || []).flatMap(a => A[a] || []), g.edges || []);
const R = 9, STEP = 3;
function sig(edges) {
  const F = new Set();
  const mk = (x, y) => { for (let gx = Math.floor((x - R) / STEP) * STEP; gx <= x + R; gx += STEP) for (let gy = Math.floor((y - R) / STEP) * STEP; gy <= y + R; gy += STEP) if ((gx - x) ** 2 + (gy - y) ** 2 <= R * R) F.add(gx + ',' + gy); };
  for (const e of edges) { const [a, b] = e, [x1, y1] = NODES[a], [x2, y2] = NODES[b]; if (a === b) { mk(x1, y1); continue; } if (e.length === 3) { const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, cx = mx - dy / L * e[2], cy = my + dx / L * e[2]; for (let t = 0; t <= 1; t += 0.05) { const u = 1 - t; mk(u * u * x1 + 2 * u * t * cx + t * t * x2, u * u * y1 + 2 * u * t * cy + t * t * y2); } } else { for (let t = 0; t <= 1; t += 0.04) mk(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t); } }
  return [...F].sort().join(';');
}
const assign = JSON.parse(process.argv[2] || '{}');
for (const k in assign) { if (!G[k]) { console.log('!! inconnu', k); continue; } for (const a of assign[k]) if (!A[a]) console.log('!! atome inconnu', a); G[k] = { fr: G[k].fr, type: G[k].type, atomes: assign[k] }; }
fs.writeFileSync(p, JSON.stringify(d, null, 2));
const by = {}; for (const [k, g] of Object.entries(G)) { if (g._todo) continue; (by[sig(res(g))] = by[sig(res(g))] || []).push(k); }
const probs = new Set();
for (const k of Object.keys(assign)) { const grp = by[sig(res(G[k]))]; if (grp.length > 1) probs.add(grp.map(x => x + '(' + G[x].fr + ')').join('=')); }
console.log(probs.size ? 'COLLISION: ' + [...probs].join(' · ') : 'ok — ' + Object.keys(assign).length + ' assignés, 0 collision');
