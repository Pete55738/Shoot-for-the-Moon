# Shoot for the Moon

A one-button rocket clicker: press LAUNCH, spend what the flight earns on a
better rocket, reach the Moon, build the base. Made for someone who wanted a
game that is *not* an engineering project.

## Standards

This project follows the house standards in `Pete55738/dev-standards`:

- `CLAUDE.md` — constraints, naming, secrets, data contract
- `docs/GAMES.md` + `skills/07-game.md` — the game rules and the critic loop
- `skills/design-system.md` — the visual system
- `ui/tokens.css` — design tokens (inlined into this app, refreshed at ship time)
- `skills/01`–`06` — the pipeline

`dev-standards` is private and cannot be fetched at runtime. In a session, read
the repo directly — attach it if it isn't already in scope.

## Queue — read first

`docs/QUEUE.md` is the memory when ideas come faster than builds. Read it at
the top of every session. An idea that arrives mid-task is logged there as
one line, and the reply says "queued as Tn", before the task continues —
tasks are **T-numbered**. Every message is read as queue, now, or stop.
Each item is sized **quick** or **long** when decided: quick items push as
soon as the queue goes quiet, long items ride with a worker and push when
they land. A run sheet goes out as a file when asked
(`python3 scripts/run-sheet.py`). Rules: dev-standards `skills/queue.md`,
and `skills/orchestrate.md` for how workers are split, heartbeat and report.

## This project

- **App file:** `app/shoot-for-the-moon.html` — never `index.html`
- **Live URL:** https://shoot-for-the-moon-9834.netlify.app (team SSO gate on until launch)
- **Data:** none fetched. Save game is `localStorage` (`sftm-save`, envelope 1, kind `save`).
- **Theme pack:** `steel-blue` (the house default; tokens carry it). Ground: starfield. Signature element: the altitude ladder.
- **Resolution strategy:** device-res, logical space (360 wide portrait / 500 tall landscape). Cannot change later.
- **Art direction:** goofy hi-res vector, drawn in code. No image assets. Scene art (W1–W4 sections) may use its own hex; the chrome never does.
- **Mission control:** the data window top-left of the scene reads `view.forces` (per-sample thrust, drag, mass, g from `flyRocket`; `forcesAt` after burnout) and converts to lbf/lb/ft·s⁻² only in `paintDataWin`.
- **Units:** display is miles and mph; the sim and balance table are SI and convert only in the format layer (`fmtMi`, `fmtV`).
- **The ground is one shared projection.** `gproj(DW, DH, gy, x, z)` maps the tilted ~30-degree
  view: `x` −1..+1 across the site, `z` 0 (front edge) to 1 (horizon). The Earth site (W16), the
  pad life (W17), the catch (W19) and the lunar settlement (W20) all use it, and all agree that
  with `gy = DH*0.34` the projected horizon is at z 0.626, so **ground content must stay under
  z 0.62** or it floats above the skyline. The pad apron owns x ±0.38, z 0.305–0.475.
- **Static layers are cached.** The farm, the pad, the tilted site and the lunar ground render
  once into offscreen canvases keyed by size, ground line and theme. **Call `w12_invalidate()`
  and `siteInvalidate()` on resize, DPR change and theme change** or the scene keeps a stale layer. Anything that animates (crew, cows, windsock, beacons, pond, glows) still draws live.
- **The journey is one world, one camera, one path (T82).** The gravity turn starts at the
  tower — `ascent` eases `view.ang` to `-ASCENT_ANG` and `pitch` carries it on to −1.52
  (horizontal), leaning **left**; `maxQHeat(km)` warms the nose low down, peaking near 12 km.
  Once the ship leaves the pad the whole trip is **one path through one world**: `jcam` says where
  the Earth is and how big, `jpath` gives position *and tangent* for a single parameter from the
  Earth ring, along a C¹ Hermite whose end tangent **is** the lunar circle's, round two laps, out
  of the corner and back to the ring. `w26_journeyState` is called once per frame from `runFlight`
  and **owns `jt`, `jcam`, `jmix`, `ang`, `zoom` and `retro` — no phase branch may set them**, or
  the ship teleports at that boundary again (it used to move 288 px at `orbit`→`transfer`).
  `orbitRing` is still the single definition of the ring; `drawOrbitView`, `drawTransferView` and
  `drawMoonApproach` are all `drawJourney`. The retro flip is **mission 1 only** — the flight that
  is actually landing back on Earth. Read `docs/JOURNEY.md` before touching any of it.
- **The recovery is propulsive — there is no parachute anywhere (T52/T53).** After burnout the ship
  keeps its attitude and goes on falling over: `coast` carries `view.ang` from the burnout lean to
  `BALLISTIC_TOP` (horizontal at the top of the arc). Then it is the Starship routine, in altitudes —
  `view.flaps` swings the recovery flaps out in thick air, it belly-flops at `BELLY_ANG`, flips to
  vertical between `FLIP_KM` and `FLIP_END_KM`, lights the engine at `BURN_KM`, and under 3 km
  `drawCatch` takes it into the chopsticks. `descent` uses **two rates**: free fall down to `RECOV_KM`
  in the first 40 % of the phase, then a decelerating crawl — one curve made the whole recovery flash
  past in a few frames. The flaps are not an aero upgrade; every tier has them. Attitude lives in
  `view.ang` alone so the pitch instrument and the scene agree; **never rotate the ship in the draw
  layer** — the draw layer only chooses the pivot (body centre once the flaps are out, base otherwise).
- **The turnaround happens in the VAB, not on the pad (T65/T69).** `drawTurnaround` ferries the
  caught booster off the ring along **one straight line at the ring's own depth** (`W23_ROUTE` is two
  points; `z` never changes, so the ship holds scale 1 and the p 0 / p 1 hand-overs with
  `drawPadScene` are exact by construction). The main door is the whole pad-facing high bay; the ship
  is fuelled *inside* on the `fuel` beat. The building is sized from `S.tiers` — the lifted nose has
  to clear the lintel — so it is **drawn live from `drawSite` (`w23_vabStatic`), never baked into the
  cached site layer**, whose key knows size, ground line and theme but not the tier set.
- **One definition per drawing function.** The W1 rocket block was in the file **twice** — the
  integrated W1+W7 copy and the raw worker fragment after it — and the later one silently won, so
  `opts` (heat, bay, flaps) was dead code for weeks. When splicing a worker fragment, delete the
  fragment; `grep -n '^function drawX' app/shoot-for-the-moon.html` should print one line.
- **Camera:** `FLIGHT_PLAN` in the balance block gives each mission its phase list and seconds. `runFlight` is a phase machine; `view.scene` picks the camera view (`pad` / `orbit` / `transfer` / `moonorbit` / `cargo`) and `view.fadeFrom` cross-fades between them. The views are whole frames — they paint their own background; the pad scene is `drawPadScene`.
- **Missions:** five, in `MISSIONS` in the balance block. A flight reaches mission *n* when delivered Δv clears `dvReq` AND both `equip` items are owned AND mission *n−1* is achieved. `capOf(missions)` caps every track at 2×(missions+1). `plan`/`replan()` cache the flight; **anything that changes tiers or equipment must call `replan()`** or the hint and the gold LAUNCH go stale.
- **Payload is the economy (T45).** Below a mission's Δv requirement the ship carries the bare
  capsule (`PAY_MIN`) and every upgrade goes into reaching the target at all. Once it is cleared,
  the surplus stops being spare Δv and becomes mass: `payloadOf()` binary-searches the heaviest
  payload that still makes `dvReq`, using the closed-form `dvOf()` (the full integration is far
  too slow to call in a loop). Money and Moon cargo both follow the tonnes, so a better rocket
  earns more instead of just flying higher. The payload *track* sets what a tonne is worth
  (`payValueOf`), not how many you can carry — if the bay were the only gate, a player who never
  bought payload would be pinned at the capsule for the whole game.
- **Balance:** the numbers live in one block between `/*BAL-START*/` and `/*BAL-END*/` in the app.
  `node scripts/sim.mjs` evals that exact block — there is no second copy. Change a number, run the sim, paste the measurement into the comment beside it.
- **Critic camera:** `node scripts/shot.mjs --all` → `docs/studies/round-<n>/` PNGs + JSON (console errors, fps, draw count, sim gate).
  The DEV tab is unlocked by a GitHub token pasted in the header; the page never sends it anywhere. The camera sets a dummy one.
- **Design record:** `docs/studies/README.md` says what was chosen and rejected; `docs/STATUS.json` holds the last critic score and open issues. The next session starts from the weakest part.

Read `docs/ARCHITECTURE.md` when touching the flight sim, the scene, or state ownership.
Read `docs/PRD-shoot-for-the-moon.md` for the kickoff answers and the QA plan.

## Keeping this file small

This file loads into every session. Keep it to what a session must know to
avoid a mistake; move subsystem detail to `docs/<AREA>.md` with a one-line
pointer here, and delete anything describing code that is gone. See
dev-standards `CLAUDE.md` §13.

## Deploy stamp

The header carries `vX.Y (#N) · as of DATE`. `(#N)` and the date are stamped
at deploy from the `<!--REV-->` and `COMMIT_TIME_ISO` tokens — see
dev-standards `CLAUDE.md` §12. Never remove the tokens and never hand-write
the numbers.

## Session usage

Every session that commits runs `python3 scripts/usage.py` from the repo root
before its last push, and commits the `usage.json` row it writes. Measured
counts only — dollars and kWh are computed at read time from dev-standards
`templates/rate-card.json`. See dev-standards `CLAUDE.md` §16.

## Overrides

- **Prototyping phase skipped for v0.1.** `skills/07-game.md` §2 wants the user to pick a reference from rendered studies *before* code. The user asked for a one-shot build first and a design cycle after, so round-1 screenshots in `docs/studies/` stand in as the provisional reference until the design cycle replaces them. The kickoff answers are recorded as the session's assumptions in the PRD, not as the user's decisions.
- **No VIEW toggle in the header.** `skills/design-system.md` puts MOBILE/DESKTOP in the header. The game reflows by viewport and the scene is a canvas; a manual toggle would fight it. Rule overridden: dashboard anatomy, VIEW slot.
- **No shared leaderboard.** `docs/GAMES.md` describes a two-half leaderboard. v0.1 keeps records on-device only; the shared half is queued, not dropped.
