/* Hook globale "PreToolUse" di Antigravity CLI (agy): l'agente lavora SOLO sulla cartella in cui e' stato avviato
 * (piu' quelle aggiunte con --add-dir). Fuori da li' puo' andare solo per normativa e giurisprudenza.
 *  - strumenti su file (lettura, elenco, ricerca, scrittura): percorsi solo dentro la cartella di lavoro;
 *  - comandi di sistema: negati se nominano percorsi fuori dalla cartella, "..", la home o variabili di percorso;
 *  - pagine web (read_url, browser): solo i domini di normativa e sentenze elencati in limita-cartella.json.
 * Dal 20/11/2026 sera (richiesta dell'utente: "scrivendo solo agy deve partire con le regole e le fonti") vale
 * ovunque la stessa disciplina dell'assistente In Iure:
 *  - fonti MCP: SOLO i server in "serverAmmessi" (Normattiva, SentenzeWeb del Ministero, l'app In Iure come ausilio,
 *    i documenti della pratica); ogni altro server e' negato;
 *  - ricerca web generica e generazione di immagini: negate;
 *  - comandi di sistema e scrittura di file: negati (si salva solo in Word con salva_documento_word, che controlla le
 *    citazioni), salvo "consentiComandi" / "consentiScrittura" a true in limita-cartella.json.
 * Collegato da ~/.gemini/config/hooks.json. Configurazione: limita-cartella.json (stessa cartella).
 * Registro delle decisioni: limita-cartella.log (stessa cartella). */
"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");

const HOME = os.homedir();
const AGY = path.join(HOME, ".gemini", "antigravity-cli");
let conf = {};
try { conf = JSON.parse(fs.readFileSync(path.join(__dirname, "limita-cartella.json"), "utf8")); } catch (e) { /* default */ }
const espandi = p => String(p).replace(/^~(?=[\\/]|$)/, HOME).replace(/%([^%]+)%/g, (m, v) => process.env[v] || m);
const DOMINI = (conf.dominiGiuridici || []).map(d => String(d).toLowerCase());
const SERVER = (conf.serverAmmessi || ["normattiva", "sentenzeweb", "in-iure", "pratica"]).map(x => String(x).toLowerCase());
const FONTI = "fuori dalla cartella puoi usare SOLO la normativa di Normattiva (server normattiva) e la giurisprudenza dei siti ufficiali del Ministero della Giustizia (server sentenzeweb)";

function esci(decisione, motivo, extra) {
  const out = Object.assign({ decision: decisione }, motivo ? { reason: motivo } : {}, extra || {});
  try {
    fs.appendFileSync(path.join(__dirname, "limita-cartella.log"),
      new Date().toISOString() + " " + decisione + " " + (globalThis.__nome || "?") + " " + (motivo || "") + "\n");
  } catch (e) { /* registro facoltativo */ }
  process.stdout.write(JSON.stringify(out));
  process.exit(0);
}

function norm(p, base) {
  let s = String(p).trim().replace(/^["']+|["']+$/g, "");
  s = s.replace(/^file:\/\/\/?/i, "");
  s = espandi(s);
  let r = path.resolve(base || process.cwd(), s);
  try { r = fs.realpathSync.native(r); } catch (e) { /* inesistente: si usa il percorso risolto */ }
  return r.replace(/[\\/]+$/, "").toLowerCase();
}
const dentro = (p, radici) => radici.some(r => p === r || p.startsWith(r + path.sep));

// Valori degli argomenti: agy li passa spesso come stringhe JSON ("\"G:/...\"").
function valori(o, chiave, acc) {
  if (o == null) return acc;
  if (typeof o === "string") {
    let v = o;
    if (/^\s*["\[{]/.test(v)) { try { const j = JSON.parse(v); if (typeof j !== "string") return valori(j, chiave, acc); v = j; } catch (e) { /* stringa semplice */ } }
    acc.push({ chiave: chiave || "", valore: v });
  } else if (Array.isArray(o)) o.forEach(x => valori(x, chiave, acc));
  else if (typeof o === "object") for (const [k, v] of Object.entries(o)) valori(v, k, acc);
  return acc;
}
const ASSOLUTO = /^(?:[a-z]:(?:[\\/]|$)|\\\\|\/|~[\\/]|file:)/i;
const CHIAVE_PERCORSO = /path|dir|file|folder|root|cwd|uri|target|location/i;

let dati = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", c => { dati += c; });
process.stdin.on("end", () => {
  let inp = {};
  try { inp = JSON.parse(dati); } catch (e) { esci("deny", "Hook limita-cartella: richiesta non leggibile."); }
  const tc = inp.toolCall || {};
  const nome = String(tc.name || "").toLowerCase();
  globalThis.__nome = nome;
  const args = valori(tc.args || {}, "", []);

  const cwd = inp.cwd || (inp.workspacePaths || [])[0] || "";
  const lavoro = [].concat(inp.workspacePaths || [], cwd ? [cwd] : []).filter(Boolean).map(p => norm(p)).filter((p, i, a) => a.indexOf(p) === i);
  if (!lavoro.length) esci("deny", "Cartella di lavoro sconosciuta: avvia agy dalla cartella della pratica.");
  // cartelle sempre leggibili: quelle di lavoro, lo spazio di questa conversazione, skill incorporate e globali
  const lettura = lavoro.concat([
    inp.artifactDirectoryPath, inp.conversationId && path.join(AGY, "brain", inp.conversationId),
    path.join(AGY, "builtin"), path.join(HOME, ".gemini", "config", "skills"), path.join(HOME, ".gemini", "config", "plugins"),
    path.join(AGY, "mcp"),   // descrizioni degli strumenti MCP (agy le legge prima di chiamarli)
  ].concat((conf.cartelleExtra || []).map(espandi)).filter(Boolean).map(p => norm(p)));
  const fuoriMsg = "e' fuori dalla cartella della pratica (" + lavoro.join(", ") + "). Lavora solo sui documenti di questa cartella; " +
    "fuori puoi consultare solo la normativa (Normattiva) e la giurisprudenza (siti ufficiali del Ministero della Giustizia).";

  // 0) fonti MCP: solo i server ammessi. agy 1.5.11 chiama gli strumenti MCP con un nome proprio
  //    ("mcp_<server>_<strumento>") o con call_mcp_tool e il nome del server negli argomenti.
  if (/mcp/.test(nome)) {
    const a = tc.args && typeof tc.args === "object" ? tc.args : {};
    globalThis.__nome = nome + " " + String(a.ServerName || "") + "/" + String(a.ToolName || "");   // solo i nomi nel registro, mai i testi
    let srv = "";
    for (const k of Object.keys(a)) if (/server/i.test(k)) srv = String(valori(a[k], k, [])[0] ? valori(a[k], k, [])[0].valore : "");
    if (!srv) { const m = /^mcp_?(.+)$/.exec(nome); if (m) srv = (SERVER.filter(x => m[1].indexOf(x.replace(/-/g, "_")) === 0 || m[1].indexOf(x) === 0)[0] || m[1]); }
    srv = srv.toLowerCase().trim();
    if (SERVER.indexOf(srv) >= 0) esci("allow");
    esci("deny", "Fonte non ammessa (" + (srv || nome) + "): " + FONTI + "; per i fatti, solo i documenti della cartella (server pratica).");
  }
  if (/search_web|web_search|google|websearch/.test(nome))
    esci("deny", "Ricerca web disattivata: " + FONTI + ".");
  if (/generate_image|image_gen/.test(nome)) esci("deny", "Generazione di immagini disattivata in questo assistente giuridico.");

  // 1) pagine web e browser: solo domini di normativa e giurisprudenza
  if (/url|browser|fetch/.test(nome)) {
    const urls = args.map(a => a.valore).filter(v => /^https?:\/\//i.test(v));
    for (const u of urls) {
      let host = "";
      try { host = new URL(u).hostname.toLowerCase(); } catch (e) { /* url non valido */ }
      if (!DOMINI.some(d => host === d || host.endsWith("." + d)))
        esci("deny", "Sito non consentito (" + (host || u) + "): fuori dalla cartella puoi consultare solo la normativa su Normattiva e la giurisprudenza sui siti ufficiali del Ministero della Giustizia (" + DOMINI.join(", ") + ").");
    }
    if (!urls.length && /browser/.test(nome)) esci("ask");
    esci("ask");
  }

  // 2) comandi di sistema: niente percorsi fuori dalla cartella
  if (/command|terminal|shell|exec/.test(nome)) {
    if (!conf.consentiComandi) esci("deny", "Comandi di sistema disattivati: usa gli strumenti delle fonti (normattiva, sentenzeweb, in-iure) e quelli della pratica (elenca_documenti, leggi_documento, cerca_nei_documenti, salva_documento_word).");
    const cmd = args.map(a => a.valore).join(" \n ");
    if (/(^|[\s"'\\/(])\.\.(?=[\\/\s"')]|$)/.test(cmd)) esci("deny", "Il comando risale alle cartelle superiori (\"..\"), che " + fuoriMsg);
    if (/\$env:|\$home\b|%[a-z_]+%|\[environment\]|getfolderpath|(^|[\s"'])~(?=[\\/\s"']|$)|\\\\[a-z0-9]/i.test(cmd))
      esci("deny", "Il comando usa variabili di percorso o percorsi di rete: indica percorsi dentro la cartella della pratica, che altrimenti " + fuoriMsg);
    const strumenti = lettura.concat([
      process.env.ProgramFiles, process.env["ProgramFiles(x86)"], process.env.SystemRoot,
      path.join(process.env.LOCALAPPDATA || "", "Programs"), path.join(process.env.LOCALAPPDATA || "", "agy"),
    ].concat((conf.cartelleStrumenti || []).map(espandi)).filter(Boolean).map(p => norm(p)));
    const cand = [];
    cmd.replace(/"([^"]*)"|'([^']*)'/g, (m, a, b) => { cand.push(a != null ? a : b); return " "; })
      .split(/[\s;|&<>(),=]+/).forEach(t => cand.push(t));
    for (const c of cand) {
      const t = c.trim();
      if (!t) continue;
      let p = null;
      if (/^[a-z]:(?:[\\/]|$)/i.test(t)) p = t;
      else if (/^[a-z]:[^\\/]/i.test(t) && !/^[a-z]{2,}:/i.test(t)) p = t.slice(0, 2) + "\\" + t.slice(2);
      if (p && !dentro(norm(p), strumenti)) esci("deny", "Il percorso " + t + " " + fuoriMsg);
    }
    esci("ask");
  }

  // 3) strumenti su file: tutti i percorsi devono stare nella cartella di lavoro
  const percorsi = args.filter(a => a.valore && (ASSOLUTO.test(a.valore.trim()) || (CHIAVE_PERCORSO.test(a.chiave) && !/^https?:/i.test(a.valore))))
    .map(a => a.valore);
  if (!percorsi.length) esci("ask");
  const scrittura = /write|edit|replace|create|delete|move|rename|save/.test(nome);
  if (scrittura && !conf.consentiScrittura) esci("deny", "Scrittura di file disattivata: pareri e atti si salvano SOLO in Word con salva_documento_word (server pratica), che controlla prima le citazioni.");
  for (const p of percorsi) {
    const n = norm(p, cwd);
    if (!dentro(n, scrittura ? lavoro : lettura)) esci("deny", "Il percorso " + p + " " + fuoriMsg);
  }
  esci(scrittura ? "ask" : "allow");
});
