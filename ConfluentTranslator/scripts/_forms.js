// Mock direction "formes claires" (tifinagh-like) dans le rendu argile (dev only).
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const { renderGlyph } = require('../src/core/ecriture/glyphRenderer');
const forms = [
  ['cercle', [['n', 'e', 9], ['e', 's', 9], ['s', 'w', 9], ['w', 'n', 9]]],
  ['carré', [['nw', 'ne'], ['ne', 'se'], ['se', 'sw'], ['sw', 'nw']]],
  ['triangle', [['n', 'sw'], ['sw', 'se'], ['se', 'n']]],
  ['losange', [['n', 'e'], ['e', 's'], ['s', 'w'], ['w', 'n']]],
  ['croix +', [['w', 'e'], ['n', 's']]],
  ['chevron', [['sw', 'n'], ['n', 'se']]],
  ['demi-cercle', [['n', 's', 14]]],
  ['cercle+point', [['n', 'e', 9], ['e', 's', 9], ['s', 'w', 9], ['w', 'n', 9], ['c', 'c']]],
  ['carré+barre', [['nw', 'ne'], ['ne', 'se'], ['se', 'sw'], ['sw', 'nw'], ['n', 's']]],
  ['triangle+point', [['n', 'sw'], ['sw', 'se'], ['se', 'n'], ['c', 'c']]],
];
const cells = forms.map(([lbl, ed], i) =>
  `<div style="text-align:center;margin:10px"><div>${renderGlyph(ed, 'fm' + i, 130)}</div><div style="color:#c9a86a;font-size:13px">${lbl}</div></div>`).join('');
const f = path.join(__dirname, '..', 'public', '_forms.html');
fs.writeFileSync(f, `<body style="background:#15110c;display:flex;flex-wrap:wrap;justify-content:center;padding:24px">${cells}</body>`);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.setViewportSize({ width: 950, height: 560 });
  await p.goto('file://' + f.replace(/\\/g, '/'));
  await p.waitForTimeout(500);
  await p.screenshot({ path: path.join(__dirname, '..', 'public', '_forms.png') });
  await b.close(); console.log('ok');
})().catch(e => { console.error(e.message); process.exit(1); });
