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

const body = '<p><strong>Merchant shipping policy</strong></p><p>Existing merchant introduction.</p><h2><br></h2><h3><strong>Processing time</strong></h3><ul><li>Orders are processed within <strong>1-3 business days</strong> after payment.</li></ul><h3>Delivery</h3><p>Standard delivery typically takes <strong>5-10 business days</strong>.</p><h3>Shipping costs</h3><p>Costs are calculated at checkout. Existing duties and exceptions remain unchanged.</p><h3>Damaged shipments</h3><p>Contact support within <strong>48 hours</strong> of the expected delivery date.</p><p><a href="mailto:orders@example.test">Email</a> or <a href="/pages/contact">contact support</a>.</p>';
async function withPolicy(options, check) {
  const session = await browser.newContext({ viewport: options.viewport || { width: 1440, height: 1000 }, reducedMotion: 'reduce', javaScriptEnabled: options.javaScriptEnabled ?? true });
  try {
    const page = await session.newPage();
    const errors = await mount(page, { template: 'policy', pageTitle: 'Shipping policy', canonicalUrl: 'http://theme.test/policies/shipping-policy', request: { path: '/policies/shipping-policy' }, policy: { title: 'Shipping policy', body }, ...options });
    await check(page);
    assert.deepEqual(errors, []);
  } finally { await session.close(); }
}

test('shipping policy uses the shared support layout at phone, tablet and desktop widths with or without JavaScript', async () => {
  for (const width of [320, 390, 768, 920, 1440]) {
    for (const javaScriptEnabled of [true, false]) {
      await withPolicy({ viewport: { width, height: 900 }, javaScriptEnabled }, async page => {
        assert.equal(await page.locator('.ae-shipping-policy-page').count(), 1);
        assert.equal(await page.locator('main h1').textContent(), 'Shipping policy');
        assert.equal(await page.locator('.shopify-policy__title').evaluate(node => getComputedStyle(node).textAlign), 'left');
        assert.equal(await page.locator('main h1').evaluate(node => getComputedStyle(node).fontSize), width <= 640 ? '32px' : '40px');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        for (const selector of ['.shopify-policy__title', '.shopify-policy__body', '.ae-policy-support']) {
          assert.equal(await page.locator(selector).evaluate(node => node.scrollWidth <= node.clientWidth + 1), true, `${selector} at ${width}px`);
        }
        const reading = await page.locator('.shopify-policy__body').boundingBox();
        const support = await page.locator('.ae-policy-support').boundingBox();
        assert.ok(width > 900 ? support.x >= reading.x + reading.width : support.y >= reading.y + reading.height);
        assert.ok(reading.y < 620);
        if (process.env.THEME_SCREENSHOTS && javaScriptEnabled) {
          fs.mkdirSync(path.join(root, '.tools/screenshots'), { recursive: true });
          await page.screenshot({ path: path.join(root, `.tools/screenshots/shipping-policy-${width}.png`), fullPage: true });
        }
      });
    }
  }
});

test('shipping presentation preserves every native term, link and content element rather than rewriting the policy', async () => {
  for (const javaScriptEnabled of [true, false]) {
    await withPolicy({ javaScriptEnabled }, async page => {
      assert.equal(await page.locator('.shopify-policy__body .rte').evaluate((node, source) => {
        const copy = node.cloneNode(true);
        copy.querySelectorAll('[hidden]').forEach(n => n.removeAttribute('hidden'));
        const original = new DOMParser().parseFromString(source, 'text/html').body;
        return copy.innerHTML === original.innerHTML;
      }, body), true);
      assert.equal(await page.locator('.shopify-policy__body h2[hidden]').count(), javaScriptEnabled ? 1 : 0);
      assert.equal(await page.locator('.ae-shipping-policy-page form').count(), 0);
      assert.doesNotMatch(await page.locator('.ae-policy-support').innerText(), /1-3|5-10|48 hours|guaranteed|free shipping/i);
    });
  }
});

test('shipping styling is limited to the native shipping route including localized paths', async () => {
  for (const policyPath of ['/policies/shipping-policy', '/fr/policies/shipping-policy', '/policies/shipping-policy/', '/pages/shipping-policy', '/policies/shipping-policy-copy', '/policies/privacy-policy', '/policies/refund-policy']) {
    await withPolicy({ request: { path: policyPath }, routes: { root_url: '/fr/' } }, async page => {
      const expected = ['/policies/shipping-policy', '/fr/policies/shipping-policy', '/policies/shipping-policy/'].includes(policyPath);
      assert.equal(await page.locator('.ae-shipping-policy-page').count(), expected ? 1 : 0, policyPath);
      if (expected) assert.equal(await page.locator('[aria-label="Breadcrumbs"] a').getAttribute('href'), '/fr/');
      if (policyPath === '/policies/privacy-policy') assert.equal(await page.locator('.ae-policy-page').count(), 0);
      if (policyPath === '/policies/refund-policy') assert.equal(await page.locator('.ae-refund-policy-page').count(), 1);
    });
  }
});

test('shipping support uses supplied email and localized resources and omits missing links', async () => {
  await withPolicy({ shop: { email: 'orders@example.test', refund_policy: { url: '/fr/policies/refund-policy' } }, pages: { contact: { url: '/fr/pages/contact' }, returns: { url: '/fr/pages/returns' } } }, async page => {
    const email = page.locator('.ae-policy-support a[href^="mailto:"]');
    assert.equal(await email.getAttribute('href'), 'mailto:orders@example.test');
    assert.deepEqual(await page.locator('[aria-label="Shipping policy resources"] a').evaluateAll(nodes => nodes.map(node => node.getAttribute('href'))), ['/fr/pages/contact', '/fr/pages/returns', '/fr/policies/refund-policy']);
    await email.press('Tab');
    assert.equal(await page.locator('[aria-label="Shipping policy resources"] a').first().evaluate(node => node === document.activeElement), true);
  });
  await withPolicy({ shop: { email: '', refund_policy: null } }, async page => {
    assert.equal(await page.locator('.ae-policy-support a').count(), 0);
    assert.equal(await page.locator('[aria-label="Shipping policy resources"]').count(), 0);
  });
});

test('shipping policy contains long references, headings and tables without hiding meaningful content', async () => {
  const mediaBody = `<h2>Real heading<br></h2><h2><a id="shipping-anchor"></a></h2><h2><img src="/assets/brand-bmw-m4.jpg" width="1600" height="900" alt="Shipping illustration"></h2><p>${'MerchantShipmentReference'.repeat(20)}</p><table style="width:1600px"><tr><th>Destination</th><th>Terms</th></tr><tr><td style="min-width:800px">Existing region</td><td>Merchant terms</td></tr></table>`;
  await withPolicy({ viewport: { width: 320, height: 900 }, shop: { email: `${'support'.repeat(15)}@example.test` }, policy: { title: 'Shipping and delivery policy for your European performance parts order', body: mediaBody } }, async page => {
    assert.equal(await page.locator('.shopify-policy__body h2[hidden]').count(), 0);
    assert.equal(await page.locator('#shipping-anchor').count(), 1);
    assert.equal(await page.locator('.shopify-policy__body img').isVisible(), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.equal(await page.locator('.shopify-policy__body table').evaluate(node => node.scrollWidth > node.clientWidth), true);
  });
});
