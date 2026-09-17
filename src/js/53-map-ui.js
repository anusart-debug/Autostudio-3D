/* ---- ปุ่มซูม / เต็มจอ ---- */
function openFull(){
  if(!MAPD.data){toast("ยังไม่มีข้อมูลแผนที่ — กดปุ่มดึงแผนที่ก่อน",true);return}
  $("fullTitle").textContent="แผนที่เส้นทางเดินรถ · "+curLoc().th;
  $("mapFull").hidden=false;
  $("fullLegend").appendChild($("routeLegend"));
  setTimeout(()=>{paintCanvas("fullCv","fullBox")},30);
}
function closeFull(){
  if($("mapFull").hidden) return;
  $("mapFull").hidden=true;
  $("mapBox").parentNode.insertBefore($("routeLegend"),$("stopBox").nextSibling);
  paintMap();
}
function zoomBtn(e){
  const b=e.target.closest("[data-z]"); if(!b)return;
  const k=b.dataset.z;
  if(k==="in") zoomBy(1/1.35);
  else if(k==="out") zoomBy(1.35);
  else if(k==="fit"){ resetView(); paintAll(); }
  else if(k==="full") openFull();
  SFX.play("tick");
}
$("mapTools").addEventListener("click",zoomBtn);
document.querySelector("#mapFull .fh").addEventListener("click",zoomBtn);
$("fullClose").addEventListener("click",closeFull);
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeFull()});
$("fullPng").addEventListener("click",()=>{
  const cv=document.createElement("canvas"), W=1600, H=1000, K=2;
  cv.width=W*K; cv.height=H*K;
  const cx=cv.getContext("2d"); cx.setTransform(K,0,0,K,0,0);
  /* v41: บังคับธีมสว่างเสมอ ไม่ตามธีมของแอป — ไฟล์นี้คือของที่ส่งให้ลูกค้าดู */
  if(!drawMap(cx,W,H,THEME_LIGHT,1)){toast("ยังไม่มีข้อมูลแผนที่",true);return}
  const a=document.createElement("a");
  a.href=cv.toDataURL("image/png");
  a.download="planb_map_"+(curLoc().en||curLoc().id).replace(/[^\w]+/g,"_").toLowerCase()+".png";
  document.body.appendChild(a); a.click(); a.remove();
  toast("บันทึกภาพแผนที่แล้ว");
});
/* ซ่อนคำแนะนำหลังผู้ใช้เริ่มใช้เป็น */
["pointerdown","wheel"].forEach(ev=>
  $("mapBox").addEventListener(ev,()=>{$("mapHint").classList.add("gone")},{once:true,passive:true}));

/* ช่องมองสถานะสำหรับตรวจปัญหา (อ่านอย่างเดียว) — พิมพ์ __as3d.map() ใน Console ได้
   มีไว้ให้ไล่บั๊กเวลาผู้ใช้เจอปัญหาแล้วอธิบายทางแชทไม่ได้ */
window.__as3d={ver:"v41",map:()=>MAPD,routes:()=>MAPD.groups.map(g=>g.ref),
  geom:()=>GEO,mode:()=>MAPD.mode};

$("ovpBtn").addEventListener("click",loadMap);

