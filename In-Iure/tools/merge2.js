// Unione additiva: integra i nuovi file y-* con base + extra esistenti.
const fs = require("fs"), path = require("path");
const JS = require("path").resolve(__dirname, "..", "js");
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

// ---------- ATTI ----------
const base = loadVar(path.join(JS, "data-atti.js"), "ATTI") || [];
const baseIds = new Set(base.map(a => a.id));
let extra = loadVar(path.join(JS, "data-atti-extra.js"), "ATTI_EXTRA") || [];
const seen = new Set([...baseIds, ...extra.map(a => a.id)]);
let addedA = 0, skipA = 0;
["ATTI_Y1", "ATTI_Y2", "ATTI_Y3", "ATTI_Y4"].forEach(v => {
  const arr = loadVar(path.join(JS, "data-atti-" + v.slice(5).toLowerCase() + ".js"), v);
  if (!Array.isArray(arr)) { console.log("  (manca " + v + ")"); return; }
  arr.forEach(a => {
    if (seen.has(a.id)) { skipA++; return; }
    if (!validAtto(a)) { skipA++; return; }
    seen.add(a.id); extra.push(a); addedA++;
  });
});
fs.writeFileSync(path.join(JS, "data-atti-extra.js"), "var ATTI_EXTRA = " + JSON.stringify(extra, null, 1) + ";\n", "utf8");
console.log("ATTI: base " + base.length + " + extra " + extra.length + " (nuovi " + addedA + ", scartati " + skipA + ") = TOT " + (base.length + extra.length));

// ---------- QUIZ ----------
const qbase = loadVar(path.join(JS, "data-quiz.js"), "QUIZ") || [];
let qextra = loadVar(path.join(JS, "data-quiz-extra.js"), "QUIZ_EXTRA") || [];
const qById = {}; const order = [];
qextra.forEach(m => { qById[m.id] = m; order.push(m.id); });
let addedQ = 0;
["QUIZ_Y1", "QUIZ_Y2", "QUIZ_Y3", "QUIZ_Y4", "QUIZ_Y5", "QUIZ_Y6"].forEach(v => {
  const arr = loadVar(path.join(JS, "data-quiz-" + v.slice(5).toLowerCase() + ".js"), v);
  if (!Array.isArray(arr)) { console.log("  (manca " + v + ")"); return; }
  arr.forEach(m => {
    if (!m || !m.id) return;
    if (!qById[m.id]) { qById[m.id] = { materia: m.materia, id: m.id, domande: [] }; order.push(m.id); qextra.push(qById[m.id]); }
    (m.domande || []).forEach(d => {
      if (d && Array.isArray(d.opzioni) && d.opzioni.length >= 2 && d.corretta >= 0 && d.corretta < d.opzioni.length && d.spiegazione) {
        qById[m.id].domande.push(d); addedQ++;
      }
    });
  });
});
const qout = order.map(id => qById[id]);
fs.writeFileSync(path.join(JS, "data-quiz-extra.js"), "var QUIZ_EXTRA = " + JSON.stringify(qout, null, 1) + ";\n", "utf8");
let tb = qbase.reduce((s, m) => s + m.domande.length, 0), te = qout.reduce((s, m) => s + m.domande.length, 0);
console.log("QUIZ: base " + tb + " + extra " + te + " (nuovi " + addedQ + ") = TOT " + (tb + te));
qout.forEach(m => console.log("   " + m.materia + " extra: " + m.domande.length));
