/* ---------------- เส้นทางเต็มสาย (v41) ----------------
   ตรวจว่า: member role stop/platform ไม่เข้าไปในเส้นทาง, bbox ของเส้นทางใหญ่กว่ารัศมีแผนที่ฐาน
   มาก, โหมด route ปลดล็อกเพดานซูมออก, คลิกครั้งที่สองไม่ยิงเน็ตซ้ำ (มาจาก cache), และใบนำเสนอ
   มีจุดสีเฉพาะสายที่ "วาดจริง" เท่านั้น (สาย C ในเทสต์นี้ตั้งใจให้พังเพื่อพิสูจน์ข้อนี้) */
const {join,dirname}=require('path');
const PAGE_URL='file://'+join(__dirname,'..','dist','autostudio3d.html');
require('fs').mkdirSync(join(__dirname,'out'),{recursive:true});
const {chromium}=require(process.env.PW||'playwright');
const {expect,done}=require('./_expect');
const LAT=13.722, LNG=100.529;   // สาทร

function stopsPayload(){
  const el=[{type:'node',id:100,lat:LAT,lon:LNG,tags:{highway:'bus_stop',name:'ป้ายทดสอบ'}}];
  ['A1','B2','C3'].forEach((ref,i)=>{
    el.push({type:'relation',id:9000+i,tags:{type:'route',route:'bus',ref,name:'สาย '+ref,from:'ต้นทาง',to:'ปลายทาง'}});
  });
  return {elements:el};
}
function basePayload(){
  const el=[{type:'way',id:1,tags:{highway:'primary',name:'ถนนทดสอบ'},
    geometry:[{lat:LAT-0.003,lon:LNG},{lat:LAT,lon:LNG},{lat:LAT+0.003,lon:LNG}]}];
  return {elements:el};
}
/* stage C ตั้งใจให้ "พัง" (ไม่มี way hit เลย) — พิสูจน์ว่า painted() ในใบนำเสนอไม่โกหกแม้ตัวสาย
   ที่ถูกเลือกจะมี geometry เต็มสายจาก stage แยกแล้วก็ตาม (คนละกลไกกัน) */
function linesPayloadEmpty(){
  return {elements:[{type:'relation',id:9000,tags:{ref:'A1'}}]}; // relation แต่ไม่มี way ตามมา
}
/* rel(id:...);out geom; — relation เดียว มี way member ยาวไกลเกินรัศมีแผนที่ฐานมาก
   บวก node member role=stop (ต้องไม่ถูกวาดเป็นเส้น) */
function geomPayload(){
  return {elements:[{
    type:'relation',id:9000,tags:{ref:'A1',from:'ต้นทางไกล',to:'ปลายทางไกล'},
    members:[
      {type:'way',ref:1,role:'',geometry:[{lat:LAT-0.05,lon:LNG-0.05},{lat:LAT,lon:LNG},{lat:LAT+0.05,lon:LNG+0.05}]},
      {type:'node',ref:200,role:'stop',lat:LAT,lon:LNG}
    ]
  }]};
}
(async()=>{
  const b=await chromium.launch();
  const pg=await b.newPage({viewport:{width:1400,height:1000}});
  const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
  let geomHits=0;
  await pg.route('**/api/interpreter',async r=>{
    const q=r.request().postData()||'';
    let body;
    if(/as3d:geom/.test(q)){ geomHits++; body=geomPayload(); }
    else if(/as3d:lines/.test(q)) body=linesPayloadEmpty();
    else if(/as3d:stops/.test(q)) body=stopsPayload();
    else body=basePayload();
    r.fulfill({status:200,contentType:'application/json',
      headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify(body)});
  });
  await pg.goto(PAGE_URL);
  await pg.waitForTimeout(600);
  await pg.evaluate(()=>document.getElementById('wzExit').click());
  await pg.waitForTimeout(250);
  await pg.evaluate(()=>document.querySelector('#locChips [data-id="sathorn"]').click());
  await pg.waitForTimeout(250);
  await pg.click('#ovpBtn');
  await pg.waitForFunction(()=>/ดึงแผนที่/.test(document.getElementById('ovpBtn').textContent),{timeout:30000});

  const radiusBefore=await pg.evaluate(()=>__as3d.map().radius);
  const clampBefore=await pg.evaluate(()=>{const v=__as3d.map().view;return v?v.r:null});
  expect('โหลดแผนที่สำเร็จ มีสายรถเมล์', (await pg.$$eval('#routeLegend .lgd-i',n=>n.length))===3);

  // เลือกสาย A1 (isolate อย่างเดียว ยังไม่ดึง geometry)
  await pg.click('#routeLegend .lgd-i[data-g="0"]');
  await pg.waitForTimeout(150);
  const fullBtnText=await pg.$eval('#routeLegend [data-fullroute]',n=>n.textContent.trim());
  expect('ปุ่มดูทั้งสายบอกว่าต้องดึงข้อมูล', /ดึงข้อมูล/.test(fullBtnText), fullBtnText);

  // กด "ดูทั้งสาย" — ยิง Overpass จริงครั้งแรก
  await pg.click('#routeLegend [data-fullroute]');
  await pg.waitForFunction(()=>__as3d.mode()==='route',{timeout:15000});
  const clampAfter=await pg.evaluate(()=>__as3d.map().view.r);
  const geomEntries=await pg.evaluate(()=>Array.from(__as3d.geom().entries()));

  expect('ยิง Overpass ดึง geometry ครั้งแรกจริง', geomHits===1, geomHits);
  expect('โหมดเปลี่ยนเป็น route', await pg.evaluate(()=>__as3d.mode())==='route');
  expect('เพดานซูมออกถูกปลดล็อกเกินรัศมีแผนที่ฐาน*1.25', clampAfter>radiusBefore*1.25+1,
    {clampBefore,clampAfter,radiusBefore});
  expect('cache ในหน่วยความจำมี 1 สาย', geomEntries.length===1, geomEntries.length);
  const stopsInGeo=geomEntries[0] ? geomEntries[0][1].stops.length : -1;
  expect('member role=stop ไม่ถูกวาดเป็นเส้น แต่ถูกเก็บเป็นป้าย 1 จุด', stopsInGeo===1, stopsInGeo);
  const waysInGeo=geomEntries[0] ? geomEntries[0][1].ways.length : -1;
  expect('มี way ของเส้นทาง 1 เส้น', waysInGeo===1, waysInGeo);

  // กลับมุมมองใกล้ แล้วดูทั้งสายอีกครั้ง — ต้องมาจาก cache ไม่ยิงเน็ตซ้ำ
  await pg.click('#routeLegend [data-exitroute]');
  await pg.waitForTimeout(150);
  expect('กลับเป็นโหมด local แล้ว', await pg.evaluate(()=>__as3d.mode())==='local');
  await pg.click('#routeLegend [data-fullroute]');
  await pg.waitForFunction(()=>__as3d.mode()==='route',{timeout:15000});
  expect('คลิกซ้ำไม่ยิง Overpass ใหม่ (มาจาก cache)', geomHits===1, geomHits);

  // ใบนำเสนอ: สาย A1 (ดึง geometry เต็มสายแล้ว) ต้องมีจุดสี ส่วน B2/C3 (stage C พัง) ต้องไม่มี
  await pg.click('#routeLegend [data-exitroute]');
  await pg.click('#sheetBtn');
  await pg.waitForTimeout(600);
  const shLines=await pg.$$eval('#shLines .shline',n=>n.map(x=>({txt:x.textContent.trim(),dot:!!x.querySelector('i')})));
  const a1=shLines.find(x=>x.txt==='A1'), b2=shLines.find(x=>x.txt==='B2');
  expect('ใบนำเสนอ: A1 มีจุดสี (วาดจริงผ่าน geometry เต็มสาย)', !!(a1&&a1.dot), a1);
  expect('ใบนำเสนอ: B2 ไม่มีจุดสี (stage C พัง ไม่เคยถูกวาดจริง)', !!(b2&&!b2.dot), b2);

  expect('ไม่มี pageerror', errs.length===0, errs);
  done();
  await b.close();
})();
