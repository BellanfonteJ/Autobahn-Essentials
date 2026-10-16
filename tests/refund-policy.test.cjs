const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test, before, after } = require('node:test');
const { chromium } = require('playwright');
const { root, mount } = require('./helpers/theme.cjs');

let browser;
before(async () => {
  const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || (fs.existsSync(chrome) ? chrome : undefined) });
});
after(async () => { await browser?.close(); });

const body = '<p>Merchant-authored return terms. <a href="mailto:orders@example.test">Email our team</a>.</p><h2><br></h2><p><strong>Damages and issues</strong><br>Keep the original packaging.</p><h2>Refund review</h2><p>Refunds require review. Existing fees and legal exceptions remain unchanged.</p><ul><li><p>Receipt or order confirmation</p></li><li><p>Original accessories</p></li></ul><h3>Questions</h3><p><a href="/pages/contact">Contact support</a>.</p>';
async function withPolicy(options, check) {
  const session = await browser.newContext({ viewport: options.viewport || { width: 1440, height: 1000 }, reducedMotion: 'reduce', javaScriptEnabled: options.javaScriptEnabled ?? true });
  try {
    const page = await session.newPage();
    const errors = await mount(page, { template: 'policy', pageTitle: 'Refund policy', canonicalUrl: 'http://theme.test/policies/refund-policy', request: { path: '/policies/refund-policy' }, policy: { title: 'Refund policy', body }, ...options });
    await check(page);
    assert.deepEqual(errors, []);
  } finally { await session.close(); }
}

test('native refund policy gets the contact-style title, reading layout and sidebar at mobile/desktop widths', async () => {
  for (const width of [320, 390, 768, 920, 1024, 1440]) {
    for (const javaScriptEnabled of [true, false]) {
      await withPolicy({ viewport: { width, height: 900 }, javaScriptEnabled }, async page => {
        // The fixture's native policy CSS loads later; scoped styles must still win.
        assert.equal(await page.locator('.ae-refund-policy-page').count(), 1);
        assert.equal(await page.locator('main h1').textContent(), 'Refund policy');
        assert.equal(await page.locator('.shopify-policy__title').evaluate(node => getComputedStyle(node).textAlign), 'left');
        assert.equal(await page.locator('.shopify-policy__title h1').evaluate(node => getComputedStyle(node).fontSize), width <= 640 ? '32px' : '40px');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        for (const selector of ['.shopify-policy__title', '.shopify-policy__body', '.ae-refund-policy-support']) {
          assert.equal(await page.locator(selector).evaluate(node => node.scrollWidth <= node.clientWidth + 1), true, `${selector} at ${width}px`);
        }
        const title = await page.locator('.shopify-policy__title').boundingBox();
        const reading = await page.locator('.shopify-policy__body').boundingBox();
        const support = await page.locator('.ae-refund-policy-support').boundingBox();
        assert.ok(title.width >= reading.width);
        assert.ok(width > 900 ? support.x >= reading.x + reading.width : support.y >= reading.y + reading.height);
        assert.ok(reading.y < 620);
        if (process.env.THEME_SCREENSHOTS && javaScriptEnabled) {
          fs.mkdirSync(path.join(root, '.tools/screenshots'), { recursive: true });
          await page.screenshot({ path: path.join(root, `.tools/screenshots/refund-policy-${width}.png`), fullPage: true });
        }
      });
    }
  }
});

test('refund policy styling preserves all native wording, order, headings and links with or without JavaScript', async () => {
  for (const javaScriptEnabled of [true, false]) {
    await withPolicy({ javaScriptEnabled }, async page => {
      const unchanged = await page.locator('.shopify-policy__body .rte').evaluate((node, source) => {
        const original = new DOMParser().parseFromString(source, 'text/html').body;
        const links = root => Array.from(root.querySelectorAll('a')).map(a => [a.textContent, a.getAttribute('href')]);
        return node.textContent === original.textContent && JSON.stringify(links(node)) === JSON.stringify(links(original));
      }, body);
      assert.equal(unchanged, true);
      assert.equal(await page.locator('.shopify-policy__body h2').count(), 2);
      assert.equal(await page.locator('.shopify-policy__body h2[hidden]').count(), javaScriptEnabled ? 1 : 0);
      assert.equal(await page.locator('.shopify-policy__body h2').last().isVisible(), true);
      assert.equal(await page.locator('.ae-refund-policy-page form').count(), 0, 'Do not replace the policy with a request form');
    });
  }
});

test('only the refund-policy route is enhanced, including localized policy paths', async () => {
  for (const policyPath of ['/policies/refund-policy', '/fr/policies/refund-policy', '/policies/privacy-policy', '/policies/shipping-policy', '/pages/refund-policy', '/policies/refund-policy-copy']) {
    await withPolicy({ request: { path: policyPath }, routes: { root_url: '/fr/' } }, async page => {
      const expected = ['/policies/refund-policy', '/fr/policies/refund-policy'].includes(policyPath);
      assert.equal(await page.locator('.ae-refund-policy-page').count(), expected ? 1 : 0, policyPath);
      const styledPolicy = expected || policyPath === '/policies/shipping-policy';
      assert.equal(await page.locator('.shopify-policy__body h2[hidden]').count(), styledPolicy ? 1 : 0, policyPath);
      if (expected) assert.equal(await page.locator('[aria-label="Breadcrumbs"] a').getAttribute('href'), '/fr/');
    });
  }
});

test('refund support uses the actual email and supplied localized URLs without linking to a missing returns page', async () => {
  await withPolicy({ shop: { email: 'orders@example.test', shipping_policy: { url: '/fr/policies/shipping-policy' } }, pages: { contact: { url: '/fr/pages/contact' }, returns: { url: '/fr/pages/returns' } } }, async page => {
    assert.equal(await page.locator('.ae-refund-policy-support a[href^="mailto:"]').getAttribute('href'), 'mailto:orders@example.test');
    assert.deepEqual(await page.locator('[aria-label="Refund policy resources"] a').evaluateAll(nodes => nodes.map(n => n.getAttribute('href'))), ['/fr/pages/returns', '/fr/pages/contact', '/fr/policies/shipping-policy']);
    await page.locator('.ae-refund-policy-support a[href^="mailto:"]').press('Tab');
    assert.equal(await page.locator('[aria-label="Refund policy resources"] a').first().evaluate(node => document.activeElement === node), true);
  });
  await withPolicy({ shop: { email: '' } }, async page => {
    assert.equal(await page.locator('[aria-label="Refund policy resources"]').count(), 0);
    assert.equal(await page.locator('.ae-refund-policy-support a').count(), 0);
  });
});

test('refund policy handles long content/media and never hides real headings or linked/media headings', async () => {
  const mediaBody = `<h2>Real heading<br></h2><h2><a id="policy-anchor"></a></h2><h2><img src="/assets/brand-bmw-m4.jpg" width="1600" height="900" alt="Policy illustration"></h2><p>${'LongMerchantReference'.repeat(20)}</p><table style="width:1600px"><tr><th>Condition</th><th>Merchant terms</th></tr><tr><td style="min-width:800px">Review</td><td>Unchanged terms</td></tr></table>`;
  await withPolicy({ viewport: { width: 320, height: 900 }, policy: { title: 'Merchant returns and refund policy for European performance parts', body: mediaBody } }, async page => {
    assert.equal(await page.locator('.shopify-policy__body h2[hidden]').count(), 0);
    assert.equal(await page.locator('#policy-anchor').count(), 1);
    assert.equal(await page.locator('.shopify-policy__body img').isVisible(), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.equal(await page.locator('.shopify-policy__body table').evaluate(node => node.scrollWidth > node.clientWidth), true);
  });
});
