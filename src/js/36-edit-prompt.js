/* ---------------- edit-mode prompt ---------------- */
/* คำสั่งสำหรับ "แก้ภาพ" ต้องสั้นและสั่งตรงๆ
   คำอย่าง Unreal Engine / Octane / 8K เป็นคำสั่งให้ "เรนเดอร์ใหม่" ซึ่งดึงโมเดลออกจากรถต้นแบบ
   จึงตัดออกจากโหมดนี้ เว้นแต่ผู้ใช้เปิดเอง */
function buildEditPrompt(){
  const l=find(list("loc"),S.loc), li=find(list("light"),S.light);
  let a=find(list("angle"),S.angle);
  if($("lockView").checked&&S.refOrient) a=find(list("angle"),S.refOrient);
  const fid=+$("fidelity").value;
  const notes=$("detail").value.trim();
  const bodyNotes=$("bodyNotes").value.trim();

  const SB=subjInfo(), N=SB.n;
  const keep = fid>=70
    ? "Edit this photograph. The "+N+" in it must stay exactly as it is: identical shape and proportions, identical structure and panel layout, identical colours, and every printed graphic, logo and piece of text on it reproduced exactly. Do not redraw, restyle or replace the "+N+"."
    : fid>=30
    ? "Edit this photograph, keeping the "+N+" recognisably the same: same colours, same proportions, same graphics on its face. Minor cleanup is allowed."
    : "Use this photograph as loose inspiration for a new image of a similar "+N+".";

  const colours = $("lockColor").checked
    ? " Its paint stays "+hexName($("col1").value).name+" and "+hexName($("col2").value).name+"." : "";
  const body = ($("lockBody").checked&&bodyNotes) ? " "+bodyNotes+"." : "";

  const keepLoc = $("lockLoc").checked;
  const scene = keepLoc
    ? " Keep the exact same real-world location and background as shown in the photograph — do not relocate it or change the surroundings, only refine them."+
      " Camera: "+angleText(a)+", "+lensList()[S.lens].v+
      ". Retouch the lighting and shadows to professional editorial/advertising photography quality: "+li.p+", "+weatherList()[S.weather].v+"."
    : " Change only what is around it: place the "+N+" on "+l.p+
      ". Camera: "+angleText(a)+", "+lensList()[S.lens].v+
      ". Light: "+li.p+", "+weatherList()[S.weather].v+".";

  const finish = $("editStyle").checked
    ? " Finish as a polished automotive advertising photograph: "+
      list("style").filter(s=>S.styles.has(s.id)).map(s=>s.p).join(", ")+"."
    : " Keep it a believable photograph — natural depth of field, clean reflections, correct shadows under the wheels.";

  const hdrWord = S.hdr>=85?" Strong contrast and deep blacks."
               : S.hdr>=60?" Rich contrast." : S.hdr>=35?" Natural contrast." : " Soft, low contrast.";

  return keep+heroClause()+colours+body+scene+finish+hdrWord+
         (notes?" "+notes+".":"")+
         busSignClause()+
         srcRatioClause()+
         negClause()+
         " Output one single photorealistic image, no text overlay, no watermark, no collage.";
}

/* คำสั่งเปลี่ยนโฆษณา — ส่งภาพสองใบ ใบแรกคือสื่อ ใบที่สองคืออาร์ตเวิร์กใหม่ */
function buildAdPrompt(){
  const SB=subjInfo(), N=SB.n;
  const keepScene=$("adKeepScene").checked, fit=$("adFit").value;
  const l=find(list("loc"),S.loc), li=find(list("light"),S.light);
  let a=find(list("angle"),S.angle);
  const notes=$("detail").value.trim();
  const styles=list("style").filter(s=>S.styles.has(s.id)).map(s=>s.p);
  const hdrWord = S.hdr>=85?"extreme HDR dynamic range, punchy contrast"
               : S.hdr>=60?"strong HDR dynamic range, rich contrast"
               : S.hdr>=35?"balanced dynamic range, natural contrast"
               : "low contrast, flat log-style grade";

  let t="TASK: advertising mockup — replace the creative on an out-of-home media asset."+
    " You are given two images in order. IMAGE 1 (the first attachment) is the photograph to edit: it shows a "+N+
    " that currently carries an advertisement. IMAGE 2 (the second attachment) is a DIFFERENT, NEW advertising artwork."+
    " Your job: completely remove the advertisement currently printed on the "+N+" in IMAGE 1 — its brand, its photos, its logos and all of its text must disappear entirely and must NOT appear anywhere in the result —"+
    " and put the artwork from IMAGE 2 in its place."+
    " The old creative is being retired; only the new artwork from IMAGE 2 may be visible on the advertising face."+
    " Keep the "+N+" itself unchanged: same shape, structure, frame, edges, position in frame and everything around it."+
    " Place it in exactly the same area the old advertisement occupied, matching that face's perspective, corner positions, curvature and crop, filling it edge to edge with no leftover border."+
    (fit==="relayout"
      ? " The advertising face is much wider than IMAGE 2, so RE-COMPOSE the artwork to fit it, the way a professional retoucher adapts a key visual to a different format:"+
        " keep every element of IMAGE 2 — the people, the product packs, the logos, the headline and every piece of text — at its own true, undistorted proportions,"+
        " but move, rescale and re-arrange those elements into a new layout that fills the whole face naturally;"+
        " extend the background colour, gradient and decorative shapes outward to cover the extra width."+
        " ABSOLUTELY DO NOT stretch, squash, skew or warp anything: faces, bodies, bottles and type must never be distorted. Re-arranging is required; distorting is forbidden."
      : fit==="fit"
      ? " Keep IMAGE 2's own layout and element positions exactly as designed, at correct undistorted proportions; where its shape does not match the face, extend its background colour and gradient outward to fill the remaining area. Never stretch or squash any element."
      : " Scale IMAGE 2 to fill the face completely.")+
    " Reproduce the artwork's colours, typography, wording and logos exactly as in IMAGE 2 — every Thai and English word spelled identically. Do not translate, re-letter or invent any text."+
    " Blend it into the original lighting, shadows, reflections, gloss and surface texture so it reads as physically printed and installed on that surface, not pasted on top.";

  if(keepScene){
    t+=" Keep the exact same real-world location and background as shown in IMAGE 1 — do not relocate the scene or change the surroundings, only refine them."+
       " Camera: "+angleText(a)+", "+lensList()[S.lens].v+"."+
       " Light: "+li.p+", "+weatherList()[S.weather].v+", "+hdrWord+"."+
       " Retouch the lighting, shadows and colour grading on the whole photograph to professional editorial/advertising photography quality, consistent with this camera angle and light, while keeping the same place.";
  }else{
    t+=" Then re-stage and re-light the entire photograph around it — this part must visibly change:"+
       " relocate the whole scene to "+l.p+"."+
       " Camera: "+angleText(a)+", "+lensList()[S.lens].v+"."+
       " Light: "+li.p+", "+weatherList()[S.weather].v+", "+hdrWord+"."+
       " Rebuild the sky, the background, the road surface and every reflection to match that place and that light, and relight the "+N+
       " itself so its shadows, highlights and colour temperature agree with the new scene.";
    t+=heroClause();
  }
  if(styles.length) t+=" Overall finish: "+styles.join(", ")+".";
  if(notes) t+=" "+notes+".";
  return t+busSignClause()+srcRatioClause()+negClause()+" Output one single photorealistic image, no text overlay, no watermark, no collage, no before-after split.";
}
function buildAdPromptTH(){
  const v=find(list("vehicle"),S.vehicle), N=v.th;
  const keepScene=$("adKeepScene").checked, fit=$("adFit").value;
  const l=find(list("loc"),S.loc), li=find(list("light"),S.light), a=find(list("angle"),S.angle);
  const notes=$("detail").value.trim();
  const styles=list("style").filter(x=>S.styles.has(x.id)).map(x=>x.th);
  let t="งาน: ทำ mockup เปลี่ยนโฆษณาบนสื่อนอกบ้าน — ใช้ภาพสองใบตามลำดับ"+
    " ใบที่ 1 (ไฟล์แรก) คือภาพ"+N+"ที่มีโฆษณาเดิมติดอยู่ ใบที่ 2 (ไฟล์ที่สอง) คืออาร์ตเวิร์กโฆษณาชิ้นใหม่ที่เป็นคนละชิ้นกัน"+
    " ให้ลบโฆษณาเดิมบน"+N+"ออกให้หมด ทั้งแบรนด์ ภาพ โลโก้ และข้อความทุกตัวต้องหายไปไม่เหลือร่องรอย ห้ามปรากฏที่ใดในภาพผลลัพธ์"+
    " แล้วนำอาร์ตเวิร์กจากใบที่ 2 มาวางแทนที่"+
    " โฆษณาเดิมถูกปลดแล้ว บนหน้าสื่อต้องเห็นเฉพาะอาร์ตเวิร์กใหม่เท่านั้น"+
    " ตัว"+N+"ต้องคงเดิมทุกอย่าง — รูปทรง โครงสร้าง กรอบ ขอบ ตำแหน่งในเฟรม และทุกสิ่งรอบข้าง"+
    " วางลงในพื้นที่เดิมของโฆษณาเก่าให้พอดี ตรงเพอร์สเปคทีฟ ตรงมุมทั้งสี่ ตรงความโค้ง ปูเต็มขอบถึงขอบไม่เหลือช่องว่าง"+
    (fit==="relayout"
      ? " หน้าป้ายกว้างกว่าอาร์ตเวิร์กมาก ให้ **จัดองค์ประกอบใหม่** แบบที่กราฟิกดีไซเนอร์มืออาชีพปรับคีย์วิชวลลงสื่อคนละขนาด —"+
        " ทุกชิ้นในใบที่ 2 ทั้งคน ขวดสินค้า โลโก้ พาดหัว และข้อความ ต้องคงสัดส่วนจริงของตัวเองไว้ ห้ามผิดรูป"+
        " แต่ให้ย้ายตำแหน่ง ย่อขยาย และจัดวางใหม่ให้เต็มหน้าป้ายอย่างเป็นธรรมชาติ ขยายพื้นหลัง สีไล่ระดับ และลวดลายประกอบออกไปให้เต็มความกว้างที่เพิ่มมา"+
        " ห้ามยืด ห้ามบีบ ห้ามบิดเบี้ยวเด็ดขาด — ใบหน้า ลำตัว ขวด และตัวอักษรต้องไม่ผิดสัดส่วน จัดวางใหม่ได้ แต่ยืดไม่ได้"
      : fit==="fit"
      ? " คงเลย์เอาต์และตำแหน่งทุกชิ้นตามต้นฉบับเป๊ะ สัดส่วนถูกต้อง ถ้ารูปทรงไม่พอดีกรอบ ให้ต่อพื้นหลังและสีไล่ระดับออกไปเติมส่วนที่เหลือ ห้ามยืดหรือบีบ"
      : " ย่อขยายให้เต็มกรอบพอดี")+
    " สี ฟอนต์ ถ้อยคำ และโลโก้ต้องเหมือนใบที่ 2 ทุกตัวอักษร ทั้งไทยและอังกฤษสะกดเหมือนเดิม ห้ามแปล ห้ามพิมพ์ใหม่ ห้ามแต่งข้อความเพิ่ม"+
    " กลมกลืนกับแสง เงา แสงสะท้อน ความมันวาว และผิวสัมผัสของภาพเดิม ให้ดูเหมือนพิมพ์ติดอยู่บนสื่อจริง ไม่ใช่แปะทับ";
  t+= keepScene
    ? " คงสถานที่และพื้นหลังเดิมจากใบที่ 1 ไม่ย้ายไปที่อื่น เปลี่ยนเฉพาะสิ่งที่จำเป็น · มุมกล้อง "+a.th+" · เลนส์ "+thLens()+
      " · แสง "+li.th+" · "+thWeather()+" · "+thHdr()+
      " · แต่งแสง เงา และเกรดสีทั้งภาพให้สวยระดับภาพถ่ายมืออาชีพ ให้เข้ากับมุมกล้องและแสงนี้ โดยยังอยู่ที่เดิม"
    : " จากนั้นจัดฉากและจัดแสงใหม่ทั้งภาพ ส่วนนี้ต้องเปลี่ยนให้เห็นชัด — ย้ายฉากทั้งหมดไปที่ "+l.th+
      " · มุมกล้อง "+a.th+" · เลนส์ "+thLens()+" · แสง "+li.th+" · "+thWeather()+" · "+thHdr()+
      " · สร้างท้องฟ้า ฉากหลัง ผิวถนน และเงาสะท้อนใหม่ให้ตรงกับสถานที่และแสงนั้น พร้อมจัดแสงบนตัวสื่อใหม่ให้เงา ไฮไลต์ และอุณหภูมิสีเข้ากับฉากใหม่";
  if(styles.length) t+=" · เก็บงานสไตล์: "+styles.join(", ");
  if(notes) t+=" "+notes;
  return t+busSignClauseTH()+srcRatioClauseTH()+negClauseTH()+" ส่งออกภาพเดียว ไม่มีข้อความซ้อน ไม่มีลายน้ำ ไม่ตัดต่อเทียบก่อนหลัง";
}
function activePrompt(){return adReady()?buildAdPrompt():editMode()?buildEditPrompt():buildPrompt()}

