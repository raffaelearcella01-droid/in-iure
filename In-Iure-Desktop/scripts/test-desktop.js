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
  } catch (e) { fail++; console.error(e); }

  console.log("\n========== " + pass + " OK, " + fail + " FAIL ==========");
  fs.rmSync(TMP, { recursive: true, force: true });
  app.exit(fail ? 1 : 0);
});
