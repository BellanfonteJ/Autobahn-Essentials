# SEO Foundations and Growth Plan

Audit date: October 15, 2026. SEO theme changes are included in the `codex/seo-foundations` GitHub branch push and unpublished preview 167398703161. They have not been merged into main or published live. No product/catalog SEO fields, URLs, redirects, domain settings, Google accounts or app connections were changed.

## Public Baseline

- The live homepage, representative product and BMW collection were reachable. Shopify's public robots file allows ordinary storefront crawling and retains private/transactional and filter/preview exclusions.
- The sitemap index responds and lists product, collection, page, blog/article and Spanish-language sitemap children. Child coverage, Google ingestion and actual indexing were not verified.
- Canonical tags were present. The live homepage title was just the store name; BMW had no meta description. The intercooler's description started with supplier warranty/stock copy rather than a concise product summary.
- The inspected pages had Shopify's fallback image tags but no complete theme-owned Open Graph/Twitter metadata or JSON-LD. Apps and other templates may differ.
- A Google site-verification tag is present. This suggests prior configuration, not proof of current Search Console ownership, sitemap submission, indexing or Merchant Center enrollment. Preserve the existing tag and Shopify's `content_for_header` output.

## Implemented

- Descriptive homepage-title fallback when the title is only the store name. Preserve merchant-written titles/descriptions, tag context and pagination suffixes; avoid double-escaping quoted product titles.
- Missing-description fallbacks from authored resource content, with a restrained collection summary when no description exists. These are not a substitute for unique catalog copy.
- Complete Open Graph/Twitter cards with canonical URLs, resource-aware types, actual page images and escaped titles/alt text. No fabricated social handles or image content.
- Shopify's native `structured_data` filter for products and articles, preserving Shopify's actual offers, variants, currency and availability. No invented reviews, ratings, delivery windows, return policies, GTINs or fitment.
- Homepage Organization/WebSite identity and BreadcrumbList matching visible navigation. Construct absolute links from the canonical domain, retaining localized paths rather than pointing to a preview host.
- `noindex,follow` for cart, internal search and 404 templates; large image previews allowed on ordinary content. Existing Shopify canonical generation, hreflang output, sitemap, robots rules and crawlable pagination remain intact. No blanket collection/filter/pagination exclusion was added.
- Seven browser regression groups cover escaping, merchant overrides, fallbacks, social cards, schema delegation/JSON safety, localized breadcrumbs and indexing rules without requiring JavaScript.

The fixture renderer stubs Shopify's native schema filter. It tests delegation and safe embedding, not Shopify's internal schema generation. Actual hosted-preview product output was separately parsed and checked against displayed price/availability. Google Rich Results Test validation and post-release Search Console inspection remain required; JSON parsing alone is not rich-result eligibility certification.

## Next Actions

1. **Search Console:** Open the existing property selector in [Google Search Console](https://search.google.com/search-console). Look for `autobahnessentials.com` or `https://autobahnessentials.com/` using the Google account that originally verified the store. If absent, have the owner identify the existing account before creating another property. A Domain property uses DNS verification; the existing HTML tag can support a URL-prefix property. Do not remove or replace verification tokens blindly.
2. **Sitemap and inspection:** Once authorized access is confirmed, check the Sitemaps report for `https://autobahnessentials.com/sitemap.xml`. Submit only if missing/incorrect. After an approved live release, inspect the homepage, BMW collection and representative products, then use [Rich Results Test](https://search.google.com/test/rich-results). An unpublished theme is not the public URL Google indexes.
3. **Merchant Center:** Check the existing Shopify Google & YouTube channel and the owner's [Merchant Center](https://merchants.google.com/) account before installing anything or creating duplicates. Review product diagnostics and free-listing status. Keep prices, inventory, shipping, returns and actual product identifiers consistent. Obtain owner approval for account linking, permissions or terms; paid ads are not required for free listings.
4. **Collection content:** Add unique, useful introductions and custom SEO fields for BMW, Audi and VW, then genuine part-type landing pages with reviewed product membership. Several homepage category cards currently lead to internal search results. Assign real collections through the theme editor instead of using search URLs as SEO landing pages; preserve existing URLs and merchant menus.
5. **Product content:** Prioritize real best sellers using Shopify/Search Console data, not guessed keyword volumes. Write a concise product-specific summary, verified specifications, supported configuration rows, restrictions and useful installation guidance. Keep model-year warnings where the supplier has not verified years. Avoid supplier warranty/stock badges as the search snippet lead.
6. **Guides and internal links:** Publish original, reviewed articles answering actual buyer questions, such as intercooler sizing considerations or how to confirm a listed N54/N55 configuration. Link to relevant products and collections using descriptive text. Do not invent installation experience, dyno results or customer builds.
7. **Measurement:** Record a 28-day Search Console baseline for non-brand clicks, impressions, CTR, queries and landing pages. Monitor product/merchant structured-data reports and valid product counts after release. Compare equivalent periods; crawling and rankings take time and improvements are not guaranteed.

## Draft SEO Copy

These are suggested merchant edits, not applied catalog changes. Confirm current collection membership and product details before publishing.

| Page | Suggested title | Suggested description |
| --- | --- | --- |
| BMW collection | BMW Performance Parts \| Autobahn Essentials | Browse BMW performance parts at Autobahn Essentials. Compare upgrades, review product details and confirm your vehicle configuration before ordering. |
| Audi collection | Audi Performance Parts \| Autobahn Essentials | Explore Audi performance parts at Autobahn Essentials. Review available upgrades, product specifications and fitment requirements for your build. |
| VW collection | VW Performance Parts \| Autobahn Essentials | Shop Volkswagen performance parts at Autobahn Essentials. Compare available upgrades and review vehicle fitment details before ordering. |
| 135i intercooler | ARM Motorsports 135i 5-Inch Intercooler \| Autobahn Essentials | Shop the ARM Motorsports 135i 5-inch intercooler FMIC. Review specifications, options and fitment details before ordering from Autobahn Essentials. |

Google may choose different title links/snippets. Do not keyword-stuff, buy backlinks or add invisible copy. Retain original image alt text describing the actual photo rather than repeating keyword lists.

## References

- [Shopify theme SEO](https://shopify.dev/docs/storefronts/themes/seo) and [native structured data](https://shopify.dev/docs/api/liquid/filters/structured_data).
- [Google product structured data](https://developers.google.com/search/docs/appearance/structured-data/product) and [ecommerce URL structure](https://developers.google.com/search/docs/specialty/ecommerce/designing-a-url-structure-for-ecommerce-sites).
- [Search Console properties](https://support.google.com/webmasters/answer/34592) and [verification methods](https://support.google.com/webmasters/answer/9008080).
- [Shopify free Google listings](https://help.shopify.com/en/manual/online-sales-channels/marketplaces/google/shopping-on-google/google-listings).
