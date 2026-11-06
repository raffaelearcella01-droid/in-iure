// Estrae le funzioni di ranking da app.js e le collauda sul Codice Civile reale.
const fs = require("fs");
const JS = require("path").resolve(__dirname, "..", "js");

// carica il codice civile
let CC = null; global.registerCodice = c => CC = c;
eval(fs.readFileSync(JS + "/codici/codice-civile.js", "utf8"));

// riproduci le utility necessarie (copiate/allineate ad app.js)
function norm(s){return String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");}
var SUFX="bis|ter|quater|quinquies|sexies|septies|octies|novies|decies|undecies|duodecies|terdecies|quaterdecies";
var STOPW={di:1,del:1,dello:1,della:1,dei:1,degli:1,delle:1,la:1,il:1,lo:1,le:1,gli:1,un:1,uno:1,una:1,e:1,o:1,in:1,da:1,al:1,ai:1,alla:1,agli:1,per:1,con:1,su:1,tra:1,fra:1,che:1,nel:1,nella:1};
function numKey(s){return norm(s).replace(/[\s.\-]/g,"");}
function analyzeQuery(raw){var q=norm(raw).trim().replace(/\s+/g," ");if(!q)return null;
 var m=q.match(new RegExp("^(?:art(?:icolo)?\\.?\\s*)?(\\d+(?:[\\s\\-]?(?:"+SUFX+")\\b)*)\\.?$"));
 if(m)return{type:"num",num:m[1].replace(/\s+/g,"-"),digits:(m[1].match(/^\d+/)||[""])[0]};
 var words=q.split(" ").filter(w=>w.length>1&&!STOPW[w]);if(!words.length)words=q.split(" ").filter(w=>w.length>1);
 return{type:"kw",words:words,phrase:q};}
function artSortNum(num){var m=String(num).match(/^(\d+)/);return m?parseInt(m[1],10):999999;}
function refersTo(art,digits){if(!digits)return false;var j=norm((art.rubrica||"")+" "+(art.commi||[]).join(" "));return new RegExp("(^|[^0-9])"+digits+"([^0-9]|$)").test(j);}
function scoreArticle(art,A){if(A.type==="num"){if(numKey(art.num)===numKey(A.num))return 1e9;return refersTo(art,A.digits)?1000:0;}
 var rub=norm(art.rubrica||""),body=norm((art.commi||[]).join(" ")),all=" "+rub+"  "+body;
 if(!A.words.every(w=>wordStart(all,w)))return 0;var s=0;
 if(rub.indexOf(A.phrase)!==-1)s+=100000;
 var whole=A.words.filter(w=>new RegExp("(^|[^a-z0-9])"+w.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"([^a-z0-9]|$)").test(rub)).length;
 if(whole===A.words.length)s+=40000;s+=whole*4000;
 if(A.words.every(w=>rub.indexOf(w)!==-1))s+=20000;
 A.words.forEach(w=>{if(rub.indexOf(w)!==-1)s+=1500;});if(body.indexOf(A.phrase)!==-1)s+=8000;
 A.words.forEach(w=>{if(body.indexOf(w)!==-1)s+=300;});
 var head=body.slice(0,90);A.words.forEach(w=>{var p=head.indexOf(w);if(p!==-1&&wordStart(head,w))s+=Math.max(500,2500-p*20);});return s;}
function wordStart(text,w){var i=text.indexOf(w);while(i!==-1){if(i===0||!/[a-z0-9]/.test(text.charAt(i-1)))return true;i=text.indexOf(w,i+1);}return false;}
function rank(arts,A){var sc=[];arts.forEach(a=>{var s=scoreArticle(a,A);if(s>0)sc.push({a,s,n:artSortNum(a.num)});});
 sc.sort((x,y)=>(y.s-x.s)||(x.n-y.n));return sc.map(o=>o.a);}

let pass=0,fail=0;
function firstIs(query,expectedNum){
  const A=analyzeQuery(query);const r=rank(CC.articoli,A);
  const got=r.length?r[0].num:"(vuoto)";
  const ok=got===expectedNum;
  (ok?pass++:fail++);
  console.log((ok?"✓":"✗")+" «"+query+"» → 1° = art."+got+(ok?"":"  (atteso "+expectedNum+")")+"   [risultati:"+r.length+"]");
  return r;
}

console.log("=== Ricerca per NUMERO (prefissi e punteggiatura) ===");
firstIs("2043","2043");
firstIs("art 2043","2043");
firstIs("art. 2043","2043");
firstIs("ART 2043","2043");
firstIs("Art.2043","2043");
firstIs("articolo 2043","2043");
firstIs("1453","1453");

console.log("\n=== Numero: esatto prima, poi richiami ===");
let r=firstIs("1325","1325");
console.log("   richiami a 1325 (dopo l'esatto):", r.slice(1,6).map(a=>"art."+a.num).join(", "));

console.log("\n=== Ricerca per PAROLE CHIAVE (articolo principale per primo) ===");
firstIs("risarcimento danno","1223");   // rubrica ufficiale "Risarcimento del danno"
firstIs("risarcimento fatto illecito","2043");
firstIs("responsabilita debitore","1218");   // rubrica ufficiale "Responsabilita' del debitore"
firstIs("nozione contratto","1321");
firstIs("nullita contratto","1418");

console.log("\n========== "+pass+" OK, "+fail+" FAIL ==========");
process.exit(fail?1:0);
