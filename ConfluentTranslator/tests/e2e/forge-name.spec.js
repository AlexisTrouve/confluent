/**
 * E2E du FORGEUR de noms propres — POST /api/forge-name (niveau HTTP, serveur réel).
 *
 * QUOI : prouve de bout en bout (vraie requête → vrai handler → vrai registre) le contrat du forgeur :
 *        (1) forge un nom → forme Confluent VALIDE + provisoire ; (2) re-forge le MÊME nom → MÊME forme
 *        (lookup-first = cohérence, la garantie centrale) ; (3) nom manquant → 400 ; (4) sans clé → refus.
 * POURQUOI : doctrine « pas d'E2E = ça n'existe pas ». La forge LLM étant non-déterministe, le serveur
 *        E2E tourne en LLM_MOCK=1 → le handler utilise le STUB déterministe : l'E2E est reproductible
 *        et teste les VRAIES garanties (validité, persistance, idempotence) sans réseau ni coût.
 * COMMENT : registre isolé en temp (FORGED_NAMES_PATH, cf. playwright.config) → ne pollue pas data/.
 *        Nom unique par run → la 1ère forge est toujours fraîche, la 2ᵉ teste le lookup-first.
 */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { validateForm } = require('../../src/core/validation/phonotactics');
const { ANCIEN } = require('../../src/core/eras/eras');

// Clé API active depuis data/tokens.json (comme translator.spec — pas de secret hardcodé).
function getValidApiKey() {
  const tokens = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'data', 'tokens.json'), 'utf8'));
  const active = Object.values(tokens).find((t) => t.active && t.apiKey);
  if (!active) throw new Error('Aucun token actif dans data/tokens.json');
  return active.apiKey;
}

const KEY = getValidApiKey();
const SENS = 'le regard de la nuit';
const H = { 'x-api-key': KEY, 'Content-Type': 'application/json' };
// Nom unique PAR TEST (robuste à l'ordre/parallélisme) : la forge est toujours fraîche.
const uniq = (tag) => `E2E-${tag}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

test('forge : nom nouveau → forme Confluent valide + provisoire', async ({ request }) => {
  const resp = await request.post('/api/forge-name', { headers: H, data: { nom_fr: uniq('new'), sens: SENS } });
  expect(resp.status(), 'forge OK').toBe(200);
  const body = await resp.json();
  expect(body.found).toBe(true);
  expect(body.forged, 'nom inédit = réellement forgé').toBe(true);
  expect(body.provisoire, 'nom forgé = provisoire (à bénir)').toBe(true);
  expect(typeof body.confluent).toBe('string');
  expect(body.confluent.length).toBeGreaterThan(2);
  // La forme rendue passe RÉELLEMENT le gate phonotactique de l'ère.
  expect(validateForm(body.confluent, ANCIEN).valid, `forme « ${body.confluent} » valide`).toBe(true);
});

test('forge : MÊME nom re-demandé → MÊME forme (lookup-first = cohérence)', async ({ request }) => {
  const nom = uniq('same');
  const r1 = await (await request.post('/api/forge-name', { headers: H, data: { nom_fr: nom, sens: SENS } })).json();
  const r2 = await (await request.post('/api/forge-name', { headers: H, data: { nom_fr: nom, sens: SENS } })).json();
  expect(r1.confluent, 'la 1ère forge produit une forme').toBeTruthy();
  expect(r2.source, 'lookup-first → vient du registre').toBe('registre');
  expect(r2.confluent, 'la forme ne change JAMAIS pour un même nom').toBe(r1.confluent);
});

test('forge : nom_fr manquant → 400', async ({ request }) => {
  const resp = await request.post('/api/forge-name', { headers: H, data: { sens: 'x' } });
  expect(resp.status()).toBe(400);
});

test('forge : sans clé API → refusé (pas 200)', async ({ request }) => {
  const resp = await request.post('/api/forge-name', {
    headers: { 'Content-Type': 'application/json' }, data: { nom_fr: 'X', sens: 'y' }
  });
  expect(resp.status(), 'route protégée').not.toBe(200);
  expect([401, 403]).toContain(resp.status());
});
