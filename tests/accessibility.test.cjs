const assert = require('node:assert/strict');
const fs = require('node:fs');
const { test, before, after } = require('node:test');
const { chromium } = require('playwright');
const axe = require('axe-core');
const { mount } = require('./helpers/theme.cjs');

let browser;
before(async () => {
  const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || (fs.existsSync(chrome) ? chrome : undefined) });
});
after(async () => { await browser?.close(); });

async function audit(page, label) {
  await page.addScriptTag({ content: axe.source });
  const results = await page.evaluate(() => axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } }));
  assert.deepEqual(results.violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) })), [], label);
}

for (const template of ['index', 'product', 'collection', 'search', 'builds', 'contact', 'returns']) {
  test(`${template} has no axe WCAG A/AA violations on mobile or desktop fixtures`, async () => {
    for (const width of [390, 1440]) {
      const session = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
      const page = await session.newPage();
      try {
        await mount(page, { template });
        await audit(page, `${template} at ${width}px`);
      } finally { await session.close(); }
    }
  });
}

test('populated cart pages and drawers pass axe on mobile and desktop', async () => {
  const item = { key: '101:key', url: '/products/test-part', url_to_remove: '/cart/change?line=1&quantity=0', product_title: 'BMW charge pipe', variant_title: 'Standard', product: { title: 'BMW charge pipe', has_only_default_variant: false }, variant: { title: 'Standard' }, image: { asset: 'brand-bmw-m4.jpg', alt: 'BMW charge pipe' }, quantity: 1, final_line_price: 12345 };
  for (const width of [320, 1440]) {
    const session = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
    const page = await session.newPage();
    try {
      await mount(page, { template: 'cart', cart: { item_count: 1, items: [item], total_price: 12345 } });
      await audit(page, `Populated cart at ${width}px`);
      await page.route('**/cart.js', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ item_count: 1, currency: 'USD', total_price: 12345, items: [{ ...item, image: '/assets/brand-bmw-m4.jpg' }] }) }));
      await page.locator('[data-cart-drawer-open]').click();
      await page.waitForFunction(() => document.querySelector('.cart-drawer__title'));
      await audit(page, `Populated cart drawer at ${width}px`);
    } finally { await session.close(); }
  }
});

test('multi-car garage passes axe with saved vehicles and edit controls on mobile and desktop', async () => {
  for (const width of [320, 1440]) {
    const session = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: 'reduce' });
    try {
      const page = await session.newPage();
      await mount(page, { garageCollection: { version: 2, activeId: 'bmw', vehicles: [
        { id: 'bmw', year: '2017', make: 'BMW', model: '340i', chassis: 'F30', trim: 'B58' },
        { id: 'audi', year: '2019', make: 'Audi', model: 'S4', chassis: 'B9', trim: '3.0T' },
      ] } });
      await page.locator('[data-garage-toggle]').click();
      await audit(page, `Multi-car garage at ${width}px`);
      await page.locator('[data-garage-edit]').last().click();
      await audit(page, `Editing saved car at ${width}px`);
    } finally { await session.close(); }
  }
});

test('contact error and success states pass axe with visible labels on mobile and desktop', async () => {
  for (const width of [320, 1440]) {
    for (const state of [{ errors: ['email'], email: 'invalid' }, { 'posted_successfully?': true }]) {
      const session = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      try {
        const page = await session.newPage();
        await mount(page, { template: 'contact', formStates: { 'ContactForm-page-contact-autobahn': state } });
        await audit(page, `Contact feedback at ${width}px`);
      } finally { await session.close(); }
    }
  }
});

test('returns feedback and expanded guidance pass axe on mobile and desktop', async () => {
  for (const width of [320, 1440]) {
    for (const state of [{ errors: ['email'], email: 'invalid' }, { 'posted_successfully?': true }]) {
      const session = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      try {
        const page = await session.newPage();
        await mount(page, { template: 'returns', formStates: { 'ReturnRequest-page-returns-autobahn': state } });
        await page.locator('.ae-returns-faq summary').first().click();
        await page.locator('.ae-returns-pack summary').click();
        await audit(page, `Returns feedback at ${width}px`);
      } finally { await session.close(); }
    }
  }
});

test('native refund policy layout passes axe on mobile and desktop without blank spacer headings', async () => {
  for (const width of [320, 1440]) {
    const session = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    try {
      const page = await session.newPage();
      await mount(page, { template: 'policy', request: { path: '/policies/refund-policy' }, policy: { title: 'Refund policy', body: '<p>Existing merchant policy content.</p><h2><br></h2><h2>Return review</h2><p>Contact our support team before shipping an item.</p><ul><li>Keep the order confirmation.</li></ul>' }, pages: { contact: { url: '/pages/contact' } } });
      await audit(page, `Native refund policy at ${width}px`);
    } finally { await session.close(); }
  }
});

test('search, garage, gallery, cart and newsletter dialogs pass axe when opened', async () => {
  const session = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await session.newPage();
  try {
    await mount(page, { popup: true, popupDelay: 0 });
    await page.locator('[data-popup-newsletter]').waitFor({ state: 'visible' });
    await audit(page, 'Newsletter');
    await page.locator('.popup-newsletter__close').click();
    for (const [open, close] of [
      ['[data-search-toggle]', '[data-search-toggle]'],
      ['[data-garage-toggle]', '[data-garage-close]'],
      ['[data-gallery-open]', '.product-gallery-lightbox__close'],
      ['[data-cart-drawer-open]', '[data-cart-drawer-close]'],
    ]) {
      await page.locator(open).first().click();
      await audit(page, open);
      await page.locator(close).last().click();
    }
  } finally { await session.close(); }
});

test('mobile native filter drawer passes axe with brand, availability and price fields', async () => {
  const session = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await session.newPage();
  const value = { param_name: 'filter.p.vendor', value: 'ARM Motorsports', label: 'ARM Motorsports', count: 1, active: false };
  try {
    await mount(page, { template: 'collection', collection: { filters: [
      { label: 'Brand', type: 'list', values: [value], active_values: [] },
      { label: 'Availability', type: 'boolean', values: [{ ...value, param_name: 'filter.v.availability', value: '1', label: 'In stock' }], active_values: [] },
      { label: 'Price', type: 'price_range', min_value: { param_name: 'filter.v.price.gte', value: null }, max_value: { param_name: 'filter.v.price.lte', value: null }, range_max: 10000, active_values: [] },
    ] } });
    await page.locator('[data-facet-open]').click();
    await audit(page, 'Mobile filters');
  } finally { await session.close(); }
});
