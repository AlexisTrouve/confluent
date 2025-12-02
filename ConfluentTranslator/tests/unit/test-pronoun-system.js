const { tokenizeFrench, simpleLemmatize } = require('./contextAnalyzer');
const { loadAllLexiques } = require('./lexiqueLoader');
const path = require('path');

const baseDir = path.join(__dirname, '..');
const lexiques = loadAllLexiques(baseDir);

console.log('\n=== TEST SYSTÈME DE PRONOMS ===\n');

const tests = [
  'je parle',
  'tu parles',
  'il parle',
  'elle parle',
  'nous parlons',
  'vous parlez',
  'ils parlent',
  'elles parlent'
];

tests.forEach(phrase => {
  const tokens = tokenizeFrench(phrase);
  console.log(`"${phrase}" → tokens: [${tokens.join(', ')}]`);

  tokens.forEach(token => {
    const lemmas = simpleLemmatize(token);
    const found = lexiques.ancien.dictionnaire[token];

    if (found) {
      const conf = found.traductions[0]?.confluent || '?';
      console.log(`  ✅ "${token}" → ${conf}`);
    } else {
      // Vérifier les lemmes
      let foundLemma = false;
      for (const lemma of lemmas) {
        const entry = lexiques.ancien.dictionnaire[lemma];
        if (entry) {
          const conf = entry.traductions[0]?.confluent || '?';
          console.log(`  ✅ "${token}" (lemme: "${lemma}") → ${conf}`);
          foundLemma = true;
          break;
        }
      }
      if (!foundLemma) {
        console.log(`  ❌ "${token}" → NON TROUVÉ`);
      }
    }
  });
  console.log('');
});

console.log('\n=== CONSTRUCTION PRONOMS PLURIELS ===\n');
console.log('nous = miki (je) + su (pluriel) = mikisu');
console.log('vous = sinu (tu) + su (pluriel) = sinusu');
console.log('ils/elles = tani (il/elle) + su (pluriel) = tanisu');
