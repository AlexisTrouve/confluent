// Capture des glyphes-nombres (dev only). node scripts/_nums.js
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const { GLYPHS, resolveEdges, renderGlyph } = require('../src/core/ecriture/glyphRenderer');
(async () => {
  const order = ['zaro', 'iko', 'diku', 'tiru', 'katu', 'penu', 'seku', 'sivu', 'oktu', 'novu', 'deku', 'levu', 'tolu'];
  const cells = order.map((k, i) => `<div style="text-align:center;margin:10px"><div>${renderGlyph(resolveEdges(GLYPHS[k]), 'n' + i, 110)}</div><div style="color:#c9a86a;font-size:13px">${i} · ${k}</div></div>`).join('');
  const html = `<body style="background:#15110c;display:flex;flex-wrap:wrap;justify-content:center;padding:20px">${cells}</body>`;
  const f = path.join(__dirname, '..', 'public', '_nums.html');
  fs.writeFileSync(f, html);
  const b = await chromium.launch(); const p = await b.newPage();
  await p.setViewportSize({ width: 900, height: 320 });
  await p.goto('file://' + f.replace(/\\/g, '/'));
  await p.waitForTimeout(400);
  await p.screenshot({ path: path.join(__dirname, '..', 'public', '_nums.png') });
  await b.close(); console.log('ok');
})().catch(e => { console.error(e.message); process.exit(1); });
