const fs = require("fs");
const JS = require("path").resolve(__dirname, "..", "js");
function norm(s){return String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");}
var SUFX="bis|ter|quater|quinquies|sexies|septies|octies|novies|decies|undecies|duodecies|terdecies|quaterdecies";
var STOPW={di:1,del:1,della:1,dei:1,degli:1,delle:1,la:1,il:1,lo:1,le:1,gli:1,e:1,o:1,in:1,da:1,al:1,per:1,con:1,su:1,che:1,nel:1,nella:1};
function parseCodeRef(q){var id=null;function take(re,cid){if(re.test(q)){id=id||cid;q=q.replace(re," ");}}
 take(/(^|\s)codice di procedura civile(?=\s|$)/g,"cpc");take(/(^|\s)procedura civile(?=\s|$)/g,"cpc");
 take(/(^|\s)codice di procedura penale(?=\s|$)/g,"cpp");take(/(^|\s)procedura penale(?=\s|$)/g,"cpp");
 take(/(^|\s)codice civile(?=\s|$)/g,"codice-civile");take(/(^|\s)codice penale(?=\s|$)/g,"codice-penale");
 take(/(^|\s)codice (della strada|strada)(?=\s|$)/g,"cds");take(/(^|\s)costituzione(?=\s|$)/g,"costituzione");
 take(/(^|\s)c\.?p\.?c\.?(?=\s|$)/g,"cpc");take(/(^|\s)c\.?p\.?p\.?(?=\s|$)/g,"cpp");
 take(/(^|\s)c\.?d\.?s\.?(?=\s|$)/g,"cds");take(/(^|\s)cds(?=\s|$)/g,"cds");
 take(/(^|\s)c\.?c\.?(?=\s|$)/g,"codice-civile");take(/(^|\s)c\.?p\.?(?=\s|$)/g,"codice-penale");
 take(/(^|\s)cost\.?(?=\s|$)/g,"costituzione");return {id:id,stripped:q.replace(/\s+/g," ").trim()};}
function analyzeQuery(raw){var q=norm(raw).trim().replace(/\s+/g," ");if(!q)return null;var cr=parseCodeRef(q);var codeId=cr.id;
 var m=cr.stripped.match(new RegExp("^(?:art(?:icolo)?\\.?\\s*)?(\\d+(?:[\\s\\-]?(?:"+SUFX+")\\b)*)\\.?$"));
 if(m)return{type:"num",num:m[1].replace(/\s+/g,"-"),digits:(m[1].match(/^\d+/)||[""])[0],codeId:codeId};
 var src=cr.stripped;var words=src.split(" ").filter(w=>w.length>1&&!STOPW[w]);if(!words.length)words=src.split(" ").filter(w=>w.length>1);
 if(!words.length)return null;return{type:"kw",words:words,phrase:src,codeId:codeId};}

let pass=0,fail=0;
function chk(q,exp){const A=analyzeQuery(q);const got=A?(A.type+" num="+(A.num||"-")+" code="+(A.codeId||"-")):"null";
 const ok=got.indexOf(exp)!==-1;(ok?pass++:fail++);console.log((ok?"✓":"✗")+" «"+q+"» → "+got+(ok?"":"   (atteso include: "+exp+")"));}

console.log("=== Riconoscimento codice + numero (flessibile) ===");
chk("art. 127 ter c.p.c.","num num=127-ter code=cpc");
chk("art 127-ter cpc","num num=127-ter code=cpc");
chk("127 ter c.p.c.","num num=127-ter code=cpc");
chk("cpc 127-ter","num num=127-ter code=cpc");
chk("art. 1453 c.c.","num num=1453 code=codice-civile");
chk("cc 1453","num num=1453 code=codice-civile");
chk("1453 codice civile","num num=1453 code=codice-civile");
chk("art 575 c.p.","num num=575 code=codice-penale");
chk("575 codice penale","num num=575 code=codice-penale");
chk("art 143 cds","num num=143 code=cds");
chk("art 3 cost","num num=3 code=costituzione");
chk("2043","num num=2043 code=-");
chk("risoluzione contratto cpc","kw num=- code=cpc");
chk("responsabilita","kw num=- code=-");

// verifica reale: 127-ter esiste in cpc ed esce primo
let CPC=null;global.registerCodice=c=>CPC=c;eval(fs.readFileSync(JS+"/codici/cpc.js","utf8"));
function numKey(s){return norm(s).replace(/[\s.\-]/g,"");}
function refersTo(art,d){if(!d)return false;var j=norm((art.rubrica||"")+" "+(art.commi||[]).join(" "));return new RegExp("(^|[^0-9])"+d+"([^0-9]|$)").test(j);}
function score(art,A){if(numKey(art.num)===numKey(A.num))return 1e9;return refersTo(art,A.digits)?1000:0;}
const A=analyzeQuery("art. 127 ter c.p.c.");
let res=CPC.articoli.map(a=>({a,s:score(a,A)})).filter(x=>x.s>0).sort((x,y)=>(y.s-x.s)||(parseInt(x.a.num)-parseInt(y.a.num)));
console.log("\n=== «art. 127 ter c.p.c.» nel c.p.c. reale ===");
console.log((res.length&&res[0].a.num==="127-ter"?"✓":"✗")+" 1° risultato = art."+(res[0]?res[0].a.num:"?")+"  '"+(res[0]?res[0].a.rubrica:"")+"'");
console.log("   richiami a 127-ter:", res.slice(1,5).map(x=>"art."+x.a.num).join(", ")||"(nessuno)");
(res.length&&res[0].a.num==="127-ter")?pass++:fail++;

console.log("\n========== "+pass+" OK, "+fail+" FAIL ==========");
process.exit(fail?1:0);
