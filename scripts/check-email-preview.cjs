const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

async function main() {
  const input = process.argv[2];
  const kind = process.argv[3] || 'order';
  if (!input || !['order', 'shipping'].includes(kind)) throw new Error('Usage: node scripts/check-email-preview.cjs EXPORTED_SHOPIFY_PREVIEW.html [order|shipping]');
  const html = fs.readFileSync(input, 'utf8');
  assert.match(html, /ae-email-logo/);
  const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || (fs.existsSync(chrome) ? chrome : undefined) });
  try {
    for (const width of [320, 390, 600, 800]) {
      for (const imagesEnabled of [true, false]) {
        const context = await browser.newContext({ viewport: { width, height: 900 }, javaScriptEnabled: false });
        try {
          const page = await context.newPage();
          await page.route('**/*', route => {
            if (imagesEnabled && route.request().url().includes('autobahn-essentials-logo.png')) {
              return route.fulfill({ path: path.join(__dirname, '../assets/autobahn-essentials-logo.png'), contentType: 'image/png' });
            }
            return route.abort();
          });
          await page.setContent(html, { waitUntil: 'load' });
          const result = await page.evaluate(() => {
            const header = document.querySelector('.header');
            const primary = document.querySelector('.button__cell--primary, .main-action-cell .button__cell');
            const logo = document.querySelector('.ae-email-logo');
            return {
              width: innerWidth,
              scrollWidth: document.documentElement.scrollWidth,
              header: getComputedStyle(header).backgroundColor,
              primary: getComputedStyle(primary).backgroundColor,
              logoLoaded: logo.complete && logo.naturalWidth > 0,
              text: document.body.textContent,
              clippedText: Array.from(document.querySelectorAll('h1,h2,h3,h4,p,.button__text')).filter(el => el.scrollWidth > el.clientWidth + 1).map(el => el.textContent.trim())
            };
          });
          assert.ok(result.scrollWidth <= width + 1, `Document overflow at ${width}px`);
          assert.equal(result.header, 'rgb(21, 21, 21)');
          assert.equal(result.primary, 'rgb(197, 53, 32)');
          assert.equal(result.logoLoaded, imagesEnabled);
          assert.match(result.text, /Autobahn Essentials/);
          if (kind === 'shipping') {
            assert.match(result.text, /Items in this shipment/);
            assert.match(result.text, /tracking number/i);
          } else {
            assert.match(result.text, /Order summary/);
            assert.match(result.text, /Customer information/);
            assert.match(result.text, /Total/);
          }
          assert.deepEqual(result.clippedText, [], `Text clipping at ${width}px`);
          process.stdout.write(`PASS ${width}px, images ${imagesEnabled ? 'on' : 'blocked'}, no JavaScript\n`);
        } finally { await context.close(); }
      }
    }
  } finally { await browser.close(); }
}

main().catch(error => { process.stderr.write(`${error.stack}\n`); process.exitCode = 1; });
