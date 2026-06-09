/**
 * Tests E2E réels de l'UI d'écriture (Glyphes du Gouffre) — /ecriture.html.
 *
 * QUOI : lance l'app, saisit un texte Confluent, clique « Dessiner », et vérifie 3 flux observables :
 *        (1) texte valide → collier de glyphes rendu (SVG) ;
 *        (2) mot inconnu → ERREUR PRÉCISE affichée (ligne/colonne/mot) — doctrine no-fallback ;
 *        (3) chaque caractère redessiné à neuf → seeds de déformation DISTINCTS (exigence : argile vivante).
 * POURQUOI : doctrine "UI sans E2E = n'existe pas". Flux 100% déterministe (aucun appel LLM).
 * COMMENT : la clé API est lue depuis data/tokens.json (token actif) — pas de secret hardcodé.
 */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

function getValidApiKey() {
  const file = path.join(__dirname, '..', '..', 'data', 'tokens.json');
  const tokens = JSON.parse(fs.readFileSync(file, 'utf8'));
  const active = Object.values(tokens).find((t) => t.active && t.apiKey);
  if (!active) throw new Error('Aucun token actif dans data/tokens.json');
  return active.apiKey;
}

test('écriture : texte valide → collier de glyphes rendu', async ({ page }) => {
  await page.goto('/ecriture.html');
  await page.fill('#apikey-input', getValidApiKey());
  await page.fill('#conf-input', 'va naki vo ura mirak u');
  await page.locator('#draw-btn').click();

  // Le collier rendu contient un SVG de glyphe par perle (≥ 6 mots → ≥ 6 SVG), aucune erreur.
  await expect(page.locator('#output svg').first()).toBeVisible();
  expect(await page.locator('#output svg').count()).toBeGreaterThanOrEqual(6);
  await expect(page.locator('#error')).toHaveText('');
});

test('écriture : mot inconnu → erreur PRÉCISE (ligne/colonne/mot)', async ({ page }) => {
  await page.goto('/ecriture.html');
  await page.fill('#apikey-input', getValidApiKey());
  await page.fill('#conf-input', 'va xyzzy vo');
  await page.locator('#draw-btn').click();

  // Échec franc : on pointe le mot fautif et sa position, et on ne dessine RIEN.
  await expect(page.locator('#error')).toContainText('xyzzy');
  await expect(page.locator('#error')).toContainText('colonne');
  await expect(page.locator('#output svg')).toHaveCount(0);
});

test('écriture : chaque caractère redessiné à neuf (seeds distincts)', async ({ page }) => {
  await page.goto('/ecriture.html');
  await page.fill('#apikey-input', getValidApiKey());
  await page.fill('#conf-input', 'va va va'); // le MÊME glyphe trois fois
  await page.locator('#draw-btn').click();
  await expect(page.locator('#output svg').first()).toBeVisible();

  // Preuve de l'argile vivante : les seeds de déformation ne sont pas tous identiques.
  const html = await page.locator('#output').innerHTML();
  const seeds = [...html.matchAll(/seed="(\d+)"/g)].map((m) => m[1]);
  expect(seeds.length).toBeGreaterThanOrEqual(3);
  expect(new Set(seeds).size).toBeGreaterThan(1);
});

test('écriture : français → traduction (LLM mock) → glyphes', async ({ page }) => {
  await page.goto('/ecriture.html');
  await page.fill('#apikey-input', getValidApiKey());
  await page.fill('#fr-input', 'je vois le regard libre');
  await page.locator('#translate-btn').click();
  // La traduction (mockée serveur) remplit le champ Confluent, puis le dessin s'enchaîne automatiquement.
  await expect(page.locator('#conf-input')).not.toHaveValue('');
  await expect(page.locator('#output svg').first()).toBeVisible();
  await expect(page.locator('#error')).toHaveText('');
});

test('écriture : le modèle choisi est bien envoyé dans la requête /translate', async ({ page }) => {
  await page.goto('/ecriture.html');
  await page.fill('#apikey-input', getValidApiKey());
  await page.selectOption('#model-select', 'claude-opus-4-8');
  await page.fill('#fr-input', 'je vois le regard libre');
  // Intercepte la requête réelle : le corps doit porter le modèle sélectionné (pont FR→glyphes respecte le choix).
  const [req] = await Promise.all([
    page.waitForRequest((r) => r.url().includes('/translate') && r.method() === 'POST'),
    page.locator('#translate-btn').click(),
  ]);
  expect(JSON.parse(req.postData()).model).toBe('claude-opus-4-8');
});
