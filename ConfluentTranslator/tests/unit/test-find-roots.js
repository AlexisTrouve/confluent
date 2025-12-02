const { loadAllLexiques } = require('./lexiqueLoader');
const path = require('path');
const baseDir = path.join(__dirname, '..');
const lexiques = loadAllLexiques(baseDir);

console.log('\n=== RECHERCHE RACINES POUR COMPOSITIONS ===\n');

// Rechercher les racines nécessaires
const recherches = [
  'manger', 'nourriture', 'eau', 'boire', 'pierre', 'lumiere', 'abri',
  'monter', 'ouvrir', 'ouverture', 'place', 'plante', 'aromate',
  'gouffre', 'humide'
];

recherches.forEach(mot => {
  const found = lexiques.ancien.dictionnaire[mot];
  if (found && found.traductions) {
    console.log(`✅ ${mot}: ${found.traductions[0].confluent} (${found.traductions[0].type})`);
  } else {
    console.log(`❌ ${mot}: NON TROUVÉ`);
  }
});

console.log('\n=== VÉRIFIER EXISTANTS ===\n');
const aVerifier = ['manque', 'boire', 'fruit', 'legume', 'aromate', 'table', 'lumiere', 'fenetre', 'toit', 'mur', 'escalier'];

aVerifier.forEach(mot => {
  const found = lexiques.ancien.dictionnaire[mot];
  if (found && found.traductions) {
    console.log(`⚠️  ${mot} EXISTE DÉJÀ: ${found.traductions[0].confluent}`);
  } else {
    console.log(`✅ ${mot}: À CRÉER`);
  }
});
