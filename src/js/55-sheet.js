/* ---- ภาพแผนที่สำหรับใบนำเสนอ: ใช้ตัววาดเวกเตอร์ตัวเดียวกัน แต่เป็นธีมสว่าง ----
   ทุกพิกเซลเราวาดเอง จึงไม่มีปัญหา canvas ปนเปื้อน export ได้เสมอไม่ว่าเปิดไฟล์แบบไหน */
function sheetMapCanvas(W,H,K){
  const cv=document.createElement("canvas");
  cv.width=W*K; cv.height=H*K;
  const cx=cv.getContext("2d");
  cx.setTransform(K,0,0,K,0,0);
  const ok=drawMap(cx,W,H,THEME_LIGHT,1);
  if(!ok){
    cx.fillStyle=THEME_LIGHT.bg; cx.fillRect(0,0,W,H);
    cx.fillStyle="#6b7684"; cx.font="13px "+THAI;
    cx.textAlign="center"; cx.textBaseline="middle";
    cx.fillText("ยังไม่ได้ดึงข้อมูลแผนที่ — กดปุ่ม ดึงแผนที่และเส้นทางเดินรถ ในแผง 10 ก่อน",W/2,H/2);
    cx.textAlign="left"; cx.textBaseline="alphabetic";
  }
  return {cv:cv,ok:ok};
}
const MONO='"JetBrains Mono",ui-monospace,monospace';
const THAI='"IBM Plex Sans Thai","Chakra Petch",system-ui,sans-serif';

/* ---- ใบนำเสนอฝ่ายขาย ---- */
let sheetPngUrl="";
async function openSheet(){
  const l=curLoc(), b=busOf(l), p=locPos(l), v=find(list("vehicle"),S.vehicle);
  $("shTh").textContent=l.th;
  $("shEn").textContent=(l.en||"")+" · BANGKOK";
  const G=MAPD.groups;
  if(G.length){
    $("shCount").textContent=G.length+" สาย (ตรวจสดจาก OpenStreetMap ในรัศมี "+MAPD.near+" ม.)";
    $("shLines").innerHTML=G.map(g=>
      '<span class="shline"><i style="background:'+g.colL+'"></i>'+esc(g.ref)+"</span>").join("");
  }else{
    $("shCount").textContent=b.length?(b.length+" สาย"):"ไม่พบสายรถเมล์ประจำทาง";
    $("shLines").innerHTML = b.length
      ? b.map(x=>'<span class="shline">'+esc(x)+"</span>").join("")
      : '<span class="shline">— เส้นทางนี้ไม่มีรถเมล์ประจำทางวิ่งผ่าน —</span>';
  }
  const conf=l.conf||"low";
  const prov = G.length
    ? "ตรวจสดจาก OpenStreetMap ผ่าน Overpass API เมื่อ "+new Date().toLocaleDateString("th-TH",
        {year:"numeric",month:"long",day:"numeric"})+" · เฉพาะสายที่จอดป้ายรถเมล์ในรัศมี "+MAPD.near+" เมตร · รวมขาไปขากลับแล้ว · ควรตรวจซ้ำกับ Google Maps ก่อนยืนยันกับลูกค้า"
    : (CONFTH[conf]||conf)+" · ที่มา "+esc(l.src||"—")+" · รวบรวม ก.ย. 2569";
  $("shMeta").innerHTML=
    "สื่อที่นำเสนอ: "+esc(v.th)+" · "+esc(v.en)+"<br>"+
    "สถานะข้อมูลสายรถเมล์: "+prov+"<br>"+
    "หมายเหตุ: เลขสายรถเมล์กรุงเทพฯ อยู่ระหว่างเปลี่ยนเป็นรหัสใหม่ของกรมการขนส่งทางบก บางสายจึงมีทั้งเลขเดิมและรหัสใหม่ในวงเล็บ เช่น 511 (3-22E) · กรุณาตรวจสอบกับผู้ให้บริการก่อนยืนยันกับลูกค้า<br>"+
    "PLAN B MEDIA · เอกสารประกอบการนำเสนอ · สร้างโดย Autostudio 3D";
  $("sheetVeil").hidden=false;
  const r=sheetMapCanvas(840,360,2);
  $("shMap").hidden=!r.ok; $("shNoMap").hidden=r.ok; $("shKey").hidden=!r.ok;
  if(r.ok) $("shMap").src=r.cv.toDataURL("image/png");
}
$("sheetBtn").addEventListener("click",openSheet);
$("sheetClose").addEventListener("click",()=>$("sheetVeil").hidden=true);
$("sheetVeil").addEventListener("click",e=>{if(e.target.id==="sheetVeil")$("sheetVeil").hidden=true});
$("sheetPrint").addEventListener("click",()=>window.print());

/* PNG: วาดใบนำเสนอทั้งใบลง canvas เอง คมชัดที่ 2x */
$("sheetPng").addEventListener("click",async()=>{
  const l=curLoc(), p=locPos(l), v=find(list("vehicle"),S.vehicle);
  const G=MAPD.groups;
  const b = G.length ? G.map(g=>g.ref) : busOf(l);
  const colOf = i => G.length ? G[i].colL : null;
  const K=2, W=900, PADX=46;
  toast("กำลังสร้างไฟล์ภาพ…");
  const m=sheetMapCanvas(W-PADX*2,330,K);
  const cv=document.createElement("canvas");
  const cx=cv.getContext("2d");
  /* วัดความสูงของแถวชิปก่อน เพื่อให้ภาพพอดีเสมอ */
  cv.width=1; cv.height=1; cx.font=(13*K)+"px "+MONO;
  const chipW=x=>cx.measureText(x).width+26*K, rowW=(W-PADX*2)*K;
  let rows=1, used=0;
  b.forEach(x=>{const w=chipW(x)+7*K; if(used+w>rowW){rows++;used=w}else used+=w});
  if(!b.length) rows=1;
  const mapH=330*K, chipsY=0;
  const H = (128 + 96 + 330 + 44 + 26 + 8)*K + rows*34*K + 118*K;
  cv.width=W*K; cv.height=H;
  const c=cv.getContext("2d");
  c.fillStyle="#ffffff"; c.fillRect(0,0,cv.width,cv.height);
  /* หัวกระดาษ — น้ำเงิน Plan B + ตัวหนังสือขาว (คู่กับ #sheet .sh-top ใน styles.css
     แก้สีที่นี่แล้วต้องแก้ที่นั่นด้วย ไม่งั้นตัวอย่างบนจอกับไฟล์ PNG ที่ส่งออกจะสีไม่ตรงกัน) */
  const hdrGrad=c.createLinearGradient(0,0,cv.width,84*K);
  hdrGrad.addColorStop(0,"#002563"); hdrGrad.addColorStop(1,"#0E4FB5");
  c.fillStyle=hdrGrad; c.fillRect(0,0,cv.width,84*K);
  c.fillStyle="#ffffff"; c.font="600 "+(19*K)+"px "+THAI;
  c.textAlign="left"; c.textBaseline="alphabetic";
  c.fillText("PLAN B MEDIA",PADX*K,36*K);
  c.fillStyle="#cfe0f5"; c.font=(11.5*K)+"px "+MONO;
  c.fillText("OUT-OF-HOME · BANGKOK BUS & BILLBOARD NETWORK",PADX*K,60*K);
  /* ชื่อโลเคชั่น */
  let y=84*K+52*K;
  c.fillStyle="#0C1016"; c.font="600 "+(30*K)+"px "+THAI;
  c.fillText(l.th,PADX*K,y);
  y+=26*K;
  c.fillStyle="#6b7684"; c.font=(12.5*K)+"px "+MONO;
  c.fillText(((l.en||"")+" · BANGKOK").toUpperCase(),PADX*K,y);
  /* แผนที่ */
  y+=22*K;
  c.drawImage(m.cv,PADX*K,y);
  c.strokeStyle="#d8dde4"; c.lineWidth=1*K;
  c.strokeRect(PADX*K,y,(W-PADX*2)*K,mapH);
  y+=mapH+40*K;
  /* หัวข้อสายรถเมล์ */
  if(m.ok){
    c.fillStyle="#6b7684"; c.font=(10.5*K)+"px "+THAI;
    c.fillText("แต่ละสีบนแผนที่คือหนึ่งสายรถเมล์ · วงกลมประ = ระยะหาป้ายรถเมล์ ("+MAPD.near+" ม.)",PADX*K,y-6*K);
    y+=18*K;
  }
  c.fillStyle="#6b7684"; c.font="600 "+(11*K)+"px "+MONO;
  c.fillText("สายรถเมล์ที่ผ่านจุดนี้ · "+(b.length?b.length+" สาย":"ไม่พบสายรถเมล์ประจำทาง")+
             (G.length?" · ตรวจสดจาก OpenStreetMap":""),PADX*K,y);
  y+=22*K;
  /* ชิป */
  c.font=(13*K)+"px "+MONO;
  let x=PADX*K;
  const items=b.length?b:["— เส้นทางนี้ไม่มีรถเมล์ประจำทางวิ่งผ่าน —"];
  items.forEach((t,ti)=>{
    const dot=b.length?colOf(ti):null;
    const w=c.measureText(t).width+26*K+(dot?15*K:0);
    if(x+w>(W-PADX)*K){x=PADX*K;y+=34*K}
    c.fillStyle="#f4f6f9"; c.strokeStyle="#c9d0d9"; c.lineWidth=1*K;
    const h=26*K, r=13*K;
    c.beginPath();
    c.moveTo(x+r,y-h+6*K); c.arcTo(x+w,y-h+6*K,x+w,y+6*K,r);
    c.arcTo(x+w,y+6*K,x,y+6*K,r); c.arcTo(x,y+6*K,x,y-h+6*K,r);
    c.arcTo(x,y-h+6*K,x+w,y-h+6*K,r); c.closePath();
    c.fill(); c.stroke();
    if(dot){
      c.beginPath(); c.arc(x+18*K,y-3*K,4.5*K,0,Math.PI*2);
      c.fillStyle=dot; c.fill();
      c.fillStyle="#14181f"; c.fillText(t,x+28*K,y);
    }else{
      c.fillStyle="#14181f"; c.fillText(t,x+13*K,y);
    }
    x+=w+7*K;
  });
  /* ท้ายกระดาษ */
  y+=38*K;
  c.strokeStyle="#e3e7ec"; c.lineWidth=1*K;
  c.beginPath(); c.moveTo(PADX*K,y); c.lineTo((W-PADX)*K,y); c.stroke();
  y+=22*K;
  c.fillStyle="#6b7684"; c.font=(11*K)+"px "+THAI;
  const conf=l.conf||"low";
  const provP = G.length
    ? "ตรวจสดจาก OpenStreetMap ผ่าน Overpass API เมื่อ "+new Date().toLocaleDateString("th-TH",
        {year:"numeric",month:"long",day:"numeric"})+" · เฉพาะสายที่จอดป้ายในรัศมี "+MAPD.near+" ม. · ควรตรวจซ้ำกับ Google Maps"
    : (CONFTH[conf]||conf)+" · ที่มา "+(l.src||"—")+" · รวบรวม ก.ย. 2569";
  [ "สื่อที่นำเสนอ: "+v.th+" · "+v.en,
    "สถานะข้อมูลสายรถเมล์: "+provP,
    "เลขสายรถเมล์กรุงเทพฯ อยู่ระหว่างเปลี่ยนเป็นรหัสใหม่ กรมการขนส่งทางบก บางสายมีทั้งเลขเดิมและรหัสใหม่ เช่น 511 (3-22E)",
    "กรุณาตรวจสอบกับผู้ให้บริการก่อนยืนยันกับลูกค้า · สร้างโดย Autostudio 3D"
  ].forEach(t=>{c.fillText(t,PADX*K,y);y+=18*K});

  let url="";
  try{ url=cv.toDataURL("image/png"); }
  catch(e){ toast("บันทึกภาพไม่สำเร็จ — แผนที่โหลดไม่ครบ ลองใหม่เมื่อเน็ตพร้อม",true); return; }
  const a=document.createElement("a");
  a.href=url; a.download="planb_"+(l.en||l.id).replace(/[^\w]+/g,"_").toLowerCase()+"_bus_routes.png";
  document.body.appendChild(a); a.click(); a.remove();
  toast("บันทึกใบนำเสนอเป็นภาพแล้ว — แปะลงสไลด์หรือส่ง LINE ได้เลย");
});

