// radicalMatcher.js
// Système de recherche par radicaux pour le traducteur Confluent→Français
// Permet de trouver les formes conjuguées et dérivées à partir des racines

const lexique = require('../../data/lexique.json');

// ============================================================================
// CHARGEMENT DYNAMIQUE DES SUFFIXES DEPUIS LE LEXIQUE
// ============================================================================

/**
 * Extrait tous les conjugateurs depuis le lexique JSON
 * @returns {Array<string>} Liste des conjugateurs (u, at, ok, ul, etc.)
 */
function getConjugateurs() {
  const conjugateurs = [];

  if (lexique.conjugateurs) {
    // Temps : u, at, aan, ait, amat, en
    if (lexique.conjugateurs.temps) {
      conjugateurs.push(...Object.keys(lexique.conjugateurs.temps));
    }

    // Aspects : il, eol, eon, eom
    if (lexique.conjugateurs.aspects) {
      conjugateurs.push(...Object.keys(lexique.conjugateurs.aspects));
    }

    // Modes : ok, es, ul
    if (lexique.conjugateurs.modes) {
      conjugateurs.push(...Object.keys(lexique.conjugateurs.modes));
    }

    // Évidentiel : uv
    if (lexique.conjugateurs.evidentiel) {
      conjugateurs.push(...Object.keys(lexique.conjugateurs.evidentiel));
    }
  }

  return conjugateurs;
}

/**
 * Extrait les suffixes d'infinitif depuis la liste des verbes
 * Analyse les patterns : racine "mira" → verbe "mirak" = suffixe "k"
 * @returns {Array<string>} Liste des suffixes d'infinitif (k, s, n, m, etc.)
 */
function getInfinitifSuffixes() {
  const suffixes = new Set();

  if (lexique.verbes) {
    for (const verbe of lexique.verbes) {
      if (verbe.infinitif && verbe.racine) {
        // Extraire le suffixe : infinitif - racine
        // Ex: "mirak" - "mira" = "k"
        if (verbe.infinitif.startsWith(verbe.racine)) {
          const suffix = verbe.infinitif.slice(verbe.racine.length);
          if (suffix.length > 0) {
            suffixes.add(suffix);
          }
        }
      }
    }
  }

  // Aussi chercher dans les racines avec propriété "verbe"
  if (lexique.racines && lexique.racines.standards) {
    for (const categorie of Object.values(lexique.racines.standards)) {
      if (Array.isArray(categorie)) {
        for (const racine of categorie) {
          if (racine.verbe && racine.forme_base) {
            // Ex: forme_base "mira" → verbe "mirak" = suffixe "k"
            if (racine.verbe.startsWith(racine.forme_base)) {
              const suffix = racine.verbe.slice(racine.forme_base.length);
              if (suffix.length > 0) {
                suffixes.add(suffix);
              }
            }
          }
        }
      }
    }
  }

  return Array.from(suffixes);
}

// Charger les suffixes depuis le lexique
const CONJUGATEURS = getConjugateurs();
const INFINITIF_SUFFIXES = getInfinitifSuffixes();

// Tous les suffixes verbaux = conjugateurs + suffixes d'infinitif
const VERBAL_SUFFIXES = [...CONJUGATEURS, ...INFINITIF_SUFFIXES];

console.log('[radicalMatcher] Chargé depuis lexique.json:');
console.log(`  - ${CONJUGATEURS.length} conjugateurs:`, CONJUGATEURS.join(', '));
console.log(`  - ${INFINITIF_SUFFIXES.length} suffixes d'infinitif:`, INFINITIF_SUFFIXES.join(', '));
console.log(`  - ${VERBAL_SUFFIXES.length} suffixes verbaux totaux`);

// ============================================================================
// EXTRACTION DES RADICAUX
// ============================================================================

/**
 * Extrait tous les radicaux possibles d'un mot
 * @param {string} word - Mot en confluent
 * @returns {Array<{radical: string, suffix: string, type: string, confidence: number}>}
 */
function extractRadicals(word) {
  const candidates = [];

  // 1. Essayer chaque suffixe verbal connu (conjugateurs + infinitifs)
  for (const suffix of VERBAL_SUFFIXES) {
    if (word.endsWith(suffix) && word.length > suffix.length + 1) {
      const radical = word.slice(0, -suffix.length);

      // Différencier conjugateurs et infinitifs pour la confiance
      const isConjugateur = CONJUGATEURS.includes(suffix);
      const type = isConjugateur ? 'conjugaison' : 'infinitif';

      candidates.push({
        radical,
        suffix,
        type,
        confidence: isConjugateur ? 0.95 : 0.9
      });
    }
  }

  // 2. Essayer sans suffixe (forme racine directe)
  if (word.length >= 3) {
    candidates.push({
      radical: word,
      suffix: '',
      type: 'root',
      confidence: 0.7
    });
  }

  // 3. Essayer d'enlever dernière voyelle (forme liée -> forme pleine)
  // Ex: mako → mak, voki → vok
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
  VERBAL_SUFFIXES,
  CONJUGATEURS,
  INFINITIF_SUFFIXES
};
