/* Scrive .gemini/settings.json con i percorsi ATTUALI dei server MCP usati da Gemini CLI:
 *   - in-iure     (sempre): norme e modelli di atti dell'app, letti dai file dell'app sul PC;
 *   - sentenzeweb (sempre): provvedimenti della Cassazione dall'archivio pubblico SentenzeWeb
 *                           (Ministero della Giustizia), senza credenziali, con protezione anti-blocco;
 *   - normattiva  (se installato): normativa statale vigente e storica, attraverso il filtro anti-blocco.
 * Viene eseguito da AVVIA_GEMINI_IN_IURE.bat a ogni avvio: la cartella "Sito web" puo' essere spostata
 * o copiata su un altro PC senza modificare nulla a mano.
 * Nessuna fonte che richieda credenziali (scelta dell'utente del 05/11/2026).
 * Percorso diverso del server Normattiva: variabile d'ambiente IN_IURE_NORMATTIVA_MCP (cartella del server). */
"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");

const slash = p => p.split(path.sep).join("/");
// cartella della pratica (APRI_PRATICA_IN_IURE.bat): l'unica cartella di documenti che l'assistente puo' usare
const iP = process.argv.indexOf("--pratica");
let PRATICA = iP > 0 ? String(process.argv[iP + 1] || "").replace(/^"|"$/g, "").replace(/[\\/]+$/, "") : "";
if (PRATICA) {
  if (!fs.existsSync(PRATICA) || !fs.statSync(PRATICA).isDirectory()) { console.error("Cartella della pratica non trovata: " + PRATICA); process.exit(1); }
  PRATICA = fs.realpathSync(PRATICA);
}
const MCP = path.resolve(__dirname, "..", "In-Iure-MCP");
for (const f of ["server.js", "sentenzeweb.js", "limita-mcp.js", "pratica.js"])
  if (!fs.existsSync(path.join(MCP, f))) { console.error("File mancante: " + path.join(MCP, f)); process.exit(1); }

const f = path.join(__dirname, ".gemini", "settings.json");
let s = {};
try { s = JSON.parse(fs.readFileSync(f, "utf8")); } catch (e) { /* file assente o non valido: lo ricreo */ }
s.mcpServers = {};

s.mcpServers["in-iure"] = {
  command: "node", args: [slash(path.join(MCP, "server.js"))], trust: true, timeout: 60000,
  description: "Norme vigenti e modelli di atti dell'app In Iure (letti dai file dell'app sul PC)",
};
s.mcpServers.sentenzeweb = {
  command: "node", args: [slash(path.join(MCP, "sentenzeweb.js"))], trust: true, timeout: 120000,
  description: "SentenzeWeb (Corte di cassazione, Ministero della Giustizia): provvedimenti civili e penali degli ultimi 5 anni",
};

s.mcpServers.pratica = {
  command: "node", args: [slash(path.join(MCP, "pratica.js"))].concat(PRATICA ? ["--cartella", slash(PRATICA)] : []), trust: true, timeout: 120000,
  description: "Documenti della pratica aperta (una sola cartella) e salvataggio di pareri e atti in Word",
};

const avvisi = [];
const dirNormattiva = process.env.IN_IURE_NORMATTIVA_MCP || path.join(os.homedir(), "Documents", "MCP", "Normattiva-MCP");
const jsNormattiva = path.join(dirNormattiva, "dist", "server.js");
if (fs.existsSync(jsNormattiva)) {
  s.mcpServers.normattiva = {
    command: "node",
    args: [slash(path.join(MCP, "limita-mcp.js")), "--fonte", "normattiva", "--cache-ore", "24", "--", "node", slash(jsNormattiva)],
    cwd: slash(dirNormattiva), trust: true, timeout: 200000,
    description: "Normattiva: testo ufficiale vigente e storico della normativa italiana (con protezione anti-blocco)",
  };
} else avvisi.push("server Normattiva non trovato in " + dirNormattiva + ": Gemini funziona con le altre fonti");

fs.mkdirSync(path.dirname(f), { recursive: true });
fs.writeFileSync(f, JSON.stringify(s, null, 2) + "\n");

/* Antigravity CLI (agy), che ha sostituito Gemini CLI per gli account personali dal 18/06/2026:
 * stessi server in .agents/mcp_config.json (formato: command/args/cwd, timeoutSeconds) e blocco
 * degli strumenti web/sistema/scrittura con un hook PreToolUse in .agents/hooks.json. */
const agents = path.join(__dirname, ".agents");
fs.mkdirSync(agents, { recursive: true });
const mcp = { mcpServers: {} };
for (const [nome, srv] of Object.entries(s.mcpServers)) {
  const o = { command: srv.command, args: srv.args };
  if (srv.cwd) o.cwd = srv.cwd;
  if (srv.timeout) o.timeoutSeconds = Math.round(srv.timeout / 1000);
  mcp.mcpServers[nome] = o;
}
fs.writeFileSync(path.join(agents, "mcp_config.json"), JSON.stringify(mcp, null, 2) + "\n");
const hooks = {
  "in-iure-solo-fonti-app": {
    PreToolUse: [{
      matcher: "search_web|read_url_content|browser_.*|run_command|write_to_file|replace_file_content|multi_replace_file_content|generate_image",
      // Antigravity esegue il comando senza shell (le virgolette arriverebbero a node cosi' come sono) e dalla
      // cartella .agents: percorso relativo, senza spazi (verificato con agy 1.5.5 l'11/11/2026).
      hooks: [{ type: "command", command: "node ../blocca-strumenti.js", timeout: 10 }],
    }],
  },
};
fs.writeFileSync(path.join(agents, "hooks.json"), JSON.stringify(hooks, null, 2) + "\n");

/* Regola della pratica: indica all'assistente la cartella aperta (o che nessuna pratica e' aperta). */
const regole = path.join(agents, "rules");
fs.mkdirSync(regole, { recursive: true });
fs.writeFileSync(path.join(regole, "pratica.md"), "---\ntrigger: always_on\n---\n" + (PRATICA
  ? "# Pratica aperta\nL'utente ha aperto la pratica nella cartella `" + slash(PRATICA) + "`. I documenti di questa cartella (strumenti `elenca_documenti`, `leggi_documento`, `cerca_nei_documenti` del server `pratica`) sono l'UNICA fonte dei fatti della pratica: non usare documenti di altre cartelle e non supporre fatti che non risultano da essi o dalle parole dell'utente. All'inizio di ogni richiesta che riguarda la pratica chiama `elenca_documenti`.\n"
  : "# Nessuna pratica aperta\nL'assistente e' stato avviato senza una cartella di documenti. Se l'utente chiede di lavorare su documenti, spiegagli di chiudere e usare APRI_PRATICA_IN_IURE.bat (doppio clic, oppure trascinando la cartella sull'icona).\n"));

/* Skill: SOLO quelle di In Iure (cartella skill/, in git). Le skill di Claude dello studio NON vanno mai date
 * ad Antigravity (decisione dell'utente dell'11/11/2026: i testi verrebbero inviati ai server Google). */
const dirSkill = path.join(agents, "skills");
let nSkill = 0;
function copiaDir(da, a) {
  fs.mkdirSync(a, { recursive: true });
  for (const v of fs.readdirSync(da, { withFileTypes: true })) {
    const x = path.join(da, v.name), y = path.join(a, v.name);
    if (v.isDirectory()) copiaDir(x, y); else fs.copyFileSync(x, y);
  }
}
fs.rmSync(dirSkill, { recursive: true, force: true });
for (const sorg of [path.join(__dirname, "skill")]) {
  if (!fs.existsSync(sorg)) continue;
  for (const d of fs.readdirSync(sorg, { withFileTypes: true }))
    if (d.isDirectory() && fs.existsSync(path.join(sorg, d.name, "SKILL.md"))) { copiaDir(path.join(sorg, d.name), path.join(dirSkill, d.name)); nSkill++; }
}

console.log(PRATICA ? "Pratica aperta: " + PRATICA : "Nessuna pratica aperta (per lavorare sui documenti usa APRI_PRATICA_IN_IURE.bat)");
console.log("Skill disponibili: " + nSkill);
console.log("Fonti collegate all'assistente: " + Object.keys(s.mcpServers).join(", "));
for (const a of avvisi) console.log("Avviso: " + a);
