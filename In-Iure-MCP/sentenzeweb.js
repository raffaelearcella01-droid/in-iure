#!/usr/bin/env node
/* In Iure - server MCP per SentenzeWeb: l'archivio PUBBLICO e gratuito dei provvedimenti civili e penali
 * della Corte di cassazione (ultimi 5 anni circa), sul portale ItalgiureWeb del Ministero della Giustizia
 * (www.italgiure.giustizia.it/sncass). Nessuna credenziale.
 * Tutte le richieste passano dal limitatore anti-blocco (limitatore.js): una alla volta, distanziate,
 * con tetti orari/giornalieri, pausa automatica ai segnali di fastidio e cache su disco. */
"use strict";
const { avviaServer } = require("./mcp-base");
const { Limitatore, ErroreLimite, scarica } = require("./limitatore");

const SOLR = "https://www.italgiure.giustizia.it/sncass/isapi/hc.dll/sn.solr/sn-collection/select";
const PDF = "https://www.italgiure.giustizia.it/xway/application/nif/clean/hc.dll?verbo=attach&db=";
const CACHE_RICERCHE_MS = 24 * 3600 * 1000;
const PARTE_CAR = 12000;
const lim = new Limitatore("sentenzeweb");

/* ---------------------------------------------------------------- utilita' */
function query(params) {
  const u = new URLSearchParams();
  u.append("app.query", "");
  for (const [k, v] of Object.entries(params)) (Array.isArray(v) ? v : [v]).forEach(x => u.append(k, String(x)));
  u.append("wt", "json");
  return SOLR + "?" + u.toString();
}

async function solr(params, durataCache) {
  const url = query(params);
  try {
    return await lim.conCache({ url }, durataCache, async () => {
      const r = await scarica(url);
      const j = await r.json();
      if (!j.response) throw new Error("risposta inattesa da SentenzeWeb");
      return j;
    });
  } catch (e) {
    if (e instanceof ErroreLimite) { e.silenzioso = true; throw e; }
    throw new Error("SentenzeWeb non ha risposto correttamente: " + e.message);
  }
}

const SPECIALI = /[+\-&|!(){}[\]^~?:\\\/]/g;
function testoInQuery(testo) {
  const pezzi = String(testo || "").match(/"[^"]+"|\S+/g) || [];
  const out = [];
  for (const p of pezzi) {
    if (/^(AND|OR|NOT)$/.test(p)) { out.push(p); continue; }
    if (p.startsWith('"')) { out.push('"' + p.slice(1, -1).replace(/["\\]/g, " ").trim() + '"'); continue; }
    const w = p.replace(SPECIALI, " ").trim();
    if (w) w.split(/\s+/).forEach(x => out.push(x));
  }
  const unite = [];
  for (let i = 0; i < out.length; i++) {
    unite.push(out[i]);
    const ora = out[i], dopo = out[i + 1];
    if (dopo && !/^(AND|OR|NOT)$/.test(ora) && !/^(AND|OR|NOT)$/.test(dopo)) unite.push("AND");
  }
  return unite.join(" ");
}

const ARCHIVI = { civile: "snciv", penale: "snpen" };
const data = s => (s && s.length === 8) ? s.slice(6, 8) + "/" + s.slice(4, 6) + "/" + s.slice(0, 4) : (s || "");
const primo = v => Array.isArray(v) ? v[0] : v;

function sezione(sz) {
  if (!sz) return "";
  if (sz === "U") return "Sez. U";
  return "Sez. " + sz;
}

function estremi(d) {
  const arch = d.kind === "snpen" ? "pen." : "civ.";
  const num = String(d.numdec || "").replace(/^0+/, "");
  return "Cass. " + arch + ", " + sezione(d.szdec) + ", " + (d.tipoprov || "provvedimento") + " n. " + num + "/" + d.anno +
    (d.datdec ? ", decisa il " + data(d.datdec) : "") + (primo(d.datdep) ? ", depositata il " + data(primo(d.datdep)) : "");
}

function linkPdf(d) {
  const f = primo(d.filename);
  if (!f) return "";
  return PDF + d.kind + "&id=" + (f.indexOf(".clean.") > 0 ? f : f.replace(".pdf", ".clean.pdf"));
}

function filtri({ archivio, anno_da, anno_a, sezione: sz, tipo }) {
  const fq = [];
  const a = (archivio || "entrambi").toLowerCase();
  if (ARCHIVI[a]) fq.push("kind:" + ARCHIVI[a]); else fq.push("kind:(snciv OR snpen)");
  if (anno_da || anno_a) fq.push("anno:[" + (parseInt(anno_da, 10) || "*") + " TO " + (parseInt(anno_a, 10) || "*") + "]");
  if (sz) { const s = String(sz).toUpperCase().replace(/^SEZ\.?\s*/, "").replace(/^UNITE$/, "U"); fq.push('szdec:"' + s.replace(/"/g, "") + '"'); }
  if (tipo) fq.push('tipoprov:"' + String(tipo).replace(/"/g, "") + '"');
  return fq;
}

const FL = "id,kind,szdec,anno,numdec,datdec,datdep,tipoprov,materia,filename,presidente,relatore";

/* ---------------------------------------------------------------- strumenti */
const STRUMENTI = [
  {
    name: "cerca_sentenze",
    description: "Cerca nel testo integrale dei provvedimenti della Corte di cassazione su SentenzeWeb (archivio pubblico del Ministero della Giustizia: civile e penale, ultimi 5 anni circa). Ricerca per parole (non per significato): usa 2-4 parole chiave, le virgolette per le locuzioni (\"lastrico solare\"), OR tra sinonimi, l'asterisco per le varianti (risarci*). Restituisce estremi, materia, estratti e id da passare a leggi_sentenza.",
    inputSchema: {
      type: "object",
      properties: {
        testo: { type: "string", description: "parole chiave" },
        archivio: { type: "string", enum: ["civile", "penale", "entrambi"], description: "default: entrambi" },
        anno_da: { type: "integer", description: "facoltativo: anno minimo del provvedimento" },
        anno_a: { type: "integer", description: "facoltativo: anno massimo" },
        sezione: { type: "string", description: "facoltativo: 1, 2, 3, 4, 5, 6, 7, L (lavoro) o U (Sezioni unite)" },
        tipo: { type: "string", enum: ["Sentenza", "Ordinanza", "Ordinanza Interlocutoria", "Decreto"], description: "facoltativo" },
        ordine: { type: "string", enum: ["rilevanza", "recenti"], description: "default: rilevanza" },
        max_risultati: { type: "integer", description: "default 10, max 20" },
        pagina: { type: "integer", description: "default 1" },
      },
      required: ["testo"], additionalProperties: false,
    },
  },
  {
    name: "cerca_per_estremi",
    description: "Trova su SentenzeWeb un provvedimento della Cassazione dati numero e anno (es. numero 26805, anno 2025).",
    inputSchema: {
      type: "object",
      properties: {
        numero: { type: "string" }, anno: { type: "integer" },
        archivio: { type: "string", enum: ["civile", "penale", "entrambi"], description: "default: entrambi" },
      },
      required: ["numero", "anno"], additionalProperties: false,
    },
  },
  {
    name: "leggi_sentenza",
    description: "Restituisce il testo integrale di un provvedimento di SentenzeWeb (id ottenuto da cerca_sentenze o cerca_per_estremi), diviso in parti se lungo, con il link al PDF ufficiale.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" }, parte: { type: "integer", description: "default 1" } },
      required: ["id"], additionalProperties: false,
    },
  },
  {
    name: "stato_protezione",
    description: "Mostra quante richieste sono state fatte a SentenzeWeb nell'ultima ora e nelle ultime 24 ore e se la protezione anti-blocco e' in pausa.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
];

function formattaElenco(j, intest) {
  const docs = j.response.docs || [];
  if (!docs.length) return "Nessun provvedimento trovato su SentenzeWeb. Prova con meno parole, con OR tra sinonimi o con l'asterisco.";
  const hl = j.highlighting || {};
  return intest + "\n\n" + docs.map(d => {
    const est = ((hl[d.id] || {}).ocr || []).map(s => "    \"..." + s.replace(/<\/?em>/g, "").replace(/\s+/g, " ").trim() + "...\"").join("\n");
    return "- " + estremi(d) + "\n  id: " + d.id + (d.materia ? " | materia: " + [].concat(d.materia).join(", ") : "") +
      "\n  PDF: " + linkPdf(d) + (est ? "\n" + est : "");
  }).join("\n");
}

const GESTORI = {
  async cerca_sentenze(a) {
    const q = testoInQuery(a.testo);
    if (!q) return "Indica almeno una parola chiave.";
    const max = Math.min(Math.max(parseInt(a.max_risultati || 10, 10) || 10, 1), 20);
    const pag = Math.max(parseInt(a.pagina || 1, 10) || 1, 1);
    const p = {
      q: "ocr:(" + q + ")", fq: filtri(a), rows: max, start: (pag - 1) * max, fl: FL,
      hl: "true", "hl.fl": "ocr", "hl.snippets": 2, "hl.fragsize": 220,
    };
    if ((a.ordine || "rilevanza") === "recenti") p.sort = "pd desc,datdec desc";
    const j = await solr(p, CACHE_RICERCHE_MS);
    const tot = j.response.numFound;
    return formattaElenco(j, tot + " provvedimenti trovati su SentenzeWeb (pagina " + pag + ", " + max + " per pagina)" +
      (tot > pag * max ? "; per altri risultati usa pagina=" + (pag + 1) + " o restringi la ricerca" : "") + ".");
  },

  async cerca_per_estremi(a) {
    const num = String(a.numero || "").replace(/\D/g, "").padStart(5, "0");
    if (!/^\d{5,}$/.test(num) || !a.anno) return "Indica numero e anno.";
    const j = await solr({ q: 'numdec:"' + num + '" AND anno:"' + parseInt(a.anno, 10) + '"', fq: filtri({ archivio: a.archivio }), rows: 10, fl: FL }, CACHE_RICERCHE_MS);
    return formattaElenco(j, j.response.numFound + " provvedimenti con numero " + a.numero + "/" + a.anno + ":");
  },

  async leggi_sentenza(a) {
    const id = String(a.id || "").replace(/[^A-Za-z0-9]/g, "");
    if (!id) return "Indica l'id del provvedimento.";
    const j = await solr({ q: "id:" + id, rows: 1, fl: FL + ",ocr" }, Infinity);   // i testi pubblicati non cambiano
    const d = (j.response.docs || [])[0];
    if (!d) return "Provvedimento " + id + " non trovato su SentenzeWeb.";
    const testo = [].concat(d.ocr || []).join("\n").replace(/[ \t]+/g, " ").trim();
    const parti = Math.max(1, Math.ceil(testo.length / PARTE_CAR));
    const n = Math.min(Math.max(parseInt(a.parte || 1, 10) || 1, 1), parti);
    return estremi(d) + "\nFonte: SentenzeWeb - Corte di cassazione (ItalgiureWeb, Ministero della Giustizia)\nPDF ufficiale: " + linkPdf(d) +
      "\nParte " + n + " di " + parti + (n < parti ? " (per continuare: parte=" + (n + 1) + ")" : "") + "\n\n" +
      testo.slice((n - 1) * PARTE_CAR, n * PARTE_CAR);
  },

  stato_protezione() {
    const r = lim.riepilogo();
    return "Protezione anti-blocco SentenzeWeb: richieste nell'ultima ora " + r.ultima_ora + ", nelle ultime 24 ore " + r.ultime_24_ore +
      ", in pausa: " + r.in_pausa + ". Le risposte gia' ottenute sono in cache e non consumano richieste.";
  },
};

if (require.main === module) {
  avviaServer({
    nome: "sentenzeweb", versione: "1.0.0", strumenti: STRUMENTI, gestori: GESTORI,
    istruzioni: "SentenzeWeb: testo integrale dei provvedimenti civili e penali della Corte di cassazione degli ultimi 5 anni circa " +
      "(archivio pubblico del Ministero della Giustizia). Cita sempre gli estremi completi e il link al PDF; non riportare nomi delle parti.",
    alAvvio: () => "pronto (limiti: " + JSON.stringify(lim.lim) + ")",
  });
}

module.exports = { GESTORI, STRUMENTI, testoInQuery, estremi };
