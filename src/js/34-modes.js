/* ---------------- โหมดการเขียนคำสั่ง ----------------
   ระบบนี้ไม่เจนภาพเอง จึงไม่มีการตรวจสอบความสามารถของ API ใดๆ
   ปลายทางที่เราแนะนำแนบภาพได้ทุกเจ้า ระบบจึงเขียนคำสั่งแบบ "คงสื่อต้นแบบ" เสมอเมื่อมีภาพ */
function hasSketch(){return !!(S.refData&&S.refB64)}
function imageCapable(){return true}
function editMode(){return hasSketch()}
/* มีภาพอาร์ตเวิร์กใบที่สอง */
function hasAd(){return !!(S.adB64&&S.adData)}
/* มีครบสองใบ = เขียนคำสั่งเปลี่ยนโฆษณาในจุดเดิมของสื่อ */
function adReady(){return hasAd()&&hasSketch()}
function adMode(){return adReady()}
/* ป้ายจุดหมายปลายทางบนกระจกหน้ารถมีความหมายเฉพาะยานพาหนะที่เป็นรถเมล์จริงเท่านั้น
   (ป้ายบิลบอร์ด/จอ LED/ตุ๊กตุ๊กไม่มีจอแบบนี้) */
function isBusVehicle(){return["wrap","dd","bus3d"].indexOf(S.vehicle)>=0}

