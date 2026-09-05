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
const B = new Function(block + '\nreturn { flyRocket, rewardOf, costOf, runBalanceSim, MOON_KM, TIERS };')();

if (process.argv.includes('--curve')) {
  console.log('tier  apogee km   burnout km  top m/s  burn s  reward');
  for (let n = 1; n <= B.TIERS; n++) { const t = { engine: n, tank: n, aero: n, hull: n, payload: n }; const f = B.flyRocket(t);
    console.log(String(n).padEnd(5), (f.moon ? 'MOON' : f.apogeeKm.toFixed(1)).padEnd(11), f.burnoutKm.toFixed(1).padEnd(11), Math.round(f.maxV).toString().padEnd(8), f.tBurn.toFixed(0).padEnd(7), B.rewardOf(f.apogeeKm, t)); }
}
const r = B.runBalanceSim();
console.log((r.ok ? 'PASS' : 'FAIL') + ' · ' + r.gate);
for (const x of r.rows) console.log(' ', x.name.padEnd(13), x.reached ? 'Moon @ launch ' + x.launches : 'never reaches the Moon', '· max dry', x.maxDry, '· buys', x.buys);
process.exit(r.ok ? 0 : 1);
