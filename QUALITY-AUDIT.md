# Quality Audit

Code/fixture checks updated October 15, 2026; native reports below were inspected October 14. This is a scoped audit, not accessibility certification, a guarantee of no remaining bugs or enterprise-readiness sign-off.

## Automated Gates

- `pnpm test`: 123 checks including 12 multi-car garage groups, seven SEO browser groups, Liquid fixtures, source validation and release safeguards. Product-information positioning and accordion/SKU behavior are covered at 320-1920px with and without JavaScript. Card hover-image alignment and bounds are covered at 320-1440px with normal/reduced motion on collection, search and related products.
- `pnpm test:accessibility`: ten axe-core WCAG A/AA checks, covering homepage, product, collection, search, Builds and contact fixtures at 390/1440px plus populated cart pages/drawers and saved multi-car garage/edit controls at 320/1440px; opened newsletter, search, gallery, cart and native filter controls included.
- `pnpm test:budgets`: first-party scripts <=40 KiB gzip and styles <=30 KiB gzip per representative template; scripts deferred, lead product media sized/responsive/eager, lightbox media deferred until opening.
- Hero caps: 40/90/220 KiB for 640/1200/2400px WebP. Each local font <=45 KiB.
- Product layout/resource bounds tested at 320, 390, 768, 1024 and 1440px, alongside existing reduced-motion, failure, escaping and keyboard checks.

The initial accessibility run exposed low contrast on small white primary-button labels and a mobile sort label hidden with `display:none`. Primary buttons now darken the configured accent, including hover; secondary/branded controls retain their styles. The sort label is visually clipped but accessible. Card alt text preserves supplied text with a title fallback. Final fixture audits detect no WCAG A/AA violations.

Budgets exclude Shopify/app scripts and remote media; they are not load-time benchmarks. Fixtures omit real merchant HTML/apps. Incomplete automated checks, screen readers, real devices, custom colors and third-party overlays need human review. The inspected supplier description has multiple H1 headings and stock claims; these source-content details were not rewritten or verified by the layout change.

## October 15 Bug Sweep

The subsequent multi-car garage has separate migration, duplicate/edit/remove, active filtering, legacy/real-tab events, blocked/full storage, shared-URL and keyboard/mobile coverage. Inspected fixture screenshots at 320-1440px and verified adding/reloading/switching cars in the real Shopify preview. The temporary car was removed and the pre-existing vehicle preserved. An actual-renderer label mismatch was resolved with distinct section translation keys. This is browser-local storage, not account sync. See [GARAGE.md](GARAGE.md).

The subsequent SEO follow-up preserves merchant metadata/canonical pagination and adds native product/article schema, social cards, homepage identity, breadcrumbs and utility-page indexing controls. Tests explicitly cover safe JSON embedding, localized absolute URLs and merchant overrides without JavaScript. The hosted draft product's native schema was separately parsed; the fixture filter is a stub, not a test of Shopify's schema generator. Search Console ownership/indexing, Merchant Center status and Google rich-result validation remain unverified. See [SEO.md](SEO.md).

All five new browser regressions failed before their scoped fixes and passed afterward. Screenshot review additionally caught cart thumbnails retaining intrinsic HTML height; the cart regression now asserts an exact 92px square.

| Area | Reproduced cause | Fix and coverage |
| --- | --- | --- |
| Gallery zoom | Lens followed the pointer outside the clipped frame; border offsets and edge clamping were not accounted for | Clamp lens position, keep cursor sampling aligned; all four image edges at 1024/1440px |
| Cart page | Intrinsic grid minimums and long tokens widened mobile layout; HTML image height could stretch thumbnails | Bounded grid tracks/table columns, wrapping, fixed square thumbnails; 320-1440px, including no-JavaScript |
| Cart drawer | Unbroken names and a nonwrapping quantity/price row extended outside the panel | Wrap names/rows while keeping quantity controls intact; 320/390px and large totals |
| Newsletter | Delay guard recognized dialogs but not Search/My Garage drawers | Defer while either drawer is open, preserve focus, show after closing; Escape remains usable |
| Locale navigation | Hard-coded page paths dropped locale; root concatenation required a trailing slash | Localized fallback page links and normalized cart API root; `/fr` and `/fr/` fixtures |

The existing suite also checks garage save/clear/storage/pagination failures, native filtering/sorting, variant/cart failure recovery, keyboard behavior, content escaping and responsive layouts. The draft smoke check opened/advanced/closed the real hose-upgrade gallery and opened My Garage and header Search without saving a vehicle, submitting buyer data or placing an order. A dependency recheck found zero high/critical findings and two lower-severity findings. Shipping/tax/payment, email delivery, supplier accuracy and full installed-app workflows remain separate owner-approved checks.

## Native Field Baseline

Read-only Shopify reports for September 14-October 13, 2026 showed:

| Report | Segment | Reported P75 |
| --- | --- | --- |
| LCP | All devices | 2,084 ms, Good |
| LCP | Mobile | 1,671 ms, Good |
| INP | All devices | 36 ms, Good |
| CLS | All devices | 0.01 |

Historical measurements describe the existing storefront, **not the new draft theme** or a measured improvement from this work. Several daily rows lacked meaningful samples; zero-valued rows do not prove instant loading. Shopify warns distributions may be sampled. The temporary mobile filter was discarded without saving a report.

Authenticated sources: [LCP](https://admin.shopify.com/store/autobahnessentials/analytics/reports/largest_contentful_paint_over_time), [INP](https://admin.shopify.com/store/autobahnessentials/analytics/reports/interaction_to_next_paint_over_time), [CLS](https://admin.shopify.com/store/autobahnessentials/analytics/reports/cumulative_layout_shift_over_time).

## Real Preview Checks

The hosted draft product rendered the two-column layout at 1280x720 with loaded media, purchase controls above the preview bar and real contact/shipping-policy links. Shop Agent chat opened/closed without a message, sign-in, attachment or form submission. Cart and garage preferences were not changed in this stage.

Mobile fixture screenshots were inspected. A real-device, installed-app mobile/screen-reader pass remains open: the browser viewport override did not change the hosted document's measured 1280px width, so that session is not counted as a real mobile audit.

The subsequent description fix was also verified in the visible hosted preview at 471px: dedicated reading section, 447px content bounds and no document overflow. Desktop/table/media/content-order behavior is covered at 320-1440px. This follow-up does not complete screen-reader or full installed-app testing.

First-paint CSS now precedes `content_for_header`; required Shopify output is retained. See [performance guidance](https://shopify.dev/docs/storefronts/themes/best-practices/performance) and [accessibility guidance](https://shopify.dev/docs/storefronts/themes/best-practices/accessibility).
