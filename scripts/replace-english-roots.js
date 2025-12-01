#!/usr/bin/env node

/**
 * Remplace les racines trop anglaises par des équivalents finno-basques
 */

const fs = require('fs');
const path = require('path');

const LEXIQUE_DIR = path.join(__dirname, '../ancien-confluent/lexique');

// Map de remplacement : ancien → nouveau
const REPLACEMENTS = {
  'malo': 'paka',  // mauvais (basque-like)
  'situ': 'tuli',  // être/rester (finnois tulla)
  'taki': 'kanu',  // porter (finnois kantaa)
  'time': 'aika'   // temps (finnois aika)
};

function replaceInWord(word) {
  let result = word;
  Object.entries(REPLACEMENTS).forEach(([old, newRoot]) => {
    result = result.replace(new RegExp(old, 'g'), newRoot);
  });
  return result;
}

function processFile(file) {
  const filePath = path.join(LEXIQUE_DIR, file);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  if (!content.dictionnaire) return { modified: 0 };

  let modified = 0;

  Object.entries(content.dictionnaire).forEach(([motFr, data]) => {
    if (!data.traductions) return;

    data.traductions.forEach(trad => {
      const oldMot = trad.confluent;
      const newMot = replaceInWord(oldMot);

      if (oldMot !== newMot) {
        console.log(`  [${file}] "${motFr}": ${oldMot} → ${newMot}`);
        trad.confluent = newMot;

        // Mettre à jour forme_liee
        if (trad.forme_liee) {
          trad.forme_liee = replaceInWord(trad.forme_liee);
        }

        // Mettre à jour racine (verbes)
        if (trad.racine) {
          trad.racine = replaceInWord(trad.racine);
        }

        // Mettre à jour composition
        if (trad.composition) {
          trad.composition = replaceInWord(trad.composition);
        }

        // Mettre à jour racines array
        if (trad.racines) {
          trad.racines = trad.racines.map(r => replaceInWord(r));
        }

        modified++;
      }
    });
  });

  // Sauvegarder le fichier modifié
  if (modified > 0) {
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
  }

  return { modified };
}

function main() {
  const files = fs.readdirSync(LEXIQUE_DIR)
    .filter(f => f.endsWith('.json'));

  console.log('🔄 Remplacement des racines anglaises par équivalents finno-basques\n');
  console.log('Remplacements:');
  Object.entries(REPLACEMENTS).forEach(([old, newRoot]) => {
    console.log(`  ${old} → ${newRoot}`);
  });
  console.log('');

  let totalModified = 0;

  files.forEach(file => {
    const { modified } = processFile(file);
    totalModified += modified;

    if (modified > 0) {
      console.log(`\n[${file}] ${modified} mots modifiés`);
    }
  });

  console.log(`\n✅ Terminé: ${totalModified} mots modifiés`);
  console.log('💡 Relancez l\'audit pour vérifier\n');
}

if (require.main === module) {
  main();
}
