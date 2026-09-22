/* ---------------- review ---------------- */
const veil=$("veil");
function tick(ok){return '<span class="tick">'+(ok?
  '<svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>':
  '<svg viewBox="0 0 24 24"><path d="M12 8v5M12 16.5v.01"/><circle cx="12" cy="12" r="9"/></svg>')+'</span>'}
function row(ok,k,v,sub){
  return '<div class="checkrow'+(ok?'':' warn')+'">'+tick(ok)+'<span class="k">'+k+'</span>'+
    '<span class="v">'+v+(sub?'<em>'+sub+'</em>':'')+'</span></div>';
}
function readyRow(){
  if(adReady())
    return row(true,"Workflow","เปลี่ยนโฆษณาในสื่อ · แนบ 2 ภาพ",
      "คัดลอกคำสั่ง แล้วแนบภาพสื่อต้นแบบเป็นภาพที่ 1 และอาร์ตเวิร์กเป็นภาพที่ 2");
  if(hasSketch())
    return row(true,"Workflow","คงสื่อต้นแบบ · แนบ 1 ภาพ",
      "คัดลอกคำสั่ง แล้วแนบภาพสื่อต้นแบบไปพร้อมกัน AI จะคงรูปทรงและสีของสื่อไว้");
  return row(false,"Workflow","สร้างจากคำบรรยายล้วน",
    "ยังไม่ได้อัปโหลดภาพสื่อต้นแบบ — AI จะวาดสื่อขึ้นใหม่ ไม่ตรงของจริง");
}

function openReview(){
  const d=dims(), v=find(list("vehicle"),S.vehicle), l=find(list("loc"),S.loc),
        a=find(list("angle"),S.angle), li=find(list("light"),S.light);
  const styleNames=list("style").filter(s=>S.styles.has(s.id)).map(s=>s.en);
  const keepLocActive=(hasSketch()&&!hasAd()&&$("lockLoc").checked)||(adReady()&&$("adKeepScene").checked);
  const rows=[
    row(true,"Vehicle",v.th,v.en),
    keepLocActive
      ? row(true,"Location","คงจากภาพต้นแบบ (ไม่เปลี่ยน)","ไม่ใช้โลเคชั่นที่เลือกไว้ทางขวา — แต่งแสง-เงาแทน")
      : row(true,"Location",l.th,l.en+" · Bangkok"),
    row(true,"Camera",a.th,a.en+" · "+lensList()[S.lens].s),
    row(true,"Lighting",li.th,li.en+" · HDR "+S.hdr+"%"),
    row(styleNames.length>0,"Render",styleNames.length?styleNames.join(" + "):"ยังไม่ได้เลือกสไตล์การเรนเดอร์",
        styleNames.length?"":"ภาพอาจดูไม่สมจริงตามที่ต้องการ"),
    row(true,"Output",d.w+" × "+d.h+" px",RATIOS[S.ratio].t.split("—")[0].trim()+" · สเกล "+S.scale.toFixed(1)+"×"),
    readyRow()
  ];
  if(hasAd()){
    rows.splice(1,0,row(adMode(),"Artwork",
      adReady()?("เปลี่ยนโฆษณาในจุดเดิม"+($("adKeepScene").checked?" · คงโลเคชั่นเดิม":" · จัดฉากใหม่ด้วย")):"ยังไม่มีภาพสื่อต้นแบบ",
      adReady()?esc(S.adFileName):"อัปโหลดภาพสื่อต้นแบบในช่องบนด้วย"));
  }
  if(S.refData){
    const fid=+$("fidelity").value;
    const locks=[];
    if($("lockColor").checked) locks.push("สี "+hexName($("col1").value).name+" + "+hexName($("col2").value).name);
    if($("lockBody").checked) locks.push("สัดส่วนโครงสร้าง");
    if($("lockView").checked&&S.refOrient) locks.push("มุมมองตามต้นแบบ");
    if(keepLocActive) locks.push("โลเคชั่นเดิม (ไม่เปลี่ยนสถานที่)");
    rows.splice(1,0,row(fid>=30&&locks.length>0,"Reference",
      locks.length?("ล็อก "+locks.join(" · ")+" ที่ "+fid+"%"):"ไม่ได้ล็อกค่าใดจากภาพร่าง",
      locks.length?esc(S.refFileName):"ภาพที่ออกมาจะไม่อิงรถต้นแบบ — เปิดสวิตช์ในแผง 01B ก่อน"));
  }
  $("checklist").innerHTML=rows.join("");
  $("finalPrompt").textContent=activePrompt();
  $("finalPromptTH").textContent=activePromptTH();
  veil.hidden=false;
  $("revGo").focus();
}
$("reviewBtn").addEventListener("click",openReview);
$("revClose").addEventListener("click",()=>veil.hidden=true);
$("revBack").addEventListener("click",()=>veil.hidden=true);
veil.addEventListener("click",e=>{if(e.target===veil)veil.hidden=true});
document.addEventListener("keydown",e=>{
  if(e.key==="Escape") veil.hidden=true;
});
$("revGo").addEventListener("click",()=>{veil.hidden=true;$("handoffBtn").click()});

