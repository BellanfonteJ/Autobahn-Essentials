## Changelog

### May 12th

#### 12:06AM PST - Add guided My Garage vehicle options

Source: Push by slimeraps

- Replaced typed My Garage year, model, trim / engine, and chassis fields with guided dropdowns.
- Added a shared vehicle catalog so My Garage, homepage search, and fitment search use the same vehicle options.
- Added trim / engine to the fitment search forms and included trim in saved-garage fitment matching.

### May 11th

#### 11:55PM PST - Lock ticker above header

Source: Push by slimeraps

- Replaced the static announcement text with the scrolling parts ticker.
- Locked the ticker in the announcement-bar slot above the header.
- Kept the main header sticky below the ticker on desktop and mobile.

#### 11:52PM PST - Add My Garage fitment filtering

Source: Push by slimeraps

- Added collection and search controls to show only parts that fit the saved My Garage vehicle.
- Prioritized matching and universal-fit products ahead of other product cards when a garage is saved.
- Reused the product fitment badge logic so saved vehicles update card badges and filtering consistently.

#### 11:46PM PST - Pin ticker to header bottom

Source: Push by slimeraps

- Made the scrolling header ticker persistent instead of only appearing after scroll.
- Raised the ticker so it sits against the bottom edge of the compact header on desktop and mobile.

#### 11:32PM PST - Tighten header ticker position

Source: Push by slimeraps

- Moved the header ticker higher into the scrolled header area to reduce the gap above the hero.

#### 11:30PM PST - Move ticker into header

Source: Push by slimeraps

- Moved the scrolling parts ticker from the bottom of the viewport to the top header area.
- Hid the ticker into the header while the page is at the top and revealed it after scrolling.
- Rebuilt the ticker track with repeated groups so the marquee loops continuously without a blank gap.

#### 11:17PM PST - Slide mobile menu from left

Source: Pull request by BellanfonteJ, merged by slimeraps

- Changed the mobile navigation drawer to open from the left side of the screen.
- Flipped the drawer border and shadow so the mobile menu depth matches the new slide direction.

#### 11:17PM PST - Add interactive homepage spec modules

Source: Push by slimeraps

- Removed the homepage hero stat cards for OEM+, Euro, and Fast.
- Made the homepage spec modules compact by default with descriptions hidden.
- Added hover and keyboard-focus expansion so the active module grows and reveals its description while neighboring modules shift away.

#### 11:09PM PST - Separate hero texture and remove floating cart

Source: Push by slimeraps

- Stopped the homepage hero image from extending into the carbon-texture section below it.
- Removed the carbon texture overlay from the hero image fade so the top image stays clean.
- Removed the floating product add-to-cart bar and kept the static product form button under the images.

#### 11:01PM PST - Show mobile header icons

Source: Pull request by BellanfonteJ

- Adjusted the mobile header grid so the logo, menu trigger, and action icons all have room to display.
- Restored the header action icon buttons on mobile layouts.
- Tightened mobile logo and icon sizing for narrow screens down to 360px.

#### 10:59PM PST - Tidy product descriptions

Source: Push by slimeraps

- Moved the product trust module directly under the cart controls and above the description.
- Centered product description text and uploaded description images.
- Added duplicate-block cleanup for repeated product description content.

#### 10:54PM PST - Move product trust badges below description

Source: Push by slimeraps

- Added product-page handling for descriptions that start with guarantee, stock, shipping, or trust-badge content.
- Moved that leading trust cluster to the bottom of the product description so product copy appears first.
- Kept uploaded badge images centered and responsive after they move.

#### 10:48PM PST - Center product media and purchase panel

Source: Push by slimeraps

- Moved product pages to an image-first layout with the main image centered above the product details.
- Kept preview thumbnails centered directly under the main product image.
- Moved the product description below the media and paired the price with the add-to-cart action at the top of the details panel.

#### 10:40PM PST - Fix product image rendering

Source: Pull request by BellanfonteJ

- Switched product card, product gallery, cart, and cart drawer images to contained rendering so product photos no longer crop.
- Added padded media surfaces and subtle image shadows for cleaner product presentation.
- Updated product thumbnail buttons to keep preview images centered and fully visible.

#### 5:46PM PST - Smooth hero-to-carbon transition

Source: Push by slimeraps

- Extended the hero image below the hero boundary so the upper modules sit over the same visual field.
- Reduced the lower hero fade opacity to avoid a hard black cutoff.
- Lightened the spec-strip carbon layer so it blends into the hero instead of forming a dark band.

#### 5:43PM PST - Remove black bands behind hero modules

Source: Push by slimeraps

- Removed the solid black hero/spec-strip backgrounds behind the stat and trust modules.
- Softened the hero image fade so the image carries farther behind the upper modules.
- Replaced the lower module band with a transparent carbon texture layer.

#### 5:39PM PST - Add graphite texture and red edge lighting

Source: Push by slimeraps

- Reworked the default background and surface colors from flat black to layered graphite tones.
- Added subtle carbon-fiber and brushed-metal texture layers across page and section backgrounds.
- Added restrained red edge lighting, border accents, and soft active-state glows to cards, buttons, drawers, and key panels.

#### 5:30PM PST - Remove homepage vehicle finder

Source: Push by slimeraps

- Removed the redundant homepage vehicle finder section now that My Garage handles saved vehicle fitment.
- Kept the dedicated Fitment Guide page and collection/search fitment forms available for deeper searches.
- Let the homepage move from hero stats directly into the trust/spec strip for a cleaner first scroll.

#### 5:29PM PST - Clean up My Garage drawer

Source: Push by slimeraps

- Replaced repeated My Garage placeholders with clear Year, Make, Model, Trim / Engine, and Chassis fields.
- Added Trim / Engine to the saved garage data so more complete vehicle details can display and persist.
- Updated the drawer layout so the expanded vehicle form fits cleanly across desktop and mobile.

#### 5:15PM PST - Restore fallback images

Source: Push by slimeraps

- Restored the automotive fallback photos for homepage and builds sections.
- Moved fallback photos into theme assets so Shopify serves them without remote asset warnings.
- Reconnected hero, image-with-text, featured collection, promo tile, and builds page fallbacks.

#### 5:08PM PST - Mobile browsing optimization

Source: Pull request by BellanfonteJ, merged by slimeraps

- Added My Garage saved vehicle fitment with dynamic product and product-card badges.
- Improved mobile header, navigation, search drawer, and vehicle finder behavior.
- Expanded product pages with responsive gallery thumbnails, fitment details, shipping tabs, sticky add-to-cart, and back-in-stock capture.
- Added self-hosted storefront fonts and Shopify Theme Check tooling.

#### 1:50AM PST - Trust copy update

Source: Push by slimeraps

- Reworked the homepage image-with-text section to focus on part quality, shipping speed, secure checkout, and fitment-minded support.
- <img width="639" height="418" alt="image" src="https://github.com/user-attachments/assets/4222e07a-d3fc-411f-a5a5-3f7ed7ff6bb2" />

#### 1:45AM PST - Small wiring update

Source: Push by slimeraps

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
