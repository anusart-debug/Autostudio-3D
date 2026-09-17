/* ================= แปลงสถานะแอป <-> ไฟล์โปรเจกต์บน Drive (เฉพาะเว็บ) =========================
   ครึ่งหนึ่งของสถานะแอปนี้อยู่ใน DOM input ไม่ได้อยู่ใน S เลย (negative, artwork, detail,
   bodyNotes, ล็อกต่างๆ, adFit ฯลฯ) — รายชื่อ field ต้องนิยามไว้ที่เดียวแล้วให้ save/load
   ขับจากรายการเดียวกัน ไม่งั้นสองฝั่งจะแยกกันเดินเมื่อเพิ่ม field ใหม่ในอนาคต

   S.styles เป็น Set — JSON.stringify(S) ธรรมดาจะได้ {} เงียบๆ ไม่ error ต้องแปลงเป็น [...] เอง
   ตอน save แล้ว new Set(...) ตอน load เสมอ (ดู test/10-drive-roundtrip.test.js) */
/* llLat/llLng ไม่อยู่ในรายการนี้โดยตั้งใจ — พิกัดหมุดเป็นของ PINX (ดู dvSerializeMap()/map.pin
   ด้านล่าง) และ mapGo() ที่ dvApplyProject เรียกทีหลังจะเซ็ตช่องนี้ทับจากตำแหน่งของโลเคชั่นเสมอ
   ใส่ไว้ใน DV_FIELD_IDS จะกลายเป็นค่าที่ไม่มีทางรอดถึงตอนโหลด (ยืนยันด้วย test/10-drive-roundtrip.test.js) */
const DV_FIELD_IDS = [
  "negative", "artwork", "detail", "bodyNotes", "fidelity",
  "lockColor", "lockBody", "lockView", "srcRatio", "editStyle",
  "col1", "col2", "adKeepScene", "adFit",
];

function dvFieldGet(id) {
  const el = $(id);
  if (!el) return undefined;
  return el.type === "checkbox" ? el.checked : el.value;
}
function dvFieldSet(id, v) {
  const el = $(id);
  if (!el || v === undefined) return;
  if (el.type === "checkbox") el.checked = !!v;
  else el.value = v;
  const evName = (el.tagName === "SELECT" || el.type === "checkbox") ? "change" : "input";
  el.dispatchEvent(new Event(evName, { bubbles: true }));
}

/* เก็บแค่ at/radius/near/view/solo ของแผนที่ — ห้าม JSON.stringify(MAPD) ตรงๆ เด็ดขาด
   MAPD.groups[].ways เป็น Set และ MAPD.data คือ payload ดิบจาก Overpass หลายเมกะไบต์
   ดึงใหม่จาก Overpass ตอนเปิดโปรเจกต์แทน — ของพวกนี้ดึงซ้ำได้ ไม่ใช่ของที่ต้องเก็บ */
function dvSerializeMap() {
  const l = curLoc();
  return {
    locId: l.id,
    at: MAPD.at, radius: MAPD.radius, near: MAPD.near,
    view: MAPD.view, solo: MAPD.solo,
    bus: BUSX[l.id] || null,
    pin: PINX[l.id] || null,
  };
}

function dvSerializeProject() {
  const fields = {};
  DV_FIELD_IDS.forEach((id) => { fields[id] = dvFieldGet(id); });
  return {
    as3d: 1, app: "AUTOSTUDIO 3D", appVersion: "41.0.0",
    savedAt: new Date().toISOString(),
    savedBy: (AU_USER && AU_USER.email) || "",
    prompt: {
      vehicle: S.vehicle, loc: S.loc, angle: S.angle, light: S.light,
      styles: [...S.styles], /* Set -> array — จุดที่พังเงียบถ้าลืมแปลง */
      lens: S.lens, weather: S.weather, ratio: S.ratio, scale: S.scale, hdr: S.hdr,
    },
    ref: { fileName: S.refFileName, mime: S.refMime, w: S.refW, h: S.refH,
           body: S.refBody, orient: S.refOrient, extra: S.refExtra },
    ad: { fileName: S.adFileName, mime: S.adMime },
    fields: fields,
    map: dvSerializeMap(),
    lists: { custom: CUSTOM, hidden: HIDDEN },
  };
}

/* คืนสถานะจาก project.json — imgUrls เป็น data: URL ของภาพ (ถ้ามี) ดึงมาจากไฟล์แยกบน Drive
   ก่อนเรียกฟังก์ชันนี้แล้ว ฟังก์ชันนี้เองไม่ยิง Drive เพิ่ม */
async function dvApplyProject(p, refDataUrl, adDataUrl) {
  const pr = p.prompt || {};
  S.vehicle = pr.vehicle || S.vehicle;
  S.angle = pr.angle || S.angle;
  S.light = pr.light || S.light;
  S.styles = new Set(pr.styles || []);
  S.lens = pr.lens || 0; S.weather = pr.weather || 0; S.ratio = pr.ratio || 0;
  S.scale = pr.scale || 1; S.hdr = pr.hdr != null ? pr.hdr : 75;

  const ref = p.ref || {};
  S.refFileName = ref.fileName || ""; S.refMime = ref.mime || "image/jpeg";
  S.refW = ref.w || 0; S.refH = ref.h || 0;
  S.refBody = ref.body || ""; S.refOrient = ref.orient || ""; S.refExtra = ref.extra || [];
  const ad = p.ad || {};
  S.adFileName = ad.fileName || ""; S.adMime = ad.mime || "image/jpeg";

  if (refDataUrl) {
    S.refData = refDataUrl; S.refB64 = refDataUrl.split(",")[1] || "";
    $("refImg").src = refDataUrl; $("refName").textContent = S.refFileName; $("refBox").hidden = false;
    $("dnaBlock").hidden = false;
  } else {
    S.refData = null; S.refB64 = ""; $("refBox").hidden = true; $("dnaBlock").hidden = true;
  }
  if (adDataUrl) {
    S.adData = adDataUrl; S.adB64 = adDataUrl.split(",")[1] || "";
    $("adImg").src = adDataUrl; $("adName").textContent = S.adFileName; $("adBox").hidden = false;
  } else {
    S.adData = null; S.adB64 = ""; $("adBox").hidden = true;
  }

  DV_FIELD_IDS.forEach((id) => dvFieldSet(id, (p.fields || {})[id]));

  if (p.lists) {
    CUSTOM = p.lists.custom || CUSTOM; HIDDEN = p.lists.hidden || HIDDEN;
    saveCustom();
    try { store.set(HIDE_KEY, JSON.stringify(HIDDEN)); } catch (e) {}
  }

  ["vehicle", "loc", "angle", "light", "style"].forEach((k) => {
    if (k !== "loc") renderChips(k);
  });
  refreshLens(); refreshWeather();
  $("ratio").value = String(S.ratio);
  $("scale").value = String(Math.round(S.scale * 100)); $("scaleVal").textContent = S.scale.toFixed(1) + "×";
  $("hdr").value = String(S.hdr); $("hdrVal").textContent = S.hdr + "%";

  const m = p.map || {};
  if (m.locId) {
    S.loc = m.locId; renderChips("loc");
    if (m.bus) { BUSX[m.locId] = m.bus; saveBus(); }
    if (m.pin) { PINX[m.locId] = m.pin; savePin(); }
    mapGo(); /* ล้างแผนที่เดิม ตั้งพิกัด/รัศมีใหม่ตาม location — ยังไม่ดึง Overpass ใหม่ */
    if (m.radius) MAPD.radius = m.radius;
    if (m.near) MAPD.near = m.near;
    $("mapZoom").value = String(MAPD.radius); $("mapNear").value = String(MAPD.near);
    renderBus();
    toast("เปิดโปรเจกต์แล้ว — กดปุ่มดึงแผนที่และเส้นทางเดินรถในแผง 10 เพื่อโหลดแผนที่ใหม่");
  }

  updateDnaLine();
  sync();
}

/* ช่องมองสำหรับตรวจปัญหา/เทสต์ — อ่านอย่างเดียวเหมือน window.__as3d ใน 53-map-ui.js
   แต่ผูกกับ 72-project.web.js เพราะ serialize/apply เป็นของเว็บเท่านั้น */
window.__as3dProject = { serialize: dvSerializeProject, apply: dvApplyProject, fieldIds: DV_FIELD_IDS, S: () => S };

