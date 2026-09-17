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

/* เฟส 5: เว็บยังไม่มีโค้ด sign-in จริง (มาเฟส 6) — ใช้ policy เดียวกับไฟล์ออฟไลน์ไปก่อน
   ต่างกันแค่ *วิธีส่ง*: ไฟล์ออฟไลน์ส่งผ่าน <meta> ในตัวไฟล์เอง, เว็บส่งผ่าน response header
   จาก firebase.json (ทำให้ใส่ frame-ancestors ได้ด้วย ซึ่ง <meta> ทำไม่ได้)
   เฟส 6 จะมาขยาย script-src/connect-src ให้ accounts.google.com/googleapis.com ตอนนั้น */
function cspTemplate(scriptHashes) {
  return "default-src 'none'; " +
    "script-src " + scriptHashes.map((h) => "'" + h + "'").join(" ") + "; " +
    /* style-src ต้องมี fonts.googleapis.com ด้วย ไม่ใช่แค่ font-src — <link rel=stylesheet>
       ที่ดึง CSS ของฟอนต์มาคือการโหลดสไตล์ชีต ไฟล์ woff2 จริงต่างหากที่ font-src คุม */
    "style-src 'unsafe-inline' https://fonts.googleapis.com; " +
    "img-src data: blob:; " +
    "font-src https://fonts.gstatic.com; " +
    "connect-src https://overpass-api.de https://overpass.private.coffee https://overpass.osm.ch https://fonts.googleapis.com https://fonts.gstatic.com; " +
    "form-action 'none'; base-uri 'none'; frame-src 'none'; object-src 'none'";
}

function buildOne(target) {
  let html = read(join(SRC, "index.html"));
  const css = read(join(SRC, "styles.css"));
  const order = JSON.parse(read(join(SRC, "js", "_order.json")));
  const files = order.filter((f) => target === "web" || !f.endsWith(".web.js"));
  const js = files.map((f) => read(join(SRC, "js", f))).join("");
  const wrapped = '\n(function(){\n"use strict";\nconst TARGET="' + target + '";\nconst WEB=TARGET==="web";\n' + js + "\n})();\n";

  for (const m of ["@@CSS@@", "@@JS@@", "@@CSP@@"])
    if (!html.includes(m)) throw new Error("index.html ไม่มี marker " + m);

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
  const csp = cspTemplate([bootHash, jsHash]);

  html = html
    .replace("@@CSP@@", () => '<meta http-equiv="Content-Security-Policy" content="' + csp + '">')
    .replace("@@CSS@@", () => css)
    .replace("@@JS@@", () => wrapped);

  return { html, csp };
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
          ],
        },
      ],
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
  const { html: out, csp } = buildOne(target);
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
      writeFileSync(join(ROOT, "firebase.json"), firebaseJson(csp));
      console.log("[web] สร้าง firebase.json แล้ว (CSP header คำนวณจาก hash ของสคริปต์จริง ไม่ต้องแก้มือ)");
    }
  }
}
if (check && failed) process.exit(1);
