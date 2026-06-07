// Rend TOUS les atomes (primitives) du registre, labellisés (dev only).
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const { renderGlyph } = require('../src/core/ecriture/glyphRenderer');
const A = require('../data/glyphes-anciens.json').atomes;
const cells = Object.entries(A).map(([name, ed], i) =>
  `<div style="text-align:center;margin:8px;width:120px"><div>${renderGlyph(ed, 'at' + i, 110)}</div><div style="color:#c9a86a;font-size:12px">${name}</div></div>`).join('');
const f = path.join(__dirname, '..', 'public', '_allatoms.html');
fs.writeFileSync(f, `<body style="background:#15110c;display:flex;flex-wrap:wrap;justify-content:center;align-items:flex-start;padding:20px"><div style="color:#caa86a;width:100%;text-align:center;font-family:system-ui;font-size:18px;margin-bottom:6px">Primitives (${Object.keys(A).length} atomes)</div>${cells}</body>`);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.setViewportSize({ width: 920, height: 820 });
  await p.goto('file://' + f.replace(/\\/g, '/'));
  await p.waitForTimeout(600);
  await p.screenshot({ path: path.join(__dirname, '..', 'public', '_allatoms.png') });
  await b.close(); console.log('ok');
})().catch(e => { console.error(e.message); process.exit(1); });
