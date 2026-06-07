require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const { Anthropic } = require('@anthropic-ai/sdk');
const {
  loadAllLexiques,
  searchLexique,
  generateLexiqueSummary,
  buildReverseIndex
} = require('../utils/lexiqueLoader');
const { analyzeContext } = require('../core/translation/contextAnalyzer');
const { buildContextualPrompt, getBasePrompt, getPromptStats } = require('../core/translation/promptBuilder');
const { buildReverseIndex: buildConfluentIndex } = require('../core/morphology/reverseIndexBuilder');
const { translateConfluentToFrench, translateConfluentDetailed } = require('../core/translation/confluentToFrench');
const { translateWithAgent } = require('../core/translation/translationAgent');
const { buildGuide } = require('../core/guide/guideBuilder');
const { getEra } = require('../core/eras/eras');
// Écriture (Glyphes du Gouffre) : conversion texte→glyphes (échec franc précis) + rendu collier.
const { convert: convertToGlyphes } = require('../../scripts/confluent2glyphes');
const { renderCollier } = require('../core/ecriture/glyphRenderer');
const { renderMarkdownBook } = require('../core/ecriture/bookMarkdown');

// Security modules
const { authenticate, requireAdmin, createToken, listTokens, disableToken, enableToken, deleteToken, getGlobalStats, trackLLMUsage, checkLLMLimit } = require('../utils/auth');
const { adminLimiter } = require('../utils/rateLimiter');
const { requestLogger, getLogs, getLogStats } = require('../utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// QUOI : client LLM unique, pointé sur le proxy Etheryale (un seul provider désormais).
// POURQUOI : tout passe par le proxy (cache auto, OAuth Claude Max+, pas de limite de tokens) ;
//        OpenAI/ChatGPT et les clés API custom ont été retirés (décision : proxy Etheryale only).
// COMMENT : baseURL = proxy, clé eai_ via ETHERYALE_API_KEY. Modèle par défaut = Haiku 4.5 —
//        coût minimal, car c'est l'agent outillé + le gate phonotactique qui portent la qualité
//        (prouvé : 5/5 traductions valides sur Haiku là où la simple-request produisait du cassé).
const anthropicClient = new Anthropic({
  apiKey: process.env.ETHERYALE_API_KEY,
  baseURL: process.env.ETHERYALE_BASE_URL || 'https://ai.etheryale.com'
});
const DEFAULT_MODEL = process.env.CONFLUENT_MODEL || 'claude-haiku-4-5-20251001';

// Middlewares
app.use(express.json());
app.use(requestLogger);      // Log toutes les requêtes
// Rate limiting: on utilise uniquement checkLLMLimit() par API key, pas de rate limit global par IP

// Route protégée pour admin.html (AVANT express.static)
// Vérifie l'auth seulement si API key présente, sinon laisse passer (le JS client vérifiera)
app.get('/admin.html', (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;

  // Si pas d'API key, c'est une requête browser normale -> laisser passer
  if (!apiKey) {
    return res.sendFile(path.join(__dirname, '..', '..', 'public', 'admin.html'));
  }

  // Si API key présente, vérifier qu'elle est admin
  authenticate(req, res, (authErr) => {
    if (authErr) return next(authErr);
    requireAdmin(req, res, (adminErr) => {
      if (adminErr) return next(adminErr);
      res.sendFile(path.join(__dirname, '..', '..', 'public', 'admin.html'));
    });
  });
});

app.use(express.static(path.join(__dirname, '..', '..', 'public')));

// Load prompts
const protoPrompt = fs.readFileSync(path.join(__dirname, '..', '..', 'prompts', 'proto-system.txt'), 'utf-8');
const ancienPrompt = fs.readFileSync(path.join(__dirname, '..', '..', 'prompts', 'ancien-system.txt'), 'utf-8');

// Load lexiques dynamically from JSON files
const baseDir = path.join(__dirname, '..', '..', '..');
let lexiques = { proto: null, ancien: null };
let reverseIndexes = { proto: null, ancien: null };
let confluentIndexes = { proto: null, ancien: null };

function reloadLexiques() {
  console.log('Loading lexiques...');
  lexiques = loadAllLexiques(baseDir);
  reverseIndexes = {
    proto: buildReverseIndex(lexiques.proto),
    ancien: buildReverseIndex(lexiques.ancien)
  };
  confluentIndexes = {
    proto: buildConfluentIndex(lexiques.proto),
    ancien: buildConfluentIndex(lexiques.ancien)
  };
  console.log('Lexiques loaded successfully');
  console.log(`Confluent→FR index: ${Object.keys(confluentIndexes.ancien || {}).length} entries`);
}

// Initial load
reloadLexiques();

// Health check endpoint (public - for login validation)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Guide de la langue — GÉNÉRÉ depuis le lexique + data/lexique.json (jamais désync). - SECURED
app.get('/api/guide', authenticate, (req, res) => {
  try {
    res.json(buildGuide(lexiques.ancien));
  } catch (e) {
    console.error('Guide build error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Auth validation endpoint (tests API key without exposing data)
app.get('/api/validate', authenticate, (req, res) => {
  res.json({
    valid: true,
    user: req.user?.name || 'anonymous',
    role: req.user?.role || 'user'
  });
});

// LLM limit check endpoint - Always returns 200 with info
app.get('/api/llm/limit', authenticate, (req, res) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  const limitCheck = checkLLMLimit(apiKey);

  console.log('[/api/llm/limit] Check result:', limitCheck); // Debug

  // TOUJOURS retourner 200 avec les données
  // Cet endpoint ne bloque jamais, il informe seulement
  res.status(200).json(limitCheck);
});

// Legacy lexique endpoint (for backward compatibility) - SECURED
app.get('/lexique', authenticate, (req, res) => {
  // Return ancien-confluent by default (legacy behavior)
  if (!lexiques.ancien) {
    return res.status(500).json({ error: 'Lexique not loaded' });
  }
  res.json(lexiques.ancien);
});

// New lexique endpoints - SECURED
app.get('/api/lexique/:variant', authenticate, (req, res) => {
  const { variant } = req.params;

  if (variant !== 'proto' && variant !== 'ancien') {
    return res.status(400).json({ error: 'Invalid variant. Use "proto" or "ancien"' });
  }

  if (!lexiques[variant]) {
    return res.status(500).json({ error: `Lexique ${variant} not loaded` });
  }

  res.json(lexiques[variant]);
});

// Stats endpoint - SECURED
app.get('/api/stats', authenticate, (req, res) => {
  const { variant = 'ancien' } = req.query;

  if (variant !== 'proto' && variant !== 'ancien') {
    return res.status(400).json({ error: 'Invalid variant. Use "proto" or "ancien"' });
  }

  if (!lexiques[variant]) {
    return res.status(500).json({ error: `Lexique ${variant} not loaded` });
  }

  const lexique = lexiques[variant];
  const stats = {
    motsCF: 0,           // Mots Confluent uniques
    motsFR: 0,           // Mots français uniques
    totalTraductions: 0, // Total de traductions
    racines: 0,          // Racines (racine, racine_sacree)
    racinesSacrees: 0,   // Racines sacrées
    racinesStandards: 0, // Racines standards
    compositions: 0,     // Compositions
    verbes: 0,           // Verbes
    verbesIrreguliers: 0, // Verbes irréguliers
    particules: 0,       // Particules grammaticales (negation, particule, interrogation, demonstratif)
    nomsPropes: 0,       // Noms propres
    marqueurs: 0,        // Marqueurs (temps, aspect, nombre)
    pronoms: 0,          // Pronoms (pronom, possessif, relatif, determinant)
    autres: 0            // Autres types (auxiliaire, quantificateur, etc.)
  };

  const motsCFSet = new Set();
  const motsFRSet = new Set();

  // Le lexique peut avoir une structure {dictionnaire: {...}} ou être directement un objet
  const dict = lexique.dictionnaire || lexique;

  // Parcourir le dictionnaire
  Object.keys(dict).forEach(motFR => {
    const entry = dict[motFR];
    motsFRSet.add(motFR);

    if (entry.traductions) {
      entry.traductions.forEach(trad => {
        stats.totalTraductions++;

        // Compter les mots CF uniques
        if (trad.confluent) {
          motsCFSet.add(trad.confluent);
        }

        // Compter par type
        const type = trad.type || '';
        if (type === 'racine') {
          stats.racines++;
          stats.racinesStandards++;
        } else if (type === 'racine_sacree') {
          stats.racines++;
          stats.racinesSacrees++;
        } else if (type === 'composition' || type === 'racine_sacree_composee') {
          stats.compositions++;
        } else if (type === 'verbe') {
          stats.verbes++;
        } else if (type === 'verbe_irregulier') {
          stats.verbes++;
          stats.verbesIrreguliers++;
        } else if (type === 'negation' || type === 'particule' || type === 'interrogation' || type === 'demonstratif') {
          stats.particules++;
        } else if (type === 'nom_propre') {
          stats.nomsPropes++;
        } else if (type === 'marqueur_temps' || type === 'marqueur_aspect' || type === 'marqueur_nombre') {
          stats.marqueurs++;
        } else if (type === 'pronom' || type === 'possessif' || type === 'relatif' || type === 'determinant') {
          stats.pronoms++;
        } else if (type !== '') {
          stats.autres++;
        }
      });
    }
  });

  stats.motsCF = motsCFSet.size;
  stats.motsFR = motsFRSet.size;

  res.json(stats);
});

// Search endpoint - SECURED
app.get('/api/search', authenticate, (req, res) => {
  const { q, variant = 'ancien', direction = 'fr2conf' } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Missing query parameter "q"' });
  }

  if (variant !== 'proto' && variant !== 'ancien') {
    return res.status(400).json({ error: 'Invalid variant. Use "proto" or "ancien"' });
  }

  const results = searchLexique(lexiques[variant], q, direction);
  res.json({ query: q, variant, direction, results });
});

// Reload endpoint (for development) - SECURED (admin only)
app.post('/api/reload', authenticate, requireAdmin, (req, res) => {
  try {
    reloadLexiques();
    res.json({
      success: true,
      message: 'Lexiques reloaded',
      stats: {
        proto: lexiques.proto?.meta?.total_entries || 0,
        ancien: lexiques.ancien?.meta?.total_entries || 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Build enhanced prompt with lexique data
function buildEnhancedPrompt(basePrompt, variant) {
  const lexique = lexiques[variant];
  if (!lexique) return basePrompt;

  const summary = generateLexiqueSummary(lexique, 300);

  return `${basePrompt}

# LEXIQUE COMPLET (${lexique.meta.total_entries} entrées)
${summary}
`;
}

// Debug endpoint: Generate prompt without calling LLM - SECURED
app.post('/api/debug/prompt', authenticate, (req, res) => {
  const { text, target = 'ancien', useLexique = true } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Missing parameter: text' });
  }

  const variant = target === 'proto' ? 'proto' : 'ancien';

  try {
    let systemPrompt;
    let contextMetadata = null;

    // MÊME CODE QUE /translate
    if (useLexique) {
      const contextResult = analyzeContext(text, lexiques[variant]);
      systemPrompt = buildContextualPrompt(contextResult, variant, text);

      const promptStats = getPromptStats(systemPrompt, contextResult);
      contextMetadata = {
        wordsFound: contextResult.metadata.wordsFound,
        wordsNotFound: contextResult.metadata.wordsNotFound,
        entriesUsed: contextResult.metadata.entriesUsed,
        totalLexiqueSize: contextResult.metadata.totalLexiqueSize,
        tokensFullLexique: promptStats.fullLexiqueTokens,
        tokensUsed: promptStats.promptTokens,
        tokensSaved: promptStats.tokensSaved,
        savingsPercent: promptStats.savingsPercent,
        useFallback: contextResult.useFallback,
        expansionLevel: contextResult.metadata.expansionLevel
      };
    } else {
      systemPrompt = getBasePrompt(variant);
    }

    res.json({
      prompt: systemPrompt,
      metadata: contextMetadata,
      stats: {
        promptLength: systemPrompt.length,
        promptLines: systemPrompt.split('\n').length
      }
    });

  } catch (error) {
    console.error('Prompt generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Coverage analysis endpoint (analyze French text before translation) - SECURED
app.post('/api/analyze/coverage', authenticate, (req, res) => {
  const { text, target = 'ancien' } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Missing parameter: text' });
  }

  const variant = target === 'proto' ? 'proto' : 'ancien';

  try {
    // Use the same contextAnalyzer as the translation pipeline
    const contextResult = analyzeContext(text, lexiques[variant]);
    const metadata = contextResult.metadata;

    // Calculate recommendation
    const needsFullRoots = metadata.coveragePercent < 90;
    let recommendation;
    if (metadata.coveragePercent >= 95) {
      recommendation = 'Excellent coverage - context only';
    } else if (metadata.coveragePercent >= 90) {
      recommendation = 'Good coverage - context only';
    } else if (metadata.coveragePercent >= 70) {
      recommendation = 'Moderate coverage - consider adding roots';
    } else if (metadata.coveragePercent >= 50) {
      recommendation = 'Low coverage - full roots recommended';
    } else {
      recommendation = 'Very low coverage - full roots required';
    }

    res.json({
      coverage: metadata.coveragePercent,
      found: metadata.wordsFound.map(w => ({
        word: w.input,
        confluent: w.confluent,
        type: w.type,
        score: w.score
      })),
      missing: metadata.wordsNotFound.map(word => ({
        word,
        suggestions: [] // TODO: add suggestions based on similar words
      })),
      stats: {
        totalWords: metadata.wordCount,
        uniqueWords: metadata.uniqueWordCount,
        foundCount: metadata.wordsFound.length,
        missingCount: metadata.wordsNotFound.length,
        entriesUsed: metadata.entriesUsed,
        useFallback: metadata.useFallback
      },
      needsFullRoots,
      recommendation,
      variant
    });

  } catch (error) {
    console.error('Coverage analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Translation endpoint (NOUVEAU SYSTÈME CONTEXTUEL)
app.post('/translate', authenticate, async (req, res) => {
  const { text, target, model, useLexique = true } = req.body;

  if (!text || !target) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  // Rate limit par API key (plus de clés custom : tout passe par le proxy partagé).
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  const limitCheck = checkLLMLimit(apiKey);
  if (!limitCheck.allowed) {
    return res.status(429).json({
      error: limitCheck.error,
      limit: limitCheck.limit,
      used: limitCheck.used
    });
  }

  const variant = target === 'proto' ? 'proto' : 'ancien';

  try {
    let systemPrompt;
    let contextMetadata = null;

    // NOUVEAU: Analyse contextuelle et génération de prompt optimisé
    if (useLexique) {
      const contextResult = analyzeContext(text, lexiques[variant]);
      systemPrompt = buildContextualPrompt(contextResult, variant, text);

      // Générer métadonnées pour Layer 2
      const promptStats = getPromptStats(systemPrompt, contextResult);
      contextMetadata = {
        wordsFound: contextResult.metadata.wordsFound,
        wordsNotFound: contextResult.metadata.wordsNotFound,
        entriesUsed: contextResult.metadata.entriesUsed,
        totalLexiqueSize: contextResult.metadata.totalLexiqueSize,
        tokensFullLexique: promptStats.fullLexiqueTokens,
        tokensUsed: promptStats.promptTokens,
        tokensSaved: promptStats.tokensSaved,
        savingsPercent: promptStats.savingsPercent,
        useFallback: contextResult.useFallback,
        expansionLevel: contextResult.metadata.expansionLevel,
        rootsUsed: contextResult.rootsFallback?.length || 0  // Nombre de racines envoyées
      };
    } else {
      systemPrompt = getBasePrompt(variant);
    }

    let rawResponse;
    // QUOI : traduction faisant AUTORITÉ = celle validée par le gate de l'agent.
    // POURQUOI : re-parser rawResponse côté serveur peut diverger de l'extraction gatée de
    //        l'agent (ex: blocs ``` parasites) et servir une forme que le gate n'a pas vue.
    //        On sert donc la traduction gatée ; parseTranslationResponse ne sert que pour les
    //        sections explicatives (layer3). En mode mock, on retombe sur le parsing.
    let gatedTranslation = null;

    // Mode mock LLM pour tests E2E (flag env LLM_MOCK=1).
    // POURQUOI : l'appel LLM se fait côté serveur (non-déterministe, payant, lent) donc
    // non mockable depuis le navigateur ; ce flag rend le flux de traduction E2E-testable
    // sans réseau (doctrine : pas de dépendance non-mockable qui bloque le harness).
    // COMMENT : court-circuite l'agent et fournit une réponse au format COT attendu par
    // parseTranslationResponse — le parsing serveur s'exécute donc réellement (on le couvre).
    // GARDE : neutralisé si NODE_ENV=production (jamais de traduction mockée servie en prod).
    if (process.env.LLM_MOCK === '1' && process.env.NODE_ENV !== 'production') {
      rawResponse = [
        'ANALYSE:', '(mock) Requête de test E2E.',
        'STRATÉGIE:', '(mock) Réponse déterministe, sans appel LLM.',
        'Ancien Confluent:', 'va siliaska mirak u',
        'Décomposition:', 'siliaska (regard libre) + mirak (voir) + u (présent)',
        'Notes:', 'Réponse générée par LLM_MOCK pour le test E2E.'
      ].join('\n');
    } else {
      // Traduction via l'AGENT outillé : le modèle peut consulter le lexique (lookup_concept),
      // la grammaire (get_grammar), valider/vérifier des formes (validate_form, verify_word) et
      // composer (check_composition). Le gate phonotactique final REFUSE toute forme cassée et
      // déclenche une réparation ; échec franc si irréparable (jamais de Confluent invalide servi).
      const ctx = {
        lexique: lexiques[variant],
        morphReverseIndex: confluentIndexes[variant],
        era: getEra(variant)   // alphabet + grammaire de l'ère → gate + outils paramétrés
      };
      const agentResult = await translateWithAgent({
        text,
        systemPrompt,
        anthropic: anthropicClient,
        model: model || DEFAULT_MODEL,
        ctx
      });
      rawResponse = agentResult.rawResponse;
      gatedTranslation = agentResult.translation; // déjà validée phonotactiquement

      // Suivi de consommation par API key (tokens agrégés sur tous les tours de l'agent).
      if (apiKey && agentResult.usage) {
        trackLLMUsage(apiKey, agentResult.usage.input_tokens, agentResult.usage.output_tokens);
      }
    }

    // Parser la réponse pour les sections explicatives (layer3).
    const parsed = parseTranslationResponse(rawResponse);
    // Traduction servie = celle gatée par l'agent (autorité) ; fallback au parsing en mode mock.
    const finalTranslation = gatedTranslation || parsed.translation;

    // Construire la réponse avec les 3 layers
    const response = {
      // Layer 1: Traduction (validée phonotactiquement par le gate de l'agent)
      layer1: {
        translation: finalTranslation
      },

      // Layer 2: Contexte (COT hors LLM)
      layer2: contextMetadata,

      // Layer 3: Explications LLM (avec COT)
      layer3: {
        analyse: parsed.analyse,
        strategie: parsed.strategie,
        decomposition: parsed.decomposition,
        notes: parsed.notes,
        wordsCreated: parsed.wordsCreated || []
      },

      // Compatibilité avec ancien format
      translation: finalTranslation
    };

    res.json(response);

  } catch (error) {
    console.error('Translation error:', error);
    // Échec franc de validation : on ne sert JAMAIS de Confluent cassé (doctrine anti-fallback).
    if (error.code === 'TRANSLATION_UNVALIDATED' || error.code === 'AGENT_LOOP_EXHAUSTED') {
      return res.status(422).json({ error: error.message, invalides: error.invalides || [] });
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * Parse la réponse du LLM pour extraire les différentes sections (avec COT)
 * @param {string} response - Réponse brute du LLM
 * @returns {Object} - Sections parsées
 */
function parseTranslationResponse(response) {
  const lines = response.split('\n');

  let analyse = '';
  let strategie = '';
  let translation = '';
  let decomposition = '';
  let notes = '';
  let currentSection = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Détecter les sections (nouveau format COT)
    if (trimmed.match(/^ANALYSE:/i)) {
      currentSection = 'analyse';
      continue;
    }
    if (trimmed.match(/^STRAT[ÉE]GIE:/i)) {
      currentSection = 'strategie';
      continue;
    }
    if (trimmed.match(/^(Ancien )?Confluent:/i)) {
      currentSection = 'translation';
      continue;
    }
    if (trimmed.match(/^D[ée]composition:/i)) {
      currentSection = 'decomposition';
      continue;
    }
    if (trimmed.match(/^Notes?:/i) || trimmed.match(/^Explication:/i)) {
      currentSection = 'notes';
      continue;
    }

    // Ajouter le contenu à la section appropriée
    if (currentSection === 'analyse' && trimmed && !trimmed.match(/^---/)) {
      analyse += line + '\n';
    } else if (currentSection === 'strategie' && trimmed && !trimmed.match(/^---/)) {
      strategie += line + '\n';
    } else if (currentSection === 'translation' && trimmed && !trimmed.match(/^---/)) {
      translation += line + '\n';
    } else if (currentSection === 'decomposition' && trimmed) {
      decomposition += line + '\n';
    } else if (currentSection === 'notes' && trimmed) {
      notes += line + '\n';
    } else if (!currentSection && trimmed && !trimmed.match(/^---/) && !trimmed.match(/^\*\*/)) {
      // Si pas de section détectée, c'est probablement la traduction
      translation += line + '\n';
    }
  }

  return {
    analyse: analyse.trim(),
    strategie: strategie.trim(),
    translation: translation.trim() || response.trim(),
    decomposition: decomposition.trim(),
    notes: notes.trim()
  };
}

// Raw translation endpoint (for debugging - returns unprocessed LLM output) - SECURED
app.post('/api/translate/raw', authenticate, async (req, res) => {
  const { text, target, model, useLexique = true } = req.body;

  if (!text || !target) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  // Rate limit par API key (plus de clés custom : proxy partagé).
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  const limitCheck = checkLLMLimit(apiKey);
  if (!limitCheck.allowed) {
    return res.status(429).json({
      error: limitCheck.error,
      limit: limitCheck.limit,
      used: limitCheck.used
    });
  }

  const variant = target === 'proto' ? 'proto' : 'ancien';

  try {
    let systemPrompt;
    let contextMetadata = null;

    if (useLexique) {
      const contextResult = analyzeContext(text, lexiques[variant]);
      systemPrompt = buildContextualPrompt(contextResult, variant, text);

      const promptStats = getPromptStats(systemPrompt, contextResult);
      contextMetadata = {
        wordsFound: contextResult.metadata.wordsFound,
        wordsNotFound: contextResult.metadata.wordsNotFound,
        entriesUsed: contextResult.metadata.entriesUsed,
        totalLexiqueSize: contextResult.metadata.totalLexiqueSize,
        tokensFullLexique: promptStats.fullLexiqueTokens,
        tokensUsed: promptStats.promptTokens,
        tokensSaved: promptStats.tokensSaved,
        savingsPercent: promptStats.savingsPercent,
        useFallback: contextResult.useFallback,
        expansionLevel: contextResult.metadata.expansionLevel
      };
    } else {
      systemPrompt = getBasePrompt(variant);
    }

    // Appel brut (debug) via le proxy : un seul tour, pas d'outils ni de gate (sortie inspectée telle quelle).
    const message = await anthropicClient.messages.create({
      model: model || DEFAULT_MODEL,
      max_tokens: 8192,
      system: systemPrompt,
      messages: [
        { role: 'user', content: text }
      ]
    });

    const rawResponse = message.content[0].text;

    if (apiKey && message.usage) {
      trackLLMUsage(apiKey, message.usage.input_tokens, message.usage.output_tokens);
    }

    // Retourner la réponse BRUTE sans parsing
    res.json({
      raw_output: rawResponse,
      metadata: contextMetadata,
      length: rawResponse.length,
      lines: rawResponse.split('\n').length
    });

  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Batch translation endpoint - SECURED
app.post('/api/translate/batch', authenticate, async (req, res) => {
  const { words, target = 'ancien' } = req.body;

  if (!words || !Array.isArray(words)) {
    return res.status(400).json({ error: 'Missing or invalid "words" array' });
  }

  const variant = target === 'proto' ? 'proto' : 'ancien';
  const results = {};

  for (const word of words) {
    const found = searchLexique(lexiques[variant], word, 'fr2conf');
    if (found.length > 0 && found[0].traductions?.length > 0) {
      results[word] = {
        found: true,
        traduction: found[0].traductions[0].confluent,
        all_traductions: found[0].traductions
      };
    } else {
      results[word] = { found: false };
    }
  }

  res.json({ target, results });
});

// Confluent → French translation endpoint (traduction brute) - SECURED
app.post('/api/translate/conf2fr', authenticate, (req, res) => {
  const { text, variant = 'ancien', detailed = false } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Missing parameter: text' });
  }

  const variantKey = variant === 'proto' ? 'proto' : 'ancien';

  if (!confluentIndexes[variantKey]) {
    return res.status(500).json({ error: `Confluent index for ${variantKey} not loaded` });
  }

  try {
    if (detailed) {
      const result = translateConfluentDetailed(text, confluentIndexes[variantKey]);
      res.json(result);
    } else {
      const result = translateConfluentToFrench(text, confluentIndexes[variantKey]);
      res.json(result);
    }
  } catch (error) {
    console.error('Confluent→FR translation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// NEW: Confluent → French with LLM refinement
app.post('/api/translate/conf2fr/llm', authenticate, async (req, res) => {
  const { text, variant = 'ancien', model } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Missing parameter: text' });
  }

  // Rate limit par API key (proxy partagé, plus de clés custom).
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  const limitCheck = checkLLMLimit(apiKey);
  if (!limitCheck.allowed) {
    return res.status(429).json({
      error: limitCheck.error,
      limit: limitCheck.limit,
      used: limitCheck.used
    });
  }

  const variantKey = variant === 'proto' ? 'proto' : 'ancien';

  if (!confluentIndexes[variantKey]) {
    return res.status(500).json({ error: `Confluent index for ${variantKey} not loaded` });
  }

  try {
    // Step 1: Get raw word-by-word translation
    const rawTranslation = translateConfluentToFrench(text, confluentIndexes[variantKey]);

    // Step 2: Load refinement prompt
    const refinementPrompt = fs.readFileSync(path.join(__dirname, '..', '..', 'prompts', 'cf2fr-refinement.txt'), 'utf-8');

    // Step 3: raffinement via le proxy (CF→FR : pas de gate phonotactique, la sortie est du français).
    const message = await anthropicClient.messages.create({
      model: model || DEFAULT_MODEL,
      max_tokens: 2048,
      system: refinementPrompt,
      messages: [
        {
          role: 'user',
          content: `Voici la traduction brute mot-à-mot du Confluent vers le français. Transforme-la en français fluide et naturel:\n\n${rawTranslation.translation}`
        }
      ]
    });

    const refinedText = message.content[0].text.trim();

    if (apiKey && message.usage) {
      trackLLMUsage(apiKey, message.usage.input_tokens, message.usage.output_tokens);
    }

    // Return both raw and refined versions with detailed token info
    res.json({
      confluentText: text,
      rawTranslation: rawTranslation.translation,
      refinedTranslation: refinedText,
      translation: refinedText, // For compatibility
      tokens: rawTranslation.tokens || [],
      coverage: rawTranslation.coverage || 0,
      wordsTranslated: rawTranslation.wordsTranslated,
      wordsNotTranslated: rawTranslation.wordsNotTranslated,
      model: model || DEFAULT_MODEL
    });

  } catch (error) {
    console.error('Confluent→FR LLM refinement error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ÉCRITURE : Confluent (romanisé) → COLLIER de glyphes (Glyphes du Gouffre)
// ============================================================================
// QUOI : convertit un texte confluent en glyphes « argile » rendus (SVG collier), ou échoue
//        FRANC en pointant la pièce sans glyphe (ligne/colonne/mot). Aucun appel LLM (déterministe, gratuit).
// POURQUOI : rendre l'écriture utilisable end-to-end depuis l'UI, sans jamais « deviner » un
//        glyphe manquant (doctrine no-fallback) — on signale précisément le caractère fautif.
// COMMENT : convertToGlyphes() résout chaque mot (registre → composition morpho → verbe+conjugateur) ;
//        renderCollier() enfile les glyphes. Chaque caractère est redessiné à neuf (seed random par instance).
app.post('/api/ecriture', authenticate, (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Missing parameter: text' });
  }

  try {
    const result = convertToGlyphes(text);
    // Échec franc : une pièce du texte n'a pas de glyphe → 422 + localisation exacte (jamais de rendu partiel deviné).
    if (result.erreur) {
      return res.status(422).json({ error: result.erreur.raison, erreur: result.erreur });
    }
    // Succès : collier HTML/SVG prêt à injecter + la décomposition mot→glyphes (pour debug/affichage).
    res.json({ ok: true, html: renderCollier(result.glyphes), words: result.glyphes });
  } catch (error) {
    console.error('Écriture error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /livre?text=...&theme=clay&title=... → PAGE-LIVRE HTML rendue directement (Confluent romanisé).
// QUOI : une URL qui « fait le taff » — ouvrir l'adresse rend le livre paginé ; re-seedé à CHAQUE
//        requête (chaque caractère redessiné à neuf), sans JS ni reload en boucle.
// POURQUOI : usage le plus simple (partage d'URL, Ctrl+P → PDF). Public + déterministe (aucun LLM, aucun secret).
// COMMENT : convert() → renderBook(theme). thème en param (alias clay/dark/light) ; erreur = page HTML qui pointe la pièce.
app.get('/livre', (req, res) => {
  const { text, title } = req.query;
  if (!text) {
    return res.type('html').status(400).send('<body style="background:#15110c;color:#c9a86a;font-family:system-ui;padding:40px">Paramètre <b>text</b> requis — ex : <code>/livre?text=va naki vo ura mirak u&amp;theme=clay</code></body>');
  }
  // Normalisation du thème (registre modulaire côté bookRenderer) + alias conviviaux.
  const alias = { clay: 'tablette', dark: 'parchemin', light: 'clair' };
  const raw = String(req.query.theme || req.query.style || 'tablette');
  const theme = alias[raw] || raw;
  try {
    // Markdown → livre paginé (titres/paragraphes/listes/citations/filets/emphase). title = caption lisible.
    const result = renderMarkdownBook(String(text), { theme, title: title ? String(title) : '' });
    if (result.erreur) {
      const e = result.erreur; // Échec franc : mot sans glyphe (on ne dessine rien de deviné).
      return res.type('html').status(422).send(`<body style="background:#15110c;color:#f0a0a0;font-family:system-ui;padding:40px">✗ Impossible de dessiner — mot « <b>${e.mot}</b> » (pièce « ${e.piece} ») : ${e.raison}</body>`);
    }
    res.type('html').send(result.html);
  } catch (error) {
    console.error('Livre error:', error);
    res.type('html').status(500).send('<body style="background:#15110c;color:#f0a0a0;font-family:system-ui;padding:40px">Erreur : ' + error.message + '</body>');
  }
});

// Admin routes
const adminRoutes = require('./adminRoutes');
app.use('/api/admin', authenticate, adminRoutes);

app.listen(PORT, () => {
  console.log(`ConfluentTranslator running on http://localhost:${PORT}`);
  console.log(`Loaded: ${lexiques.ancien?.meta?.total_entries || 0} ancien entries, ${lexiques.proto?.meta?.total_entries || 0} proto entries`);
});
