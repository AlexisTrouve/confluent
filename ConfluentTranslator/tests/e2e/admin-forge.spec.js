/**
 * E2E de la BÉNÉDICTION des noms forgés (atelier admin).
 *
 * QUOI : prouve le cycle complet via HTTP réel + clic UI : forge → liste admin → BÉNIR (status beni) /
 *        REJETER (retiré). Le forge tourne en stub déterministe (LLM_MOCK), registre isolé en temp.
 * POURQUOI : doctrine « UI sans E2E = n'existe pas » + fermer la boucle de la forge de façon vérifiable.
 * COMMENT : `request` pour le niveau HTTP (endpoints admin) ; `page` pour le clic réel sur admin.html.
 *        Clé ADMIN requise (role:admin) car les routes /api/admin/* sont admin-only.
 */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

function getAdminKey() {
  const tokens = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'data', 'tokens.json'), 'utf8'));
  const admin = Object.values(tokens).find((t) => t.active && t.apiKey && t.role === 'admin');
  if (!admin) throw new Error('Aucun token admin actif dans data/tokens.json (requis pour /api/admin/*)');
  return admin.apiKey;
}
const ADMIN = getAdminKey();
const H = { 'x-api-key': ADMIN, 'Content-Type': 'application/json' };
const listNames = async (request) => (await (await request.get('/api/admin/forged-names', { headers: { 'x-api-key': ADMIN } })).json()).noms;

test('admin (HTTP) : forge → liste → BÉNIR (status beni) puis REJETER (retiré)', async ({ request }) => {
  const nom = 'E2E-Bless-' + Date.now();
  // 1. forge (stub déterministe) → provisoire
  const f = await request.post('/api/forge-name', { headers: H, data: { nom_fr: nom, sens: 'le regard de la nuit', target: 'mythologique' } });
  expect(f.ok(), 'forge OK').toBeTruthy();
  // 2. présent dans la liste admin, en provisoire
  let noms = await listNames(request);
  expect(noms.some((n) => n.nom_fr === nom && (n.status || 'provisoire') === 'provisoire')).toBeTruthy();
  // 3. bénir → status beni
  const b = await request.post('/api/admin/forged-names/bless', { headers: H, data: { nom_fr: nom } });
  expect(b.ok(), 'bless OK').toBeTruthy();
  noms = await listNames(request);
  expect(noms.find((n) => n.nom_fr === nom).status, 'béni').toBe('beni');
  // 4. rejeter un autre → retiré du registre
  const nom2 = 'E2E-Reject-' + Date.now();
  await request.post('/api/forge-name', { headers: H, data: { nom_fr: nom2, sens: 'le regard de la nuit', target: 'mythologique' } });
  const r = await request.post('/api/admin/forged-names/reject', { headers: H, data: { nom_fr: nom2 } });
  expect(r.ok(), 'reject OK').toBeTruthy();
  noms = await listNames(request);
  expect(noms.some((n) => n.nom_fr === nom2), 'rejeté = retiré').toBeFalsy();
});

test('admin (HTTP) : bénir avec RENOMMAGE invalide → 422 (jamais de canon cassé)', async ({ request }) => {
  const nom = 'E2E-BadRename-' + Date.now();
  await request.post('/api/forge-name', { headers: H, data: { nom_fr: nom, sens: 'le regard de la nuit', target: 'mythologique' } });
  const b = await request.post('/api/admin/forged-names/bless', { headers: H, data: { nom_fr: nom, confluent: 'tbime' } }); // attaque 2 consonnes
  expect(b.status(), 'forme cassée rejetée').toBe(422);
});

test('admin (UI) : bénir un nom forgé EN CLIQUANT', async ({ page, request }) => {
  const nom = 'E2E-UIBless-' + Date.now();
  await request.post('/api/forge-name', { headers: H, data: { nom_fr: nom, sens: 'le regard de la nuit', target: 'mythologique' } });
  // auth admin dans le navigateur (avant le chargement des scripts de la page)
  await page.addInitScript((k) => localStorage.setItem('confluentApiKey', k), ADMIN);
  await page.goto('/admin.html');
  await expect(page.locator('#forged-list')).toContainText(nom);
  const row = page.locator('.token-item', { hasText: nom });
  await row.getByRole('button', { name: /Bénir/ }).click();
  await expect(page.locator('#message-container')).toContainText(/béni/i);
});
