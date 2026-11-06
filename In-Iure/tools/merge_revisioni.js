// Applica le revisioni (audit dei contenuti esistenti e verifica dei nuovi) e unisce i nuovi atti/quiz.
// Uso: node merge_revisioni.js <cartella_revisioni> [--dry]
//   <cartella_revisioni> contiene: audit_quiz_<materia>.json, audit_atti_*.json, verifica_quiz_n*.json, verifica_atti_*.json
// Nuovi file letti da js/: data-atti-y5..y14.js (ATTI_Yn), data-quiz-n1..n6.js (QUIZ_Nn).
// Scrive: js/data-atti.js, js/data-atti-extra.js, js/data-quiz.js, js/data-quiz-extra.js + report JSON nella cartella revisioni.
const fs = require("fs"), path = require("path");
const JS = path.resolve(__dirname, "..", "js");
const REV = path.resolve(process.argv[2] || ".");
const DRY = process.argv.includes("--dry");
const log = [];
const say = m => { log.push(m); console.log(m); };

function loadVar(file, name) {
  if (!fs.existsSync(file)) return null;
  return new Function(fs.readFileSync(file, "utf8") + "\nreturn typeof " + name + "!==\"undefined\"?" + name + ":null;")();
}
function readJSON(f) { try { return JSON.parse(fs.readFileSync(path.join(REV, f), "utf8")); } catch (e) { say("  (manca o non valido: " + f + (fs.existsSync(path.join(REV, f)) ? " - " + e.message : "") + ")"); return null; } }
const nonAscii = s => /[^\x00-\x7F]/.test(JSON.stringify(s));
const nq = s => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

/* ======================= QUIZ ======================= */
const qbase = loadVar(path.join(JS, "data-quiz.js"), "QUIZ");
const qextra = loadVar(path.join(JS, "data-quiz-extra.js"), "QUIZ_EXTRA");
function applyQuizFixes(list, fixes, label) {
  if (!fixes) return;
  let ok = 0, miss = 0, del = 0;
  fixes.forEach(f => {
    const i = list.findIndex(d => d.q === f.q) >= 0 ? list.findIndex(d => d.q === f.q) : list.findIndex(d => nq(d.q) === nq(f.q));
    if (i < 0) { miss++; say("  [" + label + "] domanda non trovata: " + String(f.q).slice(0, 90)); return; }
    if (f.azione === "elimina") { list.splice(i, 1); del++; return; }
    const n = f.nuovo || {};
    ["q", "opzioni", "corretta", "spiegazione", "norma"].forEach(k => { if (n[k] !== undefined) list[i][k] = n[k]; });
    ok++;
  });
  say("  [" + label + "] corrette " + ok + ", eliminate " + del + ", non trovate " + miss);
}
// audit sulle domande esistenti (base + extra della stessa materia)
const materie = {};
qbase.concat(qextra).forEach(m => { (materie[m.id] = materie[m.id] || []).push(m); });
Object.keys(materie).forEach(id => {
  const fixes = readJSON("audit_quiz_" + id + ".json");
  if (!fixes) return;
  // applica su ciascun blocco che contiene la domanda
  const rest = [];
  fixes.forEach(f => {
    const blk = materie[id].find(m => m.domande.some(d => d.q === f.q || nq(d.q) === nq(f.q)));
    if (blk) applyQuizFixes(blk.domande, [f], "audit " + id); else rest.push(f);
  });
  if (rest.length) say("  [audit " + id + "] " + rest.length + " correzioni senza corrispondenza");
});
// nuove domande verificate
const qById = {}; qextra.forEach(m => { qById[m.id] = m; });
for (let n = 1; n <= 6; n++) {
  const arr = loadVar(path.join(JS, "data-quiz-n" + n + ".js"), "QUIZ_N" + n);
  if (!arr) { say("  (manca data-quiz-n" + n + ".js)"); continue; }
  arr.forEach(m => {
    applyQuizFixes(m.domande, readJSON("verifica_quiz_n" + n + ".json"), "verifica n" + n);
    const dest = qById[m.id] || (qById[m.id] = (qextra.push({ materia: m.materia, id: m.id, domande: [] }), qextra[qextra.length - 1]));
    let add = 0, dup = 0, bad = 0;
    const seen = new Set(qbase.concat(qextra).filter(x => x.id === m.id).flatMap(x => x.domande.map(d => nq(d.q))));
    m.domande.forEach(d => {
      const valid = d && d.q && Array.isArray(d.opzioni) && d.opzioni.length === 4 && d.corretta >= 0 && d.corretta < 4 && d.spiegazione && !nonAscii(d);
      if (!valid) { bad++; return; }
      if (seen.has(nq(d.q))) { dup++; return; }
      seen.add(nq(d.q)); dest.domande.push(d); add++;
    });
    say("  [nuove " + m.id + "] aggiunte " + add + ", doppioni scartati " + dup + ", non valide " + bad);
  });
}
// controllo finale quiz
let qtot = 0;
qbase.concat(qextra).forEach(m => m.domande.forEach(d => {
  qtot++;
  if (!(Array.isArray(d.opzioni) && d.corretta >= 0 && d.corretta < d.opzioni.length && d.spiegazione)) say("  QUIZ NON VALIDA: " + d.q);
}));
const perMat = {}; qbase.concat(qextra).forEach(m => perMat[m.id] = (perMat[m.id] || 0) + m.domande.length);
say("QUIZ totale: " + qtot + " " + JSON.stringify(perMat));

/* ======================= ATTI ======================= */
const abase = loadVar(path.join(JS, "data-atti.js"), "ATTI");
let aextra = loadVar(path.join(JS, "data-atti-extra.js"), "ATTI_EXTRA");
function findAtto(id) { return abase.find(a => a.id === id) || aextra.find(a => a.id === id); }
function applyAttiFixes(rev, label, pool) {
  if (!rev) return;
  const get = id => (pool ? pool.find(a => a.id === id) : findAtto(id));
  let ok = 0, miss = 0;
  (rev.correzioni || []).forEach(c => {
    const a = get(c.id);
    if (!a) { miss++; say("  [" + label + "] atto non trovato: " + c.id); return; }
    if (c.campo === "tags") {
      if (Array.isArray(c.sostituisci)) { a.tags = c.sostituisci; ok++; return; }
      const t = JSON.stringify(a.tags || []);
      if (t.split(c.trova).length === 2) { a.tags = JSON.parse(t.replace(c.trova, c.sostituisci)); ok++; } else { miss++; say("  [" + label + "] tags: testo non trovato in " + c.id); }
      return;
    }
    const v = a[c.campo];
    if (typeof v !== "string") { miss++; say("  [" + label + "] campo assente " + c.campo + " in " + c.id); return; }
    const parts = v.split(c.trova);
    if (parts.length !== 2) { miss++; say("  [" + label + "] '" + String(c.trova).slice(0, 60) + "' trovato " + (parts.length - 1) + " volte in " + c.id + "." + c.campo); return; }
    a[c.campo] = parts.join(c.sostituisci); ok++;
  });
  (rev.rinomine || []).forEach(r => { const a = get(r.id); if (a) { a.nome = r.nome; ok++; } else { miss++; say("  [" + label + "] rinomina: non trovato " + r.id); } });
  say("  [" + label + "] correzioni applicate " + ok + ", non applicate " + miss);
  return rev;
}
const removeIds = new Set();
["audit_atti_civile.json", "audit_atti_penale.json"].forEach(f => {
  const rev = applyAttiFixes(readJSON(f), f);
  if (rev) (rev.doppioni || []).forEach(d => { if (d.eliminare && findAtto(d.tenere)) { removeIds.add(d.eliminare); say("  doppione: elimino " + d.eliminare + " (tengo " + d.tenere + ")"); } });
});
const VER = { 5: "verifica_atti_y5_y6.json", 6: "verifica_atti_y5_y6.json", 7: "verifica_atti_y7_y8.json", 8: "verifica_atti_y7_y8.json",
  9: "verifica_atti_y9_y10.json", 10: "verifica_atti_y9_y10.json", 11: "verifica_atti_y11.json", 12: "verifica_atti_y12_y14.json", 13: "verifica_atti_y12_y14.json", 14: "verifica_atti_y12_y14.json" };
const verCache = {};
function validAtto(a) {
  if (!a || !a.id || !a.nome || !a.template || !Array.isArray(a.campi)) return "struttura";
  const ids = new Set(a.campi.map(c => c.id));
  const ph = (a.template.match(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g) || []).map(x => x.replace(/[^a-zA-Z0-9_]/g, ""));
  if (!ph.every(p => ids.has(p))) return "segnaposto senza campo";
  if (nonAscii(a)) return "caratteri non ASCII";
  return "";
}
const seenIds = new Set(abase.concat(aextra).map(a => a.id));
let addA = 0;
for (let n = 5; n <= 14; n++) {
  const arr = loadVar(path.join(JS, "data-atti-y" + n + ".js"), "ATTI_Y" + n);
  if (!arr) { say("  (manca data-atti-y" + n + ".js)"); continue; }
  const vf = VER[n];
  if (!verCache[vf]) verCache[vf] = readJSON(vf) || {};
  const rev = verCache[vf];
  const mine = { correzioni: (rev.correzioni || []).filter(c => arr.some(a => a.id === c.id)) };
  applyAttiFixes(mine, "verifica y" + n, arr);
  const elim = new Set((rev.elimina || []).map(e => e.id));
  arr.forEach(a => {
    if (elim.has(a.id)) { say("  [y" + n + "] eliminato su indicazione del revisore: " + a.id); return; }
    if (seenIds.has(a.id)) { say("  [y" + n + "] id duplicato scartato: " + a.id); return; }
    const err = validAtto(a);
    if (err) { say("  [y" + n + "] NON VALIDO (" + err + "): " + a.id); return; }
    seenIds.add(a.id); aextra.push(a); addA++;
  });
}
aextra = aextra.filter(a => !removeIds.has(a.id));
const abase2 = abase.filter(a => !removeIds.has(a.id));
abase.concat(aextra).forEach(a => { const e = validAtto(a); if (e && !removeIds.has(a.id)) say("  ATTO NON VALIDO (" + e + "): " + a.id); });
// doppioni per nome (stesso nome normalizzato)
const byName = {}; abase2.concat(aextra).forEach(a => { const k = nq(a.nome); (byName[k] = byName[k] || []).push(a.id); });
Object.values(byName).filter(v => v.length > 1).forEach(v => say("  ATTENZIONE stesso nome: " + v.join(", ")));
say("ATTI: base " + abase2.length + " + extra " + aextra.length + " (nuovi " + addA + ", eliminati doppioni " + removeIds.size + ") = TOT " + (abase2.length + aextra.length));

if (!DRY) {
  fs.writeFileSync(path.join(JS, "data-quiz.js"), "// data-quiz.js - banca base (revisionata ottobre 2026)\nvar QUIZ = " + JSON.stringify(qbase, null, 1) + ";\n");
  fs.writeFileSync(path.join(JS, "data-quiz-extra.js"), "var QUIZ_EXTRA = " + JSON.stringify(qextra, null, 1) + ";\n");
  fs.writeFileSync(path.join(JS, "data-atti.js"), "/* data-atti.js - formulario base (revisionato ottobre 2026) */\nvar ATTI = " + JSON.stringify(abase2, null, 1) + ";\n");
  fs.writeFileSync(path.join(JS, "data-atti-extra.js"), "var ATTI_EXTRA = " + JSON.stringify(aextra, null, 1) + ";\n");
  fs.writeFileSync(path.join(REV, "esito_merge.txt"), log.join("\n") + "\n");
  console.log("Scritto. Esito in " + path.join(REV, "esito_merge.txt"));
} else console.log("(prova: nessun file scritto)");
