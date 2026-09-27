/* ================= ล็อกอิน Google / Email + ระบบขอสิทธิ์การใช้งาน (เฉพาะเว็บ) =========================
   ใช้ Firebase Authentication รองรับทั้ง Email/Password และ Google Workspace (@planbmedia.co.th)
   พร้อมหน้าต่าง Login Gate บังคับยืนยันตัวตนก่อนเข้าใช้งานเครื่องมือ
   ================================================================================================ */
const FB_CONFIG = {
  apiKey: "AIzaSyDWU2rwhXy6_fF3erJvE9tNBbPyXWh-RR0",
  authDomain: "gen-lang-client-0918488476.firebaseapp.com",
  projectId: "gen-lang-client-0918488476",
  firestoreDatabaseId: "ai-studio-autostudio3d-98548812-6b7a-481a-82ab-6a03710b435a",
  storageBucket: "gen-lang-client-0918488476.firebasestorage.app",
  messagingSenderId: "528200928454",
  appId: "1:528200928454:web:85fe49901a3a8b21cd5bc7",
};

/* ผู้ดูแลระบบ — อนุมัติ/ปฏิเสธคำขอได้ */
const ADMIN_EMAIL = "anusart@planbmedia.co.th";
const AU_SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.readonly"
];

let AU_APP = null, AU_AUTH = null, AU_DB = null;
let AU_USER = null;   /* {email,name} หลังล็อกอินสำเร็จ — null เมื่อยังไม่ล็อกอิน */
let AU_TOK = "";      /* Google OAuth access token — หน่วยความจำเท่านั้น */
let AU_TOK_EXP = 0;
let AU_STATUS = "";   /* ""|"pending"|"approved"|"rejected" */

function auInit() {
  if (AU_APP) return;
  try {
    AU_APP = firebase.initializeApp(FB_CONFIG);
    AU_AUTH = firebase.auth();
    try {
      AU_DB = (FB_CONFIG.firestoreDatabaseId && typeof AU_APP.firestore === "function")
        ? AU_APP.firestore(FB_CONFIG.firestoreDatabaseId)
        : firebase.firestore();
    } catch(errDb) {
      console.warn("Using default firestore instance:", errDb);
      AU_DB = firebase.firestore();
    }
    AU_AUTH.onAuthStateChanged(onAuthChange, (e) => {
      console.error("Auth state error:", e);
      toast("ระบบล็อกอินขัดข้อง: " + e.message, true);
    });
  } catch (e) {
    console.error("Firebase init error:", e);
    toast("ตั้งค่า Firebase ไม่สำเร็จ: " + e.message, true);
  }

  // เติมอีเมลที่บันทึกไว้ล่าสุดในช่อง Email
  try {
    const saved = localStorage.getItem("as3d_saved_email");
    const input = $("auEmailInput");
    if (saved && input && !input.value) input.value = saved;
  } catch(e) {}
}

async function onAuthChange(user) {
  if (!user) {
    AU_USER = null;
    AU_TOK = "";
    AU_TOK_EXP = 0;
    AU_STATUS = "";
    dvRenderAll();
    return;
  }
  AU_USER = {
    email: user.email || "",
    name: user.displayName || (user.email ? user.email.split("@")[0] : "ผู้ใช้")
  };
  try {
    localStorage.setItem("as3d_saved_email", AU_USER.email);
  } catch(e) {}
  await auCheckStatus();
  dvRenderAll();
}

/* ล็อกอินด้วย Google Workspace */
function auSignIn() {
  auInit();
  if (!AU_AUTH) { toast("ระบบล็อกอินยังไม่พร้อม — กรุณารอสักครู่", true); return; }
  const provider = new firebase.auth.GoogleAuthProvider();
  AU_SCOPES.forEach((s) => provider.addScope(s));
  provider.setCustomParameters({ prompt: "select_account" });
  AU_AUTH.signInWithPopup(provider).then((result) => {
    const cred = firebase.auth.GoogleAuthProvider.credentialFromResult(result);
    AU_TOK = (cred && cred.accessToken) || "";
    AU_TOK_EXP = Date.now() + 3500 * 1000;
    toast("เข้าสู่ระบบด้วย Google สำเร็จ: " + (result.user.email || ""));
  }).catch((e) => {
    console.error("Google sign-in error:", e);
    if (e.code === "auth/popup-blocked") {
      toast("เบราว์เซอร์บล็อกหน้าต่างป๊อปอัป กรุณากดอนุญาตป๊อปอัป (Allow Popups)", true);
    } else if (e.code === "auth/popup-closed-by-user") {
      toast("ปิดหน้าต่างล็อกอินก่อนทำรายการเสร็จ", true);
    } else {
      toast("เข้าสู่ระบบไม่สำเร็จ: " + (e.message || e.code), true);
    }
  });
}

/* ล็อกอินด้วย Email & Password */
async function auSignInWithEmail() {
  auInit();
  const errBox = $("auLoginErr");
  if (errBox) { errBox.hidden = true; errBox.textContent = ""; }

  const emailInput = $("auEmailInput");
  const pwdInput = $("auPasswordInput");
  const email = emailInput ? emailInput.value.trim() : "";
  const pwd = pwdInput ? pwdInput.value : "";

  if (!email) {
    auShowLoginError("กรุณากรอก Email สำหรับเข้าใช้งาน");
    if (emailInput) emailInput.focus();
    return;
  }
  if (!pwd) {
    auShowLoginError("กรุณากรอกรหัสผ่านของคุณ");
    if (pwdInput) pwdInput.focus();
    return;
  }

  const submitBtn = $("auEmailSubmitBtn");
  const originalHtml = submitBtn ? submitBtn.innerHTML : "";
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-sm"></span> กำลังเข้าสู่ระบบ...';
  }

  try {
    const res = await AU_AUTH.signInWithEmailAndPassword(email, pwd);
    try { localStorage.setItem("as3d_saved_email", email); } catch(e) {}
    toast("เข้าสู่ระบบสำเร็จ: " + email);
  } catch (err) {
    console.error("Email sign-in error:", err);
    let msg = "เข้าสู่ระบบไม่สำเร็จ: " + err.message;
    if (err.code === "auth/user-not-found") {
      msg = "ไม่พบบัญชีผู้ใช้นี้ในระบบ กรุณากดปุ่ม 'ลงทะเบียนด้วย Email นี้' ด้านล่างเพื่อเริ่มใช้งาน";
    } else if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
      msg = "รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบหรือกด 'ลืมรหัสผ่าน?'";
    } else if (err.code === "auth/invalid-email") {
      msg = "รูปแบบ Email ไม่ถูกต้อง (ตัวอย่าง: name@planbmedia.co.th)";
    } else if (err.code === "auth/operation-not-allowed") {
      msg = "ระบบ Firebase ยังไม่ได้เปิดใช้ Email/Password กรุณาเข้าสู่ระบบด้วยปุ่ม Google Workspace ด้านบน";
    }
    auShowLoginError(msg);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHtml;
    }
  }
}

/* ลงทะเบียนผู้ใช้ใหม่ด้วย Email & Password */
async function auRegisterWithEmail() {
  auInit();
  const errBox = $("auLoginErr");
  if (errBox) { errBox.hidden = true; errBox.textContent = ""; }

  const emailInput = $("auEmailInput");
  const pwdInput = $("auPasswordInput");
  const email = emailInput ? emailInput.value.trim() : "";
  const pwd = pwdInput ? pwdInput.value : "";

  if (!email) {
    auShowLoginError("กรุณากรอก Email ที่ต้องการลงทะเบียน");
    if (emailInput) emailInput.focus();
    return;
  }
  if (!pwd || pwd.length < 6) {
    auShowLoginError("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
    if (pwdInput) pwdInput.focus();
    return;
  }

  const regBtn = $("auEmailRegisterBtn");
  const originalHtml = regBtn ? regBtn.innerHTML : "";
  if (regBtn) {
    regBtn.disabled = true;
    regBtn.innerHTML = '<span class="spinner-sm"></span> กำลังลงทะเบียน...';
  }

  try {
    const res = await AU_AUTH.createUserWithEmailAndPassword(email, pwd);
    try { localStorage.setItem("as3d_saved_email", email); } catch(e) {}
    toast("ลงทะเบียนและเข้าสู่ระบบสำเร็จ: " + email);
  } catch (err) {
    console.error("Register error:", err);
    let msg = "ลงทะเบียนไม่สำเร็จ: " + err.message;
    if (err.code === "auth/email-already-in-use") {
      msg = "อีเมลนี้ได้ลงทะเบียนไว้แล้ว กรุณากดปุ่ม 'เข้าสู่ระบบด้วย Email' หรือกด 'ลืมรหัสผ่าน?'";
    } else if (err.code === "auth/weak-password") {
      msg = "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร";
    } else if (err.code === "auth/operation-not-allowed") {
      msg = "ระบบ Firebase ยังไม่ได้เปิดใช้ Email/Password กรุณาเข้าสู่ระบบด้วยปุ่ม Google Workspace ด้านบน";
    }
    auShowLoginError(msg);
  } finally {
    if (regBtn) {
      regBtn.disabled = false;
      regBtn.innerHTML = originalHtml;
    }
  }
}

/* ส่งลิงก์รีเซ็ตรหัสผ่านทาง Email */
async function auForgotPassword() {
  auInit();
  const emailInput = $("auEmailInput");
  const email = emailInput ? emailInput.value.trim() : "";
  if (!email) {
    auShowLoginError("กรุณากรอก Email ของคุณในช่องด้านบนก่อน เพื่อรับลิงก์รีเซ็ตรหัสผ่าน");
    if (emailInput) emailInput.focus();
    return;
  }
  try {
    await AU_AUTH.sendPasswordResetEmail(email);
    toast("ส่งลิงก์รีเซ็ตรหัสผ่านไปยัง " + email + " แล้ว กรุณาตรวจสอบกล่องจดหมาย");
  } catch (e) {
    auShowLoginError("ส่งคำขอรีเซ็ตรหัสผ่านไม่สำเร็จ: " + e.message);
  }
}

function auShowLoginError(msg) {
  const errBox = $("auLoginErr");
  if (errBox) {
    errBox.textContent = msg;
    errBox.hidden = false;
  } else {
    toast(msg, true);
  }
}

function auSignOut() {
  AU_TOK = ""; AU_TOK_EXP = 0; AU_USER = null; AU_STATUS = "";
  if (typeof S !== "undefined") {
    S.refData = null; S.refB64 = ""; S.refFileName = ""; S.refW = 0; S.refH = 0;
    S.adData = null; S.adB64 = ""; S.adFileName = "";
    if (typeof sync === "function") sync();
  }
  if (AU_AUTH) AU_AUTH.signOut();
  toast("ออกจากระบบเรียบร้อยแล้ว");
  dvRenderAll();
}

async function auToken() {
  if (AU_TOK && Date.now() < AU_TOK_EXP) return AU_TOK;
  const provider = new firebase.auth.GoogleAuthProvider();
  AU_SCOPES.forEach((s) => provider.addScope(s));
  const result = await AU_AUTH.signInWithPopup(provider);
  const cred = firebase.auth.GoogleAuthProvider.credentialFromResult(result);
  AU_TOK = (cred && cred.accessToken) || "";
  AU_TOK_EXP = Date.now() + 3500 * 1000;
  return AU_TOK;
}

function auIsAdmin() { return !!(AU_USER && AU_USER.email === ADMIN_EMAIL); }

function auIsApproved() {
  if (!AU_USER || !AU_USER.email) return false;
  if (AU_USER.email === ADMIN_EMAIL) return true;
  // พนักงาน Plan B Media (@planbmedia.co.th) ได้รับสิทธิ์ใช้งาน หรือได้รับการอนุมัติใน Firestore
  if (AU_USER.email.toLowerCase().endsWith("@planbmedia.co.th") || AU_STATUS === "approved") {
    return true;
  }
  return AU_STATUS === "approved";
}

/* ---- ระบบขอสิทธิ์การใช้งาน (สำหรับอีเมลภายนอกองค์กร) ---- */
async function auCheckStatus() {
  if (!AU_USER) return;
  try {
    const doc = await AU_DB.collection("users").doc(AU_USER.email).get();
    AU_STATUS = doc.exists ? (doc.data().status || "pending") : "";
  } catch (e) {
    AU_STATUS = "";
    console.warn("auCheckStatus:", e.message);
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

const adminList = $("auAdminList");
if (adminList) {
  adminList.addEventListener("click", async (e) => {
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
}

/* ---- วาดสถานะทั้งหมด: หน้าต่าง Login ก่อนเข้าใช้งาน + หน้ากันเข้า (gate) ---- */
function dvRenderAll() {
  const signedIn = !!AU_USER;
  const approved = signedIn && auIsApproved();

  // 1. หน้าต่าง Login Modal: โผล่ปิดทับทั้งจอเมื่อยังไม่ล็อกอิน
  const loginVeil = $("auLoginVeil");
  if (loginVeil) loginVeil.hidden = signedIn;

  // 2. หน้าต่าง Gate: โผล่เฉพาะคนที่ล็อกอินแล้วแต่ยังไม่ได้รับอนุมัติ (เช่น อีเมลภายนอก)
  const gateVeil = $("auGateVeil");
  if (gateVeil) {
    gateVeil.hidden = !signedIn || approved;
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
  }

  // 3. แถบ Header: อัปเดตข้อมูลผู้ใช้งานและปุ่มล็อกอิน/ออกจากระบบ
  if ($("auSignInBtn")) $("auSignInBtn").hidden = signedIn;
  if ($("auWho")) {
    $("auWho").hidden = !signedIn;
    if (signedIn) {
      const badge = auIsAdmin() ? " [Admin]" : (AU_USER.email.endsWith("@planbmedia.co.th") ? " [Plan B]" : "");
      $("auWho").textContent = AU_USER.name + badge;
      $("auWho").title = AU_USER.email;
    }
  }
  if ($("auSignOutBtn")) $("auSignOutBtn").hidden = !signedIn;
  if ($("auAdminBtn")) $("auAdminBtn").hidden = !(signedIn && auIsAdmin());

  // 4. ล็อกส่วน workspace ไม่ให้แสดงหรือใช้งานจนกว่าจะล็อกอินและได้รับอนุญาต
  const ws = document.querySelector(".workspace");
  if (ws) ws.style.display = (signedIn && approved) ? "" : "none";

  // 5. ปุ่ม Drive และโปรเจกต์
  const canUseDrive = signedIn && approved;
  if ($("dvSaveBtn")) $("dvSaveBtn").hidden = !canUseDrive;
  if ($("dvOpenBtn")) $("dvOpenBtn").hidden = !canUseDrive;
  if ($("dvNewBtn")) $("dvNewBtn").hidden = !canUseDrive;
}

/* ผูก Event Listeners */
function auBindEvents() {
  const signInBtn = $("auSignInBtn");
  if (signInBtn) signInBtn.addEventListener("click", () => {
    const loginVeil = $("auLoginVeil");
    if (loginVeil) loginVeil.hidden = false;
    else auSignIn();
  });

  const googleBtn = $("auLoginGoogleBtn");
  if (googleBtn) googleBtn.addEventListener("click", auSignIn);

  const emailSubmitBtn = $("auEmailSubmitBtn");
  if (emailSubmitBtn) emailSubmitBtn.addEventListener("click", auSignInWithEmail);

  const emailForm = $("auEmailForm");
  if (emailForm) emailForm.addEventListener("submit", (e) => {
    e.preventDefault();
    auSignInWithEmail();
  });

  const registerBtn = $("auEmailRegisterBtn");
  if (registerBtn) registerBtn.addEventListener("click", auRegisterWithEmail);

  const forgotBtn = $("auForgotPasswordBtn");
  if (forgotBtn) forgotBtn.addEventListener("click", auForgotPassword);

  const pwdToggle = $("auPwdToggle");
  if (pwdToggle) {
    pwdToggle.addEventListener("click", () => {
      const pwdInput = $("auPasswordInput");
      if (!pwdInput) return;
      if (pwdInput.type === "password") {
        pwdInput.type = "text";
        pwdToggle.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
      } else {
        pwdInput.type = "password";
        pwdToggle.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
      }
    });
  }

  const signOutBtn = $("auSignOutBtn");
  if (signOutBtn) signOutBtn.addEventListener("click", auSignOut);

  const reqBtn = $("auRequestBtn");
  if (reqBtn) reqBtn.addEventListener("click", auRequestAccess);

  const adminBtn = $("auAdminBtn");
  if (adminBtn) adminBtn.addEventListener("click", () => {
    $("auAdminVeil").hidden = false;
    auAdminRefresh();
  });

  const adminClose = $("auAdminClose");
  if (adminClose) adminClose.addEventListener("click", () => {
    $("auAdminVeil").hidden = true;
  });
}

auBindEvents();
