const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test, before, after } = require('node:test');
const { chromium } = require('playwright');
const axe = require('axe-core');
const { mount, product, root } = require('./helpers/theme.cjs');

let browser;
before(async () => {
  const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || (fs.existsSync(chrome) ? chrome : undefined) });
});
after(async () => { await browser?.close(); });
async function withPage(options, check) {
  const session = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', ...options.context });
  try {
    const page = await session.newPage();
    page.setDefaultTimeout(10000);
    await page.route('https://video.example.test/**', route => route.fulfill({ contentType: 'text/html', body: '<p>Supplier video fixture</p>' }));
    const errors = await mount(page, options);
    await check(page, session);
    assert.deepEqual(errors, []);
  } finally { await session.close(); }
}
async function bounded(page) {
  const overflow = await page.evaluate(() => ({
    width: innerWidth, scroll: document.documentElement.scrollWidth,
    nodes: Array.from(document.querySelectorAll('body *')).filter(node => {
      const r = node.getBoundingClientRect();
      return r.width && r.right > innerWidth + 1 && getComputedStyle(node).visibility !== 'hidden' && !node.closest('.ticker-banner, .site-nav, .garage-drawer:not(.is-open), .collection-facets:not(.is-open)');
    }).slice(0, 12).map(node => `${node.tagName}.${node.className}: ${Math.round(node.getBoundingClientRect().right)}`),
  }));
  assert.ok(overflow.scroll <= overflow.width, JSON.stringify(overflow));
}
const saveScreenshot = async (page, name) => {
  if (!process.env.THEME_SCREENSHOTS) return;
  fs.mkdirSync(path.join(root, '.tools/screenshots'), { recursive: true });
  await page.screenshot({ path: path.join(root, `.tools/screenshots/mobile-${name}.png`) });
};
const revealPurchase = async page => {
  await page.locator('[data-atc-main]').evaluate(node => scrollTo(0, scrollY + node.getBoundingClientRect().bottom + 100));
  await page.waitForFunction(() => !document.querySelector('[data-mobile-purchase]').hidden);
};
const filters = [
  { label: 'Brand', type: 'list', values: [{ param_name: 'filter.p.vendor', value: 'ARM', label: 'ARM', count: 2, active: true }], active_values: [{ label: 'ARM', url_to_remove: '/collections/bmw' }] },
  { label: 'Price', type: 'price_range', min_value: { param_name: 'filter.v.price.gte', value: 0 }, max_value: { param_name: 'filter.v.price.lte', value: 20000 }, range_max: 50000, active_values: [], url_to_remove: '/collections/bmw' },
];

test('mobile header has compact, nonoverlapping 44px targets without losing desktop or no-JavaScript navigation', async () => {
  for (const width of [320, 360, 390, 430, 640, 768, 1440]) {
    for (const javaScriptEnabled of [true, false]) {
      await withPage({ context: { viewport: { width, height: 844 }, javaScriptEnabled } }, async page => {
        await bounded(page);
        const position = await page.locator('.site-header__inner').evaluate(node => {
          const box = selector => {
            const rect = node.querySelector(selector).getBoundingClientRect();
            return { x: rect.x, right: rect.right, center: rect.x + rect.width / 2 };
          };
          return { menu: box('[data-menu-toggle]'), garage: box('[data-garage-toggle]'), logo: box('.header-logo'), search: box('[data-search-toggle]'), cart: box('.cart-toggle'), center: node.getBoundingClientRect().x + node.getBoundingClientRect().width / 2 };
        });
        if (width > 640) {
          if (javaScriptEnabled) assert.ok(position.garage.x >= position.logo.right, `Garage stays on the right at ${width}px`);
          return;
        }
        if (javaScriptEnabled) {
          assert.ok(position.menu.right <= position.garage.x);
          assert.ok(position.garage.right <= position.logo.x);
          assert.ok(position.logo.right <= position.search.x);
          assert.ok(position.search.right <= position.cart.x);
          assert.ok(Math.abs(position.logo.center - position.center) < 1, `Logo is centered at ${width}px`);
        }
        const boxes = await page.locator('.mobile-menu-trigger, .header-logo, .header-actions .icon-button').evaluateAll(nodes => nodes.filter(node => node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden').map(node => {
          const r = node.getBoundingClientRect();
          return { x: r.x, right: r.right, width: r.width, height: r.height, name: node.className };
        }));
        for (const box of boxes) assert.ok(box.width >= 44 && box.height >= 44, box.name);
        for (let i = 0; i < boxes.length; i++) for (const other of boxes.slice(i + 1)) assert.ok(boxes[i].right <= other.x + 1 || other.right <= boxes[i].x + 1, `${boxes[i].name} overlaps ${other.name}`);
        if (javaScriptEnabled) assert.ok(await page.locator('.site-header').evaluate(node => node.getBoundingClientRect().height) <= 62);
        if (javaScriptEnabled) {
          await saveScreenshot(page, `header-${width}`);
          await page.locator('[data-garage-toggle]').click();
          assert.equal(await page.locator('[data-garage-drawer]').getAttribute('aria-hidden'), 'false');
          await page.keyboard.press('Escape');
          assert.equal(await page.locator('[data-garage-toggle]').evaluate(node => node === document.activeElement), true);
        }
      });
    }
  }
});

test('mobile purchase reuses the selected variant and quantity with one native-form add and synchronized stock', async () => {
  await withPage({}, async page => {
    const calls = [];
    await page.route('**/cart/add.js', async route => {
      calls.push(route.request().postData());
      await new Promise(resolve => setTimeout(resolve, 100));
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ id: 102 }) });
    });
    await page.route('**/cart.js', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ item_count: 0, items: [], total_price: 0 }) }));
    await page.locator('[data-product-form] select[name="id"]').selectOption('102');
    await page.locator('[data-product-form] [name="quantity"]').fill('3');
    await page.locator('.product-info h1').click();
    await revealPurchase(page);
    assert.match(await page.locator('[data-mobile-purchase-price]').innerText(), /150/);
    assert.match(await page.locator('[data-mobile-purchase-variant]').innerText(), /Premium/);
    await bounded(page);
    await saveScreenshot(page, 'purchase-390');
    await page.locator('[data-mobile-purchase-submit]').evaluate(button => { button.click(); button.click(); });
    await page.waitForFunction(() => document.querySelector('.cart-drawer.is-open'));
    assert.equal(calls.length, 1);
    assert.match(calls[0], /name="id"\r\n\r\n102/);
    assert.match(calls[0], /name="quantity"\r\n\r\n3/);
    assert.equal(await page.locator('[data-mobile-purchase]').isVisible(), false);
    await page.locator('button[data-cart-drawer-close]').click();
    await page.locator('[data-product-form] select[name="id"]').selectOption('103');
    await page.locator('.product-info h1').click();
    await revealPurchase(page);
    assert.equal(await page.locator('[data-mobile-purchase-submit]').isDisabled(), true);
    assert.match(await page.locator('[data-mobile-purchase-submit]').innerText(), /sold out/i);
  });
});

test('purchase bar hides for overlays, keyboards and desktop, and exposes add errors without a second request', async () => {
  await withPage({}, async page => {
    let requests = 0;
    await page.route('**/cart/add.js', route => { requests++; return route.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ description: 'Please choose a different quantity.' }) }); });
    await revealPurchase(page);
    await page.locator('[data-mobile-purchase-submit]').click();
    await page.waitForFunction(() => !document.querySelector('[data-mobile-purchase-error]').hidden);
    assert.match(await page.locator('[data-mobile-purchase-error]').innerText(), /different quantity/);
    assert.equal(requests, 1);
    await page.locator('[data-mobile-purchase-variant]').click();
    await page.locator('[data-mobile-purchase]').waitFor({ state: 'hidden' });
    assert.equal(await page.locator('[data-product-form] select').evaluate(node => node === document.activeElement), true);
    await page.locator('.product-info h1').click();
    await revealPurchase(page);
    await page.locator('[data-garage-toggle]').click();
    assert.equal(await page.locator('[data-mobile-purchase]').isVisible(), false);
    await page.keyboard.press('Escape');
    await page.setViewportSize({ width: 1440, height: 900 });
    assert.equal(await page.locator('[data-mobile-purchase]').isVisible(), false);
  });
  await withPage({ context: { javaScriptEnabled: false } }, async page => {
    assert.equal(await page.locator('[data-mobile-purchase]').isVisible(), false);
    assert.equal(await page.locator('[data-atc-main]').isEnabled(), true);
  });
});

test('mobile purchase targets fit at narrow widths and reserve the real store chat bubble area', async () => {
  for (const width of [320, 360, 390, 430, 640]) {
    await withPage({ context: { viewport: { width, height: 844 } } }, async page => {
      await revealPurchase(page);
      await bounded(page);
      const bounds = await page.locator('[data-mobile-purchase-submit]').evaluate(node => {
        const rect = node.getBoundingClientRect();
        return { right: rect.right, height: rect.height, width: rect.width, scroll: node.scrollWidth, client: node.clientWidth };
      });
      assert.ok(bounds.height >= 44 && bounds.width >= 44);
      assert.ok(bounds.scroll <= bounds.client, `Cart label overflows at ${width}px`);
      assert.ok(bounds.right <= width - 120, `Chat clearance missing at ${width}px`);
    });
  }
});

test('main gallery supports deliberate touch swipes, ignores vertical/cancelled gestures and keeps controls in sync', async () => {
  await withPage({}, async page => {
    const main = page.locator('.product-gallery__main');
    const swipe = async (dx, dy = 0, cancel = false) => {
      await main.dispatchEvent('pointerdown', { pointerType: 'touch', isPrimary: true, pointerId: 1, clientX: 200, clientY: 100 });
      await main.dispatchEvent(cancel ? 'pointercancel' : 'pointerup', { pointerType: 'touch', isPrimary: true, pointerId: 1, clientX: 200 + dx, clientY: 100 + dy });
    };
    await swipe(-100);
    assert.equal(await page.locator('[data-gallery-inline-status]').innerText(), '2 / 7');
    assert.equal(await page.locator('[data-gallery-thumb]').nth(1).getAttribute('aria-current'), 'true');
    await swipe(-10, 120);
    await swipe(-100, 0, true);
    assert.equal(await page.locator('[data-gallery-inline-status]').innerText(), '2 / 7');
    await page.locator('[data-gallery-inline-prev]').click();
    assert.equal(await page.locator('[data-gallery-inline-status]').innerText(), '1 / 7');
    await page.locator('[data-gallery-inline-prev]').click();
    assert.equal(await page.locator('[data-gallery-inline-status]').innerText(), '7 / 7');
    await page.locator('[data-gallery-open]').click();
    await page.locator('[data-gallery-lightbox-next]').click();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('[data-gallery-inline-status]').innerText(), '1 / 7');
    assert.equal(await main.evaluate(node => getComputedStyle(node).touchAction), 'pan-y pinch-zoom');
  });
});

test('mobile garage advances through dependent fields, preserves saved cars and allows review/edit before saving', async () => {
  await withPage({ garage: { year: '2017', make: 'BMW', model: '340i', chassis: 'F30', trim: 'B58' } }, async page => {
    await page.locator('[data-garage-toggle]').click();
    assert.equal(await page.locator('[data-garage-drawer]').getAttribute('role'), 'dialog');
    await page.locator('[data-garage-add]').click();
    const form = page.locator('[data-garage-form]');
    assert.equal(await form.locator('.garage-field:visible').count(), 1);
    for (const [name, value] of [['make', 'Audi'], ['model', 'S4'], ['chassis', 'B9'], ['trim', '3.0T']]) {
      assert.equal(await form.locator(`[name="vehicle_${name}"]`).isVisible(), true);
      await form.locator(`[name="vehicle_${name}"]`).selectOption(value);
    }
    await form.locator('[name="vehicle_year"]').fill('2019');
    assert.match(await form.locator('[data-garage-step-summary]').innerText(), /Audi.*S4.*B9.*3.0T/s);
    await bounded(page);
    await saveScreenshot(page, 'garage-390');
    await form.locator('[type="submit"]').click();
    assert.deepEqual(await page.evaluate(() => AEGarage.list().map(car => car.model)), ['340i', 'S4']);
    await page.locator('[data-garage-toggle]').click();
    assert.match(await page.locator('[data-garage-summary]').innerText(), /year.*confirmation/i);
    await page.locator('[data-garage-edit]').last().click();
    await form.locator('[name="vehicle_year"]').fill('2020');
    await form.locator('[data-garage-cancel]').click();
    assert.equal(await page.evaluate(() => AEGarage.read().year), '2019');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('[data-garage-toggle]').evaluate(node => node === document.activeElement), true);
  });
});

test('mobile garage handles backwards edits, invalid years, focus containment and breakpoint changes', async () => {
  await withPage({}, async page => {
    await page.locator('[data-garage-toggle]').click();
    const form = page.locator('[data-garage-form]');
    for (const [name, value] of [['make', 'BMW'], ['model', '340i'], ['chassis', 'F30'], ['trim', 'B58']]) await form.locator(`[name="vehicle_${name}"]`).selectOption(value);
    await form.locator('[name="vehicle_year"]').fill('3000');
    await form.evaluate(node => node.dispatchEvent(new Event('submit', { cancelable: true })));
    assert.equal(await page.evaluate(() => AEGarage.list().length), 0);
    await form.locator('[data-garage-step-summary] button').first().click();
    await form.locator('[name="vehicle_make"]').selectOption('Audi');
    assert.equal(await form.locator('[name="vehicle_model"]').inputValue(), '');
    await page.locator('[data-garage-close]').focus();
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.locator('[data-garage-drawer]').evaluate(node => node.contains(document.activeElement)), true);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator('[data-garage-toggle]').click();
    assert.equal(await form.locator('.garage-field:visible').count(), 6);
    await page.keyboard.press('Escape');
  });
});

test('mobile Filter and Sort stay below the compact header and show the native active-filter count', async () => {
  await withPage({ template: 'collection', collection: { filters, products: Array.from({ length: 15 }, () => product) } }, async page => {
    assert.equal(await page.locator('[data-active-filter-count]').textContent(), '(2)');
    await page.locator('[data-product-card]').nth(5).scrollIntoViewIfNeeded();
    await page.waitForFunction(() => {
      const tools = document.querySelector('.collection-browser__tools').getBoundingClientRect();
      const bar = document.querySelector('[data-garage-bar]').getBoundingClientRect();
      return Math.abs(tools.top - bar.bottom) < 3;
    });
    await bounded(page);
    await saveScreenshot(page, 'filters-390');
    await page.locator('[data-facet-open]').click();
    assert.equal(await page.locator('[data-collection-facets]').isVisible(), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('[data-facet-open]').evaluate(node => node === document.activeElement), true);
  });
});

test('returning from a product restores the collection position without changing filtering or saving permanently', async () => {
  const products = Array.from({ length: 24 }, (_, index) => ({ ...product, handle: `part-${index}`, title: `Part ${index}`, url: `/products/part-${index}` }));
  await withPage({ template: 'collection', collection: { products } }, async page => {
    const link = page.locator('[data-product-card]').nth(12).locator('.product-card__title a');
    await link.scrollIntoViewIfNeeded();
    const before = await link.evaluate(node => node.closest('[data-product-card]').getBoundingClientRect().top);
    await link.click();
    await page.waitForURL('**/products/part-12');
    assert.ok(await page.evaluate(() => sessionStorage.getItem('autobahn:browse-return')));
    await page.goBack();
    await page.waitForFunction(() => sessionStorage.getItem('autobahn:browse-return') === null);
    assert.ok(Math.abs(await page.locator('[data-product-card]').nth(12).evaluate(node => node.getBoundingClientRect().top) - before) < 8);
  });
});

test('supplier media is lazy before insertion while content, URLs and no-JavaScript reading remain intact', async () => {
  const description = '<p>Original supplier wording.</p><div style="margin-top:6000px"><img src="/assets/brand-bmw-m4.jpg" width="900" height="600" alt="Supplier detail"><iframe src="https://video.example.test/embed" title="Supplier installation video" width="560" height="315"></iframe></div><p>Final supplier notes.</p>';
  for (const javaScriptEnabled of [true, false]) {
    await withPage({ product: { description }, context: { javaScriptEnabled } }, async page => {
      const content = page.locator('[data-product-description]');
      assert.match(await content.innerText(), /Original supplier wording.*Final supplier notes/s);
      assert.equal(await content.locator('iframe').getAttribute('src'), 'https://video.example.test/embed');
      if (javaScriptEnabled) {
        assert.equal(await content.locator('iframe').getAttribute('loading'), 'lazy');
        assert.equal(await content.locator('img').getAttribute('loading'), 'lazy');
        assert.equal(await content.locator('template, noscript').count(), 0);
      }
      assert.equal(await page.locator('link[rel="preload"][as="font"][crossorigin="anonymous"]').count(), 2);
    });
  }
});

test('new mobile purchase and stepped garage states pass axe at 320px and 390px', async () => {
  for (const width of [320, 390]) {
    await withPage({ context: { viewport: { width, height: 844 } } }, async page => {
      await revealPurchase(page);
      await bounded(page);
      await page.addScriptTag({ content: axe.source });
      for (const state of ['purchase', 'garage']) {
        if (state === 'garage') await page.locator('[data-garage-toggle]').click();
        const results = await page.evaluate(() => axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } }));
        assert.deepEqual(results.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(node => node.target) })), [], `${state} at ${width}px`);
      }
      await saveScreenshot(page, `garage-${width}`);
    });
  }
});
