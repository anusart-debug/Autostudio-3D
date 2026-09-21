/* ================= เส้นทางเดินรถแบบเต็มสาย (v41) =========================
   ปัญหาเดิม: stage C (52-overpass.js qLines) ขอแค่ out ids แล้วเอาไปย้อมสีถนนของแผนที่ฐาน
   ที่มีอยู่แล้ว — เห็นได้เฉพาะช่วงที่อยู่ในรัศมีที่ดึงมา (สูงสุด 900 ม.) และรอดจาก blacklist
   ของ qBase เท่านั้น ที่จุดเปลี่ยนถ่ายใหญ่ (>40 สาย) stage C ถูกข้ามทั้งดุ้น ทำให้คลิกสายในรายการ
   ไม่มีอะไรเกิดขึ้นเลย ทั้งที่ข้อความบอกว่าคลิกได้

   ทางแก้: ดึง geometry ของสายที่เลือกตอนคลิก "ดูทั้งสาย" — rel(id:...) แบบ out geom คืน
   สมาชิกแต่ละ way มา geometry อินไลน์ในตัว member เอง วาดแยกทีละ way ห้ามต่อรวม (กฎข้อ 8
   ใน docs/map-howto.md) และข้าม member ที่ role เป็น stop/platform เพราะนั่นคือป้าย ไม่ใช่เส้นทาง
   (กฎข้อ 9) — ป้ายที่ข้ามเหล่านั้นถูกเก็บไว้ต่างหากเป็น "สายนี้จอดป้ายไหนบ้าง" ให้ฟรีในตัว

   เลขสายที่แสดงยังมาจากรายการที่ตรวจสอบด้วยมือ (10-data.js LOCATIONS[].bus) เสมอ
   ไม่ใช่จาก OSM ตรงๆ ตาม docs/busmap-data.md — geometry มาจาก OSM แต่ป้ายชื่อมาจากรายการ curated */

const GEO=new Map();                 /* cache ในหน่วยความจำ: geoKey -> {ways,stops,bbox,from,to,op} */
const GEO_KEY="as3d_geo";            /* cache ถาวรใน localStorage ผ่าน store wrapper เดิม */
const GEO_MAX_ROUTES=30;             /* LRU แบบนับจำนวนสาย ไม่ใช่ไบต์ — เรียบง่ายพอสำหรับเคสนี้ */

function geoKeyOf(ids){ return ids.slice().sort((a,b)=>a-b).join(","); }

/* C) เส้นทางเต็มสายของสายที่เลือก — ดึงตอนคลิก "ดูทั้งสาย" เท่านั้น ไม่ใช่ตอนโหลดแผนที่ */
function qRouteGeom(ids){
  return "/*as3d:geom*/[out:json][timeout:45];rel(id:"+ids.join(",")+");out geom;";
}

/* ตัด point ที่อยู่ใกล้กันเกินไปออก ลดขนาดข้อมูลที่ต้องเก็บ/วาด โดยรูปร่างเปลี่ยนน้อยมาก
   ทำครั้งเดียวตอนรับข้อมูล ไม่ใช่ตอนวาด — งบ localStorage และการ repaint ตอน pan จะไม่เป็นปัญหา */
function simplifyWay(pts,tolM){
  if(pts.length<=2) return pts;
  const out=[pts[0]]; let last=pts[0];
  for(let i=1;i<pts.length-1;i++){
    if(metres(last[0],last[1],pts[i][0],pts[i][1])>=tolM){ out.push(pts[i]); last=pts[i]; }
  }
  out.push(pts[pts.length-1]);
  return out;
}

/* แปลงผล rel(id:..);out geom; เป็น {ways, stops, bbox, from, to, op}
   member role stop/platform (รวม *_entry_only/_exit_only) คือป้าย ไม่ใช่เส้นทาง — ข้ามจากเส้น
   แล้วเก็บไว้เป็นป้ายที่สายนี้จอด (แก้ปัญหา "ป้ายไหนมีสายอะไรจอด" ให้ฟรีโดยไม่ต้องยิงเพิ่ม) */
function parseRouteGeom(elements){
  const ways=[], stops=[];
  let minLat=90,maxLat=-90,minLon=180,maxLon=-180, from="", to="", op="";
  let any=false;
  (elements||[]).forEach(rel=>{
    if(rel.type!=="relation") return;
    const t=rel.tags||{};
    if(!from&&t.from) from=t.from;
    if(!to&&t.to) to=t.to;
    if(!op) op=t.operator||t.network||"";
    (rel.members||[]).forEach(m=>{
      const role=m.role||"";
      if(/^(stop|platform)/.test(role)){
        if(m.lat!=null&&m.lon!=null) stops.push({lat:m.lat,lon:m.lon});
        return;
      }
      if(m.type==="way"&&m.geometry&&m.geometry.length){
        any=true;
        const pts=m.geometry.map(g=>[g.lat,g.lon]);
        pts.forEach(([la,lo])=>{
          if(la<minLat)minLat=la; if(la>maxLat)maxLat=la;
          if(lo<minLon)minLon=lo; if(lo>maxLon)maxLon=lo;
        });
        ways.push(pts);
      }
    });
  });
  if(!any) return null;
  return {ways,stops,bbox:[minLat,minLon,maxLat,maxLon],from,to,op};
}

/* ---- cache ถาวร — อย่าไว้ใจ store.set() เฉยๆ (00-store.js กลืน QuotaExceededError เงียบๆ)
   ตัดสายที่เก่าที่สุดออกแล้วลองใหม่เองจนกว่าจะเขียนได้หรือไม่เหลือให้ตัด ---- */
function geoLoadStore(){
  try{
    const raw=store.get(GEO_KEY); if(!raw) return {v:1,order:[],r:{}};
    const j=JSON.parse(raw);
    if(!j||typeof j!=="object"||!j.r) return {v:1,order:[],r:{}};
    if(!Array.isArray(j.order)) j.order=Object.keys(j.r);
    return j;
  }catch(e){ return {v:1,order:[],r:{}}; }
}
function geoSaveStore(db){
  for(let tries=0;tries<8;tries++){
    try{ store.set(GEO_KEY,JSON.stringify(db)); return true; }
    catch(e){
      if(!db.order.length) return false;
      const oldest=db.order.shift(); delete db.r[oldest];
    }
  }
  return false;
}
function geoRemember(key,rec){
  GEO.set(key,rec);
  const db=geoLoadStore();
  db.order=db.order.filter(k=>k!==key); db.order.push(key);
  db.r[key]={ways:rec.ways.map(w=>w.map(([la,lo])=>[+la.toFixed(5),+lo.toFixed(5)])),
              stops:rec.stops,bbox:rec.bbox,from:rec.from,to:rec.to,op:rec.op};
  while(db.order.length>GEO_MAX_ROUTES){ const k=db.order.shift(); delete db.r[k]; }
  geoSaveStore(db);
}
function geoRecall(key){
  if(GEO.has(key)) return GEO.get(key);
  const rec=geoLoadStore().r[key];
  if(!rec) return null;
  GEO.set(key,rec);
  return rec;
}
function geoClearAll(){
  GEO.clear();
  store.del(GEO_KEY);
  toast("ล้างข้อมูลเส้นทางที่เก็บไว้แล้ว");
  renderRouteLegend();
}
$("geoClear").addEventListener("click",geoClearAll);

/* จุดเดียวที่ legend / bus chips / ใบนำเสนอ เรียกใช้ชื่อสาย — เลขสายมาจากรายการที่ตรวจสอบแล้ว
   (LOCATIONS[].bus / BUSX) เสมอ ไม่ใช่จาก ref ของ OSM ตรงๆ ตาม docs/busmap-data.md
   คืน verified:false เมื่อ ref ที่ OSM ให้มาไม่อยู่ในรายการที่ตรวจแล้วของจุดนี้ */
function normRef(s){ return String(s||"").replace(/\s+/g,"").toUpperCase(); }
function curatedLabel(ref,loc){
  const cur=busOf(loc||curLoc());
  const target=normRef(ref);
  for(const c of cur){
    if(normRef(c)===target) return {label:c,verified:true};
    const parts=String(c).replace(/[()]/g,"").split(/\s+/).map(normRef);
    if(parts.indexOf(target)>=0) return {label:c,verified:true};
  }
  return {label:ref,verified:false};
}

/* v41.9: ตรวจก่อนเชื่อ seed ว่าเส้นทางที่จับคู่ได้ผ่านใกล้จุดที่กำลังดูอยู่จริงหรือไม่ —
   หลังใช้งานจริงพบว่าบางสาย (เช่น "A3" ในไฟล์ Google My Maps ต้นฉบับ ระบุต้นทาง-ปลายทางว่า
   ดอนเมือง-สวนลุมพินี แต่ geometry จริงที่วาดไว้กลับอยู่แถวบางนา/สนามบินสุวรรณภูมิ ห่างจากจุดที่
   ควรจะผ่านเป็นสิบกิโล) เป็นข้อผิดพลาดในไฟล์ต้นฉบับที่แก้ทีละสายไม่จบ (188 สาย ตรวจมือไม่ทันหมด)
   จึงป้องกันที่ปลายทางแทน: seed จะใช้ได้ก็ต่อเมื่อมีจุดใดจุดหนึ่งของเส้นทางอยู่ในรัศมี 8 กม.
   จากหมุดที่กำลังดูอยู่ (MAPD.at) เท่านั้น — ไกลกว่านั้นถือว่าน่าจะเป็นข้อมูลผิดสาย/ผิดจุด ทิ้งแล้ว
   ถอยไป cache/live ตามปกติ (ปลอดภัยกว่าเชื่อ seed อย่างไม่มีเงื่อนไข ต่อให้ทำให้ seed ใช้ไม่ได้กับ
   บางสายที่จริงๆถูกก็ตาม) 8 กม. เผื่อพอสำหรับเส้นทางที่จริงผ่านแถวนั้นแต่จุดจาก KML ที่ถูกย่อไว้
   ตั้งแต่ต้นทางบังเอิญข้ามช่วงนั้นไปพอดี (ดูตัวอย่างสาย "145"/"513" ที่ระยะจริงห่างสุด ~4.5 กม.) */
function seedNearPin(rec,tolM){
  if(!MAPD.at) return true;
  const [pLat,pLon]=MAPD.at;
  for(const w of rec.ways){
    for(const [la,lo] of w){
      if(metres(pLat,pLon,la,lo)<=tolM) return true;
    }
  }
  return false;
}
/* seed สแนปช็อตเส้นทางเต็มสาย (10d-route-geom-seed.js) จาก Google My Maps ที่ผู้ใช้ทำเอง —
   เช็กก่อน cache/live เสมอ เพราะไม่ต้องพึ่งเน็ตเลย ครอบคลุม 188 สาย (รวม alias เลขสายเก่า/ใหม่)
   g.ref จาก OSM มักเป็น "เก่า (ใหม่)" รวมกันมาในสตริงเดียว เช่น "17 (4-3)" — แยกด้วยวิธีเดียวกับ
   curatedLabel() (ตัดวงเล็บออกแล้ว split ด้วยช่องว่าง) แล้วลองจับคู่ทีละส่วน คืน null ถ้าไม่มีสายนี้
   ในสแนปช็อต หรือมีแต่ไม่ผ่านใกล้จุดนี้จริง (seedNearPin) ให้ loadRouteGeom() ถอยไป cache/live */
function applyRouteGeomSeed(ref){
  const parts=String(ref||"").replace(/[()]/g,"").split(/\s+/).filter(Boolean);
  for(const part of parts){
    const key=normRef(part);
    const rec=ROUTE_GEOM_SEED[key]||ROUTE_GEOM_SEED[ROUTE_GEOM_ALIAS[key]];
    if(rec&&seedNearPin(rec,8000)) return {ways:rec.ways,stops:[],bbox:rec.bbox,from:rec.from,to:rec.to,op:""};
  }
  return null;
}

/* ดึง geometry เต็มสาย — seed (Google My Maps) ก่อน แล้ว cache (ไม่ยิงเน็ตซ้ำ) ไม่เจอค่อยถาม Overpass
   คืน null เมื่อพัง (toast บอกเหตุผลแล้ว) — เรียกจาก UI ตอนกด "ดูทั้งสาย" เท่านั้น */
async function loadRouteGeom(gi){
  const g=MAPD.groups[gi]; if(!g||!g.ids||!g.ids.length) return null;
  const key=geoKeyOf(g.ids);
  const cached=geoRecall(key);
  if(cached) return cached;
  const seeded=applyRouteGeomSeed(g.ref);
  if(seeded){ geoRemember(key,seeded); return seeded; }
  if(MAPD.geomBusy===key) return null;
  MAPD.geomBusy=key; renderRouteLegend();
  try{
    const r=await ovpFetch(qRouteGeom(g.ids),null,30000);
    const parsed=parseRouteGeom(r.data.elements);
    if(!parsed) throw new Error("ไม่พบ geometry ของสายนี้ใน OSM");
    parsed.ways=parsed.ways.map(w=>simplifyWay(w,8));
    geoRemember(key,parsed);
    return parsed;
  }catch(e){
    toast("ดึงเส้นทางเต็มสายไม่สำเร็จ: "+e.message,true);
    return null;
  }finally{
    if(MAPD.geomBusy===key) MAPD.geomBusy="";
    renderRouteLegend();
  }
}

