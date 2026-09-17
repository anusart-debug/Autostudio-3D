/* ---------------- misc ---------------- */
document.querySelector(".ptabs").addEventListener("click",e=>{
  const b=e.target.closest(".ptab"); if(!b)return;
  try{store.set("as3d_plang",b.dataset.lang)}catch(x){}
  [...document.querySelectorAll(".ptab")].forEach(t=>t.classList.toggle("on",t===b));
  SFX.play("tick");sync();
  if(b.dataset.lang!=="en") toast("ฉบับไทยมีไว้อ่านตรวจสอบ — ระบบยังส่งฉบับอังกฤษให้ AI เพราะได้ผลแม่นกว่า");
});
(function(){const l=store.get("as3d_plang")||"en";
  document.querySelectorAll(".ptab").forEach(t=>t.classList.toggle("on",t.dataset.lang===l));})();

$("copyBtn").addEventListener("click",async()=>{
  try{await navigator.clipboard.writeText(activePrompt());toast("คัดลอก Prompt แล้ว")}
  catch(e){toast("คัดลอกไม่สำเร็จ — เลือกข้อความในช่อง Prompt Preview แล้วกด Ctrl+C",true)}
});

