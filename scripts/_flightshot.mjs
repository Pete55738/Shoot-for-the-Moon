import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const DIR = process.argv[2], W=+(process.argv[3]||960), H=+(process.argv[4]||600);
const b = await chromium.launch(); const ctx = await b.newContext({ viewport:{width:W,height:H}, deviceScaleFactor:2, colorScheme:'dark' });
const p = await ctx.newPage(); const errs=[]; p.on('console',m=>m.type()==='error'&&errs.push(m.text())); p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));
await p.addInitScript(()=>{ localStorage.setItem('dash-token-shoot-for-the-moon','x'); localStorage.setItem('sftm-tour','done');
  const t={engine:10,tank:10,aero:10,hull:10,payload:10};
  const eq={stage2:1,guidance:1,kick:1,comms:1,capture:1,startracker:1,legs:1,radar:1,cargobay:1,lifesupport:1};
  localStorage.setItem('sftm-save', JSON.stringify({envelope:1,kind:'save',at:new Date().toISOString(),
    payload:{tiers:t,equipment:eq,money:900000,launches:120,earned:900000,bestKm:384400,bestV:11000,
             milestones:[1,10,100],mission:5,modules:5,population:9000,log:[],seed:7}})); });
await p.goto('file:///home/user/Click-Me/app/shoot-for-the-moon.html');
await p.waitForFunction(()=>window.DEV && document.getElementById('scene').width>0);
await p.evaluate(()=>{ document.querySelector('.tab[data-p="dev"]').click(); });
await p.click('[data-dev="mission:5"]');
await p.evaluate(()=>{ document.querySelector('.tab[data-p="pad"]').click(); });
await p.waitForTimeout(300);
await p.click('#launch');
const seen = new Set();
for (let i=0;i<170;i++){
  await p.waitForTimeout(150);
  const sc = await p.evaluate(()=>window.DEV.view.scene);
  if (sc && !seen.has(sc)) { seen.add(sc); await p.waitForTimeout(500); await p.screenshot({path:`${DIR}/j-${sc}.png`});
    if (sc==='cargo') { await p.waitForTimeout(2600); const dc = await p.evaluate(()=>window.DEV.drawCount());
      const fps = await p.evaluate(()=>new Promise(r=>{let n=0;const t0=performance.now();const f=()=>{n++;performance.now()-t0<2000?requestAnimationFrame(f):r(Math.round(n/2))};requestAnimationFrame(f)}));
      console.log('cargo fps', fps);
      await p.screenshot({path:`${DIR}/j-cargo-mid.png`}); console.log('cargo draws', dc); } }
}
console.log('scenes', [...seen].join(' '), '| errors', JSON.stringify(errs.slice(0,4)));
await b.close();
