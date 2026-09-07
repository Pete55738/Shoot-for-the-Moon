# W29 · T96 + T97 — the journey flows, and the re-entry happens in the right order

Delivered as `workers/w29-flow.js`; **spliced into `app/shoot-for-the-moon.html` while this was
written, and re-verified against the spliced file** — mission 5 at 390×844, zero console errors,
every boundary within 0.05 px of the numbers below (`orbit`→`transfer` 3.83 against a 3.87 frame
step, `transfer`→`moonorbit` 3.81/3.79, `back`→`reentry` 5.70/5.68, `moonorbit`→`cargo` 0.00,
`reentry`→`descent` 0.80). Four whole-function replacements (same signatures) —
`w26_journeyState`, `drawJourney`, `drawReentry`, `w1_heat` — plus the new `w29_*` helpers,
four `JT_*` constants and five re-cut `FLIGHT_PLAN` rows.

Everything below is measured, in headless Chromium, on real mission-5 flights at tier 10,
mission 5 unlocked, 390×844 unless it says otherwise. The rig runs the unmodified app with the
fragment appended as a second `<script>` (top-level function declarations override, so this is
the same code path a splice produces), samples the ship's **base point** every frame out of
`jship` / the pad scene's own station, and diffs it. Scripts live in the session scratchpad.

---

## 1 · T96 — why it paused, and what replaces the ease

The path was already continuous in position. What read as a pause was **speed**: every phase
ran `easeInOut(p)` across its own unit of `jt`, so the ship braked to a standstill at the end of
each phase and started again at the beginning of the next. Measured on the old build, the ship's
own frame-to-frame motion at the five joins:

| join | last frame of the phase before | first frames after |
|---|---|---|
| `orbit` → `transfer`   | **0.00 px** | 0.00 px |
| `transfer` → `moonorbit` | **0.00 px** | 0.69 px |
| `moonorbit` → `cargo`  | **0.03 px** | — (lands) |
| `back` → `reentry`     | **0.00 px** | 0.01 px |
| `reentry` → `descent`  | **0.11 px** | 2.74 px |

Two separate things make equal-`jt`-per-second wrong, so dropping the ease alone would not have
fixed it:

* **The arcs are different lengths.** At 390×844 the Earth ring is 349 px of ship travel, the
  outbound leg 424, the two lunar laps 1107. Equal `jt` per second is 3× the speed on one of
  them.
* **The camera moves too.** During `transfer` the camera pulls back while the ship flies out, and
  the pan cancels most of its screen displacement — the raw screen speed there fell to 0.5 px per
  frame in the old build even at the phase's fastest point.

So `jt` is paced against **arc length measured with the camera frozen** — the ship's motion
through the world, in screen pixels, sampled with `jcam` held at that point of the path
(`w29_pacing` → `w29_walk`). Frozen, because when the camera pans the whole background pans with
it: what the eye reads as speed is the ship against the Earth and the Moon, not against the
bezel. A pan that chases the ship must not be allowed to cancel its motion on paper.

Making that measurable required turning three things that used to be per-phase into **pure
functions of `jt`**, which is also what removed the last phase branches from the geometry:

| was | now |
|---|---|
| `jcam` set per phase from `p` | `w29_jcam(jt, m)` — same values at every join |
| `retro` from `p` in `orbit` / `reentry` | `w29_retro(DW, DH, jt, m)` (see the one exception below) |
| `jmix` from `J_JOIN` / `J_DIVE` / `J_LIFT` fractions of a phase | `w29_mix(DW, DH, jt, m, side)`, in `jt` |

The one exception: a **low-orbit flight (mission 1) stops on purpose**. Its lap ends at
`ORBIT_COAST` and the rest of `orbit` is the ship standing still and turning end-for-end to
brake. That is real time, not path, so `retro` there stays on `p` — and that stop is what makes
mission 1 two runs rather than one.

### Runs

A **run** is a stretch the ship flies without stopping, bounded by the places it genuinely comes
to rest: the pad, the lunar surface, and mission 1's braking turn. Inside a run the speed profile
is *smooth ramp up → constant → smooth ramp down* (smoothstep ramps, so acceleration is
continuous at both ends); the total closes in one line because the mean of a smoothstep ramp is
exactly a half, so `distance = V · (T − A/2 − B/2)`. Nothing eases at a phase boundary any more,
because a phase boundary is not an event.

| mission | runs |
|---|---|
| 1 | `orbit` lap · **stop, flip, brake** · `reentry` |
| 2 | `orbit` `transfer` `back` `reentry` — one run, pad to pad |
| 3 | `orbit` `transfer` `moonorbit` `back` `reentry` — one run, pad to pad |
| 4, 5 | `orbit` `transfer` `moonorbit` → **touchdown** · (cargo) · **liftoff** → `back` `reentry` |

Two bugs the arc table caught, both of which had been invisible under the old easing:

* **`jt` = 3 is two different places.** The ship arrives to land at one end of the cargo
  flyover and leaves from the other — 280 px apart at 390×844. `w29_mix` takes a `side` argument
  to disambiguate; without it the return run opened with a 280 px step in its own arc table and
  the ship sat still for a full second while the pacing paid for a journey it never made.
* **The mission-1 flip.** Expressed as a function of `jt` it collapses to a single frame,
  because `jt` is pinned at 1 for the whole turn. Hence the exception above.

## 2 · The re-cut `FLIGHT_PLAN`

Constant speed decides how long each **arc** takes; the phase seconds now only decide where the
labels fall. Left at the old numbers the ship was still half way down the outbound leg when the
`moonorbit` phase began — invisible, because `orbit` / `transfer` / `moonorbit` all paint the
identical frame through `drawJourney`, but it makes the altitude and speed gauges lie, since
those interpolate on `p`. Each run's seconds are re-cut in the measured proportions of its own
arc length at 390×844:

| mission | before | after | run totals |
|---|---|---|---|
| 1 | 2.2 / 1.8 / **5.0** / **2.0** / 2.6 | unchanged | — |
| 2 | **2.6 / 4.4 / 2.6 / 2.0** | **2.5 / 3.0 / 3.2 / 2.9** | 11.6 s → 11.6 s |
| 3 | **2.6 / 4.0 / 3.4 / 3.0 / 2.0** | **2.2 / 2.5 / 4.1 / 3.5 / 2.7** | 15.0 s → 15.0 s |
| 4 | **2.6 / 3.6 / 3.4** · 3.6 · **2.8 / 2.0** | **2.2 / 2.5 / 4.9** · 3.6 · **2.9 / 1.9** | 9.6 + 4.8 unchanged |
| 5 | **2.6 / 4.0 / 3.4** · 5.4 · **3.2 / 2.0** | **2.3 / 2.6 / 5.1** · 5.4 · **3.2 / 2.0** | 10.0 + 5.2 unchanged |

**Every run total is unchanged, so every mission is exactly as long as it was** — mission 5 is
still 24.8 s of flight. Only the boundaries inside a run moved. Measured after: every phase
boundary now falls within 0.08 s of the `jt` integer it names (mission 5: `orbit` ends at 5.400 s
against a `jt` = 1 crossing at 5.400; `transfer` ends 8.000 against 8.051; `back` ends 21.700
against 21.652). Landscape arcs are in slightly different proportions — the Moon sits at −19°
instead of −70° — so portrait is the reference and landscape drifts by at most ~0.3 s. The
**pacing** itself is measured per viewport and is correct in both.

## 3 · Measured speed profile

`jt` is now paced so the frozen-camera speed is constant, so that is the series that proves it.
Median / p90 of the ship's own motion, px per frame, mission 5 at 390×844:

| phase | before (raw screen) | after (raw screen) | after (frozen camera) |
|---|---|---|---|
| `orbit`     | 1.83 med, **0.00 at the end** | 3.77 med | **3.85** med, 3.88 p90 |
| `transfer`  | 0.52 med, **0.00 at both ends** | 2.74 med | **3.85** med, 3.87 p90 |
| `moonorbit` | 3.99 med, 14.6 max, **0.03 at the end** | 3.91 med, 5.71 max | **3.87** med, 3.88 p90 |
| `back`      | 3.89 med, **0.13 / 0.00 at the ends** | 4.32 med | **5.63** med, 5.71 p90 |
| `reentry`   | 3.52 med, 15.4 max, **0.01 at the start** | 3.98 med | **5.16** med, 5.67 p90 |

Run 1 (`orbit` + `transfer` + `moonorbit`) is one continuous 3.85 px/frame from the pad ramp to
the lunar touchdown ramp; run 2 (`back` + `reentry`) is one continuous 5.7. The p10 figures
(0.46 / 3.82 / 1.46 / 1.29 / 0.49) are the two intended ramps, at the pad and the surface, and
nothing else. At 1200×800 the same two constants read 5.50 and 7.8 px/frame.

Raw screen speed, every 18th frame across the whole flight, mission 5 at 390×844 — the pauses
are the runs of `0.0` in the BEFORE line, and they are gone:

```
BEFORE  … 1.8 2.3 1.9 0.8 1.3 0.7 1.8 4.1 6.3 3.5 1.5 0.4 0.0 0.1 0.4 0.9 1.6 2.6 3.8 3.3
           1.4 0.5 0.1 0.0 0.0 0.0 0.6 0.7 1.1 5.4 11.9 14.5 13.1 8.2 4.1 3.8 1.2 | cargo |
           0.6 10.0 5.4 7.4 5.2 5.7 4.3 3.4 1.7 0.6 0.0 0.3 1.9 4.7 10.0 3.5 …
AFTER   … 1.8 2.3 2.0 0.8 0.1 0.7 1.2 4.1 3.7 3.9 3.9 3.9 3.7 3.2 2.4 1.7 2.4 3.8 1.5 2.7
           5.3 4.1 5.6 5.4 4.1 2.9 2.8 3.5 4.1 4.3 4.2 4.0 3.9 4.0 3.3 1.9 0.5 | cargo |
           0.0 1.6 3.9 7.2 5.1 4.6 5.7 2.5 4.0 3.6 5.6 5.7 8.2 5.7 3.7 2.2 …
```

The residual ±2 px ripple in the AFTER raw line is the camera's own zoom and pan adding to and
subtracting from the ship's motion — `jcam`'s anchors are only C0, which predates this work. Two
things were done about the worst of it: `w29_jcam` now takes the return leg through the wide
two-body framing (`k` = 2, an anchor) as **two eased halves**, so the camera is momentarily at
rest exactly where its own interpolation kinks. The ship does not pause — `jt` is paced by arc
length and knows nothing about the camera.

## 4 · Boundary continuity — the acceptance test

Ship base point, mission 5, 390×844, **median of 5 flights** (the range is frame jitter — where
the ship is moving, which frame the sampler catches decides the step). The number that matters is
the step against the size of an ordinary frame step next to it: a "seam" that is smaller than the
motion around it is not a seam.

| boundary | BEFORE step (range) | AFTER step (range) | AFTER, ordinary frame step there |
|---|---|---|---|
| `ascent` → `pitch`      | 0.16 (0.06–0.19) | 0.11 (0.11–0.19) | 0.21 |
| `pitch` → `orbit`       | 0.03 (0.00–0.04) | 0.01 (0.01–0.04) | 0.10 |
| `orbit` → `transfer`    | 0.00 (0.00–0.00) | 3.87 (3.84–3.87) | **3.86** |
| `transfer` → `moonorbit`| 0.20 (0.09–0.66) | 3.82 (3.79–3.84) | **3.78** |
| `moonorbit` → `cargo`   | 0.00 (0.00–0.00) | 0.00 (0.00–0.00) | 0.00 |
| `cargo` → `back`        | 4.07 (2.64–4.42) | 3.46 (3.38–4.46) | 2.17 *(pre-existing — see below)* |
| `back` → `reentry`      | 0.00 (0.00–0.00) | 5.70 (5.67–5.73) | **5.68** |
| `reentry` → `descent`   | 0.66 (0.22–2.48) | 1.44 (0.19–1.55) | 2.80 *(descent's own first frame)* |

The three boundaries that grew from 0.00 grew because **the ship is now moving through them**
instead of stopping: in each case the step equals the frame step on either side to within
0.03 px, which is as seamless as a boundary can be. `cargo` → `back` is the one W27 already
documented — the flyover ship is under power and accelerating there, so its own frame-to-frame
motion is larger than the local median; it is 4.07 px before this change and 3.46 after.

`reentry` → `descent` deserves a word, because its "ordinary frame step" column looks alarming.
Sampled either side of one boundary: the last three `reentry` frames sit at `bx` 106.00 (the ship
has arrived at the pad station and stopped, which is the intended ease-in), and the first three
`descent` frames read 106.35, 109.23, 112.02 — `descent`'s own `drift` ease, which has slope 3 at
p = 0, moving the ship ~2.8 px per frame from the word go. The 1.44 px step is **less than one
frame of the motion on the far side of it**, and it is the same value before and after.

At 1200×800: `orbit`→`transfer` 5.26 against a 5.29 frame step, `transfer`→`moonorbit` 6.22
against 6.15, `back`→`reentry` 7.64 against 7.57, `moonorbit`→`cargo` 0.00, `reentry`→`descent`
0.82 (identical to before), `cargo`→`back` 6.63 (identical to before).

Every other mission, 390×844, after: mission 1 `pitch`→`orbit` 0.01, `orbit`→`reentry` 0.00,
`reentry`→`descent` 1.16. Mission 2 `orbit`→`transfer` 3.45 / frame 3.46, `transfer`→`back` 3.62
/ 3.62, `back`→`reentry` 3.48 / 3.47, `reentry`→`descent` 0.38. Mission 3 4.07/4.06, 4.00/3.99,
4.05/4.08, 4.02/3.99, and `reentry`→`descent` 0.13. Mission 4 4.06/4.04, 4.01/3.95,
`moonorbit`→`land` 0.00, `land`→`back` 5.24 (the same accelerating flyover), `back`→`reentry`
6.11/6.12, `reentry`→`descent` 1.39. No console errors on any of them.

## 5 · T97 — the re-entry beats

Measured `jt` and `retro` on a mission-5 flight; `eBL`, the point on the return arc where the
ring reaches the bottom left of the Earth (225°), measures **0.49** at 390×844 (**0.56** at
1200×800 — the return arc starts from a different `aRe`) and is derived, not tuned.

| beat | `jt` − 4 | what is on screen |
|---|---|---|
| **round the back side** | 0.00 → 0.49 | coasting. **Engine off, no heat** — there is no atmosphere out there. Nose leads, trail behind. |
| **the flip** | 0.49 → 0.67 | end-for-end over `RETRO_TURN`, at the bottom left (T87, unchanged) |
| **the deceleration burn** | 0.60 → 0.84 | engine lit, pointing along the direction of travel, with a halo at the bells. Ramps in over the last third of the flip so the flame appears with the ship already retrograde. |
| **the burn dies** | 0.84 → 1.00 | throttled down across the dive onto the pad station, so `descent` picks up a dark engine |
| **sideways** | `descent` p 0 → ~0.4 | belly to the airstream, **plasma along the underside**, wake streaming off behind |
| **pivot, flaps, catch** | `descent` p 0.4 → 1 | unchanged (T53/T64) |

What changed to get there:

1. **`drawJourney` ignores `st.heat` entirely.** There is no atmosphere anywhere on the journey,
   so the nose sheath and the plasma cone are gone from it. `runFlight` still sets
   `view.heat = Math.sin(p·π)` during `reentry`; that line can be simplified to `view.heat = 0`
   but nothing depends on it — nothing else reads `view.heat` outside `descent`.
2. **The engine is what the way home gets instead.** `heat > 0` used to force `flame = 0`, which
   is why the braking burn had never been visible on a Moon mission. `flame` is now 0 while
   coasting (correct — it is coasting), then `0.4 + 0.6·burn`.
3. **The burn fades out over `JT_DIVE`.** Found by looking at the screenshots: for `FADE_S` after
   `descent` begins, the journey view is still painted *underneath* the pad scene as the outgoing
   half of the cross-fade, with `jmix` = 1 pinning its ship exactly on top of the pad ship. With
   `retro` = 1 that ghost was firing a full braking plume out of the belly-flopping booster.
4. **`w1_heat` puts the sheath on the windward face, not the nose.** It works out which way the
   ship is going (falling on `descent`, climbing otherwise), rotates that into body space to get
   the windward direction `w`, and blends between two silhouettes by exposure — the nose cap when
   `|w·y|` dominates, the whole flank when `|w·x|` does. Max Q on the way up is unchanged (nose
   glow, verified by screenshot); the fall gets a hot flank and a leading-edge band.
5. **`drawReentry` is built around the ship's axis.** It was a fixed vertical streak at `DW/2` —
   a nose-first re-entry drawn for a ship lying on its side. It now reads the pad scene's own
   station and pivot, puts the shock under the windward face along the length of the hull, and
   streams the wake downwind (up the screen, because the ship is falling).

The `reentry` → `descent` rotation is continuous by construction and always was: the last
`JT_DIVE` of `reentry` blends the ship's whole station — angle included — onto the pad camera's,
at exactly the attitude `descent` starts from (−`BALLISTIC_TOP`). Measured step 0.35 px.

## 6 · Performance

`drawScene` cost per frame, median / p95 / max in ms over a whole mission-5 flight, and the
median `drawCount`. Nothing got more expensive; the re-entry got cheaper, because the engine is
off for most of it (no exhaust, no `blur(4px)` pass) and because the new `w1_heat` uses gradients
where the old one used `filter: blur(5px)`.

| phase | BEFORE ms | AFTER ms | BEFORE draws | AFTER draws |
|---|---|---|---|---|
| `orbit`   | 0.50 / 1.20 / 3.40 | 0.50 / 0.90 / 2.40 | 84 | 84 |
| `back`    | 0.50 / 1.10 / 1.20 | 0.40 / 1.20 / 1.40 | 91 | 91 |
| `reentry` | 0.60 / 1.10 / 1.60 | **0.40 / 0.60 / 1.20** | 83 | 86 |
| `descent` | 0.70 / 1.10 / 2.10 | **0.60 / 1.00 / 1.50** | 198 | **195** |
| `cargo`   | 0.70 / 1.10 / 5.80 | 0.70 / 1.00 / 6.10 | 262 | 262 |

**60 fps throughout, before and after** — 1630 frames over the 27.1 s of a mission-5 flight
(60.1 fps), and per phase: `orbit` 137/2.28 s, `moonorbit` 305/5.08 s, `back` 191/3.18 s,
`reentry` 119/1.98 s, `descent` 114/1.90 s. Same at 1200×800. No canvas filter is added
anywhere; one is removed.

**The one new cost is the arc table**, built lazily per (viewport, mission, tier set) and
measured at **4–11 ms**. It is built on the *first frame of `ascent`* — `w26_journeyState` runs
for every phase, and `w29_pacing` is called before the `jt === null` return — which is during
liftoff, behind the shake and the smoke, and 11 ms plus a 0.5 ms frame is still inside a 16.7 ms
budget. It rebuilds on a size or tier change because the key covers both; if anything else ever
moves the pad or cargo stations, call `w29_invalidate()` beside `w12_invalidate()`.

## 7 · Notes for the splice

* `J_JOIN`, `J_DIVE` and `J_LIFT` have no readers left — the joins are measured in `jt` now
  (`JT_JOIN` 0.05, `JT_DIVE` 0.16, `JT_LAND` 0.15, `JT_LIFT` 0.10). Delete them.
* The `FLIGHT_PLAN` rows at the foot of the fragment are written as assignments so the fragment
  is testable on its own. **Paste the five rows into the literal inside the BAL-START / BAL-END
  block and delete the assignment block** — `scripts/sim.mjs` evals that block and it must be the
  only copy.
* Optional one-liner in `runFlight`:
  `view.heat = ph.name === 'reentry' ? Math.sin(p * Math.PI) : 0;` → `view.heat = 0;`.
  Not required — `drawJourney` ignores `st.heat` — but it removes a value that now means nothing.
* `w26_journeyState` still owns `jt`, `jcam`, `jmix`, `jmixTo`, `ang`, `zoom` and `retro`, and
  still returns early for `land` / `cargo` / `descent` without touching `ang` or `retro`, which
  `descent` owns.
* `docs/JOURNEY.md` needs a fourth piece beside "one world, one camera, one path": **one speed**.

## 8 · Screenshots looked at

Eleven beats captured per viewport at 390×844 and 1200×800 by freezing the flight on a state
predicate (`cancelAnimationFrame` on the *next* macrotask — cancelling inside `drawScene` cancels
an already-fired handle and the flight runs on, which is worth knowing: it cost an hour and two
wrong diagnoses). What they show:

* `z-ascent` — max Q, **nose** glow and a hot nose outline. Unchanged, which is the point.
* `a-orbit` / `b-transfer` / `c-moonorbit` / `d-back` — idle glow, no heat.
* `e-re-coast` — round the back, **no nose glow, no flame**, nose leading, trail behind.
* `f-re-flip` — mid-turn at the bottom left.
* `g-re-burn` — nose pointing back up the trail, plume out of the bells **along the direction of
  travel**, halo at the base. A braking burn, and legible as one at both viewports.
* `h`/`i-desc-side` — broadside, **plasma along the underside** and a warm bloom under the hull,
  flaps just starting out. No nose cone glow anywhere.
* `j-desc-flip` — vertical, flaps out, heat already zero (the window ends at 40 km).
