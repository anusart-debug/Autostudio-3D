/* ---------- ทางที่ใช้ได้แน่นอน: เอา prompt ไปทำในเว็บที่ล็อกอินอยู่แล้ว ---------- */
$("handoffBtn").addEventListener("click",()=>{
  if(!S.refData) toast("ยังไม่ได้อัปโหลดภาพสื่อต้นแบบ — AI จะวาดสื่อขึ้นใหม่ ไม่ตรงของจริง",true);
  $("hoPrompt").textContent=activePrompt();   /* ตามโหมดจริง — เปลี่ยนโฆษณา หรือคงสื่อต้นแบบ */
  $("hoSave").hidden=!hasSketch();
  $("hoSaveAd").hidden=!hasAd();
  renderDests();
  $("hoVeil").hidden=false;
});
$("hoClose").addEventListener("click",()=>$("hoVeil").hidden=true);
$("hoDone").addEventListener("click",()=>$("hoVeil").hidden=true);
$("hoVeil").addEventListener("click",e=>{if(e.target.id==="hoVeil")$("hoVeil").hidden=true});
$("hoSave").addEventListener("click",()=>{
  const a=document.createElement("a");
  a.href="data:"+S.refMime+";base64,"+S.refB64;
  a.download="autostudio3d_reference_"+(S.refFileName||"bus").replace(/\.[^.]+$/,"")+".jpg";
  document.body.appendChild(a);a.click();a.remove();
  toast("บันทึกภาพต้นแบบแล้ว — ลากไฟล์นี้ไปแนบในแชทได้เลย");
});
$("hoSaveAd").addEventListener("click",()=>{
  const a=document.createElement("a");
  a.href="data:"+S.adMime+";base64,"+S.adB64;
  a.download="autostudio3d_artwork_"+(S.adFileName||"ad").replace(/\.[^.]+$/,"")+".jpg";
  document.body.appendChild(a);a.click();a.remove();
  toast("บันทึกอาร์ตเวิร์กแล้ว — แนบเป็นไฟล์ที่สองต่อจากภาพสื่อ");
});
$("hoCopy").addEventListener("click",async()=>{
  try{await navigator.clipboard.writeText($("hoPrompt").textContent);toast("คัดลอกคำสั่งแล้ว")}
  catch(e){
    const r=document.createRange();r.selectNodeContents($("hoPrompt"));
    const s=window.getSelection();s.removeAllRanges();s.addRange(r);
    toast("เลือกข้อความให้แล้ว กด Ctrl+C เพื่อคัดลอก",true);
  }
});

