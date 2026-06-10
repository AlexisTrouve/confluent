const fs = require('fs');
const path = require('path');
const { defaultRegistry, norm: normName } = require('../core/translation/forgedNamesRegistry');

/**
 * Fusionne les noms forgés BÉNIS (status: beni) du registre dans les lexiques chargés — « canon vivant ».
 *
 * QUOI : pour chaque nom béni, ajoute une entrée nom_propre dans le dictionnaire de l'ère cible, pour
 *        qu'il soit trouvé par lookup_concept (traduction) ET par la forge (lookup-first → source lexique).
 * POURQUOI : bénir un nom doit le rendre CANON et UTILISABLE immédiatement, SANS écrire dans les .json
 *        versionnés (le registre reste gitignoré → prod-safe, zéro divergence git). La version git
 *        permanente est une étape dev séparée.
 * COMMENT : registre='ancien' → ajouté à ancien ET mythologique (qui hérite l'ancien) ; 'mythologique'
 *        → mythologique seul ; 'proto' → proto. N'écrase JAMAIS une entrée existante du lexique de base.
 * @param {Object} lexiques - { proto, ancien, mythologique }
 * @param {Object} [registry] - registre des noms forgés (défaut : singleton prod)
 */
function overlayBlessedNames(lexiques, registry = defaultRegistry) {
  let count = 0;
  for (const e of registry.blessed()) {
    if (!e.nom_fr || !e.confluent) continue;
    const cibles = e.registre === 'mythologique' ? ['mythologique']
      : e.registre === 'proto' ? ['proto'] : ['ancien', 'mythologique'];
    const key = normName(e.nom_fr);
    for (const v of cibles) {
      const dict = lexiques[v] && lexiques[v].dictionnaire;
      if (!dict || dict[key]) continue;   // ère absente, ou concept déjà au lexique → on ne touche pas
      dict[key] = {
        mot_francais: e.nom_fr,
        traductions: [{
          confluent: e.confluent, type: 'nom_propre', forme_liee: e.forme_liee || e.confluent,
          domaine: 'nom_propre', registre: e.registre, source: 'forge_beni'
        }],
        synonymes_fr: []
      };
      count++;
    }
  }
  if (count) console.log(`  Noms forgés bénis fusionnés au lexique : ${count}`);
}

/**
 * Normalise un texte : lowercase + retire accents + ligatures
 * @param {string} text - Texte à normaliser
 * @returns {string} - Texte normalisé
 */
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

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

      // Fonction helper pour merger des entrées
      const mergeEntries = (entries, sectionName = 'dictionnaire') => {
        for (const [motFr, data] of Object.entries(entries)) {
          const key = normalizeText(motFr);

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
                  source_file: file,
                  source_section: sectionName
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
              const synKey = normalizeText(syn);
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
      };

      // Charger la section "dictionnaire" si elle existe
      if (content.dictionnaire) {
        mergeEntries(content.dictionnaire, 'dictionnaire');
      }

      // Charger la section "pronoms" si elle existe (pour 02-racines-standards.json)
      if (content.pronoms) {
        mergeEntries(content.pronoms, 'pronoms');
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
 * Charge et fusionne le lexique simple depuis data/lexique-francais-confluent.json
 * @param {string} baseDir - Chemin de base du projet
 * @param {Object} existingLexique - Lexique existant à enrichir
 * @returns {Object} - Lexique enrichi
 */
function mergeSimpleLexique(baseDir, existingLexique) {
  const simpleLexiquePath = path.join(baseDir, 'data', 'lexique-francais-confluent.json');

  if (!fs.existsSync(simpleLexiquePath)) {
    console.warn(`  Simple lexique not found: ${simpleLexiquePath}`);
    return existingLexique;
  }

  try {
    const content = JSON.parse(fs.readFileSync(simpleLexiquePath, 'utf-8'));
    let addedCount = 0;

    // Parcourir le dictionnaire simple (structure: {"mot": "traduction"})
    if (content.dictionnaire) {
      for (const [section, entries] of Object.entries(content.dictionnaire)) {
        if (typeof entries === 'object') {
          for (const [motFr, traduction] of Object.entries(entries)) {
            const key = normalizeText(motFr);

            // N'ajouter que si pas déjà présent
            if (!existingLexique.dictionnaire[key]) {
              existingLexique.dictionnaire[key] = {
                mot_francais: motFr,
                traductions: [{
                  confluent: traduction,
                  type: 'racine', // Type par défaut
                  forme_liee: traduction,
                  domaine: 'general'
                }],
                synonymes_fr: [],
                source_files: ['data/lexique-francais-confluent.json']
              };
              addedCount++;
            }
          }
        }
      }
    }

    console.log(`  Merged ${addedCount} entries from simple lexique`);
    existingLexique.meta.total_entries = Object.keys(existingLexique.dictionnaire).length;

  } catch (error) {
    console.error(`  Error merging simple lexique: ${error.message}`);
  }

  return existingLexique;
}

/**
 * Construit le lexique MYTHOLOGIQUE : l'ancien (hérité INTÉGRALEMENT) + une strate sacrée en overlay.
 *
 * QUOI : renvoie un lexique = copie de l'ancien sur laquelle on superpose les entrées sacrées
 *        (le Vide, l'Éveilleur, la Veille…) lues dans `mythologique-confluent/lexique/`.
 * POURQUOI : le mythologique n'est pas une langue à part — c'est l'ancien diversifié vers le haut.
 *        Il doit donc disposer de TOUT le lexique quotidien (neige, eau, marcher, enfant…) que les
 *        chants emploient AUSSI, plus les mots sacrés que l'ancien n'a pas. L'overlay évite la
 *        duplication et garde l'ancien comme source unique de la base.
 * COMMENT : 1. DEEP-CLONE de l'ancien (JSON round-trip) — impératif : le merge ci-dessous mute le
 *        dictionnaire, et l'ancien partage des références de tableaux `traductions` entre un mot et
 *        ses synonymes (cf. loadLexiqueFromDir) ; muter en place corromprait l'ancien servi ailleurs.
 *        2. Charge la strate sacrée. 3. Pour chaque entrée sacrée : concept nouveau → ajouté ; concept
 *        déjà connu de l'ancien → la/les traduction(s) sacrée(s) sont mises EN TÊTE (unshift) pour être
 *        préférées en registre mythologique (le résumé prompt et les lookups prennent traductions[0]).
 * @param {string} baseDir - Chemin de base du projet confluent
 * @param {Object} ancien - Lexique ancien déjà chargé (sert de base)
 * @returns {Object} - Lexique mythologique (ancien + sacré)
 */
function overlayMythologique(baseDir, ancien) {
  // Copie profonde : aucune mutation ne doit remonter à l'ancien.
  const mytho = JSON.parse(JSON.stringify(ancien));
  mytho.meta = { ...mytho.meta, source_dir: 'mythologique (ancien + strate sacrée)', overlay: true };

  const sacredDir = path.join(baseDir, 'mythologique-confluent', 'lexique');
  if (!fs.existsSync(sacredDir)) {
    console.warn(`  Strate sacrée absente (${sacredDir}) — mythologique = ancien seul pour l'instant`);
    return mytho;
  }

  const sacred = loadLexiqueFromDir(sacredDir);
  let added = 0, enriched = 0;
  for (const [key, data] of Object.entries(sacred.dictionnaire)) {
    if (!mytho.dictionnaire[key]) {
      mytho.dictionnaire[key] = data;                 // concept sacré inédit → ajouté tel quel
      added++;
    } else {
      // Concept déjà connu : on préfixe la/les forme(s) sacrée(s) (préférées en registre haut).
      for (const trad of (data.traductions || []).reverse()) {  // reverse → l'ordre source est conservé après unshift
        if (!mytho.dictionnaire[key].traductions.some(t => t.confluent === trad.confluent)) {
          mytho.dictionnaire[key].traductions.unshift(trad);
        }
      }
      for (const syn of (data.synonymes_fr || [])) {
        if (!mytho.dictionnaire[key].synonymes_fr.includes(syn)) mytho.dictionnaire[key].synonymes_fr.push(syn);
      }
      enriched++;
    }
  }
  mytho.meta.total_entries = Object.keys(mytho.dictionnaire).length;
  console.log(`  Mythologique = ancien + strate sacrée : ${added} concepts sacrés ajoutés, ${enriched} enrichis`);
  return mytho;
}

/**
 * Charge les lexiques pour les TROIS ères de la langue (proto / ancien / mythologique).
 * @param {string} baseDir - Chemin de base du projet confluent
 * @returns {Object} - Lexiques proto, ancien et mythologique
 */
function loadAllLexiques(baseDir) {
  const protoDir = path.join(baseDir, 'proto-confluent', 'lexique');
  const ancienDir = path.join(baseDir, 'ancien-confluent', 'lexique');

  console.log('Loading Proto-Confluent lexique...');
  const proto = loadLexiqueFromDir(protoDir);
  console.log(`  Loaded ${proto.meta.total_entries} entries from ${proto.meta.files_loaded.length} files`);

  console.log('Loading Ancien-Confluent lexique...');
  let ancien = loadLexiqueFromDir(ancienDir);
  console.log(`  Loaded ${ancien.meta.total_entries} entries from ${ancien.meta.files_loaded.length} files`);

  // Fusionner le lexique simple
  ancien = mergeSimpleLexique(baseDir, ancien);

  // Mythologique = ancien (hérité) + strate sacrée (overlay).
  console.log('Building Mythologique lexique (overlay)...');
  const mythologique = overlayMythologique(baseDir, ancien);

  const lexiques = { proto, ancien, mythologique };
  overlayBlessedNames(lexiques);   // noms forgés BÉNIS → canon vivant (fusionnés, prod-safe)
  return lexiques;
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
  const queryLower = normalizeText(query);

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
  overlayMythologique,
  overlayBlessedNames,
  buildReverseIndex,
  searchLexique,
  generateLexiqueSummary
};
