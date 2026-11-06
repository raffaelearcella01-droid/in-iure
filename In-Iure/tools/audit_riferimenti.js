// Verifica che ogni citazione "art. N <codice>" negli atti esista nei codici ufficiali locali.
const fs = require("fs"), path = require("path");
const JS = path.resolve(__dirname, "..", "js");
function loadCode(f) { let C = null; global.registerCodice = c => C = c; eval(fs.readFileSync(path.join(JS, "codici", f), "utf8")); return C; }
const codes = {
  "codice-civile": loadCode("codice-civile.js"),
  "cpc": loadCode("cpc.js"),
  "codice-penale": loadCode("codice-penale.js"),
  "cpp": loadCode("cpp.js"),
  "costituzione": loadCode("costituzione.js"),
  "cds": loadCode("cds.js"),
};
const numset = {};
const abrog = {};
for (const k in codes) abrog[k] = new Set((codes[k].articoli || []).filter(a => /^(ARTICOLO|COMMA)? ?(ABROGAT|NON PI)/i.test((a.commi[0] || "").trim()) && a.commi.length === 1).map(a => String(a.num).replace(/[s.-]/g, "").toLowerCase()));
const abrogati = [];
for (const k in codes) numset[k] = new Set((codes[k].articoli || []).map(a => String(a.num).replace(/[\s.\-]/g, "").toLowerCase()));

function loadVar(f, n) { return new Function(fs.readFileSync(path.join(JS, f), "utf8") + "\nreturn " + n + ";")(); }
const ATTI = loadVar("data-atti.js", "ATTI").concat(loadVar("data-atti-extra.js", "ATTI_EXTRA"));

function codeId(tok) {
  tok = tok.toLowerCase().replace(/\s/g, "");
  if (tok === "c.p.c." || tok === "cpc") return "cpc";
  if (tok === "c.p.p." || tok === "cpp") return "cpp";
  if (tok === "c.c." || tok === "cc") return "codice-civile";
  if (tok === "c.p." || tok === "cp") return "codice-penale";
  if (tok === "cost." || tok === "cost") return "costituzione";
  if (tok === "c.d.s." || tok === "cds") return "cds";
  return null;
}
const SUF = "bis|ter|quater|quinquies|sexies|septies|octies|novies|decies|undecies|duodecies|terdecies|quaterdecies";
const re = new RegExp("(\\d{1,4}(?:[\\s-](?:" + SUF + "))?)\\s*(c\\.c\\.|c\\.p\\.c\\.|c\\.p\\.p\\.|c\\.p\\.|Cost\\.|C\\.d\\.S\\.|c\\.d\\.s\\.)", "gi");

let totRef = 0; const unresolved = [];
ATTI.forEach(a => {
  const text = (a.descrizione || "") + " " + (a.guida || "") + " " + (a.template || "");
  const seen = new Set(); let m;
  re.lastIndex = 0;
  while ((m = re.exec(text))) {
    const cid = codeId(m[2]); if (!cid) continue;
    const num = m[1].replace(/[\s.\-]/g, "").toLowerCase();
    const key = cid + ":" + num; if (seen.has(key)) continue; seen.add(key);
    totRef++;
    if (abrog[cid].has(num)) abrogati.push({ atto: a.id, ref: "art. " + m[1] + " " + m[2], ctx: text.slice(Math.max(0, m.index - 70), m.index + 30).replace(/s+/g, " ") });
    if (!numset[cid].has(num)) unresolved.push({ atto: a.id, ref: "art. " + m[1].replace(/\s+/g, "-") + " " + m[2], cid });
  }
});
console.log("Riferimenti num+codice verificati (deduplicati per atto):", totRef);
console.log("Citazioni NON risolte nei codici locali:", unresolved.length);
unresolved.forEach(u => console.log("  [" + u.atto + "] " + u.ref + "  -> non trovato in " + u.cid));
console.log("Citazioni di articoli ABROGATI:", abrogati.length); abrogati.forEach(u => console.log("  [" + u.atto + "] " + u.ref + "  ..." + u.ctx));
