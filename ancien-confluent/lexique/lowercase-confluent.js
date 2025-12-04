#!/usr/bin/env node

/**
 * Script pour convertir tous les mots Confluent en minuscules dans les lexiques
 * Le Confluent n'a pas de distinction majuscule/minuscule
 */

const fs = require('fs');
const path = require('path');

const LEXIQUE_DIR = __dirname;

function lowercaseConfluentInFile(filePath) {
  console.log(`Processing: ${path.basename(filePath)}`);

  const content = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content);

  let changeCount = 0;

  // Parcourir le dictionnaire
  if (data.dictionnaire) {
    for (const [key, entry] of Object.entries(data.dictionnaire)) {
      if (entry.traductions) {
        entry.traductions.forEach(trad => {
          if (trad.confluent && trad.confluent !== trad.confluent.toLowerCase()) {
            console.log(`  - ${trad.confluent} → ${trad.confluent.toLowerCase()}`);
            trad.confluent = trad.confluent.toLowerCase();
            changeCount++;
          }
        });
      }
    }
  }

  // Sauvegarder si des changements ont été faits
  if (changeCount > 0) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
    console.log(`  ✓ ${changeCount} changements sauvegardés\n`);
  } else {
    console.log(`  ✓ Aucun changement nécessaire\n`);
  }

  return changeCount;
}

function main() {
  console.log('=== Conversion Confluent → minuscules ===\n');

  const files = fs.readdirSync(LEXIQUE_DIR)
    .filter(f => f.endsWith('.json') && !f.startsWith('_'))
    .map(f => path.join(LEXIQUE_DIR, f));

  let totalChanges = 0;

  for (const file of files) {
    try {
      totalChanges += lowercaseConfluentInFile(file);
    } catch (error) {
      console.error(`Erreur dans ${path.basename(file)}: ${error.message}\n`);
    }
  }

  console.log(`=== Terminé: ${totalChanges} conversions au total ===`);
}

main();
