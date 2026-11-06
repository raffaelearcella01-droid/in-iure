// Collaudo dell'aggiornamento automatico dei contenuti (simula un'app installata e un server di aggiornamento).
// Uso: node test_aggiornamento.js   (richiede: npm install --no-save fake-indexeddb)
const { JSDOM, requestInterceptor } = require("jsdom");
const fs = require("fs"), path = require("path");
require("fake-indexeddb/auto");
const APP = path.resolve(__dirname, "..");
const ORIGIN = "https://app.local/", UPD = "https://aggiornamenti.example/";

let pass = 0, fail = 0;
const ok = (c, m) => (c ? (pass++, console.log("  ✓ " + m)) : (fail++, console.log("  ✗ FAIL: " + m)));
const wait = ms => new Promise(r => setTimeout(r, ms));

// --- contenuti "remoti": c.p.c. con una rubrica modificata e un atto rinominato ---
const LOCAL = JSON.parse(fs.readFileSync(APP + "/js/codici-versioni.json", "utf8"));
let cpc = fs.readFileSync(APP + "/js/codici/cpc.js", "utf8");
cpc = cpc.replace('"rubrica":"Giurisdizione dei giudici ordinari"', '"rubrica":"RUBRICA AGGIORNATA DAL SERVER"');
let attiExtra = fs.readFileSync(APP + "/js/data-atti-extra.js", "utf8");
const A = new Function(attiExtra + ";return ATTI_EXTRA")();
A[0].nome = "ATTO AGGIORNATO DAL SERVER";
attiExtra = "var ATTI_EXTRA = " + JSON.stringify(A) + ";\n";
const REMOTE = JSON.parse(JSON.stringify(LOCAL));
REMOTE.generato = "2099-01-01T00:00:00Z";
REMOTE.files["js/codici/cpc.js"] = "hash-nuovo-cpc";
REMOTE.files["js/data-atti-extra.js"] = "hash-nuovo-atti";
const SERVER = { "js/codici-versioni.json": JSON.stringify(REMOTE), "js/codici/cpc.js": cpc, "js/data-atti-extra.js": attiExtra };

const loader = {
  interceptors: [requestInterceptor((request) => {
    const url = request.url;
    if (url.startsWith("https://www.gstatic.com")) return Promise.resolve(new Response("", { headers: { "Content-Type": "application/javascript" } }));
    if (!url.startsWith(ORIGIN)) return undefined;
    const rel = url.replace(ORIGIN, "").split("?")[0];
    const body = rel === "js/update-config.js" ? 'window.IN_IURE_UPDATE_URL = "' + UPD + '";' : fs.readFileSync(path.join(APP, rel));
    return Promise.resolve(new Response(body, { headers: { "Content-Type": /.css$/.test(rel) ? "text/css" : "application/javascript" } }));
  })]
};
function open(online, versioniLocali) {
  let downloads = [];
  const dom = new JSDOM(fs.readFileSync(APP + "/index.html", "utf8"), {
    url: ORIGIN + "index.html", runScripts: "dangerously", resources: loader, pretendToBeVisual: true,
    beforeParse(w) {
      w.indexedDB = indexedDB; w.IDBKeyRange = IDBKeyRange;
      w.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });
      w.scrollTo = () => {};
      w.fetch = (url) => {
        if (!online || !url.startsWith(UPD)) return Promise.reject(new Error("offline"));
        const rel = url.replace(UPD, "").split("?")[0];
        downloads.push(rel);
        return Promise.resolve({ ok: !!SERVER[rel], status: SERVER[rel] ? 200 : 404, text: () => Promise.resolve(SERVER[rel] || "") });
      };
      if (versioniLocali) Object.defineProperty(w, "CONTENUTI_VERSIONI", { get: () => versioniLocali, set() {} });
    }
  });
  return { dom, w: dom.window, downloads: () => downloads };
}
const click = (w, el) => el.dispatchEvent(new w.Event("click", { bubbles: true }));
async function rubricaArt1(w) {
  click(w, w.document.querySelector('[data-codice="cpc"]'));
  let t = 0; while (!w.document.querySelector('#articoli-list .articolo[data-num="1"]') && t++ < 60) await wait(100);
  const el = w.document.querySelector('#articoli-list .articolo[data-num="1"] .articolo__rubrica');
  return el ? el.textContent : "";
}

(async () => {
  console.log("\n[1] Primo avvio online: scarica solo i file cambiati e li mostra");
  let s = open(true);
  await wait(3500);
  const dl = s.downloads();
  ok(dl.includes("js/codici-versioni.json"), "controllo versione sul server");
  ok(dl.length === 3 && dl.includes("js/codici/cpc.js") && dl.includes("js/data-atti-extra.js"), "scaricati solo i 2 file cambiati (" + dl.join(", ") + ")");
  ok(Array.from(s.w.document.querySelectorAll("#atti-list .card__title")).some(e => /ATTO AGGIORNATO DAL SERVER/.test(e.textContent)), "atto aggiornato visibile nell'elenco");
  ok((await rubricaArt1(s.w)) === "RUBRICA AGGIORNATA DAL SERVER", "articolo del c.p.c. aggiornato");
  ok(!s.w.document.querySelector("#upd-controlla") && !s.w.document.querySelector("#upd-stato"), "nessun pulsante di aggiornamento nell'app");
  s.w.close();

  console.log("\n[2] Riapertura SENZA connessione: i contenuti scaricati restano");
  s = open(false);
  await wait(2500);
  ok((await rubricaArt1(s.w)) === "RUBRICA AGGIORNATA DAL SERVER", "c.p.c. aggiornato anche offline");
  ok(Array.from(s.w.document.querySelectorAll("#atti-list .card__title")).some(e => /ATTO AGGIORNATO DAL SERVER/.test(e.textContent)), "atto aggiornato anche offline");
  s.w.close();

  console.log("\n[3] Installata un'app piu' recente del contenuto scaricato: si usano i testi dell'app");
  const piuNuova = JSON.parse(JSON.stringify(LOCAL)); piuNuova.generato = "2100-01-01T00:00:00Z";
  s = open(false, piuNuova);
  await wait(2500);
  ok((await rubricaArt1(s.w)) === "Giurisdizione dei giudici ordinari", "torna al testo incluso nell'app");
  s.w.close();

  console.log("\n[4] Dati remoti non validi: nessuna modifica");
  SERVER["js/codici/cpc.js"] = "<html>errore</html>";
  REMOTE.generato = "2101-01-01T00:00:00Z"; SERVER["js/codici-versioni.json"] = JSON.stringify(REMOTE);
  s = open(true, piuNuova);
  await wait(3500);
  ok((await rubricaArt1(s.w)) === "Giurisdizione dei giudici ordinari", "file corrotto scartato, testo invariato");
  s.w.close();

  console.log("\n========== AGGIORNAMENTO: " + pass + " OK, " + fail + " FAIL ==========");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error("ERRORE:", e); process.exit(2); });
