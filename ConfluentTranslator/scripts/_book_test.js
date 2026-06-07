// Test/capture du rendu livre MARKDOWN (dev only). node scripts/_book_test.js [theme]
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const { renderMarkdownBook } = require('../src/core/ecriture/bookMarkdown');
(async () => {
  const para = Array(8).fill('va naki vo ura mirak u').join(' ');
  const md = [
    '# va naki ura', '',
    'va **naki** vo ura *mirak* u. ' + para, '',
    '## vo va naki', '',
    '- ura mirak va', '- naki vo va ura', '',
    '> naki ura mirak va vo naki ura', '',
    '---', '',
    para,
  ].join('\n');
  const r = renderMarkdownBook(md, { theme: process.argv[2] || 'tablette', title: 'le livre de la foi' });
  if (r.erreur) { console.error('ERREUR', r.erreur); process.exit(1); }
  const f = path.join(__dirname, '..', 'public', '_book.html');
  fs.writeFileSync(f, r.html);
  const b = await chromium.launch(); const p = await b.newPage();
  await p.setViewportSize({ width: 880, height: 1240 });
  await p.goto('file://' + f.replace(/\\/g, '/'));
  await p.waitForTimeout(500);
  await p.screenshot({ path: path.join(__dirname, '..', 'public', '_book.png') });
  await b.close();
  console.log('ok');
})().catch(e => { console.error(e.message); process.exit(1); });
