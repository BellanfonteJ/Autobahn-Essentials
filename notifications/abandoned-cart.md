# Abandoned Cart Email

**Updated November 10, 2026 at 7:59:16 PM CST (America/Chicago).** With owner approval, temporarily moved the active **You left items in your cart** email to draft, updated its presentation through Shopify Messaging's native section editor, and selected **Set to active**. The Messaging list and reopened read-only email both confirm **Active**. This is an active store-managed email, not an unpublished theme change. No test email or manual campaign was sent.

## Saved Design

- Existing permanent AE logo, charcoal `#151515` framing/header/footer and white content area.
- Smaller, left-aligned 28px main heading, restrained red divider and tighter section spacing.
- The secondary heading is now **Your selected parts** at 18px.
- Shopify's native Abandoned cart section remains in place, retaining automatic product images, names, variants, quantities and the original **View cart** action. Existing price visibility was not changed.
- The native cart action is wide, rounded, red `#C53520` with white text. It was styled, not replaced with a static link or hand-authored product list.
- The secondary button is now a quieter **Get fitment help** action, configured in its URL control to `https://autobahnessentials.com/pages/contact`.
- Subject stays **You left items in your cart**. Preview text is **Pick up where you left off. Need fitment help? Reply before ordering.**
- Existing store address, unsubscribe section, copyright and sender settings are retained. Address correctness and legal compliance were not newly certified.

## Scope and Verification

The recipient remains **Customers subscribed to email marketing**. Workflow timing, conditions, discounts and the separate active **You left items at checkout** email were not edited. No custom HTML/Liquid, new assets, storefront code, theme upload/publication or GitHub push was required. Do not apply the newsletter or transactional-email generator to this native recovery section.

The draft displayed **All changes saved** before activation. Native phone preview measured 375px and desktop email sections measured 600px. Rendered text/images remained inside the email containers; the logo and product images loaded. The red cart action was measured with white text, and the footer retained readable white text on charcoal. Reopened active preview retains the new wording, preview text and appearance. Native unsubscribe was keyboard-focused for inspection but not clicked. Temporary viewport override was reset.

The support destination was verified in the editor's URL field and **Visit link** control. However, the read-only rendered preview exposes an empty `href` for that generic secondary button, as it did for the original **Visit our store** button. The native cart and unsubscribe links have sample preview URLs. This is not verification of the actual delivered/tracked URLs: an explicitly approved sample is still needed to inspect inbox rendering and destinations. No sample send, live recovery click, customer cart restoration or inbox/dark-mode certification is claimed.

Rendered before/draft/active DOM snapshots and screenshots are ignored local `.tools/` artifacts, not deployable templates or committed customer data. No code tests or Theme Check were rerun for this UI-only update; prior results retain their original dates and scope. At November 10, 8:01:41 PM CST, these notes were included in the documentation-only `codex/seo-foundations` update for both configured GitHub repositories. No main merge, theme publication, template deployment or test send is included.

## Future Edits

Open [Shopify Messaging](https://admin.shopify.com/store/autobahnessentials/apps/shopify-messaging), select this exact cart email, then view it. Editing an active email reverts it to draft and pauses its sends until reactivated; obtain approval for that interruption. Preserve the native Abandoned cart section and unsubscribe footer, and leave workflow settings alone unless separately requested. For rollback, review current values before restoring the earlier presentation, then reactivate and verify **Active**. Git checkout alone does not restore Shopify editor settings.

References: [Managing Shopify Messaging templates](https://help.shopify.com/en/manual/promoting-marketing/create-marketing/shopify-messaging/email/create-email/templates) and [Email design and test guidance](https://help.shopify.com/en/manual/promoting-marketing/create-marketing/shopify-messaging/email/create-email/writing-best-practices).
