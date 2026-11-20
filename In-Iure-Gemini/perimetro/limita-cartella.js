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
 * Dal 20/11/2026 notte (richiesta dell'utente: "i limiti valgano solo quando lavora sulle pratiche; lo ricava da cio'
 * che gli chiedo") i limiti valgono SOLO in MODALITA' PRATICA, che scatta quando:
 *  - la richiesta dell'utente (campo lastUserInput che agy passa agli hook) riguarda lavoro giuridico: fascicolo,
 *    pratica, atti, pareri, ricerche di normativa o giurisprudenza e simili (parole in PAROLE_GIURIDICHE o in
 *    "paroleGiuridiche" di limita-cartella.json);
 *  - oppure l'agente usa una fonte di In Iure (normattiva, sentenzeweb, in-iure, pratica);
 *  - oppure agy e' stato avviato da In-Iure-Gemini (lanciatori) o da una cartella con "In Iure - elaborati".
 * Una volta scattata, vale per TUTTA la conversazione (file in stato-conversazioni/): "continua" o "salvalo" non la
 * spengono. Fuori dalla modalita' pratica agy lavora come di consueto (letture consentite, il resto con conferma).
 * Lo stesso script, come hook PreInvocation, avvisa il modello (e l'utente) quando la modalita' pratica si attiva.
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

/* ---------------------------------------------------------------- modalita' pratica */
const PAROLE_GIURIDICHE = new RegExp([
  // comandi dello studio (skill di In Iure richiamate con /nome)
  "^\\s*/(fascicolo|atto|parere|giurisprudenza|normativa|replica|lettera|scadenze|controlla-citazioni|redazione-atto|lavoro-sulla-pratica|stile-atti)\\b",
  "fascicol", "\\bpratic[ah]e?\\b", "\\bpareri?\\b", "\\batt[oi] (giudiziar|di |introdutt|difensiv|processual)", "\\batto\\b",
  "citazione", "\\bricors", "comparsa", "memori[ae] (difensiv|integrativ|di replica|ex art|conclusional|171)", "conclusional",
  "\\bappello\\b", "diffida", "precetto", "pignorament", "decreto ingiuntivo", "ingiunzion", "opposizione",
  "sentenz", "ordinanz", "giurisprudenz", "cassazione", "massim[ae] (giurisprud|della cassazione|ufficial)", "precedent[ie] giurispr",
  "normativ", "\\bnorm[ae]\\b", "\\bart(t)?\\.\\s*\\d", "\\barticol[oi]\\s+\\d", "codice civile", "codice penale", "procedura civile",
  "procedura penale", "\\bc\\.\\s?c\\.", "\\bc\\.\\s?p\\.", "\\blegge\\b", "d\\.\\s?lgs", "decreto legislativo", "d\\.\\s?p\\.\\s?r",
  "tribunale", "corte d'appello", "\\bgiudic[ei]\\b", "udienz", "\\bcausa (civile|penale|di lavoro|pendente)", "controparte",
  "risarciment", "responsabilita' (civile|contrattuale|extracontrattuale|medica|professionale)", "responsabilita (civile|contrattuale|extracontrattuale|medica|professionale)",
  "contratt", "inadempiment", "prescrizion", "decadenz", "notifica (dell|del ricorso|a mezzo)", "procura alle liti", "mediazione", "negoziazione assistita",
  "separazion", "divorzi", "success(ione|orio)", "eredit", "locazion", "sfratt", "condomini", "usucapion", "servitu",
  "normattiva", "sentenzeweb", "italgiure", "in iure", "avvocat", "\\blegale\\b", "giuridic", "diritto (civile|penale|del lavoro|amministrativo|tributario)",
].join("|"), "i");
function senzaAccenti(t) { return String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’]/g, "'"); }
function serverDi(tc, nome) {
  const a = tc.args && typeof tc.args === "object" ? tc.args : {};
  let srv = "";
  for (const k of Object.keys(a)) if (/server/i.test(k)) { const v = valori(a[k], k, [])[0]; srv = v ? String(v.valore) : ""; }
  if (!srv) { const m = /^mcp_?(.+)$/.exec(nome); if (m) srv = (SERVER.filter(x => m[1].indexOf(x.replace(/-/g, "_")) === 0 || m[1].indexOf(x) === 0)[0] || m[1]); }
  return srv.toLowerCase().trim();
}
function motivoPratica(inp, srv) {
  const cwd = inp.cwd || (inp.workspacePaths || [])[0] || "";
  if (cwd && fs.existsSync(path.join(cwd, "configura.js")) && fs.existsSync(path.join(cwd, "agy-impostazioni.json"))) return "avvio dall'assistente In Iure";
  if ([].concat(inp.workspacePaths || [], cwd ? [cwd] : []).some(p => p && fs.existsSync(path.join(p, "In Iure - elaborati")))) return "cartella con elaborati di In Iure";
  if (srv && SERVER.indexOf(srv) >= 0) return "uso delle fonti giuridiche (" + srv + ")";
  const testo = senzaAccenti(inp.lastUserInput);
  let extra = null;
  if (Array.isArray(conf.paroleGiuridiche) && conf.paroleGiuridiche.length) { try { extra = new RegExp(conf.paroleGiuridiche.join("|"), "i"); } catch (e) { extra = null; } }
  const m = PAROLE_GIURIDICHE.exec(testo) || (extra && extra.exec(testo));
  return m ? "richiesta giuridica (\"" + m[0].trim() + "\")" : "";
}
const STATO = path.join(__dirname, "stato-conversazioni");
function statoFile(inp) { const c = String(inp.conversationId || "").replace(/[^A-Za-z0-9-]/g, ""); return c ? path.join(STATO, c + ".json") : ""; }
function statoLeggi(inp) { const f = statoFile(inp); try { return f ? JSON.parse(fs.readFileSync(f, "utf8")) : {}; } catch (e) { return {}; } }
function statoScrivi(inp, o) {
  const f = statoFile(inp); if (!f) return;
  try {
    fs.mkdirSync(STATO, { recursive: true });
    fs.writeFileSync(f, JSON.stringify(o));
    if (Math.random() < 0.05) for (const n of fs.readdirSync(STATO)) {   // pulizia: conversazioni piu' vecchie di 60 giorni
      const p = path.join(STATO, n); if (Date.now() - fs.statSync(p).mtimeMs > 60 * 86400000) fs.unlinkSync(p);
    }
  } catch (e) { /* facoltativo */ }
}
const AVVISO_MODELLO = "MODALITA' PRATICA ATTIVA in questa conversazione. Da ora valgono le regole del perimetro e dell'assistente In Iure " +
  "(regola globale GEMINI.md): solo i documenti della cartella di lavoro (server pratica); normativa SOLO ED ESCLUSIVAMENTE da Normattiva " +
  "(server normattiva); giurisprudenza SOLO ED ESCLUSIVAMENTE dai siti ufficiali del Ministero della Giustizia (server sentenzeweb); " +
  "l'app In Iure solo come ausilio; niente ricerca web, comandi o scrittura di file (pareri e atti solo con salva_documento_word). " +
  "Un controllo automatico blocca tutto il resto.";
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

  // modalita' pratica: una volta attivata vale per tutta la conversazione
  const evento = inp.hookEventName || (inp.toolCall ? "PreToolUse" : "");
  const srvMcp = /mcp/.test(nome) ? serverDi(tc, nome) : "";
  const st = statoLeggi(inp);
  const motivo = st.pratica ? st.motivo : motivoPratica(inp, srvMcp);
  if (motivo && !st.pratica) statoScrivi(inp, { pratica: true, motivo, t: new Date().toISOString() });
  if (evento && evento !== "PreToolUse") {   // PreInvocation / SessionStart: avviso al modello e all'utente, una volta sola
    if (motivo && !st.annunciato) {
      statoScrivi(inp, { pratica: true, motivo, t: st.t || new Date().toISOString(), annunciato: true });
      process.stdout.write(JSON.stringify({ injectSteps: [{ systemMessage: { systemMessage: AVVISO_MODELLO,
        metadata: { user_markdown: "**In Iure - modalita' pratica attiva** (" + motivo.replace(/[*_`]/g, "") + "): solo i documenti della cartella, normativa da Normattiva, giurisprudenza dai siti del Ministero." } } }] }));
    } else process.stdout.write("{}");
    process.exit(0);
  }
  if (!motivo) {   // fuori dalla modalita' pratica: Antigravity lavora come di consueto
    globalThis.__nome = nome + " [libero]";
    if (/^(read_|view_|list_|grep|find_|glob)/.test(nome) && !/write|edit|replace|delete|move|rename/.test(nome)) esci("allow");
    esci("ask");
  }
  globalThis.__nome = nome + " [pratica]";

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
    globalThis.__nome = nome + " [pratica] " + String(a.ServerName || "") + "/" + String(a.ToolName || "");   // solo i nomi nel registro, mai i testi
    const srv = srvMcp;
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
