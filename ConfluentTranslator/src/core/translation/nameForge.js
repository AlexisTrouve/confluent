/**
 * nameForge — forge de NOMS PROPRES Confluent (personnages, lieux, bêtes du mythe).
 *
 * QUOI : `forgeProperName({nom_fr, sens}, ctx)` renvoie une forme Confluent STABLE pour un nom propre.
 *        Pipeline : (1) LOOKUP-FIRST (registre + lexique) → si déjà connu, renvoie l'existant ;
 *        (2) sinon FORGE via un sous-agent LLM spécialiste (compose racines + liaison) ;
 *        (3) VALIDE déterministe (gate phonotactique + anti-collision) ; (4) PERSISTE (provisoire) ;
 *        (5) renvoie le nom + décompo. Échec FRANC si rien de valide après réparation (jamais de cassé).
 * POURQUOI : les noms propres sont des compositions sensibles (encoder un sens, sonner comme un nom,
 *        ne pas entrer en collision, rester COHÉRENTS — Œil-Bas et Œil-Ouvert partagent « sili- »).
 *        Les forger à la volée SANS persistance donnerait des noms différents d'un run à l'autre :
 *        le lookup-first + le registre rendent le tool déterministe DE FACTO (gelé au 1er usage).
 * COMMENT : le sous-agent (créatif) est INJECTABLE via `ctx.forgeFn` — vrai LLM en prod
 *        (`defaultLLMForge`), stub déterministe en mock/test (`stubForge`). La validation et la
 *        persistance, elles, sont 100% déterministes. Le créateur bénit/renomme les `provisoire`
 *        ensuite (puis promotion au lexique).
 */
'use strict';
const { validateForm } = require('../validation/phonotactics');
const { searchWord, normalizeFrenchText } = require('./contextAnalyzer');
const { ANCIEN } = require('../eras/eras');
const { defaultRegistry, norm } = require('./forgedNamesRegistry');

const eraOf = (ctx) => (ctx && ctx.era) || ANCIEN;

/** Racines attestées candidates pour un sens FR (pour grounder la forge sur du vrai lexique). */
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
        // Racines courtes seulement (les compositions/verbes ne se ré-empilent pas bien).
        if (c && !seen.has(c) && c.length <= 6 && /[aeiou]$/.test(c)) { seen.add(c); out.push({ fr: word, confluent: c, forme_liee: t.forme_liee || c }); }
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

/** Cherche un nom déjà CANONISÉ au lexique (nom béni/promu). */
function lookupLexique(nomFr, ctx) {
  const dict = ctx && ctx.lexique && ctx.lexique.dictionnaire;
  if (!dict) return null;
  const e = dict[norm(nomFr)];
  return (e && e.traductions && e.traductions[0]) ? e.traductions[0].confluent : null;
}

/**
 * Sous-agent LLM spécialiste : compose UN nom propre Confluent et le rend en JSON strict.
 * @returns {Promise<{confluent, racines, liaison, decompo}|null>}
 */
async function defaultLLMForge({ nomFr, sens, ctx, error }) {
  if (!ctx || !ctx.anthropic || !ctx.model) return null;   // pas de client → échec franc (caller gère)
  const era = eraOf(ctx);
  const roots = candidateRoots(sens, ctx);
  const rootsHint = roots.length
    ? 'Racines attestées suggérées (réutilise-les en priorité) : ' + roots.map(r => `${r.fr}=${r.confluent}[lié:${r.forme_liee}]`).join(', ')
    : '(aucune racine évidente trouvée — compose au plus près du sens)';

  const sys =
    "Tu es le FORGEUR de noms propres de l'" + era.label + ". Tu construis UN nom propre Confluent " +
    "(personnage, lieu ou bête) qui ENCODE son sens et SONNE comme un nom.\n" +
    "RÈGLES DURES (une violation = rejet) :\n" +
    "- Compose des RACINES existantes via une LIAISON sacrée (racine1 forme liée + liaison + racine2). " +
    "Ex : « Œil-Bas » = sili(regard) + i + une racine de bassesse → sil-i-….\n" +
    "- Phonotactique : alphabet de l'ère, JAMAIS 2 consonnes en attaque, JAMAIS 3 consonnes d'affilée, " +
    "le nom finit par une VOYELLE.\n" +
    "- Cohérence : si le sens partage un élément avec un nom connu, réutilise la MÊME racine (Œil-* → sili-).\n" +
    "- Tout en minuscules. Pas de y/é/è sauf registre mythologique sacré.\n" +
    "Réponds UNIQUEMENT par un objet JSON : " +
    '{"confluent":"<forme>","racines":["r1","r2"],"liaison":"<liaison>","decompo":"<r1-liaison-r2= glose>"}';

  const userMsg =
    `Nom propre français : « ${nomFr} »\nSens : ${sens || '(non précisé — déduis du nom)'}\n${rootsHint}\n` +
    (error ? `\n⚠️ Ton essai précédent a été REJETÉ : ${error}. Corrige et propose une AUTRE forme.\n` : '') +
    `\nForge le nom et réponds en JSON strict.`;

  const resp = await ctx.anthropic.messages.create({
    model: ctx.model, max_tokens: 500, system: sys, messages: [{ role: 'user', content: userMsg }]
  });
  const text = (resp.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
  const usage = resp.usage || null;
  const parsed = parseJsonBlock(text);
  if (parsed) parsed._usage = usage;
  return parsed;
}

/** Extrait le premier objet JSON d'un texte (le modèle peut l'entourer de prose/```). */
function parseJsonBlock(text) {
  if (!text) return null;
  const m = String(text).match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch (_) { return null; }
}

/**
 * Stub DÉTERMINISTE de forge (mock/E2E) : compose à partir des racines du sens, sans LLM.
 * Garantit une forme valide et SANS collision en ajoutant des voyelles si besoin.
 */
function stubForge({ nomFr, sens, ctx }) {
  const era = eraOf(ctx);
  const roots = candidateRoots(sens, ctx);
  const liee = (r) => (r.forme_liee || r.confluent).replace(/[aeiou]+$/,'') || r.confluent;
  let base;
  if (roots.length >= 2) base = liee(roots[0]) + 'i' + roots[1].confluent;
  else if (roots.length === 1) base = liee(roots[0]) + 'ila';
  else base = 'sili' + 'la';   // fallback déterministe (aucune racine trouvée)
  // Dodge collision / invalidité de façon DÉTERMINISTE : suffixe une voyelle jusqu'à validité.
  const vowels = ['a', 'e', 'i', 'o', 'u'];
  let forme = base, i = 0;
  while ((!validateForm(forme, era).valid || collides(forme, ctx)) && i < vowels.length) {
    forme = base + vowels[i++];
  }
  return { confluent: forme, racines: roots.map(r => r.confluent), liaison: 'i', decompo: '(stub déterministe : ' + roots.map(r => r.confluent).join('+') + ')' };
}

/**
 * Forge (ou retrouve) un nom propre Confluent stable. Voir l'en-tête du module.
 * @param {{nom_fr?:string, nomFr?:string, sens?:string}} input
 * @param {Object} ctx - { lexique, morphReverseIndex, era, anthropic?, model?, forgeFn?, registry? }
 * @returns {Promise<Object>}
 */
async function forgeProperName(input, ctx = {}) {
  const nomFr = String((input && (input.nom_fr || input.nomFr)) || '').trim();
  const sens = String((input && input.sens) || '').trim();
  if (!nomFr) return { found: false, error: 'nom_fr requis', note: 'Donne le nom propre français à forger.' };

  const registry = ctx.registry || defaultRegistry;

  // 1. LOOKUP-FIRST — un nom déjà forgé/canonisé est RENVOYÉ tel quel (stabilité = cohérence).
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

  // 2. FORGE — sous-agent (réel en prod, stub déterministe en mock/test). Réparation : 1 reprise.
  const forgeFn = ctx.forgeFn || defaultLLMForge;
  let candidate = null, lastErr = null, usage = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    let f;
    try { f = await forgeFn({ nomFr, sens, ctx, error: lastErr }); }
    catch (e) { lastErr = 'la forge a échoué (' + e.message + ')'; continue; }
    if (!f || !f.confluent) { lastErr = 'forge vide'; continue; }
    if (f._usage) usage = f._usage;
    const forme = String(f.confluent).toLowerCase().trim();

    // 3. VALIDATION DÉTERMINISTE — gate phonotactique + anti-collision.
    const gate = validateForm(forme, eraOf(ctx));
    if (!gate.valid) { lastErr = `forme cassée « ${forme} » (${gate.erreurs.join(', ')})`; continue; }
    if (collides(forme, ctx)) { lastErr = `« ${forme} » est DÉJÀ une forme attestée (collision) — choisis une autre`; continue; }
    candidate = { confluent: forme, racines: f.racines || [], liaison: f.liaison || null, decompo: f.decompo || null };
    break;
  }
  if (!candidate) {
    return { found: false, nom_fr: nomFr, error: lastErr || 'aucune forme valide forgée',
      note: 'Échec franc : aucun nom valide forgé. Juxtapose ou approxime (ne sers JAMAIS de forme cassée).' };
  }

  // 4. PERSISTANCE — provisoire (à bénir par le créateur), désormais STABLE pour les prochains appels.
  const entry = {
    nom_fr: nomFr, sens: sens || null, confluent: candidate.confluent,
    racines: candidate.racines, liaison: candidate.liaison, decompo: candidate.decompo,
    registre: eraOf(ctx).id, provisoire: true, forge_at: isoNow()
  };
  registry.add(entry);

  // 5. RETOUR
  return { found: true, forged: true, source: 'forge', nom_fr: nomFr, confluent: candidate.confluent,
    decompo: candidate.decompo, racines: candidate.racines, liaison: candidate.liaison, provisoire: true,
    _usage: usage,
    note: 'Nom forgé (PROVISOIRE — à valider par le créateur), persisté : tout appel ultérieur renverra cette même forme.' };
}

// Timestamp ISO (code serveur normal : Date dispo). Isolé pour lisibilité/testabilité.
function isoNow() { try { return new Date().toISOString(); } catch (_) { return null; } }

module.exports = { forgeProperName, defaultLLMForge, stubForge, candidateRoots, collides };
