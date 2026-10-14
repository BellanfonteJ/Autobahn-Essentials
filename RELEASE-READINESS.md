# Release Readiness

Checked October 14, 2026. Theme changes target unpublished preview 167398703161. No theme publication, main-branch merge, payment or shipping change, order, customer email submission or app-permission update was performed.

## Verified

- Native Availability/Price filters, desktop sidebar, mobile dialog and combined garage filtering work in the real preview. Temporary filters were cleared and the saved vehicle preserved.
- Footer fallback groups have distinct links to existing store content; custom menus are preserved.
- The formerly empty Builds page renders platform browsing and a genuine story gallery with an honest empty state. Mobile image loading and horizontal bounds were checked.
- Cart add, quantity update and removal worked. The original empty cart was restored.
- 68 regression tests pass; Shopify Theme Check returns no diagnostics. Automated tests cover 320-1440 pixel widths, reduced motion, keyboard focus, request failures and no-JavaScript browsing.
- Product `135i-5-intercooler-fmic` had a duplicated profile-through-warranty block removed after backing up its current HTML and manually reviewing both copies. Its unique content, original fitment rows and restrictions remain. This catalog edit affects every theme. Local backup: ignored `.tools/135i-5-intercooler-fmic-before.html`.

## Approval and Owner Decisions

1. **App permission:** Search & Discovery currently requires an update granting access to view other services' Apps data. Approval was requested and not assumed. Brand and Part Type filters cannot be enabled until the app opens.
2. **Catalog:** The source export uses both `armmotorsports` and `ARM Motorsports`. Review fresh product data and vendor-based collection rules before normalizing names. Four other exact-description candidates remain in [CATALOG-REVIEW.md](CATALOG-REVIEW.md); review each against current Shopify content before deleting any repetition.
3. **Fitment:** No verified supplier model-year file is available. Keep the 57 products without usable source rows unknown and year compatibility unverified. Manufacturer pages checked also lacked complete years. Never fill gaps from titles or vehicle production-year assumptions.
4. **Menus and page assignment:** Assign merchant-controlled Shop/Support/Company menus and review the Builds template assignment. The preview fallbacks work without making those store-wide assignments. Actual customer build articles/photos still need to be supplied and published by the merchant.
5. **Checkout:** Local checkout navigation failed to load after a Shop Pay redirect. The page-defined commerce tool also returned an authorization error on localhost. This does not establish a production checkout failure. Test the hosted preview checkout in a regular browser before launch, using an approved shipping address and test workflow. Do not enable live payment test mode or place an order without owner authorization.
6. **Payments and shipping:** Admin shows Shopify Payments accepting payments and PayPal inactive. The general shipping profile has free Economy (5-8 business days) for the United States only; Syncee is listed as not fulfilling from that profile. Confirm intended countries, supplier fulfillment and margins before changing rates. Payment-provider activation needs the owner.
7. **Email and apps:** Notifications use a public-domain sender, so Shopify displays its own sender address. Choose a domain mailbox and authenticate it only with approved domain access. Verify actual delivery with an agreed test recipient; template visibility alone is not delivery verification. Installed app widgets are visible, but their full customer workflows and automated restock delivery remain unverified.

## GitHub Connection

This checkout pushes to `slimeraps/Autobahn-Essentials`. Shopify Admin's live GitHub connection points to **`BellanfonteJ/Autobahn-Essentials`, branch `main`**. The visible log for October 13 at 12:55 PM CDT reported "Theme updated!" with zero succeeded, warnings or failed entries. The live layout snapshot did not load the garage assets present in this checkout's main branch.

The connection was inspected read-only. Do not press **Reset to latest commit**, disconnect/reconnect, merge into the connected branch or publish the preview until the owner selects the authoritative repository, reviews the full release diff and authorizes the live update. Connected branch pushes update the linked theme automatically: [Shopify GitHub integration documentation](https://shopify.dev/docs/storefronts/themes/tools/github).

Use a draft pull request for the reviewed theme code while these launch items remain open. A passing code suite does not complete store-level fitment, fulfillment, checkout or email validation.
