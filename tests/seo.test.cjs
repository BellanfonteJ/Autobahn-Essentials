const assert = require('node:assert/strict');
const fs = require('node:fs');
const { test, before, after } = require('node:test');
const { chromium } = require('playwright');
const { mount, read } = require('./helpers/theme.cjs');

let browser;
before(async () => {
  const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || (fs.existsSync(chrome) ? chrome : undefined) });
});
after(async () => { await browser?.close(); });

async function inspect(options, check) {
  const session = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await session.newPage();
    assert.deepEqual(await mount(page, options), []);
    await check(page);
  } finally { await session.close(); }
}

const meta = (page, name) => page.locator(`head meta[name="${name}"], head meta[property="${name}"]`).getAttribute('content');
const schemas = page => page.locator('script[type="application/ld+json"]').evaluateAll(nodes => nodes.map(node => JSON.parse(node.textContent)));

test('SEO preserves merchant titles, descriptions and canonical pagination while escaping metadata', async () => {
  const title = 'BMW "N54" parts & upgrades';
  const description = 'Merchant description with "quotes", & symbols and <b>literal text</b>.';
  await inspect({ template: 'collection', pageTitle: title, pageDescription: description, currentPage: 2, currentTags: ['Turbo & cooling'], canonicalUrl: 'https://autobahnessentials.com/collections/bmw?page=2' }, async page => {
    assert.equal(await page.title(), `${title} - Turbo & cooling - Page 2 | Autobahn Essentials`);
    assert.equal(await meta(page, 'description'), description);
    assert.equal(await meta(page, 'og:description'), description);
    assert.equal(await meta(page, 'og:url'), 'https://autobahnessentials.com/collections/bmw?page=2');
    assert.equal(await page.locator('link[rel="canonical"]').count(), 1);
    assert.equal(await page.locator('meta[name="description"]').count(), 1);
    assert.equal(await page.locator('head b').count(), 0);
  });
  await inspect({ template: 'index', pageTitle: 'Merchant homepage title', pageDescription: 'Merchant homepage summary.' }, async page => {
    assert.equal(await page.title(), 'Merchant homepage title | Autobahn Essentials');
    assert.equal(await meta(page, 'description'), 'Merchant homepage summary.');
  });
});

test('SEO uses readable resource fallbacks only when merchant descriptions are blank', async () => {
  await inspect({ template: 'index', pageDescription: '' }, async page => {
    assert.equal(await page.title(), 'European Performance Parts | Autobahn Essentials');
    assert.match(await meta(page, 'description'), /BMW, Audi and Volkswagen/);
  });
  for (const [template, resource] of [['product', 'description'], ['collection', 'description'], ['page', 'content'], ['article', 'excerpt_or_content']]) {
    await inspect({ template, pageDescription: '', [template]: { [resource]: '<p>Verified details & requirements.</p><p>Confirm fitment before ordering.</p>' } }, async page => {
      assert.equal(await meta(page, 'description'), 'Verified details & requirements. Confirm fitment before ordering.');
      assert.ok((await meta(page, 'description')).length <= 160);
    });
  }
  await inspect({ pageTitle: 'BMW part', product: { description: '' } }, async page => {
    assert.equal(await meta(page, 'description'), 'BMW part | Autobahn Essentials');
  });
  await inspect({ template: 'collection', collection: { title: 'BMW', description: '' } }, async page => {
    assert.match(await meta(page, 'description'), /^Explore BMW at Autobahn Essentials\./);
    assert.ok((await meta(page, 'description')).length <= 160);
  });
});

test('SEO social cards use page-specific absolute images, escaped alt text and matching titles', async () => {
  await inspect({ pageTitle: 'BMW intercooler', pageImage: { asset: 'brand-bmw-m4.jpg', alt: 'BMW "intercooler" & hoses' } }, async page => {
    assert.equal(await meta(page, 'og:type'), 'product');
    assert.equal(await meta(page, 'twitter:card'), 'summary_large_image');
    assert.equal(await meta(page, 'og:image'), 'http://theme.test/assets/brand-bmw-m4.jpg');
    assert.equal(await meta(page, 'twitter:image'), await meta(page, 'og:image'));
    assert.equal(await meta(page, 'og:image:alt'), 'BMW "intercooler" & hoses');
    assert.equal(await meta(page, 'og:title'), await page.title());
    assert.equal(await meta(page, 'twitter:title'), await page.title());
  });
  await inspect({ template: 'collection' }, async page => {
    assert.equal(await meta(page, 'og:type'), 'website');
    assert.equal(await meta(page, 'twitter:card'), 'summary');
    assert.equal(await page.locator('meta[property="og:image"]').count(), 0);
  });
});

test('SEO delegates product and article schema to Shopify and prevents script termination', async () => {
  assert.match(read('snippets/structured-data.liquid'), /product \| structured_data/);
  assert.match(read('snippets/structured-data.liquid'), /article \| structured_data/);
  for (const [template, type] of [['product', 'ProductGroup'], ['article', 'Article']]) {
    const nativeFixture = { '@context': 'https://schema.org', '@type': type, name: '</script><script id="injected">bad()</script>', offers: { price: '123.45', priceCurrency: 'EUR', availability: 'https://schema.org/OutOfStock' } };
    await inspect({ template, [template]: { _structuredData: nativeFixture } }, async page => {
      assert.deepEqual((await schemas(page)).find(schema => schema['@type'] === type), nativeFixture);
      assert.equal(await page.locator('#injected').count(), 0);
      assert.ok(!(await schemas(page)).some(schema => schema.aggregateRating || schema.review || schema.shippingDetails));
    });
  }
});

test('SEO homepage identifies the real organization and localized website without invented business claims', async () => {
  await inspect({ template: 'index', canonicalUrl: 'https://autobahnessentials.com/es/', shop: { name: 'Autobahn </script> & Essentials', url: 'https://autobahnessentials.com' }, request: { origin: 'https://autobahnessentials.myshopify.com' }, routes: { root_url: '/es/' } }, async page => {
    const graph = (await schemas(page))[0]['@graph'];
    assert.equal(graph.length, 2);
    assert.equal(graph[0]['@type'], 'Organization');
    assert.equal(graph[0].name, 'Autobahn </script> & Essentials');
    assert.equal(graph[0].url, 'https://autobahnessentials.com');
    assert.equal(graph[1]['@type'], 'WebSite');
    assert.equal(graph[1].url, 'https://autobahnessentials.com/es/');
    assert.equal(graph[1].publisher['@id'], graph[0]['@id']);
    assert.deepEqual(Object.keys(graph[0]).sort(), ['@id', '@type', 'name', 'url']);
    assert.ok(!graph[1].potentialAction);
  });
});

test('SEO breadcrumb schema follows visible breadcrumbs and retains localized absolute URLs', async () => {
  for (const template of ['product', 'collection', 'page', 'blog', 'article']) {
    const canonicalUrl = `https://autobahnessentials.com/es/${template}/example`;
    await inspect({ template, canonicalUrl, request: { origin: 'https://autobahnessentials.com' }, routes: { root_url: '/es/' }, collection: { url: '/es/collections/bmw' }, blog: { url: '/es/blogs/guides' } }, async page => {
      const breadcrumb = (await schemas(page)).find(schema => schema['@type'] === 'BreadcrumbList');
      const items = breadcrumb.itemListElement;
      const labels = await page.locator('.breadcrumbs a, .breadcrumbs span:not([aria-hidden])').allTextContents();
      assert.deepEqual(items.map(item => item.name), labels);
      assert.deepEqual(items.map(item => item.position), items.map((_, index) => index + 1));
      assert.equal(items[0].item, 'https://autobahnessentials.com/es/');
      assert.equal(items.at(-1).item, canonicalUrl);
      assert.ok(items.every(item => item.item.startsWith('https://autobahnessentials.com/es/')));
    });
  }
  await inspect({ collection: null, product: { collections: [] } }, async page => {
    assert.equal((await schemas(page)).find(schema => schema['@type'] === 'BreadcrumbList').itemListElement.length, 2);
  });
});

test('SEO keeps utility pages out of the index without noindexing products or collection pagination', async () => {
  for (const template of ['search', 'cart', '404']) {
    await inspect({ template }, async page => {
      assert.equal(await meta(page, 'robots'), 'noindex,follow');
      assert.ok(!(await schemas(page)).some(schema => ['Product', 'ProductGroup'].includes(schema['@type'])));
    });
  }
  for (const template of ['index', 'product', 'collection', 'page', 'article']) {
    await inspect({ template, currentPage: 2, canonicalUrl: `http://theme.test/${template}?page=2` }, async page => {
      assert.equal(await meta(page, 'robots'), 'max-image-preview:large');
      assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), `http://theme.test/${template}?page=2`);
    });
  }
});
