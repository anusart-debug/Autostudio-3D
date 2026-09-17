/* ================= ล็อกอิน Google + ระบบขอสิทธิ์การใช้งาน (เฉพาะเว็บ) =========================
   ใช้ Firebase Authentication (ไม่ใช่ Google Identity Services ดิบๆ) เพราะ Firestore
   Security Rules ต้องมี request.auth ซึ่งมาจาก Firebase Auth เท่านั้น — ขอ scope drive.file
   (สำหรับเฟส 7) ในการล็อกอินครั้งเดียวกันผ่าน GoogleAuthProvider.addScope() ไม่ต้องขอ token
   สองรอบสองที่

   ทำไมต้องมีระบบขอสิทธิ์: ผู้ใช้ขอให้ล็อกอินได้แค่อีเมลที่ได้รับอนุมัติแล้ว คนใหม่ต้อง
   กดขอสิทธิ์แล้วรอผู้ดูแลอนุมัติก่อนถึงจะเห็น/ใช้เครื่องมือได้ — เก็บสถานะที่ Firestore
   collection "users" เอกสารละ 1 อีเมล (ดู firestore.rules คู่กัน)

   ค่า config ของ Firebase (apiKey ฯลฯ) ไม่ใช่ความลับ — เหมือน OAuth Client ID เปิดเผยได้
   (ความปลอดภัยจริงมาจาก Firestore Security Rules + OAuth consent screen "Internal"
   ไม่ได้มาจากการซ่อนค่าพวกนี้) แต่ *ยังไม่ใช่ค่าจริง* จนกว่าจะเอาไปแทนตอนตั้งโปรเจกต์ Firebase */
const FB_CONFIG = {
  apiKey: "REPLACE_WITH_FIREBASE_API_KEY",
  authDomain: "REPLACE_WITH_PROJECT_ID.firebaseapp.com",
  projectId: "REPLACE_WITH_PROJECT_ID",
  storageBucket: "REPLACE_WITH_PROJECT_ID.appspot.com",
  messagingSenderId: "REPLACE_WITH_SENDER_ID",
  appId: "REPLACE_WITH_APP_ID",
};
/* ผู้ดูแลระบบ — คนเดียวที่อนุมัติ/ปฏิเสธคำขอได้ ต้องตรงกับ firestore.rules เสมอ */
const ADMIN_EMAIL = "anusart@planbmedia.co.th";
const AU_SCOPE = "https://www.googleapis.com/auth/drive.file";

let AU_APP = null, AU_AUTH = null, AU_DB = null;
let AU_USER = null;   /* {email,name} หลังล็อกอินสำเร็จ — null เมื่อยังไม่ล็อกอิน */
let AU_TOK = "";      /* Google OAuth access token (ใช้เรียก Drive เฟส 7) — หน่วยความจำเท่านั้น
                          ห้ามเขียนลง localStorage/Firestore/URL เด็ดขาด */
let AU_TOK_EXP = 0;
let AU_STATUS = "";   /* ""|"pending"|"approved"|"rejected" */

function auInit() {
  if (AU_APP) return;
  /* กันไว้ก่อน FB_CONFIG จะถูกแทนด้วยค่าจริง — ไม่ให้ error ตอน initializeApp() พังทั้งหน้า
     ทั้งที่ยังใช้ระบบเขียนคำสั่ง/แผนที่ในโหมดออฟไลน์-ทำงานต่อได้ตามปกติ */
  try {
    AU_APP = firebase.initializeApp(FB_CONFIG);
    AU_AUTH = firebase.auth();
    AU_DB = firebase.firestore();
    AU_AUTH.onAuthStateChanged(onAuthChange, (e) => toast("ระบบล็อกอินขัดข้อง: " + e.message, true));
  } catch (e) {
    toast("ตั้งค่า Firebase ไม่สำเร็จ (ยังไม่ได้ใส่ค่าจริง?) — ใช้งานส่วนเขียนคำสั่งได้ตามปกติ", true);
  }
}

async function onAuthChange(user) {
  if (!user) { AU_USER = null; AU_TOK = ""; AU_TOK_EXP = 0; AU_STATUS = ""; dvRenderAll(); return; }
  AU_USER = { email: user.email || "", name: user.displayName || user.email || "" };
  await auCheckStatus();
  dvRenderAll();
}

/* hosted_domain เป็นแค่คำใบ้ให้ตัวเลือกบัญชีของ Google กรองให้ดูง่ายขึ้น — ไม่ใช่ระบบความ
   ปลอดภัยจริง (แก้ในเบราว์เซอร์ตัวเองได้) กำแพงจริงคือ OAuth consent screen ตั้งเป็น Internal
   ที่ตั้งค่าไว้ใน Google Cloud Console ซึ่ง Google เป็นคนบังคับฝั่งเซิร์ฟเวอร์เอง */
function auSignIn() {
  auInit();
  if (!AU_AUTH) { toast("ระบบล็อกอินยังไม่พร้อม — ยังไม่ได้ตั้งค่า Firebase จริง", true); return; }
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.addScope(AU_SCOPE);
  provider.setCustomParameters({ hd: "planbmedia.co.th" });
  AU_AUTH.signInWithPopup(provider).then((result) => {
    const cred = firebase.auth.GoogleAuthProvider.credentialFromResult(result);
    AU_TOK = (cred && cred.accessToken) || "";
    AU_TOK_EXP = Date.now() + 3500 * 1000;
  }).catch((e) => toast("เข้าสู่ระบบไม่สำเร็จ: " + e.message, true));
}

function auSignOut() {
  AU_TOK = ""; AU_TOK_EXP = 0;
  /* เครื่องที่ใช้ร่วมกัน — ออกจากระบบแล้วต้องไม่เหลือภาพของคนก่อนหน้าให้คนถัดไปเห็น */
  if (typeof S !== "undefined") {
    S.refData = null; S.refB64 = ""; S.refFileName = ""; S.refW = 0; S.refH = 0;
    S.adData = null; S.adB64 = ""; S.adFileName = "";
    if (typeof sync === "function") sync();
  }
  AU_AUTH.signOut();
}

/* ต่ออายุ token เงียบๆ เมื่อใกล้หมดอายุ — ใช้ตอนเรียก Drive (เฟส 7)
   signInWithPopup ซ้ำมักไม่ต้องกดยืนยันอีกถ้าเซสชัน Google เดิมยังไม่ถูก revoke */
async function auToken() {
  if (AU_TOK && Date.now() < AU_TOK_EXP) return AU_TOK;
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.addScope(AU_SCOPE);
  const result = await AU_AUTH.signInWithPopup(provider);
  const cred = firebase.auth.GoogleAuthProvider.credentialFromResult(result);
  AU_TOK = (cred && cred.accessToken) || "";
  AU_TOK_EXP = Date.now() + 3500 * 1000;
  return AU_TOK;
}

function auIsAdmin() { return !!(AU_USER && AU_USER.email === ADMIN_EMAIL); }
function auIsApproved() { return AU_STATUS === "approved" || auIsAdmin(); }

/* ---- ระบบขอสิทธิ์การใช้งาน ---- */
async function auCheckStatus() {
  if (!AU_USER) return;
  try {
    const doc = await AU_DB.collection("users").doc(AU_USER.email).get();
    AU_STATUS = doc.exists ? (doc.data().status || "pending") : "";
  } catch (e) {
    AU_STATUS = "";
    toast("ตรวจสอบสิทธิ์การใช้งานไม่สำเร็จ: " + e.message, true);
  }
}
async function auRequestAccess() {
  if (!AU_USER) return;
  try {
    await AU_DB.collection("users").doc(AU_USER.email).set({
      email: AU_USER.email,
      name: AU_USER.name,
      status: "pending",
      requestedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    AU_STATUS = "pending";
    toast("ส่งคำขอสิทธิ์การใช้งานแล้ว — รอผู้ดูแลระบบอนุมัติ");
    dvRenderAll();
  } catch (e) {
    toast("ส่งคำขอไม่สำเร็จ: " + e.message, true);
  }
}

/* ---- หน้าอนุมัติของผู้ดูแล ---- */
async function auAdminRefresh() {
  if (!auIsAdmin()) return;
  $("auAdminList").innerHTML = "กำลังโหลด…";
  try {
    const snap = await AU_DB.collection("users").where("status", "==", "pending").get();
    if (snap.empty) { $("auAdminList").innerHTML = '<div class="empty">ไม่มีคำขอที่รอดำเนินการ</div>'; return; }
    $("auAdminList").innerHTML = snap.docs.map((d) => {
      const u = d.data();
      return '<div class="myrow"><div class="t"><b>' + esc(u.name || "") + "</b><em>" + esc(u.email || d.id) + "</em></div>" +
        '<button class="btn" data-approve="' + esc(d.id) + '" type="button">อนุมัติ</button>' +
        '<button class="btn" data-reject="' + esc(d.id) + '" type="button">ปฏิเสธ</button></div>';
    }).join("");
  } catch (e) {
    $("auAdminList").innerHTML = '<div class="empty">โหลดรายการไม่สำเร็จ: ' + esc(e.message) + "</div>";
  }
}
$("auAdminList").addEventListener("click", async (e) => {
  const ab = e.target.closest("[data-approve]"), rb = e.target.closest("[data-reject]");
  if (!ab && !rb) return;
  const id = ab ? ab.dataset.approve : rb.dataset.reject;
  const status = ab ? "approved" : "rejected";
  try {
    await AU_DB.collection("users").doc(id).update({
      status: status,
      reviewedAt: firebase.firestore.FieldValue.serverTimestamp(),
      reviewedBy: AU_USER.email,
    });
    toast(id + (ab ? " ได้รับสิทธิ์แล้ว" : " ถูกปฏิเสธแล้ว"));
    auAdminRefresh();
  } catch (e2) {
    toast("บันทึกไม่สำเร็จ: " + e2.message, true);
  }
});

/* ---- วาดสถานะทั้งหมด: แถบล็อกอิน + หน้ากันเข้า (gate) จนกว่าจะได้รับอนุมัติ ---- */
function dvRenderAll() {
  const signedIn = !!AU_USER;
  $("auSignInBtn").hidden = signedIn;
  $("auWho").hidden = !signedIn;
  if (signedIn) $("auWho").textContent = AU_USER.name + " (" + AU_USER.email + ")";
  $("auSignOutBtn").hidden = !signedIn;
  $("auAdminBtn").hidden = !(signedIn && auIsAdmin());

  const approved = signedIn && auIsApproved();
  $("auGateVeil").hidden = !signedIn || approved;
  if (signedIn && !approved) {
    if (AU_STATUS === "pending") {
      $("auGateTitle").textContent = "รอการอนุมัติสิทธิ์การใช้งาน";
      $("auGateMsg").textContent = "ส่งคำขอแล้วด้วยบัญชี " + AU_USER.email + " — กรุณารอผู้ดูแลระบบอนุมัติ";
      $("auRequestBtn").hidden = true;
    } else if (AU_STATUS === "rejected") {
      $("auGateTitle").textContent = "คำขอถูกปฏิเสธ";
      $("auGateMsg").textContent = "บัญชี " + AU_USER.email + " ไม่ได้รับสิทธิ์ใช้งานเครื่องมือนี้ — ติดต่อผู้ดูแลระบบ";
      $("auRequestBtn").hidden = true;
    } else {
      $("auGateTitle").textContent = "ยังไม่มีสิทธิ์การใช้งาน";
      $("auGateMsg").textContent = "บัญชี " + AU_USER.email + " ยังไม่เคยขอสิทธิ์ใช้งานเครื่องมือนี้";
      $("auRequestBtn").hidden = false;
    }
  }
  /* ล็อกส่วนแอปหลักไว้จนกว่าจะอนุมัติ — กันไม่ให้เห็นหรือใช้เครื่องมือก่อนได้รับอนุญาต */
  const ws = document.querySelector(".workspace");
  if (ws) ws.style.display = (!signedIn || approved) ? "" : "none";

  /* ปุ่ม Drive (73-drive-ui.web.js) โผล่เฉพาะคนที่ล็อกอินแล้วและได้รับอนุมัติแล้วเท่านั้น */
  const canUseDrive = signedIn && approved;
  if ($("dvSaveBtn")) $("dvSaveBtn").hidden = !canUseDrive;
  if ($("dvOpenBtn")) $("dvOpenBtn").hidden = !canUseDrive;
  if ($("dvNewBtn")) $("dvNewBtn").hidden = !canUseDrive;
}

$("auSignInBtn").addEventListener("click", auSignIn);
$("auSignOutBtn").addEventListener("click", auSignOut);
$("auRequestBtn").addEventListener("click", auRequestAccess);
$("auAdminBtn").addEventListener("click", () => { $("auAdminVeil").hidden = false; auAdminRefresh(); });
$("auAdminClose").addEventListener("click", () => { $("auAdminVeil").hidden = true; });

