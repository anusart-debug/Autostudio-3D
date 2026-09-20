/* ---------------- inputs ---------------- */
$("lens").addEventListener("change",e=>{if(e.target.value==="__add__"){refreshLens();openAdd("lens");return}S.lens=+e.target.value;sync()});
$("weather").addEventListener("change",e=>{if(e.target.value==="__add__"){refreshWeather();openAdd("weather");return}S.weather=+e.target.value;sync()});
/* v41: #ratio เปลี่ยนจาก <select> เป็นการ์ด (#ratioChips) — ตัวรับคลิกอยู่ที่ 20-chips.js แล้ว */
$("scale").addEventListener("input",e=>{S.scale=+e.target.value/100;sync()});
$("hdr").addEventListener("input",e=>{S.hdr=+e.target.value;sync()});
["artwork","detail","negative"].forEach(id=>$(id).addEventListener("input",sync));

/* ---- คีย์เวิร์ดยอดนิยมสำหรับ #detail (v41) — คลิกแทรกข้อความ คลิกซ้ำเพื่อลบ ----
   ไม่มี state แยกเก็บว่าคำไหน "เลือกอยู่" — เช็กจากข้อความในกล่องตรงๆ ทุกครั้ง (indexOf)
   ดังนั้นแก้ข้อความเองด้วยมือ (ลบคำออก) แล้วปุ่มจะไม่ติดค้างว่า "เลือกอยู่" ผิดๆ */
$("detailTags").innerHTML=DETAIL_TAGS.map(t=>
  '<button type="button" class="chip" data-tag="'+esc(t)+'">'+esc(t)+"</button>").join("");
function detailTagsSync(){
  const v=$("detail").value;
  $("detailTags").querySelectorAll("[data-tag]").forEach(b=>{
    b.setAttribute("aria-pressed",String(v.indexOf(b.dataset.tag)>=0));
  });
}
$("detailTags").addEventListener("click",e=>{
  const b=e.target.closest("[data-tag]"); if(!b)return;
  const tag=b.dataset.tag, el=$("detail");
  if(el.value.indexOf(tag)>=0){
    el.value=el.value.split(tag).join("").replace(/,\s*,/g,",").replace(/^[\s,]+|[\s,]+$/g,"");
  }else{
    el.value=el.value.trim()?el.value.trim()+", "+tag:tag;
  }
  detailTagsSync();sync();
});
$("detail").addEventListener("input",detailTagsSync);
detailTagsSync();

