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

/* v41.2: จานสีการ์ดไอคอน (ประเภทสื่อ/มุมกล้อง/สไตล์) — ผู้ใช้ส่ง mockup ไอคอนสื่อ Plan B
   ทรงสี่เหลี่ยมมุมโค้งไล่สีสันสดใส ป้ายชื่อทึบด้านล่าง มาให้ใช้เป็นแบบ ไล่สีตามลำดับ (index)
   ไม่ผูกกับ id ตายตัว เพราะรายการที่ผู้ใช้เพิ่มเองต่อท้ายก็ควรได้สีต่อคิวไปด้วยเช่นกัน */
const TILE_PALETTE=[
  ["#2E86F5","#123B7A"],["#4FC3E8","#1B5F8C"],["#14B8A6","#0B5F63"],
  ["#8B5CF6","#4C2E8F"],["#EF4444","#7A1F1F"],["#F5A623","#B5540A"],
  ["#1E3A6E","#0B1830"],["#10B981","#065F46"],["#EC4899","#7A1D57"],
  ["#64748B","#1E293B"]
];
function tileGrad(idx){ return TILE_PALETTE[((idx%TILE_PALETTE.length)+TILE_PALETTE.length)%TILE_PALETTE.length] }

const IC_CLOCK='<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
const IC_PALETTE='<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.7-.9 1.4-1.8-.4-1.1.4-2.2 1.6-2.2H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10Z"/><circle cx="7.5" cy="12" r="1"/><circle cx="10" cy="8" r="1"/><circle cx="15" cy="8.5" r="1"/></svg>';
const IC_PIN='<svg viewBox="0 0 24 24"><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z"/><circle cx="12" cy="10" r="2.4"/></svg>';
const IC_TICK='<svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';

/* v41.3: ไอคอนตามภาพตัวอย่างที่ผู้ใช้ส่งมา (สกรีนช็อตแอปจริงพร้อม icon ที่ต้องการเป๊ะๆ) —
   คีย์ตรงกับ id จริงใน VEHICLES/ANGLES/STYLES (10-data.js) ทุกตัวอักษร รายการที่ผู้ใช้เพิ่มเอง
   (ไม่มี id เหล่านี้) จะได้ไอคอนสำรอง (*_ICON_DEFAULT) แทนแทนที่จะพัง — เป็นข้อมูลแสดงผลล้วน
   ไม่แตะ p ที่ส่งให้ AI เลย มุมกล้อง (05) เปลี่ยนจากไดอะแกรมคำนวณสดจาก ic เป็นไอคอนคงที่ต่อรายการ
   แบบเดียวกับอีก 2 หมวด เพราะภาพตัวอย่างใหม่ใช้ภาพนิ่งเฉพาะต่อมุมจริงๆ ไม่ใช่ระบบคำนวณตำแหน่ง
   (ฟิลด์ ic ใน ANGLES ยังอยู่เผื่อใช้ในอนาคต แต่ไม่มีใครอ่านแล้วตอนนี้) */
const VEHICLE_ICONS={
  wrap:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="7" width="20" height="9" rx="2"/><rect x="3" y="8.2" width="4" height="6.6" fill="#EF4444" stroke="none"/><rect x="7.3" y="8.2" width="4" height="6.6" fill="#F5C542" stroke="none"/><rect x="11.6" y="8.2" width="4" height="6.6" fill="#22C55E" stroke="none"/><rect x="15.9" y="8.2" width="4.1" height="6.6" fill="#2E86F5" stroke="none"/><circle cx="7" cy="19" r="1.7" fill="currentColor" stroke="none"/><circle cx="17" cy="19" r="1.7" fill="currentColor" stroke="none"/></svg>',
  dd:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3.5" width="18" height="7" rx="1.3"/><rect x="3" y="10.7" width="18" height="7" rx="1.3"/><path d="M6.5 3.5v7M11 3.5v7M15.5 3.5v7M6.5 10.7v7M11 10.7v7M15.5 10.7v7" opacity=".5" stroke-width="1"/><circle cx="7" cy="20.3" r="1.5" fill="currentColor" stroke="none"/><circle cx="17" cy="20.3" r="1.5" fill="currentColor" stroke="none"/></svg>',
  bus3d:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="8" width="20" height="9" rx="2"/><path d="M6.5 8v9M17.5 8v9"/><circle cx="7" cy="19" r="1.7" fill="currentColor" stroke="none"/><circle cx="17" cy="19" r="1.7" fill="currentColor" stroke="none"/></svg>',
  shelter:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-5 9 5" stroke-linecap="round" stroke-linejoin="round"/><rect x="4.5" y="9" width="15" height="10.5" rx=".6"/><path d="M7 9v10.5M17 9v10.5" opacity=".5"/><rect x="9" y="11.5" width="6" height="5.5" rx=".4" opacity=".7"/></svg>',
  muvmi:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 17v-4.5a2 2 0 0 1 2-2h5.5l3.5 2h4a2 2 0 0 1 2 2V17" stroke-linejoin="round"/><path d="M6 10.5c0-2 1.5-3.3 3.5-3.3h2" opacity=".7"/><circle cx="7.5" cy="19" r="1.7" fill="currentColor" stroke="none"/><circle cx="16" cy="19" r="1.7" fill="currentColor" stroke="none"/></svg>',
  billboard:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="6" cy="6.5" r=".9" fill="currentColor" stroke="none"/><circle cx="12" cy="5.5" r=".9" fill="currentColor" stroke="none"/><circle cx="18" cy="6.5" r=".9" fill="currentColor" stroke="none"/><rect x="3" y="8" width="18" height="12" rx="1.2"/><circle cx="15.5" cy="12" r="1.6"/><path d="M4.5 18.5l4-5 3 3.3 3.5-4.3 5 6" stroke-linejoin="round" stroke-linecap="round"/></svg>',
  ledscreen:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="4.5" r=".8" fill="currentColor" stroke="none"/><circle cx="12" cy="3.5" r=".8" fill="currentColor" stroke="none"/><circle cx="16" cy="4.5" r=".8" fill="currentColor" stroke="none"/><rect x="3" y="6.5" width="18" height="12" rx="1.2"/><path d="M6 13c1.5-3 2.5 3 4-2 1.2-4 2 5 3.2 0 1-3.5 2 1 4.8-1" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.2"/><path d="M10 21.5h4" stroke-linecap="round"/></svg>'
};
const VEHICLE_ICON_DEFAULT='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="8" width="18" height="9" rx="2"/><circle cx="8" cy="19" r="1.6" fill="currentColor" stroke="none"/><circle cx="16" cy="19" r="1.6" fill="currentColor" stroke="none"/></svg>';

const STYLE_ICONS={
  ue5:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9.5"/><path d="M8.5 8v6a3.5 3.5 0 0 0 7 0V8" stroke-width="1.8"/></svg>',
  octane:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="M7 15l4-10 3 6 3-4-3 10-3-6-4 4Z"/></svg>',
  hdr:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="6.5" width="19" height="13" rx="2"/><rect x="8" y="3.5" width="5" height="3.5" rx=".8"/><circle cx="12" cy="13" r="4.2"/><path d="M12 8.8v1.4M12 16v1.4M8.4 10.6l1.2.7M14.4 15.7l1.2.7M8.4 15.4l1.2-.7M14.4 10.3l1.2-.7" stroke-width="1.1"/></svg>',
  hyper:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><path d="M12 3c4.5 0 7.5 3.4 7.5 8 0 3.6-1.7 6.6-4 9-1 1-2.3 1-3-.2-.5-.9-.2-1.8.5-2.6 1.4-1.6 2.2-3.6 2.2-6.2 0-3-2-5-5.2-5S6.8 8 6.8 11c0 1.7.6 3 1.6 4.2"/><path d="M9 15.5c-1.3-1.3-2.2-3-2.2-5 0-3.8 2.6-6.5 6.2-6.5"/><path d="M12 9.5c1.7 0 2.8 1.1 2.8 2.8 0 1.6-.7 2.8-1.7 4"/></svg>',
  auto:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 15.5v-1.3c0-.5.3-1 .8-1.2l3-1.4c.5-.5 1.2-.8 1.9-.8h6.6c.7 0 1.4.2 1.9.7l2.3 1.9c.3.2.5.6.5 1v1.1"/><path d="M3 15.5h18v1.5H3Z"/><circle cx="7.5" cy="17.3" r="1.9" fill="currentColor" stroke="none"/><circle cx="16.5" cy="17.3" r="1.9" fill="currentColor" stroke="none"/></svg>',
  clean:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="5.5" r="2.2" fill="currentColor" stroke="none"/><path d="M7 8v7M7 10l-3 2M7 10l3.5 1.5M7 15l-2.5 5M7 15l3 5"/><path d="M13 6h8l-3 3 3 3h-8Z"/></svg>',
  cine:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><circle cx="11" cy="6.5" r="1.6"/><circle cx="15.5" cy="11" r="1.6"/><circle cx="11" cy="15.5" r="1.6"/><circle cx="6.5" cy="11" r="1.6"/><circle cx="11" cy="11" r="1.4" fill="currentColor" stroke="none"/><path d="M17 16c2 1 3.5 2.8 4.5 5"/></svg>',
  ray:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4l6 3v6l-6 3-6-3V7Z"/><path d="M9 4v9M3 7l6 3 6-3"/><path d="M17 6l3.5-1.5M18.5 10l3.5 1M17 15l3 2" stroke-width="1.2"/></svg>',
  trails:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M2 8c3-3 5 3 8 0s5 3 8 0 4-1 4-1"/><path d="M2 12c3-3 5 3 8 0s5 3 8 0 4-1 4-1" opacity=".7"/><path d="M2 16c3-3 5 3 8 0s5 3 8 0 4-1 4-1" opacity=".45"/></svg>'
};
const STYLE_ICON_DEFAULT='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z"/></svg>';

/* v41.3: ภาพร่างมุมกล้อง (05) — ไอคอนคงที่ต่อมุมกล้อง 1 รูปต่อรายการ (ตามภาพตัวอย่างที่ผู้ใช้
   ส่งมา ไม่ใช่ไดอะแกรมคำนวณสดแบบเดิม) กล้อง/รถ/คนเดินถนนวาดเป็น <g> ย่อยแยกส่วน ประกอบใน
   viewBox 0 0 64 44 เดียวกันทุกใบให้ขนาด/ตำแหน่งสัมพัทธ์ในการ์ดเท่ากัน */
const ANGLE_ICONS={
  hero34:'<svg viewBox="0 0 64 44" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M22 6l1.8 4.3L28 12l-4.2 1.7L22 18l-1.8-4.3L16 12l4.2-1.7Z" fill="currentColor" stroke="none"/><path d="M14 32v-3c0-1 .6-1.9 1.5-2.3l6-2.7c1-.5 2.1-.7 3.2-.7h12.6c1.2 0 2.4.3 3.4.9l5 3c.7.4 1.3 1 1.6 1.8l.7 2v3Z"/><circle cx="23" cy="35" r="3.2" fill="currentColor" stroke="none"/><circle cx="39" cy="35" r="3.2" fill="currentColor" stroke="none"/></svg>',
  low:'<svg viewBox="0 0 64 44" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><g transform="translate(4,28)"><rect x="0" y="3" width="11" height="7.5" rx="1.6" stroke-width="1.5"/><rect x="3" y=".5" width="5" height="3" rx=".6" stroke-width="1.3"/><circle cx="5.5" cy="6.7" r="2.3" stroke-width="1.4"/></g><path d="M15 33L38 12M15 33L44 16" stroke-width="1" opacity=".7"/><g transform="translate(36,4)"><rect x="0" y="4" width="24" height="16" rx="3" stroke-width="1.6"/><rect x="4" y="0" width="16" height="5" rx="1.5" stroke-width="1.4"/><circle cx="4.5" cy="20" r="2" fill="currentColor" stroke="none"/><circle cx="19.5" cy="20" r="2" fill="currentColor" stroke="none"/></g></svg>',
  profile:'<svg viewBox="0 0 64 44" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="10" y="14" width="44" height="18" rx="3"/><path d="M20 14v18M30 14v18M40 14v18" opacity=".5" stroke-width="1.2"/><circle cx="20" cy="35" r="3.2" fill="currentColor" stroke="none"/><circle cx="44" cy="35" r="3.2" fill="currentColor" stroke="none"/></svg>',
  rear34:'<svg viewBox="0 0 64 44" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="14" width="40" height="18" rx="3"/><path d="M15 14v18M24 14v18M33 14v18" opacity=".5" stroke-width="1.2"/><circle cx="16" cy="35" r="3.2" fill="currentColor" stroke="none"/><circle cx="38" cy="35" r="3.2" fill="currentColor" stroke="none"/><g transform="translate(46,17)"><rect x="0" y="2" width="11" height="7.5" rx="1.6" stroke-width="1.5"/><rect x="3" y="-.5" width="5" height="3" rx=".6" stroke-width="1.3"/><circle cx="5.5" cy="5.7" r="2.1" stroke-width="1.4"/></g></svg>',
  drone:'<svg viewBox="0 0 64 44" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><g transform="translate(32,14)"><rect x="-4" y="-3" width="8" height="6" rx="1.6"/><path d="M-4 -1L-14 -9M4 -1L14 -9M-4 2L-14 10M4 2L14 10"/><circle cx="-14" cy="-9" r="3.2"/><circle cx="14" cy="-9" r="3.2"/><circle cx="-14" cy="10" r="3.2"/><circle cx="14" cy="10" r="3.2"/></g><path d="M18 38v-2.3c0-.8.5-1.5 1.2-1.8l4-1.8c.7-.3 1.4-.5 2.2-.5h8.2c.8 0 1.6.2 2.3.6l3.3 2c.5.3.8.7 1 1.2l.4 1.3v1.3Z" stroke-width="1.3"/><circle cx="23" cy="39" r="2" fill="currentColor" stroke="none"/><circle cx="34" cy="39" r="2" fill="currentColor" stroke="none"/></svg>',
  street:'<svg viewBox="0 0 64 44" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 36h60" stroke-width="1" opacity=".35"/><g transform="translate(4,20)"><rect x="0" y="3" width="11" height="7.5" rx="1.6" stroke-width="1.5"/><rect x="3" y=".5" width="5" height="3" rx=".6" stroke-width="1.3"/><circle cx="5.5" cy="6.7" r="2.3" stroke-width="1.4"/></g><g transform="translate(26,10)"><circle cx="4" cy="2.4" r="2.4" fill="currentColor" stroke="none"/><path d="M4 5v9M4 9l-4 3M4 9l4.5 2M4 14l-3 6M4 14l4 6" stroke-width="1.5"/></g><g transform="translate(38,18)"><rect x="0" y="0" width="22" height="12" rx="2.4" stroke-width="1.5"/><path d="M7 0v12M14 0v12" opacity=".5" stroke-width="1.1"/><circle cx="6" cy="14" r="2.2" fill="currentColor" stroke="none"/><circle cx="17" cy="14" r="2.2" fill="currentColor" stroke="none"/></g></svg>',
  track:'<svg viewBox="0 0 64 44" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 16h10M2 22h14M2 28h9" stroke-width="1.4" opacity=".8"/><rect x="16" y="14" width="34" height="16" rx="3"/><path d="M25 14v16M34 14v16" opacity=".5" stroke-width="1.2"/><circle cx="25" cy="32" r="2.8" fill="currentColor" stroke="none"/><circle cx="43" cy="32" r="2.8" fill="currentColor" stroke="none"/><g transform="translate(50,15)"><rect x="0" y="2" width="10" height="7" rx="1.5" stroke-width="1.4"/><rect x="2.5" y="-.5" width="4.5" height="2.8" rx=".5" stroke-width="1.2"/><circle cx="5" cy="5.5" r="1.9" stroke-width="1.3"/></g></svg>',
  detail:'<svg viewBox="0 0 64 44" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="26" cy="19" r="12"/><path d="M35 28l11 11"/><path d="M18 19h16M26 11v16" stroke-width="1.4" opacity=".7"/><path d="M40 8l6 2-2 6z" fill="currentColor" stroke="none"/></svg>'
};
const ANGLE_ICON_DEFAULT='<svg viewBox="0 0 64 44" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><g transform="translate(4,17)"><rect x="0" y="1.2" width="10" height="6.4" rx="1.4" stroke-width="1.3"/><rect x="3" y="-.8" width="4" height="2.4" rx=".6" stroke-width="1.1"/><circle cx="5" cy="4.4" r="2.1" stroke-width="1.2"/></g><rect x="20" y="14" width="34" height="16" rx="3"/><circle cx="29" cy="32" r="2.8" fill="currentColor" stroke="none"/><circle cx="47" cy="32" r="2.8" fill="currentColor" stroke="none"/></svg>';

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
/* v41.2: การ์ด "ไทล์สี" สำหรับประเภทสื่อ/มุมกล้อง/สไตล์ — ตามภาพตัวอย่างไอคอนสื่อ Plan B ที่ผู้ใช้
   ส่งมา (สี่เหลี่ยมมุมโค้งไล่สีสันสดใส ไอคอนสีขาวตรงกลาง ป้ายชื่อทึบด้านล่าง) แทนกล่องสีเทาเรียบ
   เดิม สีมาจาก tileGrad(idx) ไล่ตามลำดับที่แสดง ไม่ผูกกับ id จึงรายการที่เพิ่มเองต่อท้ายก็ได้สี
   ต่อคิวเอง — ไอคอน (VEHICLE_ICONS/ANGLE_ICONS/STYLE_ICONS) ไม่ต้องแก้แม้แต่บรรทัดเดียว
   เพราะใช้ currentColor อยู่แล้ว แค่ตั้ง color:#fff ผ่าน .icotop ที่ styles.css
   ปุ่ม .tick (ถูกกำหนดไว้แล้วที่ .chip.card ทั่วไปสำหรับติ๊กถูกตอนเลือก) ใส่เพิ่มให้ทั้ง 3 หมวดนี้
   เพราะพื้นเป็นสีสันแล้ว จะบอกว่า "เลือกอยู่" ด้วยกรอบสีแบรนด์แบบชิปธรรมดาไม่ชัดพอ */
function tileHTML(item,pressed,custom,idx,iconHTML,extraCls){
  const [t1,t2]=tileGrad(idx);
  return '<button type="button" class="chip card icocard tile'+(extraCls?" "+extraCls:"")+(custom?' cust':'')+
    '" data-id="'+esc(item.id)+'" aria-pressed="'+(pressed?'true':'false')+
    '" style="--t1:'+t1+';--t2:'+t2+'">'+
    '<span class="icotop">'+iconHTML+'<span class="tick">'+IC_TICK+'</span></span>'+
    '<span class="cardbody"><b>'+esc(item.th)+'</b>'+(item.en?'<span class="en">'+esc(item.en)+'</span>':'')+'</span>'+
    (custom?'<span class="del" data-del="'+esc(item.id)+'" title="ลบรายการนี้">×</span>':'')+'</button>';
}
function vehicleCardHTML(item,pressed,custom,idx){
  return tileHTML(item,pressed,custom,idx,VEHICLE_ICONS[item.id]||VEHICLE_ICON_DEFAULT);
}
function angleCardHTML(item,pressed,custom,idx){
  return tileHTML(item,pressed,custom,idx,ANGLE_ICONS[item.id]||ANGLE_ICON_DEFAULT,"anglecard");
}
function styleCardHTML(item,pressed,custom,idx){
  return tileHTML(item,pressed,custom,idx,STYLE_ICONS[item.id]||STYLE_ICON_DEFAULT);
}
function chipHTML(item,pressed,custom,key,idx){
  if(key==="light") return lightCardHTML(item,pressed,custom);
  if(key==="loc") return locCardHTML(item,pressed,custom);
  if(key==="vehicle") return vehicleCardHTML(item,pressed,custom,idx);
  if(key==="angle") return angleCardHTML(item,pressed,custom,idx);
  if(key==="style") return styleCardHTML(item,pressed,custom,idx);
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
  el.innerHTML=items.map((i,idx)=>chipHTML(i,pressed(i),!!i.custom,key,idx)).join("")+addChipHTML(key);
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

