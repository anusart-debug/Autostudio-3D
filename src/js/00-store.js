/* ---------------- ที่เก็บค่าในเครื่อง (localStorage) ----------------
   ใช้เก็บเฉพาะค่าตั้งค่าหน้าจอและรายการที่ผู้ใช้เพิ่มเอง
   ไม่มีการเก็บ API Key หรือข้อมูลลับใดๆ และไม่มีการส่งข้อมูลออกนอกเครื่อง */
const store=(function(){
  let ok=true;
  try{ localStorage.setItem("as3d_t","1"); localStorage.removeItem("as3d_t"); }catch(e){ ok=false; }
  const mem={};
  return {
    get(k){ if(!ok) return (k in mem)?mem[k]:null; try{return localStorage.getItem(k)}catch(e){return (k in mem)?mem[k]:null} },
    set(k,v){ mem[k]=v; if(!ok) return; try{localStorage.setItem(k,v)}catch(e){} },
    del(k){ delete mem[k]; if(!ok) return; try{localStorage.removeItem(k)}catch(e){} }
  };
})();

