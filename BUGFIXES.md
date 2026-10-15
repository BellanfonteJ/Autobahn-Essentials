# Theme Bug Fixes

The initial fixes were based on `origin/main` at `5ddc954` and merged through PR #47. Motion and close-icon follow-ups were merged through PR #48; the CSV-backed garage was merged through PR #49. Collection, footer and Builds follow-ups are on `codex/theme-bug-fixes`, based on `origin/main` at `5c2575b`. Shopify's live GitHub connection targets the separate `BellanfonteJ` repository; see [RELEASE-READINESS.md](RELEASE-READINESS.md).

## Fixed

- Gallery magnifiers are clamped inside the image frame, with border-aware pixel alignment even when the lens stops at an edge.
- Populated cart pages and drawers wrap long product/option names and totals on narrow screens; thumbnails keep a stable 92px square size instead of inheriting a stretched HTML height.
- Newsletter timers wait for Search and My Garage drawers, preserving ongoing keyboard focus until those controls close.
- Fallback Builds/blog/contact links retain locale prefixes, and cart API routes work whether the root has a trailing slash or not.
- Changing a product variant updates its exact price, sale price, SKU, stock status, image, URL, purchase buttons, and restock request.
- Products requiring variant selection link to Choose options instead of adding the first variant automatically.
- The product gallery includes every image instead of stopping at five.
- Failed cart requests show actionable feedback. A successful add with a failed refresh is reported without retrying the add.
- Cart requests run in order, quantity controls cannot send overlapping updates, and rejected quantities revert to the confirmed cart.
- Cart prices use the returned currency and requests use the store's locale route.
- Cart product names, cart notes, search terms, breadcrumbs, and variant JSON are escaped for their output contexts.
- Cart and gallery dialogs trap keyboard focus, support Escape, restore focus on close, and are inert when closed.
- The mobile menu supports keyboard navigation. Search and garage interactions keep the sticky header visible.
- Header navigation is discoverable on every template. The logo and controls no longer overlap on narrow screens.
- The header offset follows the ticker setting, including when the ticker is disabled.
- Saved vehicles update every finder, dependent selectors reset correctly, and preferences still work when storage is unavailable.
- Fitment matching uses explicit per-product model/chassis/engine/submodel rows instead of keywords. Missing and restricted data are clearly labeled; model-year ranges are unavailable and never claimed as verified.
- Match-only collection/search views include later product pages, preserve locale/tags/sorting, and restore unfiltered browsing with Retry on incomplete or failed page loads.
- Vehicle searches no longer combine every vehicle alias as required search words.
- Contact and returns navigation use the theme's page destinations.
- Newsletter, contact and restock forms expose submission feedback and accessible labels.
- Newsletter email validation is enabled and its errors can reopen the popup. The popup waits for other dialogs to close.
- The hero respects editor headings, fits narrow screens, and has readable content without JavaScript.
- Mobile navigation and cart links remain usable without JavaScript.
- Product-description content stays in its authored order instead of being removed or moved using broad keyword guesses.
- Button icons have stable dimensions.
- Newsletter, cart, and gallery close buttons render a single X rather than duplicate icons.
- Fixed-width product-description videos and fitment tables no longer widen the mobile gallery and purchase panel. Product-card glow stays inside mobile cards.
- Responsive hero WebP assets are approximately 30 KB, 75 KB and 193 KB, replacing the 15.6 MB fallback download.

## Verification

All 103 checks pass: 80 browser regressions, nine accessibility audits, seven CSV-import/source-review checks, three catalog audits, three performance budgets and one release-workflow check. Shopify Theme Check reports no errors or warnings. Desktop and mobile fixture screenshots were inspected, including garage, Builds and product pages at 320, 390, 768, 1024 and 1440 pixels. Legacy supplier description coverage checks badge visibility, responsive video wrappers, retained fitment warnings, full-width aligned fitment guides and no-JavaScript rendering. The product-information row also has 320-1920px coverage for full-width positioning, accordion interaction and relocated SKU updates. Alternate card images share the primary image's bounded grid cell; hover framing, transition reset and stable dimensions are covered on collection, search and related cards with normal/reduced motion. Audit follow-ups cover gallery edges/pixel alignment, populated-cart bounds and thumbnail sizing, drawer interruption timing and locale-safe routes.

```sh
pnpm install --frozen-lockfile
pnpm theme:check
pnpm test
pnpm theme:package
```

Browser tests render the actual Liquid files using LiquidJS with representative Shopify data and mocked cart responses. They cover desktop and mobile widths from 320 to 1440 pixels, JavaScript-disabled navigation, failed requests, focus behavior, and escaping.

The tests use installed Google Chrome on macOS or Playwright Chromium elsewhere, plus Python 3 for CSV import checks. Run `pnpm exec playwright install chromium` if neither browser is available. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` or `PYTHON_EXECUTABLE` to select compatible runtime binaries. Set `THEME_SCREENSHOTS=1` to capture viewport screenshots under `.tools/screenshots/`.

## Shopify Preview

```sh
pnpm theme:dev --store autobahnessentials.myshopify.com --theme 167398703161 --ignore 'assets/*.png' --nodelete
```

Authenticated store access is authorized. The fixes are uploaded to the separate unpublished theme **Autobahn Essentials - Bug Fix Preview** (167398703161). The published theme 161641988153 remains unchanged. The current live theme was downloaded into an isolated snapshot before uploading; its settings and additional assets were preserved. PNG assets were uploaded in small batches after intermittent secure-connection failures. The command above skips unchanged PNG uploads but hot-reloads code edits.

- Local preview: http://127.0.0.1:9292
- Shopify preview: https://autobahnessentials.myshopify.com/?preview_theme_id=167398703161
- Theme editor: https://admin.shopify.com/store/autobahnessentials/themes/167398703161/editor

Open this repository folder in VS Code. Saving theme CSS, JavaScript, Liquid, or JSON files updates the running local preview. Restart the command above when the preview server is no longer running. This targets only the unpublished preview, not the live theme.

Store-level checks verified real catalog rendering, variant price/URL/SKU updates, all gallery images and navigation, adding a product, cart quantity/subtotal updates, removal, mobile navigation, and the contact page. The temporary test cart was restored to empty. Instagram, chat, and product trust-badge widgets were present; their full workflows were not tested. No order or customer-email form was submitted.

## Store Content Follow-Up

- Legacy Search-only footer menus now receive distinct existing Shop, Support and Company links. Custom menus remain untouched. Actual menu assignment remains a merchant setup task.
- The empty generic Builds page now receives the complete Builds experience in the unpublished preview. Assign `page.builds` in Shopify for editor-configurable media and source settings after checking the live template impact.
- The read-only [catalog audit](CATALOG-REVIEW.md) identified five description candidates. The reviewed duplicate profile-through-warranty block on `135i-5-intercooler-fmic` was backed up and removed in Shopify Admin; one profile and one fitment table were verified in the preview. Other candidates need individual review. Product content changes are store-wide, unlike theme preview edits.

Hosted draft-theme checkout now loads, reports required buyer fields and rejects an invalid discount. Its payment controls render, but no successful or declined transaction has been tested. The earlier localhost redirect failure is not evidence of a production checkout failure. The test item was removed and the original empty cart restored. Shipping/taxes for an approved address, email delivery, fulfillment/refunds, complete installed-app workflows and page/template assignments remain open. Admin showed Shopify Payments accepting payments, inactive PayPal and free US economy shipping; PayPal also renders in checkout, so its actual activation/transaction status needs owner verification. No payment, shipping, account or notification setting was changed. Exact model-year compatibility remains unverified because no supplier year file is available. Restock requests remain contact requests and require a store workflow for notifications.

## CSV-Backed Garage

The October 14 import includes 187 published products, with 258 explicit configurations across 130 products. Three unpublished drafts are excluded. The 57 products without usable rows remain unknown; 95 products have missing/ambiguous table data or description restrictions requiring review. See [FITMENT-IMPORT.md](FITMENT-IMPORT.md).

The shared selector requires a complete listed model and engine, with chassis/submodel where supplied. Changing Make no longer clears Year, and Chassis is selected before Engine. Saves update every finder and survive reloads; clearing removes shared preferences. Cross-tab changes update the UI. Blocked storage is reported as page-only, and finder URLs can carry validated vehicle preferences.

Badges distinguish listed, restricted, not-listed, unknown, and incomplete selections without claiming guaranteed compatibility. Years are optional because the export lacks year ranges. No fitment is inferred from titles, and alternative engines are only expanded when both explicit engine codes are present.

Collection and search page loading is bounded, cancellable, deduplicated by handle, and atomic. Failures, invalid responses, excessive page counts, or interrupted filters cannot silently hide ordinary results or apply stale selections. New cards retain delegated purchase handlers and existing motion behavior.

The source export stays outside Git. The generated asset contains only public handles, configurations, review flags, provenance counts/hash and approved public-source review metadata, not commercial CSV columns. Refresh it with `python3 scripts/import-fitment.py /path/to/products_export.csv`. The garage implementation itself did not edit product descriptions, prices, inventory or live theme settings; separate store-wide content/filter maintenance is recorded above and below.

Manufacturer reviews in `data/fitment-source-reviews.json` must match the current imported configurations and the primary variant SKU exactly. Invalid/stale sources preserve rows and leave the product flagged for review. The first reviewed product, `135i-5-intercooler-fmic`, has 14 source-confirmed model/engine rows and a customer-visible manufacturer link dated October 14, 2026. Model years and physical installation remain unverified. Tests reject unsafe URLs, invented year fields, mismatched SKUs and changed rows.

Changes are maintained on `codex/theme-bug-fixes`, separate from `main`. They have not been published as the live Shopify theme.

## Collection Modernization

Native configured collection filters now render in a desktop sidebar or mobile drawer. Repeated selections, active filters, zero-priced bounds, zero-count active options, locale/tagged paths, sort state, and pagination resets are covered by tests. Mobile filters reuse the theme's focus trapping, Escape handling, and focus restoration; desktop resizing removes modal state. Empty filter catalogs do not display nonfunctional controls, and no-JavaScript browsing remains usable.

Product cards use consistent light image surfaces, full readable titles, quieter badges, aligned purchase controls, and correct minimum starting prices. Sold-out status outranks promotional badges, and multi-variant products still require choosing options.

The persistent vehicle bar updates from the existing garage state, retains year warnings, and offers Change/Clear controls. It follows real rendered header/ticker geometry rather than assuming fixed header heights.

Real-store checks verified the mobile Availability/Price drawer, desktop sidebar, price filtering, and combined garage matching across filtered pages. After the owner made Search & Discovery accessible, Brand and Part Type were enabled as store-wide settings. Both ARM vendor aliases are natively grouped under ARM Motorsports; raw Vendor fields and collection rules are untouched. Cards and product specs use the canonical display label. The hosted desktop/mobile preview verified ARM plus Intercoolers returning 17 products; grouped filter IDs survive sorting in regression tests. Browsing code changes have not been published to the live theme.

## Enterprise First Stage

Long product descriptions now sit in a dedicated full-width section below the gallery/purchase area, not in the narrow purchase column. Original text, images, video, fitment tables, restrictions and ordering remain unchanged. Heading/paragraph spacing and media/table bounds are checked at 320-1440px; an absent description creates no empty section.

Product purchasing now sits beside the gallery on desktop and remains stacked on mobile. Direct support/policy links, typed verified specifications/shipping notes, HTTPS installation guides and Shopify review-app blocks are supported without invented content. Original descriptions and gallery/variant behavior remain. Stock-update requests include initial/changed variant/SKU identity and acknowledge a support request, not an automatic restock alert.

New accessibility checks exposed and fixed primary-button contrast and the visually hidden mobile sort label; product-card alt text is explicit. First-party transfer budgets run in the suite. Full-resolution lightbox media waits until opening, and product styles only load on product templates.

Local health counts are bounded, document-only and contain no private payloads or external transmission. Nondeploying/read-only CI and a release checklist are prepared, not yet running remotely. Native historical measurements, owner secure-sign-in enforcement, app access and open development advisories are recorded in [QUALITY-AUDIT.md](QUALITY-AUDIT.md), [SECURITY.md](SECURITY.md) and [OPERATIONS.md](OPERATIONS.md). Store-wide security/monitoring activation and content setup are not complete.

## Motion Additions

Upcoming cards and section headings have short, one-time entrances with staggered timing. Search, garage, gallery and newsletter panels have opening motion; cart-count feedback only runs when a confirmed count changes. Button icons have a small fine-pointer hover response.

Content is visible by default. Above-the-fold content, product galleries, descriptions, prices, and purchase forms do not receive scroll entrances. Keyboard focus cancels a card entrance. Reduced-motion preferences suppress the new effects, including preference changes while the page is open. Theme-editor section load/unload events register and release observer targets.

Normal-motion tests cover 320, 390, 768, 1024 and 1440 pixel widths, unchanged card dimensions, hover behavior, cart quantity/removal, keyboard focus, observer/JavaScript fallbacks and theme-editor events. Card-glow bleed is bounded to prevent horizontal overflow at intermediate widths. Motion changes and the single-close-icon fix are maintained on `codex/theme-bug-fixes` and synced to the unpublished preview; they have not been published as the live theme.
