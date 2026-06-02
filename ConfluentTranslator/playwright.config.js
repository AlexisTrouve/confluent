// Configuration Playwright pour les tests E2E de l'UI ConfluentTranslator.
// QUOI : lance le serveur réel et exécute les specs dans tests/e2e contre Chromium.
// POURQUOI : doctrine "UI sans test E2E = n'existe pas" — preuve qui clique sur l'app.
// COMMENT : webServer démarre `node server.js` sur un port dédié (3100, évite tout conflit),
//           avec LLM_MOCK=1 pour tester la traduction sans appel réseau, attend /api/health.
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  expect: { timeout: 10000 },
  use: {
    baseURL: 'http://localhost:3100',
    headless: true,
  },
  webServer: {
    command: 'node server.js',
    url: 'http://localhost:3100/api/health',
    // LLM_MOCK=1 : traduction déterministe sans appeler le LLM (E2E sans réseau ni coût).
    env: { PORT: '3100', LLM_MOCK: '1' },
    timeout: 30000,
    reuseExistingServer: false,
  },
});
