const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test, before, after } = require('node:test');
const { chromium } = require('playwright');
const { root, mount, renderSection, context } = require('./helpers/theme.cjs');

let browser;
before(async () => {
  const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || (fs.existsSync(chrome) ? chrome : undefined) });
});
after(async () => { await browser?.close(); });

const formId = 'ContactForm-page-contact-autobahn';
async function withPage(options, check) {
  const session = await browser.newContext({ viewport: options.viewport || { width: 1440, height: 1000 }, reducedMotion: options.reducedMotion || 'reduce', javaScriptEnabled: options.javaScriptEnabled ?? true });
  try {
    const page = await session.newPage();
    const errors = await mount(page, { template: 'contact', ...options });
    await check(page, page.locator('.ae-contact-form'));
    assert.deepEqual(errors, []);
  } finally { await session.close(); }
}

test('contact layout puts visibly labeled fields near the top and fits desktop/mobile with or without JavaScript', async () => {
  for (const width of [320, 390, 768, 920, 1024, 1440]) {
    for (const javaScriptEnabled of [true, false]) {
      await withPage({ viewport: { width, height: 900 }, javaScriptEnabled }, async (page, form) => {
        assert.equal(await page.locator('main h1').textContent(), 'Contact Us');
        assert.equal(await page.locator('.ae-contact-page .ae-card, .ae-page-hero').count(), 0);
        assert.ok((await form.locator('[name="contact[name]"]').boundingBox()).y < 620, `Form starts too low at ${width}px`);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        for (const selector of ['.ae-contact-main', '.ae-contact-field', '.ae-contact-details']) {
          assert.deepEqual(await page.locator(selector).evaluateAll(nodes => nodes.filter(node => node.scrollWidth > node.clientWidth + 1).map(node => node.className)), [], `${selector} at ${width}px`);
        }
        const fields = await form.locator('.ae-contact-field').evaluateAll(nodes => nodes.map(node => {
          const label = node.querySelector('label');
          const input = node.querySelector('input, select, textarea');
          const a = label.getBoundingClientRect();
          const b = input.getBoundingClientRect();
          return { labelWidth: a.width, labelHeight: a.height, gap: b.top - a.bottom, named: label.htmlFor === input.id };
        }));
        assert.ok(fields.every(field => field.labelWidth > 20 && field.labelHeight > 10 && field.gap >= 0 && field.named));
        const columns = await form.evaluate(node => getComputedStyle(node).gridTemplateColumns.split(' ').length);
        assert.equal(columns, width <= 640 ? 1 : 2);
        const main = await page.locator('.ae-contact-main').boundingBox();
        const details = await page.locator('.ae-contact-details').boundingBox();
        assert.ok(width > 900 ? details.x >= main.x + main.width : details.y >= main.y + main.height);
        if (process.env.THEME_SCREENSHOTS && javaScriptEnabled) {
          fs.mkdirSync(path.join(root, '.tools/screenshots'), { recursive: true });
          await page.screenshot({ path: path.join(root, `.tools/screenshots/contact-${width}.png`), fullPage: true });
        }
      });
    }
  }
});

test('contact form retains native validation and posts the existing fields plus optional order number without JavaScript', async () => {
  await withPage({ javaScriptEnabled: false }, async (page, form) => {
    assert.equal(await form.getAttribute('method'), 'post');
    assert.equal(await form.getAttribute('action'), '/contact');
    assert.equal(await form.getAttribute('novalidate'), null);
    assert.equal(await form.locator('[required]').count(), 3);
    const requests = [];
    await page.route('http://theme.test/contact', async route => {
      requests.push({ method: route.request().method(), type: route.request().resourceType(), data: route.request().postData() });
      await route.fulfill({ contentType: 'text/html', body: '<h1>Fixture received</h1>' });
    });
    await form.locator('[name="contact[name]"]').fill('Theme QA');
    await form.locator('[name="contact[email]"]').fill('not-an-email');
    await form.locator('[name="contact[body]"]').fill('A local mocked contact submission.');
    await form.locator('[type="submit"]').click();
    assert.equal(requests.length, 0);
    assert.equal(await form.locator('[name="contact[email]"]').evaluate(input => input.validity.typeMismatch), true);
    await form.locator('[name="contact[email]"]').fill('qa@example.test');
    await form.locator('[name="contact[topic]"]').selectOption('Order support');
    await form.locator('[name="contact[order_number]"]').fill('AE-1001');
    await form.locator('[name="contact[vehicle]"]').fill('BMW 335i E92 N54');
    await form.locator('[type="submit"]').click();
    await page.waitForURL('http://theme.test/contact');
    assert.equal(requests.length, 1);
    assert.equal(requests[0].method, 'POST');
    assert.equal(requests[0].type, 'document');
    const data = new URLSearchParams(requests[0].data);
    assert.equal(data.get('contact[email]'), 'qa@example.test');
    assert.equal(data.get('contact[topic]'), 'Order support');
    assert.equal(data.get('contact[order_number]'), 'AE-1001');
    assert.equal(data.get('contact[vehicle]'), 'BMW 335i E92 N54');
    assert.equal(data.get('contact[body]'), 'A local mocked contact submission.');
  });
});

test('contact success/errors remain visible and submitted values are escaped and retained in fixtures', async () => {
  await withPage({ formStates: { [formId]: { 'posted_successfully?': true } } }, async (page, form) => {
    assert.match(await form.locator('[role="status"]').textContent(), /Message received/);
    assert.equal(await form.locator('[role="alert"]').count(), 0);
  });
  const hostile = '</textarea><img src=x onerror="window.injected=true">';
  await withPage({ formStates: { [formId]: { errors: ['email'], name: 'QA "Name"', email: 'invalid', vehicle: 'BMW & Audi', order_number: 'AE-1001', topic: 'Build advice', body: hostile } } }, async (page, form) => {
    assert.equal(await form.locator('[name="contact[name]"]').inputValue(), 'QA "Name"');
    assert.equal(await form.locator('[name="contact[vehicle]"]').inputValue(), 'BMW & Audi');
    assert.equal(await form.locator('[name="contact[order_number]"]').inputValue(), 'AE-1001');
    assert.equal(await form.locator('[name="contact[topic]"]').inputValue(), 'Build advice');
    assert.equal(await form.locator('[name="contact[body]"]').inputValue(), hostile);
    assert.equal(await page.locator('img[src="x"]').count(), 0);
    assert.equal(await form.locator('[name="contact[email]"]').getAttribute('aria-invalid'), 'true');
    const describedBy = await form.locator('[name="contact[email]"]').getAttribute('aria-describedby');
    assert.equal(await page.locator(`[id="${describedBy}"][role="alert"]`).isVisible(), true);
  });
});

test('contact sidebar preserves the actual email and links only to supplied support pages/policies', async () => {
  await withPage({ shop: { email: 'orders@example.test', shipping_policy: { url: '/fr/policies/shipping-policy' }, refund_policy: { url: '/fr/policies/refund-policy' }, privacy_policy: { url: '/fr/policies/privacy-policy' } }, pages: { fitment: { url: '/fr/pages/fitment' }, faq: { url: '/fr/pages/faq' } } }, async (page, form) => {
    assert.equal(await page.locator('.ae-contact-details a[href^="mailto:"]').getAttribute('href'), 'mailto:orders@example.test');
    const links = await page.locator('[aria-label="Support resources"] a').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')));
    assert.deepEqual(links, ['/fr/pages/fitment', '/fr/policies/shipping-policy', '/fr/policies/refund-policy', '/fr/pages/faq']);
    assert.equal(await form.getByRole('link', { name: 'Privacy policy' }).getAttribute('href'), '/fr/policies/privacy-policy');
    const instagram = page.locator('.ae-contact-details a[href^="https://www.instagram.com/"]');
    assert.equal(await instagram.getAttribute('target'), '_blank');
    assert.match(await instagram.getAttribute('rel'), /noopener/);
  });
  await withPage({}, async page => {
    assert.equal(await page.locator('[aria-label="Support resources"]').count(), 0);
  });
  await withPage({ shop: { email: '' }, pages: { 'shipping-returns': { url: '/pages/shipping-returns' }, returns: { url: '/pages/returns' } } }, async page => {
    assert.equal(await page.locator('.ae-contact-details a[href^="mailto:"]').getAttribute('href'), 'mailto:support@autobahnessentials.com');
    assert.deepEqual(await page.locator('[aria-label="Support resources"] a').evaluateAll(nodes => nodes.map(node => node.getAttribute('href'))), ['/pages/shipping-returns', '/pages/returns']);
  });
});

test('contact cleanup preserves merchant copy and bounds long headings, emails and button labels', async () => {
  const heading = 'Specialist support for your next European performance project';
  await withPage({ viewport: { width: 320, height: 900 }, shop: { email: `${'support'.repeat(12)}@example.test` }, sectionSettings: { heading, text: 'Merchant introduction & support details.', form_heading: 'Ask the AE team', button_label: 'Send your detailed question to the AE support team', response_heading: 'Merchant response policy', response_text: 'Existing response guidance is preserved.' } }, async (page, form) => {
    assert.equal(await page.locator('main h1').textContent(), heading);
    assert.match(await page.locator('.ae-contact-page__heading p').textContent(), /Merchant introduction/);
    assert.match(await page.locator('.ae-contact-details').textContent(), /Existing response guidance is preserved/);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    const button = await form.locator('[type="submit"]').evaluate(node => ({ width: node.clientWidth, scroll: node.scrollWidth, right: node.getBoundingClientRect().right }));
    assert.ok(button.scroll <= button.width + 1 && button.right <= 320);
  });
});

test('contact forms use section-specific IDs and valid label/status associations when rendered more than once', async () => {
  const session = await browser.newContext();
  try {
    const page = await session.newPage();
    const ctx = context({ template: 'contact' });
    const first = await renderSection('page-contact-autobahn', ctx, { id: 'first' });
    const second = await renderSection('page-contact-autobahn', ctx, { id: 'second' });
    await page.setContent(first + second);
    const ids = await page.locator('[id]').evaluateAll(nodes => nodes.map(node => node.id));
    assert.equal(new Set(ids).size, ids.length);
    assert.deepEqual(await page.locator('label').evaluateAll(nodes => nodes.filter(node => !document.getElementById(node.htmlFor)).map(node => node.htmlFor)), []);
    assert.equal(await page.locator('form').evaluateAll(nodes => nodes.every(node => document.getElementById(node.getAttribute('aria-labelledby')))), true);
  } finally { await session.close(); }
});

test('contact entrances are brief, leave form controls stationary and work without JavaScript', async () => {
  for (const width of [320, 1440]) {
    for (const javaScriptEnabled of [true, false]) {
      await withPage({ viewport: { width, height: 900 }, reducedMotion: 'no-preference', javaScriptEnabled }, async (page, form) => {
        const motion = await page.locator('.ae-contact-page').evaluate(section => {
          const selectors = ['.ae-contact-page__heading', '.ae-contact-main', '.ae-contact-details'];
          return selectors.map(selector => {
            const node = section.querySelector(selector);
            const style = getComputedStyle(node);
            return { name: style.animationName, duration: style.animationDuration, delay: style.animationDelay, iterations: style.animationIterationCount };
          });
        });
        assert.deepEqual(motion.map(item => item.name), ['ae-contact-heading-enter', 'ae-contact-content-enter', 'ae-contact-content-enter']);
        assert.ok(motion.every(item => parseFloat(item.duration) <= 0.36 && parseFloat(item.delay) <= 0.08 && item.iterations === '1'));
        // Pause any ongoing entrance while checking stationary, fully readable controls.
        await page.locator('.ae-contact-page').evaluate(section => {
          for (const node of section.querySelectorAll('.ae-contact-page__heading, .ae-contact-main, .ae-contact-details')) {
            for (const animation of node.getAnimations()) {
              animation.pause();
              animation.currentTime = 120;
            }
          }
        });
        const field = form.locator('[name="contact[name]"]');
        const before = await field.boundingBox();
        assert.equal(await page.locator('.ae-contact-main').evaluate(node => getComputedStyle(node).translate), 'none');
        await field.focus();
        assert.equal(await page.locator('.ae-contact-main').evaluate(node => getComputedStyle(node).opacity), '1');
        await field.fill('Keyboard QA');
        assert.deepEqual(await field.boundingBox(), before);
        await page.locator('.ae-contact-page').evaluate(section => {
          for (const node of section.querySelectorAll('*')) {
            for (const animation of node.getAnimations()) if (animation.animationName?.startsWith('ae-contact-')) animation.finish();
          }
        });
        for (const selector of ['.ae-contact-page__heading', '.ae-contact-main', '.ae-contact-details']) {
          assert.equal(await page.locator(selector).evaluate(node => getComputedStyle(node).opacity), '1');
        }
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        if (process.env.THEME_SCREENSHOTS && javaScriptEnabled) {
          await page.screenshot({ path: path.join(root, `.tools/screenshots/contact-motion-${width}.png`), fullPage: true });
        }
      });
    }
  }
});

test('contact hover, keyboard and press feedback preserve bounds and reduced motion removes animations/transitions', async () => {
  await withPage({ reducedMotion: 'no-preference', shop: { privacy_policy: { url: '/policies/privacy-policy' } } }, async (page, form) => {
    await page.locator('.ae-contact-page').evaluate(section => {
      for (const node of section.querySelectorAll('*')) {
        for (const animation of node.getAnimations()) if (animation.animationName?.startsWith('ae-contact-')) animation.finish();
      }
    });
    const field = form.locator('[name="contact[email]"]');
    await field.focus();
    await page.waitForFunction(() => {
      const field = document.querySelector('[name="contact[email]"]');
      const probe = document.createElement('span');
      probe.style.color = 'var(--color-accent)';
      field.parentElement.append(probe);
      const matches = getComputedStyle(field).borderTopColor === getComputedStyle(probe).color;
      probe.remove();
      return matches;
    });
    const button = form.locator('[type="submit"]');
    const buttonSize = await button.evaluate(node => [node.offsetWidth, node.offsetHeight]);
    await button.hover();
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.ae-contact-form button svg')).translate === '3px');
    await page.mouse.down();
    await page.waitForFunction(() => new DOMMatrix(getComputedStyle(document.querySelector('.ae-contact-form button')).transform).m42 === 0);
    await page.mouse.move(1, 1);
    await page.mouse.up();
    assert.deepEqual(await button.evaluate(node => [node.offsetWidth, node.offsetHeight]), buttonSize);
    const instagram = page.locator('.ae-contact-details a[href^="https://www.instagram.com/"]');
    for (const link of [instagram, form.getByRole('link', { name: 'Privacy policy' })]) {
      await link.focus();
      await page.keyboard.press('Tab');
      await page.keyboard.press('Shift+Tab');
      await page.waitForFunction(selector => getComputedStyle(document.querySelector(selector)).textUnderlineOffset === '6px', link === instagram ? '.ae-contact-details a[href^="https://www.instagram.com/"]' : '.ae-contact-page__link');
      assert.notEqual(await link.evaluate(node => getComputedStyle(node).outlineStyle), 'none');
      if (link === instagram) {
        await page.waitForFunction(() => getComputedStyle(document.querySelector('.ae-contact-details a[href^="https://www.instagram.com/"] svg')).translate === '2px');
      }
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await button.hover();
    await field.focus();
    const moving = await page.locator('.ae-contact-page *').evaluateAll(nodes => nodes.filter(node => {
      const style = getComputedStyle(node);
      return style.animationName !== 'none' || style.transitionDuration.split(',').some(value => parseFloat(value) > 0);
    }).map(node => node.className));
    assert.deepEqual(moving, []);
    assert.equal(await button.evaluate(node => getComputedStyle(node).transform), 'none');
    assert.equal(await button.locator('svg').evaluate(node => getComputedStyle(node).translate), 'none');
    assert.equal(await instagram.locator('svg').evaluate(node => getComputedStyle(node).translate), 'none');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.equal(await form.getAttribute('action'), '/contact');
  });
  await withPage({ reducedMotion: 'reduce', viewport: { width: 320, height: 900 }, javaScriptEnabled: false }, async page => {
    assert.equal(await page.locator('.ae-contact-page__heading').evaluate(node => getComputedStyle(node).animationName), 'none');
    assert.equal(await page.locator('.ae-contact-main').evaluate(node => getComputedStyle(node).opacity), '1');
  });
});
