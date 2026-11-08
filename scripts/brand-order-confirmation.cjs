const fs = require('node:fs');
const path = require('node:path');

const css = fs.readFileSync(path.join(__dirname, '../notifications/order-confirmation.css'), 'utf8');

function brandNotification(source, logoUrl, kind = 'order') {
  if (!['order', 'shipping'].includes(kind)) throw new Error('Unsupported notification kind');
  const marker = `ae-${kind}-email-branding-v1`;
  const stylesSource = kind === 'shipping'
    ? css + fs.readFileSync(path.join(__dirname, '../notifications/shipping-confirmation.css'), 'utf8')
    : css;
  const url = new URL(logoUrl);
  if (url.protocol !== 'https:' || /["<>]/.test(logoUrl)) {
    throw new Error('Use an HTTPS logo URL without HTML delimiters');
  }
  if (/ae-(order|shipping)-email-branding-v1/.test(source)) throw new Error('Template already contains AE branding');
  const headEnd = '</head>';
  const fallbackHeading = '<h1 class="shop-name__text">';
  for (const anchor of [headEnd, fallbackHeading]) {
    if (source.split(anchor).length !== 2) throw new Error(`Expected one template anchor: ${anchor}`);
  }
  // Insert only static presentation markup: every existing Liquid expression stays intact.
  const escapedUrl = logoUrl.replaceAll('&', '&amp;').replaceAll("'", '&#39;');
  const logo = `<img class="ae-email-logo" src="${escapedUrl}" width="168" alt="AE.">\n                      `;
  const styles = `<style id="${marker}">\n${stylesSource}</style>\n`;
  const result = source.replace(headEnd, styles + headEnd).replace(fallbackHeading, logo + fallbackHeading);
  if (result.replace(styles, '').replace(logo, '') !== source) {
    throw new Error('Template preservation check failed');
  }
  return result;
}

const brandOrderConfirmation = (source, logoUrl) => brandNotification(source, logoUrl, 'order');
const brandShippingConfirmation = (source, logoUrl) => brandNotification(source, logoUrl, 'shipping');
module.exports = { brandNotification, brandOrderConfirmation, brandShippingConfirmation };

if (require.main === module) {
  const [input, output, logoUrl, kind = 'order'] = process.argv.slice(2);
  if (!input || !output || !logoUrl || ![5, 6].includes(process.argv.length)) {
    throw new Error('Usage: node scripts/brand-order-confirmation.cjs INPUT OUTPUT HTTPS_LOGO_URL [order|shipping]');
  }
  const result = brandNotification(fs.readFileSync(input, 'utf8'), logoUrl, kind);
  fs.writeFileSync(output, result, { flag: 'wx' });
  process.stdout.write(`Generated branded notification (${Buffer.byteLength(result)} bytes). No store changes made.\n`);
}
