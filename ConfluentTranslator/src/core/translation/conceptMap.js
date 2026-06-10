/**
 * conceptMap — génère la CARTE COMPACTE des sens natifs, par famille, pour le system prompt.
 *
 * QUOI : `buildConceptMap(lexique)` → une chaîne « famille : forme=label · forme=label … » couvrant tous les
 *        sens diversifiés (champ `famille` posé sur les entrées). Donnée une fois au LLM (cachée par le proxy).
 * POURQUOI : le lookup mot-à-mot rate les déclinaisons multi-mots (osiieku « montée en étoile »). Plutôt qu'une
 *        détection lexicale fragile (cf. POC : 50% recall, faux positifs), on rend le LLM CONSCIENT de toute la
 *        palette et on le laisse faire le matching sémantique (prouvé : avec la carte, il emploie osiieku/aitameva/
 *        osieva/sukimil ; sans, il compose mot-à-mot ou retombe sur du français).
 * COMMENT : 1. dédoublonne par forme (le loader crée une clé par synonyme) ; 2. label = la clé FR la plus courte ;
 *        3. groupe par `famille` ; 4. familles ordonnées (ORDRE), `divers` en dernier ; 5. rendu compact.
 */
'use strict';

const path = require('path');
const { loadAllLexiques } = require('../../utils/lexiqueLoader');

// Ordre de présentation des familles (les axes cardinaux d'abord) ; toute famille absente d'ici suit, divers en dernier.
const ORDRE = ['mort', 'ancetre', 'memoire', 'nom', 'feu', 'eclat', 'veille', 'regard', 'signe', 'serment',
  'sang', 'transmettre', 'souillure', 'pierre', 'eau', 'lieu', 'masque', 'fete', 'cosmos', 'divers'];

function buildConceptMap(lexique) {
  const dict = (lexique && lexique.dictionnaire) || {};
  // 1. confluent → { labels(clés FR), famille } ; dédoublonne les clés-synonymes générées au load
  const byForm = {};
  for (const [key, e] of Object.entries(dict)) {
    if (key.startsWith('_')) continue;
    const t = (e.traductions || [])[0] || {};
    if (!t.confluent || !t.famille) continue;  // seules les entrées taguées entrent dans la carte
    (byForm[t.confluent] || (byForm[t.confluent] = { labels: new Set(), famille: t.famille })).labels.add(key);
  }
  // 2-3. label le plus court par forme, regroupé par famille
  const fams = {};
  for (const [conf, rec] of Object.entries(byForm)) {
    const label = [...rec.labels].sort((a, b) => a.length - b.length)[0];
    (fams[rec.famille] || (fams[rec.famille] = [])).push(`${conf}=${label}`);
  }
  // 4-5. ordre stable + rendu
  const noms = Object.keys(fams).sort((a, b) => {
    const ia = ORDRE.indexOf(a), ib = ORDRE.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  return noms.map(f => `${f} : ${fams[f].sort().join(' · ')}`).join('\n');
}

/**
 * getConceptMap — carte d'une ère, construite une fois puis mise en cache.
 * QUOI : `getConceptMap('ancien'|'mythologique'|'proto')` → la chaîne de carte (vide si rien de tagué).
 * POURQUOI : la carte est STATIQUE au runtime (le lexique ne bouge pas hors /api/reload) ⇒ on la calcule une
 *        seule fois par ère et on la sert depuis le cache (zéro coût par traduction).
 * COMMENT : charge les lexiques (root = confluent/) à la première demande de l'ère, bâtit, mémorise. En cas
 *        d'erreur de chargement on renvoie '' (échec franc et silencieux côté carte, le prompt reste valide).
 */
const _mapCache = {};
function getConceptMap(variant) {
  if (variant in _mapCache) return _mapCache[variant];
  let map = '';
  try {
    const root = path.join(__dirname, '..', '..', '..', '..'); // → racine confluent/
    const lex = loadAllLexiques(root)[variant];
    map = lex ? buildConceptMap(lex) : '';
  } catch (_) { map = ''; }
  _mapCache[variant] = map;
  return map;
}

module.exports = { buildConceptMap, getConceptMap };
