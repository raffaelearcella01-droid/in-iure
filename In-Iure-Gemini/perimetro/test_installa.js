// Test dell'installatore del perimetro globale di Antigravity, su cartelle "home" temporanee.
// Uso: node In-Iure-Gemini/perimetro/test_installa.js
"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { installa } = require("./installa.js");

let pass = 0, fail = 0;
const ok = (c, m) => (c ? (pass++, console.log("  ✓ " + m)) : (fail++, console.log("  ✗ FAIL: " + m)));
const nuova = () => fs.mkdtempSync(path.join(os.tmpdir(), "perimetro-"));
const J = f => JSON.parse(fs.readFileSync(f, "utf8"));
const scrivi = (f, t) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, t); };

// 1) PC nuovo: niente ~/.gemini
let h = nuova();
installa(h);
const cfg = path.join(h, ".gemini", "config");
ok(fs.readFileSync(path.join(cfg, "hooks", "limita-cartella.js"), "utf8") === fs.readFileSync(path.join(__dirname, "limita-cartella.js"), "utf8"), "PC nuovo: script dell'hook copiato");
ok(J(path.join(cfg, "hooks.json"))["limita-alla-cartella"].PreToolUse[0].hooks[0].command === "node hooks/limita-cartella.js", "PC nuovo: hook collegato in hooks.json");
ok(/IN-IURE-PERIMETRO-INIZIO[\s\S]*Normattiva[\s\S]*IN-IURE-PERIMETRO-FINE/.test(fs.readFileSync(path.join(h, ".gemini", "GEMINI.md"), "utf8")), "PC nuovo: regola globale scritta");
ok(J(path.join(h, ".gemini", "antigravity-cli", "settings.json")).allowNonWorkspaceAccess === false, "PC nuovo: accesso fuori cartella disattivato");
ok(installa(h).length === 0, "seconda esecuzione: nessuna modifica (idempotente)");

// 2) PC gia' usato: altri hook, regole proprie, accesso fuori cartella attivo, domini allargati a mano
h = nuova();
const g = path.join(h, ".gemini");
scrivi(path.join(g, "config", "hooks.json"), JSON.stringify({ "mio-hook": { PreToolUse: [{ matcher: "x", hooks: [] }] } }));
scrivi(path.join(g, "config", "hooks", "limita-cartella.json"), JSON.stringify({ cartelleExtra: ["D:/Modelli"], cartelleStrumenti: [], dominiGiuridici: ["normattiva.it", "blog.example.com"] }));
scrivi(path.join(g, "GEMINI.md"), "# Mie regole\nRispondi in italiano.\n");
scrivi(path.join(g, "antigravity-cli", "settings.json"), JSON.stringify({ allowNonWorkspaceAccess: true, trustedWorkspaces: ["C:/X"] }));
const f2 = installa(h);
const hk = J(path.join(g, "config", "hooks.json"));
ok(hk["mio-hook"] && hk["limita-alla-cartella"], "hooks.json: l'hook dell'utente resta, il nostro si aggiunge");
const c2 = J(path.join(g, "config", "hooks", "limita-cartella.json"));
ok(c2.cartelleExtra[0] === "D:/Modelli" && c2.dominiGiuridici.join() === "normattiva.it,giustizia.it", "configurazione: cartelle locali conservate, domini riportati a Normattiva e Ministero");
const md2 = fs.readFileSync(path.join(g, "GEMINI.md"), "utf8");
ok(/^# Mie regole\nRispondi in italiano\.\n\n<!-- IN-IURE-PERIMETRO-INIZIO/.test(md2), "GEMINI.md: regole dell'utente conservate, perimetro aggiunto in fondo");
const s2 = J(path.join(g, "antigravity-cli", "settings.json"));
ok(s2.allowNonWorkspaceAccess === false && s2.trustedWorkspaces[0] === "C:/X", "settings.json: accesso disattivato, resto invariato");
ok(fs.readdirSync(path.join(g, "antigravity-cli")).some(n => /^settings\.json\.bak-/.test(n)), "settings.json: copia di sicurezza fatta");
ok(f2.length >= 4, "modifiche segnalate (" + f2.join("; ") + ")");
// aggiornamento della regola: il blocco viene sostituito, non duplicato
installa(h);
ok((fs.readFileSync(path.join(g, "GEMINI.md"), "utf8").match(/IN-IURE-PERIMETRO-INIZIO/g) || []).length === 1, "GEMINI.md: blocco presente una sola volta");

// 3) prima versione del PC A5 (GEMINI.md con la sola regola, senza segnaposto)
h = nuova();
scrivi(path.join(h, ".gemini", "GEMINI.md"), fs.readFileSync(path.join(__dirname, "GEMINI-globale.md"), "utf8"));
installa(h);
const md3 = fs.readFileSync(path.join(h, ".gemini", "GEMINI.md"), "utf8");
ok(md3.startsWith("<!-- IN-IURE-PERIMETRO-INIZIO") && (md3.match(/# Perimetro di lavoro/g) || []).length === 1, "regola della prima versione sostituita senza duplicarla");

// 4) l'hook installato funziona davvero (cartella di lavoro = pratica)
const pratica = path.join(h, "pratica"); fs.mkdirSync(pratica);
const prova = (toolCall) => JSON.parse(spawnSync(process.execPath, [path.join(h, ".gemini", "config", "hooks", "limita-cartella.js")],
  { input: JSON.stringify({ toolCall, workspacePaths: [pratica], cwd: pratica }), encoding: "utf8" }).stdout);
ok(prova({ name: "read_file", args: { path: path.join(pratica, "atto.pdf") } }).decision === "allow", "hook installato: lettura nella pratica consentita");
ok(prova({ name: "read_file", args: { path: path.join(h, "altro.pdf") } }).decision === "deny", "hook installato: lettura fuori dalla pratica negata");
ok(prova({ name: "read_url_content", args: { url: "https://www.normattiva.it/x" } }).decision === "ask", "hook installato: Normattiva ammessa (con conferma)");
ok(prova({ name: "read_url_content", args: { url: "https://www.example.com/" } }).decision === "deny", "hook installato: altri siti negati");

// prova della copia di sicurezza: una copia gia' esistente non viene mai sovrascritta
h = nuova();
const fs4 = path.join(h, ".gemini", "antigravity-cli", "settings.json");
scrivi(fs4, JSON.stringify({ allowNonWorkspaceAccess: true, v: 1 })); installa(h);
scrivi(fs4, JSON.stringify({ allowNonWorkspaceAccess: true, v: 2 })); installa(h);
const baks = fs.readdirSync(path.dirname(fs4)).filter(n => /\.bak-/.test(n)).map(n => J(path.join(path.dirname(fs4), n)).v).sort();
ok(baks.join() === "1,2", "due copie di sicurezza distinte, nessuna sovrascritta");

for (const d of fs.readdirSync(os.tmpdir())) if (/^perimetro-/.test(d)) fs.rmSync(path.join(os.tmpdir(), d), { recursive: true, force: true });
console.log("\n========== " + pass + " OK, " + fail + " FAIL ==========");
process.exit(fail ? 1 : 0);
