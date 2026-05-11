
## Changelog

### 2026-05-11 - Trust copy update

- Reworked the homepage image-with-text section to focus on part quality, shipping speed, secure checkout, and fitment-minded support.
- Updated the section defaults so newly added image-with-text blocks use customer trust messaging instead of theme-demo language.

### 2026-05-11 - Small wiring update

- Wired homepage CTAs and promo tiles to concrete shop, builds, search, and Instagram destinations.
- Improved header search, mobile nav, and cart drawer button behavior in `assets/theme.js`.
- Added safe fallback handling for builds-page Instagram links.

## Upload to Shopify

1. In Shopify admin, go to **Online Store > Themes**.
2. Choose **Add theme > Upload zip file**.
3. Upload `autobahn-essentials-shopify-theme.zip`.
4. Open the theme editor and set:
   - Logo and favicon
   - Main menu and footer menus
   - Hero image
   - Featured products collection
   - Featured collection blocks
   - Optional custom logo if you want to replace the bundled AE asset
   - Ticker slogan and visibility from theme settings
5. Create pages in Shopify admin and assign the matching theme templates:
   - About Us -> `page.about`
   - Builds -> `page.builds`
   - Fitment Guide -> `page.fitment`
   - Contact -> `page.contact`
   - Shipping & Returns -> `page.shipping-returns`
   - FAQ -> `page.faq`

## Local Preview

Open `preview.html` in a browser to see the storefront direction without Shopify data. Open `pages-preview.html` to preview the custom page template styling.

The preview files are static reference mockups and are not included in the Shopify upload zip. Shopify renders the Liquid theme from the `assets`, `sections`, `snippets`, `templates`, `config`, `layout`, and `locales` folders. Products, checkout, dynamic collections, theme editor settings, menus, and assigned page templates only work after upload to Shopify.
