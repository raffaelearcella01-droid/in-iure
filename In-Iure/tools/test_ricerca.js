// Prova delle sezioni Ricerca (SentenzeWeb) e Sentenze salvate con un SentenzeWeb SIMULATO (nessuna richiesta vera).
const { JSDOM } = require("jsdom");
const fs = require("fs");
const { pathToFileURL } = require("url");
const P = require("path").resolve(__dirname, "..", "index.html");

let pass = 0, fail = 0;
const ok = (c, m) => (c ? (pass++, console.log("  ✓ " + m)) : (fail++, console.log("  ✗ FAIL: " + m)));
const wait = ms => new Promise(r => setTimeout(r, ms));

const TOT = 1234;
const richieste = [];
const pdfRichiesti = [];
function finto(url, opz) {
  const u = new URL(url);
  if (opz && opz.binario) {   // PDF ufficiale: si risponde con un PDF minimo (base64 di "%PDF-1.4 ...")
    pdfRichiesti.push(url);
    return Promise.resolve({ status: 200, data: Buffer.from("%PDF-1.4\n%%EOF\n").toString("base64") });
  }
  richieste.push(u);
  const q = u.searchParams.get("q");
  if (/^id:/.test(q)) {
    const id = q.slice(3);
    return Promise.resolve({ status: 200, data: { response: { numFound: 1, docs: [{ id, kind: "snciv", szdec: "3", anno: 2024, numdec: "01234", tipoprov: "Sentenza", ocr: [id === "doc0" ? "ha pronunciato la seguente ORDINANZA. FATTI DI CAUSA Testo integrale della sentenza doc0, ex art. 12 Cost. e art. 2043 c.c. RAGIONI DELLA DECISIONE 1. Con il primo motivo si lamenta. 2.1. Il motivo e' infondato. P.Q.M. La Corte rigetta." : "Testo integrale della sentenza " + id + ".\n\nSecondo paragrafo."] }] } } });
  }
  const start = +u.searchParams.get("start"), rows = +u.searchParams.get("rows");
  const n = Math.max(0, Math.min(rows, TOT - start));
  const docs = [], hl = {};
  for (let i = 0; i < n; i++) {
    const id = "doc" + (start + i);
    docs.push({ id, kind: i % 2 ? "snpen" : "snciv", szdec: "3", anno: 2024, numdec: String(10000 + start + i), tipoprov: "Ordinanza", datdep: ["20240115"], filename: ["./20240115/snciv@s30@a2024@n" + (start + i) + "@tO.pdf"] });
    hl[id] = { ocr: ["estratto con <em>danno</em> " + id] };
  }
  return Promise.resolve({ status: 200, data: { response: { numFound: TOT, docs }, highlighting: hl } });
}

const dom = new JSDOM(fs.readFileSync(P, "utf8"), {
  url: pathToFileURL(P).href, runScripts: "dangerously", resources: "usable", pretendToBeVisual: true,
  beforeParse(w) { w.__InIureRicercaTest = finto; },
});
const w = dom.window, doc = w.document;
w.matchMedia = w.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {} }));
w.navigator.clipboard = { writeText: () => Promise.resolve() };
let blobs = [];
w.URL.createObjectURL = (b) => { blobs.push(b); return "blob:x"; };
w.URL.revokeObjectURL = () => {};
w.confirm = () => true;
const $ = s => doc.querySelector(s), $$ = s => Array.from(doc.querySelectorAll(s));
const click = el => el.dispatchEvent(new w.Event("click", { bubbles: true }));
const until = async (f, ms = 8000) => { const t0 = Date.now(); while (!f() && Date.now() - t0 < ms) await wait(50); return f(); };

(async () => {
  await wait(800);
  const R = w.InIureRicerca, I = R && R._interni;
  ok(!!R && !!I, "modulo ricerca caricato");
  I.LIMITI.intervalloMs = 0;   // in prova niente attese

  console.log("\n[A] Sezioni e menu");
  ok($$(".tab").length === 6 && !!$('.tab[data-section="ricerca"]') && !!$('.tab[data-section="salvate"]'), "6 voci nel menu, con Ricerca e Salvate");
  click($('.tab[data-section="ricerca"]'));
  ok($("#section-ricerca").classList.contains("is-active") && (w.location.protocol === "file:" || /#\/ricerca$/.test(w.location.href)), "la voce Ricerca apre la sezione (#/ricerca) [" + w.location.hash + "]");
  ok($$(".ric-modo").length === 3, "tre modalita': articolo, parole chiave, frase esatta");
  ok($$("#ric-codice option").length >= 30, "elenco dei codici per la ricerca per articolo");

  console.log("\n[B] Costruzione delle ricerche");
  const qa = I.articoloInQuery("codice-civile", "2043");
  ok(/"art\. 2043 c\.c\."~3/.test(qa) && /"2043 cod\. civ\."~1/.test(qa) && /"art\. 2043 del codice civile"~2/.test(qa) && / OR /.test(qa), "articolo: tutte le forme di citazione in OR");
  ok(/"art\. 360 bis c\.p\.c\."~3/.test(I.articoloInQuery("cpc", "360-bis")), "articolo con suffisso: 360-bis -> 360 bis");
  ok(/"art\. 21 241 1990"~8/.test(I.articoloInQuery("l241", "21")), "legge numerata: numero e anno dell'atto");
  ok(/"art\. 33 206 2005"~8/.test(I.articoloInQuery("consumo", "33")) && /cod\. cons\./.test(I.articoloInQuery("consumo", "33")), "codice del consumo: abbreviazione e d.lgs. 206/2005");
  ok(I.articoloInQuery("codice-civile", "abc") === "", "numero di articolo non valido rifiutato");
  ok(I.paroleInQuery("responsabilita medica risarci*") === "responsabilita AND medica AND risarci*", "parole chiave: AND tra le parole, asterisco conservato");
  ok(I.paroleInQuery("mobbing OR vessazioni") === "mobbing OR vessazioni", "parole chiave: OR tra sinonimi");
  ok(I.paroleInQuery('a:b "lastrico solare" (x)') === 'a AND b AND "lastrico solare" AND x', "caratteri speciali neutralizzati, virgolette conservate");
  ok(I.fraseInQuery('danno "da" perdita di chance') === '"danno da perdita di chance"', "frase esatta tra virgolette");
  const fq = I.filtri({ archivio: "civile", annoDa: "2022", annoA: "", sezione: "U", tipo: "Sentenza" });
  ok(fq.join("|") === 'kind:snciv|anno:[2022 TO *]|szdec:"U"|tipoprov:"Sentenza"', "filtri: archivio, anni, sezione, tipo");

  console.log("\n[C] Ricerca con elenco completo");
  $("#ric-testo").value = "danno biologico";
  $("#ric-form").dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
  await until(() => /1\.234|1234/.test($("#ric-stato").textContent) && !/caricamento/.test($("#ric-stato").textContent));
  const ricerche = richieste.filter(u => !/^id:/.test(u.searchParams.get("q")));
  ok(ricerche.length === 3, "1234 risultati scaricati in 3 richieste da 500 (" + ricerche.length + ")");
  ok(ricerche[0].searchParams.get("q") === "ocr:(danno AND biologico)" && ricerche[0].searchParams.get("rows") === "500", "richiesta Solr corretta (q, rows=500)");
  ok(/schede caricate 1\.234|schede caricate 1234/.test($("#ric-stato").textContent), "tutte le 1234 schede caricate");
  ok($$("#ric-risultati .sentenza-card").length === 50, "mostrate 50 schede per volta");
  click($("#ric-altre"));
  ok($$("#ric-risultati .sentenza-card").length === 100, "«Mostra altri» aggiunge 50 schede");
  ok(/Cass\. civ\., Sez\. 3, ordinanza n\. 10000\/2024/.test($("#ric-risultati").textContent), "estremi della scheda");
  ok(!/<em>|&lt;em/.test($("#ric-risultati").innerHTML) && /estratto con/.test($("#ric-risultati").textContent), "estratto senza i marcatori <em> del sito mostrati come testo");
  ok(/<mark>danno<\/mark>/.test($("#ric-risultati").innerHTML), "parole trovate evidenziate nell'estratto");
  const nPrima = richieste.length;
  $("#ric-form").dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
  await until(() => !/caricamento/.test($("#ric-stato").textContent) && /schede caricate 1/.test($("#ric-stato").textContent));
  await wait(200);
  ok(richieste.length === nPrima, "ricerca ripetuta servita dalla memoria (nessuna nuova richiesta)");
  const lim = w.InIureStore.get("sw_limitatore", null);
  ok(lim && lim.r.length === 3, "protezione anti-blocco: richieste registrate (" + (lim && lim.r.length) + ")");

  console.log("\n[D] Lettura e salvataggio");
  click($('[data-apri="doc0"]'));
  await until(() => pdfRichiesti.length > 0);
  await wait(100);
  ok(pdfRichiesti.length === 1 && /hc\.dll\?verbo=attach&db=snciv&id=\.\/20240115\/snciv@s30@a2024@n0@tO\.clean\.pdf$/.test(pdfRichiesti[0]), "apertura: chiesto il PDF ufficiale (" + pdfRichiesti[0] + ")");
  // jsdom non sa disegnare il PDF: l'app deve ripiegare sul testo, spiegandolo (nelle app vere il PDF si vede)
  await until(() => /PDF non disponibile ora|Testo integrale della sentenza doc0/.test($("#sentenza-testo").textContent));
  ok(/Come nel PDF/.test($("#sentenza-testo").textContent) && !!$('[data-vista-sentenza="pdf"]'), "tasto «Come nel PDF» presente");
  ok(/PDF non disponibile ora/.test($("#sentenza-testo").textContent), "se il PDF non si puo' disegnare: avviso e ripiego sul testo");
  ok(w.InIureStore.get("sw_limitatore", null).r.length >= 4, "anche il PDF passa dalla protezione anti-blocco");
  click($('[data-vista-sentenza="testo"]'));
  await until(() => /Testo integrale della sentenza doc0/.test($("#sentenza-testo").textContent));
  ok(!$("#sentenza-detail").hidden && /Testo integrale della sentenza doc0/.test($("#sentenza-testo").textContent), "vista Testo: testo integrale");
  const h3 = $$("#sentenza-testo h3").map(x => x.textContent), ps = $$("#sentenza-testo .sentenza-testo p").map(x => x.textContent);
  ok(h3.join("|") === "FATTI DI CAUSA|RAGIONI DELLA DECISIONE|P.Q.M.", "testo ordinato: titoli del provvedimento (" + h3.join("|") + ")");
  ok(ps.some(p => /^1\. Con il primo motivo/.test(p)) && ps.some(p => /^2\.1\. Il motivo/.test(p)) && ps.some(p => /art\. 12 Cost\. e art\. 2043 c\.c\./.test(p)), "testo ordinato: punti numerati a capo, riferimenti normativi intatti");
  ok(/riconoscimento ottico/.test($("#sentenza-testo").textContent), "avviso: il testo OCR puo' essere incompleto, quello fedele e' il PDF");
  ok((w.location.protocol === "file:" || /#\/sentenza\/doc0$/.test(w.location.href)), "indirizzo #/sentenza/<id> [" + w.location.hash + "]");
  click($('#sentenza-azioni [data-salva="doc0"]'));
  ok(!$("#salva-modal").hidden, "si apre la scelta della raccolta");
  $("#salva-nuova").value = "Danno biologico";
  click($("#salva-crea"));
  ok(I.raccolte().length === 1 && I.raccolte()[0].sentenze.length === 1, "raccolta creata con la sentenza");
  const rid = I.raccolte()[0].id;
  ["doc1", "doc2", "doc3"].forEach(id => I.aggiungi(rid, { id, estremi: "Cass. " + id, pdf: "https://www.italgiure.giustizia.it/x" }));
  ok(I.aggiungi(rid, { id: "doc1", estremi: "x" }) === "gia", "nessun doppione nella stessa raccolta");

  console.log("\n[E] Sentenze salvate: elenco, note, eliminazione");
  click($('.tab[data-section="salvate"]'));
  ok($("#section-salvate").classList.contains("is-active") && /Danno biologico/.test($("#salvate-body").textContent), "la raccolta compare in Salvate");
  click($('[data-raccolta="' + rid + '"]'));
  ok($$("#salvate-body .sentenza-card").length === 4, "4 sentenze nella raccolta");
  const nota = $('[data-nota="doc0"]'); nota.value = "Utile per il danno differenziale"; nota.dispatchEvent(new w.Event("input", { bubbles: true }));
  await wait(600);
  ok(I.raccolte()[0].sentenze[0].nota === "Utile per il danno differenziale", "nota personale salvata");
  click($('[data-togli="doc3"]'));
  ok(I.raccolte()[0].sentenze.length === 3 && !$('[data-togli="doc3"]'), "tasto Elimina toglie una sentenza");
  $$(".sel-sentenza").filter(c => c.value === "doc1" || c.value === "doc2").forEach(c => { c.checked = true; c.dispatchEvent(new w.Event("change", { bubbles: true })); });
  ok(/\(2\)/.test($("#elimina-selezionate").textContent) && !$("#elimina-selezionate").disabled, "selezione multipla conteggiata");
  click($("#elimina-selezionate"));
  ok(I.raccolte()[0].sentenze.length === 1 && I.raccolte()[0].sentenze[0].id === "doc0", "eliminazione delle selezionate");

  console.log("\n[F] Esportazione e importazione");
  blobs = [];
  click($('[data-esporta-word="' + rid + '"]'));
  await until(() => blobs.length > 0);
  const word = blobs[0] ? await blobs[0].text() : "";
  ok(/Danno biologico/.test(word) && /Testo integrale della sentenza doc0/.test(word) && /Utile per il danno differenziale/.test(word) && /SentenzeWeb/.test(word), "Word con estremi, nota, testo integrale e fonte");
  blobs = [];
  click($('[data-esporta-file="' + rid + '"]'));
  await until(() => blobs.length > 0);
  const json = blobs[0] ? JSON.parse(await blobs[0].text()) : {};
  ok(json.formato === "in-iure-raccolta" && json.raccolta.sentenze[0].testo.indexOf("doc0") > 0, "file per altro dispositivo con i testi");
  click($('[data-elimina-raccolta="' + rid + '"]'));
  ok(I.raccolte().length === 0, "eliminazione dell'intera raccolta");
  const inp = $("#raccolta-importa");
  const f = new w.File([JSON.stringify(json)], "r.iniure.json", { type: "application/json" });
  Object.defineProperty(inp, "files", { value: [f], configurable: true });
  inp.dispatchEvent(new w.Event("change", { bubbles: true }));
  await until(() => I.raccolte().length === 1);
  ok(I.raccolte().length === 1 && I.raccolte()[0].sentenze[0].nota === "Utile per il danno differenziale", "importazione della raccolta con le note");
  const bad = new w.File([JSON.stringify({ formato: "in-iure-raccolta", raccolta: { nome: "X", sentenze: [{ id: "a<b>", estremi: "x" }, { id: "ok1", estremi: "y", pdf: "javascript:alert(1)" }] } })], "x.json");
  click($("#raccolte-indietro"));
  const inp2 = $("#raccolta-importa");
  Object.defineProperty(inp2, "files", { value: [bad], configurable: true });
  inp2.dispatchEvent(new w.Event("change", { bubbles: true }));
  await until(() => I.raccolte().length === 2);
  const rx = I.raccolte().filter(r => r.nome === "X")[0];
  ok(rx && rx.sentenze.length === 1 && rx.sentenze[0].pdf === "", "importazione: id non validi scartati e link non ufficiali tolti");

  console.log("\n[G] Protezione anti-blocco");
  w.InIureStore.set("sw_limitatore", { r: [], pausaFino: Date.now() + 600000 });
  click($('.tab[data-section="ricerca"]'));
  $("#ric-testo").value = "parola nuova";
  $("#ric-form").dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
  await until(() => /Protezione anti-blocco/.test($("#ric-risultati").textContent));
  ok(/Protezione anti-blocco/.test($("#ric-risultati").textContent), "in pausa: nessuna richiesta e messaggio chiaro");
  w.InIureStore.set("sw_limitatore", { r: Array(120).fill(Date.now()), pausaFino: 0 });
  $("#ric-testo").value = "altra parola";
  $("#ric-form").dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
  await until(() => /tetto di 120/.test($("#ric-risultati").textContent));
  ok(/tetto di 120/.test($("#ric-risultati").textContent), "tetto orario rispettato");

  console.log("\n========== RICERCA: " + pass + " OK, " + fail + " FAIL ==========");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
