/* MiniPDF: a tiny PDF writer for the net sheet. No outside libraries, nothing leaves the device.
   Supports Helvetica (regular/bold/italic) text, rectangles, lines, rounded boxes and JPEG images.
   Coordinates are points from the top-left of a US Letter page, like jsPDF. */
(function(root){
"use strict";
const W={F1:[278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 222, 222, 333, 333, 350, 556, 1000, 0, 0, 0, 0, 0, 0, 0, 0, 278, 0, 0, 0, 0, 0, 0, 0, 0, 737, 0, 0, 0, 0, 737, 0, 0, 0, 0, 0, 0, 0, 0, 278, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],F2:[278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611, 975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 278, 278, 500, 500, 350, 556, 1000, 0, 0, 0, 0, 0, 0, 0, 0, 278, 0, 0, 0, 0, 0, 0, 0, 0, 737, 0, 0, 0, 0, 737, 0, 0, 0, 0, 0, 0, 0, 0, 278, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],F3:[278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 222, 222, 333, 333, 350, 556, 1000, 0, 0, 0, 0, 0, 0, 0, 0, 278, 0, 0, 0, 0, 0, 0, 0, 0, 737, 0, 0, 0, 0, 737, 0, 0, 0, 0, 0, 0, 0, 0, 278, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]};
const UNI={0x2014:0x97,0x2013:0x96,0xB7:0xB7,0xAE:0xAE,0x2019:0x92,0x2018:0x91,0x201C:0x93,0x201D:0x94,0x2022:0x95,0xA9:0xA9,0xA0:0x20,0x2212:0x2D};
function enc(str){ // to WinAnsi byte codes
  const out=[]; for(const ch of String(str)){ const c=ch.codePointAt(0);
    if(c>=32&&c<127) out.push(c); else if(UNI[c]!=null) out.push(UNI[c]); else out.push(63); }
  return out;
}
function esc(codes){ let s=""; for(const c of codes){ if(c===40||c===41||c===92) s+="\\"+String.fromCharCode(c); else if(c>126) s+="\\"+c.toString(8).padStart(3,"0"); else s+=String.fromCharCode(c);} return s; }
const f2=n=>(Math.round(n*100)/100).toString();
function b64ToBytes(b64){ if(typeof atob==="function"){ const bin=atob(b64); const u=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i); return u; } return Uint8Array.from(Buffer.from(b64,"base64")); }
function jpegInfo(bytes){
  let i=2; while(i<bytes.length){ if(bytes[i]!==0xFF){ i++; continue; } const m=bytes[i+1]; const len=(bytes[i+2]<<8)|bytes[i+3];
    if(m>=0xC0&&m<=0xCF&&m!==0xC4&&m!==0xC8&&m!==0xCC){ return {height:(bytes[i+5]<<8)|bytes[i+6], width:(bytes[i+7]<<8)|bytes[i+8], comps:bytes[i+9]}; }
    i+=2+len; }
  throw new Error("Not a JPEG image");
}
function dataUrlBytes(u){ const m=/^data:image\/jpe?g;base64,(.*)$/i.exec(u||""); if(!m) throw new Error("Images must be JPEG data URLs"); return b64ToBytes(m[1]); }

class MiniPDF{
  constructor(){ this.w=612; this.h=792; this.pages=[]; this.images=[]; this.font="F1"; this.size=10; this.fill=[0,0,0]; this.stroke=[0,0,0]; this.textRGB=[0,0,0]; this.addPage(); }
  addPage(){ this.cur=[]; this.pages.push(this.cur); return this; }
  setFont(_fam,style){ this.font= style==="bold"?"F2": style==="italic"?"F3":"F1"; return this; }
  setFontSize(s){ this.size=s; return this; }
  setTextColor(r,g,b){ this.textRGB=[r,g,b]; return this; }
  setFillColor(r,g,b){ this.fill=[r,g,b]; return this; }
  setDrawColor(r,g,b){ this.stroke=[r,g,b]; return this; }
  rgb(c){ return c.map(v=>f2(v/255)).join(" "); }
  getTextWidth(t){ const ws=W[this.font]; let s=0; for(const c of enc(t)) s+=ws[c-32]||0; return s*this.size/1000; }
  text(t,x,y,opt){ t=String(t); let dx=x; const w=this.getTextWidth(t);
    if(opt&&opt.align==="right") dx=x-w; else if(opt&&opt.align==="center") dx=x-w/2;
    this.cur.push(`BT ${this.rgb(this.textRGB)} rg /${this.font} ${f2(this.size)} Tf ${f2(dx)} ${f2(this.h-y)} Td (${esc(enc(t))}) Tj ET`); return this; }
  splitTextToSize(t,maxW){ const out=[]; String(t).split(/\n/).forEach(par=>{ let line=""; par.split(/\s+/).forEach(word=>{ const cand=line?line+" "+word:word; if(this.getTextWidth(cand)>maxW && line){ out.push(line); line=word; } else line=cand; }); out.push(line); }); return out; }
  rect(x,y,w,h,style){ this.cur.push(`${this.rgb(this.fill)} rg ${this.rgb(this.stroke)} RG ${f2(x)} ${f2(this.h-y-h)} ${f2(w)} ${f2(h)} re ${style==="F"?"f":style==="FD"?"B":"S"}`); return this; }
  roundedRect(x,y,w,h,r,_r2,style){ const k=0.5523*r, X=x, Y=this.h-y-h, p=[];
    p.push(`${f2(X+r)} ${f2(Y)} m`,`${f2(X+w-r)} ${f2(Y)} l`,`${f2(X+w-r+k)} ${f2(Y)} ${f2(X+w)} ${f2(Y+r-k)} ${f2(X+w)} ${f2(Y+r)} c`,
      `${f2(X+w)} ${f2(Y+h-r)} l`,`${f2(X+w)} ${f2(Y+h-r+k)} ${f2(X+w-r+k)} ${f2(Y+h)} ${f2(X+w-r)} ${f2(Y+h)} c`,
      `${f2(X+r)} ${f2(Y+h)} l`,`${f2(X+r-k)} ${f2(Y+h)} ${f2(X)} ${f2(Y+h-r+k)} ${f2(X)} ${f2(Y+h-r)} c`,
      `${f2(X)} ${f2(Y+r)} l`,`${f2(X)} ${f2(Y+r-k)} ${f2(X+r-k)} ${f2(Y)} ${f2(X+r)} ${f2(Y)} c`);
    this.cur.push(`${this.rgb(this.fill)} rg ${p.join(" ")} ${style==="F"?"f":"S"}`); return this; }
  line(x1,y1,x2,y2){ this.cur.push(`${this.rgb(this.stroke)} RG 0.6 w ${f2(x1)} ${f2(this.h-y1)} m ${f2(x2)} ${f2(this.h-y2)} l S`); return this; }
  getImageProperties(dataUrl){ return jpegInfo(dataUrlBytes(dataUrl)); }
  addImage(dataUrl,_fmt,x,y,w,h){ const bytes=dataUrlBytes(dataUrl); const info=jpegInfo(bytes); const name="Im"+(this.images.length+1);
    this.images.push({name,bytes,info}); this.cur.push(`q ${f2(w)} 0 0 ${f2(h)} ${f2(x)} ${f2(this.h-y-h)} cm /${name} Do Q`); return this; }
  output(){ // returns Uint8Array (or Blob when type==="blob")
    const parts=[]; let len=0; const offs=[];
    const push=s=>{ const b= typeof s==="string"? latin1(s) : s; parts.push(b); len+=b.length; };
    const latin1=s=>{ const u=new Uint8Array(s.length); for(let i=0;i<s.length;i++) u[i]=s.charCodeAt(i)&255; return u; };
    const objs=[]; const add=o=>{ objs.push(o); return objs.length; };
    const catalog=add(null), pagesId=add(null);
    const fonts={F1:"Helvetica",F2:"Helvetica-Bold",F3:"Helvetica-Oblique"}; const fontIds={};
    for(const k in fonts) fontIds[k]=add(`<< /Type /Font /Subtype /Type1 /BaseFont /${fonts[k]} /Encoding /WinAnsiEncoding >>`);
    const imgIds={}; this.images.forEach(im=>{ imgIds[im.name]=add({dict:`<< /Type /XObject /Subtype /Image /Width ${im.info.width} /Height ${im.info.height} /ColorSpace /${im.info.comps===1?"DeviceGray":im.info.comps===4?"DeviceCMYK":"DeviceRGB"} /BitsPerComponent 8 /Filter /DCTDecode /Length ${im.bytes.length} >>`,stream:im.bytes}); });
    const res=`<< /Font << ${Object.keys(fontIds).map(k=>`/${k} ${fontIds[k]} 0 R`).join(" ")} >> /XObject << ${Object.keys(imgIds).map(k=>`/${k} ${imgIds[k]} 0 R`).join(" ")} >> >>`;
    const pageIds=this.pages.map(ops=>{ const content=latin1(ops.join("\n")); const cid=add({dict:`<< /Length ${content.length} >>`,stream:content});
      return add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${this.w} ${this.h}] /Resources ${res} /Contents ${cid} 0 R >>`); });
    objs[catalog-1]=`<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
    objs[pagesId-1]=`<< /Type /Pages /Kids [${pageIds.map(i=>i+" 0 R").join(" ")}] /Count ${pageIds.length} >>`;
    push("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
    objs.forEach((o,i)=>{ offs[i]=len; push(`${i+1} 0 obj\n`); if(typeof o==="string") push(o+"\n"); else { push(o.dict+"\nstream\n"); push(o.stream); push("\nendstream\n"); } push("endobj\n"); });
    const xref=len; push(`xref\n0 ${objs.length+1}\n0000000000 65535 f \n`);
    offs.forEach(o=>push(String(o).padStart(10,"0")+" 00000 n \n"));
    push(`trailer\n<< /Size ${objs.length+1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
    const out=new Uint8Array(len); let p=0; parts.forEach(b=>{ out.set(b,p); p+=b.length; });
    if(arguments[0]==="blob" && typeof Blob==="function") return new Blob([out],{type:"application/pdf"});
    return out;
  }
}
root.MiniPDF=MiniPDF;
if(typeof module!=="undefined") module.exports=MiniPDF;
})(typeof window!=="undefined"?window:globalThis);
