/* ---------------- โหมดแนะนำทีละขั้น ---------------- */
const WZ=[
 {n:"สื่อโฆษณาต้นแบบ",p:["01 · Source","01B · Reference DNA"],
  s:"อัปโหลดภาพสื่อที่ต้องการใช้ จะเป็นรถเมล์ ป้ายบิลบอร์ด จอ LED หรือป้ายรถเมล์ก็ได้ ระบบจะถอดสีจริงและสัดส่วนโครงสร้างออกมาให้อัตโนมัติ · ถ้าอัปโหลดอาร์ตเวิร์กโฆษณาเพิ่มอีกใบ ระบบจะสลับเป็นโหมดเปลี่ยนโฆษณาลงในจุดเดิมของสื่อให้ทันที",
  h:"อัปโหลด 2 ใบ (สื่อ + อาร์ตเวิร์ก) = โหมดเปลี่ยนโฆษณาในจุดเดิม"},
 {n:"ประเภทสื่อ",p:["02 · Media"],
  s:"เลือกว่าเป็นสื่อแบบไหน ทั้งรถโดยสาร ป้ายบิลบอร์ด และจอ LED กลางแจ้ง เพื่อให้ AI เข้าใจโครงสร้างที่ถูกต้อง ถ้าไม่มีแบบที่ต้องการ กดปุ่ม ＋ เพิ่มเอง แล้วพิมพ์เองได้",
  h:""},
 {n:"โจทย์เพิ่มเติม",p:["03 · Brief"],
  s:"อยากให้ภาพมีอะไรเป็นพิเศษ พิมพ์บอกได้เลย เช่น ให้มีคนรอรถที่ป้าย หรือถนนโล่งไม่มีรถคันอื่น ข้ามได้ถ้ายังไม่มีโจทย์",
  h:"พิมพ์ไทยก็ได้ ไม่ต้องแปลเป็นอังกฤษ"},
 {n:"โลเคชั่น",p:["04 · Location","10 · Route Map"],
  s:"เลือกฉากหลังจาก "+LOCATIONS.length+" ทำเลจริงในกรุงเทพ จัดกลุ่มตามเขต แต่ละจุดมีคำบรรยายสถานที่ พิกัดบนแผนที่ และรายชื่อสายรถเมล์ที่วิ่งผ่านเตรียมไว้แล้ว",
  h:"กดปุ่ม ใบนำเสนอฝ่ายขาย เพื่อออกเอกสารหน้าเดียวพร้อมแผนที่และสายรถเมล์ ส่งให้ทีมขายได้ทันที"},
 {n:"มุมกล้องและเลนส์",p:["05 · Camera"],
  s:"วางตำแหน่งกล้องและเลือกระยะเลนส์ มุม 3/4 หน้าเป็นมุมมาตรฐานของงานโฆษณารถ ส่วนมุมต่ำทำให้รถดูใหญ่และทรงพลัง",
  h:""},
 {n:"แสงและเวลา",p:["06 · Lighting"],
  s:"แสงคือสิ่งที่ทำให้ภาพดูเป็นงานมืออาชีพหรือไม่ ชั่วโมงทองให้โทนอบอุ่นหรูหรา กลางคืนนีออนให้บรรยากาศเมือง หลังฝนให้ถนนสะท้อนเงาสวย",
  h:""},
 {n:"ขนาดภาพและสไตล์",p:["07 · Output","08 · Render Stack"],
  s:"เลือกอัตราส่วนให้ตรงกับที่จะนำไปใช้ และเลือกสไตล์การเรนเดอร์ปิดท้าย",
  h:"ถ้าอัปโหลดรูปรถไว้ ให้เปิดสวิตช์คงอัตราส่วนเดิมในขั้นที่ 1"},
 {n:"คัดลอกคำสั่ง & ส่งงาน",p:["09 · Export"],
  s:"ระบบเขียนคำสั่งระดับมืออาชีพให้เสร็จแล้ว กดคัดลอกคำสั่ง บันทึกภาพสื่อต้นแบบไว้แนบ แล้วเลือกเว็บ AI ปลายทาง วางคำสั่งพร้อมแนบภาพ",
  h:"ระบบไม่เจนภาพเองและไม่ต้องใส่ API Key — ปลอดภัยกับบัญชีของคุณ ใช้โควตาฟรีของเว็บที่คุณล็อกอินอยู่แล้ว"}
];
let wzAt=0, wzHome=[];

function wzPanels(names){
  return names.map(n=>document.querySelector('.block[data-panel="'+n+'"]')).filter(Boolean);
}
function wzPark(){
  wzHome.forEach(h=>{h.parent.insertBefore(h.el,h.next)});
  wzHome=[];
}
function wzRender(){
  const st=WZ[wzAt];
  $("wzNum").textContent="ขั้นที่ "+(wzAt+1)+" / "+WZ.length;
  $("wzTitle").childNodes[1].nodeValue=st.n;
  $("wzSub").textContent=st.s;
  $("wzHint").textContent=st.h||"";
  wzPark();
  const slot=$("wzSlot"); slot.innerHTML="";
  wzPanels(st.p).forEach(el=>{
    wzHome.push({el:el,parent:el.parentNode,next:el.nextSibling});
    el.classList.remove("collapsed");
    slot.appendChild(el);
  });
  $("wzBack").disabled=(wzAt===0);
  const last=(wzAt===WZ.length-1);
  $("wzNext").innerHTML = last
    ? '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg> คัดลอกคำสั่ง'
    : 'ถัดไป <svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>';
  $("wzNext").classList.toggle("pulse",last);
  $("wzHandoff").hidden=!last;
  [...$("wzRail").children].forEach((b,i)=>{
    b.classList.toggle("now",i===wzAt);
    b.classList.toggle("done",i<wzAt);
  });
  const inner=$("wzSlot");
  inner.classList.remove("wzanim"); void inner.offsetWidth; inner.classList.add("wzanim");
  wzLive();
}
function wzLive(){
  const l=find(list("loc"),S.loc), a=find(list("angle"),S.angle), li=find(list("light"),S.light);
  const v=find(list("vehicle"),S.vehicle), d=dims();
  $("wzLive").innerHTML=
    "<b>สรุปตอนนี้</b> · "+esc(v.th)+" · "+esc(l.th)+" · "+esc(a.th)+" · "+esc(li.th)+
    " · "+d.w+"×"+d.h+(hasSketch()?" · <b>มีภาพต้นแบบแล้ว</b>":" · <b>ยังไม่มีภาพต้นแบบ</b>");
}
function wzBuildRail(){
  $("wzRail").innerHTML=WZ.map((s,i)=>
    '<button class="wzstep" type="button" data-i="'+i+'">'+
    '<span class="line"><i></i></span>'+
    '<span class="num">'+(i+1)+'</span><span class="lab">'+esc(s.n)+'</span></button>').join("");
}
function wzGo(i,dir){
  wzAt=Math.max(0,Math.min(WZ.length-1,i));
  SFX.play(dir==="back"?"back":"next");
  wzRender();
  $("wzBody")&&0;
  document.querySelector(".wzbody").scrollTop=0;
}
function startInWizard(){return store.get("as3d_startmode")!=="full"}   /* ค่าเริ่มต้นคือโหมดแนะนำ */
function wzOpen(silent){
  wzBuildRail();wzAt=0;$("wz").hidden=false;
  $("wzDefault").checked=startInWizard();
  wzRender();
  if(!silent) SFX.play("next");
}
function wzClose(){
  wzPark();$("wz").hidden=true;SFX.play("back");
  ["vehicle","loc","angle","light","style"].forEach(renderChips);
}
$("wizBtn").addEventListener("click",()=>wzOpen());
$("wzDefault").addEventListener("change",e=>{
  try{store.set("as3d_startmode",e.target.checked?"wizard":"full")}catch(x){}
  SFX.play("tick");
  toast(e.target.checked?"เปิดโปรแกรมครั้งหน้าจะเริ่มที่โหมดแนะนำ":"เปิดโปรแกรมครั้งหน้าจะเข้าหน้าเต็มทันที");
});
$("wzExit").addEventListener("click",wzClose);
$("wzBack").addEventListener("click",()=>wzGo(wzAt-1,"back"));
$("wzNext").addEventListener("click",()=>{
  if(wzAt===WZ.length-1){SFX.play("done");$("copyBtn").click();$("handoffBtn").click();return}
  wzGo(wzAt+1,"next");
});
$("wzHandoff").addEventListener("click",()=>$("handoffBtn").click());
$("wzRail").addEventListener("click",e=>{
  const b=e.target.closest("[data-i]"); if(!b)return;
  wzGo(+b.dataset.i, +b.dataset.i<wzAt?"back":"next");
});
$("wzSfx").addEventListener("click",()=>{
  const on=SFX.toggle();
  $("wzSfxLab").textContent="เสียง: "+(on?"เปิด":"ปิด");
  $("wzSfx").classList.toggle("off",!on);
  if(on) SFX.play("tick");
});
$("wzSfxLab").textContent="เสียง: "+(SFX.on?"เปิด":"ปิด");
$("wzSfx").classList.toggle("off",!SFX.on);
document.addEventListener("keydown",e=>{
  if($("wz").hidden)return;
  if(e.key==="Escape") wzClose();
  else if(e.key==="ArrowRight"&&wzAt<WZ.length-1) wzGo(wzAt+1,"next");
  else if(e.key==="ArrowLeft"&&wzAt>0) wzGo(wzAt-1,"back");
});
/* เสียงคลิกเวลาเลือกตัวเลือก + อัปเดตสรุปสด */
document.addEventListener("click",e=>{
  if(e.target.closest(".chip")&&!e.target.closest(".chip.add")) SFX.play("tick");
  if(!$("wz").hidden) setTimeout(wzLive,0);
},true);
/* v41: ตัด "ratio" ออกจากรายการนี้ — เป็นการ์ด .chip แล้ว ตัวดักคลิกด้านบนจัดการให้ครบทั้ง
   เสียงคลิกและ wzLive() ไม่ต้องดัก change ซ้ำ */
["lens","weather","adFit"].forEach(id=>{
  const el=$(id); if(el) el.addEventListener("change",()=>{SFX.play("tick");if(!$("wz").hidden)wzLive()});
});

/* mountAllChips() ต้องมาก่อน sync() และต้องอยู่ที่นี่ ไม่ใช่ท้าย 20-chips.js — การ์ดโลเคชั่น
   อ่าน busOf() ที่พึ่ง BUSX (let ใน 50-map-intro.js ซึ่งโหลดหลัง 20-chips.js) ดูคอมเมนต์ที่นั่น */
mountAllChips();
sync();
renderBus();
mapInit(); mapGo(); mapNote(); renderRouteLegend();
/* ย้ายแผงเข้า/ออกหน้าต่างแนะนำแล้วขนาดกล่องเปลี่ยน ต้องบอก Leaflet ให้วัดใหม่ */
/* ค่าเริ่มต้นของโปรแกรม = โหมดแนะนำทีละขั้น (ปิดได้ที่สวิตช์ท้ายหน้าต่าง) */
if(startInWizard()) wzOpen(true);