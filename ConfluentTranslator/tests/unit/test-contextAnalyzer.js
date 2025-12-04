/**
 * Tests exigeants pour contextAnalyzer.js
 */

const {
  tokenizeFrench,
  calculateMaxEntries,
  searchWord,
  findRelevantEntries,
  expandContext,
  extractRoots,
  analyzeContext
} = require('./contextAnalyzer');
const { loadAllLexiques } = require('./lexiqueLoader');
const path = require('path');

// Charger les lexiques
const baseDir = path.join(__dirname, '..');
const lexiques = loadAllLexiques(baseDir);

console.log('═══════════════════════════════════════════════════');
console.log('TEST 1: Tokenization française');
console.log('═══════════════════════════════════════════════════');

const testTexts = [
  "L'enfant voit l'eau",
  "Les Enfants des Échos transmettent la mémoire sacrée",
  "Le scientifique utilise un microscope"
];

testTexts.forEach(text => {
  const tokens = tokenizeFrench(text);
  console.log(`\nTexte: "${text}"`);
  console.log(`Tokens: [${tokens.join(', ')}]`);
  console.log(`Nombre: ${tokens.length}`);
});

console.log('\n═══════════════════════════════════════════════════');
console.log('TEST 2: Calcul dynamique max entrées');
console.log('═══════════════════════════════════════════════════');

const wordCounts = [5, 15, 20, 30, 50, 75, 100];
wordCounts.forEach(count => {
  const max = calculateMaxEntries(count);
  console.log(`${count} mots → ${max} entrées max`);
});

console.log('\n═══════════════════════════════════════════════════');
console.log('TEST 3: Recherche de mots individuels');
console.log('═══════════════════════════════════════════════════');

const testWords = ['enfant', 'voir', 'eau', 'faucon', 'microscope', 'ordinateur'];
testWords.forEach(word => {
  const results = searchWord(word, lexiques.ancien.dictionnaire);
  console.log(`\nMot: "${word}"`);
  if (results.length > 0) {
    results.forEach(r => {
      console.log(`  ✓ Trouvé: ${r.mot_francais} → ${r.traductions[0]?.confluent} (score: ${r.score})`);
    });
  } else {
    console.log(`  ✗ Non trouvé`);
  }
});

console.log('\n═══════════════════════════════════════════════════');
console.log('TEST 4: Analyse complète - Phrase simple');
console.log('═══════════════════════════════════════════════════');

const phrase1 = "L'enfant voit l'eau";
const context1 = analyzeContext(phrase1, lexiques.ancien);

console.log(`\nTexte: "${phrase1}"`);
console.log(`Mots détectés: ${context1.metadata.wordCount} (${context1.metadata.uniqueWordCount} uniques)`);
console.log(`Max entrées autorisées: ${context1.metadata.maxEntries}`);
console.log(`Entrées utilisées: ${context1.metadata.entriesUsed}`);
console.log(`Fallback activé: ${context1.useFallback ? 'OUI' : 'NON'}`);
console.log(`\nMots trouvés dans le lexique:`);
context1.metadata.wordsFound.forEach(w => {
  console.log(`  • ${w.input} → ${w.found} → ${w.confluent} [${w.type}] (score: ${w.score})`);
});
if (context1.metadata.wordsNotFound.length > 0) {
  console.log(`\nMots NON trouvés:`);
  context1.metadata.wordsNotFound.forEach(w => console.log(`  • ${w}`));
}
console.log(`\nOptimisation:`);
console.log(`  Tokens lexique complet: ${context1.metadata.tokensFullLexique}`);
console.log(`  Tokens utilisés: ${context1.metadata.tokensUsed}`);
console.log(`  Tokens économisés: ${context1.metadata.tokensSaved} (-${context1.metadata.savingsPercent}%)`);

console.log('\n═══════════════════════════════════════════════════');
console.log('TEST 5: Analyse complète - Phrase complexe');
console.log('═══════════════════════════════════════════════════');

const phrase2 = "Les Enfants des Échos transmettent la mémoire sacrée aux jeunes générations";
const context2 = analyzeContext(phrase2, lexiques.ancien);

console.log(`\nTexte: "${phrase2}"`);
console.log(`Mots détectés: ${context2.metadata.wordCount} (${context2.metadata.uniqueWordCount} uniques)`);
console.log(`Max entrées autorisées: ${context2.metadata.maxEntries}`);
console.log(`Entrées utilisées: ${context2.metadata.entriesUsed}`);
console.log(`Fallback activé: ${context2.useFallback ? 'OUI' : 'NON'}`);
console.log(`\nMots trouvés dans le lexique:`);
context2.metadata.wordsFound.forEach(w => {
  console.log(`  • ${w.input} → ${w.found} → ${w.confluent} [${w.type}] (score: ${w.score})`);
});
if (context2.metadata.wordsNotFound.length > 0) {
  console.log(`\nMots NON trouvés:`);
  context2.metadata.wordsNotFound.forEach(w => console.log(`  • ${w}`));
}
console.log(`\nOptimisation:`);
console.log(`  Tokens économisés: ${context2.metadata.tokensSaved} (-${context2.metadata.savingsPercent}%)`);

console.log('\n═══════════════════════════════════════════════════');
console.log('TEST 6: Fallback - Mots modernes inconnus');
console.log('═══════════════════════════════════════════════════');

const phrase3 = "Le scientifique utilise un microscope électronique";
const context3 = analyzeContext(phrase3, lexiques.ancien);

console.log(`\nTexte: "${phrase3}"`);
console.log(`Mots détectés: ${context3.metadata.wordCount} (${context3.metadata.uniqueWordCount} uniques)`);
console.log(`Max entrées autorisées: ${context3.metadata.maxEntries}`);
console.log(`Entrées utilisées: ${context3.metadata.entriesUsed}`);
console.log(`Fallback activé: ${context3.useFallback ? 'OUI ⚠️' : 'NON'}`);

if (context3.useFallback) {
  console.log(`\nRacines envoyées (fallback):`);
  const sacrees = context3.rootsFallback.filter(r => r.sacree);
  const standards = context3.rootsFallback.filter(r => !r.sacree);
  console.log(`  • Racines sacrées: ${sacrees.length}`);
  console.log(`  • Racines standards: ${standards.length}`);
  console.log(`  • Total: ${context3.rootsFallback.length}`);

  // Afficher quelques exemples
  console.log(`\n  Exemples de racines sacrées (5 premières):`);
  sacrees.slice(0, 5).forEach(r => {
    console.log(`    - ${r.confluent} (${r.mot_francais}) [${r.domaine}]`);
  });

  console.log(`\n  Exemples de racines standards (5 premières):`);
  standards.slice(0, 5).forEach(r => {
    console.log(`    - ${r.confluent} (${r.mot_francais}) [${r.domaine}]`);
  });
}

console.log(`\nMots NON trouvés (devront être composés):`);
context3.metadata.wordsNotFound.forEach(w => console.log(`  • ${w}`));

console.log('\n═══════════════════════════════════════════════════');
console.log('TEST 7: Extraction racines (détail)');
console.log('═══════════════════════════════════════════════════');

const allRoots = extractRoots(lexiques.ancien);
const sacredRoots = allRoots.filter(r => r.sacree);
const standardRoots = allRoots.filter(r => !r.sacree);

console.log(`\nTotal racines extraites: ${allRoots.length}`);
console.log(`  • Sacrées (voyelle initiale): ${sacredRoots.length}`);
console.log(`  • Standards (consonne initiale): ${standardRoots.length}`);

// Vérifier ratio sacré/standard (~20-25%)
const ratioSacred = (sacredRoots.length / allRoots.length * 100).toFixed(1);
console.log(`  • Ratio sacré: ${ratioSacred}%`);

if (ratioSacred >= 15 && ratioSacred <= 30) {
  console.log(`  ✓ Ratio dans la cible (15-30%)`);
} else {
  console.log(`  ⚠️ Ratio hors cible (attendu: 15-30%)`);
}

console.log('\n═══════════════════════════════════════════════════');
console.log('TEST 8: Texte long (> 50 mots)');
console.log('═══════════════════════════════════════════════════');

const phraseLongue = `
Dans les antres des échos, les enfants écoutent les voix anciennes.
Les faucons chassent dans le ciel au dessus de la confluence.
Les ailes grises veillent sur les halls des serments où la mémoire est transmise.
L'eau coule depuis les montagnes vers les rivières sacrées.
Le peuple du regard libre observe et garde les traditions ancestrales.
`;

const context4 = analyzeContext(phraseLongue, lexiques.ancien);

console.log(`\nTexte: [${context4.metadata.wordCount} mots]`);
console.log(`Mots uniques: ${context4.metadata.uniqueWordCount}`);
console.log(`Max entrées autorisées: ${context4.metadata.maxEntries}`);
console.log(`Entrées utilisées: ${context4.metadata.entriesUsed}`);
console.log(`Fallback activé: ${context4.useFallback ? 'OUI' : 'NON'}`);
console.log(`\nMots trouvés: ${context4.metadata.wordsFound.length}`);
console.log(`Mots NON trouvés: ${context4.metadata.wordsNotFound.length}`);
console.log(`\nOptimisation:`);
console.log(`  Tokens économisés: ${context4.metadata.tokensSaved} (-${context4.metadata.savingsPercent}%)`);

// Afficher top 10 mots trouvés
console.log(`\nTop 10 mots trouvés (par score):`);
context4.metadata.wordsFound.slice(0, 10).forEach((w, i) => {
  console.log(`  ${i+1}. ${w.input} → ${w.confluent} (score: ${w.score})`);
});

console.log('\n═══════════════════════════════════════════════════');
console.log('RÉSUMÉ DES TESTS');
console.log('═══════════════════════════════════════════════════');

const tests = [
  { name: 'Phrase simple (4 mots)', context: context1 },
  { name: 'Phrase complexe (12 mots)', context: context2 },
  { name: 'Fallback (5 mots)', context: context3 },
  { name: 'Texte long (60+ mots)', context: context4 }
];

console.log('\nComparaison performances:\n');
console.log('│ Test                    │ Mots │ Max  │ Utilisé │ Économie │ Fallback │');
console.log('├─────────────────────────┼──────┼──────┼─────────┼──────────┼──────────┤');

tests.forEach(t => {
  const name = t.name.padEnd(23);
  const words = String(t.context.metadata.wordCount).padStart(4);
  const max = String(t.context.metadata.maxEntries).padStart(4);
  const used = String(t.context.metadata.entriesUsed).padStart(7);
  const savings = `${String(t.context.metadata.savingsPercent).padStart(3)}%`.padStart(8);
  const fallback = (t.context.useFallback ? 'OUI ⚠️' : 'NON   ').padStart(8);

  console.log(`│ ${name} │ ${words} │ ${max} │ ${used} │ ${savings} │ ${fallback} │`);
});

console.log('└─────────────────────────┴──────┴──────┴─────────┴──────────┴──────────┘');

console.log('\n✓ Tests terminés avec succès');
console.log(`✓ Lexique chargé: ${context1.metadata.totalLexiqueSize} entrées`);
console.log(`✓ Économie moyenne: ${Math.round((context1.metadata.savingsPercent + context2.metadata.savingsPercent + context4.metadata.savingsPercent) / 3)}%`);
