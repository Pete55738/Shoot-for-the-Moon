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

## What to decide in the design cycle

- **Art direction**, shown as pictures: keep hi-res vector, or move to rendered 2D (blur halos, glow, multiply shadows) for warmth. The brain dump said "goofy, fun graphics" — the vector look is clean but not yet goofy.
- **Ground and signature element**: two or three options each, rendered on the pad scene.
- **The rocket's personality** per tier — right now tiers change size, fins, bands, nozzles and the window; the payload passenger is a dot.
- **Turnaround theatre**: the crew are 4-pixel figures. The brain dump wanted to *see* people rebuilding the rocket.
