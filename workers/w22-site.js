/* ══════════════════════════════════════════════════════════════════════════════
   W22 · T66 · the rebuilt launch site — ground layout + pad life
   ------------------------------------------------------------------------------
   REPLACES (delete the old definitions when splicing):
     w16_farm  w16_roads  w16_stand  w16_carpark  w16_watertower  w16_antennas
     w16_yard  w16_helipad  w16_static      and      drawLife
   KEEPS, unchanged — these must stay in the app, this fragment calls them:
     gproj · w16_layer/w16_cache/siteInvalidate/w16_theme/w16_r/w16_gradV/w16_gradH/w16_ell
     w16_quad · w16_box · w16_tank · w16_pad · w16_vehicle · w16_masts · w16_bunker
     w17_rnd/w17_cyc/w17_seg/w17_ease · w17_person · w17_sheep · w17_flag · w17_windsock
     w17_tractor · w17_truck · w17_cart · w17_jet · w17_birds · w17_heli · w17_scientist
   TWO EDITS REQUIRED IN drawSite() — the pond and the flagpoles moved, so its two
   live blocks now point at bare grass. Delete both; drawLife paints them instead:
     · the "// live: pond ripple" block (3 lines, ends `c.fill(); drawCount++;`)
     · the "// live: American flags on the three poles" for-loop (6 lines)
   Everything else drawSite does (sea glint, sailboat, floodlight glow, gantry and
   crane beacons, windsock) still lands — the apron and its furniture did not move.

   THE GROUND CONTRACT.  gproj(DW,DH,gy,x,z); with gy = DH*0.34 the horizon is at
   z 0.626 and the frame bottom at z 0.071, so every extent below sits in
   0.078 .. 0.615.  The pad apron owns x ±0.38, z 0.305–0.475 and has not moved.
   ══════════════════════════════════════════════════════════════════════════════ */

/* ── shared geometry ─────────────────────────────────────────────────────────── */

var W22_HZ = 0.615;                     /* deepest z anything is allowed to touch */

/* a closed ground-plane polygon from [[x,z],…] — sub-path only, caller fills */
function w16_poly(c, P, pts) {
  var p = P(pts[0][0], pts[0][1]); c.moveTo(p.sx, p.sy);
  for (var i = 1; i < pts.length; i++) { p = P(pts[i][0], pts[i][1]); c.lineTo(p.sx, p.sy); }
  c.closePath();
}

/* a gabled shed: walls, two roof slopes meeting on a ridge, and the visible gable end */
function w16_shed(c, P, x0, x1, z0, z1, h, rise, wall, wallDk, roof, roofDk) {
  var a = P(x0, z0), b = P(x1, z0), d = P(x1, z1), e = P(x0, z1);
  var mz = (z0 + z1) / 2, m0 = P(x0, mz), m1 = P(x1, mz);
  var up = function (p, hh) { return p.sy - hh * p.k; };
  c.fillStyle = 'rgba(0,0,0,.17)'; c.beginPath();
  c.moveTo(a.sx - 2, a.sy + 2); c.lineTo(b.sx + 3, b.sy + 2); c.lineTo(d.sx + 2, d.sy + 1); c.lineTo(e.sx - 2, e.sy + 1); c.fill(); drawCount++;
  c.fillStyle = wall; c.beginPath();                                     /* front wall */
  c.moveTo(a.sx, a.sy); c.lineTo(b.sx, b.sy); c.lineTo(b.sx, up(b, h)); c.lineTo(a.sx, up(a, h)); c.fill(); drawCount++;
  var rightFlank = (x0 + x1) / 2 < 0;
  c.fillStyle = wallDk; c.beginPath();                                   /* the flank turned to centre */
  if (rightFlank) { c.moveTo(b.sx, b.sy); c.lineTo(d.sx, d.sy); c.lineTo(d.sx, up(d, h)); c.lineTo(b.sx, up(b, h)); }
  else { c.moveTo(a.sx, a.sy); c.lineTo(e.sx, e.sy); c.lineTo(e.sx, up(e, h)); c.lineTo(a.sx, up(a, h)); }
  c.fill(); drawCount++;
  c.fillStyle = roof; c.beginPath();                                     /* near slope */
  c.moveTo(a.sx, up(a, h)); c.lineTo(b.sx, up(b, h)); c.lineTo(m1.sx, up(m1, h + rise)); c.lineTo(m0.sx, up(m0, h + rise)); c.fill(); drawCount++;
  c.fillStyle = roofDk; c.beginPath();                                   /* far slope */
  c.moveTo(m0.sx, up(m0, h + rise)); c.lineTo(m1.sx, up(m1, h + rise)); c.lineTo(d.sx, up(d, h)); c.lineTo(e.sx, up(e, h)); c.fill(); drawCount++;
  c.fillStyle = wallDk; c.beginPath();                                   /* gable triangle on the visible end */
  if (rightFlank) { c.moveTo(b.sx, up(b, h)); c.lineTo(m1.sx, up(m1, h + rise)); c.lineTo(d.sx, up(d, h)); }
  else { c.moveTo(a.sx, up(a, h)); c.lineTo(m0.sx, up(m0, h + rise)); c.lineTo(e.sx, up(e, h)); }
  c.fill(); drawCount++;
  return { a: a, b: b, d: d, e: e, up: up };
}

/* a tall process column: shell, lit edge, hoops, a ladder cage and a head platform */
function w16_col(c, p, r, h, cap) {
  var R = r * p.k, H = h * p.k;
  c.fillStyle = 'rgba(0,0,0,.16)'; c.beginPath(); c.ellipse(p.sx + 2, p.sy + 1, R * 1.2, R * 0.36, 0, 0, 7); c.fill(); drawCount++;
  c.fillStyle = w16_gradH(c, p.sx - R, p.sx + R, '#E4EAEF', '#8B98A5');
  c.beginPath(); c.rect(p.sx - R, p.sy - H, R * 2, H); c.ellipse(p.sx, p.sy - H, R, R * 0.34, 0, 0, 7); c.fill(); drawCount++;
  c.strokeStyle = 'rgba(88,102,118,.5)'; c.lineWidth = Math.max(0.6, 0.9 * p.k); c.beginPath();
  for (var i = 1; i < 5; i++) { var y = p.sy - H * i / 5; c.moveTo(p.sx - R, y); c.lineTo(p.sx + R, y); }
  c.moveTo(p.sx + R * 0.72, p.sy); c.lineTo(p.sx + R * 0.72, p.sy - H);                 /* ladder stringer */
  for (var j = 0; j < 14; j++) { var yy = p.sy - H * j / 14; c.moveTo(p.sx + R * 0.5, yy); c.lineTo(p.sx + R * 0.95, yy); }
  c.stroke(); drawCount++;
  if (cap) { c.fillStyle = '#6B7783'; c.fillRect(p.sx - R * 1.5, p.sy - H - 2.5 * p.k, R * 3, 2.5 * p.k); drawCount++; }
}

/* a spherical gas tank on six legs */
function w16_sphere(c, p, r) {
  var R = r * p.k;
  c.fillStyle = 'rgba(0,0,0,.16)'; c.beginPath(); c.ellipse(p.sx + 2, p.sy + 1, R * 1.1, R * 0.3, 0, 0, 7); c.fill(); drawCount++;
  c.strokeStyle = '#7D8996'; c.lineWidth = Math.max(0.7, 1.2 * p.k); c.beginPath();
  for (var i = -2; i <= 2; i++) { c.moveTo(p.sx + i * R * 0.42, p.sy); c.lineTo(p.sx + i * R * 0.30, p.sy - R * 1.0); }
  c.stroke(); drawCount++;
  c.fillStyle = w16_gradH(c, p.sx - R, p.sx + R, '#F0F4F7', '#96A2AF');
  c.beginPath(); c.arc(p.sx, p.sy - R * 1.55, R, 0, 7); c.fill(); drawCount++;
  c.fillStyle = 'rgba(255,255,255,.42)'; c.beginPath(); c.ellipse(p.sx - R * 0.32, p.sy - R * 1.9, R * 0.34, R * 0.22, -0.5, 0, 7); c.fill(); drawCount++;
  c.strokeStyle = 'rgba(96,110,126,.45)'; c.lineWidth = Math.max(0.5, 0.8 * p.k);
  c.beginPath(); c.ellipse(p.sx, p.sy - R * 1.55, R, R * 0.30, 0, 0, 7); c.stroke(); drawCount++;
}

/* a horizontal bullet tank on saddles */
function w16_htank(c, p, len, r) {
  var L = len * p.k, R = r * p.k;
  c.fillStyle = 'rgba(0,0,0,.16)'; c.beginPath(); c.ellipse(p.sx, p.sy + 1, L * 0.55, R * 0.34, 0, 0, 7); c.fill(); drawCount++;
  c.fillStyle = '#6B7783'; c.fillRect(p.sx - L * 0.34, p.sy - R * 0.7, R * 0.34, R * 0.7); c.fillRect(p.sx + L * 0.26, p.sy - R * 0.7, R * 0.34, R * 0.7); drawCount++;
  c.fillStyle = w16_gradV(c, p.sy - R * 2.5, p.sy - R * 0.5, '#F2F6F9', '#93A0AD');
  c.beginPath(); c.roundRect(p.sx - L / 2, p.sy - R * 2.4, L, R * 1.7, R * 0.85); c.fill(); drawCount++;
  c.strokeStyle = 'rgba(96,110,126,.5)'; c.lineWidth = Math.max(0.5, 0.8 * p.k); c.beginPath();
  for (var i = 1; i < 4; i++) { var x = p.sx - L / 2 + L * i / 4; c.moveTo(x, p.sy - R * 2.35); c.lineTo(x, p.sy - R * 0.75); }
  c.stroke(); drawCount++;
}

/* a banded stack — chimney or flare mast. Returns the tip, so the live layer can light it. */
function w16_stack(c, p, r, h, bands) {
  var R = r * p.k, H = h * p.k;
  c.fillStyle = 'rgba(0,0,0,.15)'; c.beginPath(); c.ellipse(p.sx + 2, p.sy + 1, R * 1.5, R * 0.4, 0, 0, 7); c.fill(); drawCount++;
  c.fillStyle = w16_gradH(c, p.sx - R, p.sx + R, '#DCE3EA', '#8A949E'); c.beginPath();
  c.moveTo(p.sx - R * 1.5, p.sy); c.lineTo(p.sx - R * 0.7, p.sy - H); c.lineTo(p.sx + R * 0.7, p.sy - H); c.lineTo(p.sx + R * 1.5, p.sy); c.fill(); drawCount++;
  if (bands) { c.fillStyle = '#C24E42'; c.beginPath();
    for (var i = 0; i < 3; i++) { var t = 0.32 + i * 0.22, w = R * (1.5 - 0.8 * t);
      c.rect(p.sx - w, p.sy - H * t, w * 2, H * 0.055); }
    c.fill(); drawCount++; }
  c.strokeStyle = 'rgba(120,134,150,.7)'; c.lineWidth = Math.max(0.5, 0.8 * p.k); c.beginPath();
  c.moveTo(p.sx + R * 0.9, p.sy); c.lineTo(p.sx + R * 0.55, p.sy - H); c.stroke(); drawCount++;
  return { sx: p.sx, sy: p.sy - H, k: p.k };
}

/* a hyperbolic cooling tower */
function w16_cool(c, p, r, h) {
  var R = r * p.k, H = h * p.k;
  c.fillStyle = 'rgba(0,0,0,.16)'; c.beginPath(); c.ellipse(p.sx + 2, p.sy + 1, R * 1.1, R * 0.3, 0, 0, 7); c.fill(); drawCount++;
  c.fillStyle = w16_gradH(c, p.sx - R, p.sx + R, '#D8DFE6', '#8E9BA8'); c.beginPath();
  c.moveTo(p.sx - R, p.sy);
  c.quadraticCurveTo(p.sx - R * 0.42, p.sy - H * 0.62, p.sx - R * 0.72, p.sy - H);
  c.lineTo(p.sx + R * 0.72, p.sy - H);
  c.quadraticCurveTo(p.sx + R * 0.42, p.sy - H * 0.62, p.sx + R, p.sy); c.fill(); drawCount++;
  c.fillStyle = '#5C6874'; c.beginPath(); c.ellipse(p.sx, p.sy - H, R * 0.72, R * 0.20, 0, 0, 7); c.fill(); drawCount++;
  c.strokeStyle = 'rgba(255,255,255,.30)'; c.lineWidth = Math.max(0.5, 0.7 * p.k); c.beginPath();
  for (var i = 1; i < 4; i++) { var y = p.sy - H * i / 4, w = R * (1 - 0.34 * (i / 4)); c.moveTo(p.sx - w, y); c.lineTo(p.sx + w, y); }
  c.stroke(); drawCount++;
}

/* a lattice pylon */
function w16_pylon(c, p, h) {
  var H = h * p.k, W = H * 0.22;
  c.strokeStyle = '#93A0AD'; c.lineWidth = Math.max(0.7, 1.1 * p.k); c.beginPath();
  c.moveTo(p.sx - W, p.sy); c.lineTo(p.sx - W * 0.22, p.sy - H); c.moveTo(p.sx + W, p.sy); c.lineTo(p.sx + W * 0.22, p.sy - H);
  for (var i = 1; i < 5; i++) { var t = i / 5, y = p.sy - H * t, w = W * (1 - 0.78 * t);
    c.moveTo(p.sx - w, y); c.lineTo(p.sx + w, y); }
  c.moveTo(p.sx - W * 0.9, p.sy - H * 0.72); c.lineTo(p.sx + W * 0.9, p.sy - H * 0.72);   /* cross-arms */
  c.moveTo(p.sx - W * 0.7, p.sy - H * 0.90); c.lineTo(p.sx + W * 0.7, p.sy - H * 0.90);
  c.stroke(); drawCount++;
}

/* a lamp post; sy is the foot */
function w16_lamp(c, p, h) {
  var H = h * p.k;
  c.strokeStyle = '#9AA6B2'; c.lineWidth = Math.max(0.7, 1.1 * p.k); c.beginPath();
  c.moveTo(p.sx, p.sy); c.lineTo(p.sx, p.sy - H); c.stroke(); drawCount++;
  c.fillStyle = '#E9EEF3'; c.beginPath(); c.ellipse(p.sx, p.sy - H, 3.4 * p.k, 1.5 * p.k, 0, 0, 7); c.fill(); drawCount++;
}

/* one tree; two lobes so it does not read as a lollipop */
function w16_tree(c, p, r) {
  var R = r * p.k;
  c.fillStyle = 'rgba(0,0,0,.16)'; c.beginPath(); c.ellipse(p.sx + 2, p.sy + 1, R * 0.9, R * 0.28, 0, 0, 7); c.fill(); drawCount++;
  c.strokeStyle = '#6B4A2E'; c.lineWidth = Math.max(0.9, 1.5 * p.k); c.beginPath();
  c.moveTo(p.sx, p.sy); c.lineTo(p.sx, p.sy - R * 0.95); c.stroke(); drawCount++;
  c.fillStyle = '#4E7C46'; c.beginPath(); c.ellipse(p.sx, p.sy - R * 1.42, R, R * 0.95, 0, 0, 7); c.fill(); drawCount++;
  c.fillStyle = '#63975A'; c.beginPath(); c.ellipse(p.sx - R * 0.25, p.sy - R * 1.62, R * 0.6, R * 0.55, 0, 0, 7); c.fill(); drawCount++;
}

/* chain-link along a polyline of [x,z] points; 2 draws whatever its length */
function w16_fenceRun(c, P, pts, h, mesh) {
  var i, j, a, b, t;
  if (mesh) {
    c.fillStyle = 'rgba(226,234,240,.15)'; c.beginPath();
    for (i = 0; i < pts.length - 1; i++) {
      a = P(pts[i][0], pts[i][1]); b = P(pts[i + 1][0], pts[i + 1][1]);
      c.moveTo(a.sx, a.sy); c.lineTo(b.sx, b.sy); c.lineTo(b.sx, b.sy - h * b.k); c.lineTo(a.sx, a.sy - h * a.k); c.closePath();
    }
    c.fill(); drawCount++;
  }
  c.strokeStyle = 'rgba(202,212,222,.85)'; c.lineWidth = 0.9; c.beginPath();
  for (i = 0; i < pts.length - 1; i++) {
    a = P(pts[i][0], pts[i][1]); b = P(pts[i + 1][0], pts[i + 1][1]);
    var n = Math.max(2, Math.min(30, Math.round(Math.abs(b.sx - a.sx) / 16 + Math.abs(b.sy - a.sy) / 10)));
    for (j = 0; j <= n; j++) { t = j / n;
      var sx = a.sx + (b.sx - a.sx) * t, sy = a.sy + (b.sy - a.sy) * t, kk = a.k + (b.k - a.k) * t;
      c.moveTo(sx, sy); c.lineTo(sx, sy - h * kk); }
    for (j = 1; j <= 3; j++) { t = j / 3;
      c.moveTo(a.sx, a.sy - h * a.k * t); c.lineTo(b.sx, b.sy - h * b.k * t); }
  }
  c.stroke(); drawCount++;
}

/* ══════════ the far farm — now the RIGHT of the frame ══════════
   The farmhouse, the barn, the silo and the pond all moved across; the left
   horizon is the industrial estate (w16_industry) instead. */
function w16_farm(c, P, DW, DH, gy) {
  /* horizon band — hills across, a sea sliver behind the farm, a town on the shore */
  c.fillStyle = '#5E8FC4'; c.fillRect(DW * 0.60, gy - 3.5, DW * 0.40, 4); drawCount++;
  c.fillStyle = '#7FA6C9'; c.beginPath(); c.ellipse(DW * 0.20, gy + 1, DW * 0.32, 12, 0, 0, 7); c.fill(); drawCount++;
  c.fillStyle = '#6E9668'; c.beginPath(); c.ellipse(DW * 0.12, gy + 3, DW * 0.26, 10, 0, 0, 7); c.ellipse(DW * 0.48, gy + 4, DW * 0.16, 6, 0, 0, 7); c.fill(); drawCount++;
  c.fillStyle = '#5F875A'; c.beginPath(); c.ellipse(DW * 0.34, gy + 6, DW * 0.22, 7, 0, 0, 7); c.fill(); drawCount++;
  c.fillStyle = 'rgba(122,150,180,.55)'; c.beginPath();
  c.moveTo(0, gy - 1); c.lineTo(DW * 0.06, gy - 16); c.lineTo(DW * 0.13, gy - 5); c.lineTo(DW * 0.21, gy - 22); c.lineTo(DW * 0.29, gy - 7);
  c.lineTo(DW * 0.36, gy - 14); c.lineTo(DW * 0.44, gy - 4); c.lineTo(DW * 0.52, gy - 12); c.lineTo(DW * 0.58, gy - 1); c.fill(); drawCount++;
  c.fillStyle = 'rgba(78,96,116,.40)'; c.beginPath();
  for (var i = 0; i < 11; i++) { var xx = DW * (0.64 + i * 0.028), hh = 2 + w16_r(i + 31) * 4.5; c.rect(xx, gy - 3 - hh, DW * 0.016, hh + 3); }
  c.fill(); drawCount++;

  /* the fields: right of the base only, x 0.16 … 1.55 */
  var crops = ['#679459', '#5B8A52', '#74A055', '#7E9A4C', '#4E7C46', '#86A053', '#63904F'];
  for (var f = 0; f < 10; f++) {
    var x0 = 0.16 + f * 0.14, r = w16_r(f + 40), zb = 0.470 + w16_r(f + 61) * 0.014;
    c.fillStyle = crops[Math.floor(r * crops.length) % crops.length];
    c.beginPath(); w16_quad(c, P, x0, x0 + 0.142, zb, W22_HZ); c.fill(); drawCount++;
  }
  c.strokeStyle = 'rgba(38,60,34,.30)'; c.lineWidth = 0.7; c.beginPath();
  for (f = 0; f < 10; f++) { if (w16_r(f + 40) > 0.55) continue;
    for (var j = 1; j < 4; j++) { var xr = 0.16 + f * 0.14 + j * 0.035, a = P(xr, 0.478), b = P(xr, 0.610); c.moveTo(a.sx, a.sy); c.lineTo(b.sx, b.sy); } }
  c.stroke(); drawCount++;
  c.strokeStyle = 'rgba(30,50,28,.55)'; c.lineWidth = 1.2; c.beginPath();
  for (f = 0; f <= 10; f++) { var xh = 0.16 + f * 0.14, a2 = P(xh, 0.470), b2 = P(xh, W22_HZ); c.moveTo(a2.sx, a2.sy); c.lineTo(b2.sx, b2.sy); }
  c.stroke(); drawCount++;

  /* the pond, far right, with its sky reflection and a reed fringe */
  var pd = P(w16_POND[0], w16_POND[1]);
  c.fillStyle = '#2E6A9C'; c.beginPath(); c.ellipse(pd.sx, pd.sy, 62 * pd.k, 16 * pd.k, 0, 0, 7); c.fill(); drawCount++;
  c.fillStyle = w16_gradV(c, pd.sy - 15 * pd.k, pd.sy + 15 * pd.k, ART.skyLo, '#3F87C4');
  c.beginPath(); c.ellipse(pd.sx, pd.sy, 56 * pd.k, 13 * pd.k, 0, 0, 7); c.fill(); drawCount++;
  c.strokeStyle = '#4C7A3E'; c.lineWidth = Math.max(0.6, 1 * pd.k); c.beginPath();
  for (i = 0; i < 16; i++) { var an = i / 16 * 6.283, rx = pd.sx + Math.cos(an) * 60 * pd.k, ry = pd.sy + Math.sin(an) * 15 * pd.k;
    c.moveTo(rx, ry); c.lineTo(rx + (w16_r(i + 3) - 0.5) * 4 * pd.k, ry - (5 + w16_r(i) * 5) * pd.k); }
  c.stroke(); drawCount++;

  /* the farmhouse, the barn and the silo — moved to the right */
  w16_shed(c, P, 0.54, 0.70, 0.556, 0.586, 26, 13, '#F1EEE4', '#D2CDBE', '#B3564E', '#8F3129');
  var wn = P(0.62, 0.556);
  c.fillStyle = '#3C5A78'; c.fillRect(wn.sx - 9 * wn.k, wn.sy - 17 * wn.k, 5 * wn.k, 7 * wn.k); c.fillRect(wn.sx + 4 * wn.k, wn.sy - 17 * wn.k, 5 * wn.k, 7 * wn.k); drawCount++;
  c.fillStyle = '#6B4A2E'; c.fillRect(wn.sx - 2.5 * wn.k, wn.sy - 11 * wn.k, 5 * wn.k, 11 * wn.k); drawCount++;
  var bn = P(0.84, 0.572), bw = 60 * bn.k, bh = 30 * bn.k;
  c.fillStyle = 'rgba(0,0,0,.16)'; c.beginPath(); c.ellipse(bn.sx + 4, bn.sy + 1, bw * 0.7, 3.5 * bn.k, 0, 0, 7); c.fill(); drawCount++;
  c.fillStyle = w16_gradH(c, bn.sx - bw / 2, bn.sx + bw / 2, '#C24E42', '#8F3129'); c.fillRect(bn.sx - bw / 2, bn.sy - bh, bw, bh); drawCount++;
  c.fillStyle = '#6E2A24'; c.beginPath(); c.moveTo(bn.sx - bw / 2 - 3, bn.sy - bh); c.lineTo(bn.sx - bw * 0.24, bn.sy - bh * 1.6);
  c.lineTo(bn.sx + bw * 0.20, bn.sy - bh * 1.75); c.lineTo(bn.sx + bw / 2 + 3, bn.sy - bh); c.fill(); drawCount++;
  c.fillStyle = '#F3F4F6'; c.fillRect(bn.sx - bw * 0.10, bn.sy - bh * 0.66, bw * 0.20, bh * 0.66); c.fillRect(bn.sx - bw * 0.40, bn.sy - bh * 0.82, bw * 0.13, bh * 0.28); drawCount++;
  var si = P(0.99, 0.584), sr = 10 * si.k, sh = 44 * si.k;
  c.fillStyle = w16_gradH(c, si.sx - sr, si.sx + sr, '#DCE3EA', '#93A0AD');
  c.fillRect(si.sx - sr, si.sy - sh, sr * 2, sh); c.beginPath(); c.arc(si.sx, si.sy - sh, sr, Math.PI, 0); c.fill(); drawCount++;
  /* a wind pump beside the pasture */
  var wp = P(0.30, 0.556), wh = 40 * wp.k;
  c.strokeStyle = '#8A949E'; c.lineWidth = Math.max(0.7, 1.1 * wp.k); c.beginPath();
  c.moveTo(wp.sx - 4 * wp.k, wp.sy); c.lineTo(wp.sx, wp.sy - wh); c.moveTo(wp.sx + 4 * wp.k, wp.sy); c.lineTo(wp.sx, wp.sy - wh);
  for (i = 0; i < 8; i++) { var aa = i / 8 * 6.283; c.moveTo(wp.sx, wp.sy - wh); c.lineTo(wp.sx + Math.cos(aa) * 7 * wp.k, wp.sy - wh + Math.sin(aa) * 7 * wp.k); }
  c.stroke(); drawCount++;

  /* orchard / tree line along the farm side and behind the industrial estate */
  var trees = [];
  for (i = 0; i < 9; i++) trees.push([0.22 + i * 0.15 + (w16_r(i) - 0.5) * 0.05, 0.494 + w16_r(i + 5) * 0.016, 11 + w16_r(i + 9) * 6]);
  for (i = 0; i < 4; i++) trees.push([-1.24 + i * 0.10, 0.600 + w16_r(i + 17) * 0.010, 13 + w16_r(i + 21) * 5]);
  c.fillStyle = 'rgba(0,0,0,.15)'; c.beginPath();
  for (i = 0; i < trees.length; i++) { var tp = P(trees[i][0], trees[i][1]); w16_ell(c, tp.sx + 2, tp.sy + 1, trees[i][2] * tp.k * 0.9, trees[i][2] * tp.k * 0.3); } c.fill(); drawCount++;
  c.strokeStyle = '#6B4A2E'; c.lineWidth = 1.3; c.beginPath();
  for (i = 0; i < trees.length; i++) { var tq = P(trees[i][0], trees[i][1]); c.moveTo(tq.sx, tq.sy); c.lineTo(tq.sx, tq.sy - trees[i][2] * tq.k * 0.9); } c.stroke(); drawCount++;
  c.fillStyle = '#4E7C46'; c.beginPath();
  for (i = 0; i < trees.length; i++) { var tr = P(trees[i][0], trees[i][1]); w16_ell(c, tr.sx, tr.sy - trees[i][2] * tr.k * 1.35, trees[i][2] * tr.k, trees[i][2] * tr.k * 0.95); } c.fill(); drawCount++;
  c.fillStyle = '#5F9A55'; c.beginPath();
  for (i = 0; i < trees.length; i++) { var ts = P(trees[i][0], trees[i][1]); w16_ell(c, ts.sx - trees[i][2] * ts.k * 0.22, ts.sy - trees[i][2] * ts.k * 1.5, trees[i][2] * ts.k * 0.66, trees[i][2] * ts.k * 0.6); } c.fill(); drawCount++;

  /* the base perimeter: straight across the farm side, then back around the estate */
  w16_fenceRun(c, P, [[1.45, 0.468], [-0.02, 0.468], [-0.02, W22_HZ]], 12, false);
}

/* ══════════ the industrial estate — left and behind the rocket ══════════
   Where the farmhouse used to sit. Propellant plant, tank farm, stacks and a
   substation, all inside the base fence. Nothing here passes z 0.612. */
function w16_industry(c, P) {
  var i, a, b, t;
  /* hardstand — a works yard, darker than the pad apron */
  c.fillStyle = 'rgba(64,72,82,.55)'; c.beginPath(); w16_quad(c, P, -1.55, -0.02, 0.476, W22_HZ); c.fill(); drawCount++;
  c.strokeStyle = 'rgba(232,238,244,.16)'; c.lineWidth = 0.8; c.beginPath();
  for (i = 0; i < 10; i++) { var xg = -1.50 + i * 0.16; a = P(xg, 0.480); b = P(xg, 0.606); c.moveTo(a.sx, a.sy); c.lineTo(b.sx, b.sy); }
  c.stroke(); drawCount++;

  /* the back skyline: cooling tower, banded chimney, flare mast */
  w16_cool(c, P(-0.70, 0.608), 30, 86);
  w16_stack(c, P(-0.52, 0.606), 7, 150, true);
  w16_stack(c, P(-0.365, 0.600), 4.5, 162, false);

  /* the propellant plant — four columns on a common structure, tied by a pipe bridge */
  var colSpec = [[-1.30, 0.588, 10, 124], [-1.17, 0.584, 12, 148], [-1.04, 0.580, 9, 116], [-0.92, 0.576, 8, 100]];
  for (i = 0; i < colSpec.length; i++) w16_col(c, P(colSpec[i][0], colSpec[i][1]), colSpec[i][2], colSpec[i][3], true);
  c.fillStyle = '#C24E42'; c.beginPath();          /* hazard bands high on the two tall ones */
  for (i = 0; i < 2; i++) { var cp = P(colSpec[i][0], colSpec[i][1]), R = colSpec[i][2] * cp.k, H = colSpec[i][3] * cp.k;
    c.rect(cp.sx - R, cp.sy - H * 0.86, R * 2, H * 0.05); c.rect(cp.sx - R, cp.sy - H * 0.66, R * 2, H * 0.05); }
  c.fill(); drawCount++;
  var pa = P(-1.31, 0.582), pb = P(-0.90, 0.576);
  c.strokeStyle = '#93A0AD'; c.lineWidth = Math.max(0.7, 1.3 * pa.k); c.beginPath();
  for (i = 0; i < 3; i++) { var yo = 52 + i * 10; c.moveTo(pa.sx, pa.sy - yo * pa.k); c.lineTo(pb.sx, pb.sy - yo * pb.k); }
  for (i = 0; i <= 5; i++) { t = i / 5; var sx0 = pa.sx + (pb.sx - pa.sx) * t, sy0 = pa.sy + (pb.sy - pa.sy) * t, kk = pa.k + (pb.k - pa.k) * t;
    c.moveTo(sx0, sy0 - 52 * kk); c.lineTo(sx0, sy0 - 72 * kk); }
  c.stroke(); drawCount++;

  /* the propellant the pad actually burns: three spheres and a bullet-tank row */
  w16_sphere(c, P(-0.82, 0.592), 18);
  w16_sphere(c, P(-0.68, 0.582), 15);
  w16_sphere(c, P(-0.575, 0.570), 12);
  w16_htank(c, P(-1.30, 0.534), 62, 13);
  w16_htank(c, P(-1.06, 0.530), 58, 12);
  w16_htank(c, P(-0.84, 0.526), 50, 11);

  /* the big process block and a boiler house behind the sheds */
  w16_box(c, P, -1.55, -1.16, 0.542, 0.566, 52, '#8D99A6', '#B0BBC6', '#6B7783');
  w16_box(c, P, -0.50, -0.30, 0.556, 0.578, 40, '#7C8792', '#A9B4BF', '#66727E');

  /* process sheds along the front of the estate */
  w16_shed(c, P, -1.50, -1.10, 0.482, 0.516, 40, 16, '#B0BBC6', '#7C8792', '#96A2AF', '#66727E');
  w16_shed(c, P, -1.04, -0.72, 0.484, 0.518, 34, 14, '#C3CDD6', '#8A949E', '#9AA6B2', '#6B7783');
  w16_shed(c, P, -0.66, -0.42, 0.486, 0.516, 30, 12, '#B0BBC6', '#7C8792', '#96A2AF', '#66727E');
  c.fillStyle = '#F2C230'; c.beginPath();          /* roller doors picked out on each shed */
  for (i = 0; i < 3; i++) { var dp = P([-1.44, -1.00, -0.62][i], 0.482);
    c.rect(dp.sx - 7 * dp.k, dp.sy - 16 * dp.k, 14 * dp.k, 16 * dp.k); }
  c.fill(); drawCount++;

  /* the long pipe rack running east toward the pad, on trestles */
  var ra = P(-1.45, 0.552), rb = P(-0.06, 0.542);
  c.strokeStyle = '#8A949E'; c.lineWidth = Math.max(0.8, 1.5 * ra.k); c.beginPath();
  for (i = 0; i < 4; i++) { var h2 = 18 + i * 6; c.moveTo(ra.sx, ra.sy - h2 * ra.k); c.lineTo(rb.sx, rb.sy - h2 * rb.k); }
  for (i = 0; i <= 12; i++) { t = i / 12; var sx1 = ra.sx + (rb.sx - ra.sx) * t, sy1 = ra.sy + (rb.sy - ra.sy) * t, k1 = ra.k + (rb.k - ra.k) * t;
    c.moveTo(sx1, sy1); c.lineTo(sx1, sy1 - 38 * k1); }
  c.stroke(); drawCount++;

  /* a conveyor gantry sloping up into the tallest shed */
  var ca = P(-0.90, 0.498), cb = P(-0.78, 0.532);
  c.fillStyle = '#7C8792'; c.beginPath();
  c.moveTo(ca.sx, ca.sy - 6 * ca.k); c.lineTo(cb.sx, cb.sy - 44 * cb.k); c.lineTo(cb.sx + 7, cb.sy - 44 * cb.k); c.lineTo(ca.sx + 7, ca.sy - 6 * ca.k); c.fill(); drawCount++;

  /* a road tanker loading rack on the estate frontage */
  c.fillStyle = 'rgba(58,67,77,.45)'; c.beginPath(); w16_quad(c, P, -1.20, -0.94, 0.478, 0.492); c.fill(); drawCount++;
  w16_vehicle(c, P(-1.14, 0.486), 62, '#E9EEF3', '#93A0AD', true);
  w16_vehicle(c, P(-1.00, 0.484), 58, '#E9EEF3', '#93A0AD', true);

  /* gas-bottle cages and cable drums on the yard */
  var cage = ['#4FD9E6', '#8AC46A', '#F2C230', '#E0523A'];
  for (i = 0; i < 4; i++) { var gp = P(-0.90 + i * 0.055, 0.494 + (i % 2) * 0.008);
    c.fillStyle = cage[i]; c.fillRect(gp.sx - 5 * gp.k, gp.sy - 11 * gp.k, 10 * gp.k, 11 * gp.k); drawCount++; }
  c.strokeStyle = '#6B4A2E'; c.lineWidth = Math.max(0.8, 1.4 * ra.k); c.beginPath();
  for (i = 0; i < 3; i++) { var wp2 = P(-0.72 + i * 0.045, 0.492); c.moveTo(wp2.sx - 6 * wp2.k, wp2.sy - 6 * wp2.k); c.arc(wp2.sx, wp2.sy - 6 * wp2.k, 6 * wp2.k, 0, 7); }
  c.stroke(); drawCount++;

  /* substation: transformers, bus bars, two pylons carrying the line off left */
  c.fillStyle = 'rgba(48,56,66,.50)'; c.beginPath(); w16_quad(c, P, -0.30, -0.10, 0.490, 0.526); c.fill(); drawCount++;
  for (i = 0; i < 4; i++) { var tp = P(-0.275 + i * 0.045, 0.504), tw = 10 * tp.k, th = 15 * tp.k;
    c.fillStyle = '#6B7783'; c.fillRect(tp.sx - tw / 2, tp.sy - th, tw, th); drawCount++;
    c.fillStyle = '#A9B4BF'; c.fillRect(tp.sx - tw / 2, tp.sy - th - 2.5 * tp.k, tw, 2.5 * tp.k); drawCount++; }
  w16_pylon(c, P(-0.40, 0.498), 92);
  w16_pylon(c, P(-1.02, 0.490), 84);
  var y1 = P(-0.40, 0.498), y2 = P(-1.02, 0.490);
  c.strokeStyle = 'rgba(140,152,166,.7)'; c.lineWidth = 0.8; c.beginPath();
  for (i = 0; i < 2; i++) { var hy = 84 + i * 7;
    c.moveTo(y1.sx, y1.sy - hy * y1.k); c.quadraticCurveTo((y1.sx + y2.sx) / 2, (y1.sy + y2.sy) / 2 - hy * 0.78 * y1.k, y2.sx, y2.sy - (hy - 8) * y2.k); }
  c.stroke(); drawCount++;

  /* the water tower now stands with the plant, directly behind the rocket */
  /* the utilities block directly behind the rocket: a control house, a chiller
     shed and a small tank group — this is the ground the farmhouse used to hold */
  w16_box(c, P, -0.30, -0.16, 0.552, 0.574, 34, '#8D99A6', '#B0BBC6', '#6B7783');
  w16_shed(c, P, -0.14, 0.02, 0.486, 0.514, 28, 11, '#C3CDD6', '#8A949E', '#9AA6B2', '#6B7783');
  w16_tank(c, P(-0.10, 0.556), 13, 30); w16_tank(c, P(0.00, 0.548), 11, 26);
  w16_pylon(c, P(0.02, 0.532), 62);

  w16_watertower(c, P);

  /* estate roadway hugging the front of the sheds, and its fence */
  c.fillStyle = '#8A8579'; c.beginPath(); w16_quad(c, P, -1.55, -0.02, 0.468, 0.478); c.fill(); drawCount++;
}

/* the water tower, relocated to the estate */
function w16_watertower(c, P) {
  var p = P(-0.24, 0.540), h = 96 * p.k, R = 20 * p.k;
  c.fillStyle = 'rgba(0,0,0,.16)'; c.beginPath(); c.ellipse(p.sx + 3, p.sy + 1, R * 0.9, 4 * p.k, 0, 0, 7); c.fill(); drawCount++;
  c.strokeStyle = '#8A949E'; c.lineWidth = 1.4; c.beginPath();
  for (var d = -1; d <= 1; d += 2) { c.moveTo(p.sx + d * R * 0.7, p.sy); c.lineTo(p.sx + d * R * 0.22, p.sy - h); }
  c.moveTo(p.sx - R * 0.5, p.sy - h * 0.4); c.lineTo(p.sx + R * 0.5, p.sy - h * 0.4);
  c.moveTo(p.sx - R * 0.6, p.sy - h * 0.2); c.lineTo(p.sx + R * 0.35, p.sy - h * 0.55);
  c.moveTo(p.sx + R * 0.6, p.sy - h * 0.2); c.lineTo(p.sx - R * 0.35, p.sy - h * 0.55); c.stroke(); drawCount++;
  c.fillStyle = w16_gradH(c, p.sx - R, p.sx + R, '#F5F8FA', '#9AA6B2');
  c.beginPath(); c.ellipse(p.sx, p.sy - h, R, R * 0.62, 0, 0, 7); c.fill(); drawCount++;
  c.fillStyle = '#E0523A'; c.beginPath(); c.ellipse(p.sx, p.sy - h - R * 0.36, R * 0.62, R * 0.22, 0, 0, 7); c.fill(); drawCount++;
}

/* ══════════ the vehicle assembly building and its workshop ══════════ */
function w16_hangar(c, P) {
  var hg = w16_box(c, P, -0.96, -0.52, 0.376, 0.464, 88, '#8D99A6', '#B0BBC6', '#6B7783');
  var a = hg.a, b = hg.b, up = hg.up;
  c.fillStyle = '#5A6470'; c.fillRect(lerp(a.sx, b.sx, 0.28), lerp(up(a), a.sy, 0.26), (b.sx - a.sx) * 0.36, a.sy - lerp(up(a), a.sy, 0.26)); drawCount++;
  c.strokeStyle = 'rgba(220,230,240,.45)'; c.lineWidth = 0.9; c.beginPath();
  for (var i = 1; i < 5; i++) { var yy = lerp(lerp(up(a), a.sy, 0.26), a.sy, i / 5); c.moveTo(lerp(a.sx, b.sx, 0.28), yy); c.lineTo(lerp(a.sx, b.sx, 0.64), yy); }
  c.stroke(); drawCount++;
  c.fillStyle = '#E0523A'; c.fillRect(lerp(a.sx, b.sx, 0.06), up(a) + 8, (b.sx - a.sx) * 0.15, 5); drawCount++;
  c.fillStyle = '#F2C230'; c.fillRect(lerp(a.sx, b.sx, 0.70), up(a) + 8, (b.sx - a.sx) * 0.08, 5); drawCount++;
  c.strokeStyle = 'rgba(60,72,84,.45)'; c.lineWidth = 0.8; c.beginPath();
  for (i = 1; i < 8; i++) { var x = lerp(a.sx, b.sx, i / 8); c.moveTo(x, a.sy); c.lineTo(x, up(a)); } c.stroke(); drawCount++;
  /* roof plant: extract fans and a stair head */
  c.fillStyle = '#5A6470';
  for (i = 0; i < 4; i++) { var rx = lerp(a.sx, b.sx, 0.18 + i * 0.2); c.fillRect(rx, up(a) - 5, 9, 5); } drawCount++;
  /* workshop and a small store beside it */
  w16_shed(c, P, -0.48, -0.34, 0.398, 0.446, 26, 10, '#C3CDD6', '#93A0AD', '#9AA6B2', '#6B7783');
  w16_box(c, P, -0.50, -0.42, 0.352, 0.376, 14, '#8D99A6', '#C3CDD6', '#9AA6B2');
}

/* ══════════ the administration building — where the fuel tanks used to be ══════════ */
function w16_admin(c, P) {
  /* forecourt slab */
  c.fillStyle = 'rgba(150,156,162,.55)'; c.beginPath(); w16_quad(c, P, 0.48, 0.92, 0.392, 0.470); c.fill(); drawCount++;
  var bd = w16_box(c, P, 0.52, 0.88, 0.410, 0.462, 58, '#C9D2DA', '#E7ECF1', '#A9B4BF');
  var a = bd.a, b = bd.b, up = bd.up, W = b.sx - a.sx;
  /* three glazing bands across the front */
  c.fillStyle = '#2F5A80';
  for (var s = 0; s < 3; s++) { var y0 = lerp(up(a), a.sy, 0.10 + s * 0.28); c.fillRect(a.sx + W * 0.05, y0, W * 0.90, (a.sy - up(a)) * 0.16); } drawCount++;
  c.fillStyle = 'rgba(160,208,244,.55)';
  for (s = 0; s < 3; s++) { var y1 = lerp(up(a), a.sy, 0.10 + s * 0.28); c.fillRect(a.sx + W * 0.05, y1, W * 0.42, (a.sy - up(a)) * 0.16); } drawCount++;
  c.strokeStyle = 'rgba(90,104,118,.45)'; c.lineWidth = 0.7; c.beginPath();
  for (var i = 1; i < 9; i++) { var mx = a.sx + W * i / 9; c.moveTo(mx, up(a) + 2); c.lineTo(mx, a.sy); } c.stroke(); drawCount++;
  /* parapet, stair core and roof plant */
  c.fillStyle = '#8E9BA8'; c.fillRect(a.sx, up(a) - 3, W, 3.4); drawCount++;
  c.fillStyle = '#A9B4BF'; c.fillRect(a.sx + W * 0.72, up(a) - 12, W * 0.16, 12); drawCount++;
  c.fillStyle = '#6B7783'; c.fillRect(a.sx + W * 0.12, up(a) - 7, W * 0.12, 7); c.fillRect(a.sx + W * 0.32, up(a) - 5, W * 0.10, 5); drawCount++;
  var dp = { sx: a.sx + W * 0.55, sy: up(a) - 2, k: a.k };
  c.strokeStyle = '#8A949E'; c.lineWidth = 1; c.beginPath(); c.moveTo(dp.sx, dp.sy); c.lineTo(dp.sx, dp.sy - 12 * dp.k); c.stroke(); drawCount++;
  c.fillStyle = '#DCE3EA'; c.beginPath(); c.ellipse(dp.sx, dp.sy - 13 * dp.k, 6 * dp.k, 4.4 * dp.k, -0.5, 0, 7); c.fill(); drawCount++;
  /* name band */
  c.fillStyle = '#E0523A'; c.fillRect(a.sx + W * 0.06, up(a) + 4, W * 0.52, Math.max(6, 9 * a.k)); drawCount++;
  c.fillStyle = '#F6F3EE'; c.font = '800 ' + Math.max(5.5, 7.2 * a.k).toFixed(1) + 'px ui-monospace, monospace';
  c.textAlign = 'left'; c.textBaseline = 'middle';
  c.fillText('ADMIN', a.sx + W * 0.09, up(a) + 4 + Math.max(6, 9 * a.k) / 2); drawCount++;
  /* entrance canopy on slim columns, and steps down to the concourse */
  var e0 = P(0.62, 0.396), e1 = P(0.78, 0.396), eh = 22;
  c.fillStyle = '#B0BBC6'; c.beginPath();
  w16_quad(c, P, 0.60, 0.80, 0.392, 0.412);
  c.fill(); drawCount++;
  c.fillStyle = '#E7ECF1'; c.beginPath();
  var q0 = P(0.60, 0.390), q1 = P(0.80, 0.390), q2 = P(0.80, 0.412), q3 = P(0.60, 0.412);
  c.moveTo(q0.sx, q0.sy - eh * q0.k); c.lineTo(q1.sx, q1.sy - eh * q1.k); c.lineTo(q2.sx, q2.sy - eh * q2.k); c.lineTo(q3.sx, q3.sy - eh * q3.k); c.fill(); drawCount++;
  c.strokeStyle = '#9AA6B2'; c.lineWidth = Math.max(0.8, 1.4 * e0.k); c.beginPath();
  c.moveTo(e0.sx, e0.sy); c.lineTo(e0.sx, e0.sy - eh * e0.k); c.moveTo(e1.sx, e1.sy); c.lineTo(e1.sx, e1.sy - eh * e1.k); c.stroke(); drawCount++;
  c.fillStyle = '#D6DDE4'; c.beginPath(); w16_quad(c, P, 0.60, 0.80, 0.382, 0.394); c.fill(); drawCount++;
  c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); w16_quad(c, P, 0.60, 0.80, 0.386, 0.389); c.fill(); drawCount++;
  /* clipped hedges either side of the door */
  c.fillStyle = '#3B6B33'; c.beginPath();
  for (i = 0; i < 4; i++) { var hp = P(0.535 + i * 0.018, 0.400); w16_ell(c, hp.sx, hp.sy - 5 * hp.k, 7 * hp.k, 5 * hp.k); }
  for (i = 0; i < 4; i++) { var hq = P(0.815 + i * 0.018, 0.400); w16_ell(c, hq.sx, hq.sy - 5 * hq.k, 7 * hq.k, 5 * hq.k); }
  c.fill(); drawCount++;
  /* staff bays tucked against the west flank */
  c.fillStyle = 'rgba(58,67,77,.45)'; c.beginPath(); w16_quad(c, P, 0.40, 0.50, 0.412, 0.462); c.fill(); drawCount++;
  var cols = ['#E0523A', '#4FD9E6', '#F3F4F6', '#FFC24D'];
  for (i = 0; i < 4; i++) { var cp = P(0.425 + i * 0.022, 0.428 + (i % 2) * 0.020);
    c.fillStyle = cols[i]; c.beginPath(); c.roundRect(cp.sx - 4 * cp.k, cp.sy - 8 * cp.k, 8 * cp.k, 11 * cp.k, 2 * cp.k); c.fill(); drawCount++; }
}

/* ══════════ the concourse — paving, grass panels, a path from the car park ══════════ */
function w16_concourse(c, P) {
  c.fillStyle = 'rgba(158,164,170,.62)'; c.beginPath(); w16_quad(c, P, 0.34, 0.78, 0.302, 0.396); c.fill(); drawCount++;
  c.strokeStyle = 'rgba(232,238,244,.22)'; c.lineWidth = 0.7; c.beginPath();
  for (var i = 1; i < 7; i++) { var x = lerp(0.34, 0.78, i / 7), a = P(x, 0.302), b = P(x, 0.396); c.moveTo(a.sx, a.sy); c.lineTo(b.sx, b.sy); }
  for (i = 1; i < 4; i++) { var z = lerp(0.302, 0.396, i / 4), d = P(0.34, z), e = P(0.78, z); c.moveTo(d.sx, d.sy); c.lineTo(e.sx, e.sy); }
  c.stroke(); drawCount++;
  /* two grass panels with a stone kerb */
  c.fillStyle = '#7C8792'; c.beginPath(); w16_quad(c, P, 0.360, 0.575, 0.316, 0.384); w16_quad(c, P, 0.655, 0.765, 0.316, 0.384); c.fill(); drawCount++;
  c.fillStyle = '#5F9A55'; c.beginPath(); w16_quad(c, P, 0.368, 0.567, 0.320, 0.380); w16_quad(c, P, 0.663, 0.757, 0.320, 0.380); c.fill(); drawCount++;
  c.fillStyle = 'rgba(255,255,255,.06)'; c.beginPath();
  for (i = 0; i < 6; i += 2) { var gx = 0.368 + i * 0.033; w16_quad(c, P, gx, gx + 0.033, 0.320, 0.380); }
  c.fill(); drawCount++;
  /* a round pool in the west panel */
  var fp = P(0.468, 0.350);
  c.fillStyle = '#8E9BA8'; c.beginPath(); c.ellipse(fp.sx, fp.sy, 20 * fp.k, 7 * fp.k, 0, 0, 7); c.fill(); drawCount++;
  c.fillStyle = '#3F87C4'; c.beginPath(); c.ellipse(fp.sx, fp.sy, 16.5 * fp.k, 5.4 * fp.k, 0, 0, 7); c.fill(); drawCount++;
  /* benches, planters and lamps along the central path */
  for (i = 0; i < 3; i++) {
    var bp = P(0.600, 0.322 + i * 0.028), bw = 13 * bp.k;
    c.fillStyle = '#8C6B3E'; c.fillRect(bp.sx - bw, bp.sy - 5 * bp.k, bw * 2, 2.6 * bp.k); drawCount++;
    var bq = P(0.640, 0.322 + i * 0.028);
    c.fillStyle = '#8C6B3E'; c.fillRect(bq.sx - bw, bq.sy - 5 * bq.k, bw * 2, 2.6 * bq.k); drawCount++;
  }
  c.fillStyle = '#B0BBC6'; c.beginPath();
  for (i = 0; i < 4; i++) { var pp = P(0.585 + (i % 2) * 0.072, 0.312 + Math.floor(i / 2) * 0.070); c.rect(pp.sx - 5 * pp.k, pp.sy - 7 * pp.k, 10 * pp.k, 7 * pp.k); }
  c.fill(); drawCount++;
  c.fillStyle = '#3B6B33'; c.beginPath();
  for (i = 0; i < 4; i++) { var pq = P(0.585 + (i % 2) * 0.072, 0.312 + Math.floor(i / 2) * 0.070); w16_ell(c, pq.sx, pq.sy - 9 * pq.k, 7 * pq.k, 4 * pq.k); }
  c.fill(); drawCount++;
  w16_lamp(c, P(0.575, 0.310), 34); w16_lamp(c, P(0.575, 0.388), 34);
  w16_lamp(c, P(0.650, 0.310), 34); w16_lamp(c, P(0.650, 0.388), 34);
  w16_tree(c, P(0.395, 0.372), 15); w16_tree(c, P(0.720, 0.372), 14); w16_tree(c, P(0.700, 0.318), 12);
  /* the three flagpoles at the concourse frontage — drawLife flies the flags */
  for (i = 0; i < 3; i++) { var fq = P(w16_FLAGPOLES[i][0], w16_FLAGPOLES[i][1]), fh = 44 * fq.k;
    c.strokeStyle = '#DDE3EA'; c.lineWidth = Math.max(0.8, 1.2 * fq.k); c.beginPath(); c.moveTo(fq.sx, fq.sy); c.lineTo(fq.sx, fq.sy - fh); c.stroke(); drawCount++; }
}

/* ══════════ the helipad — far right, in front of the admin building ══════════ */
function w16_helipad(c, P) {
  var p = P(w16_HELI[0], w16_HELI[1]);
  c.fillStyle = 'rgba(58,67,77,.50)'; c.beginPath(); c.ellipse(p.sx, p.sy, 46 * p.k, 17 * p.k, 0, 0, 7); c.fill(); drawCount++;
  c.strokeStyle = 'rgba(255,255,255,.65)'; c.lineWidth = Math.max(1.2, 2 * p.k); c.beginPath(); c.ellipse(p.sx, p.sy, 35 * p.k, 13 * p.k, 0, 0, 7); c.stroke(); drawCount++;
  c.fillStyle = 'rgba(255,255,255,.78)';
  c.fillRect(p.sx - 13 * p.k, p.sy - 7 * p.k, 4.5 * p.k, 14 * p.k);
  c.fillRect(p.sx + 8.5 * p.k, p.sy - 7 * p.k, 4.5 * p.k, 14 * p.k);
  c.fillRect(p.sx - 9 * p.k, p.sy - 2.4 * p.k, 18 * p.k, 4.8 * p.k); drawCount++;
  /* perimeter lights */
  c.fillStyle = '#F2C230'; c.beginPath();
  for (var i = 0; i < 8; i++) { var a = i / 8 * 6.283; c.rect(p.sx + Math.cos(a) * 44 * p.k - 1, p.sy + Math.sin(a) * 16 * p.k - 1, 2.2, 2.2); }
  c.fill(); drawCount++;
  /* a windsock mast and a small hangar shed beside the pad */
  var wm = P(w16_HELI[0] + 0.11, w16_HELI[1] - 0.024);
  c.strokeStyle = '#B9C4CF'; c.lineWidth = Math.max(0.8, 1.2 * wm.k); c.beginPath(); c.moveTo(wm.sx, wm.sy); c.lineTo(wm.sx, wm.sy - 34 * wm.k); c.stroke(); drawCount++;
  w16_shed(c, P, 0.90, 1.02, 0.396, 0.428, 20, 8, '#C3CDD6', '#93A0AD', '#9AA6B2', '#6B7783');
  /* taxi path from the pad to the concourse */
  c.fillStyle = 'rgba(158,164,170,.55)'; c.beginPath();
  w16_poly(c, P, [[0.762, 0.340], [0.800, 0.334], [0.812, 0.372], [0.774, 0.378]]); c.fill(); drawCount++;
}

/* ══════════ the car park — shrunk to make room for the concourse ══════════ */
function w16_carpark(c, P) {
  var cols = ['#E0523A', '#4FD9E6', '#F3F4F6', '#FFC24D', '#5F6B78', '#8AC46A'];
  c.fillStyle = 'rgba(58,67,77,.55)'; c.beginPath(); w16_quad(c, P, 0.42, 0.78, 0.242, 0.298); c.fill(); drawCount++;
  c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 0.8; c.beginPath();
  for (var i = 0; i <= 6; i++) { var x = lerp(0.44, 0.76, i / 6), a = P(x, 0.248), b = P(x, 0.292); c.moveTo(a.sx, a.sy); c.lineTo(b.sx, b.sy); }
  var m0 = P(0.42, 0.270), m1 = P(0.78, 0.270); c.moveTo(m0.sx, m0.sy); c.lineTo(m1.sx, m1.sy);
  c.stroke(); drawCount++;
  var cars = [];
  for (var row = 0; row < 2; row++) for (i = 0; i < 6; i++) {
    if (w16_r(row * 30 + i + 3) < 0.20) continue;
    cars.push({ p: P(lerp(0.465, 0.735, i / 5), 0.256 + row * 0.026), col: Math.floor(w16_r(row * 13 + i) * 6) });
  }
  cols.forEach(function (col, kk) { c.fillStyle = col; c.beginPath();
    for (var j = 0; j < cars.length; j++) { var cc = cars[j]; if (cc.col !== kk) continue;
      c.roundRect(cc.p.sx - 5 * cc.p.k, cc.p.sy - 10 * cc.p.k, 10 * cc.p.k, 13 * cc.p.k, 2.4 * cc.p.k); }
    c.fill(); drawCount++; });
  c.fillStyle = 'rgba(20,26,34,.45)'; c.beginPath();
  for (i = 0; i < cars.length; i++) c.roundRect(cars[i].p.sx - 3.6 * cars[i].p.k, cars[i].p.sy - 7.4 * cars[i].p.k, 7.2 * cars[i].p.k, 4.4 * cars[i].p.k, 1.2 * cars[i].p.k);
  c.fill(); drawCount++;
  /* a couple of lamp posts and a ticket machine */
  w16_lamp(c, P(0.42, 0.246), 30); w16_lamp(c, P(0.78, 0.246), 30);
}

/* ══════════ the open-fence warehouse — trucks load and drop off here all day ══════════ */
function w16_warehouse(c, P) {
  var X0 = -0.82, X1 = -0.34, Z0 = 0.234, Z1 = 0.326;
  /* yard slab */
  c.fillStyle = 'rgba(96,100,104,.62)'; c.beginPath(); w16_quad(c, P, X0, X1, Z0, Z1); c.fill(); drawCount++;
  c.strokeStyle = 'rgba(240,244,248,.16)'; c.lineWidth = 0.7; c.beginPath();
  for (var i = 1; i < 8; i++) { var x = lerp(X0, X1, i / 8), a = P(x, Z0), b = P(x, Z1); c.moveTo(a.sx, a.sy); c.lineTo(b.sx, b.sy); }
  c.stroke(); drawCount++;
  /* three dock bays marked out on the apron */
  c.fillStyle = 'rgba(242,194,48,.55)'; c.beginPath();
  for (i = 0; i < 3; i++) { var bx = W22_DOCK[i]; w16_quad(c, P, bx - 0.045, bx - 0.040, Z0 + 0.004, 0.278); w16_quad(c, P, bx + 0.040, bx + 0.045, Z0 + 0.004, 0.278); }
  c.fill(); drawCount++;
  /* the racking, deep in the shed: three rows of shelved pallets */
  var rackCols = ['#C25A3A', '#3F7FA8', '#8AC46A', '#D9A441', '#B3564E', '#5F6B78'];
  var pallets = [];
  for (var row = 0; row < 3; row++) for (i = 0; i < 9; i++) {
    if (w16_r(row * 23 + i + 5) < 0.18) continue;
    pallets.push({ x: lerp(X0 + 0.035, X1 - 0.035, i / 8), z: 0.288 + row * 0.016, lvl: w16_r(row * 9 + i) > 0.55 ? 2 : 1, col: Math.floor(w16_r(row * 11 + i + 3) * 6) });
  }
  pallets.sort(function (a, b) { return b.z - a.z; });
  c.strokeStyle = '#E0523A'; c.lineWidth = 1; c.beginPath();       /* rack uprights */
  for (row = 0; row < 3; row++) for (i = 0; i <= 9; i++) { var rp = P(lerp(X0 + 0.02, X1 - 0.02, i / 9), 0.288 + row * 0.016);
    c.moveTo(rp.sx, rp.sy); c.lineTo(rp.sx, rp.sy - 30 * rp.k); }
  c.stroke(); drawCount++;
  for (i = 0; i < pallets.length; i++) {
    var q = pallets[i], p = P(q.x, q.z), w = 15 * p.k, h = 8 * p.k;
    c.fillStyle = rackCols[q.col];
    for (var l = 0; l < q.lvl; l++) { c.fillRect(p.sx - w / 2, p.sy - h * (l + 1) - l * 3 * p.k, w, h); }
    drawCount++;
    c.fillStyle = 'rgba(255,255,255,.20)';
    for (l = 0; l < q.lvl; l++) c.fillRect(p.sx - w / 2, p.sy - h * (l + 1) - l * 3 * p.k, w, h * 0.22);
    drawCount++;
  }
  /* the open steel frame: columns, a truss and a canopy over the back half only */
  var canZ0 = 0.292, canZ1 = Z1 + 0.006, ch = 54;
  var cA = P(X0, canZ0), cB = P(X1, canZ0), cD = P(X1, canZ1), cE = P(X0, canZ1);
  c.strokeStyle = '#B0BBC6'; c.lineWidth = Math.max(1, 1.8 * cA.k); c.beginPath();
  for (i = 0; i <= 6; i++) { var cx = lerp(X0, X1, i / 6), f = P(cx, canZ0), g = P(cx, canZ1);
    c.moveTo(f.sx, f.sy); c.lineTo(f.sx, f.sy - ch * f.k); c.moveTo(g.sx, g.sy); c.lineTo(g.sx, g.sy - ch * g.k); }
  c.stroke(); drawCount++;
  c.strokeStyle = 'rgba(150,162,175,.8)'; c.lineWidth = 0.8; c.beginPath();   /* truss lattice on the open face */
  for (i = 0; i < 6; i++) { var u = P(lerp(X0, X1, i / 6), canZ0), v = P(lerp(X0, X1, (i + 1) / 6), canZ0);
    c.moveTo(u.sx, u.sy - ch * u.k); c.lineTo(v.sx, v.sy - (ch - 9) * v.k); c.moveTo(u.sx, u.sy - (ch - 9) * u.k); c.lineTo(v.sx, v.sy - ch * v.k); }
  c.stroke(); drawCount++;
  c.fillStyle = 'rgba(146,158,170,.95)'; c.beginPath();                        /* the canopy roof */
  c.moveTo(cA.sx, cA.sy - ch * cA.k); c.lineTo(cB.sx, cB.sy - ch * cB.k);
  c.lineTo(cD.sx, cD.sy - (ch + 8) * cD.k); c.lineTo(cE.sx, cE.sy - (ch + 8) * cE.k); c.fill(); drawCount++;
  c.fillStyle = 'rgba(120,134,148,.9)'; c.beginPath();                         /* the fascia edge */
  c.moveTo(cA.sx, cA.sy - ch * cA.k); c.lineTo(cB.sx, cB.sy - ch * cB.k);
  c.lineTo(cB.sx, cB.sy - (ch - 5) * cB.k); c.lineTo(cA.sx, cA.sy - (ch - 5) * cA.k); c.fill(); drawCount++;
  c.strokeStyle = 'rgba(90,102,114,.35)'; c.lineWidth = 0.7; c.beginPath();    /* roof ribs */
  for (i = 1; i < 7; i++) { var rx2 = lerp(X0, X1, i / 7), s0 = P(rx2, canZ0), s1 = P(rx2, canZ1);
    c.moveTo(s0.sx, s0.sy - ch * s0.k); c.lineTo(s1.sx, s1.sy - (ch + 8) * s1.k); }
  c.stroke(); drawCount++;
  /* bay numbers stencilled on the apron */
  c.fillStyle = 'rgba(255,255,255,.45)'; c.textAlign = 'center'; c.textBaseline = 'middle';
  for (i = 0; i < 3; i++) { var np = P(W22_DOCK[i], 0.250);
    c.font = '800 ' + Math.max(6, 13 * np.k).toFixed(1) + 'px ui-monospace, monospace';
    c.save(); c.translate(np.sx, np.sy); c.scale(1, 0.55); c.fillText(String(i + 1), 0, 0); c.restore(); }
  drawCount++;
  /* the yard fence, open at both gates */
  w16_fenceRun(c, P, [[X1 + 0.03, Z0 - 0.008], [X1 + 0.03, Z1 + 0.012], [X0 - 0.03, Z1 + 0.012], [X0 - 0.03, Z0 - 0.008]], 22, true);
  /* a gatehouse and a barrier on the west gate */
  w16_box(c, P, -0.90, -0.855, 0.206, 0.222, 16, '#C3CDD6', '#E7ECF1', '#9AA6B2');
  var gb = P(-0.845, 0.214);
  c.strokeStyle = '#E0523A'; c.lineWidth = Math.max(1, 2 * gb.k); c.beginPath();
  c.moveTo(gb.sx, gb.sy - 9 * gb.k); c.lineTo(gb.sx + 26 * gb.k, gb.sy - 12 * gb.k); c.stroke(); drawCount++;
  /* skips and a stack of loose crates outside the fence */
  for (i = 0; i < 2; i++) { var sk = P(-0.30 + i * 0.05, 0.246 + i * 0.014), sw = 16 * sk.k;
    c.fillStyle = '#D9A441'; c.beginPath();
    c.moveTo(sk.sx - sw, sk.sy); c.lineTo(sk.sx + sw, sk.sy); c.lineTo(sk.sx + sw * 0.8, sk.sy - 9 * sk.k); c.lineTo(sk.sx - sw * 0.8, sk.sy - 9 * sk.k); c.fill(); drawCount++; }
}

/* ══════════ dish farm ══════════ */
function w16_antennas(c, P) {
  c.fillStyle = 'rgba(58,67,77,.30)'; c.beginPath(); w16_quad(c, P, -0.30, 0.16, 0.232, 0.288); c.fill(); drawCount++;
  var spec = [[-0.24, 0.276, 19], [-0.11, 0.268, 15], [0.02, 0.276, 17], [-0.18, 0.242, 12], [-0.04, 0.240, 11], [0.11, 0.246, 13]];
  for (var i = 0; i < spec.length; i++) {
    var p = P(spec[i][0], spec[i][1]), h = 32 * p.k, R = spec[i][2] * p.k;
    c.strokeStyle = '#8A949E'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(p.sx, p.sy); c.lineTo(p.sx, p.sy - h); c.stroke(); drawCount++;
    c.fillStyle = '#DCE3EA'; c.beginPath(); c.ellipse(p.sx, p.sy - h - R * 0.4, R, R * 0.75, -0.5, 0, 7); c.fill(); drawCount++;
    c.fillStyle = 'rgba(120,132,146,.5)'; c.beginPath(); c.ellipse(p.sx + R * 0.25, p.sy - h - R * 0.4, R * 0.55, R * 0.5, -0.5, 0, 7); c.fill(); drawCount++;
  }
  w16_box(c, P, -0.40, -0.34, 0.240, 0.266, 22, '#5F6B78', '#C3CDD6', '#93A0AD');
  /* the ground-support yard east of the dishes: two generator trailers, cable drums, a spares cage */
  c.fillStyle = 'rgba(58,67,77,.34)'; c.beginPath(); w16_quad(c, P, 0.19, 0.37, 0.238, 0.284); c.fill(); drawCount++;
  for (var t2 = 0; t2 < 2; t2++) { var tq = P(0.225 + t2 * 0.085, 0.252 + t2 * 0.016), tw = 22 * tq.k, th = 13 * tq.k;
    c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(tq.sx - tw / 2 + 2, tq.sy - 2, tw, 4); drawCount++;
    c.fillStyle = t2 ? '#D9A441' : '#8AC46A'; c.fillRect(tq.sx - tw / 2, tq.sy - th, tw, th); drawCount++;
    c.fillStyle = 'rgba(255,255,255,.22)'; c.fillRect(tq.sx - tw / 2, tq.sy - th, tw, th * 0.2); drawCount++; }
  c.strokeStyle = '#6B4A2E'; c.lineWidth = 1.2; c.beginPath();
  for (t2 = 0; t2 < 3; t2++) { var dq = P(0.205 + t2 * 0.035, 0.276); c.moveTo(dq.sx + 6 * dq.k, dq.sy - 6 * dq.k); c.arc(dq.sx, dq.sy - 6 * dq.k, 6 * dq.k, 0, 7); }
  c.stroke(); drawCount++;
  /* three lighting columns along the perimeter road */
  w16_lamp(c, P(-0.34, 0.226), 40); w16_lamp(c, P(0.16, 0.226), 40); w16_lamp(c, P(0.66, 0.226), 40);
  /* the fire station: an appliance bay with two doors and two pumps parked out */
  var fb = w16_box(c, P, -0.955, -0.78, 0.298, 0.334, 32, '#8D99A6', '#C24E42', '#8F3129');
  c.fillStyle = '#F2C230';
  c.fillRect(lerp(fb.a.sx, fb.b.sx, 0.10), fb.up(fb.a) + (fb.a.sy - fb.up(fb.a)) * 0.28, (fb.b.sx - fb.a.sx) * 0.32, (fb.a.sy - fb.up(fb.a)) * 0.72);
  c.fillRect(lerp(fb.a.sx, fb.b.sx, 0.56), fb.up(fb.a) + (fb.a.sy - fb.up(fb.a)) * 0.28, (fb.b.sx - fb.a.sx) * 0.32, (fb.a.sy - fb.up(fb.a)) * 0.72); drawCount++;
  c.fillStyle = 'rgba(58,67,77,.40)'; c.beginPath(); w16_quad(c, P, -0.98, -0.74, 0.272, 0.298); c.fill(); drawCount++;
  w16_vehicle(c, P(-0.92, 0.288), 48, '#E0523A', '#8F3129', false);
  w16_vehicle(c, P(-0.82, 0.282), 46, '#E0523A', '#8F3129', false);
  /* a mast with a siren beside the bay */
  var sm = P(-0.76, 0.312);
  c.strokeStyle = '#8A949E'; c.lineWidth = Math.max(0.8, 1.2 * sm.k); c.beginPath(); c.moveTo(sm.sx, sm.sy); c.lineTo(sm.sx, sm.sy - 42 * sm.k); c.stroke(); drawCount++;
  c.fillStyle = '#E0523A'; c.beginPath(); c.ellipse(sm.sx, sm.sy - 44 * sm.k, 4 * sm.k, 3 * sm.k, 0, 0, 7); c.fill(); drawCount++;
}

/* ══════════ the container yard, front left ══════════ */
function w16_yard(c, P) {
  var cols = ['#C25A3A', '#3F7FA8', '#8AC46A', '#D9A441', '#5F6B78', '#B3564E'];
  var boxes = [];
  for (var row = 0; row < 3; row++) for (var i = 0; i < 5; i++) {
    if (w16_r(row * 17 + i + 2) < 0.16) continue;
    boxes.push({ x: -0.66 + i * 0.088, z: 0.130 + row * 0.026, st: w16_r(row * 7 + i) > 0.58 ? 2 : 1, col: Math.floor(w16_r(row * 11 + i + 5) * 6) });
  }
  c.fillStyle = 'rgba(58,67,77,.35)'; c.beginPath(); w16_quad(c, P, -0.72, -0.26, 0.118, 0.198); c.fill(); drawCount++;
  boxes.sort(function (a, b) { return b.z - a.z; });
  for (i = 0; i < boxes.length; i++) {
    var b = boxes[i], p = P(b.x, b.z), w = 40 * p.k, h = 16 * p.k * b.st, d = 11 * p.k;
    c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(p.sx - w / 2 + 3, p.sy - 2, w, 4); drawCount++;
    c.fillStyle = cols[b.col]; c.fillRect(p.sx - w / 2, p.sy - h, w, h); drawCount++;
    c.fillStyle = 'rgba(255,255,255,.22)'; c.fillRect(p.sx - w / 2, p.sy - h, w, h * 0.16); drawCount++;
    c.fillStyle = 'rgba(255,255,255,.30)'; c.beginPath();
    c.moveTo(p.sx - w / 2, p.sy - h); c.lineTo(p.sx - w / 2 + d, p.sy - h - d * 0.55); c.lineTo(p.sx + w / 2 + d, p.sy - h - d * 0.55); c.lineTo(p.sx + w / 2, p.sy - h); c.fill(); drawCount++;
    c.strokeStyle = 'rgba(0,0,0,.22)'; c.lineWidth = 0.7; c.beginPath();
    for (var q = 1; q < 6; q++) { var xx = p.sx - w / 2 + w * q / 6; c.moveTo(xx, p.sy - h); c.lineTo(xx, p.sy); } c.stroke(); drawCount++;
  }
  /* a straddle crane over the stack */
  var ka = P(-0.72, 0.126), kb = P(-0.24, 0.126), kh = 46;
  c.strokeStyle = '#F2C230'; c.lineWidth = Math.max(1, 1.8 * ka.k); c.beginPath();
  c.moveTo(ka.sx, ka.sy); c.lineTo(ka.sx, ka.sy - kh * ka.k); c.lineTo(kb.sx, kb.sy - kh * kb.k); c.lineTo(kb.sx, kb.sy);
  c.stroke(); drawCount++;
  c.fillStyle = '#F2C230'; c.fillRect(lerp(ka.sx, kb.sx, 0.42), ka.sy - kh * ka.k - 5, 16, 6); drawCount++;
}

/* ══════════ the grandstand — bottom centre, where the crawlerway used to run ══════════ */
function w16_stand(c, P) {
  var x0 = -0.20, x1 = 0.20, z0 = 0.104, z1 = 0.160, steps = 5;
  var shirts = ['#E0523A', '#FFC24D', '#4FD9E6', '#8AC46A', '#F3F4F6', '#B36BE0'];
  var seats = [], s, i;
  var base = P(0, z0);
  c.fillStyle = 'rgba(0,0,0,.20)'; c.beginPath();
  c.ellipse(base.sx, base.sy + 4, (P(x1, z0).sx - P(x0, z0).sx) * 0.56, 7 * base.k, 0, 0, 7); c.fill(); drawCount++;
  for (s = 0; s < steps; s++) {
    var za = lerp(z0, z1, s / steps), zb = lerp(z0, z1, (s + 1) / steps);
    var a = P(x0, za), b = P(x1, za), d = P(x1, zb), e = P(x0, zb), rise = (s + 1) * 10 * a.k;
    c.fillStyle = '#5A6470'; c.beginPath();
    c.moveTo(a.sx, a.sy - (s ? s * 9 * a.k : 0)); c.lineTo(b.sx, b.sy - (s ? s * 9 * b.k : 0));
    c.lineTo(b.sx, b.sy - rise); c.lineTo(a.sx, a.sy - rise); c.fill(); drawCount++;
    c.fillStyle = w16_gradH(c, a.sx, b.sx, '#B99560', '#8C6B3E'); c.beginPath();
    c.moveTo(a.sx, a.sy - rise); c.lineTo(b.sx, b.sy - rise); c.lineTo(d.sx, d.sy - rise); c.lineTo(e.sx, e.sy - rise); c.fill(); drawCount++;
    var n = 11;
    for (i = 0; i < n; i++) { var t = (i + 0.5) / n, x = lerp(x0 + 0.02, x1 - 0.02, t), p = P(x, (za + zb) / 2);
      if (w16_r(s * 31 + i + 11) < 0.10) continue;
      seats.push({ x: p.sx, y: p.sy - rise - 1, k: p.k, col: Math.floor(w16_r(s * 20 + i) * 6), dark: w16_r(s * 20 + i + 7) > 0.5 }); }
  }
  shirts.forEach(function (col, kk) { c.fillStyle = col; c.beginPath();
    for (var j = 0; j < seats.length; j++) { var f = seats[j]; if (f.col !== kk) continue;
      c.roundRect(f.x - 3.4 * f.k, f.y - 8.4 * f.k, 6.8 * f.k, 8.4 * f.k, 2.2 * f.k); }
    c.fill(); drawCount++; });
  [false, true].forEach(function (dark) { c.fillStyle = dark ? '#8D5A3A' : '#F2C9A0'; c.beginPath();
    for (var j = 0; j < seats.length; j++) { var f = seats[j]; if (f.dark !== dark) continue; w16_ell(c, f.x, f.y - 10.6 * f.k, 2.8 * f.k, 2.8 * f.k); }
    c.fill(); drawCount++; });
  /* stanchions, safety rail and the banner */
  var a2 = P(x0, z0), b2 = P(x1, z0), mid = P(0, z0 - 0.006);
  c.strokeStyle = '#5A6470'; c.lineWidth = Math.max(1, 2.4 * a2.k); c.beginPath();
  for (i = 0; i <= 4; i++) { var sp = P(lerp(x0, x1, i / 4), z0); c.moveTo(sp.sx, sp.sy); c.lineTo(sp.sx, sp.sy - 26 * sp.k); }
  c.moveTo(a2.sx, a2.sy - 26 * a2.k); c.lineTo(b2.sx, b2.sy - 26 * b2.k);
  c.moveTo(a2.sx, a2.sy - 15 * a2.k); c.lineTo(b2.sx, b2.sy - 15 * b2.k);
  c.stroke(); drawCount++;
  var bw = 104 * mid.k;
  c.fillStyle = '#F3F4F6'; c.beginPath(); c.roundRect(mid.sx - bw / 2, mid.sy - 23 * mid.k, bw, 13 * mid.k, 3); c.fill(); drawCount++;
  c.fillStyle = '#E0523A'; c.font = '800 ' + Math.max(8, 12 * mid.k).toFixed(1) + 'px ui-monospace, monospace';
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('GO!', mid.sx, mid.sy - 16.5 * mid.k); drawCount++;
}

/* ══════════ the visitor plaza, right of the grandstand ══════════ */
function w16_plaza(c, P) {
  c.fillStyle = 'rgba(150,156,162,.50)'; c.beginPath(); w16_quad(c, P, 0.30, 0.66, 0.096, 0.180); c.fill(); drawCount++;
  /* three awninged food stalls */
  var awn = ['#E0523A', '#4FD9E6', '#FFC24D'];
  for (var i = 0; i < 3; i++) {
    var x = 0.34 + i * 0.11;
    w16_box(c, P, x, x + 0.075, 0.150, 0.174, 26, '#E7ECF1', '#F3F4F6', '#C3CDD6');
    var ap = P(x, 0.148), bp = P(x + 0.075, 0.148);
    c.fillStyle = awn[i]; c.beginPath();                                    /* striped awning */
    c.moveTo(ap.sx - 2, ap.sy - 26 * ap.k); c.lineTo(bp.sx + 2, bp.sy - 26 * bp.k);
    c.lineTo(bp.sx + 2, bp.sy - 17 * bp.k); c.lineTo(ap.sx - 2, ap.sy - 17 * ap.k); c.fill(); drawCount++;
    c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath();
    for (var q = 0; q < 4; q++) { var qx = lerp(ap.sx, bp.sx, (q + 0.25) / 4); c.rect(qx, ap.sy - 26 * ap.k, (bp.sx - ap.sx) / 8, 9 * ap.k); }
    c.fill(); drawCount++;
    c.fillStyle = '#8C6B3E'; c.fillRect(ap.sx, ap.sy - 15 * ap.k, bp.sx - ap.sx, 3 * ap.k); drawCount++;   /* the counter */
    c.fillStyle = '#3A434D'; c.fillRect(ap.sx + (bp.sx - ap.sx) * 0.30, ap.sy - 13 * ap.k, (bp.sx - ap.sx) * 0.40, 6 * ap.k); drawCount++;
  }
  /* picnic tables with parasols */
  for (i = 0; i < 3; i++) {
    var p = P(0.355 + i * 0.10, 0.114), w = 15 * p.k;
    c.fillStyle = '#8C6B3E'; c.fillRect(p.sx - w, p.sy - 8 * p.k, w * 2, 3.4 * p.k); drawCount++;
    c.strokeStyle = '#9AA6B2'; c.lineWidth = Math.max(0.8, 1.2 * p.k); c.beginPath(); c.moveTo(p.sx, p.sy - 8 * p.k); c.lineTo(p.sx, p.sy - 30 * p.k); c.stroke(); drawCount++;
    c.fillStyle = i % 2 ? '#F6F3EE' : '#E0523A'; c.beginPath(); c.ellipse(p.sx, p.sy - 30 * p.k, 17 * p.k, 6 * p.k, 0, 0, 7); c.fill(); drawCount++;
  }
  /* bollards along the front edge and two bins */
  c.fillStyle = '#5A6470'; c.beginPath();
  for (i = 0; i < 8; i++) { var bp2 = P(0.30 + i * 0.052, 0.098); c.rect(bp2.sx - 1.6 * bp2.k, bp2.sy - 9 * bp2.k, 3.2 * bp2.k, 9 * bp2.k); }
  c.fill(); drawCount++;
  c.fillStyle = '#3F7FA8'; c.beginPath();
  for (i = 0; i < 2; i++) { var bn2 = P(0.325 + i * 0.30, 0.132); c.rect(bn2.sx - 4 * bn2.k, bn2.sy - 11 * bn2.k, 8 * bn2.k, 11 * bn2.k); }
  c.fill(); drawCount++;
  w16_tree(c, P(0.655, 0.150), 16);
}

/* ══════════ the spectator frontage in front of the grandstand ══════════ */
function w16_frontage(c, P) {
  var i;
  c.fillStyle = 'rgba(150,156,162,.50)'; c.beginPath(); w16_quad(c, P, -0.30, 0.30, 0.078, 0.106); c.fill(); drawCount++;
  /* turnstiles and a rope line */
  c.fillStyle = '#5A6470'; c.beginPath();
  for (i = 0; i < 5; i++) { var tp = P(-0.20 + i * 0.10, 0.098); c.rect(tp.sx - 2.4 * tp.k, tp.sy - 13 * tp.k, 4.8 * tp.k, 13 * tp.k); }
  c.fill(); drawCount++;
  c.strokeStyle = 'rgba(224,82,58,.55)'; c.lineWidth = Math.max(0.8, 1.3 * P(0, 0.09).k); c.beginPath();
  for (i = 0; i < 4; i++) { var a = P(-0.20 + i * 0.10, 0.094), b = P(-0.10 + i * 0.10, 0.094);
    c.moveTo(a.sx, a.sy - 10 * a.k); c.quadraticCurveTo((a.sx + b.sx) / 2, a.sy - 6 * a.k, b.sx, b.sy - 10 * b.k); }
  c.stroke(); drawCount++;
  /* two zebra crossings on the perimeter road */
  c.fillStyle = 'rgba(255,255,255,.60)'; c.beginPath();
  for (i = 0; i < 6; i++) { var cx = -0.05 + i * 0.014; w16_quad(c, P, cx, cx + 0.008, 0.164, 0.216);
    var dx = 0.545 + i * 0.014; w16_quad(c, P, dx, dx + 0.008, 0.164, 0.216); }
  c.fill(); drawCount++;
  /* two site signboards on the verge */
  for (i = 0; i < 2; i++) { var sp = P(i ? 0.68 : -0.86, 0.150), sw = 20 * sp.k;
    c.strokeStyle = '#8A949E'; c.lineWidth = Math.max(0.8, 1.2 * sp.k); c.beginPath();
    c.moveTo(sp.sx - sw * 0.5, sp.sy); c.lineTo(sp.sx - sw * 0.5, sp.sy - 16 * sp.k);
    c.moveTo(sp.sx + sw * 0.5, sp.sy); c.lineTo(sp.sx + sw * 0.5, sp.sy - 16 * sp.k); c.stroke(); drawCount++;
    c.fillStyle = i ? '#2F4E8F' : '#3B6B33'; c.fillRect(sp.sx - sw * 0.7, sp.sy - 28 * sp.k, sw * 1.4, 13 * sp.k); drawCount++;
    c.fillStyle = 'rgba(255,255,255,.75)'; c.fillRect(sp.sx - sw * 0.55, sp.sy - 25 * sp.k, sw * 1.1, 2.2 * sp.k);
    c.fillRect(sp.sx - sw * 0.55, sp.sy - 21 * sp.k, sw * 0.8, 2.2 * sp.k); drawCount++; }
}

/* ══════════ roads. `part` 'back' runs before the pad, 'front' after the warehouse ══════════ */
function w16_roads(c, P, part) {
  if (part === 'back') {
    /* the crawlerway: assembly building → apron, no longer pointed at the camera */
    c.fillStyle = '#8A8579'; c.beginPath();
    w16_quad(c, P, -0.88, -0.34, 0.334, 0.372);
    w16_quad(c, P, -0.86, -0.62, 0.372, 0.394);
    c.fill(); drawCount++;
    c.fillStyle = 'rgba(255,255,255,.26)'; c.beginPath();
    for (var x = -0.86; x < -0.36; x += 0.06) w16_quad(c, P, x, x + 0.03, 0.352, 0.356);
    c.fill(); drawCount++;
    return;
  }
  /* the perimeter road across the whole site, plus its spurs */
  c.fillStyle = '#8A8579'; c.beginPath();
  w16_quad(c, P, -1.35, 1.35, 0.160, 0.220);
  w16_quad(c, P, -0.76, -0.60, 0.216, 0.240);          /* into the warehouse yard */
  w16_quad(c, P, -0.44, -0.30, 0.216, 0.240);          /* out of the warehouse yard */
  w16_quad(c, P, 0.50, 0.66, 0.216, 0.248);            /* up to the car park */
  c.fill(); drawCount++;
  c.fillStyle = '#8A8579'; c.beginPath();              /* the east service road, up to admin */
  w16_poly(c, P, [[0.80, 0.216], [0.88, 0.216], [0.98, 0.408], [0.90, 0.408]]); c.fill(); drawCount++;
  c.strokeStyle = 'rgba(255,255,255,.30)'; c.lineWidth = 0.9; c.beginPath();
  var a = P(-1.35, 0.166), b = P(1.35, 0.166), d = P(-1.35, 0.214), e = P(1.35, 0.214);
  c.moveTo(a.sx, a.sy); c.lineTo(b.sx, b.sy); c.moveTo(d.sx, d.sy); c.lineTo(e.sx, e.sy); c.stroke(); drawCount++;
  c.fillStyle = 'rgba(255,255,255,.34)'; c.beginPath();
  for (var xx = -1.30; xx < 1.30; xx += 0.10) w16_quad(c, P, xx, xx + 0.05, 0.188, 0.192);
  c.fill(); drawCount++;
}

/* ══════════ everything static, back to front ══════════ */
function w16_static(c, DW, DH, gy) {
  var P = function (x, z) { return gproj(DW, DH, gy, x, z); };
  var gg = c.createLinearGradient(0, gy, 0, DH);
  gg.addColorStop(0, '#6E9C60'); gg.addColorStop(0.28, '#5B8A52'); gg.addColorStop(0.62, ART.ground); gg.addColorStop(1, '#375632');
  c.fillStyle = gg; c.fillRect(0, gy, DW, DH - gy); drawCount++;

  w16_farm(c, P, DW, DH, gy);          /* horizon, fields, farmhouse, pond — the right */
  w16_industry(c, P);                  /* the plant behind the rocket — the left */

  /* mown stripes over the open lawn (paving later covers what it should) */
  c.fillStyle = 'rgba(255,255,255,.040)'; c.beginPath();
  for (var i = -13; i <= 12; i += 2) w16_quad(c, P, i * 0.115, i * 0.115 + 0.115, 0.078, 0.466);
  c.fill(); drawCount++;

  w16_hangar(c, P);
  w16_admin(c, P);
  w16_masts(c, P);
  w16_roads(c, P, 'back');
  w16_pad(c, P, DW, gy);               /* UNCHANGED — the apron owns x ±0.38, z 0.305–0.475 */
  w16_helipad(c, P);
  w16_concourse(c, P);
  w16_warehouse(c, P);
  w16_carpark(c, P);
  w16_antennas(c, P);
  w16_roads(c, P, 'front');
  w16_bunker(c, P);
  w16_yard(c, P);
  w16_plaza(c, P);
  w16_frontage(c, P);
  w16_stand(c, P);

  /* hedge bands framing the very front, left and right of the grandstand */
  c.fillStyle = '#274520'; c.beginPath();
  for (i = -9; i <= 9; i++) { var hx = i * 0.088; if (Math.abs(hx) < 0.26) continue;
    var hp = P(hx, 0.080); w16_ell(c, hp.sx, hp.sy + 4, 26 * hp.k, 11 * hp.k); }
  c.fill(); drawCount++;
  c.fillStyle = '#33591F'; c.beginPath();
  for (i = -9; i <= 9; i++) { var hx2 = i * 0.088 + 0.035; if (Math.abs(hx2) < 0.26) continue;
    var hq = P(hx2, 0.084); w16_ell(c, hq.sx, hq.sy, 19 * hq.k, 8 * hq.k); }
  c.fill(); drawCount++;
}

/* ══════════════════════════════════════════════════════════════════════════════
   Shared anchors. The static layer and the live layer must agree on these, and
   drawSite's own live extras (if you keep them) can read them too.
   ══════════════════════════════════════════════════════════════════════════════ */
var w16_POND      = [1.00, 0.535];                                   /* the pond, far right   */
var w16_HELI      = [0.84, 0.360];                                   /* helipad centre        */
var w16_FLAGPOLES = [[0.400, 0.312], [0.455, 0.312], [0.510, 0.312]];/* concourse frontage    */
var W22_DOCK      = [-0.70, -0.56, -0.42];                           /* warehouse bay centres */
var W22_DOCKZ     = 0.252, W22_ROADZ = 0.190, W22_RACKZ = 0.300;
var W22_DOOR      = [0.700, 0.392];                                  /* admin entrance        */

/* ══════════ W17 additions ══════════ */

/* an articulated lorry seen from above-behind. dir +1 drives right. */
function w17_bigtruck(c, sx, sy, k, dir, col, dk) {
  var u = 17 * k, d = 0.5 * u;
  c.save(); c.translate(sx, sy); c.scale(dir, 1);
  c.fillStyle = 'rgba(0,0,0,.20)'; c.beginPath(); c.ellipse(0, 1, u * 2.5, u * 0.34, 0, 0, 7); c.fill(); drawCount++;
  c.fillStyle = '#2B2F38'; c.beginPath();                                        /* wheels */
  c.arc(-u * 1.95, -u * 0.28, u * 0.30, 0, 7); c.arc(-u * 1.45, -u * 0.28, u * 0.30, 0, 7);
  c.arc(u * 0.95, -u * 0.28, u * 0.30, 0, 7); c.arc(u * 1.85, -u * 0.28, u * 0.30, 0, 7); c.fill(); drawCount++;
  c.fillStyle = dk; c.fillRect(-u * 2.30, -u * 1.85, u * 3.20, u * 1.45); drawCount++;   /* trailer side */
  c.fillStyle = '#E9EEF3'; c.beginPath();                                        /* trailer roof */
  c.moveTo(-u * 2.30, -u * 1.85); c.lineTo(-u * 2.30 + d, -u * 1.85 - d * 0.5);
  c.lineTo(u * 0.90 + d, -u * 1.85 - d * 0.5); c.lineTo(u * 0.90, -u * 1.85); c.fill(); drawCount++;
  c.fillStyle = 'rgba(255,255,255,.20)'; c.fillRect(-u * 2.30, -u * 1.85, u * 3.20, u * 0.22); drawCount++;
  c.fillStyle = col; c.fillRect(u * 1.00, -u * 1.72, u * 1.20, u * 1.34); drawCount++;   /* cab */
  c.fillStyle = '#9FD3F5'; c.fillRect(u * 1.62, -u * 1.58, u * 0.50, u * 0.46); drawCount++;
  c.fillStyle = '#F2C230'; c.fillRect(u * 2.16, -u * 0.86, u * 0.14, u * 0.18); drawCount++;
  c.restore();
}

/* a forklift; `load` 1 draws a pallet on the forks */
function w17_forklift(c, sx, sy, k, dir, load) {
  var u = 9 * k;
  c.save(); c.translate(sx, sy); c.scale(dir, 1);
  c.fillStyle = 'rgba(0,0,0,.20)'; c.beginPath(); c.ellipse(0, 1, u * 1.3, u * 0.28, 0, 0, 7); c.fill(); drawCount++;
  c.fillStyle = '#2B2F38'; c.beginPath();
  c.arc(-u * 0.7, -u * 0.28, u * 0.30, 0, 7); c.arc(u * 0.55, -u * 0.26, u * 0.24, 0, 7); c.fill(); drawCount++;
  c.fillStyle = '#F2C230'; c.fillRect(-u * 1.05, -u * 1.35, u * 1.55, u * 1.05); drawCount++;
  c.fillStyle = '#3A434D'; c.fillRect(-u * 0.95, -u * 2.15, u * 0.14, u * 0.85); c.fillRect(-u * 0.55, -u * 2.6, u * 0.16, u * 2.3); drawCount++;
  c.strokeStyle = '#8A949E'; c.lineWidth = Math.max(0.8, 1.2 * k); c.beginPath();
  c.moveTo(u * 0.75, -u * 2.55); c.lineTo(u * 0.75, -u * 0.15); c.moveTo(u * 0.75, -u * 0.15); c.lineTo(u * 1.55, -u * 0.15); c.stroke(); drawCount++;
  c.fillStyle = '#E9EEF3'; c.beginPath(); c.arc(-u * 0.25, -u * 1.72, u * 0.34, 0, 7); c.fill(); drawCount++;
  if (load) { c.fillStyle = '#C25A3A'; c.fillRect(u * 0.80, -u * 1.30, u * 0.85, u * 0.95); drawCount++;
    c.fillStyle = '#8C6B3E'; c.fillRect(u * 0.78, -u * 0.36, u * 0.92, u * 0.20); drawCount++; }
  c.restore();
}

/* a small car */
function w17_car(c, sx, sy, k, dir, col) {
  var u = 10 * k;
  c.save(); c.translate(sx, sy); c.scale(dir, 1);
  c.fillStyle = 'rgba(0,0,0,.20)'; c.beginPath(); c.ellipse(0, 1, u * 1.4, u * 0.26, 0, 0, 7); c.fill(); drawCount++;
  c.fillStyle = '#2B2F38'; c.beginPath(); c.arc(-u * 0.72, -u * 0.24, u * 0.26, 0, 7); c.arc(u * 0.72, -u * 0.24, u * 0.26, 0, 7); c.fill(); drawCount++;
  c.fillStyle = col; c.beginPath(); c.roundRect(-u * 1.25, -u * 0.95, u * 2.5, u * 0.75, u * 0.28); c.fill(); drawCount++;
  c.fillStyle = 'rgba(30,44,60,.75)'; c.beginPath(); c.roundRect(-u * 0.62, -u * 1.5, u * 1.3, u * 0.62, u * 0.26); c.fill(); drawCount++;
  c.restore();
}

/* a drifting plume — 4 puffs on their own clock */
function w17_smoke(c, sx, sy, k, now, off, tint) {
  for (var i = 0; i < 4; i++) {
    var t = ((now / 3400 + off + i * 0.25) % 1);
    var r = (5 + t * 22) * k, y = sy - t * 62 * k, x = sx + t * t * 30 * k;
    c.fillStyle = 'rgba(' + tint + ',' + (0.34 * (1 - t)).toFixed(3) + ')';
    c.beginPath(); c.ellipse(x, y, r, r * 0.78, 0, 0, 7); c.fill(); drawCount++;
  }
}

/* ══════════ the live frame ══════════ */
function drawLife(c, DW, DH, gy, now, seed, phase) {
  var S = seed || 0, flight = phase === 'flight', turn = phase === 'turnaround';
  var P = function (x, z) { return gproj(DW, DH, gy, x, z); };
  var i, p, q, u, v, g, x, z;
  c.save();
  c.lineJoin = 'round';

  /* ── sky · JET · 22 s (5 s visible) ──────────────────────────────── */
  (function () {
    var pp = w17_cyc(now, 22, w17_rnd(S + 2));
    if (pp > 0.24) return;
    var uu = pp / 0.24;
    w17_jet(c, DW * (0.74 - 0.50 * uu), gy * (0.28 + 0.10 * Math.sin(uu * 3)),
            Math.max(0.55, DW / 950), -1, Math.min(1, Math.min(uu, 1 - uu) / 0.25));
  })();

  /* ── sky · BIRDS · 15 s ──────────────────────────────────────────── */
  (function () {
    var pp = w17_cyc(now, 15, w17_rnd(S + 3));
    if (pp > 0.6) return;
    var uu = pp / 0.6;
    w17_birds(c, DW * (0.70 - 0.42 * uu), gy * (0.66 + 0.12 * Math.sin(uu * 4 + 1)), Math.max(0.6, DW / 950), now, 5);
  })();

  /* ── z .60 · THE PLANT · flare, two plumes, obstruction lights ───── */
  (function () {
    var ch = P(-0.50, 0.604), fm = P(-0.36, 0.598);           /* the two stacks w16_industry raised */
    var st = [{ sx: ch.sx, sy: ch.sy - 132 * ch.k, k: ch.k }, { sx: fm.sx, sy: fm.sy - 148 * fm.k, k: fm.k }];
    w17_smoke(c, st[0].sx, st[0].sy, st[0].k, now, 0.0, '226,232,238');
    var ct = P(-0.66, 0.606);
    w17_smoke(c, ct.sx, ct.sy - 74 * ct.k, ct.k, now, 0.45, '236,240,244');
    /* the flare, guttering on its own clock */
    var f = st[1], fl = (0.8 + 0.2 * Math.sin(now / 90) * Math.sin(now / 37)) * 2.4 / Math.max(0.4, f.k);
    c.fillStyle = 'rgba(255,140,52,.9)'; c.beginPath();
    c.moveTo(f.sx - 4 * f.k, f.sy + 2); c.quadraticCurveTo(f.sx + 9 * f.k, f.sy - 14 * fl * f.k, f.sx - 2 * f.k, f.sy - 26 * fl * f.k);
    c.quadraticCurveTo(f.sx - 11 * f.k, f.sy - 12 * fl * f.k, f.sx + 4 * f.k, f.sy + 2); c.fill(); drawCount++;
    c.fillStyle = 'rgba(255,238,170,.95)'; c.beginPath();
    c.ellipse(f.sx, f.sy - 7 * fl * f.k, 2.6 * f.k, 7 * fl * f.k, 0, 0, 7); c.fill(); drawCount++;
    /* obstruction lights on the columns and the stacks */
    c.fillStyle = Math.sin(now / 420) > 0 ? '#FF4D4D' : '#7A2E28'; c.beginPath();
    var lit = [[-1.16, 0.582, 108], [-1.04, 0.578, 126], [-0.50, 0.604, 132], [-0.36, 0.598, 148]];
    for (var j = 0; j < 4; j++) { var lp = P(lit[j][0], lit[j][1]); c.rect(lp.sx - 1.2, lp.sy - lit[j][2] * lp.k - 2, 2.4, 2.4); }
    c.fill(); drawCount++;
  })();

  /* ── z .54 · THE POND ripples (drawSite's copy must be deleted) ──── */
  (function () {
    var pd = P(w16_POND[0], w16_POND[1]), wob = Math.sin(now / 700) * 3;
    c.fillStyle = 'rgba(255,255,255,.34)'; c.beginPath();
    c.ellipse(pd.sx - 14 * pd.k + wob, pd.sy - 3 * pd.k, 20 * pd.k, 1.6 * pd.k, 0, 0, 7);
    c.ellipse(pd.sx + 16 * pd.k - wob, pd.sy + 4 * pd.k, 14 * pd.k, 1.3 * pd.k, 0, 0, 7); c.fill(); drawCount++;
  })();

  /* ── z .50 · THE FARM · tractor, a grazing flock, the farmer ─────── */
  (function () {
    var pp = w17_cyc(now, 26, w17_rnd(S + 1));
    var row = pp < 0.5 ? 0.508 : 0.546, uu = pp < 0.5 ? pp * 2 : (1 - pp) * 2;
    g = P(0.28 + 0.82 * uu, row);
    w17_tractor(c, g.sx, g.sy, g.k, pp < 0.5 ? 1 : -1, now);
  })();
  (function () {
    var flock = [[0.22, 0.494], [0.30, 0.502], [0.17, 0.508]];
    for (i = 0; i < 3; i++) { var s0 = P(flock[i][0], flock[i][1]);
      w17_sheep(c, s0.sx, s0.sy, s0.k * 1.3, Math.sin(now / 620 + i * 2) * 0.5 + 0.5); }
    var pp = w17_cyc(now, 40, w17_rnd(S + 8));
    var A = [0.56, 0.552], B = [0.24, 0.500];
    if (pp < 0.42) { u = w17_ease(pp / 0.42); x = lerp(A[0], B[0], u); z = lerp(A[1], B[1], u); }
    else if (pp < 0.54) { x = B[0]; z = B[1]; }
    else if (pp < 0.96) { u = w17_ease((pp - 0.54) / 0.42); x = lerp(B[0], A[0], u); z = lerp(B[1], A[1], u); }
    else { x = A[0]; z = A[1]; }
    g = P(x, z);
    w17_person(c, g.sx, g.sy, g.k * 1.15, { shirt: '#8B6B4A', hat: '#C8A46A', arm: 'swing', walk: (pp < 0.42 || (pp > 0.54 && pp < 0.96)) ? now / 95 : 0 });
  })();

  /* ── z .35 · THE HELICOPTER · lands far right and drops two people ── */
  (function () {
    var pp = w17_cyc(now, 46, w17_rnd(S + 30));
    var H = P(w16_HELI[0], w16_HELI[1]), k = H.k;
    var IN = 0.20, DOWN = 0.28, SIT = 0.62, UP = 0.70, OUT = 0.86;
    var hx = null, hy = 0, spin = 1;
    if (pp < IN) { u = w17_ease(pp / IN); hx = lerp(H.sx + DW * 0.60, H.sx, u); hy = lerp(H.sy - DH * 0.34, H.sy - 14 * k, u); }
    else if (pp < DOWN) { u = w17_ease((pp - IN) / (DOWN - IN)); hx = H.sx; hy = lerp(H.sy - 14 * k, H.sy - 3 * k, u); spin = 1 - u * 0.6; }
    else if (pp < SIT) { hx = H.sx; hy = H.sy - 3 * k; q = (pp - DOWN) / (SIT - DOWN); spin = q > 0.80 ? 0.4 + (q - 0.80) / 0.20 * 0.6 : 0.4; }
    else if (pp < UP) { u = w17_ease((pp - SIT) / (UP - SIT)); hx = H.sx; hy = lerp(H.sy - 3 * k, H.sy - 16 * k, u); }
    else if (pp < OUT) { u = w17_ease((pp - UP) / (OUT - UP)); hx = lerp(H.sx, H.sx + DW * 0.62, u); hy = lerp(H.sy - 16 * k, H.sy - DH * 0.36, u); }
    /* the two passengers: out of the door, across the concourse, into ADMIN */
    var wk = w17_seg(pp, DOWN + 0.02, SIT - 0.04);
    if (wk > 0 && wk < 1) {
      for (i = 0; i < 2; i++) {
        var t = clamp((wk - i * 0.10) / 0.90, 0, 1), e = w17_ease(t);
        var px = lerp(w16_HELI[0] - 0.02, W22_DOOR[0], e), pz = lerp(w16_HELI[1] - 0.012, W22_DOOR[1] - 0.004, e);
        if (t >= 1) continue;
        g = P(px, pz + i * 0.010);
        w17_person(c, g.sx, g.sy, g.k, { shirt: i ? '#2F4E8F' : '#B36BE0', hat: null, arm: t < 0.04 ? 'up' : 'carry', walk: now / 100 + i });
      }
    }
    if (hx !== null && hx > -DW * 0.3 && hx < DW * 1.3) w17_heli(c, hx, hy, Math.max(0.9, k * 1.5), spin, now);
  })();

  /* ── z .30–.40 · THE CONCOURSE · staff to and from ADMIN ─────────── */
  (function () {
    var routes = [[[0.600, 0.298], [0.700, 0.386], 27, '#4FD9E6'],
                  [[0.430, 0.306], [0.672, 0.384], 33, '#E0523A'],
                  [[0.355, 0.344], [0.688, 0.380], 39, '#FFC24D'],
                  [[0.760, 0.318], [0.712, 0.382], 24, '#8AC46A']];
    for (i = 0; i < routes.length; i++) {
      var r = routes[i], pp = w17_cyc(now, r[2], w17_rnd(S + 40 + i * 3));
      var a = r[0], b = r[1], walk = now / 105, arm = 'swing';
      if (pp < 0.40) { u = w17_ease(pp / 0.40); x = lerp(a[0], b[0], u); z = lerp(a[1], b[1], u); }
      else if (pp < 0.48) { continue; }                                   /* inside the building */
      else if (pp < 0.88) { u = w17_ease((pp - 0.48) / 0.40); x = lerp(b[0], a[0], u); z = lerp(b[1], a[1], u); }
      else { x = a[0]; z = a[1]; walk = 0; arm = flight ? 'up' : 'watch'; }
      g = P(x, z);
      w17_person(c, g.sx, g.sy, g.k, { shirt: r[3], hat: null, arm: arm, walk: walk });
    }
  })();

  /* ── z .31–.37 · SCIENTISTS · admin ↔ the pad, stopping to write ─── */
  (function () {
    var legs = [[[0.620, 0.368], [0.210, 0.318], 36], [[0.520, 0.386], [0.300, 0.312], 43], [[0.400, 0.336], [0.130, 0.322], 50]];
    for (i = 0; i < legs.length; i++) {
      var L = legs[i], pp = w17_cyc(now, L[2], w17_rnd(S + 60 + i * 5));
      var a = L[0], b = L[1], walk = now / 110, reading = false;
      if (pp < 0.36) { u = w17_ease(pp / 0.36); x = lerp(a[0], b[0], u); z = lerp(a[1], b[1], u); }
      else if (pp < 0.54) { x = b[0]; z = b[1]; walk = 0; reading = true; }
      else if (pp < 0.90) { u = w17_ease((pp - 0.54) / 0.36); x = lerp(b[0], a[0], u); z = lerp(b[1], a[1], u); }
      else { x = a[0]; z = a[1]; walk = 0; reading = true; }
      g = P(x, z);
      w17_scientist(c, g.sx, g.sy, g.k, walk, reading || flight);
    }
  })();

  /* ── z .35 · THE FUEL BOWSER on the crawlerway · 44 s ────────────── */
  (function () {
    var pp = w17_cyc(now, 44, w17_rnd(S + 6));
    if (flight) pp = 0.985;
    if (turn) pp = 0.34 + 0.10 * w17_cyc(now, 18, 0);
    var Z = 0.352, PARK = -0.31, HOSE = -0.20, BACK = -0.56, tx, driver = null, hose = 0;
    if (pp < 0.10) { tx = -0.98 + (PARK + 0.98) * w17_ease(pp / 0.10); }
    else if (pp < 0.92) {
      tx = PARK; q = (pp - 0.10) / 0.82;
      if (q < 0.08) driver = { x: PARK + 0.04 * (q / 0.08), arm: 'swing', walk: now / 90 };
      else if (q < 0.24) { v = (q - 0.08) / 0.16; driver = { x: PARK + 0.04 + (HOSE - PARK - 0.04) * v, arm: 'swing', walk: now / 90 }; hose = v; }
      else if (q < 0.40) { driver = { x: HOSE, arm: 'up', walk: 0 }; hose = 1; }
      else if (q < 0.52) { v = (q - 0.40) / 0.12; driver = { x: HOSE + (BACK - HOSE) * v, arm: 'swing', walk: now / 90 }; hose = 1; }
      else if (q < 0.76) { driver = { x: BACK, arm: 'watch', walk: 0 }; hose = 1; }
      else if (q < 0.90) { v = (q - 0.76) / 0.14; driver = { x: BACK + (PARK - BACK) * v, arm: 'swing', walk: now / 90 }; hose = 1 - v; }
    } else { tx = PARK + (-0.98 - PARK) * w17_ease((pp - 0.92) / 0.08); }
    if (tx > -0.99 && tx < 0.10) {
      g = P(tx, Z);
      if (hose > 0) {
        var ha = P(tx + 0.06, Z), hb = P(HOSE + 0.10 * hose, Z - 0.015);
        c.strokeStyle = '#2E3440'; c.lineWidth = Math.max(1, 2.2 * g.k); c.lineCap = 'round';
        c.beginPath(); c.moveTo(ha.sx, ha.sy - 10 * g.k);
        c.quadraticCurveTo((ha.sx + hb.sx) / 2, ha.sy + 5 * g.k, hb.sx, hb.sy - 3 * g.k); c.stroke(); drawCount++;
      }
      w17_truck(c, g.sx, g.sy, g.k, 1);
      if (driver) { var d = P(driver.x, Z - 0.018); w17_person(c, d.sx, d.sy, d.k, { shirt: '#F0A93B', hat: '#F6F3EE', arm: driver.arm, walk: driver.walk }); }
    }
  })();

  /* ── z .31 · THE FLAGS on the concourse poles ────────────────────── */
  (function () {
    for (i = 0; i < 3; i++) {
      var fp = P(w16_FLAGPOLES[i][0], w16_FLAGPOLES[i][1]);
      w17_flag(c, fp.sx, fp.sy, fp.k * 0.95, now, i * 0.7 + w17_rnd(S + 4 + i));
    }
  })();

  /* ══ z .24–.32 · THE WAREHOUSE · three bays, always something moving ══ */
  (function () {
    var cols = [['#E0523A', '#9E3626'], ['#3F7FA8', '#28536E'], ['#8AC46A', '#4E7C46']];
    for (i = 0; i < 3; i++) {
      var B = W22_DOCK[i], pp = w17_cyc(now, 54, w17_rnd(S + 80 + i * 7));
      var IN = 0.13, PULL = 0.19, LOAD = 0.68, BACKOUT = 0.74, GONE = 0.88;
      var tx2, tz, dir = 1, show = true;
      if (pp < IN) { tx2 = lerp(-1.32, B, pp / IN); tz = W22_ROADZ; }
      else if (pp < PULL) { u = w17_ease((pp - IN) / (PULL - IN)); tx2 = B; tz = lerp(W22_ROADZ, W22_DOCKZ, u); }
      else if (pp < LOAD) { tx2 = B; tz = W22_DOCKZ; }
      else if (pp < BACKOUT) { u = w17_ease((pp - LOAD) / (BACKOUT - LOAD)); tx2 = B; tz = lerp(W22_DOCKZ, W22_ROADZ, u); }
      else if (pp < GONE) { tx2 = lerp(B, 1.32, (pp - BACKOUT) / (GONE - BACKOUT)); tz = W22_ROADZ; }
      else show = false;
      if (show) { g = P(tx2, tz); w17_bigtruck(c, g.sx, g.sy, g.k, dir, cols[i][0], cols[i][1]); }

      /* a forklift feeding that bay while the truck is on it */
      if (pp > PULL && pp < LOAD) {
        var fq = (pp - PULL) / (LOAD - PULL), lap = (fq * 5) % 1, out = lap < 0.5;
        var ft = out ? lap * 2 : (1 - lap) * 2;
        var fz = lerp(W22_RACKZ, W22_DOCKZ + 0.012, w17_ease(ft));
        var fx2 = B + (1 - ft) * 0.03;
        g = P(fx2, fz);
        w17_forklift(c, g.sx, g.sy, g.k, out ? -1 : 1, out ? 1 : 0);
      }
      /* a loader on the apron beside the bay */
      var lp = P(B + 0.052, W22_DOCKZ - 0.006);
      w17_person(c, lp.sx, lp.sy, lp.k, { shirt: '#F0A93B', hat: '#F6F3EE',
        arm: (pp > PULL && pp < LOAD) ? 'carry' : 'watch', walk: (pp > PULL && pp < LOAD) ? Math.sin(now / 400 + i) * 0.5 : 0 });
    }
    /* a checker walking the rack line with a clipboard */
    var cp = w17_cyc(now, 31, w17_rnd(S + 99));
    var cx = lerp(-0.78, -0.38, cp < 0.5 ? cp * 2 : (1 - cp) * 2);
    g = P(cx, 0.284);
    w17_scientist(c, g.sx, g.sy, g.k, now / 110, false);
  })();

  /* ── z .19 · GOLF CART and a CAR arriving at the park ────────────── */
  (function () {
    var pp = w17_cyc(now, 19, w17_rnd(S + 9));
    var Lx = -0.60, Rx = 0.60, ZF = 0.176, ZB = 0.206, dir = 1;
    if (pp < 0.40) { x = lerp(Lx, Rx, pp / 0.40); z = ZF; dir = 1; }
    else if (pp < 0.48) { x = Rx; z = lerp(ZF, ZB, (pp - 0.40) / 0.08); dir = -1; }
    else if (pp < 0.90) { x = lerp(Rx, Lx, (pp - 0.48) / 0.42); z = ZB; dir = -1; }
    else { x = Lx; z = lerp(ZB, ZF, (pp - 0.90) / 0.10); dir = 1; }
    g = P(x, z);
    w17_cart(c, g.sx, g.sy, g.k, dir);

    var cp = w17_cyc(now, 37, w17_rnd(S + 11));
    if (cp < 0.34) { g = P(lerp(-1.30, 0.58, cp / 0.34), 0.182); w17_car(c, g.sx, g.sy, g.k, 1, '#B36BE0'); }
    else if (cp < 0.42) { u = w17_ease((cp - 0.34) / 0.08); g = P(0.58, lerp(0.182, 0.246, u)); w17_car(c, g.sx, g.sy, g.k, 1, '#B36BE0'); }
    else if (cp > 0.72 && cp < 0.80) { u = w17_ease((cp - 0.72) / 0.08); g = P(0.58, lerp(0.246, 0.182, u)); w17_car(c, g.sx, g.sy, g.k, -1, '#B36BE0'); }
    else if (cp >= 0.80) { g = P(lerp(0.58, -1.30, (cp - 0.80) / 0.20), 0.182); w17_car(c, g.sx, g.sy, g.k, -1, '#B36BE0'); }
  })();

  /* ── z .10–.15 · THE GRANDSTAND · three at the rail, one waving ──── */
  (function () {
    var rail = [[-0.130, 0.096], [0.018, 0.094], [0.148, 0.096]];
    for (i = 0; i < 3; i++) {
      g = P(rail[i][0], rail[i][1]);
      var arm = flight ? 'up' : (i === 1 ? 'wave' : 'watch');
      w17_person(c, g.sx, g.sy, g.k * 0.95,
        { shirt: ['#8AC46A', '#E0523A', '#4FD9E6'][i], hat: i === 2 ? '#F6F3EE' : null, arm: arm, walk: arm === 'wave' ? now / 160 : 0 });
    }
  })();

  c.restore();
}
