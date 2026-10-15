# Product Content Setup

The draft product template puts real photography beside purchase controls on desktop and keeps the gallery first on mobile. Specs, Fitment, Shipping and app blocks occupy a full-width row below both columns so they do not leave a large empty area beneath the gallery. Variant SKU updates remain scoped to the same product. Long descriptions follow in a dedicated full-width reading section instead of the purchase column. Product-specific CSS loads only on product templates. Descriptions retain their content/order; headings, spacing, media and tables are styled without rewriting supplier HTML.

Legacy supplier tab lists have their nested indentation removed, badge images share a wrapping row, and legacy video wrappers use a bounded responsive player. Description headings use restrained body typography and section dividers; fitment tables have subtle row shading. Only redundant presentation line breaks are collapsed; supplier claims and compatibility notes remain intact.

Supplier `appTable` fitment guides use a full-width native table layout with fixed, aligned columns and compact mobile cell padding. This presentation fix does not add year ranges, change engine alternatives, alter transmission restrictions or modify My Garage matching.

## Supported Merchant Fields

Define these product metafields only when verified content exists. No definitions or values were created in Admin by this update.

| Namespace/key | Shopify type | Customer-facing use |
| --- | --- | --- |
| `custom.specifications` | Rich text (`rich_text_field`) | Extra verified specifications below SKU/category/brand |
| `custom.installation_guide` | URL (`url`) | HTTPS installation guide beside support/policy links |
| `custom.shipping_note` | Single-line or multi-line text | Escaped product-specific fulfillment restrictions in Shipping |
| `custom.build_style` | Existing text field | Displayed only when supplied; no generic claim substituted |
| `custom.fitment` | Existing supported metafield | Existing Fitment content remains unchanged |

Missing/wrong-type resources remain absent. Non-HTTPS guides are hidden. The theme does not invent specifications, delivery dates, compatibility or review scores. Support links use actual existing contact/shipping pages or the store's published shipping policy.

## Reviews and Photography

The product section accepts Shopify `@app` blocks. An authenticated reviews app can be placed through the draft theme editor after owner approval; no app was installed and no customer reviews were fabricated. Review app consent, keyboard behavior and speed before live use. See [Shopify app blocks](https://shopify.dev/docs/storefronts/themes/architecture/blocks/app-blocks).

Use clear photos of the actual part, supplied connector/hardware details and genuine installed-product images. Preserve accurate alt text, dimensions and media order. The gallery retains all images, variant selection and keyboard-accessible zoom; full-resolution lightbox media loads only on opening.

Account-linked multi-vehicle garages need authenticated storage and a reviewed app/backend integration. The current garage stays device-local. Genuine customer builds require merchant-supplied, publishable articles/photos.

## Stock Requests

The contact form is labelled **Ask about availability / Request update**. Initial and changed request bodies include the selected option, variant ID and SKU, including direct-linked sold-out variants and no-JavaScript visits. Success acknowledges receipt, not an automatic restock alert. The `back-in-stock` tag is preserved.

Verify request delivery, response ownership and any subsequent automation before promising notifications. No real request was submitted during this work.
