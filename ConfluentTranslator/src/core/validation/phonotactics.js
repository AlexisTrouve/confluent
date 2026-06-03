/**
 * Phonotactics - Validateur déterministe des formes Confluent
 *
 * QUOI : valide qu'un mot Confluent respecte les règles de combinaison de la langue.
 *        C'est le GATE dur de l'agent de traduction : aucune forme invalide ne doit
 *        sortir de la boucle. Fonction pure, sans dépendance lexique.
 *
 * POURQUOI : une "simple request" LLM produit des formes cassées (clusters illégaux comme
 *        `tbime`, `lnosu`) sans aucun garde-fou. Une auto-vérification dans le prompt n'est
 *        qu'une AFFIRMATION du modèle ; ce module est la vérification VÉRIFIABLE qui transforme
 *        la promesse en garantie. Il porte en JS la même logique que `audit-coherence.py`
 *        (section A : phonotactique) pour que prompt, audit et runtime partagent UNE vérité.
 *
 * COMMENT : 3 règles universelles qui suffisent à attraper tous les bugs observés :
 *        1. alphabet autorisé uniquement (voyelles réservées y/é/è interdites) ;
 *        2. jamais 2 consonnes en attaque de mot ;
 *        3. jamais 3 consonnes consécutives n'importe où.
 *        r/d sont TOLÉRÉS au niveau phonotactique (ils existent dans des racines anciennes/
 *        nombres) ; empêcher d'en INVENTER de nouveaux relève de l'ancrage lexique (outils
 *        lookup/compose), pas de ce gate.
 */

'use strict';

// QUOI : alphabet actif du Confluent.
// POURQUOI : tout caractère hors de ces ensembles (hors voyelles réservées/exceptions) est illégal.
// COMMENT : 10 consonnes standard + r/d tolérés ; 5 voyelles actives.
const CONSONNES = new Set(['b', 'k', 'l', 'm', 'n', 'p', 's', 't', 'v', 'z', 'r', 'd']);
const VOYELLES = new Set(['a', 'e', 'i', 'o', 'u']);
// Voyelles réservées à l'expansion future : leur présence dans une forme active = erreur.
const VOYELLES_RESERVEES = new Set(['y', 'é', 'è', 'ê', 'à', 'ù', 'ô', 'î', 'â']);

/**
 * Indique si un caractère est une consonne Confluent.
 * @param {string} c - caractère unique
 * @returns {boolean}
 */
function estConsonne(c) {
  return CONSONNES.has(c);
}

/**
 * Indique si un caractère est une voyelle active Confluent.
 * @param {string} c - caractère unique
 * @returns {boolean}
 */
function estVoyelle(c) {
  return VOYELLES.has(c);
}

/**
 * Valide une forme Confluent isolée (un seul mot, sans particule ni espace).
 *
 * QUOI : applique les 3 règles dures et renvoie la liste des violations.
 * POURQUOI : un retour structuré (et pas juste true/false) permet à l'agent de RÉPARER
 *        précisément ("attaque-CC 'tb'") plutôt que de regénérer à l'aveugle.
 * COMMENT : 1. normaliser (minuscules, trim) ; 2. scanner caractère par caractère pour
 *        l'alphabet ; 3. tester l'attaque ; 4. fenêtre glissante de 3 pour les clusters.
 *
 * @param {string} mot - forme Confluent à valider (un mot)
 * @returns {{valid: boolean, mot: string, erreurs: string[]}}
 */
function validateForm(mot) {
  const erreurs = [];
  const w = String(mot || '').toLowerCase().trim();

  if (w.length === 0) {
    return { valid: false, mot: w, erreurs: ['forme vide'] };
  }

  // RÈGLE 1 — alphabet : aucun caractère hors voyelles/consonnes autorisées.
  for (const c of w) {
    if (VOYELLES_RESERVEES.has(c)) {
      erreurs.push(`voyelle réservée interdite '${c}'`);
    } else if (!estConsonne(c) && !estVoyelle(c)) {
      erreurs.push(`caractère hors-alphabet '${c}'`);
    }
  }

  // RÈGLE 2 — pas d'attaque par 2 consonnes (les clusters d'attaque sont LE bug récurrent).
  if (w.length >= 2 && estConsonne(w[0]) && estConsonne(w[1])) {
    erreurs.push(`attaque par 2 consonnes '${w.slice(0, 2)}'`);
  }

  // RÈGLE 3 — jamais 3 consonnes d'affilée (fenêtre glissante).
  for (let i = 0; i + 2 < w.length; i++) {
    if (estConsonne(w[i]) && estConsonne(w[i + 1]) && estConsonne(w[i + 2])) {
      erreurs.push(`3 consonnes consécutives '${w.slice(i, i + 3)}'`);
      break; // une seule mention suffit à signaler le défaut
    }
  }

  return { valid: erreurs.length === 0, mot: w, erreurs };
}

/**
 * Particules et conjugateurs : mots-outils valides qui ne sont pas des "formes" lexicales
 * à valider comme des racines. On les ignore lors du scan d'une phrase complète.
 *
 * POURQUOI : une phrase finale mêle racines, verbes+conjugateurs ET particules ; valider
 *        "u", "va", "su" comme des racines n'a pas de sens. On filtre la grammaire connue.
 */
const MOTS_GRAMMATICAUX = new Set([
  // particules
  'va', 'vo', 'vi', 've', 'vu', 'na', 'ni', 'no', 'su',
  // négation + question
  'zo', 'zom', 'zob', 'zoe', 'ka',
  // conjugateurs (suffixes parfois écrits séparément)
  'u', 'at', 'aan', 'ait', 'amat', 'en', 'il', 'eol', 'eon', 'eom', 'ok', 'es', 'ul', 'uv'
]);

/**
 * Valide une traduction Confluent complète (phrase ou texte multi-mots).
 *
 * QUOI : découpe le texte en mots, valide chaque mot lexical, agrège les formes fautives.
 * POURQUOI : c'est le gate final de l'agent — il s'applique à la sortie réelle servie.
 * COMMENT : 1. découper sur espaces/ponctuation Confluent ('.', ',') ; 2. ignorer les mots
 *        grammaticaux ; 3. valider le reste ; 4. retourner la liste des mots invalides avec
 *        leurs raisons, pour réparation ciblée.
 *
 * @param {string} texte - traduction Confluent (peut contenir plusieurs phrases)
 * @returns {{valid: boolean, invalides: Array<{mot: string, erreurs: string[]}>, motsTestes: number}}
 */
function validateTranslation(texte) {
  const t = String(texte || '').toLowerCase();
  // Découper sur séparateurs : espaces, points, virgules, points d'interrogation.
  const tokens = t.split(/[\s.,!?;:]+/).filter(Boolean);

  const invalides = [];
  let motsTestes = 0;

  for (const tok of tokens) {
    if (MOTS_GRAMMATICAUX.has(tok)) continue; // grammaire connue → non testée comme racine
    motsTestes++;
    const res = validateForm(tok);
    if (!res.valid) {
      invalides.push({ mot: tok, erreurs: res.erreurs });
    }
  }

  return { valid: invalides.length === 0, invalides, motsTestes };
}

module.exports = {
  validateForm,
  validateTranslation,
  estConsonne,
  estVoyelle,
  CONSONNES,
  VOYELLES,
  VOYELLES_RESERVEES,
  MOTS_GRAMMATICAUX
};
