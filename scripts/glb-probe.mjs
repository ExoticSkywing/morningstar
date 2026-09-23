import {loadPlaywright,launchChromium} from '/root/.hermes/profiles/frontend/skills/frontend/web-clone/web-clone/scripts/lib/playwright-loader.mjs';
const p=loadPlaywright(); const b=await launchChromium(p.chromium); const pg=await b.newPage({viewport:{width:1440,height:900}});
pg.on('response',r=>{if(/\.glb(?:\?|$)/i.test(r.url())) console.log(r.status(),r.url(),r.headers()['content-type'])});
pg.on('requestfailed',r=>{if(/\.glb/i.test(r.url())) console.log('FAIL',r.url(),r.failure())});
await pg.goto(process.env.MORNINGSTAR_URL || 'http://127.0.0.1:44116/',{waitUntil:'commit',timeout:20000});
await pg.waitForTimeout(6000);
console.log(await pg.evaluate(()=>({ready:document.readyState,canvas:document.querySelectorAll('canvas').length})));
await b.close();
