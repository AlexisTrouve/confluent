/**
 * Test des ARTEFACTS SERVIS - valide le Confluent affiché à l'UI contre le gate.
 *
 * QUOI : charge public/data/example-phrases.json et vérifie que CHAQUE traduction Confluent
 *        servie passe le gate phonotactique.
 * POURQUOI : ce fichier est servi tel quel dans l'onglet "Exemples". C'est précisément lui qui
 *        contenait 8 formes cassées (tbime, lnosu…) générées par l'ancien système non gardé.
 *        L'audit du lexique ne le couvrait pas → trou de couverture. Ce test ferme le trou :
 *        désormais "vert" inclut ce qui est réellement montré à l'utilisateur.
 * COMMENT : parcourt toutes les catégories, valide chaque champ `cf`, échoue (exit 1) au moindre
 *        artefact invalide en le nommant.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { validateTranslation } = require('../../src/core/validation/phonotactics');

const file = path.join(__dirname, '..', '..', 'public', 'data', 'example-phrases.json');

if (!fs.existsSync(file)) {
  console.log('example-phrases.json absent — rien à valider (OK).');
  process.exit(0);
}

const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
let total = 0, bad = 0;
const failures = [];

for (const [categorie, arr] of Object.entries(data)) {
  for (const item of arr) {
    total++;
    const cf = item.cf || '';
    // Une entrée d'erreur de génération (ex "(erreur: …)") ne doit pas se retrouver servie.
    if (/^\(erreur/i.test(cf)) {
      bad++; failures.push(`[${categorie}] "${item.fr}" → ${cf} (échec de génération)`);
      continue;
    }
    const g = validateTranslation(cf);
    if (!g.valid) {
      bad++;
      const formes = g.invalides.map(i => `${i.mot} (${i.erreurs.join(', ')})`).join('; ');
      failures.push(`[${categorie}] "${item.fr}" → ${cf}  ⟶  ${formes}`);
    }
  }
}

console.log(`example-phrases.json : ${total} phrases, ${bad} invalides`);
if (bad > 0) {
  console.error('\nFORMES SERVIES INVALIDES :');
  failures.forEach(f => console.error('  ✗ ' + f));
  process.exit(1);
}
console.log('Tous les artefacts servis sont phonotactiquement valides.');
