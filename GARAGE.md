# Multi-Vehicle My Garage

Implemented October 15, 2026 and included in the `codex/seo-foundations` GitHub branch push alongside the SEO work. Available in the unpublished theme 167398703161, currently named **Autobahn Essentials - Final Version 2026**. Shopify CLI verified its role is `unpublished`; live theme 161641988153 and the connected GitHub repository were not changed. This follow-up has not been merged into main or published live.

## Customer Behavior

- **Add vehicle** opens a blank editor. Saving adds a car without replacing the others and makes it active. Submitting the same configuration/year again selects the existing entry instead of creating a duplicate.
- Radio controls select one active car. Product badges, match-only results, finder fields and the browsing bar follow that car, not a union of every saved vehicle.
- The pencil edits a specific saved car, retaining its ID. Saving activates the edited car; Cancel or closing the drawer discards the unsaved draft. Editing into another saved configuration reports a duplicate rather than deleting either car.
- Each row's X removes only that car. Removing the active car selects an adjacent remaining car; removing the last disables match-only filtering and restores ordinary browsing.
- **Clear selection** clears the active choice and match-only filtering but keeps the vehicle list. Selecting a saved car restores its details.
- Exact configurations with different supplied years remain distinct. Years are optional and compatibility still requires confirmation; no model-year data was fabricated.

## Storage and Migration

The new browser-local key is `autobahn:garage:v2`:

```json
{
  "version": 2,
  "activeId": "vehicle-id",
  "vehicles": [
    {
      "id": "vehicle-id",
      "year": "",
      "make": "BMW",
      "model": "335i",
      "chassis": "E92",
      "trim": "N54",
      "variant": ""
    }
  ]
}
```

When the new key is absent, the previous `autobahn:garage` vehicle appears automatically and is included in the next save. Invalid legacy selections remain flagged for correction, not treated as fitment matches. The old key is preserved. An empty version-2 list remains authoritative so removed cars do not reappear on reload.

Native storage events synchronize tabs. Writes read the latest stored list before modification; older tabs writing a single legacy vehicle are merged into the newer list instead of replacing it. This is browser-local preference storage, not a transactional multi-user database or a guarantee against exactly simultaneous writes.

Blocked/full storage keeps the current garage in page memory and displays the persistence limit. Finder navigation can carry only the active preference in `ae_vehicle`; it does not put the entire garage into a URL. That active preference can appear in ordinary URL/server/analytics logs. Saving removes stale shared parameters; page-only switches update them so reloads cannot silently restore a previous active car. First-party garage code does not create a customer record or send the collection to an account backend.

Saved lists are specific to a browser/profile and origin. Localhost previews and the public domain have separate storage. Clearing browser data removes the local garage. Cross-device/customer-account sync requires a separate authenticated backend integration with ownership checks; it is not implemented here.

## Verification

Twelve multi-car browser groups cover migration/reload, active-only filtering, edit/cancel, duplicates, clear/remove, real shared-context tabs, legacy events, quota failures, malformed/untrusted data, shared URLs, keyboard focus and 320-1440px layouts. One additional axe audit covers saved rows and editing at 320/1440px. The full suite passes 123 checks; Theme Check and packaging pass.

The real local Shopify preview retained the existing BMW 335i (E92) N54, added a temporary 2017 BMW 340i (F30) B58, reloaded with both present and switched back to the original. The temporary car was then removed; the original remained. Fixture screenshots were inspected at phone and desktop widths. No cart, checkout, order, email or catalog data was changed.

The actual Shopify renderer initially displayed the header's "My Garage" text for the short `garage.*` keys. Moving the new controls to the distinct `sections.multi_vehicle_garage.*` namespace produced the correct labels, including accessible edit/remove names. This was verified in the real preview rather than inferred from LiquidJS fixtures.
