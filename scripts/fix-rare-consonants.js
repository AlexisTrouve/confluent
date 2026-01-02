#!/usr/bin/env node

/**
 * Remplace les consonnes rares dans les mots NON-ESSENTIELS
 * Garde les consonnes rares pour:
 * - Racines sacrées (ura, ora, etc.)
 * - Noms propres importants (castes, lieux)
 * - Mots "mystiques" ou "étrangers"
 */

const fs = require('fs');
const path = require('path');

const LEXIQUE_DIR = path.join(__dirname, '../ancien-confluent/lexique');

// Racines et mots à PRÉSERVER avec consonnes rares (mystique/sacré)
const PRESERVE = new Set([
  // Racines sacrées fondamentales
  'ura', 'ora', 'oski', 'onaki', 'umi', 'urusi',

  // Noms propres de castes (garder l'identité)
  'nakuura', 'oraumi', 'akoazana',

  // Noms propres de lieux majeurs
  'uraakota', 'vukuura',

  // Concepts mystiques/sacrés
  'kori', // cœur (central)
  'sora', // clair/lumineux (lié à ora)
  'arku', // arc (objet sacré)
  'riku', // interrogation (grammaire)

  // Mots "étrangers" ou concepts chelou (garder le son bizarre)
  'urusi', 'zerusora', 'aru', 'garu', 'hayo', 'hayak'
]);

// Map de remplacement consonne rare → consonne standard
const REPLACE_MAP = {
  'r': 'l',  // r → l (liquide proche)
  'd': 't',  // d → t (occlusive proche)
  'h': 'k',  // h → k
  'g': 'k'   // g → k
};

function shouldPreserve(mot, motFr, type) {
  // Préserver si dans la liste
  if (PRESERVE.has(mot)) return true;

  // Préserver les racines sacrées
  if (type === 'racine_sacree') return true;

  // Préserver certains noms propres
  if (type === 'nom_propre' && (motFr.includes('Enfants') || motFr.includes('Voix'))) return true;

  return false;
}

function replaceRareConsonants(mot) {
  let result = mot;
  Object.entries(REPLACE_MAP).forEach(([rare, standard]) => {
    result = result.replace(new RegExp(rare, 'g'), standard);
  });
  return result;
}

function processFile(file) {
  const filePath = path.join(LEXIQUE_DIR, file);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  if (!content.dictionnaire) return { modified: 0, preserved: 0 };

  let modified = 0;
  let preserved = 0;

  Object.entries(content.dictionnaire).forEach(([motFr, data]) => {
    if (!data.traductions) return;

    data.traductions.forEach(trad => {
      const hasRare = /[rdgh]/.test(trad.confluent);
      if (!hasRare) return;

      if (shouldPreserve(trad.confluent, motFr, trad.type)) {
        preserved++;
        return;
      }

      // Remplacer
      const oldMot = trad.confluent;
      const newMot = replaceRareConsonants(oldMot);

      if (oldMot !== newMot) {
        console.log(`  [${file}] "${motFr}": ${oldMot} → ${newMot}`);
        trad.confluent = newMot;

        // Mettre à jour forme_liee si elle existe
        if (trad.forme_liee) {
          trad.forme_liee = replaceRareConsonants(trad.forme_liee);
        }

        // Mettre à jour racine si elle existe (verbes)
        if (trad.racine) {
          trad.racine = replaceRareConsonants(trad.racine);
        }

        // Mettre à jour composition si elle existe
        if (trad.composition) {
          trad.composition = replaceRareConsonants(trad.composition);
        }

        // Mettre à jour racines array si elle existe
        if (trad.racines) {
          trad.racines = trad.racines.map(r => {
            if (PRESERVE.has(r)) return r; // Ne pas toucher aux racines préservées
            return replaceRareConsonants(r);
          });
        }

        modified++;
      }
    });
  });

  // Sauvegarder le fichier modifié
  if (modified > 0) {
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
  }

  return { modified, preserved };
}

function main() {
  const files = fs.readdirSync(LEXIQUE_DIR)
    .filter(f => f.endsWith('.json'))
    .filter(f => !f.startsWith('00-grammaire')); // Ne pas toucher la grammaire

  console.log('🔧 Remplacement des consonnes rares\n');
  console.log('Consonnes rares préservées dans les mots sacrés/mystiques\n');

  let totalModified = 0;
  let totalPreserved = 0;

  files.forEach(file => {
    const { modified, preserved } = processFile(file);
    totalModified += modified;
    totalPreserved += preserved;

    if (modified > 0 || preserved > 0) {
      console.log(`\n[${file}] ${modified} modifiés, ${preserved} préservés`);
    }
  });

  console.log(`\n✅ Terminé:`);
  console.log(`   ${totalModified} mots modifiés`);
  console.log(`   ${totalPreserved} mots préservés (sacrés/mystiques)`);
  console.log('\n💡 Relancez l\'audit pour voir le nouveau ratio de consonnes rares\n');
}

if (require.main === module) {
  main();
}
