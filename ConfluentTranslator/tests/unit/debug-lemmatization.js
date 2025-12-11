/**
 * DEBUG COMPLET - PROBLÈME DE LEMMATISATION
 *
 * Objectif: Comprendre EXACTEMENT où le traitement casse les mots accentués
 */

const { tokenizeFrench } = require('./contextAnalyzer');

console.log('\n' + '='.repeat(70));
console.log('DEBUG COMPLET - LEMMATISATION ACCENTS');
console.log('='.repeat(70) + '\n');

// Cas problématiques reportés
const problemes = [
  'mémoire',    // → m + moire
  'échos',      // → chos
  'légume',     // → l + gume
  'épice',      // → pice
  'lumière',    // → lumi + re
  'fenêtre',    // → fen + tre
];

console.log('1. TEST TOKENIZATION ACTUELLE:\n');
problemes.forEach(mot => {
  const tokens = tokenizeFrench(mot);
  const status = tokens.length === 1 && tokens[0].length > 2 ? '✅' : '❌';
  console.log(`  ${status} "${mot}" → [${tokens.map(t => `"${t}"`).join(', ')}]`);
});

console.log('\n' + '-'.repeat(70));
console.log('2. ANALYSE ÉTAPE PAR ÉTAPE:\n');

function analyzeStep(mot) {
  console.log(`\n  Mot: "${mot}"`);
  console.log(`  Code points: ${[...mot].map(c => 'U+' + c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')).join(' ')}`);

  // Étape 1: lowercase
  let step1 = mot.toLowerCase();
  console.log(`  1. toLowerCase: "${step1}"`);

  // Étape 2: ligatures
  let step2 = step1.replace(/œ/g, 'oe').replace(/æ/g, 'ae');
  console.log(`  2. Ligatures: "${step2}"`);

  // Étape 3: NFD normalize
  let step3 = step2.normalize('NFD');
  console.log(`  3. NFD: "${step3}" (length: ${step3.length})`);
  console.log(`     Code points: ${[...step3].map(c => 'U+' + c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')).join(' ')}`);

  // Étape 4: Retirer diacritiques
  let step4 = step3.replace(/[\u0300-\u036f]/g, '');
  console.log(`  4. Sans diacritiques: "${step4}"`);

  // Étape 5: Contractions (ne devrait rien faire ici)
  let step5 = step4
    .replace(/l[''']/g, 'le ')
    .replace(/d[''']/g, 'de ')
    .replace(/n[''']/g, 'ne ')
    .replace(/j[''']/g, 'je ')
    .replace(/m[''']/g, 'me ')
    .replace(/t[''']/g, 'te ')
    .replace(/s[''']/g, 'se ')
    .replace(/c[''']/g, 'ce ')
    .replace(/qu[''']/g, 'que ');
  console.log(`  5. Après contractions: "${step5}"`);

  // Étape 6: Retirer ponctuation
  let step6 = step5.replace(/[^\w\s]/g, ' ');
  console.log(`  6. Sans ponctuation: "${step6}"`);

  // Étape 7: Split
  let step7 = step6.split(/\s+/).filter(w => w.length > 0);
  console.log(`  7. Tokens: [${step7.map(t => `"${t}"`).join(', ')}]`);

  return step7;
}

problemes.forEach(mot => analyzeStep(mot));

console.log('\n' + '-'.repeat(70));
console.log('3. TEST AVEC CONTEXTE (apostrophes):\n');

const contextTests = [
  "l'échos",
  "l'épice",
  "la mémoire",
  "les légumes",
  "la lumière",
  "la fenêtre"
];

contextTests.forEach(phrase => {
  const tokens = tokenizeFrench(phrase);
  console.log(`  "${phrase}" → [${tokens.map(t => `"${t}"`).join(', ')}]`);
});

console.log('\n' + '-'.repeat(70));
console.log('4. VÉRIFICATION REGEX \\w AVEC ACCENTS:\n');

const testW = 'é';
console.log(`  Le caractère "é" matche \\w ? ${/\w/.test(testW) ? 'OUI' : 'NON'}`);
console.log(`  Le caractère "é" matche [^\\w\\s] ? ${/[^\w\s]/.test(testW) ? 'OUI (sera remplacé!)' : 'NON'}`);

const testE = 'e';
console.log(`  Le caractère "e" matche \\w ? ${/\w/.test(testE) ? 'OUI' : 'NON'}`);

console.log('\n' + '='.repeat(70));
console.log('FIN DEBUG');
console.log('='.repeat(70) + '\n');
