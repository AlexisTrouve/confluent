#!/usr/bin/env node
/**
 * Régénération directe (in-process) de public/data/example-phrases.json via l'agent.
 *
 * QUOI : traduit la liste de phrases d'exemple en appelant translateWithAgent EN DIRECT (pas
 *        d'HTTP, pas d'auth), avec sauvegarde INCRÉMENTALE et reprise (skip des cf déjà valides).
 * POURQUOI : la génération via HTTP+process séparé est fragile (rate-limit proxy, process
 *        orphelin) ; l'in-process est stable, et la sauvegarde incrémentale rend l'opération
 *        resumable — relancer comble les trous sans tout refaire.
 * COMMENT : charge lexique+index, instancie le client sur le proxy, boucle ; pour chaque phrase,
 *        si le cf existant passe déjà le gate on le garde, sinon on régénère et on RÉÉCRIT le
 *        fichier immédiatement (progrès persistant). Clé via ETHERYALE_API_KEY.
 *
 * Usage : ETHERYALE_API_KEY=eai_... CONFLUENT_MODEL=claude-haiku-4-5-20251001 \
 *         node scripts/regen-examples-direct.js
 */

'use strict';

const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');
const { loadAllLexiques, buildReverseIndex } = require('../src/utils/lexiqueLoader');
const { buildReverseIndex: buildMorphIndex } = require('../src/core/morphology/reverseIndexBuilder');
const { analyzeContext } = require('../src/core/translation/contextAnalyzer');
const { buildContextualPrompt } = require('../src/core/translation/promptBuilder');
const { translateWithAgent } = require('../src/core/translation/translationAgent');
const { validateTranslation } = require('../src/core/validation/phonotactics');

const API_KEY = process.env.ETHERYALE_API_KEY;
const BASE_URL = process.env.ETHERYALE_BASE_URL || 'https://ai.etheryale.com';
const MODEL = process.env.CONFLUENT_MODEL || 'claude-haiku-4-5-20251001';
if (!API_KEY) { console.error('FATAL: ETHERYALE_API_KEY manquante.'); process.exit(1); }

// Mêmes phrases que generate-examples.js (source unique de la liste FR).
const phrases = {
  'Salutations & Formules': ['Je te vois', 'Nous nous voyons', 'Que la lumière guide ton chemin', 'Les ancêtres veillent sur toi', 'Bienvenue à la Confluence'],
  'Vie quotidienne': ["L'enfant apprend le savoir", 'Le chef parle dans le hall', 'La personne observe le regard', 'Je vais vers la montagne', "Nous donnons l'eau aux enfants", 'Tu portes la pierre', 'Il fait une peinture'],
  'Nature & Éléments': ["L'eau coule vers la terre", 'Le soleil éclaire le ciel', 'La lune brille sur la forêt', 'Le vent souffle depuis la montagne', 'Le feu réchauffe la nuit'],
  'Spiritualité & Rituels': ["L'esprit voyage de l'eau vers le ciel", "Les Voix de l'Aurore transmettent le savoir", 'Le sacré unit les ancêtres et les enfants', 'Nous observons le rituel ensemble', "L'aurore apporte la vérité"],
  'Castes & Société': ['Les Enfants des Échos travaillent la pierre', 'Les Enfants du Courant pêchent dans l\'eau', 'Les Ailes-Grises volent avec les grues', 'Les Faucons Chasseurs protègent le peuple', 'Les Passes-bien échangent les biens'],
  'Actions & Mouvement': ['Je vais depuis la Confluence vers les Antres', 'Tu prends le chemin de la lumière', 'Nous chassons dans la forêt', "L'ancêtre transmet le savoir à l'enfant", 'Le gardien protège la grande fresque'],
  'Questions': ['Qui observe le ciel ?', 'Où va la personne ?', 'Quand les ancêtres ont-ils parlé ?', 'Est-ce que tu vois la lune ?'],
  'Négation': ['Je ne vois pas', "Il n'observe jamais le sacré", 'Il est interdit de parler ici']
};

const outputPath = path.join(__dirname, '..', 'public', 'data', 'example-phrases.json');

async function main() {
  const baseDir = path.join(__dirname, '..', '..');
  const { ancien } = loadAllLexiques(baseDir);
  const morphReverseIndex = buildMorphIndex(ancien);
  const ctx = { lexique: ancien, morphReverseIndex };
  const anthropic = new Anthropic({ apiKey: API_KEY, baseURL: BASE_URL });

  // Charger l'existant pour reprise : on indexe les cf déjà VALIDES par phrase FR.
  const existingValid = {};
  if (fs.existsSync(outputPath)) {
    try {
      const prev = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
      for (const arr of Object.values(prev)) {
        for (const item of arr) {
          if (item && item.cf && validateTranslation(item.cf).valid && !/^\(erreur/i.test(item.cf)) {
            existingValid[item.fr] = item.cf;
          }
        }
      }
    } catch (_) { /* fichier illisible : on régénère tout */ }
  }

  const results = {};
  let done = 0, regen = 0, kept = 0, failed = 0;
  const total = Object.values(phrases).reduce((n, a) => n + a.length, 0);

  for (const [categorie, list] of Object.entries(phrases)) {
    results[categorie] = [];
    for (const fr of list) {
      done++;
      if (existingValid[fr]) {
        results[categorie].push({ fr, cf: existingValid[fr] });
        kept++;
        console.log(`[${done}/${total}] (gardé) "${fr}" → ${existingValid[fr]}`);
      } else {
        try {
          const contextResult = analyzeContext(fr, ancien);
          const systemPrompt = buildContextualPrompt(contextResult, 'ancien', fr);
          const res = await translateWithAgent({ text: fr, systemPrompt, anthropic, model: MODEL, ctx });
          const g = validateTranslation(res.translation);
          if (g.valid && res.translation) {
            results[categorie].push({ fr, cf: res.translation });
            regen++;
            console.log(`[${done}/${total}] ✓ "${fr}" → ${res.translation}  [outils:${res.toolRounds} rép:${res.repairs}]`);
          } else {
            results[categorie].push({ fr, cf: `(erreur: sortie invalide)` });
            failed++;
            console.log(`[${done}/${total}] ✗ "${fr}" → sortie invalide`);
          }
        } catch (e) {
          results[categorie].push({ fr, cf: `(erreur: ${e.code || e.message})` });
          failed++;
          console.log(`[${done}/${total}] ✗ "${fr}" → ${e.code || e.message}`);
        }
      }
      // Sauvegarde INCRÉMENTALE après chaque phrase (progrès persistant / resumable).
      fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');
    }
  }

  console.log(`\nTerminé : ${regen} régénérées, ${kept} gardées, ${failed} en échec / ${total}.`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
