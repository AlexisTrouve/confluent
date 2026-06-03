/**
 * Guide Builder - Génère le Guide de la langue depuis les SOURCES DE VÉRITÉ.
 *
 * QUOI : assemble un objet « guide » structuré (phonologie, liaisons, conjugateurs, particules,
 *        pronoms, syntaxe, verbes, vocabulaire) à partir de data/lexique.json (grammaire) et du
 *        lexique vivant (verbes, castes, lieux). L'UI le rend dynamiquement.
 *
 * POURQUOI : un guide écrit en dur DÉRIVE du corpus (l'audit l'a montré). En le GÉNÉRANT depuis
 *        les mêmes données que le traducteur, il reste toujours synchrone — impossible à désync.
 *
 * COMMENT : réutilise execGetGrammar (conjugateurs/liaisons/particules/pronoms/négation/syntaxe,
 *        déjà alimentés par data/lexique.json) ; ajoute la phonologie (constantes), les verbes
 *        (lexique, type=verbe), et castes/lieux (lexique, par fichier source). Questions et
 *        connecteurs viennent du design canonique (docs/langue) — non présents au lexique.
 */

'use strict';

const { execGetGrammar } = require('../translation/translationTools');
const { CONSONNES, VOYELLES, VOYELLES_RESERVEES } = require('../validation/phonotactics');

// Phonologie : règles stables de la langue (pas dans le lexique → constantes documentées).
const PHONOLOGIE = {
  consonnes: ['b', 'k', 'l', 'm', 'n', 'p', 's', 't', 'v', 'z'],
  voyelles: ['a', 'e', 'i', 'o', 'u'],
  voyelles_reservees: ['y', 'é', 'è'],
  exceptions: "r toléré dans le sacré/ancien (ura, kari, sora…), d uniquement dans les nombres (diku…). Jamais créés.",
  regles: [
    "Toute racine finit par une voyelle (…CV) ; tout verbe finit par une consonne.",
    "Jamais 2 consonnes en attaque de mot, jamais 3 consonnes d'affilée.",
    "Pas de majuscules : tout s'écrit en minuscules (uraakota, siliaska)."
  ]
};

// Interrogatifs et connecteurs : canoniques (docs/langue/04-SYNTAXE) mais absents du lexique.
const QUESTIONS = { ki: 'qui', ke: 'quoi', ko: 'où', ku: 'quand', ka: 'oui/non (fin de phrase)' };
const CONNECTEURS = { ti: 'et', bo: 'mais', po: 'ou', lo: 'donc', se: 'car' };

/**
 * Extrait verbes, castes et lieux du lexique vivant (générés, pas codés en dur).
 * @param {Object} lexique - lexique chargé (ancien)
 */
function extractFromLexique(lexique) {
  const dict = (lexique && lexique.dictionnaire) || {};

  // Castes / lieux : sélectionnés par CATÉGORIE, dédupliqués par forme, en préférant le nom
  // DESCRIPTIF (« Enfants des Échos ») au doublon nom-propre (« Nakukeko », clé = la forme elle-même).
  const pickByCat = (matchCat) => {
    const byCf = {};
    for (const [key, entry] of Object.entries(dict)) {
      for (const t of (entry.traductions || [])) {
        if (!t.confluent || !matchCat(t.categorie)) continue;
        const fr = entry.mot_francais || key;
        const descriptif = fr.toLowerCase() !== t.confluent.toLowerCase();
        const cur = byCf[t.confluent];
        if (!cur || (descriptif && !cur.descriptif)) {
          byCf[t.confluent] = { cf: t.confluent, fr, sens: t.sens_litteral || null, descriptif };
        }
      }
    }
    return Object.values(byCf).map(({ descriptif, ...r }) => r);
  };
  const castes = pickByCat(c => c === 'caste' || c === 'groupe_spirituel');
  const lieux = pickByCat(c => c === 'lieu_majeur' || c === 'lieu_sacre');

  // Verbes : liste PÉDAGOGIQUE (concepts FR courants), formes récupérées EN DIRECT du lexique
  // → la sélection est curatée (utile pour apprendre), les formes restent toujours synchro.
  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const VERBES_FR = ['voir', 'dire', 'aller', 'savoir', 'donner', 'prendre', 'faire', 'garder', 'apprendre', 'transmettre', 'chasser', 'porter'];
  const verbes = [];
  for (const fr of VERBES_FR) {
    const entry = dict[norm(fr)] || dict[fr];
    const t = entry && (entry.traductions || []).find(x => /verbe/.test(x.type || ''));
    if (t) verbes.push({ cf: t.confluent, fr });
  }

  return { verbes, castes, lieux };
}

/**
 * Construit le guide complet.
 * @param {Object} lexique - lexique vivant (ancien)
 * @returns {Object} - guide structuré, prêt à rendre par l'UI
 */
function buildGuide(lexique) {
  const grammaire = execGetGrammar({ sujet: 'all' }); // liaisons, conjugateurs, particules, pronoms, négation, syntaxe, limitations, nombres
  const { verbes, castes, lieux } = extractFromLexique(lexique || { dictionnaire: {} });

  return {
    genere_le: null, // l'appelant peut estampiller ; on évite Date ici (déterminisme)
    phonologie: PHONOLOGIE,
    morphologie: {
      racines: { sacree: 'commence par une voyelle (~20-25%)', standard: 'commence par une consonne (~75-80%)' },
      liaisons: grammaire.liaisons
    },
    grammaire: {
      verbes,
      conjugateurs: grammaire.conjugateurs,
      particules: grammaire.particules,
      pronoms: grammaire.pronoms
    },
    syntaxe: {
      ordre: grammaire.syntaxe ? grammaire.syntaxe.ordre : 'SOV (Sujet – Objet – Verbe)',
      negation: grammaire.negation,
      questions: QUESTIONS,
      connecteurs: CONNECTEURS,
      limitations: grammaire.limitations
    },
    nombres: grammaire.nombres,
    vocabulaire: {
      peuple: { cf: 'siliaska', sens: 'les porteurs du regard libre (sil-i-aska)' },
      castes,
      lieux
    }
  };
}

module.exports = { buildGuide, PHONOLOGIE, QUESTIONS, CONNECTEURS };
