// Prova della Ricerca su iPhone (Comandi Rapidi) con un iPhone e un SentenzeWeb SIMULATI (nessuna richiesta vera).
// Il "comando" finto fa quello che fa il Comando Rapido vero: legge l'indirizzo dal link shortcuts://, esegue la
// richiesta e mette negli appunti la risposta in testo (con responseHeader.params, come il server vero).
const { JSDOM } = require("jsdom");
const fs = require("fs");
const { pathToFileURL } = require("url");
const P = require("path").resolve(__dirname, "..", "index.html");

let pass = 0, fail = 0;
const ok = (c, m) => (c ? (pass++, console.log("  ✓ " + m)) : (fail++, console.log("  ✗ FAIL: " + m)));
const wait = ms => new Promise(r => setTimeout(r, ms));
const SOLR = "https://www.italgiure.giustizia.it/sncass/isapi/hc.dll/sn.solr/sn-collection/select";

const TOT = 1234;
let eseguite = 0;
function server(url) {             // risposta come quella del Solr vero: parametri ripetuti in responseHeader.params
  eseguite++;
  const u = new URL(url), params = {};
  for (const k of new Set(u.searchParams.keys())) { const v = u.searchParams.getAll(k); params[k] = v.length > 1 ? v : v[0]; }
  const q = u.searchParams.get("q");
  if (/^id:/.test(q)) {
    const id = q.slice(3);
    return { responseHeader: { status: 0, params }, response: { numFound: 1, docs: [{ id, kind: "snciv", szdec: "3", anno: 2024, numdec: "01234", tipoprov: "Sentenza", ocr: ["Testo integrale della sentenza " + id + ".\n\nSecondo paragrafo."] }] } };
  }
  const start = +u.searchParams.get("start"), rows = +u.searchParams.get("rows");
  const n = Math.max(0, Math.min(rows, TOT - start)), docs = [], hl = {};
  for (let i = 0; i < n; i++) {
    const id = "doc" + (start + i);
    docs.push({ id, kind: "snciv", szdec: "3", anno: 2024, numdec: String(10000 + start + i), tipoprov: "Ordinanza", datdep: ["20240115"], filename: ["./20240115/snciv@s30@a2024@n" + (start + i) + "@tO.pdf"] });
    hl[id] = { ocr: ["estratto con <em>danno</em> " + id] };
  }
  return { responseHeader: { status: 0, params }, response: { numFound: TOT, docs }, highlighting: hl };
}

let appunti = "";
const dom = new JSDOM(fs.readFileSync(P, "utf8"), {
  url: pathToFileURL(P).href, runScripts: "dangerously", resources: "usable",
  beforeParse(w) { Object.defineProperty(w.navigator, "userAgent", { get: () => "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1" }); },
  pretendToBeVisual: true,
});
const w = dom.window, doc = w.document;
w.matchMedia = w.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {} }));
let letturaNegata = false;
w.navigator.clipboard = { writeText: t => (appunti = t, Promise.resolve()), readText: () => letturaNegata ? Promise.reject(new Error("NotAllowed")) : Promise.resolve(appunti) };
w.confirm = () => true;
const $ = s => doc.querySelector(s), $$ = s => Array.from(doc.querySelectorAll(s));
const click = el => el.dispatchEvent(new w.Event("click", { bubbles: true, cancelable: true }));
const until = async (f, ms = 8000) => { const t0 = Date.now(); while (!f() && Date.now() - t0 < ms) await wait(50); return f(); };
// il Comando Rapido: dal link shortcuts:// all'indirizzo, poi la risposta in testo negli appunti
function urlDelComando() {
  const a = $("#ric-esegui-comando"); if (!a) return null;
  const l = new URL(a.getAttribute("href"));
  return l.protocol === "shortcuts:" && l.searchParams.get("name") === "In Iure SentenzeWeb" && l.searchParams.get("input") === "text" ? l.searchParams.get("text") : null;
}
function eseguiComando() { const u = urlDelComando(); appunti = JSON.stringify(server(u)); return u; }

(async () => {
  await wait(800);
  const R = w.InIureRicerca, I = R && R._interni;
  ok(!!R && !!I, "modulo ricerca caricato");
  I.LIMITI.intervalloMs = 0;
  ok(I.trasporto() === "comandi", "su iPhone il trasporto e' «comandi» (Comandi Rapidi) [" + I.trasporto() + "]");

  console.log("\n[A] Presentazione");
  click($('.tab[data-section="ricerca"]'));
  await wait(100);
  ok(/Comandi Rapidi/.test($("#ric-risultati").textContent) && /In Iure SentenzeWeb/.test($("#ric-risultati").textContent), "senza ricerche: spiegazione e istruzioni per creare il comando");
  ok(!/non e' possibile/.test($("#ric-risultati").textContent), "non compare piu' l'avviso «ricerca non possibile»");

  console.log("\n[B] Primo blocco");
  $("#ric-testo").value = "danno biologico";
  $("#ric-form").dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
  await until(() => !!$("#ric-esegui-comando"));
  const u0 = urlDelComando();
  ok(!!u0 && u0.startsWith(SOLR + "?"), "il tasto 1 apre shortcuts://run-shortcut con l'indirizzo SentenzeWeb come testo");
  ok(u0 && new URL(u0).searchParams.get("rows") === "500" && new URL(u0).searchParams.get("start") === "0", "richiesta del primo blocco da 500");
  ok(eseguite === 0, "l'app non fa richieste da sola (nessun CORS su iPhone)");
  const conteggio0 = (I.limStato().r || []).length;

  appunti = "";
  click($("#ric-incolla")); await wait(100);
  ok(/vuoti/.test($("#ric-incolla-errore").textContent), "appunti vuoti: messaggio chiaro");
  appunti = "<html><body>Errore</body></html>";
  click($("#ric-incolla")); await wait(100);
  ok(/non ci sono i risultati/.test($("#ric-incolla-errore").textContent), "appunti con altro testo: rifiutati");
  const altra = new URL(u0); altra.searchParams.set("start", "500");
  appunti = JSON.stringify(server(altra.href)); eseguite--;
  click($("#ric-incolla")); await wait(100);
  ok(/un'altra richiesta/.test($("#ric-incolla-errore").textContent) && !$$(".sentenza-card").length, "risultati di un'altra richiesta: rifiutati, nessuna scheda");

  eseguiComando();
  click($("#ric-incolla"));
  await until(() => $$(".sentenza-card").length > 0 && !!$("#ric-esegui-comando") && new URL(urlDelComando()).searchParams.get("start") === "500");
  ok($$(".sentenza-card").length === 50, "risultati giusti: schede mostrate (prime 50)");
  ok(/1.?234/.test($("#ric-stato").textContent) && /500/.test($("#ric-stato").textContent), "conteggio: 1.234 trovati, 500 caricate [" + $("#ric-stato").textContent.trim() + "]");
  ok(new URL(urlDelComando()).searchParams.get("start") === "500" && /da 501 a 1.?000/.test($(".ric-comandi").textContent), "subito pronto il secondo blocco (schede da 501 a 1.000)");
  const conteggio1 = (I.limStato().r || []).length;
  ok(conteggio1 === conteggio0 + 1, "la richiesta fatta dal comando conta nei tetti del limitatore (" + conteggio0 + " -> " + conteggio1 + ")");

  console.log("\n[C] Blocchi successivi e incolla a mano");
  eseguiComando(); click($("#ric-incolla"));
  await until(() => urlDelComando() && new URL(urlDelComando()).searchParams.get("start") === "1000");
  letturaNegata = true;
  eseguiComando(); click($("#ric-incolla")); await wait(100);
  ok(!$("#ric-incolla-manuale").hidden, "lettura degli appunti negata: compare il riquadro per incollare a mano");
  $("#ric-incolla-testo").value = appunti;
  click($("#ric-incolla-usa"));
  await until(() => !$("#ric-esegui-comando") && /1.?234/.test($("#ric-stato").textContent) && !/caricamento/.test($("#ric-stato").textContent));
  letturaNegata = false;
  ok(!$("#ric-esegui-comando"), "elenco completo: nessun altro blocco da scaricare");
  ok(/schede caricate 1.?234/.test($("#ric-stato").textContent), "tutte le 1.234 schede caricate [" + $("#ric-stato").textContent.trim() + "]");

  console.log("\n[D] Ricerca ripetuta e testo integrale");
  const prima = eseguite;
  $("#ric-form").dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
  await until(() => /schede caricate 1.?234/.test($("#ric-stato").textContent) && !/caricamento/.test($("#ric-stato").textContent));
  ok(eseguite === prima && !$("#ric-esegui-comando"), "la stessa ricerca ripetuta arriva dalla memoria: nessun comando da eseguire");
  click($('[data-apri="doc0"]'));
  await until(() => !!$("#sentenza-testo #ric-esegui-comando"));
  const ut = urlDelComando();
  ok(ut && new URL(ut).searchParams.get("q") === "id:doc0" && /testo integrale/.test($("#sentenza-testo").textContent), "testo integrale: il riquadro chiede di eseguire il comando per quella sentenza");
  eseguiComando(); click($("#ric-incolla"));
  await until(() => /Testo integrale della sentenza doc0/.test($("#sentenza-testo").textContent));
  ok(/Testo integrale della sentenza doc0/.test($("#sentenza-testo").textContent), "testo integrale mostrato dopo l'incolla");

  console.log("\n[E] Rifiuto del sito");
  click($('[data-apri="doc1"]'));
  await until(() => !!$("#sentenza-testo #ric-esegui-comando"));
  appunti = "HTTP 429 Too Many Requests";
  click($("#ric-incolla")); await wait(100);
  const lim = I.limStato();
  ok(lim.pausaFino > Date.now() + 25 * 60000 && /sospese per 30 minuti/.test($("#ric-incolla-errore").textContent), "risposta di rifiuto (429): ricerche sospese per 30 minuti");

  console.log("\n" + pass + "/" + (pass + fail) + " verifiche superate");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
