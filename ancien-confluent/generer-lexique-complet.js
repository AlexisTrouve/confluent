#!/usr/bin/env node

/**
 * Script de génération du lexique complet en Markdown
 * Lit tous les fichiers JSON du dossier ./lexique/ et génère ./docs/LEXIQUE-COMPLET.md
 */

const fs = require('fs');
const path = require('path');

// Chemins relatifs (pas de hard path)
const LEXIQUE_DIR = path.join(__dirname, 'lexique');
const OUTPUT_FILE = path.join(__dirname, 'docs', 'LEXIQUE-COMPLET.md');

// Mapping des noms de fichiers vers des titres lisibles
const CATEGORIES = {
  '00-grammaire': 'Grammaire et Règles',
  '01-racines-sacrees': 'Racines Sacrées',
  '02-racines-standards': 'Racines Standards',
  '03-castes': 'Castes',
  '04-lieux': 'Lieux',
  '05-corps-sens': 'Corps et Sens',
  '06-actions': 'Actions',
  '07-emotions': 'Émotions',
  '08-nature-elements': 'Nature et Éléments',
  '09-institutions': 'Institutions',
  '10-animaux': 'Animaux',
  '11-armes-outils': 'Armes et Outils',
  '12-abstraits': 'Concepts Abstraits',
  '13-rituels': 'Rituels',
  '14-geographie': 'Géographie',
  '15-roles-titres': 'Rôles et Titres',
  '16-communication': 'Communication',
  '17-temps': 'Temps',
  '18-couleurs': 'Couleurs',
  '19-sante-dangers': 'Santé et Dangers',
  '20-objets-materiaux': 'Objets et Matériaux',
  '21-famille': 'Famille',
  '22-nombres': 'Nombres',
  '23-nourriture': 'Nourriture',
  '24-habitat': 'Habitat',
  '25-navigation': 'Navigation',
  '26-architecture': 'Architecture',
  '27-concepts-philosophiques': 'Concepts Philosophiques',
  '28-etrangers': 'Étrangers',
  '29-actions-militaires': 'Actions Militaires',
  '30-vetements-apparence': 'Vêtements et Apparence'
};

/**
 * Génère une section Markdown pour une catégorie
 */
function generateCategorySection(categoryName, data) {
  let markdown = `## ${categoryName}\n\n`;

  if (!data.dictionnaire) {
    return markdown + '*Aucune entrée*\n\n';
  }

  // Trier les mots français par ordre alphabétique
  const sortedWords = Object.keys(data.dictionnaire).sort();

  for (const motFr of sortedWords) {
    const entry = data.dictionnaire[motFr];

    markdown += `### ${motFr}\n\n`;

    // Traductions en Confluent
    if (entry.traductions && entry.traductions.length > 0) {
      for (const trad of entry.traductions) {
        markdown += `**Confluent:** ${trad.confluent}`;

        if (trad.forme_liee) {
          markdown += ` *(forme liée: ${trad.forme_liee})*`;
        }

        markdown += `\n`;

        if (trad.type) {
          markdown += `- Type: ${trad.type}\n`;
        }

        if (trad.composition) {
          markdown += `- Composition: \`${trad.composition}\`\n`;
        }

        if (trad.domaine) {
          markdown += `- Domaine: ${trad.domaine}\n`;
        }

        if (trad.note) {
          markdown += `- Note: ${trad.note}\n`;
        }

        markdown += '\n';
      }
    }

    // Synonymes français
    if (entry.synonymes_fr && entry.synonymes_fr.length > 0) {
      markdown += `*Synonymes français:* ${entry.synonymes_fr.join(', ')}\n\n`;
    }

    markdown += '---\n\n';
  }

  return markdown;
}

/**
 * Fonction principale
 */
function main() {
  console.log('🔨 Génération du lexique complet...\n');

  // Vérifier que le dossier lexique existe
  if (!fs.existsSync(LEXIQUE_DIR)) {
    console.error(`❌ Erreur: Le dossier ${LEXIQUE_DIR} n'existe pas`);
    process.exit(1);
  }

  // Créer le dossier docs s'il n'existe pas
  const docsDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
    console.log(`📁 Dossier créé: ${docsDir}`);
  }

  // Lire tous les fichiers JSON du lexique
  const files = fs.readdirSync(LEXIQUE_DIR)
    .filter(f => f.endsWith('.json') && !f.startsWith('_') && !f.endsWith('.backup'))
    .sort();

  console.log(`📚 ${files.length} fichiers de lexique trouvés\n`);

  // Générer le header Markdown
  let markdown = `# Lexique Complet du Confluent\n\n`;
  markdown += `*Généré automatiquement le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}*\n\n`;
  markdown += `---\n\n`;
  markdown += `## Table des matières\n\n`;

  // Générer la table des matières
  for (const file of files) {
    const baseName = path.basename(file, '.json');
    const categoryName = CATEGORIES[baseName] || baseName;
    markdown += `- [${categoryName}](#${categoryName.toLowerCase().replace(/\s+/g, '-').replace(/[éè]/g, 'e').replace(/[àâ]/g, 'a')})\n`;
  }

  markdown += `\n---\n\n`;

  // Générer les sections pour chaque catégorie
  let totalEntries = 0;

  for (const file of files) {
    const baseName = path.basename(file, '.json');
    const categoryName = CATEGORIES[baseName] || baseName;
    const filePath = path.join(LEXIQUE_DIR, file);

    console.log(`📖 Traitement de: ${categoryName}`);

    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      if (data.dictionnaire) {
        const entryCount = Object.keys(data.dictionnaire).length;
        totalEntries += entryCount;
        console.log(`   → ${entryCount} entrées`);
      }

      markdown += generateCategorySection(categoryName, data);

    } catch (err) {
      console.error(`❌ Erreur lors de la lecture de ${file}:`, err.message);
      markdown += `## ${categoryName}\n\n*Erreur lors du chargement de cette catégorie*\n\n`;
    }
  }

  // Écrire le fichier de sortie
  fs.writeFileSync(OUTPUT_FILE, markdown, 'utf-8');

  console.log(`\n✅ Lexique généré avec succès!`);
  console.log(`📊 Total: ${totalEntries} entrées`);
  console.log(`📝 Fichier créé: ${OUTPUT_FILE}\n`);
}

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = { generateCategorySection };
