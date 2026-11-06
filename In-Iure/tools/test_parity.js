const { JSDOM } = require("jsdom");
const fs = require("fs");
const APP = require("path").resolve(__dirname, "..");
const standalone = fs.readFileSync(APP + "/index-standalone.html", "utf8");
let pass = 0, fail = 0;
const ok = (c, m) => { (c ? pass++ : fail++); console.log((c ? "  OK   " : " FAIL  ") + m); };

console.log("[1] Integrità dati: stessi contenuti incorporati byte-per-byte");
const IDX = new Function(fs.readFileSync(APP + "/js/codici-index.js", "utf8") + ";return CODICI_INDEX")();
const dataFiles = ["js/codici-index.js"].concat(IDX.map(m => m.file)).concat(["js/data-quiz.js", "js/data-quiz-extra.js", "js/data-atti.js", "js/data-atti-extra.js", "js/app.js"]);
dataFiles.forEach(f => {
  let src = fs.readFileSync(APP + "/" + f, "utf8").trim();
  // app.js/dati non contengono "</script>": nel file unico è protetto, quindi confronto la parte prima di eventuali escape
  const present = standalone.includes(src.replace(/<\/script>/g, "<\\/script>"));
  ok(present, "incorporato identico: " + f);
});

console.log("\n[2] Conteggi articoli per codice (file unico vs sorgente)");
const expected = {}; IDX.forEach(m => expected[m.id] = m.count);
// conteggio reale dai file sorgente
Object.keys(expected).forEach(id => {
  let X; global.registerCodice = c => X = c;
  eval(fs.readFileSync(APP + "/js/codici/" + id + ".js", "utf8"));
  ok(X.articoli.length === expected[id], id + ": " + X.articoli.length + " articoli (atteso " + expected[id] + ")");
});

console.log("\n[3] Collaudo funzionale sul FILE UNICO (jsdom, senza risorse esterne)");
const dom = new JSDOM(standalone, {
  runScripts: "dangerously", pretendToBeVisual: true,
  beforeParse(w) {
    w.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
    w.navigator.clipboard = { writeText: () => Promise.resolve() };
    w.__opened = []; w.open = u => { w.__opened.push(u); return { document: { write() {}, close() {} }, print() {} }; };
    w.__blobs = 0; w.URL.createObjectURL = () => { w.__blobs++; return "blob:x"; }; w.URL.revokeObjectURL = () => {};
    w.print = () => {};
  }
});
const w = dom.window, doc = w.document;
const wait = ms => new Promise(r => setTimeout(r, ms));
const $ = s => doc.querySelector(s), $$ = s => Array.from(doc.querySelectorAll(s));
const click = el => el.dispatchEvent(new w.Event("click", { bubbles: true }));
const type = (el, v) => { el.value = v; el.dispatchEvent(new w.Event("input", { bubbles: true })); };

(async () => {
  await wait(500);
  ok($$("#codici-categorie .card").length === IDX.length, IDX.length + " codici");
  ok($$("#quiz-materie .card").length === 6, "6 materie quiz");
  ok($$("#atti-list .card").length === w.ATTI.length + w.ATTI_EXTRA.length, (w.ATTI.length + w.ATTI_EXTRA.length) + " atti");
  ok((w.CODICI_INDEX || []).length === IDX.length, "indice codici completo");

  // apri ogni codice dalla cache interna e verifica il conteggio
  for (const id of Object.keys(expected)) {
    const card = $$("#codici-categorie .card").find(c => c.getAttribute("data-codice") === id);
    click(card);
    let t = 0; while (!/\d+ articoli/.test(($("#codice-count") || {}).textContent || "") && t++ < 60) await wait(50);
    const n = parseInt(($("#codice-count").textContent.match(/(\d+) articoli/) || [0, 0])[1], 10);
    ok(n === expected[id], "aperto " + id + " -> " + n + " articoli (dalla cache interna)");
    click($$(".tab").find(x => x.getAttribute("data-section") === "codici"));
    await wait(30);
  }

  // ricerca globale su tutti i codici (richiede tutti preload)
  type($("#global-search-input"), "art 127 ter c.p.c."); await wait(400);
  ok(($("#codici-categorie .articolo") || {}).getAttribute && $("#codici-categorie .articolo").getAttribute("data-num") === "127-ter", "ricerca per codice 127-ter");

  // quiz completo
  click($$(".tab").find(x => x.getAttribute("data-section") === "quiz")); await wait(30);
  click($$("#quiz-materie .card")[0]); await wait(30); click(doc.querySelector('#quiz-setup [data-len="10"]')); await wait(30);
  let g = 0;
  while ($("#quiz-play") && !$("#quiz-play").hidden && g++ < 40) {
    const o = $("#quiz-options .quiz-opt"); if (o) click(o); await wait(15);
    const nx = $("#quiz-next"); if (nx && !nx.hidden) click(nx); await wait(15);
  }
  ok($("#quiz-result") && !$("#quiz-result").hidden, "quiz completato con risultato");

  // atto: compila + word + pdf
  click($$(".tab").find(x => x.getAttribute("data-section") === "scrittura")); await wait(30);
  click($$("#atti-list .card")[0]); await wait(30);
  click($$(".atto-tab").find(x => x.getAttribute("data-atto-tab") === "compila")); await wait(30);
  type($("#atto-form [data-field]"), "TEST123"); await wait(30);
  ok($("#atto-preview").textContent.includes("TEST123"), "anteprima atto aggiornata");
  w.__blobs = 0; click($("#atto-word")); ok(w.__blobs > 0, "download Word (Blob)");
  w.__opened = []; click($("#atto-pdf")); ok(w.__opened.length > 0, "download PDF (stampa)");

  console.log("\n========== PARITÀ: " + pass + " OK, " + fail + " FAIL ==========");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error("ERR:", e.message); process.exit(2); });
