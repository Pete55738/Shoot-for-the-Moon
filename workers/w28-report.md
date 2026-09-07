# W28 · T95 — rocket progression: white/silver, a flag, and a futuristic top end

Fragment: `workers/w28-rocket.js`. Replaces **`w1_scheme`** and **`drawRocket`**, adds two
private helpers (**`w1_flag`**, **`w1_glowbar`**). Same signatures, same `rocketDims`
(untouched), same `opts` contract (`heat`, `bayOpen`, `flaps`, `wakeDir`).
`w1_grad`, `w1_engine`, `w1_passenger`, `w1_window`, `w1_bay`, `w1_heat` are unchanged and
still required.

## 1 · The four material schemes are gone

`w1_scheme(hull)` now returns white-or-silver at every tier. The *look* moves through four
"eras" of trim, carried in a new `era` field (0–3) plus `fin`, `trim`, `band`, `glow`,
`tier`. Body gradients are all light: `lo` #9BA5AE–#BFCEDA, `hi` #F6F9FC–#FFFFFF. No red
paint, no gold foil, no black carbon anywhere — the darkest thing on the ship is the
tile band at hull 7–8 and the engine skirt, which are hardware, not livery.

`kind` is still returned and is **`'steel'` for every tier**, deliberately — see §5.

## 2 · Tier by tier

| hull | era | what you see |
|---|---|---|
| 1 | 0 | Plain white shell, rivet rows, a single grey skirt band. The starter rocket. |
| 2 | 0 | + a denser rivet grid and a faint grey waist shadow at mid-body. |
| 3 | 0 | + a grey shoulder ring at the top of the tank. Still obviously "little rocket". |
| 4 | 1 | Panelled white: four vertical panel seams, a dark service band at the skirt with a white highlight. |
| 5 | 1 | + top ring and a five-block "UNITED STATES" tick row below the window. Reads as a *programme* vehicle. |
| 6 | 1 | + the black roll-pattern checker at mid-body (Saturn-style; black on white is trim, not body colour). |
| 7 | 2 | White upper over a **brushed-silver lower stage** (its own light gradient), horizontal stringers, dark join ring, a heat-tile band above the skirt. |
| 8 | 2 | Same, taller tile band and a silver shoulder trim strip. Heaviest, most industrial tier. |
| 9 | 3 | **Futuristic.** Pearl-white seamless hull (tank seams suppressed), a pearl specular column, two silver strakes/rails flanking the body with a cyan light line inside each, a silver collar at the shoulder, a lit "impulse" ring above the skirt, cyan-lit fin leading edges, cyan window halo, cyan-lit flap edges, cyan nose band and tip beacon. Brighter skirt and bells. |
| 10 | 3 | Everything from 9 plus: a second lit ring low on the tank, a **saucer collar** disc proud of the hull below the nose, a cyan rim light down both body edges, and a cyan arc on the nose. Reads clearly sleeker and lit-up next to 9. |

Silhouette family is unchanged at every tier — same body/nose/fins/flaps geometry, so the
pad, catch, VAB and journey all still place the ship off `rocketDims` exactly as before.

## 3 · The flag

`w1_flag(c, cx, cy, w, h, k)`, drawn on the lower third of the tank, left of centre, above
the skirt band (and above the tile band on 7–8 — its `y` is offset by the band height so it
never sits on the tiles).

* Size: `h = clamp(bodyH * 0.13, 6.5, 15)`, `w = min(h * 1.6, bodyW * 0.60)` — it grows with
  the ship instead of being a fixed decal, and can never spill past the hull.
* **LOD by drawn size, not by tier.** `k` = device pixels per local unit, read once from
  `c.getTransform()` (`hypot(a,b)`, so it is correct under the journey's rotation and scale
  as well as DPR). Drawn height ≥ 10 px → 13 stripes; ≥ 5 px → 7 stripes; below that → 3.
  Stars appear only at ≥ 7 px (4×3 dots), ≥ 5 px is a solid canton.
* A dark 55 %-alpha frame is essential: white stripes on a white hull vanish without it. Its
  line width is `0.9/k` clamped to `h*0.14`, so it stays ~1 device px and never eats the flag.
* Cost: 4 draws (5 with stars).
* Verified legible at the journey size (35 px ship → ~6 px flag, canton + stripes still read
  as a flag at 4× nearest-neighbour magnification) and crisp at pad size.

## 4 · The exhaust blur is gone (bonus item)

`c.filter = 'blur(4px)'` on the outer plume is **removed**. It is replaced by three stacked
plume skirts (widths 1.80/1.52/1.28, alphas .11/.15/.26) filled with one vertical gradient
that fades to transparent — pre-softened, no filter. Visually the halo is the same soft
cone; measured it is much cheaper.

`w1_heat` still uses `blur(5px)`; I did not touch it (out of the fragment's scope, and it
only runs during re-entry). No new filters anywhere in the fragment.

## 5 · What the integrator must do outside the fragment

1. **Delete the old `w1_scheme` and `drawRocket`** rather than appending — one definition
   each. After splicing, `grep -n '^function drawRocket' app/shoot-for-the-moon.html` and
   `grep -n '^function w1_scheme'` must each print exactly one line.
2. **Nothing else is required.** The VAB/turnaround copy of the ship (`w18_*`, ~line 8889)
   branches on `S.kind`; because `kind` is now `'steel'` for all ten tiers it paints grey
   fins and a plain white body, which is the correct answer everywhere now. Its
   `kind === 'paint' / 'foil' / 'carbon'` branches become dead code.
3. **Optional follow-up (recommended, but not mine to do while you are in the file):** those
   three dead branches in the w18 block can be deleted, and the block can be brought in line
   with the pad by reading the new scheme fields — `S.fin` for the fins, `S.trim` for the
   flaps, and `S.era` for the tile band / rails. Without it the turnaround ship is simply a
   plainer white version of the same vehicle, which is consistent but less detailed than the
   pad view. The flag is not drawn in the VAB copy either.
4. `w1_scheme` is called with `t.hull`; it now clamps and rounds, so it is safe for any tier.

## 6 · Measurements

Harness: Playwright chromium, `deviceScaleFactor: 2`, ships drawn at 110 px (pad) and 35 px
(journey), `now = 3000`. Draw counts are `drawCount` for **one** `drawRocket` call.
Images in `/tmp/claude-0/-home-user-Click-Me/b96ab016-08df-5bb3-b62a-a8b9f13665c3/scratchpad/`:
`w28-pad-110.png`, `w28-small-35.png`, `w28-zoom-small.png` (4× nearest-neighbour),
`w28-zoom-9-10.png`, `w28-flame.png`, `w28-heat.png`, `w28-flaps.png`, `w28-bay.png`
(and `w28old-*.png` for the before).

**Draws per call, idle ship (before → after):**

| tier | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| before | 14 | 18 | 19 | 20 | 23 | 27 | 27 | 32 | 36 | 39 |
| after | 20 | 24 | 26 | 27 | 31 | 35 | 35 | 39 | 49 | 57 |

Identical at 35 px and 110 px (the flag's LOD changes what it draws, not how many calls —
the stars path drops out below 7 px, −1).

**Draws with options (t1 / t5 / t10), before → after:**

| case | before | after |
|---|---|---|
| flame on | 17 / 26 / 44 | 25 / 36 / 64 |
| heat 0.8 | 19 / 28 / 44 | 25 / 36 / 62 |
| flaps 1 | 26 / 35 / 51 | 32 / 43 / 73 |
| bayOpen 1 | 25 / 35 / 51 | 31 / 43 / 69 |

The rise is +4/5 for the flag at every tier, +3 to +5 for the extra era trim at 4–8, and
+13/+18 for the lit hull at 9–10.

**Frame rate — three burning ships at 110 px, 2 s of `requestAnimationFrame`, dpr 2:**

| tier | before (with `blur(4px)`) | after |
|---|---|---|
| 1 | 46.3 fps | **59.5 fps** |
| 5 | 51.0 fps | **60.1 fps** |
| 10 | 49.8 fps | **60.1 fps** |

So the ship draws ~50 % more shapes and still runs at the 60 fps cap, because the blur was
the whole cost. Console errors: none in any pass.

## 7 · Things I deliberately did not do

* No new canvas filters, no `Math.random()` (the two glows pulse on `now/380` and `now/420`),
  no image assets, no change to `rocketDims`.
* No change to the passenger, window, bay or heat helpers — the flag sits clear of the bay
  door frame except on the very shortest tank (hull 1 + tank 1), where an open bay door
  overlaps its top edge for the few seconds the door is open. Checked in `w28-bay.png`; it
  reads fine, but if you want it perfect, drop the bay by 3 units on `tank <= 2`.
