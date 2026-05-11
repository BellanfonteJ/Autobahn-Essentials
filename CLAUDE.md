# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A custom **Shopify Online Store 2.0 theme** (Liquid + JSON templates) for Autobahn Essentials, a euro-focused automotive parts storefront. There is no build step, no package manager, no test suite — Shopify renders the theme directly from these folders.

## Working on the theme

There is no `npm install` / `npm run build` / test runner. Local iteration options:

- **Shopify CLI dev server** (recommended for live preview against a real store): `shopify theme dev --store <store>.myshopify.com`. Requires the Shopify CLI and store auth.
- **Push to a development theme**: `shopify theme push --unpublished`. Pull edits back with `shopify theme pull`.
- The README references `preview.html` / `pages-preview.html` static mockups, but they are not currently in the repo.

When asked to "test" UI changes, say so explicitly if no dev server is running — type-checking and unit tests don't exist here. Visual verification requires either the Shopify CLI dev server or a theme upload to a Shopify store.

## Architecture

Standard Shopify OS 2.0 layout. Key things that aren't obvious from a directory listing:

- **`layout/theme.liquid`** is the single HTML shell. It injects CSS custom properties from `settings.color_*` and `settings.page_width` into a `<style>` block at render time, then loads `assets/base.css` and `assets/theme.js` (deferred). All routes render through this layout.
- **`assets/base.css`** is the single stylesheet — ~2500 lines, all hand-written, no preprocessor. Mobile rules live in `@media (max-width: 990px)` (tablet/mobile menu kicks in) and `@media (max-width: 640px)` (phone type/spacing). Desktop-only behaviors are gated by `@media (min-width: 991px)`.
- **`assets/theme.js`** is a single un-bundled script handling: search drawer toggle, mobile menu toggle, product gallery thumb swap, vehicle-finder form serialization (concatenates year/make/model/part fields into the search `q` param before submit), nav-dropdown auto-close on mouseleave (desktop only), back-to-top, and the sticky add-to-cart bar (IntersectionObserver on the main ATC button). Selectors are `data-*` attributes — keep that convention when adding new behavior.
- **Sections vs. snippets**: `sections/*.liquid` are addressable from JSON templates and have `{% schema %}` blocks for theme-editor settings. `snippets/*.liquid` are inert partials rendered via `{% render %}` (e.g., `product-card`, `price`, `icon`, `category-dropdown`, `breadcrumbs`).
- **Templates are JSON**, not Liquid. `templates/*.json` declare which sections render and in what order — e.g., `product.json` composes `main-product` + `related-products`. To change page composition, edit the JSON; to change a section's markup, edit the `.liquid` file.
- **Custom page templates** (`page.about.json`, `page.builds.json`, `page.contact.json`, `page.faq.json`, `page.fitment.json`, `page.shipping-returns.json`) each pair with a matching `sections/page-*-autobahn.liquid` section. In Shopify admin, the page must be assigned the corresponding template suffix or the styling won't apply.
- **Header nav** (`sections/header.liquid`) is data-driven from a `link_list` setting. Any menu link whose title contains "shop" or "categor" auto-renders as a dropdown; everything else is a plain link. The `category-dropdown` snippet provides a hardcoded fallback when the merchant's menu has no shop link.
- **Vehicle finder** (`sections/vehicle-finder.liquid`) is a search-shortcut UI, not a fitment database — it submits to `/search` after concatenating field values into `q`. The make/model/part-type options are hardcoded in the section markup.
- **Theme settings** live in `config/settings_schema.json` (definitions) and `config/settings_data.json` (current values). The accent color (`#e8432a`, "performance orange"), black background, sticky header toggle, announcement bar, and floating ticker all come from settings — don't hardcode these in CSS, reference `var(--color-accent)` etc.
- **Header visibility behavior** (added recently): on desktop (`min-width: 991px`), nav links and `.header-actions` (search + cart icons) are `opacity: 0` until the header is hovered or keyboard-focused, or a nav dropdown is open. The logo image is always visible; the `.site-logo__text` wordmark is `display: none`. Don't reintroduce the old hover-swap.

## Repo conventions

- **Liquid style**: use `{%- -%}` to strip whitespace inside dense markup; the existing sections already do this consistently.
- **Translations**: `{{ 'key.path' | t }}` reads from `locales/en.default.json` — only `en.default.json` exists, so adding strings there is the only path for translatable copy.
- **Versioning**: `config/settings_schema.json` has a `theme_version` field. Tags `0.1`, `0.2`, `0.3` exist on `main` for milestone pushes — keep using semver-ish tags when shipping.
- **No CSS framework**, no JS framework, no TypeScript. Resist introducing one for small features — the theme is intentionally lightweight.
