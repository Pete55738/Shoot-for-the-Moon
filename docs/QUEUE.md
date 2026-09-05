# Queue

Ideas said faster than they can be built, in the order they were said. Read
at the top of every session. The rules are dev-standards `skills/queue.md`:
log before continuing, decide and prepare in order, build once when the
queue runs dry, send a run sheet.

States: `[ ]` queued · `[ ]` + **decided:** · `[x]` built #PR · shipped goes
below with its run number.

## Queue

- [x] T1 · "change the miles per hour, change to miles from an altitude standpoint" · said 09-05 · **decided:** gauges and log show mi and mph; the ladder ticks show miles; sim stays SI · integrator · built #3
- [x] T2 · "when it runs out of fuel it just pushes higher really quickly — should be a one second delta between full thrust and zero, ramps down, decelerates" · said 09-05 · **decided:** throttle ramps to zero over the last 1 s of fuel; the coast is integrated in the same sample stream so the on-screen speed is continuous; no separate eased coast · integrator (balance block, T3 — rerun sim) · built #3
- [x] T3 · "really detail out the rocket — all of the tiers and what they look like, multiple runners" · said 09-05 · **decided:** W1 returns `drawRocket`/`rocketDims` fragment, ten visibly distinct tiers per track · W1 · built #3
- [x] T4 · "rockets are on a farm field, maybe some water; adding airplanes" · said 09-05 · **decided:** farm ground + pond in W2's pad fragment; airplanes in W3's sky fragment · W2 / W3 · built #3
- [x] T5 · "more movement in the turnaround — rocket comes in from off screen in pieces, cranes moving, realistic crane and trucks, people running around" · said 09-05 · **decided:** W2 returns `drawTurnaroundScene(progress)` — pieces arrive, crane lifts, crew run · W2 · built #3
- [x] T6 · "as you fly up: Superman past 150 km, weird satellites, crescent moon in the background with a man on it or a cow jumping through — quirky" · said 09-05 · **decided:** W3 returns `drawSkyExtras(km)` with altitude bands · W3 · built #3
- [x] T8 · "speed should be velocity, a much more accurate term" · said 09-05 · **decided:** rename the gauge · built #4
- [x] T9 · "on the dot where the highest altitude is, put a little marker that says best" · said 09-05 · **decided:** BEST label beside the ladder dot · built #4
- [x] T10 · "the cutoff should be one second long" · said 09-05 · **decided:** already so (T2, THROTTLE_RAMP_S = 1.0); confirmed, nothing to do
- [ ] T11 · "what we need to be simulating is real world — velocity, a drag field, coefficient of drag falling with aero tiers, mass, gravity; acceleration is a mass problem with drag in it" · said 09-05 · **decided:** the sim already integrates thrust − drag − m·g with Cd, area, mass, ρ(h); expose those numbers per sample so T12 can show them · long run
- [ ] T12 · "mission-control data window, semi-opaque, top-left inside the scene, contrasting with the scenery: Cd, drag force in pounds-force, thrust, so the outside is a funky game and the inside is mission control" · said 09-05 · long run
- [ ] T13 · "we're putting the ship in orbit, not going straight up: leave the atmosphere (~100 km), low Earth orbit, lunar transfer orbit, lunar orbit, Moon landing — five tiers with their own animations; two pieces of equipment per tier unlock the next orbit; the shop splits into ROCKET UPGRADES and EQUIPMENT UPGRADES with a hint of what to buy next; top-right shows the ship in its orbit" · said 09-05 · long run — the biggest item, changes the flight model and the shop
- [ ] T14 · "make the first milestone harder: 10–20 launches to get out of the atmosphere, then it unlocks more money, more power; game time target about an hour" · said 09-05 · **decided:** retune the balance block against the sim: first milestone at launch 10–20, Moon at ~150 launches (≈1 h at 23 s/cycle) · long run, after T13 decides the milestone ladder
- [ ] T7 · Netlify app made public · said 09-05 · done by the user in Netlify

## Shipped

<!-- ~~T0 · … · built #N~~ · run 1 · YYYY-MM-DD -->
