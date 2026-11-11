#!/usr/bin/env node
/* In Iure - server MCP "pratica": i documenti di UNA cartella scelta dall'utente (la pratica).
 *
 * Uso: node pratica.js --cartella "<percorso della cartella della pratica>"
 *  - elenca e legge SOLO i file dentro quella cartella (PDF con testo, Word .docx, .odt, .txt, .md, .rtf, .eml,
 *    .html e .doc salvati come pagina web, come quelli esportati dall'app); nessun percorso fuori dalla cartella;
 *  - cerca parole nei documenti, indicando file e pagina;
 *  - salva pareri e atti in Word (.docx) nella sottocartella "In Iure - elaborati", senza mai sovrascrivere.
 * Nessuna dipendenza esterna, nessun accesso alla rete. I PDF si leggono con pdftotext (incluso in Git per
 * Windows) o, in mancanza, con Python + pypdf; i PDF scansionati senza testo vanno passati prima all'OCR. */
"use strict";
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { execFileSync } = require("child_process");
const { avviaServer } = require("./mcp-base");

const ELABORATI = "In Iure - elaborati";
const PARTE_CAR = 15000;
const MAX_FILE = 800;
const LEGGIBILI = [".pdf", ".docx", ".odt", ".txt", ".md", ".rtf", ".eml", ".html", ".htm", ".doc", ".csv", ".json", ".xml"];

function argomento(nome) {
  const i = process.argv.indexOf(nome);
  return i > 0 ? process.argv[i + 1] : undefined;
}
let RADICE = argomento("--cartella") || process.env.IN_IURE_PRATICA || "";
try { RADICE = RADICE ? fs.realpathSync(RADICE) : ""; } catch (e) { RADICE = ""; }

/* ---------------------------------------------------------------- percorsi sicuri */
function dentro(p) {
  const rel = path.relative(RADICE, p);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}
function risolvi(nome) {
  if (!RADICE) throw new Error("Nessuna pratica aperta: avvia l'assistente con APRI_PRATICA_IN_IURE.bat scegliendo la cartella.");
  const n = String(nome || "").replace(/\\/g, "/").replace(/^\/+/, "");
  if (!n) throw new Error("Indica il nome del documento, come restituito da elenca_documenti.");
  const p = path.resolve(RADICE, n);
  if (!dentro(p)) throw new Error("Il documento deve trovarsi nella cartella della pratica.");
  if (!fs.existsSync(p)) throw new Error("Documento non trovato nella pratica: " + n + ". Usa elenca_documenti per i nomi esatti.");
  const reale = fs.realpathSync(p);
  if (!dentro(reale)) throw new Error("Il documento deve trovarsi nella cartella della pratica.");
  return reale;
}
function elenco() {
  const out = [];
  (function giro(dir, livello) {
    if (livello > 8 || out.length >= MAX_FILE) return;
    let voci = [];
    try { voci = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
    voci.sort((a, b) => a.name.localeCompare(b.name, "it"));
    for (const v of voci) {
      if (v.name.startsWith(".") || v.name.startsWith("~$") || v.name === "desktop.ini") continue;
      const p = path.join(dir, v.name);
      if (v.isDirectory()) giro(p, livello + 1);
      else if (v.isFile() && out.length < MAX_FILE) {
        let st; try { st = fs.statSync(p); } catch (e) { continue; }
        out.push({ nome: path.relative(RADICE, p).split(path.sep).join("/"), p, ext: path.extname(v.name).toLowerCase(), byte: st.size, mtime: st.mtimeMs });
      }
    }
  })(RADICE, 0);
  return out;
}
const elaborato = f => f.nome.startsWith(ELABORATI + "/");

/* ---------------------------------------------------------------- zip (lettura .docx/.odt, scrittura .docx) */
function zipLeggi(buf, voce) {
  let e = buf.length - 22;
  while (e >= 0 && buf.readUInt32LE(e) !== 0x06054b50) e--;
  if (e < 0) throw new Error("file non valido (non e' un archivio Office)");
  const n = buf.readUInt16LE(e + 10);
  let c = buf.readUInt32LE(e + 16);
  for (let i = 0; i < n; i++) {
    const metodo = buf.readUInt16LE(c + 10), comp = buf.readUInt32LE(c + 20);
    const ln = buf.readUInt16LE(c + 28), lx = buf.readUInt16LE(c + 30), lc = buf.readUInt16LE(c + 32);
    const off = buf.readUInt32LE(c + 42);
    const nome = buf.toString("utf8", c + 46, c + 46 + ln);
    if (nome === voce) {
      const inizio = off + 30 + buf.readUInt16LE(off + 26) + buf.readUInt16LE(off + 28);
      const dati = buf.subarray(inizio, inizio + comp);
      return metodo === 0 ? dati : zlib.inflateRawSync(dati);
    }
    c += 46 + ln + lx + lc;
  }
  return null;
}
const TAB_CRC = (() => { const t = new Int32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c; } return t; })();
function crc32(b) { let c = -1; for (let i = 0; i < b.length; i++) c = TAB_CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ -1) >>> 0; }
function zipScrivi(voci) {
  const locali = [], centrali = [];
  let off = 0;
  for (const [nome, testo] of voci) {
    const dati = Buffer.from(testo, "utf8"), comp = zlib.deflateRawSync(dati), nb = Buffer.from(nome, "utf8"), crc = crc32(dati);
    const l = Buffer.alloc(30); l.writeUInt32LE(0x04034b50, 0); l.writeUInt16LE(20, 4); l.writeUInt16LE(0x0800, 6); l.writeUInt16LE(8, 8);
    l.writeUInt16LE(0, 10); l.writeUInt16LE(0x21, 12); l.writeUInt32LE(crc, 14); l.writeUInt32LE(comp.length, 18); l.writeUInt32LE(dati.length, 22);
    l.writeUInt16LE(nb.length, 26); l.writeUInt16LE(0, 28);
    const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x0800, 8); c.writeUInt16LE(8, 10);
    c.writeUInt16LE(0, 12); c.writeUInt16LE(0x21, 14); c.writeUInt32LE(crc, 16); c.writeUInt32LE(comp.length, 20); c.writeUInt32LE(dati.length, 24);
    c.writeUInt16LE(nb.length, 28); c.writeUInt32LE(off, 42);
    locali.push(l, nb, comp); centrali.push(c, nb);
    off += 30 + nb.length + comp.length;
  }
  const cd = Buffer.concat(centrali), fine = Buffer.alloc(22);
  fine.writeUInt32LE(0x06054b50, 0); fine.writeUInt16LE(voci.length, 8); fine.writeUInt16LE(voci.length, 10);
  fine.writeUInt32LE(cd.length, 12); fine.writeUInt32LE(off, 16);
  return Buffer.concat([...locali, cd, fine]);
}

/* ---------------------------------------------------------------- estrazione del testo */
const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", egrave: "è", eacute: "é", agrave: "à", igrave: "ì", ograve: "ò", ugrave: "ù", Egrave: "È", laquo: "«", raquo: "»", euro: "€", sect: "§", deg: "°" };
const entita = s => s.replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e) => e[0] === "#" ? String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : (ENT[e] !== undefined ? ENT[e] : m));
function daXmlWord(xml) {
  return entita(xml.replace(/<w:tab\/>/g, "\t").replace(/<w:br[^>]*\/>/g, "\n").replace(/<\/w:p>/g, "\n").replace(/<[^>]+>/g, ""));
}
function daXmlOdt(xml) {
  return entita(xml.replace(/<text:tab\/>/g, "\t").replace(/<text:line-break\/>/g, "\n").replace(/<\/text:(p|h)>/g, "\n").replace(/<[^>]+>/g, ""));
}
function daHtml(h) {
  return entita(h.replace(/<(script|style|head)[\s\S]*?<\/\1>/gi, "").replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|h\d|li|tr)>/gi, "\n").replace(/<[^>]+>/g, ""));
}
function daRtf(r) {
  return r.replace(/\\par[d]?/g, "\n").replace(/\\'([0-9a-f]{2})/gi, (m, h) => Buffer.from([parseInt(h, 16)]).toString("latin1"))
    .replace(/\\[a-z]+-?\d* ?/gi, "").replace(/[{}]/g, "");
}
function testoFile(buf) { // UTF-8 se valido, altrimenti Windows-1252/latin1
  const s = buf.toString("utf8");
  return s.includes("�") ? buf.toString("latin1") : s.replace(/^﻿/, "");
}
function trovaPdftotext() {
  const prove = ["pdftotext"];
  for (const base of [process.env.ProgramFiles, process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "Programs")])
    if (base) prove.push(path.join(base, "Git", "mingw64", "bin", "pdftotext.exe"));
  try {
    const git = execFileSync("where", ["git"], { encoding: "utf8", windowsHide: true }).split(/\r?\n/)[0].trim();
    if (git) prove.push(path.join(path.dirname(path.dirname(git)), "mingw64", "bin", "pdftotext.exe"));
  } catch (e) { /* git non trovato */ }
  for (const p of prove) {
    try { execFileSync(p, ["-v"], { stdio: "ignore", windowsHide: true }); return p; } catch (e) { if (e.status !== undefined && e.status !== null && e.code !== "ENOENT") return p; }
  }
  return null;
}
let PDFTOTEXT;
function pagineDaPdf(p) {
  if (PDFTOTEXT === undefined) PDFTOTEXT = trovaPdftotext();
  if (PDFTOTEXT) {
    const t = execFileSync(PDFTOTEXT, ["-layout", "-enc", "UTF-8", p, "-"], { maxBuffer: 256 * 1024 * 1024, windowsHide: true }).toString("utf8");
    return t.split("\f");
  }
  const py = "import sys,json\nfrom pypdf import PdfReader\nr=PdfReader(sys.argv[1])\nprint(json.dumps([(x.extract_text() or '') for x in r.pages]))";
  for (const cmd of ["python", "py"]) {
    try { return JSON.parse(execFileSync(cmd, ["-I", "-c", py, p], { maxBuffer: 256 * 1024 * 1024, windowsHide: true }).toString("utf8")); } catch (e) { /* prova il successivo */ }
  }
  throw new Error("per leggere i PDF serve pdftotext (incluso in Git per Windows) oppure Python con pypdf");
}
const cache = new Map();
function estrai(f) {
  const chiave = f.p + "|" + f.mtime + "|" + f.byte;
  if (cache.has(chiave)) return cache.get(chiave);
  let pagine = null, testo = "", nota = "";
  const buf = () => fs.readFileSync(f.p);
  if (f.ext === ".pdf") {
    pagine = pagineDaPdf(f.p).map(s => s.replace(/[ \t]+$/gm, ""));
    while (pagine.length > 1 && !pagine[pagine.length - 1].trim()) pagine.pop();
    if (!pagine.join("").trim()) nota = "PDF senza testo (probabilmente una scansione): va passato prima all'OCR, ad esempio salvandolo come PDF ricercabile.";
  } else if (f.ext === ".docx") {
    const b = buf(), x = zipLeggi(b, "word/document.xml");
    if (!x) throw new Error("documento Word senza testo");
    testo = daXmlWord(x.toString("utf8"));
    for (const extra of ["word/footnotes.xml"]) { const n = zipLeggi(b, extra); if (n) { const t = daXmlWord(n.toString("utf8")).trim(); if (t) testo += "\n\n[Note]\n" + t; } }
  } else if (f.ext === ".odt") {
    const x = zipLeggi(buf(), "content.xml"); testo = x ? daXmlOdt(x.toString("utf8")) : "";
  } else if (f.ext === ".doc") {
    const b = buf();
    if (b.readUInt32LE(0) === 0xE011CFD0) { nota = "documento Word 97-2003 (.doc binario): aprilo in Word e salvalo come .docx o .pdf per farlo leggere."; }
    else testo = daHtml(testoFile(b));
  } else if (f.ext === ".html" || f.ext === ".htm") testo = daHtml(testoFile(buf()));
  else if (f.ext === ".rtf") testo = daRtf(buf().toString("latin1"));
  else if (LEGGIBILI.includes(f.ext)) testo = testoFile(buf());
  else nota = "formato non leggibile (" + (f.ext || "senza estensione") + ").";
  if (!pagine) pagine = [testo.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n").trim()];
  const r = { pagine, nota };
  cache.set(chiave, r);
  return r;
}
function testoConPagine(r) {
  if (r.pagine.length === 1) return r.pagine[0];
  return r.pagine.map((t, i) => "[pag. " + (i + 1) + "]\n" + t.trim()).join("\n\n");
}

/* ---------------------------------------------------------------- scrittura Word */
const xe = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function runs(testo, base) {
  // **grassetto**, *corsivo*, __sottolineato__
  const out = [];
  const re = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*\s][^*]*\*)/g;
  let i = 0, m;
  const run = (t, b, it, u) => {
    if (!t) return;
    const pr = (b || base.b ? "<w:b/>" : "") + (it ? "<w:i/>" : "") + (u ? '<w:u w:val="single"/>' : "");
    out.push("<w:r>" + (pr ? "<w:rPr>" + pr + "</w:rPr>" : "") + '<w:t xml:space="preserve">' + xe(t) + "</w:t></w:r>");
  };
  while ((m = re.exec(testo))) {
    run(testo.slice(i, m.index));
    const t = m[0];
    if (t.startsWith("**")) run(t.slice(2, -2), true); else if (t.startsWith("__")) run(t.slice(2, -2), false, false, true); else run(t.slice(1, -1), false, true);
    i = m.index + t.length;
  }
  run(testo.slice(i));
  return out.join("");
}
function paragrafo(testo, o) {
  o = o || {};
  const pPr = "<w:pPr>" + (o.centro ? '<w:jc w:val="center"/>' : o.destra ? '<w:jc w:val="right"/>' : '<w:jc w:val="both"/>') +
    '<w:spacing w:before="' + (o.prima || 0) + '" w:after="' + (o.dopo === undefined ? 120 : o.dopo) + '" w:line="360" w:lineRule="auto"/>' +
    (o.rientro ? '<w:ind w:left="' + o.rientro + '" w:hanging="' + (o.sporgente || 0) + '"/>' : o.primaRiga ? '<w:ind w:firstLine="567"/>' : "") +
    (o.keep ? "<w:keepNext/>" : "") + "</w:pPr>";
  const sz = o.sz ? "<w:rPr><w:sz w:val=\"" + o.sz + "\"/></w:rPr>" : "";
  return "<w:p>" + pPr + runs(testo, { b: !!o.grassetto }).replace(/<w:r>(<w:rPr>)?/g, (m, p) => sz && !p ? "<w:r>" + sz : m) + "</w:p>";
}
function documentoXml(titolo, testo) {
  const corpo = [];
  if (titolo) corpo.push(paragrafo("**" + titolo.replace(/\*/g, "") + "**", { centro: true, dopo: 240 }));
  for (const riga of String(testo || "").replace(/\r\n?/g, "\n").split("\n")) {
    const r = riga.replace(/\s+$/, "");
    if (!r.trim()) continue;
    let m;
    if ((m = r.match(/^(#{1,3})\s+(.*)$/))) corpo.push(paragrafo("**" + m[2].replace(/\*\*/g, "") + "**", { centro: m[1].length === 1, prima: 240, dopo: 120, keep: true }));
    else if ((m = r.match(/^\s*[-*•]\s+(.*)$/))) corpo.push(paragrafo("–\t" + m[1], { rientro: 567, sporgente: 283 }));
    else if ((m = r.match(/^\s*(\d+[.)]|[a-z][.)])\s+(.*)$/))) corpo.push(paragrafo(m[1] + "\t" + m[2], { rientro: 567, sporgente: 397 }));
    else if ((m = r.match(/^>\s?(.*)$/))) corpo.push(paragrafo("*" + m[1].replace(/\*/g, "") + "*", { rientro: 851 }));
    else if ((m = r.match(/^\[(centro|destra)\]\s*(.*)$/i))) corpo.push(paragrafo(m[2], m[1].toLowerCase() === "centro" ? { centro: true } : { destra: true }));
    else corpo.push(paragrafo(r, {}));
  }
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>' +
    corpo.join("") +
    '<w:sectPr><w:footerReference w:type="default" r:id="rIdPie"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1418" w:right="1418" w:bottom="1418" w:left="1701" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr></w:body></w:document>';
}
function docx(titolo, testo) {
  const stili = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
    '<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="it-IT"/></w:rPr></w:rPrDefault>' +
    '<w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="360" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>' +
    '<w:style w:type="paragraph" w:default="1" w:styleId="Normale"><w:name w:val="Normal"/></w:style></w:styles>';
  const pie = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:jc w:val="center"/></w:pPr>' +
    '<w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>1</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p></w:ftr>';
  return zipScrivi([
    ["[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
      '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
      '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>'],
    ["_rels/.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'],
    ["word/_rels/document.xml.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rIdStili" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
      '<Relationship Id="rIdPie" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/></Relationships>'],
    ["word/document.xml", documentoXml(titolo, testo)],
    ["word/styles.xml", stili],
    ["word/footer1.xml", pie],
  ]);
}

/* ---------------------------------------------------------------- strumenti */
const normalizza = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const STRUMENTI = [
  {
    name: "elenca_documenti",
    description: "Elenca i documenti della cartella della pratica aperta (l'unica cartella di documenti che puoi usare), con formato, dimensione e data. Chiamalo per primo quando la richiesta riguarda la pratica.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "leggi_documento",
    description: "Restituisce il testo di un documento della pratica (nome come da elenca_documenti), con i numeri di pagina per i PDF, diviso in parti se lungo.",
    inputSchema: { type: "object", properties: { nome: { type: "string" }, parte: { type: "integer", description: "default 1" } }, required: ["nome"], additionalProperties: false },
  },
  {
    name: "cerca_nei_documenti",
    description: "Cerca parole in TUTTI i documenti della pratica (maiuscole e accenti indifferenti; tutte le parole devono stare nella stessa pagina). Restituisce documento, pagina ed estratto.",
    inputSchema: { type: "object", properties: { testo: { type: "string", description: "una o piu' parole; tra virgolette per una frase esatta" }, max_risultati: { type: "integer", description: "default 30" } }, required: ["testo"], additionalProperties: false },
  },
  {
    name: "salva_documento_word",
    description: "Salva un parere, un atto o una lettera come documento Word (.docx, Times New Roman 12, interlinea 1,5, testo giustificato, numeri di pagina) nella sottocartella \"" + ELABORATI + "\" della pratica. Non sovrascrive mai: se il nome esiste aggiunge un numero. Formato del testo: una riga per paragrafo; \"# \" titolo centrato, \"## \" titolo di sezione, \"- \" elenco puntato, \"1. \" elenco numerato, \"> \" citazione in corsivo rientrata, \"[centro] \" o \"[destra] \" per allineare (es. luogo, data e firma), **grassetto**, *corsivo*, __sottolineato__.",
    inputSchema: {
      type: "object",
      properties: {
        nome_file: { type: "string", description: "nome del file senza percorso, es. \"Parere responsabilita' custode\"" },
        titolo: { type: "string", description: "facoltativo: intestazione centrata in grassetto" },
        testo: { type: "string" },
      },
      required: ["nome_file", "testo"], additionalProperties: false,
    },
  },
];

const GESTORI = {
  elenca_documenti() {
    if (!RADICE) return "Nessuna pratica aperta: chiedi all'utente di avviare l'assistente con APRI_PRATICA_IN_IURE.bat scegliendo la cartella della pratica.";
    const f = elenco();
    const doc = f.filter(x => !elaborato(x)), el = f.filter(elaborato);
    const riga = x => "- " + x.nome + "  (" + (x.ext.slice(1) || "?") + ", " + Math.max(1, Math.round(x.byte / 1024)) + " KB, " + new Date(x.mtime).toLocaleDateString("it-IT") + ")" + (LEGGIBILI.includes(x.ext) ? "" : "  [non leggibile]");
    return "Pratica: " + RADICE + "\n" + doc.length + " documenti" + (f.length >= MAX_FILE ? " (elenco limitato ai primi " + MAX_FILE + ")" : "") + ":\n" + (doc.map(riga).join("\n") || "(nessuno)") +
      (el.length ? "\n\nElaborati gia' salvati dall'assistente in \"" + ELABORATI + "\":\n" + el.map(riga).join("\n") : "");
  },

  leggi_documento(a) {
    const p = risolvi(a.nome);
    const f = elenco().find(x => x.p === p) || { p, nome: a.nome, ext: path.extname(p).toLowerCase(), byte: fs.statSync(p).size, mtime: fs.statSync(p).mtimeMs };
    const r = estrai(f);
    if (r.nota && !r.pagine.join("").trim()) return f.nome + ": " + r.nota;
    const testo = testoConPagine(r);
    const parti = Math.max(1, Math.ceil(testo.length / PARTE_CAR));
    const n = Math.min(Math.max(parseInt(a.parte || 1, 10) || 1, 1), parti);
    return "Documento della pratica: " + f.nome + (r.pagine.length > 1 ? " (" + r.pagine.length + " pagine)" : "") +
      "\nParte " + n + " di " + parti + (n < parti ? " (per continuare: parte=" + (n + 1) + ")" : "") + (r.nota ? "\nAvviso: " + r.nota : "") +
      "\n\n" + testo.slice((n - 1) * PARTE_CAR, n * PARTE_CAR);
  },

  cerca_nei_documenti(a) {
    if (!RADICE) return GESTORI.elenca_documenti();
    const q = String(a.testo || "");
    const frasi = (q.match(/"[^"]+"/g) || []).map(s => normalizza(s.slice(1, -1)).trim()).filter(Boolean);
    const parole = normalizza(q.replace(/"[^"]+"/g, " ")).split(/[^\p{L}\p{N}]+/u).filter(w => w.length > 1);
    const cerca = frasi.concat(parole);
    if (!cerca.length) return "Indica almeno una parola.";
    const max = Math.min(Math.max(parseInt(a.max_risultati || 30, 10) || 30, 1), 100);
    const ris = [], illeggibili = [];
    for (const f of elenco()) {
      if (!LEGGIBILI.includes(f.ext)) continue;
      let r; try { r = estrai(f); } catch (e) { illeggibili.push(f.nome + " (" + e.message + ")"); continue; }
      if (r.nota && !r.pagine.join("").trim()) { illeggibili.push(f.nome + " (" + r.nota + ")"); continue; }
      r.pagine.forEach((t, i) => {
        const n = normalizza(t);
        if (!cerca.every(w => n.includes(w))) return;
        const pos = n.indexOf(cerca[0]);
        const estratto = t.slice(Math.max(0, pos - 160), pos + 240).replace(/\s+/g, " ").trim();
        ris.push("- " + f.nome + (r.pagine.length > 1 ? ", pag. " + (i + 1) : "") + (elaborato(f) ? " [elaborato dell'assistente]" : "") + "\n    \"..." + estratto + "...\"");
      });
    }
    return (ris.length ? ris.length + " pagine con \"" + q + "\"" + (ris.length > max ? " (mostrate le prime " + max + ")" : "") + ":\n" + ris.slice(0, max).join("\n")
      : "Nessun documento della pratica contiene \"" + q + "\".") +
      (illeggibili.length ? "\n\nDocumenti non esaminati:\n- " + illeggibili.join("\n- ") : "");
  },

  salva_documento_word(a) {
    if (!RADICE) return GESTORI.elenca_documenti();
    let base = String(a.nome_file || "").replace(/\\/g, "/").split("/").pop().replace(/^[.\s]+/, "").replace(/\.docx$/i, "").replace(/[\\/:*?"<>|\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
    if (!base) base = "Elaborato In Iure";
    const dir = path.join(RADICE, ELABORATI);
    fs.mkdirSync(dir, { recursive: true });
    let p = path.join(dir, base + ".docx"), k = 2;
    while (fs.existsSync(p)) p = path.join(dir, base + " (" + k++ + ").docx");
    if (!dentro(p)) throw new Error("percorso non ammesso");
    fs.writeFileSync(p, docx(a.titolo || "", a.testo || ""), { flag: "wx" });
    return "Salvato: " + path.relative(RADICE, p).split(path.sep).join("/") + " (nella cartella della pratica). Comunica all'utente il nome del file e ricordagli di rileggerlo prima di usarlo.";
  },
};

if (require.main === module) {
  avviaServer({
    nome: "pratica", versione: "1.0.0", strumenti: STRUMENTI, gestori: GESTORI,
    istruzioni: "Documenti della pratica aperta dall'utente (una sola cartella). Sono l'UNICA fonte dei fatti: non usare documenti di altre cartelle. " +
      "Cita i documenti con nome del file e pagina. Salva pareri e atti con salva_documento_word.",
    alAvvio: () => RADICE ? "pratica: " + RADICE : "nessuna pratica aperta",
  });
}

module.exports = { GESTORI, STRUMENTI, docx, zipLeggi, estrai, documentoXml };
