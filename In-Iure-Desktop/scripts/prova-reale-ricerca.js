// Prova REALE (rete vera, passando dalla protezione anti-blocco dell'app) della sezione Ricerca nell'app desktop:
// ricerca per parole chiave con la virgola, apertura della prima sentenza, PDF ufficiale disegnato, foto della pagina.
// Uso: npx electron scripts/prova-reale-ricerca.js "<parole chiave>" <cartella-foto>   (2-3 richieste a SentenzeWeb)
"use strict";
const { app, BrowserWindow } = require("electron");
const fs = require("fs");
const path = require("path");
require("../main.js");
const PAROLE = process.argv[process.argv.length - 2];
const OUT = process.argv[process.argv.length - 1];
const wait = ms => new Promise(r => setTimeout(r, ms));
app.whenReady().then(async () => {
  let win; for (let i = 0; i < 50 && !(win = BrowserWindow.getAllWindows()[0]); i++) await wait(100);
  const wc = win.webContents;
  if (wc.isLoading()) await new Promise(r => wc.once("did-finish-load", r));
  win.setSize(420, 900); await wait(800);
  const js = c => wc.executeJavaScript(c);
  const until = async (c, n) => { for (let i = 0; i < n; i++) { if (await js(c)) return true; await wait(250); } return false; };
  try {
    await js("document.querySelector('.tab[data-section=\"ricerca\"]').click()");
    await js("document.querySelector('.ric-modo[data-modo=\"parole\"]').click()");
    await js("document.querySelector('#ric-testo').value = " + JSON.stringify(PAROLE) + "; document.querySelector('#ric-form').dispatchEvent(new Event('submit', {bubbles: true, cancelable: true}))");
    const ok1 = await until("document.querySelectorAll('#ric-risultati .sentenza-card').length > 0 || /errore|anti-blocco/i.test(document.querySelector('#ric-risultati').textContent)", 240);
    console.log("RISULTATI:", ok1, (await js("document.querySelector('#ric-stato').textContent")).replace(/\s+/g, " ").trim());
    console.log("PRIMA SCHEDA:", (await js("(document.querySelector('#ric-risultati .sentenza-card')||{}).textContent || ''")).replace(/\s+/g, " ").slice(0, 400));
    fs.writeFileSync(path.join(OUT, "reale-risultati.png"), (await wc.capturePage()).toPNG());
    await js("document.querySelector('#ric-risultati [data-apri]').click()");
    const ok2 = await until("document.querySelectorAll('#sentenza-testo canvas').length > 0 || /non disponibile/i.test(document.querySelector('#sentenza-testo').textContent)", 240);
    await wait(1500);
    const info = await js("({ canvas: document.querySelectorAll('#sentenza-testo canvas').length, chipTesto: !!document.querySelector('[data-vista-sentenza]'), leggi: !!document.querySelector('#sentenza-azioni [data-apri]'), pdfUfficiale: /PDF ufficiale/.test(document.querySelector('#sentenza-azioni').textContent), titolo: document.querySelector('#sentenza-titolo').textContent })");
    console.log("SENTENZA:", ok2, JSON.stringify(info));
    fs.writeFileSync(path.join(OUT, "reale-sentenza.png"), (await wc.capturePage()).toPNG());
  } catch (e) { console.error("ERRORE", e); }
  app.exit(0);
});
