const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const cf = process.argv[2]; // concept à capturer (ex: kanu)
  const b = await chromium.launch();
  const p = await b.newPage({ deviceScaleFactor: 3 });
  await p.goto('file:///' + path.join(__dirname, '..', 'public', 'glyphes-font.html').replace(/\\/g, '/'));
  await p.locator('#g-' + cf).screenshot({ path: path.join(__dirname, '..', 'public', '_one.png') });
  await b.close();
  console.log('shot ' + cf);
})();
