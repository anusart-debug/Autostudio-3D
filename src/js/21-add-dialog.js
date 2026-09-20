/* ---------------- หน้าต่างเพิ่มรายการ ---------------- */
let addKey="loc";
function openAdd(key){
  addKey=key;
  $("addTitle").textContent="เพิ่ม"+CATNAME[key]+"ของคุณเอง";
  const h=CATHINT[key];
  $("addHint").innerHTML="ตัวอย่าง — ชื่อไทย <b>"+esc(h.ex)+"</b> · อังกฤษ <b>"+esc(h.en)+"</b><br>"+
    "คำอธิบายให้ AI: <code>"+esc(h.p)+"</code><br>"+
    "เขียนคำอธิบายเป็นภาษาอังกฤษให้ละเอียด ยิ่งบรรยายสิ่งที่เห็นในภาพชัด ผลลัพธ์ยิ่งตรง";
  resetAddForm();
  $("addTh").placeholder="เช่น "+h.ex;
  $("addEn").placeholder="เช่น "+h.en;
  $("addP").placeholder=h.p;
  $("addLLField").hidden=key!=="loc";
  renderMyList();
  $("addVeil").hidden=false;
  $("addTh").focus();
}
const IC={
  up:'<svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
  down:'<svg viewBox="0 0 24 24"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>',
  edit:'<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9a2 2 0 0 0-3-3L5 17v3Z"/><path d="M14.5 6.5 17.5 9.5"/></svg>',
  del:'<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  eye:'<svg viewBox="0 0 24 24"><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z"/><circle cx="12" cy="12" r="2.6"/></svg>',
  eyeoff:'<svg viewBox="0 0 24 24"><path d="M3 3l18 18"/><path d="M10.6 6.2A9.6 9.6 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3.3 3.8M6.4 8.2A17 17 0 0 0 2 12s3.6 6 10 6c1 0 1.9-.1 2.7-.4"/></svg>'
};
function ib(attr,title,icon){return '<button class="iconbtn" '+attr+' title="'+title+'">'+icon+'</button>'}

let editingId="";
function renderMyList(){
  const mine=CUSTOM[addKey]||[];
  const base=BASE[addKey]||null;
  $("myLabel").hidden=false;
  let h="";

  h+='<div class="seg"><h4>รายการที่คุณเพิ่ม ('+mine.length+')</h4><span></span></div>';
  h+= mine.length ? mine.map((x,i)=>
      '<div class="myrow'+(x.id===editingId?' editing':'')+'">'+
      '<span class="t">'+esc(x.th)+'<em>'+esc(x.p||"(ไม่มีคำอธิบาย)")+'</em></span>'+
      ib('data-up="'+esc(x.id)+'"'+(i===0?' disabled':''),"เลื่อนขึ้น",IC.up)+
      ib('data-down="'+esc(x.id)+'"'+(i===mine.length-1?' disabled':''),"เลื่อนลง",IC.down)+
      ib('data-ed="'+esc(x.id)+'"',"แก้ไข",IC.edit)+
      ib('data-rm="'+esc(x.id)+'"',"ลบ",IC.del)+'</div>').join("")
    : '<div class="empty" style="padding:10px">ยังไม่มีรายการที่เพิ่มเอง</div>';

  if(base){
    const hid=(HIDDEN[addKey]||[]).length;
    h+='<div class="seg"><h4>รายการมาตรฐาน ('+base.length+')</h4><span></span>'+
       (hid?'<button data-showall="1">แสดงทั้งหมดอีกครั้ง</button>':'')+'</div>';
    h+=base.map(x=>{
      const off=isHidden(addKey,x.id);
      return '<div class="myrow'+(off?' off':'')+'"><span class="t">'+esc(x.th)+
        '<em>'+esc(x.en||"")+'</em></span>'+
        ib('data-hide="'+esc(x.id)+'"',off?"เอากลับเข้าเมนู":"เอาออกจากเมนู",off?IC.eyeoff:IC.eye)+'</div>';
    }).join("");
  }
  $("myList").innerHTML=h;
}

function afterListChange(){
  saveCustom();renderMyList();
  if(addKey==="lens"){S.lens=Math.min(S.lens,lensList().length-1);refreshLens()}
  else if(addKey==="weather"){S.weather=Math.min(S.weather,weatherList().length-1);refreshWeather()}
  else{
    renderChips(addKey);
    /* v41: renderChips() แค่วาดชิปใหม่ ไม่เคยเรียก mapGo() เอง — เดิมทำให้แก้ไข/ลบ/จัดลำดับ
       โลเคชั่นแล้วแผนที่ยังค้างของเดิม ไม่ตามพิกัดที่พึ่งแก้ */
    if(addKey==="loc") mapGo();
  }
  sync();
}

$("myList").addEventListener("click",e=>{
  const btn=e.target.closest("button"); if(!btn||btn.disabled) return;
  const d=btn.dataset, arr=CUSTOM[addKey]||[];

  if(d.showall){HIDDEN[addKey]=[];try{store.set(HIDE_KEY,JSON.stringify(HIDDEN))}catch(x){}
    renderMyList();renderChips(addKey);sync();toast("นำรายการมาตรฐานกลับเข้าเมนูแล้ว");return}

  if(d.hide){toggleHidden(addKey,d.hide);renderMyList();renderChips(addKey);sync();return}

  if(d.rm){
    const it=arr.find(x=>x.id===d.rm);
    CUSTOM[addKey]=arr.filter(x=>x.id!==d.rm);
    S.styles.delete(d.rm);
    if(editingId===d.rm){editingId="";resetAddForm()}
    afterListChange();toast("ลบ \""+(it?it.th:"")+"\" แล้ว");
    return;
  }
  if(d.ed){
    const it=arr.find(x=>x.id===d.ed); if(!it)return;
    editingId=it.id;
    $("addTh").value=it.th;$("addEn").value=it.en||"";$("addP").value=it.p||"";
    $("addLL").value=(typeof it.lat==="number")?it.lat+", "+it.lng:"";
    $("addSave").innerHTML='<svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg> บันทึกการแก้ไข';
    renderMyList();$("addTh").focus();
    toast("กำลังแก้ไข \""+it.th+"\" — แก้แล้วกดบันทึก");
    return;
  }
  const mv=d.up?-1:d.down?1:0;
  if(mv){
    const id=d.up||d.down, i=arr.findIndex(x=>x.id===id), j=i+mv;
    if(i<0||j<0||j>=arr.length)return;
    arr.splice(j,0,arr.splice(i,1)[0]);
    afterListChange();
  }
});

function resetAddForm(){
  editingId="";
  $("addTh").value="";$("addEn").value="";$("addP").value="";$("addLL").value="";
  $("addSave").innerHTML='<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg> เพิ่มเข้ารายการ';
}
/* พิกัดที่พิมพ์/วางไว้ในช่อง "ละติจูด, ลองจิจูด" — คืน [lat,lng] ถ้าถูกต้อง, null ถ้าเว้นว่าง
   (ไม่ใส่ก็ได้ ลากปรับบนแผนที่ทีหลังได้เหมือนเดิม), false ถ้าใส่มาแต่รูปแบบผิด */
function parseAddLL(){
  const raw=$("addLL").value.trim();
  if(!raw) return null;
  const m=raw.split(/[,\s]+/).map(Number);
  if(m.length!==2||!m.every(isFinite)||m[0]<-90||m[0]>90||m[1]<-180||m[1]>180) return false;
  return m;
}
$("addExport").addEventListener("click",()=>{
  const blob=new Blob([JSON.stringify(CUSTOM,null,2)],{type:"application/json"});
  const u=URL.createObjectURL(blob), a=document.createElement("a");
  a.href=u;a.download="autostudio3d_รายการของฉัน.json";
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(u),3000);
  toast("สำรองไฟล์แล้ว — เก็บไว้กู้คืนได้ทุกเมื่อ");
});
$("addImport").addEventListener("click",()=>$("addImportFile").click());
$("addImportFile").addEventListener("change",e=>{
  const f=e.target.files&&e.target.files[0]; if(!f)return;
  const fr=new FileReader();
  fr.onload=()=>{
    try{
      const c=JSON.parse(fr.result);
      let n=0;
      Object.keys(CUSTOM).forEach(k=>{
        if(!Array.isArray(c[k]))return;
        const have=new Set(CUSTOM[k].map(x=>x.th));
        c[k].forEach(x=>{if(x&&x.th&&!have.has(x.th)){CUSTOM[k].push(x);n++}});
      });
      saveCustom();
      ["vehicle","loc","angle","light","style"].forEach(renderChips);
      refreshLens();refreshWeather();renderMyList();sync();
      toast(n?("กู้คืน "+n+" รายการแล้ว"):"ไม่มีรายการใหม่ในไฟล์นี้");
    }catch(err){toast("อ่านไฟล์ไม่สำเร็จ — ต้องเป็นไฟล์ที่สำรองจากแอปนี้",true)}
  };
  fr.readAsText(f);
  e.target.value="";
});
$("addClose").addEventListener("click",()=>$("addVeil").hidden=true);
$("addCancel").addEventListener("click",()=>$("addVeil").hidden=true);
$("addVeil").addEventListener("click",e=>{if(e.target.id==="addVeil")$("addVeil").hidden=true});
$("addSave").addEventListener("click",()=>{
  const th=$("addTh").value.trim(), en=$("addEn").value.trim(), p=$("addP").value.trim();
  if(!th){toast("ใส่ชื่อที่จะแสดงบนปุ่มก่อน",true);$("addTh").focus();return}

  /* v41: โลเคชั่นใหม่ใส่พิกัดตรงนี้ได้เลย (วางจาก Google Maps) แทนการต้องลากปรับบนแผนที่
     ทีหลังเสมอ — ตั้งใจให้พิมพ์เพิ่มโลเคชั่นได้เร็วในครั้งเดียว */
  let ll=null;
  if(addKey==="loc"){
    ll=parseAddLL();
    if(ll===false){
      toast("พิกัดไม่ถูกต้อง — ใส่เป็น ละติจูด, ลองจิจูด เช่น 13.7650, 100.5378",true);
      $("addLL").focus();return;
    }
  }

  if(editingId){                                   /* โหมดแก้ไขรายการเดิม */
    const it=(CUSTOM[addKey]||[]).find(x=>x.id===editingId);
    if(it){
      it.th=th;it.en=en||th;it.p=p||th;
      if(addKey==="loc"){ if(ll){it.lat=ll[0];it.lng=ll[1]} else {delete it.lat;delete it.lng} }
    }
    resetAddForm();afterListChange();
    toast("บันทึกการแก้ไขแล้ว");
    return;
  }

  const entry={id:"my_"+Date.now().toString(36),th:th,en:en||th,p:p||th,custom:true};
  if(addKey==="loc"&&ll){entry.lat=ll[0];entry.lng=ll[1]}
  CUSTOM[addKey]=(CUSTOM[addKey]||[]).concat([entry]);
  saveCustom();
  if(addKey==="lens"){refreshLens();S.lens=lensList().length-1;refreshLens()}
  else if(addKey==="weather"){refreshWeather();S.weather=weatherList().length-1;refreshWeather()}
  else{
    if(addKey==="style") S.styles.add(entry.id); else S[addKey]=entry.id;
    renderChips(addKey);
    /* v41: เลือกโลเคชั่นใหม่ที่พึ่งเพิ่มอัตโนมัติ แต่ renderChips() ไม่เรียก mapGo() เอง —
       ถ้าไม่เรียกเอง แผนที่จะยังค้างโลเคชั่นก่อนหน้าทั้งที่ชิปเปลี่ยนไปแล้ว */
    if(addKey==="loc") mapGo();
  }
  renderMyList();sync();resetAddForm();$("addTh").focus();
  toast("เพิ่ม \""+th+"\" แล้ว และเลือกให้อัตโนมัติ");
  if(!p) toast("แนะนำให้ใส่คำอธิบายภาษาอังกฤษด้วย ผลลัพธ์จะตรงกว่ามาก",true);
});

