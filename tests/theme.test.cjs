const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test, before, after } = require('node:test');
const { chromium } = require('playwright');
const { root, product, variants, fitmentData, renderSection, context, mount } = require('./helpers/theme.cjs');

let browser;
before(async () => {
  const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || (fs.existsSync(chrome) ? chrome : undefined);
  browser = await chromium.launch({ headless: true, executablePath });
});
after(async () => { await browser?.close(); });

async function withPage(options, check) {
  const session = await browser.newContext({ viewport: options.viewport || { width: 1440, height: 1000 }, reducedMotion: options.reducedMotion || 'reduce', javaScriptEnabled: options.javaScriptEnabled ?? true });
  const page = await session.newPage();
  try {
    const errors = await mount(page, options);
    await check(page);
    assert.deepEqual(errors, [], 'No uncaught browser errors');
  } finally { await session.close(); }
}

const cart = (quantity = 1) => ({
  item_count: quantity, total_price: quantity * 12345, currency: 'EUR',
  items: quantity ? [{ key: '101:key', product_title: '<img src=x onerror="window.injected=true"> & Parts', variant_title: 'Standard <edition>', url: '/products/test-part', image: '/assets/brand-bmw-m4.jpg', quantity, final_line_price: quantity * 12345 }] : [],
});
const json = (route, body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

test('newsletter, cart, and gallery close buttons each render a single X', async () => {
  await withPage({ popup: true, formStates: { PopupNewsletter: { errors: true } } }, async (page) => {
    for (const selector of ['.popup-newsletter__close', '.cart-drawer__header button', '.product-gallery-lightbox__close']) {
      assert.equal(await page.locator(`${selector} svg`).count(), 1, `${selector} contains one icon`);
    }
    if (process.env.THEME_SCREENSHOTS) {
      fs.mkdirSync(path.join(root, '.tools/screenshots'), { recursive: true });
      await page.locator('.popup-newsletter__panel').screenshot({ path: path.join(root, '.tools/screenshots/newsletter-close-fixed.png') });
    }
    await page.locator('.popup-newsletter__close').click();
    assert.equal(await page.locator('[data-popup-newsletter]').isVisible(), false);
  });
});

test('one-time card entrances preserve layout and hover behavior on desktop and mobile', async () => {
  for (const width of [320, 390, 768, 1024, 1440]) {
    await withPage({ cards: true, cardsCount: 4, viewport: { width, height: 844 }, reducedMotion: 'no-preference' }, async (page) => {
      const card = page.locator('.product-card').first();
      const before = await card.evaluate((element) => ({ width: element.offsetWidth, height: element.offsetHeight, top: element.offsetTop - element.parentElement.offsetTop }));
      assert.equal(await card.evaluate((element) => getComputedStyle(element).opacity), '1', 'Content is visible before the observer fires');
      await page.evaluate(() => {
        window.motionEvents = [];
        document.addEventListener('animationstart', (event) => window.motionEvents.push(event.animationName));
      });
      await card.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => document.querySelector('.product-card').classList.contains('is-scroll-revealed'));
      if (process.env.THEME_SCREENSHOTS) {
        fs.mkdirSync(path.join(root, '.tools/screenshots'), { recursive: true });
        await page.screenshot({ path: path.join(root, `.tools/screenshots/motion-cards-${width}.png`) });
      }
      await page.waitForFunction(() => document.querySelector('.product-card').classList.contains('is-motion-complete'));
      if (process.env.THEME_SCREENSHOTS) {
        await page.screenshot({ path: path.join(root, `.tools/screenshots/motion-cards-settled-${width}.png`) });
      }
      assert.equal(await page.evaluate(() => window.motionEvents.includes('ae-content-enter')), true);
      assert.deepEqual(await card.evaluate((element) => ({ width: element.offsetWidth, height: element.offsetHeight, top: element.offsetTop - element.parentElement.offsetTop })), before);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `No horizontal overflow at ${width}px`);
      if (width === 1440) {
        await card.hover();
        await page.waitForFunction(() => new DOMMatrix(getComputedStyle(document.querySelector('.product-card')).transform).m42 < 0);
        assert.equal(await card.evaluate((element) => getComputedStyle(element).animationName), 'none');
      }
    });
  }
});

test('entrances are optional when observers or JavaScript are unavailable', async () => {
  for (const fallback of [{ observerUnavailable: true }, { javaScriptEnabled: false }]) {
    await withPage({ cards: true, reducedMotion: 'no-preference', ...fallback }, async (page) => {
      const card = page.locator('.product-card');
      assert.equal(await card.evaluate((element) => getComputedStyle(element).opacity), '1');
      assert.equal(await card.evaluate((element) => getComputedStyle(element).animationName), 'none');
      await card.locator('a.button').click();
      assert.equal(await page.locator('[data-atc-main]').isEnabled(), true);
    });
  }
});

test('changing reduced-motion preference or focusing a card cancels its entrance', async () => {
  await withPage({ cards: true, cardsCount: 2, reducedMotion: 'no-preference' }, async (page) => {
    const card = page.locator('.product-card').first();
    await card.locator('a.button').focus();
    assert.equal(await card.evaluate((element) => element.classList.contains('is-motion-complete')), true);
    assert.equal(await card.evaluate((element) => getComputedStyle(element).opacity), '1');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => Array.from(document.querySelectorAll('.scroll-reveal')).every((element) => element.classList.contains('is-motion-complete')));
    await page.locator('[data-search-toggle]').click();
    assert.equal(await page.locator('.search-drawer .search-form').evaluate((element) => getComputedStyle(element).animationName), 'none');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('[data-search-toggle]').evaluate((element) => document.activeElement === element), true);
  });
});

test('new theme-editor sections register entrances without animating fixed product controls', async () => {
  await withPage({ cards: true, reducedMotion: 'no-preference' }, async (page) => {
    await page.evaluate(() => {
      const section = document.createElement('section');
      section.id = 'editor-motion-test';
      const card = document.querySelector('.product-card').cloneNode(true);
      card.classList.remove('scroll-reveal', 'is-scroll-revealed', 'is-motion-complete');
      section.appendChild(card);
      document.querySelector('.main-content').appendChild(section);
      section.dispatchEvent(new CustomEvent('shopify:section:load', { bubbles: true }));
      section.dispatchEvent(new CustomEvent('shopify:section:load', { bubbles: true }));
    });
    assert.equal(await page.locator('#editor-motion-test .scroll-reveal').count(), 1);
    assert.equal(await page.locator('.product-info.scroll-reveal, .product-gallery.scroll-reveal, [role="dialog"].scroll-reveal').count(), 0);
    await page.locator('#editor-motion-test a.button').focus();
    assert.equal(await page.locator('#editor-motion-test .product-card').evaluate((element) => getComputedStyle(element).animationName), 'none');
    await page.evaluate(() => {
      const section = document.querySelector('#editor-motion-test');
      section.dispatchEvent(new CustomEvent('shopify:section:unload', { bubbles: true }));
      section.remove();
    });
    assert.equal(await page.locator('#editor-motion-test').count(), 0);
  });
});

test('drawer and cart-count motion preserve cart updates and reduced-motion behavior', async () => {
  for (const reducedMotion of ['no-preference', 'reduce']) {
    await withPage({ reducedMotion }, async (page) => {
      await page.route('**/cart.js', (route) => json(route, cart()));
      await page.route('**/cart/change.js', (route) => json(route, cart(route.request().postDataJSON().quantity)));
      await page.locator('[data-search-toggle]').click();
      assert.equal(await page.locator('.search-drawer .search-form').evaluate((element) => getComputedStyle(element).animationName), reducedMotion === 'reduce' ? 'none' : 'ae-panel-enter');
      await page.keyboard.press('Escape');
      await page.locator('[data-cart-drawer-open]').click();
      await page.locator('[data-cart-qty-increment]').waitFor();
      assert.equal(await page.locator('[data-cart-count]').evaluate((element) => getComputedStyle(element).animationName), reducedMotion === 'reduce' ? 'none' : 'ae-count-feedback');
      await page.locator('[data-cart-qty-increment]').click();
      await page.waitForFunction(() => document.querySelector('[data-cart-qty-input]').value === '2' && !document.querySelector('[data-cart-qty-input]').disabled);
      assert.match(await page.locator('.cart-drawer__subtotal').textContent(), /246[.,]90/);
      await page.locator('[data-cart-remove]').click();
      await page.locator('.cart-drawer__empty').waitFor();
      assert.equal(await page.locator('[data-cart-count]').isVisible(), false);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('[data-cart-drawer-open]').evaluate((element) => document.activeElement === element), true);
    });
  }
});

test('variant selection updates exact price, stock, SKU, gallery, URL and buy controls', async () => {
  await withPage({}, async (page) => {
    assert.equal((await page.locator('[data-product-price]').textContent()).trim(), '$100.00');
    await page.locator('[data-product-form] select').selectOption('102');
    assert.match(await page.locator('[data-product-price]').textContent(), /\$150\.00/);
    assert.equal(await page.locator('[data-product-price] s').textContent(), '$200.00');
    assert.match(await page.locator('[data-product-stock]').textContent(), /Only 2 left/);
    assert.equal(await page.locator('[data-product-sku]').textContent(), 'AE-PREMIUM');
    assert.equal(await page.locator('[data-media-id="6"]').getAttribute('aria-current'), 'true');
    assert.match(page.url(), /variant=102/);
    await page.locator('[data-product-form] select').selectOption('103');
    assert.equal(await page.locator('[data-atc-main]').isDisabled(), true);
    assert.equal(await page.locator('[data-product-payment]').isVisible(), false);
    assert.equal(await page.locator('[data-back-in-stock]').isVisible(), true);
    assert.match(await page.locator('[name="contact[body]"]').inputValue(), /Limited \(103\)/);
    await page.locator('[data-product-form] select').selectOption('101');
    assert.equal(await page.locator('[data-atc-main]').isDisabled(), false);
    assert.equal(await page.locator('[data-back-in-stock]').isVisible(), false);
  });
});

test('quick buy requires options for products with variants', async () => {
  await withPage({ cards: true }, async (page) => {
    assert.equal(await page.locator('.product-card__quick-buy').count(), 0);
    assert.equal(await page.locator('.product-card a.button').textContent(), 'Choose options');
  });
  await withPage({ cards: true, product: { has_only_default_variant: true } }, async (page) => {
    assert.equal(await page.locator('.product-card__quick-buy').count(), 1);
  });
});

test('fixed-width description media and fitment tables stay within the mobile product layout', async () => {
  const description = '<iframe title="Installation video" width="560" height="315" src="about:blank"></iframe><table style="width:700px"><tr><td>Volkswagen</td><td>Golf VI</td><td>Competition intercooler compatibility</td></tr></table>';
  for (const width of [320, 390, 768]) {
    await withPage({ viewport: { width, height: 844 }, product: { description } }, async (page) => {
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      for (const selector of ['.product-gallery', '.product-info', '.product-description iframe', '.product-description table']) {
        assert.equal(await page.locator(selector).evaluate((element) => element.getBoundingClientRect().right <= innerWidth), true, `${selector} fits at ${width}px`);
      }
      assert.match(await page.locator('.product-description table').textContent(), /Competition intercooler compatibility/);
    });
  }
});

test('two-column mobile product-card glows do not widen the page', async () => {
  for (const width of [320, 390]) {
    await withPage({ cards: true, cardsCount: 2, viewport: { width, height: 844 } }, async (page) => {
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await page.locator('.product-card a.button').last().focus();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    });
  }
});

test('all seven gallery photos are accessible and the lightbox traps and restores focus', async () => {
  await withPage({}, async (page) => {
    assert.equal(await page.locator('[data-gallery-thumb]').count(), 7);
    await page.locator('[data-media-id="7"]').click();
    await page.locator('[data-gallery-open]').click();
    assert.equal((await page.locator('.product-gallery-lightbox__count').innerText()).replace(/\s+/g, ' '), '7 / 7');
    await page.keyboard.press('ArrowRight');
    assert.equal((await page.locator('.product-gallery-lightbox__count').innerText()).replace(/\s+/g, ' '), '1 / 7');
    await page.locator('[data-gallery-lightbox-next]').focus();
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('[data-gallery-lightbox]').evaluate((element) => element.contains(document.activeElement)), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('[data-gallery-lightbox]').evaluate((element) => element.inert), true);
    assert.equal(await page.locator('[data-gallery-open]').evaluate((element) => element === document.activeElement), true);
  });
});

test('cart add errors stay on the product page without duplicate native submissions', async () => {
  await withPage({}, async (page) => {
    let requests = 0;
    await page.route('**/cart/add.js', (route) => { requests += 1; return json(route, { description: 'Only one item is available.' }, 422); });
    await page.locator('[data-atc-main]').click();
    await page.locator('[data-product-error]').waitFor({ state: 'visible' });
    assert.equal(await page.locator('[data-product-error]').textContent(), 'Only one item is available.');
    assert.equal(requests, 1);
    assert.equal(await page.locator('[data-atc-main]').isDisabled(), false);
    assert.match(page.url(), /products\/test-part$/);
  });
});

test('a successful add followed by a failed refresh reports the add without retrying it', async () => {
  await withPage({}, async (page) => {
    let requests = 0;
    await page.route('**/cart/add.js', (route) => { requests += 1; return json(route, { id: 101 }); });
    await page.route('**/cart.js', (route) => route.abort());
    await page.locator('[data-atc-main]').click();
    await page.locator('[data-product-error]').waitFor({ state: 'visible' });
    assert.match(await page.locator('[data-product-error]').textContent(), /Your item was added/);
    assert.equal(requests, 1);
  });
});

test('cart uses locale routes, presentment currency and escapes product content', async () => {
  await withPage({ routes: { root_url: '/fr/', cart_url: '/fr/cart', all_products_collection_url: '/fr/collections/all' } }, async (page) => {
    await page.route('**/fr/cart.js', (route) => json(route, cart()));
    await page.locator('[data-cart-drawer-open]').click();
    await page.locator('[data-cart-line]').waitFor();
    assert.equal(await page.locator('.cart-drawer__title').textContent(), cart().items[0].product_title);
    assert.equal(await page.locator('.cart-drawer__title img').count(), 0);
    assert.match(await page.locator('.cart-drawer__line-price').textContent(), /123[.,]45/);
    assert.match(await page.locator('.cart-drawer__line-price').textContent(), /\u20ac/);
    assert.equal(await page.locator('.cart-drawer__footer a').first().getAttribute('href'), '/fr/cart');
    assert.equal(await page.evaluate(() => window.injected), undefined);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('[data-cart-drawer-open]').evaluate((element) => element === document.activeElement), true);
  });
});

test('quantity requests cannot race and focus survives cart rendering', async () => {
  await withPage({}, async (page) => {
    await page.route('**/cart.js', (route) => json(route, cart()));
    let requests = 0;
    await page.route('**/cart/change.js', async (route) => {
      requests += 1;
      assert.equal(route.request().postDataJSON().quantity, 2);
      await new Promise((resolve) => setTimeout(resolve, 50));
      return json(route, cart(2));
    });
    await page.locator('[data-cart-drawer-open]').click();
    await page.locator('[data-cart-qty-increment]').waitFor();
    await page.locator('[data-cart-qty-increment]').focus();
    await page.locator('[data-cart-qty-increment]').evaluate((button) => { button.click(); button.click(); });
    await page.waitForFunction(() => document.querySelector('[data-cart-qty-input]').value === '2' && !document.querySelector('[data-cart-qty-input]').disabled);
    assert.equal(requests, 1);
    assert.equal(await page.locator('[data-cart-qty-increment]').evaluate((element) => element === document.activeElement), true);
  });
});

test('failed cart quantity changes surface an error and preserve the last confirmed cart', async () => {
  await withPage({}, async (page) => {
    await page.route('**/cart.js', (route) => json(route, cart()));
    await page.route('**/cart/change.js', (route) => json(route, { description: 'Inventory limit reached.' }, 422));
    await page.locator('[data-cart-drawer-open]').click();
    await page.locator('[data-cart-qty-input]').fill('25');
    await page.locator('[data-cart-qty-increment]').click();
    await page.locator('[data-cart-error]').waitFor({ state: 'visible' });
    assert.equal(await page.locator('[data-cart-error]').textContent(), 'Inventory limit reached.');
    assert.equal(await page.locator('[data-cart-qty-input]').inputValue(), '1');
    assert.equal(await page.locator('[data-cart-qty-increment]').isDisabled(), false);
  });
});

test('empty-cart Continue shopping follows its collection link', async () => {
  await withPage({}, async (page) => {
    await page.route('**/cart.js', (route) => json(route, cart(0)));
    await page.locator('[data-cart-drawer-open]').click();
    await page.locator('.cart-drawer__empty a').click();
    await page.waitForURL('**/collections/all');
  });
});

const garage = { make: 'BMW', year: '2017', model: '340i', chassis: 'F30', trim: 'B58', variant: '' };
async function saveAudi(page) {
  await page.locator('[data-garage-toggle]').click();
  const form = page.locator('[data-garage-form]');
  await form.locator('[name="vehicle_make"]').selectOption('Audi');
  assert.equal(await form.locator('[name="vehicle_model"]').inputValue(), '');
  await form.locator('[name="vehicle_year"]').fill('2019');
  await form.locator('[name="vehicle_model"]').selectOption('S4');
  await form.locator('[name="vehicle_chassis"]').selectOption('B9');
  await form.locator('[name="vehicle_trim"]').selectOption('3.0T');
  await form.locator('button[type="submit"]').click();
}

test('saving another vehicle updates every finder and clearing resets all selects', async () => {
  await withPage({ finder: true, garage }, async (page) => {
    await saveAudi(page);
    assert.equal(await page.locator('[data-vehicle-finder] [name="vehicle_make"]').inputValue(), 'Audi');
    assert.equal(await page.locator('[data-vehicle-finder] [name="vehicle_chassis"]').inputValue(), 'B9');
    await page.locator('[data-vehicle-clear]').click();
    assert.equal(await page.locator('[data-garage-form] [name="vehicle_make"]').inputValue(), '');
    assert.equal(await page.locator('[data-vehicle-finder] [name="vehicle_model"]').inputValue(), '');
  });
});

test('garage and filter preferences work when browser storage is disabled', async () => {
  await withPage({ finder: true, storageBlocked: true, template: 'collection' }, async (page) => {
    await saveAudi(page);
    await page.locator('[data-fitment-filter-toggle]').check();
    assert.equal(await page.locator('[data-fitment-filter-toggle]').isChecked(), true);
    assert.equal(await page.locator('[data-product-card]').isVisible(), false);
    assert.equal(await page.locator('[data-fitment-empty]').isVisible(), true);
    assert.match(await page.locator('[data-garage-title]').textContent(), /Audi S4 \(B9\)/);
  });
});

test('fitment uses complete explicit rows and never claims a model year is verified', async () => {
  await withPage({ garage }, async (page) => {
    const states = await page.evaluate(() => ['wrong', 'cross', 'missing', 'restricted', 'test-part'].map((handle) => AEGarage.state(handle)));
    assert.deepEqual(states, ['not-listed', 'not-listed', 'unknown', 'review', 'listed']);
    assert.match(await page.locator('[data-fitment-badge-text]').textContent(), /confirm year/);
    assert.equal(await page.locator('.fitment-badge.is-fit').count(), 0);
  });
});

test('vehicle search does not require every engine and model alias simultaneously', async () => {
  await withPage({ finder: true, garage }, async (page) => {
    await page.locator('[data-vehicle-finder] [name="part_type"]').selectOption('Intercooler');
    await page.locator('[data-vehicle-finder] button[type="submit"]').click();
    await page.waitForURL('**/search?**');
    assert.equal(new URL(page.url()).searchParams.get('q'), 'Intercooler');
    assert.equal(await page.evaluate(() => localStorage.getItem('autobahn:garageFitOnly')), 'true');
  });
});

test('garage rejects partial selections and asks legacy saved vehicles to be updated', async () => {
  await withPage({ template: 'collection', garage: { ...garage, model: '3 Series' } }, async (page) => {
    assert.match(await page.locator('[data-garage-title]').textContent(), /Update your saved vehicle/);
    assert.equal(await page.locator('[data-fitment-filter-toggle]').isDisabled(), true);
    await page.locator('[data-garage-toggle]').click();
    const form = page.locator('[data-garage-form]');
    await form.locator('[name="vehicle_make"]').selectOption('Audi');
    await form.evaluate((form) => form.dispatchEvent(new Event('submit', { cancelable: true })));
    assert.match(await form.locator('[data-garage-error]').textContent(), /complete listed vehicle/);
    assert.equal(await page.locator('[data-garage-drawer]').isVisible(), true);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('autobahn:garage')).model), '3 Series');
  });
});

test('selecting model, chassis and engine preserves the independently entered year', async () => {
  await withPage({ garage }, async (page) => {
    await page.locator('[data-garage-toggle]').click();
    const form = page.locator('[data-garage-form]');
    await form.locator('[name="vehicle_make"]').selectOption('Audi');
    assert.equal(await form.locator('[name="vehicle_year"]').inputValue(), '2017');
    assert.equal(await form.locator('[name="vehicle_chassis"]').isDisabled(), true);
    await form.locator('[name="vehicle_model"]').selectOption('S4');
    await form.locator('[name="vehicle_chassis"]').selectOption('B9');
    await form.locator('[name="vehicle_trim"]').selectOption('3.0T');
    assert.equal(await form.locator('[name="vehicle_year"]').inputValue(), '2017');
    await form.locator('[name="vehicle_year"]').fill('3000');
    await form.evaluate((form) => form.dispatchEvent(new Event('submit', { cancelable: true })));
    assert.equal(await page.locator('[data-garage-drawer]').isVisible(), true);
    assert.equal(await page.evaluate(() => AEGarage.read().make), 'BMW');
  });
});

test('saved garage survives reload and responds to another tab changing storage', async () => {
  await withPage({ garage }, async (page) => {
    await saveAudi(page);
    await page.reload();
    assert.equal(await page.locator('[data-garage-form] [name="vehicle_model"]').inputValue(), 'S4');
    await page.evaluate(() => {
      localStorage.setItem('autobahn:garage', JSON.stringify({ make: 'BMW', model: '335i', chassis: 'E90', trim: 'N54', year: '2008' }));
      window.dispatchEvent(new StorageEvent('storage', { key: 'autobahn:garage' }));
    });
    assert.match(await page.locator('[data-garage-title]').textContent(), /335i.*E90.*N54/);
    assert.equal(await page.locator('[data-garage-form] [name="vehicle_trim"]').inputValue(), 'N54');
    await page.reload();
    assert.equal(await page.locator('[data-garage-form] [name="vehicle_model"]').inputValue(), '335i');
  });
});

test('actual CSV catalog lists explicit N54 and N55 alternatives without title guessing', async () => {
  const vehicle = { make: 'BMW', model: '335i', chassis: 'E90', trim: 'N54', year: '2008' };
  await withPage({ actualFitment: true, garage: vehicle }, async (page) => {
    const states = await page.evaluate(() => ({
      downpipe: AEGarage.state('bmw-135i-n54-3-catless-downpipes'),
      intercooler: AEGarage.state('135i-5-intercooler-fmic'),
      n55Downpipe: AEGarage.state('bmw-135i-n54-3-catless-downpipes', { ...AEGarage.read(), trim: 'N55' }),
      n55Intercooler: AEGarage.state('135i-5-intercooler-fmic', { ...AEGarage.read(), trim: 'N55' }),
      unknown: AEGarage.state('bootmod3-n63t3-bmw-g-series-m550-750i-m850i-x5m50i-x6m50i-x7m50i-tune'),
    }));
    assert.ok(['listed', 'review'].includes(states.downpipe));
    assert.ok(['listed', 'review'].includes(states.intercooler));
    assert.equal(states.n55Downpipe, 'not-listed');
    assert.ok(['listed', 'review'].includes(states.n55Intercooler));
    assert.equal(states.unknown, 'unknown');
  });
});

test('missing catalog fails closed and does not disable ordinary shopping', async () => {
  await withPage({ template: 'collection', garage, fitmentData: { version: 1, vehicles: [], products: {} } }, async (page) => {
    assert.equal(await page.locator('[data-fitment-filter-toggle]').isDisabled(), true);
    assert.equal(await page.locator('[data-product-card]').isVisible(), true);
    await page.locator('[data-garage-toggle]').click();
    await page.locator('[data-garage-form]').evaluate((form) => form.dispatchEvent(new Event('submit', { cancelable: true })));
    assert.match(await page.locator('[data-garage-error]').textContent(), /unavailable/);
  });
});

test('storage-blocked finder navigation carries a validated vehicle without claiming persistence', async () => {
  await withPage({ storageBlocked: true, finder: true }, async (page) => {
    await saveAudi(page);
    assert.match(await page.locator('[data-garage-summary]').textContent(), /this page only/);
    await page.locator('[data-vehicle-finder] button[type="submit"]').click();
    await page.waitForURL('**/collections/all?**');
    const selection = JSON.parse(new URL(page.url()).searchParams.get('ae_vehicle'));
    assert.equal(selection.model, 'S4');
    assert.equal(await page.evaluate(() => AEGarage.read().model), 'S4');
    await page.locator('[data-vehicle-clear]').click();
    assert.equal(new URL(page.url()).searchParams.has('ae_vehicle'), false);
  });
});

test('garage fields and actions fit phone, tablet and desktop without overlap', async () => {
  for (const width of [320, 390, 768, 1024, 1440]) {
    await withPage({ actualFitment: true, viewport: { width, height: 844 } }, async (page) => {
      await page.locator('[data-garage-toggle]').click();
      const form = page.locator('[data-garage-form]');
      await form.locator('[name="vehicle_make"]').selectOption('BMW');
      await form.locator('[name="vehicle_model"]').selectOption('335i');
      await form.locator('[name="vehicle_chassis"]').selectOption('E90');
      await form.locator('[name="vehicle_trim"]').selectOption('N54');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      assert.deepEqual(await form.locator('.garage-field').evaluateAll((fields) => fields.filter((field) => field.scrollWidth > field.clientWidth).map((field) => field.textContent)), []);
      const overlap = await form.locator('.garage-field, .garage-form__actions').evaluateAll((items) => {
        const boxes = items.map((item) => item.getBoundingClientRect());
        return boxes.some((a, index) => boxes.slice(index + 1).some((b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1));
      });
      assert.equal(overlap, false);
      if (process.env.THEME_SCREENSHOTS) {
        fs.mkdirSync(path.join(root, '.tools/screenshots'), { recursive: true });
        await page.screenshot({ path: path.join(root, `.tools/screenshots/garage-csv-${width}.png`) });
      }
      await page.locator('[data-garage-close]').click();
      assert.equal(await page.locator('[data-garage-toggle]').evaluate((element) => element === document.activeElement), true);
    });
  }
});

async function collectionPage(number, handle) {
  return renderSection('main-collection-product-grid', context({
    paginate: { pages: 2, current_page: number },
    collection: { products: [{ ...product, handle, url: '/products/' + handle }], products_count: 2 },
  }));
}

test('garage filtering includes later pages and restores pagination and original order when disabled', async () => {
  await withPage({ template: 'collection', garage, paginate: { pages: 2 }, collection: { products: [{ ...product, handle: 'wrong' }] } }, async (page) => {
    let requestURL;
    await page.evaluate(() => history.replaceState({}, '', '/fr/collections/bmw/Charge-pipe?sort_by=price-ascending'));
    await page.route('**/*section_id=*', async (route) => {
      requestURL = new URL(route.request().url());
      await route.fulfill({ contentType: 'text/html', body: await collectionPage(2, 'test-part') });
    });
    await page.locator('[data-fitment-filter-toggle]').check();
    await page.waitForFunction(() => document.querySelector('[data-fitment-grid]').getAttribute('aria-busy') === 'false');
    assert.equal(await page.locator('[data-product-card]:visible').count(), 1);
    assert.equal(await page.locator('[data-product-card]:visible').getAttribute('data-product-handle'), 'test-part');
    assert.equal(requestURL.pathname, '/fr/collections/bmw/Charge-pipe');
    assert.equal(requestURL.searchParams.get('sort_by'), 'price-ascending');
    assert.equal(requestURL.searchParams.get('page'), '2');
    assert.equal(await page.locator('[data-fitment-pagination]').isVisible(), false);
    await page.locator('[data-fitment-filter-toggle]').uncheck();
    assert.equal(await page.locator('[data-product-card]').count(), 1);
    assert.equal(await page.locator('[data-product-card]').getAttribute('data-product-handle'), 'wrong');
    assert.equal(await page.locator('[data-fitment-pagination]').getAttribute('hidden'), null);
  });
});

test('page-loading failures show unfiltered products and support retry without partial results', async () => {
  await withPage({ template: 'collection', garage, paginate: { pages: 2 } }, async (page) => {
    let fail = true;
    await page.route('**/*section_id=*', async (route) => route.fulfill({
      status: fail ? 500 : 200, contentType: 'text/html', body: fail ? 'Unavailable' : await collectionPage(2, 'wrong'),
    }));
    await page.locator('[data-fitment-filter-toggle]').check();
    await page.locator('[data-fitment-retry]').waitFor({ state: 'visible' });
    assert.equal(await page.locator('[data-product-card]:visible').count(), 1);
    assert.equal(await page.locator('[data-fitment-filter-toggle]').isChecked(), false);
    assert.match(await page.locator('[data-fitment-filter-status]').textContent(), /unfiltered/);
    fail = false;
    await page.locator('[data-fitment-retry]').click();
    await page.waitForFunction(() => document.querySelector('[data-fitment-grid]').getAttribute('aria-busy') === 'false');
    assert.equal(await page.locator('[data-fitment-filter-toggle]').isChecked(), true);
    assert.equal(await page.locator('[data-fitment-retry]').isVisible(), false);
    assert.equal(await page.locator('[data-product-card]:visible').count(), 1);
  });
});

test('invalid section responses and excessive page counts do not masquerade as no matches', async () => {
  for (const pages of [2, 51]) {
    await withPage({ template: 'collection', garage, paginate: { pages } }, async (page) => {
      await page.route('**/*section_id=*', (route) => route.fulfill({ contentType: 'text/html', body: '<section>Missing grid</section>' }));
      await page.locator('[data-fitment-filter-toggle]').click();
      await page.locator('[data-fitment-retry]').waitFor({ state: 'visible' });
      assert.equal(await page.locator('[data-product-card]:visible').count(), 1);
      assert.equal(await page.locator('[data-fitment-empty]').isVisible(), false);
    });
  }
});

test('turning the filter off during loading prevents stale results from replacing the original grid', async () => {
  await withPage({ template: 'collection', garage, paginate: { pages: 2 } }, async (page) => {
    let release;
    const held = new Promise((resolve) => { release = resolve; });
    await page.route('**/*section_id=*', async (route) => {
      await held;
      await route.fulfill({ contentType: 'text/html', body: await collectionPage(2, 'wrong') }).catch(() => {});
    });
    await page.locator('[data-fitment-filter-toggle]').check();
    assert.equal(await page.locator('[data-fitment-grid]').getAttribute('aria-busy'), 'true');
    await page.locator('[data-fitment-filter-toggle]').uncheck();
    release();
    await page.waitForFunction(() => document.querySelector('[data-fitment-grid]').getAttribute('aria-busy') === 'false');
    assert.equal(await page.locator('[data-product-card]').count(), 1);
    assert.equal(await page.locator('[data-product-card]').getAttribute('data-product-handle'), 'test-part');
    assert.equal(await page.locator('[data-fitment-retry]').isVisible(), false);
  });
});

test('submodel restrictions and explicit engine alternatives remain separate configurations', async () => {
  const restricted = structuredClone(fitmentData);
  restricted.vehicles.push({ make: 'Audi', model: 'A3', chassis: '8P', engine: '2.0T', variant: 'FWD', years: null });
  restricted.products.drive = { records: [4], review: false };
  await withPage({ fitmentData: restricted, garage: { make: 'Audi', model: 'A3', chassis: '8P', trim: '2.0T', variant: 'FWD' } }, async (page) => {
    assert.equal(await page.evaluate(() => AEGarage.state('drive')), 'listed');
    assert.equal(await page.evaluate(() => AEGarage.state('drive', { ...AEGarage.read(), variant: 'AWD' })), 'empty');
    assert.equal(await page.locator('[data-garage-form] [name="vehicle_variant"]').inputValue(), 'FWD');
  });
});

test('newsletter errors reopen a dismissed popup and invalid email cannot submit', async () => {
  await withPage({ popup: true, formStates: { PopupNewsletter: { errors: true } } }, async (page) => {
    assert.equal(await page.locator('[data-popup-newsletter]').isVisible(), true);
    await page.locator('#PopupNewsletterEmail').fill('invalid');
    await page.locator('.popup-newsletter__submit').click();
    assert.equal(await page.locator('#PopupNewsletterEmail').evaluate((element) => element.checkValidity()), false);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('[data-popup-newsletter]').isVisible(), false);
  });
});

test('contact navigation targets the theme contact and shipping pages', async () => {
  await withPage({}, async (page) => {
    assert.equal(await page.locator('.nav-dropdown--contacts a').first().getAttribute('href'), '/pages/contact');
    assert.equal(await page.locator('.nav-dropdown--contacts a').last().getAttribute('href'), '/pages/shipping-returns');
  });
});

test('mobile and desktop headers and hero fit their containers', async () => {
  for (const width of [320, 390, 768, 1024, 1440]) {
    await withPage({ template: 'index', viewport: { width, height: 900 } }, async (page) => {
      const metrics = await page.evaluate(() => {
        const logo = document.querySelector('.header-logo').getBoundingClientRect();
        const actions = document.querySelector('.header-actions').getBoundingClientRect();
        const hero = document.querySelector('.hero__content').getBoundingClientRect();
        const lines = Array.from(document.querySelectorAll('.hero-typewriter__line'), (element) => element.getBoundingClientRect().right);
        return { logoRight: logo.right, actionsLeft: actions.left, heroRight: hero.right, lines };
      });
      assert.ok(metrics.logoRight <= metrics.actionsLeft + 1, `Header at ${width}px`);
      assert.ok(metrics.lines.every((right) => right <= metrics.heroRight + 1), `Hero at ${width}px`);
      assert.ok(await page.locator('.hero__media img').evaluate((image) => image.complete && image.naturalWidth > 0 && image.currentSrc.includes('.webp')), 'Hero WebP loads');
      if (width < 991) {
        await page.locator('[data-menu-toggle]').click();
        await page.evaluate(() => window.scrollTo(0, 900));
        assert.equal(await page.locator('[data-mobile-nav]').isVisible(), true);
        assert.equal(await page.locator('.site-header').evaluate((element) => element.classList.contains('is-hidden')), false);
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('[data-menu-toggle]').getAttribute('aria-expanded'), 'false');
      }
      if (process.env.THEME_SCREENSHOTS) {
        await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
        fs.mkdirSync(path.join(root, '.tools/screenshots'), { recursive: true });
        await page.screenshot({ path: path.join(root, `.tools/screenshots/home-${width}.png`), fullPage: true });
      }
    });
  }
});

test('hero has readable content without JavaScript and respects editor headings', async () => {
  await withPage({ template: 'index', javaScriptEnabled: false, viewport: { width: 390, height: 844 } }, async (page) => {
    assert.equal(await page.locator('[data-hero-typewriter-base]').isVisible(), true);
    assert.equal(await page.locator('[data-hero-typewriter-base]').textContent(), 'Built For');
  });
  const html = await renderSection('hero-autobahn', context(), { settings: { heading: 'Drive Your', accent_heading: 'Passion.' } });
  assert.match(html, /Drive Your\|Passion;/);
});

test('footer and back-in-stock forms expose successful submission feedback', async () => {
  await withPage({ formStates: { FooterNewsletter: { 'posted_successfully?': true }, BackInStockForm: { 'posted_successfully?': true } } }, async (page) => {
    assert.match(await page.locator('#FooterNewsletter [role="status"]').textContent(), /Thanks for subscribing/);
    assert.equal(await page.locator('#BackInStockForm [role="status"]').isVisible(), true);
    const ids = await page.locator('[id]').evaluateAll((elements) => elements.map((element) => element.id));
    assert.equal(new Set(ids).size, ids.length, 'No duplicate element IDs');
  });
});

test('cart notes and product titles cannot inject markup', async () => {
  const hostile = '</textarea><img src=x onerror="window.injected=true">';
  await withPage({ template: 'cart', cart: { item_count: 1, items: [{ product, variant: variants[0], quantity: 1, final_line_price: 10000, url: product.url, url_to_remove: '/cart/change?line=1&quantity=0' }], note: hostile } }, async (page) => {
    assert.equal(await page.locator('#CartNote').inputValue(), hostile);
    assert.equal(await page.locator('img[src="x"]').count(), 0);
    assert.equal(await page.evaluate(() => window.injected), undefined);
  });
  await withPage({ product: { title: hostile } }, async (page) => {
    assert.equal(await page.locator('[data-product-info] h1').textContent(), hostile);
    assert.equal(await page.locator('img[src="x"]').count(), 0);
  });
});

test('mobile navigation and cart links work without JavaScript', async () => {
  await withPage({ template: 'index', javaScriptEnabled: false, viewport: { width: 320, height: 844 } }, async (page) => {
    assert.equal(await page.locator('[data-mobile-nav]').isVisible(), true);
    assert.equal(await page.locator('[data-menu-toggle]').isVisible(), false);
    assert.equal(await page.locator('[data-cart-drawer-open]').getAttribute('href'), '/cart');
    assert.ok(await page.locator('.hero-typewriter__line').first().evaluate((line) => line.getBoundingClientRect().right <= window.innerWidth));
  });
});

test('contact and fitment fields have accessible labels', async () => {
  for (const template of ['contact', 'fitment']) {
    await withPage({ template }, async (page) => {
      const unlabeled = await page.locator('main input:not([type="hidden"]), main select, main textarea').evaluateAll((fields) => fields.filter((field) => !field.labels?.length && !field.getAttribute('aria-label')).map((field) => field.name));
      assert.deepEqual(unlabeled, []);
    });
  }
});

test('opening search and garage keeps the sticky header visible while scrolling', async () => {
  await withPage({}, async (page) => {
    await page.locator('[data-search-toggle]').click();
    await page.evaluate(() => window.scrollTo(0, 700));
    await page.waitForFunction(() => !document.querySelector('.site-header').classList.contains('is-hidden'));
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('[data-search-toggle]').evaluate((element) => element === document.activeElement), true);
    await page.locator('[data-garage-toggle]').click();
    await page.evaluate(() => window.scrollTo(0, 1000));
    assert.equal(await page.locator('.site-header').evaluate((element) => element.classList.contains('is-hidden')), false);
  });
});

test('product description retains its original content order', async () => {
  await withPage({}, async (page) => {
    assert.deepEqual(await page.locator('[data-product-description] > p').allTextContents(), ['ARM Motorsports charge pipe performance details.', 'Installation details.']);
  });
});

test('password heading stays inside the viewport', async () => {
  for (const width of [320, 390, 768, 1024, 1440]) {
    await withPage({ template: 'password', viewport: { width, height: 900 } }, async (page) => {
      const fits = await page.locator('.password-hero__heading .hero-typewriter__typing').evaluateAll((lines) => lines.every((line) => {
        const rect = line.getBoundingClientRect();
        return rect.left >= 0 && rect.right <= window.innerWidth;
      }));
      assert.equal(fits, true, `Password heading at ${width}px`);
    });
  }
});

test('search text and variant JSON cannot terminate their HTML containers', async () => {
  const hostile = '</script><img src=x onerror="window.injected=true">';
  await withPage({ template: 'search', search: { terms: hostile } }, async (page) => {
    assert.equal(await page.locator('img[src="x"]').count(), 0);
    assert.match(await page.locator('main').textContent(), /<img src=x/);
  });
  await withPage({ product: { variants: [variants[0], { ...variants[1], title: hostile, sku: hostile }] } }, async (page) => {
    assert.equal(await page.locator('img[src="x"]').count(), 0);
    await page.locator('[data-product-form] select').selectOption('102');
    assert.equal(await page.locator('[data-product-sku]').textContent(), hostile);
  });
});
