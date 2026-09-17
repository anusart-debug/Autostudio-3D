/* ================= โหมดดูทั้งสาย (v41) =========================
   โหมด local (ค่าเริ่มต้น) = พฤติกรรมเดิมทั้งหมด ไม่เปลี่ยน
   โหมด route = ซูมออกให้เห็นทั้งสายที่เลือก ใช้ตอนกด "ดูทั้งสาย" ในแผงเส้นทาง (10 · Route Map) */

/* เพดานมุมมอง — ปลดล็อกให้ซูมออกได้ถึงขนาดของสายทั้งสาย ไม่ใช่แค่ 1.25 เท่าของรัศมีที่ดึงมา
   (จุดนี้คือบรรทัดที่ทำให้ "ดูทั้งสาย" เป็นไปได้จริง ของเดิมล็อกไว้ที่ MAPD.radius*1.25 เสมอ
   ซึ่งสายรถเมล์จริงยาว 20-40 กม. ไม่มีทางซูมออกไปเห็นได้ทั้งสายถ้าไม่แก้จุดนี้) */
function routeViewMax(){
  return (MAPD.mode==="route"&&MAPD.routeFitR) ? MAPD.routeFitR*1.4 : MAPD.radius*1.25;
}
/* จุดกลาง + รัศมีที่ครอบ bbox ของเส้นทางทั้งสาย ใช้ metres() เดิมจาก 52-overpass.js */
function bboxCenterRadius(bbox){
  const [minLat,minLon,maxLat,maxLon]=bbox;
  const c=[(minLat+maxLat)/2,(minLon+maxLon)/2];
  const dLat=metres(minLat,minLon,maxLat,minLon);
  const dLon=metres(minLat,minLon,minLat,maxLon);
  return {c, r:Math.max(dLat,dLon)/2||500};
}
function enterRouteMode(gi){
  const g=MAPD.groups[gi]; if(!g) return;
  const geo=geoRecall(geoKeyOf(g.ids)); if(!geo) return;
  if(!MAPD.localView) MAPD.localView={c:viewC().slice(),r:viewR()};
  const fit=bboxCenterRadius(geo.bbox);
  MAPD.mode="route"; MAPD.routeFitR=fit.r;
  MAPD.view={c:fit.c,r:Math.max(fit.r*1.15,60)};
  paintAll();
}
function exitRouteMode(){
  if(MAPD.mode!=="route") return;
  MAPD.mode="local"; MAPD.routeFitR=0;
  if(MAPD.localView){ MAPD.view=MAPD.localView; MAPD.localView=null; }
  else resetView();
  paintAll();
}

/* วาดเส้นทางเต็มสาย — ทีละ way ห้ามต่อรวม (กฎข้อ 8 map-howto.md) casing สีพื้นแผนที่ก่อน
   ทับด้วยสีสาย ป้ายที่สายนี้จอด แล้วชื่อต้นทาง/ปลายทางที่มุม bbox */
function drawRouteLayer(cx,W,H,T,K,g,geo){
  const P=makeProj(viewC(),W,H,viewR());
  const col=(T===THEME_LIGHT)?g.colL:g.col;
  geo.ways.forEach(w=>{
    if(w.length<2) return;
    const pp=w.map(([la,lo])=>P(la,lo));
    cx.beginPath(); pp.forEach((q,i)=>i?cx.lineTo(q[0],q[1]):cx.moveTo(q[0],q[1]));
    cx.lineCap="round"; cx.lineJoin="round";
    cx.lineWidth=6*K; cx.strokeStyle=T.bg; cx.stroke();
    cx.beginPath(); pp.forEach((q,i)=>i?cx.lineTo(q[0],q[1]):cx.moveTo(q[0],q[1]));
    cx.lineWidth=3*K; cx.strokeStyle=col; cx.stroke();
  });
  geo.stops.forEach(s=>{
    const q=P(s.lat,s.lon);
    cx.beginPath(); cx.arc(q[0],q[1],2.6*K,0,Math.PI*2);
    cx.fillStyle=T.bg; cx.fill(); cx.strokeStyle=col; cx.lineWidth=1.3*K; cx.stroke();
  });
  cx.font="600 "+(11*K)+"px "+THAI; cx.textAlign="center"; cx.textBaseline="middle";
  cx.fillStyle=T.label;
  const edge=(a,b)=>{
    const q=P(a,b);
    cx.fillStyle=T.labelBg; const w=60*K;
    cx.fillRect(q[0]-w/2,q[1]-9*K,w,18*K);
    cx.fillStyle=T.label;
  };
  if(geo.from){ const q=P(geo.bbox[0],geo.bbox[1]); edge(geo.bbox[0],geo.bbox[1]); cx.fillText(geo.from,q[0],q[1]); }
  if(geo.to){ const q=P(geo.bbox[2],geo.bbox[3]); edge(geo.bbox[2],geo.bbox[3]); cx.fillText(geo.to,q[0],q[1]); }
  /* คำบรรยายกันเข้าใจผิดว่านี่คือแผนที่ถนนจริง — ฐานแผนที่ที่มีอยู่ครอบแค่รัศมีรอบหมุดเดิม
     ส่วนที่เหลือของเฟรมนี้ไม่มีถนนให้ดู ไม่ใช่ข้อมูลหาย */
  cx.textAlign="left"; cx.textBaseline="top"; cx.font=(10*K)+"px "+THAI;
  cx.fillStyle=T.labelBg; cx.fillRect(6*K,6*K,cx.measureText("ภาพรวมทั้งสาย — ไม่ใช่แผนที่ถนน").width+16*K,18*K);
  cx.fillStyle=T.text; cx.fillText("ภาพรวมทั้งสาย — ไม่ใช่แผนที่ถนน",10*K,9*K);
}

