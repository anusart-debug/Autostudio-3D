/* ---------------- อาร์ตเวิร์กโฆษณา (ภาพใบที่สอง) ---------------- */
const adDrop=$("adDrop"), adFile=$("adFile");
adDrop.addEventListener("click",()=>adFile.click());
adDrop.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();adFile.click()}});
["dragenter","dragover"].forEach(ev=>adDrop.addEventListener(ev,e=>{e.preventDefault();adDrop.classList.add("over")}));
["dragleave","drop"].forEach(ev=>adDrop.addEventListener(ev,e=>{e.preventDefault();adDrop.classList.remove("over")}));
adDrop.addEventListener("drop",e=>{const f=e.dataTransfer.files&&e.dataTransfer.files[0];if(f)readAd(f)});
adFile.addEventListener("change",e=>{const f=e.target.files&&e.target.files[0];if(f)readAd(f)});
function readAd(f){
  if(!/^image\//.test(f.type)){toast("ไฟล์นี้ไม่ใช่รูปภาพ",true);return}
  const fr=new FileReader();
  fr.onload=()=>{
    S.adData=fr.result;S.adFileName=f.name;
    $("adImg").src=fr.result;$("adName").textContent=f.name;$("adBox").hidden=false;
    const im=new Image();
    im.onload=()=>{
      const M=1152, sc=Math.min(1,M/Math.max(im.naturalWidth,im.naturalHeight));
      const cv=document.createElement("canvas");
      cv.width=Math.round(im.naturalWidth*sc);cv.height=Math.round(im.naturalHeight*sc);
      const cx=cv.getContext("2d");cx.fillStyle="#fff";cx.fillRect(0,0,cv.width,cv.height);
      cx.drawImage(im,0,0,cv.width,cv.height);
      try{S.adB64=cv.toDataURL("image/jpeg",0.92).split(",")[1];S.adMime="image/jpeg"}
      catch(e){S.adB64=(S.adData||"").split(",")[1]||"";S.adMime=f.type||"image/png"}
      sync();
      toast(adMode()?"พร้อมแล้ว — โหมดเปลี่ยนโฆษณาในจุดเดิม":"อัปโหลดอาร์ตเวิร์กแล้ว — อัปโหลดภาพสื่อในช่องบนด้วยจึงจะเปลี่ยนโฆษณาได้",!adMode());
    };
    im.src=fr.result;
  };
  fr.readAsDataURL(f);
}
$("adClear").addEventListener("click",()=>{
  S.adData=null;S.adB64="";S.adFileName="";$("adBox").hidden=true;adFile.value="";
  sync();toast("ลบอาร์ตเวิร์กแล้ว");
});
const AD_FIT_NOTE={
 relayout:"<b>เหมาะกับงานจริงที่สุด</b> — คน สินค้า โลโก้ และข้อความคงสัดส่วนจริงทุกชิ้น แต่ AI จะย้ายตำแหน่ง ย่อขยาย และจัดวางใหม่ให้เต็มกรอบป้าย เหมือนกราฟิกดีไซเนอร์ปรับคีย์วิชวลลงสื่อคนละขนาด",
 fit:"วางตามเลย์เอาต์เดิมเป๊ะ ถ้าสัดส่วนไม่ตรงกรอบ จะต่อพื้นหลังออกไปให้เต็มแทน เหมาะเมื่ออาร์ตเวิร์กออกแบบมาตรงขนาดสื่ออยู่แล้ว",
 stretch:"<b>ระวัง</b> — ยืดภาพให้เต็มกรอบ คนและสินค้าจะผอมหรืออ้วนผิดสัดส่วน ใช้เฉพาะตอนอยากดูคร่าวๆ เท่านั้น"
};
function updAdFit(){$("adFitNote").innerHTML=AD_FIT_NOTE[$("adFit").value]||""}
["adKeepScene","adFit"].forEach(id=>$(id).addEventListener("change",()=>{SFX.play("tick");updAdFit();sync()}));
updAdFit();

