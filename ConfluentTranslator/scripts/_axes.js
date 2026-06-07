// Démo des nouveaux axes de différenciation sur la base « bandes » (dev only).
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const { renderGlyph } = require('../src/core/ecriture/glyphRenderer');
const A = require('../data/glyphes-anciens.json').atomes;
const base = A.bandes;
const variants = [
  ['base', base, 16],
  ['épais', base, 26],
  ['courbe', base.map(e => e.length === 2 ? [e[0], e[1], 7] : e), 16],
  ['crochet', base.concat([['e', 'se']]), 16],
  ['boucle', base.concat([['se', 's', 7], ['s', 'se', -7]]), 16],
  ['barre', base.concat([['n', 's']]), 16],
];
const cells = variants.map(([lbl, ed, w], i) =>
  `<div style="text-align:center;margin:10px"><div>${renderGlyph(ed, 'ax' + i, 130, w)}</div><div style="color:#c9a86a;font-size:13px">${lbl}</div></div>`).join('');
const f = path.join(__dirname, '..', 'public', '_axes.html');
fs.writeFileSync(f, `<body style="background:#15110c;display:flex;flex-wrap:wrap;justify-content:center;padding:24px">${cells}</body>`);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.setViewportSize({ width: 950, height: 300 });
  await p.goto('file://' + f.replace(/\\/g, '/'));
  await p.waitForTimeout(500);
  await p.screenshot({ path: path.join(__dirname, '..', 'public', '_axes.png') });
  await b.close(); console.log('ok');
})().catch(e => { console.error(e.message); process.exit(1); });
