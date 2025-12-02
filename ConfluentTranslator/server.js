require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const { Anthropic } = require('@anthropic-ai/sdk');
const OpenAI = require('openai');
const {
  loadAllLexiques,
  searchLexique,
  generateLexiqueSummary,
  buildReverseIndex
} = require('./lexiqueLoader');
const { analyzeContext } = require('./contextAnalyzer');
const { buildContextualPrompt, getBasePrompt, getPromptStats } = require('./promptBuilder');
const { buildReverseIndex: buildConfluentIndex } = require('./reverseIndexBuilder');
const { translateConfluentToFrench, translateConfluentDetailed } = require('./confluentToFrench');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// Load prompts
const protoPrompt = fs.readFileSync(path.join(__dirname, 'prompts', 'proto-system.txt'), 'utf-8');
const ancienPrompt = fs.readFileSync(path.join(__dirname, 'prompts', 'ancien-system.txt'), 'utf-8');

// Load lexiques dynamically from JSON files
const baseDir = path.join(__dirname, '..');
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

// Legacy lexique endpoint (for backward compatibility)
app.get('/lexique', (req, res) => {
  // Return ancien-confluent by default (legacy behavior)
  if (!lexiques.ancien) {
    return res.status(500).json({ error: 'Lexique not loaded' });
  }
  res.json(lexiques.ancien);
});

// New lexique endpoints
app.get('/api/lexique/:variant', (req, res) => {
  const { variant } = req.params;

  if (variant !== 'proto' && variant !== 'ancien') {
    return res.status(400).json({ error: 'Invalid variant. Use "proto" or "ancien"' });
  }

  if (!lexiques[variant]) {
    return res.status(500).json({ error: `Lexique ${variant} not loaded` });
  }

  res.json(lexiques[variant]);
});

// Stats endpoint
app.get('/api/stats', (req, res) => {
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

// Search endpoint
app.get('/api/search', (req, res) => {
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

// Reload endpoint (for development)
app.post('/api/reload', (req, res) => {
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

// Debug endpoint: Generate prompt without calling LLM
app.post('/api/debug/prompt', (req, res) => {
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

// Coverage analysis endpoint (analyze French text before translation)
app.post('/api/analyze/coverage', (req, res) => {
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
app.post('/translate', async (req, res) => {
  const { text, target, provider, model, temperature = 1.0, useLexique = true } = req.body;

  if (!text || !target || !provider || !model) {
    return res.status(400).json({ error: 'Missing parameters' });
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

    let translation;
    let rawResponse;

    if (provider === 'anthropic') {
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      const message = await anthropic.messages.create({
        model: model,
        max_tokens: 8192, // Max pour Claude Sonnet/Haiku 4.5
        temperature: temperature / 2, // Diviser par 2 pour Claude (max 1.0)
        system: systemPrompt,
        messages: [
          { role: 'user', content: text }
        ]
      });

      rawResponse = message.content[0].text;
      translation = rawResponse;

    } else if (provider === 'openai') {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const completion = await openai.chat.completions.create({
        model: model,
        max_tokens: 16384, // Max pour GPT-4o et GPT-4o-mini
        temperature: temperature,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ]
      });

      rawResponse = completion.choices[0].message.content;
      translation = rawResponse;
    } else {
      return res.status(400).json({ error: 'Unknown provider' });
    }

    // Parser la réponse pour extraire Layer 1 et Layer 3
    const parsed = parseTranslationResponse(rawResponse);

    // Construire la réponse avec les 3 layers
    const response = {
      // Layer 1: Traduction
      layer1: {
        translation: parsed.translation
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
      translation: parsed.translation
    };

    res.json(response);

  } catch (error) {
    console.error('Translation error:', error);
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

// Raw translation endpoint (for debugging - returns unprocessed LLM output)
app.post('/api/translate/raw', async (req, res) => {
  const { text, target, provider, model, useLexique = true } = req.body;

  if (!text || !target || !provider || !model) {
    return res.status(400).json({ error: 'Missing parameters' });
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

    let rawResponse;

    if (provider === 'anthropic') {
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      const message = await anthropic.messages.create({
        model: model,
        max_tokens: 8192, // Max pour Claude Sonnet/Haiku 4.5
        system: systemPrompt,
        messages: [
          { role: 'user', content: text }
        ]
      });

      rawResponse = message.content[0].text;

    } else if (provider === 'openai') {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const completion = await openai.chat.completions.create({
        model: model,
        max_tokens: 16384, // Max pour GPT-4o et GPT-4o-mini
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ]
      });

      rawResponse = completion.choices[0].message.content;
    } else {
      return res.status(400).json({ error: 'Unknown provider' });
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

// Batch translation endpoint
app.post('/api/translate/batch', async (req, res) => {
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

// Confluent → French translation endpoint (traduction brute)
app.post('/api/translate/conf2fr', (req, res) => {
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
app.post('/api/translate/conf2fr/llm', async (req, res) => {
  const { text, variant = 'ancien', provider = 'anthropic', model = 'claude-sonnet-4-20250514' } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Missing parameter: text' });
  }

  const variantKey = variant === 'proto' ? 'proto' : 'ancien';

  if (!confluentIndexes[variantKey]) {
    return res.status(500).json({ error: `Confluent index for ${variantKey} not loaded` });
  }

  try {
    // Step 1: Get raw word-by-word translation
    const rawTranslation = translateConfluentToFrench(text, confluentIndexes[variantKey]);

    // Step 2: Load refinement prompt
    const refinementPrompt = fs.readFileSync(path.join(__dirname, 'prompts', 'cf2fr-refinement.txt'), 'utf-8');

    // Step 3: Use LLM to refine translation
    let refinedText;

    if (provider === 'anthropic') {
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      const message = await anthropic.messages.create({
        model: model,
        max_tokens: 2048,
        system: refinementPrompt,
        messages: [
          {
            role: 'user',
            content: `Voici la traduction brute mot-à-mot du Confluent vers le français. Transforme-la en français fluide et naturel:\n\n${rawTranslation.translation}`
          }
        ]
      });

      refinedText = message.content[0].text.trim();
    } else if (provider === 'openai') {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const completion = await openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: refinementPrompt },
          { role: 'user', content: `Voici la traduction brute mot-à-mot du Confluent vers le français. Transforme-la en français fluide et naturel:\n\n${rawTranslation.translation}` }
        ]
      });

      refinedText = completion.choices[0].message.content.trim();
    } else {
      return res.status(400).json({ error: 'Unsupported provider. Use "anthropic" or "openai".' });
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
      provider,
      model
    });

  } catch (error) {
    console.error('Confluent→FR LLM refinement error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`ConfluentTranslator running on http://localhost:${PORT}`);
  console.log(`Loaded: ${lexiques.ancien?.meta?.total_entries || 0} ancien entries, ${lexiques.proto?.meta?.total_entries || 0} proto entries`);
});
