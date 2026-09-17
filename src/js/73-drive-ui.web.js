/* ================= หน้าตาการบันทึก/เปิดโปรเจกต์บน Drive (เฉพาะเว็บ) =========================
   DV_CUR ตามโปรเจกต์ที่เปิดอยู่ตอนนี้ — ว่างเปล่าหมายถึงยังไม่ได้บันทึก/เปิดอะไรเลย
   headRevisionId เก็บไว้เช็กว่ามีคนอื่นแก้ไฟล์เดียวกันไปแล้วหรือยังก่อนบันทึกทับ (ใน My Drive
   ของแต่ละคนจะไม่ชนกันจริงเพราะคนละที่เก็บ แต่ทำบัญชีนี้ไว้เผื่ออนาคตแชร์โฟลเดอร์ร่วมกัน) */
let DV_CUR = {};

function dvBlobToDataUrl(blob) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = () => rej(new Error("อ่านไฟล์ภาพไม่สำเร็จ"));
    fr.readAsDataURL(blob);
  });
}

async function dvCreateProject(name) {
  toast("กำลังบันทึก…");
  try {
    const root = await dvRoot();
    const folder = await dvCreateFolder(name, root);
    const proj = dvSerializeProject();
    const jsonBlob = new Blob([JSON.stringify(proj, null, 1)], { type: "application/json" });
    const jsonFile = await dvCreateFile("project.json", folder.id, jsonBlob);
    let refFileId = "", adFileId = "";
    if (S.refB64) { const f = await dvCreateFile("reference.jpg", folder.id, dvB64Blob(S.refB64, S.refMime)); refFileId = f.id; }
    if (S.adB64) { const f = await dvCreateFile("artwork.jpg", folder.id, dvB64Blob(S.adB64, S.adMime)); adFileId = f.id; }
    DV_CUR = { folderId: folder.id, name: name, jsonId: jsonFile.id, rev: jsonFile.headRevisionId || "", refFileId: refFileId, adFileId: adFileId };
    toast("บันทึกโปรเจกต์ " + name + " แล้ว");
  } catch (e) {
    toast("บันทึกไม่สำเร็จ: " + e.message, true);
  }
}

async function dvSaveExisting() {
  toast("กำลังบันทึก…");
  try {
    /* เช็ก conflict ก่อนทับ — เกิดได้เมื่อเปิดโฟลเดอร์เดียวกันจากหลายแท็บ/เครื่อง */
    const r = await dvFetch(DV_API + "/files/" + DV_CUR.jsonId + "?fields=headRevisionId");
    const meta = await r.json();
    if (DV_CUR.rev && meta.headRevisionId && meta.headRevisionId !== DV_CUR.rev) {
      const ok = window.confirm(
        "ไฟล์นี้ถูกแก้ไขไปแล้วหลังจากที่คุณเปิดมา\nกด ตกลง เพื่อบันทึกทับ (เนื้อหาที่แก้ไว้ก่อนจะหายไป) หรือ ยกเลิก เพื่อไม่บันทึก"
      );
      if (!ok) return;
    }
    const proj = dvSerializeProject();
    const jsonBlob = new Blob([JSON.stringify(proj, null, 1)], { type: "application/json" });
    const updated = await dvUpdateFile(DV_CUR.jsonId, jsonBlob);
    DV_CUR.rev = updated.headRevisionId || DV_CUR.rev;
    if (S.refB64) {
      if (DV_CUR.refFileId) await dvUpdateFile(DV_CUR.refFileId, dvB64Blob(S.refB64, S.refMime));
      else { const f = await dvCreateFile("reference.jpg", DV_CUR.folderId, dvB64Blob(S.refB64, S.refMime)); DV_CUR.refFileId = f.id; }
    }
    if (S.adB64) {
      if (DV_CUR.adFileId) await dvUpdateFile(DV_CUR.adFileId, dvB64Blob(S.adB64, S.adMime));
      else { const f = await dvCreateFile("artwork.jpg", DV_CUR.folderId, dvB64Blob(S.adB64, S.adMime)); DV_CUR.adFileId = f.id; }
    }
    toast("บันทึกโปรเจกต์แล้ว");
  } catch (e) {
    toast("บันทึกไม่สำเร็จ: " + e.message, true);
  }
}

function dvSaveFlow() {
  if (!DV_CUR.folderId) {
    const def = (curLoc().th || "") + " · " + ((find(list("vehicle"), S.vehicle) || {}).th || "");
    const name = window.prompt("ชื่อโปรเจกต์:", def);
    if (!name) return;
    dvCreateProject(name);
  } else {
    dvSaveExisting();
  }
}

async function dvOpenProject(folderId) {
  toast("กำลังเปิดโปรเจกต์…");
  try {
    const kids = await dvListChildren(folderId);
    const jsonFile = kids.find((k) => k.name === "project.json");
    if (!jsonFile) throw new Error("ไม่พบ project.json ในโฟลเดอร์นี้");
    const proj = JSON.parse(await dvGetText(jsonFile.id));
    const refFile = kids.find((k) => k.name === "reference.jpg");
    const adFile = kids.find((k) => k.name === "artwork.jpg");
    const refUrl = refFile ? await dvBlobToDataUrl(await dvGetBlob(refFile.id)) : null;
    const adUrl = adFile ? await dvBlobToDataUrl(await dvGetBlob(adFile.id)) : null;
    await dvApplyProject(proj, refUrl, adUrl);
    DV_CUR = {
      folderId: folderId, jsonId: jsonFile.id, rev: jsonFile.headRevisionId || "",
      refFileId: refFile ? refFile.id : "", adFileId: adFile ? adFile.id : "",
    };
    toast("เปิดโปรเจกต์แล้ว");
  } catch (e) {
    toast("เปิดโปรเจกต์ไม่สำเร็จ: " + e.message, true);
  }
}

async function dvOpenDialogShow() {
  $("dvVeil").hidden = false;
  $("dvList").innerHTML = "กำลังโหลด…";
  try {
    const items = await dvList();
    if (!items.length) { $("dvList").innerHTML = '<div class="empty">ยังไม่มีโปรเจกต์ที่บันทึกไว้</div>'; return; }
    $("dvList").innerHTML = items.map((it) =>
      '<div class="myrow"><div class="t"><b>' + esc(it.name) + '</b><em>' +
      esc(new Date(it.modifiedTime).toLocaleString("th-TH")) + '</em></div>' +
      '<button class="btn" data-open="' + esc(it.id) + '" type="button">เปิด</button>' +
      '<button class="btn" data-rename="' + esc(it.id) + '" data-name="' + esc(it.name) + '" type="button">เปลี่ยนชื่อ</button>' +
      '<button class="btn" data-trash="' + esc(it.id) + '" type="button">ลบ</button></div>'
    ).join("");
  } catch (e) {
    $("dvList").innerHTML = '<div class="empty">โหลดรายการไม่สำเร็จ: ' + esc(e.message) + "</div>";
  }
}

$("dvList").addEventListener("click", async (e) => {
  const ob = e.target.closest("[data-open]"), rb = e.target.closest("[data-rename]"), tb = e.target.closest("[data-trash]");
  if (ob) { $("dvVeil").hidden = true; await dvOpenProject(ob.dataset.open); return; }
  if (rb) {
    const nn = window.prompt("ชื่อใหม่:", rb.dataset.name);
    if (nn && nn !== rb.dataset.name) {
      try { await dvRenameFolder(rb.dataset.rename, nn); } catch (e2) { toast("เปลี่ยนชื่อไม่สำเร็จ: " + e2.message, true); }
      dvOpenDialogShow();
    }
    return;
  }
  if (tb) {
    if (!window.confirm("ย้ายโปรเจกต์นี้ไปถังขยะ? กู้คืนได้ 30 วันจาก Google Drive")) return;
    try { await dvTrash(tb.dataset.trash); } catch (e2) { toast("ลบไม่สำเร็จ: " + e2.message, true); }
    if (DV_CUR.folderId === tb.dataset.trash) DV_CUR = {};
    dvOpenDialogShow();
  }
});
$("dvOpenBtn").addEventListener("click", dvOpenDialogShow);
$("dvSaveBtn").addEventListener("click", dvSaveFlow);
$("dvClose").addEventListener("click", () => { $("dvVeil").hidden = true; });
$("dvNewBtn").addEventListener("click", () => {
  if (!window.confirm("เริ่มโปรเจกต์ใหม่? งานที่ยังไม่บันทึกลง Drive จะหายไป")) return;
  location.reload();
});

