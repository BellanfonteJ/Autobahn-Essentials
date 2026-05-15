## Changelog

### May 14th

#### 11:24PM PST - Release 5.3 hero crop fix

- Switched the new transparent hero image back to `object-fit: cover` so the artwork fills the hero area instead of letterboxing into a narrow centered band.
- Tuned the hero crop position to keep the car centered after scaling on desktop and mobile.

#### 11:10PM PST - Release 5.2 transparent hero over site background

- Replaced the homepage hero fallback with the new `AE-hero4.png` transparent hero asset.
- Removed the dark gradient overlays and SVG underlay behind the hero so the global graphite-and-orange page background shows through the transparent areas of the new image.
- Switched the hero media to `object-fit: contain` so the hero artwork keeps its full silhouette without edge cropping on desktop and mobile.

### May 13th

#### 11:18PM PST - Release 5.1 homepage collection card refresh

- Moved the homepage promo tile module below the Trusted By Enthusiasts module.
- Restyled Shop By Brand and Shop By Category cards to match the darker image-led promo tile treatment.
- Removed the large vertical spacing between the two shop modules.

#### 10:33PM PST - Release 5.0 hero typewriter sequence

- Updated the homepage hero headline to cycle through Built For Performance, Built For Drivers, and Backed By Passion.
- Slowed the typewriter timing, added finite period blinks between phrases, and stopped on the final Passion headline.

#### 5:18PM PST - Update Contacts dropdown links

- Reduced the Contacts dropdown to Contact Us and Returns.
- Routed Returns to the existing shipping and returns page when available, with a `/pages/returns` fallback.

#### 5:07PM PST - Add Contacts dropdown menu

- Added a Contacts header dropdown with Contact Us, About Us, and Support links.
- Reused the existing dark dropdown styling with desktop hover/focus and mobile tap-to-expand behavior.

#### 4:27PM PST - Fix Shop Pay accelerated checkout button

- Fixed Shop Pay accelerated checkout button overlap and removed unwanted white Visa box on product pages.

#### 4:09PM PST - Fix Shop Pay button layout

- Kept the product page accelerated checkout button full-width and centered across responsive layouts.
- Constrained Shopify's branded wallet iframe/layout so Shop Pay and saved-card labels do not overlap.
- Removed white card-logo backgrounds inside the branded Shop Pay button where Shopify exposes the wallet markup.

#### 1:25AM PST - Resize header cart icon

- Added explicit desktop sizing for header icon SVGs so the cart icon stays proportional inside its button.
- Made the cart icon slightly smaller than the shared header action icons for a cleaner header balance.

#### 12:52AM PST - Fix VW brand tile image reference

- Pointed the homepage Volkswagen brand tile at the new red VW GTI asset instead of the old blue VW image.
- Updated the Shop By Brand Volkswagen fallback image to use the same red VW asset.

#### 12:34AM PST - Release 4.7 smooth orange glow

- Replaced the blocky angled orange glow with softer radial background blooms.
- Kept the warmer orange page tone while removing the visible rectangular edge.

#### 12:23AM PST - Release 4.6 orange glow and brand crops

- Restored a stronger visible orange background glow across the main page surface.
- Recentered the Shop By Brand card crops so the cars sit better inside the image frames.

#### 12:17AM PST - Release 4.5 homepage image refresh

- Replaced the homepage hero fallback with the orange Lamborghini parking-lot image.
- Updated the Shop By Brand cards with new local Audi, BMW, and Volkswagen image assets.
- Updated the Exterior Styling category card with the requested headlight close-up image.
- Made explicit theme asset filenames take priority over Shopify collection featured images.

### May 12th

#### 11:49PM PST - Release 4.4 homepage image refresh

- Replaced the homepage hero fallback with the dark BMW headlights photo.
- Updated the Interior Accessories category card to use the BMW steering-wheel interior photo.
- Added both requested Unsplash-sourced images as local theme assets.

#### 11:27PM PST - Restore orange page glow

- Restored the warmer AE-orange page glow as a gradient layer over the satin graphite background.
- Kept the carbon texture removed while bringing back the stronger orange wash from the previous background treatment.

#### 11:18PM PST - Release 4.3 satin graphite refresh

- Replaced the carbon-style texture system with a satin graphite and subtle noise treatment across the page, panels, header, drawers, and spec modules.
- Reduced the global AE-orange background wash so orange reads as a focused glow around key brand moments instead of a full-page tint.
- Kept the original hero image and shifted its focal position upward so the BMW sits better in the homepage crop.

#### 11:05PM PST - Release 4.2 from 4.0 merge

- Merged the `4.0` collection-card hover image coverage fix back onto the `3.9` rollback line.
- Restored the Brand CTA module to a 100% opacity AE-orange background.
- Added an orange glow around the Brand CTA while leaving the Shop Now button styling unchanged.

#### 10:09PM PST - Fix expanded collection card image coverage

- Made featured collection card images cover the full tile on desktop so expanded hover states no longer expose empty card edges.
- Added extra image scale and a subtle hover pan to keep the crop filled while cards expand.

#### 10:04PM PST - Add expanding collection card hover

- Matched the Shop By Brand and Shop By Category card rows to the promo tile hover behavior with expanding active cards and wider surrounding spacing.
- Changed featured collection card info bars to slide up on hover or keyboard focus before revealing View collection.

#### 9:55PM PST - Add scrolling gradient page background

- Reworked the global page background into fixed gradient layers so transparent modules float over a consistent backdrop while scrolling.
- Kept the carbon texture in the background stack for the existing Autobahn visual feel.

#### 9:52PM PST - Remove module background opacity

- Set outer section, spec strip, brand CTA, and social section backgrounds to transparent so modules float over the page texture.
- Removed the social section band borders while keeping card and tile surfaces intact.

#### 9:46PM PST - Fix brand card image fallback

- Made Shop By Brand infer Audi, BMW, and Volkswagen theme images from card titles before using generic collection placeholders.
- Preserved collection and manual fallback image overrides for future Shopify wiring.

#### 9:42PM PST - Add homepage brand cards

- Added a new Shop By Brand card section above Shop By Category with Audi, BMW, and Volkswagen cards.
- Added local sport-model brand imagery for the new cards and matching product-search fallback links.
- Removed the orange eyebrow line from the homepage brand and category card sections.

#### 9:37PM PST - Add category card fallback links

- Added per-card fallback links for homepage category cards when Shopify collections are not assigned yet.
- Routed Engine Performance, Turbo Upgrades, Exterior Styling, and Interior Accessories to matching product search pages instead of `/collections/all`.
- Kept assigned Shopify collections as the primary destination once they are wired in.

#### 4:45PM PST - Add expanding promo tile hover

- Matched the homepage promo tile interaction to the spec strip behavior.
- Hid promo tile descriptions until desktop hover or keyboard focus, then expanded the active tile and widened spacing around it.

#### 4:34PM PST - Slow scroll reveal easing

- Slowed the scroll reveal timing and increased the entry offset.
- Updated the reveal curve so content ramps in and eases more gently as it settles.

#### 4:30PM PST - Add scroll reveal animations

- Added one-time scroll reveal animations for sections, cards, promo tiles, product cards, and supporting content.
- Revealed items stay visible after passing them and respect reduced-motion preferences.
- Keep tag `3.2` as the rollback point before this animation change.

#### 4:25PM PST - Update homepage CTA copy

- Changed the homepage brand CTA heading from "Upgrade Your Build Today." to "Grab Your Essentials."
- Updated the Brand CTA section default to match the homepage copy.

#### 4:18PM PST - Update category card imagery

- Replaced the Engine Performance card image with an Audi performance engine bay.
- Replaced the Turbo Upgrades card image with a close-up turbocharger shot.
- Replaced the Interior Accessories card image with a BMW red-leather interior while leaving the Exterior Styling image unchanged.

#### 4:02PM PST - Add VW product export tags

- Added `VW` and `Volkswagen` tags to 35 clear Volkswagen product handles in `products_export_1.csv`.
- Verified all detected VW product candidates have VW collection tags so `/collections/vw` can pick them up after the product export is imported.
- Created a backup export before changing the CSV.

#### 2:45PM PST - Add Builds header navigation

Source: Push by slimeraps

- Added Builds to the header navigation.
- Updated the header navigation order to Home, Shop, Builds, Contacts.

#### 12:48PM PST - Fix mobile header and hero layout

Source: Pull request by BellanfonteJ

- Centered the mobile header logo independently from uneven header controls.
- Improved mobile hero image positioning, height, and overlay readability.

#### 12:28PM PST - Add fullscreen product gallery

Source: Pull request by BellanfonteJ

- Added a click-to-open fullscreen product image gallery with previous and next controls.
- Added image count, keyboard navigation, Escape close, and swipe support.
- Preserved the existing product magnifier, cursor dot, thumbnails, and page layout.

#### 12:02PM PST - Add product image cursor dot

Source: Pull request by BellanfonteJ

- Replaced the default desktop cursor over product images with a small white custom cursor dot.
- Preserved the existing product image magnifier behavior while sharing the same hover tracking.

#### 11:47AM PST - Fix desktop hero typewriter overflow

Source: Pull request by BellanfonteJ

- Removed the desktop width cap from the animated hero typewriter line.
- Added a small reveal buffer so the italic Performance line and pulsing period are not clipped.

#### 11:39AM PST - Fix hero typewriter clipping

Source: Pull request by BellanfonteJ

- Switched the hero slogan typewriter reveal from width animation to clip-path masking.
- Prevented the Performance line from clipping before the full word finishes typing.

#### 11:31AM PST - Add hero slogan typewriter

Source: Pull request by BellanfonteJ

- Added a one-time typewriter animation for the homepage hero slogan.
- Added a subtle pulsing final period after the slogan finishes typing.
- Preserved the hero layout and added reduced-motion fallbacks.

#### 11:17AM PST - Update header nav order

Source: Pull request by BellanfonteJ

- Updated the header navigation order to Home, Shop, Contacts.
- Renamed the header Contact label to Contacts while preserving the existing destination URL.

#### 11:03AM PST - Add product image hover scale

Source: Pull request by BellanfonteJ

- Added a subtle desktop-only hover scale to product gallery images.
- Kept product images steady on touch devices and reduced-motion setups.

#### 10:51AM PST - Remove product image zoom cursor

Source: Pull request by BellanfonteJ

- Removed the browser zoom cursor from product gallery images.
- Let custom gallery hover effects control the product image interaction state without competing cursor styles.

#### 10:37AM PST - Add product gallery hover magnifier

Source: Pull request by BellanfonteJ

- Added a desktop hover magnifier lens to product gallery images.
- Kept the magnifier aligned to the rendered image area so contained product photos zoom accurately.
- Disabled the magnifier on touch and smaller screens where hover zoom would get in the way.

#### 10:21AM PST - Add product image magnifier cursor

Source: Pull request by BellanfonteJ

- Added a zoom-style cursor affordance to desktop product gallery images.
- Made product photos feel interactive before the full hover magnifier behavior was added.

#### 1:18AM PST - Tune header action visibility by page

- Kept Cart, My Garage, and Search visible on the homepage header.
- Kept only Cart visible by default on product pages.
- Revealed Search and My Garage on product pages when the header is hovered or focused.

#### 1:12AM PST - Extend homepage hero fade

- Extended the homepage hero image lower behind the first carbon-texture section.
- Added a layered fade so the car image blends into the graphite carbon background instead of ending at a hard horizontal cutoff.
- Let the spec-strip modules sit over the blended transition while preserving the carbon texture below.

#### 1:03AM PST - Update shop dropdown navigation

Source: Pull request by BellanfonteJ

- Replaced the shop dropdown category links with BMW, Audi, VW, and Accessories collection links.
- Hid duplicate top-level BMW, Audi, and VW menu links when the shop dropdown is present.
- Improved desktop dropdown behavior so hover and keyboard focus open the menu reliably.

#### 12:51AM PST - Prune My Garage options to sold fitments

- Removed unsupported My Garage makes that are not represented in the product export.
- Pruned the vehicle catalog to BMW, Audi, and Volkswagen model/chassis families with parts in the current product list.
- Kept fitment aliases aligned with the remaining sold platforms so garage filtering and product search stay consistent.

#### 12:31AM PST - Strengthen My Garage product fitment matching

- Expanded the My Garage vehicle catalog with BMW, Audi, and Volkswagen platforms found in the product export.
- Added chassis, platform-family, and engine aliases so product titles and descriptions like F3X, F8X, G2X, N63TU3, S58, and 2.0T match saved garage vehicles more reliably.
- Added product descriptions and SEO descriptions to product-card fitment text so collection, search, and badge matching can use the same fitment language already present in the product list.

#### 12:20AM PST - Fix mobile header and home nav visibility

Source: Pull request by BellanfonteJ

- Restored homepage navigation visibility in the header.
- Rebalanced the mobile header grid so the menu trigger, centered logo, and action icons fit cleanly.
- Tightened small-screen logo and icon sizing to keep header controls visible on narrow devices.

#### 12:06AM PST - Add guided My Garage vehicle options

- Replaced typed My Garage year, model, trim / engine, and chassis fields with guided dropdowns.
- Added a shared vehicle catalog so My Garage, homepage search, and fitment search use the same vehicle options.
- Added trim / engine to the fitment search forms and included trim in saved-garage fitment matching.

### May 11th

#### 11:55PM PST - Lock ticker above header

- Replaced the static announcement text with the scrolling parts ticker.
- Locked the ticker in the announcement-bar slot above the header.
- Kept the main header sticky below the ticker on desktop and mobile.

#### 11:52PM PST - Add My Garage fitment filtering

- Added collection and search controls to show only parts that fit the saved My Garage vehicle.
- Prioritized matching and universal-fit products ahead of other product cards when a garage is saved.
- Reused the product fitment badge logic so saved vehicles update card badges and filtering consistently.

#### 11:46PM PST - Pin ticker to header bottom

- Made the scrolling header ticker persistent instead of only appearing after scroll.
- Raised the ticker so it sits against the bottom edge of the compact header on desktop and mobile.

#### 11:32PM PST - Tighten header ticker position

- Moved the header ticker higher into the scrolled header area to reduce the gap above the hero.

#### 11:30PM PST - Move ticker into header

- Moved the scrolling parts ticker from the bottom of the viewport to the top header area.
- Hid the ticker into the header while the page is at the top and revealed it after scrolling.
- Rebuilt the ticker track with repeated groups so the marquee loops continuously without a blank gap.

#### 11:17PM PST - Slide mobile menu from left

- Changed the mobile navigation drawer to open from the left side of the screen.
- Flipped the drawer border and shadow so the mobile menu depth matches the new slide direction.

#### 11:17PM PST - Add interactive homepage spec modules

- Removed the homepage hero stat cards for OEM+, Euro, and Fast.
- Made the homepage spec modules compact by default with descriptions hidden.
- Added hover and keyboard-focus expansion so the active module grows and reveals its description while neighboring modules shift away.

#### 11:09PM PST - Separate hero texture and remove floating cart

- Stopped the homepage hero image from extending into the carbon-texture section below it.
- Removed the carbon texture overlay from the hero image fade so the top image stays clean.
- Removed the floating product add-to-cart bar and kept the static product form button under the images.

#### 11:01PM PST - Show mobile header icons

- Adjusted the mobile header grid so the logo, menu trigger, and action icons all have room to display.
- Restored the header action icon buttons on mobile layouts.
- Tightened mobile logo and icon sizing for narrow screens down to 360px.

#### 10:59PM PST - Tidy product descriptions

- Moved the product trust module directly under the cart controls and above the description.
- Centered product description text and uploaded description images.
- Added duplicate-block cleanup for repeated product description content.

#### 10:54PM PST - Move product trust badges below description

- Added product-page handling for descriptions that start with guarantee, stock, shipping, or trust-badge content.
- Moved that leading trust cluster to the bottom of the product description so product copy appears first.
- Kept uploaded badge images centered and responsive after they move.

#### 10:48PM PST - Center product media and purchase panel

- Moved product pages to an image-first layout with the main image centered above the product details.
- Kept preview thumbnails centered directly under the main product image.
- Moved the product description below the media and paired the price with the add-to-cart action at the top of the details panel.

#### 10:40PM PST - Fix product image rendering

- Switched product card, product gallery, cart, and cart drawer images to contained rendering so product photos no longer crop.
- Added padded media surfaces and subtle image shadows for cleaner product presentation.
- Updated product thumbnail buttons to keep preview images centered and fully visible.

#### 5:46PM PST - Smooth hero-to-carbon transition

- Extended the hero image below the hero boundary so the upper modules sit over the same visual field.
- Reduced the lower hero fade opacity to avoid a hard black cutoff.
- Lightened the spec-strip carbon layer so it blends into the hero instead of forming a dark band.

#### 5:43PM PST - Remove black bands behind hero modules

- Removed the solid black hero/spec-strip backgrounds behind the stat and trust modules.
- Softened the hero image fade so the image carries farther behind the upper modules.
- Replaced the lower module band with a transparent carbon texture layer.

#### 5:39PM PST - Add graphite texture and red edge lighting

- Reworked the default background and surface colors from flat black to layered graphite tones.
- Added subtle carbon-fiber and brushed-metal texture layers across page and section backgrounds.
- Added restrained red edge lighting, border accents, and soft active-state glows to cards, buttons, drawers, and key panels.

#### 5:30PM PST - Remove homepage vehicle finder

- Removed the redundant homepage vehicle finder section now that My Garage handles saved vehicle fitment.
- Kept the dedicated Fitment Guide page and collection/search fitment forms available for deeper searches.
- Let the homepage move from hero stats directly into the trust/spec strip for a cleaner first scroll.

#### 5:29PM PST - Clean up My Garage drawer

- Replaced repeated My Garage placeholders with clear Year, Make, Model, Trim / Engine, and Chassis fields.
- Added Trim / Engine to the saved garage data so more complete vehicle details can display and persist.
- Updated the drawer layout so the expanded vehicle form fits cleanly across desktop and mobile.

#### 5:15PM PST - Restore fallback images

- Restored the automotive fallback photos for homepage and builds sections.
- Moved fallback photos into theme assets so Shopify serves them without remote asset warnings.
- Reconnected hero, image-with-text, featured collection, promo tile, and builds page fallbacks.

#### 5:08PM PST - Mobile browsing optimization

- Added My Garage saved vehicle fitment with dynamic product and product-card badges.
- Improved mobile header, navigation, search drawer, and vehicle finder behavior.
- Expanded product pages with responsive gallery thumbnails, fitment details, shipping tabs, sticky add-to-cart, and back-in-stock capture.
- Added self-hosted storefront fonts and Shopify Theme Check tooling.

#### 1:50AM PST - Trust copy update

- Reworked the homepage image-with-text section to focus on part quality, shipping speed, secure checkout, and fitment-minded support.
- <img width="639" height="418" alt="image" src="https://github.com/user-attachments/assets/4222e07a-d3fc-411f-a5a5-3f7ed7ff6bb2" />

#### 1:45AM PST - Small wiring update

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
