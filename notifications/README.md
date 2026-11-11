# Notification Branding

## Abandoned Cart

**GitHub checkpoint, November 10 at 8:01:41 PM CST:** Included the cart-email setup, verification limits and timestamped project notes in the `codex/seo-foundations` documentation update for both configured repositories. The original local-only notes below predate this checkpoint. The design is store-managed; this update does not deploy an email template, change its active state or send mail.

**Active November 10, 2026 at 7:59:16 PM CST:** With owner approval, temporarily paused **You left items in your cart** through draft mode, applied AE branding using Shopify Messaging's native section controls, and reactivated it. The active list and reopened preview confirm persistence. Charcoal framing, existing logo, smaller heading, red cart action, clearer spacing and a secondary fitment-help action now match the other AE emails. Native dynamic cart items, unsubscribe footer, subject, audience, timing, conditions, discounts, sender and the separate checkout email are preserved. Actual phone/desktop preview widths measured 375/600px with no content overflow; no test/manual campaign was sent and delivered-link/inbox testing remains pending. This UI-only change generated no new template code or storefront deployment. Documentation is local and unpushed. See [abandoned-cart.md](abandoned-cart.md) for verification limits and future edits.

**GitHub follow-up, November 8, 2026 at 3:34:13 PM CST:** Included the reusable newsletter source, order/shipping styles, preservation/preview tools and nine focused email tests in the `codex/seo-foundations` review-branch update for both configured repositories. The complete November 8 regression run passed 197/197, including these nine email groups; release-configuration tests passed separately, CLI Theme Check is clean and packaging passed. Theme Check excludes only this email-only folder, whose marketing variables are not storefront Liquid; its dedicated tests remain enabled. Earlier local-only and no-full-rerun notes below describe their original checkpoints. Git does not apply Shopify notification/template settings, send mail or create campaigns. Private merchant exports, generated bodies and sample previews remain ignored under `.tools/`.

## Newsletter Master

**Saved November 8, 2026 at 3:01:12 PM CST (America/Chicago).** Created a reusable custom template named **AE Newsletter - Brand Master** in Shopify Messaging > Templates, ID 1938024. No custom templates existed before this change. This is a saved template only: no campaign was created/scheduled/sent, no sample was sent, and no automation, audience, discount, tracking preference, shared branding or transactional notification was changed.

Source: `notifications/newsletter.liquid`. Open [Messaging templates](https://admin.shopify.com/store/autobahnessentials/apps/shopify-messaging/custom-templates), then select the master. Shopify's editor saves changes automatically; Done returns to the template list. The template was reopened from that list and its complete source exactly matched the local 9,373-character source.

The charcoal/red design uses the permanent AE logo and existing Shopify Files images, platform browsing, a 135i intercooler spotlight and a contact link. The banner links to the existing Autobahn Blog; no discount, price, stock status, delivery guarantee or verified-year fitment claim was invented. Editorial copy, spotlight and optional campaign subject/preview text should be reviewed for each edition. The footer uses Shopify's current store name/address fields and one native unsubscribe link. Review that store-controlled mailing address before an actual campaign; this work does not certify it or legal compliance. The required `open_tracking_block` variable is included once without changing the store's tracking settings. No customer data is read into the template.

The existing **Hottest Automotive Products Inside!** draft was inspected read-only. It is a welcome automation draft with an existing discount and a Shopify discount-change warning, not a saved newsletter master. It and the other campaigns/automations remain untouched. The earlier sender configuration is unchanged.

Verification: all nine focused email tests passed (six existing notification tests plus three newsletter groups). Newsletter coverage includes Liquid parsing, required variables, escaping, stable public asset URLs, no invented offers, and eight layout states at 320/390/600/800px with images enabled/blocked and scripts disabled. Shopify's actual preview loaded all three assets, displayed current store footer data and one native unsubscribe link, and its native mobile mode measured 375px with no horizontal overflow. Unsubscribe was not clicked and no recipient was unsubscribed. Screenshot proof remains ignored under `.tools/screenshots/newsletter-brand-saved-2026-11-08.png`. A temporary desktop viewport was used for the desktop-only code editor and reset afterward.

The toolkit Liquid validator still cannot start because its bundle lacks `@shopify/theme-check-common`; no validator/full-suite/inbox-client success is claimed. Shopify accepted and persisted the template without displaying a template error. Real inbox/dark-mode checks and campaign-specific approvals remain pending. To use it, create a campaign from this template only after choosing and approving its content, audience and send time. Saving a template is not authorization to send marketing email or enable an automation. Source, tests and docs remain local and not pushed.

## Shipping Confirmation

**Activated November 8, 2026 at 2:30:41 PM CST (America/Chicago).** Saved the Shipping confirmation notification in Shopify to match the approved order-email direction: permanent AE logo, charcoal header/footer, red primary action and a light reading area. Carrier/tracking details have a clearer divider, readable type and wrapping for long tracking numbers. The original subject and normalized rendered message text are unchanged. No order, fulfillment, tracking record or sample email was created/sent during this step. This notification is active across themes; the source/docs are local and not pushed.

The complete existing body was backed up to ignored `.tools/shipping-confirmation-before-branding-2026-11-08.liquid`. All 443 original Liquid expressions remain in their original sequence; the two static insertions can be removed to restore the original source byte for byte. Native full/partial shipment messages, estimated-delivery conditions, single/multiple tracking URLs, no-URL/absent-tracking fallback, fulfilled item lists and native Shop tracking controls are retained. No delivery estimate or tracking URL was invented.

The generator now accepts an optional `shipping` kind; order remains the default and its generated output is byte-identical to the previously saved order template. Shared presentation stays in `order-confirmation.css`; shipping-only tracking styles live in `shipping-confirmation.css` and do not change the active order notification.

```sh
node scripts/brand-order-confirmation.cjs INPUT.liquid OUTPUT.liquid HTTPS_LOGO_URL shipping
node --test tests/email-branding.test.cjs
node scripts/check-email-preview.cjs EXPORTED_SHOPIFY_PREVIEW.html shipping
```

Verification: all six focused tests passed, including shipping-expression preservation and representative full/partial/single/multiple/no-tracking fixture paths. Both the unsaved and saved exported shipping previews passed eight local browser checks (320/390/600/800px, images enabled/blocked, JavaScript disabled), with no document overflow or clipped headings/paragraphs/button text. Shopify confirmed Changes saved; after reload the entire saved source matched the tested generated body exactly. Saved-preview text matched the original preview after whitespace normalization, and the permanent logo loaded. A screenshot records the active Admin preview under ignored `.tools/screenshots/shipping-email-brand-saved-2026-11-08.png`. No inbox-client, actual shipment-trigger or end-to-end fulfillment certification is claimed. The toolkit validator still cannot load its bundled theme-check dependency. No full-suite rerun was needed for this isolated notification update.

**Sample follow-up, November 8 at 2:32:03 PM CST:** After explicit approval for the signed-in recipient, submitted exactly one branded Shipping confirmation sample. The Send control showed loading and the dialog closed without a visible error; no explicit delivery-success notice was captured. Receipt remains pending. No resend, order, shipment, tracking record or payment was created. A local screenshot records the returned preview, not an inbox receipt. Verify this sample in the approved inbox, including phone/dark-mode rendering, before claiming inbox compatibility. Further sends require approval. Returns/refund emails and an order-help page remain separate follow-ups. For an owner-approved shipping rollback, review current Admin source before restoring the backed-up body or choosing Shopify's Previous version; do not overwrite later edits.

## Order Confirmation

**Activated November 8, 2026 at 2:22:01 PM CST (America/Chicago).** After explicit owner approval, uploaded the existing tightly framed AE logo to Shopify Files and saved the branded Order confirmation notification for future real customer emails. Shopify showed Changes saved; after reload, the complete saved source exactly matched the approved generated template. Shared logo/accent settings, subject and other notification templates are unchanged. No order/payment was created.

Submitted exactly one newly approved branded sample to the approved signed-in account. The Send control showed loading and the dialog closed without a visible error; no explicit send-success notice was captured. Receipt of this branded sample is pending. The owner previously confirmed delivery of the earlier unbranded sample, not this one. No retry was made. Source and docs remain local and not pushed to GitHub; the Admin notification save is already active.

Durable logo: `https://cdn.shopify.com/s/files/1/0696/8347/8585/files/autobahn-essentials-logo.png?v=1794169160`. Admin API reports the uploaded image READY at 940x430, and the saved notification preview loads it. No draft-theme asset dependency remains.

The design uses a charcoal header/footer, existing AE logo, red primary action, light reading area and email-safe system typography. The native Shop tracking control keeps its own styling. Order, payment, split-delivery, pickup, gift-card, discount and tax logic remain exactly as exported from the store: all 3,579 original Liquid expressions remain in sequence, and removing the two static insertions restores the original source byte for byte.

`order-confirmation.css` is the shared presentation source. `scripts/brand-order-confirmation.cjs` adds it inside the current notification head and adds a static logo only inside the existing no-logo fallback. The default `order` kind remains unchanged; the optional `shipping` kind adds only its tracking presentation. The generator rejects unexpected/duplicate anchors, duplicate branding, unsupported kinds and unsafe logo URLs. It does not rewrite transaction logic, contact details or policy promises. Notification source is managed in Shopify Admin, not deployed with a theme push.

Generate from a freshly exported template:

```sh
node scripts/brand-order-confirmation.cjs INPUT.liquid OUTPUT.liquid HTTPS_LOGO_URL
node --test tests/email-branding.test.cjs
node scripts/check-email-preview.cjs EXPORTED_SHOPIFY_PREVIEW.html
```

The generator refuses to overwrite an existing output. The complete merchant export and generated preview remain ignored in `.tools/`; they are not reusable Shopify defaults. Back up and compare current Admin source again before applying to another store or a later version.

## Verification

- Four focused tests passed for content/Liquid preservation, safe URL escaping, fail-closed generation and CSS scope.
- The actual Shopify unsaved preview rendered the logo and intended colors. Its sample order retained the original native messaging and data, including split delivery, bundle discounts, totals and customer-information sections.
- After activation, the saved preview rendered the permanent logo, charcoal header and red primary action. All eight exported-preview checks passed again against the saved render, and the four focused tests passed again. Reloaded Admin source matched the generated final source exactly.
- Exported rendered HTML passed eight local Chrome checks: 320, 390, 600 and 800px with images enabled/blocked and JavaScript disabled. No document overflow or clipped headings/paragraphs/button text was found. External requests were blocked; the existing local logo was supplied for the enabled-image check. These are browser layout checks, not Gmail/Outlook/Apple Mail certification.
- The native Admin preview remained 582px wide despite a viewport request; the screenshot labeled `mobile` is not mobile proof. The measured narrow-screen coverage comes from the exported HTML checks above. Temporary viewport overrides were reset.
- The AI Toolkit Liquid validator could not start because its bundle lacks `@shopify/theme-check-common`. No validator success is claimed. Shopify preview rendered without a displayed template error. The existing 184-test storefront result predates these four new focused tests; the entire suite was not rerun for this isolated preview.

## Rollout and Rollback

1. Saving this notification changed future real customer emails across themes; it was not a draft-theme-only update. The owner approved that activation and one sample.
2. Keep the uploaded Files logo available and retain the readable store-name fallback when images are blocked. Shared logo/accent settings were not saved or changed.
3. Verify receipt of the branded sample, then inspect actual inbox clients, phone rendering and dark mode before claiming broad email compatibility. Obtain approval for any additional sample sends.
4. Apply the approved direction to shipping/refund and other notification types separately, preserving each template's conditional logic. Changing this source does not update those templates.
5. For an owner-approved rollback, restore the backed-up original body from `.tools/order-confirmation-before-branding-2026-11-08.liquid` after checking for later merchant edits, or use Shopify's Previous version control and review before saving. Reverting the notification does not remove the uploaded Files asset. Do not overwrite newer edits or delete the logo without authorization.

Shopify's editor inlines template-head styles and preserves media queries; the implementation does not load theme CSS or web fonts. See [Shopify's notification customization guide](https://help.shopify.com/en/manual/fulfillment/setup/notifications/customizing-notification-template).
