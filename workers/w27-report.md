# W27 · the cargo run over the Moon base — T88 + T90

Fragment: `workers/w27-cargo.js`. Nothing outside it was edited; the app file is untouched.

---

## 1 · The beat, over `st.cargo` 0 → 1 (5.4 s, `FLIGHT_PLAN` mission 5, unchanged)

| cargo | t (s) | what happens |
|---|---|---|
| 0.00 | 0.0 | the ship comes in at the **left edge** (x 0.055 DW), dead level, coasting. This is also where `moonorbit`'s join puts it, so it flies in rather than appearing. |
| 0.13 | 0.70 | pod 1 leaves the bay |
| 0.27 | 1.46 | pod 2 |
| 0.30 | 1.62 | **pod 1 touches down on berth 1** |
| 0.41 | 2.21 | pod 3 |
| 0.44 | 2.38 | **pod 2 → berth 2** |
| 0.55 | 2.97 | pod 4 |
| 0.58 | 3.13 | **pod 3 → berth 3** |
| 0.72 | 3.89 | **pod 4 → berth 4** — the last one down |
| 0.72–0.80 | 3.89–4.32 | it flies on past the pad, dust settling behind it |
| 0.80 | 4.32 | **the engines light** (flame ramps over 0.055) |
| 0.82–1.00 | 4.43–5.40 | it accelerates away to the right, ending at 2.9× cruise speed and x 0.90 DW — still on screen, which is what the cross-fade to `back` zooms out on |

Four touchdowns, 0.76 s apart, left to right: *boom, boom, boom, boom.*

Motion is a pure function of `st.cargo` and `now`. No `Math.random()` anywhere — the only
seeded helper used is the site's existing `w20_rnd`, via code I did not change.

## 2 · Where the ship flies, and how it stays clear of the HUD

- **Attitude:** `rot` is exactly `PI/2` (nose to the right, level) for the whole phase and
  never changes — `w27_shipAt` returns the same constant at cargo 0 and at cargo 1. There is
  no rotation term in the scene at all, so nothing can read as a landing attitude.
- **Line:** `y = DH * 0.335`, constant. Measured on the base build, the glass windows
  (`.goalwin` / `.checklist` / `.datawin`) bottom out at **0.253 DH portrait** (390×844) and
  **0.207 DH landscape** (1200×800). The antenna masts — the tallest thing on the site — top
  out at **0.395 DH**. So the ship sits in the 0.25 → 0.40 band with ~27 logical px of air
  above it and ~30 below: over the base, under the glass, on both layouts.
- **Speed:** 0.72 DW per unit of cargo, i.e. 0.133 DW/s — the ship takes 4.3 s to cross 59 %
  of the frame before the burn. Slow.
- **Size:** `w27_shipH = min(DW,DH) * 0.10`, i.e. 36 px portrait / 50 px landscape. This is
  tied to the journey's own `J_TOKEN` (0.085) rather than being a fixed 34 px, so the join
  from `moonorbit` no longer has a scale step to hide — it grows 15 %, blended over 0.88 s.

## 3 · The pad

One apron, replacing the four targets that were scattered across the whole settlement.
Everything is in the shared ground projection (`gproj`), z well under 0.62:

- **apron** x −0.560 … +0.280, z 0.178 … 0.280 — screen x 0.171–0.664 DW, y 0.711–0.832 DH
- **berths** four, all at z 0.228, x −0.412 / −0.230 / −0.049 / +0.131 — screen x 0.271 /
  0.372 / 0.473 / 0.573 DW, y 0.770 DH
- markings: hazard chevrons along the front lip, a dashed taxi lane through the berth row,
  a back kerb, four corner marks, fourteen edge-light posts, and a numbered
  circle-and-cross per berth (1–4, left to right)
- live on top: the berth waiting for a pod pulses cyan; the others hold steady. Two draws.

Placement is deliberate. It clears the **greenhouse** (which owns screen x 0.086–0.255 on the
left — the old berth 1 landed dead in the middle of it), and it clears the **railgun**, whose
structure never comes below y 0.68 DH while the apron never rises above 0.711 DH. `drawRailgun`
and `drawShipmentArc` still run after the scene exactly as before and are unaffected.

**The berth spacing is derived from the ship, not tuned.** A pod is released exactly one
fall-length of travel short of its berth (0.72 DW/unit × 0.17 units = 0.122 DW), so it simply
keeps the ship's horizontal speed all the way down: `lat = u`, a clean ballistic drop with no
sideways shove. Vertically it is the two-rate curve the ship's own recovery uses (T52) —
free fall to 62 %, then the thrusters come in and it settles onto the berth with **zero**
velocity, so the touchdown lands instead of stopping dead.

## 4 · Measured numbers

### Continuity (real mission-5 flight, ship base point sampled every frame)

| boundary | before | after |
|---|---|---|
| `moonorbit` → `cargo`, 390×844 | 1.13 px | **0.68 px** |
| `cargo` → `back`, 390×844 | 1.48 px | **0.43 px** |
| `moonorbit` → `cargo`, 1200×800 | 1.09 px | **0.64 px** |
| `cargo` → `back`, 1200×800 | 1.50 px | **2.16 px** ← see below |
| `moonorbit` → `land`, 390×844 (mission 4) | 1.57 px | **1.04 px** |
| `land` → `back`, 390×844 (mission 4) | 1.81 px | **0.74 px** |

The 2.16 px is not a seam. At that instant the ship is under power and its own frame-to-frame
motion is **3.91 px** (cruise is 1.35 px/frame) — the boundary step is *smaller* than a normal
frame of travel, so the hand-over is inside the noise of the motion itself. Same story at
390×844: 0.43 px against a 2.37 px frame step. `w26_cargoStation` is derived from the same
`w27_shipAt` the scene draws with, so the join is exact by construction.

No other boundary moved: `orbit`→`transfer` 0.00, `back`→`reentry` 0.00, `reentry`→`descent`
1.78 px, largest single-frame step in the flight still the 40.5 px chopstick catch inside
`descent` (pre-existing, documented in `docs/JOURNEY.md`).

### Draw count and frame rate

Measured at 390×844 and 1200×800, deviceScaleFactor 2, caches warm.

| cargo | before | after |
|---|---|---|
| 0.0 | 185 | **181** |
| 0.2 | 209 | **194** |
| 0.4 | 235 | **208** |
| 0.6 | 236 | **231** |
| 0.8 | 238 | **230** |
| 1.0 | 235 | **234** |

Under the code it replaces at every point of the phase. The whole pad — slab, markings,
numbers, light posts — costs **zero live draws**: it goes into the existing cached lunar
ground layer (see §5). The brief's ~160 target is not reachable without cutting the
settlement itself; the scene was already 185–238 before I touched it.

**fps**: 61 portrait, 61 landscape for cargo 0 → 0.80.

At 1200×800 dSF 2 the last 1.0 s (cargo ≥ 0.82) drops to **30–32 fps**. That is not new work
of mine — it is `drawRocket`'s exhaust, which sets `c.filter = 'blur(4px)'` on the outer plume
(app line ~2525). The cost is fixed the instant `flame > 0`, independent of plume size:
cargo 0.79 measures 59 fps at 230 draws, cargo 0.80 measures 31 fps at 235 draws. **The old
cargo scene hovered with its engine lit for the entire phase and therefore ran at 30–31 fps
from cargo 0 to cargo 1** — so this is a straight 2× win over 80 % of the beat, and the
remaining second is the one moment a plume is the point. Every journey view pays the same
toll (`drawJourney` always passes `flame` ≥ 0.45), so it is worth its own queue item:
pre-render the soft outer plume once instead of filtering per frame.

### Verification method

- `moonorbit` → `cargo` → `back` sampled by wrapping `drawRocket` and reading the current
  transform at its origin, once per `drawScene`, across a full mission-5 flight driven by a
  real `#launch` click (tier 10, modules 4, population 6000).
- Frames screenshotted at cargo 0, 0.2, 0.35, 0.5, 0.65, 0.78, 0.9, 1.0 at 390×844 and
  1200×800 and looked at individually; plus light theme and a modules = 1 / population = 400
  base to check the pad still reads when the settlement around it is nearly empty.
- Console and page errors: none, on every run.

## 5 · What the integrator must do outside the fragment

1. **Delete the functions the fragment replaces**, so there is one definition each
   (CLAUDE.md, "one definition per drawing function"). The fragment replaces:
   `drawCargoDrop`, `w26_cargoStation`, `w20_targets`, `w20_target`.
   `grep -n '^function drawCargoDrop\|^function w26_cargoStation\|^function w20_targets\|^function w20_target' app/shoot-for-the-moon.html`
   must print exactly four lines after splicing.
2. **`drawCargoPods` is now dead** — nothing calls it. Delete it. (`w11_pod` was already dead
   before this work; worth taking out at the same time.)
3. **Why `w20_targets` / `w20_target` are in scope.** `w20_ground` — the *cached* lunar layer
   — ends by painting each entry of `w20_targets` through `w20_target`. Putting the pad there
   is what makes it free and what puts it in the right z-order: under the roads, the flags,
   the crew, the rovers and the boulders, which all draw later. `w20_target(…, i)` therefore
   lays the apron down on its first call (`i === 0`) and then paints its berth.
   `w20_targets` also carries `DW/DH/gy` on each entry so it can.
4. **No new cache invalidation.** The pad rides the existing `'lunar|DW|DH|gy|m'` key, which
   `w12_invalidate()` already clears on resize, DPR change and theme change.
5. `FLIGHT_PLAN`, `w26_journeyState`, `J_LIFT` and the `land`/`cargo` branch are untouched.
6. `docs/JOURNEY.md` §"Joining the pad" still reads true. The one stale line is the comment
   above the *old* `w26_cargoStation` ("w11_ship at (DW*0.60, 0.16 → 0.26 DH), heading
   −PI/2 + 0.12, 34 px tall") — it goes with the function it describes.
7. Worth a CLAUDE.md line under the journey bullets:
   *"The cargo run is a level flyover, not a landing (T88/T90). `w27_shipAt` owns where the
   ship is and `w26_cargoStation` is derived from it; the pad is baked into the lunar ground
   layer via `w20_targets`/`w20_target`."*
