#!/usr/bin/env node
/**
 * Script pour générer les traductions des phrases d'exemple
 * Usage: node generate-examples.js
 */

const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3000/translate';
const API_KEY = 'd9be0765-c454-47e9-883c-bcd93dd19eae';

const phrases = {
  "Salutations & Formules": [
    "Je te vois",
    "Nous nous voyons",
    "Que la lumière guide ton chemin",
    "Les ancêtres veillent sur toi",
    "Bienvenue à la Confluence"
  ],
  "Vie quotidienne": [
    "L'enfant apprend le savoir",
    "Le chef parle dans le hall",
    "La personne observe le regard",
    "Je vais vers la montagne",
    "Nous donnons l'eau aux enfants",
    "Tu portes la pierre",
    "Il fait une peinture"
  ],
  "Nature & Éléments": [
    "L'eau coule vers la terre",
    "Le soleil éclaire le ciel",
    "La lune brille sur la forêt",
    "Le vent souffle depuis la montagne",
    "Le feu réchauffe la nuit"
  ],
  "Spiritualité & Rituels": [
    "L'esprit voyage de l'eau vers le ciel",
    "Les Voix de l'Aurore transmettent le savoir",
    "Le sacré unit les ancêtres et les enfants",
    "Nous observons le rituel ensemble",
    "L'aurore apporte la vérité"
  ],
  "Castes & Société": [
    "Les Enfants des Échos travaillent la pierre",
    "Les Enfants du Courant pêchent dans l'eau",
    "Les Ailes-Grises volent avec les grues",
    "Les Faucons Chasseurs protègent le peuple",
    "Les Passes-bien échangent les biens"
  ],
  "Actions & Mouvement": [
    "Je vais depuis la Confluence vers les Antres",
    "Tu prends le chemin de la lumière",
    "Nous chassons dans la forêt",
    "L'ancêtre transmet le savoir à l'enfant",
    "Le gardien protège la grande fresque"
  ],
  "Questions": [
    "Qui observe le ciel ?",
    "Où va la personne ?",
    "Quand les ancêtres ont-ils parlé ?",
    "Est-ce que tu vois la lune ?"
  ],
  "Négation": [
    "Je ne vois pas",
    "Il n'observe jamais le sacré",
    "Il est interdit de parler ici"
  ]
};

async function translatePhrase(text) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    },
    body: JSON.stringify({
      text,
      target: 'ancien',
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514',
      temperature: 0.7
    })
  });

  const data = await response.json();

  if (response.ok && data.layer1) {
    return data.layer1.translation;
  }

  throw new Error(data.error || 'Erreur de traduction');
}

async function main() {
  console.log('🚀 Génération des traductions...\n');

  const results = {};
  let total = 0;
  let done = 0;

  // Compter le total
  for (const phraseList of Object.values(phrases)) {
    total += phraseList.length;
  }

  // Traduire chaque catégorie
  for (const [category, phraseList] of Object.entries(phrases)) {
    console.log(`\n📁 ${category}`);
    results[category] = [];

    for (const phrase of phraseList) {
      done++;
      process.stdout.write(`  [${done}/${total}] "${phrase.substring(0, 40)}..." `);

      try {
        const translation = await translatePhrase(phrase);
        results[category].push({
          fr: phrase,
          cf: translation
        });
        console.log(`✓`);
      } catch (error) {
        results[category].push({
          fr: phrase,
          cf: `(erreur: ${error.message})`
        });
        console.log(`✗ ${error.message}`);
      }

      // Pause entre les requêtes
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Sauvegarder le fichier
  const outputPath = path.join(__dirname, '..', 'public', 'data', 'example-phrases.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');

  console.log(`\n✅ Terminé! ${done} phrases traduites`);
  console.log(`📄 Fichier sauvegardé: ${outputPath}`);
}

main().catch(console.error);
