/**
 * transcreate-mytho — harnais de transcréation en registre MYTHOLOGIQUE (dev/atelier).
 *
 * QUOI : transcrée un texte FR sacré (chants du Livre de la Foi) en Confluent mythologique, en
 *        passant par EXACTEMENT le même pipeline que POST /translate (analyse contexte → prompt
 *        contextuel → agent outillé → gate phonotactique). Imprime la sortie gatée + la trace
 *        (gaps lexique, rootGaps, formes cassées) pour révéler ce qui manque encore à la strate.
 * POURQUOI : prouver de bout en bout que tous les layers acceptent le mythologique (et pas « lire
 *        le code »), et apprendre du process (où la langue/le lexique cale sur du vrai texte sacré).
 * COMMENT : usage `node scripts/transcreate-mytho.js "<texte FR>" [modèle]`. Modèle par défaut =
 *        claude-opus-4-8 (règle : mes requêtes de test = Opus explicite). Clé via .env (ETHERYALE_API_KEY).
 */
'use strict';
require('dotenv').config();
const path = require('path');
const { Anthropic } = require('@anthropic-ai/sdk');
const { loadAllLexiques } = require('../src/utils/lexiqueLoader');
const { buildReverseIndex: buildConfluentIndex } = require('../src/core/morphology/reverseIndexBuilder');
const { analyzeContext } = require('../src/core/translation/contextAnalyzer');
const { buildContextualPrompt } = require('../src/core/translation/promptBuilder');
const { translateWithAgent } = require('../src/core/translation/translationAgent');
const { getEra } = require('../src/core/eras/eras');

const VARIANT = 'mythologique';
const TEXT = process.argv[2] || "Voir, c'est arracher au Vide ; ce qu'on cesse de regarder, le Vide le reprend.";
const MODEL = process.argv[3] || 'claude-opus-4-8';

(async () => {
  const baseDir = path.join(__dirname, '..', '..');               // → racine confluent/
  const lexique = loadAllLexiques(baseDir)[VARIANT];
  const ctx = {
    lexique,
    morphReverseIndex: buildConfluentIndex(lexique),
    era: getEra(VARIANT)
  };
  const anthropic = new Anthropic({
    apiKey: process.env.ETHERYALE_API_KEY,
    baseURL: process.env.ETHERYALE_BASE_URL || 'https://ai.etheryale.com'
  });
  const systemPrompt = buildContextualPrompt(analyzeContext(TEXT, lexique), VARIANT, TEXT);

  console.log('════════════════════════════════════════════════════════════');
  console.log('FR      :', TEXT);
  console.log('Registre:', VARIANT, '| Modèle:', MODEL);
  console.log('════════════════════════════════════════════════════════════');

  const r = await translateWithAgent({ text: TEXT, systemPrompt, anthropic, model: MODEL, ctx });

  console.log('\n── TRADUCTION (gatée, fait autorité) ──────────────────────');
  console.log(r.translation);
  console.log('\n── RÉPONSE BRUTE (analyse/stratégie/décompo) ──────────────');
  console.log(r.rawResponse);
  console.log('\n── META ───────────────────────────────────────────────────');
  console.log(JSON.stringify({
    repairs: r.repairs, toolRounds: r.toolRounds,
    grammarWarnings: r.grammarWarnings || [], overrides: r.overrides || []
  }, null, 2));
  console.log('\n── TRACE (signal d\'apprentissage) ─────────────────────────');
  console.log(JSON.stringify({
    gaps: r.trace?.gaps, rootGaps: r.trace?.rootGaps, brokenForms: r.trace?.brokenForms,
    gateAttempts: r.trace?.gateAttempts
  }, null, 2));
})().catch(e => { console.error('ERREUR:', e.message); process.exit(1); });
