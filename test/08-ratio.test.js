/* ---------------- อัตราส่วนภาพต้องอยู่ในคำสั่งจริง ----------------
   เดิม RATIOS/#ratio/#scale มีอยู่แต่ตัวเลขไม่เคยถูกส่งเข้าคำสั่งเลย (ใช้แสดงผลอย่างเดียว)
   เทสต์นี้ตรวจว่า ratioClause()/srcRatioClause() ที่เพิ่มใน v41 ทำงานจริงในทุกโหมด */
const {join,dirname}=require('path');
const PAGE_URL='file://'+join(__dirname,'..','dist','autostudio3d.html');
require('fs').mkdirSync(join(__dirname,'out'),{recursive:true});
const {chromium}=require(process.env.PW||'playwright');
const {expect,done}=require('./_expect');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage();
 const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto(PAGE_URL);
 await pg.waitForTimeout(500);
 await pg.evaluate(()=>document.getElementById('wzExit').click());
 await pg.waitForTimeout(250);
 const get=async()=>pg.$eval('#promptOut',n=>n.textContent);

 /* ---- 1) โหมดข้อความล้วน ค่าเริ่มต้น: 16:9 1920x1080 ---- */
 const p0=await get();
 expect('ค่าเริ่มต้นมี 16:9 ในคำสั่ง', p0.includes('16:9'), p0.slice(-160));
 expect('ค่าเริ่มต้นมี 1920 ในคำสั่ง', p0.includes('1920'), p0.slice(-160));
 expect('ค่าเริ่มต้นมี 1080 ในคำสั่ง', p0.includes('1080'), p0.slice(-160));
 expect('ค่าเริ่มต้นเป็น landscape', p0.includes('landscape'), p0.slice(-160));

 /* ---- 2) เปลี่ยนเป็น 9:16 (index 5) ---- */
 await pg.selectOption('#ratio','5');
 await pg.waitForTimeout(150);
 const p1=await get();
 expect('เปลี่ยนเมนูแล้วได้ 9:16', p1.includes('9:16'), p1.slice(-160));
 expect('เปลี่ยนเมนูแล้วได้ 1080x1920 (สลับด้าน)', p1.includes('1080')&&p1.includes('1920'), p1.slice(-160));
 expect('เปลี่ยนเมนูแล้วเป็น portrait', p1.includes('portrait'), p1.slice(-160));

 /* ---- 3) ขยับสเกล ต้องเปลี่ยนพิกเซลจริงและไม่เกินเพดาน 2048 ---- */
 await pg.selectOption('#ratio','0'); // กลับไป 16:9
 await pg.evaluate(()=>{const r=document.getElementById('scale');r.value='200';r.dispatchEvent(new Event('input',{bubbles:true}))});
 await pg.waitForTimeout(150);
 const p2=await get();
 // dims() อยู่ในสโคปปิดของแอป อ่านตัวเลขจริงจาก #roRes ที่ sync() เขียนไว้แทน
 const roRes=await pg.$eval('#roRes',n=>n.textContent);
 const [dw,dh]=roRes.split('×').map(s=>parseInt(s.trim(),10));
 expect('สเกล 2.0x ไม่เกินเพดาน MAXPX', Math.max(dw,dh)<=2048, roRes);
 expect('คำสั่งมีตัวเลขพิกเซลตรงกับ #roRes หลังขยับสเกล', p2.includes(dw+' × '+dh), {p2tail:p2.slice(-160),roRes});
 await pg.evaluate(()=>{const r=document.getElementById('scale');r.value='100';r.dispatchEvent(new Event('input',{bubbles:true}))});

 /* ---- 4) แท็บภาษาไทยต้องมีข้อความอัตราส่วน ---- */
 await pg.click('.ptab[data-lang="th"]');
 await pg.waitForTimeout(150);
 const pth=await get();
 expect('แท็บไทยมีคำว่า "กรอบภาพ"', pth.includes('กรอบภาพ'), pth.slice(-160));
 await pg.click('.ptab[data-lang="en"]');
 await pg.waitForTimeout(150);

 /* ---- 5) อัปโหลดภาพอ้างอิง 600×300 (2:1) แล้วเช็ก #srcRatio ---- */
 const durl=await pg.evaluate(()=>{
   const cv=document.createElement('canvas');cv.width=600;cv.height=300;
   const x=cv.getContext('2d');x.fillStyle='#1E3A8A';x.fillRect(0,0,600,300);
   x.fillStyle='#fff';x.fillRect(40,40,300,100);
   return cv.toDataURL('image/png');
 });
 await pg.evaluate(async(du)=>{
   const r=await fetch(du); const bl=await r.blob();
   const f=new File([bl],'ref.png',{type:'image/png'});
   const dt=new DataTransfer(); dt.items.add(f);
   const el=document.getElementById('file'); el.files=dt.files;
   el.dispatchEvent(new Event('change',{bubbles:true}));
 },durl);
 await pg.waitForTimeout(700);
 const srcChecked=await pg.$eval('#srcRatio',n=>n.checked);
 expect('#srcRatio ติ๊กไว้เป็นค่าเริ่มต้น', srcChecked);
 const p3=await get();
 expect('ติ๊ก #srcRatio แล้วใช้สัดส่วนภาพต้นฉบับ (2:1)', p3.includes('2:1'), p3.slice(-220));
 expect('ติ๊ก #srcRatio แล้วมีขนาดจริงของภาพต้นฉบับ (600 × 300)', p3.includes('600')&&p3.includes('300'), p3.slice(-220));
 expect('บรรทัดเตือน override เมนูอัตราส่วนโผล่ขึ้นมา', await pg.$eval('#roSrcNote',n=>!n.hidden));

 /* ---- 6) ปิด #srcRatio แล้วต้องกลับไปใช้เมนู #ratio (16:9) ---- */
 await pg.click('#srcRatio');
 await pg.waitForTimeout(150);
 const p4=await get();
 expect('ปิด #srcRatio แล้วกลับไปใช้ 16:9 จากเมนู', p4.includes('16:9'), p4.slice(-220));
 expect('ปิด #srcRatio แล้วบรรทัดเตือนหายไป', await pg.$eval('#roSrcNote',n=>n.hidden));

 expect('ไม่มี pageerror', errs.length===0, errs);
 done();
 await b.close();
})();
