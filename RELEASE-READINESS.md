# Release Readiness

Store/admin observations were checked October 14, 2026; code verification was updated October 15. Theme changes target unpublished preview 167398703161. Brand/Part Type configuration and ARM filter-value grouping are store-wide changes. No theme publication, main-branch merge of this latest batch, payment or shipping change, order, customer email submission or agent-performed app-permission update was performed. The enterprise, description, fitment-guide and subsequent bug-sweep code is included in the review-branch push. The earlier modernization was merged separately through PR #50; fetched main is `ea81ab2`.

## Verified

- Native Availability/Price filters, desktop sidebar, mobile dialog and combined garage filtering work in the real preview. Temporary filters were cleared and the saved vehicle preserved.
- Footer fallback groups have distinct links to existing store content; custom menus are preserved.
- The formerly empty Builds page renders platform browsing and a genuine story gallery with an honest empty state. Mobile image loading and horizontal bounds were checked.
- Cart add, quantity update and removal worked. The original empty cart was restored.
- 103 checks pass; Shopify Theme Check returns no diagnostics. Tests include 320-1440px layouts, full-width description/content-order preservation, aligned supplier fitment guides, legacy supplier badge/video formatting, keyboard/reduced motion, request failures, no-JavaScript browsing, source validation, grouped Brand IDs, axe accessibility, first-party asset budgets and parsed CI safeguards. Product-information positioning is checked through 1920px. The October 15 bug sweep adds gallery-edge zoom, long-cart-content/thumbnail, newsletter/drawer timing and locale-route regressions plus populated-cart accessibility coverage. These changes are on the review branch and unpublished preview, not a live release.
- Brand and Part Type are enabled and saved alongside Availability and Price. The two ARM vendor values are grouped as ARM Motorsports without changing product Vendor data or collection rules. The hosted desktop/mobile draft preview returns 17 products for ARM plus Intercoolers. Temporary selections were cleared afterward.
- The first manufacturer review covers 14 explicit model/engine rows for `135i-5-intercooler-fmic`, with matching manufacturer part number and a dated source link in the preview. Rows are unchanged and model-year compatibility remains unverified. Stale or mismatched reviews fail closed.
- Hosted draft-theme checkout loads and rejects a deliberately invalid discount code. Required-field messages appear with blank buyer data. No address, email or payment details were entered, no order was submitted, and the original empty cart was restored.
- Product `135i-5-intercooler-fmic` had a duplicated profile-through-warranty block removed after backing up its current HTML and manually reviewing both copies. Its unique content, original fitment rows and restrictions remain. This catalog edit affects every theme. Local backup: ignored `.tools/135i-5-intercooler-fmic-before.html`.

## Approval and Owner Decisions

1. **Search and filtering:** Search & Discovery is now accessible and the four standard filters are configured. Technical filters such as chassis/engine require accurate structured product data before adding them. Filter configuration is store-wide; new display code is still confined to the draft theme.
2. **Catalog:** Native grouping resolves both `armmotorsports` and `ARM Motorsports` in Brand filtering. Product Vendor fields were not rewritten. Review fresh data and vendor-based collection rules before any underlying normalization. Four other exact-description candidates remain in [CATALOG-REVIEW.md](CATALOG-REVIEW.md); review each against current Shopify content before deleting any repetition.
3. **Fitment:** No verified supplier model-year file is available. Keep the 57 products without usable source rows unknown and year compatibility unverified. Manufacturer pages checked also lacked complete years. Never fill gaps from titles or vehicle production-year assumptions.
4. **Menus and page assignment:** Assign merchant-controlled Shop/Support/Company menus and review the Builds template assignment. The preview fallbacks work without making those store-wide assignments. Actual customer build articles/photos still need to be supplied and published by the merchant.
5. **Checkout:** Hosted draft-theme checkout has passed loading, required-field and invalid-discount checks. The previous localhost redirect/tool failure does not establish a production failure. An approved shipping address and authorized test-payment/order workflow are still needed for the remaining matrix below. Do not enable live payment test mode or place an order without owner authorization.
6. **Payments and shipping:** Admin shows Shopify Payments accepting payments and PayPal inactive. The general shipping profile has free Economy (5-8 business days) for the United States only; Syncee is listed as not fulfilling from that profile. Confirm intended countries, supplier fulfillment and margins before changing rates. Payment-provider activation needs the owner.
7. **Email and apps:** Notifications use a public-domain sender, so Shopify displays its own sender address. Choose a domain mailbox and authenticate it only with approved domain access. Verify actual delivery with an agreed test recipient; template visibility alone is not delivery verification. Installed app widgets are visible, but their full customer workflows and automated restock delivery remain unverified.

## Purchase Test Matrix

| Check | First-stage result | Remaining requirement |
| --- | --- | --- |
| Product to cart to hosted checkout | Passed on draft preview; test item removed afterward | Repeat representative multi-variant/out-of-stock cases before launch |
| Required buyer fields | Blank fields correctly reported as required | Approved test contact/address for delivery checks |
| Invalid discount | Rejected with valid-code message | Merchant-selected valid code and its eligibility/limits |
| Shipping and taxes | Not verified; no address entered | Owner-approved destination and expected shipping/tax outcomes |
| Payment controls | Rendered in hosted checkout only | Owner-approved successful/declined payment test; rendering is not settlement verification |
| Confirmation email | Not sent | Approval for Shopify sample email to signed-in owner; then verify receipt |
| Fulfillment and refund | Not performed | Approved test order and supplier workflow; no real inventory/financial effects without authorization |

The requested sample-email approval and shipping address are pending. Do not commit private address/email data, checkout URLs/tokens or order identifiers. This matrix does not certify enterprise readiness or replace merchant/provider verification.

## Enterprise Items 4-7

| Item | Implemented or inspected | Still needed |
| --- | --- | --- |
| 4. Product pages | Two-column desktop purchasing, stacked mobile, real support/policy links, verified-content fields, app blocks, accurate stock-request identity/wording | Supplier specifications/guides, genuine reviews/builds, merchant field setup, authenticated multi-vehicle garage integration |
| 5. Speed/accessibility | Nine axe audits including populated carts, payload gates, button contrast/mobile-label/alt fixes, lazy lightbox, historical Shopify field baseline | Real-device/app/screen-reader audit; post-release measurements, not claims from old field data |
| 6. Releases/security | Pinned read-only CI, PR checklist, rollback runbook, dependency and read-only owner/app checks | Authoritative repo decision, remote CI and branch protection, owner secure-sign-in review/enforcement, app least privilege and two dev-tool advisories |
| 7. Operations | Bounded memory diagnostics, native report links, support/stock runbook; Shop Agent opens/closes without messages | Approved monitoring destination/recipients, consent-aware funnel setup, stock synchronization, verified support and restock delivery |

The owner overview reports **Secure sign-in method is not required**; personal two-step enrollment status remains unverified. No authentication or permission changes were made. Syncee exposes customer/device data and flags unused Products/Other data access; no access was revoked. See [SECURITY.md](SECURITY.md) before making changes.

Detailed setup/limits: [PRODUCT-CONTENT.md](PRODUCT-CONTENT.md), [QUALITY-AUDIT.md](QUALITY-AUDIT.md), [OPERATIONS.md](OPERATIONS.md). The new code/docs/workflow are included in the review-branch push. No live release, tracking service, email, app installation, order or scheduled monitoring job was activated.

## GitHub Connection

This checkout pushes to `slimeraps/Autobahn-Essentials`. Shopify Admin's live GitHub connection points to **`BellanfonteJ/Autobahn-Essentials`, branch `main`**. The visible log for October 13 at 12:55 PM CDT reported "Theme updated!" with zero succeeded, warnings or failed entries. The live layout snapshot did not load the garage assets present in this checkout's main branch.

The connection was inspected read-only. Do not press **Reset to latest commit**, disconnect/reconnect, merge into the connected branch or publish the preview until the owner selects the authoritative repository, reviews the full release diff and authorizes the live update. Connected branch pushes update the linked theme automatically: [Shopify GitHub integration documentation](https://shopify.dev/docs/storefronts/themes/tools/github).

Use a draft pull request for the reviewed theme code while these launch items remain open. A passing code suite does not complete store-level fitment, fulfillment, checkout or email validation.
