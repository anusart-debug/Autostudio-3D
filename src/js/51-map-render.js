/* ================= แผนที่เวกเตอร์ที่วาดเอง 100% =========================
   บทเรียนจาก v35/v36: เซิร์ฟเวอร์ tile ทุกเจ้าปฏิเสธหน้าเว็บที่เปิดจากไฟล์
   (OSM บังคับ Referer · CARTO บังคับ API key · Wikimedia ห้ามใช้ · Esri ห้ามเชิงพาณิชย์)
   จึงเลิกพึ่ง tile ทั้งหมด แล้ววาดแผนที่เองจากข้อมูลดิบของ OpenStreetMap ผ่าน Overpass API
   ผลที่ได้: ใช้ได้ทั้งเปิดไฟล์ตรงๆ และผ่านเซิร์ฟเวอร์ · วาดเส้นทางเดินรถทับได้ ·
   บันทึก PNG ได้เสมอเพราะทุกพิกเซลเราวาดเอง ไม่มีภาพจากโดเมนอื่นมาทำ canvas เสีย */

const MAPD={data:null,nodes:[],at:null,radius:600,near:250,busy:false,
            groups:[],wayRoutes:null,solo:null,err:"",
            /* v41: โหมดดูทั้งสาย — ดู 57-route-view.js */
            mode:"local",localView:null,routeFitR:0,geomBusy:""};

/* ---- โปรเจกชัน: ระยะสั้นระดับเมือง ใช้ละติจูด/ลองจิจูดตรงๆ พร้อมแก้ cos(lat) ก็แม่นพอ ---- */
const MPD=111320;                                   /* เมตรต่อ 1 องศาละติจูด */
/* มุมมองปัจจุบัน แยกจากรัศมีที่ดึงข้อมูลมา ทำให้ซูม/เลื่อนได้โดยไม่ต้องยิงเน็ตใหม่ */
function viewC(){ return (MAPD.view&&MAPD.view.c)||MAPD.at||BKK }
function viewR(){ return (MAPD.view&&MAPD.view.r)||MAPD.radius }
function resetView(){ MAPD.view={c:(MAPD.at||BKK).slice(),r:MAPD.radius} }
function zoomBy(f){
  if(!MAPD.at) return;
  if(!MAPD.view) resetView();
  /* ซูมออกได้ไม่เกินข้อมูลที่มี (routeViewMax() จาก 57-route-view.js — ในโหมด route
     ยกเพดานให้ซูมออกได้ถึงขนาดของสายทั้งสาย ไม่ใช่แค่รัศมีที่ดึงมา) ซูมเข้าได้ถึง 40 ม. */
  MAPD.view.r=Math.max(40,Math.min(routeViewMax(),MAPD.view.r*f));
  paintAll();
}
function makeProj(c,W,H,radius){
  const kY=(H/2)/(radius/MPD);                      /* พิกเซลต่อองศาละติจูด */
  const kX=kY*Math.cos(c[0]*Math.PI/180);
  return function(lat,lng){ return [W/2+(lng-c[1])*kX, H/2-(lat-c[0])*kY]; };
}

const THEME_DARK={
  bg:"#0C1016", water:"#0F2031", park:"#111F16", rail:"#4A5462",
  road:"#212A35", roadBig:"#33404E", pin:"#FF6B2C", ringLine:"#FF6B2C",
  ring:"rgba(255,107,44,.07)", text:"#7D8797", label:"#C3CBD6",
  labelBg:"rgba(12,16,22,.80)", pinEdge:"#ffffff", roadName:"#69737F"
};
const THEME_LIGHT={
  bg:"#F2F5F8", water:"#CFE0F0", park:"#DCEAD7", rail:"#9AA4B2",
  road:"#FFFFFF", roadBig:"#FFF0D8", pin:"#FF6B2C", ringLine:"#FF6B2C",
  ring:"rgba(255,107,44,.05)", text:"#6B7684", label:"#2A3340",
  labelBg:"rgba(255,255,255,.86)", pinEdge:"#ffffff", roadName:"#8C96A3"
};
/* v41: แผนที่บนจอตามธีมสว่าง/มืดของแอป (themeIsLight() มาจาก 01-theme.js) —
   ใบนำเสนอฝ่ายขาย (55-sheet.js) และ PNG เต็มจอ (53-map-ui.js) ยังคงบังคับ THEME_LIGHT เสมอ
   เพราะเป็นของที่ส่งให้ลูกค้าเห็น ไม่ควรขึ้นกับธีมที่คนในบริษัทตั้งไว้ตอนนั้น */
function mapTheme(){return (typeof themeIsLight==="function"&&themeIsLight())?THEME_LIGHT:THEME_DARK}

const ROADW={
  motorway:5.4, trunk:4.6, primary:3.9, secondary:3.1, tertiary:2.4,
  motorway_link:2.2, trunk_link:2, primary_link:1.9, secondary_link:1.7, tertiary_link:1.5,
  residential:1.5, unclassified:1.5, living_street:1.2, service:0.85, pedestrian:1
};
const BIGROAD={motorway:1,trunk:1,primary:1,secondary:1};
const NAMEROAD={motorway:1,trunk:1,primary:1,secondary:1,tertiary:1};

/* ---- สีประจำสาย: มุมทองคำ ทำให้สีต่างกันชัดแม้มีหลายสิบสาย ---- */
function routeColour(i,dark){
  const h=(i*137.508)%360;
  const band=i%3;
  const sat=dark?(72+band*7):(66+band*6);
  const lig=dark?(58+(i%2?6:0)):(42+(i%2?5:0));
  return "hsl("+h.toFixed(0)+","+sat+"%,"+lig+"%)";
}

function drawMap(cx,W,H,T,K){
  K=K||1;
  const dark=(T===THEME_DARK);
  cx.save();
  cx.fillStyle=T.bg; cx.fillRect(0,0,W,H);
  const d=MAPD.data, c=MAPD.at;
  if(!d||!d.length||!c){ cx.restore(); return false; }   /* [] เป็น truthy เคยทำให้วาดแผนที่เปล่าแล้วบอกว่าสำเร็จ */
  const P=makeProj(viewC(),W,H,viewR());

  const pts=g=>g.map(q=>P(q.lat,q.lon));
  const stroke=(pp,w,col,dash)=>{
    if(!pp||pp.length<2) return;
    cx.beginPath();
    pp.forEach((q,i)=>i?cx.lineTo(q[0],q[1]):cx.moveTo(q[0],q[1]));
    cx.lineWidth=w*K; cx.strokeStyle=col;
    cx.setLineDash(dash?[6*K,5*K]:[]);
    cx.lineCap="round"; cx.lineJoin="round";
    cx.stroke(); cx.setLineDash([]);
  };
  const fill=(pp,col)=>{
    if(!pp||pp.length<3) return;
    cx.beginPath();
    pp.forEach((q,i)=>i?cx.lineTo(q[0],q[1]):cx.moveTo(q[0],q[1]));
    cx.closePath(); cx.fillStyle=col; cx.fill();
  };
  /* ขยับเส้นออกด้านข้างแบบขนาน ใช้ตอนหลายสายใช้ถนนเส้นเดียวกัน */
  const offsetPts=(pp,off)=>{
    if(!off) return pp;
    return pp.map((q,i)=>{
      const a=pp[Math.max(0,i-1)], b=pp[Math.min(pp.length-1,i+1)];
      let dx=b[0]-a[0], dy=b[1]-a[1];
      const L=Math.hypot(dx,dy)||1;
      return [q[0]-dy/L*off, q[1]+dx/L*off];
    });
  };

  /* 1) พื้นที่ */
  d.forEach(e=>{
    if(!e.geometry) return;
    const t=e.tags||{};
    if(t.natural==="water"||t.waterway==="riverbank"||t.landuse==="reservoir") fill(pts(e.geometry),T.water);
    else if(t.leisure==="park"||t.leisure==="garden") fill(pts(e.geometry),T.park);
  });
  /* 2) ถนน เล็กก่อนใหญ่ทีหลัง */
  const roads=d.filter(e=>e.geometry&&e.tags&&e.tags.highway);
  roads.sort((a,b)=>(ROADW[a.tags.highway]||1)-(ROADW[b.tags.highway]||1));
  roads.forEach(e=>{
    const hw=e.tags.highway;
    stroke(pts(e.geometry),ROADW[hw]||1.2,BIGROAD[hw]?T.roadBig:T.road);
  });
  /* 3) ราง */
  d.forEach(e=>{
    if(!e.geometry||!e.tags) return;
    if(/^(subway|light_rail|monorail|rail)$/.test(e.tags.railway||"")) stroke(pts(e.geometry),1.4,T.rail,true);
  });

  /* 4) เส้นทางเดินรถ — สีแยกตามสาย วางขนานกันเมื่อใช้ถนนเส้นเดียวกัน
     v41: สายที่เลือก (solo) ถ้ามี geometry เต็มสายแล้ว (ดึงมาตอนกด "ดูทั้งสาย") วาดจากตรงนั้น
     แทน — เห็นทั้งสาย ไม่จำกัดแค่ช่วงที่อยู่ในแผนที่ฐาน ยังไม่ดึงก็ถอยไปย้อมสีถนนฐานแบบเดิม
     (ใช้ได้เฉพาะช่วงที่บังเอิญอยู่ในแผนที่ฐาน — นี่คือพฤติกรรมเดิมก่อน v41) */
  const G=MAPD.groups, WR=MAPD.wayRoutes;
  if(MAPD.solo!=null&&G[MAPD.solo]){
    const g=G[MAPD.solo];
    const geo=(typeof GEO!=="undefined")?GEO.get(geoKeyOf(g.ids)):null;
    if(geo&&typeof drawRouteLayer==="function"){
      drawRouteLayer(cx,W,H,T,K,g,geo);
    }else if(G.length&&WR){
      roads.forEach(e=>{
        const idx=WR.get(e.id);
        if(idx&&idx.indexOf(MAPD.solo)>=0)
          stroke(pts(e.geometry),(ROADW[e.tags.highway]||1.2)+2.6,dark?g.col:g.colL);
      });
    }
  }else if(G.length&&WR){
    /* เพดานซ้อนต่อถนน 8 สาย (เดิม 14) — ส่วนเกินวาดเป็น casing เทากลางๆ สื่อว่า
       "ยังมีสายซ่อนอยู่ คลิกเลือกดูทีละสาย" แทนการซ้อนจนอ่านไม่ออก */
    roads.forEach(e=>{
      let idx=WR.get(e.id); if(!idx||!idx.length) return;
      const shown=idx.slice(0,8), n=shown.length;
      const sp=Math.max(1.1,Math.min(2.3,11/Math.max(1,n)));
      const base=pts(e.geometry);
      shown.forEach((gi,k)=>{
        const off=(k-(n-1)/2)*sp*K;
        stroke(offsetPts(base,off),Math.max(1.3,sp*0.86),dark?G[gi].col:G[gi].colL);
      });
      if(idx.length>8) stroke(base,(ROADW[e.tags.highway]||1.2)+1.4,dark?"#4A5568":"#B9C3D1");
    });
  }

  /* 5) วงรัศมีที่ใช้ตัดสินว่า "ผ่านจุดนี้" — สเกลตรงตามระยะจริง */
  /* วงรัศมีอยู่รอบ "หมุด" ไม่ใช่กลางจอเสมอไป เพราะเลื่อนแผนที่ได้แล้ว */
  const pin=P(c[0],c[1]);
  const rPix=(H/2)*(MAPD.near/viewR());
  cx.beginPath(); cx.arc(pin[0],pin[1],rPix,0,Math.PI*2);
  cx.fillStyle=T.ring; cx.fill();
  cx.strokeStyle=T.ringLine; cx.lineWidth=1.1*K; cx.setLineDash([5*K,4*K]); cx.stroke(); cx.setLineDash([]);

  /* 6) ชื่อสถานที่ — มีระบบกันชนกัน ไม่ให้ตัวหนังสือทับกันจนลายตา */
  const taken=[];
  const roomFor=(x,y,w,h)=>{
    for(const b of taken) if(x<b[2]&&x+w>b[0]&&y<b[3]&&y+h>b[1]) return false;
    taken.push([x,y,x+w,y+h]); return true;
  };
  /* กันเฉพาะตัวหมุดกับชื่อโลเคชั่นใต้หมุด ไม่กว้างเกินจนป้ายสถานีข้างๆ วางไม่ได้ */
  const pin0=P(c[0],c[1]);
  taken.push([pin0[0]-11*K,pin0[1]-20*K,pin0[0]+11*K,pin0[1]+12*K]);
  if(MAPD.title){
    cx.font="600 "+(11.5*K)+"px "+THAI;
    const tw=cx.measureText(MAPD.title).width;
    taken.push([pin0[0]-tw/2-7*K,pin0[1]+11*K,pin0[0]+tw/2+7*K,pin0[1]+30*K]);
  }

  cx.textBaseline="middle";
  /* 6a) ชื่อถนนสายหลัก วางตามแนวถนน */
  const usedNames={}; let roadLabels=0;
  const MAXROADLABEL=Math.max(5,Math.round(W/95));
  cx.font=(9.5*K)+"px "+THAI;
  roads.slice().reverse().forEach(e=>{
    if(roadLabels>=MAXROADLABEL) return;
    const t=e.tags||{}; if(!t.name||!NAMEROAD[t.highway]) return;
    if(usedNames[t.name]) return;
    const pp=pts(e.geometry); if(pp.length<2) return;
    const mid=Math.floor(pp.length/2);
    const a=pp[Math.max(0,mid-1)], b=pp[Math.min(pp.length-1,mid)];
    const x=(a[0]+b[0])/2, y=(a[1]+b[1])/2;
    if(x<24*K||x>W-24*K||y<14*K||y>H-22*K) return;
    const w=cx.measureText(t.name).width;
    if(!roomFor(x-w/2-3*K,y-7*K,w+6*K,14*K)) return;
    usedNames[t.name]=1; roadLabels++;
    let ang=Math.atan2(b[1]-a[1],b[0]-a[0]);
    if(ang>Math.PI/2||ang<-Math.PI/2) ang+=Math.PI;
    cx.save(); cx.translate(x,y); cx.rotate(ang); cx.textAlign="center";
    cx.lineWidth=3*K; cx.strokeStyle=T.bg; cx.strokeText(t.name,0,0);
    cx.fillStyle=T.roadName; cx.fillText(t.name,0,0);
    cx.restore();
  });
  /* 6b) จุดสำคัญ: สถานีรถไฟฟ้า ย่าน โรงพยาบาล มหาวิทยาลัย สถานที่สำคัญ */
  const PRIO={station:0,place:1,poi:2};
  const labels=(MAPD.nodes||[]).slice().sort((a,b)=>PRIO[a.kind]-PRIO[b.kind]);
  cx.font="500 "+(10.5*K)+"px "+THAI; cx.textAlign="left";
  let shown=0;
  const MAXLABEL=Math.max(8,Math.round(W*H/26000));
  for(const nd of labels){
    if(shown>=MAXLABEL) break;
    const q=P(nd.lat,nd.lon);
    if(q[0]<8*K||q[0]>W-8*K||q[1]<10*K||q[1]>H-22*K) continue;
    const w=cx.measureText(nd.name).width, bw=w+8*K, bh=15*K;
    /* ลองวาง ขวา → ซ้าย → บน → ล่าง ก่อนจะยอมข้าม
       (ก่อนหน้านี้ลองแค่ทางขวา ป้ายสถานีที่อยู่ติดหมุดเลยหายไปทั้งหมด) */
    const cand=[[q[0]+7*K,q[1]-7.5*K],[q[0]-7*K-bw,q[1]-7.5*K],
                [q[0]-bw/2,q[1]-20*K],[q[0]-bw/2,q[1]+7*K]];
    let put=null;
    for(const [bx,by] of cand){
      if(bx<3*K||bx+bw>W-3*K||by<2*K||by+bh>H-16*K) continue;
      if(roomFor(bx,by,bw,bh)){ put=[bx,by]; break; }
    }
    if(!put) continue;
    shown++;
    const st=(nd.kind==="station");
    cx.fillStyle=T.labelBg; cx.fillRect(put[0],put[1],bw,bh);
    cx.fillStyle=st?T.pin:T.label;
    cx.fillText(nd.name,put[0]+4*K,put[1]+7.8*K);
    cx.beginPath(); cx.arc(q[0],q[1],st?3.4*K:2.4*K,0,Math.PI*2);
    cx.fillStyle=st?T.pin:T.label; cx.fill();
    cx.strokeStyle=T.bg; cx.lineWidth=1.4*K; cx.stroke();
  }

  /* 7) หมุดโลเคชั่น + ชื่อ */
  const mx=pin[0], my=pin[1];
  cx.beginPath(); cx.arc(mx,my-9*K,8*K,0,Math.PI*2);
  cx.moveTo(mx-8*K,my-5*K); cx.lineTo(mx,my+9*K); cx.lineTo(mx+8*K,my-5*K); cx.closePath();
  cx.fillStyle=T.pin; cx.fill(); cx.strokeStyle=T.pinEdge; cx.lineWidth=2*K; cx.stroke();
  cx.beginPath(); cx.arc(mx,my-9*K,3*K,0,Math.PI*2); cx.fillStyle=T.pinEdge; cx.fill();
  const lname=(MAPD.title||"");
  if(lname){
    cx.font="600 "+(11.5*K)+"px "+THAI; cx.textAlign="center";
    const w=cx.measureText(lname).width;
    cx.fillStyle=T.labelBg; cx.fillRect(mx-w/2-6*K,my+12*K,w+12*K,17*K);
    cx.fillStyle=T.pin; cx.fillText(lname,mx,my+21*K);
  }

  /* 8) เครดิตข้อมูล — ต้องมีตามสัญญาอนุญาตของ OpenStreetMap */
  cx.textBaseline="bottom"; cx.font=(9.5*K)+"px "+MONO;
  cx.fillStyle=T.text;
  const credit="ข้อมูลแผนที่ © OpenStreetMap contributors";
  const scope="สายที่จอดป้ายในรัศมี "+MAPD.near+" ม. · ภาพกว้าง "+Math.round(viewR())+" ม.";
  cx.textAlign="right"; cx.fillText(credit,W-6*K,H-6*K);
  cx.textAlign="left";
  /* แผงด้านข้างแคบ ถ้าเขียนสองมุมจะทับกัน — ขยับขึ้นอีกบรรทัดแทน */
  const fits=(cx.measureText(credit).width+cx.measureText(scope).width+24*K)<W;
  cx.fillText(scope,6*K,fits?H-6*K:H-19*K);
  cx.restore();
  return true;
}

function paintCanvas(cvId,boxId){
  const cv=$(cvId); if(!cv) return false;
  const box=$(boxId), W=box.clientWidth||600, H=box.clientHeight||260;
  if(W<10||H<10) return false;
  const dpr=Math.min(window.devicePixelRatio||1,2);
  cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr);
  cv.style.width=W+"px"; cv.style.height=H+"px";
  const cx=cv.getContext("2d");
  cx.setTransform(dpr,0,0,dpr,0,0);
  return drawMap(cx,W,H,mapTheme(),1);
}
function paintAll(){ paintMap(); if(!$("mapFull").hidden) paintCanvas("fullCv","fullBox"); }
function paintMap(){
  const ok=paintCanvas("mapCv","mapBox");
  if(!$("mapCv")) return;
  $("mapOff").hidden=ok;
  $("mapTools").hidden=!ok;
  if(!ok) $("mapOff").innerHTML = MAPD.busy
    ? "กำลังดึงข้อมูลแผนที่จาก OpenStreetMap…"
    : (MAPD.err?'<span style="color:var(--bad)">'+esc(MAPD.err)+"</span><br>กดปุ่มด้านล่างเพื่อลองใหม่"
               :"กดปุ่ม <b>ดึงแผนที่และเส้นทางเดินรถ</b> ด้านล่าง<br>ระบบจะวาดถนน รางรถไฟฟ้า และเส้นทางรถเมล์จริงรอบจุดนี้ให้");
}
window.addEventListener("resize",()=>{clearTimeout(window.__mrz);window.__mrz=setTimeout(paintAll,180)});

/* แปลงพิกัดจอ → ละติจูด/ลองจิจูด (ใช้กับทั้งเลื่อนแผนที่และย้ายหมุด) */
function screenToLL(cv,clientX,clientY){
  const r=cv.getBoundingClientRect(), W=r.width, H=r.height;
  const c=viewC(), R=viewR();
  const kY=(H/2)/(R/MPD), kX=kY*Math.cos(c[0]*Math.PI/180);
  return [c[0]-((clientY-r.top)-H/2)/kY, c[1]+((clientX-r.left)-W/2)/kX];
}
/* ดับเบิลคลิก = ย้ายหมุดไปจุดนั้น (คลิกเดี่ยวสงวนไว้ให้ลากแผนที่) */
function mapDblClick(e){
  if(!MAPD.at) return;
  const ll=screenToLL(e.currentTarget,e.clientX,e.clientY);
  PINX[curLoc().id]=[+ll[0].toFixed(6),+ll[1].toFixed(6)]; savePin();
  syncLL(); loadMap();
  toast("ย้ายหมุดแล้ว — กำลังดึงข้อมูลรอบจุดใหม่");
}
function bindPanZoom(cv){
  let drag=null;
  cv.addEventListener("pointerdown",e=>{
    if(!MAPD.at) return;
    if(!MAPD.view) resetView();
    drag={x:e.clientX,y:e.clientY,c:viewC().slice(),moved:false};
    cv.setPointerCapture(e.pointerId); cv.style.cursor="grabbing";
  });
  cv.addEventListener("pointermove",e=>{
    if(!drag) return;
    const r=cv.getBoundingClientRect(), H=r.height, R=viewR();
    const kY=(H/2)/(R/MPD), kX=kY*Math.cos(drag.c[0]*Math.PI/180);
    const dx=e.clientX-drag.x, dy=e.clientY-drag.y;
    if(Math.abs(dx)+Math.abs(dy)>3) drag.moved=true;
    MAPD.view.c=[drag.c[0]+dy/kY, drag.c[1]-dx/kX];
    paintAll();
  });
  const end=e=>{ if(!drag)return; drag=null; cv.style.cursor="grab";
    try{cv.releasePointerCapture(e.pointerId)}catch(x){} };
  cv.addEventListener("pointerup",end);
  cv.addEventListener("pointercancel",end);
  cv.addEventListener("wheel",e=>{
    if(!MAPD.at) return;
    e.preventDefault();
    zoomBy(e.deltaY>0?1.18:1/1.18);
  },{passive:false});
  cv.addEventListener("dblclick",mapDblClick);
  cv.style.cursor="grab";
}
function mapInit(){
  $("mapBox").insertAdjacentHTML("afterbegin",
    '<canvas id="mapCv" style="display:block;width:100%;height:100%;touch-action:none"></canvas>');
  bindPanZoom($("mapCv"));
  bindPanZoom($("fullCv"));
  paintMap();
}
function mapGo(){          /* เปลี่ยนโลเคชั่น = ล้างแผนที่เดิม รอผู้ใช้กดดึงใหม่ */
  MAPD.data=null; MAPD.at=null; MAPD.nodes=[]; MAPD.groups=[]; MAPD.wayRoutes=null;
  MAPD.solo=null; MAPD.err=""; MAPD.view=null; MAPD.stops=[];
  /* เก็บ GEO cache ไว้ — สายรถเมล์เป็นของทั้งเมือง ใช้ซ้ำข้ามโลเคชั่นได้ ไม่ต้องดึงใหม่ */
  MAPD.mode="local"; MAPD.localView=null; MAPD.routeFitR=0; MAPD.geomBusy="";
  OVP.hits=null; syncLL(); paintMap(); mapNote(); renderRouteLegend();
}
function syncLL(){
  const p=locPos(curLoc());
  $("llLat").value=p[0]; $("llLng").value=p[1];
}
["llLat","llLng"].forEach(id=>$(id).addEventListener("change",()=>{
  const la=parseFloat($("llLat").value), ln=parseFloat($("llLng").value);
  if(!isFinite(la)||!isFinite(ln)||la<-90||la>90||ln<-180||ln>180){
    toast("พิกัดไม่ถูกต้อง — ใส่เป็นตัวเลข เช่น 13.7650 และ 100.5378",true); syncLL(); return;
  }
  PINX[curLoc().id]=[la,ln]; savePin(); mapGo();
  toast("ตั้งพิกัดใหม่ของ "+curLoc().th+" แล้ว");
}));
$("mapZoom").addEventListener("change",e=>{
  MAPD.radius=+e.target.value;
  if(MAPD.data) loadMap(); else paintMap();
});
$("mapNear").addEventListener("change",e=>{
  MAPD.near=+e.target.value;
  if(MAPD.data) loadMap(); else paintMap();
});

function mapNote(){
  const l=curLoc(), moved=!!PINX[l.id], n=busOf(l).length;
  const conf=l.conf||"low";
  let t='<span class="confbadge '+conf+'">'+(CONFTH[conf]||conf)+"</span> ";
  if(OVP.hits!=null){
    t='<span class="confbadge high">สดจาก OPENSTREETMAP</span> พบ '+OVP.hits+
      ' สายที่จอดป้ายรถเมล์ในรัศมี '+MAPD.near+' ม.'+(moved?" · ใช้หมุดที่คุณปรับเอง":"");
  }else if(isCustomLoc(l)&&!moved){
    t+="จุดนี้คุณเพิ่มเองจึงยังไม่มีพิกัด — ใส่ละติจูด/ลองจิจูดด้านล่าง หรือคลิกบนแผนที่";
  }else if(n===0){
    t+="ไม่พบสายรถเมล์ประจำทางที่วิ่งเส้นทางนี้ — เป็นเส้นทางรถโดยสารระหว่างจังหวัดและรถส่วนตัว ไม่ควรอ้างสายรถเมล์กับลูกค้า";
  }else{
    t+="ที่มา "+esc(l.src||"—")+" · ข้อมูลรวบรวม ก.ย. 2569"+(moved?" · ใช้หมุดที่คุณปรับเอง":"");
  }
  $("mapNote").innerHTML=t;
}

function renderRouteLegend(){
  const G=MAPD.groups;
  if(!G.length){ $("routeLegend").innerHTML=""; $("routeLegend").hidden=true; return; }
  $("routeLegend").hidden=false;
  const solo=MAPD.solo;
  const soloG=solo!=null?G[solo]:null;
  const key=soloG?geoKeyOf(soloG.ids):null;
  const hasGeo=!!(key&&typeof GEO!=="undefined"&&GEO.has(key));
  const busy=!!(key&&MAPD.geomBusy===key);
  let head="<b>"+G.length+" สาย</b> ที่จอดป้ายรถเมล์ในรัศมี "+MAPD.near+" ม. · แต่ละสีคือหนึ่งสาย";
  if(solo!=null){
    head+=' <button type="button" class="lgd-all" data-all="1">แสดงทุกสาย</button>';
    head+= MAPD.mode==="route"
      ? ' <button type="button" class="lgd-all" data-exitroute="1">กลับมุมมองใกล้</button>'
      : ' <button type="button" class="lgd-all" data-fullroute="1"'+(busy?" disabled":"")+'>'+
        (busy?"กำลังดึงเส้นทาง…":"ดูทั้งสาย"+(hasGeo?"":" (ดึงข้อมูล)"))+"</button>";
  }else{
    head+=' <span class="lgd-tip">คลิกที่สายเพื่อดูเส้นทางเฉพาะสายนั้น</span>';
  }
  $("routeLegend").innerHTML =
    '<div class="lgd-head">'+head+"</div>"+
    '<div class="lgd-list">'+G.map((g,i)=>{
      const verified=curatedLabel(g.ref,curLoc()).verified;
      return '<button type="button" class="lgd-i'+(solo===i?" on":"")+'" data-g="'+i+'">'+
        '<span class="dot" style="background:'+g.col+'"></span>'+
        "<b>"+esc(g.ref)+"</b>"+
        (verified?"":'<span title="สายนี้มาจาก OSM ยังไม่ตรวจกับรายการที่ยืนยันแล้ว"> ?</span>')+
        (g.pair?'<em>'+esc(g.pair)+"</em>":"")+
      "</button>";
    }).join("")+"</div>";
}
$("routeLegend").addEventListener("click",async e=>{
  if(e.target.closest("[data-all]")){
    MAPD.solo=null;
    if(MAPD.mode==="route") exitRouteMode(); else{ SFX.play("tick"); paintMap(); }
    renderRouteLegend(); return;
  }
  if(e.target.closest("[data-exitroute]")){ exitRouteMode(); renderRouteLegend(); return; }
  if(e.target.closest("[data-fullroute]")){
    if(MAPD.solo==null) return;
    const geo=await loadRouteGeom(MAPD.solo);
    if(geo) enterRouteMode(MAPD.solo);
    renderRouteLegend();
    return;
  }
  const b=e.target.closest("[data-g]"); if(!b)return;
  const i=+b.dataset.g;
  if(MAPD.mode==="route") exitRouteMode();
  MAPD.solo=(MAPD.solo===i)?null:i;
  SFX.play("tick"); paintMap(); renderRouteLegend();
  if(MAPD.solo!=null){
    const g=MAPD.groups[i];
    toast("แสดงเฉพาะสาย "+g.ref+(g.pair?" · "+g.pair:""));
  }
});

/* ---- Overpass API: ขอข้อมูลแผนที่ + เส้นทางเดินรถในคำขอเดียว ----
   ใช้ POST + Content-Type: text/plain เพื่อไม่ให้เบราว์เซอร์ยิง preflight OPTIONS
   สลับเซิร์ฟเวอร์สำรองอัตโนมัติ และ *มีตัวจับเวลาฝั่งเรา* เพราะ fetch ไม่มี timeout ในตัว
   (บั๊ก v36: เซิร์ฟเวอร์ค้าง → ปุ่มค้างที่ "กำลังถาม…" ตลอดไป) */
/* v41: ถอด maps.mail.ru ออกจากรายการสำรอง — ทุกครั้งที่ดึงแผนที่คือการส่งพิกัดจุดสื่อ Plan B
   จริงไปเซิร์ฟเวอร์ที่ตอบ mail.ru ดูแลโดย VK (รัสเซีย) ไม่ควรเป็นปลายทางของพิกัดสื่อโฆษณาบริษัท
   เหลือ 3 ชั้นก็ยังพอสำหรับ failover — ดู README.md หัวข้อ "ข้อมูลภายนอกที่แอปเรียก" */
const OVP={hits:null};
const OVP_HOSTS=[
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass.osm.ch/api/interpreter"
];
const OVP_TIMEOUT=20000;
let OVP_CANCEL=null;          /* ให้ผู้ใช้กดยกเลิกได้ ไม่ต้องนั่งรอจนครบทุกเซิร์ฟเวอร์ */

