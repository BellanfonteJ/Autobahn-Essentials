# Store Operations

Bounded browser-memory diagnostics are an investigation foundation, **not an active monitoring/alert service** or replacement for Shopify analytics.

## Local Diagnostics

In browser developer tools on the draft:

```js
window.AEHealth.snapshot()
```

Returns version, counts and last 50 allowed codes; counts cap at 9,999. No messages/stacks, URLs, queries, searches, emails, addresses, product/variant IDs, cart contents or garage selections are retained. No requests, cookies or storage; a new document resets it. Returned objects are copies. Unknown codes/objects are ignored; diagnostic failures cannot interrupt shopping.

| Code | Meaning / response |
| --- | --- |
| `cart_add` | Confirmed add, not an order/payment |
| `cart_add_error` | Rejected/unavailable add; reproduce variant/stock/network case on draft |
| `cart_refresh_error` | Read failure, possibly after confirmed add; do not blindly add again |
| `cart_change_error` | Quantity/removal failed; preserve last confirmed cart |
| `garage_data_unavailable` | Catalog missing; ordinary browsing remains available |
| `garage_load_error` | Pagination failed; unfiltered fallback/Retry; inspect rendering/network |
| `search_no_results` | Server search empty; review native report without collecting terms here |
| `image_error` | Main-content image failed; inspect media separately |
| `script_error`, `unhandled_rejection` | Runtime failure, possibly in apps; investigate without private payloads |

## Native Reporting

Observed Admin links: [conversion breakdown](https://admin.shopify.com/store/autobahnessentials/analytics/reports/conversion_rate_breakdown), [checkout conversion](https://admin.shopify.com/store/autobahnessentials/analytics/reports/checkout_conversion_rate_over_time), [search conversions](https://admin.shopify.com/store/autobahnessentials/analytics/reports/search_conversions_over_time), [searches with no results](https://admin.shopify.com/store/autobahnessentials/analytics/reports/searches_with_no_results). Use owner-controlled segments/date ranges and sample sizes. No new pixel/tracking service was installed.

See [QUALITY-AUDIT.md](QUALITY-AUDIT.md) for performance. Thresholds/recipients, uptime probes, central error collection and consent-aware funnel measurement need owner configuration. Review/approve any destination and telemetry payload before transmission. Do not inject session replay or collect checkout/contact fields through the theme.

## Support and Stock

Product links reach the contact page/shipping policy. Shop Agent opens/closes, but answer correctness, human escalation and order lookup are untested; no message/customer data was sent. Confirm support ownership/hours before advertising guarantees.

Stock-update contact requests now include initial/changed variants/SKUs and do not promise automatic alerts. The existing `back-in-stock` tag is preserved. No notification workflow/email was activated or sent. See [PRODUCT-CONTENT.md](PRODUCT-CONTENT.md).

Before automated restock service, verify supplier inventory authority, request delivery, consent, variant-specific triggers, cancellation/unsubscribe, duplicates and an agreed test recipient. Installed Flow/Messaging/Forms do not prove a working integration. Supplier synchronization/fulfillment responsibilities need owner decisions across the apps.

## Incident Routine

Assign owners for support, stock mismatches, checkout failures and rollback. Review unsuccessful searches alongside fitment gaps; do not infer conversion regressions from tiny samples. Keep financial/customer details in Shopify or an approved private incident system, not Git.

Use [SECURITY.md](SECURITY.md) for release/rollback and [RELEASE-READINESS.md](RELEASE-READINESS.md) for remaining checks. No recurring monitor, automatic order, notification email or scheduled job was started.
