/**
 * scan-tiroirs — détecte les VRAIS mots-tiroir (une forme Confluent → N concepts FR DISTINCTS).
 *
 * QUOI : `node scripts/scan-tiroirs.js [ancien|mythologique] [--all]` → liste les formes Confluent
 *        mappées à >=2 GROUPES-CONCEPTS distincts (pas juste >=2 gloses FR). C'est le « check vite fait »
 *        de complétude de la diversification.
 * POURQUOI : le reverse-map naïf compte chaque conjugaison (pense/penses/pensent) et chaque synonyme
 *        (mur/paroi/cloison) comme un « concept » → ~95% de faux positifs. Ici on neutralise le bruit
 *        SANS thésaurus, en réutilisant le regroupement DÉJÀ présent dans le lexique.
 * COMMENT : union-find sur les mots FR — chaque entrée du dictionnaire pose {clé} ∪ {synonymes_fr} comme
 *        un même groupe (les synonymes ET les conjugaisons y vivent ensemble). Puis reverse :
 *        forme Confluent → set de GROUPES qu'elle traduit. Une forme touchant >=2 groupes = candidat
 *        tiroir réel. On exclut la grammaire et (par défaut) les formes déjà diversifiées.
 */
'use strict';
const path = require('path');
const { loadAllLexiques } = require('../src/utils/lexiqueLoader');

const variant = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ancien';
const showAll = process.argv.includes('--all'); // --all : n'exclut pas les formes déjà traitées

// Normalise un mot FR (clé ou synonyme) en nœud d'union-find : minuscule, sans article/pronom de tête.
function norm(fr) {
  return String(fr).toLowerCase().trim()
    .replace(/^(l'|d'|j'|s'|n'|qu'|le |la |les |un |une |se |il y a|y a-t-il|à |de |des )/, '')
    .trim();
}

// Union-Find
const parent = {};
function find(x) { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; }
function union(a, b) { parent[a] = parent[a] || a; parent[b] = parent[b] || b; parent[find(a)] = find(b); }

const dict = loadAllLexiques(path.join(__dirname, '..', '..'))[variant].dictionnaire;

// 1. Construire les groupes-concepts : tous les mots FR d'une même entrée sont synonymes → unionnés.
for (const [key, entry] of Object.entries(dict)) {
  if (key.startsWith('_')) continue;
  const words = [norm(key), ...((entry.synonymes_fr || []).map(norm))].filter(Boolean);
  for (const w of words) { parent[w] = parent[w] || w; }
  for (let i = 1; i < words.length; i++) union(words[0], words[i]);
}

// 1bis. Fusionne singulier/pluriel (côte/côtes, sœur/sœurs) qui vivent dans des entrées séparées.
for (const w of Object.keys(parent)) {
  if (w.length > 3 && w.endsWith('s')) {
    const sg = w.slice(0, -1), sg2 = w.endsWith('es') ? w.slice(0, -2) : null;
    if (parent[sg]) union(w, sg);
    if (sg2 && parent[sg2]) union(w, sg2);
  }
}

// 2. Reverse : forme Confluent → set de groupes-concepts (racine d'union-find).
const formToGroups = {};
for (const [key, entry] of Object.entries(dict)) {
  if (key.startsWith('_')) continue;
  const g = find(norm(key));
  for (const t of (entry.traductions || [])) {
    if (t.type === 'nom_propre') continue;            // exclure noms propres (castes, lieux, peuples)
    const cf = (t.confluent || '').toLowerCase().trim();
    if (!cf || norm(key) === cf) continue;            // exclure l'auto-référence (clé FR == forme Confluent)
    (formToGroups[cf] = formToGroups[cf] || new Map()).set(g, norm(key));
  }
}

// Grammaire + formes déjà diversifiées (à exclure du signal).
const grammar = new Set(['na', 'onu', 'no', 'ko', 'va', 'vo', 'oni', 'se', 'lo', 'zo', 'ki', 'ta', 'vi', 've', 'at', 'u', 'ok', 'isu', 'alo', 'iko', 'oolu', 'tovasu', 'ze', 'zom', 'euma', 'uila', 'aila', 'oubo', 'ikuat', 'ikuok', 'oape', 'polas', 'miki', 'sinu', 'tani', 'tanisu', 'oolu']);
const handled = new Set(['mirak', 'sili', 'sekam', 'silumi', 'tuvak', 'mevak', 'venat', 'motak', 'lozak', 'kavuno', 'limava', 'vèluk', 'silimori', 'morisili', 'konu', 'velakonu', 'konusupu', 'konuvaru', 'konuleku', 'vosak', 'savuvosak', 'morivosak', 'sumak', 'nekan', 'savunekan', 'tovak', 'tuli', 'tokituli', 'tisatuli', 'buka', 'sukibuka', 'aitabuka', 'vasibuka', 'samo', 'kosam', 'samoèva', 'zeru', 'veluzeru', 'ena', 'enasoku', 'zoka', 'zokasili', 'mukazoka', 'savuzoka', 'taku', 'takusili', 'paka', 'selu', 'seluvela', 'selukumu', 'kasi', 'silikasi', 'kasiuaita', 'nutu', 'muki', 'kotamuki', 'kova', 'kovamori', 'silikova', 'teki', 'urateki', 'vukuteki', 'tekiota', 'isukibuka', 'lupak', 'mukak', 'mulik', 'ita', 'suvak', 'ota', 'silenu']);

const cand = Object.entries(formToGroups)
  .map(([cf, m]) => [cf, [...m.values()]])
  .filter(([cf, groups]) => groups.length >= 2 && !grammar.has(cf) && (showAll || !handled.has(cf)))
  .sort((a, b) => b[1].length - a[1].length);

console.log(`\n=== TIROIRS RÉELS (forme → >=2 concepts distincts) — ère ${variant}${showAll ? ' [--all]' : ' (hors déjà traités)'} ===`);
console.log(`${cand.length} forme(s) :\n`);
for (const [cf, groups] of cand) console.log(`${cf.padEnd(14)}(${groups.length}) ${groups.join(' | ')}`);
