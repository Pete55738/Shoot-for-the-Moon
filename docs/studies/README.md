# Studies — the design record

**There is no user-picked reference yet.** The user asked for a one-shot build
first and a design cycle after (`CLAUDE.md` → Overrides). `round-1/` is what
the one-shot produced after three critic rounds in the build session, and it
stands in as the *provisional* reference. The design cycle's job is to replace
it with one the user chose from rendered options.

## round-1 — the one-shot, after three looks

`round-1/sheet.png` — seven scenes at phone size (390×844 @2×), tier 4 rocket:
pad · turnaround · flight · space · apogee · descent · moon.
`pad-desktop.png`, `moon-desktop.png` (tier 10, five modules),
`turnaround-desktop-light.png` (light theme, multiply wash on the daylight scene),
`e2e-turnaround.png` (a real flight driven through the button, not DEV).

Identity as built: theme pack **steel-blue** (house default), ground
**starfield**, signature element **the altitude ladder**.

What the three rounds fixed, all found by looking and not by reading code:
1. Round one: the `<style id="scene">` shadowed the canvas of the same id — the page did not start. Contact sheet was blank (file:// images inside a generated page).
2. Round two: the ladder canvas grew its own box on every draw and pushed the speed and fuel gauges off the phone screen. The mobile HUD rule was overridden by the base rule. A tier-10 rocket left the top of a landscape scene. The parachute hung inside the rocket. Idle crew stood under the LAUNCH button. Badge covered the PAD label. Gantry still on screen at 5 km.
3. Round three: clean on phone, desktop, light. Then the end-to-end drive found the shop locked during turnaround.
4. Round four, from Netlify's screenshot of the live deploy: the tutorial card sat over the LAUNCH button it points at on a landscape window. Moved bottom-left (`tour-960.png`, `tour-390.png`).

## round-2 / round-3 — graphics round 1 (four workers, one integrator)

Contract-driven: each worker drew one part against a written contract and a preview harness, never the HTML. Fragments spliced by the integrator, then three looks:
5. Round five (`round-2/`): everything landed — farm, crane, turnaround theatre, tiered rocket, sky whimsy, Moon base. Faults: sky black with stars by 3 mi; tanker under the LAUNCH button on a phone.
6. Round six: sky curve slowed (blue holds to ~10 km). The unit switch had moved the 10 km milestone to 10 mi, so the first flight could no longer afford the first upgrade — restored.
7. Round seven (`round-3/`): clean. `flight-desktop.png` at 1.9 mi: airliner, contrail, kite, blue sky.

Identity unchanged: steel-blue, starfield, altitude ladder. Art direction is now firmly *goofy hi-res vector*: Superman at 150 km, a cow over the Moon, a dog in the window.

## round-4 — graphics round 2 (four more workers)

8. Round eight (`round-4/`): farm extras (cows, trees, ocean sliver, grandstand), flatbed section tips upright, rocket polish (bells fit, louder diamonds, heat sheath, payload bay), atmosphere haze bands, twinkle, sun and Earthshine, re-entry plasma. All scenes clean, phone and desktop.
9. Round nine (`liftoff-sequence.png`): a real launch captured at six moments — countdown 2, IGNITION, steam and sparks at t+2.1 s, climb through clouds with the airliner, coast with the paper plane, apogee with the sun, Superman and the lost astronaut. Nothing found to fix.

## What to decide in the design cycle

- **Art direction**, shown as pictures: keep hi-res vector, or move to rendered 2D (blur halos, glow, multiply shadows) for warmth. The brain dump said "goofy, fun graphics" — the vector look is clean but not yet goofy.
- **Ground and signature element**: two or three options each, rendered on the pad scene.
- **The rocket's personality** per tier — right now tiers change size, fins, bands, nozzles and the window; the payload passenger is a dot.
- **Turnaround theatre**: the crew are 4-pixel figures. The brain dump wanted to *see* people rebuilding the rocket.
