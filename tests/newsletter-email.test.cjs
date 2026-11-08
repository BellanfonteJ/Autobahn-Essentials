const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test, before, after } = require('node:test');
const { Liquid } = require('liquidjs');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'notifications/newsletter.liquid'), 'utf8');
const liquid = new Liquid({ strictFilters: true });
const fixture = {
  shop: { name: 'Autobahn Essentials', url: 'https://autobahnessentials.com', address: {
    address1: 'Example business address', address2: 'Suite 2', city: 'Example city', province: 'IL', zip: '00000', country: 'United States'
  } },
  email: { subject: 'The Autobahn Edit', preview_text: 'Parts for your next build.' },
  unsubscribe_link: '<a href="https://example.test/unsubscribe">Unsubscribe</a>',
  open_tracking_block: '<img src="https://example.test/pixel.gif" width="1" height="1" alt="">'
};

let browser;
before(async () => {
  const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || (fs.existsSync(chrome) ? chrome : undefined) });
});
after(async () => { await browser?.close(); });

test('newsletter has one native unsubscribe/tracking block and no campaign-specific offers', () => {
  liquid.parse(source);
  assert.equal((source.match(/{{\s*unsubscribe_link\s*}}/g) || []).length, 1);
  assert.equal((source.match(/{{\s*open_tracking_block\s*}}/g) || []).length, 1);
  assert.ok(Buffer.byteLength(source) < 50000);
  assert.doesNotMatch(source, /<script|<form|\/discount\/|\$\d|\b\d+%\b|30.day|customer\.(email|phone)/i);
  assert.doesNotMatch(source, /cdn\/shop\/t\//);
  assert.match(source, /shop\.address\.address1/);
  assert.match(source, /Confirm model year/);
});

test('newsletter escapes merchant text and keeps Shopify-provided opt-out markup intact', async () => {
  const html = await liquid.parseAndRender(source, { ...fixture, shop: { ...fixture.shop, name: '<script>alert(1)</script>' }, email: {
    subject: '<img src=x onerror=alert(1)>', preview_text: '<script>alert(2)</script>'
  } });
  assert.doesNotMatch(html, /<script|<img src=x/);
  assert.match(html, /&lt;script&gt;/);
  assert.equal((html.match(/href="https:\/\/example.test\/unsubscribe"/g) || []).length, 1);
  const fallback = await liquid.parseAndRender(source, { ...fixture, email: {}, shop: { ...fixture.shop, url: undefined } });
  assert.match(fallback, /The Autobahn Edit \| Autobahn Essentials/);
  assert.match(fallback, /href="https:\/\/autobahnessentials.com\/collections\/all"/);
});

test('newsletter fits phone/desktop widths with images enabled or blocked and no scripts', async () => {
  const html = await liquid.parseAndRender(source, fixture);
  for (const width of [320, 390, 600, 800]) {
    for (const imagesEnabled of [true, false]) {
      const context = await browser.newContext({ viewport: { width, height: 1000 }, javaScriptEnabled: false });
      try {
        const page = await context.newPage();
        await page.route('**/*', route => imagesEnabled && route.request().url().includes('autobahn-essentials-logo.png')
          ? route.fulfill({ path: path.join(root, 'assets/autobahn-essentials-logo.png'), contentType: 'image/png' })
          : route.abort());
        await page.setContent(html, { waitUntil: 'load' });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `${width}px document`);
        assert.deepEqual(await page.locator('h1,h2,p,a').evaluateAll(nodes => nodes.filter(n => n.scrollWidth > n.clientWidth + 1).map(n => n.textContent.trim())), [], `${width}px text`);
        assert.equal(await page.getByRole('link', { name: 'Unsubscribe', exact: true }).isVisible(), true);
        assert.equal(await page.locator('.ae-newsletter-logo').evaluate(n => n.complete && n.naturalWidth > 0), imagesEnabled);
        for (const href of ['/collections/all', '/collections/bmw', '/collections/audi', '/collections/vw', '/pages/contact', '/products/135i-5-intercooler-fmic']) {
          assert.ok(await page.locator(`a[href="https://autobahnessentials.com${href}"]`).count() > 0, href);
        }
        const primary = page.locator('.ae-newsletter-cta');
        const bounds = await primary.boundingBox();
        assert.ok(bounds.height >= 44 && bounds.width <= width);
        if (width < 600) {
          const image = await page.locator('.ae-newsletter-product').boundingBox();
          const copy = await page.locator('.spotlight-copy').boundingBox();
          assert.ok(copy.y >= image.y + image.height);
        }
      } finally { await context.close(); }
    }
  }
});
