# Security and Releases

Report suspected vulnerabilities privately to the store/repository owner, without customer information or credentials in public issues. Store access and deployment decisions remain with the owner.

## Release Controls

`.github/workflows/theme-quality.yml` prepares **Theme Quality / quality** for PRs, main/review-branch pushes and manual runs. Official actions are commit-pinned; permissions are read-only, checkout credentials are not persisted and timeout is 15 minutes. Gates: frozen install, high/critical dependency audit, Theme Check, tests and packaging. There are no Shopify secrets, deployment, publication or repository-push steps. Parsed workflow regression tests guard these properties.

The workflow is included in the review-branch push; a successful GitHub run remains unverified. It does not enable required-review/status-check branch protection; the owner must configure protection after a successful remote run. See [GitHub workflow security](https://docs.github.com/en/actions/reference/security/secure-use).

This checkout uses `slimeraps/Autobahn-Essentials`; Shopify live connects to `BellanfonteJ/Autobahn-Essentials/main`. Authoritative-repository selection remains pending. No reconnection, reset, main merge or publication occurred. Connected branch updates can change the live theme even though this workflow never deploys.

## Owner and App Review

The Users overview showed an active organization/store owner and **Secure sign-in method is not required**. This is an enforcement finding, not proof that personal two-step authentication is disabled. Verify account protection and require secure sign-in where supported. Account enrollment/recovery and authentication changes need owner participation; no role, credential or enforcement setting changed. See [Shopify user security](https://help.shopify.com/en/manual/your-account/users/security).

Installed inventory: Search & Discovery, Matrixify, Translate & Adapt, Flow, Instafeed, Messaging, Syncee AI Dropship, DSers-AliExpress Dropshipping, Fulfillment Network, Forms, Marketplace Connect, Conversion Bear Trust Badges, Affirm messaging and Aliexpress Dropshipping Center. None was installed, removed or granted broader access.

Syncee lists customer contact/address and device/activity access, and Products/Other data as unused access for the last 30 days. This does not prove the app unnecessary. Verify fulfillment requirements before changing it. Multiple import/supplier/fulfillment apps need an owner-led overlap/least-privilege review. Every app's full permission set remains unaudited; do not revoke access based only on inventory.

## Dependency Audit

October 14 registry audit: zero high/critical, one moderate and one low advisory, both under development-only Shopify CLI:

- `sprintf-js@1.1.3` via `global-agent/roarr`: [precision denial of service](https://github.com/advisories/GHSA-hp3w-g68c-fv3c). Registry suggested >=1.1.4, but that version was unavailable and GitHub listed no patch. No nonexistent patch/unreviewed replacement was forced into the lockfile.
- `esbuild@0.27.4`: [Windows development-server file read](https://github.com/advisories/GHSA-g7r4-m6w7-qqqr); registry lists >=0.28.1 as patched. Local/CI environments are macOS/Linux; Windows remediation remains open. Do not publicly expose development servers; review a compatible upstream upgrade before Windows use.

These are not storefront runtime dependencies, but their risk is not fully resolved. Re-run `pnpm audit`; validate upgrades with tests, Theme Check, packaging and draft development. `.env*`, keys, CLI state, backups/screenshots and ZIPs are ignored; ignoring does not remove tracked secrets or replace scanning. Keep exports/customer data outside Git and rotate exposed credentials with owner participation.

## Approved Release and Rollback

1. Select the authoritative repo and verify the connected branch. Review the entire code diff and store-wide edits separately.
2. Privately back up the live theme/settings and affected catalog content; record the known-good commit/theme. Theme rollback does not undo product/filter changes.
3. Require a successful remote check and peer/owner review. Repeat hosted purchase and real-app/mobile checks. Approve live release explicitly.
4. Release one reviewed set; recheck variant/cart/checkout/support flows and reports. Orders/payment-mode changes need separate authorization.
5. On regression, preserve evidence without buyer data and notify the owner. With approval, restore the known-good theme or make a reviewed revert in the authoritative repo. Do not reflexively reset/force-push or reconnect.
6. Recheck shopping, document store-level reversals separately, and reproduce on the draft before retrying.

No rollback/publication automation is enabled.
