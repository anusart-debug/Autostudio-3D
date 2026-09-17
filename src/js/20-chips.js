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

function chipHTML(item,pressed,custom){
  return '<button type="button" class="chip'+(custom?' cust':'')+'" data-id="'+esc(item.id)+'" aria-pressed="'+(pressed?'true':'false')+'">'+
    esc(item.th)+'<span class="en">'+esc(item.en||"")+'</span>'+
    (custom?'<span class="del" data-del="'+esc(item.id)+'" title="ลบรายการนี้">×</span>':'')+'</button>';
}
function addChipHTML(){
  return '<button type="button" class="chip add" data-add="1">＋ เพิ่มเอง</button>';
}

function renderChips(key){
  const el=$(CHIPHOST[key]);
  const items=list(key);
  const pressed=i=> key==="style" ? S.styles.has(i.id) : S[key]===i.id;
  el.innerHTML=items.map(i=>chipHTML(i,pressed(i),!!i.custom)).join("")+addChipHTML();
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

mountChips("vehicle");mountChips("loc");mountChips("angle");mountChips("light");mountChips("style",true);

function fillSelect(id,arr,sel){
  $(id).innerHTML=arr.map((x,i)=>'<option value="'+i+'"'+(i===sel?' selected':'')+'>'+esc(x.t)+'</option>').join("")+
    '<option value="__add__">＋ เพิ่มเอง…</option>';
  $(id).value=String(Math.min(sel,arr.length-1));
}
function refreshLens(){fillSelect("lens",lensList(),S.lens)}
function refreshWeather(){fillSelect("weather",weatherList(),S.weather)}
refreshLens();refreshWeather();
$("ratio").innerHTML=RATIOS.map((r,i)=>'<option value="'+i+'">'+r.t+'</option>').join("");

