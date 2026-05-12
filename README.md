## Changelog

### 2026-05-11 17:15 -07:00 - Restore fallback images

- Restored the automotive fallback photos that were lost during the PR #10 merge cleanup.
- Moved fallback photos into theme assets so Shopify serves them without remote asset warnings.
- Reconnected hero, image-with-text, featured collection, promo tile, and builds page fallbacks.

### 2026-05-11 17:08 -07:00 - PR #10 merge and Theme Check fix

- Resolved the PR #10 merge conflicts against the latest `main` branch.
- Kept the My Garage fitment updates aligned with the saved vehicle finder chip UI.
- Fixed fallback image markup so Shopify Theme Check passes with no offenses.

### 2026-05-11 01:50 -07:00 - Trust copy update

- Reworked the homepage image-with-text section to focus on part quality, shipping speed, secure checkout, and fitment-minded support.
- <img width="639" height="418" alt="image" src="https://github.com/user-attachments/assets/4222e07a-d3fc-411f-a5a5-3f7ed7ff6bb2" />

### 2026-05-11 01:45 -07:00 - Small wiring update

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
