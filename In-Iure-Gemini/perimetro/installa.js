/* Installa (o aggiorna) sul PC in uso la configurazione GLOBALE di Antigravity CLI (agy), che vale in qualunque
 * cartella si avvii agy, anche scrivendo solo "agy" in un terminale (richieste dell'utente del 20/11/2026):
 *  1. ~/.gemini/config/hooks/limita-cartella.js  (sempre aggiornato dalla copia in git di questa cartella)
 *     ~/.gemini/config/hooks/limita-cartella.json (copiato solo se manca: le modifiche locali restano; domini e
 *                                                  server ammessi sono comunque riportati a quelli ufficiali)
 *  2. ~/.gemini/config/hooks.json: voce "limita-alla-cartella" (le altre voci dell'utente restano);
 *  3. ~/.gemini/GEMINI.md: tra i segnaposto IN-IURE-PERIMETRO la regola del perimetro e le regole dell'assistente
 *     In Iure (In-Iure-Gemini/GEMINI.md); il resto del file resta;
 *  4. ~/.gemini/antigravity-cli/settings.json: "allowNonWorkspaceAccess": false (copia di sicurezza se era true);
 *  5. ~/.gemini/config/mcp_config.json: fonti normattiva (con protezione anti-blocco), sentenzeweb, in-iure (ausilio)
 *     e pratica (= la cartella da cui si lancia agy); altri server eventualmente presenti restano scritti, ma
 *     l'hook ne nega l'uso;
 *  6. ~/.gemini/config/skills/<nome>: le skill di In Iure (In-Iure-Gemini/skill), MAI le skill di Claude dello studio.
 * Lo chiama configura.js a ogni avvio (AVVIA_GEMINI_IN_IURE.bat, APRI_PRATICA_IN_IURE.bat) e controlla_pc.ps1;
 * si puo' anche lanciare a mano: node installa.js   (--home <cartella> solo per i test). */
"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");

const DOMINI = ["normattiva.it", "giustizia.it"];
const SERVER = ["normattiva", "sentenzeweb", "in-iure", "pratica"];
const VOCE = "limita-alla-cartella";
const MATCHER = "read_.*|view_.*|list_.*|grep.*|find_.*|.*search.*|glob.*|write_.*|edit_.*|.*replace.*|run_.*|.*command.*|.*url.*|browser_.*|.*file.*|.*mcp.*|.*image.*|.*terminal.*|.*shell.*";
const INIZIO = "<!-- IN-IURE-PERIMETRO-INIZIO (aggiornato da In-Iure-Gemini/perimetro/installa.js) -->";
const FINE = "<!-- IN-IURE-PERIMETRO-FINE -->";
const GEMINI_DIR = path.resolve(__dirname, "..");
const MCP_DIR = path.resolve(__dirname, "..", "..", "In-Iure-MCP");
const slash = p => p.split(path.sep).join("/");

function serverInIure(home) {
  const s = {
    "in-iure": { command: "node", args: [slash(path.join(MCP_DIR, "server.js"))], timeoutSeconds: 60 },
    sentenzeweb: { command: "node", args: [slash(path.join(MCP_DIR, "sentenzeweb.js"))], timeoutSeconds: 120 },
    pratica: { command: "node", args: [slash(path.join(MCP_DIR, "pratica.js")), "--cartella-avvio"], timeoutSeconds: 120 },
  };
  const dirN = process.env.IN_IURE_NORMATTIVA_MCP || path.join(home, "Documents", "MCP", "Normattiva-MCP");
  const jsN = path.join(dirN, "dist", "server.js");
  if (fs.existsSync(jsN)) {
    s.normattiva = { command: "node", args: [slash(path.join(MCP_DIR, "limita-mcp.js")), "--fonte", "normattiva", "--cache-ore", "24", "--", "node", slash(jsN)],
      cwd: slash(dirN), timeoutSeconds: 200 };
  }
  return s;
}

function installa(home) {
  const fatto = [];
  const gem = path.join(home, ".gemini");
  const cfg = path.join(gem, "config");
  const dirHook = path.join(cfg, "hooks");
  fs.mkdirSync(dirHook, { recursive: true });
  const leggi = f => { try { return fs.readFileSync(f, "utf8"); } catch (e) { return null; } };
  const scriviSeDiverso = (f, testo, nome) => { if (leggi(f) !== testo) { fs.writeFileSync(f, testo); if (fatto.indexOf(nome) < 0) fatto.push(nome); } };

  // 1. script dell'hook e configurazione
  scriviSeDiverso(path.join(dirHook, "limita-cartella.js"), fs.readFileSync(path.join(__dirname, "limita-cartella.js"), "utf8"), "hook");
  const fConf = path.join(dirHook, "limita-cartella.json");
  let conf = null;
  try { conf = JSON.parse(leggi(fConf)); } catch (e) { conf = null; }
  const modello = JSON.parse(fs.readFileSync(path.join(__dirname, "limita-cartella.json"), "utf8"));
  if (!conf || typeof conf !== "object") conf = modello;
  conf._nota = modello._nota;
  conf.dominiGiuridici = DOMINI.slice();   // solo Normattiva e Ministero: non si allarga localmente
  conf.serverAmmessi = SERVER.slice();     // idem per le fonti MCP
  if (conf.consentiComandi === undefined) conf.consentiComandi = false;
  if (conf.consentiScrittura === undefined) conf.consentiScrittura = false;
  scriviSeDiverso(fConf, JSON.stringify(conf, null, 2) + "\n", "configurazione dell'hook");

  // 2. collegamento in hooks.json
  const fHooks = path.join(cfg, "hooks.json");
  let hooks = {};
  const testoHooks = leggi(fHooks);
  if (testoHooks != null && testoHooks.trim()) {
    try { hooks = JSON.parse(testoHooks); } catch (e) {
      fs.copyFileSync(fHooks, fHooks + ".non-valido-" + Date.now()); hooks = {}; fatto.push("hooks.json non valido (copia conservata)");
    }
  }
  // PreToolUse: controllo degli strumenti; PreInvocation: avviso al modello quando scatta la modalita' pratica
  hooks[VOCE] = { PreToolUse: [{ matcher: MATCHER, hooks: [{ type: "command", command: "node hooks/limita-cartella.js", timeout: 10 }] }],
    PreInvocation: [{ type: "command", command: "node hooks/limita-cartella.js", timeout: 10 }] };
  scriviSeDiverso(fHooks, JSON.stringify(hooks, null, 2) + "\n", "hooks.json");

  // 3. regola globale: perimetro + regole dell'assistente In Iure
  const fMd = path.join(gem, "GEMINI.md");
  const regoleInIure = fs.readFileSync(path.join(GEMINI_DIR, "GEMINI.md"), "utf8").replace(/\r\n/g, "\n").trim()
    .split("aperta dall'utente con APRI_PRATICA_IN_IURE.bat").join("da cui e' stato avviato agy (o scelta con APRI_PRATICA_IN_IURE.bat)")
    .split("Non usare ricerche web: in questa cartella sono disattivate.").join("Non usare ricerche web: sono disattivate.");
  const regola = fs.readFileSync(path.join(__dirname, "GEMINI-globale.md"), "utf8").replace(/\r\n/g, "\n").trim() + "\n\n" + regoleInIure;
  const blocco = INIZIO + "\n" + regola + "\n" + FINE;
  let md = (leggi(fMd) || "").replace(/\r\n/g, "\n");
  const i = md.indexOf(INIZIO.slice(0, 30)), j = md.indexOf(FINE);
  if (i >= 0 && j > i) md = md.slice(0, i) + blocco + md.slice(j + FINE.length);
  else if (md.trim().startsWith("# Perimetro di lavoro (regola globale dello studio)")) md = blocco + "\n";   // prima versione (PC A5, 20/11)
  else md = (md.trim() ? md.replace(/\s*$/, "\n\n") : "") + blocco + "\n";
  scriviSeDiverso(fMd, md, "GEMINI.md");

  // 4. impostazioni di agy. Dal 20/11/2026 notte i limiti valgono solo in modalita' pratica (li applica l'hook):
  //    "allowNonWorkspaceAccess" NON viene piu' imposto a false, perche' fuori dalle pratiche agy deve lavorare
  //    come di consueto; in modalita' pratica la lettura fuori cartella la nega comunque l'hook.
  const fSet = path.join(gem, "antigravity-cli", "settings.json");
  const testoSet = leggi(fSet);
  let set = {};
  if (testoSet != null && testoSet.trim()) { try { set = JSON.parse(testoSet); } catch (e) { set = null; } }
  if (!set) fatto.push("ATTENZIONE: settings.json di agy non valido, non modificato");
  // permesso di usare SOLO le fonti di In Iure senza conferme (in modalita' -p agy nega cio' che non e' in allow;
  // l'"allow" dell'hook non basta: verificato con agy 1.5.11 il 20/11/2026)
  if (set) {
    const perm = set.permissions && typeof set.permissions === "object" ? set.permissions : {};
    const allow = Array.isArray(perm.allow) ? perm.allow.slice() : [];
    let cambiato = false;
    SERVER.forEach(n => { const r = "mcp(" + n + "/*)"; if (allow.indexOf(r) < 0) { allow.push(r); cambiato = true; } });
    if (cambiato) {
      set.permissions = Object.assign({}, perm, { allow });
      fs.mkdirSync(path.dirname(fSet), { recursive: true });
      fs.writeFileSync(fSet, JSON.stringify(set, null, 2) + "\n");
      fatto.push("permessi delle fonti In Iure");
    }
  }

  // 5. fonti globali: i server di In Iure (gli altri restano scritti, ma l'hook ne nega l'uso)
  const fMcp = path.join(cfg, "mcp_config.json");
  const testoMcp = leggi(fMcp);
  let mcp = {};
  if (testoMcp != null && testoMcp.trim()) {
    try { mcp = JSON.parse(testoMcp); } catch (e) { fs.copyFileSync(fMcp, fMcp + ".non-valido-" + Date.now()); mcp = {}; fatto.push("mcp_config.json non valido (copia conservata)"); }
  }
  if (!mcp || typeof mcp !== "object") mcp = {};
  mcp.mcpServers = Object.assign({}, mcp.mcpServers || {}, serverInIure(home));
  const nuovoMcp = JSON.stringify(mcp, null, 2) + "\n";
  if (leggi(fMcp) !== nuovoMcp) {   // avvisi solo quando la configurazione cambia (niente ripetizioni a ogni avvio)
    fs.writeFileSync(fMcp, nuovoMcp); fatto.push("fonti (mcp_config.json)");
    const estranei = Object.keys(mcp.mcpServers).filter(k => SERVER.indexOf(k) < 0);
    if (estranei.length) fatto.push("server non ammessi presenti ma bloccati dall'hook: " + estranei.join(", "));
    if (!mcp.mcpServers.normattiva) fatto.push("ATTENZIONE: server Normattiva non installato su questo PC (Documents/MCP/Normattiva-MCP)");
  }

  // 6. skill di In Iure (solo In-Iure-Gemini/skill: mai le skill di Claude dello studio)
  const sorg = path.join(GEMINI_DIR, "skill"), dest = path.join(cfg, "skills");
  if (fs.existsSync(sorg)) {
    for (const d of fs.readdirSync(sorg, { withFileTypes: true })) {
      if (!d.isDirectory() || !fs.existsSync(path.join(sorg, d.name, "SKILL.md"))) continue;
      for (const nf of fs.readdirSync(path.join(sorg, d.name))) {
        const da = path.join(sorg, d.name, nf);
        if (!fs.statSync(da).isFile()) continue;
        fs.mkdirSync(path.join(dest, d.name), { recursive: true });
        scriviSeDiverso(path.join(dest, d.name, nf), fs.readFileSync(da, "utf8"), "skill In Iure");
      }
    }
  }
  return fatto;
}

module.exports = { installa };

if (require.main === module) {
  const iH = process.argv.indexOf("--home");
  const home = iH > 0 ? path.resolve(process.argv[iH + 1]) : os.homedir();
  const fatto = installa(home);
  console.log("Perimetro di Antigravity: " + (fatto.length ? "aggiornato (" + fatto.join(", ") + ")" : "gia' attivo"));
}
