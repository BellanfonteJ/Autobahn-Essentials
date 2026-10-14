const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { test } = require('node:test');
const { root, renderPage } = require('./helpers/theme.cjs');

test('rendered first-party scripts and styles stay inside compressed transfer budgets', async () => {
  for (const template of ['index', 'product', 'collection', 'search', 'builds', 'contact']) {
    const html = await renderPage({ template });
    const scripts = [...html.matchAll(/<script[^>]+src="(\/assets\/[^"?]+\.js)"[^>]*>/g)];
    const styles = [...html.matchAll(/<link[^>]+href="(\/assets\/[^"?]+\.css)"[^>]*>/g)];
    const bytes = (matches) => [...new Set(matches.map((match) => match[1]))].reduce((sum, file) => sum + zlib.gzipSync(fs.readFileSync(path.join(root, file))).length, 0);
    const scriptBytes = bytes(scripts);
    const styleBytes = bytes(styles);
    assert.ok(scriptBytes <= 40 * 1024, `${template} scripts: ${scriptBytes} gzip bytes > 40 KiB`);
    assert.ok(styleBytes <= 30 * 1024, `${template} styles: ${styleBytes} gzip bytes > 30 KiB`);
    for (const [tag] of scripts) assert.match(tag, /\bdefer\b/, 'First-party scripts must not block parsing');
  }
});

test('fallback hero images and local fonts retain bounded payloads', () => {
  for (const [file, limit] of [
    ['AE-hero-640.webp', 40 * 1024], ['AE-hero-1200.webp', 90 * 1024], ['AE-hero-2400.webp', 220 * 1024],
    ['montserrat-latin-800-900.woff2', 45 * 1024], ['roboto-latin-400-900.woff2', 45 * 1024],
  ]) assert.ok(fs.statSync(path.join(root, 'assets', file)).size <= limit, `${file} exceeds its byte budget`);
});

test('product lead images are responsive, sized and prioritized without lazy loading', async () => {
  const html = await renderPage();
  const image = html.match(/<img\s+data-gallery-main[\s\S]*?>/)[0];
  for (const attribute of ['srcset', 'sizes', 'width', 'height', 'fetchpriority="high"', 'loading="eager"']) assert.ok(image.includes(attribute), attribute);
  assert.ok(!image.includes('loading="lazy"'));
  const lightbox = html.match(/<img data-gallery-lightbox-image[\s\S]*?>/)[0];
  assert.ok(!/\ssrc=/.test(lightbox), 'Full-resolution lightbox media is fetched only when opened');
});
