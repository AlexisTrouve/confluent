/**
 * nameForge — forge de NOMS PROPRES Confluent (personnages, lieux, bêtes du mythe).
 *
 * QUOI : `forgeProperName({nom_fr, sens}, ctx)` renvoie une forme Confluent STABLE pour un nom propre.
 *        Pipeline : (1) LOOKUP-FIRST (registre + lexique) → si déjà connu, renvoie l'existant ;
 *        (2) sinon FORGE via un SOUS-AGENT OUTILLÉ (il consulte le lexique/grammaire et VÉRIFIE sa
 *        composition avec les mêmes outils que le traducteur) ; (3) GARANTIE DÉTERMINISTE finale
 *        (gate phonotactique + anti-collision + racines réellement DÉCLARÉES) ; (4) PERSISTE
 *        (provisoire) ; (5) renvoie le nom + décompo. Échec FRANC si rien de valide (jamais de cassé).
 * POURQUOI : un one-shot « invente » des racines fantômes (silibuna) qui passent la phono mais ne
 *        veulent rien dire — exactement le travers que l'agent outillé corrige ailleurs. On donne donc
 *        les OUTILS au forgeur (il se grounde sur de vraies racines) ET on REVÉRIFIE déterministiquement
 *        (on ne fait jamais confiance à l'affirmation de l'agent : que des sorties vérifiables). Les noms
 *        sont aussi persistés (lookup-first) → un nom forgé une fois reste stable pour toujours.
 * COMMENT : le sous-agent (créatif) est INJECTABLE via `ctx.forgeFn` — vrai agent outillé en prod
 *        (`defaultLLMForge`, modèle `ctx.forgeModel` découplé de la traduction), stub déterministe en
 *        mock/test (`stubForge`). Modèle de forge : `CONFLUENT_FORGE_MODEL` (défaut Sonnet) — forger un
 *        nom est RARE (figé au registre ensuite) mais à fort enjeu canon, donc pas du Haiku par défaut.
 */
'use strict';
const { validateForm } = require('../validation/phonotactics');
const { searchWord, normalizeFrenchText } = require('./contextAnalyzer');
const { ANCIEN } = require('../eras/eras');
const { defaultRegistry, norm } = require('./forgedNamesRegistry');
const { TOOL_DEFINITIONS, executeTool, execVerifyWord } = require('./translationTools');

const eraOf = (ctx) => (ctx && ctx.era) || ANCIEN;

// Sous-ensemble d'outils donnés au forgeur : trouver des racines, valider une composition/forme.
// (Pas analyze_text/back_translate/grammar_check, PAS forge_proper_name → aucune récursion.)
const FORGE_TOOL_NAMES = new Set(['lookup_concept', 'check_composition', 'validate_form', 'verify_word']);
const FORGE_TOOLS = TOOL_DEFINITIONS.filter(t => FORGE_TOOL_NAMES.has(t.name));

/** Racines attestées candidates pour un sens FR (hint donné au forgeur + base du stub déterministe). */
function candidateRoots(sens, ctx) {
  const dict = ctx && ctx.lexique && ctx.lexique.dictionnaire;
  if (!dict || !sens) return [];
  const out = [];
  const seen = new Set();
  for (const word of String(sens).split(/[^a-zà-ÿœ]+/i).filter(w => w.length > 2)) {
    const results = searchWord(normalizeFrenchText(word), dict).sort((a, b) => b.score - a.score);
    for (const r of results.slice(0, 1)) {
      for (const t of (r.traductions || [])) {
        const c = (t.confluent || '').toLowerCase();
        if (c && !seen.has(c) && c.length <= 6 && /[aeiou]$/.test(c)) {
          seen.add(c); out.push({ fr: word, confluent: c, forme_liee: t.forme_liee || c });
        }
      }
    }
  }
  return out;
}

/** Une forme entre-t-elle en collision avec une forme DÉJÀ attestée (autre concept) ? */
function collides(forme, ctx) {
  const byWord = (ctx && ctx.morphReverseIndex && ctx.morphReverseIndex.byWord) || {};
  return Boolean(byWord[forme]);
}

/**
 * GARANTIE DÉTERMINISTE : la forme se décompose-t-elle en racines RÉELLEMENT DÉCLARÉES ?
 * COMMENT : réutilise execVerifyWord (direct / verbe conjugué / composition liaison) — reconnu=true
 *        ⇒ toutes les racines/radical sont attestés. Bloque les racines FANTÔMES (silibuna : buna✗).
 */
function rootsDeclared(forme, ctx) {
  const v = execVerifyWord({ confluent: forme }, ctx);
  if (v.reconnu) {
    const racines = (v.racines || []).map(r => r.racine).filter(Boolean);
    return { ok: true, racines: racines.length ? racines : (v.radical ? [v.radical] : []), mode: v.mode };
  }
  const phantom = (v.racines || []).filter(r => r && r.trouvee === false).map(r => r.racine);
  return { ok: false, phantom, reason: phantom.length ? `racine(s) non déclarée(s) : ${phantom.join(', ')}` : 'ne se décompose pas en racines connues' };
}

/** Cherche un nom déjà CANONISÉ au lexique (nom béni/promu). */
function lookupLexique(nomFr, ctx) {
  const dict = ctx && ctx.lexique && ctx.lexique.dictionnaire;
  if (!dict) return null;
  const e = dict[norm(nomFr)];
  return (e && e.traductions && e.traductions[0]) ? e.traductions[0].confluent : null;
}

function addUsage(acc, u) {
  if (!u) return; acc.input_tokens += u.input_tokens || 0; acc.output_tokens += u.output_tokens || 0;
}

/** Extrait le premier objet JSON d'un texte (le modèle peut l'entourer de prose/```). */
function parseJsonBlock(text) {
  if (!text) return null;
  const m = String(text).match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch (_) { return null; }
}

/** System prompt du forgeur OUTILLÉ. */
function buildForgeSystem(era) {
  return (
    "Tu es le FORGEUR de noms propres de l'" + era.label + ". Tu construis UN nom propre Confluent " +
    "(personnage, lieu ou bête) qui ENCODE son sens et SONNE comme un nom.\n\n" +
    "MÉTHODE OBLIGATOIRE — utilise les OUTILS, ne devine JAMAIS une racine :\n" +
    "1. `lookup_concept` sur les mots-clés du SENS → récupère les VRAIES racines attestées (forme liée).\n" +
    "2. Compose : racine1(forme liée) + liaison sacrée + racine2 (ex : sil-i-toka).\n" +
    "3. `check_composition` (racines déclarées ? liaison valide ? phonotactique ?) puis au besoin " +
    "`validate_form` / `verify_word` sur la forme finale. Corrige jusqu'à ce que TOUT soit vert.\n\n" +
    "RÈGLES DURES (une violation = rejet par le gate) :\n" +
    "- Composer des RACINES EXISTANTES (confirmées par lookup_concept). N'INVENTE JAMAIS une racine.\n" +
    "- Phonotactique : jamais 2 consonnes en attaque, jamais 3 d'affilée, le nom finit par une VOYELLE.\n" +
    "- Cohérence : si le sens partage un élément avec un nom connu, réutilise la MÊME racine (Œil-* → sili-).\n" +
    "- Tout en minuscules. y/é/è UNIQUEMENT en registre mythologique sacré.\n\n" +
    "Quand la forme est VÉRIFIÉE (outils verts), réponds par le JSON FINAL et RIEN d'autre :\n" +
    '{"confluent":"<forme>","racines":["r1","r2"],"liaison":"<liaison>","decompo":"<r1-liaison-r2 = glose>"}'
  );
}

/**
 * Sous-agent LLM OUTILLÉ : compose UN nom propre en consultant le lexique, puis rend le JSON final.
 * @returns {Promise<{confluent, racines, liaison, decompo, _usage}|null>}
 */
async function defaultLLMForge({ nomFr, sens, ctx, error }) {
  if (!ctx || !ctx.anthropic) return null;
  const model = ctx.forgeModel || ctx.model;          // modèle de forge DÉCOUPLÉ (Sonnet par défaut côté serveur)
  if (!model) return null;
  const era = eraOf(ctx);
  const roots = candidateRoots(sens, ctx);
  const hint = roots.length ? '\nRacines déjà repérées (à confirmer/réutiliser) : ' + roots.map(r => `${r.fr}=${r.confluent}`).join(', ') : '';

  const system = buildForgeSystem(era);
  const messages = [{ role: 'user', content:
    `Nom propre français : « ${nomFr} »\nSens : ${sens || '(non précisé — déduis du nom)'}${hint}\n` +
    (error ? `\n⚠️ Essai précédent REJETÉ : ${error}. Trouve une AUTRE forme valide.\n` : '') +
    `\nForge le nom (utilise les outils pour te grounder), puis donne le JSON final.` }];

  const usage = { input_tokens: 0, output_tokens: 0 };
  for (let step = 0; step < 7; step++) {                // garde-fou anti-boucle
    const resp = await ctx.anthropic.messages.create({ model, max_tokens: 800, system, tools: FORGE_TOOLS, messages });
    addUsage(usage, resp.usage);

    if (resp.stop_reason === 'tool_use') {
      messages.push({ role: 'assistant', content: resp.content });
      const toolResults = [];
      for (const b of resp.content) {
        if (b.type === 'tool_use') {
          const r = FORGE_TOOL_NAMES.has(b.name) ? executeTool(b.name, b.input, ctx) : { error: 'outil non autorisé pour la forge' };
          toolResults.push({ type: 'tool_result', tool_use_id: b.id, content: JSON.stringify(r) });
        }
      }
      messages.push({ role: 'user', content: toolResults });
      continue;
    }

    const text = (resp.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
    const parsed = parseJsonBlock(text);
    if (parsed) { parsed._usage = usage; return parsed; }
    // Pas de JSON : on relance UNE fois en exigeant le format, sinon abandon.
    messages.push({ role: 'assistant', content: resp.content });
    messages.push({ role: 'user', content: 'Donne MAINTENANT le JSON final {"confluent":...,"racines":[...],"liaison":...,"decompo":...} et rien d\'autre.' });
  }
  return null;   // boucle épuisée → échec franc (caller gère)
}

/**
 * Stub DÉTERMINISTE de forge (mock/E2E) : compose 2 racines RÉELLES via une liaison, sans LLM.
 * Garantit une forme valide, sans collision ET décomposable en racines déclarées (dodge par liaison).
 */
function stubForge({ nomFr, sens, ctx }) {
  const era = eraOf(ctx);
  const found = candidateRoots(sens, ctx);
  // Toujours 2 racines RÉELLES (sinon fallback sur des racines cardinales attestées).
  const pool = found.length >= 2 ? found.slice(0, 2)
    : [found[0] || { confluent: 'sili', forme_liee: 'sil' }, { confluent: 'toka', forme_liee: 'tok' }];
  const liee = (r) => r.forme_liee || (r.confluent || '').replace(/[aeiou]+$/, '') || r.confluent;
  // Dodge collision/invalidité en CHANGEANT la liaison (garde la décomposabilité, contrairement à un suffixe).
  for (const li of ['i', 'a', 'e', 'o', 'u', 'ie', 'aa', 'ea']) {
    const forme = liee(pool[0]) + li + pool[1].confluent;
    if (validateForm(forme, era).valid && !collides(forme, ctx)) {
      return { confluent: forme, racines: [pool[0].confluent, pool[1].confluent], liaison: li, decompo: `(stub: ${pool[0].confluent}-${li}-${pool[1].confluent})` };
    }
  }
  return { confluent: liee(pool[0]) + 'i' + pool[1].confluent, racines: [pool[0].confluent, pool[1].confluent], liaison: 'i', decompo: '(stub)' };
}

/**
 * Forge (ou retrouve) un nom propre Confluent stable. Voir l'en-tête du module.
 * @param {{nom_fr?:string, nomFr?:string, sens?:string}} input
 * @param {Object} ctx - { lexique, morphReverseIndex, era, anthropic?, model?, forgeModel?, forgeFn?, registry? }
 */
async function forgeProperName(input, ctx = {}) {
  const nomFr = String((input && (input.nom_fr || input.nomFr)) || '').trim();
  const sens = String((input && input.sens) || '').trim();
  if (!nomFr) return { found: false, error: 'nom_fr requis', note: 'Donne le nom propre français à forger.' };

  const registry = ctx.registry || defaultRegistry;

  // 1. LOOKUP-FIRST — nom déjà forgé/canonisé → MÊME forme (stabilité = cohérence).
  const known = registry.lookup(nomFr);
  if (known) {
    return { found: true, source: 'registre', nom_fr: nomFr, confluent: known.confluent,
      decompo: known.decompo, racines: known.racines, liaison: known.liaison, provisoire: known.provisoire,
      note: 'Nom déjà forgé — forme stable réutilisée (aucune re-forge, cohérence garantie).' };
  }
  const canon = lookupLexique(nomFr, ctx);
  if (canon) {
    return { found: true, source: 'lexique', nom_fr: nomFr, confluent: canon,
      note: 'Nom canonique présent au lexique — utilise cette forme.' };
  }

  // 2. FORGE — sous-agent outillé (réel) ou stub (mock). Réparation : 2 reprises (l'erreur est renvoyée).
  const forgeFn = ctx.forgeFn || defaultLLMForge;
  let candidate = null, lastErr = null, usage = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    let f;
    try { f = await forgeFn({ nomFr, sens, ctx, error: lastErr }); }
    catch (e) { lastErr = 'la forge a échoué (' + e.message + ')'; continue; }
    if (!f || !f.confluent) { lastErr = 'forge vide / pas de JSON'; continue; }
    if (f._usage) usage = f._usage;
    const forme = String(f.confluent).toLowerCase().trim();

    // 3. GARANTIE DÉTERMINISTE — gate phonotactique + anti-collision + racines DÉCLARÉES.
    const gate = validateForm(forme, eraOf(ctx));
    if (!gate.valid) { lastErr = `forme cassée « ${forme} » (${gate.erreurs.join(', ')})`; continue; }
    if (collides(forme, ctx)) { lastErr = `« ${forme} » est DÉJÀ une forme attestée (collision) — choisis-en une autre`; continue; }
    const decl = rootsDeclared(forme, ctx);
    if (!decl.ok) { lastErr = `« ${forme} » : ${decl.reason} — compose à partir de racines EXISTANTES (lookup_concept)`; continue; }

    candidate = { confluent: forme, racines: decl.racines, liaison: f.liaison || null, decompo: f.decompo || null };
    break;
  }
  if (!candidate) {
    return { found: false, nom_fr: nomFr, error: lastErr || 'aucune forme valide forgée',
      note: 'Échec franc : aucun nom valide forgé. Juxtapose ou approxime (ne sers JAMAIS de forme cassée).' };
  }

  // 4. PERSISTANCE — provisoire (à bénir par le créateur), STABLE pour les prochains appels.
  registry.add({
    nom_fr: nomFr, sens: sens || null, confluent: candidate.confluent,
    racines: candidate.racines, liaison: candidate.liaison, decompo: candidate.decompo,
    registre: eraOf(ctx).id, provisoire: true, forge_at: isoNow()
  });

  // 5. RETOUR
  return { found: true, forged: true, source: 'forge', nom_fr: nomFr, confluent: candidate.confluent,
    decompo: candidate.decompo, racines: candidate.racines, liaison: candidate.liaison, provisoire: true, _usage: usage,
    note: 'Nom forgé (PROVISOIRE — à valider par le créateur), persisté : tout appel ultérieur renverra cette même forme.' };
}

function isoNow() { try { return new Date().toISOString(); } catch (_) { return null; } }

module.exports = { forgeProperName, defaultLLMForge, stubForge, candidateRoots, collides, rootsDeclared, FORGE_TOOLS };
