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
const { checkGrammar } = require('../validation/grammarCheck');
const { searchWord, normalizeFrenchText, analyzeContext } = require('./contextAnalyzer');
const { decomposeWord } = require('../morphology/morphologicalDecomposer');
const { extractRadicals, CONJUGATEURS } = require('../morphology/radicalMatcher');
const { ANCIEN } = require('../eras/eras');

// Résout la config d'ère depuis le contexte (ANCIEN par défaut → compat des appels sans ère).
const eraOf = (ctx) => (ctx && ctx.era) || ANCIEN;

// Les 16 liaisons sacrées de l'ANCIEN, invariantes (02-MORPHOLOGIE) — exporté pour référence.
// La validation par ère passe par era.liaisons (cf. check_composition) ; ceci reste l'ancien.
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

// (Les maps de back-translation — rôles, conjugateurs, gloses de liaison — sont désormais
//  construites PAR ÈRE dans execBackTranslate, depuis era.particules/conjugateurs/liaisons.)

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
    name: 'analyze_text',
    description:
      "Pré-analyse une phrase/texte FRANÇAIS à traduire et renvoie le PLAN complet EN UN SEUL APPEL : " +
      "mots TROUVÉS (forme Confluent prête à l'emploi), mots À COMPOSER (sans forme directe), VERBES " +
      "(à conjuguer) et la couverture. APPELLE CET OUTIL EN PREMIER pour toute traduction : il évite de " +
      "chercher les mots un par un. Ensuite, n'utilise lookup_concept/check_composition que pour le reste.",
    input_schema: {
      type: 'object',
      properties: {
        francais: { type: 'string', description: 'La phrase ou le texte français à traduire.' }
      },
      required: ['francais']
    }
  },
  {
    name: 'lookup_concept',
    description:
      "Cherche la forme Confluent CANONIQUE d'un mot/concept français dans le lexique officiel. " +
      "UTILISE-LE pour CHAQUE mot de contenu avant de le traduire : ne devine jamais une forme qui " +
      "pourrait déjà exister. Retourne les formes attestées (type, composition, sens). " +
      "⭐ Si le mot a PLUSIEURS sens natifs (la langue diversifie ses mots-tiroir selon SA vision du " +
      "monde, pas selon le français), chaque forme arrive avec sa `definition` et sa `nuance` (ce qui " +
      "la distingue de ses voisines) : LIS-les et CHOISIS le sens qui colle au contexte — ne te rabats " +
      "ni sur le sens générique ni sur le calque français. Vide = le mot n'existe pas, il faut composer.",
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
  },
  {
    name: 'forge_proper_name',
    description:
      "FORGE (ou retrouve) la forme Confluent d'un NOM PROPRE : personnage, lieu ou bête du récit " +
      "(ex : « Œil-Bas », « le Sans-Sommeil », « Bras-Pleins »). UTILISE-LE pour TOUT nom propre sans " +
      "forme attestée, au lieu d'improviser une forme inline (qui sortirait différente à chaque fois).\n" +
      "Garantit la COHÉRENCE : si le nom a déjà été forgé, il renvoie la MÊME forme — jamais deux noms " +
      "pour un même personnage. Sinon il en compose une (racines + liaison sacrée), la VALIDE " +
      "(phonotactique + anti-collision) et la fige (provisoire, en attente de validation du créateur).\n" +
      "QUAND : dès qu'un nom propre n'a pas de forme au lexique. PAS pour un mot commun (→ lookup_concept " +
      "/ check_composition). Donne le SENS descriptif du nom pour une composition juste et cohérente " +
      "(les noms en « Œil-* » doivent partager la racine sili-).\n" +
      "Ex : forge_proper_name(nom_fr=\"Œil-Bas\", sens=\"celui qui ne lève jamais le regard\").",
    input_schema: {
      type: 'object',
      properties: {
        nom_fr: { type: 'string', description: 'Le nom propre français (ex: "Œil-Bas", "le Grand-Pâle").' },
        sens: { type: 'string', description: 'Sens descriptif du nom, pour composer juste (ex: "le regard tourné vers le bas").' }
      },
      required: ['nom_fr']
    }
  },
  {
    name: 'back_translate',
    description:
      "RE-TRADUIT ta traduction Confluent vers le français, MOT À MOT, pour que tu vérifies le SENS " +
      "(le contrôle de forme ne suffit pas). Gère verbes conjugués et compositions. UTILISE-LE sur ta " +
      "traduction finale AVANT de la rendre : compare le français obtenu au sens voulu. Si ça diverge " +
      "(mauvais mot, caste au lieu du sens commun, mot inconnu), corrige. Ne JAMAIS supposer que c'est bon.",
    input_schema: {
      type: 'object',
      properties: {
        confluent: { type: 'string', description: 'Ta traduction Confluent (phrase complète) à re-traduire en FR.' }
      },
      required: ['confluent']
    }
  },
  {
    name: 'grammar_check',
    description:
      "Vérifie la GRAMMAIRE de ta traduction — la STRUCTURE de la phrase, là où validate_form ne voit que " +
      "la forme des mots. Deux règles dures :\n" +
      "  (1) UN SEUL conjugateur de TEMPS par proposition, porté par le verbe. " +
      "Fautif : « va naki u nura vo mori u » (deux « u »). Correct : « va naki vo mori u ».\n" +
      "  (2) Le pluriel « su » se place APRÈS le nom. Correct : « va naki su ». Fautif : « va su naki ».\n" +
      "Renvoie { ok, warnings:[{regle, gravite, message}] }. C'est un CONSEIL, jamais un verrou : il ne " +
      "bloque RIEN (la langue est en construction, les tournures originales sont permises).\n" +
      "QUAND : sur ta traduction FINALE, juste avant de la rendre. Corrige tout warning de gravité 'haute', " +
      "SAUF s'il s'agit d'un choix stylistique assumé — dans ce cas garde ta forme telle quelle.",
    input_schema: {
      type: 'object',
      properties: {
        confluent: { type: 'string', description: 'Ta traduction Confluent (phrase/texte complet) à vérifier.' }
      },
      required: ['confluent']
    }
  },
  {
    name: 'confirme_choix',
    description:
      "Répond à la VÉRIFICATION DE CLÔTURE quand elle t'a renvoyé un warning (grammaire ou vocabulaire) " +
      "que tu juges VOLONTAIRE. Avant d'appeler ceci, tranche honnêtement : est-ce une vraie faute — alors " +
      "CORRIGE et re-soumets, n'appelle pas cet outil — ou un choix délibéré assumé (tournure originale, " +
      "registre rituel, néologisme voulu, écho poétique) — alors confirme ici.\n" +
      "Effet : ta traduction est servie TELLE QUELLE et ta note est conservée (réponse + journal).\n" +
      "`note` = ta justification en UNE phrase, ex. « formule rituelle figée, le verbe est volontairement omis ».\n" +
      "Ne confirme JAMAIS par défaut pour aller plus vite : confirmer une vraie faute la grave dans la langue.",
    input_schema: {
      type: 'object',
      properties: {
        note: { type: 'string', description: 'Justification en une phrase du choix délibéré (ex: « formule rituelle figée, pas de verbe attendu »).' }
      },
      required: ['note']
    }
  }
];

// ============================================================================
// EXÉCUTEURS
// ============================================================================

/**
 * analyze_text — pré-analyse d'une phrase FR : le PLAN de traduction en un seul appel.
 *
 * QUOI : tokenise le français, sépare les mots trouvés (forme prête) / à composer / verbes, donne
 *        la couverture. Remplace N appels lookup_concept par 1 appel structuré et prémâché.
 * POURQUOI : « on point » — le modèle reçoit d'emblée tout le plan, sans chercher mot par mot.
 * COMMENT : réutilise analyzeContext (déjà testé : tokenisation + searchWord scoré + nombres +
 *        couverture). On remonte une vue compacte + un rappel des conjugateurs pour les verbes.
 */
function execAnalyzeText(input, ctx) {
  const texte = String(input.francais || input.texte || '').trim();
  if (!texte) return { erreur: 'entrée vide' };

  const cr = analyzeContext(texte, ctx.lexique);
  const m = cr.metadata;
  const trouves = (m.wordsFound || []).map(w => ({ fr: w.input, confluent: w.confluent, type: w.type }));
  const verbes = trouves.filter(w => /verbe/.test(w.type || '')).map(w => ({ fr: w.fr, confluent: w.confluent }));

  return {
    couverture: (m.coveragePercent != null ? m.coveragePercent : 0) + '%',
    trouves,                                  // formes prêtes — À UTILISER DIRECTEMENT
    a_composer: m.wordsNotFound || [],        // pas de forme directe → composer ou approximer
    verbes,                                   // ajouter un conjugateur après chacun
    conjugateurs: flat(eraOf(ctx).conjugateurs?.temps),  // rappel concis selon l'ère
    note: "Utilise 'trouves' tel quel. AVANT de composer un mot de 'a_composer' (ou si un segment exprime une nuance riche : mort, oubli, feu, veille, folie…), BALAIE la CARTE DES SENS NATIFS du system prompt — si le sens colle à une famille, emploie la forme dédiée (verify_word pour sa forme liée) plutôt que composer ou calquer. Ajoute un conjugateur à chaque verbe. " +
          "N'appelle d'autres outils que pour 'a_composer' ou un doute réel."
  };
}

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
        // ARMER LE CHOIX (doctrine 06-CONFLUENT-MYTHIQUE §4) : quand un mot FR a plusieurs sens
        // NATIFS, l'IA ne doit pas se rabattre sur le mot-tiroir / le calque — il lui faut la
        // matière pour trancher. On sert donc la DÉFINITION complète + la NUANCE (ce qui
        // distingue ce sens de ses voisins) quand elles existent. La glose courte (sens) reste
        // comme repère rapide. Coût tokens payé seulement au lookup, et c'est tout l'enjeu.
        definition: trad.definition || undefined,
        nuance: trad.nuance || undefined,
        registre: trad.registre || undefined,
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
function execGetGrammar(input, ctx) {
  const era = eraOf(ctx);
  const data = era.grammarData || {};
  const sujet = String(input.sujet || 'all').toLowerCase();
  const out = {};

  const conjugateurs = () => ({
    regle: era.hasLiaisons ? 'VERBE (finit par consonne) + CONJUGATEUR. Liste EXHAUSTIVE.' : 'Présent implicite — pas de conjugateur à cette ère.',
    temps: flat(era.conjugateurs?.temps),
    aspects: flat(era.conjugateurs?.aspects),
    modes: flat(era.conjugateurs?.modes),
    evidentiel: flat(era.conjugateurs?.evidentiel)
  });
  const liaisons = () => ({
    regle: era.hasLiaisons ? 'racine1(forme liée) + liaison + racine2. JAMAIS comme pronom relatif "qui/que".' : 'Pas de liaisons à cette ère (mots isolés).',
    liaisons: flat(era.liaisons),
    familles: era.hasLiaisons ? { I: 'agentivité (i,ie,ii,iu)', U: 'appartenance (u,ui)', A: 'relation (a,aa,ae,ao)', O: 'tension (o,oa)', E: 'dimension (e,ei,ea,eo)' } : {}
  });
  const particules = () => ({ regle: `Position : ${era.particulePosition === 'after' ? 'APRÈS' : 'AVANT'} le mot.`, particules: era.particules || PARTICULES });
  const pronoms = () => ({ regle: 'Mots à part entière.', pronoms: data.pronoms || { miki: 'je/moi', sinu: 'tu/toi', tani: 'il/elle/iel' } });
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
function execValidateForm(input, ctx) {
  return validateTranslation(String(input.confluent || ''), eraOf(ctx));
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
  const era = eraOf(ctx);
  const word = String(input.confluent || '').toLowerCase().trim();
  if (!word) return { confluent: word, reconnu: false, raison: 'requête vide' };

  // 1. Phonotactique (alphabet de l'ère)
  const phono = validateForm(word, era);
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

  // 3. Verbe conjugué ? (radical + conjugateur de l'ère)
  const radicaux = extractRadicals(word, era.verbalSuffixes, era.conjugateurCodes);
  for (const r of radicaux) {
    if (r.type === 'conjugaison' && (era.conjugateurCodes || []).includes(r.suffix)) {
      // Le radical doit être un verbe/racine attesté (forme directe ou forme liée connue)
      const radEntry = byWord[r.radical];
      if (radEntry) {
        return { confluent: word, phonotactique_valide: true, reconnu: true, mode: 'verbe_conjugue',
          radical: r.radical, francais: radEntry.francais, type: radEntry.type,
          conjugateur: r.suffix, note: `verbe '${r.radical}' + conjugateur '${r.suffix}'` };
      }
    }
  }

  // 4. Composition racine-liaison-racine (liaisons de l'ère) ?
  const decomps = decomposeWord(word, ctx.morphReverseIndex, era.liaisons);
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
  const era = eraOf(ctx);
  const forme = String(input.forme || '').toLowerCase().trim();
  const racines = Array.isArray(input.racines) ? input.racines.map(r => String(r).toLowerCase().trim()) : [];
  const liaison = String(input.liaison || '').toLowerCase().trim();

  // Liaison valide = présente dans les liaisons de l'ère (proto : aucune liaison → toujours invalide).
  const liaisonValide = Boolean(era.liaisons && era.liaisons[liaison]);

  const byWord = (ctx.morphReverseIndex && ctx.morphReverseIndex.byWord) || {};
  const byFormeLiee = (ctx.morphReverseIndex && ctx.morphReverseIndex.byFormeLiee) || {};
  const racinesVerdict = racines.map(r => ({
    racine: r,
    // Déclarée si attestée comme mot complet OU comme forme liée connue.
    declaree: Boolean(byWord[r] || byFormeLiee[r])
  }));
  const racinesInconnues = racinesVerdict.filter(v => !v.declaree).map(v => v.racine);

  const formeVerdict = validateForm(forme, era);
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
 * back_translate — re-traduit le Confluent vers le français mot à mot (contrôle de SENS).
 *
 * QUOI : applique la logique CF→FR (translateConfluentToFrench : exact, verbes conjugués via
 *        radicaux, compositions N racines, annotations grammaticales) à la sortie de l'agent.
 * POURQUOI : le gate garantit la forme, pas le sens. La back-translation laisse l'agent COMPARER
 *        le français obtenu au sens voulu et attraper une dérive (ex: akoazana → « Faucon Chasseur »
 *        au lieu de « faucon »). Ne jamais supposer : toujours vérifier.
 * COMMENT : réutilise translateConfluentToFrench avec l'index morpho (byWord/byFormeLiee).
 */
function execBackTranslate(input, ctx) {
  const era = eraOf(ctx);
  const cf = String(input.confluent || '').trim();
  if (!cf) return { erreur: 'entrée vide' };

  // Maps de l'ère : particules/interrogatifs → rôle, conjugateurs → temps, liaisons → concept.
  const roleMap = {};
  for (const [k, v] of Object.entries(era.particules || {})) roleMap[k] = `[${v}]`;
  for (const [k, v] of Object.entries(era.interrogatifs || {})) roleMap[k] = `[${v}]`;
  const conjMap = {};
  for (const grp of Object.values(era.conjugateurs || {})) {
    if (grp && typeof grp === 'object') for (const [k, v] of Object.entries(grp)) conjMap[k] = (typeof v === 'string' ? v : (v.sens || k));
  }
  const liaisonGloss = {};
  for (const [k, v] of Object.entries(era.liaisons || {})) liaisonGloss[k] = (v && (v.concept || v.description)) || '';

  // COMMENT : token par token — particule/conjugateur → rôle grammatical ; sinon verify_word
  //   (qui gère DIRECT + verbe CONJUGUÉ + COMPOSITION/liaison). Ainsi la back-translation couvre
  //   les trois mécanismes (liaisons, conjugaison, particules), pas seulement les noms.
  const tokens = cf.toLowerCase().split(/[\s.,!?;:]+/).filter(Boolean);
  const par_mot = [];
  const non_reconnus = [];

  for (const tok of tokens) {
    // 1. Particule / négation / question → rôle
    if (roleMap[tok]) { par_mot.push({ cf: tok, fr: roleMap[tok] }); continue; }
    // 2. Conjugateur isolé (écrit séparément) → temps/aspect
    if (conjMap[tok]) { par_mot.push({ cf: tok, fr: `[${conjMap[tok]}]` }); continue; }
    // 3. Mot de contenu : verify_word (direct / verbe conjugué / composition)
    const v = execVerifyWord({ confluent: tok }, ctx);
    let fr = null;
    if (v.reconnu) {
      if (v.mode === 'verbe_conjugue') fr = `${v.francais} [${conjMap[v.conjugateur] || v.conjugateur}]`;
      else if (v.mode === 'composition') {
        // Intercaler la glose de chaque liaison entre les racines (le SENS de la composition).
        const ra = v.racines || [], li = v.liaisons || [];
        const parts = [];
        ra.forEach((r, i) => {
          parts.push(r.francais || r.racine);
          if (i < li.length && liaisonGloss[li[i]]) parts.push(`-${liaisonGloss[li[i]]}-`);
        });
        fr = '[' + parts.join(' ') + ']';
      } else fr = v.francais;
    }
    if (!fr) non_reconnus.push(tok);
    par_mot.push({ cf: tok, fr });
  }

  const francais_mot_a_mot = par_mot.map(p => p.fr || `[${p.cf}?]`).join(' ');
  const couverture = tokens.length ? Math.round(100 * (tokens.length - non_reconnus.length) / tokens.length) : 0;
  return {
    confluent: cf,
    francais_mot_a_mot,
    par_mot,
    non_reconnus,
    couverture: couverture + '%',
    note: "Compare 'francais_mot_a_mot' au sens FR voulu. Divergence (mauvais mot, nom propre/caste au " +
          "lieu du sens commun, mauvais temps) ou 'non_reconnus' → corrige. Ne suppose jamais que c'est bon. " +
          "(Les nombres peuvent apparaître non reconnus : c'est normal.)"
  };
}

/**
 * grammar_check — vérif de structure (ADVISORY), déléguée au module grammarCheck.
 *
 * QUOI : renvoie les warnings de grammaire (conjugateur, pluriel) sur la traduction finale.
 * POURQUOI : miroir déterministe pour l'agent ; ne bloque jamais (warn-not-fail).
 */
function execGrammarCheck(input, ctx) {
  const cf = String(input.confluent || '').trim();
  if (!cf) return { erreur: 'entrée vide' };
  const { ok, warnings } = checkGrammar(cf, eraOf(ctx));
  return {
    ok, warnings,
    note: ok
      ? 'Aucun problème de grammaire détecté (selon les règles encodées — pas une preuve de perfection).'
      : "Corrige les warnings 'haute' SAUF si c'est un choix stylistique assumé. Ne bloque jamais le rendu."
  };
}

/**
 * confirme_choix — l'agent assume un warning de clôture comme choix délibéré.
 *
 * QUOI : simple accusé ; l'EFFET (lever le warning bloquant, garder la trad) est géré par la boucle
 *        de l'agent qui détecte cet appel d'outil et capture la note. Aucune logique ici.
 * POURQUOI : matérialiser le choix conscient « corrige-ou-confirme » + tracer la justification.
 */
function execConfirmeChoix(input) {
  const note = String(input.note || '').trim();
  return note
    ? { ok: true, confirme: true, note }
    : { ok: false, erreur: 'note de justification requise pour confirmer.' };
}

/**
 * Dispatcher central.
 * @param {string} name
 * @param {Object} input
 * @param {{lexique: Object, reverseIndex: Object, morphReverseIndex: Object}} ctx
 */
function executeTool(name, input, ctx) {
  switch (name) {
    case 'analyze_text': return execAnalyzeText(input, ctx);
    case 'lookup_concept': return execLookupConcept(input, ctx);
    case 'get_grammar': return execGetGrammar(input, ctx);
    case 'validate_form': return execValidateForm(input, ctx);
    case 'verify_word': return execVerifyWord(input, ctx);
    case 'check_composition': return execCheckComposition(input, ctx);
    case 'back_translate': return execBackTranslate(input, ctx);
    case 'grammar_check': return execGrammarCheck(input, ctx);
    case 'confirme_choix': return execConfirmeChoix(input);
    default: return { error: `Outil inconnu: ${name}` };
  }
}

module.exports = {
  TOOL_DEFINITIONS,
  executeTool,
  LIAISONS_VALIDES,
  execAnalyzeText, execLookupConcept, execGetGrammar, execValidateForm, execVerifyWord, execCheckComposition, execBackTranslate, execGrammarCheck, execConfirmeChoix
};
