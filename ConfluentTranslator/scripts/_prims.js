// Mock des nouvelles primitives de formes (dev only).
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const { renderGlyph } = require('../src/core/ecriture/glyphRenderer');
const prims = [
  ['barre', [['n', 's']]],
  ['chevron inversé', [['nw', 's'], ['s', 'ne']]],
  ['tiret haut', [['nw', 'ne']]],
  ['tiret diag 3/4', [['c', 'ne']]],
  ['tick', [['w', 's'], ['s', 'ne']]],
  ['flèche ↗', [['sw', 'ne'], ['ne', 'n'], ['ne', 'e']]],
  ['demi-cercle H', [['w', 'e', 32]]],
];
const cells = prims.map(([lbl, ed], i) =>
  `<div style="text-align:center;margin:10px"><div>${renderGlyph(ed, 'pr' + i, 130)}</div><div style="color:#c9a86a;font-size:13px">${lbl}</div></div>`).join('');
const f = path.join(__dirname, '..', 'public', '_prims.html');
fs.writeFileSync(f, `<body style="background:#15110c;display:flex;flex-wrap:wrap;justify-content:center;padding:24px">${cells}</body>`);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.setViewportSize({ width: 700, height: 460 });
  await p.goto('file://' + f.replace(/\\/g, '/'));
  await p.waitForTimeout(500);
  await p.screenshot({ path: path.join(__dirname, '..', 'public', '_prims.png') });
  await b.close(); console.log('ok');
})().catch(e => { console.error(e.message); process.exit(1); });
