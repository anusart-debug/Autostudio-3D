/* ================= การถามข้อมูล: แบ่งเป็น 3 ช่วง เพื่อให้ขึ้นเร็ว =================
   บทเรียนจาก v38: ยิงคำขอเดียวที่ขอทั้งแผนที่ + สมาชิกทุกสาย ทำให้ข้อมูลหลายเมกะไบต์
   ในย่านกลางเมืองจึงช้าจนหมดเวลาและได้ผลลัพธ์ว่าง
   v39 แยกเป็น: A) สายที่จอดป้ายใกล้จุดนี้ (เล็กมาก ขึ้นก่อน)
                B) ฐานแผนที่ถนน (ขนาดกลาง วาดตามมา)
                C) เส้นทางเฉพาะช่วงที่อยู่ในภาพ ของแต่ละสาย (ระบายสีทีหลัง)
   แต่ละช่วงแสดงผลทันทีที่เสร็จ ช่วงหลังพังก็ไม่ลบผลของช่วงก่อน */

/* A) ป้ายรถเมล์ใกล้จุด + สายที่จอดป้ายนั้น — นี่คือคำตอบที่ตรงกับคำถามของฝ่ายขายจริงๆ
      "สื่อตัวนี้อยู่ป้ายไหน และมีรถสายอะไรจอดบ้าง" ไม่ใช่ "มีสายอะไรขับผ่านแถวนี้" */
function qStops(lat,lng,near){
  const N="(around:"+near+","+lat+","+lng+")";
  return "/*as3d:stops*/[out:json][timeout:25];"+
    "(node"+N+'["highway"="bus_stop"];'+
     "node"+N+'["public_transport"="platform"]["bus"="yes"];'+
     "node"+N+'["public_transport"="stop_position"]["bus"="yes"];'+
    ")->.s;"+
    ".s out;"+
    'rel(bn.s)["route"="bus"];out tags;';
}
/* B) ฐานแผนที่ — ตัดถนนซอยย่อยออกเมื่อซูมกว้าง ไม่งั้นข้อมูลบานและแผนที่รก */
function qBase(lat,lng,r){
  const A="(around:"+r+","+lat+","+lng+")";
  const drop = r>=1000
    ? "^(footway|path|steps|cycleway|track|corridor|platform|bridleway|proposed|construction|raceway|busway|service|living_street)$"
    : "^(footway|path|steps|cycleway|track|corridor|platform|bridleway|proposed|construction|raceway|busway)$";
  return "/*as3d:base*/[out:json][timeout:40];"+
    "(way"+A+'["highway"]["highway"!~"'+drop+'"];'+
     "way"+A+'["railway"~"^(subway|light_rail|monorail|rail)$"];'+
     "way"+A+'["natural"="water"];'+
     "way"+A+'["leisure"~"^(park|garden)$"];'+
    ")->.w;.w out geom;"+
    "(node"+A+'["railway"="station"]["name"];'+
     "node"+A+'["public_transport"="station"]["name"];'+
     "node"+A+'["place"~"^(suburb|neighbourhood|quarter)$"]["name"];'+
     "node"+A+'["amenity"~"^(hospital|university|college)$"]["name"];'+
     "node"+A+'["tourism"~"^(attraction|museum)$"]["name"];'+
    ")->.n;.n out;";
}
/* C) เส้นทางรายสาย เฉพาะช่วงถนนที่อยู่ในกรอบภาพ
      foreach ทำให้ได้ relation แล้วตามด้วย way ของสายนั้นเป็นชุดๆ
      เล็กกว่าการดึงสมาชิกทั้งสายทั้งเมืองหลายสิบเท่า */
function qLines(lat,lng,r,near){
  /* เหตุผลที่ v39 ช้ามาก: บรรทัดนี้เคยเป็น way(around:r)["highway"] เฉยๆ
     จึงลากทางเท้า ทางเดิน ซอยบริการ เข้ามาทั้งหมดก่อนค่อยตัดกับสายรถเมล์
     ในย่านอย่างจตุจักรคือหลายพันเส้นที่ไม่มีทางเป็นเส้นทางรถเมล์ได้เลย
     คัดเหลือเฉพาะชั้นถนนที่รถเมล์วิ่งได้ และจำกัดรัศมีไม่เกิน 900 ม. */
  const rr=Math.min(r,900);
  const A="(around:"+rr+","+lat+","+lng+")";
  const N="(around:"+near+","+lat+","+lng+")";
  return "/*as3d:lines*/[out:json][timeout:45];"+
    "way"+A+'["highway"~"^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|motorway_link|trunk_link|primary_link|secondary_link|tertiary_link)$"]->.w;'+
    "(node"+N+'["highway"="bus_stop"];'+
     "node"+N+'["public_transport"="platform"]["bus"="yes"];'+
     "node"+N+'["public_transport"="stop_position"]["bus"="yes"];'+
    ")->.s;"+
    'rel(bn.s)["route"="bus"]->.b;'+
    "foreach.b->.r(.r out tags;way.w(r.r);out ids;);";
}
async function ovpFetch(q,onTry,ms){
  const errs=[];
  for(let i=0;i<OVP_HOSTS.length;i++){
    const host=OVP_HOSTS[i], name=host.split("/")[2];
    if(OVP_CANCEL&&OVP_CANCEL.stopped) break;
    if(onTry) onTry(name,i+1,OVP_HOSTS.length);
    const ac=new AbortController();
    OVP_CANCEL={abort:()=>{ac.abort()},stopped:OVP_CANCEL?OVP_CANCEL.stopped:false};
    const timer=setTimeout(()=>ac.abort(),ms||OVP_TIMEOUT);
    try{
      const res=await fetch(host,{method:"POST",headers:{"Content-Type":"text/plain"},
                                 body:q,signal:ac.signal});
      clearTimeout(timer);
      if(!res.ok){errs.push(name+" → HTTP "+res.status);continue}
      const j=await res.json();
      if(!j||!j.elements){errs.push(name+" → ข้อมูลผิดรูปแบบ");continue}
      return {data:j,host:name};
    }catch(e){
      clearTimeout(timer);
      if(OVP_CANCEL&&OVP_CANCEL.stopped){errs.push("ยกเลิกโดยผู้ใช้");break}
      errs.push(name+" → "+(e&&e.name==="AbortError"?"หมดเวลารอ "+((ms||OVP_TIMEOUT)/1000)+" วิ":(e&&e.message)||"เชื่อมต่อไม่ได้"));
    }
  }
  throw new Error(errs.join(" · "));
}

function ovpBtnLabel(busy){
  $("ovpBtn").innerHTML = busy
    ? '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg> ยกเลิกการดึงข้อมูล'
    : '<svg viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-9-9"/><path d="M21 3v6h-6"/></svg> ดึงแผนที่และเส้นทางเดินรถ';
  $("ovpBtn").classList.toggle("primary",!busy);
}

/* ---- จัดกลุ่มสาย: รวมขาไป-ขากลับของสายเดียวกันเป็นรายการเดียว ----
   OSM เก็บสองทิศเป็นคนละ relation ถ้าไม่รวม ตัวเลขจะพองเท่าตัว
   (เคสจริง: ขึ้น 88 และ 70 สาย ทั้งที่จริงราวครึ่งเดียว) */
function groupRoutes(rels){
  const by={};
  rels.forEach(r=>{
    const t=r.tags||{};
    const ref=(t.ref||t["ref:th"]||t.name||"").trim();
    if(!ref) return;
    if(!by[ref]) by[ref]={ref:ref,dirs:[],ids:[],name:t.name||"",op:t.operator||t.network||""};
    const g=by[ref];
    g.ids.push(r.id);
    if(t.from&&t.to){
      const d=t.from+" → "+t.to;
      if(g.dirs.indexOf(d)<0) g.dirs.push(d);
    }
  });
  const out=Object.keys(by)
    .sort((a,b)=>a.localeCompare(b,"th",{numeric:true,sensitivity:"base"}))
    .map(k=>by[k]);
  out.forEach((g,i)=>{
    g.col=routeColour(i,true);
    g.colL=routeColour(i,false);
    g.ways=new Set();
    g.pair=g.dirs.length?g.dirs[0]:(g.name||"");
    g.twoWay=g.dirs.length>1;
  });
  return out;
}

function metres(a,b,c,d){
  const dy=(c-a)*MPD, dx=(d-b)*MPD*Math.cos(a*Math.PI/180);
  return Math.round(Math.hypot(dx,dy));
}

function renderStops(){
  const S2=MAPD.stops||[];
  if(!S2.length){ $("stopBox").hidden=true; return; }
  $("stopBox").hidden=false;
  $("stopBox").innerHTML =
    '<div class="stop-head">ป้ายรถเมล์ที่ใกล้จุดนี้ที่สุด · '+S2.length+' ป้าย</div>'+
    S2.slice(0,4).map(st=>
      '<div class="stop-i"><b>'+esc(st.name||"ป้ายไม่มีชื่อใน OSM")+"</b>"+
      '<span>ห่าง '+st.d+' ม.</span>'+
      '<a href="https://www.google.com/maps/search/?api=1&query='+st.lat+","+st.lon+
      '" target="_blank" rel="noopener">ตรวจใน Google Maps</a></div>').join("");
}

async function loadMap(){
  if(MAPD.busy){       /* กดซ้ำระหว่างรอ = ยกเลิก ไม่ปล่อยให้ค้าง */
    if(OVP_CANCEL){OVP_CANCEL.stopped=true;OVP_CANCEL.abort()}
    return;
  }
  const l=curLoc(), p=locPos(l);
  MAPD.busy=true; MAPD.err=""; MAPD.solo=null;
  MAPD.data=null; MAPD.nodes=[]; MAPD.groups=[]; MAPD.wayRoutes=null; MAPD.stops=[];
  ovpBtnLabel(true); renderStops(); renderRouteLegend();
  let tick=null, t0=Date.now(), base="";
  const say=h=>{base=h;$("ovpStat").innerHTML=h};
  const live=h=>{                       /* ข้อความที่มีนาฬิกาเดินอยู่ข้างหลัง */
    base=h;
    clearInterval(tick);
    const upd=()=>{$("ovpStat").innerHTML=base+' <span style="color:var(--txt-mute)">('+
      Math.round((Date.now()-t0)/1000)+" วิ)</span>"};
    upd(); tick=setInterval(upd,1000);
  };
  const prog=(label)=>((n,i,tot)=>{t0=Date.now();
    live(label+" · เซิร์ฟเวอร์ "+esc(n)+" ("+i+"/"+tot+") · กดปุ่มอีกครั้งเพื่อยกเลิก")});
  let notes=[];

  try{
    /* ---------- ช่วง A: ป้ายและสายที่จอดป้ายนั้น ---------- */
    live("① กำลังหาป้ายรถเมล์ใกล้จุดนี้…");
    const ra=await ovpFetch(qStops(p[0],p[1],MAPD.near),prog("① หาป้ายรถเมล์และสายที่จอด"),15000);
    const ea=ra.data.elements||[];
    MAPD.stops=ea.filter(e=>e.type==="node").map(e=>({
      name:(e.tags&&(e.tags["name:th"]||e.tags.name))||"",
      lat:e.lat,lon:e.lon,d:metres(p[0],p[1],e.lat,e.lon)
    })).sort((a,b)=>a.d-b.d);
    const relsA=ea.filter(e=>e.type==="relation");
    MAPD.groups=groupRoutes(relsA);
    MAPD.at=[p[0],p[1]]; MAPD.title=l.th; resetView();
    OVP.hits=MAPD.groups.length;
    renderStops(); renderRouteLegend(); mapNote();

    if(MAPD.groups.length){
      const refs=MAPD.groups.map(g=>g.ref);
      const had=busOf(l), fresh=refs.filter(x=>had.indexOf(x)<0);
      if(fresh.length){
        BUSX[l.id]=had.concat(fresh).sort((a,b)=>a.localeCompare(b,"th",{numeric:true}));
        saveBus();
      }
      renderBus();
      notes.push("<b>"+MAPD.groups.length+" สายจอดที่ป้ายนี้</b> (จาก "+relsA.length+
                 " รายการใน OSM รวมขาไปขากลับแล้ว) · ป้ายใกล้สุดห่าง "+
                 (MAPD.stops.length?MAPD.stops[0].d+" ม.":"—"));
    }else{
      notes.push(MAPD.stops.length
        ? "พบป้ายรถเมล์ "+MAPD.stops.length+" ป้าย แต่ OSM ยังไม่ได้ผูกสายรถกับป้ายเหล่านี้ — ใช้รายการที่ตรวจสอบไว้ด้านล่างต่อได้"
        : "ไม่พบป้ายรถเมล์ในรัศมี "+MAPD.near+" ม. — ลองขยายระยะ หรือเลื่อนหมุดให้ชิดป้ายจริง");
    }
    say(notes.join("<br>"));

    /* ---------- ช่วง B: ฐานแผนที่ ---------- */
    t0=Date.now(); live(notes.join("<br>")+"<br>② กำลังวาดแผนที่ถนน…");
    try{
      const rb=await ovpFetch(qBase(p[0],p[1],MAPD.radius),prog("② ดึงแผนที่ถนน"),25000);
      const eb=rb.data.elements||[];
      const ways=eb.filter(e=>e.type==="way"&&e.geometry);
      if(!ways.length) throw new Error("เซิร์ฟเวอร์ส่งแผนที่เปล่ากลับมา");
      MAPD.data=ways;
      const seen={};
      MAPD.nodes=eb.filter(e=>e.type==="node"&&e.tags&&e.tags.name)
        .map(e=>({lat:e.lat,lon:e.lon,name:e.tags["name:th"]||e.tags.name,
                  kind:(e.tags.railway==="station"||e.tags.public_transport==="station")?"station":(e.tags.place?"place":"poi")}))
        .filter(n=>{ if(seen[n.name])return false; seen[n.name]=1; return true; });
      paintMap();
      notes.push("แผนที่: ถนน "+ways.length.toLocaleString("th-TH")+" เส้น · ป้ายชื่อ "+MAPD.nodes.length+" จุด");
    }catch(e){
      notes.push('<span style="color:var(--warn)">วาดแผนที่ไม่สำเร็จ ('+esc(e.message)+
                 ') — รายชื่อสายด้านบนยังใช้ได้ ลองลดความกว้างของภาพแล้วกดใหม่</span>');
    }
    say(notes.join("<br>"));

    /* ---------- ช่วง C: เส้นทางรายสี ---------- */
    if(MAPD.groups.length>40&&MAPD.data){
      /* จุดเปลี่ยนถ่ายใหญ่ๆ อย่างอนุสาวรีย์ชัยฯ มีสายเป็นร้อย การระบายสีทุกสายจะช้าและอ่านไม่ออก
         จึงให้เลือกดูทีละสายจากรายการแทน เร็วกว่าและชัดกว่า */
      notes.push("มี "+MAPD.groups.length+" สาย มากเกินกว่าจะระบายสีพร้อมกันให้อ่านรู้เรื่อง — "+
                 "<b>คลิกเลือกสายในรายการด้านล่าง แล้วกด \"ดูทั้งสาย\" เพื่อดึงเส้นทางเต็มสายมาดู</b>");
    }else if(MAPD.groups.length&&MAPD.data){
      t0=Date.now(); live(notes.join("<br>")+"<br>③ กำลังระบายสีเส้นทางรายสาย…");
      try{
        const rc=await ovpFetch(qLines(p[0],p[1],MAPD.radius,MAPD.near),prog("③ ดึงเส้นทางรายสาย"),25000);
        const ec=rc.data.elements||[];
        /* ผลลัพธ์เรียงเป็นชุด: relation ตามด้วย way ของสายนั้น */
        const byId={};
        MAPD.groups.forEach(g=>g.ids.forEach(id=>{byId[id]=g}));
        let cur=null, hits=0;
        ec.forEach(e=>{
          if(e.type==="relation"){ cur=byId[e.id]||null; return; }
          if(e.type==="way"&&cur){ cur.ways.add(e.id); hits++; }
        });
        if(!hits) throw new Error("ไม่ได้ข้อมูลถนนรายสาย");
        MAPD.wayRoutes=new Map();
        MAPD.groups.forEach((g,gi)=>g.ways.forEach(id=>{
          let a=MAPD.wayRoutes.get(id);
          if(!a){a=[];MAPD.wayRoutes.set(id,a)}
          if(a.length<8) a.push(gi);
        }));
        paintMap();
        notes.push("ระบายสีเส้นทางแล้ว "+hits.toLocaleString("th-TH")+" ช่วงถนน");
      }catch(e){
        notes.push('<span style="color:var(--warn)">ยังระบายสีเส้นทางบนแผนที่ไม่ได้ ('+esc(e.message)+
                   ') — รายชื่อสายและแผนที่ยังถูกต้องครบ</span>');
      }
    }
    notes.push('<span style="color:var(--txt-mute)">ที่มา OpenStreetMap ผ่าน '+esc(ra.host)+
               " · OSM อาจยังไม่ครบทุกสาย ควรกด <b>ตรวจใน Google Maps</b> ที่ป้ายด้านบนก่อนยืนยันกับลูกค้า</span>");
    clearInterval(tick); say(notes.join("<br>"));
    toast("อัปเดต "+l.th+" แล้ว");
  }catch(e){
    const cancelled=/ยกเลิกโดยผู้ใช้/.test(e.message);
    MAPD.err=cancelled?"":"ดึงข้อมูลไม่สำเร็จ";
    clearInterval(tick);
    say(cancelled ? "ยกเลิกแล้ว — กดปุ่มอีกครั้งเมื่อพร้อมลองใหม่"
      : '<span style="color:var(--bad)">ดึงข้อมูลไม่สำเร็จจากทุกเซิร์ฟเวอร์</span><br>'+esc(e.message)+
        "<br>ตรวจอินเทอร์เน็ตแล้วกดใหม่ — ส่วนอื่นของโปรแกรมยังใช้งานได้ตามปกติ");
  }finally{
    clearInterval(tick);
    MAPD.busy=false; OVP_CANCEL=null; ovpBtnLabel(false);
    paintMap(); mapNote(); renderRouteLegend(); renderStops();
  }
}
