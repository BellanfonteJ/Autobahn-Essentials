# Autobahn Essentials V1.0 Shopify Theme

Autobahn Essentials V1.0 is a custom Shopify Online Store 2.0 theme for a premium automotive parts storefront. It is built around fast mobile browsing, confident product discovery, vehicle fitment support, and a dark performance-focused brand system.

## V1.0 Highlights

- Mobile-optimized header, navigation, search, product grids, filter chips, and product cards
- My Garage vehicle fitment with saved Year, Make, Model, and Chassis
- Dynamic fitment badges on product cards and product pages
- Product photo previews with responsive image switching and active thumbnail states
- Vehicle/part finder for year, make, model, chassis, and part type search
- Product detail specs, fitment, shipping tabs, stock counter, sticky add-to-cart, and back-in-stock request form
- Quick buy product cards with rollover image support and product badges
- Homepage sections for hero, trust/spec strip, featured products, featured collections, promo tiles, image-with-text merchandising, brand CTA, and Instagram/social content
- Branded custom page templates for About, Builds, Fitment Guide, Contact, Shipping & Returns, and FAQ
- Collection search toolbar, tag filter chips, breadcrumbs, cart notes, pagination, and back-to-top button
- Self-hosted storefront fonts and Theme Check clean Liquid/CSS/JS

## My Garage Fitment

Shoppers can save their vehicle from the header garage button or from supported fitment search forms. The saved vehicle stays in the browser and updates fitment badges across browsing and product pages.

Badges can show:

- `Fits your BMW F30`
- `Check fitment for BMW F30`
- `Universal fit`
- `Check fitment`

To make badges accurate, add product tags or custom metafields that include the relevant fitment terms. Useful tags include make, model, chassis, engine, and year values such as `BMW`, `F30`, `B58`, `Audi`, `B8`, or `MK7`.

Supported custom metafields:

- `custom.fitment`
- `custom.fitment_notes`
- `custom.vehicle_make`
- `custom.vehicle_model`
- `custom.chassis`
- `custom.years`

## Development

Install dependencies:

```sh
node .tools/pnpm-js/bin/pnpm.mjs install
```

Run Shopify Theme Check:

```sh
node .tools/pnpm-js/bin/pnpm.mjs run theme:check
```

Start a Shopify theme preview after connecting a store:

```sh
node .tools/pnpm-js/bin/pnpm.mjs run theme:dev -- --store=your-store.myshopify.com
```

Package the theme:

```sh
node .tools/pnpm-js/bin/pnpm.mjs run theme:package
```

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
