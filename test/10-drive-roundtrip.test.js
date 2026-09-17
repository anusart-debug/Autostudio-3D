/* ---------------- โปรเจกต์ Drive: บันทึก/เปิดต้องได้ค่าเดิมกลับมาครบ ----------------
   ดักบั๊กชนิด S.styles เป็น Set → JSON.stringify ธรรมดาได้ {} เงียบๆ ไม่ error
   และดักบั๊กชนิด save/load อ่านรายชื่อ field คนละชุดกัน (DV_FIELD_IDS ต้องเป็นแหล่งเดียว)
   ทดสอบผ่าน window.__as3dProject (72-project.web.js) ตรงๆ — ไม่ยิง Drive จริงเลย
   เพราะ dvSerializeProject/dvApplyProject ไม่เรียก dvFetch อยู่แล้ว (รับ/คืนแค่ข้อมูลในหน่วยความจำ) */
const { join } = require("path");
const PAGE_URL = "file://" + join(__dirname, "..", "dist", "web", "index.html");
require("fs").mkdirSync(join(__dirname, "out"), { recursive: true });
const { chromium } = require(process.env.PW || "playwright");
const { expect, done } = require("./_expect");

const FIELD_VALUES = {
  negative: "ทดสอบ negative prompt แบบไม่ซ้ำค่าเริ่มต้น",
  artwork: "ทดสอบลายอาร์ตเวิร์กแบบไม่ซ้ำค่าเริ่มต้น",
  detail: "รายละเอียดเพิ่มเติมสำหรับเทสต์",
  bodyNotes: "โน้ตตัวถังสำหรับเทสต์",
  fidelity: "30",
  lockColor: false,
  lockBody: false,
  lockView: true,
  srcRatio: false,
  editStyle: true,
  col1: "#112233",
  col2: "#445566",
  adKeepScene: true,
  adFit: "fit",
};

(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage();
  const errs = [];
  pg.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));
  pg.on("console", (m) => { if (m.type() === "error" && !/TUNNEL|font/i.test(m.text())) errs.push("CONSOLE: " + m.text()); });

  await pg.goto(PAGE_URL);
  await pg.waitForTimeout(500);
  await pg.evaluate(() => document.getElementById("wzExit").click());
  await pg.waitForTimeout(300);

  await pg.evaluate((vals) => {
    Object.keys(vals).forEach((id) => {
      const el = document.getElementById(id);
      const v = vals[id];
      if (el.type === "checkbox") el.checked = v; else el.value = v;
    });
    const S = window.__as3dProject.S();
    S.vehicle = "shelter"; S.loc = "victory"; S.angle = "drone"; S.light = "neon";
    S.styles = new Set(["clean", "cine"]);
    S.lens = 5; S.weather = 3; S.ratio = 4; S.scale = 1.5; S.hdr = 42;
    // ตั้งหมุดกำหนดเองผ่านกลไกจริง (change event) เพื่อให้ PINX["victory"] ถูกเซ็ต
    // แล้วให้ dvSerializeMap() เก็บมันลง map.pin ตามที่ตั้งใจไว้จริงๆ
    document.getElementById("llLat").value = "13.700";
    document.getElementById("llLng").value = "100.500";
    document.getElementById("llLng").dispatchEvent(new Event("change", { bubbles: true }));
  }, FIELD_VALUES);

  const project = await pg.evaluate(() => window.__as3dProject.serialize());

  expect("styles ถูกแปลงเป็น array ไม่ใช่ {} (บั๊ก Set→JSON)", Array.isArray(project.prompt.styles), project.prompt.styles);
  expect("styles มีค่าที่ตั้งไว้ครบ", JSON.stringify([...project.prompt.styles].sort()) === JSON.stringify(["cine", "clean"]), project.prompt.styles);
  expect("vehicle/angle/light ตรงกับที่ตั้งไว้",
    project.prompt.vehicle === "shelter" && project.prompt.angle === "drone" && project.prompt.light === "neon",
    project.prompt);
  expect("lens/weather/ratio/scale/hdr ตรงกับที่ตั้งไว้",
    project.prompt.lens === 5 && project.prompt.weather === 3 && project.prompt.ratio === 4 &&
    project.prompt.scale === 1.5 && project.prompt.hdr === 42,
    project.prompt);
  expect("map.locId ตรงกับที่ตั้งไว้", project.map.locId === "victory", project.map);
  expect("map.pin เก็บพิกัดหมุดกำหนดเองไว้", project.map.pin && project.map.pin[0] === 13.7 && project.map.pin[1] === 100.5, project.map.pin);
  Object.keys(FIELD_VALUES).forEach((id) => {
    expect("fields." + id + " ตรงกับที่ตั้งไว้ก่อนบันทึก", project.fields[id] === FIELD_VALUES[id], project.fields[id]);
  });

  // เปลี่ยนทุกอย่างให้ต่างไปจากที่บันทึกไว้ ก่อนเรียก apply กลับ — พิสูจน์ว่า apply เขียนทับจริง ไม่ใช่ค่าที่ยังไม่ถูกแก้
  await pg.evaluate(() => {
    ["negative", "artwork", "detail", "bodyNotes"].forEach((id) => (document.getElementById(id).value = ""));
    document.getElementById("fidelity").value = "80";
    document.getElementById("lockColor").checked = true;
    document.getElementById("lockView").checked = false;
    document.getElementById("adFit").value = "relayout";
    document.getElementById("llLat").value = "";
    document.getElementById("llLng").value = "";
    const S = window.__as3dProject.S();
    S.vehicle = "wrap"; S.loc = "sathorn"; S.angle = "hero34"; S.light = "golden";
    S.styles = new Set(["ue5"]);
    S.lens = 0; S.weather = 0; S.ratio = 0; S.scale = 1; S.hdr = 75;
  });

  await pg.evaluate((p) => window.__as3dProject.apply(p, null, null), project);
  await pg.waitForTimeout(300);

  const restored = await pg.evaluate(() => {
    const S = window.__as3dProject.S();
    const fields = {};
    window.__as3dProject.fieldIds.forEach((id) => {
      const el = document.getElementById(id);
      fields[id] = el.type === "checkbox" ? el.checked : el.value;
    });
    return {
      vehicle: S.vehicle, loc: S.loc, angle: S.angle, light: S.light,
      styles: [...S.styles].sort(), stylesIsSet: S.styles instanceof Set,
      lens: S.lens, weather: S.weather, ratio: S.ratio, scale: S.scale, hdr: S.hdr,
      fields,
      llLat: document.getElementById("llLat").value,
      llLng: document.getElementById("llLng").value,
    };
  });

  expect("apply() คืน S.styles เป็น Set จริง (ไม่ใช่ array ค้าง)", restored.stylesIsSet, restored.stylesIsSet);
  expect("apply() คืนพิกัดหมุดกำหนดเอง (ผ่าน PINX/mapGo ไม่ใช่ DV_FIELD_IDS)",
    parseFloat(restored.llLat) === 13.7 && parseFloat(restored.llLng) === 100.5, [restored.llLat, restored.llLng]);
  expect("apply() คืนสไตล์ที่บันทึกไว้ครบ", JSON.stringify(restored.styles) === JSON.stringify(["cine", "clean"]), restored.styles);
  expect("apply() คืน vehicle/loc/angle/light ตรงกับที่บันทึกไว้",
    restored.vehicle === "shelter" && restored.loc === "victory" && restored.angle === "drone" && restored.light === "neon",
    restored);
  expect("apply() คืน lens/weather/ratio/scale/hdr ตรงกับที่บันทึกไว้",
    restored.lens === 5 && restored.weather === 3 && restored.ratio === 4 && restored.scale === 1.5 && restored.hdr === 42,
    restored);
  Object.keys(FIELD_VALUES).forEach((id) => {
    expect("apply() คืน fields." + id + " ตรงกับที่บันทึกไว้", restored.fields[id] === FIELD_VALUES[id], restored.fields[id]);
  });

  console.log(JSON.stringify({ project, restored, errs }, null, 1));
  expect("ไม่มี pageerror/console error", errs.length === 0, errs);
  done();
  await b.close();
})();
