const { tokenizeFrench } = require('./contextAnalyzer');

console.log('\n=== TEST FIX APOSTROPHES ===\n');

const testCases = [
  // Apostrophe droite (ASCII 39)
  "l'échos",
  "d'écouter",
  "m'a dit",
  "n'est pas",

  // Apostrophe courbe (Unicode)
  "l'enfant",
  "d'eau",

  // Mots avec accents
  "mémoire",
  "écouter",
  "échos"
];

testCases.forEach(test => {
  const tokens = tokenizeFrench(test);
  console.log(`Input:  "${test}"`);
  console.log(`Tokens: [${tokens.map(t => `"${t}"`).join(', ')}]`);
  console.log('');
});

console.log('\n=== TEST PHRASE COMPLÈTE ===\n');
const phrase = "Les échos de la mémoire résonnent dans l'esprit des anciens qui écoutent.";
const tokens = tokenizeFrench(phrase);
console.log(`Input:  "${phrase}"`);
console.log(`Tokens: [${tokens.map(t => `"${t}"`).join(', ')}]`);
console.log(`Count:  ${tokens.length} mots`);
