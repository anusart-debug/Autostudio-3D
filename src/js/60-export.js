/* ---------------- 09 · Export ---------------- */
$("exCopy").addEventListener("click",()=>$("copyBtn").click());
$("exOpen").addEventListener("click",()=>$("handoffBtn").click());
$("exSave").addEventListener("click",()=>{
  if(!S.refB64){toast("ยังไม่ได้อัปโหลดภาพสื่อต้นแบบในขั้นที่ 1",true);return}
  $("hoSave").click();
});
$("exSaveAd").addEventListener("click",()=>$("hoSaveAd").click());

const DESTS=[
 {n:"Google AI Studio · Nano Banana",u:"https://aistudio.google.com/models/nano-banana",
  d:"แนบภาพสื่อต้นแบบแล้วสั่งแก้ได้ตรงๆ ใช้โมเดลตัวเดียวกับที่ API คิดเงิน แต่ในนี้ฟรีด้วยบัญชี Google",
  t:"ฟรี",f:1,img:1},
 {n:"Google Gemini",u:"https://gemini.google.com/app",
  d:"แชททั่วไป แนบภาพต้นแบบได้ สั่งแก้เป็นภาษาไทยได้",t:"ฟรี",f:1,img:1},
 {n:"ChatGPT",u:"https://chatgpt.com/",
  d:"แนบภาพต้นแบบได้ ถ้าบัญชีเปิดใช้สร้างภาพ",t:"ต้องล็อกอิน",f:0,img:1},
 {n:"Google ImageFX",u:"https://aitestkitchen.withgoogle.com/tools/image-fx",
  d:"ภาพสมจริงคมมาก มี Prompt Chips เปลี่ยนสไตล์ไว",t:"ฟรี",f:1,img:0},
 {n:"Bing Image Creator",u:"https://www.bing.com/images/create",
  d:"DALL·E 3 เข้าใจคำสั่งยาวดี มีเครดิต Boost ฟรีทุกวัน",t:"ฟรี",f:1,img:0},
 {n:"Microsoft Designer",u:"https://designer.microsoft.com/image-creator",
  d:"ตัวเดียวกับ Bing แต่มีเครื่องมือจัดหน้าเพิ่ม",t:"ฟรี",f:1,img:0},
 {n:"Leonardo.AI",u:"https://app.leonardo.ai/ai-generations",
  d:"เครดิตฟรีวันละ 150 · มี ControlNet ปรับละเอียด",t:"ฟรีรายวัน",f:1,img:0},
 {n:"Ideogram",u:"https://ideogram.ai/t/explore",
  d:"ตัวอักษรบนภาพคมที่สุด เหมาะกับงานที่ต้องมีข้อความ",t:"ฟรีจำกัด",f:1,img:0},
 {n:"Hugging Face · FLUX.1",u:"https://huggingface.co/spaces/black-forest-labs/FLUX.1-schnell",
  d:"โมเดลโอเพนซอร์สคุณภาพสูง ไม่ต้องสมัคร",t:"ฟรี",f:1,img:0},
 {n:"Arena AI",u:"https://arena.ai",
  d:"เว็บจัดอันดับ/แข่งขันโมเดล AI หลายด้าน มีโหมด Design to Code แนบภาพแล้วให้ AI สร้างต่อ",
  t:"ฟรี",f:1,img:1},
 {n:"Adobe Firefly",u:"https://firefly.adobe.com",
  d:"สตูดิโอสร้างภาพของ Adobe รวมกว่า 30 โมเดล มี Structure Reference แนบภาพต้นแบบคุมองค์ประกอบได้",
  t:"ต้องล็อกอิน",f:0,img:1},
 {n:"Design Arena",u:"https://designarena.ai",
  d:"เว็บเปรียบเทียบโมเดล AI แบบ crowdsourced มีหมวด Image และ Image Editing ให้แนบภาพต้นแบบ",
  t:"ฟรี",f:1,img:1},
 {n:"Dola AI",u:"https://dola.com",
  d:"ผู้ช่วย AI อเนกประสงค์ มีโหมด Create Images แนบภาพต้นแบบผ่านปุ่มแนบไฟล์ได้",
  t:"ต้องล็อกอิน",f:0,img:1}
];
function renderDests(){
  $("hoTitle").textContent="คัดลอกคำสั่ง & ส่งงานเข้าเว็บ AI · "+DESTS.length+" ปลายทาง";
  $("hoDest").innerHTML=DESTS.map((x,i)=>
    '<button class="dcard'+(x.img?' keeps':'')+'" data-i="'+i+'"><b>'+esc(x.n)+'</b><em>'+esc(x.d)+'</em>'+
    '<span class="tags"><span class="tagi'+(x.f?' free':'')+'">'+esc(x.t)+'</span>'+
    '<span class="tagi '+(x.img?'i2i':'txt')+'">'+(x.img?'แนบภาพต้นแบบได้':'ข้อความอย่างเดียว')+'</span></span></button>').join("");
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

