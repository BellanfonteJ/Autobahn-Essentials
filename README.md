## Changelog

### 2026-05-11 5:15PM PST - Restore fallback images

- Restored the automotive fallback photos for homepage and builds sections.
- Moved fallback photos into theme assets so Shopify serves them without remote asset warnings.
- Reconnected hero, image-with-text, featured collection, promo tile, and builds page fallbacks.

### 2026-05-11 5:08PM PST - Mobile browsing optimization

- Added My Garage saved vehicle fitment with dynamic product and product-card badges.
- Improved mobile header, navigation, search drawer, and vehicle finder behavior.
- Expanded product pages with responsive gallery thumbnails, fitment details, shipping tabs, sticky add-to-cart, and back-in-stock capture.
- Added self-hosted storefront fonts and Shopify Theme Check tooling.

### 2026-05-11 1:50AM PST - Trust copy update

- Reworked the homepage image-with-text section to focus on part quality, shipping speed, secure checkout, and fitment-minded support.
- <img width="639" height="418" alt="image" src="https://github.com/user-attachments/assets/4222e07a-d3fc-411f-a5a5-3f7ed7ff6bb2" />

### 2026-05-11 1:45AM PST - Small wiring update

- Wired homepage CTAs and promo tiles to concrete shop, builds, search, and Instagram destinations.
- Improved header search, mobile nav, and cart drawer button behavior in `assets/theme.js`.
- Added safe fallback handling for builds-page Instagram links.

## Upload to Shopify

1. In Shopify admin, go to **Online Store > Themes**.
2. Choose **Add theme > Upload zip file**.
3. Upload the packaged theme zip.
4. Open the theme editor and configure logo, favicon, menus, hero media, featured collections, featured products, ticker text, and footer links.
5. Create pages in Shopify admin and assign the matching theme templates:
   - About Us -> `page.about`
   - Builds -> `page.builds`
   - Fitment Guide -> `page.fitment`
   - Contact -> `page.contact`
   - Shipping & Returns -> `page.shipping-returns`
   - FAQ -> `page.faq`

## V1.0 Validation

Before release, the theme passed:

- JavaScript syntax check
- Locale JSON parse
- `git diff --check`
- Shopify Theme Check
- Desktop browser smoke test for My Garage, fitment badges, product photo previews, and console errors
- Mobile browser smoke test for menu behavior, My Garage, fitment badge updates, garage clearing, and console errors
