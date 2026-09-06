# W24 · T69 + T73 · the VAB turnaround, straight in through the main door

`workers/w24-vab.js` — a drop-in replacement for the whole W23 block that is currently spliced
into `app/shoot-for-the-moon.html` (lines ~3023–3589, the banner
`/* ── W23 · T65 · the turnaround, moved off the pad and into the VAB ──` down to the end of
`w23_vabStatic`). Same names, same signatures: `drawTurnaround`, `w23_vabStatic`,
`w23_shipInvalidate`, `w23_fitTasks`. Nothing in the app file was touched.

Three things changed: the route is a straight line, the `fuel` beat is a real propellant load,
and the building is roughly twice the content it was.

---

## 1 · The route (T69)

The looping S is gone. **One straight, level line at the ring's own depth.**

```js
const W23_RING  = [0.00,  0.420];      // = W23_VAB.padZ — the hold-down ring
const W23_BAY   = [-0.600, 0.420];     // the parking spot in the high bay
const W23_ROUTE = [W23_RING, W23_BAY];
const W23_WAIT  = 0.36;                // where the crawler waits, on the apron
function w23_route(u) { return { x: lerp(0, -0.600, u), z: 0.420 }; }
```

`z` never changes, so the crawler and the ship hold **scale 1** from the ring to the bay and back —
no perspective creep, and the p 0 / p 1 hand-overs with `drawPadScene` are exact by construction
(`R.s === q.s === 1`). The Catmull-Rom spline is gone; `w23_route` is a lerp.

**The door is the whole high bay.** The right-hand `bayFrac` share of the facade — the share that
faces the pad — is no longer a sawn cut but a framed opening: a door pier at `xm`, a second pier at
the pad-facing corner (`x1 … x1+0.022`, i.e. −0.42 … −0.398, still clear of the apron edge −0.38),
a header beam at `0.86h` with a chevron band, the rolled shutter above it with the house stripe and
a heavy bottom rail, chevrons up both piers, and two door beacons that flash while the crawler is
moving. The office share keeps the cut-away treatment (sawn edge + hatch) so all five floors stay
visible. The ship passes **behind** both piers — the near jamb crosses it as it goes in, which is
what sells the door.

**There is no haul road across the apron.** The apron cannot be painted over and there is only 0.04
of ground between it and `x1`, so `w23_haulRoad` now draws a chevroned concrete threshold at
x −0.455 … −0.362 plus two hairline guide marks (alpha 0.30) painted on the slab out to the wait
station. `w23_vabStatic` calls `w23_haulRoad` too, so the ground is identical between flights.

## 2 · The fuelling mechanism (T69)

The `fuel` beat was 6 % of the sequence and only parked the crane. It is now **0.690–0.800** and it
is a propellant load:

* **A propellant hall on the ground floor of the service block** (the floors loop starts at 1, so
  that floor was empty): two bullet tanks on saddles with insulation bands, a finned cold box /
  vaporiser with a pump skid, and a gauge board — two vertical bar gauges that fill with the load
  and a lamp that goes amber while propellant is flowing — with a loading controller standing at it.
* **A lagged transfer line** out of the hall, along the wall at floor-1 height, to a riser just
  inside the bay's left wall, with joint marks along its length.
* **A swing arm** off the riser at 0.55 body height that reaches out and mates with the ship's tank
  (`w23_fuelArm`), with a quick-disconnect head that goes white when it seats.
* **Frost** crawls the transfer line and then the arm while flow is on; **boil-off** puffs off the
  joint; a **vent plume** rises off the side of the ship's tank; **cold vapour** rolls along the bay
  floor under the stack.

Sub-timing inside the beat: arm out 0.690–0.722 · mated 0.722 · flow up 0.724–0.742 · gauges fill
0.722–0.778 · flow down 0.766–0.780 · arm back 0.778–0.800.

## 3 · What went into the building (T73)

**Inside, new:** the propellant hall and its line (above) · a fixed high catwalk along the back of
the bay at 0.76h with a hanger to the roof · a **fourth** work-platform level (0.14 / 0.34 / 0.54 /
0.72 h, was three) · a control cabin on stilts glazed over the bay at the door end · a parts rack
with six stored engine bells on two shelves and a spare nose cone · a spare tank section on a
wheeled cradle · a mobile access tower with a fitter on it · a pillar jib crane · a gas-bottle rack,
welding sets, tool chests and a cable drum · extraction ducting along the bay wall · four overhead
light pods with pools on the floor · painted lane lines · a back-wall stanchion-and-girt grid ·
five bands of wall lighting · a vent bank · roof-truss brackets on the crane rail · a mezzanine
bridge from floor 3 out over the bay with a man on it · glazed office partitions on floors 2 and 4 ·
duct runs under every slab · four equipment silhouettes per floor plus dark plant · floor number
plates · pipe risers up the far wall · nine lit windows per floor (was seven) · five more people.

**Outside, new:** the main door assembly (piers, header, shutter, chevrons, beacons, corner reveal)
· an external fire stair zig-zagging the door pier · two floodlight masts flanking the door · a roof
handrail all round · a comms mast with a dish · a bigger HVAC block · a sixth skylight strip · a
fifth roof fan · three obstruction lights (was one beacon).

The bridge-crane rail dropped from 0.90h to **0.82h** so it stays inside the door opening and the
lifted nose still clears the header; the nose-lift gap went 46 → 40 units for the same reason.

## 4 · The beat timeline

| p | what is on screen | stage |
|---|---|---|
| 0.000–0.045 | the crawler backs along the crawlerway onto the hold-down ring; the ship stands on the ring, engine bay steaming | `recover` |
| 0.045–0.085 | the tower arms hand the booster onto the deck and swing back (they fade out by 0.16) | `recover` |
| 0.085–0.290 | **the run** — dead straight, dead level, in through the main door. Two crew walk it in, one leads | `clean` |
| 0.290–0.355 | inside: four work platforms swing in to a ship's width, the bridge crane takes the top of the stack | `stack` |
| 0.355–0.470 | **it comes apart** — nose first, then the tank; the engine section stays on the deck | `stack` |
| 0.440–0.590 | work on the open joints: sparks, crews on the platforms and the floors | `stack` |
| 0.545–0.672 | **back together** — tank down first, then the nose | `stack` |
| 0.672–0.700 | the crane goes home, two platforms back off | `stack` |
| 0.690–0.800 | **propellant load** — arm out, mate, frost up the line, vent, gauges fill, arm away | `fuel` |
| 0.800–0.930 | **the rollout** — the same straight line back out to the ring | `check` |
| 0.930–0.970 | hard down: the ship steps off the deck onto the hold-down ring | `paper` |
| 0.970–1.000 | the crawler pulls off to the right, the pad crew back off behind a yellow safe line | `paper` |

`W23_BEATS` and `w23_stageAt` / `w23_fitTasks` are unchanged in shape; only the boundaries moved
(`clean` ends 0.290, `stack` 0.290–0.690, `fuel` 0.690–0.800, `check` 0.800–0.930).

## 5 · The footprint — the one place to retune

```js
const W23_VAB = { x0: -1.22, x1: -0.42, z0: 0.394, z1: 0.450,
                  hMin: 190, hPad: 115, bayFrac: 0.48, floors: 5,
                  padZ: 0.42, gyFrac: 0.34, doorTop: 0.86, markHW: 0.019 };
```

* Was `x0 −1.28 … x1 −0.42, z 0.392–0.458, hPad 74, bayFrac 0.36`. The building is a little
  narrower (more of it fits at 360 wide), a little shallower (the roof slab was eating the facade)
  and taller.
* **`hPad` and `doorTop` are coupled.** `h = max(hMin, (totalH + hPad) × 1.35)`; the header sits at
  `doorTop × h` and the crane rail at `0.82h`. The lifted nose has to pass under the crane, which
  needs `hPad ≥ 0.22 × totalH + 75` — at tier 10 (`totalH` 169) that is 112, so 115 has margin.
  Raise `hPad` if you lengthen the nose lift.
* Heights: 291 site units at tier 1, 311 at tier 5, 383 at tier 10.
* **The bay is only just wider than the ship.** Bay = `xm … x1` = −0.804 … −0.42 ≈ 64 px at DW 360;
  a tier-10 ship is ~40 px there. The parking spot sits right of centre (−0.600) on purpose, to
  leave room on the left for the riser and the swing arm. If you move `x0`/`x1`/`bayFrac`, move
  `W23_BAY[0]` with them or the arm will have nothing to reach across.
* Keep `z1 − z0` shallow (0.056 here); z reads as a steep vertical drop and a deep footprint turns
  the roof into a slab that swallows the facade.

## 6 · What the integrator must know

1. **Replace the whole W23 block** — `W23_VAB`/`W23_ROUTE`/`W23_BEATS`, every `w23_*`,
   `drawTurnaround`, `w23_vabStatic` — with this fragment. New names it introduces: `W23_RING`,
   `W23_BAY`, `W23_WAIT`, `w23_geom`, `w23_vabShell`, `w23_vabFloors`, `w23_fuelPlant`,
   `w23_vabBay`, `w23_vabRig`, `w23_fuelArm`, `w23_vabFacade`. No collisions with anything in the
   app — checked.
2. **`w23_ship_and_crawler` is deleted.** It was dead in W23 (a leftover worker fragment;
   `drawTurnaround` uses `w23_stack`). Per CLAUDE.md, one definition per drawing function —
   `grep -n '^function w23_' app/shoot-for-the-moon.html` should show no second copy.
3. **The site's static hangar still has to go**, exactly as W23 said: delete the old box in
   `w16_static` and call `w23_vabStatic(c, DW, DH, gy, S.tiers, rocketDims, now)` in its place. It
   reads `S.tiers`, so the `w16_layer` cache key must include the tier set (or call it live).
   `siteInvalidate()` / `w12_invalidate()` on resize, DPR change and theme change as usual.
4. **W22 leftovers that now sit inside the new building:** the *workshop shed* (x −0.48…−0.34,
   z 0.398–0.446) and the *store* (x −0.50…−0.42, z 0.352–0.376) are under / behind the facade and
   the door threshold. Delete them, or move the shed to x > −0.34. W22's *crawlerway*
   (x −0.88…−0.34, z 0.334–0.394) now lies just in front of the building and reads as the apron in
   front of the door — harmless, keep or narrow to taste. Everything else W22 draws at z > 0.458 is
   simply occluded by the taller building, which is expected.
5. **`w23_vabStatic` now also paints the crawlerway threshold and guide marks** (one call to
   `w23_haulRoad`) so the ground does not change under the player at `startTurnaround` /
   `finishTurnaround`.
6. **The ship is always drawn inside the building's clip.** The clip is the front-face rectangle
   with its right edge run out to x +0.75, so the ship — which travels behind that plane, at the
   ring's own z — is never cut and there is no inside/outside pop as it crosses the door. The
   facade (door piers, header) is painted after, so occlusion at the doorway is correct.
7. `w23_shipTile` / `w23_shipInvalidate` are unchanged: the three disassembly slices are blits, one
   draw each, at most three cached canvases, keyed on tier set + device scale.
8. `TURNAROUND_S`, `turnP()`, the call site in `drawPadScene` and the checklist are all untouched.
   `w2_person / w2_truckBase / w2_hook / w2_craneTop` are still `drawPad`'s — leave them.
9. Externals read: `gproj`, `drawCount`, `ART`. No `Math.random()` anywhere; motion is a function
   of `p` and `now` only (`w23_r(i)` is the seeded helper).

## 7 · Measured

Harness: the fragment + the app's real `gproj`, `rocketDims`, `drawRocket` (and its `w1_*` helpers)
and the ART palette, on a stand-in apron/ring/gantry —
`…/scratchpad/h/{harness.html, shot.mjs, zoom.mjs, exact.mjs, diff.mjs}`, Playwright/Chromium,
`deviceScaleFactor` 2 (3 for the close-ups), screenshots at p = 0, 0.1 … 1.0 plus the idle
building, every one looked at.

| viewport | logical | fps (2 s of rAF) | peak draws over 201 samples of p — tier 1 / 5 / 10 |
|---|---|---|---|
| 390 × 844 portrait | DW 360 × DH 779 | 60.1–60.4 | **122 / 131 / 147** |
| 1200 × 800 landscape | DW 750 × DH 500 | 60.1–60.5 | **122 / 131 / 147** |

Console errors and page errors: **none**, at every viewport and every tier.

The worst frame is a tier-10 whole-ship frame at 147 against the ~156 budget, of which ~40 is
`drawRocket` itself. W23 peaked at 99; the extra 48 is the new interior, the fuelling system and
the door. Six draws were given back on the way (the safety netting, the floor keep-clear hatch, the
crane-girder lattice and an annex that turned out to sit off-frame at every size; the floors' dark
plant and the roof dish were folded into neighbouring batches).

**Hand-over check** (tier 7, 360 × 779, the 80 × 130 css box around the ring):

| | differing pixels of 41 600 |
|---|---|
| p 1 vs. the idle `ready` frame | **36** (0.09 %) |
| p 0 vs. the idle `ready` frame | 2 047 — all of it the tower arms and the engine-bay steam, which are deliberate p < 0.16 overlays |

**Static vs. animated building**: a difference map (`diff.png`) over the building region shows only
1-px antialiasing seams on strokes — the two projections compose to the same screen coordinates
(`local` → `× padK about DW/2` → site), and every content position matches. Same as W23.
