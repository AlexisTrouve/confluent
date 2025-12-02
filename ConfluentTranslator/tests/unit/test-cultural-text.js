const { loadAllLexiques } = require('./lexiqueLoader');
const { analyzeContext } = require('./contextAnalyzer');
const path = require('path');

const baseDir = path.join(__dirname, '..');
const lexiques = loadAllLexiques(baseDir);

console.log('\n=== TEST TEXTE CULTUREL ===\n');

const texteTest = `
La civilisation de la Confluence est fondée sur l'observation et la mémoire.
Notre culture valorise la liberté du regard et la connaissance transmise par les ancêtres.
Les Siliaska, peuple du regard libre, préservent la sagesse de la tradition.
L'union fait notre force, et la confluence de nos savoirs nous guide.
Nous observons le monde avec attention pour voir la vérité.
`;

const result = analyzeContext(texteTest, lexiques.ancien);

console.log(`Texte: ${result.metadata.wordCount} mots\n`);
console.log(`Couverture: ${result.metadata.coveragePercent}%`);
console.log(`Trouvés: ${result.metadata.wordsFound.length} / Manquants: ${result.metadata.wordsNotFound.length}\n`);

console.log('=== CONCEPTS TROUVÉS ===\n');
const concepts = ['civilisation', 'confluence', 'observation', 'memoire', 'culture',
                  'liberte', 'regard', 'connaissance', 'ancetres', 'peuple',
                  'sagesse', 'tradition', 'union', 'savoir', 'observer', 'voir'];

result.metadata.wordsFound.forEach(w => {
  if (concepts.some(c => w.input.includes(c) || w.found.includes(c))) {
    console.log(`✅ "${w.input}" → ${w.confluent} (${w.type})`);
  }
});

console.log('\n=== MOTS MANQUANTS ===');
if (result.metadata.wordsNotFound.length > 0) {
  console.log(result.metadata.wordsNotFound.join(', '));
} else {
  console.log('Aucun !');
}

console.log(`\n📊 Taux de couverture final: ${result.metadata.coveragePercent}%`);
