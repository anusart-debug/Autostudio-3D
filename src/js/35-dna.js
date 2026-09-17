/* ---------------- reference DNA ---------------- */
const NAMED=[
 ["black",17,17,20],["charcoal",48,52,58],["mid grey",128,130,134],["light grey",190,193,198],
 ["silver",212,215,220],["white",250,250,252],["cream",245,235,210],["beige",214,196,168],
 ["deep navy blue",20,32,78],["royal blue",30,58,138],["cobalt blue",25,90,190],["sky blue",96,165,250],
 ["pale blue",186,214,245],["teal",20,130,130],["cyan",34,190,210],["mint green",130,220,190],
 ["emerald green",16,140,80],["deep green",22,86,52],["lime green",150,205,60],["olive",125,120,50],
 ["yellow",245,205,40],["gold",212,175,55],["amber orange",240,150,30],["orange",240,110,35],
 ["vermilion red",225,70,40],["crimson red",190,30,50],["deep maroon",110,25,35],["pink",240,140,170],
 ["magenta",210,50,140],["purple",120,55,160],["violet",150,110,230],["brown",120,80,50],
 ["tan",180,140,100]
];
function hexRgb(h){return [parseInt(h.substr(1,2),16),parseInt(h.substr(3,2),16),parseInt(h.substr(5,2),16)]}
function rgbHex(r,g,b){return "#"+[r,g,b].map(x=>Math.max(0,Math.min(255,Math.round(x))).toString(16).padStart(2,"0")).join("")}
function nearestName(r,g,b){
  let best=NAMED[0],bd=1e9;
  for(const n of NAMED){
    const d=(r-n[1])**2+(g-n[2])**2+(b-n[3])**2;
    if(d<bd){bd=d;best=n}
  }
  return best[0];
}
function hexName(h){const [r,g,b]=hexRgb(h);return {name:nearestName(r,g,b),r:r,g:g,b:b}}
const TH_COLOR={"black":"ดำ","charcoal":"เทาเข้ม","mid grey":"เทากลาง","light grey":"เทาอ่อน","silver":"เงิน",
"white":"ขาว","cream":"ครีม","beige":"เบจ","deep navy blue":"น้ำเงินกรมท่า","royal blue":"น้ำเงินเข้ม",
"cobalt blue":"น้ำเงินสด","sky blue":"ฟ้า","pale blue":"ฟ้าอ่อน","teal":"เขียวอมฟ้า","cyan":"ฟ้าสด",
"mint green":"เขียวมิ้นต์","emerald green":"เขียวมรกต","deep green":"เขียวเข้ม","lime green":"เขียวมะนาว",
"olive":"เขียวขี้ม้า","yellow":"เหลือง","gold":"ทอง","amber orange":"ส้มอำพัน","orange":"ส้ม",
"vermilion red":"แดงส้ม","crimson red":"แดงเลือดหมู","deep maroon":"แดงเข้ม","pink":"ชมพู","magenta":"บานเย็น",
"purple":"ม่วง","violet":"ม่วงอ่อน","brown":"น้ำตาล","tan":"น้ำตาลอ่อน"};
function thColor(h){const n=hexName(h).name;return (TH_COLOR[n]||n)+" ("+h.toUpperCase()+")"}
function thLens(){return lensList()[S.lens].t.split("(")[0].trim()}
function thWeather(){return weatherList()[S.weather].t.split("/")[0].trim()}
function thHdr(){return S.hdr>=85?"คอนทราสต์จัด ดำลึก":S.hdr>=60?"คอนทราสต์สูง":S.hdr>=35?"คอนทราสต์ธรรมชาติ":"คอนทราสต์ต่ำ นุ่ม"}

/* ฉบับภาษาไทย — เขียนจากตัวเลือกชุดเดียวกัน ไว้ให้อ่านตรวจสอบก่อนส่ง */
function buildEditPromptTH(){
  const l=find(list("loc"),S.loc), li=find(list("light"),S.light), v=find(list("vehicle"),S.vehicle);
  let a=find(list("angle"),S.angle);
  if($("lockView").checked&&S.refOrient) a=find(list("angle"),S.refOrient);
  const fid=+$("fidelity").value, N=v.th;
  const keep = fid>=70
    ? "แก้ภาพนี้ โดย"+N+"ในภาพต้องคงเดิมทุกอย่าง — รูปทรงและสัดส่วนเดิม โครงสร้างและแนวแผงเดิม สีเดิม และกราฟิก โลโก้ ข้อความทุกชิ้นบนตัวสื่อต้องเหมือนเดิมเป๊ะ ห้ามวาดใหม่ ห้ามเปลี่ยนสไตล์ ห้ามสลับเป็นชิ้นอื่น"
    : fid>=30 ? "แก้ภาพนี้ โดยให้"+N+"ยังดูเป็นชิ้นเดิม — สีเดิม สัดส่วนเดิม กราฟิกเดิม แก้ไขเล็กน้อยได้"
    : "ใช้ภาพนี้เป็นแรงบันดาลใจคร่าวๆ เพื่อสร้าง"+N+"ชิ้นใหม่";
  const hero=" "+N+"คือพระเอกของภาพ ต้องกินพื้นที่เฟรมเป็นส่วนใหญ่ คมชัด และอ่านออกทันทีว่าเป็นประธานของภาพ"+
    (v.stat?" รถ คน และอาคารเป็นแค่ฉากหลัง ห้ามให้รถที่วิ่งผ่านกลายเป็นตัวเอกหรือบังหน้าป้าย ต้องเห็นหน้าสื่อเต็มไม่มีอะไรบัง"
          :" รถคันอื่น คน และอาคารอยู่ฉากหลัง ห้ามทับหรือบัง");
  const col=$("lockColor").checked?" สีต้องเป็น"+thColor($("col1").value)+" กับ"+thColor($("col2").value):"";
  const bn=$("bodyNotes").value.trim(), body=($("lockBody").checked&&bn)?" "+bn:"";
  const scene=" เปลี่ยนเฉพาะสิ่งรอบตัว — วางไว้ที่ "+l.th+" · มุมกล้อง "+a.th+" · เลนส์ "+thLens()+
    " · แสง "+li.th+" · สภาพอากาศ "+thWeather()+" · "+thHdr();
  const fin=$("editStyle").checked
    ? " เก็บงานแบบภาพโฆษณารถ: "+list("style").filter(x=>S.styles.has(x.id)).map(x=>x.th).join(", ")
    : " คงความเป็นภาพถ่ายจริง ชัดลึกธรรมชาติ เงาใต้ล้อถูกต้อง";
  const notes=$("detail").value.trim();
  return keep+hero+col+body+scene+fin+(notes?" "+notes:"")+negClauseTH()+" ส่งออกภาพเดียว ไม่มีข้อความซ้อน ไม่มีลายน้ำ ไม่ตัดต่อหลายช่อง";
}
function buildPromptTH(){
  const v=find(list("vehicle"),S.vehicle), l=find(list("loc"),S.loc),
        a=find(list("angle"),S.angle), li=find(list("light"),S.light);
  const fid=S.refData?+$("fidelity").value:0;
  const head=fid>=70?"สร้างภาพเหมือนจริงของ"+v.th+"ตามต้นแบบที่ให้มา":fid>=30?"สร้างภาพ"+v.th+"โดยอิงต้นแบบ":"สร้างภาพ"+v.th;
  const lock=[];
  if(S.refData&&fid>=30){
    if($("lockColor").checked) lock.push("สีต้องเป็น"+thColor($("col1").value)+" กับ"+thColor($("col2").value)+" ห้ามเปลี่ยน");
    if($("lockBody").checked){const bn=$("bodyNotes").value.trim(); if(bn) lock.push(bn)}
  }
  const art=$("artwork").value.trim(), notes=$("detail").value.trim();
  const hero=v.th+"คือพระเอกของภาพ กินพื้นที่เฟรมเป็นส่วนใหญ่ คมชัด เป็นประธานของภาพ"+
    (v.stat?" ห้ามให้รถที่วิ่งผ่านกลายเป็นตัวเอกหรือบังหน้าป้าย":"");
  return [head,hero,lock.join(" "),art,"ฉาก "+l.th,"มุมกล้อง "+a.th,"เลนส์ "+thLens(),
    "แสง "+li.th,thWeather(),thHdr(),
    list("style").filter(x=>S.styles.has(x.id)).map(x=>x.th).join(", "),
    "ความละเอียดสูง รายละเอียดคมชัด เก็บงานระดับมืออาชีพ",notes].filter(Boolean).join(" · ")+negClauseTH();
}
function activePromptTH(){return adReady()?buildAdPromptTH():editMode()?buildEditPromptTH():buildPromptTH()}

function analyze(img){
  const W=200, H=Math.max(1,Math.round(img.naturalHeight/img.naturalWidth*W));
  const cv=document.createElement("canvas");cv.width=W;cv.height=H;
  const ctx=cv.getContext("2d",{willReadFrequently:true});
  ctx.drawImage(img,0,0,W,H);
  let px;
  try{ px=ctx.getImageData(0,0,W,H).data }
  catch(e){ toast("อ่านสีจากภาพไม่ได้ (เบราว์เซอร์บล็อก) — ตั้งสีเองในแผง 01B",true); $("dnaBlock").hidden=false; return }

  /* หาขอบตัวรถแบบหยาบ: ตัดขอบที่เป็นพื้นหลังสีเรียบออก */
  const corner=[px[0],px[1],px[2]];
  const isBg=(r,g,b)=>Math.abs(r-corner[0])<16&&Math.abs(g-corner[1])<16&&Math.abs(b-corner[2])<16;

  const bins=new Map();
  let minX=W,maxX=0,minY=H,maxY=0,subject=0;
  for(let y=0;y<H;y++){
    for(let x=0;x<W;x++){
      const i=(y*W+x)*4, r=px[i],g=px[i+1],b=px[i+2],al=px[i+3];
      if(al<40) continue;
      if(isBg(r,g,b)) continue;
      subject++;
      if(x<minX)minX=x; if(x>maxX)maxX=x; if(y<minY)minY=y; if(y>maxY)maxY=y;
      const k=(r>>5)+"_"+(g>>5)+"_"+(b>>5);
      const e=bins.get(k)||{n:0,r:0,g:0,b:0};
      e.n++;e.r+=r;e.g+=g;e.b+=b;bins.set(k,e);
    }
  }
  if(subject<50){ $("dnaBlock").hidden=false; toast("แยกตัวรถจากพื้นหลังไม่ชัด — ตั้งสีเองในแผง 01B",true); return }

  /* รวมถังสีที่ตั้งชื่อแล้วซ้ำกัน เพื่อไม่ให้ได้ "ดำ" ซ้ำสามช่อง */
  const merged=new Map();
  for(const e of bins.values()){
    const rgb=[e.r/e.n,e.g/e.n,e.b/e.n];
    const nm=nearestName(rgb[0],rgb[1],rgb[2]);
    const m=merged.get(nm)||{n:0,r:0,g:0,b:0,name:nm};
    m.n+=e.n;m.r+=e.r;m.g+=e.g;m.b+=e.b;merged.set(nm,m);
  }
  const list=[...merged.values()].map(e=>({
    n:e.n, name:e.name, hex:rgbHex(e.r/e.n,e.g/e.n,e.b/e.n), rgb:[e.r/e.n,e.g/e.n,e.b/e.n]
  })).sort((a,b)=>b.n-a.n).slice(0,5);

  /* สีที่ถือเป็น "สีตัวรถ" คือสีเด่นที่ไม่ใช่กระจก/ยางดำสนิท */
  const sat=c=>{const m=Math.max(...c.rgb),n=Math.min(...c.rgb);return m===0?0:(m-n)/m};
  const lum=c=>(c.rgb[0]*.3+c.rgb[1]*.59+c.rgb[2]*.11);
  const body=list.filter(c=>lum(c)>34).sort((a,b)=>(sat(b)*b.n)-(sat(a)*a.n));
  const c1=body[0]||list[0];
  const c2=list.find(c=>c!==c1&&lum(c)>150)||body[1]||list[1]||c1;

  /* กระจกกับยางไม่ใช่สีลาย — ตัดโทนมืดจัดออกจากสีเสริม */
  S.refExtra=list.filter(c=>c!==c1&&c!==c2&&lum(c)>60).slice(0,2)
                 .map(c=>c.name+" ("+c.hex.toUpperCase()+")");

  $("col1").value=c1.hex; $("col1n").textContent=nearestName(...c1.rgb);
  $("col2").value=c2.hex; $("col2n").textContent=nearestName(...c2.rgb);

  const total=list.reduce((s,c)=>s+c.n,0);
  $("swatches").innerHTML=list.map(c=>
    '<div class="sw"><span class="chipc" style="background:'+c.hex+'"></span>'+
    '<span class="lab"><b>'+Math.round(c.n/total*100)+'%</b>'+c.hex.toUpperCase()+'</span></div>').join("");

  /* สัดส่วนตัวถัง + ทิศทาง */
  const bw=maxX-minX+1, bh=maxY-minY+1, ar=bw/bh;
  let bodyDesc, orient="";
  if(ar>=3.4){bodyDesc="a very long articulated or 12-metre single-deck bus body, roughly "+ar.toFixed(1)+":1 length-to-height, continuous glazing along the flank";orient="profile"}
  else if(ar>=2.3){bodyDesc="a standard 12-metre single-deck city bus body, about "+ar.toFixed(1)+":1 length-to-height, long window line and two passenger doors";orient="profile"}
  else if(ar>=1.5){bodyDesc="a compact bus body seen at a slight angle, about "+ar.toFixed(1)+":1 proportions";orient=""}
  else if(ar>=0.85){bodyDesc="a tall bodied vehicle seen close to three-quarter or front view";orient="hero34"}
  else {bodyDesc="a tall narrow vehicle framed vertically, likely a front or rear view";orient="hero34"}
  S.refBody=bodyDesc;
  S.refOrient=orient;

  $("dnaRatio").textContent=ar.toFixed(2)+":1";
  $("dnaBlock").hidden=false;
  updateDnaLine();
  sync();
}

function updateDnaLine(){
  if(!S.refData){$("dnaLine").textContent="ยังไม่มีภาพร่าง";return}
  const c1=hexName($("col1").value), c2=hexName($("col2").value);
  const fid=+$("fidelity").value;
  const on=[];
  if($("lockColor").checked) on.push("สี");
  if($("lockBody").checked) on.push("โครงสร้าง");
  if($("lockView").checked) on.push("มุมมอง");
  $("dnaLine").innerHTML=
    "ล็อก: <b>"+(on.length?on.join(" + "):"ไม่ล็อกอะไรเลย")+"</b> · ความเหมือน <b>"+fid+"%</b><br>"+
    "สีหลัก <b>"+c1.name+"</b> · สีรอง <b>"+c2.name+"</b>"+
    (S.refExtra&&S.refExtra.length?" · เสริม "+S.refExtra.join(", "):"");
}
["col1","col2"].forEach(id=>$(id).addEventListener("input",e=>{
  $(id+"n").textContent=hexName(e.target.value).name;updateDnaLine();sync();
}));
["lockColor","lockBody","lockView","srcRatio","editStyle"].forEach(id=>$(id).addEventListener("change",()=>{updateDnaLine();sync()}));
$("fidelity").addEventListener("input",e=>{$("fidVal").textContent=e.target.value+"%";updateDnaLine();sync()});
$("bodyNotes").addEventListener("input",sync);

