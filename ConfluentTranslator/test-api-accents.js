/**
 * Test API avec caractères accentués
 */

const http = require('http');

const testText = "La mémoire des échos résonne dans la lumière. Les légumes parfument la fenêtre de notre civilisation.";

console.log('\n=== TEST API AVEC ACCENTS ===\n');
console.log('Texte envoyé:', testText);
console.log('');

const data = JSON.stringify({ text: testText });

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/analyze/coverage',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    const result = JSON.parse(body);

    console.log('Couverture:', result.coverage + '%');
    console.log('');

    console.log('=== MOTS TROUVÉS ===');
    result.found.forEach(w => {
      console.log(`  ✅ "${w.word}" → ${w.confluent}`);
    });

    console.log('');
    console.log('=== MOTS MANQUANTS ===');
    result.missing.forEach(w => {
      console.log(`  ❌ "${w.word}"`);
    });

    console.log('');

    // Vérifier si les mots accentués sont cassés
    const brokenWords = result.missing.filter(w =>
      ['m', 'moire', 'chos', 'lumi', 're', 'l', 'gumes', 'fen', 'tre'].includes(w.word)
    );

    if (brokenWords.length > 0) {
      console.log('❌ PROBLÈME: Mots cassés détectés !');
      console.log('   Les accents ne sont pas correctement traités.');
      brokenWords.forEach(w => console.log(`   - "${w.word}"`));
    } else {
      console.log('✅ OK: Aucun mot cassé par les accents !');
    }
  });
});

req.on('error', (e) => {
  console.error('Erreur:', e.message);
  console.log('Le serveur est-il en cours d\'exécution sur le port 3000 ?');
});

req.write(data);
req.end();
