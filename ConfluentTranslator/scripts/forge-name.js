/**
 * forge-name — atelier CLI : forge un NOM PROPRE Confluent via le vrai sous-agent (réel, pas le stub).
 *
 * QUOI : `node scripts/forge-name.js "<nom FR>" "<sens>" [variant] [modèle]` → forge (ou retrouve) la
 *        forme Confluent du nom, l'imprime avec décompo. Persiste dans le registre (provisoire) sauf si
 *        FORGED_NAMES_PATH pointe sur un fichier temp (pour les essais sans polluer data/noms-forges.json).
 * POURQUOI : prouver le forgeur EN VRAI (sous-agent LLM) et offrir un outil de forge/revue d'atelier.
 * COMMENT : reconstruit le même ctx que le tool/endpoint (lexique + index + ère + client LLM).
 */
'use strict';
require('dotenv').config();
const path = require('path');
const { Anthropic } = require('@anthropic-ai/sdk');
const { loadAllLexiques } = require('../src/utils/lexiqueLoader');
const { buildReverseIndex: buildConfluentIndex } = require('../src/core/morphology/reverseIndexBuilder');
const { getEra } = require('../src/core/eras/eras');
const { forgeProperName } = require('../src/core/translation/nameForge');

const NOM = process.argv[2] || 'Œil-Bas';
const SENS = process.argv[3] || 'celui qui ne lève jamais le regard';
const VARIANT = process.argv[4] || 'mythologique';
const MODEL = process.argv[5] || 'claude-sonnet-4-6';   // modèle de FORGE (défaut = Sonnet, comme en prod)

(async () => {
  const lexique = loadAllLexiques(path.join(__dirname, '..', '..'))[VARIANT];
  const ctx = {
    lexique,
    morphReverseIndex: buildConfluentIndex(lexique),
    era: getEra(VARIANT),
    anthropic: new Anthropic({ apiKey: process.env.ETHERYALE_API_KEY, baseURL: process.env.ETHERYALE_BASE_URL || 'https://ai.etheryale.com' }),
    model: MODEL
  };
  console.log(`FORGE « ${NOM} » (sens: ${SENS}) — ${VARIANT} / ${MODEL}`);
  const r = await forgeProperName({ nom_fr: NOM, sens: SENS }, ctx);
  console.log(JSON.stringify(r, null, 2));
})().catch(e => { console.error('ERREUR:', e.message); process.exit(1); });
