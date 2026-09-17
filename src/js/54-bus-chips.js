/* ---- ชิปสายรถเมล์ ---- */
function renderBus(){
  const l=curLoc(), b=busOf(l);
  $("busCount").textContent=b.length+" สาย";
  $("busChips").innerHTML = b.length
    ? b.map((x,i)=>'<span class="busline"><b>'+esc(x)+'</b><span class="x" data-i="'+i+'" role="button" aria-label="ลบสาย '+esc(x)+'">×</span></span>').join("")
    : '<span class="dnaline" style="margin:0">ยังไม่มีสายรถเมล์สำหรับจุดนี้ — พิมพ์เพิ่มเองได้ในช่องด้านล่าง</span>';
  mapNote();
}
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

