/**
 * Translation Agent - Boucle agentique de traduction Confluent
 *
 * QUOI : orchestre une traduction française → Confluent via un LLM OUTILLÉ (tool-use Anthropic)
 *        avec un GATE déterministe sur la sortie : aucune forme phonotactiquement invalide ne
 *        peut être servie. Remplace la "simple request" one-shot qui produisait du Confluent
 *        cassé (`tbime`, `lnosu`…) sans aucun garde-fou.
 *
 * POURQUOI : la doctrine impose des outputs VÉRIFIABLES, pas des affirmations. Un prompt qui
 *        dit "vérifie-toi" est une affirmation ; une boucle où (1) le modèle peut consulter le
 *        lexique/la grammaire via des outils et (2) le serveur REFUSE toute sortie invalide et
 *        renvoie l'erreur pour réparation, est une garantie. Échec franc si irréparable.
 *
 * COMMENT : boucle messages Anthropic. Tant que le modèle appelle des outils → on les exécute
 *        et on renvoie les résultats. Quand il rend sa réponse finale → on extrait la ligne de
 *        traduction et on la passe au gate phonotactique. Invalide → message de réparation ciblé
 *        et on reboucle (cap maxRepairs). Le system prompt porte cache_control:ephemeral pour
 *        bénéficier du prompt-caching du proxy (réutilisé à chaque tour ⇒ quasi gratuit).
 */

'use strict';

const { TOOL_DEFINITIONS, executeTool } = require('./translationTools');
const { validateTranslation } = require('../validation/phonotactics');

/**
 * Extrait la ligne de traduction Confluent de la réponse formatée du modèle.
 *
 * QUOI : isole le contenu sous l'en-tête "Ancien Confluent:" / "Confluent:" jusqu'à la
 *        section "Décomposition" (ou la fin).
 * POURQUOI : le gate doit valider la traduction RÉELLE, pas le texte d'analyse (qui contient
 *        du français, des noms de formes invalides citées en contre-exemple, etc.).
 * COMMENT : balayage ligne à ligne avec une machine à états minimale.
 *
 * @param {string} raw - réponse brute du modèle
 * @returns {string} - la/les ligne(s) de traduction (peut contenir plusieurs phrases)
 */
function extractTranslationLine(raw) {
  const lines = String(raw || '').split('\n');
  let capture = false;
  const out = [];
  // Retire le markdown (**, `, #) pour détecter les en-têtes et nettoyer la traduction :
  // certains modèles écrivent "**Décomposition**" ou "**Confluent:**", ce qui sinon casse la
  // détection de section et fait fuiter du texte d'analyse (avec *, é…) dans le gate.
  const clean = (s) => s.replace(/[*`#]/g, '').trim();

  for (const line of lines) {
    const t = clean(line);
    if (!capture) {
      // En-tête de traduction (markdown toléré) ; capture aussi un éventuel contenu inline.
      const m = t.match(/^(?:ancien\s+)?confluent\s*:\s*(.*)$/i);
      if (m) { capture = true; if (m[1]) out.push(m[1]); }
      continue;
    }
    // Fin de la section traduction (en-têtes, markdown toléré).
    if (/^(d[ée]composition|notes?|analyse|strat[ée]gie)\b/i.test(t)) break;
    if (t === '---') break;     // séparateur de section
    if (t === '') continue;     // ligne vide dans la traduction
    out.push(t);
  }
  return out.join(' ').trim();
}

/**
 * Construit le message de réparation envoyé au modèle quand le gate rejette des formes.
 * POURQUOI : réparation CIBLÉE (on nomme la forme + la raison) plutôt que regénération aveugle.
 */
function buildRepairMessage(invalides) {
  const details = invalides
    .map(i => `- "${i.mot}" : ${i.erreurs.join(', ')}`)
    .join('\n');
  return (
    "STOP — ta traduction contient des formes Confluent INVALIDES (phonotactique cassée) :\n" +
    details + "\n\n" +
    "Corrige UNIQUEMENT ces formes (garde le reste identique). Pour chacune : utilise lookup_concept " +
    "pour trouver la forme canonique existante, ou check_composition pour composer une forme valide. " +
    "Puis re-fournis les 4 sections (ANALYSE / STRATÉGIE / Ancien Confluent / Décomposition) avec la " +
    "traduction corrigée."
  );
}

/**
 * Agrège l'usage tokens d'une réponse Anthropic dans l'accumulateur.
 */
function accumulateUsage(acc, usage) {
  if (!usage) return;
  acc.input_tokens += usage.input_tokens || 0;
  acc.output_tokens += usage.output_tokens || 0;
  acc.cache_read_input_tokens += usage.cache_read_input_tokens || 0;
  acc.cache_creation_input_tokens += usage.cache_creation_input_tokens || 0;
}

/**
 * Traduit un texte français via l'agent outillé, avec gate + réparation.
 *
 * @param {Object} opts
 * @param {string} opts.text - texte français source
 * @param {string} opts.systemPrompt - prompt système (règles + contexte lexique injecté)
 * @param {Object} opts.anthropic - client Anthropic (configuré sur le proxy Etheryale)
 * @param {string} opts.model - identifiant modèle
 * @param {Object} opts.ctx - contexte outils { lexique, reverseIndex, morphReverseIndex }
 * @param {number} [opts.maxTokens=4096]
 * @param {number} [opts.maxToolRounds=10] - garde-fou anti-boucle d'appels d'outils
 * @param {number} [opts.maxRepairs=3] - tentatives de réparation après rejet du gate
 * @returns {Promise<{rawResponse, translation, valid, usage, toolRounds, repairs}>}
 * @throws {Error} si la traduction reste invalide après maxRepairs (échec franc, pas de fallback)
 */
async function translateWithAgent(opts) {
  const {
    text, systemPrompt, anthropic, model, ctx,
    maxTokens = 4096, maxToolRounds = 10, maxRepairs = 3
  } = opts;

  // System prompt en texte simple : le proxy Etheryale gère le prompt-caching AUTOMATIQUEMENT
  // (il injecte son propre cache_control ttl=1h sur les messages). Ajouter un cache_control 5m
  // ici déclenche un conflit d'ordre (un bloc 1h ne peut pas suivre un bloc 5m). On laisse donc
  // le proxy faire — c'est son rôle, et le system reste réutilisé à chaque tour ⇒ quasi gratuit.
  const system = systemPrompt;

  const messages = [{ role: 'user', content: text }];
  const usage = { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 };

  let toolRounds = 0;
  let repairs = 0;

  // Boucle principale : alterne appels d'outils et tentatives de réponse finale.
  // Borne dure pour éviter toute boucle infinie (tool rounds + réparations + marge).
  for (let step = 0; step < maxToolRounds + maxRepairs + 2; step++) {
    const resp = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      system,
      tools: TOOL_DEFINITIONS,
      messages
    });
    accumulateUsage(usage, resp.usage);

    // --- Cas 1 : le modèle veut utiliser des outils ---
    if (resp.stop_reason === 'tool_use') {
      messages.push({ role: 'assistant', content: resp.content });

      const toolResults = [];
      for (const block of resp.content) {
        if (block.type === 'tool_use') {
          const result = executeTool(block.name, block.input, ctx);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify(result)
          });
        }
      }
      messages.push({ role: 'user', content: toolResults });

      toolRounds++;
      if (toolRounds > maxToolRounds) {
        // Trop d'allers-retours : forcer une réponse finale sans outils au tour suivant.
        messages.push({
          role: 'user',
          content: "Assez d'outils. Donne MAINTENANT ta traduction finale dans les 4 sections."
        });
      }
      continue;
    }

    // --- Cas 2 : réponse finale du modèle ---
    const rawResponse = resp.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n');

    const translationLine = extractTranslationLine(rawResponse);
    // Gate avec l'alphabet de l'ÈRE (proto/ancien/mythologique), via ctx.era.
    const gate = validateTranslation(translationLine, ctx && ctx.era);

    // QUOI : une extraction VIDE est un échec, pas un succès.
    // POURQUOI : validateTranslation('') est vacuously valide (0 mot ⇒ 0 erreur) ; sans cette
    //        garde, une réponse hors-format (fréquent sur petits modèles comme Haiku) ferait
    //        passer une traduction vide pour valide — exactement le piège low-trust.
    const extractionVide = translationLine.length === 0;

    if (gate.valid && !extractionVide) {
      return { rawResponse, translation: translationLine, valid: true, usage, toolRounds, repairs };
    }

    // Sortie invalide (ou non extractible) : réparer si on a encore des tentatives.
    if (repairs < maxRepairs) {
      messages.push({ role: 'assistant', content: resp.content });
      const repairMsg = extractionVide
        ? ("Je ne trouve pas ta traduction. Réponds EXACTEMENT au format demandé : une ligne " +
           "`Ancien Confluent:` suivie, sur la ligne suivante, de la SEULE traduction Confluent (une ligne).")
        : buildRepairMessage(gate.invalides);
      messages.push({ role: 'user', content: repairMsg });
      repairs++;
      continue;
    }

    // Échec franc : on ne sert JAMAIS du Confluent cassé (doctrine anti-fallback).
    const formes = gate.invalides.map(i => `${i.mot} (${i.erreurs.join(', ')})`).join('; ');
    const err = new Error(
      `Traduction invalide après ${maxRepairs} réparations — formes cassées non résolues : ${formes}`
    );
    err.code = 'TRANSLATION_UNVALIDATED';
    err.invalides = gate.invalides;
    err.lastRaw = rawResponse;
    throw err;
  }

  // Garde-fou ultime : boucle épuisée sans réponse finale valide.
  const err = new Error('Agent: boucle épuisée sans traduction valide.');
  err.code = 'AGENT_LOOP_EXHAUSTED';
  throw err;
}

module.exports = { translateWithAgent, extractTranslationLine };
