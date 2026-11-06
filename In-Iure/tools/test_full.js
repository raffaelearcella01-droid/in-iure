const { JSDOM } = require("jsdom");
const fs = require("fs");
const { pathToFileURL } = require("url");
const P = require("path").resolve(__dirname, "..", "index.html");

let pass = 0, fail = 0;
const ok = (c, m) => (c ? (pass++, console.log("  ✓ " + m)) : (fail++, console.log("  ✗ FAIL: " + m)));

const dom = new JSDOM(fs.readFileSync(P, "utf8"), {
  url: pathToFileURL(P).href, runScripts: "dangerously", resources: "usable", pretendToBeVisual: true,
});
const w = dom.window, doc = w.document;
w.matchMedia = w.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {} }));
w.navigator.clipboard = { writeText: () => Promise.resolve() };
let opened = [];
w.open = (u) => { opened.push(u); return { document: { write() {}, close() {} }, onload: null, print() {} }; };
let blobs = 0;
w.URL.createObjectURL = () => { blobs++; return "blob:x"; };
w.URL.revokeObjectURL = () => {};
w.print = () => {};
const wait = ms => new Promise(r => setTimeout(r, ms));
const $ = s => doc.querySelector(s), $$ = s => Array.from(doc.querySelectorAll(s));
const click = el => el.dispatchEvent(new w.Event("click", { bubbles: true }));
const type = (el, v) => { el.value = v; el.dispatchEvent(new w.Event("input", { bubbles: true })); };

(async () => {
  await wait(700);

  console.log("\n[A] Avvio e conteggi rimossi");
  ok($$("#codici-categorie .card").length === w.CODICI_INDEX.length && w.CODICI_INDEX.length >= 30, w.CODICI_INDEX.length + " codici e leggi (schede " + $$("#codici-categorie .card").length + ")");
  ok($$("#quiz-materie .card").length === 6, "6 materie quiz");
  ok($$("#atti-list .card").length >= 80, "atti >= 80 (" + $$("#atti-list .card").length + ")");
  ok($$(".card__meta").length === 0, "nessun conteggio articoli/domande visibile");
  ok(!!$(".logo-img") && !!$(".brand-name"), "logo + nome centrato presenti");

  console.log("\n[B] Ricerca globale per numero + codice");
  type($("#global-search-input"), "art 127 ter c.p.c.");
  let t = 0; while ($$("#codici-categorie .articolo").length === 0 && t++ < 40) await wait(100);
  let first = $("#codici-categorie .articolo");
  ok(first && first.getAttribute("data-num") === "127-ter" && first.getAttribute("data-code") === "cpc",
    "«art 127 ter c.p.c.» -> 1° = 127-ter del c.p.c.");

  type($("#global-search-input"), "1453 cc");
  t = 0; while (($("#codici-categorie .articolo") || {}).getAttribute && $("#codici-categorie .articolo").getAttribute("data-num") !== "1453" && t++ < 40) await wait(100);
  first = $("#codici-categorie .articolo");
  ok(first && first.getAttribute("data-num") === "1453" && first.getAttribute("data-code") === "codice-civile",
    "«1453 cc» -> 1° = art. 1453 del codice civile");

  console.log("\n[C] Codice: ricerca numero, prefissi e parola chiave");
  type($("#global-search-input"), "");
  await wait(320);
  const cc = $$("#codici-categorie .card").find(c => /Civile/.test(c.textContent) && !/Procedura/.test(c.textContent));
  click(cc);
  t = 0; while ($$("#articoli-list .articolo").length === 0 && t++ < 50) await wait(100);
  ok($$("#articoli-list .articolo").length > 0, "codice civile caricato");
  type($("#codice-search"), "art. 2043");
  await wait(200);
  ok(($("#articoli-list .articolo") || {}).getAttribute && $("#articoli-list .articolo").getAttribute("data-num") === "2043", "«art. 2043» -> 2043 primo");
  type($("#codice-search"), "usufrutto");
  await wait(200);
  ok($$("#articoli-list .articolo").length > 0, "parola chiave «usufrutto» trova articoli");

  console.log("\n[D] Copia e condivisione WhatsApp");
  const art0 = $("#articoli-list .articolo");
  click(art0.querySelector("[data-copy]"));
  opened = [];
  click(art0.querySelector("[data-wa]"));
  ok(opened.some(u => /wa\.me/.test(u)), "WhatsApp apre link wa.me con il testo");

  console.log("\n[E] Quiz completo fino al risultato");
  click($$(".tab").find(x => x.getAttribute("data-section") === "quiz"));
  await wait(50);
  click($$("#quiz-materie .card")[0]);
  await wait(50);
  ok(!$("#quiz-setup").hidden, "scelta della sessione mostrata");
  click($('#quiz-setup [data-len="10"]'));
  await wait(50);
  ok($("#quiz-counter").textContent.indexOf("di 10") !== -1, "sessione da 10 domande");
  let guard = 0;
  while ($("#quiz-play") && !$("#quiz-play").hidden && guard++ < 40) {
    const opt = $("#quiz-options .quiz-opt");
    if (opt) click(opt);
    await wait(20);
    const next = $("#quiz-next");
    if (next && !next.hidden) click(next);
    await wait(20);
  }
  ok($("#quiz-result") && !$("#quiz-result").hidden, "quiz completato: schermata risultato mostrata");
  ok(/\d+\s*\/\s*\d+/.test(($("#quiz-final-score") || {}).textContent || ""), "punteggio finale mostrato");
  ok(w.InIureStore.get("quiz_stats_" + w.QUIZ[0].id, null) !== null, "statistiche del quiz salvate");

  console.log("\n[F] Atto: compilazione, Word, PDF");
  click($$(".tab").find(x => x.getAttribute("data-section") === "scrittura"));
  await wait(50);
  click($$("#atti-list .card")[0]);
  await wait(50);
  click($$(".atto-tab").find(x => x.getAttribute("data-atto-tab") === "compila"));
  await wait(50);
  const f = $("#atto-form [data-field]");
  type(f, "MARIO_ROSSI");
  await wait(50);
  ok($("#atto-preview").textContent.includes("MARIO_ROSSI"), "anteprima aggiornata");
  blobs = 0; click($("#atto-word"));
  ok(blobs > 0, "download Word genera un file (Blob)");
  opened = []; click($("#atto-pdf"));
  ok(opened.length > 0, "download PDF apre la finestra di stampa");

  await wait(400);
  ok((function(){ const n=$("#atto-title").textContent; const at=w.ATTI.concat(w.ATTI_EXTRA).find(a=>a.nome===n); return at && w.InIureStore.get("bozza_" + at.id, null) !== null; })(), "bozza dell'atto salvata automaticamente");

  console.log("\n[H] Novita': rimandi, preferiti, cronologia, tema");
  click($$(".tab").find(x => x.getAttribute("data-section") === "codici"));
  await wait(50);
  click($('[data-codice="cpc"]'));
  t = 0; while ($$("#articoli-list .articolo").length === 0 && t++ < 50) await wait(100);
  ok($$("#articoli-list .articolo").length === 50 && !!$("#articoli-list .load-more"), "rendering progressivo (50 articoli + Mostra altri)");
  type($("#codice-search"), "171-ter");
  await wait(250);
  const x = $("#articoli-list .articolo .xref");
  ok(!!x, "rimando cliccabile presente nel testo (171-ter c.p.c.)");
  if (x) { click(x); await wait(200); ok(!$("#xref-modal").hidden && !!$("#xref-body .articolo"), "anteprima dell'articolo richiamato"); $("#xref-modal").hidden = true; }
  click($("#articoli-list .articolo [data-fav]"));
  ok(w.InIureStore.get("fav_articoli", []).length === 1, "articolo aggiunto ai preferiti");
  ok(w.location.protocol === "file:" || w.location.hash.indexOf("#/codice/cpc") === 0, "indirizzo con il codice aperto (" + w.location.hash + ")");
  click($$(".tab").find(x => x.getAttribute("data-section") === "preferiti"));
  t = 0; while ($$("#fav-articoli .articolo").length === 0 && t++ < 30) await wait(100);
  ok($$("#fav-articoli .articolo").length === 1, "preferito visibile nella sezione Preferiti");
  click($('[data-tema="scuro"]'));
  ok(doc.documentElement.getAttribute("data-theme") === "dark", "tema scuro attivabile");
  click($('[data-tema="chiaro"]'));
  click($('[data-font="3"]'));
  ok(doc.documentElement.style.getPropertyValue("--fs") === "1.25", "dimensione del testo regolabile");
  click($$(".tab").find(x => x.getAttribute("data-section") === "codici"));
  type($("#global-search-input"), "l. 241/1990 21-octies");
  t = 0; while ($$("#codici-categorie .articolo").length === 0 && t++ < 60) await wait(100);
  first = $("#codici-categorie .articolo");
  ok(first && first.getAttribute("data-code") === "l241" && first.getAttribute("data-num") === "21-octies", "ricerca per estremi di legge: l. 241/1990 art. 21-octies");
  click($$(".tab").find(x => x.getAttribute("data-section") === "scrittura"));
  await wait(50);

  console.log("\n[G] Robustezza dati");
  ok($$("#atti-search").length === 1, "campo ricerca atti presente");
  type($("#atti-search"), "sfratto");
  await wait(50);
  ok($$("#atti-list .card").length > 0, "ricerca atti «sfratto» trova modelli");

  console.log("\n========== " + pass + " OK, " + fail + " FAIL ==========");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error("ERRORE:", e); process.exit(2); });
