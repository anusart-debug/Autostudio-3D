/* ---------------- inputs ---------------- */
$("lens").addEventListener("change",e=>{if(e.target.value==="__add__"){refreshLens();openAdd("lens");return}S.lens=+e.target.value;sync()});
$("weather").addEventListener("change",e=>{if(e.target.value==="__add__"){refreshWeather();openAdd("weather");return}S.weather=+e.target.value;sync()});
$("ratio").addEventListener("change",e=>{S.ratio=+e.target.value;sync()});
$("scale").addEventListener("input",e=>{S.scale=+e.target.value/100;sync()});
$("hdr").addEventListener("input",e=>{S.hdr=+e.target.value;sync()});
["artwork","detail","negative"].forEach(id=>$(id).addEventListener("input",sync));

