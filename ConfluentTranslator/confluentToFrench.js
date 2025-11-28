/**
 * Confluent to French Translator - Traduction brute mot-à-mot
 *
 * Fonctionnalités:
 * 1. Tokenization du texte Confluent
 * 2. Recherche dans l'index inversé
 * 3. Traduction brute avec annotations grammaticales
 * 4. Recherche par radicaux (nouveauté)
 * 5. Décomposition morphologique (nouveauté)
 */

const { extractRadicals } = require('./radicalMatcher');
const { decomposeWord } = require('./morphologicalDecomposer');

/**
 * Tokenize un texte Confluent
 * - Retire la ponctuation
 * - Lowercase tout
 * - Split sur espaces
 * @param {string} text - Texte Confluent
 * @returns {string[]} - Liste de tokens
 */
function tokenizeConfluent(text) {
  return text
    .toLowerCase()
    .replace(/[.,;:!?]/g, ' ') // Remplacer ponctuation par espaces
    .trim()
    .split(/\s+/)
    .filter(token => token.length > 0);
}

/**
 * Cherche un mot Confluent dans l'index inversé avec recherche en cascade
 * Essaie plusieurs stratégies:
 * 1. Correspondance exacte dans byWord
 * 2. Correspondance case-insensitive dans byWord
 * 3. NOUVEAU: Recherche par radicaux dans byFormeLiee
 * 4. NOUVEAU: Décomposition morphologique
 * @param {string} word - Mot Confluent
 * @param {Object} reverseIndex - Index inversé Confluent → FR (avec byWord et byFormeLiee)
 * @returns {Object|null} - Entrée trouvée ou null
 */
function searchConfluent(word, reverseIndex) {
  // Support ancien format (simple dict) et nouveau format (avec byWord/byFormeLiee)
  const byWord = reverseIndex.byWord || reverseIndex;
  const byFormeLiee = reverseIndex.byFormeLiee || {};

  // 1. Essai exact dans byWord
  if (byWord[word]) {
    return {
      ...byWord[word],
      matchType: 'exact',
      confidence: 1.0
    };
  }

  // 2. Essai lowercase dans byWord
  const lowerWord = word.toLowerCase();
  if (byWord[lowerWord]) {
    return {
      ...byWord[lowerWord],
      matchType: 'exact',
      confidence: 1.0
    };
  }

  // 3. Essai avec première lettre en majuscule (pour noms propres)
  const capitalizedWord = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  if (byWord[capitalizedWord]) {
    return {
      ...byWord[capitalizedWord],
      matchType: 'exact',
      confidence: 1.0
    };
  }

  // 4. NOUVEAU: Recherche par radicaux verbaux
  const radicals = extractRadicals(lowerWord);
  for (const {radical, suffix, type, confidence} of radicals) {
    // Chercher dans l'index par forme_liee
    if (byFormeLiee[radical]) {
      const match = byFormeLiee[radical][0]; // Prendre la première correspondance
      return {
        ...match,
        matchType: 'radical',
        originalWord: word,
        radical,
        suffix,
        suffixType: type,
        confidence
      };
    }
  }

  // 5. NOUVEAU: Décomposition morphologique
  const decompositions = decomposeWord(lowerWord);
  for (const decomp of decompositions) {
    const part1Match = searchConfluent(decomp.part1, reverseIndex);
    const part2Match = searchConfluent(decomp.part2, reverseIndex);

    if (part1Match && part2Match) {
      return {
        matchType: 'composition_inferred',
        originalWord: word,
        composition: `${decomp.part1}-${decomp.liaison}-${decomp.part2}`,
        parts: {
          part1: part1Match,
          liaison: decomp.liaison,
          liaisonMeaning: decomp.liaisonMeaning,
          part2: part2Match
        },
        confidence: decomp.confidence * 0.7, // Pénalité pour inférence
        francais: `${part1Match.francais} [${decomp.liaisonMeaning}] ${part2Match.francais}`,
        type: 'composition'
      };
    }
  }

  // 6. Vraiment inconnu
  return null;
}

/**
 * Traduit un token Confluent en français (brut)
 * @param {string} token - Token Confluent
 * @param {Object} reverseIndex - Index inversé
 * @returns {string} - Traduction brute
 */
function translateToken(token, reverseIndex) {
  const entry = searchConfluent(token, reverseIndex);

  if (!entry) {
    return `[INCONNU:${token}]`;
  }

  // Si c'est une particule/marqueur grammatical, retourner l'annotation
  const grammaticalTypes = [
    'particule',
    'marqueur_temps',
    'negation',
    'quantite',
    'interrogation',
    'demonstratif'
  ];

  if (grammaticalTypes.includes(entry.type)) {
    return entry.francais; // Déjà entre crochets
  }

  // Sinon retourner le mot français
  let result = entry.francais;

  // Ajouter les synonymes si présents (entre parenthèses)
  if (entry.synonymes_fr && entry.synonymes_fr.length > 0) {
    result += ` (ou: ${entry.synonymes_fr.join(', ')})`;
  }

  return result;
}

/**
 * Traduit un texte Confluent en français (traduction brute mot-à-mot)
 * @param {string} text - Texte Confluent
 * @param {Object} reverseIndex - Index inversé
 * @returns {Object} - Résultat avec traduction et métadonnées
 */
function translateConfluentToFrench(text, reverseIndex) {
  const tokens = tokenizeConfluent(text);
  const translations = [];
  const unknownWords = [];

  tokens.forEach(token => {
    const translation = translateToken(token, reverseIndex);
    translations.push(translation);

    if (translation.startsWith('[INCONNU:')) {
      unknownWords.push(token);
    }
  });

  return {
    original: text,
    tokens: tokens,
    translation: translations.join(' '),
    translations: translations,
    unknownWords: unknownWords,
    tokenCount: tokens.length,
    unknownCount: unknownWords.length,
    coverage: tokens.length > 0
      ? Math.round(((tokens.length - unknownWords.length) / tokens.length) * 100)
      : 0
  };
}

/**
 * Version enrichie avec détails sur chaque token
 * @param {string} text - Texte Confluent
 * @param {Object} reverseIndex - Index inversé
 * @returns {Object} - Résultat détaillé
 */
function translateConfluentDetailed(text, reverseIndex) {
  const tokens = tokenizeConfluent(text);
  const detailed = [];

  tokens.forEach(token => {
    const entry = searchConfluent(token, reverseIndex);

    detailed.push({
      confluent: token,
      francais: entry ? entry.francais : null,
      type: entry ? entry.type : 'inconnu',
      synonymes: entry?.synonymes_fr || [],
      forme_liee: entry?.forme_liee || null,
      composition: entry?.composition || null,
      found: !!entry,
      // NOUVEAU: métadonnées de recherche
      matchType: entry?.matchType || null,
      confidence: entry?.confidence || null,
      radical: entry?.radical || null,
      suffix: entry?.suffix || null,
      parts: entry?.parts || null
    });
  });

  const unknownCount = detailed.filter(d => !d.found).length;

  return {
    original: text,
    tokens: detailed,
    coverage: tokens.length > 0
      ? Math.round(((tokens.length - unknownCount) / tokens.length) * 100)
      : 0,
    unknownCount: unknownCount,
    tokenCount: tokens.length
  };
}

module.exports = {
  tokenizeConfluent,
  searchConfluent,
  translateToken,
  translateConfluentToFrench,
  translateConfluentDetailed
};
