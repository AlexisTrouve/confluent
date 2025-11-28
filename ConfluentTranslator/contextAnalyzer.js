/**
 * Context Analyzer - Analyse le texte français et extrait le contexte pertinent du lexique
 *
 * Fonctionnalités:
 * 1. Tokenization française
 * 2. Recherche dans le lexique avec scoring
 * 3. Expansion sémantique (niveau 1: synonymes directs)
 * 4. Calcul dynamique du nombre max d'entrées selon longueur
 * 5. Fallback racines si aucun terme trouvé
 */

/**
 * Tokenize un texte français
 * - Lowercase
 * - Retire ponctuation
 * - Split sur espaces
 * - Retire mots vides très courants (le, la, les, un, une, des, de, du)
 * @param {string} text - Texte français à tokenizer
 * @returns {string[]} - Liste de mots
 */
function tokenizeFrench(text) {
  // Mots vides à retirer (articles, prépositions très courantes)
  const stopWords = new Set([
    'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'd',
    'au', 'aux', 'à', 'et', 'ou', 'où', 'est', 'sont'
  ]);

  return text
    .toLowerCase()
    .normalize('NFD') // Normaliser les accents
    .replace(/[\u0300-\u036f]/g, '') // Retirer les diacritiques
    .replace(/[^\w\s]/g, ' ') // Remplacer ponctuation par espaces
    .split(/\s+/)
    .filter(word => word.length > 0 && !stopWords.has(word));
}

/**
 * Calcule le nombre maximum d'entrées selon la longueur du texte
 * - < 20 mots: 30 entrées
 * - 20-50 mots: 50 entrées
 * - > 50 mots: 100 entrées
 * @param {number} wordCount - Nombre de mots
 * @returns {number} - Nombre max d'entrées
 */
function calculateMaxEntries(wordCount) {
  if (wordCount < 20) return 30;
  if (wordCount <= 50) return 50;
  return 100;
}

/**
 * Lemmatisation simple française pour trouver la forme de base
 * @param {string} word - Mot à lemmatiser
 * @returns {string[]} - Formes possibles (incluant l'original)
 */
function simpleLemmatize(word) {
  const forms = [word];

  // Gérer pluriels simples
  if (word.endsWith('s') && word.length > 2) {
    forms.push(word.slice(0, -1)); // enfants → enfant
  }
  if (word.endsWith('x') && word.length > 2) {
    forms.push(word.slice(0, -1)); // eaux → eau
  }

  // Gérer formes verbales courantes
  const verbEndings = {
    'ent': '', // transmettent → transmett → chercher "transmettre"
    'ons': 'er', // donnons → donner
    'ez': 'er', // donnez → donner
    'ais': 'er', // donnais → donner
    'ait': 'er', // donnait → donner
    'ions': 'er', // donnions → donner
    'iez': 'er', // donniez → donner
    'aient': 'er', // donnaient → donner
    'ai': 'er', // donnai → donner
    'as': 'er', // donnas → donner
    'a': 'er', // donna → donner
    'âmes': 'er', // donnâmes → donner
    'âtes': 'er', // donnâtes → donner
    'èrent': 'er', // donnèrent → donner
    'erai': 'er', // donnerai → donner
    'eras': 'er', // donneras → donner
    'era': 'er', // donnera → donner
    'erons': 'er', // donnerons → donner
    'erez': 'er', // donnerez → donner
    'eront': 'er', // donneront → donner
  };

  // Essayer de retirer les terminaisons verbales
  for (const [ending, replacement] of Object.entries(verbEndings)) {
    if (word.endsWith(ending) && word.length > ending.length + 2) {
      const root = word.slice(0, -ending.length);
      forms.push(root + replacement);
      forms.push(root); // juste la racine aussi
    }
  }

  // Formes en -ir
  if (word.endsWith('it') && word.length > 3) {
    forms.push(word.slice(0, -2) + 'ir'); // voit → voir
  }
  if (word.endsWith('is') && word.length > 3) {
    forms.push(word.slice(0, -2) + 'ir'); // finis → finir
  }

  // Retirer les s finaux de l'infinitif hypothétique
  forms.forEach(f => {
    if (f.endsWith('s')) {
      forms.push(f.slice(0, -1));
    }
  });

  return [...new Set(forms)]; // Dédupliquer
}

/**
 * Cherche un mot dans le dictionnaire (correspondance exacte ou synonyme)
 * @param {string} word - Mot à chercher
 * @param {Object} dictionnaire - Dictionnaire du lexique
 * @returns {Array} - Entrées trouvées avec score
 */
function searchWord(word, dictionnaire) {
  const results = [];
  const lemmas = simpleLemmatize(word);

  for (const [key, entry] of Object.entries(dictionnaire)) {
    let score = 0;

    // Correspondance exacte sur le mot français
    if (key === word || entry.mot_francais?.toLowerCase() === word) {
      score = 1.0;
    }
    // Correspondance sur formes lemmatisées
    else if (lemmas.some(lemma => key === lemma || entry.mot_francais?.toLowerCase() === lemma)) {
      score = 0.95;
    }
    // Correspondance sur synonymes
    else if (entry.synonymes_fr?.some(syn => syn.toLowerCase() === word)) {
      score = 0.9;
    }
    // Correspondance sur synonymes lemmatisés
    else if (entry.synonymes_fr?.some(syn => lemmas.includes(syn.toLowerCase()))) {
      score = 0.85;
    }
    // Correspondance sur racine française déclarée dans le lexique
    else if (entry.racine_fr && word.startsWith(entry.racine_fr.toLowerCase())) {
      score = 0.75;
    }

    if (score > 0) {
      results.push({
        mot_francais: entry.mot_francais || key,
        traductions: entry.traductions || [],
        score,
        source: entry.source_files || []
      });
    }
  }

  return results;
}

/**
 * Trouve toutes les entrées pertinentes pour une liste de mots
 * @param {string[]} words - Liste de mots
 * @param {Object} lexique - Lexique complet
 * @param {number} maxEntries - Nombre max d'entrées
 * @returns {Object} - Résultat avec entrées trouvées et métadonnées
 */
function findRelevantEntries(words, lexique, maxEntries) {
  const foundEntries = new Map(); // key: mot_francais, value: entry
  const wordsFound = []; // Pour Layer 2
  const wordsNotFound = [];

  if (!lexique || !lexique.dictionnaire) {
    return {
      entries: [],
      wordsFound: [],
      wordsNotFound: words,
      totalWords: words.length,
      entriesCount: 0
    };
  }

  // Chercher chaque mot
  for (const word of words) {
    const results = searchWord(word, lexique.dictionnaire);

    if (results.length > 0) {
      // Prendre la meilleure correspondance
      const best = results.sort((a, b) => b.score - a.score)[0];

      if (!foundEntries.has(best.mot_francais)) {
        foundEntries.set(best.mot_francais, best);
        wordsFound.push({
          input: word,
          found: best.mot_francais,
          confluent: best.traductions[0]?.confluent || '?',
          type: best.traductions[0]?.type || 'unknown',
          score: best.score
        });
      }
    } else {
      wordsNotFound.push(word);
    }
  }

  // Convertir Map en Array
  const entries = Array.from(foundEntries.values());

  // Limiter au nombre max (trier par score décroissant)
  const limitedEntries = entries
    .sort((a, b) => b.score - a.score)
    .slice(0, maxEntries);

  return {
    entries: limitedEntries,
    wordsFound: wordsFound.sort((a, b) => b.score - a.score),
    wordsNotFound,
    totalWords: words.length,
    entriesCount: limitedEntries.length
  };
}

/**
 * Expansion sémantique niveau 1: ajouter les synonymes directs
 * @param {Array} entries - Entrées déjà trouvées
 * @param {Object} lexique - Lexique complet
 * @param {number} maxEntries - Limite max
 * @param {number} expansionLevel - Niveau d'expansion (1 pour l'instant)
 * @returns {Array} - Entrées expandées
 */
function expandContext(entries, lexique, maxEntries, expansionLevel = 1) {
  if (expansionLevel === 0 || !lexique || !lexique.dictionnaire) {
    return entries;
  }

  const expanded = new Map();

  // Ajouter les entrées existantes
  entries.forEach(entry => {
    expanded.set(entry.mot_francais, entry);
  });

  // Niveau 1: Ajouter synonymes directs
  if (expansionLevel >= 1) {
    for (const entry of entries) {
      if (expanded.size >= maxEntries) break;

      // Chercher dans le dictionnaire les synonymes de ce mot
      for (const [key, dictEntry] of Object.entries(lexique.dictionnaire)) {
        if (expanded.size >= maxEntries) break;

        // Si ce mot est dans les synonymes de l'entrée trouvée
        if (dictEntry.synonymes_fr?.includes(entry.mot_francais)) {
          if (!expanded.has(dictEntry.mot_francais || key)) {
            expanded.set(dictEntry.mot_francais || key, {
              mot_francais: dictEntry.mot_francais || key,
              traductions: dictEntry.traductions || [],
              score: 0.7, // Score pour expansion niveau 1
              source: dictEntry.source_files || [],
              expanded: true
            });
          }
        }
      }
    }
  }

  return Array.from(expanded.values());
}

/**
 * Extrait toutes les racines du lexique (pour fallback)
 * @param {Object} lexique - Lexique complet
 * @returns {Array} - Liste des racines
 */
function extractRoots(lexique) {
  const roots = [];
  const seen = new Set(); // Pour éviter doublons

  if (!lexique || !lexique.dictionnaire) {
    return roots;
  }

  for (const [key, entry] of Object.entries(lexique.dictionnaire)) {
    if (entry.traductions) {
      for (const trad of entry.traductions) {
        // Inclure racine et racine_sacree
        if (trad.type === 'racine' || trad.type === 'racine_sacree') {
          const rootKey = `${trad.confluent}-${entry.mot_francais}`;

          if (!seen.has(rootKey)) {
            seen.add(rootKey);
            roots.push({
              mot_francais: entry.mot_francais || key,
              confluent: trad.confluent,
              forme_liee: trad.forme_liee || trad.confluent,
              type: trad.type || 'racine',
              sacree: trad.type === 'racine_sacree' || (trad.confluent?.[0] && 'aeiouAEIOU'.includes(trad.confluent[0])),
              domaine: trad.domaine || 'inconnu',
              note: trad.note || ''
            });
          }
        }
      }
    }
  }

  return roots;
}

/**
 * Analyse complète du contexte
 * @param {string} text - Texte français à analyser
 * @param {Object} lexique - Lexique complet
 * @param {Object} options - Options (expansionLevel, etc.)
 * @returns {Object} - Contexte complet avec métadonnées
 */
function analyzeContext(text, lexique, options = {}) {
  const expansionLevel = options.expansionLevel || 1;

  // 1. Tokenization
  const words = tokenizeFrench(text);
  const uniqueWords = [...new Set(words)];

  // 2. Calculer limite dynamique
  const maxEntries = calculateMaxEntries(words.length);

  // 3. Trouver entrées pertinentes
  const searchResult = findRelevantEntries(uniqueWords, lexique, maxEntries);

  // 4. Expansion sémantique
  const expandedEntries = expandContext(
    searchResult.entries,
    lexique,
    maxEntries,
    expansionLevel
  );

  // 5. Fallback si trop de mots manquants (>50% de mots non trouvés)
  const wordsFoundCount = searchResult.wordsFound.length;
  const wordsNotFoundCount = searchResult.wordsNotFound.length;
  const totalWords = wordsFoundCount + wordsNotFoundCount;
  const coveragePercent = totalWords > 0 ? (wordsFoundCount / totalWords) * 100 : 0;

  // Activer fallback si :
  // - Aucune entrée trouvée OU
  // - Couverture < 50% (majorité de mots manquants)
  const useFallback = expandedEntries.length === 0 || coveragePercent < 50;
  const rootsFallback = useFallback ? extractRoots(lexique) : [];

  // 6. Calculer tokens économisés (estimation)
  const totalLexiqueEntries = Object.keys(lexique.dictionnaire || {}).length;
  const tokensFullLexique = totalLexiqueEntries * 15; // ~15 tokens par entrée en moyenne
  const tokensUsed = (useFallback ? rootsFallback.length : expandedEntries.length) * 15;
  const tokensSaved = tokensFullLexique - tokensUsed;
  const savingsPercent = totalLexiqueEntries > 0
    ? Math.round((tokensSaved / tokensFullLexique) * 100)
    : 0;

  return {
    // Données pour le prompt
    entries: useFallback ? [] : expandedEntries,
    rootsFallback: useFallback ? rootsFallback : [],
    useFallback,

    // Métadonnées pour Layer 2
    metadata: {
      inputText: text,
      wordCount: words.length,
      uniqueWordCount: uniqueWords.length,
      maxEntries,
      wordsFound: searchResult.wordsFound,
      wordsNotFound: searchResult.wordsNotFound,
      entriesUsed: useFallback ? rootsFallback.length : expandedEntries.length,
      totalLexiqueSize: totalLexiqueEntries,
      tokensFullLexique,
      tokensUsed,
      tokensSaved,
      savingsPercent,
      expansionLevel,
      useFallback
    }
  };
}

module.exports = {
  tokenizeFrench,
  calculateMaxEntries,
  simpleLemmatize,
  searchWord,
  findRelevantEntries,
  expandContext,
  extractRoots,
  analyzeContext
};
