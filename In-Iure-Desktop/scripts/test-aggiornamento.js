// Test end-to-end dell'aggiornamento automatico nella versione desktop reale (Electron, protocollo app://).
// Avvia un piccolo server HTTP locale che fa da "sito degli aggiornamenti" con un c.p.c. modificato.
// Uso: node scripts/copy-web.js && electron scripts/test-aggiornamento.js
"use strict";
const { app, BrowserWindow, session } = require("electron");
const fs = require("fs"), path = require("path"), http = require("http");

const APPDIR = path.join(__dirname, "..", "app");
const cfg = path.join(APPDIR, "js", "update-config.js");
const cfgOrig = fs.readFileSync(cfg, "utf8");

// contenuti remoti
const LOCAL = JSON.parse(fs.readFileSync(path.join(APPDIR, "js", "codici-versioni.json"), "utf8"));
const REMOTE = JSON.parse(JSON.stringify(LOCAL));
REMOTE.generato = "2099-01-01T00:00:00Z";
REMOTE.files["js/codici/cpc.js"] = "hash-test";
const cpc = fs.readFileSync(path.join(APPDIR, "js", "codici", "cpc.js"), "utf8")
  .replace('"rubrica":"Giurisdizione dei giudici ordinari"', '"rubrica":"RUBRICA DAL SERVER DI PROVA"');
const FILES = { "/js/codici-versioni.json": JSON.stringify(REMOTE), "/js/codici/cpc.js": cpc };
const server = http.createServer((req, res) => {
  const p = req.url.split("?")[0];
  res.setHeader("Access-Control-Allow-Origin", "*");    // come GitHub Pages / Netlify con _headers
  if (FILES[p]) { res.writeHead(200, { "Content-Type": "application/javascript" }); res.end(FILES[p]); }
  else { res.writeHead(404); res.end(); }
}).listen(0, "127.0.0.1");

let pass = 0, fail = 0;
const ok = (c, m) => (c ? (pass++, console.log("  ✓ " + m)) : (fail++, console.log("  ✗ FAIL: " + m)));
const wait = ms => new Promise(r => setTimeout(r, ms));

server.on("listening", () => {
  fs.writeFileSync(cfg, 'window.IN_IURE_UPDATE_URL = "http://127.0.0.1:' + server.address().port + '/";\n');
  require("../main.js");
  app.whenReady().then(async () => {
    try {
      await session.defaultSession.clearStorageData({ storages: ["indexdb", "localstorage"] });
      let win; for (let i = 0; i < 50 && !(win = BrowserWindow.getAllWindows()[0]); i++) await wait(100);
      const wc = win.webContents;
      wc.reload();
      await new Promise(r => wc.once("did-finish-load", r));
      const js = (code) => wc.executeJavaScript(code);
      const until = async (code, n = 80) => { for (let i = 0; i < n; i++) { if (await js(code)) return true; await wait(100); } return false; };
      console.log("\n[Desktop] aggiornamento automatico");
      await wait(3000);
      ok(!(await js("!!document.querySelector('#upd-controlla')")), "nessun pulsante di aggiornamento nell'app");
      await js(`document.querySelector('[data-codice="cpc"]').click()`);
      ok(await until(`(document.querySelector('#articoli-list .articolo[data-num="1"] .articolo__rubrica')||{}).textContent === "RUBRICA DAL SERVER DI PROVA"`), "il c.p.c. mostra il testo aggiornato");
      wc.reload();
      await new Promise(r => wc.once("did-finish-load", r));
      server.close();                                   // riapertura senza server: restano i contenuti scaricati
      await wait(1500);
      await js(`document.querySelector('[data-codice="cpc"]').click()`);
      ok(await until(`(document.querySelector('#articoli-list .articolo[data-num="1"] .articolo__rubrica')||{}).textContent === "RUBRICA DAL SERVER DI PROVA"`), "dopo il riavvio senza connessione il testo aggiornato resta");
      await session.defaultSession.clearStorageData({ storages: ["indexdb", "localstorage"] });
    } catch (e) { fail++; console.error(e); }
    fs.writeFileSync(cfg, cfgOrig);
    console.log("\n========== AGGIORNAMENTO DESKTOP: " + pass + " OK, " + fail + " FAIL ==========");
    app.exit(fail ? 1 : 0);
  });
});
