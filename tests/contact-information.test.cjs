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

const body = '<p>Merchant business name</p><p>Phone number: +1(202)555-0123</p><p>Email: orders@example.test</p>';
async function withPolicy(options, check) {
  const session = await browser.newContext({ viewport: options.viewport || { width: 1440, height: 1000 }, reducedMotion: 'reduce', javaScriptEnabled: options.javaScriptEnabled ?? true });
  try {
    const page = await session.newPage();
    const errors = await mount(page, { template: 'policy', pageTitle: 'Contact information', request: { path: '/policies/contact-information' }, policy: { title: 'Contact information', body }, ...options });
    await check(page);
    assert.deepEqual(errors, []);
  } finally { await session.close(); }
}

test('native contact information has a bounded support layout at phone, tablet and desktop widths with and without JavaScript', async () => {
  for (const width of [320, 390, 768, 920, 1440]) {
    for (const javaScriptEnabled of [true, false]) {
      await withPolicy({ viewport: { width, height: 900 }, javaScriptEnabled }, async page => {
        assert.equal(await page.locator('.ae-contact-policy-page').count(), 1);
        assert.equal(await page.locator('main h1').textContent(), 'Contact information');
        assert.equal(await page.locator('.shopify-policy__title').evaluate(node => getComputedStyle(node).textAlign), 'left');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        const reading = await page.locator('.shopify-policy__body').boundingBox();
        const support = await page.locator('.ae-policy-support').boundingBox();
        assert.ok(width > 900 ? support.x >= reading.x + reading.width : support.y >= reading.y + reading.height);
        if (process.env.THEME_SCREENSHOTS && javaScriptEnabled) {
          fs.mkdirSync(path.join(root, '.tools/screenshots'), { recursive: true });
          await page.screenshot({ path: path.join(root, `.tools/screenshots/contact-information-${width}.png`), fullPage: true });
        }
      });
    }
  }
});

test('contact enhancement preserves native business details, extra fields and existing links without inventing contact claims', async () => {
  const original = `${body}<p>Registered address: Existing merchant address</p><p>Registration: EXAMPLE123</p><p><a href="/pages/about">Merchant information</a></p>`;
  for (const javaScriptEnabled of [true, false]) {
    await withPolicy({ javaScriptEnabled, policy: { title: 'Contact information', body: original } }, async page => {
      assert.equal(await page.locator('.shopify-policy__body .rte').evaluate((node, source) => node.textContent === new DOMParser().parseFromString(source, 'text/html').body.textContent, original), true);
      assert.equal(await page.locator('.shopify-policy__body a[href="/pages/about"]').textContent(), 'Merchant information');
      assert.equal(await page.locator('.ae-contact-policy-page form').count(), 0);
      assert.doesNotMatch(await page.locator('.ae-policy-support').innerText(), /24 hours|business hours|guaranteed|registered address/i);
      if (!javaScriptEnabled) {
        assert.equal(await page.locator('.shopify-policy__body .rte').innerHTML(), original);
        assert.equal(await page.locator('.shopify-policy__body a[href^="tel:"]').count(), 0);
      }
    });
  }
});

test('published phone and email become safe tappable links without duplicating anchors or changing unrelated text', async () => {
  const original = `${body}<p><a href="mailto:linked@example.test">linked@example.test</a></p><p>Telephone: +44 (20) 7946 0123</p><p>Phone number: 202-555-0123 ext 9</p><p>Phone number: 123</p><pre>code@example.test</pre><p>Unknown: not-an-email</p>`;
  await withPolicy({ policy: { title: 'Contact information', body: original } }, async page => {
    const content = page.locator('.shopify-policy__body');
    assert.equal(await content.locator('a[href="tel:+12025550123"]').textContent(), '+1(202)555-0123');
    assert.equal(await content.locator('a[href="tel:+442079460123"]').textContent(), '+44 (20) 7946 0123');
    assert.equal(await content.locator('a[href="mailto:orders@example.test"]').count(), 1);
    assert.equal(await content.locator('a[href="mailto:linked@example.test"]').count(), 1);
    assert.equal(await content.locator('a a, pre a, a[href="tel:123"], a[href="tel:20255501239"]').count(), 0);
    assert.equal(await content.evaluate((node, source) => node.textContent === new DOMParser().parseFromString(source, 'text/html').body.textContent, `<div class="rte">${original}</div>`), true);
    for (const link of await content.locator('a[href^="tel:"], a[href^="mailto:"]').all()) {
      assert.ok(await link.evaluate(node => node.getBoundingClientRect().height) >= 44);
    }
  });
});

test('contact styling and link enhancement are scoped to the exact localized native policy route', async () => {
  for (const policyPath of ['/policies/contact-information', '/fr/policies/contact-information', '/policies/contact-information/', '/pages/contact-information', '/policies/contact-information-copy', '/policies/shipping-policy', '/policies/refund-policy', '/policies/privacy-policy']) {
    await withPolicy({ request: { path: policyPath }, routes: { root_url: '/fr/' } }, async page => {
      const expected = ['/policies/contact-information', '/fr/policies/contact-information', '/policies/contact-information/'].includes(policyPath);
      assert.equal(await page.locator('.ae-contact-policy-page').count(), expected ? 1 : 0, policyPath);
      assert.equal(await page.locator('script[src*="contact-information.js"]').count(), expected ? 1 : 0);
      assert.equal(await page.locator('.shopify-policy__body a[href^="tel:"]').count(), expected ? 1 : 0);
      if (expected) assert.equal(await page.locator('[aria-label="Breadcrumbs"] a').getAttribute('href'), '/fr/');
    });
  }
});

test('contact resources use actual localized URLs, omit missing pages and fit long merchant details', async () => {
  await withPolicy({ pages: { contact: { url: '/fr/pages/contact' }, returns: { url: '/fr/pages/returns' } }, shop: { shipping_policy: { url: '/fr/policies/shipping-policy' }, refund_policy: { url: '/fr/policies/refund-policy' } } }, async page => {
    assert.equal(await page.locator('.ae-contact-policy-message').getAttribute('href'), '/fr/pages/contact');
    assert.deepEqual(await page.locator('[aria-label="Contact information resources"] a').evaluateAll(nodes => nodes.map(node => node.getAttribute('href'))), ['/fr/policies/shipping-policy', '/fr/pages/returns', '/fr/policies/refund-policy']);
    await page.locator('.shopify-policy__body a[href^="tel:"]').press('Tab');
    assert.equal(await page.locator('.shopify-policy__body a[href^="mailto:"]').evaluate(node => node === document.activeElement), true);
  });
  await withPolicy({}, async page => {
    assert.equal(await page.locator('.ae-contact-policy-message, [aria-label="Contact information resources"]').count(), 0);
  });
  await withPolicy({ viewport: { width: 320, height: 900 }, policy: { title: 'Contact information and registered business details for your order', body: `<p>${'MerchantBusiness'.repeat(15)}</p><p>Email: ${'support'.repeat(15)}@example.test</p><p>Registration: ${'REFERENCE'.repeat(25)}</p><table style="width:1600px"><tr><th>Details</th><td style="min-width:800px">Merchant information</td></tr></table>` } }, async page => {
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.equal(await page.locator('.shopify-policy__body table').evaluate(node => node.scrollWidth > node.clientWidth), true);
  });
});

test('contact polish gives standalone details separate labels and decorative icons without changing native text', async () => {
  for (const javaScriptEnabled of [true, false]) {
    await withPolicy({ javaScriptEnabled }, async page => {
      assert.equal(await page.locator('main h1').evaluate(node => getComputedStyle(node).textTransform), 'capitalize');
      assert.equal(await page.locator('.ae-policy-support h2').first().textContent(), 'Need help?');
      assert.equal(await page.locator('.shopify-policy__body .rte').evaluate((node, source) => node.textContent === new DOMParser().parseFromString(source, 'text/html').body.textContent, body), true);
      assert.equal(await page.locator('.ae-contact-policy-label').count(), javaScriptEnabled ? 2 : 0);
      if (!javaScriptEnabled) return;
      for (const row of await page.locator('.ae-contact-policy-detail').all()) {
        const label = row.locator('.ae-contact-policy-label');
        const value = row.locator('a');
        const bounds = await label.boundingBox();
        const target = await value.boundingBox();
        assert.ok(target.y >= bounds.y + bounds.height);
        assert.equal(await label.locator('svg[aria-hidden="true"]').count(), 1);
        assert.ok(target.height >= 44);
      }
    });
  }
});

test('contact row polish preserves existing links and leaves mixed rich content and unlabeled values alone', async () => {
  const original = '<p>Merchant</p><p>Phone: <a href="tel:+12025550123" class="existing">+1 202 555 0123</a></p><p>Email: <a href="mailto:orders@example.test">orders@example.test</a></p><p><strong>Email:</strong> rich@example.test</p><p>For help email extra@example.test or call us.</p><p>plain@example.test</p>';
  await withPolicy({ policy: { title: 'Contact information', body: original } }, async page => {
    const content = page.locator('.shopify-policy__body');
    assert.equal(await content.locator('.ae-contact-policy-detail').count(), 2);
    assert.equal(await content.locator('a.existing[href="tel:+12025550123"]').count(), 1);
    assert.equal(await content.locator('a a').count(), 0);
    assert.equal(await content.locator('strong').textContent(), 'Email:');
    assert.equal(await content.locator('.rte').evaluate((node, source) => node.textContent === new DOMParser().parseFromString(source, 'text/html').body.textContent, original), true);
    await page.addScriptTag({ content: fs.readFileSync(path.join(root, 'assets/contact-information.js'), 'utf8') });
    assert.equal(await content.locator('.ae-contact-policy-label').count(), 2);
    assert.equal(await content.locator('.ae-contact-policy-label svg').count(), 2);
  });
});

test('compact phone spacing keeps the message action earlier while policy resources remain secondary and keyboard accessible', async () => {
  for (const width of [320, 390, 640, 920, 1440]) {
    await withPolicy({ viewport: { width, height: 844 }, pages: { contact: { url: '/pages/contact' }, returns: { url: '/pages/returns' } }, shop: { shipping_policy: { url: '/policies/shipping-policy' } } }, async page => {
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      const message = page.locator('.ae-contact-policy-message');
      const resources = page.locator('[aria-label="Contact information resources"]');
      assert.ok((await message.boundingBox()).y < (await resources.boundingBox()).y);
      if (width === 390) assert.ok((await message.boundingBox()).y < 650);
      assert.equal(await resources.locator('a').first().evaluate(node => getComputedStyle(node).fontSize), '13px');
      for (const anchor of await page.locator('.ae-policy-support a').all()) {
        assert.ok((await anchor.boundingBox()).height >= 44);
      }
      await page.locator('.shopify-policy__body a[href^="mailto:"]').press('Tab');
      assert.equal(await message.evaluate(node => node === document.activeElement), true);
      if (process.env.THEME_SCREENSHOTS) {
        await page.screenshot({ path: path.join(root, `.tools/screenshots/contact-information-polish-${width}.png`), fullPage: true });
      }
    });
  }
});
