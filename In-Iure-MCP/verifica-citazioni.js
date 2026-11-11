/* In Iure - verificatore automatico delle citazioni (non dipende dal modello).
 *
 * Estrae da un testo (parere, atto, risposta) e controlla sulle fonti VERE:
 *  - NORME: "art. 2043 c.c.", "artt. 1575 e 1576 c.c.", "art. 183, comma 4, c.p.c.", "art. 5 L. 392/1978",
 *    "d.lgs. 28/2010, art. 5"... Codici e leggi dell'app: l'articolo deve esistere nel testo vigente dell'app e non
 *    essere abrogato. Norme fuori dall'app: il loro testo deve essere stato davvero scaricato da Normattiva
 *    (registro del filtro limita-mcp.js, ultimi 30 giorni).
 *  - SENTENZE DI CASSAZIONE: numero e anno devono esistere su SentenzeWeb; sezione, archivio (civ./pen.) e date,
 *    se indicati, devono coincidere. Una decisione che non e' su SentenzeWeb e' ammessa solo se presentata come
 *    "citata in Cass. n. X/AAAA" e la decisione X (verificata) la cita davvero.
 *  - ALTRE AUTORITA' (Tribunali, Corti d'appello, Corte costituzionale, Consiglio di Stato, CGUE, CEDU):
 *    non verificabili con le fonti disponibili -> errore, salvo marcatura esplicita "[DA VERIFICARE]".
 *  - CITAZIONI TESTUALI tra virgolette (almeno 6 parole): devono trovarsi parola per parola nelle fonti
 *    (articoli dell'app, testi di Normattiva scaricati, sentenze citate, documenti della pratica).
 * Qualsiasi voce non verificabile puo' restare SOLO se seguita da "[DA VERIFICARE]": viene segnalata all'utente. */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const server = require("./server");
const { BASE } = require("./limitatore");

const SUFFISSI = "bis|ter|quater|quinquies|sexies|septies|octies|novies|nonies|decies|undecies|duodecies|terdecies|quaterdecies|quinquiesdecies|sexiesdecies|septiesdecies|octiesdecies";
const MARCA = /\[\s*DA VERIFICARE\s*\]/i;
const MIN_PAROLE_CITAZIONE = 6;

/* ---------------------------------------------------------------- normalizzazione */
function piano(s) {
  return String(s || "").replace(/-\s*\n\s*/g, "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[’‘`´]/g, "'").replace(/([aeiou])'/g, "$1").replace(/[^a-z0-9]+/g, " ").trim();
}
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/* ---------------------------------------------------------------- fonti: codici dell'app */
let FONTI = null;
function fonti() {
  const d = server.carica();
  if (FONTI && FONTI.firma === d.caricato) return FONTI;
  // forme di citazione dell'app (In-Iure/js/ricerca.js) + abbreviazioni e nomi dell'indice
  const forme = [];
  try {
    const src = fs.readFileSync(path.resolve(__dirname, "..", "In-Iure", "js", "ricerca.js"), "utf8");
    const i = src.indexOf("var FORME = {"), j = src.indexOf("var NUMERI_ATTO");
    const ctx = vm.createContext({}); vm.runInContext(src.slice(i, j) + "\nthis.F = FORME;", ctx);
    for (const [id, lista] of Object.entries(ctx.F)) for (const f of lista) forme.push([f, id]);
  } catch (e) { /* senza ricerca.js restano abbreviazioni e nomi */ }
  const perNumero = {};
  for (const c of d.codici) {
    forme.push([c.abbr, c.id]);
    if (/^(codice|costituzione)/i.test(c.nome)) forme.push([c.nome, c.id]);
    const m = String(c.abbr).match(/(\d+)\s*\/\s*(\d{4})/) || String(c.descrizione).match(/n\.\s*(\d+)[^0-9]{0,4}$/);
    if (m && m[2]) perNumero[m[1] + "/" + m[2]] = c.id;
    const ann = String(c.descrizione).match(/(\d{1,2})\s+\w+\s+(\d{4}),\s*n\.\s*(\d+)/);
    if (ann) perNumero[ann[3] + "/" + ann[2]] = c.id;
  }
  Object.assign(perNumero, { "206/2005": "consumo", "209/2005": "assicurazioni", "196/2003": "privacy", "14/2019": "crisi-impresa", "285/1992": "cds" });
  // espressioni regolari delle forme: la piu' lunga prima (disp. att. c.p.c. prima di c.p.c.)
  const regole = forme.filter(f => f[0]).sort((a, b) => b[0].length - a[0].length).map(([f, id]) => {
    const r = esc(f).replace(/\\\.\s*/g, "\\.\\s*").replace(/\s+/g, "\\s+");
    return [new RegExp("^(?:del(?:la|lo|l')?\\s+|dei\\s+)?" + r + "(?![a-z])", "i"), id];
  });
  FONTI = { firma: d.caricato, d, regole, perNumero };
  return FONTI;
}

/* ---------------------------------------------------------------- fonti: registro di Normattiva */
function registroNormattiva() {
  const f = path.join(BASE, "registro-normattiva.jsonl");
  if (!fs.existsSync(f)) return [];
  const limite = Date.now() - 30 * 86400e3;
  return fs.readFileSync(f, "utf8").split("\n").map(r => { try { return JSON.parse(r); } catch (e) { return null; } })
    .filter(e => e && e.t >= limite && e.testo && !/"success"\s*:\s*false/.test(e.testo));
}
const normArt = s => server.normArticolo(String(s).replace(/\s+/g, " "));

/* ---------------------------------------------------------------- estrazione delle norme */
const LEGGE = new RegExp("^(?:del(?:la|lo|l')?\\s+|dal(?:la)?\\s+)?(l\\.|legge|d\\.\\s*lgs\\.?|decreto\\s+legislativo|d\\.\\s*l\\.|decreto[-\\s]legge|d\\.\\s*p\\.\\s*r\\.|r\\.\\s*d\\.|d\\.\\s*m\\.)\\s*(?:(\\d{1,2})\\s+[a-z]+\\s+(\\d{4}),?\\s*)?(?:n\\.\\s*)?(\\d{1,5})(?:\\s*\\/\\s*(\\d{4}))?", "i");
const TIPO_LEGGE = t => { t = t.toLowerCase().replace(/\s+/g, ""); return /lgs|legislativo/.test(t) ? "decreto.legislativo" : /^d\.l\.|legge$/.test(t) && /decreto/.test(t) || t === "d.l." ? "decreto.legge" : /^l\.|^legge/.test(t) ? "legge" : t; };
const NON_NORMATIVO = /^(?:del(?:la|lo|l')?\s+|dello\s+)?(contratto|regolamento\s+(?:condominiale|contrattuale)|statuto|accordo|convenzione|bando|capitolato|patto|scrittura|atto\s+costitutivo)/i;
const TOKEN_ART = new RegExp("\\b(\\d{1,5}(?:\\s*[-\\s]\\s*(?:" + SUFFISSI + ")\\b|\\.\\d+)?)", "gi");

function fonteDopo(resto) {
  const F = fonti();
  const r = resto.replace(/^[\s,]+/, "");
  if (NON_NORMATIVO.test(r)) return { tipo: "contratto" };
  for (const [re, id] of F.regole) if (re.test(r)) return { tipo: "app", id };
  const m = r.match(LEGGE);
  if (m) {
    const numero = m[4], anno = m[5] || m[3];
    if (numero && anno) {
      const id = F.perNumero[numero + "/" + anno];
      return id ? { tipo: "app", id } : { tipo: "legge", numero: parseInt(numero, 10), anno: parseInt(anno, 10), tipoAtto: TIPO_LEGGE(m[1]) };
    }
  }
  return null;
}

function estraiNorme(testo) {
  const out = [];
  const re = /\b(artt?\.|articol[oi])\s*(?=\d)/gi;
  let m;
  while ((m = re.exec(testo))) {
    const inizio = m.index + m[0].length;
    // finestra: fino al prossimo "art.", fine frase o parentesi
    let fine = testo.slice(inizio, inizio + 160).search(/\b(artt?\.|articol[oi])\s*\d|[;\]\n]|(?<!\b[a-z])\)|\.\s+[A-Z]/);
    if (fine < 0) fine = 160;
    const fin = testo.slice(inizio, inizio + fine);
    // numeri degli articoli: fino alla prima fonte riconosciuta, saltando "comma N", "n. N", "lett. x"
    let pos = 0, fonte = null, nums = [];
    const parti = fin.split(/(\s+|,)/);
    let acc = "", attesa = false;
    for (let k = 0; k < parti.length; k++) {
      const resto = fin.slice(acc.length);
      const f = /^[\s,]*[a-z(]/i.test(resto) || /^[\s,]*d\./i.test(resto) ? fonteDopo(resto) : null;
      if (f) { fonte = f; break; }
      const p = parti[k];
      if (/^(comma|commi|co\.|n\.|nn\.|num\.|lett\.|lettera|lettere|par\.|paragrafo|periodo|punto|numero|numeri)$/i.test(p)) attesa = true;
      else if (/^\d/.test(p)) {
        const t = resto.replace(/^[\s,]+/, "").match(new RegExp("^\\d{1,5}(?:\\s*[-\\s]\\s*(?:" + SUFFISSI + ")\\b|\\.\\d+)?", "i"));
        if (t && !attesa) nums.push(t[0]);
        // dopo "commi" restano commi anche i numeri successivi uniti da "e" o virgola ("commi 1 e 6")
        if (!(attesa && /^[\s,]*(?:\d|e\s+\d|ed\s+\d)/i.test(fin.slice(acc.length + p.length).replace(/^[\s,]+/, m => m)))) attesa = false;
        if (t && t[0].length > p.length) { // il numero con suffisso occupa piu' pezzi
          let lung = t[0].length - p.length; acc += p;
          while (lung > 0 && k + 1 < parti.length) { k++; acc += parti[k]; lung -= parti[k].length; }
          continue;
        }
      } else if (p.trim() && !/^(e|ed|o|nonche'|nonché|-|,)$/i.test(p) && !/^[\s,]*$/.test(p) && !attesa) { /* parola qualunque: continua a cercare la fonte */ }
      acc += p;
    }
    // forma inversa: "d.lgs. 28/2010, art. 5" -> fonte prima di "art."
    if (!fonte) {
      const prima = testo.slice(Math.max(0, m.index - 60), m.index);
      const lm = prima.match(/(l\.|legge|d\.\s*lgs\.?|decreto\s+legislativo|d\.\s*l\.|decreto[-\s]legge|d\.\s*p\.\s*r\.)\s*(?:n\.\s*)?\d{1,5}\s*\/\s*\d{4}\s*,?\s*$/i);
      if (lm) fonte = fonteDopo(lm[0]);
    }
    const contesto = testo.slice(m.index, inizio + fine).replace(/\s+/g, " ").trim();
    const marcata = MARCA.test(testo.slice(inizio, inizio + fine + 20));
    for (const n of nums) out.push({ articolo: n.replace(/\s+/g, " "), fonte, contesto, marcata });
  }
  return out;
}

/* ---------------------------------------------------------------- estrazione delle sentenze */
function estraiSentenze(testo) {
  const out = [];
  const re = /\b(Cass(?:azione|\.)?|Corte\s+(?:Suprema\s+)?di\s+[Cc]assazione)\b/g;
  let m;
  while ((m = re.exec(testo))) {
    const da = m.index;
    let fine = testo.slice(da + m[0].length, da + 200).search(/\bCass(?:azione|\.)|[;\]\n]|\)\s|\.\s+[A-Z]/);
    if (fine < 0) fine = 200;
    const w = testo.slice(da, da + m[0].length + fine);
    let n = null, anno = null, x;
    if ((x = w.match(/\bn(?:um)?\.\s*(\d{1,6})\s*(?:\/\s*(\d{4}))?/i))) { n = x[1]; anno = x[2]; }
    else if ((x = w.match(/\b(\d{2,6})\s*\/\s*((?:19|20)\d{2})\b/))) { n = x[1]; anno = x[2]; }
    if (!n) continue;                          // "la Cassazione ha affermato..." senza estremi
    if (!anno) { const y = w.match(/\b((?:19|20)\d{2})\b/); if (y) anno = y[1]; }
    const sez = (w.match(/\b(?:sez(?:ione)?\.?\s*(\d|[IVX]+|U|L|lav(?:oro)?|un(?:ite)?)\b)|\b(S\.?\s?U\.?|Sezioni\s+Unite)\b/i) || []);
    let sezione = sez[1] || (sez[2] ? "U" : null);
    if (sezione) { const r = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7 }; sezione = r[sezione.toUpperCase()] ? String(r[sezione.toUpperCase()]) : /^un/i.test(sezione) ? "U" : /^lav/i.test(sezione) ? "L" : sezione.toUpperCase(); }
    const archivio = /\bciv\./i.test(w) ? "snciv" : /\bpen\./i.test(w) ? "snpen" : null;
    const date = [];
    for (const d of w.matchAll(/\b(decisa|depositata|del|pubblicata)?\s*(?:il\s+)?(\d{2})\/(\d{2})\/(\d{4})/gi)) date.push({ tipo: (d[1] || "").toLowerCase(), v: d[4] + d[3] + d[2] });
    const prima = testo.slice(Math.max(0, da - 40), da);
    out.push({ n: String(parseInt(n, 10)), anno, sezione, archivio, date, contesto: w.replace(/\s+/g, " ").trim(),
      indiretta: /(citat[ae]|richiamat[ae]|cit\.)\s+in\s*$/i.test(prima) ? null : undefined, prima, posizione: da, marcata: MARCA.test(w) });
  }
  // "Cass. A, citata in Cass. B": collega la prima alla seconda
  for (let i = 0; i < out.length; i++)
    if (out[i + 1] && /(citat[ae]|richiamat[ae])\s+(?:anche\s+)?(?:da|in)\s*$/i.test(out[i].contesto)) out[i].ospite = out[i + 1];
  return out;
}

function estraiAltreAutorita(testo) {
  const out = [];
  const re = /\b(Trib(?:\.|unale\s+di)|Corte\s+d['’]\s?app(?:ello)?|App\.\s|C\.\s?cost\.|Corte\s+cost(?:ituzionale)?|Cons\.\s?(?:St\.|Stato)|Consiglio\s+di\s+Stato|T\.?A\.?R\.?\s|CGUE|Corte\s+di\s+[Gg]iustizia|Corte\s+EDU|CEDU|Giudice\s+di\s+pace\s+di|G\.d\.P\.)/g;
  let m;
  while ((m = re.exec(testo))) {
    const w = testo.slice(m.index, m.index + 160).split(/[;\n]|\)\s/)[0];
    if (/R\.?\s?G\.?|ruolo/i.test(w)) continue;
    if (!/\b(sent(?:enza)?|ord(?:inanza)?|decr(?:eto)?)\.?\b[^.]{0,40}\bn\.\s*\d+|\bn\.\s*\d+\s*\/\s*\d{4}|\b\d{1,2}\s+(?:gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\s+\d{4}\b[^.]{0,20}\bn\.\s*\d+|\b\d{2}\/\d{2}\/\d{4}\b[^.]{0,20}\bn\.\s*\d+/i.test(w)) continue;
    out.push({ contesto: w.replace(/\s+/g, " ").trim(), marcata: MARCA.test(w) });
  }
  return out;
}

function estraiCitazioni(testo) {
  const out = [];
  const re = /«([^»]{10,3000})»|“([^”]{10,3000})”|"([^"\n]{10,3000})"/g;
  let m;
  while ((m = re.exec(testo))) {
    const c = m[1] || m[2] || m[3];
    if (piano(c).split(" ").length < MIN_PAROLE_CITAZIONE) continue;
    out.push({ testo: c, marcata: MARCA.test(testo.slice(m.index + m[0].length, m.index + m[0].length + 25)) });
  }
  return out;
}

/* ---------------------------------------------------------------- verifica */
async function verifica(testo, opzioni) {
  opzioni = opzioni || {};
  const sw = opzioni.sentenzeweb || require("./sentenzeweb");
  const F = fonti();
  const registro = registroNormattiva();
  const errori = [], daVerificare = [], ok = [], avvisi = [];
  const corpus = [];                         // testi in cui cercare le citazioni testuali
  const codiciUsati = new Set();
  const originale = testo;
  // norme e sentenze si cercano FUORI dalle citazioni testuali (quelle si verificano come testo)
  testo = testo.replace(/«[^»]{10,3000}»|“[^”]{10,3000}”|"[^"\n]{10,3000}"/g, m => m[0] + " ".repeat(m.length - 2) + m[m.length - 1]);

  // NORME
  const visti = new Set();
  for (const x of estraiNorme(testo)) {
    const chiave = JSON.stringify([x.articolo, x.fonte]);
    if (visti.has(chiave)) continue; visti.add(chiave);
    const descr = "art. " + x.articolo;
    if (!x.fonte) { avvisi.push(descr + " senza atto riconoscibile (\"" + x.contesto.slice(0, 90) + "\"): indica l'atto (es. c.c., c.p.c., L. 392/1978)"); continue; }
    if (x.fonte.tipo === "contratto") continue;
    if (x.fonte.tipo === "app") {
      const c = F.d.perId[x.fonte.id];
      const a = c.articoli.find(y => y.num === normArt(x.articolo).toLowerCase());
      codiciUsati.add(c.id);
      const nome = descr + " " + c.abbr;
      if (!a) { (x.marcata ? daVerificare : errori).push(nome + ": NON ESISTE nel testo vigente di " + c.nome + " (app In Iure)"); continue; }
      const t = a.commi.join(" ");
      if (/^\s*articolo abrogato/i.test(t) || (!t.trim() && !a.rubrica)) { (x.marcata ? daVerificare : errori).push(nome + ": articolo ABROGATO o senza testo nella fonte ufficiale (" + t.slice(0, 80) + ")"); continue; }
      corpus.push(a.rubrica + " " + t);
      ok.push(nome + " (testo vigente dell'app)");
    } else {
      const nome = descr + " " + (x.fonte.tipoAtto === "decreto.legislativo" ? "d.lgs." : x.fonte.tipoAtto === "decreto.legge" ? "d.l." : x.fonte.tipoAtto === "legge" ? "L." : x.fonte.tipoAtto) + " " + x.fonte.numero + "/" + x.fonte.anno;
      const trovati = registro.filter(e => e.argomenti && parseInt(e.argomenti.numero, 10) === x.fonte.numero && parseInt(e.argomenti.anno, 10) === x.fonte.anno &&
        (e.argomenti.numeroArticolo === undefined || normArt(e.argomenti.numeroArticolo) === normArt(x.articolo)));
      const conArticolo = trovati.filter(e => e.argomenti.numeroArticolo !== undefined);
      if (conArticolo.length) { conArticolo.forEach(e => corpus.push(e.testo)); ok.push(nome + " (testo scaricato da Normattiva)"); }
      else if (x.marcata) daVerificare.push(nome + ": norma fuori dall'app, testo non scaricato da Normattiva");
      else errori.push(nome + ": norma fuori dall'app e testo NON scaricato da Normattiva negli ultimi 30 giorni: leggilo con Normattiva (estrai_articolo) prima di citarlo, oppure togli la citazione");
    }
  }

  // SENTENZE DI CASSAZIONE
  const sentenze = estraiSentenze(testo);
  const verificate = new Map();
  for (const s of sentenze) {
    const nome = "Cass. n. " + s.n + "/" + (s.anno || "?");
    if (!s.anno) { (s.marcata ? daVerificare : errori).push(nome + ": manca l'anno (\"" + s.contesto.slice(0, 80) + "\")"); continue; }
    let docs;
    try { docs = await sw.perEstremi(s.n, s.anno); }
    catch (e) { (s.marcata ? daVerificare : errori).push(nome + ": SentenzeWeb non raggiungibile ora (" + e.message.slice(0, 80) + "): non verificata"); continue; }
    let cand = docs.filter(d => !s.archivio || d.kind === s.archivio);
    if (s.sezione) cand = cand.filter(d => String(d.szdec).toUpperCase() === s.sezione);
    if (!docs.length) { s.nonTrovata = true; continue; }
    if (!cand.length) {
      const reali = docs.map(d => sw.estremi(d)).join("; ");
      (s.marcata ? daVerificare : errori).push(nome + ": su SentenzeWeb esiste ma con estremi diversi (" + reali + "): correggi sezione o archivio");
      continue;
    }
    const d = cand[0];
    const erroriPrima = errori.length;
    for (const dt of s.date) {
      const dep = [].concat(d.datdep || [])[0];
      const atteso = /depositat|pubblicat/.test(dt.tipo) ? dep : /decisa/.test(dt.tipo) ? d.datdec : null;
      if (atteso && atteso !== dt.v) errori.push(nome + ": data " + dt.tipo + " sbagliata (" + dt.v.slice(6) + "/" + dt.v.slice(4, 6) + "/" + dt.v.slice(0, 4) + "); su SentenzeWeb: " + sw.estremi(d));
      if (!dt.tipo && dt.v !== d.datdec && dt.v !== dep) errori.push(nome + ": la data indicata non corrisponde (SentenzeWeb: " + sw.estremi(d) + ")");
    }
    verificate.set(s, d);
    const voce = sw.estremi(d) + " (SentenzeWeb)";
    if (errori.length === erroriPrima && !ok.includes(voce)) ok.push(voce);
  }
  // decisioni non su SentenzeWeb: ammesse solo come "citata in" una decisione verificata che le cita davvero
  for (const s of sentenze.filter(x => x.nonTrovata)) {
    const nome = "Cass. n. " + s.n + "/" + s.anno;
    const ospite = s.ospite && verificate.get(s.ospite);
    if (ospite) {
      let t = ""; try { t = await sw.testoIntegrale(ospite.id); } catch (e) { /* non raggiungibile */ }
      const pt = piano(t);
      if (pt && new RegExp("\\b" + s.n + "\\b[^]{0,40}\\b" + s.anno + "\\b").test(pt)) { ok.push(nome + " (non su SentenzeWeb; citata in " + sw.estremi(ospite) + ", verificato)"); continue; }
      (s.marcata ? daVerificare : errori).push(nome + ": non e' su SentenzeWeb e NON risulta citata nel testo di " + sw.estremi(ospite));
      continue;
    }
    (s.marcata ? daVerificare : errori).push(nome + ": NON trovata su SentenzeWeb (che copre circa gli ultimi 5 anni). Togli la citazione, oppure, se la conosci solo perche' citata in un'altra decisione verificata, scrivi \"" + nome + ", citata in Cass. n. .../...\"");
  }

  // ALTRE AUTORITA'
  for (const a of estraiAltreAutorita(testo))
    (a.marcata ? daVerificare : errori).push("\"" + a.contesto.slice(0, 100) + "\": provvedimento di un'autorita' diversa dalla Cassazione, non verificabile con le fonti disponibili: toglilo o segnalo con [DA VERIFICARE]");

  // CITAZIONI TESTUALI
  const citazioni = estraiCitazioni(originale);
  if (citazioni.length) {
    for (const id of codiciUsati) corpus.push(F.d.perId[id].articoli.map(a => a.rubrica + " " + a.commi.join(" ")).join(" "));
    for (const t of opzioni.documenti || []) corpus.push(t);
    let base = piano(corpus.join(" \u0001 "));
    let caricateSentenze = false;
    for (const c of citazioni) {
      const pezzi = c.testo.split(/\[\s*(?:\.\.\.|…|omissis)\s*\]|\(\s*(?:\.\.\.|…)\s*\)|\.\.\.|…/i).map(piano).filter(p => p.split(" ").length >= 3);
      const presente = () => pezzi.length && pezzi.every(p => base.includes(p));
      if (!presente() && !caricateSentenze && verificate.size) {
        caricateSentenze = true;
        for (const d of verificate.values()) { try { corpus.push(await sw.testoIntegrale(d.id)); } catch (e) { /* non raggiungibile */ } }
        base = piano(corpus.join(" \u0001 "));
      }
      const breve = c.testo.replace(/\s+/g, " ").slice(0, 110) + (c.testo.length > 110 ? "..." : "");
      if (presente()) ok.push("citazione testuale \"" + breve + "\" (trovata parola per parola)");
      else (c.marcata ? daVerificare : errori).push("citazione tra virgolette \"" + breve + "\": NON trovata parola per parola nelle fonti citate (articoli, testi di Normattiva scaricati, sentenze citate, documenti della pratica). Copia il passaggio esatto dalla fonte oppure togli le virgolette e riformula");
    }
  }
  return { errori, daVerificare, ok, avvisi };
}

function resoconto(r) {
  const righe = [];
  righe.push(r.errori.length ? "VERIFICA DELLE CITAZIONI: " + r.errori.length + " ERRORI" : "VERIFICA DELLE CITAZIONI: nessun errore");
  if (r.errori.length) righe.push("", "Errori (da correggere):", ...r.errori.map(e => "- " + e));
  if (r.daVerificare.length) righe.push("", "Segnalate [DA VERIFICARE] (restano nel testo, da far controllare all'utente):", ...r.daVerificare.map(e => "- " + e));
  if (r.avvisi.length) righe.push("", "Avvisi:", ...r.avvisi.map(e => "- " + e));
  if (r.ok.length) righe.push("", "Verificate (" + r.ok.length + "):", ...r.ok.map(e => "- " + e));
  return righe.join("\n");
}

module.exports = { verifica, resoconto, estraiNorme, estraiSentenze, estraiCitazioni, estraiAltreAutorita, piano };
