/* ---------------- ธีมสว่าง/มืด ----------------
   ค่าจริง (data-theme บน <html>) ถูกตั้งไปแล้วโดยสคริปต์เล็กๆ ที่ <head> ก่อนหน้า @@CSS@@/@@JS@@
   (กันจอกระพริบ — ดูคอมเมนต์บนสุดของ src/index.html) ไฟล์นี้แค่ผูกปุ่มสลับ + สั่งวาดแผนที่ใหม่
   เมื่อธีมเปลี่ยน (แผนที่ canvas มีสีของตัวเอง ไม่ได้ใช้ CSS variable ต้องสั่งวาดใหม่เอง) */
const THEME_KEY="as3d_theme";
function themeGet(){return document.documentElement.getAttribute("data-theme")==="light"?"light":"dark"}
function themeIsLight(){return themeGet()==="light"}
function themeSet(t){
  document.documentElement.setAttribute("data-theme",t);
  store.set(THEME_KEY,t);
  paintThemeButtons();
  if(typeof paintAll==="function") paintAll();
}
function themeToggle(){themeSet(themeIsLight()?"dark":"light")}
function paintThemeButtons(){
  const light=themeIsLight();
  document.querySelectorAll(".themebtn").forEach(b=>{
    b.setAttribute("aria-pressed",light?"true":"false");
    b.title=light?"กำลังใช้ธีมสว่าง — กดเพื่อสลับเป็นธีมมืด":"กำลังใช้ธีมมืด — กดเพื่อสลับเป็นธีมสว่าง";
  });
}
document.querySelectorAll(".themebtn").forEach(b=>b.addEventListener("click",themeToggle));
paintThemeButtons();

