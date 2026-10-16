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

function pagination(current = 2) {
  const url = page => `/fr/collections/bmw?filter.p.vendor=ARM&sort_by=price-ascending&page=${page}`;
  return {
    pages: 11, current_page: current,
    previous: current > 1 ? { url: url(current - 1) } : null,
    next: current < 11 ? { url: url(current + 1) } : null,
    parts: [1, 2, 3, '...', 11].map(title => ({ title, is_link: title !== '...' && title !== current, url: url(title) })),
  };
}

async function withPagination(options, check) {
  const session = await browser.newContext({ viewport: { width: 320, height: 900 }, reducedMotion: 'reduce', ...options.context });
  try {
    const page = await session.newPage();
    const errors = await mount(page, { template: options.template || 'collection', paginate: options.paginate || pagination(), blog: { articles: [{ title: 'Installation guide', url: '/blogs/guides/install', excerpt_or_content: '<p>Installation details.</p>' }] } });
    await check(page);
    assert.deepEqual(errors, []);
  } finally { await session.close(); }
}

test('native pagination labels fit one frame on mobile/desktop collection, search and blog pages', async () => {
  for (const template of ['collection', 'search', 'blog']) {
    for (const width of [320, 390, 768, 1440]) {
      for (const current of [1, 2, 11]) {
        await withPagination({ template, paginate: pagination(current), context: { viewport: { width, height: 900 } } }, async page => {
          const nav = page.locator('.pagination');
          assert.equal(await nav.count(), 1);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
          const controls = await nav.locator('a, .current, .deco').evaluateAll(nodes => nodes.map(node => {
            const rect = node.getBoundingClientRect();
            const nav = node.closest('.pagination').getBoundingClientRect();
            const range = document.createRange();
            range.selectNodeContents(node);
            const text = range.getBoundingClientRect();
            return { width: rect.width, height: rect.height, fits: text.left >= rect.left && text.right <= rect.right && text.top >= rect.top && text.bottom <= rect.bottom, bounded: rect.left >= nav.left && rect.right <= nav.right, wrappedByButton: node.tagName === 'A' && getComputedStyle(node.parentElement).borderTopStyle !== 'none' };
          }));
          for (const control of controls) {
            assert.ok(control.width >= 44 && control.height >= 44, `${template}, ${width}px, page ${current}: touch target`);
            assert.equal(control.fits, true, `${template}, ${width}px, page ${current}: label fits`);
            assert.equal(control.bounded, true, `${template}, ${width}px, page ${current}: navigation bounds`);
            assert.equal(control.wrappedByButton, false, 'Only one visible button frame per link');
          }
          if (process.env.THEME_SCREENSHOTS && template === 'collection' && current === 2) {
            fs.mkdirSync(path.join(root, '.tools/screenshots'), { recursive: true });
            await nav.screenshot({ path: path.join(root, `.tools/screenshots/pagination-${width}.png`) });
          }
        });
      }
    }
  }
});

test('pagination preserves native URLs, first/last states and navigation without JavaScript', async () => {
  for (const javaScriptEnabled of [true, false]) {
    await withPagination({ context: { javaScriptEnabled } }, async page => {
      const previous = page.locator('.pagination .prev a');
      const next = page.locator('.pagination .next a');
      assert.equal(await previous.getAttribute('href'), pagination().previous.url);
      assert.equal(await next.getAttribute('href'), pagination().next.url);
      await previous.focus();
      assert.equal(await previous.evaluate(node => node === document.activeElement), true);
      await Promise.all([page.waitForURL('**/fr/collections/bmw?filter.p.vendor=ARM&sort_by=price-ascending&page=3'), next.click()]);
      assert.match(page.url(), /page=3$/);
    });
  }
});

test('pagination accommodates longer translated labels without clipping or page overflow', async () => {
  const paginate = pagination();
  paginate.previous.title = 'Vorherige Ergebnisse';
  paginate.next.title = 'Weitere Ergebnisse';
  await withPagination({ paginate }, async page => {
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    for (const selector of ['.prev a', '.next a']) {
      assert.equal(await page.locator(`.pagination ${selector}`).evaluate(node => node.scrollWidth <= node.clientWidth && node.scrollHeight <= node.clientHeight), true);
    }
  });
});
