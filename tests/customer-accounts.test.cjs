const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test, before, after } = require('node:test');
const { chromium } = require('playwright');
const axe = require('axe-core');
const { context, renderSection, mount, root } = require('./helpers/theme.cjs');

const accounts = {
  shop: { customer_accounts_enabled: true },
  routes: { account_login_url: '/fr/account/login', account_url: 'https://account.example.test/orders?locale=fr&source=store' },
};
let browser;
before(async () => {
  const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || (fs.existsSync(chrome) ? chrome : undefined) });
});
after(async () => { await browser?.close(); });

test('account navigation follows native guest and signed-in routes without exposing customer data', async () => {
  const guest = await renderSection('header', context(accounts));
  assert.equal((guest.match(/href="\/fr\/account\/login"/g) || []).length, 2);
  assert.match(guest, /title="Sign in or create account"/);
  const signedIn = await renderSection('header', context({ ...accounts, customer: { email: 'private@example.test', first_name: 'Private' } }));
  assert.equal((signedIn.match(/href="https:\/\/account\.example\.test\/orders\?locale=fr&amp;source=store"/g) || []).length, 2);
  assert.match(signedIn, /Account &amp; orders/);
  assert.doesNotMatch(signedIn, /private@example\.test|Private|\/fr\/account\/login/);
});

test('disabled accounts and missing native routes produce no account entry points', async () => {
  for (const options of [{}, { ...accounts, shop: { customer_accounts_enabled: false } }, { shop: accounts.shop }]) {
    const html = await renderSection('header', context(options));
    assert.doesNotMatch(html, /class="(?:account-menu-link|icon-button account-toggle)"/);
  }
});

test('native account links remain reachable without crowding mobile and desktop headers, including without JavaScript', async () => {
  for (const width of [320, 390, 640, 768, 990, 991, 1200, 1440]) {
    for (const javaScriptEnabled of [true, false]) {
      const session = await browser.newContext({ viewport: { width, height: 900 }, javaScriptEnabled, reducedMotion: 'reduce' });
      try {
        const page = await session.newPage();
        const errors = await mount(page, accounts);
        const desktopLink = page.locator('.account-toggle');
        const menuLink = page.locator('.account-menu-link');
        if (width <= 990) {
          assert.equal(await desktopLink.isVisible(), false);
          if (javaScriptEnabled) await page.locator('[data-menu-toggle]').click();
          assert.equal(await menuLink.isVisible(), true);
          assert.equal(await menuLink.getAttribute('href'), accounts.routes.account_login_url);
          const bounds = await menuLink.boundingBox();
          assert.ok(bounds.height >= 44 && bounds.x >= 0 && bounds.x + bounds.width <= width + 1);
          if (process.env.THEME_SCREENSHOTS && width === 390 && javaScriptEnabled) {
            fs.mkdirSync(path.join(root, '.tools/screenshots'), { recursive: true });
            await page.screenshot({ path: path.join(root, '.tools/screenshots/customer-account-mobile.png') });
          }
          if (javaScriptEnabled) await page.keyboard.press('Escape');
        } else {
          assert.equal(await desktopLink.isVisible(), true);
          assert.equal(await menuLink.isVisible(), false);
          assert.equal(await desktopLink.getAttribute('href'), accounts.routes.account_login_url);
          if (javaScriptEnabled) {
            await desktopLink.focus();
            assert.equal(await desktopLink.evaluate(node => node === document.activeElement), true);
          }
          if (process.env.THEME_SCREENSHOTS && width === 1440 && javaScriptEnabled) {
            await page.screenshot({ path: path.join(root, '.tools/screenshots/customer-account-desktop.png') });
          }
        }
        const boxes = await page.locator('.header-logo, .header-actions .icon-button, .mobile-menu-trigger').evaluateAll(nodes => nodes.filter(node => node.getClientRects().length).map(node => {
          const r = node.getBoundingClientRect();
          return { x: r.x, right: r.right, name: node.className };
        }));
        for (const box of boxes) assert.ok(box.x >= -1 && box.right <= width + 1, JSON.stringify({ width, box }));
        for (let i = 0; i < boxes.length; i++) for (const other of boxes.slice(i + 1)) {
          assert.ok(boxes[i].right <= other.x + 1 || other.right <= boxes[i].x + 1, `${width}px: ${boxes[i].name} overlaps ${other.name}`);
        }
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        assert.deepEqual(errors, []);
      } finally { await session.close(); }
    }
  }
});

test('mobile account menu passes accessibility checks and restores keyboard focus', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  try {
    await mount(page, { ...accounts, customer: {} });
    await page.locator('[data-menu-toggle]').click();
    assert.equal(await page.getByRole('link', { name: 'Account & orders', exact: true }).count(), 1);
    await page.addScriptTag({ content: axe.source });
    const results = await page.evaluate(async () => axe.run('.site-header', { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } }));
    assert.deepEqual(results.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(node => node.target) })), []);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('[data-menu-toggle]').evaluate(node => node === document.activeElement), true);
  } finally { await page.close(); }
});
