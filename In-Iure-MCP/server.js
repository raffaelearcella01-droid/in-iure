#!/usr/bin/env node
/* In Iure - server MCP (stdio) per Gemini CLI e altri client MCP.
 *
 * Legge DIRETTAMENTE i file dell'app (Sito web/In-Iure/js): codici, indice e modelli di atti.
 * Quando AGGIORNA_NORMATIVA.bat rigenera quei file, il server se ne accorge (data di modifica)
 * e ricarica i testi alla richiesta successiva: non serve riavviarlo ne' aggiornarlo a parte.
 * Nessuna dipendenza esterna, nessun accesso alla rete.
 *
 * Cartella dati diversa: variabile d'ambiente IN_IURE_JS (percorso della cartella js).
 */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const JS_DIR = process.env.IN_IURE_JS || path.resolve(__dirname, "..", "In-Iure", "js");
const VERSIONE = "1.0.0";

/* ------------------------------------------------------------------ dati */
let cache = null;           // { firma, codici, perId, atti }

function firmaFile() {
  // impronta "economica": nome + data di modifica + dimensione di ogni file letto
  const files = [path.join(JS_DIR, "codici-index.js"), path.join(JS_DIR, "data-atti.js"), path.join(JS_DIR, "data-atti-extra.js")];
  const dir = path.join(JS_DIR, "codici");
  for (const f of fs.readdirSync(dir).sort()) if (f.endsWith(".js")) files.push(path.join(dir, f));
  return files.map(f => { try { const s = fs.statSync(f); return f + ":" + s.mtimeMs + ":" + s.size; } catch (e) { return f + ":-"; } }).join("|");
}

function eseguiFile(file, ctx) {
  vm.runInContext(fs.readFileSync(file, "utf8"), ctx, { filename: file });
}

function carica() {
  const firma = firmaFile();
  if (cache && cache.firma === firma) return cache;
  const registrati = [];
  const ctx = vm.createContext({ registerCodice: c => registrati.push(c) });
  ctx.window = ctx;
  eseguiFile(path.join(JS_DIR, "codici-index.js"), ctx);
  const indice = Array.isArray(ctx.CODICI_INDEX) ? ctx.CODICI_INDEX : [];
  for (const f of fs.readdirSync(path.join(JS_DIR, "codici")).sort())
    if (f.endsWith(".js")) eseguiFile(path.join(JS_DIR, "codici", f), ctx);
  for (const f of ["data-atti.js", "data-atti-extra.js"])
    if (fs.existsSync(path.join(JS_DIR, f))) eseguiFile(path.join(JS_DIR, f), ctx);

  const perIdReg = {};
  for (const c of registrati) perIdReg[c.id] = c;
  // stesso ordine dell'app (indice), poi eventuali codici non indicizzati
  const ordine = indice.map(i => i.id).concat(registrati.map(c => c.id).filter(id => !indice.some(i => i.id === id)));
  const codici = [];
  for (const id of ordine) {
    const c = perIdReg[id];
    if (!c) continue;
    const meta = indice.find(i => i.id === id) || {};
    const articoli = (c.articoli || []).map(a => ({
      num: String(a.num), rubrica: a.rubrica || "", commi: a.commi || [], note: a.note || null,
      _testo: norm([a.rubrica || "", (a.commi || []).join(" ")].join(" ")),
      _rub: norm(a.rubrica || ""),
    }));
    codici.push({
      id, nome: c.nome, abbr: c.abbr, categoria: c.categoria, descrizione: c.descrizione,
      aggiornato: c.aggiornato || meta.aggiornato || "", verificato: meta.verificato || "",
      fonte: c.fonte || "Normattiva", urn: meta.urn || "", articoli,
    });
  }
  const perId = {};
  for (const c of codici) perId[c.id] = c;
  const atti = [].concat(Array.isArray(ctx.ATTI) ? ctx.ATTI : [], Array.isArray(ctx.ATTI_EXTRA) ? ctx.ATTI_EXTRA : [])
    .map(a => Object.assign({}, a, { _testo: norm([a.nome, a.categoria, a.descrizione, a.guida, (a.tags || []).join(" ")].join(" ")) }));
  cache = { firma, codici, perId, atti, caricato: new Date().toISOString() };
  return cache;
}

/* ------------------------------------------------------------- utilita' */
function norm(s) {
  return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[’`]/g, "'").replace(/\s+/g, " ").trim();
}

const SUFFISSI = "bis|ter|quater|quinquies|sexies|septies|octies|novies|nonies|decies|undecies|duodecies|terdecies|quaterdecies|quinquiesdecies|sexiesdecies|septiesdecies|octiesdecies";

function normArticolo(s) {
  let x = norm(s).replace(/^(art(icolo)?\.?\s*)/, "").replace(/[,;]$/, "").trim();
  x = x.replace(new RegExp("^(\\d+)\\s*[-\\s]?\\s*(" + SUFFISSI + ")\\b", "i"), "$1-$2");
  return x.replace(/\s+/g, "-");
}

// sinonimi diffusi -> id dell'app
const ALIAS = {
  "cc": "codice-civile", "codicecivile": "codice-civile", "cp": "codice-penale", "codicepenale": "codice-penale",
  "cpc": "cpc", "codicediproceduracivile": "cpc",
  "cpp": "cpp", "codicediprocedurapenale": "cpp", "cost": "costituzione", "costituzione": "costituzione",
  "cds": "cds", "codicedellastrada": "cds", "cpa": "cpa", "preleggi": "preleggi", "dispprelcc": "preleggi",
  "dispattcc": "disp-att-cc", "dispattcpc": "disp-att-cpc", "dispattcpp": "disp-att-cpp",
  "l2411990": "l241", "legge2411990": "l241", "dlgs2312001": "dlgs231", "ccii": "crisi-impresa",
  "codicedellacrisi": "crisi-impresa", "codiceprivacy": "privacy", "gdpr": "privacy", "codicedelconsumo": "consumo",
  "codiceantimafia": "antimafia", "leggepinto": "legge-pinto", "leggedivorzio": "legge-divorzio",
  "statutodeilavoratori": "statuto-lavoratori", "tusl": "tu-sicurezza-lavoro", "dlgs812008": "tu-sicurezza-lavoro",
  "tuedilizia": "tu-edilizia", "dpr3802001": "tu-edilizia", "op": "ord-penitenziario", "ordpen": "ord-penitenziario",
};
const compatto = s => norm(s).replace(/[^a-z0-9]/g, "");

function trovaCodice(q) {
  const d = carica();
  if (!q) return null;
  if (d.perId[q]) return d.perId[q];
  const k = compatto(q);
  if (ALIAS[k] && d.perId[ALIAS[k]]) return d.perId[ALIAS[k]];
  for (const c of d.codici) if (compatto(c.id) === k || compatto(c.abbr) === k || compatto(c.nome) === k) return c;
  const parziali = d.codici.filter(c => compatto(c.nome).includes(k) || compatto(c.abbr).includes(k));
  return parziali.length === 1 ? parziali[0] : null;
}

function elencoIdCodici() {
  return carica().codici.map(c => c.id + " (" + c.abbr + ")").join(", ");
}

function linkNormattiva(c) {
  return c.urn ? "https://www.normattiva.it/uri-res/N2Ls?" + c.urn : "";
}

function testoArticolo(c, a) {
  const righe = [];
  righe.push("Art. " + a.num + " " + c.abbr + (a.rubrica ? " - " + a.rubrica : ""));
  righe.push("[" + c.nome + " - fonte: " + c.fonte + "; ultima modifica in vigore: " + (c.aggiornato || "n.d.") +
    "; testo verificato il " + (c.verificato || "n.d.") + "]");
  righe.push("");
  righe.push(a.commi.length ? a.commi.join("\n\n") : "(articolo senza testo nella fonte ufficiale)");
  if (a.note) {
    const note = Array.isArray(a.note) ? a.note.join("\n") : String(a.note);
    righe.push("", "Note di aggiornamento (dalla fonte ufficiale):", note.replace(/\n\s*\n\s*/g, "\n").trim());
  }
  return righe.join("\n");
}

function estratto(testoOriginale, termini, lung) {
  const t = String(testoOriginale).replace(/\s+/g, " ");
  const n = norm(t);
  let pos = -1;
  for (const term of termini) { pos = n.indexOf(term); if (pos >= 0) break; }
  if (pos < 0) pos = 0;
  const inizio = Math.max(0, pos - Math.floor(lung / 3));
  return (inizio > 0 ? "..." : "") + t.slice(inizio, inizio + lung) + (inizio + lung < t.length ? "..." : "");
}

function terminiRicerca(q) {
  const frasi = [];
  let resto = String(q || "").replace(/"([^"]+)"/g, (m, f) => { frasi.push(norm(f)); return " "; });
  const STOP = new Set("il lo la i gli le un uno una di a da in con su per tra fra e o ed od che del dello della dei degli delle al allo alla ai agli alle dal dallo dalla dai dagli dalle nel nello nella nei negli nelle sul sullo sulla sui sugli sulle cosa come quale quali quando art articolo".split(" "));
  const parole = norm(resto).split(/[^a-z0-9'*-]+/).map(w => w.replace(/^'+|'+$/g, "")).filter(w => w.length > 1 && !STOP.has(w));
  return { frasi, parole };
}

function corrisponde(testo, termine) {
  if (termine.endsWith("*")) return testo.includes(termine.slice(0, -1));
  return new RegExp("(^|[^a-z0-9])" + termine.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).test(testo);
}

/* ---------------------------------------------------------- strumenti */
const STRUMENTI = [
  {
    name: "elenca_codici",
    description: "Elenca i 33 atti normativi contenuti nell'app In Iure (id, abbreviazione, nome, numero di articoli, data dell'ultima modifica in vigore, data di verifica su Normattiva). Usalo per sapere quali fonti sono disponibili e con quale id richiamarle.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "leggi_articolo",
    description: "Restituisce il testo vigente integrale di un articolo, come contenuto nell'app In Iure (fonte Normattiva). Esempi: codice='c.c.' articolo='2043'; codice='cpc' articolo='171 ter'; codice='D.Lgs. 231/2001' articolo='5'.",
    inputSchema: {
      type: "object",
      properties: {
        codice: { type: "string", description: "id o abbreviazione dell'atto (es. codice-civile, c.c., c.p.p., cds, l241). Vedi elenca_codici." },
        articolo: { type: "string", description: "numero dell'articolo, es. 2043, 171-ter, 380-bis.1" },
      },
      required: ["codice", "articolo"], additionalProperties: false,
    },
  },
  {
    name: "elenca_articoli",
    description: "Elenca numero e rubrica degli articoli di un atto dell'app In Iure, eventualmente in un intervallo (da/a, posizioni nell'elenco degli articoli) o filtrando la rubrica per parola. Utile per orientarsi in un codice.",
    inputSchema: {
      type: "object",
      properties: {
        codice: { type: "string", description: "id o abbreviazione dell'atto" },
        dal_articolo: { type: "string", description: "facoltativo: primo articolo da elencare (es. 1321)" },
        quanti: { type: "integer", description: "facoltativo: quanti articoli elencare (default 100, max 400)" },
        filtro_rubrica: { type: "string", description: "facoltativo: parola da cercare nella rubrica" },
      },
      required: ["codice"], additionalProperties: false,
    },
  },
  {
    name: "cerca_norme",
    description: "Ricerca testuale (per parole, non per significato) negli articoli dei codici dell'app In Iure. Restituisce gli articoli che contengono tutte le parole indicate, con un estratto. Usa 1-4 parole chiave, le virgolette per le locuzioni (\"lastrico solare\") e l'asterisco per le varianti (risarci*). Poi leggi gli articoli pertinenti con leggi_articolo.",
    inputSchema: {
      type: "object",
      properties: {
        testo: { type: "string", description: "parole chiave" },
        codice: { type: "string", description: "facoltativo: limita la ricerca a un atto (id o abbreviazione)" },
        max_risultati: { type: "integer", description: "default 15, max 50" },
      },
      required: ["testo"], additionalProperties: false,
    },
  },
  {
    name: "cerca_modelli_atti",
    description: "Cerca tra i modelli di atti dell'app In Iure (sezione Scrittura atti: atti civili, penali, lavoro, amministrativi, procure). Restituisce id, nome, categoria e descrizione.",
    inputSchema: {
      type: "object",
      properties: {
        testo: { type: "string", description: "parole chiave (es. decreto ingiuntivo, opposizione, querela)" },
        max_risultati: { type: "integer", description: "default 15, max 50" },
      },
      required: ["testo"], additionalProperties: false,
    },
  },
  {
    name: "leggi_modello_atto",
    description: "Restituisce un modello di atto dell'app In Iure: guida alla redazione, campi da compilare e testo del modello con i segnaposto {{campo}}.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "id del modello (da cerca_modelli_atti)" } },
      required: ["id"], additionalProperties: false,
    },
  },
];

function nonTrovatoCodice(q) {
  return "Atto \"" + q + "\" non presente nell'app In Iure. Atti disponibili: " + elencoIdCodici() + ".";
}

const GESTORI = {
  elenca_codici() {
    const d = carica();
    const righe = d.codici.map(c => "- " + c.id + " | " + c.abbr + " | " + c.nome + " | " + c.articoli.length +
      " articoli | ultima modifica in vigore: " + (c.aggiornato || "n.d.") + " | verificato su Normattiva: " + (c.verificato || "n.d."));
    return "Atti normativi nell'app In Iure (" + d.codici.length + "), testo vigente da Normattiva:\n" + righe.join("\n");
  },

  leggi_articolo({ codice, articolo }) {
    const c = trovaCodice(codice);
    if (!c) return nonTrovatoCodice(codice);
    const n = normArticolo(articolo);
    let trovati = c.articoli.filter(a => a.num === n);
    if (!trovati.length) trovati = c.articoli.filter(a => a.num.replace(/-/g, "") === n.replace(/-/g, ""));
    if (!trovati.length) {
      const vicini = c.articoli.filter(a => a.num.split(/[-.]/)[0] === n.split(/[-.]/)[0]).map(a => a.num);
      return "L'art. " + articolo + " non e' presente in " + c.abbr + " nell'app In Iure" +
        (vicini.length ? " (articoli con lo stesso numero base: " + vicini.join(", ") + ")" : "") +
        ". Puo' essere abrogato, inesistente o privo di testo nella fonte ufficiale. Non integrarlo con altre fonti.";
    }
    return trovati.map(a => testoArticolo(c, a)).join("\n\n---\n\n") +
      (linkNormattiva(c) ? "\n\nAtto su Normattiva: " + linkNormattiva(c) : "");
  },

  elenca_articoli({ codice, dal_articolo, quanti, filtro_rubrica }) {
    const c = trovaCodice(codice);
    if (!c) return nonTrovatoCodice(codice);
    let lista = c.articoli;
    if (filtro_rubrica) { const f = norm(filtro_rubrica); lista = lista.filter(a => a._rub.includes(f)); }
    let inizio = 0;
    if (dal_articolo) { const n = normArticolo(dal_articolo); const i = lista.findIndex(a => a.num === n); if (i >= 0) inizio = i; }
    const q = Math.min(Math.max(parseInt(quanti || 100, 10) || 100, 1), 400);
    const parte = lista.slice(inizio, inizio + q);
    return c.nome + " (" + c.abbr + ") - " + lista.length + " articoli" + (filtro_rubrica ? " con \"" + filtro_rubrica + "\" nella rubrica" : "") +
      "; mostrati " + parte.length + ":\n" + parte.map(a => "Art. " + a.num + (a.rubrica ? " - " + a.rubrica : "")).join("\n") +
      (inizio + q < lista.length ? "\n(continua: usa dal_articolo=\"" + lista[inizio + q].num + "\")" : "");
  },

  cerca_norme({ testo, codice, max_risultati }) {
    const d = carica();
    let codici = d.codici;
    if (codice) { const c = trovaCodice(codice); if (!c) return nonTrovatoCodice(codice); codici = [c]; }
    const { frasi, parole } = terminiRicerca(testo);
    if (!frasi.length && !parole.length) return "Indica almeno una parola chiave.";
    const max = Math.min(Math.max(parseInt(max_risultati || 15, 10) || 15, 1), 50);
    const ris = [];
    for (const c of codici) for (const a of c.articoli) {
      if (!frasi.every(f => a._testo.includes(f))) continue;
      if (!parole.every(p => corrisponde(a._testo, p))) continue;
      let punti = 0;
      for (const p of parole) punti += corrisponde(a._rub, p) ? 5 : 1;
      for (const f of frasi) punti += a._rub.includes(f) ? 8 : 2;
      ris.push({ c, a, punti });
    }
    if (!ris.length) return "Nessun articolo dell'app In Iure contiene tutte le parole: " + testo +
      ". Prova con meno parole, con l'asterisco (es. risarci*) o con sinonimi.";
    ris.sort((x, y) => y.punti - x.punti);
    const termini = frasi.concat(parole.map(p => p.replace(/\*$/, "")));
    return ris.length + " articoli trovati" + (ris.length > max ? " (mostrati i primi " + max + ")" : "") + ":\n\n" +
      ris.slice(0, max).map(r => "- " + r.c.abbr + " (id " + r.c.id + ") art. " + r.a.num + (r.a.rubrica ? " - " + r.a.rubrica : "") +
        "\n  " + estratto(r.a.commi.join(" "), termini, 260)).join("\n");
  },

  cerca_modelli_atti({ testo, max_risultati }) {
    const d = carica();
    const { frasi, parole } = terminiRicerca(testo);
    const max = Math.min(Math.max(parseInt(max_risultati || 15, 10) || 15, 1), 50);
    const ris = d.atti.map(a => {
      if (!frasi.every(f => a._testo.includes(f))) return null;
      const hit = parole.filter(p => corrisponde(a._testo, p)).length;
      if (parole.length && hit < Math.ceil(parole.length / 2)) return null;
      const nome = norm(a.nome);
      const punti = hit + parole.filter(p => corrisponde(nome, p)).length * 3;
      return { a, punti };
    }).filter(Boolean).sort((x, y) => y.punti - x.punti);
    if (!ris.length) return "Nessun modello di atto trovato per: " + testo;
    return ris.slice(0, max).map(r => "- " + r.a.id + " | " + r.a.nome + " | " + r.a.categoria + "\n  " + r.a.descrizione).join("\n");
  },

  leggi_modello_atto({ id }) {
    const a = carica().atti.find(x => x.id === id);
    if (!a) return "Modello \"" + id + "\" non presente nell'app In Iure. Usa cerca_modelli_atti.";
    const campi = (a.campi || []).map(f => "- {{" + f.id + "}}: " + f.label + (f.placeholder ? " (es. " + f.placeholder + ")" : "")).join("\n");
    return [a.nome + " [" + a.categoria + "]", a.descrizione, "", "GUIDA ALLA REDAZIONE", a.guida || "", "",
      "CAMPI DA COMPILARE", campi, "", "TESTO DEL MODELLO", a.template || ""].join("\n");
  },
};

const ISTRUZIONI = "Server In Iure: testo vigente di 33 atti normativi italiani (fonte Normattiva) e modelli di atti dell'app In Iure. " +
  "Per ogni domanda giuridica cerca e leggi le norme con questi strumenti e fonda la risposta su di esse, citando articolo e atto. " +
  "Se una norma non e' presente nell'app, dillo espressamente invece di ricostruirla a memoria.";

/* ------------------------------------------------------------- MCP stdio */
function invia(msg) { process.stdout.write(JSON.stringify(msg) + "\n"); }
function log(s) { process.stderr.write("[in-iure-mcp] " + s + "\n"); }

function gestisci(msg) {
  const { id, method, params } = msg;
  const risposta = result => { if (id !== undefined && id !== null) invia({ jsonrpc: "2.0", id, result }); };
  const errore = (code, message) => { if (id !== undefined && id !== null) invia({ jsonrpc: "2.0", id, error: { code, message } }); };
  try {
    switch (method) {
      case "initialize":
        return risposta({
          protocolVersion: (params && params.protocolVersion) || "2025-06-18",
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: "in-iure", version: VERSIONE },
          instructions: ISTRUZIONI,
        });
      case "ping": return risposta({});
      case "tools/list": return risposta({ tools: STRUMENTI });
      case "tools/call": {
        const nome = params && params.name;
        const g = GESTORI[nome];
        if (!g) return errore(-32602, "Strumento sconosciuto: " + nome);
        let testo, isError = false;
        try { testo = g((params && params.arguments) || {}); }
        catch (e) { testo = "Errore nella lettura dei dati dell'app In Iure (" + JS_DIR + "): " + e.message; isError = true; log(e.stack); }
        return risposta({ content: [{ type: "text", text: testo }], isError });
      }
      case "resources/list": return risposta({ resources: [] });
      case "prompts/list": return risposta({ prompts: [] });
      default:
        if (method && method.startsWith("notifications/")) return;   // notifiche: nessuna risposta
        return errore(-32601, "Metodo non supportato: " + method);
    }
  } catch (e) { log(e.stack); errore(-32603, e.message); }
}

if (require.main === module) {
  let buf = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", chunk => {
    buf += chunk;
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const riga = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
      if (!riga) continue;
      let msg; try { msg = JSON.parse(riga); } catch (e) { invia({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "JSON non valido" } }); continue; }
      gestisci(msg);
    }
  });
  process.stdin.on("end", () => process.exit(0));
  try { const d = carica(); log("pronto: " + d.codici.length + " atti normativi, " + d.atti.length + " modelli (" + JS_DIR + ")"); }
  catch (e) { log("ATTENZIONE: dati non leggibili in " + JS_DIR + ": " + e.message); }
}

module.exports = { GESTORI, STRUMENTI, carica, normArticolo, trovaCodice };
