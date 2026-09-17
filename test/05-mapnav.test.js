const {join,dirname}=require('path');
const PAGE_URL='file://'+join(__dirname,'..','dist','autostudio3d.html');
require('fs').mkdirSync(join(__dirname,'out'),{recursive:true});
const {chromium}=require(process.env.PW||'playwright');
const {expect,done}=require('./_expect');
const LAT=13.7995,LNG=100.5500;
/* v41: loadMap() ไม่ดึงฐานแผนที่ถนน/เส้นทางเดินรถแยกอีกต่อไป (ดู 52-overpass.js) เทสต์นี้จึง
   เหลือแค่ยืนยันว่าซูม/เลื่อน/เต็มจอ/บันทึกภาพ ยังทำงานได้ปกติกับแผนที่ "จุดโลเคชั่นเท่านั้น" */
function stopsPayload(){
  const el=[];
  for(let i=0;i<4;i++) el.push({type:'node',id:100+i,lat:LAT+0.0008*i,lon:LNG+0.0005*i,
    tags:{highway:'bus_stop',name:i?'':'ป้ายจตุจักร'}});
  let rid=9000;
  for(let i=0;i<32;i++){
    const ref=(i%2?'':'')+(100+i)+' ('+(1+i%4)+'-'+(10+i)+')';
    el.push({type:'relation',id:rid++,tags:{type:'route',route:'bus',ref,name:'สาย '+ref,from:'ต้น'+i,to:'ปลาย'+i}});
    el.push({type:'relation',id:rid++,tags:{type:'route',route:'bus',ref,name:'สาย '+ref,from:'ปลาย'+i,to:'ต้น'+i}});
  }
  return {elements:el};
}
(async()=>{
 const b=await chromium.launch();
 const pg=await b.newPage({viewport:{width:1500,height:1050}});
 const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.route('**/api/interpreter',async r=>{
   r.fulfill({status:200,contentType:'application/json',
     headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify(stopsPayload())});
 });
 await pg.goto(PAGE_URL);
 await pg.waitForTimeout(800);
 await pg.evaluate(()=>document.getElementById('wzExit').click());
 await pg.waitForTimeout(300);
 await pg.evaluate(()=>document.querySelector('#locChips [data-id="chatuchak"]').click());
 await pg.waitForTimeout(300);
 await pg.click('#ovpBtn');
 await pg.waitForFunction(()=>/ดึงสายรถเมล์/.test(document.getElementById('ovpBtn').textContent),{timeout:60000});
 const R={};
 R.routes = await pg.$$eval('#routeLegend .lgd-i',n=>n.length);
 R.pairs = await pg.$$eval('#routeLegend .lgd-i em',n=>n.length);
 R.toolsVisible = await pg.$eval('#mapTools',n=>!n.hidden);
 // zoom in
 const r0 = await pg.evaluate(()=>__as3d.map().view.r);
 await pg.click('#mapTools [data-z="in"]'); await pg.waitForTimeout(200);
 const r1 = await pg.evaluate(()=>__as3d.map().view.r);
 await pg.click('#mapTools [data-z="out"]'); await pg.click('#mapTools [data-z="out"]');
 await pg.waitForTimeout(200);
 const r2 = await pg.evaluate(()=>__as3d.map().view.r);
 R.zoom={start:Math.round(r0),afterIn:Math.round(r1),afterOut:Math.round(r2),
         inWorks:r1<r0, outWorks:r2>r1};
 // pan by drag
 const c0=await pg.evaluate(()=>__as3d.map().view.c.slice());
 const box=await pg.locator('#mapBox').boundingBox();
 await pg.mouse.move(box.x+box.width/2,box.y+box.height/2);
 await pg.mouse.down(); await pg.mouse.move(box.x+box.width/2+90,box.y+box.height/2+60,{steps:6});
 await pg.mouse.up(); await pg.waitForTimeout(250);
 const c1=await pg.evaluate(()=>__as3d.map().view.c.slice());
 R.panWorks = (c0[0]!==c1[0])||(c0[1]!==c1[1]);
 // reset
 await pg.click('#mapTools [data-z="fit"]'); await pg.waitForTimeout(200);
 R.fitWorks = await pg.evaluate(()=>__as3d.map().view.r===__as3d.map().radius&&__as3d.map().view.c[0]===__as3d.map().at[0]);
 // fullscreen
 await pg.click('#mapTools [data-z="full"]'); await pg.waitForTimeout(500);
 R.fullOpen = await pg.$eval('#mapFull',n=>!n.hidden);
 R.legendMovedIntoFull = await pg.$eval('#fullLegend',n=>!!n.querySelector('.lgd-i'));
 R.fullPainted = await pg.evaluate(()=>{const c=document.getElementById('fullCv');
   const x=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
   const s=new Set();for(let i=0;i<x.length;i+=1500)s.add(x[i]+','+x[i+1]+','+x[i+2]);return s.size});
 await pg.screenshot({path:'./test/out/v41full.png'});
 const dl=pg.waitForEvent('download',{timeout:15000}).catch(()=>null);
 await pg.click('#fullPng'); const d=await dl;
 R.mapPng=d?d.suggestedFilename():null;
 await pg.keyboard.press('Escape'); await pg.waitForTimeout(400);
 R.fullClosed = await pg.$eval('#mapFull',n=>n.hidden);
 R.legendBack = await pg.$$eval('#routeLegend .lgd-i',n=>n.length);
 R.errs=errs;
 console.log(JSON.stringify(R,null,1));
 expect('มีสายรถเมล์ในตำนาน (เคส >30 สาย)', R.routes>0, R.routes);
 expect('มีข้อความต้นทาง-ปลายทางต่อสาย', R.pairs>0, R.pairs);
 expect('แถบเครื่องมือแผนที่มองเห็นได้', R.toolsVisible);
 expect('ซูมเข้าลดรัศมีมุมมอง', R.zoom.inWorks, R.zoom);
 expect('ซูมออกเพิ่มรัศมีมุมมอง', R.zoom.outWorks, R.zoom);
 expect('ลากแผนที่ (pan) ได้', R.panWorks);
 expect('ปุ่ม fit คืนมุมมองเดิม', R.fitWorks);
 expect('เต็มจอเปิดได้', R.fullOpen);
 expect('legend ย้ายเข้าโหมดเต็มจอ', R.legendMovedIntoFull);
 expect('แผนที่เต็มจอถูกวาด (ไม่ว่างเปล่า)', R.fullPainted>1, R.fullPainted);
 expect('ดาวน์โหลด PNG แผนที่ได้', !!R.mapPng, R.mapPng);
 expect('ปิดเต็มจอด้วย Escape ได้', R.fullClosed);
 expect('legend กลับมาที่แผงเดิมหลังปิดเต็มจอ', R.legendBack>0, R.legendBack);
 expect('ไม่มี pageerror', R.errs.length===0, R.errs);
 done();
 await b.close();
})();
