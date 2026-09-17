#!/usr/bin/env node
/**
 * AUTOSTUDIO 3D — build
 *
 * ประกอบซอร์สใน src/ กลับเป็นไฟล์เดียว dist/autostudio3d.html
 *
 * ทำไมต้องเป็นไฟล์เดียว: ผู้ใช้ปลายทางดับเบิลคลิกเปิดจากเครื่องตัวเอง (file://)
 * ไม่มีเซิร์ฟเวอร์ ไม่มี bundler ไม่มี npm install — ไฟล์เดียวจบ
 *
 * โมดูล JS ต่อกันตรงๆ ตามลำดับใน src/js/_order.json แล้วห่อด้วย IIFE เดียว
 * ทุกไฟล์จึงใช้ scope ร่วมกัน ไม่มี import/export โดยตั้งใจ
 * **ลำดับสำคัญ** — const/let ไม่ hoist ข้ามไฟล์ อย่าสลับลำดับถ้าไม่ได้ตรวจ
 *
 * ใช้: node build.mjs            → เขียน dist/autostudio3d.html
 *      node build.mjs --check    → ตรวจว่าตรงกับ dist เดิมทุกไบต์ ไม่เขียนทับ
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, "src");
const DIST = join(ROOT, "dist");
const OUTFILE = join(DIST, "autostudio3d.html");

const read = (p) => readFileSync(p, "utf8");

function build() {
  const html = read(join(SRC, "index.html"));
  const css = read(join(SRC, "styles.css"));
  const order = JSON.parse(read(join(SRC, "js", "_order.json")));

  const js = order.map((f) => read(join(SRC, "js", f))).join("");

  if (!html.includes("@@CSS@@")) throw new Error("index.html ไม่มี marker @@CSS@@");
  if (!html.includes("@@JS@@")) throw new Error("index.html ไม่มี marker @@JS@@");

  /* ใช้ replace แบบ function เสมอ — string replacement ตีความ $&, $`, $', $$ เป็น
     backreference pattern ได้ ถ้า CSS/JS มีอักขระพวกนี้จะทำให้ output เพี้ยนแบบไม่มี error ขึ้นเลย
     วันนี้ไม่มีอักขระเหล่านี้ในซอร์ส (ตรวจแล้ว) จึงเปลี่ยนแล้วได้ผลลัพธ์เดิมทุกไบต์ —
     แต่ทำไว้ก่อนตอนที่ --check ยังพิสูจน์ความเหมือนได้ ปลอดภัยกว่าไปแก้ตอนที่ payload ซับซ้อนขึ้น */
  return html
    .replace("@@CSS@@", () => css)
    .replace("@@JS@@", () => '\n(function(){\n"use strict";\n' + js + "\n})();\n");
}

const out = build();
const check = process.argv.includes("--check");

if (check) {
  if (!existsSync(OUTFILE)) {
    console.error("ยังไม่มี dist/autostudio3d.html ให้เทียบ — รัน node build.mjs ก่อน");
    process.exit(1);
  }
  const cur = read(OUTFILE);
  if (cur === out) {
    console.log("ตรงกันทุกไบต์ ✓  (" + out.length.toLocaleString() + " ตัวอักษร)");
  } else {
    console.error("ไม่ตรงกัน ✗  เดิม " + cur.length + " ใหม่ " + out.length);
    process.exit(1);
  }
} else {
  mkdirSync(DIST, { recursive: true });
  writeFileSync(OUTFILE, out);
  const kb = (Buffer.byteLength(out) / 1024).toFixed(0);
  console.log("สร้าง dist/autostudio3d.html แล้ว — " + kb + " KB");
}
