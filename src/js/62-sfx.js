/* ---------------- เสียงประกอบ (สร้างจากโค้ด ไม่มีไฟล์เสียง) ---------------- */
const SFX=(function(){
  let ctx=null, on=true;
  try{on=store.get("as3d_sfx")!=="0"}catch(e){}
  const quiet=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function ac(){if(!ctx){try{ctx=new (window.AudioContext||window.webkitAudioContext)()}catch(e){ctx=null}}return ctx}
  function tone(f,t0,dur,vol,type){
    const c=ac(); if(!c)return;
    const o=c.createOscillator(), g=c.createGain();
    o.type=type||"sine"; o.frequency.setValueAtTime(f,c.currentTime+t0);
    g.gain.setValueAtTime(0.0001,c.currentTime+t0);
    g.gain.exponentialRampToValueAtTime(vol,c.currentTime+t0+0.012);
    g.gain.exponentialRampToValueAtTime(0.0001,c.currentTime+t0+dur);
    o.connect(g);g.connect(c.destination);
    o.start(c.currentTime+t0);o.stop(c.currentTime+t0+dur+0.02);
  }
  return {
    get on(){return on},
    toggle(){on=!on;try{store.set("as3d_sfx",on?"1":"0")}catch(e){}return on},
    play(n){
      if(!on||quiet)return;
      if(n==="tick")      tone(1180,0,.045,.045,"square");
      else if(n==="next") {tone(620,0,.09,.07);tone(930,.07,.11,.06)}
      else if(n==="back") {tone(760,0,.08,.05);tone(480,.06,.1,.045)}
      else if(n==="done") {tone(660,0,.14,.07);tone(880,.1,.14,.065);tone(1320,.2,.28,.06)}
      else if(n==="bad")  {tone(200,0,.18,.07,"sawtooth")}
      else if(n==="shot") {tone(1480,0,.05,.05,"triangle");tone(1100,.05,.09,.04,"triangle")}
    }
  };
})();

