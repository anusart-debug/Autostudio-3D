const {join,dirname}=require('path');
const PAGE_URL='file://'+join(__dirname,'..','dist','autostudio3d.html');
require('fs').mkdirSync(join(__dirname,'out'),{recursive:true});
const {chromium}=require(process.env.PW||'playwright');
const {expect,done}=require('./_expect');
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
 const negOffHasBlurry=/Avoid entirely:[^.]*blurry/.test(off);
 const negOnDropsBlurry=/Avoid entirely:/.test(on)&&!/Avoid entirely:[^.]*blurry/.test(on);
 console.log(JSON.stringify({
  negOffHasBlurry, negOnDropsBlurry,
  onTail:on.slice(-260),
  thTail:th.slice(-200),
  errs},null,1));
 expect('ค่าเริ่มต้น negative prompt มีคำว่า blurry', negOffHasBlurry);
 expect('เลือกสไตล์ light-trails แล้วตัดคำว่า blurry ออก', negOnDropsBlurry);
 expect('แท็บภาษาไทยมีข้อความ', th.length>0, th.length);
 expect('ไม่มี pageerror', errs.length===0, errs);
 done();
 await b.close();
})();
