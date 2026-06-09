/**
 * Tests E2E ADVERSARIAUX des pages restantes (galerie glyphes, livre, admin).
 *
 * QUOI : couvre les pages sans E2E + leurs UNHAPPY PATHS : livre sans param, mot inconnu (échec
 *        franc), titre hostile (anti-injection). Doctrine "UI sans E2E = n'existe pas" + sans pitié.
 * COMMENT : pages publiques (galerie/livre) ou servie (admin) ; assertions sur le DOM réel rendu.
 */
const { test, expect } = require('@playwright/test');

// ---------- Galerie de glyphes (statique, pré-rendue) ----------
test('glyphes-font : galerie rendue (beaucoup de SVG + aucun doublon)', async ({ page }) => {
  await page.goto('/glyphes-font.html');
  expect(await page.locator('svg').count()).toBeGreaterThan(100);  // registre complet
  await expect(page.locator('body')).toContainText('aucun doublon');
});

// ---------- /livre : happy + unhappy ----------
test('livre : sans param text → 400 + message explicite', async ({ page }) => {
  const resp = await page.goto('/livre');
  expect(resp.status()).toBe(400);
  await expect(page.locator('body')).toContainText('text');
});

test('livre : texte valide → glyphes (SVG) rendus', async ({ page }) => {
  await page.goto('/livre?text=' + encodeURIComponent('va naki vo ura mirak u') + '&theme=clay');
  await expect(page.locator('svg').first()).toBeVisible();
  expect(await page.locator('svg').count()).toBeGreaterThan(3);
});

test('livre : mot inconnu → échec franc PRÉCIS (pas de page cassée)', async ({ page }) => {
  const resp = await page.goto('/livre?text=' + encodeURIComponent('va xyzzy vo'));
  expect(resp.status()).toBe(422);
  await expect(page.locator('body')).toContainText('xyzzy');
});

test('livre : titre hostile → AUCUNE injection HTML exécutable', async ({ page }) => {
  await page.goto('/livre?text=' + encodeURIComponent('va naki mirak u')
    + '&title=' + encodeURIComponent('<img src=x onerror=alert(1)>'));
  // Le titre ne doit créer AUCUN élément exécutable injecté (il doit être échappé/texte).
  expect(await page.locator('img[onerror]').count()).toBe(0);
});

// ---------- Sécurité : en-têtes HTTP défensifs ----------
test('sécurité : en-têtes défensifs présents, X-Powered-By retiré', async ({ page }) => {
  const resp = await page.goto('/');
  const h = resp.headers();
  expect(h['x-powered-by'], 'signature serveur retirée').toBeUndefined();
  expect(h['x-content-type-options']).toBe('nosniff');
  expect(h['x-frame-options']).toBe('SAMEORIGIN');
});

// ---------- admin.html (page servie) ----------
test('admin : la page charge sans crash et présente son UI', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/admin.html');
  await expect(page.locator('body')).toBeVisible();
  await expect(page.locator('body')).toContainText(/admin/i);
  expect(errors, 'aucune exception JS au chargement').toEqual([]);
});
