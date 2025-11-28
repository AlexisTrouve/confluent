// radicalMatcher.js
// Système de recherche par radicaux pour le traducteur Confluent→Français
// Permet de trouver les formes conjuguées et dérivées à partir des racines

// Suffixes verbaux identifiés dans le corpus
const VERBAL_SUFFIXES = [
  'ak',    // forme standard : mirak (voir), pasak (prendre), urak (être)
  'an',    // conjugaison : takan (porter), vokan (parler?)
  'un',    // conjugaison : kisun (transmettre), pasun (prendre?)
  'is',    // conjugaison : vokis (parler?)
  'am',    // conjugaison : sukam (forger)
  'im',    // conjugaison : verim (vérifier?)
  'ok',    // impératif : marqueur temporel
  'ul',    // passé? : marqueur temporel
  'iran',  // dérivé nominal : kisiran (enseignement/transmission?)
];

/**
 * Extrait tous les radicaux possibles d'un mot
 * @param {string} word - Mot en confluent
 * @returns {Array<{radical: string, suffix: string, type: string, confidence: number}>}
 */
function extractRadicals(word) {
  const candidates = [];

  // Essayer chaque suffixe verbal connu
  for (const suffix of VERBAL_SUFFIXES) {
    if (word.endsWith(suffix) && word.length > suffix.length + 1) {
      const radical = word.slice(0, -suffix.length);
      candidates.push({
        radical,
        suffix,
        type: 'verbal',
        confidence: 0.9
      });
    }
  }

  // Essayer sans suffixe (forme racine directe)
  if (word.length >= 3) {
    candidates.push({
      radical: word,
      suffix: '',
      type: 'root',
      confidence: 0.7
    });
  }

  // Essayer d'enlever dernière voyelle (forme liée -> forme pleine)
  // mako → mak, voki → vok
  if (word.length >= 4 && 'aeiou'.includes(word[word.length - 1])) {
    candidates.push({
      radical: word.slice(0, -1),
      suffix: word[word.length - 1],
      type: 'liaison',
      confidence: 0.8
    });
  }

  // Trier par confiance décroissante
  return candidates.sort((a, b) => b.confidence - a.confidence);
}

module.exports = {
  extractRadicals,
  VERBAL_SUFFIXES
};
