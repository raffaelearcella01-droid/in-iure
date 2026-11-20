// Test end-to-end della versione desktop: avvia l'app Electron vera (main.js) e la pilota.
// Uso: npm test   (esegue copy-web e poi `electron scripts/test-desktop.js`)
"use strict";
const { app, BrowserWindow, session, shell } = require("electron");
const fs = require("fs");
const os = require("os");
const path = require("path");

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "iniure-test-"));
const downloads = [], external = [];
shell.openExternal = (url) => { external.push(url); return Promise.resolve(); };

require("../main.js");

let pass = 0, fail = 0;
const ok = (c, m) => (c ? (pass++, console.log("  ✓ " + m)) : (fail++, console.log("  ✗ FAIL: " + m)));
const wait = ms => new Promise(r => setTimeout(r, ms));

// PDF minimo con testo vero su n pagine (Helvetica), per provare la vista "come nel PDF" senza rete
function pdfMinimo(n) {
  const ogg = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [" + Array.from({ length: n }, (_, i) => (3 + i * 2) + " 0 R").join(" ") + "] /Count " + n + " >>"];
  const font = 3 + n * 2;
  for (let i = 0; i < n; i++) {
    const f = "BT /F1 28 Tf 72 700 Td (CORTE SUPREMA DI CASSAZIONE pagina " + (i + 1) + ") Tj 0 -40 Td (RAGIONI DELLA DECISIONE) Tj ET";
    ogg.push("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 " + font + " 0 R >> >> /Contents " + (4 + i * 2) + " 0 R >>");
    ogg.push("<< /Length " + f.length + " >>\nstream\n" + f + "\nendstream");
  }
  ogg.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  let out = "%PDF-1.4\n"; const off = [];
  ogg.forEach((o, i) => { off.push(out.length); out += (i + 1) + " 0 obj\n" + o + "\nendobj\n"; });
  const x = out.length;
  out += "xref\n0 " + (ogg.length + 1) + "\n0000000000 65535 f \n" + off.map(o => String(o).padStart(10, "0") + " 00000 n \n").join("") +
    "trailer\n<< /Size " + (ogg.length + 1) + " /Root 1 0 R >>\nstartxref\n" + x + "\n%%EOF\n";
  return Buffer.from(out, "latin1");
}

app.whenReady().then(async () => {
  session.defaultSession.on("will-download", (e, item) => {
    const p = path.join(TMP, item.getFilename());
    item.setSavePath(p);
    item.once("done", (ev, state) => downloads.push({ name: item.getFilename(), path: p, state }));
  });
  let win; for (let i = 0; i < 50 && !(win = BrowserWindow.getAllWindows()[0]); i++) await wait(100);
  const wc = win.webContents;
  if (wc.isLoading()) await new Promise(r => wc.once("did-finish-load", r));
  await wait(500);
  const js = (code) => wc.executeJavaScript(code);
  const until = async (code, n = 60) => { for (let i = 0; i < n; i++) { if (await js(code)) return true; await wait(100); } return false; };
  const click = (sel) => js(`(function(){var e=document.querySelector(${JSON.stringify(sel)}); if(!e) return false; e.click(); return true;})()`);

  try {
    console.log("\n[1] Avvio");
    ok(wc.getURL().indexOf("app://iniure/index.html") === 0, "caricata da app://iniure/index.html");
    ok(await js("!!(window.InIureNative && InIureNative.isDesktop)"), "strato desktop attivo");
    ok(await js("document.querySelector('#install-top').hidden"), "pulsante «Installa app» nascosto");
    ok(await js("new Set(Array.from(document.querySelectorAll('#codici-categorie .card')).map(c => c.dataset.codice)).size === CODICI_INDEX.length && CODICI_INDEX.length >= 30"), "tutti i codici in home (33)");

    console.log("\n[2] Codici caricati a richiesta dal protocollo app://");
    await js(`Array.from(document.querySelectorAll('#codici-categorie .card')).find(c => /Costituzione/.test(c.textContent)).click()`);
    ok(await until("document.querySelectorAll('#articoli-list .articolo').length >= 50 && /140 articoli/.test(document.querySelector('#codice-count').textContent)"), "Costituzione aperta (140 articoli, rendering progressivo)");
    ok((await js("fetch('app://iniure/../main.js').then(r => r.status).catch(() => 'errore')")) === 404, "nessun accesso a file fuori da app/ (404)");

    console.log("\n[3] Atto: Word e PDF");
    await js(`document.querySelector('.tab[data-section="scrittura"]').click()`); await wait(100);
    await click("#atti-list .card"); await wait(200);
    await click("#atto-word");
    for (let i = 0; i < 50 && downloads.length < 1; i++) await wait(100);
    const doc = downloads[0] || {};
    ok(/\.doc$/.test(doc.name || "") && doc.state === "completed" && fs.statSync(doc.path).size > 500, "Word salvato (" + doc.name + ")");
    await click("#atto-pdf");
    for (let i = 0; i < 80 && downloads.length < 2; i++) await wait(100);
    const pdf = downloads[1] || {};
    const head = pdf.path ? fs.readFileSync(pdf.path).slice(0, 5).toString() : "";
    ok(/\.pdf$/.test(pdf.name || "") && head === "%PDF-", "PDF generato con jsPDF (" + pdf.name + ", " + (pdf.path ? fs.statSync(pdf.path).size : 0) + " byte)");
    ok(BrowserWindow.getAllWindows().length === 1, "nessuna finestra di stampa aperta");

    console.log("\n[4] Articolo: immagine e WhatsApp");
    await js(`document.querySelector('.tab[data-section="codici"]').click()`); await wait(100);
    await js(`Array.from(document.querySelectorAll('#codici-categorie .card')).find(c => /Costituzione/.test(c.textContent)).click()`);
    await until("document.querySelectorAll('#articoli-list .articolo [data-wa]').length > 0");
    await click("#articoli-list .articolo [data-wa]");
    ok(await until("!document.querySelector('#share-modal').hidden && !!document.querySelector('#share-image-wrap img')"), "anteprima immagine articolo mostrata");
    const n0 = downloads.length;
    await js(`Array.from(document.querySelectorAll('#share-modal button')).find(b => /Salva/i.test(b.textContent)).click()`);
    for (let i = 0; i < 50 && downloads.length === n0; i++) await wait(100);
    ok(/\.png$/.test((downloads[n0] || {}).name || ""), "«Salva immagine» salva il PNG (" + ((downloads[n0] || {}).name) + ")");
    await click("#share-wa");
    await wait(300);
    ok(external.some(u => /wa\.me|whatsapp/i.test(u)) && BrowserWindow.getAllWindows().length === 1, "«Apri WhatsApp» apre il browser di sistema (" + (external[0] || "nessuno") + ")");

    console.log("\n[Ricerca] Ponte verso SentenzeWeb");
    ok(await js("typeof window.InIureDesktopRete === 'object' && typeof window.InIureDesktopRete.get === 'function' && typeof window.require === 'undefined'"), "ponte InIureDesktopRete presente, Node non esposto alla pagina");
    ok(await js("window.InIureRicerca._interni.trasporto() === 'desktop'"), "la Ricerca usa il ponte desktop");
    ok(await js("window.InIureDesktopRete.get('https://example.com/').then(() => false, () => true)"), "indirizzi diversi da SentenzeWeb rifiutati");
    await click('.tab[data-section="ricerca"]');
    ok(await js("document.querySelector('#section-ricerca').classList.contains('is-active') && !/non e' possibile/.test(document.querySelector('#ric-risultati').textContent)"), "sezione Ricerca attiva, senza avviso di indisponibilita'");

    console.log("\n[Ricerca] Sentenza come nel PDF (20/11/2026)");
    ok(await js("typeof window.InIureDesktopRete.pdf === 'function'"), "ponte per il PDF ufficiale presente");
    ok(await js("Promise.all([window.InIureDesktopRete.pdf('https://example.com/x.pdf'), window.InIureDesktopRete.pdf('https://www.italgiure.giustizia.it/sncass/isapi/hc.dll/sn.solr/sn-collection/select?q=x')].map(p => p.then(() => false, () => true))).then(a => a.every(Boolean))"),
      "PDF: rifiutati gli indirizzi che non sono PDF di SentenzeWeb");
    // PDF vero (IN_IURE_PDF_PROVA = file scaricato da SentenzeWeb) o, in mancanza, un PDF minimo di 2 pagine
    const pdfProva = process.env.IN_IURE_PDF_PROVA && fs.existsSync(process.env.IN_IURE_PDF_PROVA) ? fs.readFileSync(process.env.IN_IURE_PDF_PROVA) : pdfMinimo(2);
    const esito = await js("(function(){ var c = document.createElement('div'); c.id = 'prova-pdf'; c.style.width = '800px'; document.body.appendChild(c);" +
      " return window.InIureRicerca._interni.disegnaPdf(" + JSON.stringify(pdfProva.toString("base64")) + ", c, function(){ return true; }).then(function(){" +
      " var cs = Array.from(c.querySelectorAll('canvas')); var scuri = cs.map(function(k){ var d = k.getContext('2d').getImageData(0, 0, k.width, k.height).data, n = 0; for (var i = 0; i < d.length; i += 16) if (d[i] < 128) n++; return n; });" +
      " return { pagine: cs.length, larghezza: cs[0] ? cs[0].width : 0, scuri: scuri }; }); })()");
    if (process.env.IN_IURE_IMMAGINE_PDF) {   // facoltativo: salva la pagina 1 disegnata, per un controllo a vista
      const png = await js("document.querySelector('#prova-pdf canvas').toDataURL('image/png')");
      fs.writeFileSync(process.env.IN_IURE_IMMAGINE_PDF, Buffer.from(png.split(",")[1], "base64"));
    }
    ok(esito.pagine >= 1 && esito.scuri.every(n => n > 50), "PDF disegnato pagina per pagina con PDF.js (" + esito.pagine + " pagine, " + (process.env.IN_IURE_PDF_PROVA ? "PDF vero di SentenzeWeb" : "PDF di prova") + ", pixel di testo per pagina: " + esito.scuri.join("/") + ")");
  } catch (e) { fail++; console.error(e); }

  console.log("\n========== " + pass + " OK, " + fail + " FAIL ==========");
  fs.rmSync(TMP, { recursive: true, force: true });
  app.exit(fail ? 1 : 0);
});
