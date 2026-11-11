/* Collaudo del server MCP "pratica" con il protocollo stdio reale, su una cartella temporanea con documenti veri.
 * Uso: node test_pratica.js   (non tocca nessuna cartella dell'utente) */
"use strict";
const { spawn, execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { docx, zipLeggi } = require("./pratica");

let ok = 0, ko = 0;
const verifica = (c, nome) => { if (c) { ok++; console.log("  ok  " + nome); } else { ko++; console.log("  NO  " + nome); } };

// PDF minimo di 2 pagine con testo vero (Helvetica, WinAnsi)
function pdf(pagine) {
  const ogg = [];
  const kids = pagine.map((_, i) => (3 + i * 2) + " 0 R").join(" ");
  ogg.push("<< /Type /Catalog /Pages 2 0 R >>");
  ogg.push("<< /Type /Pages /Kids [" + kids + "] /Count " + pagine.length + " >>");
  const font = 3 + pagine.length * 2;
  pagine.forEach((righe, i) => {
    const flusso = "BT /F1 12 Tf 72 760 Td 16 TL " + righe.map(r => "(" + r.replace(/[()\\]/g, "\\$&") + ") '").join(" ") + " ET";
    ogg.push("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 " + font + " 0 R >> >> /Contents " + (4 + i * 2) + " 0 R >>");
    ogg.push("<< /Length " + Buffer.byteLength(flusso, "latin1") + " >>\nstream\n" + flusso + "\nendstream");
  });
  ogg.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  let out = "%PDF-1.4\n", off = [];
  ogg.forEach((o, i) => { off.push(Buffer.byteLength(out, "latin1")); out += (i + 1) + " 0 obj\n" + o + "\nendobj\n"; });
  const xref = Buffer.byteLength(out, "latin1");
  out += "xref\n0 " + (ogg.length + 1) + "\n0000000000 65535 f \n" + off.map(o => String(o).padStart(10, "0") + " 00000 n \n").join("");
  out += "trailer\n<< /Size " + (ogg.length + 1) + " /Root 1 0 R >>\nstartxref\n" + xref + "\n%%EOF\n";
  return Buffer.from(out, "latin1");
}

function avvia(cartella) {
  const p = spawn(process.execPath, [path.join(__dirname, "pratica.js"), "--cartella", cartella]);
  let buf = "", attese = {}, n = 0;
  p.stdout.setEncoding("utf8");
  p.stdout.on("data", d => { buf += d; let i; while ((i = buf.indexOf("\n")) >= 0) { const m = JSON.parse(buf.slice(0, i)); buf = buf.slice(i + 1); if (attese[m.id]) { attese[m.id](m); delete attese[m.id]; } } });
  const chiama = (method, params) => new Promise(res => { const id = ++n; attese[id] = res; p.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n"); });
  const strumento = async (name, args) => { const r = (await chiama("tools/call", { name, arguments: args || {} })).result; return { testo: r.content[0].text, errore: r.isError }; };
  return { p, chiama, strumento };
}

(async () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "iniure-pratica-"));
  const pr = path.join(base, "Pratica Rossi c. Condominio");
  fs.mkdirSync(path.join(pr, "Atti avversari"), { recursive: true });
  fs.writeFileSync(path.join(pr, "Atti avversari", "citazione.pdf"), pdf([
    ["TRIBUNALE DI NAPOLI", "Atto di citazione", "Il condominio convenuto e' custode del lastrico solare."],
    ["Le infiltrazioni sono iniziate il 12 marzo 2025.", "Si chiede il risarcimento ex art. 2051 c.c."],
  ]));
  fs.writeFileSync(path.join(pr, "Contratto.docx"), docx("Contratto di locazione", "## Art. 1\nIl canone mensile e' di **euro 800**.\nIl conduttore e' tenuto alla manutenzione ordinaria."));
  fs.writeFileSync(path.join(pr, "appunti cliente.txt"), "Il cliente riferisce che l'amministratore era stato avvisato con PEC del 20 marzo 2025.");
  fs.writeFileSync(path.join(pr, "vecchio.doc"), Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1, 0, 0, 0, 0]));
  fs.writeFileSync(path.join(base, "SEGRETO fuori pratica.txt"), "questo testo non deve mai essere letto");

  console.log("1) Protocollo e strumenti");
  const s = avvia(pr);
  const init = await s.chiama("initialize", { protocolVersion: "2025-06-18" });
  verifica(init.result && init.result.serverInfo.name === "pratica", "initialize: server pratica");
  const lista = (await s.chiama("tools/list", {})).result.tools.map(t => t.name);
  verifica(["elenca_documenti", "leggi_documento", "cerca_nei_documenti", "salva_documento_word"].every(x => lista.includes(x)), "quattro strumenti esposti");

  console.log("2) Lettura dei documenti");
  const el = (await s.strumento("elenca_documenti")).testo;
  verifica(/Atti avversari\/citazione\.pdf/.test(el) && /Contratto\.docx/.test(el) && /appunti cliente\.txt/.test(el), "elenco con sottocartelle");
  verifica(!/SEGRETO/.test(el), "l'elenco non contiene file fuori dalla cartella");
  const lp = (await s.strumento("leggi_documento", { nome: "Atti avversari/citazione.pdf" })).testo;
  verifica(/\(2 pagine\)/.test(lp) && /\[pag\. 2\][\s\S]*12 marzo 2025/.test(lp), "PDF letto con i numeri di pagina");
  const ld = (await s.strumento("leggi_documento", { nome: "Contratto.docx" })).testo;
  verifica(/canone mensile e' di euro 800/.test(ld), "Word .docx letto");
  verifica(/Word 97-2003/.test((await s.strumento("leggi_documento", { nome: "vecchio.doc" })).testo), ".doc binario: avviso chiaro invece di testo illeggibile");

  console.log("3) Confini della cartella");
  const fuori = await s.strumento("leggi_documento", { nome: "../SEGRETO fuori pratica.txt" });
  verifica(fuori.errore && !/non deve mai/.test(fuori.testo), "rifiutato ../ verso un file fuori dalla pratica");
  const ass = await s.strumento("leggi_documento", { nome: path.join(base, "SEGRETO fuori pratica.txt") });
  verifica(ass.errore && !/non deve mai/.test(ass.testo), "rifiutato percorso assoluto fuori dalla pratica");

  console.log("4) Ricerca nei documenti");
  const c1 = (await s.strumento("cerca_nei_documenti", { testo: "infiltrazioni marzo" })).testo;
  verifica(/citazione\.pdf, pag\. 2/.test(c1), "trova parole nella pagina giusta del PDF");
  const c2 = (await s.strumento("cerca_nei_documenti", { testo: "\"lastrico solare\" CUSTODE" })).testo;
  verifica(/pag\. 1/.test(c2) && !/pag\. 2/.test(c2), "frase esatta + maiuscole indifferenti");
  verifica(/vecchio\.doc/.test(c1), "segnala i documenti non esaminati");
  verifica(/Nessun documento/.test((await s.strumento("cerca_nei_documenti", { testo: "segreto" })).testo), "non cerca nei file fuori dalla pratica");

  console.log("5) Salvataggio in Word");
  const testo = "# ATTO DI CITAZIONE\n## Fatto\nIl condominio, quale **custode**, risponde ex art. 2051 c.c.\n- primo punto\n1. secondo punto\n> citazione testuale\n[destra] Napoli, 11 novembre 2026";
  const w1 = (await s.strumento("salva_documento_word", { nome_file: "Bozza citazione", testo })).testo;
  const w2 = (await s.strumento("salva_documento_word", { nome_file: "../../Bozza citazione", testo: "seconda" })).testo;
  const f1 = path.join(pr, "In Iure - elaborati", "Bozza citazione.docx"), f2 = path.join(pr, "In Iure - elaborati", "Bozza citazione (2).docx");
  verifica(/Salvato/.test(w1) && fs.existsSync(f1), "atto salvato in \"In Iure - elaborati\"");
  verifica(/Salvato/.test(w2) && fs.existsSync(f2) && !fs.existsSync(path.join(base, "Bozza citazione.docx")), "nessuna sovrascrittura e nessuna uscita dalla cartella con ../");
  const xml = zipLeggi(fs.readFileSync(f1), "word/document.xml").toString("utf8");
  verifica(/<w:b\/><\/w:rPr><w:t xml:space="preserve">custode/.test(xml) && /w:jc w:val="right"/.test(xml), "grassetto e allineamento a destra nel file");
  const rilett = (await s.strumento("leggi_documento", { nome: "In Iure - elaborati/Bozza citazione.docx" })).testo;
  verifica(/risponde ex art\. 2051 c\.c\./.test(rilett), "l'atto salvato si rilegge");
  // verifica indipendente con python-docx, se presente
  try {
    const py = "import sys,docx\nd=docx.Document(sys.argv[1])\nprint('|'.join(p.text for p in d.paragraphs))";
    const t = execFileSync("python", ["-I", "-c", py, f1], { encoding: "utf8" });
    verifica(/ATTO DI CITAZIONE\|Fatto\|Il condominio, quale custode/.test(t), "python-docx apre il .docx (verifica indipendente)");
  } catch (e) { console.log("  --  python-docx non disponibile: verifica indipendente saltata"); }
  s.p.kill();

  console.log("6) Senza pratica");
  const s2 = spawn(process.execPath, [path.join(__dirname, "pratica.js")]);
  const r2 = await new Promise(res => { let b = ""; s2.stdout.on("data", d => { b += d; if (b.includes("\n")) res(JSON.parse(b.split("\n")[0])); });
    s2.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "elenca_documenti", arguments: {} } }) + "\n"); });
  verifica(/Nessuna pratica aperta/.test(r2.result.content[0].text), "senza cartella risponde che nessuna pratica e' aperta");
  s2.kill();

  if (!process.env.IN_IURE_TIENI_PROVA) fs.rmSync(base, { recursive: true, force: true }); else console.log("cartella di prova: " + pr);
  console.log("\n" + ok + "/" + (ok + ko) + " verifiche superate");
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
