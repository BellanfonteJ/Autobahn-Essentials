# Theme Bug Fixes

Based on `origin/main` at `5ddc954`. Changes are on `codex/theme-bug-fixes`.

## Fixed

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
- Fitment matching rejects obvious engine, make, year and exclusion conflicts. Labels say Possible fit because text matching cannot confirm compatibility.
- Vehicle searches no longer combine every vehicle alias as required search words.
- Contact and returns navigation use the theme's page destinations.
- Newsletter, contact and restock forms expose submission feedback and accessible labels.
- Newsletter email validation is enabled and its errors can reopen the popup. The popup waits for other dialogs to close.
- The hero respects editor headings, fits narrow screens, and has readable content without JavaScript.
- Mobile navigation and cart links remain usable without JavaScript.
- Product-description content stays in its authored order instead of being removed or moved using broad keyword guesses.
- Button icons have stable dimensions.
- Fixed-width product-description videos and fitment tables no longer widen the mobile gallery and purchase panel. Product-card glow stays inside mobile cards.
- Responsive hero WebP assets are approximately 30 KB, 75 KB and 193 KB, replacing the 15.6 MB fallback download.

## Verification

All 27 browser regression tests pass. Shopify Theme Check reports no errors or warnings. Desktop and mobile screenshots were inspected.

```sh
pnpm install --frozen-lockfile
pnpm theme:check
pnpm test
pnpm theme:package
```

Browser tests render the actual Liquid files using LiquidJS with representative Shopify data and mocked cart responses. They cover desktop and mobile widths from 320 to 1440 pixels, JavaScript-disabled navigation, failed requests, focus behavior, and escaping.

The tests use installed Google Chrome on macOS or Playwright Chromium elsewhere. Run `pnpm exec playwright install chromium` if neither is available. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to use another compatible Chromium binary. Set `THEME_SCREENSHOTS=1` to capture viewport screenshots under `.tools/screenshots/`.

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

- All three footer menu blocks currently use a menu containing only Search. Assign distinct Shop, Support, and Company menus in the preview editor.
- The Builds page currently renders a generic empty page. The Git template `page.builds` is available in the preview, but the Shopify page template assignment needs review before changing the live site.
- Some imported product descriptions repeat large content sections and supplier links. Correct the product content in Shopify rather than deleting it heuristically in theme JavaScript.

Checkout, email delivery, complete installed-app workflows, collection assignments, and page/template assignments still require verification. The text-based garage matcher remains a browsing aid, not a verified fitment database. Restock requests remain contact requests and require a store workflow for notifications.

Changes are maintained on `codex/theme-bug-fixes`, separate from `main`. They have not been published as the live Shopify theme.
