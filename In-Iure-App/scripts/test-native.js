// Test dello strato nativo su www/ (eseguire dopo `npm run copy-web`).
// Simula window.Capacitor con plugin finti e verifica che Word, PDF, condivisione
// immagine e tasto Indietro passino dalle API native invece che da quelle web.
"use strict";
const path = require("path");
const fs = require("fs");
const { pathToFileURL } = require("url");
const { JSDOM } = require(path.resolve(__dirname, "..", "..", "In-Iure", "tools", "node_modules", "jsdom"));

const P = path.resolve(__dirname, "..", "www", "index.html");
let pass = 0, fail = 0;
const ok = (c, m) => (c ? (pass++, console.log("  ✓ " + m)) : (fail++, console.log("  ✗ FAIL: " + m)));
const calls = { write: [], share: [], exit: 0, sw: 0, open: [] };
let backHandler = null;

const dom = new JSDOM(fs.readFileSync(P, "utf8"), {
  url: pathToFileURL(P).href, runScripts: "dangerously", resources: "usable", pretendToBeVisual: true,
  beforeParse(w) {
    w.Capacitor = {
      isNativePlatform: () => true,
      Plugins: {
        Filesystem: { writeFile: (o) => { calls.write.push(o); return Promise.resolve({ uri: "file:///cache/" + o.path }); } },
        Share: { share: (o) => { calls.share.push(o); return Promise.resolve({}); } },
        App: { addListener: (ev, fn) => { if (ev === "backButton") backHandler = fn; }, exitApp: () => { calls.exit++; } },
        StatusBar: { setStyle: () => Promise.resolve() },
      },
    };
    w.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });
    w.open = (u) => { calls.open.push(u); return null; };
    Object.defineProperty(w.navigator, "serviceWorker", { value: { register: () => { calls.sw++; return Promise.resolve(); } } });
    // Canvas minimale per la generazione dell'immagine articolo
    let ctx; ctx = new Proxy({}, { get: (t, k) => (k in t ? t[k] : (k === "measureText" ? () => ({ width: 10 }) : () => ctx)), set: (t, k, v) => ((t[k] = v), true) });
    w.HTMLCanvasElement.prototype.getContext = () => ctx;
    w.HTMLCanvasElement.prototype.toBlob = function (cb) { cb(new w.Blob(["png"], { type: "image/png" })); };
    w.HTMLCanvasElement.prototype.toDataURL = () => "data:image/png;base64,";
  },
});
const w = dom.window, doc = w.document;
const wait = ms => new Promise(r => setTimeout(r, ms));
const $ = s => doc.querySelector(s), $$ = s => Array.from(doc.querySelectorAll(s));
const click = el => el.dispatchEvent(new w.Event("click", { bubbles: true }));
const type = (el, v) => { el.value = v; el.dispatchEvent(new w.Event("input", { bubbles: true })); };
const until = async (fn, n = 60) => { for (let i = 0; i < n && !fn(); i++) await wait(100); return fn(); };

(async () => {
  await wait(800);
  console.log("\n[1] Avvio in modalita' nativa");
  ok(w.InIureNative && w.InIureNative.isNative === true, "InIureNative attivo");
  ok(doc.documentElement.classList.contains("is-native-app"), "classe is-native-app sull'html");
  w.dispatchEvent(new w.Event("load")); await wait(50);
  ok(calls.sw === 0, "service worker NON registrato nell'app");
  ok($("#install-top").hidden === true, "pulsante «Installa app» nascosto");
  ok(typeof backHandler === "function", "listener tasto Indietro registrato");

  console.log("\n[2] Atto: Word e PDF via Filesystem + Share");
  click($$(".tab").find(x => x.getAttribute("data-section") === "scrittura")); await wait(50);
  click($$("#atti-list .card")[0]); await wait(50);
  click($("#atto-word"));
  await until(() => calls.share.length >= 1);
  const wordW = calls.write[0] || {};
  ok(/\.doc$/.test(wordW.path || "") && wordW.directory === "CACHE" && (wordW.data || "").length > 50, "Word scritto in cache (" + wordW.path + ")");
  ok(calls.share[0] && calls.share[0].files && calls.share[0].files[0] === "file:///cache/" + wordW.path, "Word passato al menu di condivisione");
  click($("#atto-pdf"));
  await until(() => calls.share.length >= 2, 80);
  const pdfW = calls.write[1] || {};
  const pdfHead = pdfW.data ? Buffer.from(pdfW.data, "base64").slice(0, 5).toString() : "";
  ok(/\.pdf$/.test(pdfW.path || "") && pdfHead === "%PDF-", "PDF generato con jsPDF (" + pdfW.path + ", intestazione " + pdfHead + ")");
  ok(calls.open.length === 0, "nessuna finestra popup/stampa aperta");

  console.log("\n[3] Tasto Indietro");
  backHandler(); await wait(50);
  ok(!$("#scrittura-home").hidden, "dall'atto torna al formulario");
  backHandler(); await wait(50);
  ok($('.tab[data-section="codici"]').classList.contains("is-active"), "dalla sezione Scrittura torna a Codici");
  backHandler(); await wait(50);
  ok(calls.exit === 1, "dalla home esce dall'app");

  console.log("\n[4] Articolo: condivisione immagine");
  const card = $$("#codici-categorie .card").find(c => /Costituzione/.test(c.textContent));
  click(card);
  await until(() => $$("#articoli-list .articolo [data-wa]").length > 0);
  const n = calls.share.length;
  click($("#articoli-list .articolo [data-wa]"));
  await until(() => calls.share.length > n);
  const img = calls.share[n] || {};
  ok(/\.png$/.test((calls.write[calls.write.length - 1] || {}).path || "") && img.files && img.text, "immagine articolo scritta e condivisa con didascalia");

  console.log("\n========== " + pass + " OK, " + fail + " FAIL ==========");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
