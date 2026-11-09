// In Iure — ponte sicuro tra la pagina e il processo principale (solo app Windows/macOS/Linux).
// Espone UNA sola funzione: la richiesta a SentenzeWeb per la sezione Ricerca. Il sito non accetta richieste
// dalle pagine web (CORS), quindi la fa il processo principale, che controlla l'indirizzo (solo SentenzeWeb).
"use strict";
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("InIureDesktopRete", {
  get: (url) => ipcRenderer.invoke("iniure-sentenzeweb-get", String(url || "")),
});
