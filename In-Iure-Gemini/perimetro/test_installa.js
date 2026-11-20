// Test dell'installatore della configurazione globale di Antigravity e dell'hook limita-cartella, su cartelle "home" temporanee.
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

console.log("[1] PC nuovo");
let h = nuova();
installa(h);
const cfg = path.join(h, ".gemini", "config");
ok(fs.readFileSync(path.join(cfg, "hooks", "limita-cartella.js"), "utf8") === fs.readFileSync(path.join(__dirname, "limita-cartella.js"), "utf8"), "script dell'hook copiato");
const hk1 = J(path.join(cfg, "hooks.json"))["limita-alla-cartella"];
ok(hk1.PreToolUse[0].hooks[0].command === "node hooks/limita-cartella.js" && hk1.PreInvocation[0].command === "node hooks/limita-cartella.js", "hook collegato in hooks.json (PreToolUse e PreInvocation)");
ok(/IN-IURE-PERIMETRO-INIZIO[\s\S]*SOLO quando lavori su una pratica[\s\S]*Normattiva[\s\S]*IN-IURE-PERIMETRO-FINE/.test(fs.readFileSync(path.join(h, ".gemini", "GEMINI.md"), "utf8")), "regola globale scritta, valida solo per il lavoro sulle pratiche");
ok(installa(h).length === 0, "seconda esecuzione: nessuna modifica (idempotente)");

console.log("[2] PC gia' usato");
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
ok(/^# Mie regole\nRispondi in italiano\.\n\n<!-- IN-IURE-PERIMETRO-INIZIO/.test(fs.readFileSync(path.join(g, "GEMINI.md"), "utf8")), "GEMINI.md: regole dell'utente conservate, blocco aggiunto in fondo");
const s2 = J(path.join(g, "antigravity-cli", "settings.json"));
ok(s2.allowNonWorkspaceAccess === true && s2.trustedWorkspaces[0] === "C:/X" && s2.permissions.allow.length === 4, "settings.json: impostazioni dell'utente invariate (limiti solo in modalita' pratica), aggiunti i permessi delle fonti");
ok(f2.length >= 4, "modifiche segnalate (" + f2.join("; ") + ")");
installa(h);
ok((fs.readFileSync(path.join(g, "GEMINI.md"), "utf8").match(/IN-IURE-PERIMETRO-INIZIO/g) || []).length === 1, "GEMINI.md: blocco presente una sola volta");

console.log("[3] Prima versione del PC A5 (regola senza segnaposto)");
h = nuova();
scrivi(path.join(h, ".gemini", "GEMINI.md"), "# Perimetro di lavoro (regola globale dello studio)\n\n1. Lavora SOLO sui documenti della cartella...\n");
installa(h);
const md3 = fs.readFileSync(path.join(h, ".gemini", "GEMINI.md"), "utf8");
ok(md3.startsWith("<!-- IN-IURE-PERIMETRO-INIZIO") && !/# Perimetro di lavoro \(regola globale/.test(md3), "regola della prima versione sostituita senza duplicarla");

console.log("[4] Hook: modalita' pratica (richiesta giuridica)");
const pratica = path.join(h, "pratica"); fs.mkdirSync(pratica);
const HOOK = path.join(h, ".gemini", "config", "hooks", "limita-cartella.js");
let nConv = 0;
const esegui = (inp) => { const r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify(inp), encoding: "utf8" }).stdout; return r ? JSON.parse(r) : {}; };
const prova = (toolCall, richiesta, conv, cartella) => esegui({ hookEventName: "PreToolUse", toolCall, workspacePaths: [cartella || pratica], cwd: cartella || pratica,
  lastUserInput: richiesta === undefined ? "Analizza il fascicolo e scrivi un parere" : richiesta, conversationId: conv || ("conv-" + (++nConv)) }).decision;
ok(prova({ name: "read_file", args: { path: path.join(pratica, "atto.pdf") } }) === "allow", "lettura nella pratica consentita");
ok(prova({ name: "read_file", args: { path: path.join(h, "altro.pdf") } }) === "deny", "lettura fuori dalla pratica negata");
ok(prova({ name: "read_url_content", args: { url: "https://www.normattiva.it/x" } }) === "ask", "pagina di Normattiva ammessa (con conferma)");
ok(prova({ name: "read_url_content", args: { url: "https://www.example.com/" } }) === "deny", "altri siti negati");
const mcpCall = (srv, rich) => prova({ name: "call_mcp_tool", args: { Arguments: {}, ServerName: srv, ToolName: "x" } }, rich);
ok(["normattiva", "sentenzeweb", "in-iure", "pratica"].every(s => mcpCall(s) === "allow"), "fonti ammesse: normattiva, sentenzeweb, in-iure, pratica");
ok(mcpCall("onelegale") === "deny" && mcpCall("dirittopratico") === "deny" && mcpCall("") === "deny", "ogni altra fonte MCP negata");
ok(prova({ name: "search_web", args: { query: "art 2043" } }) === "deny", "ricerca web negata");
ok(prova({ name: "run_command", args: { CommandLine: "dir" } }) === "deny", "comandi di sistema negati");
ok(prova({ name: "write_file", args: { path: path.join(pratica, "nota.md") } }) === "deny", "scrittura di file negata (si salva solo con salva_documento_word)");
ok(prova({ name: "generate_image", args: { prompt: "x" } }) === "deny", "generazione di immagini negata");
ok(prova({ name: "read_file", args: { path: path.join(os.homedir(), ".gemini", "antigravity-cli", "mcp", "normattiva", "estrai_articolo.json") } }) === "allow",
  "consentita la lettura delle descrizioni delle fonti (cartella mcp di agy)");
const giuridiche = ["Scrivi un atto di citazione per risarcimento danni", "fammi una ricerca giurisprudenziale sulla responsabilità medica",
  "Analizza i documenti del fascicolo", "redigi una comparsa di costituzione", "cosa dice l'art. 2043 c.c.?", "prepara un parere sul contratto di locazione",
  "Trova sentenze della Cassazione sul danno da perdita di chance", "scrivi una diffida ad adempiere", "memoria integrativa ex art. 171-ter"];
ok(giuridiche.every(r => prova({ name: "search_web", args: {} }, r) === "deny"), "richieste giuridiche riconosciute (" + giuridiche.length + " esempi)");
const comandi = ["/fascicolo", "/atto comparsa per il convenuto", "/parere", "/giurisprudenza caduta marciapiede", "/normativa recesso", "/replica memoria avversaria",
  "/lettera al conduttore", "/scadenze", "/controlla-citazioni bozza.docx"];
ok(comandi.every(r => prova({ name: "search_web", args: {} }, r) === "deny"), "ogni comando dello studio attiva la modalita' pratica (" + comandi.length + " comandi)");
const skill9 = ["fascicolo", "atto", "parere", "giurisprudenza", "normativa", "replica", "lettera", "scadenze", "controlla-citazioni"];
ok(skill9.every(n => /^---\nname: /.test(fs.readFileSync(path.join(cfg, "skills", n, "SKILL.md"), "utf8").replace(/\r\n/g, "\n")) &&
  new RegExp("description: Comando /" + n + " ").test(fs.readFileSync(path.join(cfg, "skills", n, "SKILL.md"), "utf8"))), "i 9 comandi installati come skill globali, con nome e descrizione");

console.log("[5] Hook: modalita' libera (richiesta non giuridica)");
const libere = ["Che ore sono a Tokyo?", "Leggi il file dati.csv e fammi un grafico", "Scrivi uno script Python che rinomina le foto", "Riassumi questo articolo di cucina", "Aiutami con le notifiche del telefono"];
ok(libere.every(r => prova({ name: "search_web", args: { query: "x" } }, r) === "ask"), "richieste non giuridiche: ricerca web come di consueto (con conferma)");
ok(prova({ name: "run_command", args: { CommandLine: "dir" } }, "Che ore sono a Tokyo?") === "ask", "comandi come di consueto (con conferma)");
ok(prova({ name: "read_file", args: { path: path.join(h, "altro.pdf") } }, "Leggi il file dati.csv") === "allow", "lettura libera");
ok(prova({ name: "call_mcp_tool", args: { ServerName: "altro", ToolName: "x" } }, "Che ore sono?") === "ask", "altri server MCP come di consueto (con conferma)");

console.log("[6] Hook: la modalita' pratica dura per tutta la conversazione");
ok(prova({ name: "search_web", args: {} }, "Scrivi un parere sulla prescrizione", "conv-A") === "deny", "richiesta giuridica: modalita' pratica");
ok(prova({ name: "search_web", args: {} }, "continua", "conv-A") === "deny" && prova({ name: "run_command", args: { CommandLine: "dir" } }, "ok salvalo", "conv-A") === "deny", "\"continua\" / \"ok salvalo\": resta in modalita' pratica");
ok(prova({ name: "search_web", args: {} }, "continua", "conv-B") === "ask", "un'altra conversazione parte libera");
ok(prova({ name: "call_mcp_tool", args: { ServerName: "sentenzeweb", ToolName: "cerca_sentenze" } }, "e adesso?", "conv-C") === "allow" &&
  prova({ name: "search_web", args: {} }, "e adesso?", "conv-C") === "deny", "l'uso di una fonte giuridica attiva la modalita' pratica");
const conElaborati = path.join(h, "pratica2"); fs.mkdirSync(path.join(conElaborati, "In Iure - elaborati"), { recursive: true });
ok(prova({ name: "search_web", args: {} }, "ciao", "conv-D", conElaborati) === "deny", "cartella con \"In Iure - elaborati\": modalita' pratica");
const inv = (rich, conv) => esegui({ hookEventName: "PreInvocation", workspacePaths: [pratica], cwd: pratica, lastUserInput: rich, conversationId: conv });
const i1 = inv("Scrivi un ricorso per decreto ingiuntivo", "conv-E");
ok(i1.injectSteps && /MODALITA' PRATICA ATTIVA/.test(i1.injectSteps[0].systemMessage.systemMessage) && /modalita' pratica attiva/.test(i1.injectSteps[0].systemMessage.metadata.user_markdown), "PreInvocation: avviso al modello e all'utente quando scatta la modalita' pratica");
ok(!inv("continua", "conv-E").injectSteps, "avviso dato una sola volta per conversazione");
ok(!inv("Che tempo fa a Roma?", "conv-F").injectSteps, "nessun avviso per le richieste non giuridiche");

console.log("[7] Fonti, skill, regole e permessi");
const cfg5 = path.join(h, ".gemini", "config");
ok(fs.existsSync(path.join(cfg5, "skills", "parere", "SKILL.md")) && fs.existsSync(path.join(cfg5, "skills", "redazione-atto", "SKILL.md")), "skill di In Iure installate come skill globali");
const md5 = fs.readFileSync(path.join(h, ".gemini", "GEMINI.md"), "utf8");
ok(/Regola delle fonti/.test(md5) && /da cui e' stato avviato agy/.test(md5), "regole dell'assistente In Iure nella regola globale");
const mc5 = J(path.join(cfg5, "mcp_config.json")).mcpServers;
ok(mc5.sentenzeweb && mc5["in-iure"] && mc5.pratica && mc5.pratica.args.indexOf("--cartella-avvio") > 0, "fonti globali: sentenzeweb, in-iure, pratica dalla cartella di avvio");
const st5 = J(path.join(h, ".gemini", "antigravity-cli", "settings.json"));
ok(["normattiva", "sentenzeweb", "in-iure", "pratica"].every(s => st5.permissions.allow.indexOf("mcp(" + s + "/*)") >= 0), "permessi delle fonti in settings.json");
const h6 = nuova();
scrivi(path.join(h6, ".gemini", "config", "mcp_config.json"), JSON.stringify({ mcpServers: { altro: { command: "x" } } }));
const f6 = installa(h6);
const mc6 = J(path.join(h6, ".gemini", "config", "mcp_config.json")).mcpServers;
ok(mc6.altro && mc6.sentenzeweb && f6.some(x => /altro/.test(x)), "mcp_config: server dell'utente conservato e segnalato (bloccato solo in modalita' pratica)");

for (const d of fs.readdirSync(os.tmpdir())) if (/^perimetro-/.test(d)) fs.rmSync(path.join(os.tmpdir(), d), { recursive: true, force: true });
console.log("\n========== " + pass + " OK, " + fail + " FAIL ==========");
process.exit(fail ? 1 : 0);
