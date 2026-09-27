/* ================= PLAN B GOOGLE DRIVE REAL ASSET LOADER =================
   ดึงไฟล์ภาพสื่อโฆษณาต้นแบบของจริง 100% จาก Google Drive โฟลเดอร์ Plan B:
   https://drive.google.com/drive/folders/1GbtqM4DQQ1I0ApTOf9XCBszWgHg7F1kH?usp=drive_link
   เชื่อมต่อผ่าน Server Proxy และ Google Drive Direct CDN รองรับการใช้งานได้จริง 100%
   ======================================================================== */

const PLANB_DRIVE_FOLDER_ID = "1GbtqM4DQQ1I0ApTOf9XCBszWgHg7F1kH";
let PLANB_DRIVE_ALL_FILES = [];
let PLANB_DRIVE_FILTER = "all";
let PLANB_DRIVE_SEARCH = "";

async function loadPlanBCatalog() {
  if (PLANB_DRIVE_ALL_FILES && PLANB_DRIVE_ALL_FILES.length > 0) {
    return PLANB_DRIVE_ALL_FILES;
  }

  // 1. ลองดึงจาก Server Endpoint /api/drive/catalog
  try {
    const res = await fetch("/api/drive/catalog");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        PLANB_DRIVE_ALL_FILES = data;
        return data;
      }
    }
  } catch (e) {
    console.warn("Could not fetch /api/drive/catalog, falling back...", e);
  }

  // 2. Fallback: รายการภาพสื่อหลักของ Plan B Media จาก Google Drive
  const fallbackAssets = [
    { id: "1rCuIsfPdMRHwMQV9Ve4Xg4Qst-_S68eg", name: "TSB02_FW_R.jpg", category: "Bus - Full Wrap (FW)", isImage: true, ext: "JPG" },
    { id: "1DUKSmjhkSGgZmqNXiAZv0aKeYTd--KuY", name: "TSB02_FW_L.jpg", category: "Bus - Full Wrap (FW)", isImage: true, ext: "JPG" },
    { id: "1mgcEa254ME4Z_a8YrwiPwYFdERMVGD2Q", name: "TSB02_back.jpg", category: "Bus - Full Wrap (FW)", isImage: true, ext: "JPG" },
    { id: "1ATITbP994rLyPUFw8upl-UvWKbzibIHY", name: "TSB02_L.jpg", category: "Bus - Half Wrap (HW)", isImage: true, ext: "JPG" },
    { id: "1BQqWRmO2n-LoT8YC41DgEUwEGMjVEu8K", name: "TSB02_R.jpg", category: "Bus - Half Wrap (HW)", isImage: true, ext: "JPG" },
    { id: "1SlntEDVQDf6EASq0sO2Rz3SzX8KhwOop", name: "Isuzu55_FW_R.jpg", category: "Bus - Full Wrap (FW)", isImage: true, ext: "JPG" },
    { id: "1Sb3QDMBFxl8Npd1iKCmJ_qEyMJOXHt0r", name: "Isuzu55_FW_L.jpg", category: "Bus - Full Wrap (FW)", isImage: true, ext: "JPG" },
    { id: "1hkfXeDa6nguEX9X5b49VG0tWHa8kIBu3", name: "Isuzu55-bcak.jpg", category: "Bus - Full Wrap (FW)", isImage: true, ext: "JPG" },
    { id: "10P6mPkogfvAx71UKk6r0vterJdNi0Uv8", name: "BLK_FW_R.jpg", category: "Bus - Full Wrap (FW)", isImage: true, ext: "JPG" },
    { id: "1oU6WlQ_U3tH7cnqMbklhAH7dfXwskNzA", name: "BLK_FW_L.jpg", category: "Bus - Full Wrap (FW)", isImage: true, ext: "JPG" },
    { id: "1zMuv9Zb4RUjGFJBQoZ0f46NaKAB7dJjb", name: "DGT-A1003 Victory Mall_0.JPG", category: "Digital OOH (DOOH)", isImage: true, ext: "JPG" },
    { id: "1KLxJ_gnxfqCxTK13sxEdq2890G1bw500", name: "DGT003 CHARTEREDSQUARE(แยกสาทร–สุรศักดิ์)_0.JPG", category: "Digital OOH (DOOH)", isImage: true, ext: "JPG" },
    { id: "1Uyd0h6ZFrwJg_Wx3mx5LzCGPb9UhKj6-", name: "DGT128 อโศก-เพชรบุรี_0.JPG", category: "Digital OOH (DOOH)", isImage: true, ext: "JPG" },
    { id: "1iIQv3TdcAwr8inYH99doQ0h8rWbv0UQS", name: "DGT132 อโศก-รัชดาภิเษก_0.JPG", category: "Digital OOH (DOOH)", isImage: true, ext: "JPG" },
    { id: "14ULhveQWCQh4B7x_bJJXx_lnr6Yhb3jX", name: "DGT154 BALCONY_0.JPG", category: "Digital OOH (DOOH)", isImage: true, ext: "JPG" },
    { id: "1WBn_6W09RuJlTUyxFDJ7hQBFTeFJLxqH", name: "DGT259 Liberty Square ถนนสีลม_0.JPG", category: "Digital OOH (DOOH)", isImage: true, ext: "JPG" },
    { id: "1btkH4xI4nBOEnstn-zBc_JDdXOXoSjRT", name: "So Bangkok - Rama 4 (2)_0.JPG", category: "Digital OOH (DOOH)", isImage: true, ext: "JPG" },
    { id: "1oBXCsAwKLdBpbtgPq0fjMUk-nHItMCI1", name: "ด่านดินแดง_1 copy.jpg", category: "Billboard", isImage: true, ext: "JPG" },
    { id: "1akiWKDsV6V8YfKlKGiOLndrkmBntoMUa", name: "ด่านอโศก 4_D1 copy.jpg", category: "Billboard", isImage: true, ext: "JPG" },
    { id: "1JGcGYaJ4bBHoQRGQ-KOvhzhCvPecpxPi", name: "พระราม 9 - RCA_Pack 4 copy.jpg", category: "Static OOH > Pole Wrap", isImage: true, ext: "JPG" },
    { id: "1wKIY6oRt7pSnAvvLyrZ8tcsQkQsGcrbT", name: "พระราม4-สาทร copy.jpg", category: "Static OOH > Pole Wrap", isImage: true, ext: "JPG" },
    { id: "1EYhqS9C3_4TUjU_Cs9jrw1k4JiHDgBke", name: "Muvads_FW-1.jpg", category: "Micro Transit - MuvMi / Tuk Tuk (Muvads)", isImage: true, ext: "JPG" },
    { id: "10ufaLIaEaQccoBFVAl2QkxOrGNU4VAaC", name: "Muvads-L.jpg", category: "Micro Transit - MuvMi / Tuk Tuk (Muvads)", isImage: true, ext: "JPG" },
    { id: "1HOt1B-swJ6IGvhmnHNGLiCYDZBAINlk6", name: "Muvads-R.jpg", category: "Micro Transit - MuvMi / Tuk Tuk (Muvads)", isImage: true, ext: "JPG" },
    { id: "1F6CSt_xK4alSW9IxR0ggSDCsw0lRBC6K", name: "Metro Poster_N copy.jpg", category: "Static OOH > Metro Poster", isImage: true, ext: "JPG" },
    { id: "1zgo5u6M9G3tIe8mgQ0ateoAdK2IS2_cu", name: "NCA_Station_1 copy.jpg", category: "Static OOH > NCA_Station", isImage: true, ext: "JPG" }
  ];
  PLANB_DRIVE_ALL_FILES = fallbackAssets;
  return fallbackAssets;
}

function openPlanBDriveModal() {
  const veil = $("planbDriveVeil");
  if (!veil) return;
  veil.hidden = false;
  renderPlanBDriveView();
}

function closePlanBDriveModal() {
  const veil = $("planbDriveVeil");
  if (veil) veil.hidden = true;
}

async function renderPlanBDriveView() {
  const body = $("planbDriveContent");
  if (!body) return;

  body.innerHTML = 
    '<div class="planb-drive-loading">'+
      '<div class="spinner"></div>'+
      '<div style="font-weight:600;color:var(--txt);margin-top:10px">กำลังเชื่อมต่อ Google Drive และดึงไฟล์จากคลัง Plan B...</div>'+
      '<div style="font-size:11.5px;color:var(--txt-mute);margin-top:4px">โฟลเดอร์: Plan B Media Asset Library</div>'+
    '</div>';

  try {
    const files = await loadPlanBCatalog();
    displayPlanBRealAssets(files);
  } catch (err) {
    console.error("Error loading Plan B catalog:", err);
    body.innerHTML = 
      '<div class="planb-drive-error">'+
        '<div style="color:var(--red,#ef4444);font-size:24px">⚠️</div>'+
        '<h4 style="margin:8px 0 4px;color:var(--txt)">ไม่สามารถดึงข้อมูลจาก Google Drive ได้</h4>'+
        '<p style="font-size:12px;color:var(--txt-dim);max-width:500px;margin:0 auto 14px">'+esc(err.message)+'</p>'+
        '<button type="button" class="btn primary" id="planbDriveRetryBtn">ลองใหม่อีกครั้ง</button>'+
      '</div>';
    const retry = $("planbDriveRetryBtn");
    if (retry) retry.addEventListener("click", renderPlanBDriveView);
  }
}

function displayPlanBRealAssets(files) {
  const body = $("planbDriveContent");
  if (!body) return;

  // Filter & Search
  let list = files.filter(f => f.isImage);
  if (PLANB_DRIVE_FILTER !== "all") {
    if (PLANB_DRIVE_FILTER === "bus") {
      list = list.filter(f => f.category.toLowerCase().includes("bus"));
    } else if (PLANB_DRIVE_FILTER === "digital") {
      list = list.filter(f => f.category.toLowerCase().includes("digital") || f.name.startsWith("DGT"));
    } else if (PLANB_DRIVE_FILTER === "billboard") {
      list = list.filter(f => f.category.toLowerCase().includes("billboard") || f.name.includes("ด่าน"));
    } else if (PLANB_DRIVE_FILTER === "static") {
      list = list.filter(f => f.category.toLowerCase().includes("static") && !f.name.includes("ด่าน"));
    } else if (PLANB_DRIVE_FILTER === "muvmi") {
      list = list.filter(f => f.category.toLowerCase().includes("muv") || f.name.toLowerCase().includes("muv"));
    } else if (PLANB_DRIVE_FILTER === "raw") {
      list = list.filter(f => f.category.includes("ไฟล์ดิบ"));
    }
  }

  if (PLANB_DRIVE_SEARCH.trim()) {
    const q = PLANB_DRIVE_SEARCH.toLowerCase().trim();
    list = list.filter(f => f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q));
  }

  let html = 
    '<div class="planb-drive-controls">'+
      '<div class="planb-drive-tabs">'+
        '<button type="button" class="planb-tab '+(PLANB_DRIVE_FILTER==="all"?"active":"")+'" data-filter="all">ทั้งหมด ('+files.filter(f=>f.isImage).length+')</button>'+
        '<button type="button" class="planb-tab '+(PLANB_DRIVE_FILTER==="bus"?"active":"")+'" data-filter="bus">🚌 รถเมล์ TSB / ขสมก.</button>'+
        '<button type="button" class="planb-tab '+(PLANB_DRIVE_FILTER==="digital"?"active":"")+'" data-filter="digital">🖥️ จอดิจิทัล LED</button>'+
        '<button type="button" class="planb-tab '+(PLANB_DRIVE_FILTER==="billboard"?"active":"")+'" data-filter="billboard">🏢 บิลบอร์ดทางด่วน</button>'+
        '<button type="button" class="planb-tab '+(PLANB_DRIVE_FILTER==="static"?"active":"")+'" data-filter="static">🚏 ป้าย & เสาไฟ (Static)</button>'+
        '<button type="button" class="planb-tab '+(PLANB_DRIVE_FILTER==="muvmi"?"active":"")+'" data-filter="muvmi">🛺 ตุ๊กตุ๊ก MuvMi</button>'+
        '<button type="button" class="planb-tab '+(PLANB_DRIVE_FILTER==="raw"?"active":"")+'" data-filter="raw">📁 ไฟล์ดิบ HD</button>'+
      '</div>'+
      '<div style="display:flex;gap:8px;align-items:center;margin-top:10px">'+
        '<div style="position:relative;flex:1">'+
          '<input type="text" id="planbDriveSearchInput" placeholder="ค้นหาชื่อสื่อ, เช่น TSB, Isuzu, อโศก, ด่านดินแดง..." value="'+esc(PLANB_DRIVE_SEARCH)+'" style="width:100%;padding:7px 10px 7px 30px;font-size:12px;border:1px solid var(--line);border-radius:var(--r);background:var(--ink-200);color:var(--txt)">'+
          '<svg viewBox="0 0 24 24" width="14" height="14" style="position:absolute;left:9px;top:9px;color:var(--txt-mute);pointer-events:none" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>'+
        '</div>'+
        '<a class="btn" href="https://drive.google.com/drive/folders/1GbtqM4DQQ1I0ApTOf9XCBszWgHg7F1kH?usp=drive_link" target="_blank" rel="noopener noreferrer" style="white-space:nowrap;font-size:11.5px">'+
          'เปิดโฟลเดอร์ Google Drive ↗'+
        '</a>'+
      '</div>'+
    '</div>';

  if (list.length === 0) {
    html += 
      '<div class="planb-drive-empty">'+
        '<p style="color:var(--txt)">ไม่พบภาพที่ตรงกับคำค้นหา "'+esc(PLANB_DRIVE_SEARCH)+'"</p>'+
        '<button type="button" class="btn" id="planbClearSearchBtn">ล้างการค้นหา</button>'+
      '</div>';
    body.innerHTML = html;
    bindDriveEvents(body);
    return;
  }

  html += '<div class="planb-drive-grid">';
  for (const item of list) {
    // ใช้ CDN thumbnail โดยตรงจาก Google หรือผ่าน API Proxy
    const thumbUrl = "https://lh3.googleusercontent.com/d/" + encodeURIComponent(item.id) + "=w400";
    const fallbackThumb = "/api/drive/file/" + encodeURIComponent(item.id);

    html += 
      '<div class="planb-drive-card" data-file-id="'+esc(item.id)+'" data-file-name="'+esc(item.name)+'" data-category="'+esc(item.category)+'">'+
        '<div class="planb-drive-thumb">'+
          '<img src="'+thumbUrl+'" alt="'+esc(item.name)+'" loading="lazy" onerror="if(this.src!=\''+fallbackThumb+'\'){this.src=\''+fallbackThumb+'\';}">'+
          '<span class="planb-drive-pill">'+esc(item.ext || "JPG")+'</span>'+
        '</div>'+
        '<div class="planb-drive-meta">'+
          '<div class="planb-drive-name" title="'+esc(item.name)+'">'+esc(item.name)+'</div>'+
          '<div style="font-size:10px;color:var(--txt-mute);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(item.category)+'</div>'+
          '<button type="button" class="btn primary planb-drive-select-btn" data-select-id="'+esc(item.id)+'">'+
            '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>'+
            ' ใช้รูปนี้'+
          '</button>'+
        '</div>'+
      '</div>';
  }
  html += '</div>';

  body.innerHTML = html;
  bindDriveEvents(body);
}

function bindDriveEvents(body) {
  // Tabs
  body.querySelectorAll(".planb-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      PLANB_DRIVE_FILTER = tab.dataset.filter;
      renderPlanBDriveView();
    });
  });

  // Search
  const searchInput = $("planbDriveSearchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      PLANB_DRIVE_SEARCH = e.target.value;
      const debounced = setTimeout(() => {
        renderPlanBDriveView();
      }, 250);
    });
  }

  const clearBtn = $("planbClearSearchBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      PLANB_DRIVE_SEARCH = "";
      renderPlanBDriveView();
    });
  }

  // Select File
  body.querySelectorAll(".planb-drive-card").forEach(card => {
    card.addEventListener("click", async (e) => {
      const fileId = card.dataset.fileId;
      const fileName = card.dataset.fileName;
      const category = card.dataset.category || "";
      await selectPlanBRealAsset(fileId, fileName, category, card);
    });
  });
}

async function selectPlanBRealAsset(fileId, fileName, category, cardEl) {
  const btn = cardEl ? cardEl.querySelector(".planb-drive-select-btn") : null;
  const originalText = btn ? btn.innerHTML : "";
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-sm"></span> กำลังดึงรูป...';
  }

  toast("กำลังดึงรูปภาพของจริงจาก Google Drive: " + fileName + "...");

  try {
    // ดาวน์โหลดรูปภาพจริงจาก Server Proxy หรือ Google Drive Direct
    let blob = null;
    try {
      const res = await fetch("/api/drive/file/" + encodeURIComponent(fileId));
      if (res.ok) {
        blob = await res.blob();
      }
    } catch (e1) {
      console.warn("Proxy download failed, trying direct Google Drive CDN...", e1);
    }

    if (!blob) {
      const directUrl = "https://lh3.googleusercontent.com/d/" + encodeURIComponent(fileId) + "=w1600";
      const directRes = await fetch(directUrl);
      if (!directRes.ok) throw new Error("ไม่สามารถดาวน์โหลดภาพจริงจาก Google Drive ได้");
      blob = await directRes.blob();
    }

    const fr = new FileReader();
    fr.onload = () => {
      const dataUrl = fr.result;
      if (typeof applyRefData === "function") {
        applyRefData(dataUrl, fileName, blob.type || "image/jpeg");
      } else {
        S.refData = dataUrl;
        S.refFileName = fileName;
        $("refImg").src = dataUrl;
        $("refName").textContent = fileName;
        $("refBox").hidden = false;
        sync();
      }

      // ปรับแต่งประเภทสื่อให้ตรงกับรูปจริงโดยอัตโนมัติ
      const catLower = category.toLowerCase();
      const nameLower = fileName.toLowerCase();
      if (catLower.includes("bus") || nameLower.includes("tsb") || nameLower.includes("isuzu") || nameLower.includes("blk")) {
        const busChip = document.querySelector('[data-media="VEHICLE"]');
        if (busChip) busChip.click();
      } else if (catLower.includes("digital") || nameLower.startsWith("dgt")) {
        const digChip = document.querySelector('[data-media="DIGITAL"]') || document.querySelector('[data-media="BILLBOARD"]');
        if (digChip) digChip.click();
      } else if (catLower.includes("billboard") || nameLower.includes("ด่าน")) {
        const billChip = document.querySelector('[data-media="BILLBOARD"]');
        if (billChip) billChip.click();
      } else if (catLower.includes("muv") || nameLower.includes("muv")) {
        const muvChip = document.querySelector('[data-media="VEHICLE"]');
        if (muvChip) muvChip.click();
      }

      closePlanBDriveModal();
      toast("ดึงภาพจริงจาก Google Drive สำเร็จ: " + fileName);
    };

    fr.onerror = () => {
      toast("อ่านข้อมูลภาพจาก Drive ล้มเหลว", true);
      if (btn) { btn.disabled = false; btn.innerHTML = originalText; }
    };

    fr.readAsDataURL(blob);
  } catch (err) {
    console.error("Download Drive asset error:", err);
    toast("ดึงรูปภาพจาก Google Drive ล้มเหลว: " + err.message, true);
    if (btn) { btn.disabled = false; btn.innerHTML = originalText; }
  }
}

function initPlanBDriveIntegration() {
  const openBtn = $("openPlanBDriveBtn");
  if (openBtn) openBtn.addEventListener("click", openPlanBDriveModal);

  const closeBtn = $("planbDriveClose");
  if (closeBtn) closeBtn.addEventListener("click", closePlanBDriveModal);
  const cancelBtn = $("planbDriveCancelBtn");
  if (cancelBtn) cancelBtn.addEventListener("click", closePlanBDriveModal);

  const pickRef = $("refPickDrive");
  if (pickRef) pickRef.addEventListener("click", openPlanBDriveModal);

  const veil = $("planbDriveVeil");
  if (veil) {
    veil.addEventListener("click", (e) => {
      if (e.target === veil) closePlanBDriveModal();
    });
  }
}

// ผูกระบบเมื่อโหลดสคริปต์
initPlanBDriveIntegration();
