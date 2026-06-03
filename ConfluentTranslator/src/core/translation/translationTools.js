/**
 * Translation Tools - Outils Anthropic pour l'agent de traduction Confluent
 *
 * QUOI : définit les 5 outils que le LLM peut appeler pendant la traduction, plus leurs
 *        exécuteurs côté serveur. Les outils ancrent la génération au lexique réel, à la
 *        grammaire officielle et au gate phonotactique, au lieu de laisser le modèle inventer.
 *
 * POURQUOI : une "simple request" produit des formes cassées (`tbime`) OU invente alors que le
 *        mot existe (5 bugs sur 8). Donner au modèle des outils déterministes — chercher la
 *        forme canon, consulter la grammaire, valider une forme, VÉRIFIER un mot contre le
 *        corpus (conjugaison+liaison comprises), valider une composition — supprime ces erreurs
 *        à la source et produit des résultats nettement supérieurs.
 *
 * COMMENT : `TOOL_DEFINITIONS` = schémas JSON passés à l'API Anthropic. `executeTool(name,
 *        input, ctx)` dispatche ; `ctx` porte les ressources déjà chargées par le serveur
 *        (lexique fr→cf, index inversé simple, index morpho byWord). Aucun I/O ici.
 */

'use strict';

const { validateForm, validateTranslation } = require('../validation/phonotactics');
const { searchWord, normalizeFrenchText } = require('./contextAnalyzer');
const { decomposeWord } = require('../morphology/morphologicalDecomposer');
const { extractRadicals, CONJUGATEURS } = require('../morphology/radicalMatcher');

// QUOI : grammaire canonique de référence, source = data/lexique.json (repo root, le même que
//        consomment les modules morpho) complété par des constantes documentées.
// POURQUOI : get_grammar doit renvoyer une vérité unique, pas une paraphrase du modèle.
const dataLexique = require('../../../../data/lexique.json');

// Les 16 liaisons sacrées, invariantes (02-MORPHOLOGIE).
const LIAISONS_VALIDES = new Set([
  'i', 'ie', 'ii', 'iu',      // famille I — agentivité
  'u', 'ui',                  // famille U — appartenance
  'a', 'aa', 'ae', 'ao',      // famille A — relation
  'o', 'oa',                  // famille O — tension
  'e', 'ei', 'ea', 'eo'       // famille E — dimension
]);

// Particules SOV (avant le mot) + pluriel + négation + question. Source canonique.
const PARTICULES = {
  va: 'sujet', vo: 'objet direct', vi: 'direction (vers)', ve: 'origine (depuis)',
  vu: 'instrument (avec/au moyen de)', na: 'possession', ni: 'bénéficiaire (à/pour)',
  no: 'lieu (dans/en)', su: 'pluriel (APRÈS le mot)'
};
const NEGATION = { zo: 'négation simple', zom: 'négation jamais', zob: 'négation interdiction' };

// QUOI : réduit une définition longue à une glose courte. POURQUOI : prémâché — le modèle n'a pas
// besoin du paragraphe ethnographique pour traduire, juste un repère de sens (paie moins de tokens).
function briefSens(s) {
  if (!s) return null;
  const clean = String(s).replace(/\s+/g, ' ').trim();
  return clean.length <= 80 ? clean : clean.slice(0, 80).replace(/\s+\S*$/, '') + '…';
}
// QUOI : aplatit {code:{sens,...}} en {code: glose}. POURQUOI : sortie grammaire légère et directe.
function flat(obj) {
  if (!obj) return {};
  return Object.fromEntries(Object.entries(obj).map(([k, v]) =>
    [k, typeof v === 'string' ? v : (v.sens || v.description || v.concept || '')]));
}

// ============================================================================
// SCHÉMAS DES OUTILS (format Anthropic `tools`)
// ============================================================================

const TOOL_DEFINITIONS = [
  {
    name: 'lookup_concept',
    description:
      "Cherche la forme Confluent CANONIQUE d'un mot/concept français dans le lexique officiel. " +
      "UTILISE-LE pour CHAQUE mot de contenu avant de le traduire : ne devine jamais une forme qui " +
      "pourrait déjà exister. Retourne les formes attestées (type, composition, sens). Vide = le mot " +
      "n'existe pas, il faut composer ou approximer.",
    input_schema: {
      type: 'object',
      properties: {
        francais: { type: 'string', description: 'Mot/concept français (ex: "lumière", "observer").' }
      },
      required: ['francais']
    }
  },
  {
    name: 'get_grammar',
    description:
      "Renvoie les RÈGLES grammaticales officielles du Confluent sur un sujet donné, pour ne pas te " +
      "fier à ta mémoire. Sujets : 'conjugateurs' (temps/aspects/modes/évidentiel), 'liaisons' (les 16 " +
      "liaisons sacrées et leurs domaines), 'particules' (SOV, sujet/objet/direction…), 'pronoms', " +
      "'negation', 'nombres' (base 12), 'limitations' (relatives/subordination non supportées), 'syntaxe', " +
      "ou 'all'. UTILISE-LE dès que tu hésites sur une règle (conjugaison, ordre des mots, pluriel…).",
    input_schema: {
      type: 'object',
      properties: {
        sujet: {
          type: 'string',
          enum: ['conjugateurs', 'liaisons', 'particules', 'pronoms', 'negation', 'nombres', 'limitations', 'syntaxe', 'all'],
          description: 'Le domaine grammatical demandé.'
        }
      },
      required: ['sujet']
    }
  },
  {
    name: 'validate_form',
    description:
      "Valide la PHONOTACTIQUE dure d'une forme (pas d'attaque par 2 consonnes, jamais 3 consonnes " +
      "d'affilée, alphabet autorisé seulement). Rapide. UTILISE-LE sur toute forme composée ou " +
      "incertaine AVANT de la mettre dans la traduction finale.",
    input_schema: {
      type: 'object',
      properties: {
        confluent: { type: 'string', description: 'Forme(s) à valider (un mot ou une phrase).' }
      },
      required: ['confluent']
    }
  },
  {
    name: 'verify_word',
    description:
      "VÉRIFIE un mot Confluent contre le CORPUS, conjugaison et liaisons comprises. Décompose le mot : " +
      "1) forme attestée directement au lexique ? 2) verbe conjugué (radical + conjugateur valide) ? " +
      "3) composition racine-liaison-racine (toutes racines déclarées ?). Retourne le sens, le type et " +
      "si chaque composant est reconnu. UTILISE-LE pour confirmer qu'un mot conjugué ou composé est " +
      "réellement bien formé et compris, pas seulement phonotactiquement correct.",
    input_schema: {
      type: 'object',
      properties: {
        confluent: { type: 'string', description: 'Le mot Confluent à vérifier (ex: "zanaku", "siliaska").' }
      },
      required: ['confluent']
    }
  },
  {
    name: 'check_composition',
    description:
      "Vérifie une composition : chaque racine est-elle déclarée, la liaison sacrée est-elle valide, et " +
      "la forme assemblée est-elle phonotactiquement correcte. UTILISE-LE quand tu composes un mot " +
      "manquant à partir de racines + une liaison.",
    input_schema: {
      type: 'object',
      properties: {
        forme: { type: 'string', description: 'Forme composée assemblée (ex: "zakitori").' },
        racines: { type: 'array', items: { type: 'string' }, description: 'Racines de base, dans l\'ordre.' },
        liaison: { type: 'string', description: 'Liaison sacrée employée (ex: "i", "aa").' }
      },
      required: ['forme', 'racines', 'liaison']
    }
  }
];

// ============================================================================
// EXÉCUTEURS
// ============================================================================

/**
 * lookup_concept — forme canonique d'un concept français.
 *
 * QUOI : renvoie les formes Confluent attestées pour un mot/concept FR, du meilleur match au moins bon.
 * POURQUOI : on veut un SIGNAL (la bonne forme), pas un DUMP. L'ancienne implémentation (searchLexique
 *        en sous-chaîne) renvoyait du bruit — « eau » ramenait « oiseau », « nouveau »… On utilise donc
 *        le matcher SCORÉ de contextAnalyzer (exact / lemme / synonyme), sans match en sous-chaîne.
 * COMMENT : normaliser le FR → searchWord (score 1.0 exact, 0.95 lemme, 0.9/0.85 synonyme) → trier par
 *        score → dédupliquer par forme confluent → max 6. Le score est remonté au modèle pour qu'il
 *        distingue un match sûr d'un match approché.
 */
function execLookupConcept(input, ctx) {
  const francais = String(input.francais || '').trim();
  if (!francais) return { found: false, francais, formes: [], note: 'requête vide' };

  const norm = normalizeFrenchText(francais).trim();
  const results = searchWord(norm, ctx.lexique.dictionnaire).sort((a, b) => b.score - a.score);

  const vues = new Set();
  const formes = [];
  for (const r of results) {
    for (const trad of (r.traductions || [])) {
      const cf = trad.confluent;
      if (!cf || vues.has(cf)) continue;
      vues.add(cf);
      formes.push({
        confluent: cf,
        type: trad.type || 'inconnu',
        composition: trad.composition || null,
        sens: briefSens(trad.sens_litteral || trad.definition),
        score: Number(r.score.toFixed(2))
      });
    }
    if (formes.length >= 6) break;
  }

  return {
    found: formes.length > 0,
    francais,
    formes,
    note: formes.length === 0
      ? "Aucune forme attestée. Compose à partir de racines (check_composition) ou approxime (signale-le)."
      : undefined
  };
}

/**
 * get_grammar — règles grammaticales officielles par sujet.
 * COMMENT : source = data/lexique.json (liaisons, conjugateurs, pronoms) + constantes canoniques.
 */
function execGetGrammar(input) {
  const sujet = String(input.sujet || 'all').toLowerCase();
  const out = {};

  const conjugateurs = () => ({
    regle: 'VERBE (finit par consonne) + CONJUGATEUR. Liste EXHAUSTIVE, aucun autre.',
    temps: flat(dataLexique.conjugateurs?.temps),
    aspects: flat(dataLexique.conjugateurs?.aspects),
    modes: flat(dataLexique.conjugateurs?.modes),
    evidentiel: flat(dataLexique.conjugateurs?.evidentiel)
  });
  const liaisons = () => ({
    regle: 'racine1(forme liée) + liaison + racine2. JAMAIS comme pronom relatif "qui/que".',
    liaisons: flat(dataLexique.liaisons),
    familles: { I: 'agentivité (i,ie,ii,iu)', U: 'appartenance (u,ui)', A: 'relation (a,aa,ae,ao)', O: 'tension (o,oa)', E: 'dimension (e,ei,ea,eo)' }
  });
  const particules = () => ({ regle: 'AVANT le mot, sauf su (pluriel) APRÈS.', particules: PARTICULES });
  const pronoms = () => ({ regle: 'Mots à part entière. Pluriel par su.', pronoms: dataLexique.pronoms || { miki: 'je/moi', sinu: 'tu/toi', tani: 'il/elle/iel' } });
  const negation = () => ({ regle: 'Avant le verbe.', negation: NEGATION });
  const nombres = () => ({
    regle: 'BASE 12. COEFFICIENT + tolu + UNITÉ. Le nombre précède le nom sans particule.',
    chiffres: { 0: 'zaro', 1: 'iko', 2: 'diku', 3: 'tiru', 4: 'katu', 5: 'penu', 6: 'seku', 7: 'sivu', 8: 'oktu', 9: 'novu', 10: 'deku', 11: 'levu', 12: 'tolu' },
    puissances: { 144: 'tolusa', 1728: 'toluaa', 20736: 'tolumako' }
  });
  const limitations = () => ({
    non_supporte: ['propositions relatives (qui/que/dont)', 'subordination (parce que/afin de)', 'participes présents'],
    strategies: ['composer (zok-i-zana = loup-chasseur)', 'juxtaposer / séparer en phrases', 'reformuler avec un verbe']
  });
  const syntaxe = () => ({ ordre: 'SOV (Sujet – Objet – Verbe)', question: 'ka en fin', casse: 'tout en minuscules, pas de majuscules' });

  switch (sujet) {
    case 'conjugateurs': out.conjugateurs = conjugateurs(); break;
    case 'liaisons': out.liaisons = liaisons(); break;
    case 'particules': out.particules = particules(); break;
    case 'pronoms': out.pronoms = pronoms(); break;
    case 'negation': out.negation = negation(); break;
    case 'nombres': out.nombres = nombres(); break;
    case 'limitations': out.limitations = limitations(); break;
    case 'syntaxe': out.syntaxe = syntaxe(); break;
    case 'all':
    default:
      out.syntaxe = syntaxe(); out.particules = particules(); out.pronoms = pronoms();
      out.conjugateurs = conjugateurs(); out.liaisons = liaisons(); out.negation = negation();
      out.nombres = nombres(); out.limitations = limitations();
  }
  return out;
}

/**
 * validate_form — verdict phonotactique pur (mot ou phrase).
 */
function execValidateForm(input) {
  return validateTranslation(String(input.confluent || ''));
}

/**
 * verify_word — vérification morphologique complète contre le corpus.
 *
 * COMMENT : 1. gate phonotactique ; 2. forme attestée directement (byWord) ? ;
 *        3. verbe conjugué : radical + conjugateur valide, radical attesté ? (radicalMatcher) ;
 *        4. composition racine-liaison-racine : meilleure décompo, toutes racines trouvées ?
 *        (morphologicalDecomposer). Renvoie le mode de reconnaissance + détails.
 */
function execVerifyWord(input, ctx) {
  const word = String(input.confluent || '').toLowerCase().trim();
  if (!word) return { confluent: word, reconnu: false, raison: 'requête vide' };

  // 1. Phonotactique
  const phono = validateForm(word);
  if (!phono.valid) {
    return { confluent: word, phonotactique_valide: false, erreurs: phono.erreurs, reconnu: false,
      note: 'Forme phonotactiquement invalide — ne pas utiliser.' };
  }

  const byWord = (ctx.morphReverseIndex && ctx.morphReverseIndex.byWord) || {};

  // 2. Attesté directement ?
  if (byWord[word]) {
    const e = byWord[word];
    return { confluent: word, phonotactique_valide: true, reconnu: true, mode: 'direct',
      francais: e.francais, type: e.type, composition: e.composition || null };
  }

  // 3. Verbe conjugué ? (radical + conjugateur)
  const radicaux = extractRadicals(word);
  for (const r of radicaux) {
    if (r.type === 'conjugaison' && CONJUGATEURS.includes(r.suffix)) {
      // Le radical doit être un verbe/racine attesté (forme directe ou forme liée connue)
      const radEntry = byWord[r.radical];
      if (radEntry) {
        return { confluent: word, phonotactique_valide: true, reconnu: true, mode: 'verbe_conjugue',
          radical: r.radical, francais: radEntry.francais, type: radEntry.type,
          conjugateur: r.suffix, note: `verbe '${r.radical}' + conjugateur '${r.suffix}'` };
      }
    }
  }

  // 4. Composition racine-liaison-racine ?
  const decomps = decomposeWord(word, ctx.morphReverseIndex);
  if (decomps.length > 0) {
    const best = decomps[0];
    const racinesDetail = best.roots.map(rt => ({
      racine: rt.fullRoot || rt.part,
      trouvee: Boolean(rt.found),
      francais: rt.entry ? rt.entry.francais : null
    }));
    const toutesTrouvees = racinesDetail.every(r => r.trouvee);
    return {
      confluent: word, phonotactique_valide: true, reconnu: toutesTrouvees, mode: 'composition',
      pattern: best.pattern,
      liaisons: best.liaisons.map(l => l.liaison),
      racines: racinesDetail,
      confiance: Number(best.confidence.toFixed(2)),
      note: toutesTrouvees
        ? 'Composition reconnue, toutes les racines sont déclarées.'
        : 'Décomposition plausible mais certaines racines ne sont pas déclarées — vérifie-les (lookup_concept).'
    };
  }

  // Rien : phonotactique OK mais non reconnu
  return { confluent: word, phonotactique_valide: true, reconnu: false, mode: 'inconnu',
    note: "Forme bien formée mais absente du corpus et non décomposable. Préfère une forme attestée ou une composition validée." };
}

/**
 * check_composition — racines déclarées + liaison valide + forme phonotactiquement correcte.
 */
function execCheckComposition(input, ctx) {
  const forme = String(input.forme || '').toLowerCase().trim();
  const racines = Array.isArray(input.racines) ? input.racines.map(r => String(r).toLowerCase().trim()) : [];
  const liaison = String(input.liaison || '').toLowerCase().trim();

  const liaisonValide = LIAISONS_VALIDES.has(liaison);

  const byWord = (ctx.morphReverseIndex && ctx.morphReverseIndex.byWord) || {};
  const byFormeLiee = (ctx.morphReverseIndex && ctx.morphReverseIndex.byFormeLiee) || {};
  const racinesVerdict = racines.map(r => ({
    racine: r,
    // Déclarée si attestée comme mot complet OU comme forme liée connue.
    declaree: Boolean(byWord[r] || byFormeLiee[r])
  }));
  const racinesInconnues = racinesVerdict.filter(v => !v.declaree).map(v => v.racine);

  const formeVerdict = validateForm(forme);
  const valid = liaisonValide && racinesInconnues.length === 0 && formeVerdict.valid;

  return {
    valid, forme,
    forme_valide: formeVerdict.valid, forme_erreurs: formeVerdict.erreurs,
    liaison, liaison_valide: liaisonValide,
    racines: racinesVerdict, racines_inconnues: racinesInconnues,
    note: valid ? undefined
      : "Composition rejetée : corrige la liaison, les racines inconnues (vérifie-les avec lookup_concept) ou la forme."
  };
}

/**
 * Dispatcher central.
 * @param {string} name
 * @param {Object} input
 * @param {{lexique: Object, reverseIndex: Object, morphReverseIndex: Object}} ctx
 */
function executeTool(name, input, ctx) {
  switch (name) {
    case 'lookup_concept': return execLookupConcept(input, ctx);
    case 'get_grammar': return execGetGrammar(input);
    case 'validate_form': return execValidateForm(input);
    case 'verify_word': return execVerifyWord(input, ctx);
    case 'check_composition': return execCheckComposition(input, ctx);
    default: return { error: `Outil inconnu: ${name}` };
  }
}

module.exports = {
  TOOL_DEFINITIONS,
  executeTool,
  LIAISONS_VALIDES,
  execLookupConcept, execGetGrammar, execValidateForm, execVerifyWord, execCheckComposition
};
