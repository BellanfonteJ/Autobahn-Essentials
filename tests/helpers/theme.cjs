const fs = require('node:fs');
const path = require('node:path');
const { Liquid, Hash } = require('liquidjs');

const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const readJSON = (file) => JSON.parse(read(file).replace(/^\s*\/\*[\s\S]*?\*\//, ''));
const translations = readJSON('locales/en.default.json');
const config = readJSON('config/settings_data.json').current;
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);
const hashes = (args) => Object.fromEntries(args.filter(Array.isArray));

const engine = new Liquid({ root: path.join(root, 'snippets'), extname: '.liquid' });
engine.registerFilter('json', (value) => JSON.stringify(value ?? null));
engine.registerFilter('handle', (value) => String(value).toLowerCase().replace(/\W+/g, '-'));
engine.registerFilter('asset_url', (value) => `/assets/${value}`);
engine.registerFilter('stylesheet_tag', (value) => `<link rel="stylesheet" href="${value}">`);
engine.registerFilter('image_url', (image) => `/assets/${image?.asset || 'brand-bmw-m4.jpg'}`);
engine.registerFilter('image_tag', (src, ...args) => {
  const attributes = hashes(args);
  return `<img src="${src}" width="900" height="600" ${Object.entries(attributes).map(([name, value]) => `${name}="${escape(value)}"`).join(' ')}>`;
});
engine.registerFilter('money', (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value / 100));
engine.registerFilter('t', (key, ...args) => {
  const value = key.split('.').reduce((current, name) => current?.[name], translations);
  if (typeof value !== 'string') throw new Error(`Missing translation: ${key}`);
  const parameters = hashes(args);
  return value.replace(/{{\s*(\w+)\s*}}/g, (_, name) => parameters[name] ?? '');
});
engine.registerFilter('payment_button', () => '<div class="shopify-payment-button"><button type="button">Buy now</button></div>');
engine.registerFilter('metafield_tag', (value) => `<p>${escape(value?.value || value)}</p>`);
engine.registerFilter('default_errors', () => '<p>Please enter a valid email.</p>');
engine.registerFilter('default_pagination', () => '');
engine.registerFilter('placeholder_svg_tag', () => '<svg width="100" height="100" aria-hidden="true"></svg>');
engine.registerFilter('link_to_tag', (value) => `<a href="/collections/bmw/${value}">${escape(value)}</a>`);

function parseBlock(tag, tokens, endTag) {
  tag.templates = [];
  const stream = tag.liquid.parser.parseStream(tokens)
    .on(`tag:${endTag}`, () => stream.stop())
    .on('template', (template) => tag.templates.push(template));
  stream.start();
}

engine.registerTag('form', {
  parse(token, tokens) {
    this.formType = token.args.match(/^'([^']+)'/)[1];
    this.hash = new Hash(token.args.replace(/^'[^']+'(?:,\s*product)?\s*,?\s*/, ''));
    parseBlock(this, tokens, 'endform');
  },
  *render(ctx, emitter) {
    const attributes = yield this.hash.render(ctx);
    const actions = { product: '/cart/add', customer: '/contact', contact: '/contact', storefront_password: '/password' };
    const states = ctx.get(['_formStates']);
    ctx.push({ form: { 'posted_successfully?': false, errors: null, ...states?.[attributes.id] } });
    try {
      const content = yield this.liquid.renderer.renderTemplates(this.templates, ctx);
      return `<form method="post" action="${actions[this.formType]}" ${Object.entries(attributes).map(([name, value]) => `${name}="${escape(value)}"`).join(' ')}>${content}</form>`;
    } finally { ctx.pop(); }
  },
});
engine.registerTag('paginate', {
  parse(token, tokens) { parseBlock(this, tokens, 'endpaginate'); },
  *render(ctx, emitter) {
    ctx.push({ paginate: { pages: 1, current_page: 1, ...ctx.get(['_paginate']) } });
    try { yield this.liquid.renderer.renderTemplates(this.templates, ctx, emitter); }
    finally { ctx.pop(); }
  },
});

const media = Array.from({ length: 7 }, (_, index) => ({
  id: index + 1,
  media_type: 'image',
  preview_image: { asset: 'brand-bmw-m4.jpg', width: 900, height: 600, alt: `Product photo ${index + 1}` },
}));
const variants = [
  { id: 101, title: 'Standard', available: true, price: 10000, compare_at_price: 0, sku: 'AE-STD', inventory_management: 'shopify', inventory_quantity: 12, featured_media: media[0] },
  { id: 102, title: 'Premium', available: true, price: 15000, compare_at_price: 20000, sku: 'AE-PREMIUM', inventory_management: 'shopify', inventory_quantity: 2, featured_media: media[5] },
  { id: 103, title: 'Limited', available: false, price: 17500, compare_at_price: 0, sku: 'AE-LIMITED', inventory_management: 'shopify', inventory_quantity: 0, featured_media: media[6] },
];
const product = {
  id: 100, handle: 'test-part', title: 'BMW F30 Charge Pipe', url: '/products/test-part', type: 'Charge pipe', vendor: 'AE',
  available: true, has_only_default_variant: false, price_varies: true, price: 10000, compare_at_price: 0,
  variants, selected_or_first_available_variant: variants[0], media, featured_media: media[0], tags: ['BMW', 'F30'],
  description: '<p>ARM Motorsports charge pipe performance details.</p><p>Installation details.</p>',
  metafields: { custom: {} }, collections: [],
};

function context(options = {}) {
  return {
    shop: { name: 'Autobahn Essentials', currency: 'USD', email: 'support@example.test' },
    settings: { ...config, ...options.settings },
    routes: { root_url: '/', cart_url: '/cart', search_url: '/search', collections_url: '/collections', all_products_collection_url: '/collections/all', ...options.routes },
    request: { locale: { iso_code: 'en-US' } },
    cart: { item_count: 0, items: [], total_price: 0, currency: { iso_code: 'USD' }, ...options.cart },
    page_title: 'Autobahn Essentials', canonical_url: 'http://theme.test/', current_page: 1,
    template: { name: options.template || 'product' }, product: { ...product, ...options.product },
    pages: {}, search: { performed: true, terms: 'charge pipe', results_count: 1, results: [{ ...product, object_type: 'product' }], ...options.search },
    collection: { title: 'BMW', url: '/collections/bmw', products_count: 1, products: [product], all_tags: [], sort_options: [], ...options.collection },
    _paginate: options.paginate || {},
    _formStates: options.formStates || {},
  };
}

async function renderSection(name, ctx, overrides = {}) {
  const file = read(`sections/${name}.liquid`);
  const schema = JSON.parse(file.match(/{% schema %}([\s\S]*?){% endschema %}/)[1]);
  const defaults = Object.fromEntries((schema.settings || []).map((setting) => [setting.id, setting.default]));
  const settings = { ...defaults, ...overrides.settings };
  if (name === 'header') settings.menu = { links: [] };
  const scope = { ...ctx, section: { id: name, settings, blocks: overrides.blocks || [] } };
  return engine.parseAndRender(file.replace(/{% schema %}[\s\S]*?{% endschema %}/, ''), scope, { globals: scope });
}

async function renderPage(options = {}) {
  const ctx = context(options);
  const template = options.template || 'product';
  const name = { product: 'main-product', index: 'hero-autobahn', collection: 'main-collection-product-grid', search: 'main-search', cart: 'main-cart-items', contact: 'page-contact-autobahn', fitment: 'page-fitment-autobahn', password: 'main-password' }[template];
  const popupSettings = { ...config.sections['popup-newsletter'].settings, enabled: Boolean(options.popup), delay_seconds: options.popupDelay ?? 30 };
  let content = await renderSection(name, ctx);
  if (options.finder) content += await renderSection('vehicle-finder', ctx);
  if (options.cards) {
    const card = await engine.renderFile('product-card', { ...ctx, product: ctx.product });
    content += `<div class="page-width"><div class="product-grid">${card.repeat(options.cardsCount || 1)}</div></div>`;
  }
  const shell = read(template === 'password' ? 'layout/password.liquid' : 'layout/theme.liquid').replace(/{% section '([^']+)' %}/g, (_, section) => `{{ ${section.replace(/-/g, '_')}_html }}`);
  return engine.parseAndRender(shell, {
    ...ctx, content_for_layout: content,
    header_html: await renderSection('header', ctx),
    footer_html: await renderSection('footer', ctx),
    popup_newsletter_html: await renderSection('popup-newsletter', ctx, { settings: popupSettings }),
  }, { globals: ctx });
}

async function mount(page, options = {}) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const html = await renderPage(options);
  await page.route('http://theme.test/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.startsWith('/assets/')) {
      if (pathname === '/assets/fitment-data.js' && !options.actualFitment) {
        return route.fulfill({ contentType: 'text/javascript', body: `window.AEFitmentData = ${JSON.stringify(options.fitmentData || fitmentData)};` });
      }
      const file = path.join(root, pathname.slice(1));
      const contentType = { '.css': 'text/css', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }[path.extname(file)];
      await route.fulfill({ body: fs.readFileSync(file), contentType });
    } else {
      await route.fulfill({ body: html, contentType: 'text/html' });
    }
  });
  if (options.garage) await page.addInitScript((garage) => {
    if (sessionStorage.getItem('garageFixtureSeeded')) return;
    localStorage.setItem('autobahn:garage', JSON.stringify(garage));
    sessionStorage.setItem('garageFixtureSeeded', 'true');
  }, options.garage);
  if (options.storageBlocked) await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage is unavailable'); } });
  });
  if (options.observerUnavailable) await page.addInitScript(() => { delete window.IntersectionObserver; });
  await page.goto('http://theme.test/products/test-part');
  await page.evaluate(() => document.fonts.ready);
  return errors;
}

const fitmentData = {
  version: 1,
  vehicles: [
    { make: 'BMW', model: '340i', chassis: 'F30', engine: 'B58', variant: '', years: null },
    { make: 'Audi', model: 'S4', chassis: 'B9', engine: '3.0T', variant: '', years: null },
    { make: 'BMW', model: '335i', chassis: 'F30', engine: 'N55', variant: '', years: null },
    { make: 'BMW', model: '335i', chassis: 'E90', engine: 'N54', variant: '', years: null },
  ],
  products: { 'test-part': { records: [0], review: false }, wrong: { records: [2], review: false }, restricted: { records: [0], review: true }, cross: { records: [1, 2], review: false } },
};

module.exports = { root, read, product, variants, fitmentData, context, renderSection, renderPage, mount };
