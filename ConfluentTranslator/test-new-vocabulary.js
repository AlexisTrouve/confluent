const { loadAllLexiques } = require('./lexiqueLoader');
const { analyzeContext } = require('./contextAnalyzer');
const path = require('path');

const baseDir = path.join(__dirname, '..');
const lexiques = loadAllLexiques(baseDir);

console.log('\n=== TEST NOUVEAU VOCABULAIRE ===\n');

const texteTest = `
Les enfants montent l'escalier de pierre pour boire de l'eau fraîche.
Sur la table, il y a des fruits, des légumes et des aromates.
La lumière entre par la fenêtre et éclaire les murs.
Le toit protège la maison de la pluie.
Quand il manque de nourriture, nous ouvrons les réserves.
`;

const result = analyzeContext(texteTest, lexiques.ancien);

console.log(`Texte analysé: ${result.metadata.wordCount} mots\n`);
console.log(`Couverture: ${result.metadata.coveragePercent}%`);
console.log(`Trouvés: ${result.metadata.wordsFound.length} / Manquants: ${result.metadata.wordsNotFound.length}\n`);

console.log('=== MOTS TROUVÉS (nouveaux) ===\n');
const nouveaux = ['boire', 'fruit', 'legume', 'aromate', 'table', 'fenetre', 'toit', 'mur', 'escalier', 'manque', 'monter', 'ouvrir'];
result.metadata.wordsFound.forEach(w => {
  if (nouveaux.includes(w.input) || nouveaux.includes(w.found)) {
    console.log(`✅ "${w.input}" → ${w.confluent} (${w.type})`);
  }
});

console.log('\n=== MOTS MANQUANTS ===\n');
if (result.metadata.wordsNotFound.length > 0) {
  console.log(result.metadata.wordsNotFound.slice(0, 10).join(', '));
} else {
  console.log('Aucun !');
}
