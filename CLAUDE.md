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
- **Camera:** `FLIGHT_PLAN` in the balance block gives each mission its phase list and seconds. `runFlight` is a phase machine; `view.scene` picks the camera view (`pad` / `orbit` / `transfer` / `moonorbit` / `cargo`) and `view.fadeFrom` cross-fades between them. The views are whole frames — they paint their own background; the pad scene is `drawPadScene`.
- **Missions:** five, in `MISSIONS` in the balance block. A flight reaches mission *n* when delivered Δv clears `dvReq` AND both `equip` items are owned AND mission *n−1* is achieved. `capOf(missions)` caps every track at 2×(missions+1). `plan`/`replan()` cache the flight; **anything that changes tiers or equipment must call `replan()`** or the hint and the gold LAUNCH go stale.
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
