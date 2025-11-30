// morphologicalDecomposer.js
// Système de décomposition morphologique pour le Confluent
// Permet de décomposer les mots composés selon le pattern Racine-Liaison-Racine

const lexique = require('../data/lexique.json');

// ============================================================================
// CHARGEMENT DYNAMIQUE DES LIAISONS DEPUIS LE LEXIQUE
// ============================================================================

/**
 * Charge les liaisons sacrées depuis le lexique JSON
 * @returns {Object} Dictionnaire des liaisons {liaison: {domaine, concept, description}}
 */
function loadSacredLiaisons() {
  const liaisons = {};

  if (lexique.liaisons) {
    for (const [liaison, data] of Object.entries(lexique.liaisons)) {
      liaisons[liaison] = {
        domaine: data.domaine,
        concept: data.concept,
        description: data.description,
        base: data.base
      };
    }
  }

  return liaisons;
}

// Charger les liaisons depuis le lexique
const SACRED_LIAISONS = loadSacredLiaisons();

console.log(`[morphologicalDecomposer] Chargé ${Object.keys(SACRED_LIAISONS).length} liaisons sacrées depuis lexique.json`);

// ============================================================================
// VALIDATION DES RACINES
// ============================================================================

/**
 * Vérifie si une partie ressemble à une racine valide du Confluent
 * @param {string} part - Partie à valider
 * @param {Object} reverseIndex - Index de recherche (optionnel)
 * @returns {{isValid: boolean, found: boolean, confidence: number}}
 */
function validateRoot(part, reverseIndex = null) {
  // Critères de base
  if (part.length < 2) {
    return { isValid: false, found: false, confidence: 0 };
  }

  let confidence = 0.5; // base
  let found = false;

  // 1. Vérifier si la partie existe dans l'index de recherche
  if (reverseIndex) {
    // Recherche exacte
    if (reverseIndex.byWord && reverseIndex.byWord[part]) {
      found = true;
      confidence = 1.0;
      return { isValid: true, found: true, confidence };
    }

    // Recherche par forme liée (enlever dernière voyelle)
    if (reverseIndex.byFormeLiee) {
      const formeLiee = part.endsWith('a') || part.endsWith('e') ||
                        part.endsWith('i') || part.endsWith('o') ||
                        part.endsWith('u')
                        ? part.slice(0, -1)
                        : part;

      if (reverseIndex.byFormeLiee[formeLiee]) {
        found = true;
        confidence = 0.95;
        return { isValid: true, found: true, confidence };
      }
    }
  }

  // 2. Heuristiques morphologiques du Confluent
  // Les racines finissent généralement par CV (consonne + voyelle)
  const vowels = 'aeiou';
  const lastChar = part[part.length - 1];
  const secondLastChar = part.length > 1 ? part[part.length - 2] : '';

  // Finit par voyelle = probable racine
  if (vowels.includes(lastChar)) {
    confidence += 0.2;

    // Pattern CV en fin = très probable
    if (secondLastChar && !vowels.includes(secondLastChar)) {
      confidence += 0.2;
    }
  }

  // 3. Longueur typique (3-4 caractères pour racines)
  if (part.length >= 3 && part.length <= 5) {
    confidence += 0.1;
  }

  return {
    isValid: confidence >= 0.5,
    found: false,
    confidence: Math.min(confidence, 1.0)
  };
}

// ============================================================================
// DÉCOMPOSITION MORPHOLOGIQUE
// ============================================================================

/**
 * Décompose un mot composé non trouvé
 * @param {string} word - Mot composé en confluent
 * @param {Object} reverseIndex - Index de recherche (optionnel, pour validation)
 * @returns {Array<{part1: string, liaison: string, liaisonMeaning: string, part2: string, pattern: string, confidence: number, part1Valid: boolean, part2Valid: boolean}>}
 */
function decomposeWord(word, reverseIndex = null) {
  const decompositions = [];

  // Trier les liaisons par longueur décroissante (essayer 'aa' avant 'a')
  const liaisonsSorted = Object.keys(SACRED_LIAISONS).sort((a, b) => b.length - a.length);

  // Essayer chaque liaison sacrée
  for (const liaison of liaisonsSorted) {
    const index = word.indexOf(liaison);

    // La liaison doit être au milieu du mot, pas au début ni à la fin
    if (index > 0 && index < word.length - liaison.length) {
      const part1 = word.substring(0, index);
      const part2 = word.substring(index + liaison.length);

      // Valider les deux parties
      const part1Validation = validateRoot(part1, reverseIndex);
      const part2Validation = validateRoot(part2, reverseIndex);

      // Les deux parties doivent ressembler à des racines
      if (part1Validation.isValid && part2Validation.isValid) {
        const liaisonData = SACRED_LIAISONS[liaison];

        decompositions.push({
          part1,
          part1Found: part1Validation.found,
          part1Confidence: part1Validation.confidence,
          liaison,
          liaisonDomaine: liaisonData.domaine,
          liaisonConcept: liaisonData.concept,
          liaisonDescription: liaisonData.description,
          part2,
          part2Found: part2Validation.found,
          part2Confidence: part2Validation.confidence,
          pattern: `${part1}-${liaison}-${part2}`,
          confidence: calculateConfidence(
            part1,
            liaison,
            part2,
            part1Validation,
            part2Validation
          )
        });
      }
    }
  }

  // Trier par confiance décroissante
  return decompositions.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Calcule la confiance d'une décomposition
 * @param {string} part1 - Première partie (racine)
 * @param {string} liaison - Liaison sacrée
 * @param {string} part2 - Deuxième partie (racine)
 * @param {Object} part1Validation - Résultat de validation de part1
 * @param {Object} part2Validation - Résultat de validation de part2
 * @returns {number} Score de confiance entre 0 et 1
 */
function calculateConfidence(part1, liaison, part2, part1Validation, part2Validation) {
  let score = 0.3; // base plus conservative

  // BONUS MAJEUR : Si les deux parties sont trouvées dans le lexique
  if (part1Validation.found && part2Validation.found) {
    score = 0.95; // Très haute confiance !
  } else if (part1Validation.found || part2Validation.found) {
    score = 0.75; // Une partie trouvée = bonne confiance
  } else {
    // Utiliser la confiance des validations heuristiques
    score = (part1Validation.confidence + part2Validation.confidence) / 2;
  }

  // Bonus si liaison courante (i, u, a sont plus fréquentes)
  if (['i', 'u', 'a'].includes(liaison)) {
    score += 0.05;
  } else if (['aa', 'ii'].includes(liaison)) {
    score += 0.03;
  }

  // Bonus si longueurs de parties équilibrées
  const ratio = Math.min(part1.length, part2.length) / Math.max(part1.length, part2.length);
  score += ratio * 0.05;

  return Math.min(score, 1.0);
}

module.exports = {
  decomposeWord,
  SACRED_LIAISONS,
  validateRoot
};
