// Controllo qualita' dei codici generati: artefatti di estrazione.
const fs=require("fs"),path=require("path");const J=path.resolve(__dirname,"..","js");
const idx=new Function(fs.readFileSync(path.join(J,"codici-index.js"),"utf8")+";return CODICI_INDEX")();
for(const m of idx){let C;global.registerCodice=c=>C=c;eval(fs.readFileSync(path.join(J,"codici",m.id+".js"),"utf8"));
 const A=C.articoli;const iss={norub:0,empty:0,paren:0,aggin:0,artin:0,apos:0,longc:0,dup:0};const ex={};
 const seen=new Set();
 for(const a of A){ if(seen.has(a.num))iss.dup++;seen.add(a.num);
  const t=a.commi.join("\n");const abr=/ABROGAT|NON PI[UÙ] PREVIST|SOPPRESS/i.test(t.slice(0,200));
  const add=(k)=>{iss[k]++;(ex[k]=ex[k]||[]).length<3&&ex[k].push(a.num)};
  if(!a.rubrica&&!abr)add("norub"); if(!a.commi.length)add("empty");
  if(/\(\(|\)\)/.test(t))add("paren"); if(/AGGIORNAMENTO \(/.test(t))add("aggin");
  if(/^Art\.\s*\d/m.test(t))add("artin"); if(/[aeiou]'(\s|$)/.test(t.replace(/po'/g,"")))add("apos");
  if(a.commi.some(c=>c.length>6000))add("longc");}
 console.log(m.id.padEnd(24),String(A.length).padStart(5),JSON.stringify(iss),JSON.stringify(ex));}
