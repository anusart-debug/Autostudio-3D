/* ---------------- upload ---------------- */
const drop=$("drop"), file=$("file");
drop.addEventListener("click",()=>file.click());
drop.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();file.click()}});
["dragenter","dragover"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add("over")}));
["dragleave","drop"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove("over")}));
drop.addEventListener("drop",e=>{const f=e.dataTransfer.files&&e.dataTransfer.files[0];if(f)readRef(f)});
file.addEventListener("change",e=>{const f=e.target.files&&e.target.files[0];if(f)readRef(f)});

function applyRefData(dataUrl, fileName, mimeType, vehicleId){
  S.refData=dataUrl; S.refFileName=fileName; S.refMime=mimeType||"image/png";
  $("refImg").src=dataUrl; $("refName").textContent=fileName; $("refBox").hidden=false;

  const probe=new Image();
  probe.onload=()=>{
    /* ขนาดจริงของภาพต้นฉบับ — ใช้เขียนสัดส่วนลงในคำสั่งตอนติ๊ก #srcRatio (30-prompt.js srcRatioClause())
       ต้องเก็บจากภาพจริง ห้ามใช้ ar จาก analyze() เพราะอันนั้นคือกรอบของตัวรถในภาพ ไม่ใช่กรอบของภาพ */
    S.refW=probe.naturalWidth||1000; S.refH=probe.naturalHeight||340;
    analyze(probe);
    /* ย่อภาพไว้ส่งเข้าโมเดล — กันไฟล์ใหญ่เกินและเร็วขึ้น */
    const M=1152, sc=Math.min(1,M/Math.max(S.refW,S.refH));
    const cv=document.createElement("canvas");
    cv.width=Math.round(S.refW*sc); cv.height=Math.round(S.refH*sc);
    const cx=cv.getContext("2d");
    cx.fillStyle="#ffffff"; cx.fillRect(0,0,cv.width,cv.height);   /* กันพื้นโปร่งใสกลายเป็นดำ */
    cx.drawImage(probe,0,0,cv.width,cv.height);
    try{
      /* JPEG เล็กกว่า PNG มาก — เซิร์ฟเวอร์ Kontext ดึงไปใช้ได้เร็วขึ้นชัดเจน */
      const durl=cv.toDataURL("image/jpeg",0.92);
      S.refB64=durl.split(",")[1]; S.refMime="image/jpeg";
    }catch(e){
      S.refB64=(S.refData||"").split(",")[1]||""; S.refMime=mimeType||"image/png";
    }

    if(vehicleId && list("vehicle").some(v=>v.id===vehicleId)){
      S.vehicle=vehicleId;
      renderChips("vehicle");
    }

    sync();
    toast(editMode()?"พร้อมแล้ว — ภาพสื่อจะถูกส่งเข้าโมเดลโดยตรง":"ถอด DNA จากภาพสื่อแล้ว: "+fileName);
  };
  probe.onerror=()=>toast("อ่านภาพไม่สำเร็จ",true);
  probe.src=dataUrl;
}

function readRef(f){
  if(!/^image\//.test(f.type)){toast("ไฟล์นี้ไม่ใช่รูปภาพ — รองรับ PNG, JPG, WEBP",true);return}
  const fr=new FileReader();
  fr.onload=()=>{
    applyRefData(fr.result, f.name, f.type||"image/png");
  };
  fr.readAsDataURL(f);
}
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"){
    if($("hoVeil")) $("hoVeil").hidden=true;
    if($("addVeil")) $("addVeil").hidden=true;
    if($("planbLibVeil")) $("planbLibVeil").hidden=true;
  }
});
$("refClear").addEventListener("click",()=>{
  S.refData=null;S.refFileName="";S.refExtra=[];S.refBody="";S.refOrient="";S.refB64="";S.refW=0;S.refH=0;
  $("refBox").hidden=true;$("dnaBlock").hidden=true;file.value="";sync();
});

