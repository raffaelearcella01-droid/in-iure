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
const MCP = path.resolve(__dirname, "..", "In-Iure-MCP");
for (const f of ["server.js", "sentenzeweb.js", "limita-mcp.js"])
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
      hooks: [{ type: "command", command: "node \"" + slash(path.join(__dirname, "blocca-strumenti.js")) + "\"", timeout: 10 }],
    }],
  },
};
fs.writeFileSync(path.join(agents, "hooks.json"), JSON.stringify(hooks, null, 2) + "\n");

console.log("Fonti collegate all'assistente: " + Object.keys(s.mcpServers).join(", "));
for (const a of avvisi) console.log("Avviso: " + a);
