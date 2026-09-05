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
- [x] T11 · "what we need to be simulating is real world — velocity, a drag field, coefficient of drag falling with aero tiers, mass, gravity; acceleration is a mass problem with drag in it" · said 09-05 · **decided:** the sim already integrates thrust − drag − m·g with Cd, area, mass, ρ(h); expose those numbers per sample so T12 can show them · built #8
- [x] T12 · "mission-control data window, semi-opaque, top-left inside the scene, contrasting with the scenery: Cd, drag force in pounds-force, thrust, so the outside is a funky game and the inside is mission control" · said 09-05 · built #8
- [ ] T13 · "we're putting the ship in orbit, not going straight up: leave the atmosphere (~100 km), low Earth orbit, lunar transfer orbit, lunar orbit, Moon landing — five tiers with their own animations; two pieces of equipment per tier unlock the next orbit; the shop splits into ROCKET UPGRADES and EQUIPMENT UPGRADES with a hint of what to buy next; top-right shows the ship in its orbit" · said 09-05 · long run — the biggest item, changes the flight model and the shop
- [ ] T14 · "make the first milestone harder: 10–20 launches to get out of the atmosphere, then it unlocks more money, more power; game time target about an hour" · said 09-05 · **decided:** retune the balance block against the sim: first milestone at launch 10–20, Moon at ~150 launches (≈1 h at 23 s/cycle) · long run, after T13 decides the milestone ladder
- [ ] T15 · "pitch over; once in orbit it zooms out to the Earth like a level change, then zooms out as the levels progress; once on the Moon it zooms into the Moon and you see the base being built and data on how much cargo has been dropped off" · said 09-05 · **decided:** camera scale is the level indicator — pad scale → Earth-in-frame at tier 1 → Earth+Moon at tiers 2–3 → Moon surface at tiers 4–5 · long run (T13c)
- [ ] T16 · "late stage you see cargo pods drop from the ship to the Moon" · said 09-05 · long run (T13c, tier 4–5 ending)
- [ ] T17 · "the Moon has a railgun shooting cargo shipments back to Earth" · said 09-05 · long run — tier-5 economy: shipments are a second income; art in the Moon scene
- [ ] T18 · "tier 5: Moon base built and 10,000 people live there; grow the base with more payload launches until a population milestone that updates every launch" · said 09-05 · **decided:** replaces the fixed five-module base; population is the tier-5 score, shown in the Moon data panel and the LOG · long run
- [ ] T19 · "the five tiers: 1 Earth low orbit (100 km), 2 Earth lunar-injection orbit, 3 lunar orbit, 4 lunar base established, 5 Moon base built + 10,000 people" · said 09-05 · **decided:** this is the ladder T13a designs; the old altitude milestones become sub-steps inside tier 1 · long run
- [ ] T20 · "phase 2: a base and colony on Mars, then mine the asteroid belt" · said 09-05 · parked — after the Moon; the camera-scale idea (T15) is what makes it possible
- [x] T21 · "when it's launching, everything should get out of the way" · said 09-05 · **decided:** LAUNCH fades to a ghost in flight, the tour closes on launch, checklist already hides · built #6
- [x] T22 · "it took too long to decelerate the rocket — say three seconds; it can be sped up, but I want ballistic curves and trajectories with drag" · said 09-05 · **decided:** coast capped at 3.5 s now; real ballistic arcs come with the pitch-over (T13c) · quick part built #6
- [x] T23 · "don't let objects get near our ship — still at different levels, just off to the side" · said 09-05 · **decided:** sky objects keep to the top 22% and the Moon/cow to the upper right · built #6
- [ ] T24 · "bottom left: gimbal and attitude of the craft, only once we clear the pad; top right a symbol" · said 09-05 · long run — instrument, needs the pitch-over model (T13c) to mean anything
- [x] T25 · "a couple of cows bottom left, trees around the site, a little ocean in the background, stadium seating with people watching the launch" · said 09-05 · long run — W2 follow-up on the farm · built #7
- [x] T26 · "a cool quick countdown 3-2-1, gas plumes going everywhere, make the launch unique" · said 09-05 · long run — liftoff sequence: countdown, ignition, steam and smoke, pad shake · built #7
- [ ] T27 · "no choosing where to launch — you just advance; the equipment tab has ten pieces, the things you need to get to the next level" · said 09-05 · **decided:** one LAUNCH, no destination picker; equipment is ten items, two per milestone (T13b) · long run
- [ ] T28 · "milestone launches: once you hit the height for low Earth orbit you unlock 'launch a satellite'; the next launch is that, with its own animation, then a bonus — milestone 1..5 achieved" · said 09-05 · **decided:** reaching a tier's energy arms a one-off milestone flight (satellite, injection probe, lunar orbiter, lander, first base module); the next LAUNCH performs it with a distinct scene and pays the milestone bonus · long run (T13c)
- [ ] T29 · "max levels: every milestone unlocks two more tiers per track — milestone 1 caps hull/aero/payload at 2, and so on; tier 10 needs all five milestones" · said 09-05 · **decided:** track caps = 2 × (milestones achieved + 1), replacing the SPREAD rule as the pacing device; sim must still PASS · long run (T13a/T14)
- [ ] T30 · "after milestone 5 you're launching cargo; how much you put up is your rocket performance; two more tiers to go after milestone 5 — you just carry more cargo; animations go Earth → orbit → dotted path to the Moon → zoom in on the Moon → drop material → population grows → back to Earth; full Moon round trip 30 s max, earlier milestones shorter, milestone 1 is up 5 s and parachute" · said 09-05 · **decided:** cargo per flight = f(payload tier, hull, equipment); flight length scales with tier, 30 s cap · long run (T13c, T18)
- [ ] T31 · "the altimeter needs to change based on the milestone we're going for" · said 09-05 · **decided:** the ladder re-scales per mission tier: 0–100 km until LEO, Earth–Moon distance after, Moon-surface cargo/population after tier 4 · long run
- [x] T32 · "in parallel, upgrade all the graphics to the max — multiple agents" · said 09-05 · **decided:** graphics round 2 now: farm extras (T25), liftoff sequence (T26), rocket polish, flight atmosphere polish, ladder tick fix · now · built #7
- [ ] T7 · Netlify app made public · said 09-05 · done by the user in Netlify

## Shipped

<!-- ~~T0 · … · built #N~~ · run 1 · YYYY-MM-DD -->
