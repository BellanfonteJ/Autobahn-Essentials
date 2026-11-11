# Customer Accounts

## November 11 Signed-In Verification

**GitHub review update:** The account-label fix, regression and verification notes are included in the `codex/seo-foundations` commit for the configured repositories. This does not merge `main`, upload a Shopify theme or publish the live fix. References to local-only work below describe the verification checkpoint before this review update.

The owner completed customer sign-in directly in the browser. The live account domain reached the authenticated Orders page and displayed the expected welcome/shopping empty state. No existing purchase was available for this account, so populated purchase history, order details and tracking remain unverified. No password or verification code was collected in chat, and no other customer's records were accessed.

- Verified the live desktop account icon and mobile menu entry reach branded sign-in, without a draft-preview session. The mobile entry is approximately 50px high. Sign-in and authenticated Orders layouts fit measured 1280px desktop and 390px mobile viewports without horizontal page overflow; temporary viewport overrides were reset.
- The authenticated `Shop now` link returns to the storefront. The mobile account entry switches to its signed-in label, and following it returns to Orders without another login challenge. The owner remains signed in; no profile, order, marketing preference, payment or account configuration was edited.
- Found a live label-escaping defect: the signed-in entry displays the literal entity in `Account &amp; orders`. The local header now uses Shopify's `escape_once` for its three account-label outputs, retaining text/attribute escaping without double-encoding existing entities. Native route escaping and authentication behavior are unchanged. This fix is local only, not uploaded, published or pushed to GitHub.
- Added a regression covering raw and pre-escaped labels, text/attribute output, and markup safety. It reproduced the defect before the fix. All five focused account test groups pass, including eight responsive widths with/without JavaScript and menu accessibility/focus restoration. CLI Theme Check inspected 83 files with no offenses. The bundled AI Toolkit validator still cannot start because its theme-check dependency is missing; that is not a validation pass. The full storefront suite was not rerun for this three-output change.

This verifies successful owner sign-in and the empty-history workflow, not historical order retrieval or every email sign-in method. The earlier November 8 draft-only observations below are historical checkpoints, not today's live navigation status. Official escaping reference: [Shopify escape_once](https://shopify.dev/docs/api/liquid/filters/escape_once).

## November 8, 2026

Shopify Admin already has customer accounts and "Show sign-in links" enabled. The configured account domain is https://account.autobahnessentials.com. Its hosted login was opened and verified to show the AE logo, "Sign in or create an account", an email field and Continue. No authentication settings were changed.

This theme update adds a desktop account icon and a labeled account entry inside the mobile menu (up to 990px). Guests see "Sign in or create account"; signed-in customers see "Account & orders". Native `routes.account_login_url` and `routes.account_url` supply the destinations, including localization and external account domains. Links are omitted when accounts are disabled or the corresponding route is missing. URLs and labels are escaped, and customer names/emails are not added to page markup.

Shopify manages email-code authentication, account creation, order history, order status and profile information. Customers should sign in with the same email used for their purchases. Orders under a different email/customer record are not automatically merged by this theme. There is no custom authentication service, password storage, customer-data cache or order-history API in the storefront.

Guest checkout remains available. Existing Garage storage remains browser-local; cross-device vehicle synchronization is separate work. No account was created, email/code submitted, customer records merged, order accessed, payment made or checkout setting changed during verification.

## Verification and Release

**GitHub follow-up, November 8 at 3:34:13 PM CST:** Included this feature, tests and documentation in the `codex/seo-foundations` review-branch update for both configured GitHub repositories. Earlier no-push statements describe the draft-upload checkpoint. This update does not merge `main`, publish the theme or verify a signed-in customer's historical orders.

- Four focused regression groups pass: native guest/signed-in destinations and escaping; disabled/missing-route behavior; responsive layout at 320/390/640/768/990/991/1200/1440px with and without JavaScript; and menu accessibility/focus restoration.
- Desktop and mobile fixture screenshots were visually inspected. Header controls do not overlap; mobile account access does not add another top-row icon.
- The complete regression run passed 197/197, including the four new account groups and nine email groups, with no failures, skips or cancellations. After adding the email-folder validation configuration, the two release-configuration tests also passed separately (one is additional to the full run).
- CLI Theme Check inspected 83 theme files with no offenses. Packaging passed; the ZIP contains only standard theme directories, not email templates. `.theme-check.yml` excludes only `notifications/**`, whose Shopify Messaging variables are not storefront Liquid; all recommended storefront checks remain enabled and the email templates have dedicated tests.
- The Shopify AI Toolkit validator cannot start because its bundled `@shopify/theme-check-common` dependency is missing. Its result is not a validation pass; CLI Theme Check and regression tests are the working checks.
- With owner approval, uploaded only `sections/header.liquid`, `snippets/icon.liquid`, `assets/base.css` and `locales/en.default.json` to unpublished theme 167398703161 using `--only` and `--nodelete`, November 8 at 3:27:10 PM CST. CLI confirmed the named draft was pushed successfully. No GitHub push, main merge or live theme publication occurred.
- Actual hosted draft verification passed at 1280px desktop and measured 390px mobile: the desktop icon and mobile menu entry both navigate to native sign-in/create-account, the mobile link is approximately 50px high, and the storefront/login have no mobile horizontal overflow. The draft badge is visible in the mobile screenshot. Temporary viewport override was reset; no email/code was submitted.
- Actual email-code delivery, a signed-in customer's order list and order-detail access require an owner-approved test account/customer with known orders. Viewing the sign-in screen is not proof of those end-to-end checks.

The owner can now [open the draft preview](https://autobahnessentials.com/?preview_theme_id=167398703161), sign in with a purchase email and verify historical orders. Do not merge the connected live branch until that preview is approved.

Official references: [Theme sign-in links](https://shopify.dev/docs/storefronts/themes/sign-in) and [Shopify customer accounts](https://help.shopify.com/en/manual/customers/customer-accounts/new-customer-accounts).
