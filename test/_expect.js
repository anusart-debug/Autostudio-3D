/* ---------------- ตัวช่วยยืนยันผล (assertion) ----------------
   ทำไมต้องมี: เดิมไฟล์เทสต์ทุกตัวแค่ console.log ผลออกมาเฉยๆ แล้ว exit 0
   run.mjs จึงจับได้แค่ "หน้าเว็บ error" กับ "สคริปต์พัง" เท่านั้น
   แปลว่าแก้คำสั่งหรือข้อมูลแผนที่ให้ผิดยังไงชุดเทสต์ก็ยังเขียว
   ตัวนี้ทำให้เงื่อนไขที่ตั้งใจตรวจ ทำให้เทสต์แดงได้จริง

   ใช้:
     const {expect,done}=require('./_expect');
     expect('มีสายรถเมล์', R.routes>0);
     expect('อัตราส่วนอยู่ในคำสั่ง', /16:9/.test(prompt), prompt.slice(0,120));
     done();                       // พิมพ์สรุปและตั้ง exitCode ถ้ามีข้อไหนไม่ผ่าน   */
const FAILS = [];
let total = 0;

function expect(name, cond, detail) {
  total++;
  if (cond) return true;
  FAILS.push(name + (detail === undefined ? "" : "  ← ได้: " + JSON.stringify(detail)));
  return false;
}

/* เท่ากันเป๊ะ — แยกออกมาเพราะอยากให้ข้อความบอกทั้งค่าที่คาดและค่าที่ได้ */
function expectEq(name, got, want) {
  return expect(name + " (คาด " + JSON.stringify(want) + ")", got === want, got);
}

/* ข้อความต้องมีคำนี้ — เคสที่ใช้บ่อยที่สุดในเทสต์คำสั่ง */
function expectHas(name, haystack, needle) {
  const s = String(haystack == null ? "" : haystack);
  return expect(name + " ต้องมี " + JSON.stringify(needle), s.indexOf(needle) >= 0, s.slice(0, 200));
}

function done() {
  if (!FAILS.length) {
    console.log("\nยืนยันผล " + total + " ข้อ ผ่านทั้งหมด");
    return;
  }
  /* ขึ้นต้นด้วย PAGEERROR: เพื่อให้ run.mjs จับได้แน่นอน แม้ exitCode จะถูกกลืนไปด้วยเหตุใดก็ตาม */
  console.log("\nยืนยันผลไม่ผ่าน " + FAILS.length + " จาก " + total + " ข้อ:");
  FAILS.forEach((f) => console.log("PAGEERROR: ยืนยันผลไม่ผ่าน — " + f));
  process.exitCode = 1;
}

module.exports = { expect, expectEq, expectHas, done };
