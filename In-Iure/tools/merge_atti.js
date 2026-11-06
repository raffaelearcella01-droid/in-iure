// Unione additiva degli atti: integra i file data-atti-y1..y4 in data-atti-extra.js
// Percorsi relativi a questa cartella tools/ (robusto agli spostamenti).
const fs = require("fs"), path = require("path");
const JS = path.resolve(__dirname, "..", "js");
function loadVar(file, name) {
  if (!fs.existsSync(file)) return null;
  try { return new Function(fs.readFileSync(file, "utf8") + "\nreturn typeof " + name + "!==\"undefined\"?" + name + ":null;")(); }
  catch (e) { console.log("  ERRORE " + path.basename(file) + ": " + e.message); return null; }
}
function validAtto(a) {
  if (!a || !a.id || !a.template || !Array.isArray(a.campi)) return false;
  const ids = new Set(a.campi.map(c => c.id));
  const ph = (a.template.match(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g) || []).map(x => x.replace(/[^a-zA-Z0-9_]/g, ""));
  return ph.every(p => ids.has(p));
}
const base = loadVar(path.join(JS, "data-atti.js"), "ATTI") || [];
let extra = loadVar(path.join(JS, "data-atti-extra.js"), "ATTI_EXTRA") || [];
const seen = new Set([...base.map(a => a.id), ...extra.map(a => a.id)]);
let added = 0, skip = 0;
["ATTI_Y1", "ATTI_Y2", "ATTI_Y3", "ATTI_Y4"].forEach(v => {
  const arr = loadVar(path.join(JS, "data-atti-" + v.slice(5).toLowerCase() + ".js"), v);
  if (!Array.isArray(arr)) { console.log("  (manca " + v + ")"); return; }
  arr.forEach(a => {
    if (seen.has(a.id)) { console.log("  DUP id: " + a.id); skip++; return; }
    if (!validAtto(a)) { console.log("  INVALIDO: " + a.id); skip++; return; }
    seen.add(a.id); extra.push(a); added++;
  });
});
fs.writeFileSync(path.join(JS, "data-atti-extra.js"), "var ATTI_EXTRA = " + JSON.stringify(extra, null, 1) + ";\n", "utf8");
console.log("ATTI: base " + base.length + " + extra " + extra.length + " (nuovi " + added + ", scartati " + skip + ") = TOT " + (base.length + extra.length));
