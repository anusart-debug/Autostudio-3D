/* ---------------- upload ---------------- */
const drop=$("drop"), file=$("file");
drop.addEventListener("click",()=>file.click());
drop.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();file.click()}});
["dragenter","dragover"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add("over")}));
["dragleave","drop"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove("over")}));
drop.addEventListener("drop",e=>{const f=e.dataTransfer.files&&e.dataTransfer.files[0];if(f)readRef(f)});
file.addEventListener("change",e=>{const f=e.target.files&&e.target.files[0];if(f)readRef(f)});
function readRef(f){
  if(!/^image\//.test(f.type)){toast("ไฟล์นี้ไม่ใช่รูปภาพ — รองรับ PNG, JPG, WEBP",true);return}
  const fr=new FileReader();
  fr.onload=()=>{S.refData=fr.result;S.refFileName=f.name;
    $("refImg").src=fr.result;$("refName").textContent=f.name;$("refBox").hidden=false;
    S.refMime=f.type||"image/png";
    const probe=new Image();
    probe.onload=()=>{
      analyze(probe);
      /* ย่อภาพไว้ส่งเข้าโมเดล — กันไฟล์ใหญ่เกินและเร็วขึ้น */
      const M=1152, sc=Math.min(1,M/Math.max(probe.naturalWidth,probe.naturalHeight));
      const cv=document.createElement("canvas");
      cv.width=Math.round(probe.naturalWidth*sc);cv.height=Math.round(probe.naturalHeight*sc);
      const cx=cv.getContext("2d");
      cx.fillStyle="#ffffff";cx.fillRect(0,0,cv.width,cv.height);   /* กันพื้นโปร่งใสกลายเป็นดำ */
      cx.drawImage(probe,0,0,cv.width,cv.height);
      try{
        /* JPEG เล็กกว่า PNG มาก — เซิร์ฟเวอร์ Kontext ดึงไปใช้ได้เร็วขึ้นชัดเจน */
        const durl=cv.toDataURL("image/jpeg",0.92);
        S.refB64=durl.split(",")[1];S.refMime="image/jpeg";
      }catch(e){S.refB64=(S.refData||"").split(",")[1]||"";S.refMime=f.type||"image/png"}
      sync();
      toast(editMode()?"พร้อมแล้ว — ภาพร่างจะถูกส่งเข้าโมเดลโดยตรง":"ถอด DNA จากภาพร่างแล้ว — ตรวจสีในแผง 01B ก่อนเรนเดอร์");
    };
    probe.onerror=()=>toast("อ่านภาพไม่สำเร็จ",true);
    probe.src=fr.result;
  };
  fr.readAsDataURL(f);
}
document.addEventListener("keydown",e=>{if(e.key==="Escape"){$("hoVeil").hidden=true;$("addVeil").hidden=true}});
$("refClear").addEventListener("click",()=>{
  S.refData=null;S.refFileName="";S.refExtra=[];S.refBody="";S.refOrient="";S.refB64="";
  $("refBox").hidden=true;$("dnaBlock").hidden=true;file.value="";sync();
});

