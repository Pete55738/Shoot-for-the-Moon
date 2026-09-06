# W23 · T65 · the VAB turnaround

`workers/w23-vab.js` — a drop-in replacement for `drawTurnaround(c, gy, DW, DH, p, t, now,
drawRocketFn, rocketDimsFn)`, same signature, plus `w23_*` helpers. Nothing in
`app/shoot-for-the-moon.html` was touched.

The on-pad rebuild is gone. In one shot: the caught booster comes off the tower onto a
crawler-transporter, creeps across the site to a cut-away vehicle assembly building, is taken
apart and put back together in the high bay, and rolls back out to the pad.

## Beat timeline (p 0..1 across `TURNAROUND_S`)

| p | what is on screen | checklist stage |
|---|---|---|
| 0.000–0.045 | the crawler backs in from the right and parks over the hold-down ring; the ship still stands on the ring, engine bay steaming | `recover` |
| 0.045–0.085 | the tower arms hand the booster onto the deck and swing back to the gantry (they fade out by p 0.16) | `recover` |
| 0.085–0.345 | **the ferry** — out along the haul road toward the camera, left across the site, then a turn in and straight back through the open front of the bay. Two crew walk it across, one leads. The ship grows and shrinks with the projection on the way | `clean` |
| 0.345–0.415 | inside: the work platforms swing in to a ship's width, the bridge crane trolley comes over and the hook takes the top of the stack | `stack` |
| 0.415–0.535 | **it comes apart** — nose lifts first, then the tank; the engine section stays on the deck. Three open joints, fitters at two of them | `stack` |
| 0.500–0.640 | work on the open joints: sparks, crews on the platforms and on the floors | `stack` |
| 0.600–0.712 | **back together** — the tank comes down first, then the nose | `stack` |
| 0.712–0.775 | the crane goes home, the platforms swing out | `fuel` |
| 0.775–0.925 | **the rollout** — the same route in reverse, back to the ring | `check` |
| 0.925–0.968 | hard down: the ship steps off the deck onto the hold-down ring | `paper` |
| 0.968–1.000 | the crawler pulls off to the right, the pad crew back off behind a yellow safe line | `paper` |

At **p = 1 the ship is exactly where `drawPadScene` draws it** for `phase === 'ready'` — base at
local `(DW/2, gy−4)`, scale 1, painted by the real `drawRocketFn` (not a cached tile), so the
hand-over at `finishTurnaround` is seamless. Same at p = 0, so the frame after the catch matches.

## Checklist stages

`W23_BEATS` is the table above, `[stage, pFrom, pTo, note]`, and `w23_stageAt(p)` returns the stage
name. The stage names are the app's existing ones (`STAGE_LABEL`: recover · clean · stack · fuel ·
check · paper), in the same order `startTurnaround` already picks them, so the existing checklist
keeps working untouched — `showChecklist`/`hideChecklist`/`tickTurnaround` need no change.

To make the commentary line up exactly with the picture (recommended, one line):

```js
turn = { tasks: w23_fitTasks(tasks, total), t0: performance.now(), total, ... };
```

`w23_fitTasks` re-times each task so it runs while its stage is on screen, keeping the tasks'
relative weights inside the stage; a `mishap` pair takes the first 38 % of the stage that follows
it. It rewrites `start` and `dur` only — the list, the bar and `cl-title` are unaffected.

## The VAB footprint — the one place to retune

```js
const W23_VAB = { x0: -1.28, x1: -0.40, z0: 0.392, z1: 0.458,
                  hMin: 164, hPad: 74, bayFrac: 0.36, floors: 5,
                  padZ: 0.42, gyFrac: 0.34 };
const W23_ROUTE = [[0,0.420],[0.03,0.325],[-0.28,0.305],[-0.52,0.352],[-0.575,0.425]];
```

* Site coordinates throughout, everything under z 0.62; `x1 = −0.40` stays clear of the apron
  (x ±0.38, z 0.305–0.475). `x0` runs off the left edge of a 360-wide frame on purpose — the
  building is meant to be too big to fit.
* **Height** is `max(hMin, (rocket totalH + hPad) × 1.35)` site units: 164 at minimum (twice the 82
  the old hangar stood), 204 for a tier-1 rocket, 328 for tier 10. It has to grow — the lifted nose
  must clear the lintel — so `hPad` is the knob if you re-time the separation.
* **Keep z0..z1 shallow.** z reads as a steep vertical drop in this projection; a deep footprint
  turns the roof into a slab that swallows the facade. 0.066 deep is about the limit.
* `bayFrac` is the right-hand share of the width that is open high bay (the rest is five service
  floors). The ship parks at `W23_ROUTE[4]`, which should stay the bay's centre if you move `x0/x1`:
  `x = x1 − bayFrac × (x1 − x0) / 2`.
* The route is a Catmull-Rom through those five points; last point inside the bay, first point on
  the ring. Anything crossing z0 flips from being drawn outside the building to inside its clip.

## What the integrator must know

1. **The static hangar has to go.** `w16_static` still draws the old box at x −1.00..−0.46 / h 82.
   Delete that block (the box plus its door/stripe/rib detail) and call
   `w23_vabStatic(c, DW, DH, gy, S.tiers, rocketDims, now)` in its place — the same building with
   the bay empty, the platforms parked and the hook stowed, drawn in site screen space. Verified:
   the static and animated buildings land pixel-on-pixel. It reads `S.tiers`, so the cache key for
   `w16_layer` must include the tier set (or call it live, it is ~40 draws) — otherwise the bay
   stops growing when the rocket does. `siteInvalidate()` on resize/DPR/theme as usual.
2. **The ship cache.** `w23_shipTile` bakes the rocket into an offscreen canvas once per tier set +
   device scale, used only for the three slices during the disassembly (1 draw each instead of ~30).
   Whole-ship draws go through `drawRocketFn` as normal. Call `w23_shipInvalidate()` alongside
   `siteInvalidate()` if you want it dropped on a DPR change; it is keyed on device scale anyway, and
   holds at most 3 canvases. One cosmetic consequence: the tier-9+ nose beacon does not pulse while
   the stack is apart.
3. **Nothing else in the app changes.** `TURNAROUND_S`, `turnP()`, the call site in `drawPadScene`
   (`c.translate(-DW/2, 0); drawTurnaround(c, 4, …)`) and the checklist are all as they were.
4. `w2_person / w2_truckBase / w2_hook / w2_craneTop` are no longer used by the turnaround but are
   still used by `drawPad`, so leave them.
5. The helpers are self-contained (`w23_*`) except for `gproj`, `drawCount` and `ART`, which they
   read from the app.
6. No `Math.random()`; motion is a function of `p` and `now` only. `w23_r(i)` is the seeded helper.

## Measured

Harness: the fragment + `gproj` + the real `drawRocket`/`rocketDims` + the ART palette on a
stand-in pad, `/tmp/…/scratchpad/w23/` (`harness.html`, `shot.mjs`), Playwright/Chromium,
`deviceScaleFactor: 2`, screenshots at p = 0, 0.1 … 1.0.

| viewport | logical | fps (2 s of rAF) | peak draws (tier 1 / 5 / 10) |
|---|---|---|---|
| 390 × 844 portrait | DW 360 × DH 779 | 60 | 74 / 82 / 99 |
| 900 × 600 landscape | DW 750 × DH 500 | 60 | 74 / 82 / 99 |

Console errors: none. The budget was ~156; the worst frame is a tier-10 whole-ship frame at 99, of
which ~30 is `drawRocket` itself. The disassembly frames — the busiest picture — cost 60–62,
because the three slices are blits.
