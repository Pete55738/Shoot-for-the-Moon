# The journey — one world, one camera, one path

*(T81/T82, W26. Replaces the five separate view geometries described by the old
"the journey is one arc" note.)*

The Earth-to-Moon flight used to be five views — `orbit`, `transfer`, `moonorbit`,
`cargo`, `pad` — each computing the ship's screen position from its own geometry.
The ship therefore **teleported at every boundary** and the cross-fade hid it. Measured
on a real mission-5 flight at 390×844, the ship's base point moved 288 px between the
last frame of `orbit` and the first of `transfer`, and 311 px between `back` and
`reentry`. That is what read as cutscenes.

## The three pieces

**One world.** Earth at the origin, radius `J_RE` 100. The ring is the same
1.45 R ellipse (1.02 / 0.72) it always was. The Moon sits `J_D` 820 away, radius
`J_RM` 50, with a true circular orbit at `J_LR = 1.42 R` (T67). Only the Moon's
*direction* from Earth depends on aspect — −70° in portrait, −19° in landscape — so a
wide camera can frame both bodies.

**One camera.** `jcam(DW, DH, k)`, `k` 0→3, is just "where the Earth is and how big".
`k` 0–1 is the old orbit framing, unchanged; 1–2 pulls back to fit both bodies; 2–3
pushes in on the Moon. `orbitEarth`, `orbitRing`, `jrnyMoon` and `jrnyLunar` are
four-line wrappers over it, so `orbitRing` remains the single definition of the Earth
ring and the lunar orbit remains a circle.

**One path.** `jpath(DW, DH, jt, mission)` returns position **and tangent** for a
single parameter across the whole trip: ring → Hermite → two lunar laps → half-lap
corner + Hermite → ring. Three angles are *derived, not tuned*:

| angle | what it is |
|---|---|
| `aIn`  | `atan2(−ux, uy)` — where the outbound leg is tangent to the lunar circle |
| `aOut` | `aIn + π` — the corner the return leaves from |
| `aRe`  | where the return leg is tangent to the Earth ring |

Both legs are C¹ Hermites whose end tangents **are** the circle tangents. That is why
the transfer's Moon end *is* the lunar circle — same place, same radius, same tangent —
rather than a lobe drawn to look like it.

## Joining the pad

`jmix` blends the ship's **base point** (never its centre — that would leave a
half-body offset that grows with the tier) onto the pad scene's own station over the
first `J_JOIN` of `orbit` and the last `J_DIVE` of `reentry`, and onto the cargo
scene's station over `J_LIFT` of `moonorbit`/`back`. `w26_padStation` and
`w26_cargoStation` read the numbers off the scenes that own them, so if either scene
moves its ship the join follows.

## The contract

- `w26_journeyState(view, phaseName, p, DW, DH)` is called once per frame from
  `runFlight`, immediately after `view.phaseName` is set. It owns `jt`, `jcam`, `jmix`,
  `jmixTo`, `ang`, `zoom` and `retro`. **No phase branch may set those** — that is the
  whole point.
- `drawOrbitView` / `drawTransferView` / `drawMoonApproach` are all `drawJourney`.
- Measured continuity is the acceptance test, not eyeballing: sample the ship's base
  point every frame across a whole flight and check the step at each boundary. Under
  ~7 px is seamless; the fades hide anything smaller than the eye catches anyway.

## Known, and deliberate

- The largest single-frame step in a flight (56 px at 390 wide) is inside `descent`,
  where `drawCatch` takes the booster to the tower's grip. That is the chopstick catch
  moving the ship on purpose, and it predates this work.
- `view.ang` during `orbit`/`reentry` is a ring angle, so the pitch gauge reads a large
  number there. Also pre-existing.
