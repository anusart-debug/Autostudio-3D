const {join,dirname}=require('path');
const PAGE_URL='file://'+join(__dirname,'..','dist','autostudio3d.html');
require('fs').mkdirSync(join(__dirname,'out'),{recursive:true});
const {chromium}=require(process.env.PW||'playwright');
(async()=>{
 const b=await chromium.launch();const pg=await b.newPage();
 const errs=[];pg.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
 pg.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE: '+m.text())});
 await pg.goto(PAGE_URL);
 await pg.waitForTimeout(600);
 const wzOpen=await pg.isVisible('#wz');
 const steps=await pg.$$eval('#wzRail .wzstep',n=>n.map(x=>x.textContent.trim()));
 const panels=[];
 for(let i=0;i<steps.length;i++){
   panels.push(await pg.$$eval('#wzSlot h2',n=>n.map(x=>x.textContent.trim())));
   if(i<steps.length-1){await pg.click('#wzNext');await pg.waitForTimeout(120);}
 }
 const exLen=await pg.$eval('#exPrompt',n=>n.textContent.length);
 const exVis=await pg.isVisible('#exPrompt');
 const dbg=await pg.evaluate(()=>{const n=document.getElementById('wzNext');const w=document.getElementById('wz');return {wzHidden:w.hidden,nextDisp:getComputedStyle(n).display,nextVis:getComputedStyle(n).visibility,rect:n.getBoundingClientRect().toJSON(),veil:document.getElementById('veil').hidden}});
 try{await pg.click('#wzNext',{timeout:3000});}catch(e){errs.push('CLICKFAIL '+JSON.stringify(dbg))}
 await pg.waitForTimeout(400);
 const wzStillOpen=await pg.isVisible('#wz');
 await pg.evaluate(()=>{const w=document.getElementById('wz'); if(!w.hidden) document.getElementById('wzExit').click();});
 await pg.waitForTimeout(300);
 const apiFields=await pg.$$eval('input,select,textarea,button',n=>n.map(x=>x.id).filter(id=>/api|key|token|^model$|seed|batch|refUrl|ping|log|engine/i.test(id)));
 const promptLen=await pg.$eval('#promptOut',n=>n.textContent.length);
 const restored=await pg.$$eval('.rail-right .block h2',n=>n.map(x=>x.textContent.trim()));
 console.log(JSON.stringify({wzOpen,steps,panels,exLen,exVis,wzStillOpen,apiFields,promptLen,restored,errs},null,1));
 await b.close();
})();
