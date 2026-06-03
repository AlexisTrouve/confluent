/**
 * Tests E2E réels de l'UI ConfluentTranslator.
 *
 * QUOI : lance l'app, se connecte avec une vraie clé, et exerce deux flux observables :
 *        (1) recherche lexique (sans LLM), (2) traduction FR→Confluent (LLM mocké).
 *
 * POURQUOI : doctrine "UI sans E2E = n'existe pas". Flux déterministes (recherche client +
 *            mock LLM serveur) pour des tests rapides et non-flaky. Le flux (1) vérifie aussi
 *            que la forme réparée 'siliaska' est servie (et plus la corrompue 'zvekamema').
 *
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

test('login + recherche lexique affiche une traduction (flux sans LLM)', async ({ page }) => {
  const apiKey = getValidApiKey();

  await page.goto('/');
  await expect(page.locator('#login-overlay')).toBeVisible();

  await page.fill('#login-api-key', apiKey);
  const lexiqueLoaded = page.waitForResponse((r) => r.url().includes('/api/lexique/') && r.ok());
  await page.locator('#login-overlay button').click();
  await expect(page.locator('#login-overlay')).toBeHidden();
  await lexiqueLoaded;

  await page.locator('.tab[data-tab="lexique"]').click();
  await expect(page.locator('#tab-lexique')).toHaveClass(/active/);

  await page.locator('#lexique-search').pressSequentially('regard');
  await expect(page.locator('#lexique-count')).not.toHaveText('0 résultat(s)');
  await expect(page.locator('#lexique-results .lexique-item').first()).toBeVisible();

  const results = await page.locator('#lexique-results').innerText();
  expect(results).toContain('siliaska');
  expect(results).not.toContain('zvekamema');
});

test('traduction FR→Confluent affiche un résultat (LLM mocké)', async ({ page }) => {
  const apiKey = getValidApiKey();

  await page.goto('/');
  await expect(page.locator('#login-overlay')).toBeVisible();
  await page.fill('#login-api-key', apiKey);
  await page.locator('#login-overlay button').click();
  await expect(page.locator('#login-overlay')).toBeHidden();

  await expect(page.locator('#tab-traduction')).toHaveClass(/active/);

  await page.fill('#input', 'je vois le regard libre');
  await page.locator('#translate').click();

  await expect(page.locator('#result-container')).toBeVisible();
  await expect(page.locator('#layer1-content')).toContainText('siliaska');
});

async function loginUI(page) {
  await page.goto('/');
  await page.fill('#login-api-key', getValidApiKey());
  await page.locator('#login-overlay button').click();
  await expect(page.locator('#login-overlay')).toBeHidden();
}

test('onglet Guide : guide GÉNÉRÉ chargé depuis /api/guide et rendu', async ({ page }) => {
  await loginUI(page);
  const guideResp = page.waitForResponse((r) => r.url().includes('/api/guide') && r.ok());
  await page.locator('.tab[data-tab="guide"]').click();
  await guideResp;
  const txt = await page.locator('#guide-dynamic').innerText();
  expect(txt).toContain('Liaisons');     // section générée
  expect(txt).toContain('mirak');        // un verbe (depuis le lexique)
  expect(txt).toContain('akoazana');     // une caste (depuis le lexique)
});

test('onglet Exemples : phrases pré-générées affichées', async ({ page }) => {
  await loginUI(page);
  await page.locator('.tab[data-tab="exemples"]').click();
  await expect(page.locator('#examples-list .example-item').first()).toBeVisible();
});

test('onglet Settings : le choix de modèle persiste (Etheryale only)', async ({ page }) => {
  await loginUI(page);
  await page.locator('.tab[data-tab="settings"]').click();
  await page.selectOption('#settings-model', 'claude-sonnet-4-6');
  await page.locator('button:has-text("Sauvegarder")').click();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('confluentSettings') || '{}').model);
  expect(stored).toBe('claude-sonnet-4-6');
  // Plus aucun champ provider/clé anthropic/openai dans les settings sauvegardés.
  const raw = await page.evaluate(() => localStorage.getItem('confluentSettings') || '');
  expect(raw).not.toContain('openai');
  expect(raw).not.toContain('provider');
});
