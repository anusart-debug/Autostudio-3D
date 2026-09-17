/* ================= 10 · ROUTE MAP + ใบนำเสนอฝ่ายขาย =================
   แผนที่ใช้ Leaflet + OpenStreetMap ต้องต่ออินเทอร์เน็ตตอนเปิด
   ถ้าออฟไลน์ ส่วนรายชื่อสายรถเมล์และใบนำเสนอยังใช้งานได้ปกติ */
const BUS_KEY="as3d_bus", PIN_KEY="as3d_pin";
let BUSX={}, PINX={};
try{BUSX=JSON.parse(store.get(BUS_KEY)||"{}")||{}}catch(e){BUSX={}}
try{PINX=JSON.parse(store.get(PIN_KEY)||"{}")||{}}catch(e){PINX={}}
function saveBus(){try{store.set(BUS_KEY,JSON.stringify(BUSX))}catch(e){}}
function savePin(){try{store.set(PIN_KEY,JSON.stringify(PINX))}catch(e){}}

const BKK=[13.7563,100.5018];
function curLoc(){return find(list("loc"),S.loc)}
function locPos(l){
  const o=PINX[l.id];
  if(o&&o.length===2) return [o[0],o[1]];
  return (typeof l.lat==="number"&&typeof l.lng==="number") ? [l.lat,l.lng] : BKK.slice();
}
function busOf(l){ return BUSX[l.id] ? BUSX[l.id].slice() : (l.bus||[]).slice(); }
function isCustomLoc(l){ return typeof l.lat!=="number"; }

const CONFTH={high:"ตรวจสอบแล้ว",medium:"ควรตรวจซ้ำ",low:"ข้อมูลไม่ยืนยัน"};

