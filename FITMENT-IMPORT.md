# Fitment Import

Source: `products_export_1.csv`.

Only published, active products and explicit description-table rows are included. Prices, costs, inventory, image URLs, and raw descriptions are not exported to the fitment asset.

Model-year ranges are not supplied. Listed matches require year and installation-note confirmation; they are not a fitment guarantee.

```json
{
  "source": "products_export_1.csv",
  "sha256": "26af32745f373e2caf8da64305805b754e1a421fd1178f4d263cc5dd0e28dbad",
  "exportProducts": 190,
  "publishedProducts": 187,
  "productsWithTables": 141,
  "productsWithRecords": 130,
  "excludedUnpublishedProducts": 3,
  "reviewProducts": 95,
  "configurations": 258,
  "yearRangesProvided": false
}
```

## Needs Review

- `bootmod3-n63t3-bmw-g-series-m550-750i-m850i-x5m50i-x6m50i-x7m50i-tune`: No explicit fitment table
- `ae-drl-led-module-sets-f13-f12-f06-6-series-f13-f12-f06-6-series-m6`: No explicit fitment table
- `autobahn-essentials-led-smoked-sequential-turn-signal-indicators-for-bmw-g-series-pre-lci-g2x-g80-g82`: No explicit fitment table
- `carbon-fiber-m-style-mirror-caps-bmw-3-series-g20-1`: No explicit fitment table
- `ae-carbon-fiber-double-slat-grille-bmw-f06-f12-f13-6-series-m6`: No explicit fitment table
- `135i-7-intercooler-fmic`: Description contains restrictions; confirm installation notes
- `335i-7-intercooler-fmic`: Description contains restrictions; confirm installation notes
- `n54-n55-fmic-hose-upgrade`: Description contains restrictions; confirm installation notes
- `bmw-f10-550i-n63-intake`: Compound engine or body restriction needs review: N63/TU 4.4L
- `bmw-f10-550i-n63-n63tu-3-catless-downpipes`: Compound engine or body restriction needs review: N63/TU 4.4L; Description contains restrictions; confirm installation notes
- `bmw-650i-n63-n63tu-3-catless-downpipes`: Compound engine or body restriction needs review: N63/TU 4.4L; Description contains restrictions; confirm installation notes
- `f30-335i-intercooler-fmic`: Description contains restrictions; confirm installation notes
- `bmw-g30-m550i-n63r-3-catless-downpipes`: Compound model or embedded year needs review; Description contains restrictions; confirm installation notes
- `f25-x3-intercooler-fmic`: Description contains restrictions; confirm installation notes
- `bmw-n54-dual-cone-intake`: Unrecognized chassis value: Z4
- `mk7-gti-downpipe`: Compound model or embedded year needs review; Description contains restrictions; confirm installation notes
- `e60-535i-fmic-7-intercooler-kit`: Description contains restrictions; confirm installation notes
- `n63-n63tu-charge-pipes`: Compound engine or body restriction needs review: N63/TU 4.4L
- `n54-fender-decals`: No explicit fitment table
- `mk7-gli-downpipe`: Compound model or embedded year needs review; Description contains restrictions; confirm installation notes
- `mk7-gti-catted-downpipe-1`: Compound model or embedded year needs review; Description contains restrictions; confirm installation notes
- `mk7-gli-catted-downpipe`: Compound model or embedded year needs review; Description contains restrictions; confirm installation notes
- `f80-s55-intake-system`: Description contains restrictions; confirm installation notes
- `non-arm-motorsports-lower-chargepipe-upgrade`: Description contains restrictions; confirm installation notes
- `audi-8v-a3-catted-downpipe`: Compound model or embedded year needs review; Description contains restrictions; confirm installation notes
- `audi-8v-a3-downpipe`: Compound model or embedded year needs review; Description contains restrictions; confirm installation notes
- `mk7-fmic-kit`: Description contains restrictions; confirm installation notes
- `f12-650i-n63-intake`: Compound engine or body restriction needs review: N63/TU 4.4L
- `bmw-f01-750i-n63-n63tu-3-catless-downpipes`: Compound engine or body restriction needs review: N63/TU 4.4L; Description contains restrictions; confirm installation notes
- `f01-750i-n63-intake`: Compound engine or body restriction needs review: N63/TU 4.4L
- `n63-front-facing-intake-upgrade`: Compound engine or body restriction needs review: N63/TU 4.4L
- `bmw-charge-pipe-c-clip`: No explicit fitment table
- `b8-s4-s5-sq5-3-0t-intake`: Compound engine or body restriction needs review: 3.0T Cabriolet; Compound engine or body restriction needs review: 3.0T Coupe
- `mqb-1-8t-2-0t-turbo-inlet-upgrade`: Compound model or embedded year needs review
- `mk7-gti-intercooler-piping-upgrade`: Description contains restrictions; confirm installation notes
- `f30-n55-4-downpipe`: Missing or unrecognized make/model/engine
- `bmw-g-series-n63r-n63b-3-catless-downpipes`: Compound model or embedded year needs review; Description contains restrictions; confirm installation notes
- `mk7-gti-golf-r-intake`: Compound model or embedded year needs review; Description contains restrictions; confirm installation notes
- `n63-intake-replacement-filters`: No explicit fitment table
- `charge-pipe-meth-caps`: No explicit fitment table
- `mqb-turbo-muffler-delete-2`: Compound model or embedded year needs review
- `mk5-mk6-gti-downpipe-gasket`: No explicit fitment table
- `n54-inlet-2-to-1-75-reducer`: Description contains restrictions; confirm installation notes
- `sai-filter`: No explicit fitment table
- `n54-turbo-outlets`: Description contains restrictions; confirm installation notes
- `mk7-golf-1-8t-downpipe`: Description contains restrictions; confirm installation notes
- `mk7-golf-1-8t-catted-downpipe`: Description contains restrictions; confirm installation notes
- `f3x-n55-n20-n26-trans-vent-port-plug`: No explicit fitment table
- `n55-intake-f3x-335i-435i-235i-135i-m2`: Description contains restrictions; confirm installation notes; Missing or unrecognized make/model/engine
- `mk7-gli-fmic`: Description contains restrictions; confirm installation notes
- `vw-fit-kit`: Compound model or embedded year needs review
- `s58-carbon-engine-cover`: Description contains restrictions; confirm installation notes
- `7-5-fmic-hose-upgrade`: Description contains restrictions; confirm installation notes
- `n63r-intake-g30-m550i-g11-g12-750i`: Compound engine or body restriction needs review: N63R/TU2 4.4L
- `n55-catted-downpipe-f3x-4-ewg`: Missing or unrecognized make/model/engine
- `vw-mk6-competition-fmic`: Description contains restrictions; confirm installation notes
- `n63r-n63tu2-charge-pipes`: Compound engine or body restriction needs review: N63R/TU2/TU3 4.4L
- `n63tu3-g30-m550i-m850i`: Compound engine or body restriction needs review: N63B/TU3 4.4L; Compound model or embedded year needs review
- `bmw-n63-n63tu-midpipes`: Compound engine or body restriction needs review: N63/TU 4.4L
- `e-series-n55-downpipe`: Missing or unrecognized make/model/engine
- `s55-intake-replacement-filters`: No explicit fitment table
- `s58-intake-replacement-filters`: No explicit fitment table
- `bmw-f10-550i-n63-n63tu-3-catless-downpipes-copy`: Description contains restrictions; confirm installation notes
- `ae-drl-led-module-set-f90-m5-bmw-5-series-g30-g31`: No explicit fitment table
- `leather-audi-key-ring-quattro-s-line-audi`: No explicit fitment table
- `psm-style-carbon-fiber-trunk-for-f87-f22`: No explicit fitment table
- `ae-dry-carbon-seat-back-cover-set-for-bmw-f80-m3-f82-f83-m4-f87-m2-m2c`: Description contains restrictions; confirm installation notes; No explicit fitment table
- `real-carbon-fiber-automatic-shifter-trim-audi-a4-s4-rs4-b9-a5-s5-rs5-q5-q7-2016-2019`: No explicit fitment table
- `auotbahn-essentials-amber-drl-led-module-set-f87-m2-f22-2-series`: No explicit fitment table
- `illuminated-grille-for-f10-f11-f18`: No explicit fitment table
- `carbon-fiber-diffuser-mk2-tt-tts-ttrs`: No explicit fitment table
- `projector-led-puddle-lights-for-audi`: No explicit fitment table
- `carbon-fiber-lip-for-mk2-tt-tts-ttrs`: No explicit fitment table
- `genuine-carbon-fiber-engine-covers-for-bmw-s55-engines`: No explicit fitment table
- `g20-g22-m3-m4-g80-g82-carbon-fiber-rear-spoiler`: No explicit fitment table
- `dry-forged-carbon-fiber-s58-engine-cover`: Description contains restrictions; confirm installation notes; No explicit fitment table
- `dry-carbon-fiber-side-fender-cover-for-bmw-g8x`: Description contains restrictions; confirm installation notes; No explicit fitment table
- `tdd-motors-smart-led-trim-compatible-for-bmw-g-series-steering-wheel-bmw-g30-g01-m5-m8-x3-x5-525i-530i-540i`: No explicit fitment table
- `led-screen-trim-compatible-for-bmw-f-series-steering-wheel`: No explicit fitment table
- `bmw-m3-m4-g80-g82-g83-csl-style-dry-carbon-fiber-grille`: No explicit fitment table
- `ambient-led-center-console-dashboard-light-trim-for-bmw-3-4-series-f-chassis`: No explicit fitment table
- `metal-leather-car-key-case-cover-shell-with-leather-keychain-for-bmw-1-7-series-x-series-f20-g20-g30-g05-g11-f15-f16-g01-g02-f48-etc`: No explicit fitment table
- `real-carbon-fiber-steering-wheel-with-heated-and-led-shift-light-options`: No explicit fitment table
- `m-color-led-front-grill-for-bmw-3-series-g20-g21-2019-2022`: No explicit fitment table
- `ae-aluminum-engine-valve-cover-for-bmw-n54-135i-335i-335xi-335is-535i-xdrive-740i-x6-z4-3-0l-1`: No explicit fitment table
- `crank-seal-guard-for-n52-n54-n55-s55`: No explicit fitment table
- `bmw-aluminum-coolant-flange-n20-n52-n53-n54-n55`: No explicit fitment table
- `autobahn-essentials-magnetic-steering-wheel-paddle-shifters-for-bmw-e9x-e7x-aluminum-alloy`: No explicit fitment table
- `led-paddle-shifters-with-app-controller-for-bmw-f-g-series`: No explicit fitment table
- `carbon-fiber-magnetic-paddle-shifters-with-led-shift-light-option-fits-bmw-f-g-series`: No explicit fitment table
- `premium-leather-m-keychain`: No explicit fitment table
- `m-power-key-ring`: No explicit fitment table
- `new-led-light-car-gloss-black-front-bumper-grille-for-bmw-new-3-series-g20-g21-facelift-lci-2023-2024-sport-grill-double-slats`: No explicit fitment table
- `tricoloralcanterakeychain`: No explicit fitment table
- `56mm-68mm-floating-wheel-center-caps-bmw-50th-anniversary-g32-g38-g01-g08-g02-g05-f45-f46-f52-f48-f49-f39-f90-auto-accessories`: No explicit fitment table
