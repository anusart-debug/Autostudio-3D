/* ---------------- state ---------------- */
const S={vehicle:"wrap",loc:"sathorn",angle:"hero34",light:"golden",
  styles:new Set(STYLES.filter(s=>s.on).map(s=>s.id)),
  lens:2,weather:0,ratio:0,scale:1,hdr:75,refData:null,refFileName:"",
  refExtra:[],refBody:"",refOrient:"",refB64:"",refMime:"image/png",refW:0,refH:0,
  adData:null,adB64:"",adMime:"image/jpeg",adFileName:""};

const $=id=>document.getElementById(id);
const MAXPX=2048;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

