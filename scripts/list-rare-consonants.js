#!/usr/bin/env node

/**
 * Liste les mots utilisant des consonnes rares (r, d, h, g)
 * et suggère des remplacements
 */

const fs = require('fs');
const path = require('path');

const LEXIQUE_DIR = path.join(__dirname, '../ancien-confluent/lexique');

const CONSONNES_RARES = ['r', 'd', 'h', 'g'];
const CONSONNES_STANDARD = ['b', 'k', 'l', 'm', 'n', 'p', 's', 't', 'v', 'z'];

// Map de remplacement suggéré
const REPLACEMENTS = {
  'r': ['l', 't', 'k'],  // r → l (le plus proche phonétiquement)
  'd': ['t', 'k'],       // d → t (le plus proche)
  'h': ['k', 's'],       // h → k ou s
  'g': ['k', 'v']        // g → k ou v
};

function containsRareConsonant(mot) {
  return CONSONNES_RARES.some(c => mot.includes(c));
}

function getRareConsonants(mot) {
  return CONSONNES_RARES.filter(c => mot.includes(c));
}

function suggestReplacement(mot, rareChar) {
  const replacements = REPLACEMENTS[rareChar] || [];
  return replacements.map(r => mot.replace(new RegExp(rareChar, 'g'), r));
}

function main() {
  const files = fs.readdirSync(LEXIQUE_DIR).filter(f => f.endsWith('.json'));

  const motsAvecConsonnesRares = [];

  files.forEach(file => {
    const filePath = path.join(LEXIQUE_DIR, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (!content.dictionnaire) return;

    Object.entries(content.dictionnaire).forEach(([motFr, data]) => {
      if (!data.traductions) return;

      data.traductions.forEach(trad => {
        if (containsRareConsonant(trad.confluent)) {
          const rares = getRareConsonants(trad.confluent);
          motsAvecConsonnesRares.push({
            file,
            motFr,
            confluent: trad.confluent,
            type: trad.type,
            rareConsonants: rares,
            suggestions: rares.flatMap(r => suggestReplacement(trad.confluent, r))
          });
        }
      });
    });
  });

  // Grouper par consonne rare
  console.log(`\n📊 ${motsAvecConsonnesRares.length} mots avec consonnes rares (r, d, h, g)\n`);

  ['r', 'd', 'h', 'g'].forEach(rare => {
    const motsAvec = motsAvecConsonnesRares.filter(m => m.rareConsonants.includes(rare));
    if (motsAvec.length === 0) return;

    console.log(`\n━━━ Consonne rare: ${rare.toUpperCase()} (${motsAvec.length} mots) ━━━\n`);

    motsAvec.forEach(m => {
      console.log(`[${m.file}]`);
      console.log(`  "${m.motFr}" → ${m.confluent} (${m.type})`);
      console.log(`  Suggestions: ${m.suggestions.join(', ')}`);
      console.log();
    });
  });

  // Résumé par fichier
  console.log('\n━━━ Résumé par fichier ━━━\n');
  const parFichier = {};
  motsAvecConsonnesRares.forEach(m => {
    parFichier[m.file] = (parFichier[m.file] || 0) + 1;
  });

  Object.entries(parFichier)
    .sort((a, b) => b[1] - a[1])
    .forEach(([file, count]) => {
      console.log(`  ${file.padEnd(35)} ${count} mots`);
    });

  console.log(`\n  TOTAL: ${motsAvecConsonnesRares.length} mots\n`);
}

if (require.main === module) {
  main();
}
