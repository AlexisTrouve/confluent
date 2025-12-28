#!/usr/bin/env node

/**
 * Script de vérification des doublons dans le lexique Confluent
 * Gère les accents, apostrophes et variantes orthographiques
 */

const fs = require('fs');
const path = require('path');

const LEXIQUE_DIR = path.join(__dirname, '../ancien-confluent/lexique');

/**
 * Normalise un mot français pour la comparaison
 * - Retire accents
 * - Convertit en minuscules
 * - Normalise les apostrophes
 */
function normalizeWord(word) {
  return word
    .toLowerCase()
    .normalize('NFD') // Décompose les caractères accentués
    .replace(/[\u0300-\u036f]/g, '') // Retire les diacritiques
    .replace(/[''′`]/g, "'") // Normalise les apostrophes
    .replace(/[œ]/g, 'oe')
    .replace(/[æ]/g, 'ae')
    .trim();
}

/**
 * Extrait tous les mots français d'un fichier lexique
 */
function extractWordsFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);

  const words = new Map(); // normalized -> {original, file, synonyms}

  if (!data.dictionnaire) return words;

  Object.keys(data.dictionnaire).forEach(mot => {
    const normalized = normalizeWord(mot);

    if (!words.has(normalized)) {
      words.set(normalized, []);
    }

    words.get(normalized).push({
      original: mot,
      file: path.basename(filePath),
      hasSynonyms: !!data.dictionnaire[mot].synonymes_fr,
      synonyms: data.dictionnaire[mot].synonymes_fr || []
    });

    // Ajoute aussi les synonymes
    if (data.dictionnaire[mot].synonymes_fr) {
      data.dictionnaire[mot].synonymes_fr.forEach(syn => {
        const synNormalized = normalizeWord(syn);
        if (!words.has(synNormalized)) {
          words.set(synNormalized, []);
        }
        words.get(synNormalized).push({
          original: syn,
          file: path.basename(filePath),
          isSynonymOf: mot,
          parentNormalized: normalized
        });
      });
    }
  });

  return words;
}

/**
 * Charge tous les lexiques
 */
function loadAllLexicons() {
  const files = fs.readdirSync(LEXIQUE_DIR)
    .filter(f => f.endsWith('.json') && !f.startsWith('00-grammaire'));

  const allWords = new Map();

  files.forEach(file => {
    const filePath = path.join(LEXIQUE_DIR, file);
    const words = extractWordsFromFile(filePath);

    words.forEach((entries, normalized) => {
      if (!allWords.has(normalized)) {
        allWords.set(normalized, []);
      }
      allWords.get(normalized).push(...entries);
    });
  });

  return allWords;
}

/**
 * Vérifie si un mot existe déjà
 */
function checkWord(word, allWords) {
  const normalized = normalizeWord(word);
  const found = allWords.get(normalized);

  if (!found || found.length === 0) {
    return { exists: false, normalized };
  }

  // Sépare les entrées principales des synonymes
  const mainEntries = found.filter(e => !e.isSynonymOf);
  const synonymEntries = found.filter(e => e.isSynonymOf);

  return {
    exists: true,
    normalized,
    mainEntries,
    synonymEntries,
    count: found.length
  };
}

/**
 * Trouve les doublons (même mot normalisé dans plusieurs fichiers)
 */
function findDuplicates(allWords) {
  const duplicates = [];

  allWords.forEach((entries, normalized) => {
    // Filtre les entrées principales (pas les synonymes)
    const mainEntries = entries.filter(e => !e.isSynonymOf);

    if (mainEntries.length > 1) {
      // Vérifie si c'est dans des fichiers différents
      const files = [...new Set(mainEntries.map(e => e.file))];
      if (files.length > 1) {
        duplicates.push({
          normalized,
          entries: mainEntries
        });
      }
    }
  });

  return duplicates;
}

/**
 * Fonction principale
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('🔍 Chargement des lexiques...\n');
  const allWords = loadAllLexicons();
  console.log(`✅ ${allWords.size} mots chargés (formes normalisées)\n`);

  if (command === 'check') {
    // Vérifier un ou plusieurs mots
    const wordsToCheck = args.slice(1);

    if (wordsToCheck.length === 0) {
      console.error('❌ Usage: node check-duplicates.js check <mot1> [mot2] ...');
      process.exit(1);
    }

    console.log('📋 Vérification des mots:\n');
    wordsToCheck.forEach(word => {
      const result = checkWord(word, allWords);

      if (!result.exists) {
        console.log(`✨ "${word}" (normalisé: "${result.normalized}") - NON TROUVÉ`);
      } else {
        console.log(`⚠️  "${word}" (normalisé: "${result.normalized}") - EXISTE DÉJÀ:`);

        if (result.mainEntries.length > 0) {
          console.log('   Entrées principales:');
          result.mainEntries.forEach(e => {
            console.log(`     - "${e.original}" dans ${e.file}`);
            if (e.synonyms.length > 0) {
              console.log(`       Synonymes: ${e.synonyms.join(', ')}`);
            }
          });
        }

        if (result.synonymEntries.length > 0) {
          console.log('   Comme synonyme de:');
          result.synonymEntries.forEach(e => {
            console.log(`     - "${e.isSynonymOf}" dans ${e.file}`);
          });
        }
      }
      console.log('');
    });

  } else if (command === 'duplicates') {
    // Trouver tous les doublons
    const duplicates = findDuplicates(allWords);

    if (duplicates.length === 0) {
      console.log('✅ Aucun doublon trouvé!');
    } else {
      console.log(`⚠️  ${duplicates.length} doublons trouvés:\n`);
      duplicates.forEach(dup => {
        console.log(`"${dup.normalized}":`);
        dup.entries.forEach(e => {
          console.log(`  - "${e.original}" dans ${e.file}`);
        });
        console.log('');
      });
    }

  } else if (command === 'stats') {
    // Statistiques
    const fileStats = new Map();

    allWords.forEach((entries, normalized) => {
      entries.forEach(e => {
        if (!e.isSynonymOf) {
          if (!fileStats.has(e.file)) {
            fileStats.set(e.file, 0);
          }
          fileStats.set(e.file, fileStats.get(e.file) + 1);
        }
      });
    });

    console.log('📊 Statistiques par fichier:\n');
    const sorted = [...fileStats.entries()].sort((a, b) => b[1] - a[1]);
    let total = 0;
    sorted.forEach(([file, count]) => {
      console.log(`  ${file.padEnd(35)} ${count.toString().padStart(4)} mots`);
      total += count;
    });
    console.log(`  ${''.padEnd(35, '-')} ${'-'.repeat(4)}`);
    console.log(`  ${'TOTAL'.padEnd(35)} ${total.toString().padStart(4)} mots`);

  } else {
    console.log(`Usage:
  node check-duplicates.js check <mot1> [mot2] ...    Vérifie si des mots existent
  node check-duplicates.js duplicates                 Liste tous les doublons
  node check-duplicates.js stats                      Affiche les statistiques
`);
  }
}

// Export pour utilisation comme module
if (require.main === module) {
  main();
} else {
  module.exports = {
    normalizeWord,
    loadAllLexicons,
    checkWord,
    findDuplicates
  };
}
