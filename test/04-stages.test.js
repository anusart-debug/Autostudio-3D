const {join,dirname}=require('path');
const PAGE_URL='file://'+join(__dirname,'..','dist','autostudio3d.html');
require('fs').mkdirSync(join(__dirname,'out'),{recursive:true});
const {chromium}=require(process.env.PW||'playwright');
const LAT=13.7466, LNG=100.5396;
// --- A: ป้าย + สาย (12 relation = 6 สาย 2 ทิศ) ---
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
// --- B: ฐานแผนที่ ---
function basePayload(){
  const el=[];let id=1;
  const road=(n,c,a,b,x,y)=>el.push({type:'way',id:id++,tags:{highway:c,name:n},
    geometry:[{lat:a,lon:b},{lat:(a+x)/2,lon:(b+y)/2},{lat:x,lon:y}]});
  road('ถนนราชดำริ','primary',LAT-0.005,LNG,LAT+0.005,LNG);
  road('ถนนพระรามที่ 1','primary',LAT,LNG-0.005,LAT,LNG+0.005);
  road('ถนนเพลินจิต','secondary',LAT+0.001,LNG-0.004,LAT+0.001,LNG+0.004);
  for(let i=0;i<90;i++){const a=LAT+(Math.random()-.5)*0.009,b=LNG+(Math.random()-.5)*0.009;
    road('ซอย '+i,['residential','tertiary'][i%2],a,b,a+0.0008,b+0.0008)}
  el.push({type:'node',id:900,lat:LAT+0.0015,lon:LNG-0.001,tags:{railway:'station',name:'สถานีชิดลม'}});
  el.push({type:'node',id:901,lat:LAT-0.002,lon:LNG-0.002,tags:{railway:'station',name:'สถานีสยาม'}});
  el.push({type:'node',id:902,lat:LAT+0.003,lon:LNG+0.003,tags:{place:'neighbourhood',name:'ราชประสงค์'}});
  return {elements:el};
}
// --- C: foreach — relation แล้วตามด้วย way ของสายนั้น ---
function linesPayload(){
  const el=[];let rid=9000;
  for(let i=0;i<6;i++){
    el.push({type:'relation',id:rid,tags:{ref:'r'+i}});
    el.push({type:'way',id:1}); el.push({type:'way',id:2});
    rid+=2;
  }
  return {elements:el};
}
function route(pg,map){
  return pg.route('**/api/interpreter',async r=>{
    const q=r.request().postData()||'';
    let body;
    if(/foreach/.test(q)) body=map.C;
    else if(/highway"="bus_stop"/.test(q)) body=map.A;
    else body=map.B;
    if(body===null){ r.fulfill({status:504,body:'x'}); return; }
    if(body==='empty'){ r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({elements:[]})}); return; }
    r.fulfill({status:200,contentType:'application/json',
      headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify(body)});
  });
}
(async()=>{
 const b=await chromium.launch();const out={};
 const scenarios={
   full:   {A:stopsPayload(),B:basePayload(),C:linesPayload()},
   emptyB: {A:stopsPayload(),B:'empty',     C:linesPayload()},
   failC:  {A:stopsPayload(),B:basePayload(),C:null},
   noStops:{A:{elements:[]},B:basePayload(),C:linesPayload()}
 };
 for(const [name,map] of Object.entries(scenarios)){
   const pg=await b.newPage({viewport:{width:1500,height:1050}});
   const errs=[];pg.on('pageerror',e=>errs.push(e.message));
   await route(pg,map);
   await pg.goto(PAGE_URL);
   await pg.waitForTimeout(700);
   await pg.evaluate(()=>document.getElementById('wzExit').click());
   await pg.waitForTimeout(250);
   await pg.evaluate(()=>document.querySelector('#locChips [data-id="centralworld"]').click());
   await pg.waitForTimeout(250);
   const t0=Date.now();
   await pg.click('#ovpBtn');
   // legend should appear fast (stage A)
   let legendAt=null;
   try{await pg.waitForFunction(()=>document.querySelectorAll('#routeLegend .lgd-i').length>0,{timeout:6000});
       legendAt=Date.now()-t0}catch(e){}
   await pg.waitForFunction(()=>/ดึงแผนที่/.test(document.getElementById('ovpBtn').textContent),{timeout:60000});
   out[name]={
     legendMs:legendAt,
     totalMs:Date.now()-t0,
     routes:await pg.$$eval('#routeLegend .lgd-i',n=>n.length),
     stops:await pg.$$eval('#stopBox .stop-i',n=>n.length),
     gmapsLinks:await pg.$$eval('#stopBox .stop-i a',n=>n.length),
     mapDrawn:await pg.$eval('#mapOff',n=>n.hidden),
     stat:(await pg.$eval('#ovpStat',n=>n.textContent)).replace(/\s+/g,' ').slice(0,190),
     note:(await pg.$eval('#mapNote',n=>n.textContent)).replace(/\s+/g,' ').slice(0,80),
     colours:await pg.$$eval('#routeLegend .lgd-i .dot',n=>[...new Set(n.map(x=>x.style.background))].length),
     painted:await pg.evaluate(()=>{const c=document.getElementById('mapCv');if(!c)return 0;
       const x=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
       const s=new Set();for(let i=0;i<x.length;i+=900)s.add(x[i]+','+x[i+1]+','+x[i+2]);return s.size}),
     errs
   };
   if(name==='full') await pg.locator('#mapBox').screenshot({path:'./test/out/v39map.png'});
   await pg.close();
 }
 console.log(JSON.stringify(out,null,1));
 await b.close();
})();
