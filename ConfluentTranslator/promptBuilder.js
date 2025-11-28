/**
 * Prompt Builder - Génère des prompts contextuels optimisés
 *
 * Fonctionnalités:
 * 1. Templates de base (règles linguistiques sans lexique massif)
 * 2. Injection de vocabulaire ciblé
 * 3. Fallback racines
 * 4. Formatage optimisé pour le LLM
 */

const fs = require('fs');
const path = require('path');
const { preprocessNumbers } = require('./numberPreprocessor');

/**
 * Charge le template de prompt de base depuis les fichiers
 * @param {string} variant - 'proto' ou 'ancien'
 * @returns {string} - Template de prompt
 */
function loadBaseTemplate(variant) {
  const templatePath = path.join(__dirname, 'prompts', `${variant}-system.txt`);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  return fs.readFileSync(templatePath, 'utf-8');
}

/**
 * Génère la section vocabulaire pour le prompt
 * Format compact et structuré
 * @param {Array} entries - Entrées du lexique pertinentes
 * @returns {string} - Section vocabulaire formatée
 */
function formatVocabularySection(entries) {
  if (!entries || entries.length === 0) {
    return '';
  }

  const lines = ['\n# VOCABULAIRE PERTINENT POUR CETTE TRADUCTION\n'];

  // Grouper par type
  const byType = {
    racine_sacree: [],
    racine: [],
    verbe: [],
    nom: [],
    autre: []
  };

  entries.forEach(entry => {
    if (entry.traductions && entry.traductions.length > 0) {
      const trad = entry.traductions[0];
      const type = trad.type || 'autre';
      const key = type === 'racine_sacree' ? 'racine_sacree' :
                  type === 'racine' ? 'racine' :
                  type === 'verbe' ? 'verbe' :
                  type === 'nom' ? 'nom' : 'autre';

      byType[key].push({
        fr: entry.mot_francais,
        conf: trad.confluent,
        forme_liee: trad.forme_liee || trad.confluent,
        domaine: trad.domaine || '',
        note: trad.note || ''
      });
    }
  });

  // Formatter par type
  if (byType.racine_sacree.length > 0) {
    lines.push('## Racines sacrées (voyelle initiale)\n');
    byType.racine_sacree.forEach(item => {
      lines.push(`- ${item.conf} (${item.fr}) [forme liée: ${item.forme_liee}]`);
    });
    lines.push('');
  }

  if (byType.racine.length > 0) {
    lines.push('## Racines standards\n');
    byType.racine.forEach(item => {
      lines.push(`- ${item.conf} (${item.fr}) [forme liée: ${item.forme_liee}]`);
    });
    lines.push('');
  }

  if (byType.verbe.length > 0) {
    lines.push('## Verbes\n');
    byType.verbe.forEach(item => {
      lines.push(`- ${item.fr} → ${item.conf}`);
    });
    lines.push('');
  }

  if (byType.nom.length > 0) {
    lines.push('## Noms et concepts\n');
    byType.nom.forEach(item => {
      lines.push(`- ${item.fr} → ${item.conf}`);
    });
    lines.push('');
  }

  if (byType.autre.length > 0) {
    lines.push('## Autres\n');
    byType.autre.forEach(item => {
      lines.push(`- ${item.fr} → ${item.conf}`);
    });
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Génère la section de fallback avec toutes les racines
 * @param {Array} roots - Liste des racines
 * @returns {string} - Section racines formatée
 */
function formatRootsFallback(roots) {
  if (!roots || roots.length === 0) {
    return '';
  }

  const lines = ['\n# RACINES DISPONIBLES (à composer)\n'];
  lines.push('⚠️  Les mots demandés ne sont pas dans le lexique. Compose-les à partir des racines ci-dessous.\n');

  const sacrees = roots.filter(r => r.sacree);
  const standards = roots.filter(r => !r.sacree);

  if (sacrees.length > 0) {
    lines.push(`## Racines sacrées (${sacrees.length})\n`);
    sacrees.forEach(r => {
      lines.push(`- ${r.confluent} (${r.mot_francais}) [forme liée: ${r.forme_liee}] - ${r.domaine}`);
    });
    lines.push('');
  }

  if (standards.length > 0) {
    lines.push(`## Racines standards (${standards.length})\n`);
    standards.forEach(r => {
      lines.push(`- ${r.confluent} (${r.mot_francais}) [forme liée: ${r.forme_liee}] - ${r.domaine}`);
    });
    lines.push('');
  }

  lines.push('IMPORTANT: Utilise les liaisons sacrées pour composer les mots manquants.\n');

  return lines.join('\n');
}

/**
 * Construit un prompt contextuel complet
 * @param {Object} contextResult - Résultat de analyzeContext()
 * @param {string} variant - 'proto' ou 'ancien'
 * @returns {string} - Prompt complet optimisé
 */
function buildContextualPrompt(contextResult, variant = 'ancien', originalText = '') {
  // Charger le template de base
  const basePrompt = loadBaseTemplate(variant);

  // NOUVEAU: Preprocessing des nombres
  let numbersSection = '';
  if (originalText) {
    const numberInfo = preprocessNumbers(originalText);
    if (numberInfo.hasNumbers && numberInfo.promptSection) {
      numbersSection = numberInfo.promptSection;
    }
  }

  // Si fallback, injecter toutes les racines
  if (contextResult.useFallback) {
    const rootsSection = formatRootsFallback(contextResult.rootsFallback);
    return basePrompt + '\n' + numbersSection + '\n' + rootsSection;
  }

  // Sinon, injecter uniquement le vocabulaire pertinent
  const vocabularySection = formatVocabularySection(contextResult.entries);
  return basePrompt + '\n' + numbersSection + '\n' + vocabularySection;
}

/**
 * Construit le prompt de base sans aucun lexique (pour useLexique=false)
 * @param {string} variant - 'proto' ou 'ancien'
 * @returns {string} - Prompt de base uniquement
 */
function getBasePrompt(variant = 'ancien') {
  return loadBaseTemplate(variant);
}

/**
 * Estime le nombre de tokens dans un texte
 * Estimation simple : ~1 token pour 4 caractères
 * @param {string} text - Texte à estimer
 * @returns {number} - Nombre de tokens estimé
 */
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

/**
 * Génère des statistiques sur le prompt généré
 * @param {string} prompt - Prompt généré
 * @param {Object} contextResult - Résultat du contexte
 * @returns {Object} - Statistiques
 */
function getPromptStats(prompt, contextResult) {
  const promptTokens = estimateTokens(prompt);
  const fullLexiqueTokens = contextResult.metadata.tokensFullLexique;
  const saved = fullLexiqueTokens - promptTokens;
  const savingsPercent = Math.round((saved / fullLexiqueTokens) * 100);

  return {
    promptTokens,
    fullLexiqueTokens,
    tokensSaved: saved,
    savingsPercent,
    entriesUsed: contextResult.metadata.entriesUsed,
    useFallback: contextResult.useFallback,
    wordsFound: contextResult.metadata.wordsFound.length,
    wordsNotFound: contextResult.metadata.wordsNotFound.length
  };
}

module.exports = {
  loadBaseTemplate,
  formatVocabularySection,
  formatRootsFallback,
  buildContextualPrompt,
  getBasePrompt,
  estimateTokens,
  getPromptStats
};
