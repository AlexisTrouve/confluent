const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 900, height: 700 }, deviceScaleFactor: 2 });
  await p.goto('file:///' + path.join(__dirname, '..', 'public', 'glyphes-font.html').replace(/\\/g, '/'));
  await p.screenshot({ path: path.join(__dirname, '..', 'public', '_shot.png'), fullPage: true });
  await b.close();
  console.log('shot ok');
})();
