// Capture Playwright de l'UI d'écriture en action (dev only, non commité).
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const tokens = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'tokens.json'), 'utf8'));
const key = Object.values(tokens).find(t => t.active && t.apiKey).apiKey;
const PORT = process.env.PORT || 3200;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.setViewportSize({ width: 1000, height: 640 });
  await p.goto(`http://localhost:${PORT}/ecriture.html`);
  await p.fill('#apikey-input', key);
  await p.fill('#conf-input', process.argv[2] || 'va naki vo ura mirak u');
  await p.click('#draw-btn');
  await p.waitForSelector('#output svg', { timeout: 8000 });
  await p.waitForTimeout(350);
  await p.screenshot({ path: path.join(__dirname, '..', 'public', '_ecriture.png') });
  await b.close(); console.log('shot ecriture ok');
})().catch(e => { console.error(e.message); process.exit(1); });
