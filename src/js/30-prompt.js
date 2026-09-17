/* ---------------- prompt engine ---------------- */
function find(list,id){return list.find(x=>x.id===id)||list[0]}

/* สื่อที่เลือกคือ "พระเอก" ของภาพ — ต้องบอก AI ให้ชัด ไม่งั้นมันไปเน้นรถที่วิ่งผ่านแทน */
function subjInfo(){
  const v=find(list("vehicle"),S.vehicle);
  return {n:v.subj||"subject",stat:!!v.stat,th:v.th};
}
function heroClause(){
  const S1=subjInfo();
  return " The "+S1.n+" is the hero of this image: it fills most of the frame, sits in sharp focus and reads instantly as the main subject."+
    (S1.stat
      ? " Cars, buses, people and buildings are background context only — never let a passing vehicle become the main subject or block the sign face, and keep the whole advertising face unobstructed and squarely readable."
      : " Other traffic, people and buildings stay in the background and must not overlap or hide it.");
}
function angleText(a){
  const S1=subjInfo();
  let t=a.p.replace(/\bvehicle\b/g,S1.n);
  if(S1.stat){
    t=t.replace(/camera at hood height/i,"camera at street level looking slightly up at it")
       .replace(/entire flank flat to camera/i,"the whole advertising face square-on to camera")
       .replace(/wheels showing rotational blur/i,"passing traffic streaked with motion blur");
    if(/tracking|moving alongside/i.test(t))
      t+=" (the "+S1.n+" itself is fixed in place — the movement belongs to the traffic passing it)";
  }
  return t;
}

function dims(){
  const r=RATIOS[S.ratio];
  let w=Math.round(r.w*S.scale/8)*8, h=Math.round(r.h*S.scale/8)*8;
  const over=Math.max(w,h)/MAXPX;
  if(over>1){w=Math.round(w/over/8)*8;h=Math.round(h/over/8)*8;}
  return {w:w,h:h};
}

/* ---- อัตราส่วนภาพ: ต้องมาจาก dims() เท่านั้น ----
   dims() คูณ S.scale และตัดเพดานที่ MAXPX ให้แล้ว ใช้ตรงนี้เสมอเพื่อไม่ให้คำสั่ง / #roRes /
   เช็กลิสต์ / บรรทัดสรุปของโหมดแนะนำ รายงานตัวเลขไม่ตรงกัน (ห้ามอ่าน RATIOS[i].w/h ตรงๆ) */
function orientWord(w,h){return w>h?"landscape":w<h?"portrait":"square"}
function gcdOf(a,b){return b?gcdOf(b,a%b):a}
/* ย่ออัตราส่วนให้เป็นเลขเล็กสวยๆ เช่น "3:2" — ถ้าย่อไม่ลงตัว (ภาพถ่ายจริงมักไม่ลงตัวเป๊ะ)
   ให้ใช้ทศนิยมแทนดีกว่าเลข gcd เพี้ยนๆ อย่าง "2016:1134" */
function ratioLabel(w,h){
  const g=gcdOf(Math.round(w),Math.round(h))||1;
  const rw=Math.round(w/g), rh=Math.round(h/g);
  if(rw<=32&&rh<=32) return rw+":"+rh;
  return (w/h).toFixed(2)+":1";
}
function ratioClause(){
  const r=RATIOS[S.ratio], d=dims();
  return " Compose and output the image in a "+r.ar+" "+r.en+" frame, "+d.w+" × "+d.h+" pixels ("+orientWord(d.w,d.h)+").";
}
function ratioClauseTH(){
  const r=RATIOS[S.ratio], d=dims();
  return " กรอบภาพ "+r.ar+" "+r.th+" ขนาด "+d.w+" × "+d.h+" พิกเซล";
}
/* true เมื่อควรบังคับสัดส่วนของภาพต้นฉบับแทนเมนู #ratio — ใช้เฉพาะตอนมีภาพอ้างอิงและติ๊กไว้เท่านั้น
   (ค่านี้ใช้ร่วมกันทั้ง prompt builder และ UI ที่ต้องโชว์ว่ากำลัง override เมนูอยู่) */
function srcRatioActive(){return !!(S.refData&&S.refW&&S.refH&&$("srcRatio")&&$("srcRatio").checked)}
function srcRatioClause(){
  if(!srcRatioActive()) return ratioClause();
  return " Keep the output at the same aspect ratio and framing as the source photograph (about "+
    ratioLabel(S.refW,S.refH)+", "+S.refW+" × "+S.refH+" pixels, "+orientWord(S.refW,S.refH)+").";
}
function srcRatioClauseTH(){
  if(!srcRatioActive()) return ratioClauseTH();
  return " ใช้อัตราส่วนเดียวกับภาพต้นฉบับ (ประมาณ "+ratioLabel(S.refW,S.refH)+", "+S.refW+" × "+S.refH+" พิกเซล)";
}

/* สิ่งที่ไม่ต้องการในภาพ — เดิมส่งเป็นพารามิเตอร์ negative_prompt ของ API
   ตอนนี้ไม่มี API แล้ว จึงต้องเขียนลงในตัวคำสั่งเอง ไม่งั้นช่องนี้จะไม่มีผลใดๆ
   ถ้าเลือกสไตล์ "เส้นสายไฟวิ่ง" ต้องตัดคำที่ห้ามเบลอออก ไม่งั้นจะขัดกันเอง */
function negWords(){
  let w=$("negative").value.split(",").map(x=>x.trim()).filter(Boolean);
  if(S.styles.has("trails")) w=w.filter(x=>!/blur|motion|streak|เบลอ/i.test(x));
  return w;
}
function negClause(){
  const w=negWords();
  return w.length?" Avoid entirely: "+w.join(", ")+".":"";
}
function negClauseTH(){
  const w=negWords();
  return w.length?" สิ่งที่ต้องไม่มีในภาพเด็ดขาด: "+w.join(", ")+".":"";
}

function buildPrompt(){
  const v=find(list("vehicle"),S.vehicle), l=find(list("loc"),S.loc),
        li=find(list("light"),S.light);
  let a=find(list("angle"),S.angle);
  const hasRef=!!S.refData;
  const fid=hasRef?+$("fidelity").value:0;

  /* ล็อกมุมมองตามภาพร่าง */
  if(hasRef && $("lockView").checked && S.refOrient){
    a=find(list("angle"),S.refOrient);
  }

  const art=$("artwork").value.trim();
  const notes=$("detail").value.trim();
  const bodyNotes=$("bodyNotes").value.trim();
  const styles=list("style").filter(s=>S.styles.has(s.id)).map(s=>s.p);
  const hdrWord = S.hdr>=85?"extreme HDR dynamic range, punchy contrast"
               : S.hdr>=60?"strong HDR dynamic range, rich contrast"
               : S.hdr>=35?"balanced dynamic range, natural contrast"
               : "low contrast, flat log-style grade";

  /* ---- ส่วนล็อกต้นแบบ ---- */
  const lock=[];
  if(hasRef && fid>=30){
    if($("lockColor").checked){
      const c1=hexName($("col1").value), c2=hexName($("col2").value);
      lock.push("livery painted exactly "+c1.name+" ("+$("col1").value.toUpperCase()+") as the dominant body colour with "+
                c2.name+" ("+$("col2").value.toUpperCase()+") on the roof and window band");
      if(S.refExtra&&S.refExtra.length) lock.push("secondary accents in "+S.refExtra.join(" and "));
      lock.push("do not change these colours");
    }
    if($("lockBody").checked){
      lock.push(S.refBody||"long low-floor two-axle city bus body");
      if(bodyNotes) lock.push(bodyNotes);
    }
  }

  const head = fid>=70
    ? "a faithful photorealistic recreation of one specific reference vehicle — "+v.p
    : fid>=30 ? "based closely on a reference vehicle — "+v.p : v.p;

  const parts=[
    head,
    heroClause().trim(),
    lock.join(", "),
    art,
    "on "+l.p,
    angleText(a),
    lensList()[S.lens].v,
    li.p,
    weatherList()[S.weather].v,
    hdrWord,
    styles.join(", "),
    fid>=70
      ? "8K, sharp panel gaps, correct wheel and tyre geometry, professional retouching"
      : "8K resolution, ultra detailed reflections on glass and clearcoat, accurate tyre and wheel geometry, professional colour grading",
    notes
  ].filter(Boolean);
  return parts.join(", ")+"."+ratioClause()+negClause();
}

function sync(){
  const srcActive=srcRatioActive();
  const d=srcActive?{w:S.refW,h:S.refH}:dims();
  $("roRes").textContent=d.w+" × "+d.h;
  $("roMp").textContent=(d.w*d.h/1e6).toFixed(2)+" MP";
  $("roSrcNote").hidden=!srcActive;
  $("lensVal").textContent=lensList()[S.lens].s;
  $("scaleVal").textContent=S.scale.toFixed(1)+"×";
  $("hdrVal").textContent=S.hdr+"%";
  const p=activePrompt(), th=activePromptTH();
  const lang=store.get("as3d_plang")||"en";
  if(lang==="th"){
    $("promptOut").textContent=th;
    $("pcount").textContent=th.length+" ตัวอักษร · ฉบับอ่านตรวจสอบ";
  }else if(lang==="both"){
    $("promptOut").innerHTML='<span class="thside">'+esc(th)+'</span>'+esc(p);
    $("pcount").textContent=p.length+" chars · ส่งฉบับอังกฤษ";
  }else{
    $("promptOut").textContent=p;
    $("pcount").textContent=p.length+" chars";
  }
  const exp=$("exPrompt");
  if(exp){ exp.textContent=p; $("exCount").textContent=p.length+" chars";
    $("exSave").hidden=!hasSketch();
    $("exSaveAd").hidden=!hasAd();
    $("exNote").textContent = adReady()
      ? "โหมดเปลี่ยนโฆษณา — แนบ 2 ไฟล์ตามลำดับ: ภาพสื่อต้นแบบก่อน แล้วอาร์ตเวิร์กตามหลัง"
      : hasSketch()
        ? "โหมดคงสื่อต้นแบบ — คัดลอกคำสั่งแล้วแนบภาพสื่อต้นแบบไปพร้อมกัน"
        : "ยังไม่ได้อัปโหลดภาพสื่อต้นแบบ — AI จะวาดสื่อขึ้นใหม่ ไม่ตรงของจริง";
  }
  const md = adReady()?"AD SWAP · 2 IMAGES" : hasSketch()?"KEEP REFERENCE · 1 IMAGE" : "TEXT ONLY";
  $("badgeMode").textContent=md;
  $("liveDot").style.background = hasSketch()?"var(--ok)":"var(--warn)";
}

