// In Iure — processo principale Electron (versione desktop Windows/macOS/Linux).
// Serve la web-app (copiata in app/ da scripts/copy-web.js) dal protocollo sicuro app://iniure/
// e apre i link esterni (WhatsApp, pagamenti, siti) nel browser di sistema.
"use strict";
const { app, BrowserWindow, Menu, protocol, net, shell, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const https = require("https");
const tls = require("tls");
const { pathToFileURL } = require("url");

const APP_DIR = path.join(__dirname, "app");
const ORIGIN = "app://iniure";

protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } },
]);

if (!app.requestSingleInstanceLock()) { app.quit(); }

let win = null;

function isInternal(url) { return url.startsWith(ORIGIN + "/"); }

function createWindow() {
  win = new BrowserWindow({
    width: 1280, height: 860, minWidth: 380, minHeight: 500,
    backgroundColor: "#0f2740",
    title: "In Iure",
    icon: path.join(APP_DIR, "icons", "icon-512.png"),
    autoHideMenuBar: true,
    show: false,
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false, spellcheck: true, preload: path.join(__dirname, "preload.js") },
  });
  win.once("ready-to-show", () => win.show());

  // Link esterni → browser di sistema; nessuna nuova finestra dentro l'app
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^(https?|mailto|tel):/i.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (e, url) => {
    if (!isInternal(url)) { e.preventDefault(); if (/^https?:/i.test(url)) shell.openExternal(url); }
  });

  win.loadURL(ORIGIN + "/index.html");
}

/* Sezione Ricerca: richieste a SentenzeWeb (archivio pubblico della Cassazione) fatte da qui perche' il sito
   non accetta richieste dalle pagine web. Solo l'indirizzo di ricerca di SentenzeWeb, una richiesta alla volta
   (la coda, l'intervallo e i tetti anti-blocco li applica la pagina, js/ricerca.js). Il sito invia una catena di
   certificati incompleta: si aggiunge l'intermedio pubblico in certificati/, la verifica resta completa. */
const SOLR = "https://www.italgiure.giustizia.it/sncass/isapi/hc.dll/sn.solr/sn-collection/select?";
const CA = tls.rootCertificates.slice();
try {
  const dir = path.join(__dirname, "certificati");
  for (const f of fs.readdirSync(dir)) if (f.endsWith(".pem")) CA.push(fs.readFileSync(path.join(dir, f), "utf8"));
} catch (e) { /* nessun intermedio */ }
const agente = new https.Agent({ ca: CA, keepAlive: false, maxSockets: 1 });
// PDF ufficiale del provvedimento (20/11/2026: la sentenza si mostra come nel PDF, non dal testo OCR)
const PDF = "https://www.italgiure.giustizia.it/xway/application/nif/clean/hc.dll?verbo=attach&db=";
const PDF_OK = /^https:\/\/www\.italgiure\.giustizia\.it\/xway\/application\/nif\/clean\/hc\.dll\?verbo=attach&db=sn(?:civ|pen)&id=[A-Za-z0-9.\/@_-]+\.pdf$/;
function sentenzeWebGet(url, binario) {
  return new Promise((ok, ko) => {
    const valido = typeof url === "string" && url.length <= 8000 && (binario ? PDF_OK.test(url) : url.startsWith(SOLR));
    if (!valido) return ko(new Error("Indirizzo non consentito"));
    const req = https.get(url, { agent: agente, headers: { "User-Agent": "InIure-Desktop/1.6 (consultazione personale, richieste limitate)", "Accept": binario ? "application/pdf" : "application/json" } }, (res) => {
      const pezzi = []; let tot = 0;
      const max = (binario ? 30 : 60) * 1024 * 1024;
      res.on("data", (c) => { tot += c.length; if (tot > max) { req.destroy(new Error("Risposta troppo grande")); return; } pezzi.push(c); });
      res.on("end", () => {
        const corpo = Buffer.concat(pezzi);
        if (binario) {
          const pdf = corpo.slice(0, 5).toString("latin1") === "%PDF-";
          return ok({ status: res.statusCode, data: pdf ? corpo.toString("base64") : null });
        }
        const testo = corpo.toString("utf8");
        let data = null;
        try { data = JSON.parse(testo); } catch (e) { /* non JSON: la pagina segnala la risposta inattesa */ }
        ok({ status: res.statusCode, data });
      });
      res.on("error", ko);
    });
    req.setTimeout(60000, () => req.destroy(new Error("Tempo scaduto")));
    req.on("error", ko);
  });
}
ipcMain.handle("iniure-sentenzeweb-get", (e, url) => {
  if (!e.senderFrame || !String(e.senderFrame.url).startsWith(ORIGIN + "/")) throw new Error("Richiesta non consentita");
  return sentenzeWebGet(url, false);
});
ipcMain.handle("iniure-sentenzeweb-pdf", (e, url) => {
  if (!e.senderFrame || !String(e.senderFrame.url).startsWith(ORIGIN + "/")) throw new Error("Richiesta non consentita");
  return sentenzeWebGet(url, true);
});

const menuTemplate = [
  { label: "File", submenu: [{ role: "quit", label: "Esci" }] },
  { label: "Modifica", submenu: [
    { role: "undo", label: "Annulla" }, { role: "redo", label: "Ripeti" }, { type: "separator" },
    { role: "cut", label: "Taglia" }, { role: "copy", label: "Copia" }, { role: "paste", label: "Incolla" },
    { role: "selectAll", label: "Seleziona tutto" },
  ] },
  { label: "Visualizza", submenu: [
    { role: "reload", label: "Ricarica" }, { type: "separator" },
    { role: "zoomIn", label: "Ingrandisci" }, { role: "zoomOut", label: "Riduci" }, { role: "resetZoom", label: "Dimensioni reali" },
    { type: "separator" }, { role: "togglefullscreen", label: "Schermo intero" },
  ] },
];
if (process.platform === "darwin") menuTemplate.unshift({ role: "appMenu" });

app.whenReady().then(() => {
  // app://iniure/<percorso> → file in app/, senza uscire dalla cartella
  protocol.handle("app", (req) => {
    const rel = decodeURIComponent(new URL(req.url).pathname).replace(/^\/+/, "") || "index.html";
    const file = path.normalize(path.join(APP_DIR, rel));
    if (!file.startsWith(APP_DIR + path.sep)) return new Response("Not found", { status: 404 });
    return net.fetch(pathToFileURL(file).toString()).catch(() => new Response("Not found", { status: 404 }));
  });
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on("second-instance", () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
