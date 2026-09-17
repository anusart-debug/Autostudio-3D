const {join,dirname}=require('path');
const PAGE_URL='file://'+join(__dirname,'..','dist','autostudio3d.html');
require('fs').mkdirSync(join(__dirname,'out'),{recursive:true});
const {chromium}=require(process.env.PW||'playwright');
const LAT=13.7995,LNG=100.5500;
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
function basePayload(){
  const el=[];let id=1;
  const road=(n,c,a,b,x,y)=>el.push({type:'way',id:id++,tags:{highway:c,name:n},
    geometry:[{lat:a,lon:b},{lat:(a+x)/2,lon:(b+y)/2},{lat:x,lon:y}]});
  road('ถนนพหลโยธิน','primary',LAT-0.008,LNG,LAT+0.008,LNG);
  road('ถนนกำแพงเพชร 2','primary',LAT,LNG-0.008,LAT,LNG+0.008);
  for(let i=0;i<160;i++){const a=LAT+(Math.random()-.5)*0.014,b=LNG+(Math.random()-.5)*0.014;
    road('ซอย '+i,['residential','tertiary','secondary'][i%3],a,b,a+0.001,b+0.001)}
  el.push({type:'node',id:900,lat:LAT+0.002,lon:LNG-0.002,tags:{railway:'station',name:'สถานีหมอชิต'}});
  el.push({type:'node',id:901,lat:LAT-0.003,lon:LNG+0.002,tags:{place:'neighbourhood',name:'จตุจักร'}});
  return {elements:el};
}
function linesPayload(){
  const el=[];let rid=9000;
  for(let i=0;i<32;i++){ el.push({type:'relation',id:rid,tags:{ref:'x'}});
    el.push({type:'way',id:1});el.push({type:'way',id:2});el.push({type:'way',id:3+i}); rid+=2; }
  return {elements:el};
}
(async()=>{
 const b=await chromium.launch();
 const pg=await b.newPage({viewport:{width:1500,height:1050}});
 const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 let qLines='';
 await pg.route('**/api/interpreter',async r=>{
   const q=r.request().postData()||'';
   let body;
   if(/foreach/.test(q)){qLines=q;body=linesPayload()}
   else if(/highway"="bus_stop"/.test(q)) body=stopsPayload();
   else body=basePayload();
   r.fulfill({status:200,contentType:'application/json',
     headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify(body)});
 });
 await pg.goto(PAGE_URL);
 await pg.waitForTimeout(800);
 await pg.evaluate(()=>document.getElementById('wzExit').click());
 await pg.waitForTimeout(300);
 await pg.evaluate(()=>document.querySelector('#locChips [data-id="chatuchak"]').click());
 await pg.waitForTimeout(300);
 await pg.click('#ovpBtn');
 await pg.waitForFunction(()=>/ดึงแผนที่/.test(document.getElementById('ovpBtn').textContent),{timeout:60000});
 const R={};
 R.qLinesFiltered = /highway"~\^\(motorway/.test(qLines.replace(/\\/g,'')) || /motorway\|trunk\|primary/.test(qLines);
 R.qLinesNoFootway = !/\["highway"\]->\.w/.test(qLines);
 R.qLinesRadius = (qLines.match(/around:(\d+)/)||[])[1];
 R.routes = await pg.$$eval('#routeLegend .lgd-i',n=>n.length);
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
 await pg.screenshot({path:'./test/out/v40full.png'});
 const dl=pg.waitForEvent('download',{timeout:15000}).catch(()=>null);
 await pg.click('#fullPng'); const d=await dl;
 R.mapPng=d?d.suggestedFilename():null;
 await pg.keyboard.press('Escape'); await pg.waitForTimeout(400);
 R.fullClosed = await pg.$eval('#mapFull',n=>n.hidden);
 R.legendBack = await pg.$$eval('#routeLegend .lgd-i',n=>n.length);
 R.errs=errs;
 console.log(JSON.stringify(R,null,1));
 await b.close();
})();
