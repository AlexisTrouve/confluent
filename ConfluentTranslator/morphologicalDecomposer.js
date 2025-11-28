// morphologicalDecomposer.js
// Système de décomposition morphologique pour le Confluent
// Permet de décomposer les mots composés selon le pattern Racine-Liaison-Racine

// Les 16 liaisons sacrées du Confluent
const SACRED_LIAISONS = {
  // Agentivité
  'i': 'agent',
  'ie': 'agent_processus',
  'ii': 'agent_répété',
  'iu': 'agent_possédant',

  // Appartenance
  'u': 'appartenance',
  'ui': 'possession_agentive',

  // Relation
  'a': 'relation',
  'aa': 'relation_forte',
  'ae': 'relation_dimensionnelle',
  'ao': 'relation_tendue',

  // Tension
  'o': 'tension',
  'oa': 'tension_relationnelle',

  // Dimension
  'e': 'dimension',
  'ei': 'dimension_agentive',
  'ea': 'dimension_relationnelle',
  'eo': 'dimension_tendue'
};

/**
 * Décompose un mot composé non trouvé
 * @param {string} word - Mot composé en confluent
 * @returns {Array<{part1: string, liaison: string, liaisonMeaning: string, part2: string, pattern: string, confidence: number}>}
 */
function decomposeWord(word) {
  const decompositions = [];

  // Essayer chaque liaison sacrée
  for (const [liaison, meaning] of Object.entries(SACRED_LIAISONS)) {
    const index = word.indexOf(liaison);

    // La liaison doit être au milieu du mot, pas au début ni à la fin
    if (index > 0 && index < word.length - liaison.length) {
      const part1 = word.substring(0, index);
      const part2 = word.substring(index + liaison.length);

      // Valider que les deux parties ressemblent à des racines (au moins 2 caractères)
      if (part1.length >= 2 && part2.length >= 2) {
        decompositions.push({
          part1,
          liaison,
          liaisonMeaning: meaning,
          part2,
          pattern: `${part1}-${liaison}-${part2}`,
          confidence: calculateConfidence(part1, liaison, part2)
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
 * @returns {number} Score de confiance entre 0 et 1
 */
function calculateConfidence(part1, liaison, part2) {
  let score = 0.5; // base

  // Bonus si les parties finissent/commencent par des consonnes (plus typique du Confluent)
  if (!'aeiou'.includes(part1[part1.length - 1])) score += 0.1;
  if (!'aeiou'.includes(part2[0])) score += 0.1;

  // Bonus si liaison courante (i, u, a sont plus fréquentes)
  if (['i', 'u', 'a'].includes(liaison)) score += 0.2;

  // Bonus si longueurs de parties équilibrées
  const ratio = Math.min(part1.length, part2.length) / Math.max(part1.length, part2.length);
  score += ratio * 0.2;

  return Math.min(score, 1.0);
}

module.exports = {
  decomposeWord,
  SACRED_LIAISONS
};
