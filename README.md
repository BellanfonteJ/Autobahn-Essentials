## Changelog

### May 11th 11:01PM PST - Show mobile header icons

- Adjusted the mobile header grid so the logo, menu trigger, and action icons all have room to display.
- Restored the header action icon buttons on mobile layouts.
- Tightened mobile logo and icon sizing for narrow screens down to 360px.

### May 11th 10:59PM PST - Tidy product descriptions

- Moved the product trust module directly under the cart controls and above the description.
- Centered product description text and uploaded description images.
- Added duplicate-block cleanup for repeated product description content.

### May 11th 10:54PM PST - Move product trust badges below description

- Added product-page handling for descriptions that start with guarantee, stock, shipping, or trust-badge content.
- Moved that leading trust cluster to the bottom of the product description so product copy appears first.
- Kept uploaded badge images centered and responsive after they move.

### May 11th 10:48PM PST - Center product media and purchase panel

- Moved product pages to an image-first layout with the main image centered above the product details.
- Kept preview thumbnails centered directly under the main product image.
- Moved the product description below the media and paired the price with the add-to-cart action at the top of the details panel.

### May 11th 10:40PM PST - Fix product image rendering

- Switched product card, product gallery, cart, and cart drawer images to contained rendering so product photos no longer crop.
- Added padded media surfaces and subtle image shadows for cleaner product presentation.
- Updated product thumbnail buttons to keep preview images centered and fully visible.

### May 11th 5:46PM PST - Smooth hero-to-carbon transition

- Extended the hero image below the hero boundary so the upper modules sit over the same visual field.
- Reduced the lower hero fade opacity to avoid a hard black cutoff.
- Lightened the spec-strip carbon layer so it blends into the hero instead of forming a dark band.

### May 11th 5:43PM PST - Remove black bands behind hero modules

- Removed the solid black hero/spec-strip backgrounds behind the stat and trust modules.
- Softened the hero image fade so the image carries farther behind the upper modules.
- Replaced the lower module band with a transparent carbon texture layer.

### May 11th 5:39PM PST - Add graphite texture and red edge lighting

- Reworked the default background and surface colors from flat black to layered graphite tones.
- Added subtle carbon-fiber and brushed-metal texture layers across page and section backgrounds.
- Added restrained red edge lighting, border accents, and soft active-state glows to cards, buttons, drawers, and key panels.

### May 11th 5:30PM PST - Remove homepage vehicle finder

- Removed the redundant homepage vehicle finder section now that My Garage handles saved vehicle fitment.
- Kept the dedicated Fitment Guide page and collection/search fitment forms available for deeper searches.
- Let the homepage move from hero stats directly into the trust/spec strip for a cleaner first scroll.

### May 11th 5:29PM PST - Clean up My Garage drawer

- Replaced repeated My Garage placeholders with clear Year, Make, Model, Trim / Engine, and Chassis fields.
- Added Trim / Engine to the saved garage data so more complete vehicle details can display and persist.
- Updated the drawer layout so the expanded vehicle form fits cleanly across desktop and mobile.

### May 11th 5:15PM PST - Restore fallback images

- Restored the automotive fallback photos for homepage and builds sections.
- Moved fallback photos into theme assets so Shopify serves them without remote asset warnings.
- Reconnected hero, image-with-text, featured collection, promo tile, and builds page fallbacks.

### May 11th 5:08PM PST - Mobile browsing optimization

- Added My Garage saved vehicle fitment with dynamic product and product-card badges.
- Improved mobile header, navigation, search drawer, and vehicle finder behavior.
- Expanded product pages with responsive gallery thumbnails, fitment details, shipping tabs, sticky add-to-cart, and back-in-stock capture.
- Added self-hosted storefront fonts and Shopify Theme Check tooling.

### May 11th 1:50AM PST - Trust copy update

- Reworked the homepage image-with-text section to focus on part quality, shipping speed, secure checkout, and fitment-minded support.
- <img width="639" height="418" alt="image" src="https://github.com/user-attachments/assets/4222e07a-d3fc-411f-a5a5-3f7ed7ff6bb2" />

### May 11th 1:45AM PST - Small wiring update

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
