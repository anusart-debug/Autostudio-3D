/* ---------------- 09 · Export ---------------- */
$("exCopy").addEventListener("click",()=>$("copyBtn").click());
$("exOpen").addEventListener("click",()=>$("handoffBtn").click());
$("exSave").addEventListener("click",()=>{
  if(!S.refB64){toast("ยังไม่ได้อัปโหลดภาพสื่อต้นแบบในขั้นที่ 1",true);return}
  $("hoSave").click();
});
$("exSaveAd").addEventListener("click",()=>$("hoSaveAd").click());

/* v41.5: โลโก้ย่อหน้าชื่อปลายทางแต่ละเว็บ — วาดเป็นสัญลักษณ์แบบย่อ/ตีความเอง (ไม่ใช่ก็อปปี้ไฟล์
   โลโก้จริงของแต่ละบริษัท) ให้พอจำได้ว่าเป็นเว็บไหน ตามแนวทางเดียวกับไอคอน "ue5" ในหมวดสไตล์
   เรนเดอร์ที่ทำไว้ก่อนหน้า (วงกลม+ตัว U ไม่ใช่การจำลองโลโก้ Unreal Engine ตรงๆ) — ถ้ามีไฟล์โลโก้
   ทางการจริงอยากใช้แทน ส่งไฟล์มาแล้วฝังเป็น base64 ได้เหมือน VEHICLE_ICONS/ANGLE_ICONS */
const LOGO_GOOGLE='<svg viewBox="0 0 24 24"><path fill="#4285F4" d="M23.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.56-5.17 3.56-8.66Z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.94-2.92l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.09A12 12 0 0 0 12 24Z"/><path fill="#FBBC05" d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54V6.64H1.27a12 12 0 0 0 0 10.72l4-3.09Z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.94 1.19 15.23 0 12 0 7.31 0 3.26 2.69 1.27 6.64l4 3.09C6.22 6.86 8.87 4.75 12 4.75Z"/></svg>';
const LOGO_GEMINI='<svg viewBox="0 0 24 24"><path fill="url(#gg)" d="M12 2c1 4.5 3.5 7 8 8-4.5 1-7 3.5-8 8-1-4.5-3.5-7-8-8 4.5-1 7-3.5 8-8Z"/><defs><linearGradient id="gg" x1="4" y1="2" x2="20" y2="18"><stop offset="0" stop-color="#4285F4"/><stop offset=".5" stop-color="#9B72CB"/><stop offset="1" stop-color="#D96570"/></linearGradient></defs></svg>';
const LOGO_OPENAI='<svg viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5c1.9 0 3.5 1.2 4.1 2.9 1.9.2 3.5 1.5 4.1 3.4.9 1.6.7 3.6-.5 5 .4 1.9-.3 3.9-1.9 5-.6 1.8-2.3 3.1-4.2 3.1-1.9 0-3.5-1.2-4.1-2.9-1.9-.2-3.5-1.5-4.1-3.4-.9-1.6-.7-3.6.5-5-.4-1.9.3-3.9 1.9-5 .6-1.8 2.3-3.1 4.2-3.1Z"/><circle cx="12" cy="12" r="2.6" fill="#111" stroke="none"/></svg>';
const LOGO_BING='<svg viewBox="0 0 24 24"><path fill="#008373" d="M5 2v16.2l4 2 10-4.4-4.3-2 .8-3.4L9 8.6V2H5Zm4 12.4V9l5.4 2.4-5.4 3Z"/></svg>';
const LOGO_MSFT='<svg viewBox="0 0 24 24"><rect x="2" y="2" width="9" height="9" fill="#F35325"/><rect x="13" y="2" width="9" height="9" fill="#81BC06"/><rect x="2" y="13" width="9" height="9" fill="#05A6F0"/><rect x="13" y="13" width="9" height="9" fill="#FFBA08"/></svg>';
const LOGO_LEONARDO='<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="url(#lg)"/><text x="12" y="16.5" font-family="Georgia,serif" font-size="12" font-weight="700" fill="#fff" text-anchor="middle">L</text><defs><linearGradient id="lg" x1="1" y1="1" x2="23" y2="23"><stop offset="0" stop-color="#7C3AED"/><stop offset="1" stop-color="#0EA5A0"/></linearGradient></defs></svg>';
const LOGO_IDEOGRAM='<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="6" fill="url(#ig)"/><text x="12" y="16.5" font-family="Georgia,serif" font-size="12" font-weight="700" fill="#fff" text-anchor="middle">I</text><defs><linearGradient id="ig" x1="2" y1="2" x2="22" y2="22"><stop offset="0" stop-color="#F5576C"/><stop offset="1" stop-color="#7C3AED"/></linearGradient></defs></svg>';
const LOGO_HF='<svg viewBox="0 0 24 24"><circle cx="12" cy="11" r="7.5" fill="#FFD21E"/><circle cx="9" cy="10" r="1.1" fill="#3A3A3A"/><circle cx="15" cy="10" r="1.1" fill="#3A3A3A"/><path d="M9 13.5c1 1 5 1 6 0" stroke="#3A3A3A" stroke-width="1.2" fill="none" stroke-linecap="round"/><path d="M3 14c1.5 2 2.7 2.6 4 2M21 14c-1.5 2-2.7 2.6-4 2" stroke="#FFAA00" stroke-width="2" fill="none" stroke-linecap="round"/></svg>';
const LOGO_ARENA='<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round"><circle cx="9" cy="12" r="6.5" stroke="#F5A623" stroke-width="2"/><circle cx="15" cy="12" r="6.5" stroke="#EF4444" stroke-width="2"/></svg>';
const LOGO_FIREFLY='<svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" fill="#DA1F26"/><path d="M12 6.5c2.8 1.4 4.5 3.6 4.5 6.3 0 2.4-1.6 4.2-4.5 5-2.9-.8-4.5-2.6-4.5-5 0-2.7 1.7-4.9 4.5-6.3Z" fill="#fff"/><circle cx="17.2" cy="7.2" r="1.3" fill="#FFC300"/></svg>';
const LOGO_DESIGNARENA='<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round"><circle cx="9" cy="12" r="6.5" stroke="#2E86F5" stroke-width="2"/><circle cx="15" cy="12" r="6.5" stroke="#14B8A6" stroke-width="2"/></svg>';
const LOGO_DOLA='<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="url(#dg)"/><text x="12" y="16.5" font-family="Georgia,serif" font-size="12" font-weight="700" fill="#fff" text-anchor="middle">D</text><defs><linearGradient id="dg" x1="1" y1="1" x2="23" y2="23"><stop offset="0" stop-color="#22C55E"/><stop offset="1" stop-color="#0D9488"/></linearGradient></defs></svg>';

const DESTS=[
 {n:"Google AI Studio · Nano Banana",u:"https://aistudio.google.com/models/nano-banana",
  d:"แนบภาพสื่อต้นแบบแล้วสั่งแก้ได้ตรงๆ ใช้โมเดลตัวเดียวกับที่ API คิดเงิน แต่ในนี้ฟรีด้วยบัญชี Google",
  t:"ฟรี",f:1,img:1,logo:LOGO_GOOGLE},
 {n:"Google Gemini",u:"https://gemini.google.com/app",
  d:"แชททั่วไป แนบภาพต้นแบบได้ สั่งแก้เป็นภาษาไทยได้",t:"ฟรี",f:1,img:1,logo:LOGO_GEMINI},
 {n:"ChatGPT",u:"https://chatgpt.com/",
  d:"แนบภาพต้นแบบได้ ถ้าบัญชีเปิดใช้สร้างภาพ",t:"ต้องล็อกอิน",f:0,img:1,logo:LOGO_OPENAI},
 {n:"Google ImageFX",u:"https://aitestkitchen.withgoogle.com/tools/image-fx",
  d:"ภาพสมจริงคมมาก มี Prompt Chips เปลี่ยนสไตล์ไว",t:"ฟรี",f:1,img:0,logo:LOGO_GOOGLE},
 {n:"Bing Image Creator",u:"https://www.bing.com/images/create",
  d:"DALL·E 3 เข้าใจคำสั่งยาวดี มีเครดิต Boost ฟรีทุกวัน",t:"ฟรี",f:1,img:0,logo:LOGO_BING},
 {n:"Microsoft Designer",u:"https://designer.microsoft.com/image-creator",
  d:"ตัวเดียวกับ Bing แต่มีเครื่องมือจัดหน้าเพิ่ม",t:"ฟรี",f:1,img:0,logo:LOGO_MSFT},
 {n:"Leonardo.AI",u:"https://app.leonardo.ai/ai-generations",
  d:"เครดิตฟรีวันละ 150 · มี ControlNet ปรับละเอียด",t:"ฟรีรายวัน",f:1,img:0,logo:LOGO_LEONARDO},
 {n:"Ideogram",u:"https://ideogram.ai/t/explore",
  d:"ตัวอักษรบนภาพคมที่สุด เหมาะกับงานที่ต้องมีข้อความ",t:"ฟรีจำกัด",f:1,img:0,logo:LOGO_IDEOGRAM},
 {n:"Hugging Face · FLUX.1",u:"https://huggingface.co/spaces/black-forest-labs/FLUX.1-schnell",
  d:"โมเดลโอเพนซอร์สคุณภาพสูง ไม่ต้องสมัคร",t:"ฟรี",f:1,img:0,logo:LOGO_HF},
 {n:"Arena AI",u:"https://arena.ai",
  d:"เว็บจัดอันดับ/แข่งขันโมเดล AI หลายด้าน มีโหมด Design to Code แนบภาพแล้วให้ AI สร้างต่อ",
  t:"ฟรี",f:1,img:1,logo:LOGO_ARENA},
 {n:"Adobe Firefly",u:"https://firefly.adobe.com",
  d:"สตูดิโอสร้างภาพของ Adobe รวมกว่า 30 โมเดล มี Structure Reference แนบภาพต้นแบบคุมองค์ประกอบได้",
  t:"ต้องล็อกอิน",f:0,img:1,logo:LOGO_FIREFLY},
 {n:"Design Arena",u:"https://designarena.ai",
  d:"เว็บเปรียบเทียบโมเดล AI แบบ crowdsourced มีหมวด Image และ Image Editing ให้แนบภาพต้นแบบ",
  t:"ฟรี",f:1,img:1,logo:LOGO_DESIGNARENA},
 {n:"Dola AI",u:"https://dola.com",
  d:"ผู้ช่วย AI อเนกประสงค์ มีโหมด Create Images แนบภาพต้นแบบผ่านปุ่มแนบไฟล์ได้",
  t:"ต้องล็อกอิน",f:0,img:1,logo:LOGO_DOLA}
];
/* จัดกลุ่มตาม "แนบภาพต้นแบบได้ไหม" แทนเรียงตามลำดับที่เพิ่มเข้ามา — กลุ่มที่แนบภาพได้สำคัญกว่า
   เพราะคงสื่อต้นแบบไว้ได้จริง เอาขึ้นก่อนเสมอไม่ว่าจะเพิ่มเว็บใหม่กี่เว็บก็ตาม ไม่ต้องคอยสลับมือ */
function cardHTML(x,i){
  return '<button class="dcard'+(x.img?' keeps':'')+'" data-i="'+i+'">'+
    '<span class="dtitle">'+(x.logo?'<span class="dlogo">'+x.logo+'</span>':'')+'<b>'+esc(x.n)+'</b></span>'+
    '<em>'+esc(x.d)+'</em>'+
    '<span class="tags"><span class="tagi'+(x.f?' free':'')+'">'+esc(x.t)+'</span>'+
    '<span class="tagi '+(x.img?'i2i':'txt')+'">'+(x.img?'แนบภาพต้นแบบได้':'ข้อความอย่างเดียว')+'</span></span></button>';
}
function renderDests(){
  $("hoTitle").textContent="คัดลอกคำสั่ง & ส่งงานเข้าเว็บ AI · "+DESTS.length+" ปลายทาง";
  const withImg=[], textOnly=[];
  DESTS.forEach((x,i)=>(x.img?withImg:textOnly).push(cardHTML(x,i)));
  $("hoDest").innerHTML=
    '<div class="dest-head">แนบภาพต้นแบบได้ ('+withImg.length+') — คงสื่อต้นแบบไว้ได้จริง</div>'+
    withImg.join("")+
    '<div class="dest-head">ข้อความอย่างเดียว ('+textOnly.length+')</div>'+
    textOnly.join("");
}
$("hoDest").addEventListener("click",e=>{
  const b=e.target.closest("[data-i]"); if(!b)return;
  const x=DESTS[+b.dataset.i];
  window.open(x.u,"_blank","noopener");
  toast("เปิด "+x.n+" แล้ว — วางคำสั่งที่คัดลอกไว้ได้เลย");
});

let tTimer;
function toast(msg,bad){
  const t=$("toast");t.textContent=msg;t.className="toast on"+(bad?" bad":"");
  clearTimeout(tTimer);tTimer=setTimeout(()=>t.className="toast",bad?5200:2600);
}

