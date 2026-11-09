/* ============================================================
   In Iure — sezioni "Ricerca" (giurisprudenza di Cassazione su SentenzeWeb) e "Sentenze salvate"
   SentenzeWeb: archivio pubblico e gratuito del Ministero della Giustizia (www.italgiure.giustizia.it/sncass),
   per uso personale (scelta dell'utente del 09/11/2026).
   - Ricerca per ARTICOLO (tutte le forme di citazione insieme), per PAROLE CHIAVE, per FRASE ESATTA, con filtri.
   - Elenco COMPLETO dei risultati (blocchi da 500 schede, solo estremi + estratto); testo integrale solo all'apertura.
   - Protezione anti-blocco sul dispositivo: una richiesta alla volta, intervallo minimo, tetti orari e giornalieri,
     pausa automatica ai segnali di rifiuto, memoria delle risposte (le ricerche ripetute non contattano il sito).
   - Il sito non accetta richieste dalle pagine web (manca CORS): la ricerca funziona nelle app Android (richiesta
     nativa) e Windows (processo principale). Nel browser e sull'iPhone restano le sentenze salvate, l'importazione
     delle raccolte esportate da un altro dispositivo e il collegamento al sito ufficiale.
   - Sentenze salvate: raccolte, note, eliminazione singola/multipla, esportazione Word (per NotebookLM e
     Antigravity) e file In Iure (.json) per spostarle su un altro dispositivo. Restano SOLO sul dispositivo.
   ============================================================ */
(function () {
  "use strict";

  var SOLR = "https://www.italgiure.giustizia.it/sncass/isapi/hc.dll/sn.solr/sn-collection/select";
  var PDF = "https://www.italgiure.giustizia.it/xway/application/nif/clean/hc.dll?verbo=attach&db=";
  var SITO = "https://www.italgiure.giustizia.it/sncass/";
  var FL = "id,kind,szdec,anno,numdec,datdec,datdep,tipoprov,materia,filename";
  var BLOCCO = 500;                 // schede per richiesta (verificato: il server ne accetta 500)
  var AUTO_MAX = 2000;              // fino a questo numero l'elenco completo si scarica da solo
  var LIMITI = { intervalloMs: 3000, orari: 120, giornalieri: 600, pausaMs: 30 * 60 * 1000 };
  var CACHE_RICERCHE_MS = 24 * 3600 * 1000;

  var A = null;                     // funzioni dell'app (passate da app.js)
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  /* ---------------------------------------------------------------- memoria grande (IndexedDB) */
  // testi integrali e risposte delle ricerche; se IndexedDB non c'e' resta una memoria della sessione
  var DBN = "iniure_sentenze", mem = {};
  var dbp = null;
  function db() {
    if (dbp) return dbp;
    dbp = new Promise(function (ok) {
      try {
        if (!window.indexedDB) return ok(null);
        var r = indexedDB.open(DBN, 1);
        r.onupgradeneeded = function () { r.result.createObjectStore("kv"); };
        r.onsuccess = function () { ok(r.result); };
        r.onerror = function () { ok(null); };
      } catch (e) { ok(null); }
    });
    return dbp;
  }
  function kvGet(k) {
    return db().then(function (d) {
      if (!d) return mem[k];
      return new Promise(function (ok) {
        try {
          var q = d.transaction("kv").objectStore("kv").get(k);
          q.onsuccess = function () { ok(q.result); }; q.onerror = function () { ok(undefined); };
        } catch (e) { ok(undefined); }
      });
    });
  }
  function kvSet(k, v) {
    return db().then(function (d) {
      if (!d) { mem[k] = v; return; }
      return new Promise(function (ok) {
        try {
          var t = d.transaction("kv", "readwrite"); t.objectStore("kv").put(v, k);
          t.oncomplete = function () { ok(); }; t.onerror = function () { mem[k] = v; ok(); };
        } catch (e) { mem[k] = v; ok(); }
      });
    });
  }
  function kvDel(k) {
    delete mem[k];
    return db().then(function (d) {
      if (!d) return;
      return new Promise(function (ok) {
        try { var t = d.transaction("kv", "readwrite"); t.objectStore("kv").delete(k); t.oncomplete = ok; t.onerror = ok; } catch (e) { ok(); }
      });
    });
  }

  /* ---------------------------------------------------------------- trasporto */
  function trasporto() {
    var Cap = window.Capacitor;
    if (Cap && Cap.isNativePlatform && Cap.isNativePlatform() && Cap.Plugins && Cap.Plugins.CapacitorHttp) return "android";
    if (window.InIureDesktopRete && window.InIureDesktopRete.get) return "desktop";
    if (window.__InIureRicercaTest) return "test";
    return null;
  }
  function richiestaGrezza(url) {
    var t = trasporto();
    if (t === "android") {
      return window.Capacitor.Plugins.CapacitorHttp.get({ url: url, headers: { "Accept": "application/json" }, connectTimeout: 30000, readTimeout: 60000 })
        .then(function (r) { return { status: r.status, data: typeof r.data === "string" ? JSON.parse(r.data) : r.data }; });
    }
    if (t === "desktop") return window.InIureDesktopRete.get(url);
    if (t === "test") return window.__InIureRicercaTest(url);
    return Promise.reject(new Error("NON_DISPONIBILE"));
  }

  /* ---------------------------------------------------------------- protezione anti-blocco */
  function limStato() { return A.store.get("sw_limitatore", { r: [], pausaFino: 0 }); }
  function limSalva(s) { A.store.set("sw_limitatore", s); }
  var coda = Promise.resolve(), ultima = 0;
  function ErroreLimite(msg) { var e = new Error(msg); e.limite = true; return e; }
  function attesa(ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); }
  function protetta(url) {
    var lavoro = coda.then(function () {
      var s = limStato(), ora = Date.now();
      s.r = (s.r || []).filter(function (t) { return ora - t < 86400000; });
      if (s.pausaFino > ora) throw ErroreLimite("Protezione anti-blocco: il sito ha dato segni di rifiuto, ricerche sospese per " + Math.ceil((s.pausaFino - ora) / 60000) + " minuti.");
      if (s.r.filter(function (t) { return ora - t < 3600000; }).length >= LIMITI.orari) throw ErroreLimite("Protezione anti-blocco: raggiunto il tetto di " + LIMITI.orari + " richieste in un'ora. Riprova piu' tardi: le ricerche gia' fatte restano disponibili.");
      if (s.r.length >= LIMITI.giornalieri) throw ErroreLimite("Protezione anti-blocco: raggiunto il tetto di " + LIMITI.giornalieri + " richieste in 24 ore.");
      var manca = ultima + LIMITI.intervalloMs - ora;
      return attesa(manca > 0 ? manca : 0).then(function () {
        ultima = Date.now();
        s.r.push(ultima); limSalva(s);
        return richiestaGrezza(url);
      }).then(function (r) {
        if (r.status === 403 || r.status === 429 || r.status === 503) {
          var s2 = limStato(); s2.pausaFino = Date.now() + LIMITI.pausaMs; limSalva(s2);
          throw ErroreLimite("SentenzeWeb ha risposto con un rifiuto (HTTP " + r.status + "): ricerche sospese per 30 minuti per non essere bloccati.");
        }
        if (r.status < 200 || r.status >= 300) throw new Error("SentenzeWeb ha risposto con un errore (HTTP " + r.status + ").");
        if (!r.data || !r.data.response) throw new Error("Risposta inattesa da SentenzeWeb.");
        return r.data;
      });
    });
    coda = lavoro.catch(function () {});
    return lavoro;
  }
  function solr(params, durataCache) {
    var u = new URLSearchParams();
    u.append("app.query", "");
    Object.keys(params).forEach(function (k) { [].concat(params[k]).forEach(function (v) { u.append(k, String(v)); }); });
    u.append("wt", "json");
    var url = SOLR + "?" + u.toString();
    var chiave = "c|" + url;
    return kvGet(chiave).then(function (c) {
      if (c && (durataCache === Infinity || Date.now() - c.t < durataCache)) return c.v;
      return protetta(url).then(function (v) { kvSet(chiave, { t: Date.now(), v: v }); return v; });
    });
  }

  /* ---------------------------------------------------------------- costruzione delle ricerche */
  var SPECIALI = /[+\-&|!(){}[\]^~?:\\\/]/g;
  function paroleInQuery(testo) {
    var pezzi = String(testo || "").match(/"[^"]+"|\S+/g) || [];
    var out = [];
    pezzi.forEach(function (p) {
      if (/^(AND|OR|NOT)$/.test(p)) { out.push(p); return; }
      if (p.charAt(0) === '"') { var f = p.slice(1, -1).replace(/["\\]/g, " ").trim(); if (f) out.push('"' + f + '"'); return; }
      var w = p.replace(SPECIALI, " ").trim();
      if (w) w.split(/\s+/).forEach(function (x) { out.push(x); });
    });
    var unite = [];
    for (var i = 0; i < out.length; i++) {
      unite.push(out[i]);
      var dopo = out[i + 1];
      if (dopo && !/^(AND|OR|NOT)$/.test(out[i]) && !/^(AND|OR|NOT)$/.test(dopo)) unite.push("AND");
    }
    while (unite.length && /^(AND|OR|NOT)$/.test(unite[unite.length - 1])) unite.pop();
    return unite.join(" ");
  }
  function fraseInQuery(testo) {
    var f = String(testo || "").replace(/["\\]/g, " ").replace(/\s+/g, " ").trim();
    return f ? '"' + f + '"' : "";
  }
  // Forme con cui le sentenze citano ciascun atto (verificato su SentenzeWeb per l'art. 2043 c.c. il 09/11/2026:
  // "art. 2043 c.c." 951, "2043 c.c." 1373, "art. 2043 cod. civ." 710, "articolo 2043 c.c." 96 risultati)
  var FORME = {
    "codice-civile": ["c.c.", "cod. civ.", "codice civile"],
    "cpc": ["c.p.c.", "cod. proc. civ.", "codice di procedura civile"],
    "codice-penale": ["c.p.", "cod. pen.", "codice penale"],
    "cpp": ["c.p.p.", "cod. proc. pen.", "codice di procedura penale"],
    "costituzione": ["Cost.", "Costituzione"],
    "cpa": ["c.p.a.", "cod. proc. amm.", "codice del processo amministrativo"],
    "preleggi": ["disp. prel. c.c.", "preleggi", "disp. prel."],
    "disp-att-cc": ["disp. att. c.c.", "disp. att. cod. civ."],
    "disp-att-cpc": ["disp. att. c.p.c.", "disp. att. cod. proc. civ."],
    "disp-att-cpp": ["disp. att. c.p.p.", "norme att. c.p.p.", "disp. att. cod. proc. pen."],
    "consumo": ["cod. cons.", "codice del consumo"],
    "assicurazioni": ["cod. ass.", "codice delle assicurazioni"],
    "privacy": ["codice privacy", "codice in materia di protezione dei dati personali"],
    "crisi-impresa": ["CCII", "c.c.i.i.", "codice della crisi"],
    "cds": ["C.d.S.", "cod. strada", "codice della strada"]
  };
  var NUMERI_ATTO = {   // numero/anno degli atti citati di solito con gli estremi
    "consumo": "206/2005", "assicurazioni": "209/2005", "privacy": "196/2003", "crisi-impresa": "14/2019", "cds": "285/1992"
  };
  function numeroAtto(id, abbr) {
    if (NUMERI_ATTO[id]) return NUMERI_ATTO[id];
    var m = String(abbr || "").match(/(\d+)\s*\/\s*(\d{4})/);
    return m ? m[1] + "/" + m[2] : "";
  }
  function articoloInQuery(codiceId, num) {
    var n = String(num || "").trim().toLowerCase().replace(/^art(icol)?[io]?\.?\s*/, "").replace(/[-\s]+/g, " ").replace(/["\\]/g, "");
    if (!/^\d+[a-z0-9 .]*$/.test(n)) return "";
    var meta = (A.CODICI_INDEX || []).filter(function (c) { return c.id === codiceId; })[0] || {};
    var forme = FORME[codiceId] || [];
    var v = [];
    forme.forEach(function (f) {
      v.push('"art. ' + n + " " + f + '"~3', '"articolo ' + n + " " + f + '"~3', '"' + n + " " + f + '"~1');
      if (/^codice|^Costituzione/.test(f)) v.push('"art. ' + n + " del " + f + '"~2', '"articolo ' + n + " della " + f + '"~2');
    });
    var na = numeroAtto(codiceId, meta.abbr);
    if (na) {
      var p = na.split("/");
      v.push('"art. ' + n + " " + p[0] + " " + p[1] + '"~8', '"articolo ' + n + " " + p[0] + " " + p[1] + '"~8');
    }
    if (!v.length) return "";
    return v.join(" OR ");
  }
  function filtri(f) {
    var fq = [];
    if (f.archivio === "civile") fq.push("kind:snciv"); else if (f.archivio === "penale") fq.push("kind:snpen"); else fq.push("kind:(snciv OR snpen)");
    var da = parseInt(f.annoDa, 10), a = parseInt(f.annoA, 10);
    if (da || a) fq.push("anno:[" + (da || "*") + " TO " + (a || "*") + "]");
    if (f.sezione) fq.push('szdec:"' + String(f.sezione).replace(/"/g, "") + '"');
    if (f.tipo) fq.push('tipoprov:"' + String(f.tipo).replace(/"/g, "") + '"');
    return fq;
  }
  function queryDa(r) {
    if (r.modo === "articolo") return articoloInQuery(r.codice, r.numero);
    if (r.modo === "frase") return fraseInQuery(r.testo);
    return paroleInQuery(r.testo);
  }

  /* ---------------------------------------------------------------- estremi e formati */
  function primo(v) { return Array.isArray(v) ? v[0] : v; }
  function data8(s) { s = String(s || ""); return s.length === 8 ? s.slice(6, 8) + "/" + s.slice(4, 6) + "/" + s.slice(0, 4) : s; }
  function estremi(d) {
    var arch = d.kind === "snpen" ? "pen." : "civ.";
    var sz = d.szdec ? (d.szdec === "U" ? "Sez. U" : "Sez. " + d.szdec) : "";
    var num = String(d.numdec || "").replace(/^0+/, "");
    return "Cass. " + arch + (sz ? ", " + sz : "") + ", " + String(d.tipoprov || "provvedimento").toLowerCase() + " n. " + num + "/" + d.anno +
      (d.datdec ? ", decisa il " + data8(d.datdec) : "") + (primo(d.datdep) ? ", depositata il " + data8(primo(d.datdep)) : "");
  }
  function linkPdf(d) {
    var f = primo(d.filename);
    if (!f) return "";
    return PDF + d.kind + "&id=" + (f.indexOf(".clean.") > 0 ? f : f.replace(".pdf", ".clean.pdf"));
  }
  function scheda(d, hl) {
    return {
      id: d.id, estremi: estremi(d), kind: d.kind, anno: d.anno, materia: [].concat(d.materia || []).join(", "),
      pdf: linkPdf(d), estratto: ((hl && hl.ocr) || []).join(" … ").replace(/\s+/g, " ").trim()
    };
  }

  /* ---------------------------------------------------------------- ricerca */
  var stato = { richiesta: null, totale: 0, schede: [], caricate: 0, inCorso: false, errore: "", mostrate: 50 };
  var giroRicerca = 0;

  function cerca(r) {
    var q = queryDa(r);
    if (!q) { A.toast(r.modo === "articolo" ? "Indica il codice e il numero dell'articolo" : "Scrivi almeno una parola"); return; }
    giroRicerca++;
    stato = { richiesta: r, query: q, totale: 0, schede: [], caricate: 0, inCorso: true, errore: "", mostrate: 50, giro: giroRicerca };
    A.store.set("ricerca_ultima", r);
    disegnaRisultati();
    caricaBlocco(0, giroRicerca);
  }
  function caricaBlocco(start, giro) {
    var r = stato.richiesta;
    var p = { q: "ocr:(" + stato.query + ")", fq: filtri(r), rows: BLOCCO, start: start, fl: FL,
      hl: "true", "hl.fl": "ocr", "hl.snippets": 1, "hl.fragsize": 200 };
    if (r.ordine === "recenti") p.sort = "pd desc,datdec desc";
    stato.inCorso = true; disegnaStato();
    solr(p, CACHE_RICERCHE_MS).then(function (j) {
      if (giro !== giroRicerca) return;
      stato.totale = j.response.numFound;
      var hl = j.highlighting || {};
      (j.response.docs || []).forEach(function (d) { stato.schede.push(scheda(d, hl[d.id])); });
      stato.caricate = stato.schede.length;
      var finito = stato.caricate >= stato.totale || !(j.response.docs || []).length;
      if (!finito && stato.caricate < AUTO_MAX) { disegnaRisultati(); caricaBlocco(stato.caricate, giro); return; }
      stato.inCorso = false; disegnaRisultati();
    }).catch(function (e) {
      if (giro !== giroRicerca) return;
      stato.inCorso = false;
      stato.errore = e.message === "NON_DISPONIBILE" ? "NON_DISPONIBILE" : (e.message || "Errore di rete");
      disegnaRisultati();
    });
  }
  function apriSentenza(id, schedaNota) {
    var box = $("#sentenza-testo"), tit = $("#sentenza-titolo"), az = $("#sentenza-azioni");
    var s = schedaNota || trovaScheda(id) || { id: id, estremi: "Provvedimento " + id };
    tit.textContent = s.estremi;
    az.innerHTML = azioniSentenzaHTML(s);
    box.innerHTML = '<p class="empty">Caricamento del testo integrale…</p>';
    A.showSection("ricerca");
    A.showView($("#section-ricerca"), "sentenza-detail");
    A.pushRoute("#/sentenza/" + encodeURIComponent(id));
    testoSentenza(s).then(function (t) {
      box.innerHTML = t ? '<div class="sentenza-testo">' + A.esc(t).replace(/\n{2,}/g, "</p><p>").replace(/^/, "<p>").replace(/$/, "</p>") + "</div>"
        : '<p class="empty">Testo non disponibile.</p>';
    }).catch(function (e) {
      box.innerHTML = '<p class="empty">' + (e.message === "NON_DISPONIBILE"
        ? "Il testo integrale si scarica solo dall'app Android o Windows. Puoi aprire il PDF ufficiale con il tasto qui sopra."
        : A.esc(e.message)) + "</p>";
    });
  }
  function testoSentenza(s) {
    var id = String(s.id).replace(/[^A-Za-z0-9]/g, "");
    return kvGet("t|" + id).then(function (t) {
      if (t) return t;
      return solr({ q: "id:" + id, rows: 1, fl: FL + ",ocr" }, Infinity).then(function (j) {
        var d = (j.response.docs || [])[0];
        if (!d) throw new Error("Provvedimento non trovato su SentenzeWeb.");
        var testo = [].concat(d.ocr || []).join("\n").replace(/[ \t]+/g, " ").trim();
        if (inRaccolte(id)) kvSet("t|" + id, testo);   // i testi delle sentenze salvate restano disponibili offline
        return testo;
      });
    });
  }
  function trovaScheda(id) {
    var s = stato.schede.filter(function (x) { return x.id === id; })[0];
    if (s) return s;
    var tutte = [];
    raccolte().forEach(function (r) { tutte = tutte.concat(r.sentenze); });
    return tutte.filter(function (x) { return x.id === id; })[0];
  }

  /* ---------------------------------------------------------------- raccolte (sentenze salvate) */
  function raccolte() { return A.store.get("raccolte_sentenze", []); }
  function salvaRaccolte(r) { A.store.set("raccolte_sentenze", r); }
  function inRaccolte(id) { return raccolte().some(function (r) { return r.sentenze.some(function (s) { return s.id === id; }); }); }
  function nuovaRaccolta(nome) {
    nome = String(nome || "").trim().slice(0, 80);
    if (!nome) return null;
    var r = raccolte();
    var esiste = r.filter(function (x) { return x.nome.toLowerCase() === nome.toLowerCase(); })[0];
    if (esiste) return esiste.id;
    var id = "r" + Date.now().toString(36);
    r.push({ id: id, nome: nome, creata: new Date().toISOString().slice(0, 10), sentenze: [] });
    salvaRaccolte(r);
    return id;
  }
  function aggiungi(raccoltaId, s) {
    var r = raccolte(), rc = r.filter(function (x) { return x.id === raccoltaId; })[0];
    if (!rc) return false;
    if (rc.sentenze.some(function (x) { return x.id === s.id; })) return "gia";
    rc.sentenze.push({ id: s.id, estremi: s.estremi, kind: s.kind, anno: s.anno, materia: s.materia || "", pdf: s.pdf || "",
      estratto: s.estratto || "", nota: "", salvata: new Date().toISOString().slice(0, 10) });
    salvaRaccolte(r);
    // il testo integrale viene conservato per la lettura offline e per l'esportazione
    testoSentenza(s).then(function (t) { if (t) kvSet("t|" + s.id, t); }).catch(function () {});
    return true;
  }
  function rimuovi(raccoltaId, ids) {
    var r = raccolte(), rc = r.filter(function (x) { return x.id === raccoltaId; })[0];
    if (!rc) return;
    rc.sentenze = rc.sentenze.filter(function (s) { return ids.indexOf(s.id) === -1; });
    salvaRaccolte(r);
    ids.forEach(function (id) { if (!inRaccolte(id)) kvDel("t|" + id); });
  }
  function eliminaRaccolta(raccoltaId) {
    var r = raccolte(), rc = r.filter(function (x) { return x.id === raccoltaId; })[0];
    if (!rc) return;
    var ids = rc.sentenze.map(function (s) { return s.id; });
    salvaRaccolte(r.filter(function (x) { return x.id !== raccoltaId; }));
    ids.forEach(function (id) { if (!inRaccolte(id)) kvDel("t|" + id); });
  }
  function impostaNota(raccoltaId, id, nota) {
    var r = raccolte(), rc = r.filter(function (x) { return x.id === raccoltaId; })[0];
    if (!rc) return;
    rc.sentenze.forEach(function (s) { if (s.id === id) s.nota = String(nota || "").slice(0, 4000); });
    salvaRaccolte(r);
  }

  /* ---------------------------------------------------------------- esportazione / importazione */
  function testiDi(rc) {
    return Promise.all(rc.sentenze.map(function (s) {
      return kvGet("t|" + s.id).then(function (t) { return t || testoSentenza(s).catch(function () { return ""; }); });
    }));
  }
  function esportaWord(raccoltaId) {
    var rc = raccolte().filter(function (x) { return x.id === raccoltaId; })[0];
    if (!rc || !rc.sentenze.length) { A.toast("La raccolta e' vuota"); return; }
    A.toast("Preparo il documento…");
    testiDi(rc).then(function (testi) {
      var oggi = new Date().toLocaleDateString("it-IT");
      var corpo = "<h1>" + A.esc(rc.nome) + "</h1><p>Raccolta di sentenze della Corte di cassazione esportata da In Iure il " + oggi +
        ". Fonte: SentenzeWeb (ItalgiureWeb, Ministero della Giustizia). Documento per uso personale.</p>";
      rc.sentenze.forEach(function (s, i) {
        corpo += "<h2>" + (i + 1) + ". " + A.esc(s.estremi) + "</h2>" +
          (s.materia ? "<p><b>Materia:</b> " + A.esc(s.materia) + "</p>" : "") +
          (s.nota ? "<p><b>Nota personale:</b> " + A.esc(s.nota).replace(/\n/g, "<br>") + "</p>" : "") +
          (s.pdf ? "<p><b>PDF ufficiale:</b> " + A.esc(s.pdf) + "</p>" : "") +
          (testi[i] ? "<p>" + A.esc(testi[i]).replace(/\n{2,}/g, "</p><p>").replace(/\n/g, " ") + "</p>"
            : "<p><i>Testo integrale non disponibile su questo dispositivo: usa il PDF ufficiale.</i></p>");
      });
      var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">' +
        '<head><meta charset="utf-8"><title>' + A.esc(rc.nome) + "</title>" +
        '<style>body{font-family:"Times New Roman",serif;font-size:12pt;line-height:1.5;margin:2.5cm}h1{font-size:16pt}h2{font-size:13pt;margin-top:18pt}p{margin:0 0 8pt}</style></head><body>' +
        corpo + "</body></html>";
      A.downloadBlob(new Blob(["\ufeff", html], { type: "application/msword" }), "Sentenze_" + A.safeName(rc.nome) + ".doc");
    });
  }
  function esportaFile(raccoltaId) {
    var rc = raccolte().filter(function (x) { return x.id === raccoltaId; })[0];
    if (!rc) return;
    testiDi(rc).then(function (testi) {
      var dati = { formato: "in-iure-raccolta", versione: 1, esportata: new Date().toISOString(), raccolta: { nome: rc.nome, creata: rc.creata,
        sentenze: rc.sentenze.map(function (s, i) { var o = {}; Object.keys(s).forEach(function (k) { o[k] = s[k]; }); o.testo = testi[i] || ""; return o; }) } };
      A.downloadBlob(new Blob([JSON.stringify(dati)], { type: "application/json" }), "Raccolta_" + A.safeName(rc.nome) + ".iniure.json");
    });
  }
  function importaFile(file) {
    var fr = new FileReader();
    fr.onload = function () {
      var d;
      try { d = JSON.parse(String(fr.result)); } catch (e) { A.toast("File non valido"); return; }
      if (!d || d.formato !== "in-iure-raccolta" || !d.raccolta || !Array.isArray(d.raccolta.sentenze)) { A.toast("Non e' una raccolta di In Iure"); return; }
      var id = nuovaRaccolta(d.raccolta.nome || "Raccolta importata");
      var r = raccolte(), rc = r.filter(function (x) { return x.id === id; })[0], n = 0;
      d.raccolta.sentenze.forEach(function (s) {
        if (!s || !s.id || !/^[A-Za-z0-9]+$/.test(String(s.id))) return;
        if (rc.sentenze.some(function (x) { return x.id === s.id; })) return;
        rc.sentenze.push({ id: String(s.id), estremi: String(s.estremi || ""), kind: String(s.kind || ""), anno: s.anno, materia: String(s.materia || ""),
          pdf: /^https:\/\/www\.italgiure\.giustizia\.it\//.test(String(s.pdf || "")) ? String(s.pdf) : "",
          estratto: String(s.estratto || ""), nota: String(s.nota || ""), salvata: String(s.salvata || "") });
        if (s.testo) kvSet("t|" + s.id, String(s.testo));
        n++;
      });
      salvaRaccolte(r);
      A.toast(n + " sentenze importate in «" + rc.nome + "»");
      disegnaSalvate(id);
    };
    fr.readAsText(file);
  }

  /* ---------------------------------------------------------------- interfaccia: Ricerca */
  function opzioniCodici(sel) {
    return (A.CODICI_INDEX || []).map(function (c) {
      return '<option value="' + A.esc(c.id) + '"' + (c.id === sel ? " selected" : "") + ">" + A.esc(c.nome + " (" + c.abbr + ")") + "</option>";
    }).join("");
  }
  function modoCorrente() { var b = $(".ric-modo.is-active"); return b ? b.getAttribute("data-modo") : "parole"; }
  function impostaModo(m) {
    $$(".ric-modo").forEach(function (b) { b.classList.toggle("is-active", b.getAttribute("data-modo") === m); b.setAttribute("aria-selected", b.getAttribute("data-modo") === m); });
    $("#ric-art").hidden = m !== "articolo";
    $("#ric-testo-wrap").hidden = m === "articolo";
    var t = $("#ric-testo");
    t.placeholder = m === "frase" ? "Frase esatta, es.: danno da perdita di chance" : "Parole chiave, es.: responsabilita' medica risarci* (OR tra sinonimi)";
    $("#ric-aiuto").innerHTML = m === "articolo"
      ? "Cerca le sentenze che citano l'articolo in tutte le forme usate (es. «art. 2043 c.c.», «2043 cod. civ.», «articolo 2043 del codice civile»)."
      : m === "frase" ? "Trova solo le sentenze che contengono queste parole, in questo ordine."
        : "Trova le sentenze che contengono TUTTE le parole, in qualunque ordine. L'asterisco trova le varianti (<b>risarci*</b>), OR i sinonimi (<b>mobbing OR vessazioni</b>), le virgolette una locuzione.";
  }
  function leggiForm() {
    return {
      modo: modoCorrente(), testo: $("#ric-testo").value, codice: $("#ric-codice").value, numero: $("#ric-numero").value,
      archivio: $("#ric-archivio").value, annoDa: $("#ric-anno-da").value, annoA: $("#ric-anno-a").value,
      sezione: $("#ric-sezione").value, tipo: $("#ric-tipo").value, ordine: $("#ric-ordine").value
    };
  }
  function riempiForm(r) {
    if (!r) return;
    impostaModo(r.modo || "parole");
    $("#ric-testo").value = r.testo || ""; if (r.codice) $("#ric-codice").value = r.codice; $("#ric-numero").value = r.numero || "";
    $("#ric-archivio").value = r.archivio || ""; $("#ric-anno-da").value = r.annoDa || ""; $("#ric-anno-a").value = r.annoA || "";
    $("#ric-sezione").value = r.sezione || ""; $("#ric-tipo").value = r.tipo || ""; $("#ric-ordine").value = r.ordine || "rilevanza";
  }
  function avvisoNonDisponibile() {
    return '<div class="ric-avviso"><p><b>Su questo dispositivo la ricerca diretta non e\' possibile.</b> Il sito SentenzeWeb accetta le ricerche ' +
      "solo dalle app In Iure per Android e Windows, non dalle pagine web (browser e iPhone).</p>" +
      "<p>Cosa puoi fare qui:</p><ul>" +
      '<li>cerca sull\'app Android o Windows, salva le sentenze in una raccolta, usa «Esporta per altro dispositivo» e apri qui il file con «Importa raccolta» nella sezione <a href="#/salvate">Salvate</a>: leggerai i testi anche offline;</li>' +
      '<li>apri il sito ufficiale: <a href="' + SITO + '" target="_blank" rel="noopener">SentenzeWeb</a>.</li></ul></div>';
  }
  function disegnaStato() {
    var el = $("#ric-stato"); if (!el) return;
    if (!stato.richiesta) { el.innerHTML = ""; return; }
    if (stato.errore) { el.innerHTML = ""; return; }
    el.innerHTML = '<p class="search-count">' + (stato.totale ? "<b>" + stato.totale.toLocaleString("it-IT") + "</b> provvedimenti trovati" : (stato.inCorso ? "Ricerca in corso…" : "Nessun provvedimento trovato")) +
      (stato.totale ? " · schede caricate " + stato.caricate.toLocaleString("it-IT") + (stato.inCorso ? " (caricamento…)" : "") : "") + "</p>";
  }
  function disegnaRisultati() {
    var box = $("#ric-risultati"); if (!box) return;
    disegnaStato();
    if (!stato.richiesta) { box.innerHTML = trasporto() ? "" : avvisoNonDisponibile(); return; }
    if (stato.errore === "NON_DISPONIBILE") { box.innerHTML = avvisoNonDisponibile(); return; }
    if (stato.errore) { box.innerHTML = '<p class="empty">' + A.esc(stato.errore) + "</p>"; return; }
    var html = "";
    if (!stato.inCorso && stato.caricate < stato.totale) {
      var mancano = stato.totale - stato.caricate, giri = Math.ceil(mancano / BLOCCO);
      html += '<div class="ric-avviso"><p>Ricerca molto ampia: caricate le prime ' + stato.caricate.toLocaleString("it-IT") + " schede su " + stato.totale.toLocaleString("it-IT") +
        ". Per averle tutte servono altre " + giri + " richieste (circa " + Math.ceil(giri * LIMITI.intervalloMs / 1000) + " secondi). Puoi anche restringere la ricerca con i filtri.</p>" +
        '<button class="btn btn--sm" id="ric-carica-tutte">Carica tutte le schede</button></div>';
    }
    if (!stato.schede.length && !stato.inCorso && !stato.totale) html += '<p class="empty">Nessun risultato. Prova con meno parole, con l\'asterisco (risarci*) o con OR tra sinonimi.</p>';
    html += stato.schede.slice(0, stato.mostrate).map(schedaHTML).join("");
    if (stato.schede.length > stato.mostrate) html += '<button class="btn btn--block load-more" id="ric-altre">Mostra altri ' + Math.min(50, stato.schede.length - stato.mostrate) + " (" + (stato.schede.length - stato.mostrate) + " ancora)</button>";
    box.innerHTML = html;
  }
  function schedaHTML(s) {
    var salvata = inRaccolte(s.id);
    return '<article class="sentenza-card" data-sid="' + A.esc(s.id) + '">' +
      '<h3 class="sentenza-card__tit"><a href="#/sentenza/' + encodeURIComponent(s.id) + '" data-apri="' + A.esc(s.id) + '">' + A.esc(s.estremi) + "</a></h3>" +
      (s.materia ? '<p class="sentenza-card__mat">' + A.esc(s.materia) + "</p>" : "") +
      (s.estratto ? '<p class="sentenza-card__estr">«…' + A.esc(s.estratto) + '…»</p>' : "") +
      '<div class="articolo__actions">' + azioniSentenzaHTML(s, salvata) + "</div></article>";
  }
  function azioniSentenzaHTML(s, salvata) {
    if (salvata == null) salvata = inRaccolte(s.id);
    return '<button class="act-btn" data-apri="' + A.esc(s.id) + '">&#x1F4C4; Leggi</button>' +
      '<button class="act-btn act-btn--fav' + (salvata ? " is-on" : "") + '" data-salva="' + A.esc(s.id) + '">' + (salvata ? "&#9733; Salvata" : "&#9734; Salva") + "</button>" +
      '<button class="act-btn" data-copia-estremi="' + A.esc(s.id) + '">&#x1F4CB; Estremi</button>' +
      (s.pdf ? '<a class="act-btn" href="' + A.esc(s.pdf) + '" target="_blank" rel="noopener">&#x1F517; PDF ufficiale</a>' : "");
  }

  /* scelta della raccolta in cui salvare */
  var daSalvare = null;
  function chiediRaccolta(s) {
    daSalvare = s;
    var m = $("#salva-modal"), lista = raccolte();
    $("#salva-estremi").textContent = s.estremi;
    $("#salva-lista").innerHTML = lista.length ? lista.map(function (r) {
      var gia = r.sentenze.some(function (x) { return x.id === s.id; });
      return '<button class="chip' + (gia ? " is-active" : "") + '" data-in="' + A.esc(r.id) + '">' + A.esc(r.nome) + " <span>" + r.sentenze.length + "</span></button>";
    }).join("") : '<p class="empty">Nessuna raccolta: creane una qui sotto.</p>';
    var ult = stato.richiesta ? (stato.richiesta.modo === "articolo" ? "Art. " + stato.richiesta.numero + " " + (((A.CODICI_INDEX || []).filter(function (c) { return c.id === stato.richiesta.codice; })[0] || {}).abbr || "") : stato.richiesta.testo) : "";
    $("#salva-nuova").value = lista.length ? "" : String(ult || "").replace(/"/g, "").slice(0, 60);
    m.hidden = false;
  }

  /* ---------------------------------------------------------------- interfaccia: Sentenze salvate */
  var raccoltaAperta = null;
  function disegnaSalvate(apri) {
    if (apri !== undefined) raccoltaAperta = apri;
    var box = $("#salvate-body"); if (!box) return;
    var lista = raccolte();
    if (raccoltaAperta && !lista.some(function (r) { return r.id === raccoltaAperta; })) raccoltaAperta = null;
    if (!raccoltaAperta) {
      box.innerHTML = (lista.length ? '<div class="card-grid">' + lista.map(function (r) {
        return '<button class="card" data-raccolta="' + A.esc(r.id) + '"><span class="card__title">' + A.esc(r.nome) + '</span>' +
          '<span class="card__desc">' + r.sentenze.length + (r.sentenze.length === 1 ? " sentenza" : " sentenze") + " · creata il " + A.esc(fmt(r.creata)) + "</span></button>";
      }).join("") + "</div>" : '<p class="empty">Nessuna sentenza salvata. Nella sezione Ricerca tocca «&#9734; Salva» sotto una sentenza per metterla in una raccolta.</p>') +
        '<div class="form-toolbar"><button class="btn btn--sm" id="raccolta-crea">+ Nuova raccolta</button>' +
        '<label class="btn btn--sm">Importa raccolta<input type="file" id="raccolta-importa" accept=".json,application/json" hidden></label></div>';
      return;
    }
    var rc = lista.filter(function (r) { return r.id === raccoltaAperta; })[0];
    box.innerHTML = '<button class="btn btn--back" id="raccolte-indietro">&larr; Raccolte</button>' +
      '<h2 class="sub-title">' + A.esc(rc.nome) + "</h2>" +
      '<div class="form-toolbar">' +
      '<button class="btn btn--sm" data-esporta-word="' + A.esc(rc.id) + '">Esporta Word (NotebookLM / Antigravity)</button>' +
      '<button class="btn btn--sm" data-esporta-file="' + A.esc(rc.id) + '">Esporta per altro dispositivo</button>' +
      '<button class="btn btn--sm" data-rinomina="' + A.esc(rc.id) + '">Rinomina</button>' +
      '<button class="btn btn--sm btn--danger" data-elimina-raccolta="' + A.esc(rc.id) + '">Elimina raccolta</button></div>' +
      (rc.sentenze.length ? '<div class="form-toolbar"><label><input type="checkbox" id="sel-tutte"> Seleziona tutte</label>' +
        '<button class="btn btn--sm btn--danger" id="elimina-selezionate" disabled>Elimina selezionate</button></div>' +
        rc.sentenze.map(function (s) {
          return '<article class="sentenza-card" data-sid="' + A.esc(s.id) + '">' +
            '<label class="sentenza-card__sel"><input type="checkbox" class="sel-sentenza" value="' + A.esc(s.id) + '"> </label>' +
            '<h3 class="sentenza-card__tit"><a href="#/sentenza/' + encodeURIComponent(s.id) + '" data-apri="' + A.esc(s.id) + '">' + A.esc(s.estremi) + "</a></h3>" +
            (s.materia ? '<p class="sentenza-card__mat">' + A.esc(s.materia) + "</p>" : "") +
            (s.estratto ? '<p class="sentenza-card__estr">«…' + A.esc(s.estratto) + '…»</p>' : "") +
            '<textarea class="input sentenza-nota" data-nota="' + A.esc(s.id) + '" rows="2" placeholder="Nota personale (resta su questo dispositivo)">' + A.esc(s.nota || "") + "</textarea>" +
            '<div class="articolo__actions"><button class="act-btn" data-apri="' + A.esc(s.id) + '">&#x1F4C4; Leggi</button>' +
            '<button class="act-btn" data-copia-estremi="' + A.esc(s.id) + '">&#x1F4CB; Estremi</button>' +
            (s.pdf ? '<a class="act-btn" href="' + A.esc(s.pdf) + '" target="_blank" rel="noopener">&#x1F517; PDF ufficiale</a>' : "") +
            '<button class="act-btn act-btn--del" data-togli="' + A.esc(s.id) + '">&#x1F5D1; Elimina</button></div></article>';
        }).join("") : '<p class="empty">Raccolta vuota.</p>');
  }
  function fmt(iso) { var m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? m[3] + "/" + m[2] + "/" + m[1] : ""; }
  function aggiornaSelezione() {
    var n = $$(".sel-sentenza:checked").length, b = $("#elimina-selezionate");
    if (b) { b.disabled = !n; b.textContent = n ? "Elimina selezionate (" + n + ")" : "Elimina selezionate"; }
  }

  /* ---------------------------------------------------------------- eventi */
  function collega() {
    $$(".ric-modo").forEach(function (b) { b.addEventListener("click", function () { impostaModo(b.getAttribute("data-modo")); }); });
    $("#ric-form").addEventListener("submit", function (e) { e.preventDefault(); cerca(leggiForm()); });
    $("#ric-azzera").addEventListener("click", function () {
      $("#ric-form").reset(); impostaModo(modoCorrente()); giroRicerca++;
      stato = { richiesta: null, totale: 0, schede: [], caricate: 0, inCorso: false, errore: "", mostrate: 50 };
      disegnaRisultati();
    });
    document.addEventListener("click", function (e) {
      var t = e.target.closest("[data-apri],[data-salva],[data-copia-estremi],#ric-altre,#ric-carica-tutte,[data-raccolta],#raccolte-indietro,#raccolta-crea," +
        "[data-esporta-word],[data-esporta-file],[data-rinomina],[data-elimina-raccolta],[data-togli],#elimina-selezionate,[data-in],#salva-crea,#salva-chiudi");
      if (!t) return;
      if (t.hasAttribute("data-apri")) { e.preventDefault(); apriSentenza(t.getAttribute("data-apri")); return; }
      if (t.hasAttribute("data-salva")) { var s = trovaScheda(t.getAttribute("data-salva")); if (s) chiediRaccolta(s); return; }
      if (t.hasAttribute("data-copia-estremi")) { var s2 = trovaScheda(t.getAttribute("data-copia-estremi")); if (s2) A.copyText(s2.estremi + (s2.pdf ? "\n" + s2.pdf : ""), "Estremi copiati"); return; }
      if (t.id === "ric-altre") { stato.mostrate += 50; disegnaRisultati(); return; }
      if (t.id === "ric-carica-tutte") { caricaBlocco(stato.caricate, stato.giro); return; }
      if (t.hasAttribute("data-raccolta")) { disegnaSalvate(t.getAttribute("data-raccolta")); window.scrollTo(0, 0); return; }
      if (t.id === "raccolte-indietro") { disegnaSalvate(null); return; }
      if (t.id === "raccolta-crea") { var n = window.prompt("Nome della nuova raccolta (es. Responsabilita' medica):"); if (n && nuovaRaccolta(n)) disegnaSalvate(null); return; }
      if (t.hasAttribute("data-esporta-word")) { esportaWord(t.getAttribute("data-esporta-word")); return; }
      if (t.hasAttribute("data-esporta-file")) { esportaFile(t.getAttribute("data-esporta-file")); return; }
      if (t.hasAttribute("data-rinomina")) {
        var id = t.getAttribute("data-rinomina"), r = raccolte(), rc = r.filter(function (x) { return x.id === id; })[0];
        var nn = rc && window.prompt("Nuovo nome della raccolta:", rc.nome);
        if (nn && nn.trim()) { rc.nome = nn.trim().slice(0, 80); salvaRaccolte(r); disegnaSalvate(); }
        return;
      }
      if (t.hasAttribute("data-elimina-raccolta")) {
        var rid = t.getAttribute("data-elimina-raccolta"), rr = raccolte().filter(function (x) { return x.id === rid; })[0];
        if (rr && window.confirm("Eliminare la raccolta «" + rr.nome + "» e le sue " + rr.sentenze.length + " sentenze salvate? L'operazione non si puo' annullare.")) { eliminaRaccolta(rid); disegnaSalvate(null); A.toast("Raccolta eliminata"); }
        return;
      }
      if (t.hasAttribute("data-togli")) { rimuovi(raccoltaAperta, [t.getAttribute("data-togli")]); disegnaSalvate(); A.toast("Sentenza eliminata dalla raccolta"); return; }
      if (t.id === "elimina-selezionate") {
        var sel = $$(".sel-sentenza:checked").map(function (c) { return c.value; });
        if (sel.length && window.confirm("Eliminare " + sel.length + " sentenze dalla raccolta?")) { rimuovi(raccoltaAperta, sel); disegnaSalvate(); A.toast(sel.length + " sentenze eliminate"); }
        return;
      }
      if (t.hasAttribute("data-in")) {
        var esito = aggiungi(t.getAttribute("data-in"), daSalvare);
        $("#salva-modal").hidden = true;
        A.toast(esito === "gia" ? "Gia' presente in questa raccolta" : "Sentenza salvata");
        aggiornaBottoniSalva(daSalvare.id);
        return;
      }
      if (t.id === "salva-crea") {
        var idn = nuovaRaccolta($("#salva-nuova").value);
        if (!idn) { A.toast("Scrivi il nome della raccolta"); return; }
        aggiungi(idn, daSalvare); $("#salva-modal").hidden = true; A.toast("Sentenza salvata"); aggiornaBottoniSalva(daSalvare.id);
        return;
      }
      if (t.id === "salva-chiudi") { $("#salva-modal").hidden = true; return; }
    });
    document.addEventListener("change", function (e) {
      if (e.target.id === "raccolta-importa" && e.target.files && e.target.files[0]) { importaFile(e.target.files[0]); e.target.value = ""; return; }
      if (e.target.id === "sel-tutte") { $$(".sel-sentenza").forEach(function (c) { c.checked = e.target.checked; }); aggiornaSelezione(); return; }
      if (e.target.classList && e.target.classList.contains("sel-sentenza")) { aggiornaSelezione(); return; }
    });
    var notaTimer;
    document.addEventListener("input", function (e) {
      if (!e.target.hasAttribute || !e.target.hasAttribute("data-nota")) return;
      clearTimeout(notaTimer);
      var id = e.target.getAttribute("data-nota"), v = e.target.value;
      notaTimer = setTimeout(function () { impostaNota(raccoltaAperta, id, v); }, 400);
    });
  }
  function aggiornaBottoniSalva(id) {
    $$('[data-salva="' + id + '"]').forEach(function (b) { b.classList.add("is-on"); b.innerHTML = "&#9733; Salvata"; });
  }

  /* ---------------------------------------------------------------- avvio (chiamato da app.js) */
  window.InIureRicerca = {
    init: function (api) {
      A = api;
      if (!$("#section-ricerca")) return;
      $("#ric-codice").innerHTML = opzioniCodici("codice-civile");
      var anno = new Date().getFullYear(), opz = '<option value="">qualsiasi</option>';
      for (var y = anno; y >= anno - 12; y--) opz += '<option value="' + y + '">' + y + "</option>";
      $("#ric-anno-da").innerHTML = opz; $("#ric-anno-a").innerHTML = opz;
      impostaModo("parole");
      riempiForm(A.store.get("ricerca_ultima", null));
      collega();
      disegnaRisultati();
    },
    mostraRicerca: function () { A.showView($("#section-ricerca"), "ricerca-home"); disegnaRisultati(); },
    mostraSalvate: function () { disegnaSalvate(); },
    apriSentenza: apriSentenza,
    // per i test e per Antigravity (stessa costruzione delle ricerche)
    _interni: { paroleInQuery: paroleInQuery, fraseInQuery: fraseInQuery, articoloInQuery: articoloInQuery, filtri: filtri, estremi: estremi,
      raccolte: raccolte, aggiungi: aggiungi, rimuovi: rimuovi, nuovaRaccolta: nuovaRaccolta, LIMITI: LIMITI, trasporto: trasporto }
  };
})();
