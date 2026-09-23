/* ---- ชิปสายรถเมล์ ---- */
function renderBus(){
  const l=curLoc(), b=busOf(l);
  $("busCount").textContent=b.length+" สาย";
  $("busChips").innerHTML = b.length
    ? b.map((x,i)=>'<span class="busline"><b>'+esc(x)+'</b><span class="x" data-i="'+i+'" role="button" aria-label="ลบสาย '+esc(x)+'">×</span></span>').join("")
    : '<span class="dnaline" style="margin:0">ยังไม่มีสายรถเมล์สำหรับจุดนี้ — พิมพ์เพิ่มเองได้ในช่องด้านล่าง</span>';
  mapNote();
  renderBusSign();
}

/* v41: เลือกสายรถเมล์ที่วิ่งผ่านจุดนี้เพื่อใส่ป้ายหน้าจอ/ป้ายจุดหมายปลายทางในคำสั่งจริง — เห็นได้เฉพาะ
   ยานพาหนะที่เป็นรถเมล์จริง (isBusVehicle()) และค่าที่เลือกจะถูกล้างทิ้งเงียบๆ ถ้าย้ายไปโลเคชั่นที่
   ไม่มีสายนั้น (กันค่าเก่าค้างแล้วชี้ผิดสาย) */
function renderBusSign(){
  const field=$("busSignField"); if(!field) return;
  field.hidden=!isBusVehicle();
  if(!isBusVehicle()) return;
  const l=curLoc(), b=busOf(l);
  if(b.indexOf(S.busSign)<0) S.busSign="";
  $("busSignChips").innerHTML = b.length
    ? b.map(x=>'<button type="button" class="chip" data-ref="'+esc(x)+'" aria-pressed="'+(S.busSign===x?"true":"false")+'">'+esc(x)+"</button>").join("")
    : '<span class="dnaline" style="margin:0">จุดนี้ยังไม่มีข้อมูลสายรถเมล์</span>';
  const dest=S.busSign?destTextFor(l,S.busSign):null;
  $("busSignVal").textContent = !S.busSign ? "ยังไม่เลือก"
    : dest ? ("สาย "+S.busSign+": "+dest)
    : ("สาย "+S.busSign+" (ไม่มีข้อมูลปลายทาง)");
}
$("busSignChips").addEventListener("click",e=>{
  const b=e.target.closest("[data-ref]"); if(!b)return;
  const ref=b.dataset.ref;
  S.busSign = S.busSign===ref ? "" : ref;
  SFX.play("tick"); renderBusSign(); sync();
});
$("busChips").addEventListener("click",e=>{
  const x=e.target.closest(".x"); if(!x)return;
  const l=curLoc(), b=busOf(l);
  b.splice(+x.dataset.i,1); BUSX[l.id]=b; saveBus(); SFX.play("tick"); renderBus();
});
$("busAdd").addEventListener("keydown",e=>{
  if(e.key!=="Enter")return;
  e.preventDefault();
  const v=e.target.value.trim(); if(!v)return;
  const l=curLoc(), b=busOf(l);
  if(b.indexOf(v)>=0){toast("มีสาย "+v+" อยู่แล้ว",true);return}
  b.push(v); BUSX[l.id]=b; saveBus(); e.target.value=""; SFX.play("tick"); renderBus();
  toast("เพิ่มสาย "+v+" ให้ "+l.th+" แล้ว");
});
$("busReset").addEventListener("click",()=>{
  const l=curLoc();
  delete BUSX[l.id]; delete PINX[l.id]; saveBus(); savePin();
  renderBus(); mapGo(); toast("คืนค่าสายรถเมล์และตำแหน่งหมุดของ "+l.th+" แล้ว");
});
$("gmapBtn").addEventListener("click",()=>{
  const l=curLoc(), p=locPos(l);
  window.open("https://www.google.com/maps/search/?api=1&query="+p[0]+","+p[1],"_blank","noopener");
});

