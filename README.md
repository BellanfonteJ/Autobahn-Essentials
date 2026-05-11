# Autobahn Essentials Shopify Theme

A custom Shopify Online Store 2.0 theme for Autobahn Essentials, built around a premium automotive parts and garage essentials storefront.

## What is included

- Dark performance-inspired storefront styling with red accent controls
- Autobahn Essentials AE logo and brand kit reference assets
- Brand-kit palette: performance orange, pure black, dark charcoal, carbon fiber gray, steel gray, and pure white
- Montserrat-style headings and Roboto-style body copy loaded for the storefront
- Editable Shopify theme settings for logo, favicon, colors, page width, sticky header, and announcement bar
- Homepage sections for hero, trust/spec strip, featured products, featured collections, and image-with-text merchandising
- Brand CTA section matching the orange "Upgrade Your Build Today" treatment
- Floating ticker banner for the slogan, part types, and shipping/upgrade hooks
- Shop dropdown for Engine Performance, Turbo Upgrades, Exterior Styling, Interior Accessories, Maintenance, and Garage Gear
- Centered AE logo that stays clean and links home
- Instagram social section and footer link for `@autobahnessentials`
- Branded custom page templates for About, Builds, Fitment Guide, Contact, Shipping & Returns, and FAQ
- Vehicle/part finder for year, make, model, and part type search
- Promo tiles for product drops, build features, and OEM+ upgrade paths
- Quick buy product cards with rollover image support and product badges
- Product detail specs, fitment, shipping tabs, stock counter, and back-in-stock request form
- Collection search toolbar, tag filter chips, breadcrumbs, cart notes, and back-to-top button
- Product, collection, cart, search, page, blog, article, 404, and list-collections templates
- Reusable product card, price, and icon snippets
- Local static preview at `preview.html`
- Local page template preview at `pages-preview.html`

## Upload to Shopify

1. In Shopify admin, go to **Online Store > Themes**.
2. Choose **Add theme > Upload zip file**.
3. Upload `autobahn-essentials-shopify-theme.zip`.
4. Open the theme editor and set:
   - Logo and favicon
   - Main menu and footer menus
   - Hero image
   - Featured products collection
   - Featured collection blocks
   - Optional custom logo if you want to replace the bundled AE asset
   - Ticker slogan and visibility from theme settings
5. Create pages in Shopify admin and assign the matching theme templates:
   - About Us -> `page.about`
   - Builds -> `page.builds`
   - Fitment Guide -> `page.fitment`
   - Contact -> `page.contact`
   - Shipping & Returns -> `page.shipping-returns`
   - FAQ -> `page.faq`

## Local Preview

Open `preview.html` in a browser to see the storefront direction without Shopify data. Open `pages-preview.html` to preview the custom page template styling.

The preview files are static reference mockups and are not included in the Shopify upload zip. Shopify renders the Liquid theme from the `assets`, `sections`, `snippets`, `templates`, `config`, `layout`, and `locales` folders. Products, checkout, dynamic collections, theme editor settings, menus, and assigned page templates only work after upload to Shopify.
