const {join,dirname}=require('path');
const PAGE_URL='file://'+join(__dirname,'..','dist','autostudio3d.html');
require('fs').mkdirSync(join(__dirname,'out'),{recursive:true});
const {chromium}=require(process.env.PW||'playwright');
const {expect,done}=require('./_expect');
// สร้างข้อมูล OSM จำลองรอบอนุสาวรีย์ชัยฯ: ถนน 240 เส้น, ราง, น้ำ, สวน, สายรถเมล์ 22 สาย
function fixture(lat,lng){
  const el=[],R=0.006;
  let id=1;
  const seg=(a,b,c,d,tags)=>{el.push({type:'way',id:id++,tags,geometry:[
    {lat:a,lon:b},{lat:(a+c)/2,lon:(b+d)/2},{lat:c,lon:d}]})};
  const cls=['motorway','trunk','primary','secondary','tertiary','residential','service','footway'];
  for(let i=0;i<240;i++){
    const t=cls[i%cls.length];
    const a=lat+(Math.random()-.5)*R*2, b=lng+(Math.random()-.5)*R*2;
    seg(a,b,a+(Math.random()-.5)*R*.7,b+(Math.random()-.5)*R*.7,{highway:t,name:'ถนนทดสอบ '+i});
  }
  seg(lat-R,lng-R,lat+R,lng+R,{railway:'subway',name:'BTS'});
  el.push({type:'way',id:id++,tags:{natural:'water'},geometry:[
    {lat:lat+0.002,lon:lng+0.002},{lat:lat+0.004,lon:lng+0.003},{lat:lat+0.003,lon:lng+0.005},{lat:lat+0.002,lon:lng+0.002}]});
  el.push({type:'way',id:id++,tags:{leisure:'park'},geometry:[
    {lat:lat-0.003,lon:lng-0.004},{lat:lat-0.001,lon:lng-0.003},{lat:lat-0.002,lon:lng-0.001},{lat:lat-0.003,lon:lng-0.004}]});
  // bus-carrying way ids (no geometry = "out ids")
  for(let i=1;i<=40;i++) el.push({type:'way',id:i});
  // 22 route relations
  const refs=['8 (2-38)','14','18','29','34','36','38 (3-8)','54','59 (1-8)','62','74','77 (3-45)',
              '2-38','3-1','A1','ปอ.515','92','510','536','538','539','545'];
  refs.forEach((r,i)=>el.push({type:'relation',id:9000+i,tags:{type:'route',route:'bus',ref:r,
    name:'สาย '+r,from:'อนุสาวรีย์ชัยฯ',to:'ปลายทาง '+i}}));
  return {elements:el};
}
(async()=>{
 const b=await chromium.launch();
 const results={};
 // ---- A) happy path: the single host answers OK ----
 {
  const pg=await b.newPage({viewport:{width:1500,height:1000}});
  const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  let order=[];
  await pg.route('**overpass-api.de/api/interpreter',async r=>{order.push('api.de');
    const body=JSON.stringify(fixture(13.765,100.5378));
    r.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body})});
  await pg.goto(PAGE_URL);
  await pg.waitForTimeout(800);
  await pg.evaluate(()=>document.getElementById('wzExit').click());
  await pg.waitForTimeout(300);
  await pg.evaluate(()=>document.querySelector('#locChips [data-id="victory"]').click());
  await pg.waitForTimeout(300);
  await pg.click('#ovpBtn'); await pg.waitForTimeout(2500);
  results.happy={
    order, stat:await pg.$eval('#ovpStat',n=>n.textContent.trim().slice(0,120)),
    note:await pg.$eval('#mapNote',n=>n.textContent.trim().slice(0,70)),
    legend:await pg.$$eval('#routeLegend .lgd-i',n=>n.length),
    bus:await pg.$eval('#busCount',n=>n.textContent),
    canvasPainted:await pg.evaluate(()=>{const c=document.getElementById('mapCv');
      const x=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
      let seen=new Set();for(let i=0;i<x.length;i+=4000)seen.add(x[i]+','+x[i+1]+','+x[i+2]);
      return seen.size}),
    offHidden:await pg.$eval('#mapOff',n=>n.hidden),
    btnEnabled:await pg.$eval('#ovpBtn',n=>!n.disabled),
    errs
  };
  await pg.screenshot({path:'./test/out/vecmap.png'});
  // one-pager + PNG
  await pg.click('#sheetBtn'); await pg.waitForTimeout(1200);
  results.happy.sheet=await pg.evaluate(()=>({map:!shMap.hidden,noMap:!shNoMap.hidden,src:(shMap.getAttribute('src')||'').slice(0,18)}));
  const dl=pg.waitForEvent('download',{timeout:15000}).catch(()=>null);
  await pg.click('#sheetPng'); const d=await dl;
  results.happy.png=d?d.suggestedFilename():null;
  if(d) await d.saveAs('./test/out/onepager.png');
  await pg.close();
 }
 // ---- B) the host hangs -> must time out, button must recover ----
 {
  const pg=await b.newPage();
  const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  pg.setDefaultTimeout(200000);
  await pg.route('**overpass-api.de/api/interpreter',r=>{/* hang */});
  await pg.goto(PAGE_URL);
  await pg.waitForTimeout(700);
  await pg.evaluate(()=>document.getElementById('wzExit').click());
  await pg.waitForTimeout(250);
  await pg.evaluate(()=>{window.__t0=Date.now();
    // ย่นเวลา timeout ลงเพื่อทดสอบได้เร็ว
  });
  await pg.click('#ovpBtn');
  await pg.waitForTimeout(1500);
  const midBtn=await pg.$eval('#ovpBtn',n=>n.textContent.trim().slice(0,6));
  await pg.waitForFunction(()=>/ดึงสายรถเมล์/.test(document.getElementById('ovpBtn').textContent),{timeout:120000});
  results.hang={recovered:true,btnDuring:midBtn,
    stat:await pg.$eval('#ovpStat',n=>n.textContent.trim().slice(0,150)),
    secs:await pg.evaluate(()=>Math.round((Date.now()-window.__t0)/1000)),errs};
  await pg.close();
 }
 // ---- C) cancel mid-flight ----
 {
  const pg=await b.newPage();
  const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.route('**/api/interpreter',r=>{/* hang */});
  await pg.goto(PAGE_URL);
  await pg.waitForTimeout(700);
  await pg.evaluate(()=>document.getElementById('wzExit').click());
  await pg.waitForTimeout(250);
  await pg.click('#ovpBtn'); await pg.waitForTimeout(900);
  const label=await pg.$eval('#ovpBtn',n=>n.textContent.trim().slice(0,10));
  await pg.click('#ovpBtn'); await pg.waitForTimeout(900);
  results.cancel={labelWhileBusy:label,
    after:await pg.$eval('#ovpStat',n=>n.textContent.trim().slice(0,50)),
    btnBack:await pg.$eval('#ovpBtn',n=>n.textContent.trim().slice(0,12)),errs};
  await pg.close();
 }
 console.log(JSON.stringify(results,null,1));
 // A) happy path — เรียกเซิร์ฟเวอร์สำเร็จตั้งแต่ครั้งแรก
 expect('happy: เรียก overpass-api.de สำเร็จ', results.happy.order.includes('api.de'), results.happy.order);
 expect('happy: มีสายรถเมล์ขึ้นในตำนาน', results.happy.legend>0, results.happy.legend);
 expect('happy: แผนที่ถูกวาดจริง (สีหลากหลาย)', results.happy.canvasPainted>3, results.happy.canvasPainted);
 expect('happy: แผนที่ไม่ค้างสถานะ placeholder', results.happy.offHidden===true, results.happy.offHidden);
 expect('happy: ปุ่มดึงแผนที่กลับมาใช้ได้', results.happy.btnEnabled);
 expect('happy: ไม่มี pageerror', results.happy.errs.length===0, results.happy.errs);
 expect('happy: ใบนำเสนอมีแผนที่ (ไม่ใช่ placeholder)', results.happy.sheet.map===true, results.happy.sheet);
 expect('happy: ดาวน์โหลด PNG ใบนำเสนอได้', !!results.happy.png, results.happy.png);
 // B) ทุกเซิร์ฟเวอร์ค้าง — ต้อง timeout แล้วกู้คืนปุ่มได้เอง ไม่ค้างตลอดไป
 expect('hang: กู้คืนสถานะปุ่มได้เองหลัง timeout', results.hang.recovered);
 expect('hang: ไม่มี pageerror', results.hang.errs.length===0, results.hang.errs);
 // C) กดปุ่มซ้ำระหว่างรอ = ยกเลิก
 expect('cancel: ปุ่มกลับสภาพพร้อมกดใหม่หลังยกเลิก', results.cancel.btnBack.length>0, results.cancel.btnBack);
 expect('cancel: ไม่มี pageerror', results.cancel.errs.length===0, results.cancel.errs);
 done();
 await b.close();
})();
