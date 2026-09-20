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

/* v41: ไอคอนภาพร่างสำหรับ "ประเภทสื่อ" (02) และ "สไตล์การเรนเดอร์" (08) — คีย์ตรงกับ id จริง
   ใน VEHICLES/STYLES (10-data.js) ทุกตัวอักษร รายการที่ผู้ใช้เพิ่มเอง (ไม่มี id เหล่านี้) จะได้
   ไอคอนสำรอง (*_ICON_DEFAULT) แทนแทนที่จะพัง — เป็นข้อมูลแสดงผลล้วน ไม่แตะ p ที่ส่งให้ AI เลย */
const VEHICLE_ICONS={
  wrap:'<svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="9" rx="2"/><path d="M2 12.5h20"/><circle cx="7" cy="19" r="1.7" fill="currentColor" stroke="none"/><circle cx="17" cy="19" r="1.7" fill="currentColor" stroke="none"/></svg>',
  dd:'<svg viewBox="0 0 24 24"><rect x="3" y="3.5" width="18" height="7" rx="1.4"/><rect x="3" y="11" width="18" height="7" rx="1.4"/><circle cx="7" cy="20.3" r="1.5" fill="currentColor" stroke="none"/><circle cx="17" cy="20.3" r="1.5" fill="currentColor" stroke="none"/></svg>',
  bus3d:'<svg viewBox="0 0 24 24"><rect x="2" y="8" width="20" height="9" rx="2"/><path d="M6.5 8v9M17.5 8v9"/><circle cx="7" cy="19" r="1.7" fill="currentColor" stroke="none"/><circle cx="17" cy="19" r="1.7" fill="currentColor" stroke="none"/></svg>',
  shelter:'<svg viewBox="0 0 24 24"><path d="M3 20V10l9-5 9 5v10"/><path d="M3 10.5h18"/><rect x="7.5" y="12.5" width="9" height="7.5"/></svg>',
  muvmi:'<svg viewBox="0 0 24 24"><path d="M3.5 17V12a2 2 0 0 1 2-2h6l4 2h4a2 2 0 0 1 2 2v3Z"/><circle cx="7.5" cy="19" r="1.7" fill="currentColor" stroke="none"/><circle cx="16" cy="19" r="1.7" fill="currentColor" stroke="none"/></svg>',
  billboard:'<svg viewBox="0 0 24 24"><rect x="2.5" y="4" width="19" height="10.5" rx="1"/><path d="M8 14.5v5.5M16 14.5v5.5"/></svg>',
  ledscreen:'<svg viewBox="0 0 24 24"><rect x="2.5" y="4" width="19" height="12.5" rx="1.5"/><path d="M8 20h8M12 16.5v3.5"/></svg>'
};
const VEHICLE_ICON_DEFAULT='<svg viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="9" rx="2"/><circle cx="8" cy="19" r="1.6" fill="currentColor" stroke="none"/><circle cx="16" cy="19" r="1.6" fill="currentColor" stroke="none"/></svg>';
const STYLE_ICONS={
  ue5:'<svg viewBox="0 0 24 24"><path d="M12 2.5l2.3 6.4L21 11l-6.7 2.1L12 21.5l-2.3-6.4L3 11l6.7-2.1Z"/></svg>',
  octane:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(28 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(-28 12 12)"/></svg>',
  hdr:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/></svg>',
  hyper:'<svg viewBox="0 0 24 24"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="2.6"/></svg>',
  auto:'<svg viewBox="0 0 24 24"><path d="M4 16V8.5a2 2 0 0 1 2-2h9l5 5v4.5"/><circle cx="7.5" cy="17" r="1.8"/><circle cx="17.5" cy="17" r="1.8"/></svg>',
  clean:'<svg viewBox="0 0 24 24"><circle cx="9" cy="7" r="2.3"/><path d="M4.2 20c0-3.3 2.1-6 4.8-6s4.8 2.7 4.8 6"/><path d="M4 4l16 16"/></svg>',
  cine:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7.5 5v14M16.5 5v14"/><path d="M3 9.3h4.5M3 15.3h4.5M16.5 9.3H21M16.5 15.3H21"/></svg>',
  ray:'<svg viewBox="0 0 24 24"><rect x="9.5" y="3" width="5" height="18" rx="1.6"/><path d="M4 8l5.5 4-5.5 4M20 8l-5.5 4 5.5 4"/></svg>',
  trails:'<svg viewBox="0 0 24 24"><path d="M2.5 8h11M2.5 12h15M2.5 16h9"/></svg>'
};
const STYLE_ICON_DEFAULT='<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z"/></svg>';

/* v41: ภาพร่างมุมกล้อง (05) — วาดสดจาก ic ที่ตั้งไว้ในแต่ละรายการของ ANGLES (10-data.js)
   แทนไอคอนคงที่ เพราะแต่ละมุมต่างกันที่ "ตำแหน่งกล้องเทียบกับตัวรถ" ไม่ใช่แค่รูปสัญลักษณ์เดียว
   โครงร่างรถ+เส้นพื้น วาดเหมือนกันทุกใบ ต่างแค่จุดกล้อง/เส้นเล็ง/ไอคอนเสริมตาม k
   รายการที่ผู้ใช้เพิ่มเอง (ไม่มี ic) จะได้ตำแหน่งกล้องเริ่มต้นแทนที่จะพัง */
function angleIconSVG(ic){
  ic=ic||{};
  const cam=ic.cam||[10,24], look=ic.look||[22,24], k=ic.k||"cam";
  let extra="";
  if(k==="detail"){
    extra+='<circle cx="'+cam[0]+'" cy="'+cam[1]+'" r="4" fill="none" stroke-width="1.5"/>'+
      '<path d="M'+(cam[0]+2.8)+' '+(cam[1]+2.8)+'L'+(cam[0]+6.2)+' '+(cam[1]+6.2)+'" stroke-width="1.7" stroke-linecap="round"/>'+
      '<rect x="'+(look[0]-3)+'" y="'+(look[1]-3)+'" width="6" height="6" fill="none" stroke-width="1" stroke-dasharray="1.4 1.4"/>';
  }else{
    extra+='<circle cx="'+cam[0]+'" cy="'+cam[1]+'" r="2.6" fill="currentColor" stroke="none"/>'+
      '<path d="M'+cam[0]+' '+cam[1]+'L'+look[0]+' '+look[1]+'" stroke-width="1" stroke-dasharray="2 2"/>';
    if(k==="drone"){
      extra+='<path d="M'+(cam[0]-4)+' '+(cam[1]-3)+'q4 -3 8 0" fill="none" stroke-width="1.2"/>'+
        '<path d="M'+(cam[0]-3)+' '+(cam[1]-6)+'q3 -2 6 0" fill="none" stroke-width="1.2"/>';
    }else if(k==="eye"){
      extra+='<path d="M'+(cam[0]-3)+' '+cam[1]+'h6" stroke-width="1"/>';
    }else if(k==="track"){
      extra+='<path d="M'+(cam[0]-8)+' '+(cam[1]-3)+'h4M'+(cam[0]-8)+' '+cam[1]+'h4M'+(cam[0]-8)+' '+(cam[1]+3)+'h4" stroke-width="1.1" stroke-linecap="round"/>';
    }
  }
  return '<svg viewBox="0 0 64 44" fill="none" stroke="currentColor">'+
    '<path d="M4 36h56" stroke-width="1" opacity=".35"/>'+
    '<rect x="20" y="18" width="28" height="16" rx="3" stroke-width="1.6"/>'+
    '<path d="M24 18v6" stroke-width="1.6"/>'+
    '<circle cx="26" cy="36" r="3" fill="currentColor" stroke="none"/><circle cx="44" cy="36" r="3" fill="currentColor" stroke="none"/>'+
    extra+
  '</svg>';
}

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
/* v41: การ์ดไอคอนสำหรับประเภทสื่อ/มุมกล้อง/สไตล์ — โครงเดียวกับ .ratiocard (icotop+cardbody)
   ใช้ .chip.card ที่มีอยู่แล้วเป็นฐาน (padding:0, flex-column, cardbody b/.en) ต่างแค่ CSS
   ของกล่องไอคอนด้านบน (.icotop ใน styles.css) ไม่มี pill/meta เพิ่มเพราะไม่มีข้อมูลบริบทแบบ
   แสงหรือโลเคชั่นให้โชว์ แค่ไอคอนช่วยจำเป็นภาพ */
function vehicleCardHTML(item,pressed,custom){
  return '<button type="button" class="chip card icocard'+(custom?' cust':'')+'" data-id="'+esc(item.id)+
    '" aria-pressed="'+(pressed?'true':'false')+'">'+
    '<span class="icotop">'+(VEHICLE_ICONS[item.id]||VEHICLE_ICON_DEFAULT)+'</span>'+
    '<span class="cardbody"><b>'+esc(item.th)+'</b>'+(item.en?'<span class="en">'+esc(item.en)+'</span>':'')+'</span>'+
    (custom?'<span class="del" data-del="'+esc(item.id)+'" title="ลบรายการนี้">×</span>':'')+'</button>';
}
function angleCardHTML(item,pressed,custom){
  return '<button type="button" class="chip card icocard anglecard'+(custom?' cust':'')+'" data-id="'+esc(item.id)+
    '" aria-pressed="'+(pressed?'true':'false')+'">'+
    '<span class="icotop">'+angleIconSVG(item.ic)+'</span>'+
    '<span class="cardbody"><b>'+esc(item.th)+'</b>'+(item.en?'<span class="en">'+esc(item.en)+'</span>':'')+'</span>'+
    (custom?'<span class="del" data-del="'+esc(item.id)+'" title="ลบรายการนี้">×</span>':'')+'</button>';
}
function styleCardHTML(item,pressed,custom){
  return '<button type="button" class="chip card icocard'+(custom?' cust':'')+'" data-id="'+esc(item.id)+
    '" aria-pressed="'+(pressed?'true':'false')+'">'+
    '<span class="icotop">'+(STYLE_ICONS[item.id]||STYLE_ICON_DEFAULT)+'</span>'+
    '<span class="cardbody"><b>'+esc(item.th)+'</b>'+(item.en?'<span class="en">'+esc(item.en)+'</span>':'')+'</span>'+
    (custom?'<span class="del" data-del="'+esc(item.id)+'" title="ลบรายการนี้">×</span>':'')+'</button>';
}
function chipHTML(item,pressed,custom,key){
  if(key==="light") return lightCardHTML(item,pressed,custom);
  if(key==="loc") return locCardHTML(item,pressed,custom);
  if(key==="vehicle") return vehicleCardHTML(item,pressed,custom);
  if(key==="angle") return angleCardHTML(item,pressed,custom);
  if(key==="style") return styleCardHTML(item,pressed,custom);
  return '<button type="button" class="chip'+(custom?' cust':'')+'" data-id="'+esc(item.id)+'" aria-pressed="'+(pressed?'true':'false')+'">'+
    esc(item.th)+'<span class="en">'+esc(item.en||"")+'</span>'+
    (custom?'<span class="del" data-del="'+esc(item.id)+'" title="ลบรายการนี้">×</span>':'')+'</button>';
}
function addChipHTML(key){
  const card=(key==="light"||key==="loc"||key==="vehicle"||key==="angle"||key==="style")?" card":"";
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

/* ---- การ์ดเลือกอัตราส่วนภาพ (v41) — เดิมเป็น <select> ที่อ่านยากว่าอันไหนเหมาะกับงานไหน ----
   การ์ดโชว์รูปทรงจริงตามสัดส่วน + ปลายทางที่เอาไปใช้ + ขนาดพิกเซลที่จะเขียนลงในคำสั่งจริง
   (ไม่โชว์ --ar ของ Midjourney เพราะปลายทาง AI ทั้ง 13 เจ้าในแอปนี้ไม่มี Midjourney เลย
   ใส่ไปจะถูกพิมพ์ออกมาเป็นตัวอักษรเฉยๆ — ดู README หัวข้ออัตราส่วน)
   ใช้ class .chip เหมือนหมวดอื่น เสียงคลิก/อัปเดตสรุปสดในโหมดแนะนำจึงทำงานเองอัตโนมัติ */
function renderRatioCards(){
  $("ratioChips").innerHTML=RATIOS.map((r,i)=>{
    /* กล่องพรีวิวสูงคงที่ 34px กว้างตามสัดส่วนจริง แต่ไม่เกิน 58px กันจอกว้างพิเศษล้นการ์ด */
    const h=34, w=Math.min(58,Math.round(h*r.w/r.h));
    return '<button type="button" class="chip card ratiocard" data-i="'+i+'" aria-pressed="'+
      (S.ratio===i?"true":"false")+'">'+
      '<span class="shape"><i style="width:'+w+'px;height:'+h+'px"></i></span>'+
      '<span class="cardbody"><b>'+esc(r.ar)+"</b>"+
        (r.use?'<span class="meta">'+esc(r.use)+"</span>":"")+
        '<span class="px">'+r.w+" × "+r.h+"</span></span></button>";
  }).join("");
}
$("ratioChips").addEventListener("click",e=>{
  const b=e.target.closest("[data-i]"); if(!b)return;
  S.ratio=+b.dataset.i;
  [...$("ratioChips").querySelectorAll(".chip")].forEach(c=>c.setAttribute("aria-pressed",String(c===b)));
  sync();
});
renderRatioCards();

/* ---- "คำสั่งพร้อมใช้งาน" (v41) — แถบปุ่มลัดใต้เฮดเดอร์ คลิกครั้งเดียวตั้งประเภทสื่อ/โลเคชั่น/
   มุมกล้อง/แสง/สภาพอากาศครบตาม PRESETS (10-data.js) แทนการไล่กดทีละแผง 2-4-5-6 เอง
   ไม่แตะ styles/ratio/lens — ปล่อยเป็นค่าที่ผู้ใช้ตั้งไว้อยู่แล้ว เพราะพรีเซ็ตนี้เน้นแค่ "ฉากคืออะไร"
   ไม่ใช่ "จะเรนเดอร์แบบไหน" ผู้ใช้ยังปรับต่อได้ทุกช่องตามปกติหลังกด */
function renderPresets(){
  $("presetScroll").innerHTML=PRESETS.map(p=>
    '<button type="button" class="presetchip" data-preset="'+esc(p.id)+'">'+esc(p.label)+"</button>").join("");
}
function applyPreset(id){
  const p=PRESETS.find(x=>x.id===id); if(!p) return;
  S.vehicle=p.vehicle; S.loc=p.loc; S.angle=p.angle; S.light=p.light;
  if(p.weather!=null) S.weather=p.weather;
  if(p.detail) $("detail").value=p.detail;
  ["vehicle","angle","light"].forEach(renderChips);
  renderChips("loc"); renderBus(); mapGo();
  refreshWeather(); detailTagsSync();
  sync();
  toast("ตั้งค่าอัตโนมัติแล้ว: "+p.label);
}
$("presetScroll").addEventListener("click",e=>{
  const b=e.target.closest("[data-preset]"); if(!b)return;
  applyPreset(b.dataset.preset);
});
renderPresets();

