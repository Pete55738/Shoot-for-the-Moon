#!/usr/bin/env node
/**
 * sim.mjs — the headless balance sim, run against the shipped page.
 *
 * Extracts the BAL-START…BAL-END block from app/shoot-for-the-moon.html and
 * evaluates it, so the numbers here are the numbers players get — there is no
 * second copy of the balance table to drift. Exit code 1 when the gate fails.
 *
 *   node scripts/sim.mjs            # gate + per-strategy rows
 *   node scripts/sim.mjs --curve    # also: apogee at every all-tier level
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');
const html = readFileSync(resolve(ROOT, 'app/shoot-for-the-moon.html'), 'utf8');
const a = html.indexOf('/*BAL-START*/'), b = html.indexOf('/*BAL-END*/');
if (a < 0 || b < 0) { console.error('balance block markers missing'); process.exit(2); }
const block = html.slice(a, b);
const OVER = process.env.BAL_OVER ? JSON.parse(process.env.BAL_OVER) : null;
let src = block;
if (OVER) for (const [k, v] of Object.entries(OVER)) {
  const re = new RegExp('(const ' + k + '\\s*=\\s*)[-0-9.]+');
  if (!re.test(src)) { console.error('no such knob:', k); process.exit(2); }
  src = src.replace(re, '$1' + v);
}
const B = new Function(src + '\nreturn { flyRocket, rewardOf, costOf, runBalanceSim, MOON_KM, TIERS, missionReached, simulate, STRATEGIES, MISSIONS, FLIGHT_PLAN };')();

if (process.argv.includes('--curve')) {
  console.log('tier  apogee km   burnout km  top m/s  burn s  reward');
  for (let n = 1; n <= B.TIERS; n++) { const t = { engine: n, tank: n, aero: n, hull: n, payload: n }; const f = B.flyRocket(t);
    console.log(String(n).padEnd(5), (f.moon ? 'MOON' : f.apogeeKm.toFixed(1)).padEnd(11), f.burnoutKm.toFixed(1).padEnd(11), Math.round(f.maxV).toString().padEnd(8), f.tBurn.toFixed(0).padEnd(7), B.rewardOf(f.apogeeKm, t), '· Δv', (f.dv / 1000).toFixed(2), 'km/s'); }
}
if (process.argv.includes('--targets')) {
  /* Wall-clock: countdown 1.55 s + the mission's flight budget + 15 s turnaround. */
  /* 10 = TURNAROUND_S in the app — the whole rebuild, mishap included. It lives outside the
     balance block, so this is the one place that has to be kept in step with it by hand. */
  const cycle = m => 1.55 + (B.FLIGHT_PLAN[m] || B.FLIGHT_PLAN[0]).reduce((a, x) => a + x[1], 0) + 10;
  const rows = Object.entries(B.STRATEGIES).map(([name, s]) => ({ name, ...B.simulate(s) }));
  console.log('strategy       m1   m2   m3   m4   m5  done   dry   minutes');
  for (const r of rows) {
    const a = r.at, done = r.launches || 0;
    let secs = 0, prev = 0;
    for (let m = 1; m <= 5; m++) { const at = a['m' + m] || done; secs += (at - prev) * cycle(m - 1); prev = at; }
    secs += (done - prev) * cycle(5);
    console.log(' ', r.name.padEnd(13), [1,2,3,4,5].map(m => String(a['m'+m] ?? '—').padStart(4)).join(' '),
      String(done || 'never').padStart(5), String(r.maxDry).padStart(5), (secs / 60).toFixed(0).padStart(8) + ' min');
  }
  const c = rows.find(r => r.name === 'cheapest');
  const okM1 = c.at.m1 >= 10 && c.at.m1 <= 20, okLen = c.launches >= 100 && c.launches <= 150;
  console.log(okM1 ? 'PASS m1 in 10–20' : 'FAIL m1 = ' + c.at.m1, '·', okLen ? 'PASS length 100–150' : 'FAIL length = ' + c.launches);
}
const r = B.runBalanceSim();
console.log((r.ok ? 'PASS' : 'FAIL') + ' · ' + r.gate);
for (const x of r.rows) console.log(' ', x.name.padEnd(14), x.reached ? 'base built @ launch ' + x.launches : 'never builds the base', '· max dry', x.maxDry, '· buys', x.buys, '· milestones', JSON.stringify(x.at));
process.exit(r.ok ? 0 : 1);
