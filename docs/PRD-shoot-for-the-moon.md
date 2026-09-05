# PRD — Shoot for the Moon

> Written from the brain dump of 2026-09-05. The user asked for a one-shot build
> and a design cycle after, so the kickoff answers below are **the session's
> assumptions**, chosen to be cheap to change. They become decisions when the
> user confirms or replaces them in the design cycle.

## Kickoff answers (skills/07-game.md §1)

| # | Question | Answer | Status |
| --- | --- | --- | --- |
| 1 | The one lever | Press LAUNCH. It is never wrong to fly; the decision is what to buy between flights. | from the brain dump |
| 2 | Art direction | Hi-res vector, drawn in code, no assets. Chosen for "simple, looks cool, goofy" at the lowest cost; rendered-2D blending is the obvious upgrade if the user wants warmth. | assumed |
| 3 | Resolution strategy | Device-res, logical space (360 wide portrait, 500 tall landscape). | assumed — cannot change later |
| 4 | Platform | One HTML file, no build step. | house default |
| 5 | Leaderboard | No. On-device records only. Shared half queued. | assumed |
| 6 | Named deadlock | **Rich payload, weak rocket** — payload tiers pay well on a rocket that cannot climb. Guarded by the payload lock (payload ≤ weakest rocket part) and SPREAD=2 (no part more than 2 tiers above the weakest). The sim's `payloadFirst` strategy is the one that would fall into it. | measured |
| 7 | Page identity | Theme pack `steel-blue` (house default). Ground: starfield. Signature element: the altitude ladder (log scale, pad to Moon, milestone ticks, best-altitude dot). | assumed — no rendered options were shown |
| 8 | Navigation | Bottom tab bar (games default): PAD · LOG · INFO · DEV (gated). | house default |

## Problem

The user's other games are engineering. Their cousin wants something simple that
gets better and better as you click. Space theme, goofy, satisfying.

## Smallest useful version (v0.1 — built)

- One LAUNCH button. A flight replays a deterministic rocket sim: altitude, speed and fuel gauges move; sky darkens; stars; Earth curve; parachute back.
- Money for altitude (power law × payload multiplier) plus one-time milestone bonuses.
- Five upgrade tracks × 10 tiers: engine, tank, aero, hull, payload. The rocket's drawing changes with tiers.
- 15 s turnaround between flights with a six-item crew checklist; the shop is open, LAUNCH is not.
- Reaching the Moon delivers a base module per Moon flight; five modules complete the base.
- Save/resume in localStorage; guided tutorial; DEV tab reaches every scene.

## What it is not

- Not an economy sim: no fuel cost per launch, no failures, no weather, no crew management.
- Not multiplayer, no accounts, no shared leaderboard (yet).
- Not a physics teaching tool: the sim is real enough to feel right and no more.

## Balance (measured, `node scripts/sim.mjs`)

| strategy | Moon at launch | max dry streak |
| --- | --- | --- |
| cheapest | 107 | 2 |
| priciest | 81 | 4 |
| noPayload | 295 | 18 |
| payloadFirst | 109 | 5 |
| engineOnly | 79 | 6 |

Re-measured after the 1 s throttle ramp (T2). Display is miles and mph; the table stays SI.

Gate: every strategy reaches the Moon in ≤300 launches with ≤20 dry launches in a row. **PASS.**
A cycle is ~8 s flight + 15 s turnaround, so a natural game is 35–45 minutes.

## QA plan

| # | Check | How | Expected | v0.1 |
| --- | --- | --- | --- | --- |
| 1 | Fresh load | open with empty storage | tutorial step 1 of 5, LAUNCH enabled, "first flight" | pass |
| 2 | Tutorial skip | SKIP on step 3 | card hidden, `sftm-tour=done`, never auto-replays | pass |
| 3 | Full cycle | press LAUNCH | apogee flash with reward ~5 s, turnaround ~8 s, ready again ~23 s | pass |
| 4 | Shop during turnaround | buy during checklist | tier +1, funds −cost, save written | pass (after fix) |
| 5 | Shop during flight | click buy mid-flight | refused | pass (by code path; disabled) |
| 6 | Resume | reload | launches, funds, tiers restored; "saved just now" in INFO | pass |
| 7 | Keyboard | Space on body | launches | pass |
| 8 | Reduced motion | prefers-reduced-motion | instant result, funds land, no animation | pass |
| 9 | DEV gate | no PAT | DEV tab hidden; `window.DEV.*` returns falsy | pass |
| 10 | DEV unlock | paste PAT in GH dialog | DEV tab shows, last 4 only | pass |
| 11 | Console | every scene, phone + desktop, dark + light | zero errors | pass |
| 12 | Frame rate | every scene | ≥ 55 fps | pass (59–61) |
| 13 | Balance sim | `node scripts/sim.mjs` | PASS | pass |
| 14 | Deploy stamp | `grep -c '<!--REV-->\|COMMIT_TIME_ISO' app/*.html` | 2 | pass |
| 15 | No `DEV?` scaffolding | `grep '>DEV?<'` | nothing | pass |
| 16 | 375 px width | phone viewport | no horizontal scroll, all gauges visible | pass at 390; 375 not shot |
| 17 | Live URL | after merge | `/` serves the game; `/CLAUDE.md` 404s; icons show | **not run — not deployed yet** |
| 18 | Save/resume mid-flight | kill tab during flight | resumes at pad with reward not yet credited | **not tested — known gap**, reward is credited at apogee so a kill mid-flight loses that flight |
| 19 | Moon base complete | 5 Moon flights | "MOON BASE COMPLETE" | not driven end to end; scene verified via DEV |

## Mission tiers (decided 2026-09-05, second brain dump — replaces "straight up to the Moon")

The rocket **pitches over** after the vertical ascent. Reaching a tier needs energy (velocity and altitude) *and* the tier's two pieces of equipment. **The camera scale is the level indicator**: each tier zooms out one step; the Moon tiers zoom back in.

| Tier | Name | What the flight must do | Camera | Ending |
| --- | --- | --- | --- | --- |
| 1 | Earth low orbit | 100 km and orbital velocity | zoom out: Earth in frame, ship circling | one orbit, re-entry glow, parachute |
| 2 | Lunar-injection orbit | trans-lunar injection energy | zoom out: Earth + Moon, transfer arc | ship leaves toward a growing Moon |
| 3 | Lunar orbit | capture burn at the Moon | Moon in frame, ship circling | orbit established |
| 4 | Lunar base established | landing | zoom in: Moon surface, first module lands | cargo pods drop from the ship |
| 5 | Moon base built | payload launches grow the base | Moon surface, base growing | population counter updates every launch until **10,000 people**; a railgun fires cargo back to Earth |

Sub-steps inside tier 1 keep the early game readable: 1 mi, 6 mi, Kármán line, then orbit. Phase 2 (Mars colony, asteroid belt) is parked in the queue as T20 and is why the camera-scale mechanism is worth building properly.


## Mission ladder as built (2026-09-05)

| Mission | Δv required | Equipment | Reached at (cheapest strategy) |
| --- | --- | --- | --- |
| 1 Earth low orbit | 9.3 km/s | second stage + guidance computer | launch 9 |
| 2 Lunar-injection orbit | 12.5 km/s | kick stage + deep-space comms | launch 18 |
| 3 Lunar orbit | 13.4 km/s | capture engine + star tracker | launch 28 |
| 4 Lunar base established | 15.3 km/s | landing legs + descent radar | launch 36 |
| 5 Moon base built | 15.3 km/s | cargo bay + life support | launch 46, 10,000 people by 73 |

Measured across five strategies: 62–116 launches to finish. At ~23 s a cycle that is 25–45 minutes;
the one-hour target is T14, which retunes costs once the ladder is settled.

The flight model is multi-stage: equipment adds real stages with their own fuel, dry mass, thrust and
exhaust velocity, so delivered Δv comes out of the rocket equation rather than a lookup. A tier-2 rocket
with a second stage clears low Earth orbit; the same rocket without it does not.
