const { loadAllLexiques } = require('./lexiqueLoader');
const path = require('path');
const baseDir = path.join(__dirname, '..');
const lexiques = loadAllLexiques(baseDir);

console.log('\n=== RECHERCHE CONCEPTS ABSTRAITS ===\n');

const recherches = [
  'civilisation', 'observation', 'observer', 'regarder', 'regard',
  'confluence', 'union', 'peuple', 'culture', 'tradition',
  'sagesse', 'connaissance', 'memoire', 'mémoire', 'savoir',
  'libre', 'liberte', 'liberté', 'voir', 'vision'
];

recherches.forEach(mot => {
  // Normaliser comme le fait le lexiqueLoader
  const normalized = mot.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const found = lexiques.ancien.dictionnaire[normalized];
  if (found?.traductions) {
    console.log(`✅ ${mot}: ${found.traductions[0].confluent} (${found.traductions[0].type})`);
  } else {
    console.log(`❌ ${mot}: NON TROUVÉ`);
  }
});

console.log('\n=== RACINES LIÉES (sili, aska, ura, kota) ===\n');
const racines = ['sili', 'aska', 'ura', 'kota'];
racines.forEach(mot => {
  const found = lexiques.ancien.dictionnaire[mot];
  if (found?.traductions) {
    console.log(`${mot}: ${found.mot_francais} - ${found.traductions[0].confluent}`);
  }
});
