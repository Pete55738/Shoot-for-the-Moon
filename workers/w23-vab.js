/* ── W23 · T65 · the turnaround: ferry to the VAB, strip it, re-stack it, roll it out ──────────
   One continuous shot between flights. Replaces the on-pad rebuild: the caught booster comes off
   the tower onto a crawler-transporter, creeps across the site to a cut-away vehicle assembly
   building twice the height of the old hangar, is taken apart and put back together across the
   bay's platforms, then rolls back out to the pad and stands ready.

   Everything below lives in the site's shared ground projection — gproj(DW, DH, gy, x, z), x −1..+1
   across the site, z 0 (front edge) to 1 (horizon), horizon at z 0.626 with gy = DH*0.34, so no
   ground content goes past z 0.62. The pad apron owns x ±0.38 / z 0.305–0.475 and the VAB stops
   short of it. Motion is a pure function of `p` and `now` — no Math.random anywhere.       */

/* ── the one place to retune the building ─────────────────────────────────────────────────────
   Site coordinates. The old hangar this replaces was x −1.00..−0.46, z 0.378..0.462, height 82.  */
const W23_VAB = {
  x0: -1.28, x1: -0.42,     /* facade span, left to right. x1 stays clear of the apron edge (−0.38);
                               x0 runs off the left of the frame at 360 wide, which is the point —
                               the building is meant to be too big to fit. */
  z0: 0.392, z1: 0.458,     /* front wall (cut away) and back wall. Shallow on purpose: z reads as a
                               steep vertical drop in this projection, and a deep footprint turns
                               the roof into a slab that swallows the facade. Well under z 0.62. */
  hMin: 164,                // site units: twice the 82 the old assembly hangar stood
  hPad: 74,                 // local units of headroom over the stack — the lifted nose must clear the lintel
  bayFrac: 0.36,            // the right-hand share of the width that is open high bay
  floors: 5,                // service floors stacked in the left-hand share
  padZ: 0.42,               // the pad station (the hold-down ring) the local space is anchored to
  gyFrac: 0.34,             // SITE_GY = DH * this — must match drawPadScene
};
/* The crawler route, site coords: off the pad, forward onto the haul road, left across the site,
   then a turn in and straight back through the open front of the bay. Reversed for the rollout. */
const W23_ROUTE = [[0.00, 0.420], [0.03, 0.325], [-0.28, 0.305], [-0.52, 0.352], [-0.575, 0.425]];
/* The beat table. `stage` is a checklist stage name (STAGE_LABEL in the app) so the commentary in
   the upper-right list matches what is on screen; see w23_fitTasks below. */
const W23_BEATS = [
  ['recover', 0.000, 0.085, 'Booster off the tower, onto the crawler'],
  ['clean',   0.085, 0.300, 'Ferry across the site to the VAB'],
  ['stack',   0.300, 0.720, 'Strip it down and re-stack it'],
  ['fuel',    0.720, 0.775, 'Fuel, close out, doors open'],
  ['check',   0.775, 0.925, 'Roll out to the pad'],
  ['paper',   0.925, 1.000, 'Hard down, crew clear'],
];
function w23_stageAt(p) { for (const b of W23_BEATS) if (p < b[2]) return b[0]; return 'paper'; }
/* Optional, for the integrator: re-time the checklist so each task runs while its stage is on
   screen. Called on turn.tasks (each {name, dur, start, stage}) with the turnaround length. */
function w23_fitTasks(tasks, total) {
  const span = {}; for (const b of W23_BEATS) span[b[0]] = [b[1], b[2]];
  const runs = []; // consecutive same-stage tasks, mishaps folded into the run that follows them
  for (const tk of tasks) { const last = runs[runs.length - 1];
    if (last && last.stage === tk.stage) last.items.push(tk); else runs.push({ stage: tk.stage, items: [tk] }); }
  for (let i = 0; i < runs.length; i++) {
    const r = runs[i];
    if (r.stage === 'mishap') { const nx = runs[i + 1], s = span[nx ? nx.stage : 'check'] || [0.3, 0.72];
      r.span = [s[0], s[0] + (s[1] - s[0]) * 0.38]; if (nx) nx.trim = 0.38; continue; }
    const s = span[r.stage] || [0, 1]; r.span = [s[0] + (s[1] - s[0]) * (r.trim || 0), s[1]];
  }
  for (const r of runs) { const w = r.items.reduce((a, t) => a + t.dur, 0) || 1; let acc = r.span[0];
    for (const tk of r.items) { const f = (r.span[1] - r.span[0]) * tk.dur / w;
      tk.start = acc * total; tk.dur = f * total; acc += f; } }
  return tasks;
}

/* ── small change ─────────────────────────────────────────────────────────────────────────── */
function w23_r(i) { return (i * 9301 + 49297) % 233280 / 233280; }
function w23_ease(t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }
function w23_seg(p, a, b) { return Math.max(0, Math.min(1, (p - a) / (b - a))); }
function w23_lerp(a, b, t) { return a + (b - a) * t; }
function w23_gradV(c, y0, y1, a, b) { const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; }
function w23_gradH(c, x0, x1, a, b) { const g = c.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, a); g.addColorStop(1, b); return g; }

/* The projector. `local` = the space drawTurnaround is handed (the pad-scale frame: the hold-down
   ring is (DW/2, gy−4) and the rocket draws there at scale 1). With local=false it returns plain
   site screen space, so the same building can be painted into the cached static layer.
   Every projected point carries s: the scale to draw at, with height h in site units = h*s/1.35. */
function w23_proj(DW, DH, gy, local) {
  const GY = DH * W23_VAB.gyFrac, O = gproj(DW, DH, GY, 0, W23_VAB.padZ);
  if (!local) return (x, z) => { const q = gproj(DW, DH, GY, x, z); return { x: q.sx, y: q.sy, s: q.k * 1.35 }; };
  const K = O.k * 1.35, B = gy - 4;
  return (x, z) => { const q = gproj(DW, DH, GY, x, z);
    return { x: DW / 2 + (q.sx - DW / 2) / K, y: B + (q.sy - O.sy) / K, s: q.k / O.k }; };
}
const w23_up = (p, h) => p.y - h * p.s / 1.35;         // a point h site-units above the ground plane
function w23_quad(c, L, x0, x1, z0, z1) {              // ground-plane quad, sub-path only
  const a = L(x0, z0), b = L(x1, z0), d = L(x1, z1), e = L(x0, z1);
  c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.lineTo(d.x, d.y); c.lineTo(e.x, e.y); c.closePath();
}
/* an extruded box on the ground plane: shadow, the face toward the camera, the flank turned to
   frame centre, and the roof. Returns its corners for anyone who wants to detail it. */
function w23_box(c, L, x0, x1, z0, z1, h, top, front, side) {
  const a = L(x0, z0), b = L(x1, z0), d = L(x1, z1), e = L(x0, z1), U = (p) => w23_up(p, h);
  c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath();
  c.moveTo(a.x - 2, a.y + 1.5); c.lineTo(b.x + 2, b.y + 1.5); c.lineTo(d.x + 1.5, d.y + 1); c.lineTo(e.x - 1.5, e.y + 1); c.fill(); drawCount++;
  c.fillStyle = front; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.lineTo(b.x, U(b)); c.lineTo(a.x, U(a)); c.fill(); drawCount++;
  c.fillStyle = side; c.beginPath();
  if ((x0 + x1) / 2 < 0) { c.moveTo(b.x, b.y); c.lineTo(d.x, d.y); c.lineTo(d.x, U(d)); c.lineTo(b.x, U(b)); }
  else { c.moveTo(a.x, a.y); c.lineTo(e.x, e.y); c.lineTo(e.x, U(e)); c.lineTo(a.x, U(a)); }
  c.fill(); drawCount++;
  c.fillStyle = top; c.beginPath(); c.moveTo(a.x, U(a)); c.lineTo(b.x, U(b)); c.lineTo(d.x, U(d)); c.lineTo(e.x, U(e)); c.fill(); drawCount++;
  return { a, b, d, e, U };
}

/* ── the ship, cached ─────────────────────────────────────────────────────────────────────────
   The disassembly wants three slices of the player's rocket on screen at once and drawRocket costs
   ~30 draws a call. So the ship is baked once into an offscreen canvas per tier set and the slices
   are blitted: 1 draw each. Everything that animates (crane, platforms, crew, sparks) is still
   drawn live. If there is no document (headless sim) it falls back to clipping the real call. */
const w23_shipCache = new Map();
function w23_shipTile(c, t, dims, drawRocketFn, now) {
  if (typeof document === 'undefined') return null;
  let q = 1; if (c.getTransform) { const m = c.getTransform(); q = Math.abs(m.a) || 1; }
  q = Math.min(4, Math.max(1, q * 1.3));                       // bake a little over the on-screen scale
  const xm = dims.bodyW / 2 + 34, top = dims.totalH + 16, bot = 20;
  const key = [t.engine, t.tank, t.aero, t.hull, t.payload, q.toFixed(2), Math.round(xm)].join(',');
  let e = w23_shipCache.get(key);
  if (!e) {
    let cv, k;
    try { cv = document.createElement('canvas'); cv.width = Math.ceil(xm * 2 * q); cv.height = Math.ceil((top + bot) * q); k = cv.getContext('2d'); } catch (err) { return null; }
    if (!k) return null;
    k.setTransform(q, 0, 0, q, 0, 0); k.translate(xm, top);
    const before = drawCount; drawRocketFn(k, 0, 0, t, 0, false, now, { flaps: 0 }); drawCount = before;
    e = { cv, q, xm, top, bot }; w23_shipCache.set(key, e);
    while (w23_shipCache.size > 3) { const k0 = w23_shipCache.keys().next().value, e0 = w23_shipCache.get(k0); e0.cv.width = 0; e0.cv.height = 0; w23_shipCache.delete(k0); }
  }
  return e;
}
function w23_shipInvalidate() { for (const e of w23_shipCache.values()) { e.cv.width = 0; e.cv.height = 0; } w23_shipCache.clear(); }
/* one slice of the ship: rocket-local y0..y1 (0 = the base, up is negative), drawn as if the whole
   ship stood with its base at (x, baseY) at scale sc. */
function w23_ship(c, x, baseY, sc, t, dims, drawRocketFn, now, y0, y1) {
  if (y0 === undefined) {                                     // whole ship: the real vector draw, so the
    c.save(); c.translate(x, baseY); c.scale(sc, sc);          // hand-back to drawPadScene at p 1 is seamless
    drawRocketFn(c, 0, 0, t, 0, false, now, { flaps: 0 }); c.restore(); return;
  }
  const e = w23_shipTile(c, t, dims, drawRocketFn, now);
  const xm = dims.bodyW / 2 + 34;
  if (e) {
    const sy = Math.max(0, (e.top + y0) * e.q), sh = Math.max(1, (y1 - y0) * e.q);
    c.drawImage(e.cv, 0, sy, e.cv.width, sh, x - xm * sc, baseY + y0 * sc, xm * 2 * sc, (y1 - y0) * sc); drawCount++;
    return;
  }
  c.save(); c.translate(x, baseY); c.scale(sc, sc);
  c.beginPath(); c.rect(-xm, y0, xm * 2, y1 - y0); c.clip();
  drawRocketFn(c, 0, 0, t, 0, false, now, { flaps: 0 }); c.restore();
}

/* ── crew, batched ────────────────────────────────────────────────────────────────────────────
   Any number of people cost seven draws between them: one path per material. */
const w23_ppl = [];
function w23_person(x, y, s, i, mode) { w23_ppl.push([x, y, s, i, mode]); }   // mode 0 idle · 1 walking · 2 working
function w23_crew(c, now) {
  if (!w23_ppl.length) return;
  const pose = (p) => { const [x, y, s, i, m] = p;
    const sw = m === 1 ? Math.sin(now / 90 + i * 1.7) * 3.2 * s : 0;
    const bob = m === 1 ? Math.abs(Math.cos(now / 90 + i * 1.7)) * 1.2 * s : m === 2 ? Math.abs(Math.sin(now / 160 + i)) * 1.1 * s : 0;
    const wave = m === 2 ? Math.sin(now / 140 + i * 2) * 3 * s : 0;
    return { x, y: y - bob, s, sw, wave, m }; };
  const P = w23_ppl.map(pose);
  c.lineCap = 'round';
  c.strokeStyle = '#2A3A6B'; c.lineWidth = 2 * Math.max(0.5, P[0].s); c.beginPath();     // legs
  for (const q of P) { c.moveTo(q.x, q.y - 5 * q.s); c.lineTo(q.x - 1.6 * q.s + q.sw, q.y); c.moveTo(q.x, q.y - 5 * q.s); c.lineTo(q.x + 1.6 * q.s - q.sw, q.y); }
  c.stroke(); drawCount++;
  for (const [col, pick] of [['#FFC24D', 0], ['#FF8A3D', 1]]) {                            // hi-vis vests, two colours
    c.fillStyle = col; c.beginPath(); let any = false;
    P.forEach((q, i) => { if (w23_ppl[i][3] % 2 !== pick) return; any = true; c.rect(q.x - 2.4 * q.s, q.y - 10.5 * q.s, 4.8 * q.s, 6 * q.s); });
    if (any) { c.fill(); drawCount++; }
  }
  c.strokeStyle = '#F2C9A0'; c.lineWidth = 1.6 * Math.max(0.5, P[0].s); c.beginPath();     // arms
  for (const q of P) { const up = q.m === 2 ? -13 * q.s - q.wave : -6.5 * q.s;
    c.moveTo(q.x - 2 * q.s, q.y - 9.5 * q.s); c.lineTo(q.x - 3.5 * q.s, q.y + up);
    c.moveTo(q.x + 2 * q.s, q.y - 9.5 * q.s); c.lineTo(q.x + 3.5 * q.s, q.y + (q.m === 2 ? -7 * q.s + q.wave * 0.5 : -6.5 * q.s)); }
  c.stroke(); drawCount++;
  c.fillStyle = '#F2C9A0'; c.beginPath();                                                  // heads
  for (const q of P) { c.moveTo(q.x + 2.2 * q.s, q.y - 12.6 * q.s); c.arc(q.x, q.y - 12.6 * q.s, 2.2 * q.s, 0, 7); }
  c.fill(); drawCount++;
  for (const [col, pick] of [['#FFD54A', 0], ['#F3F4F6', 1]]) {                            // hard hats
    c.fillStyle = col; c.beginPath(); let any = false;
    P.forEach((q, i) => { if (Math.floor(w23_ppl[i][3] / 2) % 2 !== pick) return; any = true;
      c.moveTo(q.x - 2.6 * q.s, q.y - 13 * q.s); c.arc(q.x, q.y - 13 * q.s, 2.6 * q.s, Math.PI, 0); c.rect(q.x - 3.2 * q.s, q.y - 13.2 * q.s, 6.4 * q.s, 1 * q.s); });
    if (any) { c.fill(); drawCount++; }
  }
  w23_ppl.length = 0;
}

/* ── the crawler-transporter ──────────────────────────────────────────────────────────────── */
function w23_crawler(c, L, x, z, now, jack) {
  const hw = 0.085, hd = 0.021, deck = 9 * jack;
  const bx = w23_box(c, L, x - hw, x + hw, z - hd, z + hd, deck, '#98A3AE', '#5E6874', '#48515A');
  const a = bx.a, b = bx.b, s = L(x, z).s;
  c.fillStyle = '#2A2F36'; c.beginPath();                                     // tread units along the near edge
  for (let i = 0; i < 4; i++) { const f = 0.06 + i * 0.29, px = w23_lerp(a.x, b.x, f), py = w23_lerp(a.y, b.y, f);
    c.rect(px, py - 5 * s, (b.x - a.x) * 0.20, 5.5 * s); }
  c.fill(); drawCount++;
  c.fillStyle = '#F2C230'; c.beginPath();                                     // hazard stripe along the deck edge
  c.rect(a.x, w23_up(a, deck), b.x - a.x, 2.2 * s); c.fill(); drawCount++;
  c.fillStyle = '#6E7A86'; c.beginPath();                                     // hold-down pads and the driver's cab
  for (let i = 0; i < 4; i++) { const f = 0.14 + i * 0.24, px = w23_lerp(bx.e.x, bx.d.x, f), py = w23_lerp(w23_up(bx.e, deck), w23_up(bx.d, deck), f);
    c.rect(px - 2 * s, py - 2 * s, 4 * s, 3 * s); }
  c.rect(b.x - 9 * s, w23_up(b, deck + 9), 8 * s, 9 * s / 1.35); c.fill(); drawCount++;
  const beat = Math.sin(now / 260) > 0;                                       // corner beacons
  c.fillStyle = beat ? '#FFB020' : '#7A5A12'; c.beginPath();
  c.arc(a.x + 2 * s, w23_up(a, deck + 5), 1.9 * s, 0, 7); c.arc(b.x - 2 * s, w23_up(b, deck + 5), 1.9 * s, 0, 7); c.fill(); drawCount++;
  return { s, deckY: w23_up(L(x, z), deck), cx: L(x, z).x };
}

/* ── the vehicle assembly building ────────────────────────────────────────────────────────────
   Front wall cut away across the full width: you see the floor, the inner face of the left wall,
   the back wall, five service floors in the left share and the open high bay on the right, with
   the bridge crane under the roof. What is left of the facade — corner columns, the lintel and the
   sawn edge with its wall thickness showing — is painted last so the ship passes behind it.
   `st` is the live state: {work 0..1 platforms in, hook {x,y,on}, sparks 0..1}. */
function w23_vab(c, L, o, st, now) {
  const V = W23_VAB, x0 = V.x0, x1 = V.x1, z0 = V.z0, z1 = V.z1, h = o.h;
  const F0 = L(x0, z0), F1 = L(x1, z0), B1 = L(x1, z1), B0 = L(x0, z1);
  const xm = x0 + (x1 - x0) * (1 - V.bayFrac);            // where the office floors stop and the bay starts
  const Ff = w23_up(F0, h), Fr = w23_up(F1, h), Br = w23_up(B1, h), Bl = w23_up(B0, h);

  // ground shadow, cast toward the camera
  c.fillStyle = 'rgba(0,0,0,.20)'; c.beginPath();
  c.moveTo(F0.x - 3, F0.y + 2); c.lineTo(F1.x + 3, F1.y + 2); c.lineTo(B1.x + 2, B1.y + 1); c.lineTo(B0.x - 2, B0.y + 1); c.fill(); drawCount++;

  c.save();
  c.beginPath(); c.moveTo(F0.x, F0.y); c.lineTo(F1.x, F1.y); c.lineTo(F1.x, Fr); c.lineTo(F0.x, Ff); c.closePath(); c.clip();

  // ── shell interior ──
  c.fillStyle = w23_gradV(c, Bl, B0.y, '#2A3038', '#4A535D'); c.beginPath();      // back wall
  c.moveTo(B0.x, B0.y); c.lineTo(B1.x, B1.y); c.lineTo(B1.x, Br); c.lineTo(B0.x, Bl); c.fill(); drawCount++;
  c.fillStyle = '#232830'; c.beginPath();                                          // inner face of the left wall
  c.moveTo(F0.x, F0.y); c.lineTo(B0.x, B0.y); c.lineTo(B0.x, Bl); c.lineTo(F0.x, Ff); c.fill(); drawCount++;
  c.fillStyle = w23_gradV(c, B0.y, F0.y, '#5C6570', '#3E464F'); c.beginPath();     // bay floor
  w23_quad(c, L, x0, x1, z0, z1); c.fill(); drawCount++;
  c.strokeStyle = 'rgba(242,194,48,.55)'; c.lineWidth = 1; c.beginPath();          // painted floor lanes
  for (const lx of [xm + 0.02, x1 - 0.03]) { const a = L(lx, z0), b = L(lx, z1); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); }
  { const a = L(xm + 0.02, z1 - 0.012), b = L(x1 - 0.03, z1 - 0.012); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); }
  c.stroke(); drawCount++;

  // back wall furniture: a tall flag stripe over the bay, a vent bank, a clock
  const fq = L(xm + (x1 - x0) * 0.055, z1), bw = (B1.x - B0.x), fw = bw * 0.085, fgh = (B1.y - Br) * 0.30;
  c.fillStyle = '#B23E2B'; c.beginPath(); c.rect(fq.x - fw / 2, Br + (B1.y - Br) * 0.08, fw, fgh); c.fill(); drawCount++;
  c.fillStyle = 'rgba(243,244,246,.92)'; c.beginPath();                            // the stripes on it, and a wall clock
  for (let i = 0; i < 3; i++) c.rect(fq.x - fw / 2, Br + (B1.y - Br) * 0.08 + fgh * (0.18 + i * 0.28), fw, fgh * 0.12);
  c.arc(fq.x + bw * 0.055, Br + (B1.y - Br) * 0.16, 3.2 * B0.s, 0, 7); c.fill(); drawCount++;
  c.strokeStyle = 'rgba(20,24,30,.45)'; c.lineWidth = 0.8; c.beginPath();           // roof trusses over the bay
  for (let i = 0; i <= 6; i++) { const f = i / 6, ax = w23_lerp(F0.x, F1.x, f), bx2 = w23_lerp(B0.x, B1.x, f);
    c.moveTo(ax, w23_lerp(Ff, Fr, f)); c.lineTo(bx2, w23_lerp(Bl, Br, f)); }
  { const a = L(x0, z1 - 0.03), b = L(x1, z1 - 0.03); c.moveTo(a.x, w23_up(a, h * 0.93)); c.lineTo(b.x, w23_up(b, h * 0.93)); }
  c.stroke(); drawCount++;

  // the bay's own back wall: panel lines and a lit strip, so the deep end is not a flat grey
  c.strokeStyle = 'rgba(20,24,30,.24)'; c.lineWidth = 0.8; c.beginPath();
  { const a0 = L(xm, z1), a1 = L(x1, z1);
    for (let i = 0; i <= 6; i++) { const f = i / 6, px = w23_lerp(a0.x, a1.x, f);
      c.moveTo(px, w23_lerp(a0.y, a1.y, f)); c.lineTo(px, w23_lerp(w23_up(a0, h), w23_up(a1, h), f)); } }
  c.stroke(); drawCount++;
  c.fillStyle = 'rgba(255,244,194,.30)'; c.beginPath();                            // work lighting down the bay walls
  { const a0 = L(xm, z1 - 0.006), a1 = L(x1, z1 - 0.006);
    for (let i = 0; i < 4; i++) { const hh = h * (0.20 + i * 0.22);
      c.rect(a0.x, w23_lerp(w23_up(a0, hh), w23_up(a1, hh), 0) - 1.5, (a1.x - a0.x), 2.5 * a0.s); } }
  c.fill(); drawCount++;

  c.fillStyle = '#4E5862'; c.beginPath();                                          // cable reel and a tool cart on the bay floor
  { const r1 = L(x1 - 0.03, z1 - 0.014), r2 = L(xm + 0.035, z1 - 0.02);
    c.moveTo(r1.x + 7 * r1.s, r1.y - 6 * r1.s); c.ellipse(r1.x, r1.y - 6 * r1.s, 7 * r1.s, 7 * r1.s, 0, 0, 7);
    c.rect(r2.x - 6 * r2.s, r2.y - 9 * r2.s, 12 * r2.s, 9 * r2.s); }
  c.fill(); drawCount++;

  // ── the service floors, left share ──
  const nf = V.floors, fh = h / nf;
  c.fillStyle = '#6E7883'; c.beginPath();                                          // slab tops
  for (let i = 1; i < nf; i++) { const hh = i * fh;
    const a = L(x0, z0), b = L(xm, z0), d = L(xm, z1), e = L(x0, z1);
    c.moveTo(a.x, w23_up(a, hh)); c.lineTo(b.x, w23_up(b, hh)); c.lineTo(d.x, w23_up(d, hh)); c.lineTo(e.x, w23_up(e, hh)); c.closePath(); }
  c.fill(); drawCount++;
  c.fillStyle = '#39414A'; c.beginPath();                                          // slab edges, seen from below
  for (let i = 1; i < nf; i++) { const hh = i * fh, a = L(x0, z0), b = L(xm, z0);
    c.rect(a.x, w23_up(a, hh), b.x - a.x, 3.4 * a.s); }
  c.fill(); drawCount++;
  const wq = L(x0, z1 - 0.008), wq1 = L(xm, z1 - 0.008), ww = (wq1.x - wq.x);
  c.fillStyle = 'rgba(255,212,106,.70)'; c.beginPath();                            // lit windows behind each floor
  for (let i = 0; i < nf; i++) { const hh = i * fh + fh * 0.24;
    for (let j = 0; j < 7; j++) { if (w23_r(i * 11 + j * 3) < 0.30) continue;
      c.rect(wq.x + ww * (0.06 + j * 0.132), w23_up(wq, hh + fh * 0.42), ww * 0.095, fh * 0.42 * wq.s / 1.35); } }
  c.fill(); drawCount++;
  c.fillStyle = '#39414A'; c.beginPath();                                          // crates and drums on the shop floor
  for (let j = 0; j < 5; j++) { const cq = L(x0 + (xm - x0) * (0.20 + j * 0.15), z0 + 0.014), ch = 8 + w23_r(j * 9) * 9;
    c.rect(cq.x, w23_up(cq, ch), 11 * cq.s, ch * cq.s / 1.35); }
  c.fill(); drawCount++;
  c.fillStyle = '#8B96A2'; c.beginPath();                                          // machinery: tanks and lockers on the floors
  for (let i = 0; i < nf; i++) { const hh = i * fh, q = L(x0 + (xm - x0) * (0.2 + 0.5 * w23_r(i * 7 + 2)), z0 + 0.02);
    c.rect(q.x, w23_up(q, hh + fh * 0.42), 7 * q.s, fh * 0.42 * q.s / 1.35); }
  c.fill(); drawCount++;
  c.strokeStyle = 'rgba(233,238,243,.55)'; c.lineWidth = 0.8; c.beginPath();       // handrails along each floor edge
  for (let i = 1; i < nf; i++) { const hh = i * fh, a = L(x0, z0 + 0.004), b = L(xm, z0 + 0.004);
    c.moveTo(a.x, w23_up(a, hh + 8)); c.lineTo(b.x, w23_up(b, hh + 8));
    for (let j = 0; j <= 4; j++) { const f = j / 4, px = w23_lerp(a.x, b.x, f), py = w23_lerp(w23_up(a, hh), w23_up(b, hh), f);
      c.moveTo(px, py); c.lineTo(px, py - 8 * a.s / 1.35); } }
  c.stroke(); drawCount++;
  // the stair tower against the left wall, and a lift car that rides it
  { const a = L(x0 + 0.012, z1 - 0.03), b = L(x0 + 0.055, z1 - 0.03);
    c.strokeStyle = 'rgba(150,162,175,.75)'; c.lineWidth = 1; c.beginPath();
    for (let i = 0; i < nf * 2; i++) { const hh = i * fh / 2;
      c.moveTo(a.x, w23_up(a, hh)); c.lineTo(b.x, w23_up(b, hh + fh / 2)); }
    c.moveTo(a.x, a.y); c.lineTo(a.x, w23_up(a, h)); c.moveTo(b.x, b.y); c.lineTo(b.x, w23_up(b, h)); c.stroke(); drawCount++;
    const lift = (0.15 + 0.7 * (0.5 + 0.5 * Math.sin(now / 2600))) * h;
    c.fillStyle = '#9AA6B2'; c.fillRect(b.x + 2 * a.s, w23_up(a, lift + 16), 6 * a.s, 16 * a.s / 1.35); drawCount++; }

  /* ── high bay: the work platforms that swing in around the stack ──
     They live inside the bay walls: parked flat against them, they slide in to a ship's width. */
  const q0 = L(xm, o.z), q1 = L(x1, o.z), bay = { cx: (q0.x + q1.x) / 2, z: o.z, s: q0.s };
  const half = (q1.x - q0.x) / 2, gap = Math.min(half * 0.62, (o.dims.bodyW * 0.5 + 5) * bay.s);
  const lvl = [0.16, 0.40, 0.64].map((f) => w23_up(q0, h * f));
  const inn = (r) => gap + (1 - r) * (half - gap) * 0.92, reach = st.work;
  c.fillStyle = '#7C8792'; c.beginPath();
  for (const py of lvl) {
    c.rect(bay.cx - half + 1, py - 3 * bay.s, half - inn(reach), 3.4 * bay.s);
    c.rect(bay.cx + inn(reach), py - 3 * bay.s, half - inn(reach), 3.4 * bay.s); }
  c.fill(); drawCount++;
  c.strokeStyle = 'rgba(233,238,243,.55)'; c.lineWidth = 0.8; c.beginPath();
  for (const py of lvl) {                                        // handrails, and a kick of latticework under
    c.moveTo(bay.cx - half + 1, py - 8 * bay.s); c.lineTo(bay.cx - inn(reach), py - 8 * bay.s);
    c.moveTo(bay.cx + inn(reach), py - 8 * bay.s); c.lineTo(bay.cx + half - 1, py - 8 * bay.s);
    c.moveTo(bay.cx - half + 1, py); c.lineTo(bay.cx - inn(reach), py - 8 * bay.s);
    c.moveTo(bay.cx + half - 1, py); c.lineTo(bay.cx + inn(reach), py - 8 * bay.s); }
  c.stroke(); drawCount++;
  // a fitter standing at the rail on the middle platform, and one on the top one
  w23_person(bay.cx + inn(reach) + 5 * bay.s, lvl[1] - 3 * bay.s, bay.s * 0.8, 8, 2);
  w23_person(bay.cx - inn(reach) - 6 * bay.s, lvl[2] - 3 * bay.s, bay.s * 0.8, 11, 2);

  // ── the bridge crane under the roof, and its hook ──
  const cy = w23_up(L((xm + x1) / 2, o.z), h * 0.90);
  c.fillStyle = '#D9A441'; c.beginPath();
  c.rect(w23_lerp(F0.x, F1.x, 0.06), cy - 5 * bay.s, (F1.x - F0.x) * 0.92, 5 * bay.s); c.fill(); drawCount++;
  c.fillStyle = '#4A5561'; c.fillRect(st.hook.x - 7 * bay.s, cy - 9 * bay.s, 14 * bay.s, 6 * bay.s); drawCount++;
  c.strokeStyle = '#2A2F36'; c.lineWidth = 1; c.beginPath();
  c.moveTo(st.hook.x, cy - 3 * bay.s); c.lineTo(st.hook.x, st.hook.y); c.stroke(); drawCount++;
  c.strokeStyle = '#4A5561'; c.lineWidth = 2; c.beginPath();
  c.arc(st.hook.x, st.hook.y + 3 * bay.s, 3 * bay.s, -Math.PI / 2, Math.PI * 0.9); c.stroke(); drawCount++;

  o.inside(c, bay);          // the ship, its crawler and the bay crew — drawn inside the clip

  // sparks from whatever joint is being worked
  if (st.sparks > 0) {
    c.fillStyle = '#FFE9A8'; c.beginPath();
    for (let i = 0; i < 9; i++) { const ph = ((now / 520) + w23_r(i * 13 + 5)) % 1;
      const a = w23_r(i * 7 + 1) * 6.28, r = ph * 13 * bay.s;
      c.rect(st.sparks_x + Math.cos(a) * r, st.sparks_y + Math.sin(a) * r * 0.7 + ph * ph * 9 * bay.s, 1.4 * bay.s, 1.4 * bay.s); }
    c.fill(); drawCount++;
    c.fillStyle = 'rgba(255,233,168,' + (0.20 * st.sparks) + ')'; c.beginPath();
    c.arc(st.sparks_x, st.sparks_y, 14 * bay.s, 0, 7); c.fill(); drawCount++;
  }
  c.restore();

  // ── what is left of the facade: corner columns, lintel, and the sawn edge ──
  c.fillStyle = '#9AA6B2'; c.beginPath();
  c.rect(F0.x, Ff, 5 * F0.s, F0.y - Ff); c.rect(F1.x - 5 * F1.s, Fr, 5 * F1.s, F1.y - Fr);
  c.moveTo(F0.x, Ff); c.lineTo(F1.x, Fr); c.lineTo(F1.x, Fr + 9 * F1.s); c.lineTo(F0.x, Ff + 9 * F0.s); c.closePath();
  c.fill(); drawCount++;
  c.fillStyle = '#C3CDD6'; c.beginPath();                                       // wall thickness on the cut, catching light
  c.rect(F0.x + 5 * F0.s, Ff + 9 * F0.s, 2 * F0.s, F0.y - Ff - 9 * F0.s);
  c.rect(F1.x - 7 * F1.s, Fr + 9 * F1.s, 2 * F1.s, F1.y - Fr - 9 * F1.s);
  c.moveTo(F0.x, Ff + 9 * F0.s); c.lineTo(F1.x, Fr + 9 * F1.s); c.lineTo(F1.x, Fr + 11 * F1.s); c.lineTo(F0.x, Ff + 11 * F0.s); c.closePath();
  c.fill(); drawCount++;
  c.strokeStyle = 'rgba(58,67,77,.55)'; c.lineWidth = 0.8; c.beginPath();       // sawtooth hatch, so the cut reads as a cut
  for (let i = 0; i < 26; i++) { const f = i / 26, x = w23_lerp(F0.x, F1.x, f), y = w23_lerp(Ff, Fr, f) + 11 * F0.s;
    c.moveTo(x, y); c.lineTo(x + 3, y + 4); }
  c.stroke(); drawCount++;
  // roof: a shallow cap with ribs and a red band, plus the flank turned toward frame centre
  c.fillStyle = '#6B7783'; c.beginPath();
  c.moveTo(F1.x, Fr); c.lineTo(B1.x, Br); c.lineTo(B1.x, B1.y); c.lineTo(F1.x, F1.y); c.fill(); drawCount++;
  c.fillStyle = '#8D99A6'; c.beginPath();
  c.moveTo(F0.x, Ff); c.lineTo(F1.x, Fr); c.lineTo(B1.x, Br); c.lineTo(B0.x, Bl); c.fill(); drawCount++;
  c.strokeStyle = 'rgba(60,72,84,.45)'; c.lineWidth = 0.8; c.beginPath();
  for (let i = 1; i < 12; i++) { const f = i / 12; c.moveTo(w23_lerp(F0.x, F1.x, f), w23_lerp(Ff, Fr, f)); c.lineTo(w23_lerp(B0.x, B1.x, f), w23_lerp(Bl, Br, f)); }
  c.stroke(); drawCount++;
  const RP = (f, g) => ({ x: w23_lerp(w23_lerp(F0.x, F1.x, f), w23_lerp(B0.x, B1.x, f), g),
                          y: w23_lerp(w23_lerp(Ff, Fr, f), w23_lerp(Bl, Br, f), g) });   // a point on the roof
  c.fillStyle = 'rgba(160,205,235,.75)'; c.beginPath();                    // skylight strips
  for (let i = 0; i < 5; i++) { const a = RP(0.10 + i * 0.16, 0.30), b = RP(0.10 + i * 0.16, 0.72);
    c.moveTo(a.x, a.y); c.lineTo(a.x + (F1.x - F0.x) * 0.055, a.y); c.lineTo(b.x + (F1.x - F0.x) * 0.055, b.y); c.lineTo(b.x, b.y); c.closePath(); }
  c.fill(); drawCount++;
  c.fillStyle = '#6B7783'; c.beginPath();                                   // roof plant: fans, ducts, a stair head
  for (let i = 0; i < 4; i++) { const a = RP(0.30 + i * 0.15, 0.16), r = 5 * F0.s;
    c.moveTo(a.x + r, a.y); c.ellipse(a.x, a.y, r, r * 0.42, 0, 0, 7); c.rect(a.x - r, a.y - 4 * F0.s, r * 2, 4 * F0.s); }
  { const a = RP(0.80, 0.55); c.rect(a.x, a.y - 10 * F0.s, 16 * F0.s, 10 * F0.s); }
  c.fill(); drawCount++;
  c.fillStyle = '#E0523A'; c.beginPath();                                   // the house stripe, along the eaves
  c.moveTo(w23_lerp(F0.x, F1.x, 0.06), w23_lerp(Ff, Fr, 0.06)); c.lineTo(w23_lerp(F0.x, F1.x, 0.34), w23_lerp(Ff, Fr, 0.34));
  c.lineTo(w23_lerp(F0.x, F1.x, 0.34), w23_lerp(Ff, Fr, 0.34) + 5 * F0.s); c.lineTo(w23_lerp(F0.x, F1.x, 0.06), w23_lerp(Ff, Fr, 0.06) + 5 * F0.s);
  c.closePath(); c.fill(); drawCount++;
  c.fillStyle = Math.sin(now / 620) > 0 ? '#FF4D4D' : '#7A2E28';                 // roof beacon
  c.beginPath(); c.arc(w23_lerp(F0.x, F1.x, 0.62), w23_lerp(Ff, Fr, 0.62) - 3 * F0.s, 2 * F0.s, 0, 7); c.fill(); drawCount++;
}

/* ── the sequence ─────────────────────────────────────────────────────────────────────────────
   p 0..1 across the whole turnaround (TURNAROUND_S seconds). The beats are W23_BEATS:
     0.000–0.045  the crawler backs under the tower                       (recover)
     0.045–0.085  the arms hand the booster over and swing away           (recover)
     0.085–0.345  the ferry: out along the haul road and into the bay     (clean)
     0.345–0.415  platforms swing in, the bridge crane hooks the nose     (stack)
     0.415–0.535  the stack comes apart: nose up, tank up, engine down    (stack)
     0.535–0.640  work on the open joints                                 (stack)
     0.600–0.712  back together, tank first                               (stack)
     0.712–0.775  crane away, close-out, fuelling                         (fuel)
     0.775–0.925  the rollout, back down the haul road to the pad         (check)
     0.925–1.000  hard down on the ring, crawler out, crew behind the line (paper) */
function drawTurnaround(c, gy, DW, DH, p, t, now, drawRocketFn, rocketDimsFn) {
  p = Math.max(0, Math.min(1, p));
  const L = w23_proj(DW, DH, gy, true), V = W23_VAB;
  const dims = rocketDimsFn(t), totalH = dims.totalH || (dims.bodyH + dims.noseH);
  const bands = [[-dims.bodyH * 0.32, 16], [-dims.bodyH, -dims.bodyH * 0.32], [-totalH - 14, -dims.bodyH]];  // engine · tank · nose
  /* the bay is always tall enough for the stack it holds, and never shorter than twice the hangar */
  const h = Math.max(V.hMin, (totalH + V.hPad) * 1.35);
  const bayX = W23_ROUTE[4][0], bayZ = W23_ROUTE[4][1], DECK = 9;   // deck height, site units

  // where the crawler is: it backs in, runs the route out and back, then pulls off the ring
  const ferry = w23_ease(w23_seg(p, 0.085, 0.345)), roll = w23_ease(w23_seg(p, 0.775, 0.925));
  const u = p < 0.55 ? ferry : 1 - roll;
  let cw = w23_route(u);
  if (p < 0.045) { const v = w23_ease(p / 0.045); cw = { x: w23_lerp(0.34, cw.x, v), z: w23_lerp(0.352, cw.z, v) }; }
  else if (p > 0.968) { const v = w23_ease((p - 0.968) / 0.032); cw = { x: w23_lerp(cw.x, 0.30, v), z: w23_lerp(cw.z, 0.368, v) }; }
  const inside = cw.z > V.z0 + 0.004 && cw.x < V.x1;
  const onDeck = w23_ease(w23_seg(p, 0.045, 0.085)) * (1 - w23_ease(w23_seg(p, 0.925, 0.968)));
  const moving = (p > 0.085 && p < 0.345) || (p > 0.775 && p < 0.925);

  w23_haulRoad(c, L);
  const st = w23_state(p, now, L, bayX, bayZ, h, DECK, dims, totalH);
  const ship = (cc) => w23_stack(cc, L, cw, p, now, t, dims, drawRocketFn, totalH, bands, st, DECK, onDeck, moving);

  if (inside) w23_vab(c, L, { h, z: bayZ, dims, inside: ship }, st, now);
  else { w23_vab(c, L, { h, z: bayZ, dims, inside: () => {} }, st, now); ship(c); }

  w23_towerArms(c, L, p, now, dims, DECK);
  w23_outsideCrew(c, L, p, cw, now, moving);
  w23_crew(c, now);
}

/* the catch tower hands the booster over: the arms hold it, then swing back to the gantry.
   The gantry itself is in the static site layer at x −0.175, z 0.435. */
function w23_towerArms(c, L, p, now, dims, DECK) {
  if (p > 0.16) return;
  const a = w23_ease(1 - w23_seg(p, 0.055, 0.16));                 // 1 = on the booster, 0 = stowed
  const G = L(-0.175, 0.435), R = L(0, 0.42);
  const gripY = R.y - (DECK + dims.bodyH * 0.62) * R.s;
  const tipX = w23_lerp(G.x + 10 * G.s, R.x - dims.bodyW * 0.42 * R.s, a);
  c.save(); c.globalAlpha = 0.35 + 0.65 * a;
  c.strokeStyle = '#98A4AF'; c.lineWidth = 4 * R.s; c.lineCap = 'round'; c.beginPath();
  c.moveTo(G.x, gripY - 3 * R.s); c.lineTo(tipX, gripY - 2 * R.s);
  c.moveTo(G.x, gripY + 4 * R.s); c.lineTo(tipX, gripY + 5 * R.s); c.stroke(); drawCount++;
  c.fillStyle = '#F2C230'; c.fillRect(tipX - 3 * R.s, gripY - 6 * R.s, 4 * R.s, 12 * R.s); drawCount++;
  c.restore();
  if (p < 0.09) {                                                   // steam off the hot engine bay
    c.fillStyle = 'rgba(233,238,243,' + (0.30 * (1 - p / 0.09)) + ')'; c.beginPath();
    for (let i = 0; i < 5; i++) { const ph = ((now / 1300) + w23_r(i * 11 + 3)) % 1;
      c.arc(R.x + (w23_r(i * 5) - 0.5) * 26 * R.s, R.y - 4 * R.s - ph * 26 * R.s, (3 + ph * 7) * R.s, 0, 7); }
    c.fill(); drawCount++;
  }
}

/* the ship on its crawler — in one piece, or in three with the crane holding the top of the stack */
function w23_stack(c, L, cw, p, now, t, dims, drawRocketFn, totalH, bands, st, DECK, onDeck, moving) {
  const q = L(cw.x, cw.z);
  w23_crawler(c, L, cw.x, cw.z, now, 1);
  /* the ship stands on the hold-down ring at both ends of the sequence and on the deck in between,
     so at p 0 and p 1 it is exactly where drawPadScene would have drawn it. */
  const R = L(W23_ROUTE[0][0], W23_ROUTE[0][1]), deckY = w23_up(q, DECK);
  const baseY = w23_lerp(R.y, deckY, onDeck), sc = w23_lerp(R.s, q.s, onDeck);
  const x = w23_lerp(R.x, q.x, onDeck) + (moving ? Math.sin(now / 700) * 0.8 * sc : 0);
  if (st.apartN < 0.4 && st.apartT < 0.4) { w23_ship(c, x, baseY, sc, t, dims, drawRocketFn, now); return; }
  w23_ship(c, x, baseY, sc, t, dims, drawRocketFn, now, bands[0][0], bands[0][1]);            // engine section, on the deck
  w23_ship(c, x, baseY - st.apartT, sc, t, dims, drawRocketFn, now, bands[1][0], bands[1][1]); // the tank
  w23_ship(c, x, baseY - st.apartN, sc, t, dims, drawRocketFn, now, bands[2][0], bands[2][1]); // the nose
  w23_person(x + (dims.bodyW * 0.5 + 9) * sc, baseY - st.apartT - dims.bodyH * 0.30 * sc, sc * 0.8, 3, 2);
  w23_person(x - (dims.bodyW * 0.5 + 11) * sc, baseY - st.apartN - dims.bodyH * 0.96 * sc, sc * 0.8, 6, 2);
}

/* the crawler route, u 0..1 from the pad to the middle of the bay — Catmull-Rom over W23_ROUTE */
function w23_route(u) {
  const R = W23_ROUTE, n = R.length - 1, f = Math.max(0, Math.min(0.9999, u)) * n, i = Math.floor(f), s = f - i;
  const P = (j) => R[Math.max(0, Math.min(n, j))];
  const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
  const cr = (a, b, cc, d) => 0.5 * ((2 * b) + (-a + cc) * s + (2 * a - 5 * b + 4 * cc - d) * s * s + (-a + 3 * b - 3 * cc + d) * s * s * s);
  return { x: cr(p0[0], p1[0], p2[0], p3[0]), z: cr(p0[1], p1[1], p2[1], p3[1]) };
}

/* the haul road the crawler runs on — a strip laid along the route, and the pad end of it */
function w23_haulRoad(c, L) {
  c.fillStyle = '#8A8579'; c.beginPath();
  const N = 14, pts = [];
  for (let i = 0; i <= N; i++) pts.push(w23_route(i / N));
  for (let i = 0; i <= N; i++) { const q = L(pts[i].x - 0.065, pts[i].z); i ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y); }
  for (let i = N; i >= 0; i--) { const q = L(pts[i].x + 0.065, pts[i].z); c.lineTo(q.x, q.y); }
  c.closePath(); c.fill(); drawCount++;
  c.strokeStyle = 'rgba(60,66,74,.30)'; c.lineWidth = 0.8; c.beginPath();
  for (let i = 0; i <= N; i++) { const q = L(pts[i].x, pts[i].z); i ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y); }
  c.stroke(); drawCount++;
}

/* the animated state shared by the building and the ship: platforms, hook, sparks, separation */
function w23_state(p, now, L, bayX, bayZ, h, DECK, dims, totalH) {
  const q = L(bayX, bayZ), deckY = w23_up(q, DECK), s = q.s;
  const work = w23_ease(w23_seg(p, 0.345, 0.40)) * (1 - w23_ease(w23_seg(p, 0.700, 0.745)));
  /* apart: the nose lifts first, then the tank; they come back in the other order */
  const apartN = w23_ease(w23_seg(p, 0.415, 0.500)) - w23_ease(w23_seg(p, 0.645, 0.712));
  const apartT = w23_ease(w23_seg(p, 0.455, 0.535)) - w23_ease(w23_seg(p, 0.600, 0.668));
  const gapN = 46 * s, gapT = 22 * s;
  const holding = p > 0.40 && p < 0.72;
  const noseTop = deckY - (totalH - 4) * s;
  const hookY = holding ? noseTop - apartN * gapN - 10 * s : w23_up(q, h * 0.90) + 26 * s + 14 * s * Math.sin(now / 1400);
  const hookX = q.x + (holding ? 0 : 30 * s * Math.sin(now / 2300));
  const sp = Math.max(0, Math.min(1, Math.sin(w23_seg(p, 0.50, 0.64) * Math.PI) * 1.6));
  return { work, apartN: apartN * gapN, apartT: apartT * gapT, hook: { x: hookX, y: hookY },
           sparks: sp, sparks_x: q.x + 7 * s, sparks_y: deckY - dims.bodyH * 0.62 * s, deckY, s };
}

/* the ship on its crawler, in one piece or in three */
function w23_ship_and_crawler(c, L, at, p, now, t, dims, drawRocketFn, totalH, bands, st, DECK, onDeck, bayX, bayZ, h) {
  const q = L(at.x, at.z), sc = q.s;
  const sway = (p > 0.085 && p < 0.93) ? Math.sin(now / 700) * 0.7 * sc : 0;
  const cr = w23_crawler(c, L, at.x, at.z, now, 1);
  const baseY = cr.deckY * onDeck + (q.y) * (1 - onDeck);            // the ring at each end, the deck in between
  const x = q.x + sway * onDeck;
  const apart = st.apartN > 0.01 || st.apartT > 0.01;
  if (!apart) { w23_ship(c, x, baseY, sc, t, dims, drawRocketFn, now); return; }
  // three slices, lifted apart: engine on the deck, tank up a little, nose up a lot
  w23_ship(c, x, baseY, sc, t, dims, drawRocketFn, now, bands[0][0], bands[0][1]);
  w23_ship(c, x, baseY - st.apartT, sc, t, dims, drawRocketFn, now, bands[1][0], bands[1][1]);
  w23_ship(c, x, baseY - st.apartN, sc, t, dims, drawRocketFn, now, bands[2][0], bands[2][1]);
  // the crews that are on it: one at each open joint
  const px = x + (dims.bodyW * 0.5 + 10) * sc;
  w23_person(px, baseY - st.apartT - dims.bodyH * 0.32 * sc + 3 * sc, sc * 0.85, 3, 2);
  w23_person(x - (dims.bodyW * 0.5 + 12) * sc, baseY - st.apartN - dims.bodyH * sc + 3 * sc, sc * 0.85, 6, 2);
}

/* the people outside: two walk the ship across, the rest clear the pad at the end */
function w23_outsideCrew(c, L, p, at, now, moving) {
  if (moving && at.z < W23_VAB.z0 + 0.01) {
    const lead = w23_route(Math.max(0, Math.min(1, (p < 0.5 ? w23_ease(w23_seg(p, 0.085, 0.345)) : 1 - w23_ease(w23_seg(p, 0.775, 0.925))) + 0.05)));
    for (let i = 0; i < 2; i++) { const q = L(at.x + (i ? 0.10 : -0.10), at.z - 0.014);
      w23_person(q.x, q.y, q.s * 0.9, i, 1); }
    const g = L(lead.x, lead.z - 0.03); w23_person(g.x, g.y, g.s * 0.9, 4, 1);
  }
  if (p >= 0.86) {   // the pad crew back off behind the safe line
    const u = w23_ease(w23_seg(p, 0.86, 0.99));
    for (let i = 0; i < 4; i++) {
      const q = L(w23_lerp(-0.26 - i * 0.03, -0.05 + i * 0.09, 1 - u), w23_lerp(0.31, 0.19, u) - i * 0.006);
      w23_person(q.x, q.y, q.s * 0.95, i + 5, u < 1 ? 1 : 0);
    }
    c.save(); c.globalAlpha = u; c.strokeStyle = '#F2C230'; c.lineWidth = 1.4; c.beginPath();
    const a = L(-0.34, 0.225), b = L(0.40, 0.225); c.moveTo(a.x, a.y - 6 * a.s); c.lineTo(b.x, b.y - 6 * b.s); c.stroke(); c.restore(); drawCount++;
  }
}
