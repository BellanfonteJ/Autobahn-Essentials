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

const nativeFilters = () => {
  const value = (param_name, value, label, count, active = false) => ({ param_name, value, label, count, active, url_to_remove: '/collections/bmw?sort_by=best-selling' });
  return [
    { label: 'Availability', type: 'boolean', values: [value('filter.v.availability', '1', 'Available', 12), value('filter.v.availability', '0', 'Unavailable', 0)], active_values: [] },
    { label: 'Brand', type: 'list', values: [value('filter.p.vendor', 'ARM Motorsports', 'ARM Motorsports', 8), value('filter.p.vendor', 'Autobahn Essentials', 'Autobahn Essentials', 4)], active_values: [] },
    { label: 'Part type', type: 'list', values: [value('filter.p.product_type', 'Charge pipe', 'Charge pipe', 8)], active_values: [] },
    { label: 'Price', type: 'price_range', min_value: { param_name: 'filter.v.price.gte', value: null }, max_value: { param_name: 'filter.v.price.lte', value: null }, range_max: 89999, active_values: [], url_to_remove: '/collections/bmw?sort_by=best-selling' },
  ];
};

test('product resources only expose supplied guides and existing policies without made-up specs', async () => {
  for (const url of ['https://manufacturer.example.test/guide.pdf', 'javascript:alert(1)', 'http://manufacturer.example.test/guide.pdf', '']) {
    await withPage({ pages: { contact: { url: '/pages/contact' }, 'shipping-returns': { url: '/pages/shipping-returns' } }, product: { metafields: { custom: { installation_guide: { type: 'url', value: url } } } } }, async (page) => {
      assert.equal(await page.locator('.product-resources a').filter({ hasText: 'Installation guide' }).count(), url.startsWith('https://') ? 1 : 0);
      assert.equal(await page.locator('.product-resources a').filter({ hasText: 'Fitment help' }).getAttribute('href'), '/pages/contact');
      assert.match(await page.locator('.product-resources').innerText(), /Confirm model year/);
      assert.ok(!(await page.locator('.spec-table').innerText()).includes('OEM+ / Performance'));
    });
  }
  await withPage({}, async (page) => {
    assert.equal(await page.locator('.product-resources a').count(), 0);
  });
});

test('typed product specifications and shipping notes render safely without promising delivery dates', async () => {
  const custom = { specifications: { type: 'rich_text_field', value: 'Verified supplier specification' }, shipping_note: { type: 'multi_line_text_field', value: '<img src=x onerror=alert(1)>\nSpecial order: contact support.' } };
  await withPage({ product: { metafields: { custom } } }, async (page) => {
    assert.match(await page.locator('.product-specifications').innerText(), /Verified supplier specification/);
    const shipping = page.locator('.product-tabs details').last();
    await shipping.locator('summary').click();
    assert.equal(await shipping.locator('img').count(), 0);
    assert.match(await shipping.innerText(), /<img.*Special order/s);
    assert.match(await shipping.innerText(), /confirmed at checkout/);
  });
});

test('health diagnostics reject arbitrary payloads and never persist or transmit them', async () => {
  await withPage({ template: 'search', search: { results_count: 0, results: [], terms: 'private@example.test' } }, async (page) => {
    const outgoing = [];
    page.on('request', (request) => outgoing.push(request.url()));
    const result = await page.evaluate(() => {
      const before = { ...localStorage };
      window.AEHealth.report({ email: 'private@example.test' });
      window.AEHealth.report('private@example.test');
      for (let i = 0; i < 60; i++) window.AEHealth.report('cart_add_error');
      const snapshot = window.AEHealth.snapshot();
      snapshot.counts.cart_add_error = -1;
      snapshot.recent.push('private@example.test');
      return { snapshot: window.AEHealth.snapshot(), storageSame: JSON.stringify(before) === JSON.stringify({ ...localStorage }) };
    });
    assert.equal(result.snapshot.counts.search_no_results, 1);
    assert.equal(result.snapshot.counts.cart_add_error, 60);
    assert.equal(result.snapshot.recent.length, 50);
    assert.ok(!JSON.stringify(result.snapshot).includes('private@example.test'));
    assert.equal(result.storageSame, true);
    assert.deepEqual(outgoing, []);
  });
});

test('cart diagnostics distinguish rejected adds from confirmed adds with refresh failures', async () => {
  for (const refreshFails of [false, true]) {
    await withPage({}, async (page) => {
      await page.route('**/cart/add.js', (route) => json(route, refreshFails ? { id: 101 } : { description: 'Unavailable' }, refreshFails ? 200 : 422));
      await page.route('**/cart.js', (route) => json(route, { description: 'Refresh unavailable' }, 503));
      await page.locator('[data-atc-main]').click();
      await page.locator('[data-product-error]').waitFor({ state: 'visible' });
      const health = await page.evaluate(() => window.AEHealth.snapshot());
      assert.equal(health.counts.cart_add_error || 0, refreshFails ? 0 : 1);
      assert.equal(health.counts.cart_add || 0, refreshFails ? 1 : 0);
      assert.equal(health.counts.cart_refresh_error || 0, refreshFails ? 1 : 0);
    });
  }
});

test('stock update requests identify the initial and changed variants without promising automatic alerts', async () => {
  for (const javaScriptEnabled of [true, false]) {
    await withPage({ javaScriptEnabled, product: { selected_or_first_available_variant: variants[2] } }, async (page) => {
      const request = page.locator('[data-back-in-stock]');
      assert.equal(await request.isVisible(), true);
      const body = request.locator('[name="contact[body]"]');
      assert.match(await body.inputValue(), /Limited \(103\), SKU: AE-LIMITED/);
      assert.match(await request.innerText(), /Ask about availability.*Request update/si);
      assert.doesNotMatch(await request.innerText(), /Get notified/i);
      if (javaScriptEnabled) {
        await page.locator('select[name="id"]').selectOption('102');
        assert.match(await body.inputValue(), /Premium \(102\), SKU: AE-PREMIUM/);
        assert.equal(await request.isVisible(), false);
      }
    });
  }
});

test('product gallery and purchase controls share the desktop viewport and resources fit mobile widths', async () => {
  for (const width of [320, 390, 768, 1024, 1440]) {
    await withPage({ viewport: { width, height: 1000 }, pages: { contact: { url: '/pages/contact' }, 'shipping-returns': { url: '/pages/shipping-returns' } } }, async (page) => {
      const gallery = await page.locator('.product-gallery__main').boundingBox();
      const info = await page.locator('[data-product-info]').boundingBox();
      const buy = await page.locator('[data-atc-main]').boundingBox();
      const resources = await page.locator('.product-resources').boundingBox();
      assert.ok(resources.x >= 0 && resources.x + resources.width <= width);
      assert.ok(await page.locator('html').evaluate((element) => element.scrollWidth <= innerWidth), `${width}px overflow`);
      if (width >= 990) {
        assert.ok(info.x >= gallery.x + gallery.width, 'Purchase information is alongside the gallery');
        assert.ok(buy.y + buy.height < 1000, 'Desktop purchase button is visible without scrolling');
      } else assert.ok(info.y >= gallery.y + gallery.height, 'Mobile retains stacked reading order');
      if (process.env.THEME_SCREENSHOTS) {
        fs.mkdirSync(path.join(root, '.tools/screenshots'), { recursive: true });
        await page.screenshot({ path: path.join(root, `.tools/screenshots/enterprise-product-fixture-${width}.png`) });
      }
    });
  }
});

test('product information follows both gallery and purchase columns instead of extending only the purchase column', async () => {
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    for (const javaScriptEnabled of [true, false]) {
      await withPage({ viewport: { width, height: 1000 }, javaScriptEnabled }, async page => {
        const gallery = await page.locator('.product-gallery').boundingBox();
        const purchase = await page.locator('[data-product-info]').boundingBox();
        const information = page.locator('.product-information');
        const panels = await information.boundingBox();
        const productPage = await page.locator('.product-page').boundingBox();
        assert.equal(await page.locator('[data-product-info] .product-tabs').count(), 0);
        assert.equal(await information.locator('details').count(), 3);
        assert.ok(panels.y >= Math.max(gallery.y + gallery.height, purchase.y + purchase.height));
        assert.ok(panels.y - Math.max(gallery.y + gallery.height, purchase.y + purchase.height) <= 49, 'Panels follow the taller column without an extra spacer');
        assert.ok(Math.abs(panels.width - productPage.width) < 1, 'Panels span both columns');
        const description = await page.locator('.product-details').boundingBox();
        assert.ok(description.y >= panels.y + panels.height);
        await information.getByText('Fitment', { exact: true }).click();
        await information.getByText('Shipping', { exact: true }).click();
        assert.equal(await information.locator('details[open]').count(), 3);
        if (javaScriptEnabled) {
          await page.locator('select[name="id"]').selectOption('102');
          assert.equal(await information.locator('[data-product-sku]').textContent(), 'AE-PREMIUM');
        }
        assert.equal(await page.locator('html').evaluate(node => node.scrollWidth <= innerWidth), true);
        if (process.env.THEME_SCREENSHOTS && javaScriptEnabled) {
          fs.mkdirSync(path.join(root, '.tools/screenshots'), { recursive: true });
          await information.locator('summary').first().scrollIntoViewIfNeeded();
          await page.screenshot({ path: path.join(root, `.tools/screenshots/product-gap-fix-${width}.png`) });
        }
      });
    }
  }
});

test('supplier alias display is consistent on cards and product specs while other brands remain escaped', async () => {
  for (const vendor of ['armmotorsports', 'ARM Motorsports']) {
    await withPage({ cards: true, product: { vendor } }, async (page) => {
      assert.equal(await page.locator('.product-card__vendor').first().innerText(), 'ARM Motorsports');
      assert.match(await page.locator('.spec-table').innerText(), /Brand\s+ARM Motorsports/i);
      assert.equal(await page.locator('main .eyebrow').filter({ hasText: 'ARM Motorsports' }).count(), 1);
    });
  }
  await withPage({ cards: true, product: { vendor: '<img src=x onerror="window.injected=true">' } }, async (page) => {
    assert.equal(await page.locator('.product-card__vendor img').count(), 0);
    assert.match(await page.locator('.product-card__vendor').first().innerText(), /<img/);
  });
});

test('manufacturer source links preserve year warnings and hide absent or unsafe provenance', async () => {
  const review = { scope: 'model-engine', url: 'https://armmotorsports.com/products/test', reviewedAt: '2026-10-14', notes: 'Confirm installation requirements.' };
  for (const sourceReview of [review, undefined, { ...review, url: 'javascript:alert(1)' }, { ...review, url: 'https://armmotorsports.com.attacker.test/products/test' }]) {
    const data = { ...fitmentData, products: { ...fitmentData.products, 'test-part': { records: [0], review: false, sourceReview } } };
    await withPage({ fitmentData: data }, async (page) => {
      const source = page.locator('[data-fitment-source]');
      assert.equal(await source.getAttribute('hidden') !== null, sourceReview !== review);
      if (sourceReview === review) {
        await page.locator('.product-tabs details').nth(1).locator('summary').click();
        assert.equal(await source.isVisible(), true);
        assert.equal(await source.locator('a').getAttribute('href'), review.url);
        assert.match(await source.innerText(), /Model-year compatibility remains unverified/);
        assert.equal(await source.locator('a').getAttribute('rel'), 'noopener noreferrer');
      } else assert.equal(await source.locator('a').getAttribute('href'), null);
    });
  }
});

test('native filters submit repeated brands and prices while preserving locale, tags and sorting', async () => {
  await withPage({ template: 'collection', collection: { filters: nativeFilters() } }, async (page) => {
    await page.evaluate(() => history.replaceState({}, '', '/fr/collections/bmw/Charge-pipe?sort_by=price-descending&page=3&ae_vehicle=saved'));
    const form = page.locator('[data-collection-filter-form]');
    await form.locator('[name="filter.p.vendor"]').nth(0).check();
    await form.locator('[name="filter.p.vendor"]').nth(1).check();
    await form.locator('[data-price-min]').fill('100.25');
    await form.locator('[data-price-max]').fill('200.50');
    assert.equal(await form.locator('[name="filter.v.availability"][value="0"]').isDisabled(), true);
    await form.locator('button[type="submit"]').click();
    await page.waitForURL('**/*filter.p.vendor*');
    const url = new URL(page.url());
    assert.equal(url.pathname, '/fr/collections/bmw/Charge-pipe');
    assert.deepEqual(url.searchParams.getAll('filter.p.vendor'), ['ARM Motorsports', 'Autobahn Essentials']);
    assert.equal(url.searchParams.get('filter.v.price.gte'), '100.25');
    assert.equal(url.searchParams.get('filter.v.price.lte'), '200.50');
    assert.equal(url.searchParams.get('ae_vehicle'), 'saved');
    assert.equal(url.searchParams.get('sort_by'), 'price-descending');
    assert.equal(url.searchParams.has('page'), false);
  });
});

test('grouped Brand resource IDs survive native submission and subsequent sorting', async () => {
  const filters = nativeFilters();
  const group = 'gid://shopify/FilterSettingGroup/123';
  filters[1].values[0].value = group;
  await withPage({ template: 'collection', collection: { filters } }, async (page) => {
    const form = page.locator('[data-collection-filter-form]');
    await form.locator('[name="filter.p.vendor"]').first().check();
    await form.locator('[name="filter.p.product_type"]').check();
    await form.locator('button[type="submit"]').click();
    await page.waitForURL('**/*FilterSettingGroup*');
    assert.equal(new URL(page.url()).searchParams.get('filter.p.vendor'), group);
    await page.locator('#SortBy').selectOption('price-ascending');
    await page.waitForURL('**/*sort_by=price-ascending*');
    assert.equal(new URL(page.url()).searchParams.get('filter.p.vendor'), group);
    assert.equal(new URL(page.url()).searchParams.get('filter.p.product_type'), 'Charge pipe');
  });
});

test('sorting preserves existing repeated filters and resetting filters preserves other URL state', async () => {
  await withPage({ template: 'collection', collection: { filters: nativeFilters() } }, async (page) => {
    await page.evaluate(() => history.replaceState({}, '', '/collections/bmw/Charge-pipe?filter.p.vendor=ARM&filter.p.vendor=AE&filter.v.price.gte=0&filter.v.price.lte=200&page=2&ae_vehicle=saved'));
    await page.locator('#SortBy').selectOption('price-ascending');
    await page.waitForURL('**/*sort_by=price-ascending*');
    const url = new URL(page.url());
    assert.deepEqual(url.searchParams.getAll('filter.p.vendor'), ['ARM', 'AE']);
    assert.equal(url.searchParams.get('filter.v.price.gte'), '0');
    assert.equal(url.searchParams.has('page'), false);
    await page.locator('[data-collection-facets] [data-facet-reset]').click();
    await page.waitForURL('**/*sort_by=price-ascending*');
    const cleared = new URL(page.url());
    assert.equal([...cleared.searchParams.keys()].some((key) => key.startsWith('filter.')), false);
    assert.equal(cleared.pathname, '/collections/bmw/Charge-pipe');
    assert.equal(cleared.searchParams.get('ae_vehicle'), 'saved');
  });
});

test('price range validation can be corrected without trapping the filter form', async () => {
  await withPage({ template: 'collection', collection: { filters: nativeFilters() } }, async (page) => {
    const form = page.locator('[data-collection-filter-form]');
    await form.locator('[data-price-min]').fill('200');
    await form.locator('[data-price-max]').fill('100');
    await form.locator('button[type="submit"]').click();
    assert.equal(await form.locator('[data-price-max]').evaluate((element) => element.validity.customError), true);
    assert.match(page.url(), /products\/test-part$/);
    await form.locator('[data-price-max]').fill('300');
    await form.locator('button[type="submit"]').click();
    await page.waitForURL('**/*filter.v.price.lte=300*');
  });
});

test('active zero-priced ranges and zero-count selected values remain removable and labels are escaped', async () => {
  const filters = nativeFilters();
  filters[1].values[0].label = '<img src=x onerror=alert(1)> Brand';
  filters[1].values[0].active = true;
  filters[1].values[0].count = 0;
  filters[1].active_values = [filters[1].values[0]];
  filters[3].min_value.value = 0;
  filters[3].max_value.value = 10000;
  await withPage({ template: 'collection', collection: { filters } }, async (page) => {
    assert.equal(await page.locator('[data-collection-facets] [name="filter.p.vendor"]').first().isEnabled(), true);
    assert.equal(await page.locator('[data-collection-facets] [name="filter.p.vendor"]').first().isChecked(), true);
    assert.equal(await page.locator('[data-price-min]').inputValue(), '0');
    assert.equal(await page.locator('.collection-active-filter').count(), 2);
    assert.match(await page.locator('.collection-active-filters').textContent(), /\$0\.00 - \$100\.00/);
    assert.equal(await page.locator('.collection-facets img, .collection-active-filters img').count(), 0);
    const duplicateIds = await page.locator('[data-collection-facets] input[id]').evaluateAll((inputs) => inputs.map((input) => input.id).filter((id, index, ids) => ids.indexOf(id) !== index));
    assert.deepEqual(duplicateIds, []);
  });
});

test('mobile filter drawer traps focus, closes on Escape and restores the trigger', async () => {
  await withPage({ template: 'collection', viewport: { width: 390, height: 844 }, collection: { filters: nativeFilters() } }, async (page) => {
    const panel = page.locator('[data-collection-facets]');
    const opener = page.locator('[data-facet-open]');
    assert.equal(await panel.evaluate((element) => element.inert), true);
    await opener.click();
    assert.equal(await panel.getAttribute('role'), 'dialog');
    assert.equal(await panel.getAttribute('aria-modal'), 'true');
    await panel.locator('[data-facet-reset]').focus();
    await page.keyboard.press('Tab');
    assert.equal(await panel.evaluate((element) => element.contains(document.activeElement)), true);
    await page.keyboard.press('Escape');
    assert.equal(await panel.isVisible(), false);
    assert.equal(await opener.evaluate((element) => element === document.activeElement), true);
    await opener.click();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForFunction(() => !document.querySelector('[data-collection-facets]').hasAttribute('role'));
    assert.equal(await panel.evaluate((element) => element.inert), false);
    assert.equal(await panel.getAttribute('role'), null);
    assert.equal(await page.locator('body').evaluate((element) => element.classList.contains('is-facets-open')), false);
  });
});

test('native filters and sorting remain usable without JavaScript and empty filter catalogs hide controls', async () => {
  await withPage({ template: 'collection', javaScriptEnabled: false, viewport: { width: 390, height: 844 }, collection: { filters: nativeFilters() } }, async (page) => {
    assert.equal(await page.locator('[data-collection-facets]').isVisible(), true);
    assert.equal(await page.locator('[data-facet-open]').isVisible(), false);
    await page.locator('[name="filter.p.vendor"]').first().check();
    await page.locator('[data-collection-filter-form] button[type="submit"]').click();
    await page.waitForURL('**/*filter.p.vendor=*');
    assert.equal(new URL(page.url()).searchParams.get('filter.p.vendor'), 'ARM Motorsports');
    assert.equal(await page.locator('[data-collection-sort] noscript button').isVisible(), true);
    assert.equal(await page.locator('[data-garage-bar]').isVisible(), false);
  });
  await withPage({ template: 'collection' }, async (page) => {
    assert.equal(await page.locator('[data-collection-facets], [data-facet-open]').count(), 0);
  });
});

test('garage bar reflects saves, clear actions, invalid legacy vehicles and cross-tab changes', async () => {
  await withPage({ garage }, async (page) => {
    assert.match(await page.locator('[data-garage-bar-vehicle]').textContent(), /340i.*F30.*B58/);
    assert.match(await page.locator('[data-garage-bar-note]').textContent(), /unverified/);
    await page.locator('[data-garage-bar-change]').click();
    assert.equal(await page.locator('[data-garage-drawer]').isVisible(), true);
    await page.locator('[data-garage-close]').click();
    await page.locator('[data-garage-bar-clear]').click();
    assert.match(await page.locator('[data-garage-bar-vehicle]').textContent(), /No vehicle selected/);
    assert.equal(await page.locator('[data-garage-bar-clear]').isVisible(), false);
    await page.evaluate(() => {
      localStorage.setItem('autobahn:garage', JSON.stringify({ make: 'BMW', model: '3 Series' }));
      dispatchEvent(new StorageEvent('storage', { key: 'autobahn:garage' }));
    });
    assert.match(await page.locator('[data-garage-bar-vehicle]').textContent(), /Update your saved vehicle/);
    assert.equal(await page.locator('[data-garage-bar-note]').isVisible(), false);
  });
});

test('garage bar stays below the sticky header and follows its hidden and resized state', async () => {
  await withPage({ garage, cards: true, cardsCount: 12 }, async (page) => {
    await page.evaluate(() => scrollTo(0, 450));
    await page.waitForFunction(() => document.querySelector('.site-header').classList.contains('is-scrolled'));
    const bar = page.locator('[data-garage-bar]');
    const top = await bar.evaluate((element) => element.getBoundingClientRect().top);
    assert.ok(top >= 0);
    await page.locator('[data-garage-toggle]').focus();
    await page.waitForFunction(() => !document.querySelector('.site-header').classList.contains('is-hidden'));
    await page.waitForFunction(() => Math.abs(document.querySelector('[data-garage-bar]').getBoundingClientRect().top - document.querySelector('.site-header').getBoundingClientRect().bottom) < 2);
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  });
});

test('product-card hover previews share the primary image frame without cropping or layout shifts', async () => {
  for (const template of ['collection', 'search', 'product']) {
    for (const width of [320, 390, 768, 1024, 1440]) {
      for (const reducedMotion of ['reduce', 'no-preference']) {
        await withPage({ template, cards: template === 'product', viewport: { width, height: 1000 }, reducedMotion, observerUnavailable: true }, async page => {
          const card = page.locator('[data-product-card]').first();
          const media = card.locator('.product-card__media');
          const primary = media.locator('img').first();
          const alternate = media.locator('.product-card__image--hover');
          await media.scrollIntoViewIfNeeded();
          await page.waitForFunction(() => [...document.querySelectorAll('.product-card__media img')].every(image => image.complete && image.naturalWidth > 0));
          const before = await media.boundingBox();
          assert.equal(await alternate.evaluate(node => getComputedStyle(node).opacity), '0');
          await card.hover();
          await page.waitForFunction(() => getComputedStyle(document.querySelector('.product-card__image--hover')).opacity === '1');
          const frame = await media.boundingBox();
          const first = await primary.boundingBox();
          const second = await alternate.boundingBox();
          assert.ok(Math.abs(before.width - frame.width) < 1 && Math.abs(before.height - frame.height) < 1, 'Hover does not resize the media frame');
          for (const image of [first, second]) {
            assert.ok(image.x >= frame.x - 1 && image.y >= frame.y - 1 && image.x + image.width <= frame.x + frame.width + 1 && image.y + image.height <= frame.y + frame.height + 1, `${template} ${width}px ${reducedMotion}: image stays inside the frame`);
          }
          for (const dimension of ['x', 'y', 'width', 'height']) assert.ok(Math.abs(first[dimension] - second[dimension]) < 1, `Both images share ${dimension}`);
          assert.equal(await alternate.evaluate(node => getComputedStyle(node).objectFit), 'contain');
          await page.mouse.move(0, 0);
          await page.waitForFunction(() => getComputedStyle(document.querySelector('.product-card__image--hover')).opacity === '0');
          assert.equal(await page.locator('html').evaluate(node => node.scrollWidth <= innerWidth), true);
          if (process.env.THEME_SCREENSHOTS && template === 'collection' && reducedMotion === 'no-preference') {
            await card.hover();
            await page.waitForFunction(() => getComputedStyle(document.querySelector('.product-card__image--hover')).opacity === '1');
            fs.mkdirSync(path.join(root, '.tools/screenshots'), { recursive: true });
            await page.screenshot({ path: path.join(root, `.tools/screenshots/product-card-hover-${width}.png`) });
          }
        });
      }
    }
  }
});

test('audit: gallery magnifier stays inside the frame at all image edges', async () => {
  for (const width of [1024, 1440]) {
    await withPage({ viewport: { width, height: 1000 } }, async page => {
      const main = page.locator('.product-gallery__main');
      await main.scrollIntoViewIfNeeded();
      const image = await page.locator('[data-gallery-main]').evaluate(node => getRenderedImageRect(node));
      for (const [x, y] of [[image.left + 1, image.top + 1], [image.right - 1, image.top + 1], [image.left + 1, image.bottom - 1], [image.right - 1, image.bottom - 1]]) {
        await main.dispatchEvent('pointermove', { clientX: x, clientY: y, pointerType: 'mouse' });
        assert.equal(await main.evaluate(node => node.classList.contains('is-magnifying')), true);
        const frame = await main.boundingBox();
        const lens = await main.locator('[data-gallery-magnifier]').boundingBox();
        assert.ok(lens.x >= frame.x && lens.y >= frame.y && lens.x + lens.width <= frame.x + frame.width && lens.y + lens.height <= frame.y + frame.height, `Lens stays inside ${width}px frame`);
        const position = await main.locator('[data-gallery-magnifier]').evaluate(node => ({
          background: node.style.getPropertyValue('--magnifier-bg-position').split(' ').map(parseFloat),
          border: parseFloat(getComputedStyle(node).borderLeftWidth),
        }));
        const zoom = await main.evaluate(node => parseFloat(getComputedStyle(node).getPropertyValue('--magnifier-zoom')));
        assert.ok(Math.abs((x - lens.x - position.border - position.background[0]) / zoom - (x - image.left)) < 1, 'Zoomed pixel stays aligned with the cursor');
        assert.ok(Math.abs((y - lens.y - position.border - position.background[1]) / zoom - (y - image.top)) < 1);
      }
      await main.dispatchEvent('pointerleave');
      assert.equal(await main.evaluate(node => node.classList.contains('is-magnifying')), false);
      if (process.env.THEME_SCREENSHOTS) {
        await main.dispatchEvent('pointermove', { clientX: image.left + 1, clientY: image.top + 1, pointerType: 'mouse' });
        await page.waitForFunction(() => getComputedStyle(document.querySelector('[data-gallery-magnifier]')).opacity === '1');
        fs.mkdirSync(path.join(root, '.tools/screenshots'), { recursive: true });
        await page.screenshot({ path: path.join(root, `.tools/screenshots/audit-magnifier-${width}.png`) });
      }
    });
  }
});

test('audit: populated cart pages fit narrow screens with long product and option names', async () => {
  const title = 'BMW-' + 'ExtendedConnector'.repeat(12);
  const item = { key: '101:key', url: '/products/test-part', url_to_remove: '/cart/change?line=1&quantity=0', product: { title, has_only_default_variant: false }, variant: { title: 'Finish-' + 'CarbonWeave'.repeat(12) }, image: { asset: 'brand-bmw-m4.jpg', alt: title }, quantity: 1, final_line_price: 12345678 };
  for (const width of [320, 390, 768, 1440]) {
    await withPage({ template: 'cart', javaScriptEnabled: false, viewport: { width, height: 1000 }, cart: { item_count: 1, total_price: 12345678, items: [item] } }, async page => {
      assert.match(await page.locator('.cart-item').innerText(), /ExtendedConnector.*CarbonWeave/s);
      const thumbnail = await page.locator('.cart-item img').boundingBox();
      assert.equal(thumbnail.width, 92);
      assert.equal(thumbnail.height, 92, 'Intrinsic HTML dimensions cannot stretch cart thumbnails');
      assert.equal(await page.locator('html').evaluate(node => node.scrollWidth <= innerWidth), true, `${width}px cart overflow`);
      assert.equal(await page.locator('[name="updates[]"]').isVisible(), true);
      assert.equal(await page.locator('[name="checkout"]').isVisible(), true);
      if (process.env.THEME_SCREENSHOTS) {
        fs.mkdirSync(path.join(root, '.tools/screenshots'), { recursive: true });
        await page.locator('.cart-item').scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(root, `.tools/screenshots/audit-cart-${width}.png`) });
      }
    });
  }
});

test('audit: cart drawer keeps long titles and large totals inside the panel', async () => {
  const data = cart();
  data.items[0].product_title = 'BMW-' + 'ExtendedConnector'.repeat(12);
  data.items[0].variant_title = 'Finish-' + 'CarbonWeave'.repeat(12);
  data.items[0].final_line_price = data.total_price = 12345678;
  for (const width of [320, 390]) {
    await withPage({ viewport: { width, height: 844 } }, async page => {
      await page.route('**/cart.js', route => json(route, data));
      await page.locator('[data-cart-drawer-open]').click();
      await page.waitForSelector('[data-cart-line]');
      const panel = await page.locator('.cart-drawer__panel').boundingBox();
      for (const selector of ['.cart-drawer__title', '.cart-drawer__variant', '.cart-drawer__qty', '.cart-drawer__line-price']) {
        const element = page.locator(selector).first();
        const bounds = await element.boundingBox();
        assert.ok(bounds.x >= panel.x && bounds.x + bounds.width <= panel.x + panel.width + 1, `${selector} fits ${width}px panel`);
        assert.equal(await element.evaluate(node => node.scrollWidth <= node.clientWidth), true);
      }
    });
  }
});

test('audit: newsletter waits for search and garage drawers before taking focus', async () => {
  for (const selector of ['[data-search-toggle]', '[data-garage-toggle]']) {
    await withPage({ popup: true, popupDelay: 1 }, async page => {
      await page.locator(selector).click();
      const drawer = page.locator(selector === '[data-search-toggle]' ? '[data-search-drawer]' : '[data-garage-drawer]');
      const focused = await page.locator(':focus').getAttribute('id');
      await page.waitForTimeout(1200);
      assert.equal(await page.locator('[data-popup-newsletter]').isVisible(), false, 'Newsletter does not interrupt an open drawer');
      assert.equal(await page.locator(':focus').getAttribute('id'), focused);
      await page.keyboard.press('Escape');
      assert.equal(await drawer.isVisible(), false);
      await page.locator('[data-popup-newsletter]').waitFor({ state: 'visible' });
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('[data-popup-newsletter]').isVisible(), false);
    });
  }
});

test('audit: fallback navigation and cart requests retain locale prefixes without requiring a trailing slash', async () => {
  for (const root of ['/fr', '/fr/']) {
    await withPage({ routes: { root_url: root, search_url: '/fr/search', cart_url: '/fr/cart', collections_url: '/fr/collections', all_products_collection_url: '/fr/collections/all' } }, async page => {
      const navigation = page.locator('[data-mobile-nav]');
      for (const [label, href] of [['Builds', '/fr/pages/builds'], ['AE. Blog', '/fr/pages/ae-blog'], ['Contact Us', '/fr/pages/contact'], ['Returns', '/fr/pages/shipping-returns']]) {
        assert.equal(await navigation.getByRole('link', { name: label, exact: true, includeHidden: true }).getAttribute('href'), href);
      }
      let requests = 0;
      await page.route('**/fr/cart.js', route => { requests += 1; return json(route, cart()); });
      await page.locator('[data-cart-drawer-open]').click();
      await page.waitForSelector('[data-cart-line]');
      assert.equal(requests, 1);
    });
  }
});

test('collection layout, cards and mobile drawer fit all supported viewports with visible image pixels', async () => {
  for (const width of [320, 390, 768, 1024, 1440]) {
    const products = [
      { ...product, title: 'BMW 335i N54 Charge Pipe - OEM Diverter Valves', has_only_default_variant: true },
      { ...product, handle: 'wrong', title: 'BMW F30 N55 Charge Pipe with Extended Installation Hardware', vendor: 'ARM Motorsports' },
      { ...product, handle: 'unknown', title: 'Carbon Fiber Double Slat Grille for BMW F06 / F12 / F13', available: false, metafields: { custom: { badge: 'New' } } },
    ];
    await withPage({ template: 'collection', garage, viewport: { width, height: 900 }, collection: { filters: nativeFilters(), products, products_count: 3 } }, async (page) => {
      const grid = page.locator('[data-fitment-grid]');
      await grid.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => {
        const bar = document.querySelector('[data-garage-bar]').getBoundingClientRect();
        const header = document.querySelector('.site-header').getBoundingClientRect();
        const ticker = document.querySelector('.announcement-bar')?.getBoundingClientRect();
        return bar.top >= Math.max(0, header.bottom, ticker?.bottom || 0) - 2;
      });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      assert.equal(await page.locator('.product-card').last().locator('.product-card__badge').textContent(), 'Sold out');
      assert.deepEqual(await page.locator('.product-card__info').evaluateAll((items) => items.filter((item) => item.scrollWidth > item.clientWidth).map((item) => item.textContent)), []);
      const imageContent = await page.locator('.product-card__image').first().evaluate((image) => {
        const canvas = document.createElement('canvas'); canvas.width = canvas.height = 16;
        const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0, 16, 16);
        const pixels = ctx.getImageData(0, 0, 16, 16).data;
        return image.complete && image.naturalWidth > 0 && new Set(Array.from(pixels)).size > 10;
      });
      assert.equal(imageContent, true);
      if (process.env.THEME_SCREENSHOTS) {
        fs.mkdirSync(path.join(root, '.tools/screenshots'), { recursive: true });
        await page.screenshot({ path: path.join(root, `.tools/screenshots/collection-modern-${width}.png`) });
      }
      if (width <= 990) {
        await page.locator('[data-facet-open]').click();
        assert.equal(await page.locator('[data-collection-facets]').evaluate((element) => element.scrollWidth <= element.clientWidth), true);
        if (process.env.THEME_SCREENSHOTS) await page.screenshot({ path: path.join(root, `.tools/screenshots/collection-filters-${width}.png`) });
        await page.keyboard.press('Escape');
      }
    });
  }
});

test('garage bar stays at the viewport edge when Shopify header wrappers have scrolled away', async () => {
  await withPage({ shopifyHeaderWrapper: true, garage, cards: true, cardsCount: 12 }, async (page) => {
    await page.evaluate(() => scrollTo(0, 800));
    await page.waitForFunction(() => Math.abs(document.querySelector('[data-garage-bar]').getBoundingClientRect().top) < 2);
    assert.equal(await page.locator('[data-garage-bar-change]').isVisible(), true);
    await page.locator('[data-garage-bar-change]').click();
    assert.equal(await page.locator('[data-garage-drawer]').isVisible(), true);
  });
});

test('card starting prices use the product minimum and do not imply a discount on unrelated variants', async () => {
  await withPage({ cards: true, product: { price: 8000, price_varies: true, compare_at_price: 10000, selected_or_first_available_variant: variants[1] } }, async (page) => {
    assert.equal((await page.locator('.product-card .price').textContent()).trim(), 'From $80.00');
    assert.equal(await page.locator('.product-card .price s').count(), 0);
    assert.equal(await page.locator('.product-card__badge').count(), 0);
    assert.match(await page.locator('[data-product-price]').textContent(), /\$150\.00/);
  });
});

test('legacy Search-only footer menus receive distinct existing Shop, Support and Company links', async () => {
  const pages = Object.fromEntries(['contact', 'fitment', 'shipping-returns', 'faq', 'about', 'builds', 'ae-blog'].map((handle) => [handle, { url: '/pages/' + handle }]));
  const blocks = ['Shop', 'Support', 'Company'].map((heading) => ({ settings: { heading, menu: { links: [{ title: 'Search', url: '/search' }] } } }));
  await withPage({ pages, footerBlocks: blocks }, async (page) => {
    const groups = page.locator('.site-footer__grid > div');
    const links = await groups.evaluateAll((groups) => groups.slice(1).map((group) => Array.from(group.querySelectorAll('a'), (link) => link.textContent)));
    assert.deepEqual(links, [['All Parts', 'BMW', 'Audi', 'Volkswagen', 'Accessories'], ['Contact Us', 'Fitment Guide', 'Shipping & Returns', 'FAQ'], ['About Us', 'Builds', 'Autobahn Blog']]);
    assert.equal(await page.locator('.footer-links a[href="/search"]').count(), 0);
  });
});

test('custom footer menus remain unchanged and fallback never links to missing pages', async () => {
  const custom = [{ settings: { heading: 'Support', menu: { links: [{ title: 'Warranty & <Help>', url: '/pages/warranty' }] } } }];
  await withPage({ footerBlocks: custom }, async (page) => {
    assert.equal(await page.locator('.footer-links a').count(), 1);
    assert.equal(await page.locator('.footer-links a').textContent(), 'Warranty & <Help>');
    assert.equal(await page.locator('.footer-links a').getAttribute('href'), '/pages/warranty');
  });
  await withPage({ footerBlocks: [{ settings: { heading: 'Support', menu: { links: [] } } }], shop: { policies: [{ title: 'Refund policy', body: 'Terms', url: '/policies/refund-policy' }] } }, async (page) => {
    assert.equal(await page.locator('.footer-links a').count(), 1);
    assert.equal(await page.locator('.footer-links a').getAttribute('href'), '/policies/refund-policy');
  });
});

test('empty generic Builds pages render the proper experience without changing authored page content', async () => {
  await withPage({ template: 'page', page: { handle: 'builds', title: 'Builds', content: '' } }, async (page) => {
    assert.equal(await page.locator('.builds-hero h1').textContent(), 'Autobahn Builds');
    assert.equal(await page.locator('.builds-platform').count(), 3);
    assert.match(await page.locator('.builds-content').textContent(), /No builds shared yet/);
    assert.equal(await page.locator('.builds-story').count(), 0);
  });
  await withPage({ template: 'page', page: { handle: 'builds', title: 'Our Builds', content: '<p>Existing merchant-owned build story.</p>' } }, async (page) => {
    assert.equal(await page.locator('.builds-hero').count(), 0);
    assert.match(await page.locator('main .rte').textContent(), /Existing merchant-owned/);
  });
});

test('customer build gallery includes only tagged published stories with real supplied images', async () => {
  const story = { title: 'Customer BMW build', url: '/blogs/autobahn-blog/customer-bmw', image: { asset: 'brand-bmw-m4.jpg', alt: 'Customer-supplied car photo' }, tags: ['Build'], excerpt: 'Owner-authored modifications.' };
  const blogs = { 'autobahn-blog': { articles: [story, { ...story, title: 'Not a build', tags: ['News'] }, { ...story, title: 'Missing photo', image: null }] } };
  await withPage({ template: 'builds', blogs, pages: { contact: { url: '/pages/contact' } } }, async (page) => {
    assert.equal(await page.locator('.builds-story').count(), 1);
    assert.equal(await page.locator('.builds-story h3').textContent(), 'Customer BMW build');
    assert.match(await page.locator('.builds-story p').textContent(), /Owner-authored/);
    assert.equal(await page.getByRole('link', { name: 'Submit Your Build', exact: true }).getAttribute('href'), '/pages/contact');
  });
});

test('Builds images and content fit mobile, tablet and desktop without overlap', async () => {
  for (const width of [320, 390, 768, 1024, 1440]) {
    await withPage({ template: 'builds', viewport: { width, height: 900 } }, async (page) => {
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      assert.equal(await page.locator('.builds-hero__image').evaluate((image) => image.complete && image.naturalWidth > 0), true);
      assert.equal(await page.locator('.builds-hero h1').evaluate((heading) => heading.scrollWidth <= heading.clientWidth), true);
      if (process.env.THEME_SCREENSHOTS) {
        fs.mkdirSync(path.join(root, '.tools/screenshots'), { recursive: true });
        await page.screenshot({ path: path.join(root, `.tools/screenshots/builds-${width}.png`) });
      }
    });
  }
});

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

test('long product descriptions occupy their own full-width row with preserved content and bounded media', async () => {
  const description = '<div style="text-align:center"><h1>Supplier highlights</h1><p>Original supplier details and installation requirements.</p></div><img src="/assets/brand-bmw-m4.jpg" alt="Supplier product detail" width="700" height="466"><iframe title="Supplier installation video" width="560" height="315" src="about:blank"></iframe><table style="width:700px"><tr><th>Model</th><th>Engine</th></tr><tr><td>335i</td><td>N54</td></tr></table><p>Does not fit the excluded configuration. Confirm model year.</p>';
  for (const width of [320, 390, 768, 1024, 1440]) {
    await withPage({ viewport: { width, height: 1000 }, product: { description } }, async (page) => {
      const details = page.locator('.product-details');
      const body = details.locator('[data-product-description]');
      assert.equal(await page.locator('[data-product-info] [data-product-description]').count(), 0);
      assert.equal(await details.getAttribute('aria-labelledby'), await details.locator('h2').getAttribute('id'));
      assert.deepEqual(await body.locator(':scope > *').evaluateAll((nodes) => nodes.map((node) => node.tagName)), ['DIV', 'IMG', 'IFRAME', 'TABLE', 'P']);
      assert.match(await body.textContent(), /Original supplier details.*335i.*N54.*Does not fit.*Confirm model year/s);
      assert.equal(await body.locator('div').evaluate((node) => getComputedStyle(node).textAlign), 'left');
      const bounds = await body.boundingBox();
      const info = await page.locator('[data-product-info]').boundingBox();
      const gallery = await page.locator('.product-gallery').boundingBox();
      assert.ok(bounds.y >= Math.max(info.y + info.height, gallery.y + gallery.height));
      if (width >= 990) assert.ok(bounds.width > info.width * 1.4, 'Description is not squeezed into the purchase column');
      for (const tag of ['img', 'iframe', 'table']) {
        const media = await body.locator(tag).boundingBox();
        assert.ok(media.x >= bounds.x - 1 && media.x + media.width <= bounds.x + bounds.width + 1, `${tag} at ${width}px`);
      }
      assert.equal(await page.locator('html').evaluate((node) => node.scrollWidth <= innerWidth), true);
      if (process.env.THEME_SCREENSHOTS) {
        fs.mkdirSync(path.join(root, '.tools/screenshots'), { recursive: true });
        await details.locator('.product-details__heading').scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(root, `.tools/screenshots/description-fixture-${width}.png`) });
      }
    });
  }
  await withPage({ product: { description: '' } }, async (page) => {
    assert.equal(await page.locator('.product-details').count(), 0);
  });
});

test('legacy supplier descriptions keep badges, video, headings and fitment readable without JavaScript', async () => {
  const description = '<ul class="tabs"><li>Supplier warranty | Stock statement</li></ul><ul class="tabs-content"><ul class="tabs-content"><li style="display:block"><div><p><img src="/assets/brand-bmw-m4.jpg" width="300" height="88" alt="Supplier warranty"></p></div><div><p><img src="/assets/brand-bmw-m4.jpg" width="150" height="44" alt="Supplier shipping"></p></div></li></ul></ul><h1 style="text-align:center">HIGHLIGHTS</h1><div>Direct fit<br>Installation requires confirmation</div><style>.iframe-container{position:relative;padding-bottom:56.25%;height:0}.iframe-container iframe{position:absolute;top:0;left:0;width:100%;height:100%}</style><div class="iframe-container"><br><br><br><iframe title="Supplier installation" width="560" height="315" src="about:blank"></iframe></div><table><tbody><tr><td>Model</td><td>Engine</td></tr><tr><td>135i</td><td>N54</td></tr></tbody></table><p>Confirm model year. Does not fit excluded configuration.</p>';
  for (const width of [320, 390, 768, 1440]) {
    await withPage({ viewport: { width, height: 1000 }, javaScriptEnabled: false, product: { description } }, async (page) => {
      const body = page.locator('[data-product-description]');
      assert.match(await body.innerText(), /Supplier warranty.*Stock statement.*Direct fit.*Installation requires confirmation.*135i.*N54.*Confirm model year.*Does not fit/s);
      assert.equal(await body.locator('.tabs-content').first().evaluate(node => getComputedStyle(node).paddingLeft), '0px');
      const badges = await body.locator('img').all();
      for (const badge of badges) assert.equal(await badge.isVisible(), true);
      if (width === 1440) {
        const [first, second] = await Promise.all(badges.map(badge => badge.boundingBox()));
        assert.ok(Math.abs((first.y + first.height / 2) - (second.y + second.height / 2)) < 1, 'Badges share a compact row');
      }
      const wrapper = await body.locator('.iframe-container').boundingBox();
      const video = await body.locator('iframe').boundingBox();
      assert.ok(Math.abs(video.width / video.height - 16 / 9) < 0.02);
      assert.ok(video.y >= wrapper.y && video.y + video.height <= wrapper.y + wrapper.height + 1);
      assert.equal(await body.locator('h1').evaluate(node => getComputedStyle(node).fontSize), '20px');
      assert.equal(await page.locator('html').evaluate(node => node.scrollWidth <= innerWidth), true);
      if (process.env.THEME_SCREENSHOTS) {
        fs.mkdirSync(path.join(root, '.tools/screenshots'), { recursive: true });
        await page.locator('.product-details__heading').scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(root, `.tools/screenshots/description-cleanup-${width}.png`) });
      }
    });
  }
});

test('supplier fitment guides fill the reading column with aligned cells and unchanged configurations', async () => {
  const records = [
    ['BMW', 'E82', '135i', 'N54 3.0L'],
    ['BMW', 'E82', '135i', 'N55 3.0L'],
    ['BMW', 'E92', '335is', 'N54 3.0L'],
    ['BMW', 'E93', '335xi', 'N55 3.0L'],
  ];
  for (const width of [320, 390, 768, 1024, 1440]) {
    for (const headerTag of ['td', 'th']) {
      const description = `<h1>FITMENT GUIDE</h1><table class="appTable" style="width:700px"><tbody><tr>${['Make', 'Chassis', 'Model', 'Engine'].map(value => `<${headerTag}>${value}</${headerTag}>`).join('')}</tr>${records.map(row => `<tr>${row.map(value => `<td style="text-align:center">${value}</td>`).join('')}</tr>`).join('')}</tbody></table><p>Year ranges are not supplied. Confirm before ordering.</p><p>DCT transmission note remains unchanged.</p>`;
      await withPage({ viewport: { width, height: 1000 }, javaScriptEnabled: false, product: { description } }, async page => {
        const body = page.locator('[data-product-description]');
        const table = body.locator('.appTable');
        const bounds = await table.boundingBox();
        const content = await body.boundingBox();
        assert.ok(Math.abs(bounds.width - content.width) < 1, 'Fitment table fills the reading column');
        assert.deepEqual(await table.locator('tr').evaluateAll(rows => rows.slice(1).map(row => [...row.cells].map(cell => cell.textContent))), records);
        const header = await table.locator('tr').first().locator('td, th').evaluateAll(cells => cells.map(cell => ({ left: cell.getBoundingClientRect().left, right: cell.getBoundingClientRect().right })));
        assert.equal(header.length, 4);
        assert.ok(Math.abs(header[0].left - bounds.x) < 1 && Math.abs(header[3].right - bounds.x - bounds.width) < 1, 'Row spans the table');
        for (const row of await table.locator('tr').all()) {
          const cells = await row.locator('td, th').evaluateAll(nodes => nodes.map(node => ({ left: node.getBoundingClientRect().left, right: node.getBoundingClientRect().right, alignment: getComputedStyle(node).textAlign, fits: node.scrollWidth <= node.clientWidth })));
          cells.forEach((cell, index) => {
            assert.ok(Math.abs(cell.left - header[index].left) < 1 && Math.abs(cell.right - header[index].right) < 1);
            assert.equal(cell.alignment, 'left');
            assert.equal(cell.fits, true);
          });
        }
        assert.match(await body.innerText(), /Year ranges are not supplied.*Confirm before ordering.*DCT transmission note/s);
        assert.equal(await page.locator('html').evaluate(node => node.scrollWidth <= innerWidth), true);
        if (process.env.THEME_SCREENSHOTS && headerTag === 'td') {
          fs.mkdirSync(path.join(root, '.tools/screenshots'), { recursive: true });
          await body.locator('h1').scrollIntoViewIfNeeded();
          await page.screenshot({ path: path.join(root, `.tools/screenshots/fitment-guide-${width}.png`) });
        }
      });
    }
  }
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
