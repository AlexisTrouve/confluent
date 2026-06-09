/**
 * Eras - Registre des ÈRES (strates temporelles) de la langue Confluent.
 *
 * QUOI : définit, pour chaque ère (proto / ancien / mythologique), TOUTES ses règles propres :
 *        alphabet phonotactique, liaisons, conjugateurs, particules, dossier lexique, prompt.
 *
 * POURQUOI : le translator était codé en dur pour l'ANCIEN (gate 10C/5V, liaisons/conjugateurs
 *        via require figé de data/lexique.json). Or proto = 8C/4V sans liaisons, et le mythologique
 *        activera y/é/è. Pour que chaque ère soit traduite correctement — et que le mythologique
 *        s'y branche comme « une ère de plus » — toutes les briques (gate, morpho, outils) doivent
 *        être PARAMÉTRÉES par l'ère. Ce registre est la source unique de ces paramètres.
 *
 * COMMENT : objet ERAS[id] = config complète. L'ancien tire sa grammaire de data/lexique.json
 *        (source de vérité existante) ; le proto la définit inline (petite, stable) ; le
 *        mythologique étend l'ancien (stub à compléter au moment de sa conception).
 */

'use strict';

// Grammaire de l'ancien : source de vérité existante (liaisons, conjugateurs, particules, pronoms…).
const ancienGrammar = require('../../../../data/lexique.json');

// Aplatit {code:{sens,...}} → {code: glose} (pour exposer une grammaire homogène par ère).
function flatGloss(obj) {
  if (!obj) return {};
  return Object.fromEntries(Object.entries(obj).map(([k, v]) =>
    [k, typeof v === 'string' ? v : (v.sens || v.concept || v.description || '')]));
}

// Aplatit les conjugateurs (temps/aspects/modes/évidentiel) en LISTE de codes (pour la morpho).
function conjCodes(conjugateurs) {
  const out = [];
  for (const groupe of Object.values(conjugateurs || {})) {
    if (groupe && typeof groupe === 'object') out.push(...Object.keys(groupe));
    else if (typeof groupe === 'string') out.push(groupe);
  }
  return out;
}
// Suffixes d'infinitif de l'ancien (racine → verbe), stables — utilisés par radicalMatcher.
const ANCIEN_INFINITIF_SUFFIXES = ['k', 's', 'n', 'm', 'ak', 'vik', 'an'];

// ============================================================================
// PROTO-CONFLUENT — langue primitive (avant les liaisons et la conjugaison)
// ============================================================================
const PROTO = {
  id: 'proto',
  label: 'Proto-Confluent',
  // Phonotactique : 4 voyelles, 8 consonnes. PAS de u, v, z (apparus plus tard).
  consonnes: ['b', 'k', 'l', 'm', 'n', 'p', 's', 't'],
  voyelles: ['a', 'e', 'i', 'o'],
  tolerees: [],                                        // pas de r/d (l'ancien les a innovés)
  reservees: ['u', 'v', 'z', 'r', 'd', 'y', 'é', 'è'], // sons innovés par l'ancien, absents du proto primitif
  // Morphologie : aucune (mots isolés, pas de fusion).
  hasLiaisons: false,
  liaisons: {},
  conjugateurs: {},                          // présent implicite uniquement
  conjugateurCodes: [],
  verbalSuffixes: [],
  // Particules POST-posées (≠ ancien qui les antépose).
  particulePosition: 'after',
  particules: { na: 'sujet', no: 'objet direct', ni: 'direction/but', ne: 'origine', si: 'pluriel', so: 'négation', ka: 'question' },
  interrogatifs: { ki: 'qui', ke: 'quoi', ko: 'où' },
  lexiqueDir: 'proto-confluent/lexique',
  systemPrompt: 'proto-system.txt',
  grammarData: null
};

// ============================================================================
// ANCIEN-CONFLUENT — langue unifiée (liaisons sacrées + conjugaison complète)
// ============================================================================
const ANCIEN = {
  id: 'ancien',
  label: 'Ancien Confluent',
  // 10 consonnes + r/d tolérés (racines anciennes / nombres) ; 5 voyelles ; y/é/è réservés.
  consonnes: ['b', 'k', 'l', 'm', 'n', 'p', 's', 't', 'v', 'z'],
  voyelles: ['a', 'e', 'i', 'o', 'u'],
  tolerees: ['r', 'd'],
  reservees: ['y', 'é', 'è'],
  hasLiaisons: true,
  liaisons: ancienGrammar.liaisons || {},                 // 16 liaisons sacrées
  conjugateurs: ancienGrammar.conjugateurs || {},          // temps/aspects/modes/évidentiel
  conjugateurCodes: conjCodes(ancienGrammar.conjugateurs),
  verbalSuffixes: [...conjCodes(ancienGrammar.conjugateurs), ...ANCIEN_INFINITIF_SUFFIXES],
  particulePosition: 'before',
  particules: { va: 'sujet', vo: 'objet direct', vi: 'direction', ve: 'origine', vu: 'instrument', na: 'possession', ni: 'bénéficiaire', no: 'lieu', su: 'pluriel (après)' },
  interrogatifs: { ki: 'qui', ke: 'quoi', ko: 'où', ku: 'quand' },
  lexiqueDir: 'ancien-confluent/lexique',
  systemPrompt: 'ancien-system.txt',
  grammarData: ancienGrammar
};

// ============================================================================
// MYTHOLOGIQUE — strate sacrée supérieure (le « Confluent mythologique »).
//
// QUOI : registre HAUT/poétique de l'ancien, dédié à la transcréation des textes sacrés
//        (Livre de la Foi : chants de la Création / de l'Éveil). N'est PAS une langue distincte :
//        c'est l'ancien DIVERSIFIÉ vers le haut — il en hérite TOUTE la grammaire et TOUT le
//        lexique, puis ACTIVE les voyelles réservées y/é/è (registre archaïque/rituel, prévu en
//        doc phono) et SUPERPOSE une strate sacrée (le Vide, l'Éveilleur, la Veille, les sœurs…).
//
// POURQUOI : les chants parlent d'un registre que l'ancien quotidien ne porte pas (cosmogonie,
//        noms divins, subordination poétique). Plutôt qu'une langue parallèle (duplication, dérive),
//        on en fait une ÈRE qui hérite l'ancien (`...ANCIEN`) — toute amélioration de l'ancien
//        profite au mythologique, et le gate/les outils s'y branchent sans code spécial.
//
// COMMENT : `...ANCIEN` apporte liaisons/conjugateurs/particules/pronoms. On change seulement :
//        (1) `voyelles` += y/é/è et `reservees` = [] (la strate sacrée a le droit de les employer) ;
//        (2) `lexiqueDir` → dossier sacré PROPRE, chargé EN OVERLAY de l'ancien (cf. lexiqueLoader) ;
//        (3) `systemPrompt` → prompt sacré dédié. La grammaire de subordination/relatives (vraie
//        question ouverte que les chants forcent) n'est PAS figée ici : on la laisse émerger des
//        transcréations (révélation des trous) avant de l'arrêter — d'où `seed: true`.
// ============================================================================
const MYTHOLOGIQUE = {
  ...ANCIEN,
  id: 'mythologique',
  label: 'Confluent mythologique',
  voyelles: ['a', 'e', 'i', 'o', 'u', 'y', 'é', 'è'], // voyelles sacrées activées (registre haut)
  reservees: [],                                       // plus rien d'interdit dans le sacré
  lexiqueDir: 'mythologique-confluent/lexique',        // strate sacrée DÉDIÉE (overlay sur l'ancien)
  systemPrompt: 'mythologique-system.txt',             // prompt sacré dédié
  seed: true                                           // amorce : lexique sacré + grammaire en cours de spécification
};

const ERAS = { proto: PROTO, ancien: ANCIEN, mythologique: MYTHOLOGIQUE };

/**
 * Renvoie la config d'une ère, ANCIEN par défaut (compat : un appelant sans ère reste valide).
 * @param {string} [id]
 * @returns {Object} config d'ère
 */
function getEra(id) {
  return ERAS[id] || ANCIEN;
}

module.exports = { ERAS, getEra, PROTO, ANCIEN, MYTHOLOGIQUE, flatGloss };
