// In Iure — processo principale Electron (versione desktop Windows/macOS/Linux).
// Serve la web-app (copiata in app/ da scripts/copy-web.js) dal protocollo sicuro app://iniure/
// e apre i link esterni (WhatsApp, pagamenti, siti) nel browser di sistema.
"use strict";
const { app, BrowserWindow, Menu, protocol, net, shell } = require("electron");
const path = require("path");
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
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false, spellcheck: true },
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
