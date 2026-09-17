/* ================= Google Drive REST wrapper (เฉพาะเว็บ) =========================
   scope drive.file เท่านั้น (ขอไว้แล้วตอน sign-in ใน 70-auth.web.js) — แอปเห็นและแก้ได้
   เฉพาะไฟล์ที่แอปนี้สร้างเอง ไม่ใช่ทั้ง Drive ของผู้ใช้ ถ้าโดน XSS วันไหน ความเสียหายจำกัด
   อยู่แค่โฟลเดอร์ของแอปนี้ ไม่ใช่สัญญา/เรตการ์ด/ไฟล์ HR ของบริษัท

   ฟรีทั้งหมด — Drive API ไม่มีค่าใช้จ่ายตามโควตาปกติของ Google Workspace/บัญชีส่วนตัว
   ไม่ต้องเปิด billing account ใดๆ เพิ่มจากที่ Firebase Auth/Firestore ใช้อยู่แล้ว */
const DV_API = "https://www.googleapis.com/drive/v3";
const DV_UP = "https://www.googleapis.com/upload/drive/v3";
const DV_FOLDER = "application/vnd.google-apps.folder";
const DV_MAXUP = 4 * 1024 * 1024; /* multipart ปลอดภัยถึง 5MB — กันไว้ที่ 4MB เผื่อ overhead */
let DV_ROOT_ID = "";

async function dvFetch(url, opt) {
  const tok = await auToken();
  const o = Object.assign({}, opt);
  o.headers = Object.assign({}, o.headers, { Authorization: "Bearer " + tok });
  const r = await fetch(url, o);
  if (r.status === 401) { AU_TOK = ""; AU_TOK_EXP = 0; throw new Error("เซสชันหมดอายุ — กรุณาเข้าสู่ระบบใหม่"); }
  if (!r.ok) throw new Error("Drive HTTP " + r.status + " " + (await r.text()).slice(0, 200));
  return r;
}

/* หาโฟลเดอร์ราก "AUTOSTUDIO 3D" ใน My Drive — หาก่อนเสมอ ไม่สร้างซ้ำ (idempotent) */
async function dvRoot() {
  if (DV_ROOT_ID) return DV_ROOT_ID;
  const q = "mimeType='" + DV_FOLDER + "' and trashed=false and " +
    "appProperties has { key='as3d' and value='root' }";
  const r = await dvFetch(DV_API + "/files?q=" + encodeURIComponent(q) +
    "&fields=files(id,name)&pageSize=10&spaces=drive");
  const j = await r.json();
  if (j.files && j.files.length) { DV_ROOT_ID = j.files[0].id; return DV_ROOT_ID; }
  const c = await dvFetch(DV_API + "/files?fields=id", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "AUTOSTUDIO 3D", mimeType: DV_FOLDER, appProperties: { as3d: "root" } }),
  });
  DV_ROOT_ID = (await c.json()).id;
  return DV_ROOT_ID;
}

/* รายชื่อโปรเจกต์ทั้งหมด (โฟลเดอร์ย่อยของราก) เรียงล่าสุดก่อน */
async function dvList() {
  const q = "'" + (await dvRoot()) + "' in parents and mimeType='" + DV_FOLDER + "' and trashed=false";
  const r = await dvFetch(DV_API + "/files?q=" + encodeURIComponent(q) +
    "&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc&pageSize=100");
  return (await r.json()).files || [];
}

function dvMultipart(meta, blob) {
  const B = "as3d" + Math.random().toString(36).slice(2);
  const head = "--" + B + "\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n" +
    JSON.stringify(meta) + "\r\n--" + B + "\r\nContent-Type: " + (blob.type || "application/octet-stream") + "\r\n\r\n";
  const tail = "\r\n--" + B + "--";
  return { body: new Blob([head, blob, tail]), type: "multipart/related; boundary=" + B };
}

async function dvCreateFolder(name, parentId) {
  const r = await dvFetch(DV_API + "/files?fields=id,name,modifiedTime", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: name, mimeType: DV_FOLDER, parents: [parentId] }),
  });
  return r.json();
}

/* สร้างไฟล์ใหม่ (metadata + เนื้อไฟล์ในคำขอเดียว) — ใช้ทั้ง project.json และรูปภาพ */
async function dvCreateFile(name, parentId, blob) {
  if (blob.size > DV_MAXUP) throw new Error("ไฟล์ใหญ่เกิน 4MB — ลดขนาดภาพก่อนบันทึก");
  const m = dvMultipart({ name: name, parents: [parentId] }, blob);
  const r = await dvFetch(DV_UP + "/files?uploadType=multipart&fields=id,name,modifiedTime,headRevisionId", {
    method: "POST",
    headers: { "Content-Type": m.type },
    body: m.body,
  });
  return r.json();
}

/* อัปเดตเนื้อไฟล์เดิม (ไม่แก้ metadata) */
async function dvUpdateFile(fileId, blob) {
  if (blob.size > DV_MAXUP) throw new Error("ไฟล์ใหญ่เกิน 4MB");
  const r = await dvFetch(DV_UP + "/files/" + fileId + "?uploadType=media&fields=id,modifiedTime,headRevisionId", {
    method: "PATCH",
    headers: { "Content-Type": blob.type },
    body: blob,
  });
  return r.json();
}

async function dvRenameFolder(id, name) {
  const r = await dvFetch(DV_API + "/files/" + id + "?fields=id,name", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: name }),
  });
  return r.json();
}

/* ทิ้งลงถังขยะเท่านั้น — กู้คืนได้ 30 วันจาก Drive UI เอง ไม่ลบถาวร */
async function dvTrash(id) {
  return dvFetch(DV_API + "/files/" + id, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trashed: true }),
  });
}

async function dvListChildren(folderId) {
  const r = await dvFetch(DV_API + "/files?q=" + encodeURIComponent("'" + folderId + "' in parents and trashed=false") +
    "&fields=files(id,name,mimeType,modifiedTime,headRevisionId)&pageSize=50");
  return (await r.json()).files || [];
}

async function dvGetBlob(fileId) {
  const r = await dvFetch(DV_API + "/files/" + fileId + "?alt=media");
  return r.blob();
}
async function dvGetText(fileId) {
  const b = await dvGetBlob(fileId);
  return b.text();
}

/* base64 (จาก S.refB64/S.adB64) → Blob — ไม่ใช้ fetch("data:...") เพราะ CSP ของไฟล์ออฟไลน์
   บล็อกไว้ตั้งใจ (ดู build.mjs) ทำเหมือนกันไว้ที่นี่เพื่อความสม่ำเสมอ แม้ฝั่งเว็บจะไม่ติด CSP นี้ */
function dvB64Blob(b64, mime) {
  const bin = atob(b64);
  const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return new Blob([u], { type: mime || "application/octet-stream" });
}

