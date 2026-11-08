const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { Liquid } = require('liquidjs');
const { brandNotification, brandOrderConfirmation, brandShippingConfirmation } = require('../scripts/brand-order-confirmation.cjs');

const source = '<html><head><style>.button__cell { background: {{ shop.email_accent_color }}; }</style></head><body>{% if shop.email_logo_url %}<img src="{{ shop.email_logo_url }}">{% else %}<h1 class="shop-name__text">{{ shop.name }}</h1>{% endif %}{% if has_pending_payment %}{{ email_body }}{% endif %}{% for line in line_items %}{{ line.title }}{{ line.quantity }}{{ line.final_line_price | money }}{% endfor %}{{ order_status_url }}{{ shop_app_tracking_url }}{{ shipping_address | format_address }}{{ total_price | money }}</body></html>';
const logo = 'https://cdn.shopify.com/example-logo.png?width=336&format=png';
const tokens = text => text.match(/{[%{][\s\S]*?[%}]}/g);

test('notification branding preserves every original Liquid expression and surrounding content', () => {
  const result = brandOrderConfirmation(source, logo);
  assert.deepEqual(tokens(result), tokens(source));
  const stripped = result.replace(/<style id="ae-order-email-branding-v1">[\s\S]*?<\/style>\n/, '')
    .replace(/<img class="ae-email-logo"[^>]+>\n {22}/, '');
  assert.equal(stripped, source);
  assert.match(result, /format=png/);
  assert.match(result, /width=336&amp;format=png/);
});

test('notification transformer fails closed for duplicate branding or changed template structure', () => {
  assert.throws(() => brandOrderConfirmation(brandOrderConfirmation(source, logo), logo), /already contains/);
  assert.throws(() => brandOrderConfirmation(source.replace('</head>', ''), logo), /template anchor/);
  assert.throws(() => brandOrderConfirmation(source + '<h1 class="shop-name__text">', logo), /template anchor/);
});

test('notification logo rejects unsafe URLs and markup injection', () => {
  for (const url of ['http://example.com/logo.png', 'javascript:alert(1)', 'https://example.com/" onerror="alert(1)']) {
    assert.throws(() => brandOrderConfirmation(source, url), /HTTPS logo/);
  }
});

test('email styles use native table layout and preserve the Shop tracking control', () => {
  const css = fs.readFileSync(path.join(__dirname, '../notifications/order-confirmation.css'), 'utf8');
  assert.match(css, /background: #151515/);
  assert.match(css, /background: #c53520/);
  assert.match(css, /max-width: 600px/);
  assert.doesNotMatch(css, /display:\s*(grid|flex)|@import|@font-face|button__cell--shop-app|display:\s*none/);
  assert.doesNotMatch(brandOrderConfirmation(source, logo), /<script|<form/);
});

const shippingSource = `<html><head></head><body><h1 class="shop-name__text">{{ shop.name }}</h1>
{% if fulfillment.item_count == item_count %}Your order is on the way{% elsif fulfillment_status == 'fulfilled' %}The last items are on the way{% else %}Some items are on the way{% endif %}
{% if fulfillment.estimated_delivery_at %}{{ fulfillment.estimated_delivery_at }}{% endif %}
{% if order_status_url %}<a href="{{ order_status_url }}">View your order</a>{% endif %}
{% if fulfillment.tracking_numbers.size > 0 %}
{% if fulfillment.tracking_numbers.size == 1 and fulfillment.tracking_company and fulfillment.tracking_url %}
{{ fulfillment.tracking_company }} tracking number: <a href="{{ fulfillment.tracking_url }}">{{ fulfillment.tracking_numbers.first }}</a>
{% elsif fulfillment.tracking_numbers.size == 1 %}Tracking number: {{ fulfillment.tracking_numbers.first }}
{% else %}{% for tracking_number in fulfillment.tracking_numbers %}
{% if fulfillment.tracking_urls[forloop.index0] %}<a href="{{ fulfillment.tracking_urls[forloop.index0] }}">{{ tracking_number }}</a>{% else %}{{ tracking_number }}{% endif %}
{% endfor %}{% endif %}{% endif %}
{% for line in fulfillment.fulfillment_line_items %}{{ line.line_item.title }} {{ line.quantity }}{% endfor %}</body></html>`;

test('shipping branding preserves all native expressions, shipment copy and tracking attributes', () => {
  const result = brandShippingConfirmation(shippingSource, logo);
  assert.deepEqual(tokens(result), tokens(shippingSource));
  assert.equal(result.replace(/<style id="ae-shipping-email-branding-v1">[\s\S]*?<\/style>\n/, '')
    .replace(/<img class="ae-email-logo"[^>]+>\n {22}/, ''), shippingSource);
  assert.match(result, /overflow-wrap: anywhere/);
  assert.throws(() => brandNotification(source, logo, 'refund'), /Unsupported notification/);
  assert.throws(() => brandShippingConfirmation(brandOrderConfirmation(source, logo), logo), /already contains/);
});

test('shipping fixture retains full/partial shipments and tracking fallbacks after styling', async () => {
  const liquid = new Liquid();
  const styled = brandShippingConfirmation(shippingSource, logo);
  for (const data of [
    { count: 2, status: 'fulfilled', numbers: ['A123'], company: 'UPS', url: 'https://example.test/track/A123', urls: [] },
    { count: 1, status: 'partial', numbers: ['B123'], urls: [] },
    { count: 1, status: 'fulfilled', numbers: ['C123', 'D123'], urls: ['https://example.test/track/C123'] },
    { count: 1, status: 'partial', numbers: [], urls: [] }
  ]) {
    const context = { shop: { name: 'Autobahn Essentials' }, item_count: 2, fulfillment_status: data.status,
      order_status_url: 'https://example.test/order', fulfillment: { item_count: data.count, tracking_numbers: data.numbers,
        tracking_company: data.company, tracking_url: data.url, tracking_urls: data.urls,
        fulfillment_line_items: [{ line_item: { title: 'Intercooler' }, quantity: data.count }] } };
    const before = await liquid.parseAndRender(shippingSource, context);
    const after = await liquid.parseAndRender(styled, context);
    assert.equal(after.replace(/<style id="ae-shipping-email-branding-v1">[\s\S]*?<\/style>\n/, '')
      .replace(/<img class="ae-email-logo"[^>]+>\n {22}/, ''), before);
    for (const tracking of data.numbers) assert.ok(after.includes(tracking));
    assert.equal((after.match(/href="https:\/\/example.test\/track\//g) || []).length,
      data.url ? 1 : data.urls.length);
  }
});
