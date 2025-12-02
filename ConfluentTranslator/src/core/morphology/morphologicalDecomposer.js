// morphologicalDecomposer.js
// Système de décomposition morphologique pour le Confluent
// Permet de décomposer les mots composés selon le pattern Racine-Liaison-Racine

const lexique = require('../../data/lexique.json');

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
 * Cherche une racine en tenant compte de la forme liée (CVC/VC au lieu de CVCV/VCV)
 * @param {string} part - Partie tronquée (forme liée)
 * @param {Object} reverseIndex - Index de recherche
 * @param {boolean} isLastRoot - Si c'est la dernière racine (pas de troncature)
 * @returns {{found: boolean, fullRoot: string|null, entry: Object|null, confidence: number}}
 */
function findRootWithFormeLiee(part, reverseIndex, isLastRoot = false) {
  if (!reverseIndex || !reverseIndex.byWord) {
    return { found: false, fullRoot: null, entry: null, confidence: 0 };
  }

  // Si c'est la dernière racine, chercher directement
  if (isLastRoot) {
    if (reverseIndex.byWord[part]) {
      return {
        found: true,
        fullRoot: part,
        entry: reverseIndex.byWord[part],
        confidence: 1.0
      };
    }
    return { found: false, fullRoot: null, entry: null, confidence: 0 };
  }

  // Sinon, c'est une racine intermédiaire (forme liée = sans voyelle finale)
  // Essayer d'ajouter chaque voyelle possible
  const vowels = ['a', 'e', 'i', 'o', 'u'];

  for (const vowel of vowels) {
    const fullRoot = part + vowel;
    if (reverseIndex.byWord[fullRoot]) {
      return {
        found: true,
        fullRoot,
        entry: reverseIndex.byWord[fullRoot],
        confidence: 0.95
      };
    }
  }

  // Pas trouvé avec forme liée
  return { found: false, fullRoot: null, entry: null, confidence: 0 };
}

/**
 * Vérifie si une partie ressemble à une racine valide du Confluent
 * @param {string} part - Partie à valider
 * @param {Object} reverseIndex - Index de recherche (optionnel)
 * @param {boolean} isLastRoot - Si c'est la dernière racine
 * @returns {{isValid: boolean, found: boolean, confidence: number, fullRoot: string|null, entry: Object|null}}
 */
function validateRoot(part, reverseIndex = null, isLastRoot = false) {
  // Critères de base
  if (part.length < 2) {
    return { isValid: false, found: false, confidence: 0, fullRoot: null, entry: null };
  }

  let confidence = 0.5; // base
  let found = false;
  let fullRoot = null;
  let entry = null;

  // 1. Vérifier si la partie existe dans l'index de recherche (avec forme liée)
  if (reverseIndex) {
    const result = findRootWithFormeLiee(part, reverseIndex, isLastRoot);
    if (result.found) {
      return {
        isValid: true,
        found: true,
        confidence: result.confidence,
        fullRoot: result.fullRoot,
        entry: result.entry
      };
    }
  }

  // 2. Heuristiques morphologiques du Confluent
  // Les racines finissent généralement par CV (consonne + voyelle)
  const vowels = 'aeiou';
  const lastChar = part[part.length - 1];
  const secondLastChar = part.length > 1 ? part[part.length - 2] : '';

  // Pour la dernière racine : doit finir par voyelle
  if (isLastRoot) {
    if (vowels.includes(lastChar)) {
      confidence += 0.2;
      if (secondLastChar && !vowels.includes(secondLastChar)) {
        confidence += 0.2;
      }
    } else {
      // Dernière racine sans voyelle = invalide
      confidence = 0.2;
    }
  } else {
    // Pour racine intermédiaire : doit finir par consonne (forme liée)
    if (!vowels.includes(lastChar)) {
      confidence += 0.2;
      if (secondLastChar && vowels.includes(secondLastChar)) {
        confidence += 0.2; // Pattern VC ou CVC
      }
    }
  }

  // 3. Longueur typique (2-4 caractères pour racines tronquées, 3-5 pour complètes)
  const minLen = isLastRoot ? 3 : 2;
  const maxLen = isLastRoot ? 5 : 4;
  if (part.length >= minLen && part.length <= maxLen) {
    confidence += 0.1;
  }

  return {
    isValid: confidence >= 0.5,
    found: false,
    confidence: Math.min(confidence, 1.0),
    fullRoot: null,
    entry: null
  };
}

// ============================================================================
// DÉCOMPOSITION MORPHOLOGIQUE
// ============================================================================

/**
 * Décompose récursivement un mot en N racines
 * @param {string} word - Mot à décomposer
 * @param {Object} reverseIndex - Index de recherche
 * @param {number} depth - Profondeur de récursion (pour éviter boucle infinie)
 * @returns {Array<Object>} Liste de décompositions possibles
 */
function decomposeWordRecursive(word, reverseIndex, depth = 0) {
  const MAX_DEPTH = 10; // Max 10 racines dans un mot
  const decompositions = [];

  // Limite de profondeur
  if (depth >= MAX_DEPTH || word.length < 2) {
    return decompositions;
  }

  // Trier les liaisons par longueur décroissante (essayer 'aa' avant 'a')
  const liaisonsSorted = Object.keys(SACRED_LIAISONS).sort((a, b) => b.length - a.length);

  // Essayer chaque liaison sacrée
  for (const liaison of liaisonsSorted) {
    const index = word.indexOf(liaison);

    // La liaison doit être au milieu du mot, pas au début ni à la fin
    if (index > 0 && index < word.length - liaison.length) {
      const leftPart = word.substring(0, index);
      const rightPart = word.substring(index + liaison.length);

      // Valider la partie gauche (jamais la dernière racine)
      const leftValidation = validateRoot(leftPart, reverseIndex, false);

      if (!leftValidation.isValid) continue;

      // La partie droite peut être :
      // 1. Une racine simple (dernière racine)
      // 2. Un mot composé à décomposer récursivement

      // Essai 1 : rightPart est la dernière racine
      const rightValidation = validateRoot(rightPart, reverseIndex, true);

      if (rightValidation.isValid) {
        const liaisonData = SACRED_LIAISONS[liaison];

        decompositions.push({
          type: 'simple',
          roots: [
            {
              part: leftPart,
              fullRoot: leftValidation.fullRoot || leftPart,
              found: leftValidation.found,
              confidence: leftValidation.confidence,
              entry: leftValidation.entry,
              isLast: false
            },
            {
              part: rightPart,
              fullRoot: rightValidation.fullRoot || rightPart,
              found: rightValidation.found,
              confidence: rightValidation.confidence,
              entry: rightValidation.entry,
              isLast: true
            }
          ],
          liaisons: [
            {
              liaison,
              domaine: liaisonData.domaine,
              concept: liaisonData.concept,
              description: liaisonData.description
            }
          ],
          pattern: `${leftValidation.fullRoot || leftPart}-${liaison}-${rightValidation.fullRoot || rightPart}`,
          confidence: calculateConfidenceRecursive([leftValidation, rightValidation], 1)
        });
      }

      // Essai 2 : rightPart est un mot composé
      const rightDecompositions = decomposeWordRecursive(rightPart, reverseIndex, depth + 1);

      for (const rightDecomp of rightDecompositions) {
        const liaisonData = SACRED_LIAISONS[liaison];

        // Combiner left + liaison + rightDecomp
        const allRoots = [
          {
            part: leftPart,
            fullRoot: leftValidation.fullRoot || leftPart,
            found: leftValidation.found,
            confidence: leftValidation.confidence,
            entry: leftValidation.entry,
            isLast: false
          },
          ...rightDecomp.roots
        ];

        const allLiaisons = [
          {
            liaison,
            domaine: liaisonData.domaine,
            concept: liaisonData.concept,
            description: liaisonData.description
          },
          ...rightDecomp.liaisons
        ];

        const pattern = `${leftValidation.fullRoot || leftPart}-${liaison}-${rightDecomp.pattern}`;
        const allValidations = [leftValidation, ...rightDecomp.roots.map(r => ({ found: r.found, confidence: r.confidence }))];

        decompositions.push({
          type: 'recursive',
          roots: allRoots,
          liaisons: allLiaisons,
          pattern,
          confidence: calculateConfidenceRecursive(allValidations, allLiaisons.length)
        });
      }
    }
  }

  return decompositions;
}

/**
 * Décompose un mot composé non trouvé (wrapper public)
 * @param {string} word - Mot composé en confluent
 * @param {Object} reverseIndex - Index de recherche (optionnel, pour validation)
 * @returns {Array<Object>} Liste de décompositions possibles, triées par confiance
 */
function decomposeWord(word, reverseIndex = null) {
  const decompositions = decomposeWordRecursive(word, reverseIndex, 0);

  // Trier par confiance décroissante
  return decompositions.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Calcule la confiance d'une décomposition récursive avec N racines
 * @param {Array<Object>} validations - Liste des validations de racines
 * @param {number} liaisonCount - Nombre de liaisons
 * @returns {number} Score de confiance entre 0 et 1
 */
function calculateConfidenceRecursive(validations, liaisonCount) {
  let score = 0.3; // base conservative

  // Compter combien de racines sont trouvées dans le lexique
  const foundCount = validations.filter(v => v.found).length;
  const totalCount = validations.length;

  // Score basé sur le pourcentage de racines trouvées
  if (foundCount === totalCount) {
    score = 0.95; // Toutes les racines trouvées = très haute confiance
  } else if (foundCount >= totalCount * 0.75) {
    score = 0.85; // 75%+ trouvées = haute confiance
  } else if (foundCount >= totalCount * 0.5) {
    score = 0.70; // 50%+ trouvées = bonne confiance
  } else if (foundCount > 0) {
    score = 0.55; // Au moins une trouvée = confiance moyenne
  } else {
    // Aucune trouvée : utiliser la moyenne des confiances heuristiques
    const avgConfidence = validations.reduce((sum, v) => sum + v.confidence, 0) / totalCount;
    score = avgConfidence * 0.8; // Pénalité car aucune racine confirmée
  }

  // Pénalité pour longueur : plus il y a de racines, moins on est sûr
  if (liaisonCount > 2) {
    score *= Math.pow(0.95, liaisonCount - 2); // -5% par liaison supplémentaire
  }

  return Math.min(score, 1.0);
}

/**
 * Calcule la confiance d'une décomposition (version legacy pour compatibilité)
 * @param {string} part1 - Première partie (racine)
 * @param {string} liaison - Liaison sacrée
 * @param {string} part2 - Deuxième partie (racine)
 * @param {Object} part1Validation - Résultat de validation de part1
 * @param {Object} part2Validation - Résultat de validation de part2
 * @returns {number} Score de confiance entre 0 et 1
 */
function calculateConfidence(part1, liaison, part2, part1Validation, part2Validation) {
  return calculateConfidenceRecursive([part1Validation, part2Validation], 1);
}

module.exports = {
  decomposeWord,
  decomposeWordRecursive,
  SACRED_LIAISONS,
  validateRoot,
  findRootWithFormeLiee
};
