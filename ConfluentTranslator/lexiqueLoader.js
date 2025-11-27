const fs = require('fs');
const path = require('path');

/**
 * Charge dynamiquement tous les fichiers de lexique d'un dossier
 * @param {string} lexiqueDir - Chemin vers le dossier contenant les fichiers JSON
 * @returns {Object} - Lexique fusionné avec métadonnées
 */
function loadLexiqueFromDir(lexiqueDir) {
  const result = {
    meta: {
      source_dir: lexiqueDir,
      files_loaded: [],
      total_entries: 0,
      loaded_at: new Date().toISOString()
    },
    dictionnaire: {}
  };

  if (!fs.existsSync(lexiqueDir)) {
    console.warn(`Lexique directory not found: ${lexiqueDir}`);
    return result;
  }

  const files = fs.readdirSync(lexiqueDir)
    .filter(f => f.endsWith('.json') && !f.startsWith('_'));

  for (const file of files) {
    const filePath = path.join(lexiqueDir, file);
    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      if (content.dictionnaire) {
        // Fusionner les entrées
        for (const [motFr, data] of Object.entries(content.dictionnaire)) {
          const key = motFr.toLowerCase();

          if (!result.dictionnaire[key]) {
            result.dictionnaire[key] = {
              mot_francais: motFr,
              traductions: [],
              synonymes_fr: [],
              source_files: []
            };
          }

          // Ajouter les traductions
          if (data.traductions) {
            for (const trad of data.traductions) {
              // Éviter les doublons
              const exists = result.dictionnaire[key].traductions.some(
                t => t.confluent === trad.confluent
              );
              if (!exists) {
                result.dictionnaire[key].traductions.push({
                  ...trad,
                  source_file: file
                });
              }
            }
          }

          // Ajouter les synonymes
          if (data.synonymes_fr) {
            for (const syn of data.synonymes_fr) {
              if (!result.dictionnaire[key].synonymes_fr.includes(syn)) {
                result.dictionnaire[key].synonymes_fr.push(syn);
              }
              // Créer une entrée pour le synonyme qui pointe vers le mot principal
              const synKey = syn.toLowerCase();
              if (!result.dictionnaire[synKey]) {
                result.dictionnaire[synKey] = {
                  mot_francais: syn,
                  traductions: result.dictionnaire[key].traductions,
                  synonymes_fr: [motFr],
                  source_files: [file],
                  is_synonym_of: motFr
                };
              }
            }
          }

          if (!result.dictionnaire[key].source_files.includes(file)) {
            result.dictionnaire[key].source_files.push(file);
          }
        }
      }

      result.meta.files_loaded.push(file);
    } catch (error) {
      console.error(`Error loading ${file}:`, error.message);
    }
  }

  result.meta.total_entries = Object.keys(result.dictionnaire).length;
  return result;
}

/**
 * Charge les lexiques pour les deux variantes de la langue
 * @param {string} baseDir - Chemin de base du projet confluent
 * @returns {Object} - Lexiques proto et ancien
 */
function loadAllLexiques(baseDir) {
  const protoDir = path.join(baseDir, 'proto-confluent', 'lexique');
  const ancienDir = path.join(baseDir, 'ancien-confluent', 'lexique');

  console.log('Loading Proto-Confluent lexique...');
  const proto = loadLexiqueFromDir(protoDir);
  console.log(`  Loaded ${proto.meta.total_entries} entries from ${proto.meta.files_loaded.length} files`);

  console.log('Loading Ancien-Confluent lexique...');
  const ancien = loadLexiqueFromDir(ancienDir);
  console.log(`  Loaded ${ancien.meta.total_entries} entries from ${ancien.meta.files_loaded.length} files`);

  return { proto, ancien };
}

/**
 * Construit un index inversé (confluent -> français) pour recherche rapide
 * @param {Object} lexique - Lexique chargé
 * @returns {Object} - Index inversé
 */
function buildReverseIndex(lexique) {
  const index = {};

  for (const [key, data] of Object.entries(lexique.dictionnaire)) {
    if (data.traductions) {
      for (const trad of data.traductions) {
        const confluentWord = trad.confluent.toLowerCase();
        if (!index[confluentWord]) {
          index[confluentWord] = [];
        }
        index[confluentWord].push({
          francais: data.mot_francais,
          type: trad.type,
          domaine: trad.domaine
        });
      }
    }
  }

  return index;
}

/**
 * Recherche un mot dans le lexique
 * @param {Object} lexique - Lexique chargé
 * @param {string} query - Mot à rechercher
 * @param {string} direction - 'fr2conf' ou 'conf2fr'
 * @returns {Array} - Résultats de recherche
 */
function searchLexique(lexique, query, direction = 'fr2conf') {
  const results = [];
  const queryLower = query.toLowerCase();

  if (direction === 'fr2conf') {
    // Recherche exacte
    if (lexique.dictionnaire[queryLower]) {
      results.push({
        match: 'exact',
        ...lexique.dictionnaire[queryLower]
      });
    }

    // Recherche partielle
    for (const [key, data] of Object.entries(lexique.dictionnaire)) {
      if (key !== queryLower && key.includes(queryLower)) {
        results.push({
          match: 'partial',
          ...data
        });
      }
    }
  } else {
    // Recherche dans les traductions (confluent -> français)
    for (const [key, data] of Object.entries(lexique.dictionnaire)) {
      if (data.traductions) {
        for (const trad of data.traductions) {
          if (trad.confluent.toLowerCase() === queryLower) {
            results.push({
              match: 'exact',
              ...data
            });
            break;
          } else if (trad.confluent.toLowerCase().includes(queryLower)) {
            results.push({
              match: 'partial',
              ...data
            });
            break;
          }
        }
      }
    }
  }

  return results;
}

/**
 * Génère un résumé du lexique pour inclusion dans les prompts LLM
 * @param {Object} lexique - Lexique chargé
 * @param {number} maxEntries - Nombre max d'entrées à inclure
 * @returns {string} - Résumé formaté
 */
function generateLexiqueSummary(lexique, maxEntries = 200) {
  const lines = [];
  let count = 0;

  // Grouper par domaine
  const byDomain = {};

  for (const [key, data] of Object.entries(lexique.dictionnaire)) {
    if (data.is_synonym_of) continue; // Skip synonyms
    if (!data.traductions || data.traductions.length === 0) continue;

    const trad = data.traductions[0];
    const domain = trad.domaine || 'general';

    if (!byDomain[domain]) {
      byDomain[domain] = [];
    }
    byDomain[domain].push({
      fr: data.mot_francais,
      conf: trad.confluent,
      type: trad.type
    });
  }

  // Formater par domaine
  for (const [domain, entries] of Object.entries(byDomain).sort()) {
    if (count >= maxEntries) break;

    lines.push(`\n## ${domain.toUpperCase()}`);

    for (const entry of entries.slice(0, 20)) {
      if (count >= maxEntries) break;
      lines.push(`${entry.fr}: ${entry.conf}`);
      count++;
    }
  }

  return lines.join('\n');
}

module.exports = {
  loadLexiqueFromDir,
  loadAllLexiques,
  buildReverseIndex,
  searchLexique,
  generateLexiqueSummary
};
