const assert = require('node:assert/strict');
const fs = require('node:fs');
const { test, before, after } = require('node:test');
const { chromium } = require('playwright');
const { mount, product, variants, renderSection, context } = require('./helpers/theme.cjs');

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
    const errors = await mount(page, options);
    await check(page);
    assert.deepEqual(errors, []);
  } finally { await session.close(); }
}

const cart = quantity => ({
  item_count: quantity, total_price: quantity * 10000, currency: 'USD',
  items: quantity ? [{ key: '101:key', product, variant: variants[0], product_title: product.title, variant_title: variants[0].title, quantity, final_line_price: quantity * 10000, url: product.url, url_to_remove: '/cart/change?line=1&quantity=0' }] : [],
});
const json = (route, value) => route.fulfill({ contentType: 'application/json', body: JSON.stringify(value) });
async function cartRoutes(page, state, sectionResponse) {
  await page.route('**/cart.js', route => json(route, cart(state.quantity)));
  await page.route('**/cart/change.js', route => {
    state.quantity = route.request().postDataJSON().quantity;
    return json(route, cart(state.quantity));
  });
  await page.route(url => url.pathname.endsWith('/cart') && url.searchParams.has('section_id'), async route => {
    if (sectionResponse && await sectionResponse(route)) return;
    await route.fulfill({ contentType: 'text/html', body: await renderSection('main-cart-items', context({ cart: cart(state.quantity) })) });
  });
}

test('selected variant media is correct on initial render with and without JavaScript at phone and desktop widths', async () => {
  for (const width of [320, 1440]) for (const javaScriptEnabled of [true, false]) {
    await withPage({ context: { viewport: { width, height: 900 }, javaScriptEnabled }, product: { selected_or_first_available_variant: variants[1] } }, async page => {
      assert.equal(await page.locator('[data-product-form] select').inputValue(), '102');
      assert.equal(await page.locator('[data-gallery-main]').getAttribute('alt'), 'Product photo 6');
      assert.equal(await page.locator('[data-gallery-thumb].is-active').getAttribute('data-media-id'), '6');
      if (javaScriptEnabled) {
        await page.locator('[data-gallery-open]').click();
        assert.equal(await page.locator('[data-gallery-lightbox-current]').textContent(), '6');
      }
    });
  }
});

test('initial gallery retains product-image fallback when the selected variant has no media', async () => {
  await withPage({ product: { selected_or_first_available_variant: { ...variants[1], featured_media: null } } }, async page => {
    assert.equal(await page.locator('[data-gallery-main]').getAttribute('alt'), 'Product photo 1');
    assert.equal(await page.locator('[data-gallery-thumb].is-active').getAttribute('data-media-id'), '1');
  });
});

test('mobile saved-vehicle steps advance unchanged selections and support backwards review without changing the car', async () => {
  const garage = { year: '2017', make: 'BMW', model: '340i', chassis: 'F30', trim: 'B58', variant: '' };
  await withPage({ garage }, async page => {
    await page.locator('[data-garage-toggle]').click();
    const form = page.locator('[data-garage-form]');
    const next = form.locator('[data-garage-step-next]');
    for (const name of ['make', 'model', 'chassis', 'trim']) {
      assert.equal(await form.locator(`[name="vehicle_${name}"]`).isVisible(), true);
      await next.click();
    }
    assert.equal(await form.locator('[name="vehicle_year"]').isVisible(), true);
    assert.equal(await next.isVisible(), false);
    assert.equal(await form.locator('[data-garage-shop]').isVisible(), true);
    await form.locator('[data-garage-step-back]').click();
    assert.equal(await form.locator('[name="vehicle_trim"]').inputValue(), 'B58');
    await next.click();
    assert.deepEqual(await page.evaluate(() => AEGarage.read()), garage);
    await form.locator('[type="submit"]').click();
    assert.equal(await page.evaluate(() => AEGarage.list().length), 1);
  });
});

test('mobile Next rejects missing required values and fits a narrow screen', async () => {
  await withPage({ context: { viewport: { width: 320, height: 844 } } }, async page => {
    await page.locator('[data-garage-toggle]').click();
    await page.locator('[data-garage-step-next]').click();
    assert.equal(await page.locator('[name="vehicle_make"]').isVisible(), true);
    assert.equal(await page.locator('[name="vehicle_make"]').evaluate(node => node === document.activeElement), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.ok(await page.locator('[data-garage-step-next]').evaluate(node => node.getBoundingClientRect().width) >= 44);
  });
});

test('drawer edits refresh main cart quantities, totals and empty state while retaining unsent order notes', async () => {
  await withPage({ template: 'cart', cart: cart(1) }, async page => {
    const state = { quantity: 1 };
    await cartRoutes(page, state);
    await page.locator('[name="note"]').fill('Keep these unsent notes');
    await page.locator('[data-cart-drawer-open]').click();
    await page.locator('[data-cart-qty-increment]').click();
    await page.waitForFunction(() => document.querySelector('[name="updates[]"]').value === '2');
    assert.equal(await page.locator('[name="note"]').inputValue(), 'Keep these unsent notes');
    assert.match(await page.locator('[data-cart-page-content] .cart-footer').textContent(), /200\.00/);
    assert.equal(await page.locator('[data-cart-page] form').evaluate(node => node.inert), false);
    await page.locator('[data-cart-remove]').click();
    await page.waitForFunction(() => !document.querySelector('[data-cart-page] form'));
    assert.equal(await page.locator('[data-cart-page-content] .empty-state').isVisible(), true);
  });
});

test('failed cart section refresh blocks stale submissions and offers Retry without repeating the cart mutation', async () => {
  await withPage({ template: 'cart', cart: cart(1) }, async page => {
    const state = { quantity: 1 };
    let fail = true;
    let changes = 0;
    page.on('request', request => { if (new URL(request.url()).pathname === '/cart/change.js') changes += 1; });
    await cartRoutes(page, state, async route => {
      if (!fail) return false;
      await route.fulfill({ status: 503, body: 'Unavailable' });
      return true;
    });
    await page.locator('[name="note"]').fill('Preserve during retry');
    await page.locator('[data-cart-drawer-open]').click();
    await page.locator('[data-cart-qty-increment]').click();
    await page.waitForFunction(() => !document.querySelector('[data-cart-page-feedback]').hidden);
    assert.equal(await page.locator('[data-cart-page] form').evaluate(node => node.inert), true);
    assert.equal(await page.locator('[data-cart-page] form').evaluate(node => {
      const event = new Event('submit', { bubbles: true, cancelable: true });
      node.dispatchEvent(event);
      return event.defaultPrevented;
    }), true);
    await page.locator('button[data-cart-drawer-close]').click();
    fail = false;
    await page.locator('[data-cart-page-retry]').click();
    await page.waitForFunction(() => document.querySelector('[data-cart-page]').dataset.cartStale !== 'true');
    assert.equal(await page.locator('[name="updates[]"]').inputValue(), '2');
    assert.equal(await page.locator('[name="note"]').inputValue(), 'Preserve during retry');
    assert.equal(await page.locator('[data-cart-page] form').evaluate(node => node.inert), false);
    assert.equal(changes, 1);
  });
});

test('pending cart mutations prevent native checkout and section refresh preserves localized cart URLs', async () => {
  await withPage({ template: 'cart', cart: cart(1), routes: { root_url: '/fr/', cart_url: '/fr/cart' } }, async page => {
    const state = { quantity: 1 };
    let release;
    const pending = new Promise(resolve => { release = resolve; });
    let requested;
    await page.route('**/fr/cart.js', route => json(route, cart(state.quantity)));
    await page.route('**/fr/cart/change.js', async route => {
      state.quantity = route.request().postDataJSON().quantity;
      await pending;
      await json(route, cart(state.quantity));
    });
    await page.route(url => url.pathname === '/fr/cart' && url.searchParams.has('section_id'), async route => {
      requested = route.request().url();
      await route.fulfill({ contentType: 'text/html', body: await renderSection('main-cart-items', context({ cart: cart(state.quantity), routes: { cart_url: '/fr/cart' } })) });
    });
    await page.locator('[data-cart-drawer-open]').click();
    await page.locator('[data-cart-qty-increment]').click();
    try {
      assert.equal(await page.locator('[data-cart-page] form').evaluate(node => node.inert), true);
      assert.equal(await page.locator('[data-cart-page] form').evaluate(node => {
        const event = new Event('submit', { bubbles: true, cancelable: true });
        node.dispatchEvent(event);
        return event.defaultPrevented;
      }), true);
    } finally { release(); }
    await page.waitForFunction(() => document.querySelector('[name="updates[]"]').value === '2');
    assert.equal(new URL(requested).pathname, '/fr/cart');
    assert.equal(new URL(requested).searchParams.get('section_id'), 'main-cart-items');
  });
});

test('malformed cart section responses cannot replace the main form or enable stale checkout', async () => {
  await withPage({ template: 'cart', cart: cart(1) }, async page => {
    await cartRoutes(page, { quantity: 1 }, async route => {
      await route.fulfill({ contentType: 'text/html', body: '<section data-cart-page data-cart-section="main-cart-items"><div data-cart-page-content></div></section>' });
      return true;
    });
    await page.locator('[data-cart-drawer-open]').click();
    await page.locator('[data-cart-qty-increment]').click();
    await page.waitForFunction(() => !document.querySelector('[data-cart-page-feedback]').hidden);
    assert.equal(await page.locator('[name="updates[]"]').inputValue(), '1');
    assert.equal(await page.locator('[data-cart-page] form').evaluate(node => node.inert), true);
  });
});
