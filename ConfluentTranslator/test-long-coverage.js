const fs = require('fs');
const path = require('path');

// Load all lexicon files
const lexiqueDir = path.join(__dirname, '../ancien-confluent/lexique');
const lexiqueFiles = fs.readdirSync(lexiqueDir).filter(f => f.endsWith('.json'));

const fullLexique = new Map();

// Helper to normalize text (lowercase + strip accents)
function normalize(text) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

lexiqueFiles.forEach(file => {
  const content = JSON.parse(fs.readFileSync(path.join(lexiqueDir, file), 'utf8'));
  if (content.dictionnaire) {
    Object.entries(content.dictionnaire).forEach(([key, value]) => {
      // Add both original and normalized versions
      fullLexique.set(key.toLowerCase(), value);
      fullLexique.set(normalize(key), value);

      if (value.synonymes_fr) {
        value.synonymes_fr.forEach(syn => {
          fullLexique.set(syn.toLowerCase(), value);
          fullLexique.set(normalize(syn), value);
        });
      }
    });
  }
});

// Long test texts
const longTexts = [
  {
    title: "Les Ailes-Grises",
    text: `Les Ailes-Grises veillent depuis les Cercles de Vigile, leurs silhouettes grises planent au dessus de la Confluence. Leurs yeux perçants scrutent l'horizon, cherchant les dangers qui pourraient menacer les leurs. Ces gardiens du ciel portent le poids de la vigilance éternelle, transmettant leurs savoirs de génération en génération.`
  },
  {
    title: "La Grande Fresque",
    text: `Dans les profondeurs des Halls des Serments, la Grande Fresque s'étend sur les murs anciens. Chaque trait raconte l'histoire de notre peuple, les victoires et les défaites, les joies et les peines. Les artisans travaillent sans relâche, ajoutant de nouvelles scènes à cette œuvre collective qui unit toutes les générations des Siliaska.`
  },
  {
    title: "Les Antres des Échos",
    text: `Les voix résonnent dans toutes les cavernes des Antres des Échos, portant les chants sacrés à travers les tunnels obscurs. Les Enfants des Échos gardent ces lieux mystérieux, où les ancêtres parlent encore à ceux qui savent écouter. Ici, le temps coule différemment, et les échos du passé rejoignent les murmures du présent.`
  },
  {
    title: "Les Traditions",
    text: `Les frères rejoignent les traditions des artisans dans les ateliers sacrés. Là, ils apprennent les gestes précieux transmis depuis les temps immémoriaux. Chaque outil raconte une histoire, chaque technique porte la mémoire des anciens. Les apprentis écoutent attentivement les enseignements de leurs maîtres, sachant que bientôt, ce sera à leur tour de transmettre.`
  }
];

console.log('\n=== LONG TEXT COVERAGE TEST ===\n');
console.log(`Lexique size: ${fullLexique.size} entries\n`);

// Common French articles and prepositions to ignore in coverage
const stopWords = new Set(['le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'au', 'aux', 'a', 'l', 'd', 'c', 's', 'n', 't', 'qu', 'j', 'm']);

let globalFound = 0;
let globalTotal = 0;
const allMissing = new Set();

longTexts.forEach(({ title, text }) => {
  const words = text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/['']/g, ' ')
    .split(/[\s,;:.!?()«»""-]+/)
    .filter(w => w.length > 0);

  // Filter out stopwords before checking
  const contentWords = words.filter(w => !stopWords.has(w));

  const found = [];
  const missing = [];

  contentWords.forEach(word => {
    if (fullLexique.has(word)) {
      found.push(word);
    } else {
      // Try lemmatization for -ment adverbs
      const withoutMent = word.replace(/ment$/, '');
      if (fullLexique.has(withoutMent)) {
        found.push(word);
      } else {
        missing.push(word);
        allMissing.add(word);
      }
    }
  });

  globalFound += found.length;
  globalTotal += contentWords.length;

  const coverage = contentWords.length > 0 ? ((found.length / contentWords.length) * 100).toFixed(1) : 100;
  const status = parseFloat(coverage) >= 95 ? '✅' : parseFloat(coverage) >= 70 ? '⚠️' : '❌';

  console.log(`${status} ${coverage}% - ${title} (${found.length}/${contentWords.length} mots)`);
  if (missing.length > 0) {
    const uniqueMissing = [...new Set(missing)];
    console.log(`   Manquants (${uniqueMissing.length}): ${uniqueMissing.slice(0, 10).join(', ')}${uniqueMissing.length > 10 ? '...' : ''}`);
  }
  console.log('');
});

const globalCoverage = ((globalFound / globalTotal) * 100).toFixed(1);
console.log(`\n📊 COUVERTURE GLOBALE: ${globalCoverage}% (${globalFound}/${globalTotal} mots)\n`);

console.log(`\n🔍 MOTS MANQUANTS UNIQUES: ${allMissing.size}\n`);

// Count frequency of missing words
const missingFrequency = new Map();
longTexts.forEach(({ text }) => {
  const words = text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/['']/g, ' ')
    .split(/[\s,;:.!?()«»""-]+/)
    .filter(w => w.length > 0 && !stopWords.has(w));

  words.forEach(word => {
    if (allMissing.has(word)) {
      missingFrequency.set(word, (missingFrequency.get(word) || 0) + 1);
    }
  });
});

const sortedMissing = [...missingFrequency.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20);

if (sortedMissing.length > 0) {
  console.log('TOP 20 MOTS MANQUANTS (par fréquence):\n');
  sortedMissing.forEach(([word, count], index) => {
    console.log(`${(index + 1).toString().padStart(2)}. ${word.padEnd(20)} (${count}x)`);
  });
}

console.log('\n');
