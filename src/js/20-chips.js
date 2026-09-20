/* ---------------- chip builders ---------------- */
/* ---------------- รายการที่ผู้ใช้เพิ่มเอง ---------------- */
const CUSTOM_KEY="as3d_custom";
let CUSTOM={vehicle:[],loc:[],angle:[],light:[],style:[],lens:[],weather:[]};
try{
  const c=JSON.parse(store.get(CUSTOM_KEY)||"null");
  if(c&&typeof c==="object") Object.keys(CUSTOM).forEach(k=>{if(Array.isArray(c[k]))CUSTOM[k]=c[k]});
}catch(e){}
function saveCustom(){try{store.set(CUSTOM_KEY,JSON.stringify(CUSTOM))}catch(e){}}

/* ซ่อนรายการมาตรฐานที่ไม่ได้ใช้ ให้เมนูสั้นลง */
const HIDE_KEY="as3d_hidden";
let HIDDEN={};
try{HIDDEN=JSON.parse(store.get(HIDE_KEY)||"{}")||{}}catch(e){HIDDEN={}}
function isHidden(key,id){return !!(HIDDEN[key]&&HIDDEN[key].indexOf(id)>=0)}
function toggleHidden(key,id){
  HIDDEN[key]=HIDDEN[key]||[];
  const i=HIDDEN[key].indexOf(id);
  if(i>=0) HIDDEN[key].splice(i,1); else HIDDEN[key].push(id);
  try{store.set(HIDE_KEY,JSON.stringify(HIDDEN))}catch(e){}
}

const BASE={vehicle:VEHICLES,loc:LOCATIONS,angle:ANGLES,light:LIGHTS,style:STYLES};
function list(key){
  return BASE[key].filter(x=>!isHidden(key,x.id)).concat(CUSTOM[key]||[]);
}
function lensList(){return LENSES.concat((CUSTOM.lens||[]).map(c=>({v:c.p,t:c.th+(c.en?" ("+c.en+")":""),s:(c.en||c.th).toUpperCase().slice(0,12)})))}
function weatherList(){return WEATHERS.concat((CUSTOM.weather||[]).map(c=>({v:c.p,t:c.th+(c.en?" / "+c.en:"")})))}

const CHIPHOST={vehicle:"vehicleChips",loc:"locChips",angle:"angleChips",light:"lightChips",style:"styleChips"};
const CATNAME={vehicle:"ประเภทสื่อ",loc:"โลเคชั่น",angle:"มุมกล้อง",light:"แสงและเวลา",
               style:"สไตล์การเรนเดอร์",lens:"เลนส์",weather:"สภาพอากาศ"};
const CATHINT={
  vehicle:{ex:"ป้ายสามเหลี่ยมริมทางด่วน",en:"Expressway Trivision",p:"a three-sided rotating trivision billboard beside an elevated expressway"},
  loc:{ex:"แยกรัชโยธิน",en:"Ratchayothin Jct",p:"Ratchayothin intersection Bangkok, the elevated expressway ramp and tall condominium blocks behind"},
  angle:{ex:"มุมก้มจากสะพานลอย",en:"Skywalk Down",p:"shot downward from a pedestrian skywalk, looking onto the roof and road markings"},
  light:{ex:"ไฟสปอตงานเปิดตัว",en:"Launch Spotlight",p:"event launch spotlights crossing the bodywork, dark surroundings, theatrical beams"},
  style:{ex:"ภาพฟิล์มยุค 90",en:"90s Film",p:"shot on 90s film stock, visible grain, slightly faded colours"},
  lens:{ex:"14 มม. ฟิชอาย",en:"14mm Fisheye",p:"14mm fisheye lens with strong barrel distortion"},
  weather:{ex:"ฝุ่นตลบช่วงก่อสร้าง",en:"Dusty Site",p:"dusty construction-site air with fine particles catching the light"}
};

const IC_CLOCK='<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
const IC_PALETTE='<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.7-.9 1.4-1.8-.4-1.1.4-2.2 1.6-2.2H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10Z"/><circle cx="7.5" cy="12" r="1"/><circle cx="10" cy="8" r="1"/><circle cx="15" cy="8.5" r="1"/></svg>';
const IC_PIN='<svg viewBox="0 0 24 24"><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z"/><circle cx="12" cy="10" r="2.4"/></svg>';
const IC_TICK='<svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';

/* v41: การ์ดแบบมีข้อมูลประกอบสำหรับ "แสงและเวลา" กับ "โลเคชั่น" — สองหมวดนี้ผู้ใช้ต้องตัดสินใจ
   จากบริบท (ช่วงเวลาจริง/โทนสี, มีกี่สายรถเมล์ผ่าน) ไม่ใช่แค่ชื่อ จึงแสดงข้อมูลนั้นบนการ์ดเลย
   หมวดอื่นยังเป็นชิปข้อความสั้นเหมือนเดิม — ทุกแบบใช้ class .chip + data-id ชุดเดียวกัน
   กลไกเลือก/ลบ/เพิ่มเองใน mountChips() จึงไม่ต้องแก้อะไรเลย */
function lightCardHTML(item,pressed,custom){
  const g=item.g1?'style="background:linear-gradient(135deg,'+esc(item.g1)+','+esc(item.g2)+')"':'';
  return '<button type="button" class="chip card lightcard'+(custom?' cust':'')+'" data-id="'+esc(item.id)+
    '" aria-pressed="'+(pressed?'true':'false')+'">'+
    '<span class="cardtop" '+g+'>'+(item.time?'<span class="pill">'+IC_CLOCK+esc(item.time)+"</span>":"")+
      '<span class="tick">'+IC_TICK+"</span></span>"+
    '<span class="cardbody"><b>'+esc(item.th)+"</b>"+
      (item.en?'<span class="en">'+esc(item.en)+"</span>":"")+
      (item.mood?'<span class="meta">'+IC_PALETTE+esc(item.mood)+"</span>":"")+"</span>"+
    (custom?'<span class="del" data-del="'+esc(item.id)+'" title="ลบรายการนี้">×</span>':"")+"</button>";
}
function locCardHTML(item,pressed,custom){
  const n=busOf(item).length;
  return '<button type="button" class="chip card loccard'+(custom?' cust':'')+'" data-id="'+esc(item.id)+
    '" aria-pressed="'+(pressed?'true':'false')+'">'+
    '<span class="cardbody"><span class="loctop">'+IC_PIN+"<i>"+esc(item.th)+"</i>"+
      '<span class="tick">'+IC_TICK+"</span></span>"+
      (item.en?'<span class="en">'+esc(item.en)+"</span>":"")+
      '<span class="pill soft">'+(n?"ผ่าน "+n+" สายรถเมล์":"ยังไม่มีข้อมูลสายรถเมล์")+"</span></span>"+
    (custom?'<span class="del" data-del="'+esc(item.id)+'" title="ลบรายการนี้">×</span>':"")+"</button>";
}
function chipHTML(item,pressed,custom,key){
  if(key==="light") return lightCardHTML(item,pressed,custom);
  if(key==="loc") return locCardHTML(item,pressed,custom);
  return '<button type="button" class="chip'+(custom?' cust':'')+'" data-id="'+esc(item.id)+'" aria-pressed="'+(pressed?'true':'false')+'">'+
    esc(item.th)+'<span class="en">'+esc(item.en||"")+'</span>'+
    (custom?'<span class="del" data-del="'+esc(item.id)+'" title="ลบรายการนี้">×</span>':'')+'</button>';
}
function addChipHTML(key){
  const card=(key==="light"||key==="loc")?" card":"";
  return '<button type="button" class="chip add'+card+'" data-add="1">＋ เพิ่มเอง</button>';
}

function renderChips(key){
  const el=$(CHIPHOST[key]);
  const items=list(key);
  const pressed=i=> key==="style" ? S.styles.has(i.id) : S[key]===i.id;
  el.innerHTML=items.map(i=>chipHTML(i,pressed(i),!!i.custom,key)).join("")+addChipHTML(key);
  /* ถ้าตัวที่เลือกอยู่ถูกซ่อน/ลบไป ให้เด้งกลับตัวแรกที่เหลือ */
  if(key!=="style"&&items.length&&!items.some(i=>i.id===S[key])){S[key]=items[0].id;renderChips(key)}
}
function mountChips(key,multi){
  const el=$(CHIPHOST[key]);
  renderChips(key);
  el.addEventListener("click",e=>{
    const del=e.target.closest(".del");
    if(del){
      e.stopPropagation();
      const id=del.dataset.del;
      CUSTOM[key]=(CUSTOM[key]||[]).filter(x=>x.id!==id);
      saveCustom();
      if(multi) S.styles.delete(id); else if(S[key]===id) S[key]=BASE[key][0].id;
      renderChips(key);sync();toast("ลบรายการแล้ว");
      return;
    }
    const add=e.target.closest("[data-add]");
    if(add){openAdd(key);return}
    const b=e.target.closest(".chip"); if(!b||b.classList.contains("add")) return;
    const id=b.dataset.id;
    if(multi){
      if(S.styles.has(id)) S.styles.delete(id); else S.styles.add(id);
      b.setAttribute("aria-pressed",String(S.styles.has(id)));
    }else{
      S[key]=id;
      [...el.querySelectorAll(".chip")].forEach(c=>c.setAttribute("aria-pressed",String(c===b)));
      if(key==="loc"){renderBus();mapGo()}
    }
    sync();
  });
}

/* v41: ย้ายการ mount ชิปไปไว้ท้าย 63-wizard.js แทนที่จะเรียกตรงนี้ — การ์ดโลเคชั่นแบบใหม่
   ต้องอ่านจำนวนสายรถเมล์ผ่าน busOf() ซึ่งใช้ BUSX ที่เป็น let ใน 50-map-intro.js
   (โหลดทีหลังไฟล์นี้) let ไม่ hoist ข้ามไฟล์ เรียกตรงนี้จะพังทันทีตอนบูตด้วย TDZ */
function mountAllChips(){
  mountChips("vehicle");mountChips("loc");mountChips("angle");mountChips("light");mountChips("style",true);
}

function fillSelect(id,arr,sel){
  $(id).innerHTML=arr.map((x,i)=>'<option value="'+i+'"'+(i===sel?' selected':'')+'>'+esc(x.t)+'</option>').join("")+
    '<option value="__add__">＋ เพิ่มเอง…</option>';
  $(id).value=String(Math.min(sel,arr.length-1));
}
function refreshLens(){fillSelect("lens",lensList(),S.lens)}
function refreshWeather(){fillSelect("weather",weatherList(),S.weather)}
refreshLens();refreshWeather();
$("ratio").innerHTML=RATIOS.map((r,i)=>'<option value="'+i+'">'+r.t+'</option>').join("");

