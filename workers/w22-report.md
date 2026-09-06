# W22 · T66 — the rebuilt launch site

Fragment: `workers/w22-site.js` (self-contained, ~1100 lines). Nothing in
`app/shoot-for-the-moon.html` was touched.

---

## 1 · What the integrator has to do

**Delete these definitions from the app and paste the fragment in their place**
(the fragment redefines each of them):

`w16_farm` · `w16_roads` · `w16_stand` · `w16_carpark` · `w16_watertower` ·
`w16_antennas` · `w16_yard` · `w16_helipad` · `w16_static` · `drawLife`

**Keep, unchanged — the fragment calls them and will break without them:**

`gproj` · `w16_layer` / `w16_cache` / `siteInvalidate` / `w16_theme` / `w16_r` /
`w16_gradV` / `w16_gradH` / `w16_ell` · `w16_quad` · `w16_box` · `w16_tank` ·
**`w16_pad`** · `w16_vehicle` · `w16_masts` · `w16_bunker` ·
`w17_rnd` / `w17_cyc` / `w17_seg` / `w17_ease` · `w17_person` · `w17_sheep` ·
`w17_flag` · `w17_windsock` · `w17_tractor` · `w17_truck` · `w17_cart` ·
`w17_jet` · `w17_birds` · `w17_heli` · `w17_scientist`

**New names introduced** (no collisions with anything in the app — checked):
`w16_poly` `w16_shed` `w16_col` `w16_sphere` `w16_htank` `w16_stack` `w16_cool`
`w16_pylon` `w16_lamp` `w16_tree` `w16_fenceRun` `w16_industry` `w16_hangar`
`w16_admin` `w16_concourse` `w16_warehouse` `w16_plaza` `w16_frontage`
`w17_bigtruck` `w17_forklift` `w17_car` `w17_smoke`, and the shared anchors
`W22_HZ` `w16_POND` `w16_HELI` `w16_FLAGPOLES` `W22_DOCK` `W22_DOCKZ`
`W22_ROADZ` `W22_RACKZ` `W22_DOOR`.

### TWO REQUIRED EDITS IN `drawSite()` — do not skip these

The pond and the flagpoles moved, so `drawSite`'s two live blocks now paint on
bare grass and will show as artefacts. `drawLife` paints both correctly instead.
Delete from `drawSite`:

1. the `// live: pond ripple` block — the 4 lines from
   `const pd = P(0.60, 0.545), wob = …` through `c.fill(); drawCount++;`
2. the `// live: American flags on the three poles` `for` loop — 6 lines.

Everything else `drawSite` does still lands unchanged (sea glint, sailboat, the
four floodlight glows, the gantry and crane beacons, the windsock) because
**`w16_pad` and the apron furniture did not move**.

Nothing about cache keying changed: `siteInvalidate()` (and `w12_invalidate()`)
on resize / DPR change / theme change is still the rule, and still enough.

---

## 2 · Layout table

`x` −1…+1 across the site, `z` 0 (front edge) → 1 (horizon). At `gy = DH*0.34`
the frame bottom is **z 0.071** and the horizon **z 0.626**; the usable band is
therefore 0.078 … 0.62. Measured max z actually used: **0.615**. The screen half-
width shrinks with depth, so the usable |x| is ≈0.72 at z 0.10, ≈0.89 at z 0.30,
≈1.11 at z 0.50 — anything wider is deliberately run off-frame.

### Reserved — untouched
| element | x | z |
|---|---|---|
| **pad apron** (slab, trench, hold-down ring, gantry, crawler crane, chevrons, floodlight masts) | −0.38 … +0.38 | 0.305 … 0.475 |
| lightning masts + catenary | ±0.36 | 0.492 |

### Left / back — the industrial estate (new; was the farmhouse)
| element | x | z |
|---|---|---|
| works hardstand | −1.55 … −0.02 | 0.476 … 0.615 |
| estate roadway | −1.55 … −0.02 | 0.468 … 0.478 |
| cooling tower | −0.70 | 0.608 |
| banded chimney (h 150) · flare mast (h 162) | −0.52 · −0.365 | 0.606 · 0.600 |
| 4 process columns (h 100–148) + pipe bridge | −1.30 … −0.92 | 0.576 … 0.588 |
| 3 spherical gas tanks | −0.82 / −0.68 / −0.575 | 0.570 … 0.592 |
| 3 bullet tanks on saddles | −1.30 / −1.06 / −0.84 | 0.526 … 0.534 |
| process block · boiler house | −1.55…−1.16 · −0.50…−0.30 | 0.542–0.566 · 0.556–0.578 |
| 3 process sheds (roller doors) | −1.50…−1.10, −1.04…−0.72, −0.66…−0.42 | 0.482 … 0.518 |
| long pipe rack on trestles | −1.45 … −0.06 | 0.542 … 0.552 |
| conveyor gantry | −0.90 … −0.78 | 0.498 … 0.532 |
| road-tanker loading rack + 2 tankers | −1.20 … −0.94 | 0.478 … 0.492 |
| gas-bottle cages, cable drums | −0.90 … −0.63 | 0.492 … 0.502 |
| substation (4 transformers) + 2 pylons + line | −0.30…−0.10; pylons −0.40, −1.02 | 0.490 … 0.526 |
| **control house behind the rocket** | −0.30 … −0.16 | 0.552 … 0.574 |
| **chiller shed + tank pair + pylon behind the rocket** | −0.14 … +0.02 | 0.486 … 0.556 |
| water tower (moved here from x 0.86) | −0.24 | 0.540 |
| base perimeter fence (returns around the estate) | 1.45 → −0.02, then back to horizon | 0.468 / −0.02 leg |

### Right / back — the farm (moved across)
| element | x | z |
|---|---|---|
| crop fields (10 strips, drill rows, hedgerows) | 0.16 … 1.58 | 0.470 … 0.615 |
| **farmhouse** (gabled, red roof) | 0.54 … 0.70 | 0.556 … 0.586 |
| barn | 0.78 … 0.90 | 0.572 |
| silo | 0.99 | 0.584 |
| **pond, far right** (reeds + live ripple) | 1.00 ±0.12 | 0.535 ±0.03 |
| wind pump | 0.30 | 0.556 |
| orchard / tree line (9 right + 4 far-left) | 0.22 … 1.42 ; −1.24 … −0.94 | 0.494–0.510 ; 0.600–0.610 |
| horizon band: hills, far range, sea sliver, shore town | raw screen | beyond the plane |

### Mid band
| element | x | z |
|---|---|---|
| vehicle assembly building (h 88, glazed door, roof fans) | −0.96 … −0.52 | 0.376 … 0.464 |
| workshop shed · store | −0.48…−0.34 · −0.50…−0.42 | 0.398–0.446 · 0.352–0.376 |
| **crawlerway** VAB → apron (replaces the old camera-facing road) | −0.88 … −0.34 (+ spur −0.86…−0.62) | 0.334 … 0.394 |
| **fire station** + 2 appliances + siren mast | −0.955 … −0.74 | 0.272 … 0.334 |
| **administration building** (3 glazed storeys, parapet, dish, ADMIN sign) | 0.52 … 0.88 | 0.410 … 0.462 |
| admin entrance canopy, steps, clipped hedges | 0.53 … 0.83 | 0.382 … 0.412 |
| admin staff bays (4 cars) | 0.40 … 0.50 | 0.412 … 0.462 |
| **helipad** (far right) + windsock mast + heli shed + taxi path | 0.84 ±0.16 ; shed 0.90–1.02 | 0.360 ±0.06 ; shed 0.396–0.428 |
| **concourse** paving | 0.34 … 0.78 | 0.302 … 0.396 |
| — grass panels (2) + kerb | 0.360–0.575, 0.655–0.765 | 0.316 … 0.384 |
| — pool, benches ×6, planters ×4, lamps ×4, trees ×3 | 0.395 … 0.765 | 0.310 … 0.388 |
| — 3 flagpoles (flags are live) | 0.400 / 0.455 / 0.510 | 0.312 |

### Front band
| element | x | z |
|---|---|---|
| **open-fence warehouse**: yard slab, 3 dock bays, 3 rack rows, open steel frame + rear canopy, chain-link with 2 gates, gatehouse + barrier, skips | −0.85 … −0.31 | 0.228 … 0.332 |
| dish farm (6 dishes) + equipment box | −0.40 … +0.16 | 0.232 … 0.288 |
| ground-support yard: 2 generator trailers, 3 cable drums | 0.19 … 0.37 | 0.238 … 0.284 |
| **car park (shrunk** from 0.46–0.96 → 0.42–0.78, 2×6 bays**)** + 2 lamps | 0.42 … 0.78 | 0.242 … 0.298 |
| perimeter road + 4 spurs + east service road to admin | −1.35 … 1.35 ; service 0.80–0.98 | 0.160 … 0.220 ; 0.216–0.408 |
| road lighting columns ×3, 2 zebra crossings, 2 signboards | −0.86 … 0.68 | 0.150 … 0.226 |
| control bunker (unchanged `w16_bunker`) | 0.70 | 0.208 |
| container yard (3×5 stacks) + straddle crane | −0.72 … −0.24 | 0.118 … 0.198 |
| **visitor plaza**: 3 awninged food stalls, 3 parasol tables, bollards, bins, tree | 0.30 … 0.66 | 0.096 … 0.180 |
| spectator frontage: paving, 5 turnstiles, rope line | −0.30 … 0.30 | 0.078 … 0.106 |
| **grandstand — bottom centre** (5 rows × 11, rail, GO! banner) | −0.20 … 0.20 | 0.104 … 0.160 |
| foreground hedge bands (left and right of the stand) | \|x\| > 0.26 | 0.080 … 0.084 |

---

## 3 · The live layer (`drawLife`)

| # | event | where | clock |
|---|---|---|---|
| 1 | fighter jet + trail | sky | 22 s (24 % visible) |
| 2 | bird V | sky | 15 s |
| 3 | plant: 2 smoke plumes, guttering flare, 4 obstruction lights | z 0.60 | 3.4 s / 0.09 s / 0.42 s |
| 4 | pond ripple | z 0.535 | 0.7 s |
| 5 | tractor ploughing the right fields | z 0.508 / 0.546 | 26 s |
| 6 | 3 grazing sheep + farmer walking house ↔ pasture | z 0.494–0.552 | 40 s |
| 7 | **helicopter**: in from the right, lands, spins down, **2 passengers walk to ADMIN**, spins up, out | helipad → 0.700, 0.392 | 46 s |
| 8 | **4 staff walking to and from ADMIN** across the concourse (each vanishes inside for 8 % of its cycle) | z 0.298 → 0.386 | 24 / 27 / 33 / 39 s |
| 9 | **3 scientists, admin ↔ the pad**, stopping to write; all read their boards during flight | 0.62→0.21, 0.52→0.30, 0.40→0.13 | 36 / 43 / 50 s |
| 10 | fuel bowser + driver, now on the **crawlerway** (was the old front road) | z 0.352, x −0.98 … −0.20 | 44 s |
| 11 | 3 flags on the concourse poles | z 0.312 | continuous |
| 12 | **3 articulated lorries**: in from the left → dock bay → 49 % of the cycle loading → out to the right | road z 0.190 ↔ dock z 0.252 | 54 s each, offset |
| 13 | **forklift per occupied bay**, 5 shuttles rack → dock carrying a pallet, empty on the way back | z 0.300 ↔ 0.264 | 5 laps per dock stay |
| 14 | 3 dock loaders (carry / watch) + a checker with a clipboard pacing the rack line | z 0.246 / 0.284 | 31 s |
| 15 | golf cart on the perimeter road, both lanes | z 0.176 / 0.206 | 19 s |
| 16 | a car arriving at, and later leaving, the car park | z 0.182 ↔ 0.246 | 37 s |
| 17 | 3 spectators at the grandstand rail (one waving; all point up during flight) | z 0.094 | continuous |

`flight` suppresses the bowser and turns the scientists, the concourse idlers and
the spectators to looking up; `turnaround` pins the bowser to its hose-connected
stretch — the same contract the old `drawLife` had.

---

## 4 · Measured numbers

Rendered headless (Playwright/Chromium) at **390×844** and **900×600**, the
fragment spliced onto the app's own `gproj` + primitives + palette.

| | 390×844 | 900×600 |
|---|---|---|
| static layer draw count (cached → **1** `drawImage` per frame) | **614** | **614** |
| live layer draw count, min … max over a 120 s sweep | **141 … 191** | **141 … 191** |
| `drawLife` cost, mean over 4123 frames | **0.60 ms** | **0.69 ms** |
| console errors over 90 frames × 4 viewports, `ready` + `flight` | **0** | **0** |

Old site for comparison: static 232, live ~95. So the static layer is 2.6× and
the live layer ~1.9× — "twice as complicated", and the live layer still leaves
~96 % of a 16.7 ms frame for the rocket and the chrome.

### Ground-contract check
`gproj` was instrumented to record every `z` the two entry points ever ask for,
across `w16_static` plus 90 `drawLife` frames at 4 viewports:

```
390x844   max z used = 0.6150   highest ground point sy = 295.3  (gy = 287.0)  OK
900x600   max z used = 0.6150   highest ground point sy = 210.0  (gy = 204.0)  OK
360x560   max z used = 0.6150   highest ground point sy = 196.0  (gy = 190.4)  OK
1280x720  max z used = 0.6150   highest ground point sy = 251.9  (gy = 244.8)  OK
```

Every ground point projects **below** the horizon line at every size. The
constant `W22_HZ = 0.615` is the single cap — keep new content under it.

---

## 5 · What was added, what was cut

**Added:** the industrial estate (24 elements), the administration building, the
concourse, the open-fence warehouse and its truck yard, the fire station, the
visitor plaza, the ground-support yard, the spectator frontage, the crawlerway,
the east service road, zebra crossings, road lighting, site signboards, the
straddle crane, the wind pump, pond reeds, a sixth dish, and four new live
actors (lorries, forklifts, cars, smoke).

**Cut, and why:**
- **The camera-facing crawlerway and its dashes** — the user asked for no road at
  bottom centre; the grandstand stands on that ground now. The crawlerway was
  re-routed VAB → apron, which is also where a crawlerway actually goes.
- **The drainage creek and its culvert** (was z 0.088–0.104) — it ran straight
  under the new grandstand. There was nowhere in front of the stand to keep it.
- **The fuel farm at x 0.60–1.02** — replaced by the admin building, as asked.
  The propellant it stood for moved to the estate (spheres + bullet tanks) and
  the pad-side tanker route now runs on the crawlerway.
- **The shepherd-carries-a-sheep routine** — replaced by a farmer walking between
  the farmhouse and the pasture. Carrying a sheep across a working launch site
  stopped making sense once the ground between them became industrial.
- **The old three flagpoles at x −0.26…−0.16, z 0.145** — they stood inside the
  new grandstand. Three poles moved to the concourse frontage.
- **The foreground hedge at z 0.012** — it projected to sy ≈ 1.15·DH, i.e. it had
  been drawing entirely off the bottom of the frame for the whole of round 6. The
  band is now at z 0.080–0.084, where it is actually visible, and it opens in the
  middle so it frames the grandstand instead of hiding it.

## 6 · Things to watch when integrating

- `w16_pad` is called from the new `w16_static` at the same point in the order
  (after the masts, before the bunker) — do not reorder it, W19's catch tower and
  the rocket both assume the apron it paints.
- Only one definition of each function must survive the splice. After pasting:
  `grep -n '^function w16_' app/shoot-for-the-moon.html | sort` should show no
  name twice — the T-lesson in CLAUDE.md about the duplicated W1 rocket block.
- `w16_farm` still takes `(c, P, DW, DH, gy)` and `w16_roads` now takes
  `(c, P, part)` where `part` is `'back'` or `'front'`. It is called twice from
  `w16_static`; that is deliberate, the crawlerway must go under the apron and
  the perimeter road must go over the warehouse.
- The fragment uses only `function` declarations and `var` at top level, so it
  can be pasted anywhere in the round-6 section without TDZ problems.
- The flare tip and chimney tip are recomputed in `drawLife` from the same
  literals `w16_industry` uses (`P(-0.50, 0.604) h 132`, `P(-0.365, 0.600) h 162`).
  If you move either stack, move both copies.
- Checked against `workers/w23-vab.js` (the other worker's fragment sitting in
  this directory): it is entirely `w23_*` / `W23_*` prefixed and paints its own
  turnaround view, so there is no name collision. One thing to keep in mind:
  `W23_ROUTE` ends at `(-0.575, 0.425)`, the VAB door on the site plane. The
  assembly building narrowed slightly here (was x −1.00…−0.46, now −0.96…−0.52,
  z 0.376–0.464), so that endpoint is still inside its footprint — but if W23
  ever draws its crawler on the site scene, re-check that door x.
