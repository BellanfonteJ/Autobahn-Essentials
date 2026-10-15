# Autobahn Essentials

Custom Shopify Online Store 2.0 theme for European automotive performance parts. Shopify renders the Liquid templates directly; no frontend build step is required.

## Local Development

Open this repository folder in VS Code. With Node.js and pnpm installed, run:

```sh
pnpm install --frozen-lockfile
pnpm theme:dev --store autobahnessentials.myshopify.com --theme 167398703161 --ignore 'assets/*.png' --nodelete
```

Complete Shopify's browser sign-in with an account that has Themes permission. The command targets unpublished theme **167398703161**, currently named **Autobahn Essentials - Final Version 2026**, not the live theme.

Open [http://127.0.0.1:9292](http://127.0.0.1:9292) in a browser, or use VS Code's **Browser: Open Integrated Browser** command and enter that URL. Older VS Code versions may provide **Simple Browser: Show** instead. Saving theme code updates the preview while the development server runs. Restart the command after closing the server; stop it with Ctrl+C.

The PNG exclusion avoids re-uploading unchanged large images after intermittent connection failures. It does not synchronize new or edited PNG files. Upload those explicitly to the unpublished theme with `pnpm shopify theme push --store autobahnessentials.myshopify.com --theme 167398703161 --only assets/FILE.png --nodelete`.

- [Shopify preview](https://autobahnessentials.myshopify.com/?preview_theme_id=167398703161)
- [Preview theme editor](https://admin.shopify.com/store/autobahnessentials/themes/167398703161/editor)

The development command does not publish the live theme. However, pushes to a Shopify-connected branch update its linked theme automatically, including a live theme. Review existing merchant settings and the connected repository before any merge, reset, reconnection or full theme upload.

## GitHub and VS Code Sync

The latest merged theme code and README are available on [slimeraps/Autobahn-Essentials/main](https://github.com/slimeraps/Autobahn-Essentials/tree/main), including the earlier October 15 update below. The newer SEO and multi-car garage changes are included in the [codex/seo-foundations branch push](https://github.com/slimeraps/Autobahn-Essentials/tree/codex/seo-foundations) and unpublished preview, not merged into main. The initial garage work was merged through PR #49, collection/footer/Builds modernization through PR #50, and the earlier motion and close-icon fixes through PR #48. Updating this repository does not publish the live Shopify theme; its separate connection is documented below.

### October 15 Review Status

The multi-car garage follow-up adds a saved-vehicle list, one active car for fitment, add/edit/remove controls, duplicate prevention, legacy migration and cross-tab synchronization. Clear selection keeps saved cars. All 123 checks pass, including 12 new multi-car browser groups and an additional accessibility audit. This remains browser-local, not customer-account or cross-device storage. See [GARAGE.md](GARAGE.md) for behavior, storage format and verification.

The subsequent SEO follow-up is included in the `codex/seo-foundations` branch push and unpublished preview, not merged into main or published live. It adds native product/article schema, homepage identity and breadcrumb schema, complete social cards, missing-description/homepage-title fallbacks and utility-page indexing rules while preserving merchant SEO fields, canonical pagination and Shopify output. See [SEO.md](SEO.md) for the public audit, Google setup checks and draft collection/product copy.

The October 15 main-branch update includes the enterprise, description, fitment-guide, product-page spacing and hover-image fixes, followed by a storefront bug sweep. The sweep fixes clipped gallery magnifiers, narrow-screen cart overflow/stretched thumbnails, newsletter interruptions during Search/My Garage use, and locale-dropping navigation/cart requests. All 103 local checks, Shopify Theme Check and packaging pass. The code and this README are synchronized to `slimeraps/Autobahn-Essentials/main`; the separate `BellanfonteJ` repository and live Shopify theme remain unchanged. See [QUALITY-AUDIT.md](QUALITY-AUDIT.md) for reproduced issues, coverage and limits.

### October 14 Review Status

The earlier theme modernization was pushed in [commit `576c3ae`](https://github.com/slimeraps/Autobahn-Essentials/commit/576c3ae) and subsequently merged through PR #50. [Review the newest branch changes against main](https://github.com/slimeraps/Autobahn-Essentials/compare/main...codex/theme-bug-fixes). The latest review-branch batch includes enterprise-readiness items 1-7, full-width description cleanup and the responsive fitment guide. Verification passed all 95 tests, Shopify Theme Check and theme packaging.

The earlier draft-PR creation attempt was denied by the GitHub integration; PR #50 was later merged separately. This latest update pushes the working branch only and does not create a new PR, merge into main or publish a live theme. Outstanding catalog, fitment and checkout/email checks are tracked in [RELEASE-READINESS.md](RELEASE-READINESS.md).

**Release warning:** Shopify Admin currently links the live theme to [BellanfonteJ/Autobahn-Essentials/main](https://github.com/BellanfonteJ/Autobahn-Essentials/tree/main), not the `slimeraps` repository used by this checkout. A read-only live layout download did not contain the garage scripts. The connection and reset controls were not changed. Do not merge into the connected repository or reset its theme without reviewing the complete diff and authorizing the resulting live update. See [RELEASE-READINESS.md](RELEASE-READINESS.md).

For the latest SEO and multi-car garage changes in an existing checkout, preserve or commit any local work before switching branches, then run:

```sh
git fetch origin
git switch codex/seo-foundations
git pull --ff-only origin codex/seo-foundations
```

Open that checkout in VS Code and start the Local Development command above. Git pulls update your files; the running Shopify development server updates the unpublished preview when those files change. The original product CSV is not committed; the generated fitment catalog, importer, and review report are included.

## Verification

```sh
pnpm theme:check
pnpm test
pnpm theme:package
```

The current suite has 123 checks: 80 storefront browser regressions, 12 multi-car garage groups, seven SEO browser groups, ten accessibility audits, seven CSV-import/source-review checks, three catalog audits, three performance budgets and one release-workflow check. Shopify Theme Check reports no errors or warnings. Browser tests render the real Liquid source with representative Shopify data and mocked cart/section responses. They cover variants, cart failures and quantities, keyboard focus, escaping, structured garage matching, pagination failures, responsive layouts, normal/reduced motion, theme-editor section reloads, footer fallbacks, Builds content, single close icons, canonical brand labels, source links, grouped Brand filter IDs and SEO metadata/schema. Python checks require Python 3; set `PYTHON_EXECUTABLE` to select another installation.

Tests use installed Google Chrome on macOS or Playwright Chromium. If neither is available, run `pnpm exec playwright install chromium`. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` for another compatible Chromium installation. Set `THEME_SCREENSHOTS=1` to capture test screenshots in the ignored `.tools/screenshots/` folder.

Real-store preview checks verified product variants, cart add/update/remove, gallery navigation, mobile layout, contact navigation, combined native/garage filters, the Builds page and distinct footer links. Hosted draft-theme checkout loads, reports missing required buyer fields and rejects an invalid discount code. The earlier localhost redirect failure does not establish a production checkout failure. Shipping/taxes for an approved address, payment transactions, email delivery and complete installed-app workflows remain unverified. No order was placed; the test item was removed and the original empty cart restored. See [BUGFIXES.md](BUGFIXES.md) and [RELEASE-READINESS.md](RELEASE-READINESS.md) for remaining work. Garage matching is a browsing aid, not a compatibility guarantee.

## Enterprise Readiness: Items 4-7

The enterprise first-stage update is included in the GitHub review branch and synchronized to the unpublished preview, not published live:

- **Product pages:** Desktop photography/purchasing sit side by side, with stacked mobile reading order, existing support/policy links, typed verified-specification/shipping-note fields, HTTPS guides and real review-app block support. Removed generic build-style and unsubstantiated default performance-tested/fast-shipping messages; merchant-supplied settings/content remain. See [PRODUCT-CONTENT.md](PRODUCT-CONTENT.md) for setup and remaining content/account-linked garage work.
- **Speed/accessibility:** Added axe-core audits and payload budgets. Fixed primary-button contrast, the hidden mobile sort label and card alt text. Essential CSS precedes Shopify app output; full-size gallery media waits until opening. Native historical measurements and audit limitations are in [QUALITY-AUDIT.md](QUALITY-AUDIT.md).
- **Releases/security:** Prepared pinned read-only, nondeploying CI and a PR checklist. Remote CI/branch protection and repository choice remain pending. Owner/app findings and two development-tool advisories are in [SECURITY.md](SECURITY.md). No roles, credentials, permissions or live connections changed.
- **Operations:** Added bounded browser-memory diagnostics without private payloads, persistence or transmission. Fixed stock-request wording and initial/changed variant/SKU identity. Native reports, support/stock procedures and remaining monitoring/notification setup are in [OPERATIONS.md](OPERATIONS.md).

Individual gates: `pnpm test:accessibility`, `pnpm test:budgets`; `pnpm test` includes both. The included GitHub workflow runs frozen install, high-severity dependency audit, Theme Check, tests and packaging without deploying. A successful remote run and required-check branch protection still need verification. Passing local checks is not launch certification.

## My Garage Fitment Data

The garage uses explicit product-description fitment tables, keyed by product handle. It no longer guesses from product titles, tags, or broad platform aliases. Make, model, chassis, engine, and submodel/drive selectors share the same catalog; selecting a parent resets its dependent fields without clearing the independently entered year.

The October 14 export contains 190 products. The import excludes three unpublished drafts, extracts 258 configurations for 130 published products, and leaves 57 published products without usable rows. Missing/ambiguous rows and description restrictions are listed in [FITMENT-IMPORT.md](FITMENT-IMPORT.md); 95 products require review. Prices, costs, inventory, SKUs, image URLs, and raw descriptions are not copied into the fitment asset.

Model-year ranges are **not supplied**. Year is optional, and badges explicitly require year confirmation. A listed model/engine is not a guaranteed fit, and "not listed" is not proof of incompatibility. Unknown products are excluded from the match-only view but remain available in ordinary browsing.

Collection/search filtering checks every paginated page using Shopify section rendering, preserving locale, collection tags, sort order, and search terms. It never presents a partially loaded collection as complete. Failed or invalid responses restore unfiltered results with a Retry button. Collections over 50 pages also fall back to unfiltered browsing.

Multiple vehicles can be saved locally, with one active car for product badges and match-only filtering. Add vehicle preserves existing cars; radio controls switch the active car; pencil/X controls edit or remove individual cars. Duplicate configuration/year saves reuse the existing entry. Clear selection keeps the list but clears active filtering. The previous single saved vehicle is migrated automatically. Tabs synchronize, including selections from older open tabs. See [GARAGE.md](GARAGE.md).

Invalid legacy selections must be updated. If browser storage is blocked/full, vehicles remain available for the current page and finder links carry only the active vehicle preference in the URL; no persistent-save claim is made. Shared parameters are cleared or updated after a selection changes. Saved vehicles are specific to the browser/profile and domain, not linked to customer accounts or synchronized across devices. Without JavaScript, shoppers can still browse all parts.

To refresh the catalog from a Shopify export:

```sh
python3 scripts/import-fitment.py /path/to/products_export.csv
pnpm theme:check
pnpm test
```

This regenerates `assets/fitment-data.js` and `FITMENT-IMPORT.md`. Keep the source CSV outside the repository. Review flagged rows before changing any compatibility claims. A separate, verified supplier year-range file is needed for exact model-year matching; this importer does not infer ranges from titles.

### Manufacturer Source Reviews

The importer also reads `data/fitment-source-reviews.json` by default; use `--source-reviews /path/to/reviews.json` to select another manifest. Each review records the manufacturer URL, review date, exact model/engine rows and manufacturer part number. The importer attaches provenance only when the reviewed rows exactly match the current imported rows and the manufacturer part number matches the export's primary variant SKU. Unsafe URLs, unsupported fields and stale/mismatched reviews leave the product flagged for review without changing its fitment rows.

The first reviewed product is the [ARM 135i 5-inch intercooler](https://armmotorsports.com/products/135i-5-intercooler-fmic), checked October 14, 2026: 14 model/engine configurations and matching part number. Its Fitment panel links to the manufacturer and explicitly says model-year compatibility remains unverified. This is a public-source review, not physical installation verification or catalog-wide certification. Other products retain their existing unknown/restricted states. Source reviews do not populate missing year ranges or copy SKUs into the storefront asset.

## Collection Browsing

Collections have a native Shopify filter sidebar on desktop and a keyboard-accessible filter drawer on mobile. The theme renders the configured `collection.filters` rather than inventing filter values. Availability, Price, **Brand** (Vendor) and **Part Type** (Product type) are enabled in Shopify Search & Discovery. These are store-wide filter settings, not preview-only changes. The two existing ARM vendor spellings are grouped under **ARM Motorsports** using Shopify's native value grouping; raw product Vendor fields and vendor-based collection rules remain unchanged. Preview product cards and product specs use the same canonical display label. See [Shopify's filter setup guide](https://help.shopify.com/en/manual/online-store/storefront-search/search-and-discovery-filters).

Applying filters resets pagination while preserving sorting, locale, tagged collection paths, and vehicle URL preferences. Sorting preserves repeated filter values and price ranges. Active filters can be removed individually or cleared; invalid price ranges expose native validation and can be corrected. Filtering and sorting also work without JavaScript.

A compact My Garage bar stays visible while browsing, with Change/Clear controls and the model-year warning. It follows the rendered header position, including Shopify's section wrapper, resized headers, and hidden navigation. Product cards retain full titles, clear starting prices, restrained fitment labels, consistent image surfaces, and unchanged quick-buy/variant behavior. A sold-out label takes priority over decorative merchandising badges.

Real-preview checks verified Availability/Price controls, a USD 100-200 price range returning 35 products, and eight listed garage matches across that filtered collection's pages. The hosted preview also verified the grouped ARM brand with Intercoolers returning 17 products, including selected filters in the mobile drawer and desktop sidebar. Temporary filters were cleared afterward; existing garage preferences were preserved. No order was placed and no theme was published. Separate catalog content maintenance is recorded below.

## Footer, Builds and Catalog Review

Empty or legacy Search-only footer menus now use distinct Shop, Support and Company links to existing collections, pages and published policies. Custom merchant menus remain unchanged. The footer editor offers an explicit fallback role; real Shopify menus still need merchant assignment for full editorial control.

The Builds template has configurable hero media and a blog source, platform browsing and customer stories. Only published articles tagged `build` or `customer build` with an image are included. No invented customer builds appear. An empty generic `/pages/builds` page receives the same experience until its Shopify template assignment is reviewed; authored page content is preserved.

Run `python3 scripts/audit-catalog.py /path/to/products_export.csv` for a read-only supplier/description review. [CATALOG-REVIEW.md](CATALOG-REVIEW.md) flags five products with repeated substantial parsed HTML fragments in the supplied export. Similar but nonidentical content may not be detected; flags are review candidates, not deletion instructions. No raw descriptions or commercial CSV columns are committed.

The current `135i-5-intercooler-fmic` description was backed up locally and its manually reviewed second profile-through-warranty block was removed in Shopify Admin. Preview verification confirmed one profile and one unchanged fitment table. This is a **store-wide product content edit**, not an unpublished-theme-only change. Other candidates and any raw supplier-data normalization await current-data review; no prices, stock or compatibility claims were changed.

## Changelog

### October 15, 2026

- Included the SEO and multi-car garage code, tests, README and feature documentation in the `codex/seo-foundations` GitHub branch push. All 123 local checks, Theme Check and packaging pass. This does not merge into main, update the separate Shopify-connected repository or publish a live theme.
- Added multi-car My Garage with safe single-vehicle migration, one active fitment selection, add/edit/remove/cancel controls, duplicate prevention, cross-tab/legacy-tab synchronization and page-only storage fallback. Clear selection retains saved cars. Twelve workflow/browser groups and one axe audit bring the suite to 123. Verified adding, reloading and switching real catalog vehicles in the local Shopify preview; removed the temporary car and preserved the original BMW. New labels use a distinct section translation namespace after real-preview verification. Included in the review-branch push; no account backend or live publication.
- Added SEO foundations on `codex/seo-foundations` and the unpublished preview: native product/article structured data, truthful homepage/breadcrumb schema, Open Graph/Twitter cards, safe title/description fallbacks and utility-page noindex rules. Added seven SEO regression groups (110 total checks at that stage) plus a public crawl audit and prioritized growth plan in [SEO.md](SEO.md). Included in the review-branch push; no Google account linking, catalog SEO edits or live publication.
- Synchronized the tested enterprise/product fixes, storefront bug sweep and documentation to `slimeraps/Autobahn-Essentials/main`, so today's README is visible on the default GitHub page. The separate Shopify-connected `BellanfonteJ/Autobahn-Essentials/main` is unchanged; no live theme release is included.
- Completed a follow-up storefront code/fixture audit after pushing hover fix `baaa626`. Reproduced and fixed gallery magnifier clipping/pixel alignment, mobile cart page/drawer overflow, stretched cart thumbnails, newsletter focus interruptions and locale-dropping fallback links/API requests. Added five browser regressions and a populated-cart accessibility audit, bringing the suite to 103. Dependency audit found no high/critical advisories; the two existing lower-severity development-tool findings remain documented. This batch is included in the review-branch push only; no order, email, buyer-data submission or live release was performed.
- Fixed alternate product-card images extending outside their frame on hover: a more-specific 100% image-size rule overrode the absolute image's auto sizing while its inset remained. Primary and alternate images now share one bounded grid cell, preserving containment, the image transition and card dimensions. Coverage checks collection, search and related cards at 320-1440px with normal/reduced motion. This 97-check follow-up is included in the review-branch push and unpublished preview, not a live release.
- Pushed the product-page spacing follow-up and updated README/release documentation on the review branch. Specs, Fitment, Shipping and app blocks sit below both columns, removing the large empty area beside the panels. Added 320-1920px layout, accordion and variant-SKU regression coverage with and without JavaScript; all 96 checks pass. No live theme publication.

### October 14, 2026

- Removed the large empty area below the desktop gallery by moving Specs, Fitment, Shipping and app blocks into a full-width row after the gallery/purchase area. Retained mobile reading order, native accordions and variant SKU updates. This 96-check follow-up is on the unpublished preview and included in the October 15 review-branch push.
- Included all pending enterprise-readiness, description and fitment-guide improvements in the GitHub review-branch update. README and release runbooks reflect 95 passing checks and distinguish the unpublished preview from a live release. Private exports, local backups, screenshots, CLI state and generated ZIPs are excluded.
- Fixed the long product description being squeezed into the purchase column. Added a dedicated full-width reading section with readable headings/spacing, bounded media/tables and unchanged original content/order. Responsive regression coverage brings the suite to 93; changes remain on the unpublished preview and review branch.
- Cleaned up legacy supplier description formatting with compact wrapping badges, restrained heading typography/dividers, responsive video wrappers and subtle fitment row shading. Product content stays unchanged; no-JavaScript responsive coverage brings the suite to 94.
- Fixed supplier fitment guides whose rows were shrink-wrapped inside a full-width block table. Guides now have aligned full-width columns, consistent cell alignment and compact mobile padding, with unchanged configuration data and no-JavaScript regression coverage.
- Implemented the first stage of items 4-7: responsive product purchasing/resources, optional verified content/review blocks, accessibility/byte-budget gates, nondeploying CI/release safeguards, local diagnostics and stock-request identity fixes. Suite now has 92 checks.
- Read historical LCP/INP/CLS reports and inspected owner sign-in enforcement, app inventory and Syncee access without changes. Added content, quality, security/rollback and operations runbooks. Live release, enforced account security and central monitoring remain owner tasks.
- Started enterprise readiness with exact-row/SKU-validated manufacturer source reviews, safe customer-visible provenance and unchanged model-year warnings. Reviewed the first intercooler; no missing compatibility data was invented.
- Enabled store-wide Brand and Part Type filters, grouped both ARM vendor aliases without rewriting product data, and aligned preview brand labels across cards and specs.
- Verified hosted checkout loading, required-field validation and invalid-discount rejection without buyer data or payment. Restored the empty cart; shipping/tax, transaction, notification and fulfillment checks remain open.
- Added six regressions for source validation, canonical labels and grouped filter IDs, bringing the suite to 74. This first-stage work is included in the latest review-branch push.
- Added native collection filtering with a desktop sidebar, mobile focus-managed drawer, active filter removal, sort preservation, price validation, and no-JavaScript support.
- Refined product cards and added a persistent My Garage bar with Change/Clear controls and year-fitment warnings. Card starting prices use the product minimum without implying unrelated variant discounts.
- Rebuilt the empty Builds page with platform links, configurable hero/blog sources and a genuine customer-story gallery; repaired Search-only footer fallbacks without replacing custom menus.
- Added 16 browsing/footer/Builds browser checks and three catalog audit checks, bringing the suite to 68. Added a read-only content review and a launch-readiness checklist.
- Verified the Shopify GitHub connection targets the separate `BellanfonteJ` repository. Kept the live connection, live theme, shipping rates and payment setup unchanged.
- Removed a manually reviewed duplicate description block from the 135i 5-inch intercooler in Shopify, preserving its unique content and fitment rows. This content maintenance affects all themes.

- Rebuilt My Garage around the supplied CSV's explicit fitment tables. Added validated cascading selectors, saved-vehicle synchronization, transparent unknown/restricted badges, and full collection/search pagination with failure recovery.
- Added 12 garage browser tests and four importer tests, bringing the suite to 49. Updated responsive drawer controls and retained ordinary shopping when fitment data, storage, or JavaScript is unavailable.
- Added a reproducible CSV importer and a fitment review report. No live product data, prices, inventory, or customer records were changed. These edits remain on the working bug-fix branch and unpublished preview, not the live theme.
- Removed a duplicate close-icon case so newsletter, cart, and gallery buttons render a single X. Added a regression test and verified newsletter dismissal.
- Verified all 33 browser regression tests and a clean Shopify Theme Check for the close-icon and motion fixes, subsequently merged into `main` through PR #48. Shopify publication remains separate.
- Based the garage follow-up on current `main` at `1b1a312`, after PR #47 and PR #48 were merged. New changes are kept on `codex/theme-bug-fixes` for review rather than pushed directly to `main`.

### October 13, 2026

#### Motion Polish

- Added one-time, lightly staggered entrances to upcoming cards and section headings across browsing and editorial pages, rather than only the homepage.
- Kept above-the-fold content immediate and all content visible when JavaScript or Intersection Observer is unavailable. Entrances stop on keyboard focus or a live reduced-motion preference change.
- Separated entrance movement from existing hover transforms so card interactions still work. No scroll handlers, external animation library, permanent GPU hints, or layout-size animations were added.
- Added short search/garage entrances, gallery/newsletter opening transitions, button-icon hover movement, and cart-count feedback after confirmed updates.
- Added five regression tests, bringing the suite to 32. Motion checks include phone, tablet, desktop, cart actions, keyboard focus, and Shopify section load/unload behavior.
- Motion additions are maintained on `codex/theme-bug-fixes` and synchronized to the unpublished preview. Publishing the live Shopify theme remains a separate step.

#### Theme Bug Fixes and Regression Coverage

- Updated variant prices, sale prices, SKU, availability, images, purchase controls, and restock forms when selecting options; multi-variant products require option selection before quick purchase.
- Serialized cart requests, exposed failures without duplicate submissions, restored rejected quantities, and used locale-aware routes and returned currency.
- Improved keyboard focus and Escape behavior for cart, gallery, mobile navigation, search, and garage controls; made hidden dialogs inert.
- Fixed narrow-screen header, hero, product-video, fitment-table, and related-card overflow; retained usable navigation without JavaScript.
- Synchronized garage preferences and dependent fields, reduced false-positive fitment claims, and simplified vehicle searches.
- Escaped product/cart/search content and variant JSON, added accessible form feedback, and preserved authored product descriptions.
- Replaced the 15.6 MB fallback hero download with responsive WebP images of approximately 30 KB, 75 KB, and 193 KB.
- Added 27 browser regression tests and an authenticated, unpublished Shopify preview. The published theme remains unchanged.

### May 25th

#### Release 6.3.0 Racing UI pass — smart header, GPU glow, sharpened type, rounded CTAs

- Added a smart sticky header that hides on scroll-down and reappears on scroll-up, driven by a `requestAnimationFrame`-throttled scroll listener in `assets/theme.js` with a 6px intent threshold and a `transform: translate3d(0, -112%, 0)` hide state on `.site-header--sticky.is-hidden`.
- Sharpened the homepage hero typography in `.hero h1`: explicit Montserrat 900, `letter-spacing: -0.018em`, `line-height: 0.84`, `font-feature-settings: "ss01","kern"`, and `text-rendering: optimizeLegibility` for a tighter, more geometric headline.
- Tightened the hero typewriter rhythm in `assets/theme.js` — `typeDelay 105→72ms`, `eraseDelay 55→36ms`, `phraseHoldDuration 4000→3400ms`.
- Added an orange-to-transparent radial glow hover on `.product-card`, `.collection-card`, `.article-card`, `.ae-build-card`, and `.promo-tile` via a `::before` pseudo-element keyed off `#e8432a`. Glow uses `opacity` + `transform: translate3d(0,0,0) scale()` only, with `will-change` scoped to `:hover` and a reduced-motion fallback.
- Converted card, button, and header transitions from `ease` to `cubic-bezier(0.22, 1, 0.36, 1)` for a snappier responsive feel. Hover lifts moved from `translateY` to `translate3d` so they composite on the GPU.
- De-templatized the chrome — buttons now use `font-weight: 900` + `letter-spacing: 0.04em` + `padding: 13px 22px`, with sharp racing edges on smaller chrome (selects, fields, fitment badges, spec items) at `border-radius: 3px`.
- Rounded off the primary CTAs and feature cards per request: `.button` / `.shopify-payment-button__button` to `999px` pills (covers Shop Now and View Builds); `.collection-card`, `.collection-grid--featured .collection-card`, `.promo-tile`, and `.spec-item` (Performance Tested / Enthusiast Owned / Euro Focused / Fast Shipping strip) to `border-radius: 16px`.
- Hid the visible "Skip to content" link without breaking accessibility — it is now visually clipped (`clip-path: inset(50%)`) and only appears at top-left on `:focus` / `:focus-visible`. The DOM element and link target are unchanged.

### May 22nd

#### Release 6.2.0 Homepage hero artwork and orange divider

- Replaced the homepage hero fallback image with `AE-hero-new.png` — a wide-landscape orange Lamborghini Urus and BMW M4 photo (6000x3376) that fills the hero crop edge-to-edge instead of leaning on the previous parking-garage M4 shot.
- Updated the hero image's `width`/`height` attributes and alt text in `sections/hero-autobahn.liquid` so the browser can reserve the right aspect ratio and screen readers describe the new scene.
- Added an 18px solid `var(--color-accent)` border below the hero so the section ends with a clean orange band before transitioning into the spec strip, replacing the previous borderless cut.
- Heads-up: the new hero image is a ~15MB PNG. The Shopify CDN compresses it for the merchant-uploaded path, but the fallback ships at full size. Consider re-exporting as an optimized JPG before launch.

### May 21st

#### Release 6.1.4 Homepage hero shortened and Builds schema fix

- Shrunk the homepage hero so its total visual height matches the Autobahn Blog page hero: lowered `.hero` min-height to `clamp(380px, 44vw, 520px)` desktop / `440px` mobile, trimmed `.hero__content` padding, and removed the 110-210px image bleed-down that pushed the orange BMW behind the spec strip and inflated the perceived hero size.
- Switched the homepage hero image crop to `object-position: center center` so the focal point is the geometric center of the image regardless of which artwork is assigned.
- Fixed an upload-blocking schema error on `sections/page-builds-autobahn.liquid`: changed the Instagram URL setting from `type: url` to `type: text` because Shopify's `url` setting type rejects external URLs as defaults, which was also preventing `templates/page.builds.json` from resolving its section.

#### Release 6.1.3 Autobahn Blog hero text removed and overlay disabled

- Removed the eyebrow, heading, and hero text from the Autobahn Blog hero so a custom hero artwork can carry the page header on its own. Removed the now-unused eyebrow/heading/text settings from the section schema.
- Added an `ae-page-hero--no-overlay` modifier and applied it to the Autobahn Blog hero so the dark left-to-right gradient overlay no longer fights with the uploaded artwork. The Builds hero keeps the original overlay.

#### Release 6.1.2 Autobahn Blog hero image fix

- Swapped the default Autobahn Blog hero from the night BMW photo (almost entirely black and portrait-cropped, leaving the page hero rendering as solid black behind the dark page overlay) to the G82 BMW M4 sunset shot, which the existing dark hero overlay turns into a moody editorial frame.
- Added a Hero image picker to the Autobahn Blog section so a custom photo can be uploaded from the theme editor without code changes.

#### Release 6.1.1 Autobahn Blog hero polish

- Swapped the AE.Blog page hero image from the generic Autobahn SVG silhouette to the night BMW photo (`fallback-hero-night-bmw.jpg`) so the page leads with the darker editorial tone used elsewhere on the site.
- Renamed the AE.Blog page hero heading default from "AE.Blog" to "Autobahn Blog".
- Removed the "Grid text" support copy on the right side of the Recent Stories heading on the AE.Blog page.

#### Release 6.1.0 AE.Blog vertical redesign and persistent post history button

- Replaced the 3-column AE.Blog grid with a full-width vertical list where each post renders as a horizontal row: image on the left, eyebrow date, title, excerpt, tags, and a Read post link stacked on the right.
- Made the post images bigger (4:3 on desktop, 16:9 on mobile) and applied a small vertical translate so the image sits offset from the body for a more editorial layout.
- Added a subtle hover lift on each post image and a top divider between consecutive posts.
- Made the Post history button at the bottom of the AE.Blog page render unconditionally so it is visible before the source blog reaches eleven posts, and renamed it from "View blog history" to "Post history".

#### Release 6.0.1 align AE. Blog nav with other items

- Added an explicit AE. Blog branch to the header so it renders between Builds and Contacts in the same code path as the other top-level nav links, eliminating a font/style mismatch from the previous catch-all render.
- Hardcoded the AE. Blog display text and excluded "blog" titles from the header catch-all so the link cannot render twice if the merchant menu also contains an AE. Blog item.
- Default AE. Blog destination is `/pages/ae-blog`; a menu item whose title contains "blog" overrides the destination.

#### Release 6.0.0 AE.Blog page and Builds reset

- Added a new AE.Blog page template (`templates/page.ae-blog.json`) and section (`sections/page-ae-blog-autobahn.liquid`) that auto-feeds the latest 10 posts from the `autobahn-blog` Shopify blog, newest first.
- Added a "View blog history" button on the AE.Blog page that appears once the source blog has more than 10 posts, linking to Shopify's built-in archive at `/blogs/autobahn-blog`.
- Added a theme-editor Blog source picker on AE.Blog so the source blog can be changed without code edits.
- Stripped the Builds page (`sections/page-builds-autobahn.liquid`) to hero-only ahead of a future gallery redesign.
- Removed the manual "Build card" theme-editor blocks, the grid, and the "Submit a build" CTA from the Builds page schema. Cards are now driven by published blog posts on the AE.Blog page instead of hand-maintained blocks.

### May 14th

#### 11:48PM PST - Release 5.5 restore 5.1 hero treatment with new image

- Reverted the homepage hero CSS to the 5.1 treatment: restored the `autobahn-hero.svg` underlay, the dark left-to-right and bottom gradient overlays, and `object-fit: cover` at `center 58%` desktop / `62% center` mobile.
- Kept the new `AE-hero4.png` artwork wired up as the hero fallback so the polished 5.1 fitment now frames the new orange BMW M4 image.

#### 11:32PM PST - Release 5.4 restore 5.1 hero crop

- Restored the exact hero `object-position` values used in tag 5.1: `center 58%` on desktop and `62% center` on mobile so the new transparent hero artwork sits with the same fitment as the previous fallback image.

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
