# W26 — T81/T82 · one continuous journey

**Deliverable:** `workers/w26-journey.js` (540 lines, self-contained, evaluates as-is — the
harness loads it into the live page with `eval` and overrides the app's definitions, which is
how every number below was measured against the real app rather than a mock).
**Harnesses:** `workers/w26-probe.mjs` (per-frame continuity trace) and `workers/w26-shots.mjs`
(exact-time scene captures). Screenshots in `workers/w26-shots/` — the three contact sheets
(`sheet-after-390x844.png`, `sheet-after-1200x800.png`, and `sheet-compare-390.png`, which is
the before/after pair at the same instants) plus the 390×844 first/last frame of every phase.
Re-generate any of them with `node workers/w26-shots.mjs [--after] [--w W --h H]`.

---

## 1. What was wrong

The trip was five whole-frame views, each computing the ship's screen position from its own
geometry — `orbitRing` about a centred Earth, `jrnyFree`'s lemniscate about an Earth in the
lower-left, `jrnyLunar` about a Moon somewhere else again. Nothing tied them together, so at
every camera change the ship teleported and the 0.45 s cross-fade was there to hide it.
Measured on a real mission-5 flight at 390×844: **283 px** at orbit→transfer, **138 px** at
transfer→moonorbit, **307 px** at back→reentry, **141 px** at reentry→descent, **48 px** at
pitch→orbit — plus a 0.82 scale step at each pad boundary and up to 170° of heading snap.
At 1200×800 the worst was **425 px**.

The Moon end of the transfer path was not circular either: `jrnyFree`'s small lobe is a
lemniscate lobe, between 1.4 and 1.8 Moon radii round, while `jrnyLunar` is a true circle at
1.42 R — so the shape changed at the moment the view did, and the ship changed with it.

## 2. The revised geometry

**One world.** Earth at the origin with radius 100 world units; the ring around it is the same
1.45 R ellipse (`rx 1.02`, `ry 0.72`) it always was; the Moon is 820 out at radius 50, with a
true circle at 1.42 R about it. The only viewport-dependent number is the Moon's *direction*,
which leans from −70° (portrait) to −19° (landscape) so the wide camera can frame both bodies.

**One camera.** A camera is nothing but "where the Earth's centre is on screen and how big it
is" — `jcam(DW, DH, k)`, `k` ∈ 0…3, interpolated on log-scale about the world point at screen
centre so a camera move reads as a zoom, not a slide:

| k | camera | it used to be |
|---|--------|---------------|
| 0 → 1 | Earth centred at (0.5 DW, 0.52 DH), radius 0.20 → 0.30 of the short side | `drawOrbitView` / `orbitEarth` — same numbers |
| 1 → 2 | pull back until the Earth ring, the Moon and the lunar circle all fit, with a 6 % margin | `drawTransferView` / `jrnyFree`'s Earth-lower-left framing |
| 2 → 3 | push in until the Moon is `min(0.20 DW, 0.24 DH)` and centred | `drawMoonApproach` / `jrnyLunar` |

`orbitEarth`, `orbitRing`, `jrnyMoon` and `jrnyLunar` are now four-line wrappers over `jcam`,
so `orbitRing` is still the single definition of the Earth ring and `jrnyLunar` is still a true
circle — they just cannot drift from the camera any more.

**One path.** `jpath(DW, DH, jt, mission)` returns position *and tangent* in world units for a
single parameter that runs across the whole trip:

```
jt 0…1  the Earth ring          orbit      angle lerps across the mission's arc
jt 1…2  the outbound leg        transfer   Hermite, ring tangent → lunar tangent
jt 2…3  two laps of the Moon    moonorbit  aIn + 4π
jt 3…4  half a lap round the corner (26 %), then the return leg   back
jt 4…5  the Earth ring again    reentry    aRe + 2.6 rad
```

Missions that skip a phase skip its whole unit interval; because segment 3 begins exactly
where segment 2 does, a mission-2 free-return swing-by still joins up with nothing special.

**No kinks, by construction.** Three angles are derived, never tuned:

- `aIn = atan2(−ux, uy)` — the lunar angle whose tangent is the Earth→Moon direction. The
  outbound Hermite ends there with that tangent, so it *touches* the circle rather than
  crossing it. This is the T82 ask: the transfer's Moon lobe and the lunar circle now agree in
  position, radius **and** tangent, because they are the same circle.
- `aOut = aIn + π` — half a lap on, where the tangent is Moon→Earth. The ship comes round the
  corner and only then peels off, already pointing home.
- `aRe = atan2(ux/rx, uy/ry)` — the ring angle whose tangent is the return leg's heading.

Both legs are cubic Hermites with unit end tangents scaled to 0.9 of the chord — the largest
scale that stays free of an inflection loop at every viewport tested. T60's property (no kink
where the two legs cross) is kept for the same reason it held before: both halves are C¹.

**Two ends onto the pad.** `jmix` blends the ship's whole station (base point, heading, scale)
onto another scene's own station: the pad's `(DW/2 + drift, DH*0.58, ang, 1)` over the first
22 % of `orbit` and the last 34 % of `reentry`, and the cargo scene's ship station over the
last 26 % of `moonorbit` and the first 26 % of `back`. The blend is on the **base point** —
`drawRocket`'s own origin — because that is the one reference the pad, the chopsticks and the
journey all agree on; blending centres would leave a half-body offset that grows with tier.

The cross-fade paints the *outgoing* view too, with the current frame's state, so the state
function also pins the outgoing half: during `descent` the journey view holds the ship on the
pad's live station (flap pivot included), during `cargo` it holds it on the cargo station, and
during the first part of `orbit` `view.ang` is held at −1.52 so the pad ghost does not swing
round with the ring angle.

**One view function.** `drawOrbitView`, `drawTransferView` and `drawMoonApproach` are all
`drawJourney` now. They keep their names because `drawView`, the cross-fade and `SCENE_OF`
address them by name — but since both sides of every fade paint the same world at the same
camera, the fade has nothing left to hide. Bodies pick their renderer by apparent radius and
cross-fade over a band (`w26_earthBig` ↔ `w10_earth` over R 34–48; `w15_moonBody` ↔ `w10_moon`
over 24–34), so nothing pops as the camera moves. Home never leaves the frame: past the edge
it clamps to a margin at a minimum radius, which is continuous. The Moon fades instead.

## 3. Measured continuity — mission 5, real flight, every frame

Reference point is `drawRocket`'s origin (the base of the body), sampled in the same units in
every scene. Δpx / Δdeg / Δscale are the **frame-to-frame** step across the boundary.

### 390 × 844

| boundary | before Δpx | after Δpx | before Δdeg | after Δdeg | before Δscale | after Δscale |
|---|---|---|---|---|---|---|
| ascent → pitch      | 0.1 | 0.2 | 0.3 | 0.4 | 0.000 | 0.000 |
| pitch → orbit       | **48.1** | **0.0** | 92.9 | 0.0 | 0.818 | 0.000 |
| orbit → transfer    | **283.3** | **0.0** | 77.2 | 0.0 | 0.017 | 0.000 |
| transfer → moonorbit| **137.6** | **0.2** | 56.3 | 0.0 | 0.012 | 0.000 |
| moonorbit → cargo   | **125.1** | **0.0** | 169.7 | 0.0 | 0.024 | 0.000 |
| cargo → back        | 8.8 | **0.0** | 121.5 | 0.0 | 0.036 | 0.000 |
| back → reentry      | **306.9** | **0.0** | 136.1 | 0.0 | 0.017 | 0.000 |
| reentry → descent   | **140.9** | **0.6** | 158.9 | 1.7 | 0.818 | 0.000 |
| **worst step, whole flight** | **306.9 px** | **14.6 px** | | | | |

### 1200 × 800

| boundary | before Δpx | after Δpx | before Δdeg | after Δdeg |
|---|---|---|---|---|
| pitch → orbit        | 43.4 | 0.0 | 92.9 | 0.0 |
| orbit → transfer     | 425.2 | 0.0 | 86.3 | 0.0 |
| transfer → moonorbit | 224.8 | 0.5 | 47.2 | 0.0 |
| moonorbit → cargo    | 177.0 | 0.0 | 169.6 | 0.0 |
| cargo → back         | 16.1 | 0.0 | 130.5 | 0.0 |
| back → reentry       | 420.8 | 0.0 | 127.1 | 0.0 |
| reentry → descent    | 177.8 | 0.9 | 158.9 | 1.7 |
| **worst step, whole flight** | **425.2 px** | **23.9 px** | | |

The residual 0.6–0.9 px / 1.7° at reentry→descent is `descent`'s own idle wobble
(`Math.sin(t*1.3)*0.05` on `view.ang`, ±2.9°) — the station itself matches exactly.

The worst *in-phase* step also improved, because the joins removed the lunges:

| phase | 390×844 before → after | 1200×800 before → after |
|---|---|---|
| orbit     | 9.5 → 6.9 px | 13.2 → 9.6 px |
| transfer  | 4.7 → 4.0 px | 6.5 → 4.8 px |
| moonorbit | 16.2 → 14.6 px | 48.2 → 23.9 px |
| back      | 6.5 → 7.7 px | 10.1 → 14.0 px |
| reentry   | 24.4 → 11.2 px | 63.1 → 12.2 px |

The remaining worst frame in the whole flight is mid-`moonorbit` — two laps of a circle whose
screen radius reaches 272 px in landscape. It is intended motion, not a jump, and it is faster
than everything else on screen; if it ever reads as a whip, lengthen `moonorbit`.

Every mission was flown end to end with zero console errors:

| mission | fps | worst step | worst boundary step |
|---|---|---|---|
| 1 (LEO) | 59.9 | 13.2 px (in orbit, the retro flip) | 0.2 px |
| 2 (swing-by) | 59.9 | 11.1 px | 0.6 px |
| 3 | 59.9 | 14.6 px | 0.1 px |
| 4 (land) | 60.0 | 14.7 px | 1.1 px |
| 5 (cargo) | 60.0 | 14.6 px | 0.4 px |

## 4. Cost

`drawCount` median over the whole flight: **88 → 78**. Per journey frame: orbit 65, transfer
73–77, moonorbit 73, back 72, reentry 66 (max 156 in any journey frame). The old views were
65–67 median with maxima of 131–179, so this is level — the whole-trip dashed line is one
stroke and the body cross-fade only costs an extra body inside a narrow radius band. The pad
scene is **untouched** and still peaks at 363.

fps over the flight, headless Chromium, DPR 1: 390×844 **60.0 → 59.7**; 1200×800 **58.1 →
57.9** (the landscape figure is the harness's own ceiling; before and after are the same).

No `Math.random()` anywhere; every position is a function of the phase progress, and only the
dash offsets, the star twinkle and the idle flame read `now`.

## 5. What the integrator must change outside the fragment

1. **Splice the fragment** into the app in place of the functions it replaces, and **delete**:
   - `jrnyFree` (superseded — the eight is now the two Hermite legs). After splicing,
     `grep -n '^function jrnyFree' app/shoot-for-the-moon.html` must print nothing, and
     `grep -c '^function drawOrbitView\|^function drawTransferView\|^function drawMoonApproach\|^function w21_path\|^function drawView\|^function orbitRing\|^function orbitEarth\|^function jrnyLunar\|^function jrnyMoon'`
     must be 9 — one each.
   - the old `orbitEarth`, `orbitRing`, `jrnyMoon`, `jrnyLunar`, `drawOrbitView`,
     `drawTransferView`, `drawMoonApproach`, `w21_path`, `drawView`.
   `jrnyEarth` stays — `drawCargoDrop` still uses it for its decorative marble.
2. **`view` initialiser** (line ~1360): add `jt: 0, jcam: 0, jmix: 0, jmixTo: null`.
3. **`runFlight`'s `frame()`**: one line. Immediately after
   `view.scene = SCENE_OF[ph.name] || 'pad'; view.p = p; view.phaseName = ph.name;`
   add `w26_journeyState(view, ph.name, p, DW, DH);`
   Then delete, from the phase branches only, the lines that `w26_journeyState` now owns:
   - `orbit`/`reentry` branch: the `to`/`from` consts, both `view.ang =` lines, the two
     `view.retro =` lines and `view.zoom =`. Keep `view.km`, `view.v`, `view.burning`,
     `view.flame`, `view.heat`, `view.forces` and the `paid` gate.
   - `transfer`/`back` branch: `view.jp =`, `view.zoom =`. Keep `view.p`, `view.km`, `view.v`,
     `view.heat`, `view.forces`, the `paid` gate.
   - `moonorbit` branch: `view.ang =`, `view.zoom =`. Keep the rest.
   - `land`/`cargo` and `descent` branches: nothing to delete.
4. **`FLIGHT_PLAN`** in the balance block: replace with `W26_FLIGHT_PLAN`'s rows (phase seconds
   only — no other balance number is touched). Mission 5 goes 21.6 s → 25.6 s of flight:
   `orbit` 1.9→2.6 (the pad join eats 22 % of it and the sweep must stay near T80's 69 °/s),
   `moonorbit` 1.7→3.4 (two laps of a much bigger circle), `back` 2.5→3.2 (it now flies half a
   lap round the corner first), `reentry` 1.1→2.0 (the pad dive eats 34 % and the loop runs at
   ~74 °/s). Missions 1–4 change in the same way; mission 0 is unchanged.
5. **CLAUDE.md**: the "journey is one arc (T50)" bullet describes geometry that is gone — the
   `orbitRing`/`jrnyEarth`/`orbitEarth` split, `ORBIT_FROM`, and the Moon getting "two full
   laps" as a separate thing. Rewrite it around `jcam` / `jpath` / `jship` and point at a new
   `docs/JOURNEY.md` for the derivation of `aIn` / `aOut` / `aRe`.
6. **`node scripts/sim.mjs`** does not read any of this (the balance block only loses
   `FLIGHT_PLAN` seconds), but run it anyway to confirm the gate still passes, and re-run
   `node scripts/shot.mjs --all` for the study round.

## 6. Known limits

- The `descent` idle wobble (±2.9°) is the only residual discontinuity, and it belongs to the
  pad scene. Removing it means touching `descent`, which was out of scope.
- `view.ang` during `orbit`/`reentry` is a ring angle, so the pitch gauge reads a large number
  there. That was already true; it is now also held at −1.52 while the pad join is mixed in.
- `w21_path` for the journey kinds returns a *window* of the path around the ship rather than
  the whole trip, because `drawJourney` already draws the whole trip and `drawTrajectory`'s
  40-sample budget cannot resolve two laps of a small circle spread over five segments.
  `drawTrajectory` itself is untouched.
- The lunar laps are the fastest thing on screen (14–24 px/frame). Nothing is wrong with them,
  but they are the next candidate if anyone says the Moon "whips past".
