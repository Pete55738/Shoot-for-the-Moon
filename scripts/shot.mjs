#!/usr/bin/env node
/**
 * shot.mjs — the critic's camera (dev-standards skills/07-game.md §3).
 *
 * Loads the game from disk in headless Chromium, unlocks DEV with a dummy
 * PAT (the page never sends it anywhere), jumps to a scene, waits, and writes
 * a PNG plus a JSON log: console errors, fps over two seconds, draw count,
 * and the balance-sim result. No network is involved — file:// only — so the
 * browse.mjs relay is not needed here.
 *
 *   node scripts/shot.mjs [--scene pad|turnaround|flight|space|apogee|descent|moon]
 *                         [--tiers N] [--modules N] [--light] [--w 390 --h 844]
 *                         [--out docs/studies/x.png] [--all]
 *
 * --all renders every scene at phone size into docs/studies/round-<n>/ and
 * one contact sheet beside them.
 */
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const args = process.argv.slice(2);
const flag = (n, d = null) => { const i = args.indexOf('--' + n); return i < 0 ? d : (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true); };
const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');
const PAGE = 'file://' + resolve(ROOT, 'app/shoot-for-the-moon.html');
const SCENES = ['pad', 'turnaround', 'flight', 'space', 'apogee', 'descent', 'moon'];

const W = +(flag('w', 390)), H = +(flag('h', 844));
const tiers = +(flag('tiers', 4)), modules = +(flag('modules', 3));
const light = !!flag('light');

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, colorScheme: light ? 'light' : 'dark' });

async function shoot(scene, out) {
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  await page.addInitScript(({ tiers, modules }) => {
    localStorage.setItem('dash-token-shoot-for-the-moon', 'shot-tool-dummy');
    localStorage.setItem('sftm-tour', 'done');
    const t = { engine: tiers, tank: tiers, aero: tiers, hull: tiers, payload: tiers };
    localStorage.setItem('sftm-save', JSON.stringify({ envelope: 1, kind: 'save', at: new Date().toISOString(),
      payload: { tiers: t, money: 1234, launches: 12, earned: 5000, bestKm: 120, bestV: 1500, milestones: [1, 10, 100], modules, log: [
        { n: 12, km: 120, v: 1500, earned: 320, note: 'New record' }, { n: 11, km: 80, v: 1100, earned: 200, note: '' }], seed: 7 } }));
  }, { tiers, modules });
  await page.goto(PAGE);
  await page.waitForFunction(() => window.DEV && document.getElementById('scene').width > 0);
  await page.evaluate(sc => window.DEV.jump(sc), scene);
  await page.waitForTimeout(500);
  // fps over two seconds, driven by rAF while the scene redraws itself
  const fps = await page.evaluate(() => new Promise(res => { let n = 0; const t0 = performance.now();
    const f = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else res(Math.round(n / 2)); }; requestAnimationFrame(f); }));
  const drawCount = await page.evaluate(() => (window.DEV.drawCount(), document.getElementById('scene') && window.DEV.drawCount()));
  const sim = await page.evaluate(() => window.DEV.sim());
  mkdirSync(dirname(out), { recursive: true });
  await page.screenshot({ path: out, fullPage: false });
  const log = { scene, out, viewport: [W, H], light, tiers, errors, fps, drawCount, phase: await page.evaluate(() => window.DEV.phase), sim: sim && { ok: sim.ok, rows: sim.rows } };
  writeFileSync(out.replace(/\.png$/, '.json'), JSON.stringify(log, null, 2));
  await page.close();
  return log;
}

if (flag('all')) {
  let n = 1; while (existsSync(resolve(ROOT, `docs/studies/round-${n}`))) n++;
  const dir = flag('out') || resolve(ROOT, `docs/studies/round-${n}`);
  const logs = [];
  for (const sc of SCENES) logs.push(await shoot(sc, resolve(dir, sc + '.png')));
  // contact sheet: all scenes side by side, one image, captioned
  const sheet = await ctx.newPage(); await sheet.setViewportSize({ width: SCENES.length * (W / 2 + 12) + 12, height: H / 2 + 60 });
  const html = '<body style="margin:0;background:#111;font:12px ui-monospace,monospace;color:#ddd;display:flex;gap:12px;padding:12px">' +
    logs.map(l => `<figure style="margin:0"><img src="data:image/png;base64,${readFileSync(l.out).toString('base64')}" width="${W / 2}" height="${H / 2}" style="display:block;border:1px solid #444"><figcaption style="padding:6px 0">${l.scene} · ${l.fps} fps · ${l.errors.length} err</figcaption></figure>`).join('') + '</body>';
  await sheet.setContent(html); await sheet.waitForTimeout(300);
  await sheet.screenshot({ path: resolve(dir, 'sheet.png') });
  writeFileSync(resolve(dir, 'log.json'), JSON.stringify(logs, null, 2));
  console.log(dir); for (const l of logs) console.log(l.scene.padEnd(11), l.fps + ' fps', l.errors.length + ' errors', 'draws ' + l.drawCount, l.errors.slice(0, 2).join(' | '));
  console.log('sim', logs[0].sim && logs[0].sim.ok ? 'PASS' : 'FAIL');
} else {
  const sc = flag('scene', 'pad');
  const out = flag('out') || resolve(ROOT, `docs/studies/${sc}.png`);
  const l = await shoot(sc, out);
  console.log(JSON.stringify(l, null, 2));
}
await browser.close();
