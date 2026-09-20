const {join,dirname}=require('path');
const PAGE_URL='file://'+join(__dirname,'..','dist','autostudio3d.html');
require('fs').mkdirSync(join(__dirname,'out'),{recursive:true});
const {chromium}=require(process.env.PW||'playwright');
const {expect,done}=require('./_expect');
const LAT=13.7466, LNG=100.5396;
/* v41: ตัดช่วง B (ฐานแผนที่ถนน) กับ C (ระบายสีเส้นทาง) ออกจาก loadMap() ตามคำขอ
   "ยังไม่ต้องแสดงเส้นทางเดินรถในแผนที่" เหลือแค่ช่วง A (ป้าย+สายที่จอด) เทสต์นี้จึงเหลือแค่
   ทดสอบช่วง A กับยืนยันว่าแผนที่วาด "จุดโลเคชั่น" ได้เสมอไม่ว่าช่วง A จะสำเร็จ ว่าง หรือพังก็ตาม
   (drawPointOnly ใน 51-map-render.js ใช้แค่ MAPD.at ที่ตั้งจาก locPos() ทันทีตอนเปลี่ยนโลเคชั่น
   ไม่ต้องรอ Overpass เลย) — ดู test/06-resilience.test.js สำหรับเคสเซิร์ฟเวอร์ค้าง/ยกเลิก */
// --- ป้าย + สาย (12 relation = 6 สาย 2 ทิศ) ---
function stopsPayload(){
  const el=[];
  [['เซ็นทรัลเวิลด์ (จุดที่ 1)',LAT+0.0004,LNG+0.0003],
   ['เซ็นทรัลเวิลด์ (จุดที่ 2)',LAT-0.0006,LNG+0.0002],
   ['บิ๊กซี ราชดำริ',LAT+0.0011,LNG+0.0006]].forEach((x,i)=>
    el.push({type:'node',id:100+i,lat:x[1],lon:x[2],tags:{highway:'bus_stop',name:x[0]}}));
  const refs=['2 (3-1)','14 (3-39)','17 (4-3)','77 (3-45)','511 (3-22E)','A3'];
  let rid=9000;
  refs.forEach((r,i)=>{
    el.push({type:'relation',id:rid++,tags:{type:'route',route:'bus',ref:r,name:'สาย '+r,from:'ต้นทาง'+i,to:'ปลายทาง'+i}});
    el.push({type:'relation',id:rid++,tags:{type:'route',route:'bus',ref:r,name:'สาย '+r,from:'ปลายทาง'+i,to:'ต้นทาง'+i}});
  });
  return {elements:el};
}
function route(pg,body){
  return pg.route('**/api/interpreter',async r=>{
    if(body===null){ r.fulfill({status:504,body:'x'}); return; }
    r.fulfill({status:200,contentType:'application/json',
      headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify(body)});
  });
}
(async()=>{
 const b=await chromium.launch();const out={};
 const scenarios={
   withStops:stopsPayload(),
   noStops:{elements:[]},
   serverFail:null
 };
 for(const [name,body] of Object.entries(scenarios)){
   const pg=await b.newPage({viewport:{width:1500,height:1050}});
   const errs=[];pg.on('pageerror',e=>errs.push(e.message));
   await route(pg,body);
   await pg.goto(PAGE_URL);
   await pg.waitForTimeout(700);
   await pg.evaluate(()=>document.getElementById('wzExit').click());
   await pg.waitForTimeout(250);
   // เลือกโลเคชั่นแล้วต้องเห็นจุดบนแผนที่ทันที ก่อนกดปุ่มดึงข้อมูลด้วยซ้ำ
   await pg.evaluate(()=>document.querySelector('#locChips [data-id="centralworld"]').click());
   await pg.waitForTimeout(250);
   const mapDrawnBeforeFetch=await pg.$eval('#mapOff',n=>n.hidden);
   const t0=Date.now();
   await pg.click('#ovpBtn');
   let legendAt=null;
   try{await pg.waitForFunction(()=>document.querySelectorAll('#routeLegend .lgd-i').length>0,{timeout:6000});
       legendAt=Date.now()-t0}catch(e){}
   await pg.waitForFunction(()=>/ดึงสายรถเมล์/.test(document.getElementById('ovpBtn').textContent),{timeout:60000});
   out[name]={
     mapDrawnBeforeFetch,
     legendMs:legendAt,
     totalMs:Date.now()-t0,
     routes:await pg.$$eval('#routeLegend .lgd-i',n=>n.length),
     pairs:await pg.$$eval('#routeLegend .lgd-i em',n=>n.length),
     stops:await pg.$$eval('#stopBox .stop-i',n=>n.length),
     gmapsLinks:await pg.$$eval('#stopBox .stop-i a',n=>n.length),
     mapDrawnAfterFetch:await pg.$eval('#mapOff',n=>n.hidden),
     stat:(await pg.$eval('#ovpStat',n=>n.textContent)).replace(/\s+/g,' ').slice(0,190),
     note:(await pg.$eval('#mapNote',n=>n.textContent)).replace(/\s+/g,' ').slice(0,80),
     colours:await pg.$$eval('#routeLegend .lgd-i .dot',n=>[...new Set(n.map(x=>x.style.background))].length),
     painted:await pg.evaluate(()=>{const c=document.getElementById('mapCv');if(!c)return 0;
       const x=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
       const s=new Set();for(let i=0;i<x.length;i+=900)s.add(x[i]+','+x[i+1]+','+x[i+2]);return s.size}),
     errs
   };
   if(name==='withStops') await pg.locator('#mapBox').screenshot({path:'./test/out/v41map.png'});
   await pg.close();
 }
 console.log(JSON.stringify(out,null,1));
 // ทุกฉาก: ไม่มี pageerror เด็ดขาด
 for(const name of Object.keys(scenarios)){
   expect('['+name+'] ไม่มี pageerror', out[name].errs.length===0, out[name].errs);
 }
 // ทุกฉาก: จุดโลเคชั่นต้องขึ้นทันทีตอนเปลี่ยนโลเคชั่น ไม่ต้องรอกดปุ่ม/รอเน็ตเลย
 for(const name of Object.keys(scenarios)){
   expect('['+name+'] แผนที่วาดจุดโลเคชั่นได้ทันทีก่อนกดดึงข้อมูล', out[name].mapDrawnBeforeFetch===true, out[name].mapDrawnBeforeFetch);
   expect('['+name+'] แผนที่ยังวาดอยู่หลังกดดึงข้อมูล (ไม่กลับไปเป็น placeholder)', out[name].mapDrawnAfterFetch===true, out[name].mapDrawnAfterFetch);
 }
 // withStops: มีสายรถเมล์ในตำนาน พร้อมสีและต้นทาง-ปลายทาง
 expect('[withStops] มีสายรถเมล์ในตำนาน', out.withStops.routes>0, out.withStops.routes);
 expect('[withStops] แต่ละสายมีสีต่างกัน', out.withStops.colours>1, out.withStops.colours);
 expect('[withStops] มีข้อความต้นทาง-ปลายทางต่อสาย', out.withStops.pairs>0, out.withStops.pairs);
 // noStops: ไม่มีป้ายในรัศมี ต้องไม่มีสายให้แสดง (นับสายจากป้ายที่จอด ไม่ใช่ถนนที่ผ่าน)
 expect('[noStops] ไม่มีป้าย = ไม่มีสาย', out.noStops.routes===0, out.noStops.routes);
 // serverFail: centralworld มีสแนปช็อต ROUTE_SEED ติดมากับแอป — ดึงสดล้มเหลวแล้วต้องกู้คืน
 // มาแสดงแทนที่จะปล่อยว่างเปล่า (applySeedOrCache ใน 52-overpass.js) และต้องบอกตรงๆ ว่าไม่ใช่
 // ข้อมูลสด ไม่ใช่อ้างว่า "สดจาก OpenStreetMap" ทั้งที่จริงคือของเก่า
 expect('[serverFail] กู้คืนรายชื่อสายจากสแนปช็อตแทนปล่อยว่างเปล่า', out.serverFail.routes>0, out.serverFail.routes);
 expect('[serverFail] บอกตรงๆ ว่าเป็นข้อมูลตัวอย่าง ไม่ใช่ "สดจาก OpenStreetMap"',
   /ข้อมูลตัวอย่าง/.test(out.serverFail.note)&&!/สดจาก OPENSTREETMAP/.test(out.serverFail.note), out.serverFail.note);
 done();
 await b.close();
})();
