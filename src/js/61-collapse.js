/* ---------------- ย่อ/ขยายแผง ---------------- */
(function(){
  const CK="as3d_collapsed";
  let col=[]; try{col=JSON.parse(store.get(CK)||"[]")}catch(e){col=[]}
  const chev='<svg class="chev" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>';
  document.querySelectorAll(".block").forEach(sec=>{
    const head=sec.querySelector(".block-head"); if(!head)return;
    const h2=head.querySelector("h2"); const id=h2?h2.textContent.trim():"";
    if(!id)return;
    sec.dataset.panel=id;
    head.insertAdjacentHTML("beforeend",chev);
    if(col.indexOf(id)>=0) sec.classList.add("collapsed");
    head.addEventListener("click",()=>{
      sec.classList.toggle("collapsed");
      const on=sec.classList.contains("collapsed");
      col=col.filter(x=>x!==id); if(on)col.push(id);
      try{store.set(CK,JSON.stringify(col))}catch(e){}
    });
  });
})();

