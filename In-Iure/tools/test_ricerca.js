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
  ok($$(".tab").length === 6 &&!!$('.tab[data-section="ricerca"]') && /Raccolte/.test($('.tab[data-section="salvate"]').textContent), "6 voci nel menu, con Ricerca e Raccolte");
  ok(!$("#section-preferiti .settings") && !!$("#impostazioni-modal .settings [data-font]") && !!$("#impostazioni-modal [data-tema]") && !!$("#impostazioni-modal [data-reset]"), "impostazioni tolte da Preferiti e spostate nella finestra Impostazioni");
  ok($("#impostazioni-modal").hidden, "finestra Impostazioni chiusa all'avvio");
  click($("#impostazioni-btn"));
  ok(!$("#impostazioni-modal").hidden, "il tasto con l'ingranaggio apre le Impostazioni");
  const idx = w.eval("CODICI_INDEX"), maxV = idx.map(c => c.verificato || "").sort().pop(), maxA = idx.map(c => c.aggiornato || "").sort().pop();
  const it = d => d.slice(8, 10) + "/" + d.slice(5, 7) + "/" + d.slice(0, 4);
  const infoN = $("#impostazioni-normativa").textContent;
  ok(infoN.indexOf("Ultimo aggiornamento: " + it(maxV)) >= 0 && infoN.indexOf("in vigore dal " + it(maxA)) >= 0,
    "indicatore dell'ultimo aggiornamento della normativa (" + infoN.replace(/\s+/g, " ").trim().slice(0, 140) + ")");
  click($('#impostazioni-modal [data-tema="scuro"]'));
  ok(w.document.documentElement.getAttribute("data-theme") === "dark" && $('#impostazioni-modal [data-tema="scuro"]').classList.contains("is-active"), "dalla finestra il tema cambia davvero");
  click($('#impostazioni-modal [data-tema="auto"]'));
  click($('#impostazioni-modal [data-close-app-modal]'));
  ok($("#impostazioni-modal").hidden, "la X chiude le Impostazioni");
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
  const pq = I.paroleInQuery("danno da perdita di chance");
  ok(pq === '("danno da perdita di chance"^4 OR "danno perdita chance"~6)', "parole di seguito = una frase anche simile: identica in cima, poi parole vicine senza articoli/preposizioni (" + pq + ")");
  ok(I.paroleInQuery("danno da perdita di chance, nesso causale") === '("danno da perdita di chance"^4 OR "danno perdita chance"~6) AND ("nesso causale"^4 OR "nesso causale"~4)', "la virgola separa altre parole chiave, tutte richieste");
  ok(I.paroleInQuery("usucapione; servitu, possesso") === "usucapione AND servitu AND possesso", "parole singole separate da virgola o punto e virgola");
  ok(I.paroleInQuery("di fatto") === '"di fatto"', "frase di sole parole vuote: cercata come scritta");
  ok(I.paroleInQuery("responsabilita medica risarci*") === "(responsabilita AND medica AND risarci*)", "con l'asterisco: ricerca di prima (tutte le parole), asterisco conservato");
  ok(I.paroleInQuery("mobbing OR vessazioni, licenziamento") === "(mobbing OR vessazioni) AND licenziamento", "OR tra sinonimi, poi un'altra parola chiave");
  ok(I.paroleInQuery('a:b "lastrico solare" (x)') === '(a AND b AND "lastrico solare" AND x)', "caratteri speciali neutralizzati, virgolette conservate");
  ok(I.paroleInQuery("art. 2043 c.c., danno") === '("art. 2043 c.c."^4 OR "art. 2043 c.c."~6) AND danno', "i punti delle abbreviazioni (c.c.) non separano le parole chiave");
  ok(I.fraseInQuery('danno "da" perdita di chance') === '"danno da perdita di chance"', "frase esatta tra virgolette");
  const fq = I.filtri({ archivio: "civile", annoDa: "2022", annoA: "", sezione: "U", tipo: "Sentenza" });
  ok(fq.join("|") === 'kind:snciv|anno:[2022 TO *]|szdec:"U"|tipoprov:"Sentenza"', "filtri: archivio, anni, sezione, tipo");

  console.log("\n[C] Ricerca con elenco completo");
  $("#ric-testo").value = "danno biologico";
  $("#ric-form").dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
  await until(() => /1\.234|1234/.test($("#ric-stato").textContent) && !/caricamento/.test($("#ric-stato").textContent));
  const ricerche = richieste.filter(u => !/^id:/.test(u.searchParams.get("q")));
  ok(ricerche.length === 3, "1234 risultati scaricati in 3 richieste da 500 (" + ricerche.length + ")");
  ok(ricerche[0].searchParams.get("q") === 'ocr:(("danno biologico"^4 OR "danno biologico"~4))' && ricerche[0].searchParams.get("rows") === "500", "richiesta Solr corretta (q, rows=500)");
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
  // jsdom non sa disegnare il PDF: l'app mostra l'avviso con il link al PDF ufficiale (nelle app vere il PDF si vede)
  await until(() => /PDF non disponibile ora/.test($("#sentenza-testo").textContent));
  await wait(300);
  ok(/PDF non disponibile ora/.test($("#sentenza-testo").textContent) && /verbo=attach/.test(($("#sentenza-testo a") || {}).href || ""), "se il PDF non si puo' disegnare: avviso e link al PDF ufficiale");
  ok(!$("[data-vista-sentenza]") && !/Testo integrale della sentenza doc0/.test($("#sentenza-detail").textContent) && !$("#sentenza-testo .sentenza-testo"), "nessuna vista Testo (solo PDF)");
  ok(!$('#sentenza-azioni [data-apri]') && /PDF ufficiale/.test($("#sentenza-azioni").textContent), "nella pagina della sentenza: niente «Leggi», resta «PDF ufficiale»");
  ok(w.InIureStore.get("sw_limitatore", null).r.length >= 4, "anche il PDF passa dalla protezione anti-blocco");
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
  ok($("#section-salvate").classList.contains("is-active") && /Danno biologico/.test($("#salvate-body").textContent) && /Raccolte di giurisprudenza/.test($("#salvate-home h1").textContent), "la raccolta compare in Raccolte");
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
  ok(/^JVBERi0/.test(json.raccolta.sentenze[0].pdfBase64 || ""), "il file per altro dispositivo contiene anche il PDF ufficiale (per l'iPhone)");
  click($('[data-elimina-raccolta="' + rid + '"]'));
  ok(I.raccolte().length === 0, "eliminazione dell'intera raccolta");
  const inp = $("#raccolta-importa");
  const f = new w.File([JSON.stringify(json)], "r.iniure.json", { type: "application/json" });
  Object.defineProperty(inp, "files", { value: [f], configurable: true });
  inp.dispatchEvent(new w.Event("change", { bubbles: true }));
  await until(() => I.raccolte().length === 1);
  ok(I.raccolte().length === 1 && I.raccolte()[0].sentenze[0].nota === "Utile per il danno differenziale", "importazione della raccolta con le note");
  const nPdf = pdfRichiesti.length;
  click($('#salvate-body [data-apri="doc0"]'));
  await until(() => /PDF non disponibile ora/.test($("#sentenza-testo").textContent));
  ok(pdfRichiesti.length === nPdf, "sentenza importata: PDF letto dal file importato, senza scaricarlo di nuovo");
  click($('.tab[data-section="salvate"]'));
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
