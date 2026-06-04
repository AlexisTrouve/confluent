/**
 * Phonotactics - Validateur déterministe des formes Confluent, PARAMÉTRÉ PAR ÈRE.
 *
 * QUOI : valide qu'un mot Confluent respecte les règles de combinaison de SON ère
 *        (proto : 8C/4V sans u·v·z · ancien : 10C/5V+r/d · mythologique : + y/é/è sacrés).
 *        C'est le GATE dur de l'agent : aucune forme invalide ne sort de la boucle.
 *
 * POURQUOI : la langue a plusieurs ÈRES aux phonologies différentes. Un gate figé sur l'ancien
 *        rejetterait du proto correct (et le y/é/è du mythologique). On passe donc l'alphabet de
 *        l'ère en paramètre. Fonction pure : l'ère est une DONNÉE (config), pas une dépendance.
 *
 * COMMENT : 3 règles universelles (alphabet autorisé · pas d'attaque par 2 consonnes · jamais 3
 *        consonnes d'affilée) appliquées avec l'alphabet de l'ère. Sans ère fournie → ANCIEN par
 *        défaut (compat : tout appelant existant reste valide à l'identique).
 */

'use strict';

// === Défaut ANCIEN (utilisé quand aucune ère n'est fournie ; exporté pour compat) ===
const CONSONNES = new Set(['b', 'k', 'l', 'm', 'n', 'p', 's', 't', 'v', 'z', 'r', 'd']);
const VOYELLES = new Set(['a', 'e', 'i', 'o', 'u']);
const VOYELLES_RESERVEES = new Set(['y', 'é', 'è', 'ê', 'à', 'ù', 'ô', 'î', 'â']);

/**
 * Construit les ensembles alphabet (consonnes/voyelles/réservées) d'une ère.
 * @param {Object} [era] - config d'ère { consonnes, voyelles, tolerees, reservees }
 * @returns {{cons: Set, voy: Set, res: Set}}
 */
function alphabetOf(era) {
  if (!era || !Array.isArray(era.consonnes)) {
    return { cons: CONSONNES, voy: VOYELLES, res: VOYELLES_RESERVEES };
  }
  return {
    cons: new Set([...(era.consonnes || []), ...(era.tolerees || [])]),
    voy: new Set(era.voyelles || []),
    res: new Set(era.reservees || [])
  };
}

/** Indique si un caractère est une consonne (alphabet ANCIEN par défaut). */
function estConsonne(c) { return CONSONNES.has(c); }
/** Indique si un caractère est une voyelle active (alphabet ANCIEN par défaut). */
function estVoyelle(c) { return VOYELLES.has(c); }

/**
 * Valide une forme Confluent isolée (un mot) selon l'alphabet de l'ère.
 *
 * @param {string} mot - forme Confluent à valider
 * @param {Object} [era] - config d'ère (défaut : ANCIEN)
 * @returns {{valid: boolean, mot: string, erreurs: string[]}}
 */
function validateForm(mot, era) {
  const { cons, voy, res } = alphabetOf(era);
  const erreurs = [];
  const w = String(mot || '').toLowerCase().trim();

  if (w.length === 0) {
    return { valid: false, mot: w, erreurs: ['forme vide'] };
  }

  const isCons = (c) => cons.has(c);

  // RÈGLE 1 — alphabet : aucun caractère hors voyelles/consonnes de l'ère.
  for (const c of w) {
    if (res.has(c)) {
      erreurs.push(`son réservé (hors ère) '${c}'`);
    } else if (!cons.has(c) && !voy.has(c)) {
      erreurs.push(`caractère hors-alphabet '${c}'`);
    }
  }

  // RÈGLE 2 — pas d'attaque par 2 consonnes.
  if (w.length >= 2 && isCons(w[0]) && isCons(w[1])) {
    erreurs.push(`attaque par 2 consonnes '${w.slice(0, 2)}'`);
  }

  // RÈGLE 3 — jamais 3 consonnes d'affilée (fenêtre glissante).
  for (let i = 0; i + 2 < w.length; i++) {
    if (isCons(w[i]) && isCons(w[i + 1]) && isCons(w[i + 2])) {
      erreurs.push(`3 consonnes consécutives '${w.slice(i, i + 3)}'`);
      break;
    }
  }

  return { valid: erreurs.length === 0, mot: w, erreurs };
}

/**
 * Mots grammaticaux de l'ANCIEN (particules + négation + conjugateurs) à ne pas valider comme racines.
 * Défaut quand aucune ère (ou ancien/mythologique) n'est fournie.
 */
const MOTS_GRAMMATICAUX = new Set([
  'va', 'vo', 'vi', 've', 'vu', 'na', 'ni', 'no', 'su',
  'zo', 'zom', 'zob', 'zoe', 'ka',
  'u', 'at', 'aan', 'ait', 'amat', 'en', 'il', 'eol', 'eon', 'eom', 'ok', 'es', 'ul', 'uv'
]);

/**
 * Ensemble des mots grammaticaux à ignorer pour une ère donnée.
 * COMMENT : ancien/mythologique → liste ANCIEN (identique au comportement existant) ; autres ères
 *        (proto…) → construit depuis la config (particules + interrogatifs + conjugateurs).
 */
function grammaticalWordsOf(era) {
  if (!era || era.id === 'ancien' || era.id === 'mythologique') return MOTS_GRAMMATICAUX;
  const s = new Set();
  for (const k of Object.keys(era.particules || {})) s.add(k);
  for (const k of Object.keys(era.interrogatifs || {})) s.add(k);
  for (const [k, v] of Object.entries(era.conjugateurs || {})) {
    if (typeof v === 'string') s.add(k);
    else if (v && typeof v === 'object') Object.keys(v).forEach(kk => s.add(kk));
  }
  return s;
}

/**
 * Valide une traduction Confluent complète (phrase/texte) selon l'ère.
 *
 * @param {string} texte - traduction Confluent
 * @param {Object} [era] - config d'ère (défaut : ANCIEN)
 * @returns {{valid: boolean, invalides: Array<{mot: string, erreurs: string[]}>, motsTestes: number}}
 */
function validateTranslation(texte, era) {
  const grammaticaux = grammaticalWordsOf(era);
  const t = String(texte || '').toLowerCase();
  const tokens = t.split(/[\s.,!?;:]+/).filter(Boolean);

  const invalides = [];
  let motsTestes = 0;

  for (const tok of tokens) {
    if (grammaticaux.has(tok)) continue;
    motsTestes++;
    const res = validateForm(tok, era);
    if (!res.valid) {
      invalides.push({ mot: tok, erreurs: res.erreurs });
    }
  }

  return { valid: invalides.length === 0, invalides, motsTestes };
}

module.exports = {
  validateForm,
  validateTranslation,
  alphabetOf,
  grammaticalWordsOf,
  estConsonne,
  estVoyelle,
  CONSONNES,
  VOYELLES,
  VOYELLES_RESERVEES,
  MOTS_GRAMMATICAUX
};
