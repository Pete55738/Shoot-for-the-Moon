# W25 · T71 / T72 / T74 / T75 — the front band of the launch site, revised

Fragment: `workers/w25-site.js` (self-contained, ~760 lines).
`app/shoot-for-the-moon.html` was **not** touched.

---

## 1 · What the integrator has to do

### 1.1 Delete these definitions and paste the fragment in their place

`W22_STAND_DX` · `w16_antennas` · `w16_warehouse` · `w16_yard` · `w16_stand` ·
`w16_frontage` · `w16_static`

Everything else in the W22 block stays. After the splice,
`grep -n '^function w16_' app/shoot-for-the-moon.html | sort` must show no name
twice (the T-lesson in CLAUDE.md).

**New names introduced** (checked against the app and against `w23-vab.js` —
no collisions): `W25_DEPTH` `W25_WH` `W25_CONT` `w25_frame` `w25_dish`
`w25_ribs` `w25_box`.

**Kept, unchanged — the fragment calls them:** `gproj` · `w16_quad` `w16_poly`
`w16_box` `w16_shed` `w16_lamp` `w16_tree` `w16_fenceRun` `w16_gradV`
`w16_gradH` `w16_ell` `w16_r` · `w16_vehicle` `w16_farm` `w16_industry`
`w16_admin` `w16_masts` `w16_roads` `w16_pad` `w16_helipad` `w16_concourse`
`w16_carpark` `w16_bunker` `w16_plaza` · `ART` `lerp` `drawCount`.
The shared anchors `W22_DOCK` / `W22_DOCKZ` / `W22_ROADZ` / `W22_RACKZ` are
**unchanged**, so every lorry, forklift and dock loader in `drawLife` still
lands exactly where it did.

### 1.2 THE ONE EDIT OUTSIDE THE FRAGMENT — `drawLife`, the grandstand rail

The terrace moved from z 0.104–0.160 down to **z 0.084–0.128** and narrowed, so
the three spectators at the rail are now standing in mid-air behind it. In
`drawLife`, in the `/* ── z .10–.15 · THE GRANDSTAND ── */` block, change one
line:

```js
/* was */ var rail = [[-0.130, 0.096], [0.018, 0.094], [0.148, 0.096]].map(…);
/* now */ var rail = [[-0.140, 0.090], [-0.108, 0.090], [0.132, 0.090]].map(…);
```

The `.map(… + W22_STAND_DX …)` tail stays exactly as it is — the constant is
still the single source of the shift, it has just changed value (−0.16 → −0.05).
Those three x's are chosen to sit clear of the GO! banner (which spans
stand-x ±0.105) and clear of the LAUNCH button. Nothing else in `drawLife`
needs touching.

### 1.3 Two things to be aware of (no action needed)

- `drawLife`'s golf cart runs the perimeter road at z 0.176/0.206 and is drawn
  after the static layer, so at the far-left end of its lap it passes *in front
  of* the container yard's back fence (z 0.158, 15 units tall) rather than
  behind it. It is a 2-frame-per-lap grazing overlap at the extreme left; I left
  it rather than move a live actor from another worker's block.
- The visitor plaza (`w16_plaza`, x 0.30…0.66) still has its bottom-right corner
  under the LAUNCH button in portrait. That is W22 behaviour, unchanged, and it
  is fully visible in landscape.

Cache keying is untouched: `siteInvalidate()` (and `w12_invalidate()`) on
resize / DPR change / theme change is still the rule and still enough.

---

## 2 · Layout table — revised extents

`gy = DH*0.34` ⇒ frame bottom **z 0.071**, horizon **z 0.626**. Deepest z this
fragment touches: **0.336**. (`w16_static`'s overall max is still 0.615, from
the farm and the industrial estate, unchanged.)

| element | was (W22) | **now** |
|---|---|---|
| **T71 dish farm** — compound | x −0.30…+0.16, z 0.232…0.288 | **x −0.34 … +0.21, z 0.226 … 0.296** |
| — back row of 3 dishes (R 17–19) | — | x −0.270 / −0.080 / +0.110, z 0.276–0.280 |
| — front row of 3 dishes (R 17–27) | — | x −0.245 / +0.005 / +0.175, z 0.236–0.240 |
| — equipment building + waveguide bridge | x −0.40…−0.34 | x −0.415 … −0.345, z 0.238–0.272 |
| — ground-support yard (moved east, off the dishes) | 0.19…0.37 | x 0.24 … 0.40, z 0.238–0.284 |
| — lighting columns | −0.34 / 0.16 / 0.66 | −0.36 / 0.23 / 0.66, z 0.226 |
| — fire station (**unmoved**) | −0.98…−0.74, z 0.272–0.334 | same |
| **T72 warehouse** — yard slab | x −0.82…−0.34, z 0.234…0.326 | **x −0.79 … −0.335, z 0.228 … 0.292** |
| — the shed itself | (open frame + rear canopy) | **x −0.755 … −0.375, z 0.292 … 0.334, h 56→67** |
| — fence (2 legs + one front run, gates left open on both road spurs) | −0.85…−0.31 | west leg −0.775, east leg −0.315, front −0.60…−0.44, all z 0.222–0.300 |
| — gatehouse + barrier (moved to the east gate, off the fire station) | −0.90…−0.855 | x −0.295 … −0.250, z 0.204–0.220 |
| **T74 container yard** | x −0.72…−0.24, **z 0.118…0.198** (half of it under the road) | **x −1.05 … −0.45, z 0.076 … 0.158** |
| — 3 stack columns | −0.66…−0.31 | x −0.90 / −0.745 / −0.59 |
| — 3 rows | z 0.130–0.182 | z 0.148 / 0.116 / 0.086 |
| — reach stacker | (straddle crane, x −0.72…−0.24) | machine at x −0.545, z 0.090; box held over the slot at x −0.590, z 0.116 |
| — back fence + yard sign | — | z 0.158, x −1.05…−0.44 |
| **T75 grandstand** (through `Pstand`) | stand-x ±0.20, z 0.104…0.160, `DX −0.16` | **stand-x ±0.155, z 0.084 … 0.128, `DX −0.05`** |
| — world x | −0.36 … +0.04 | **−0.205 … +0.105** |
| — rows × seats | 5 × 11 | 4 × 12, rise 7.6/row (was 10) |
| **T75 spectator entrance** (was "frontage", in front of the stand) | stand-x ±0.30, z 0.078…0.106 | **stand-x −0.375 … −0.185, z 0.096 … 0.158** (world −0.425 … −0.235) |
| — zebra crossings + 2 signboards (now drawn UNSHIFTED) | shifted with the stand | road-relative: crossings at x −0.355…−0.27 and 0.545…0.63, z 0.164–0.216; signs at x −0.90 and +0.68, z 0.150 |
| **hedge band** (front framing) | \|x\| > 0.26, z 0.080–0.084 | **x +0.14 … +1.07 only** — the west half of the front band is the container yard now |

### Clearances, measured at 360×462 (the tight case)

| | screen px |
|---|---|
| LAUNCH button occupies | x ≥ **216.7**, y ≥ **402.7** |
| grandstand right edge | **205** (11.7 px clear of the button) |
| grandstand top (back wall) | sy **390.8** |
| perimeter road, front edge | sy **392** → the terrace now stops **1.2 px short of the road**, footprint and silhouette both. Was: the back row sat on the road surface. |
| container yard east edge | sx 74 · entrance plaza 81…129 · stand 130…205 · button 217 — the front band packs left-to-right with no collisions |

Deliberately off-frame: the container yard's west column (x −0.90) runs off the
bottom-left corner at every size. That is the "farther bottom left" the note
asked for — the yard reads as continuing past the frame.

---

## 3 · What was added

**T71 — the dishes.** Each antenna is now built in its own aperture frame.
`w25_frame(az, el)` carries the rim circle's two in-plane basis vectors through
the same oblique projection the ground uses (`screen = (X, −(Y + 0.45·Z))`), and
`w25_dish` sets that 2×2 as a canvas transform, so the ellipse, the panel gores,
the hoops and the rim are all *correct* for that pointing rather than a hand-
tuned squash — and the three feed legs land on the rim because they are struck
from it. Per dish: concrete pad and shadow, tapered pedestal with a door, rungs
and a cable duct, an azimuth turret, an elevation yoke with two trunnions and a
jack-screw, a counterweight, the back hub and eight radial ribs showing around
the rim, the reflector (concavity gradient + 12 gores + 2 hoops + vertex plate +
a bright lip and a dark outer rim), a three-legged feed support to the focus and
a horn with a visible aperture and sub-reflector cap. Six pointings, all checked
so the **concave face is the side turned to the camera** (`cos az·cos el −
0.42·sin el < 0` for all six — az 112°…223°, el 32°…49°). Dishes are 17–27 units
of aperture radius, up from 11–19.

**T72 — the warehouse.** A clad distribution shed instead of an open frame:
ribbed back wall with a clerestory strip, the east flank, a mono-pitch roof
(56 front → 67 back) with sheeting ribs, three roof-light strips and three
rooftop air handlers, a blue fascia band carrying a chevron mark and
**SITE LOGISTICS**, a gutter and two downpipes. The front stays open to the
camera, because `drawLife`'s forklifts shuttle inside it: three racking rows
with uprights, three beam levels and shrink-wrapped pallets. The dock face got
what a dock actually has — a raised platform, three recessed openings, a
half-closed roller shutter on bay 2, rubber bumpers either side of every bay,
folded-out dock levellers, a gooseneck dock light and a red/green traffic light
per bay, stencilled bay numbers, guide lines and a hatched keep-clear strip.
Yard: pallet stack, gas cage, two skips, five cones, chain-link with both road
gates open, gatehouse and barrier.

**T74 — the container yard.** Moved into the bottom-left corner and out from
under the perimeter road. `w25_box` draws a real box: corrugation as a shaded
rib and a lit rib per pitch, top and bottom rails, seams between stacked boxes,
the roof plane with its own ribs, **corner castings on all six visible corners**,
a door end on about half of them (two leaves, four lock bars, a placard) and a
small stencilled owner code in the top-left corner where it belongs. Nine
stacks, one to three high, on a marked hardstand with lane lines and row letters
A/B/C. A **reach stacker** — big front wheels, cab, counterweight, a two-stage
telescopic boom and a lift ram — is lowering a container into the empty slot in
row B on a spreader beam with twist-lock legs.

**T75 — the seating.** Lower (z 0.084, from 0.104), centred (`W22_STAND_DX`
−0.16 → −0.05), narrower and flatter (4 rows of 12, rise 7.6/row instead of 5
rows of 10) and given a **solid back wall**, so its silhouette ends in a crisp
line and stops short of the road instead of bleeding into it. The GO! banner
dropped onto the front rail so it no longer covers the front row. The old
turnstile frontage could not stay in front of the terrace — there is no z left
there — and gates in front of a stand were backwards anyway, so it became a
**gated entrance plaza on the west side**: paving, a VISITORS arch, four
turnstiles facing the road, a queue rope, a ticket booth, bins, and a footpath
up to the perimeter road with the zebra crossing lined up on it.

---

## 4 · Measured numbers

Rendered headless (Playwright/Chromium, DPR 2 and DPR 5 for the crops), the
fragment spliced onto the app's own `gproj`, primitives and palette.

| | 360×462 | 360×779 | 900×500 |
|---|---|---|---|
| static layer draw count (cached → **1** `drawImage` per frame) | **832** | **832** | **832** |
| same layer, W22 baseline | 594 | 594 | 594 |
| console + page errors | **0** | **0** | **0** |
| max z asked of `gproj` | 0.615 | 0.615 | 0.615 |

Per function (360×462), new vs W22:

| | W22 | **W25** |
|---|---|---|
| `w16_antennas` (incl. GSY, lamps, fire station) | 55 | **182** |
| `w16_warehouse` | 73 | **111** |
| `w16_yard` | 58 | **116** |
| `w16_stand` | 22 | **23** |
| `w16_frontage` | 10 | **24** |
| whole static layer | 594 | **832** (+40 %) |

Cost to build the layer once: **2.57 ms** (mean of 20 builds at 360×462, DPR 2).
It is blitted once a frame thereafter, so the per-frame cost is unchanged at
1 draw. **Nothing was added to `drawLife`** — the live layer is untouched at
141–191 draws, and no `Math.random()` appears anywhere in the fragment
(`w16_r(i)` only).

---

## 5 · Known compromises

- The warehouse's east flank is ~3 px wide on screen. In this projection a plane
  of constant x is almost vertical, so side walls barely show; the read comes
  from the roof, the fascia and the dock face instead.
- The reach stacker's boom passes behind the container it is holding (the box is
  drawn last). At the scale it appears in game that reads correctly; at 5× zoom
  the join is visible.
- The dish farm and the warehouse yard abut at x −0.34/−0.335. They do not
  overlap, but there is no grass between them — deliberate, they share a kerb.
