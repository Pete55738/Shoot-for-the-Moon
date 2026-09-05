# Queue

Ideas said faster than they can be built, in the order they were said. Read
at the top of every session. The rules are dev-standards `skills/queue.md`:
log before continuing, decide and prepare in order, build once when the
queue runs dry, send a run sheet.

States: `[ ]` queued · `[ ]` + **decided:** · `[x]` built #PR · shipped goes
below with its run number.

## Queue

- [x] T1 · "change the miles per hour, change to miles from an altitude standpoint" · said 09-05 · **decided:** gauges and log show mi and mph; the ladder ticks show miles; sim stays SI · integrator
- [x] T2 · "when it runs out of fuel it just pushes higher really quickly — should be a one second delta between full thrust and zero, ramps down, decelerates" · said 09-05 · **decided:** throttle ramps to zero over the last 1 s of fuel; the coast is integrated in the same sample stream so the on-screen speed is continuous; no separate eased coast · integrator (balance block, T3 — rerun sim)
- [x] T3 · "really detail out the rocket — all of the tiers and what they look like, multiple runners" · said 09-05 · **decided:** W1 returns `drawRocket`/`rocketDims` fragment, ten visibly distinct tiers per track · W1
- [x] T4 · "rockets are on a farm field, maybe some water; adding airplanes" · said 09-05 · **decided:** farm ground + pond in W2's pad fragment; airplanes in W3's sky fragment · W2 / W3
- [x] T5 · "more movement in the turnaround — rocket comes in from off screen in pieces, cranes moving, realistic crane and trucks, people running around" · said 09-05 · **decided:** W2 returns `drawTurnaroundScene(progress)` — pieces arrive, crane lifts, crew run · W2
- [x] T6 · "as you fly up: Superman past 150 km, weird satellites, crescent moon in the background with a man on it or a cow jumping through — quirky" · said 09-05 · **decided:** W3 returns `drawSkyExtras(km)` with altitude bands · W3
- [ ] T7 · Netlify app made public · said 09-05 · done by the user in Netlify

## Shipped

<!-- ~~T0 · … · built #N~~ · run 1 · YYYY-MM-DD -->
