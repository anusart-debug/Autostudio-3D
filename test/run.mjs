#!/usr/bin/env node
/**
 * ตัวรันเทสต์ทั้งชุด — ไม่พึ่ง test framework ใดๆ
 * แต่ละไฟล์ใน test/*.test.js เปิด Chromium ผ่าน Playwright แล้ว console.log ผล JSON ออกมา
 * ตัวรันนี้จะ fail ถ้าไฟล์ไหน exit ไม่เป็น 0 หรือมี pageerror หลุดออกมา
 *
 * ใช้: node test/run.mjs           รันทั้งหมด
 *      node test/run.mjs 04        รันเฉพาะไฟล์ที่ชื่อขึ้นต้นด้วย 04
 */
import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const filter = process.argv[2] || "";
const files = readdirSync(HERE)
  .filter((f) => f.endsWith(".test.js"))
  .filter((f) => !filter || f.startsWith(filter))
  .sort();

if (!files.length) {
  console.error("ไม่พบไฟล์เทสต์" + (filter ? " ที่ขึ้นต้นด้วย " + filter : ""));
  process.exit(1);
}

let failed = 0;
for (const f of files) {
  process.stdout.write("── " + f + " ");
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [join(HERE, f)], {
    encoding: "utf8",
    timeout: 300000,
    env: process.env,
  });
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  const out = (r.stdout || "") + (r.stderr || "");
  // pageerror ที่หลุดออกมาถือว่าไม่ผ่าน แม้สคริปต์จะ exit 0
  // แต่ข้ามข้อผิดพลาดที่มาจากเครือข่ายของเครื่องที่รัน (เช่น ฟอนต์ Google ถูกไฟร์วอลล์บล็อก)
  // เพราะไม่ใช่บั๊กของแอป และทำให้เทสต์ไม่ผ่านแบบหลอกๆ
  const realErrs = [...out.matchAll(/"(?:PAGEERROR|CONSOLE): ([^"]*)"/g)]
    .map((m) => m[1])
    .filter((e) => !/ERR_TUNNEL|ERR_(NAME|INTERNET|NETWORK|CONNECTION)|net::|Failed to load resource/i.test(e));
  const leaked = realErrs.length > 0 || /PAGEERROR:/.test(out.replace(/"(PAGEERROR: [^"]*)"/g, ""));
  if (r.status !== 0 || leaked) {
    failed++;
    console.log("ไม่ผ่าน (" + secs + "s)");
    console.log(out.trim().split("\n").slice(-25).join("\n"));
  } else {
    console.log("ผ่าน (" + secs + "s)");
  }
}

console.log(
  failed
    ? "\n" + failed + " จาก " + files.length + " ไฟล์ไม่ผ่าน"
    : "\nผ่านทั้งหมด " + files.length + " ไฟล์"
);
process.exit(failed ? 1 : 0);
