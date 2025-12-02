const { decomposeWord } = require('./morphologicalDecomposer');
const { buildReverseIndex } = require('./reverseIndexBuilder');
const { loadAllLexiques } = require('./lexiqueLoader');
const path = require('path');

const baseDir = path.join(__dirname, '..');
const lexiques = loadAllLexiques(baseDir);
const confluentIndex = buildReverseIndex(lexiques.ancien);

const testWord = 'oraatemi';

console.log(`\n=== Test de décomposition pour: "${testWord}" ===\n`);

const decompositions = decomposeWord(testWord, confluentIndex);

if (decompositions.length === 0) {
  console.log('Aucune décomposition trouvée.');
} else {
  decompositions.forEach((decomp, i) => {
    console.log(`\n--- Décomposition #${i + 1} (confiance: ${(decomp.confidence * 100).toFixed(1)}%) ---`);
    console.log(`Pattern: ${decomp.pattern}`);
    console.log(`Type: ${decomp.type}`);
    console.log(`Racines (${decomp.roots.length}):`);

    decomp.roots.forEach((root, j) => {
      console.log(`  ${j + 1}. ${root.part} → ${root.fullRoot || '?'} (trouvé: ${root.found}, confiance: ${(root.confidence * 100).toFixed(1)}%)`);
      if (root.entry) {
        console.log(`     Traduction: ${root.entry.francais}`);
      }
    });

    console.log(`Liaisons (${decomp.liaisons.length}):`);
    decomp.liaisons.forEach((liaison, j) => {
      console.log(`  ${j + 1}. -${liaison.liaison}- (${liaison.concept}, domaine: ${liaison.domaine})`);
    });
  });
}
