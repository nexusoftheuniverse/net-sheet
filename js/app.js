/* Seller Net Sheet app: screen logic, branding, PDF export.
   Everything runs on this device. Client details are never stored or sent anywhere. */
"use strict";
let RATES=null;
const $ = id => document.getElementById(id);
const fmt = v => (v<0?"-":"")+"$"+Math.abs(v).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
const num = v => { if(v==null) return 0; const t=String(v).replace(/[−–]/g,"-").replace(/[^0-9.\-]/g,""); const n=parseFloat(t); return isNaN(n)?0:n; };
const optNum = v => (String(v).trim()===""? null : num(v));
const store = {
  get(k){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):null; }catch(e){ return null; } },
  set(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); return true; }catch(e){ return false; } }
};

const MONEY = ["price1","price2","price3","conc","loan1","annualTax","feeSettle","feeWire","feeCourier","feePayoff","feeDoc","feeRelease",
  "flatComm","adminFee","loan2","heloc","liens","hoaDues","hoaPkg","assess","water","termite","warranty","repairs","o1Amt","o2Amt","ovRec"];
const DEFAULT_KEYS = ["county","split","splitPct","listPct","buyPct","feeSettle","feeWire","feeCourier","feePayoff","feeDoc","feeRelease","adminFee"];
const ALL_KEYS = ["address","seller","county","closing","price1","split","splitPct","fthb","owner","listPct","buyPct","conc","loan1","annualTax","taxStatus",
  "feeSettle","feeWire","feeCourier","feePayoff","feeDoc","feeRelease","price2","price3","flatComm","adminFee","loan2","heloc","liens",
  "hoaDues","hoaPkg","assess","water","termite","warranty","repairs","o1Label","o1Amt","o2Label","o2Amt","shortSale","ovRec","ovLocal"];
let concPct=false, isExample=false;

function fillCounties(){
  const sel=$("county"); sel.innerHTML="";
  RATES.counties.forEach(c=>{ const o=document.createElement("option"); o.value=c.id; o.textContent=c.name; sel.appendChild(o); });
}

function isoPlus(days){ const d=new Date(); d.setDate(d.getDate()+days); return d.toISOString().slice(0,10); }

const EXAMPLE = {address:"", seller:"", county:"queen_annes", closing:isoPlus(45), price1:"595,000.00", split:"50", splitPct:50, listPct:2.5, buyPct:2.5,
  conc:"17,850.00", loan1:"238,000.00", feeSettle:"0.00", feeWire:"30.00", feeCourier:"30.00", feePayoff:"175.00", feeDoc:"0.00", feeRelease:"45.00", adminFee:"495.00"};

function setVals(obj, cp){
  if(obj.adminFee==null || obj.adminFee==="") obj=Object.assign({},obj,{adminFee:"495.00"});
  ALL_KEYS.forEach(k=>{ const el=$(k); if(!el) return; if(el.type==="checkbox") el.checked=!!obj[k]; else el.value = obj[k]!=null? obj[k] : (k==="taxStatus"?"paid": k==="split"?"50": k==="splitPct"?50:""); });
  setConcMode(!!cp);
}
function setConcMode(p){ concPct=p; const ch=document.getElementById("concHint"); if(ch) ch.textContent=p?"Percent of sale price":"Dollar amount"; $("concD").setAttribute("aria-pressed",String(!p)); $("concP").setAttribute("aria-pressed",String(p)); }

function readState(){
  const s={};
  ALL_KEYS.forEach(k=>{ const el=$(k); s[k]= el.type==="checkbox"? el.checked : el.value; });
  MONEY.forEach(k=>{ if(k!=="ovRec") s[k]=num(s[k]); });
  s.listPct=num(s.listPct); s.buyPct=num(s.buyPct);
  s.ovRec = optNum($("ovRec").value); s.ovLocal = optNum($("ovLocal").value);
  s.concPct=concPct;
  const sp = s.split==="custom"? Math.min(100,Math.max(0,num(s.splitPct))) : num(s.split);
  s.sellerShare = sp/100;
  return s;
}
function splitLabel(s){ return s.split==="50"?"Split 50/50": s.split==="100"?"Seller pays all": s.split==="0"?"Buyer pays all": `Seller ${Math.round(s.sellerShare*100)}% / Buyer ${100-Math.round(s.sellerShare*100)}%`; }

let last=null;
function render(){
  if(!RATES) return;
  const s=readState();
  $("customSplitRow").hidden = s.split!=="custom";
  const prices=[s.price1,s.price2,s.price3].filter(p=>p>0);
  if(!prices.length) prices.push(0);
  const sheets=prices.map(p=>NetCalc.buildSheet(RATES,s,p));
  last={s,sheets};
  const c=sheets[0].county;
  // county hint
  const parts=[];
  parts.push(c.rec!=null? `Recordation $${c.rec.toFixed(2)} per $500` : "Recordation: tiered");
  parts.push(c.lt? `county transfer ${(c.lt*100).toFixed(2).replace(/0$/,"")}%` : "no county transfer tax");
  $("countyHint").textContent = parts.join(" · ");
  $("rateNote").textContent = `${c.name} defaults: ${parts.join(", ")}; state transfer 0.5%. Leave these blank to use the defaults. Confirm rates with the title company before closing.`;
  $("ratesAsOf").textContent = `Tax rates effective ${longDate(c.effective)} · last checked ${longDate(RATES.reviewed)}`;
  // proration hint
  const pr=sheets[0].pr;
  $("prorHint").textContent = pr? `${pr.sellerDays} of ${pr.fyDays} days on the seller · ${pr.credit>=0?"credit to seller":"seller owes"} ${fmt(Math.abs(pr.credit))}` : "Enter the annual tax and a closing date to calculate.";
  // headline
  const n=sheets[0].net;
  const short = s.shortSale && n<0;
  $("netLabel").textContent = s.shortSale? (n<0?"Estimated shortfall for lender approval":"Estimated net seller proceeds") : (n<0?"Seller would need to bring to closing":"Estimated net seller proceeds");
  $("netBig").textContent = fmt(Math.abs(n));
  $("netBig").classList.toggle("neg", n<0);
  $("mNet").textContent = (n<0?"−":"")+fmt(Math.abs(n));
  $("mLabel").textContent = n<0? (s.shortSale?"Est. shortfall":"Seller brings") : "Est. net proceeds";
  $("netSub").textContent = `${c.name} County${c.id==="baltimore_city"?"":""} · ${fmt(sheets[0].price)} sale${s.closing?" · closing "+new Date(s.closing+"T12:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):""}`.replace("Baltimore City County","Baltimore City");
  $("exampleTag").hidden=!isExample;
  // table
  const multi=sheets.length>1;
  let h="";
  if(multi){ h+="<thead><tr><th>Sale price</th>"+sheets.map(x=>`<th>${fmt(x.price)}</th>`).join("")+"</tr></thead>"; }
  h+="<tbody>";
  const sec=(t)=>{ h+=`<tr class="sec"><td colspan="${sheets.length+1}">${t}</td></tr>`; };
  const item=(label,vals,force)=>{ if(!force && vals.every(v=>!v)) return; h+=`<tr class="item"><td>${esc(label)}</td>${vals.map(v=>`<td>${fmt(v)}</td>`).join("")}</tr>`; };
  const tot=(label,vals,cls="total")=>{ h+=`<tr class="${cls}"><td>${label}</td>${vals.map(v=>`<td>${fmt(v)}</td>`).join("")}</tr>`; };
  if(!multi) tot("Sale price",[sheets[0].price]);
  const groups=[["Title & closing costs","title","tTitle",false],["Taxes at closing ("+esc(splitLabel(s))+")","third","tThird",true],["Selling costs","selling","tSell",true]];
  groups.forEach(([t,key,tk,force])=>{ sec(t); sheets[0][key].forEach((r,i)=>item(r[0],sheets.map(x=>x[key][i][1]),force)); tot("Subtotal",sheets.map(x=>x[tk])); });
  tot("Total estimated closing costs",sheets.map(x=>x.closingCosts));
  tot("Estimated seller proceeds",sheets.map(x=>x.proceeds));
  sec("Payoffs & additional costs");
  sheets[0].add.forEach((r,i)=>item(r[0],sheets.map(x=>x.add[i][1]),i===0));
  tot("Total additional costs",sheets.map(x=>x.tAdd));
  if(sheets[0].credits.length){
    sec("Credits & prorations");
    h+=`<tr class="item"><td>Property tax proration</td>${sheets.map(x=>{const v=x.credits[0][1];return `<td class="${v>=0?"credit":"debit"}">${v>=0?"+":"−"}${fmt(Math.abs(v))}</td>`;}).join("")}</tr>`;
  }
  tot(n<0? (s.shortSale?"Estimated shortfall":"Seller brings to closing") : "Estimated net seller proceeds", sheets.map(x=>x.net),"grand");
  h+="</tbody>";
  $("lines").innerHTML=h;
  const notes=sheets[0].tx.notes;
  $("discOut").textContent = (notes.length? notes.join(". ")+". ":"") + ($("bDisc").value||DEFAULT_DISC);
}
function longDate(iso){ return iso? new Date(iso+"T12:00").toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}) : ""; }
function esc(t){ return String(t).replace(/[&<>"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch])); }

const DEFAULT_DISC="This is only an estimate of the seller's closing costs and is not a guaranteed quote. Actual costs vary; final figures come from the settlement statement.";

// Formatting money fields on blur
MONEY.forEach(k=>{ const el=$(k); if(!el) return; el.addEventListener("blur",()=>{ if(el.value.trim()==="") return; if(k==="conc"&&concPct) return; el.value=num(el.value).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}); }); });
document.addEventListener("input",e=>{ if(e.target.closest("#pane-brand")) { applyBrandPreview(); return; } isExample=false; render(); });
document.addEventListener("change",e=>{ if(e.target.id==="fthb" && e.target.checked) $("owner").checked=true; if(e.target.id==="owner" && !e.target.checked) $("fthb").checked=false; if(!e.target.closest("#pane-brand")) { isExample=false; render(); } });
$("concD").onclick=()=>{ setConcMode(false); render(); };
$("concP").onclick=()=>{ setConcMode(true); render(); };

// Tabs
document.querySelectorAll(".tabs button").forEach(b=>b.addEventListener("click",()=>showTab(b.dataset.tab)));
function showTab(t){ document.querySelectorAll(".tabs button").forEach(b=>b.setAttribute("aria-selected",String(b.dataset.tab===t))); ["main","more","brand"].forEach(x=>$("pane-"+x).hidden = x!==t); store.set("msn.tab",t); }

// Branding
let logoData=null, photoData=null, photoOrig=null, photoImg=null;
function readBrand(){ return {name:$("bName").value,title:$("bTitle").value,broker:$("bBroker").value,license:$("bLicense").value,phone:$("bPhone").value,email:$("bEmail").value,web:$("bWeb").value,color:$("bColor").value,disc:$("bDisc").value,logo:logoData,photo:photoData,photoOrig:photoOrig,crop:{z:+$("cropZ").value,x:+$("cropX").value,y:+$("cropY").value}}; }
function applyBrand(b){ if(!b) { applyBrandPreview(); return; } $("bName").value=b.name||""; $("bTitle").value=b.title||""; $("bBroker").value=b.broker||""; $("bLicense").value=b.license||""; $("bPhone").value=b.phone||""; $("bEmail").value=b.email||""; $("bWeb").value=b.web||""; $("bColor").value=b.color||"#1f5f6b"; $("bDisc").value=b.disc||""; logoData=b.logo||null; photoData=b.photo||null; photoOrig=b.photoOrig||b.photo||null; if(b.crop){ $("cropZ").value=b.crop.z; $("cropX").value=b.crop.x; $("cropY").value=b.crop.y; } if(photoOrig) loadPhotoImg(photoOrig,false); applyBrandPreview(); }
function applyBrandPreview(){
  const b=readBrand();
  $("logoPrev").hidden=!logoData; $("logoClear").hidden=!logoData; if(logoData) $("logoPrev").src=logoData;
  $("cropBox").hidden=!photoOrig;
  $("photoPrev").hidden=!photoData; $("photoClear").hidden=!photoData; if(photoData) $("photoPrev").src=photoData;
  $("hdrPhoto").hidden=!photoData; if(photoData) $("hdrPhoto").src=photoData;
  $("hdrLogo").hidden=!logoData; if(logoData) $("hdrLogo").src=logoData;
  $("hdrSub").textContent = [b.name,b.broker].filter(Boolean).join(" · ") || "Maryland · all 24 jurisdictions";
  render();
}
function loadImage(file, square, done){
  const rd=new FileReader();
  rd.onload=()=>{ const img=new Image(); img.onload=()=>{
    let sx=0,sy=0,sw=img.width,sh=img.height;
    if(square){ const m=Math.min(sw,sh); sx=(sw-m)/2; sy=(sh-m)/2; sw=sh=m; }
    const max=square?400:1000, sc=Math.min(1,max/Math.max(sw,sh));
    const cv=document.createElement("canvas"); cv.width=Math.round(sw*sc); cv.height=Math.round(sh*sc);
    const cx=cv.getContext("2d"); cx.fillStyle="#fff"; cx.fillRect(0,0,cv.width,cv.height); cx.drawImage(img,sx,sy,sw,sh,0,0,cv.width,cv.height);
    done(cv.toDataURL("image/jpeg",0.9)); }; img.src=rd.result; };
  rd.readAsDataURL(file);
}
$("bLogo").addEventListener("change",e=>{ const f=e.target.files[0]; if(f) loadImage(f,false,d=>{ logoData=d; applyBrandPreview(); }); });
// Photo: keep the full (resized) original, crop on demand from the sliders.
function loadPhotoImg(src, reset){
  const img=new Image(); img.onload=()=>{ photoImg=img; if(reset){ $("cropZ").value=100; $("cropX").value=50; $("cropY").value= img.height>img.width?15:50; } cropPhoto(); }; img.src=src;
}
function cropPhoto(){
  if(!photoImg) return;
  const w=photoImg.width, h=photoImg.height, z=(+$("cropZ").value||100)/100;
  const side=Math.min(w,h)/z, sx=(w-side)*(+$("cropX").value/100), sy=(h-side)*(+$("cropY").value/100);
  const cv=document.createElement("canvas"); cv.width=cv.height=400;
  const cx=cv.getContext("2d"); cx.fillStyle="#fff"; cx.fillRect(0,0,400,400); cx.drawImage(photoImg,sx,sy,side,side,0,0,400,400);
  photoData=cv.toDataURL("image/jpeg",0.9); applyBrandPreview();
}
["cropZ","cropX","cropY"].forEach(id=>$(id).addEventListener("input",cropPhoto));
$("bPhoto").addEventListener("change",e=>{ const f=e.target.files[0]; if(f) loadImage(f,false,d=>{ photoOrig=d; loadPhotoImg(d,true); }); });
$("photoClear").onclick=()=>{ photoData=null; photoOrig=null; photoImg=null; $("bPhoto").value=""; applyBrandPreview(); };
$("logoClear").onclick=()=>{ logoData=null; $("bLogo").value=""; applyBrandPreview(); };
$("saveBrand").onclick=()=>{
  const d={}; DEFAULT_KEYS.forEach(k=>d[k]=$(k).value);
  const ok = store.set("msn.brand",readBrand()) && store.set("msn.defaults",d);
  const st=$("brandStatus"); st.textContent= ok? "Saved. New sheets will start with these numbers." : "Couldn't save in this browser (private browsing may block it). Your entries still work for this session."; st.className="status "+(ok?"ok":"err");
};

$("newSheet").onclick=()=>{ const d=store.get("msn.defaults")||{split:"50",splitPct:50,listPct:2.5,buyPct:2.5,county:"queen_annes",adminFee:"495.00"}; setVals(Object.assign({closing:isoPlus(45)},d),false); isExample=false; render(); window.scrollTo({top:0}); };
$("loadExample").onclick=()=>{ setVals(EXAMPLE,false); isExample=true; render(); };

// PDF
function hexToRgb(h){ const m=/^#?([0-9a-f]{6})$/i.exec(h||""); const n=m?parseInt(m[1],16):0x1f5f6b; return [(n>>16)&255,(n>>8)&255,n&255]; }
function makePdf(){
  const {s,sheets}=last; const b=readBrand(); const col=hexToRgb(b.color);
  const doc=new MiniPDF(); const W=612, M=42; let y=M;
  const pdfMoney=v=>(v<0?"-":"")+"$"+Math.abs(v).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
  // Header
  let lx=M;
  if(photoData){ try{ doc.addImage(photoData,"JPEG",M,y,52,52); lx=M+52+14; }catch(e){} }
  if(logoData){ try{ const p=doc.getImageProperties(logoData); let h=52, w=p.width*h/p.height; if(w>170){ w=170; h=p.height*w/p.width; } doc.addImage(logoData,"JPEG",W-M-w,y+(52-h)/2,w,h); }catch(e){} }
  doc.setTextColor(20,30,36);
  doc.setFont("helvetica","bold"); doc.setFontSize(13); doc.text(b.name||"Seller Net Sheet",lx,y+14);
  doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(90,105,112);
  const l2=[b.title,b.broker].filter(Boolean).join(" · "); const l3=[b.phone,b.email].filter(Boolean).join(" · "); const l4=[b.web,b.license?("License #"+b.license):""].filter(Boolean).join(" · ");
  [l2,l3,l4].filter(Boolean).forEach((t,i)=>doc.text(t,lx,y+28+i*11));
  y+=66;
  doc.setFillColor(...col); doc.rect(M,y,W-2*M,3,"F"); y+=22;
  doc.setTextColor(20,30,36); doc.setFont("helvetica","bold"); doc.setFontSize(18);
  const neg=sheets[0].net<0;
  doc.text(neg?(s.shortSale?"Estimated Short Sale Shortfall":"Estimated Seller Funds Due at Closing"):"Estimated Net Seller Proceeds",M,y); y+=18;
  doc.setFont("helvetica","normal"); doc.setFontSize(9.5); doc.setTextColor(70,82,90);
  const info=[
    ["Property", s.address||"—"],["Seller", s.seller||"—"],["County", sheets[0].county.name+(sheets[0].county.id==="baltimore_city"?"":" County")+", Maryland"],
    ["Est. closing", s.closing? new Date(s.closing+"T12:00").toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}):"—"],
    ["Taxes paid by", splitLabel(s)+(s.fthb?" · First-time MD buyer":"")+(s.owner&&!s.fthb?" · Owner-occupant buyer":"")],
    ["Prepared", new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})]
  ];
  info.forEach((r,i)=>{ const cx=M+(i%2)*((W-2*M)/2), cy=y+Math.floor(i/2)*14; doc.setFont("helvetica","bold"); doc.text(r[0]+":",cx,cy); doc.setFont("helvetica","normal"); doc.text(doc.splitTextToSize(String(r[1]),(W-2*M)/2-90)[0],cx+82,cy); });
  y+=Math.ceil(info.length/2)*14+10;
  // Big net boxes
  const n=sheets.length, bw=(W-2*M-(n-1)*10)/n;
  sheets.forEach((x,i)=>{ const bx=M+i*(bw+10); doc.setFillColor(col[0],col[1],col[2]); doc.roundedRect(bx,y,bw,54,5,5,"F"); doc.setTextColor(255,255,255); doc.setFontSize(8.5); doc.setFont("helvetica","normal"); doc.text(n>1?("At "+pdfMoney(x.price)):(x.net<0?(s.shortSale?"Shortfall":"Seller brings"):"Estimated net to seller"),bx+12,y+17); doc.setFont("helvetica","bold"); doc.setFontSize(n>2?16:20); doc.text(pdfMoney(Math.abs(x.net))+(x.net<0&&n>1?" short":""),bx+12,y+41); });
  y+=72;
  // Table
  const colW=Math.min(110,(W-2*M-200)/n); const xs=sheets.map((_,i)=>W-M-(n-1-i)*colW);
  const need=h=>{ if(y+h>760){ doc.addPage(); y=M; } };
  doc.setTextColor(20,30,36);
  if(n>1){ doc.setFont("helvetica","bold"); doc.setFontSize(8.5); doc.setTextColor(90,105,112); doc.text("SALE PRICE",M,y); sheets.forEach((x,i)=>doc.text(pdfMoney(x.price),xs[i],y,{align:"right"})); y+=14; }
  const sec=t=>{ need(30); y+=6; doc.setFont("helvetica","bold"); doc.setFontSize(8.5); doc.setTextColor(...col); doc.text(t.toUpperCase(),M,y); y+=13; };
  const row=(label,vals,bold,shade)=>{ need(16); if(shade){ doc.setFillColor(236,241,243); doc.rect(M,y-10,W-2*M,15,"F"); } doc.setFont("helvetica",bold?"bold":"normal"); doc.setFontSize(bold?9.5:9); doc.setTextColor(bold?20:70,bold?30:82,bold?36:90); doc.text(doc.splitTextToSize(label, xs[0]-colW-M-10)[0], M+(bold?0:10), y); vals.forEach((v,i)=>doc.text(typeof v==="string"?v:pdfMoney(v),xs[i],y,{align:"right"})); if(bold&&!shade){ doc.setDrawColor(200,210,214); doc.line(M,y-11,W-M,y-11); } y+=15; };
  if(n===1) row("Sale price",[sheets[0].price],true);
  [["Title & closing costs","title","tTitle",false],["Taxes at closing — "+splitLabel(s),"third","tThird",true],["Selling costs","selling","tSell",true]].forEach(([t,k,tk,force])=>{
    sec(t); sheets[0][k].forEach((r,i)=>{ const v=sheets.map(x=>x[k][i][1]); if(force||v.some(Boolean)) row(r[0],v); }); row("Subtotal",sheets.map(x=>x[tk]),true);
  });
  y+=4; row("Total estimated closing costs",sheets.map(x=>x.closingCosts),true); row("Estimated seller proceeds",sheets.map(x=>x.proceeds),true);
  sec("Payoffs & additional costs"); sheets[0].add.forEach((r,i)=>{ const v=sheets.map(x=>x.add[i][1]); if(i===0||v.some(Boolean)) row(r[0],v); }); row("Total additional costs",sheets.map(x=>x.tAdd),true);
  if(sheets[0].credits.length){ sec("Credits & prorations"); row("Property tax proration ("+(sheets[0].pr.credit>=0?"credit to seller":"charge to seller")+")",sheets.map(x=>x.credits[0][1])); }
  y+=6; row(neg?(s.shortSale?"Estimated shortfall":"Seller brings to closing"):"Estimated net seller proceeds", sheets.map(x=>x.net), true, true);
  // Notes & disclaimer
  y+=10; need(60); doc.setFont("helvetica","italic"); doc.setFontSize(8); doc.setTextColor(100,112,118);
  const notes=sheets[0].tx.notes.concat(["Tax rates effective "+longDate(sheets[0].county.effective), b.disc||DEFAULT_DISC]);
  doc.splitTextToSize(notes.join(". ").replace(/\.\./g,"."),W-2*M).forEach(line=>{ need(11); doc.text(line,M,y); y+=11; });
  return doc;
}
let lastUrl=null;
async function doPdf(){
  const st=$("pdfStatus"); st.className="status"; st.textContent="Building PDF…";
  showPdfStatus();
  let doc; try{ doc=makePdf(); }catch(e){ st.className="status err"; st.textContent="Couldn't build the PDF: "+e.message; return; }
  const blob=doc.output("blob");
  const name=("Net Sheet "+(($("address").value||"").split(",")[0]||new Date().toISOString().slice(0,10))).replace(/[\\/:*?"<>|]/g,"").trim()+".pdf";
  const file = (typeof File==="function") ? new File([blob],name,{type:"application/pdf"}) : null;
  // Phones and tablets: open the share sheet so she can pick Mail with the PDF attached.
  const touch = window.matchMedia && matchMedia("(pointer:coarse)").matches;
  if(touch && file && navigator.canShare && navigator.share){
    try{
      if(navigator.canShare({files:[file]})){
        await navigator.share({files:[file],title:name});
        st.className="status ok"; st.textContent="Shared "+name; return;
      }
    }catch(e){ if(e && e.name==="AbortError"){ st.className="status"; st.textContent="Share cancelled."; return; } }
  }
  // Computers (and phones without sharing): a normal download, plus an Open PDF link.
  if(lastUrl){ try{ URL.revokeObjectURL(lastUrl); }catch(e){} }
  lastUrl=URL.createObjectURL(blob);
  const a=document.createElement("a"); a.href=lastUrl; a.download=name; document.body.appendChild(a); a.click(); a.remove();
  const link=$("pdfOpen"); link.href=lastUrl; link.hidden=false;
  st.className="status ok"; st.textContent="Saved "+name+" to your Downloads folder.";
}
function showPdfStatus(){ if(window.matchMedia("(max-width:900px)").matches) $("pdfStatus").scrollIntoView({block:"center",behavior:"smooth"}); }
$("pdfBtn").onclick=()=>doPdf(); $("pdfBtn2").onclick=()=>doPdf();

// Install button (Chrome / Edge on computers and Android)
let installEvt=null;
window.addEventListener("beforeinstallprompt",e=>{ e.preventDefault(); installEvt=e; $("installBtn").hidden=false; });
$("installBtn").onclick=async()=>{ if(!installEvt) return; installEvt.prompt(); try{ await installEvt.userChoice; }catch(e){} installEvt=null; $("installBtn").hidden=true; };
window.addEventListener("appinstalled",()=>{ $("installBtn").hidden=true; });
const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
const iOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform==="MacIntel" && navigator.maxTouchPoints>1);
if(iOS && !standalone) $("iosTip").hidden=false;

// Offline support
if("serviceWorker" in navigator && location.protocol==="https:"){
  navigator.serviceWorker.register("sw.js").catch(()=>{});
}

// Boot: load tax rates, then fill the form.
(async function(){
  try{
    const res=await fetch("data/rates.json",{cache:"no-cache"});
    if(!res.ok) throw new Error(res.status);
    RATES=await res.json();
  }catch(e){
    $("loadErr").hidden=false; return;
  }
  fillCounties();
  applyBrand(store.get("msn.brand"));
  const d=store.get("msn.defaults");
  if(d){ setVals(Object.assign({closing:isoPlus(45)},d),false); isExample=false; }
  else { setVals(EXAMPLE,false); isExample=true; }
  const t=store.get("msn.tab"); if(t) showTab(t);
  render();
})();
