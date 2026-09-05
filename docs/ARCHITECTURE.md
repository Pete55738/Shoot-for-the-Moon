# Architecture

One file, `app/shoot-for-the-moon.html`, in banner-comment sections. Sections
touch each other only through the named functions listed here.

| Section | Owns | Talks to others via |
| --- | --- | --- |
| **balance table** (`/*BAL-START*/`…`/*BAL-END*/`) | every tuning constant; `costOf`, `statsOf`, `flyRocket`, `rewardOf`, `lockReason`, `simulate`, `runBalanceSim` | pure functions; no DOM, no state. `scripts/sim.mjs` evals this block verbatim |
| **state** | `S` (the save), `phase`, `save()/load()`, `rng()` | `S` is read everywhere and written only in **actions** and **DEV** |
| **actions** | `buy()`, `launch()` — the only two things a player can do | call `save()` and the paint functions |
| **flight** | `view` (what the scene reads each frame), `runFlight()` — replays `flyRocket` samples over a compressed clock, then an analytic coast, then the parachute | writes `view` and `phase`; calls back at apogee and landing |
| **turnaround** | `turn`, the 15 s checklist, crew seats | writes `phase`; reads `rng()` |
| **scene** | canvas drawing: sky, ground/pad, Earth, clouds, rocket, chute, crew, Moon, base; the ground starfield; the altitude ladder | reads `S.tiers`, `view`, `phase`, `turn`. Never writes |
| **UI** | `paint*` functions, tabs, theme, deploy stamp, GH dialog | read `S`, `view`, `phase` |
| **tutorial** | five steps that spotlight real elements | reads nothing of the game |
| **DEV** | PAT-gated scene jumps, grants, reset, sim; `window.DEV` for the camera | the second writer of `S` and `view`, by design |
| **boot** | `load()`, first paint, hash tab, tutorial once | — |

## Who owns state

`S` is one object. `phase` is one string. `view` is what the scene reads.
Nothing else holds game truth. If a paint function ever writes `S`, that is
the bug.

## Units and determinism

- Balance and flight are SI: metres, m/s, tonnes, kN. The UI converts to km.
- Scene draws in design units: 360 wide when portrait, 500 tall when landscape;
  `setTransform` maps to device pixels at `devicePixelRatio` (capped 3).
- **Seeded RNG only** (`rng()`, LCG on `S.seed`, saved). It decides crew
  positions and checklist picks — cosmetic. The flight is fully deterministic:
  the same tiers fly the same every time, so a bug reproduces.

## Performance budget

Measured on round 1 at 2× DPR: 15–166 draw calls per frame, 59–61 fps on every
scene. Budget: **≤ 250 draws per frame, ≥ 55 fps on a phone**. If missed, cut
first: the per-frame blur filter on the Earth halo, then star count (140 → 80),
then clouds.

## Module isolation

- `flyRocket` cannot throw on any tier 1–10 (bounded loop, 900 s cap).
- `load()` refuses a future envelope, wrong kind, or absent payload and starts
  fresh with a visible status in INFO → Feeds.
- Every `localStorage` access is wrapped; storage failure degrades to
  "could not save", shown live in the register.
- DEV actions each re-check the PAT; hidden is not the gate.

## Verification loop

- `node scripts/sim.mjs [--curve]` — balance gate, exit 1 on fail.
- `node scripts/shot.mjs --all` — every scene, phone size, PNG + JSON
  (console errors, fps over 2 s, draw count, sim gate), plus a contact sheet.
  `--w 1200 --h 800`, `--light`, `--tiers N`, `--modules N` for variants.
- The critic's record: `docs/STATUS.json`.
