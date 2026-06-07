// Re-clé les verbes glyphés-en-entier vers leur RACINE (verbe = racine + suffixe). dev only.
const fs = require('fs'), path = require('path'), p = 'data/glyphes-anciens.json';
const d = JSON.parse(fs.readFileSync(p, 'utf8')); const G = d.glyphes;
const { loadAllLexiques } = require('../src/utils/lexiqueLoader');
const { extractRadicals } = require('../src/core/morphology/radicalMatcher');
const { ANCIEN } = require('../src/core/eras/eras');
const { ancien } = loadAllLexiques(path.join(__dirname, '..', '..'));
// racine déclarée par mot + ensemble des racines connues (pour valider une dérivation).
const racineOf = {}, rootSet = new Set();
for (const e of Object.values(ancien.dictionnaire)) for (const t of (e.traductions || [])) {
  if (t.confluent && t.racine && !racineOf[t.confluent]) racineOf[t.confluent] = t.racine;
  if (t.type === 'racine' || t.type === 'racine_sacree') rootSet.add(t.confluent);
  if (t.racine) rootSet.add(t.racine); if (t.forme_liee) rootSet.add(t.forme_liee);
}
const valid = R => rootSet.has(R) || G[R];
let moved = 0, del = 0;
for (const k of Object.keys(G)) {
  const g = G[k]; if (g.type !== 'verbe' && g.type !== 'verbe_irregulier') continue;
  let R = racineOf[k];
  if (!R) { const c = (extractRadicals(k, ANCIEN.verbalSuffixes, ANCIEN.conjugateurCodes) || []).find(r => r.type === 'infinitif' && valid(r.radical)); if (c) R = c.radical; }
  if (!R || R === k || !valid(R)) continue;
  if (G[R]) { delete G[k]; del++; }                                    // racine déjà glyphée → le verbe se décompose
  else { G[R] = Object.assign({ fr: g.fr, type: 'racine' }, g.atomes ? { atomes: g.atomes } : { edges: g.edges }); delete G[k]; moved++; } // déplace la forme vers la racine
}
fs.writeFileSync(p, JSON.stringify(d, null, 2));
console.log('verbes → racine : déplacés', moved, '| supprimés (racine déjà là)', del);
