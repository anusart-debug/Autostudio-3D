const {join,dirname}=require('path');
const PAGE_URL='file://'+join(__dirname,'..','dist','autostudio3d.html');
require('fs').mkdirSync(join(__dirname,'out'),{recursive:true});
const {chromium}=require(process.env.PW||'playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1600,height:1000}});
 const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto(PAGE_URL);
 await pg.waitForTimeout(500);
 await pg.evaluate(()=>document.getElementById('wzExit').click());
 await pg.waitForTimeout(250);
 const get=async()=>pg.$eval('#promptOut',n=>n.textContent);
 const off=await get();
 await pg.evaluate(()=>document.querySelector('#styleChips [data-id="trails"]').click());
 await pg.waitForTimeout(250);
 const on=await get();
 await pg.click('.ptab[data-lang="th"]'); await pg.waitForTimeout(250);
 const th=await get();
 console.log(JSON.stringify({
  negOffHasBlurry:/Avoid entirely:[^.]*blurry/.test(off),
  negOnDropsBlurry:/Avoid entirely:/.test(on)&&!/Avoid entirely:[^.]*blurry/.test(on),
  onTail:on.slice(-260),
  thTail:th.slice(-200),
  errs},null,1));
 await b.close();
})();
