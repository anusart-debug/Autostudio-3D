const {join,dirname}=require('path');
const PAGE_URL='file://'+join(__dirname,'..','dist','autostudio3d.html');
require('fs').mkdirSync(join(__dirname,'out'),{recursive:true});
const {chromium}=require(process.env.PW||'playwright');
const {expect,done}=require('./_expect');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage();
 const errs=[];pg.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 pg.on('console',m=>{if(m.type()==='error'&&!/TUNNEL|font/i.test(m.text()))errs.push('CONSOLE: '+m.text())});
 await pg.context().grantPermissions(['clipboard-read','clipboard-write']);
 await pg.goto(PAGE_URL);
 await pg.waitForTimeout(500);
 await pg.evaluate(()=>document.getElementById('wzExit').click());
 await pg.waitForTimeout(300);
 // fabricate two images
 const mk=(c)=>pg.evaluate(col=>{const cv=document.createElement('canvas');cv.width=600;cv.height=300;const x=cv.getContext('2d');x.fillStyle=col;x.fillRect(0,0,600,300);x.fillStyle='#fff';x.fillRect(40,40,300,100);return cv.toDataURL('image/png')},c);
 const a=await mk('#1E3A8A'), c2=await mk('#C21807');
 const setf=async(sel,durl,name)=>{
   await pg.evaluate(async([sel,durl,name])=>{
     const r=await fetch(durl); const bl=await r.blob();
     const f=new File([bl],name,{type:'image/png'});
     const dt=new DataTransfer(); dt.items.add(f);
     const el=document.querySelector(sel); el.files=dt.files;
     el.dispatchEvent(new Event('change',{bubbles:true}));
   },[sel,durl,name]);
 };
 await setf('#file',a,'bus.png'); await pg.waitForTimeout(700);
 const st1=await pg.evaluate(()=>({badge:badgeMode.textContent,ex:exNote.textContent,len:exPrompt.textContent.length}));
 const adInput=await pg.$eval('body',()=>{const ins=[...document.querySelectorAll('input[type=file]')].map(x=>x.id);return ins.join(',')});
 await setf('#adFile',c2,'artwork.png'); await pg.waitForTimeout(700);
 const st2=await pg.evaluate(()=>({badge:badgeMode.textContent,ex:exNote.textContent,len:exPrompt.textContent.length,saveAd:!exSaveAd.hidden}));
 const p2=await pg.$eval('#exPrompt',n=>n.textContent);
 // review modal
 await pg.click('#reviewBtn'); await pg.waitForTimeout(300);
 const rows=await pg.$$eval('#checklist .checkrow',n=>n.map(x=>x.textContent.trim().replace(/\s+/g,' ')));
 await pg.click('#revGo'); await pg.waitForTimeout(400);
 const hoOpen=await pg.isVisible('#hoVeil');
 const dests=await pg.$$eval('#hoDest .dcard b',n=>n.map(x=>x.textContent));
 await pg.click('#hoClose');
 // copy
 await pg.click('#copyBtn'); await pg.waitForTimeout(300);
 const clip=await pg.evaluate(()=>navigator.clipboard.readText()).catch(e=>'ERR '+e.message);
 console.log(JSON.stringify({adInput,st1,st2,rows,hoOpen,destCount:dests.length,clipLen:(clip||'').length,clipMatch:clip===p2,errs},null,1));
 console.log("\n=== PROMPT (ad-swap mode) ===\n"+p2);
 expect('อัปโหลดภาพต้นแบบแล้วมีคำสั่งไม่ว่างเปล่า', st1.len>0, st1.len);
 expect('อัปโหลดภาพที่สองแล้วโหมดเปลี่ยนเป็นเปลี่ยนโฆษณา', st2.badge!==st1.badge, [st1.badge,st2.badge]);
 expect('ปุ่มบันทึกอาร์ตเวิร์กที่สองปรากฏ', st2.saveAd);
 expect('หน้าต่างตรวจสอบมีรายการ', rows.length>0, rows.length);
 expect('หน้าต่างส่งงานเปิดได้', hoOpen);
 expect('มีปลายทาง AI ให้เลือก', dests.length>0, dests.length);
 expect('คัดลอกคำสั่งตรงกับที่แสดง', clip===p2);
 expect('ไม่มี pageerror/console error', errs.length===0, errs);
 done();
 await b.close();
})();
