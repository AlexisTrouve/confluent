const { simpleLemmatize } = require('./contextAnalyzer');
const { loadAllLexiques } = require('./lexiqueLoader');
const path = require('path');
const baseDir = path.join(__dirname, '..');
const lexiques = loadAllLexiques(baseDir);

console.log('\n=== TEST LEMMATISATION NOUVEAUX MOTS ===\n');

const tests = ['fruits', 'légumes', 'aromates', 'monte', 'ouvrons', 'murs', 'toits'];

tests.forEach(mot => {
  const lemmas = simpleLemmatize(mot);
  console.log(`${mot} → lemmes: [${lemmas.join(', ')}]`);

  let found = false;
  for (const lemma of lemmas) {
    const entry = lexiques.ancien.dictionnaire[lemma];
    if (entry?.traductions) {
      console.log(`  ✅ trouvé: ${lemma} → ${entry.traductions[0].confluent}`);
      found = true;
      break;
    }
  }
  if (!found) {
    console.log('  ❌ NON TROUVÉ');
  }
  console.log('');
});
