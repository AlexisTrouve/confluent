// Test/capture du rendu livre (dev only). node scripts/_book_test.js [theme]
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const { convert } = require('./confluent2glyphes');
const { renderBook } = require('../src/core/ecriture/bookRenderer');
(async () => {
  const txt = Array(22).fill('va naki vo ura mirak u').join(' ');
  const r = convert(txt);
  if (r.erreur) { console.error(r.erreur); process.exit(1); }
  const html = renderBook(r.glyphes, { theme: process.argv[2] || 'tablette', title: 'le livre de la foi' });
  const f = path.join(__dirname, '..', 'public', '_book.html');
  fs.writeFileSync(f, html);
  const b = await chromium.launch(); const p = await b.newPage();
  await p.setViewportSize({ width: 880, height: 1240 });
  await p.goto('file://' + f.replace(/\\/g, '/'));
  await p.waitForTimeout(500);
  await p.screenshot({ path: path.join(__dirname, '..', 'public', '_book.png') });
  await b.close();
  console.log('beads', r.glyphes.reduce((a, w) => a + (w.glyphes || []).length, 0));
})().catch(e => { console.error(e.message); process.exit(1); });
