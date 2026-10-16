# Mobile Experience

Updated October 15, 2026 at 9:00:05 PM CDT (UTC-05:00, America/Chicago).

All seven mobile improvements and the left-side My Garage header follow-up are included in this owner-authorized `slimeraps/main` merge, with tests and documentation. The preceding review-branch commits were pushed to both repositories. This merge does not update the separate BellanfonteJ repository or publish the live Shopify theme. The development server synchronizes unpublished Shopify theme **167398703161**. The complete merge-source verification passed 161 checks, Theme Check and packaging.

## Seven Improvements

1. **Touch controls:** Mobile header icons, garage actions, gallery controls, quantity controls and filter options have at least 44px targets. Inputs use 16px text to avoid automatic iOS focus zoom. Navigation remains available without JavaScript.
2. **Sticky purchasing:** A bottom purchase bar appears after the original Add to Cart scrolls away. Its submit button targets the existing product form, retaining selected variant, quantity, validation and the original cart request/error handling. Price, availability and submitting state stay synchronized. The option label returns focus to the original selector. The bar hides for mobile overlays, focused form controls, a detected keyboard and desktop widths. It reserves room for the store's actual Chat bubble and device safe areas; it does not add a second checkout or cart implementation.
3. **Compact browsing header:** The mobile header is 60px, the ticker is compact and the garage bar uses a tighter layout. Menu and My Garage sit on the left, the logo is centered and Search/Cart stay on the right. Existing vehicle identity and model-year warnings remain visible. Targets and logo stay separate down to 320px; larger-screen positioning is unchanged. Header checks also verify garage opening, Escape and focus restoration.
4. **Collection browsing:** Filter and Sort stay below the rendered sticky header/garage bar. The filter button includes a count of active native values/ranges. Going back from a product restores the originating collection/card position using one tab-local session entry, accepted for up to 30 minutes. Native URLs, sorting, repeated filter values and pagination are retained. Storage failures leave normal navigation available; no browsing state is sent to a service.
5. **Product gallery:** Deliberate horizontal touch/pen swipes change the main image. Vertical scrolling, pinch zoom and cancelled gestures remain available. Previous/next buttons and a live image counter use existing thumbnail selection; lightbox navigation synchronizes back to the main gallery. No gallery library or second image source is introduced.
6. **My Garage:** At phone widths, the drawer becomes a full-screen keyboard-accessible dialog with dependent vehicle steps, progress, Back and editable completed choices. Unsupported fields are skipped and year remains optional. Adding, editing, cancelling, duplicate prevention, multiple saved vehicles, one active vehicle, migration and browser-local storage are retained. Desktop keeps the full form. Compatibility warnings are unchanged; no missing year ranges are invented.
7. **Measured performance work:** Actual mobile Lighthouse runs identified eager supplier video/image work. Product descriptions now stage original content in an inert template, apply lazy loading before inserting images/iframes and retain a no-JavaScript fallback. Original text, order and media URLs remain intact. The lead product image is still eager/high priority. Two existing critical local fonts are preloaded with Shopify's `preload_tag`; closed mobile navigation skips rendering and mobile backgrounds no longer use fixed attachment. Apps, pixels, consent, CAPTCHA and payment integrations were not disabled or reconfigured.

## Verification

The focused mobile suite covers header bounds at 320-1440px with/without JavaScript, native-form cart adds with selected variant/quantity, duplicate-add prevention, stock/errors, overlay visibility, chat clearance at 320-640px, deliberate/cancelled gallery gestures, wizard save/edit/cancel/focus/breakpoint behavior, active filters including a zero-priced range, actual browser-back restoration and supplier-content preservation. New purchase/garage states also run axe at 320/390px. These use the real Liquid source with representative data and mocked cart responses, not a payment transaction.

The first complete run passed 160 checks. A final chat-clearance regression was added after inspecting the real Shopify app bubble; the complete rerun passed **161/161**, with no failures, cancellations or skipped checks. Theme Check reports no errors or warnings, `git diff --check` is clean and packaging succeeded. Final gate results were recorded at 7:49:10 PM CDT.

The hosted draft was independently checked at an actual measured **390x844** viewport: compact header, loaded product photography, next-image counter, purchase bar clearing the real Chat bubble, staged garage advancing from Make to Model and collection Filter/Sort remaining visible while scrolling. No document overflow was observed. The preview toolbar was hidden using its own Hide bar action because it otherwise covers bottom-fixed controls; that toolbar is not part of the live storefront. No vehicle was saved, cart item added, form submitted or store configuration changed during this pass. The temporary browser viewport override was reset afterward.

## Mobile Lab Measurements

Read-only Lighthouse 13.5.0 mobile performance audits used installed Chrome and default simulated mobile throttling on the actual ARM 135i intercooler page. Two live baseline runs and the final draft run reported:

| Run | Score | LCP | TBT | CLS |
| --- | --- | --- | --- | --- |
| Live baseline 1 | 30 | 16.04 s | 440 ms | 0.308 |
| Live baseline 2 | 34 | 13.67 s | 985 ms | 0 |
| Unpublished draft | 77 | 3.34 s | 142 ms | 0.107 |

All emitted a slow-load/incomplete-results warning; some local tests were also running during the baseline measurements. The draft audit ran after tests finished and confirmed HTTP 200 responses for the new first-party assets. It also warned about Shopify redirecting the preview URL to the product's normal path; the draft assets were present in the audited requests. These are different theme/preview environments and variable diagnostic samples, **not controlled before/after benchmarks, field Core Web Vitals or proof that this batch caused the apparent gain**. Existing historical Shopify field reports are recorded separately in `QUALITY-AUDIT.md` and do not measure this draft.

The draft still transferred about 5.22MB versus 4.84-4.86MB in the live samples, including preview/app differences. All samples fetched nine YouTube-related requests totaling about 1.03MB. The iframe's lazy attribute is verified, but it still loaded within the browser's offscreen threshold/audit window; this pass does not establish video-payload savings. Further supplier-image resizing, optional app review and a click-to-load video policy need separate measured review rather than a claim that all speed issues are solved.

Repeatable resource findings included a YouTube player loaded from the below-the-fold description, a roughly 197KB supplier PNG and additional supplier images, alongside app/CAPTCHA/pixel/payment scripts. Lazy loading reduces unnecessary early media work when the browser considers it sufficiently offscreen; the browser can still load near-viewport media before scrolling. It does not shrink the original media or eliminate app execution. The critical fonts use [Shopify's native preload filter](https://shopify.dev/docs/api/liquid/filters/preload_tag). Lighthouse [lab scores vary](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring); do not advertise a speed percentage from these samples.

Raw JSON audits, screenshots and generated ZIPs stay in ignored local output, not in Git. Reproduce with the official [Lighthouse CLI](https://github.com/GoogleChrome/lighthouse#using-the-node-cli), using the same device/throttling/browser and repeated runs without concurrent tests. For the draft, append `?preview_theme_id=167398703161`; preview toolbar/app differences prevent treating live and draft as identical environments.

## Remaining Release Checks

- Physically test iOS Safari and Android Chrome: native selects, keyboards, safe-area inset, pinch/swipe and installed chat/payment overlays. Desktop Chrome phone emulation is not a physical-device audit.
- Review optional app/pixel cost with the owner before removing or deferring integrations; no such changes were made here.
- Inspect Shopify mobile field LCP/INP/CLS after an approved release with sufficient traffic. A Lighthouse TBT result is not a field INP measurement.
- Existing supplier-year gaps, account/cross-device garage storage, policy wording conflicts and real contact/return email delivery remain separate work. See `RELEASE-READINESS.md`, `GARAGE.md` and `QUALITY-AUDIT.md`.
