// Confronta i codici attuali (js/codici) con una versione precedente (cartella passata come argomento).
// Uso: node diff_versioni.js <cartella_codici_precedenti> [out.json]
const fs = require("fs"), path = require("path");
const OLD = process.argv[2], OUTF = process.argv[3];
const NEW = path.resolve(__dirname, "..", "js", "codici");
function load(f) { let C = null; global.registerCodice = c => C = c; eval(fs.readFileSync(f, "utf8")); return C; }
const n = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
const report = {};
for (const f of fs.readdirSync(OLD)) {
  if (!fs.existsSync(path.join(NEW, f))) continue;
  const o = load(path.join(OLD, f)), w = load(path.join(NEW, f));
  const om = new Map(o.articoli.map(a => [a.num, a])), wm = new Map(w.articoli.map(a => [a.num, a]));
  const r = { nuovi: [], rimossi: [], modificati: [] };
  for (const [k, a] of wm) {
    if (!om.has(k)) { r.nuovi.push(k); continue; }
    const b = om.get(k);
    if (n(a.commi.join(" ")) !== n(b.commi.join(" "))) r.modificati.push(k);
  }
  for (const k of om.keys()) if (!wm.has(k)) r.rimossi.push(k);
  report[o.id] = r;
  console.log(o.id.padEnd(16), "nuovi", r.nuovi.length, "rimossi", r.rimossi.length, "testo diverso", r.modificati.length, "su", w.articoli.length);
}
if (OUTF) fs.writeFileSync(OUTF, JSON.stringify(report, null, 1));
