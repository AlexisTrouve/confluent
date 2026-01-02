const { loadAllLexiques } = require('./lexiqueLoader');
const path = require('path');

const baseDir = path.join(__dirname, '..');
const lexiques = loadAllLexiques(baseDir);

console.log('\n=== RECHERCHE PRONOMS PERSONNELS ===\n');

const pronouns = ['je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles', 'on'];

pronouns.forEach(pronoun => {
  const found = [];

  for (const [key, entry] of Object.entries(lexiques.ancien.dictionnaire)) {
    if (key.toLowerCase() === pronoun || entry.mot_francais?.toLowerCase() === pronoun) {
      found.push({
        key,
        mot: entry.mot_francais,
        traductions: entry.traductions
      });
    }
  }

  if (found.length > 0) {
    console.log(`✅ ${pronoun}:`);
    found.forEach(f => {
      console.log(`   - ${f.traductions?.map(t => t.confluent).join(', ') || 'N/A'}`);
      console.log(`     Type: ${f.traductions?.map(t => t.type).join(', ') || 'N/A'}`);
    });
  } else {
    console.log(`❌ ${pronoun}: NON TROUVÉ`);
  }
  console.log('');
});

console.log('\n=== RECHERCHE TOUS LES MOTS CONTENANT "tanu" ou "tasu" ===\n');

for (const [key, entry] of Object.entries(lexiques.ancien.dictionnaire)) {
  const hasTarget = entry.traductions?.some(t =>
    t.confluent?.includes('tanu') || t.confluent?.includes('tasu')
  );

  if (hasTarget) {
    console.log(`"${entry.mot_francais || key}":`);
    entry.traductions.forEach(t => {
      if (t.confluent?.includes('tanu') || t.confluent?.includes('tasu')) {
        console.log(`  → ${t.confluent} (${t.type})`);
      }
    });
  }
}
