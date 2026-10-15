const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test, before, after } = require('node:test');
const { chromium } = require('playwright');
const { root, mount, context, renderSection } = require('./helpers/theme.cjs');

let browser;
before(async () => {
  const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || (fs.existsSync(chrome) ? chrome : undefined) });
});
after(async () => { await browser?.close(); });

const formId = 'ReturnRequest-page-returns-autobahn';
async function withPage(options, check) {
  const session = await browser.newContext({ viewport: options.viewport || { width: 1440, height: 1000 }, reducedMotion: options.reducedMotion || 'reduce', javaScriptEnabled: options.javaScriptEnabled ?? true });
  try {
    const page = await session.newPage();
    const errors = await mount(page, { template: 'returns', page: { handle: 'returns', title: 'Returns & Refunds' }, ...options });
    await check(page, page.locator('.ae-returns-page form'));
    assert.deepEqual(errors, []);
  } finally { await session.close(); }
}

test('returns page has a 14-day request window, bounded responsive form and working native FAQs without JavaScript', async () => {
  for (const width of [320, 390, 768, 920, 1440]) {
    for (const javaScriptEnabled of [true, false]) {
      await withPage({ viewport: { width, height: 900 }, javaScriptEnabled }, async (page, form) => {
        assert.equal(await page.locator('main h1').textContent(), 'Returns & Refunds');
        assert.match(await page.locator('.ae-returns-window').textContent(), /14 days of delivery/);
        assert.equal(await page.locator('.ae-returns-page .ae-card, .ae-page-hero, input[type="file"]').count(), 0);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        assert.ok((await form.locator('[name="contact[email]"]').boundingBox()).y < 660);
        assert.deepEqual(await page.locator('.ae-returns-page label').evaluateAll(nodes => nodes.filter(node => {
          const input = document.getElementById(node.htmlFor);
          return !input || node.getBoundingClientRect().bottom > input.getBoundingClientRect().top;
        }).map(node => node.htmlFor)), []);
        assert.deepEqual(await page.locator('.ae-returns-page .ae-contact-field, .ae-contact-details, .ae-returns-faq').evaluateAll(nodes => nodes.filter(node => node.scrollWidth > node.clientWidth + 1).map(node => node.className)), []);
        const faq = page.locator('.ae-returns-faq details').nth(1);
        await faq.locator('summary').click();
        assert.equal(await faq.locator('p').isVisible(), true);
        assert.match(await faq.textContent(), /If approved/);
        if (process.env.THEME_SCREENSHOTS && javaScriptEnabled) {
          fs.mkdirSync(path.join(root, '.tools/screenshots'), { recursive: true });
          await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
          await page.screenshot({ path: path.join(root, `.tools/screenshots/returns-${width}.png`), fullPage: true });
        }
      });
    }
  }
});

test('return requests use native validation and a normal document POST without approval, file-upload or refund automation', async () => {
  for (const javaScriptEnabled of [true, false]) {
    await withPage({ javaScriptEnabled }, async (page, form) => {
      assert.equal(await form.getAttribute('method'), 'post');
      assert.equal(await form.getAttribute('action'), '/contact');
      assert.equal(await form.getAttribute('novalidate'), null);
      const posts = [];
      await page.route('http://theme.test/contact', async route => {
        posts.push({ method: route.request().method(), type: route.request().resourceType(), data: route.request().postData() });
        await route.fulfill({ contentType: 'text/html', body: '<h1>Local return request fixture</h1>' });
      });
      await form.getByRole('button', { name: 'Send return request' }).click();
      assert.equal(posts.length, 0);
      await form.locator('[name="contact[email]"]').fill('returns@example.test');
      await form.locator('[name="contact[order_number]"]').fill('AE-1001');
      await form.locator('[name="contact[items]"]').fill('Charge pipe, quantity 1');
      await form.locator('[name="contact[body]"]').fill('Uninstalled. Requesting review only.');
      await form.getByRole('button', { name: 'Send return request' }).click();
      assert.equal(posts.length, 0, 'A return reason is required');
      await form.locator('[name="contact[reason]"]').selectOption('Fitment concern');
      await form.getByRole('button', { name: 'Send return request' }).click();
      await page.waitForURL('http://theme.test/contact');
      assert.equal(posts.length, 1);
      assert.equal(posts[0].method, 'POST');
      assert.equal(posts[0].type, 'document');
      const fields = new URLSearchParams(posts[0].data);
      assert.equal(fields.get('contact[topic]'), 'Return request');
      assert.equal(fields.get('contact[order_number]'), 'AE-1001');
      assert.equal(fields.get('contact[reason]'), 'Fitment concern');
      assert.equal(fields.get('contact[items]'), 'Charge pipe, quantity 1');
      assert.equal(fields.get('contact[body]'), 'Uninstalled. Requesting review only.');
    });
  }
});

test('return feedback distinguishes a sent request from approval and safely retains fixture field values', async () => {
  await withPage({ formStates: { [formId]: { 'posted_successfully?': true } } }, async (page, form) => {
    assert.match(await form.getByRole('status').textContent(), /not return approval/);
    assert.match(await form.getByRole('status').textContent(), /wait for instructions/);
  });
  const hostile = '</textarea><img src=x onerror="window.injected=true">';
  await withPage({ formStates: { [formId]: { errors: ['email'], email: 'invalid', order_number: 'AE-"1001"', items: 'BMW & Audi parts', reason: 'Incorrect item received', body: hostile } } }, async (page, form) => {
    assert.equal(await form.locator('[name="contact[body]"]').inputValue(), hostile);
    assert.equal(await form.locator('[name="contact[items]"]').inputValue(), 'BMW & Audi parts');
    assert.equal(await form.locator('[name="contact[reason]"]').inputValue(), 'Incorrect item received');
    assert.equal(await form.locator('[name="contact[order_number]"]').inputValue(), 'AE-"1001"');
    assert.equal(await page.locator('img[src="x"]').count(), 0);
    assert.equal(await form.locator('[name="contact[email]"]').getAttribute('aria-invalid'), 'true');
    assert.equal(await form.locator('[name="contact[email]"]').getAttribute('aria-describedby'), `${formId}-errors`);
    assert.equal(await form.getByRole('alert').isVisible(), true);
  });
});

test('returns preserve merchant copy, section-specific IDs, supplied policy URLs and actual email without invented terms', async () => {
  await withPage({ viewport: { width: 320, height: 900 }, sectionSettings: { heading: 'Returns for your next European performance project', text: 'Merchant guidance <not markup>' }, shop: { email: `${'support'.repeat(10)}@example.test`, refund_policy: { url: '/fr/policies/refund-policy' }, shipping_policy: { url: '/fr/policies/shipping-policy' }, privacy_policy: { url: '/fr/policies/privacy-policy' } }, pages: { contact: { url: '/fr/pages/contact' } } }, async (page, form) => {
    assert.match(await page.locator('main h1').textContent(), /European performance project/);
    assert.match(await page.locator('.ae-contact-page__heading p').first().textContent(), /<not markup>/);
    assert.equal(await page.locator('not').count(), 0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.deepEqual(await page.locator('[aria-label="Return resources"] a').evaluateAll(nodes => nodes.map(node => node.getAttribute('href'))), ['/fr/policies/refund-policy', '/fr/policies/shipping-policy', '/fr/pages/contact']);
    assert.equal(await form.getByRole('link', { name: 'Privacy policy' }).getAttribute('href'), '/fr/policies/privacy-policy');
    assert.doesNotMatch(await page.locator('.ae-returns-page').textContent(), /30.days|25%|free return|INSERT RETURN ADDRESS|7.?10 business/i);
  });
  await withPage({ shop: { email: '' } }, async page => {
    assert.equal(await page.locator('[aria-label="Return resources"]').count(), 0);
    assert.equal(await page.locator('.ae-contact-details a[href^="mailto:"]').getAttribute('href'), 'mailto:support@autobahnessentials.com');
  });
  const ctx = context({ template: 'returns' });
  const html = await renderSection('page-returns-autobahn', ctx, { id: 'first' }) + await renderSection('page-returns-autobahn', ctx, { id: 'second' });
  const page = await browser.newPage();
  try {
    await page.setContent(html);
    const ids = await page.locator('[id]').evaluateAll(nodes => nodes.map(node => node.id));
    assert.equal(new Set(ids).size, ids.length);
    assert.equal(await page.locator('form').evaluateAll(nodes => nodes.every(node => document.getElementById(node.getAttribute('aria-labelledby')) && document.getElementById(node.getAttribute('aria-describedby')))), true);
  } finally { await page.close(); }
});

test('returns navigation prefers an existing returns page and otherwise uses the actual refund policy', async () => {
  for (const pages of [{ returns: { url: '/fr/pages/returns' }, 'shipping-returns': { url: '/fr/pages/shipping-returns' } }, {}]) {
    await withPage({ template: 'contact', pages, shop: { refund_policy: { url: '/fr/policies/refund-policy' } }, footerBlocks: [{ settings: { heading: 'Support', menu: { links: [] } } }] }, async page => {
      const destination = pages.returns?.url || '/fr/policies/refund-policy';
      assert.equal(await page.locator('.nav-dropdown--contacts a').last().getAttribute('href'), destination);
      assert.equal(await page.locator('.ae-contact-details__links').getByRole('link', { name: 'Returns', exact: true }).getAttribute('href'), destination);
      if (pages.returns) assert.equal(await page.locator('.footer-links').getByRole('link', { name: 'Returns', exact: true }).getAttribute('href'), destination);
    });
  }
});

test('empty generic Returns pages render the new experience while authored page content is preserved', async () => {
  await withPage({ template: 'page', page: { handle: 'returns', title: 'Returns', content: '' } }, async (page, form) => {
    assert.equal(await page.locator('.ae-returns-page').count(), 1);
    assert.match(await page.locator('.ae-returns-window').textContent(), /14 days of delivery/);
    assert.equal(await form.getAttribute('id'), 'ReturnRequest-main-page');
  });
  await withPage({ template: 'page', page: { handle: 'returns', title: 'Merchant returns', content: '<p>Existing merchant-authored policy content.</p>' } }, async page => {
    assert.equal(await page.locator('.ae-returns-page').count(), 0);
    assert.match(await page.locator('main .rte').textContent(), /Existing merchant-authored policy content/);
  });
});

test('returns polish keeps the request window visible, FAQs full-width and packing guidance keyboard-accessible', async () => {
  for (const width of [320, 390, 768, 920, 1024, 1440]) {
    for (const reducedMotion of ['reduce', 'no-preference']) {
      await withPage({ viewport: { width, height: 900 }, reducedMotion }, async (page, form) => {
        const heading = page.locator('.ae-contact-page__heading');
        const windowNote = page.locator('.ae-returns-window');
        const faq = page.locator('.ae-returns-faq');
        assert.equal(await windowNote.isVisible(), true);
        assert.ok((await windowNote.boundingBox()).y < 620, 'Request window is near the top');
        assert.equal(await page.locator('.ae-contact-main .ae-returns-faq').count(), 0);
        const layoutWidth = await page.locator('.ae-contact-layout').evaluate(node => node.clientWidth);
        assert.equal(await faq.evaluate(node => node.clientWidth), layoutWidth);
        assert.equal(await heading.evaluate(node => getComputedStyle(node).gridTemplateColumns.split(' ').length), width <= 640 ? 1 : 2);
        assert.equal(await page.locator('.ae-contact-details__item').first().locator('h2').textContent(), 'Email support');
        assert.deepEqual(await page.locator('.ae-returns-heading__copy, .ae-returns-window, .ae-returns-faq summary, .ae-returns-pack summary').evaluateAll(nodes => nodes.filter(node => node.scrollWidth > node.clientWidth + 1).map(node => node.className)), []);
        const sizes = await form.locator('input:not([type="hidden"]), select, textarea').evaluateAll(nodes => nodes.map(node => [node.offsetWidth, node.offsetHeight]));
        const pack = page.locator('.ae-returns-pack');
        assert.equal(await pack.getAttribute('open'), null);
        await pack.locator('summary').press('Enter');
        assert.equal(await pack.locator('ul').isVisible(), true);
        assert.equal(await pack.locator('summary').evaluate(node => document.activeElement === node), true);
        assert.equal(await pack.locator('summary').evaluate(node => getComputedStyle(node, '::after').content), '"-"');
        assert.deepEqual(await form.locator('input:not([type="hidden"]), select, textarea').evaluateAll(nodes => nodes.map(node => [node.offsetWidth, node.offsetHeight])), sizes);
        await pack.locator('summary').press('Enter');
        assert.equal(await pack.locator('ul').isVisible(), false);
        assert.equal(await pack.locator('summary').evaluate(node => getComputedStyle(node, '::after').content), '"+"');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        if (reducedMotion === 'reduce') {
          assert.equal(await heading.evaluate(node => getComputedStyle(node).animationName), 'none');
        }
      });
    }
  }
});
