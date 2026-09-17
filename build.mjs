#!/usr/bin/env node
/**
 * AUTOSTUDIO 3D — build
 *
 * v41 (เฟส 5): ประกอบซอร์สใน src/ เป็นสองไฟล์ปลายทาง จากซอร์สเดียวกัน —
 *   file → dist/autostudio3d.html   ไฟล์เดียว ดับเบิลคลิกเปิดจาก file:// ไม่มี Drive/sign-in เลย
 *   web  → dist/web/index.html      ไว้ขึ้น Firebase Hosting มี Google sign-in + Drive (เฟส 6-7)
 *
 * หลักการ: "ตัดออก ไม่ใช่ใส่ flag" — โมดูล JS ที่ใช้เฉพาะเว็บใช้นามสกุล .web.js แล้ว build
 * กรองออกตอนสร้างไฟล์ออฟไลน์ ทำให้พิสูจน์ได้ด้วย grep ว่าไฟล์ออฟไลน์ไม่มีสตริงเกี่ยวกับ
 * Google sign-in/Drive อยู่จริง (ดู test/07-network.test.js ครึ่งแรก) ไม่ใช่แค่ "โค้ดมีอยู่แต่
 * ไม่ทำงาน" — และถ้าโมดูลเว็บพัง (syntax error ฯลฯ) ก็ทำลายได้แค่ไฟล์เว็บ ไม่กระทบไฟล์ออฟไลน์
 *
 * โมดูล JS ต่อกันตรงๆ ตามลำดับใน src/js/_order.json แล้วห่อด้วย IIFE เดียว
 * ทุกไฟล์จึงใช้ scope ร่วมกัน ไม่มี import/export โดยตั้งใจ
 * **ลำดับสำคัญ** — const/let ไม่ hoist ข้ามไฟล์ อย่าสลับลำดับถ้าไม่ได้ตรวจ
 *
 * ใช้: node build.mjs                  → สร้างทั้งสองไฟล์
 *      node build.mjs --target=file    → เฉพาะไฟล์ออฟไลน์
 *      node build.mjs --target=web     → เฉพาะไฟล์เว็บ (สร้าง firebase.json ให้ด้วย)
 *      node build.mjs --check          → ตรวจว่าตรงกับ dist เดิมทุกไบต์ทั้งสองไฟล์ ไม่เขียนทับ
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, "src");
const DIST = join(ROOT, "dist");
const OUTFILES = { file: join(DIST, "autostudio3d.html"), web: join(DIST, "web", "index.html") };

const read = (p) => readFileSync(p, "utf8");
const sha256b64 = (s) => createHash("sha256").update(s, "utf8").digest("base64");

/* ไฟล์ออฟไลน์: ไม่มีโค้ดเว็บเลย ใช้ script-src แบบ hash เท่านั้น (เข้มสุด — XSS รันสคริปต์
   เพิ่มไม่ได้เลย) เว็บ (เฟส 6): ต้องเปลี่ยนมาใช้ 'unsafe-inline' แทน hash ทั้งชุด — ตรวจแล้วว่า
   firebase-auth-compat.js เองสร้าง iframe ภายในที่รันอินไลน์สคริปต์สั้นๆ ของมันเองตอน
   firebase.auth() ทำงาน (ไม่ใช่ตอนล็อกอิน) hash ของสคริปต์นั้นไม่แน่นอน/ไม่มีเอกสารทางการ
   จาก Firebase ให้ pin ได้ และตาม CSP spec ถ้ามี hash-source อยู่ใน directive เดียวกัน
   'unsafe-inline' จะถูกเบราว์เซอร์ "เมิน" ทันที (ไม่ทำงานเป็น fallback) จึงต้อง*ไม่มี*hash
   ปนอยู่เลยถ้าจะให้ unsafe-inline มีผลจริง — เว็บจึงมีชั้นป้องกันนี้ต่ำกว่าไฟล์ออฟไลน์โดยตั้งใจ
   ชดเชยด้วยชั้นอื่น: Firestore Security Rules + OAuth consent screen Internal + scope
   drive.file แคบ (ดู 70-auth.web.js/firestore.rules)
   frame-src ต้องมี *.firebaseapp.com เพราะ signInWithPopup ของ Firebase Auth ใช้ iframe ที่
   authDomain (<project>.firebaseapp.com/__/auth/iframe) คุยกับ popup ผ่าน postMessage
   frame-ancestors ใส่ใน <meta> ไม่ได้ (ถูกเมิน) จึงแยกไปต่อท้ายเฉพาะ CSP ที่ส่งเป็น header
   (forHeader=true) — เมตาแท็กกับ header จึงไม่ตรงกันเป๊ะโดยตั้งใจ ไม่ใช่ความผิดพลาด */
function cspTemplate(scriptHashes, target, forHeader) {
  const scriptSrc = target === "web"
    ? "'unsafe-inline' https://www.gstatic.com"
    : scriptHashes.map((h) => "'" + h + "'").join(" ");
  const connectSrc = "https://overpass-api.de https://overpass.private.coffee https://overpass.osm.ch " +
    "https://fonts.googleapis.com https://fonts.gstatic.com" +
    (target === "web"
      ? " https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com"
      : "");
  const frameSrc = target === "web" ? "https://*.firebaseapp.com" : "'none'";
  return "default-src 'none'; " +
    "script-src " + scriptSrc + "; " +
    /* style-src ต้องมี fonts.googleapis.com ด้วย ไม่ใช่แค่ font-src — <link rel=stylesheet>
       ที่ดึง CSS ของฟอนต์มาคือการโหลดสไตล์ชีต ไฟล์ woff2 จริงต่างหากที่ font-src คุม */
    "style-src 'unsafe-inline' https://fonts.googleapis.com; " +
    "img-src data: blob:; " +
    "font-src https://fonts.gstatic.com; " +
    "connect-src " + connectSrc + "; " +
    "form-action 'none'; base-uri 'none'; frame-src " + frameSrc + "; object-src 'none'" +
    (forHeader ? "; frame-ancestors 'none'" : "");
}

function buildOne(target) {
  let html = read(join(SRC, "index.html"));
  const css = read(join(SRC, "styles.css"));
  const order = JSON.parse(read(join(SRC, "js", "_order.json")));
  const files = order.filter((f) => target === "web" || !f.endsWith(".web.js"));
  const js = files.map((f) => read(join(SRC, "js", f))).join("");
  const wrapped = '\n(function(){\n"use strict";\nconst TARGET="' + target + '";\nconst WEB=TARGET==="web";\n' + js + "\n})();\n";

  /* ต้องเจอ marker แต่ละตัว "พอดี 1 ครั้ง" ไม่ใช่แค่ "เจอบ้าง" — .replace() ด้วยสตริงเปล่า
     (ไม่ใช่ regex /g) แทนแค่ตัวที่เจอก่อนตัวเดียวเสมอ ถ้ามีคอมเมนต์ไหนพิมพ์ชื่อ marker ซ้ำ
     ไว้เป็นตัวอย่าง (พลาดมาแล้วจริงตอนเขียน @@JS@@ ในคอมเมนต์อธิบาย) จะได้ marker ตัวจริง
     ไม่ถูกแทนแล้วเหลือ "<script>@@JS@@</script>" ดิบๆ ไปวิ่งในเบราว์เซอร์แทน — พังแบบไม่มี
     error ตอน build เลยถ้าไม่เช็กจุดนี้ */
  for (const m of ["@@CSS@@", "@@JS@@", "@@CSP@@"]) {
    const n = html.split(m).length - 1;
    if (n !== 1) throw new Error("index.html ต้องมี marker " + m + " พอดี 1 ครั้ง (เจอ " + n + " ครั้ง)");
  }

  /* ตัด/เก็บบล็อกที่ใช้เฉพาะเว็บ (แถบ Drive ฯลฯ) ตาม target */
  html = target === "web"
    ? html.replace(/<!--@@\/?WEB@@-->/g, "")
    : html.replace(/<!--@@WEB@@-->[\s\S]*?<!--@@\/WEB@@-->/g, "");

  /* สคริปต์กันจอกระพริบใน <head> (id="as3d-theme-boot") เป็น <script> คนละก้อนจาก @@JS@@
     ต้อง hash แยกแล้วใส่ script-src ทั้งสอง hash — อ่านเนื้อจริงจาก html ตรงนี้เลย
     ไม่ก๊อปเนื้อสคริปต์มาพิมพ์ซ้ำที่ไหน กัน hash เพี้ยนเงียบๆ ถ้ามีคนแก้เนื้อสคริปต์แล้วลืมที่นี่ */
  const bootMatch = html.match(/<script id="as3d-theme-boot">([\s\S]*?)<\/script>/);
  if (!bootMatch) throw new Error("index.html ไม่พบ <script id=\"as3d-theme-boot\">");
  const bootHash = "sha256-" + sha256b64(bootMatch[1]);
  const jsHash = "sha256-" + sha256b64(wrapped);
  const metaCsp = cspTemplate([bootHash, jsHash], target, false);
  const headerCsp = cspTemplate([bootHash, jsHash], target, true);

  html = html
    .replace("@@CSP@@", () => '<meta http-equiv="Content-Security-Policy" content="' + metaCsp + '">')
    .replace("@@CSS@@", () => css)
    .replace("@@JS@@", () => wrapped);

  return { html, headerCsp };
}

function firebaseJson(csp) {
  return JSON.stringify({
    hosting: {
      public: "dist/web",
      ignore: ["**/.*"],
      cleanUrls: true,
      headers: [
        {
          source: "**",
          headers: [
            { key: "Content-Security-Policy", value: csp },
            { key: "X-Content-Type-Options", value: "nosniff" },
            { key: "Referrer-Policy", value: "no-referrer" },
            { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
            /* same-origin เฉยๆ จะตัดสาย postMessage ที่ signInWithPopup ของ Firebase Auth
               ใช้คุยกับ popup ทำให้ล็อกอินค้างแบบไม่มี error ที่อ่านรู้เรื่อง — ต้องเป็นค่านี้ */
            { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          ],
        },
      ],
    },
    firestore: {
      rules: "firestore.rules",
      indexes: "firestore.indexes.json",
    },
  }, null, 2) + "\n";
}

const args = process.argv.slice(2);
const check = args.includes("--check");
const targetArg = (args.find((a) => a.startsWith("--target=")) || "").split("=")[1];
const targets = targetArg ? [targetArg] : ["file", "web"];

if (targetArg && targetArg !== "file" && targetArg !== "web") {
  console.error("--target ต้องเป็น file หรือ web เท่านั้น (ได้ " + targetArg + ")");
  process.exit(1);
}

let failed = false;
for (const target of targets) {
  const { html: out, headerCsp } = buildOne(target);
  const outfile = OUTFILES[target];
  if (check) {
    if (!existsSync(outfile)) {
      console.error("[" + target + "] ยังไม่มีไฟล์ให้เทียบ (" + outfile + ") — รัน node build.mjs ก่อน");
      failed = true;
      continue;
    }
    const cur = read(outfile);
    if (cur === out) {
      console.log("[" + target + "] ตรงกันทุกไบต์ ✓  (" + out.length.toLocaleString() + " ตัวอักษร)");
    } else {
      console.error("[" + target + "] ไม่ตรงกัน ✗  เดิม " + cur.length + " ใหม่ " + out.length);
      failed = true;
    }
  } else {
    mkdirSync(dirname(outfile), { recursive: true });
    writeFileSync(outfile, out);
    const kb = (Buffer.byteLength(out) / 1024).toFixed(0);
    console.log("[" + target + "] สร้าง " + outfile.slice(ROOT.length + 1).replace(/\\/g, "/") + " แล้ว — " + kb + " KB");
    if (target === "web") {
      writeFileSync(join(ROOT, "firebase.json"), firebaseJson(headerCsp));
      console.log("[web] สร้าง firebase.json แล้ว (CSP header คำนวณจาก hash ของสคริปต์จริง ไม่ต้องแก้มือ)");
    }
  }
}
if (check && failed) process.exit(1);
