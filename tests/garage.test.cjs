const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test, before, after } = require('node:test');
const { chromium } = require('playwright');
const { mount, product, root } = require('./helpers/theme.cjs');

let browser;
before(async () => {
  const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || (fs.existsSync(chrome) ? chrome : undefined) });
});
after(async () => { await browser?.close(); });

const key = 'autobahn:garage:v2';
const bmw = { year: '2017', make: 'BMW', model: '340i', chassis: 'F30', trim: 'B58', variant: '' };
const audi = { year: '2019', make: 'Audi', model: 'S4', chassis: 'B9', trim: '3.0T', variant: '' };
const collection = () => ({ version: 2, activeId: 'bmw', vehicles: [{ id: 'bmw', ...bmw }, { id: 'audi', ...audi }] });
const rows = page => page.locator('[data-garage-vehicle]');
const row = (page, model) => rows(page).filter({ hasText: model });
const saved = page => page.evaluate(() => AEGarage.list());
const stored = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);

async function withPage(options, check) {
  const session = await browser.newContext({ viewport: options.viewport || { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  try {
    const page = await session.newPage();
    const errors = await mount(page, options);
    await check(page);
    assert.deepEqual(errors, []);
  } finally { await session.close(); }
}

async function open(page) {
  if (!(await page.locator('[data-garage-drawer]').isVisible())) await page.locator('[data-garage-toggle]').click();
}

async function fillVehicle(page, vehicle) {
  const form = page.locator('[data-garage-form]');
  for (const name of ['make', 'model', 'chassis', 'trim']) await form.locator(`[name="vehicle_${name}"]`).selectOption(vehicle[name]);
  await form.locator('[name="vehicle_year"]').fill(vehicle.year);
  return form;
}

async function add(page, vehicle) {
  await open(page);
  await page.locator('[data-garage-add]').click();
  const form = await fillVehicle(page, vehicle);
  await form.locator('[type="submit"]').click();
}

test('multi-car garage migrates the original saved vehicle and preserves it when adding and reloading', async () => {
  await withPage({ garage: bmw }, async page => {
    assert.equal((await saved(page)).length, 1);
    await add(page, audi);
    assert.deepEqual((await saved(page)).map(vehicle => vehicle.model), ['340i', 'S4']);
    assert.equal((await stored(page)).version, 2);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('autobahn:garage')).model), '340i');
    await page.reload();
    assert.equal(await page.evaluate(() => AEGarage.read().model), 'S4');
    assert.equal((await saved(page)).length, 2);
    await open(page);
    assert.equal(await row(page, 'S4').locator('[data-garage-select]').isChecked(), true);
    assert.equal(await page.locator('[data-garage-count]').textContent(), '2');
  });
});

test('multi-car garage switches active fitment, finder values and match-only results without merging vehicles', async () => {
  await withPage({ template: 'collection', finder: true, garageCollection: collection(), collection: { products: [product, { ...product, handle: 'cross', title: 'Audi part', url: '/products/cross' }] } }, async page => {
    await page.locator('[data-fitment-filter-toggle]').check();
    assert.deepEqual(await page.locator('[data-product-card]:visible').evaluateAll(cards => cards.map(card => card.dataset.productHandle)), ['test-part']);
    await open(page);
    await row(page, 'S4').locator('[data-garage-select]').check();
    assert.equal(await page.locator('[data-fitment-filter-toggle]').isChecked(), true);
    assert.deepEqual(await page.locator('[data-product-card]:visible').evaluateAll(cards => cards.map(card => card.dataset.productHandle)), ['cross']);
    assert.match(await page.locator('[data-garage-bar-vehicle]').textContent(), /Audi S4/);
    assert.equal(await page.locator('[data-vehicle-finder] [name="vehicle_make"]').inputValue(), 'Audi');
    assert.equal(await page.evaluate(() => AEGarage.state('test-part')), 'not-listed');
    assert.equal(await page.evaluate(() => AEGarage.state('cross')), 'listed');
    assert.match(await page.locator('[data-garage-summary]').textContent(), /year.*confirmation/);
    await row(page, '340i').locator('[data-garage-select]').check();
    assert.equal(await page.evaluate(() => AEGarage.read().model), '340i');
    assert.deepEqual(await page.locator('[data-product-card]:visible').evaluateAll(cards => cards.map(card => card.dataset.productHandle)), ['test-part']);
  });
});

test('multi-car garage edits only the requested vehicle, preserves its identity and supports cancel', async () => {
  await withPage({ garageCollection: collection() }, async page => {
    await open(page);
    await row(page, 'S4').locator('[data-garage-edit]').click();
    assert.equal(await page.locator('[data-garage-editor-title]').textContent(), 'Edit vehicle');
    assert.equal(await page.evaluate(() => AEGarage.read().model), '340i');
    await page.locator('[data-garage-form] [name="vehicle_year"]').fill('2020');
    await page.locator('[data-garage-cancel]').click();
    assert.equal((await saved(page)).find(vehicle => vehicle.id === 'audi').year, '2019');
    await row(page, 'S4').locator('[data-garage-edit]').click();
    await page.locator('[data-garage-form] [name="vehicle_year"]').fill('2020');
    await page.locator('[data-garage-form] [type="submit"]').click();
    const vehicles = await saved(page);
    assert.equal(vehicles.length, 2);
    assert.equal(vehicles.find(vehicle => vehicle.id === 'audi').year, '2020');
    assert.equal(vehicles.find(vehicle => vehicle.id === 'bmw').year, '2017');
    assert.equal((await stored(page)).activeId, 'audi');
  });
});

test('multi-car garage prevents duplicate saves and duplicate edits while allowing different model years', async () => {
  await withPage({ garageCollection: collection() }, async page => {
    await add(page, audi);
    assert.equal((await saved(page)).length, 2);
    assert.equal((await stored(page)).activeId, 'audi');
    await add(page, { ...audi, year: '2020' });
    assert.equal((await saved(page)).length, 3);
    await open(page);
    await row(page, '2020').locator('[data-garage-edit]').click();
    await page.locator('[data-garage-form] [name="vehicle_year"]').fill('2019');
    await page.locator('[data-garage-form] [type="submit"]').click();
    assert.match(await page.locator('[data-garage-form] [data-garage-error]').textContent(), /already in My Garage/);
    assert.equal((await saved(page)).length, 3);
    assert.equal((await saved(page)).filter(vehicle => vehicle.model === 'S4' && vehicle.year === '2019').length, 1);
  });
});

test('multi-car garage clears only the active selection and restores unfiltered browsing without deleting cars', async () => {
  await withPage({ template: 'collection', garageCollection: collection() }, async page => {
    await page.locator('[data-fitment-filter-toggle]').check();
    await page.locator('[data-garage-bar-clear]').click();
    assert.equal((await saved(page)).length, 2);
    assert.equal((await stored(page)).activeId, null);
    assert.equal(await page.evaluate(() => AEGarage.read().make), '');
    assert.equal(await page.locator('[data-fitment-filter-toggle]').isChecked(), false);
    assert.equal(await page.locator('[data-fitment-filter-toggle]').isDisabled(), true);
    assert.equal(await page.locator('[data-product-card]').isVisible(), true);
    assert.match(await page.locator('[data-garage-bar-vehicle]').textContent(), /No vehicle selected/);
    await page.reload();
    await open(page);
    assert.equal(await page.locator('[data-garage-select]:checked').count(), 0);
    await row(page, 'S4').locator('[data-garage-select]').check();
    assert.equal(await page.evaluate(() => AEGarage.read().model), 'S4');
  });
});

test('multi-car garage removes individual cars, chooses a remaining active car and never resurrects legacy data', async () => {
  await withPage({ template: 'collection', garage: bmw, garageCollection: collection() }, async page => {
    await open(page);
    await row(page, 'S4').locator('[data-garage-remove]').click();
    assert.equal(await page.evaluate(() => AEGarage.read().model), '340i');
    assert.equal((await saved(page)).length, 1);
    await add(page, audi);
    await open(page);
    await row(page, 'S4').locator('[data-garage-remove]').click();
    assert.equal(await row(page, '340i').locator('[data-garage-select]').isChecked(), true);
    await row(page, '340i').locator('[data-garage-remove]').click();
    assert.equal((await saved(page)).length, 0);
    assert.equal(await page.locator('[data-garage-vehicles-empty]').isVisible(), true);
    assert.equal(await page.locator('[data-garage-add]').evaluate(element => document.activeElement === element), true);
    await page.reload();
    assert.equal((await saved(page)).length, 0);
    assert.equal(await page.evaluate(() => AEGarage.read().make), '');
    assert.equal(await page.locator('[data-fitment-filter-toggle]').isDisabled(), true);
  });
});

test('multi-car garage synchronizes real tabs and merges legacy-tab selections without replacing the saved list', async () => {
  const session = await browser.newContext({ reducedMotion: 'reduce' });
  try {
    const first = await session.newPage();
    const second = await session.newPage();
    await mount(first, { garageCollection: collection() });
    await mount(second);
    await open(first);
    await open(second);
    await row(first, 'S4').locator('[data-garage-select]').check();
    await second.waitForFunction(() => AEGarage.read().model === 'S4');
    await add(second, { ...bmw, year: '2018' });
    await first.waitForFunction(() => AEGarage.list().length === 3);
    await first.evaluate(() => {
      localStorage.setItem('autobahn:garage', JSON.stringify({ year: '2008', make: 'BMW', model: '335i', chassis: 'E90', trim: 'N54' }));
    });
    await second.waitForFunction(() => AEGarage.read().model === '335i');
    await first.waitForFunction(() => AEGarage.list().length === 4);
    await open(second);
    await row(second, 'S4').locator('[data-garage-edit]').click();
    await row(first, 'S4').locator('[data-garage-remove]').click();
    await second.waitForFunction(() => !AEGarage.list().some(vehicle => vehicle.model === 'S4'));
    assert.equal(await second.locator('[data-garage-editor-title]').textContent(), 'Vehicle details');
    assert.deepEqual((await saved(second)).map(vehicle => vehicle.model), ['340i', '340i', '335i']);
  } finally { await session.close(); }
});

test('multi-car garage keeps cars in page memory after storage failures and reports persistence limits', async () => {
  await withPage({ template: 'collection', garageCollection: collection() }, async page => {
    await page.evaluate(() => {
      const setItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function(key, value) {
        if (key === 'autobahn:garage:v2') throw new DOMException('Quota exceeded', 'QuotaExceededError');
        return setItem.call(this, key, value);
      };
    });
    await add(page, { ...audi, year: '2020' });
    assert.equal((await saved(page)).length, 3);
    assert.equal((await stored(page)).vehicles.length, 2);
    assert.match(await page.locator('[data-garage-summary]').textContent(), /this page only/);
    await page.evaluate(() => dispatchEvent(new StorageEvent('storage', { key: 'autobahn:garageFitOnly' })));
    assert.equal((await saved(page)).length, 3);
    await open(page);
    await row(page, '340i').locator('[data-garage-select]').check();
    assert.equal((await saved(page)).length, 3);
    assert.equal(await page.evaluate(() => AEGarage.read().model), '340i');
  });
});

test('multi-car garage validates stored collections and renders untrusted labels as text', async () => {
  const malicious = '<img src=x onerror="window.injected=true">';
  await withPage({ garageCollection: { version: 2, activeId: 'missing', vehicles: [null, 42, {}, { id: 'bmw', ...bmw }, { id: 'duplicate', ...bmw }, { id: 'bad id', make: malicious, model: 'Unknown', trim: 'Unknown' }] } }, async page => {
    assert.equal((await saved(page)).length, 2);
    assert.equal(await page.evaluate(() => AEGarage.read().model), '340i');
    await open(page);
    assert.equal(await rows(page).locator('img').count(), 0);
    assert.match(await rows(page).last().textContent(), /<img src=x/);
    await rows(page).last().locator('[data-garage-select]').check();
    assert.equal(await page.evaluate(() => AEGarage.complete(AEGarage.read())), false);
    assert.equal(await page.evaluate(() => window.injected), undefined);
    assert.match(await page.locator('[data-garage-title]').textContent(), /Update your saved vehicle/);
  });
});

test('multi-car garage URL preferences retain existing cars without persisting a shared selection automatically', async () => {
  await withPage({ garageCollection: collection() }, async page => {
    const shared = { ...audi, year: '2020' };
    await page.goto(`http://theme.test/collections/all?ae_garage=1&ae_vehicle=${encodeURIComponent(JSON.stringify(shared))}`);
    assert.equal(await page.evaluate(() => AEGarage.read().year), '2020');
    assert.equal((await saved(page)).length, 3);
    assert.equal((await stored(page)).vehicles.length, 2);
    assert.match(await page.locator('[data-garage-summary]').textContent(), /this page only/);
    await open(page);
    await page.locator('[data-garage-form] [type="submit"]').click();
    assert.equal((await stored(page)).vehicles.length, 3);
    assert.match(await page.locator('[data-garage-summary]').textContent(), /Saved in this browser/);
    assert.equal(new URL(page.url()).searchParams.has('ae_vehicle'), false);
    await open(page);
    await row(page, '340i').locator('[data-garage-select]').check();
    await page.reload();
    assert.equal(await page.evaluate(() => AEGarage.read().model), '340i');
    assert.equal((await saved(page)).length, 3);
  });
});

test('multi-car garage radios, edit/cancel and Escape retain keyboard focus and accessible control names', async () => {
  await withPage({ garageCollection: collection() }, async page => {
    await open(page);
    await row(page, '340i').locator('[data-garage-select]').focus();
    await page.keyboard.press('ArrowDown');
    assert.equal(await row(page, 'S4').locator('[data-garage-select]').isChecked(), true);
    assert.equal(await row(page, 'S4').locator('[data-garage-select]').evaluate(element => document.activeElement === element), true);
    assert.match(await row(page, 'S4').locator('[data-garage-edit]').getAttribute('aria-label'), /Edit vehicle: 2019 Audi S4/);
    await row(page, 'S4').locator('[data-garage-edit]').click();
    assert.equal(await page.locator('[data-garage-form] [name="vehicle_make"]').evaluate(element => document.activeElement === element), true);
    await page.locator('[data-garage-cancel]').click();
    assert.equal(await page.locator('[data-garage-add]').evaluate(element => document.activeElement === element), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('[data-garage-drawer]').isVisible(), false);
    assert.equal(await page.locator('[data-garage-toggle]').evaluate(element => document.activeElement === element), true);
  });
});

test('multi-car garage rows and controls fit desktop and mobile without overlap or horizontal overflow', async () => {
  for (const width of [320, 390, 768, 1024, 1440]) {
    await withPage({ viewport: { width, height: 844 }, garageCollection: collection() }, async page => {
      await open(page);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      for (const selector of ['.garage-drawer__workspace', '.garage-vehicle', '.garage-vehicle__choice', '.garage-vehicle__actions']) {
        assert.deepEqual(await page.locator(selector).evaluateAll(nodes => nodes.filter(node => node.scrollWidth > node.clientWidth + 1).map(node => node.className)), [], `${selector} at ${width}px`);
      }
      assert.equal(await rows(page).evaluateAll(nodes => nodes.some(node => {
        const a = node.querySelector('label').getBoundingClientRect();
        const b = node.querySelector('.garage-vehicle__actions').getBoundingClientRect();
        return a.right > b.left + 1;
      })), false);
      await row(page, 'S4').locator('[data-garage-edit]').click();
      await page.locator('[data-garage-form] [name="vehicle_year"]').fill('2020');
      await page.locator('[data-garage-form] [type="submit"]').click();
      assert.equal(await page.evaluate(() => AEGarage.read().year), '2020');
      await open(page);
      if (process.env.THEME_SCREENSHOTS) {
        fs.mkdirSync(path.join(root, '.tools/screenshots'), { recursive: true });
        await page.screenshot({ path: path.join(root, `.tools/screenshots/multi-garage-${width}.png`) });
      }
    });
  }
});
