/**
 * Proto Derivation - Lois d'évolution PROTO → ANCIEN (et la dé-évolution inverse).
 *
 * QUOI : encode l'intention de conception du proto-confluent comme un ensemble de LOIS de son
 *        + de structure. Le proto est l'ANCÊTRE de l'ancien : l'ancien a innové des sons et des
 *        structures que le proto n'avait pas. La fonction `deEvolveToProto` produit la forme
 *        proto (primitive) d'une forme ancien.
 *
 * POURQUOI : ni la doc ni l'ancien lexique proto ne faisaient foi — seule l'INTENTION (proto =
 *        ancêtre étymologique de l'ancien). En codifiant l'intention en lois, le lexique proto se
 *        DÉRIVE de l'ancien (socle validé) : cohérent par construction, étymologie garantie,
 *        re-générable. Les collisions (homophones) sont ASSUMÉES : une langue primitive a moins de
 *        distinctions, l'ancien les a créées en innovant ses sons.
 *
 * COMMENT — lois (direction ancien → proto, « dé-évolution ») :
 *   STRUCTURE : l'ancien ajoute une voyelle finale (racine CVCV) ; le proto est CVC → on tombe la
 *               voyelle finale. (L'ancien innove aussi liaisons + conjugaison ; le proto n'en a pas.)
 *   SONS innovés par l'ancien (le proto ne les avait pas) :
 *     u → o   (l'ancien a fait émerger la voyelle fermée u depuis o)
 *     v → p   (lénition inverse : l'ancien voise p en v)
 *     z → s   (l'ancien voise s en z)
 *     r → l   (l'ancien différencie la liquide l en r)
 *     d → t   (l'ancien voise t en d ; d n'existe en ancien que dans les nombres)
 *   Résultat : proto sur 4 voyelles (a e i o) + 8 consonnes (b k l m n p s t).
 */

'use strict';

// Lois de son ancien → proto (sons innovés par l'ancien, défaits pour retrouver le proto).
const SOUND_LAWS = { u: 'o', v: 'p', z: 's', r: 'l', d: 't' };

// Inventaire phonotactique du proto (résultat des lois) — sert à documenter/valider.
const PROTO_CONSONNES = ['b', 'k', 'l', 'm', 'n', 'p', 's', 't'];
const PROTO_VOYELLES = ['a', 'e', 'i', 'o'];

/**
 * Dé-évolue une forme ANCIEN vers sa forme PROTO (ancêtre primitif).
 *
 * @param {string} ancienForm - forme/racine en ancien-confluent
 * @returns {string} - forme proto (4V/8C)
 */
function deEvolveToProto(ancienForm) {
  let w = String(ancienForm || '').toLowerCase().trim();
  if (!w) return '';
  // 1. STRUCTURE : tomber la voyelle finale (l'ancien l'a ajoutée à la racine CVC du proto).
  if (/[aeiou]$/.test(w) && w.length > 2) w = w.slice(0, -1);
  // 2. SONS : défaire les innovations de l'ancien.
  w = w.split('').map(c => SOUND_LAWS[c] || c).join('');
  return w;
}

module.exports = { deEvolveToProto, SOUND_LAWS, PROTO_CONSONNES, PROTO_VOYELLES };
