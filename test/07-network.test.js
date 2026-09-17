/* ---------------- ยามป้องกันข้อมูลรั่วไหล: ไฟล์ออฟไลน์ต้องไม่ต่อกับ Google เลย ----------------
   ครึ่งแรก (static): grep ไฟล์ dist/autostudio3d.html ที่ build แล้ว ต้องไม่มีสตริงที่บอกว่า
   มีการล็อกอิน/เรียก Google Drive อยู่จริง — พิสูจน์ได้ทันทีโดยไม่ต้องเปิดเบราว์เซอร์เลย
   ครึ่งหลัง (dynamic): เปิดแอปจริงแล้วไล่ใช้งานครบวงจร จับทุก request/popup แล้วเทียบกับ allowlist
   ตามธีมของแอปนี้ที่ไม่มี API key/OAuth — ไฟล์ file:// ห้ามยิงอะไรออกไปนอกเหนือ Overpass + ฟอนต์เลย */
const { readFileSync } = require("fs");
const { join } = require("path");
const PAGE_URL = "file://" + join(__dirname, "..", "dist", "autostudio3d.html");
require("fs").mkdirSync(join(__dirname, "out"), { recursive: true });
const { chromium } = require(process.env.PW || "playwright");
const { expect, done } = require("./_expect");

/* ---- ครึ่งแรก: static grep ---- */
const html = readFileSync(join(__dirname, "..", "dist", "autostudio3d.html"), "utf8");
/* ตั้งใจให้เป็น URL/สตริงที่เจาะจง ไม่ใช่คำเปล่าๆ — เพราะไฟล์นี้มีคอมเมนต์ภาษาไทยที่พูดถึง
   ชื่อโดเมนพวกนี้ตรงๆ ด้วยเหตุผลทางประวัติศาสตร์ (เช่น "ถอด maps.mail.ru ออกแล้ว")
   ถ้าใช้คำเปล่าจะจับคอมเมนต์ตัวเองเป็นบวกลวง ต้องเจาะจงเป็นรูปแบบ URL จริงเท่านั้น */
const FORBIDDEN = [
  "https://accounts.google.com",
  "https://www.googleapis.com",
  "https://oauth2.googleapis.com",
  "initTokenClient(",
  "access_token=",
  "client_id=",
  "client_secret",
  "GOCSPX-",
  "https://maps.mail.ru",
  "/drive/v3",
  // v41 เฟส 6: Firebase Auth/Firestore เป็นของเว็บเท่านั้น
  "firebasejs",
  "firebase.initializeApp",
  "identitytoolkit.googleapis.com",
  "firestore.googleapis.com",
  "FB_CONFIG",
  "ADMIN_EMAIL",
];
const hits = FORBIDDEN.filter((s) => html.includes(s));
expect("ไฟล์ออฟไลน์ไม่มีสตริงที่เกี่ยวกับ Google sign-in/Drive", hits.length === 0, hits);

/* v41 เฟส 5: ยามคุมกลไก "ตัดออก ไม่ใช่ใส่ flag" ของ build.mjs เอง — ไฟล์ออฟไลน์กับไฟล์เว็บ
   ต้องต่างกันจริง (ไม่ใช่บังเอิญเหมือนกันเพราะยังไม่มีใครใส่โค้ดเว็บ) ไฟล์ออฟไลน์ต้องไม่มี
   คำว่า dvBar หลุดเข้าไปแม้แต่ตัวอักษรเดียว ไฟล์เว็บต้องมี — ถ้าข้อนี้แดงเพราะมีคนย้าย
   marker @@WEB@@ ผิดที่ หรือลืมใส่ .web.js suffix ให้โมดูลใหม่ */
const webHtmlPath = join(__dirname, "..", "dist", "web", "index.html");
let webHtml = "";
try { webHtml = readFileSync(webHtmlPath, "utf8"); } catch (e) {}
expect("มีไฟล์เว็บ dist/web/index.html ให้ตรวจ (รัน node build.mjs ก่อน)", webHtml.length > 0);
expect("ไฟล์ออฟไลน์ไม่มี dvBar (แถบ Drive เป็นของเว็บเท่านั้น)", !html.includes("dvBar"));
expect("ไฟล์เว็บมี dvBar (พิสูจน์ว่ากลไกตัด/เก็บบล็อก @@WEB@@ ทำงานจริง ไม่ใช่เหมือนกันโดยบังเอิญ)", webHtml.includes("dvBar"));
expect("ไฟล์ออฟไลน์ประกาศ TARGET เป็น file", html.includes('const TARGET="file"'));
expect("ไฟล์เว็บมี Firebase SDK (พิสูจน์ .web.js ไม่ได้ถูกกรองออกผิดที่)", webHtml.includes("firebasejs"));
expect("ไฟล์เว็บมี auInit (70-auth.web.js รวมเข้าไปจริง)", webHtml.includes("function auInit"));
expect("ไฟล์เว็บประกาศ TARGET เป็น web", webHtml.includes('const TARGET="web"'));

/* ---- ครึ่งหลัง: dynamic — ไล่ใช้งานครบวงจรแล้วเทียบ request ทุกตัวกับ allowlist ---- */
const ALLOW = [
  /^file:\/\//,
  /^data:/,
  /^blob:/,
  /^about:/,
  /^https:\/\/fonts\.googleapis\.com\//,
  /^https:\/\/fonts\.gstatic\.com\//,
  /^https:\/\/overpass-api\.de\//,
  /^https:\/\/overpass\.private\.coffee\//,
  /^https:\/\/overpass\.osm\.ch\//,
  /^https:\/\/(www\.)?chatgpt\.com\//, // #hoDest เปิดด้วย window.open ตามคำสั่งผู้ใช้ ไม่ใช่การรั่ว
];

function fixture(lat, lng) {
  const el = [];
  el.push({ type: "node", id: 100, lat, lon: lng, tags: { highway: "bus_stop", name: "ป้ายทดสอบ" } });
  el.push({
    type: "relation",
    id: 9000,
    tags: { type: "route", route: "bus", ref: "77 (3-45)", name: "สาย 77", from: "ก", to: "ข" },
  });
  el.push({
    type: "way",
    id: 1,
    tags: { highway: "primary", name: "ถนนทดสอบ" },
    geometry: [{ lat: lat - 0.003, lon: lng }, { lat, lon: lng }, { lat: lat + 0.003, lon: lng }],
  });
  return { elements: el };
}

(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1500, height: 1050 } });
  const seen = [];
  pg.on("request", (r) => seen.push(r.url()));
  pg.on("popup", (p) => {
    seen.push("POPUP:" + p.url());
    p.close().catch(() => {});
  });
  const errs = [];
  pg.on("pageerror", (e) => errs.push(e.message));

  await pg.route("**/api/interpreter", async (r) => {
    r.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(fixture(13.722, 100.529)),
    });
  });

  await pg.goto(PAGE_URL);
  await pg.waitForTimeout(600);
  await pg.evaluate(() => document.getElementById("wzExit").click());
  await pg.waitForTimeout(250);
  await pg.evaluate(() => document.querySelector('#locChips [data-id="sathorn"]').click());
  await pg.waitForTimeout(250);
  await pg.click("#ovpBtn");
  await pg.waitForFunction(() => /ดึงแผนที่/.test(document.getElementById("ovpBtn").textContent), { timeout: 30000 });
  await pg.click("#sheetBtn");
  await pg.waitForTimeout(500);
  await pg.click("#sheetClose").catch(() => {});
  await pg.click("#reviewBtn");
  await pg.waitForTimeout(300);
  await pg.click("#revGo");
  await pg.waitForTimeout(300);
  // #hoDest เปิดปลายทาง AI ด้วย window.open โดยตั้งใจ — เป็นพฤติกรรมที่ถูกต้อง ไม่ใช่การรั่ว
  // จับไว้ใน allowlist ด้านบนแทนการเลี่ยงไม่คลิก เพื่อพิสูจน์ว่ามันเปิด "แค่" เว็บ AI ปลายทางจริง
  const dest = await pg.$("#hoDest .dcard");
  if (dest) await dest.click();
  await pg.waitForTimeout(400);

  const bad = seen.filter((u) => !ALLOW.some((re) => re.test(u)));
  console.log(JSON.stringify({ seenCount: seen.length, bad, errs }, null, 1));
  expect("ทุก request/popup อยู่ใน allowlist ที่อนุญาต", bad.length === 0, bad);
  expect("ไม่มี pageerror", errs.length === 0, errs);
  done();
  await b.close();
})();
