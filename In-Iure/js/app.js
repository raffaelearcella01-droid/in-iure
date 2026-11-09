/* ============================================================
   In Iure — logica applicativa
   ============================================================ */
(function () {
  "use strict";

  // Dati (fallback se un file dati manca)
  var CODICI_INDEX = (typeof window.CODICI_INDEX !== "undefined" && window.CODICI_INDEX) ? window.CODICI_INDEX : [];
  var codiciCache = {};           // id -> codice completo (caricato a richiesta)
  window.registerCodice = function (c) {
    if (c && c.id) codiciCache[c.id] = c;
  };
  // versione "tutto-in-uno": i codici pre-caricati vengono riversati nella cache
  if (window.__CODICI_PRELOAD && window.__CODICI_PRELOAD.length) {
    window.__CODICI_PRELOAD.forEach(function (c) { if (c && c.id) codiciCache[c.id] = c; });
  }
  function _arr(x) { return (typeof x !== "undefined" && x) ? x : []; }
  var ATTI = _arr(window.ATTI).concat(_arr(window.ATTI_EXTRA));
  // Quiz: unione della banca base con quella ampliata (per id materia)
  function buildQuiz(qBase, qExtra) {
    var base = _arr(qBase).map(function (m) { return { materia: m.materia, id: m.id, domande: (m.domande || []).slice() }; });
    var byId = {}; base.forEach(function (m) { byId[m.id] = m; });
    _arr(qExtra).forEach(function (m) {
      if (byId[m.id]) byId[m.id].domande = byId[m.id].domande.concat(m.domande || []);
      else { var nm = { materia: m.materia, id: m.id, domande: (m.domande || []).slice() }; base.push(nm); byId[m.id] = nm; }
    });
    return base;
  }
  var QUIZ = buildQuiz(window.QUIZ, window.QUIZ_EXTRA);

  /* ---------- Memoria locale (preferiti, bozze, statistiche, impostazioni) ---------- */
  // se il browser blocca localStorage (es. navigazione privata) i dati restano in memoria per la sessione
  var memStore = {};
  var store = {
    get: function (k, d) {
      var v;
      try { v = localStorage.getItem("iniure_" + k); } catch (e) { v = memStore[k]; }
      if (v == null) return d;
      try { return JSON.parse(v); } catch (e) { return d; }
    },
    set: function (k, v) {
      var s = JSON.stringify(v);
      try { localStorage.setItem("iniure_" + k, s); } catch (e) { memStore[k] = s; }
    },
    del: function (k) {
      try { localStorage.removeItem("iniure_" + k); } catch (e) { delete memStore[k]; }
    }
  };
  window.InIureStore = store;   // usato dai test automatici

  /* ---------- Aggiornamento automatico dei contenuti (app installate) ----------
     Le app (Android, iPhone nativa, Windows/Mac) contengono i testi di fabbrica. Se in js/update-config.js e'
     indicato un indirizzo (IN_IURE_UPDATE_URL), all'avvio l'app confronta js/codici-versioni.json pubblicato
     li' con la propria versione e scarica SOLO i file cambiati (codici, atti, quiz). I file scaricati restano
     sul dispositivo (IndexedDB) e sostituiscono quelli di fabbrica finche' non si installa una versione piu'
     recente dell'app. I dati sono letti come JSON (nessun codice eseguito). Sul sito web (stessa origine)
     l'aggiornamento avviene gia' tramite il service worker e questo meccanismo resta spento. */
  var Upd = (function () {
    var BASE = String(window.IN_IURE_UPDATE_URL || "").trim();
    if (BASE && BASE.slice(-1) !== "/") BASE += "/";
    var LOCAL = window.CONTENUTI_VERSIONI || null;
    var enabled = false;
    try { enabled = !!BASE && !!LOCAL && location.protocol !== "file:" && new URL(BASE, location.href).origin !== location.origin; } catch (e) { enabled = false; }
    var DBN = "iniure-aggiornamenti", ST = "file", dbp = null, applied = null;
    var ready = !enabled, waiting = [];             // finche' non sono letti i contenuti salvati, i codici attendono
    function whenReady(f) { if (ready) f(); else waiting.push(f); }
    function setReady() { ready = true; var w = waiting; waiting = []; w.forEach(function (f) { f(); }); }
    var DATA = ["js/codici-index.js", "js/data-atti.js", "js/data-atti-extra.js", "js/data-quiz.js", "js/data-quiz-extra.js"];

    function db(cb) {
      if (!enabled || !window.indexedDB) { cb(null); return; }
      if (!dbp) dbp = new Promise(function (res, rej) {
        var r = indexedDB.open(DBN, 1);
        r.onupgradeneeded = function () { r.result.createObjectStore(ST); };
        r.onsuccess = function () { res(r.result); };
        r.onerror = function () { rej(r.error); };
      });
      dbp.then(cb, function () { cb(null); });
    }
    function get(key, cb) {
      db(function (d) {
        if (!d) { cb(null); return; }
        try { var q = d.transaction(ST).objectStore(ST).get(key); q.onsuccess = function () { cb(q.result == null ? null : q.result); }; q.onerror = function () { cb(null); }; }
        catch (e) { cb(null); }
      });
    }
    function putAll(map, cb) {
      db(function (d) {
        if (!d) { cb(false); return; }
        try {
          var tx = d.transaction(ST, "readwrite"), os = tx.objectStore(ST);
          Object.keys(map).forEach(function (k) { os.put(map[k], k); });
          tx.oncomplete = function () { cb(true); }; tx.onerror = tx.onabort = function () { cb(false); };
        } catch (e) { cb(false); }
      });
    }
    function clearAll(cb) {
      db(function (d) {
        if (!d) { cb(); return; }
        try { var tx = d.transaction(ST, "readwrite"); tx.objectStore(ST).clear(); tx.oncomplete = tx.onerror = function () { cb(); }; } catch (e) { cb(); }
      });
    }
    function parseVar(txt) {
      var m = String(txt).match(/var\s+[A-Z_]+\s*=\s*([\s\S]*?);?\s*$/);
      return m ? JSON.parse(m[1]) : null;
    }
    function parseCodice(txt) {
      var m = String(txt).match(/^\s*registerCodice\(([\s\S]*)\);?\s*$/);
      return m ? JSON.parse(m[1]) : null;
    }
    function current() { return applied || LOCAL; }
    function isNewer(file) { return !!(applied && LOCAL && applied.files[file] && applied.files[file] !== LOCAL.files[file]); }

    // Contenuti scaricati in precedenza (in avvio): restituisce {index, atti, attiExtra, quiz, quizExtra} da applicare
    function init(cb0) {
      if (!enabled) { cb0(null); return; }
      var done = false, cb = function (x) { if (done) return; done = true; setReady(); cb0(x); };
      setTimeout(function () { cb(null); }, 5000);   // se il database del dispositivo non risponde si usano i testi di fabbrica
      get("__versioni", function (v) {
        if (!v || !v.generato || !(v.generato > LOCAL.generato)) {
          applied = null;
          if (v) clearAll(function () { });   // e' stata installata un'app piu' recente: si torna ai contenuti di fabbrica
          cb(null); return;
        }
        applied = v;
        var out = {}, left = DATA.length;
        DATA.forEach(function (f) {
          if (!isNewer(f)) { if (--left === 0) cb(out); return; }
          get(f, function (txt) {
            try { if (txt) out[f] = parseVar(txt); } catch (e) { }
            if (--left === 0) cb(out);
          });
        });
      });
    }
    function readCodice(file, cb) {
      if (!ready) { whenReady(function () { readCodice(file, cb); }); return; }
      if (!isNewer(file)) { cb(null); return; }
      get(file, function (txt) { var c = null; try { c = txt ? parseCodice(txt) : null; } catch (e) { c = null; } cb(c); });
    }
    function fetchText(url) {
      return fetch(url, { cache: "no-store" }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); });
    }
    // Controllo degli aggiornamenti. cb(stato, dati): stato = "aggiornato" | "nuovo" | "errore" | "spento"
    function check(manual, cb) {
      if (!enabled) { cb("spento"); return; }
      if (!manual && navigator.onLine === false) { cb("errore"); return; }
      var last = store.get("upd_ultimo_controllo", 0);
      if (!manual && Date.now() - last < 6 * 3600 * 1000) { cb("aggiornato"); return; }
      fetchText(BASE + "js/codici-versioni.json?t=" + Date.now()).then(function (t) {
        var remote = JSON.parse(t);
        store.set("upd_ultimo_controllo", Date.now());
        if (!remote || !remote.files || !(remote.generato > current().generato)) { cb("aggiornato"); return; }
        var cur = current().files, changed = Object.keys(remote.files).filter(function (f) { return remote.files[f] !== cur[f] && /^js\/[a-z0-9\-\/]+\.js$/.test(f); });
        return Promise.all(changed.map(function (f) {
          return fetchText(BASE + f + "?v=" + remote.files[f]).then(function (txt) {
            // controllo di integrita': deve essere un file dati valido
            if (/^js\/codici\//.test(f)) { if (!parseCodice(txt)) throw new Error("dati non validi " + f); }
            else if (!parseVar(txt)) throw new Error("dati non validi " + f);
            return [f, txt];
          });
        })).then(function (pairs) {
          var map = { "__versioni": remote };
          pairs.forEach(function (p) { map[p[0]] = p[1]; });
          putAll(map, function (ok) {
            if (!ok) { cb("errore"); return; }
            applied = remote;
            var out = {};
            pairs.forEach(function (p) { if (DATA.indexOf(p[0]) !== -1) out[p[0]] = parseVar(p[1]); });
            var codici = pairs.map(function (p) { return p[0]; }).filter(function (f) { return /^js\/codici\//.test(f); });
            cb("nuovo", { dati: out, codici: codici, versione: remote });
          });
        });
      }).catch(function () { cb("errore"); });
    }
    return {
      enabled: enabled, init: init, readCodice: readCodice, check: check,
      versione: function () { return current(); }
    };
  })();

  // Caricamento a richiesta dei file dei codici
  function metaOf(id) {
    for (var i = 0; i < CODICI_INDEX.length; i++) if (CODICI_INDEX[i].id === id) return CODICI_INDEX[i];
    return null;
  }
  var loading = {};
  function loadCodice(id, cb) {
    if (codiciCache[id]) { cb(codiciCache[id]); return; }
    var meta = metaOf(id);
    if (!meta) { cb(null); return; }
    if (loading[id]) { loading[id].push(cb); return; }
    loading[id] = [cb];
    function done(ok) {
      var cbs = loading[id] || []; delete loading[id];
      if (!ok) toast("Impossibile caricare " + meta.nome);
      cbs.forEach(function (f) { f(codiciCache[id] || null); });
    }
    function fromScript() {
      var s = document.createElement("script");
      s.src = meta.file;
      s.onload = function () { done(true); };
      s.onerror = function () { done(false); };
      document.head.appendChild(s);
    }
    // versione piu' recente scaricata dall'aggiornamento automatico (se presente)
    Upd.readCodice(meta.file, function (c) {
      if (c && c.id === id) { codiciCache[id] = c; done(true); } else fromScript();
    });
  }
  function loadAllCodici(cb) {
    var pending = CODICI_INDEX.filter(function (m) { return !codiciCache[m.id]; });
    if (!pending.length) { cb(); return; }
    var left = pending.length;
    pending.forEach(function (m) {
      loadCodice(m.id, function () { if (--left === 0) cb(); });
    });
  }

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Utility ---------- */
  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function norm(str) {
    return String(str || "").toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "");
  }
  function toast(msg) {
    var t = $("#toast");
    t.textContent = msg; t.hidden = false;
    clearTimeout(t._t);
    t._t = setTimeout(function () { t.hidden = true; }, 2200);
  }
  function fmtDate(iso) {
    var m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? (m[3] + "/" + m[2] + "/" + m[1]) : "";
  }

  /* ============================================================
     NAVIGAZIONE (con cronologia: tasto Indietro del telefono/browser)
     ============================================================ */
  var applyingRoute = false;
  function pushRoute(hash) {
    if (applyingRoute) return;
    if (location.hash === hash) return;
    try { history.pushState(null, "", hash); } catch (e) { }
  }
  function showSection(name) {
    $$(".section").forEach(function (s) { s.classList.remove("is-active"); });
    var sec = $("#section-" + name);
    if (sec) sec.classList.add("is-active");
    $$(".tab").forEach(function (t) {
      t.classList.toggle("is-active", t.getAttribute("data-section") === name);
    });
    window.scrollTo(0, 0);
  }
  function showView(sectionEl, viewId) {
    $$(".view", sectionEl).forEach(function (v) { v.hidden = true; });
    var v = $("#" + viewId);
    if (v) v.hidden = false;
    window.scrollTo(0, 0);
  }
  function goHome(name) {
    showSection(name);
    if (name === "codici") showView($("#section-codici"), "codici-home");
    if (name === "quiz") { showView($("#section-quiz"), "quiz-home"); renderQuizHome(); }
    if (name === "scrittura") showView($("#section-scrittura"), "scrittura-home");
    if (name === "preferiti") renderPreferiti();
    if (name === "ricerca" && window.InIureRicerca) InIureRicerca.mostraRicerca();
    if (name === "salvate" && window.InIureRicerca) InIureRicerca.mostraSalvate();
    pushRoute("#/" + name);
  }

  $$(".tab").forEach(function (t) {
    t.addEventListener("click", function () { goHome(t.getAttribute("data-section")); });
  });
  document.addEventListener("click", function (e) {
    var nav = e.target.closest("[data-nav]");
    if (!nav) return;
    var target = nav.getAttribute("data-nav");
    // "Indietro" interno: se la pagina precedente e' la home della sezione usa la cronologia
    if (target === "home") target = "codici";
    goHome(target);
  });

  function applyRoute(hash) {
    applyingRoute = true;
    try {
      var h = String(hash || "").replace(/^#\/?/, "");
      var q = "";
      var qi = h.indexOf("?q=");
      if (qi !== -1) { q = decodeURIComponent(h.slice(qi + 3)); h = h.slice(0, qi); }
      var p = h.split("/");
      if (p[0] === "codice" && p[1] && metaOf(p[1])) openCodice(p[1], q);
      else if (p[0] === "atto" && p[1]) openAtto(decodeURIComponent(p[1]));
      else if (p[0] === "quiz") goHome("quiz");
      else if (p[0] === "scrittura") goHome("scrittura");
      else if (p[0] === "preferiti") goHome("preferiti");
      else if (p[0] === "ricerca") goHome("ricerca");
      else if (p[0] === "salvate") goHome("salvate");
      else if (p[0] === "sentenza" && p[1] && window.InIureRicerca) InIureRicerca.apriSentenza(decodeURIComponent(p[1]));
      else goHome("codici");
    } finally { applyingRoute = false; }
  }
  window.addEventListener("popstate", function () { closeAllModals(); applyRoute(location.hash); });

  /* ============================================================
     SEZIONE 1 — CODICI E NORMATIVE
     ============================================================ */
  function codiceCardHTML(c) {
    return '<button class="card card--codice" data-codice="' + esc(c.id) + '">' +
      '<span class="card__emblem" aria-hidden="true">&#9878;</span>' +
      '<span class="card__abbr">' + esc(c.abbr || c.nome) + "</span>" +
      '<h3 class="card__title">' + esc(c.nome) + "</h3>" +
      (c.descrizione ? '<p class="card__desc">' + esc(c.descrizione) + "</p>" : "") +
      (c.aggiornato ? '<p class="card__date">Ultima modifica: ' + esc(fmtDate(c.aggiornato)) + "</p>" : "") +
      "</button>";
  }
  function renderCodiciHome() {
    var wrap = $("#codici-categorie");
    if (!CODICI_INDEX.length) { wrap.innerHTML = '<p class="empty">Nessun codice disponibile.</p>'; return; }
    var cats = {}, order = [];
    CODICI_INDEX.forEach(function (c) {
      var cat = c.categoria || "Altro";
      if (!cats[cat]) { cats[cat] = []; order.push(cat); }
      cats[cat].push(c);
    });
    var html = "";
    var recenti = store.get("recenti_codici", []).map(metaOf).filter(Boolean).slice(0, 4);
    if (recenti.length) {
      html += '<div class="cat-block"><h2 class="cat-title">Aperti di recente</h2><div class="card-grid">' +
        recenti.map(codiceCardHTML).join("") + "</div></div>";
    }
    order.forEach(function (cat) {
      html += '<div class="cat-block"><h2 class="cat-title">' + esc(cat) + "</h2><div class='card-grid'>";
      html += cats[cat].map(codiceCardHTML).join("");
      html += "</div></div>";
    });
    wrap.innerHTML = html;
  }
  document.addEventListener("click", function (e) {
    var card = e.target.closest("[data-codice]");
    if (card && !e.defaultPrevented) openCodice(card.getAttribute("data-codice"));
  });

  var currentCodice = null;
  function openCodice(id, q) {
    var meta = metaOf(id);
    if (!meta) return;
    $("#codice-title").textContent = meta.nome;
    $("#codice-desc").textContent = meta.descrizione || "";
    var info = $("#codice-info");
    if (info) {
      info.innerHTML = "Testo vigente da Normattiva" + (meta.verificato ? " (consultata il " + esc(fmtDate(meta.verificato)) + ")" : "") +
        (meta.aggiornato ? " &middot; ultima modifica in vigore dal <strong>" + esc(fmtDate(meta.aggiornato)) + "</strong>" : "") + (meta.urn ? ' &middot; <a href="https://www.normattiva.it/uri-res/N2Ls?' + esc(meta.urn) + '" target="_blank" rel="noopener">apri l\'atto ufficiale</a>' : "");
    }
    $("#codice-search").value = q || "";
    $("#codice-count").textContent = "";
    $("#articoli-list").innerHTML = '<p class="empty">Caricamento del codice…</p>';
    showSection("codici");
    showView($("#section-codici"), "codice-detail");
    pushRoute("#/codice/" + id + (q ? "?q=" + encodeURIComponent(q) : ""));
    var rec = store.get("recenti_codici", []).filter(function (x) { return x !== id; });
    rec.unshift(id); store.set("recenti_codici", rec.slice(0, 8));
    loadCodice(id, function (c) {
      if (!c) { $("#articoli-list").innerHTML = '<p class="empty">Codice non disponibile.</p>'; return; }
      currentCodice = c;
      renderArticoli(c, q || "");
    });
  }

  // trova codice+articolo dalla cache
  function findArt(codeId, num) {
    var c = codiciCache[codeId]; if (!c) return null;
    if (!c.__byNum) { c.__byNum = {}; (c.articoli || []).forEach(function (a) { c.__byNum[numKey(a.num)] = a; }); }
    var a = c.__byNum[numKey(num)];
    return a ? { c: c, a: a } : null;
  }

  // ===== Analisi della query e ranking di rilevanza =====
  var SUFX = "bis|ter|quater|quinquies|sexies|septies|octies|novies|nonies|decies|undecies|duodecies|terdecies|quaterdecies|quinquiesdecies|sexiesdecies|septiesdecies|octiesdecies|duodevicies|undevicies|vicies";
  var STOPW = { di:1, del:1, dello:1, della:1, dei:1, degli:1, delle:1, la:1, il:1, lo:1, le:1, gli:1, un:1, uno:1,
    una:1, e:1, o:1, in:1, da:1, al:1, ai:1, alla:1, agli:1, per:1, con:1, su:1, tra:1, fra:1, che:1, nel:1, nella:1 };

  function numKey(s) { return norm(s).replace(/[\s\-]/g, ""); }

  // Riconosce il riferimento a un codice (flessibile: c.p.c. / cpc / c.c. / cc / codice civile…)
  var CODE_REFS = [
    [/(^|\s)(disp\.?\s*att\.?\s*c\.?p\.?c\.?|disposizioni di attuazione (del )?codice di procedura civile)(?=\s|$)/g, "disp-att-cpc"],
    [/(^|\s)(disp\.?\s*att\.?\s*c\.?p\.?p\.?|norme di attuazione (del )?codice di procedura penale)(?=\s|$)/g, "disp-att-cpp"],
    [/(^|\s)(disp\.?\s*att\.?\s*c\.?c\.?|disposizioni di attuazione (del )?codice civile)(?=\s|$)/g, "disp-att-cc"],
    [/(^|\s)(preleggi|disp\.?\s*prel\.?(\s*c\.?c\.?)?)(?=\s|$)/g, "preleggi"],
    [/(^|\s)codice di procedura civile(?=\s|$)/g, "cpc"],
    [/(^|\s)procedura civile(?=\s|$)/g, "cpc"],
    [/(^|\s)codice di procedura penale(?=\s|$)/g, "cpp"],
    [/(^|\s)procedura penale(?=\s|$)/g, "cpp"],
    [/(^|\s)codice civile(?=\s|$)/g, "codice-civile"],
    [/(^|\s)codice penale(?=\s|$)/g, "codice-penale"],
    [/(^|\s)codice (della strada|strada)(?=\s|$)/g, "cds"],
    [/(^|\s)(codice del processo amministrativo|c\.?p\.?a\.?)(?=\s|$)/g, "cpa"],
    [/(^|\s)(codice del consumo|cod\.?\s*cons\.?)(?=\s|$)/g, "consumo"],
    [/(^|\s)(codice della crisi( d'impresa)?|ccii)(?=\s|$)/g, "crisi-impresa"],
    [/(^|\s)(codice (delle )?assicurazioni( private)?|cod\.?\s*ass\.?)(?=\s|$)/g, "assicurazioni"],
    [/(^|\s)(codice (della )?privacy|cod\.?\s*privacy)(?=\s|$)/g, "privacy"],
    [/(^|\s)(statuto dei lavoratori)(?=\s|$)/g, "statuto-lavoratori"],
    [/(^|\s)(ordinamento penitenziario|o\.?p\.?)(?=\s|$)/g, "ord-penitenziario"],
    [/(^|\s)costituzione(?=\s|$)/g, "costituzione"],
    [/(^|\s)c\.?p\.?c\.?(?=\s|$)/g, "cpc"],
    [/(^|\s)c\.?p\.?p\.?(?=\s|$)/g, "cpp"],
    [/(^|\s)c\.?d\.?s\.?(?=\s|$)/g, "cds"],
    [/(^|\s)c\.?c\.?(?=\s|$)/g, "codice-civile"],
    [/(^|\s)c\.?p\.?(?=\s|$)/g, "codice-penale"],
    [/(^|\s)cost\.?(?=\s|$)/g, "costituzione"]
  ];
  function parseCodeRef(q) {
    var id = null;
    CODE_REFS.forEach(function (r) {
      if (r[0].test(q)) { id = id || r[1]; q = q.replace(r[0], " "); }
      r[0].lastIndex = 0;
    });
    // riferimenti a leggi per estremi: "l. 241/1990", "d.lgs. 231/2001", "dpr 115/2002"
    var m = q.match(/(^|\s)(?:l\.?|legge|d\.?\s?lgs\.?|dlgs|d\.?\s?l\.?|dl|d\.?\s?p\.?\s?r\.?|dpr)\s*(?:n\.?\s*)?(\d{1,4})\s*\/\s*(\d{4})(?=\s|$)/);
    if (m && !id) {
      var key = m[2] + "/" + m[3];
      CODICI_INDEX.forEach(function (c) { if (!id && String(c.abbr || "").indexOf(key) !== -1) id = c.id; });
      if (id) q = q.replace(m[0], " ");
    }
    return { id: id, stripped: q.replace(/\s+/g, " ").trim() };
  }

  // Riconosce ricerche per numero ("2043", "art 2043", "570-bis", "518.1") ed eventuale codice ("art. 127 ter c.p.c.")
  function analyzeQuery(raw) {
    var q = norm(raw).trim().replace(/\s+/g, " ");
    if (!q) return null;
    var cr = parseCodeRef(q);
    var codeId = cr.id;
    var m = cr.stripped.match(new RegExp("^(?:artt?(?:icolo)?\\.?\\s*)?(\\d+(?:[\\s\\-]?(?:" + SUFX + ")\\b)*(?:\\.\\d+)?)\\.?$"));
    if (m) {
      return { type: "num", num: m[1].replace(/\s+/g, "-"), digits: (m[1].match(/^\d+/) || [""])[0], codeId: codeId };
    }
    var src = cr.stripped;
    var words = src.split(" ").filter(function (w) { return w.length > 1 && !STOPW[w]; });
    if (!words.length) words = src.split(" ").filter(function (w) { return w.length > 1; });
    if (!words.length) return null;   // solo riferimento al codice senza altro criterio
    return { type: "kw", words: words, phrase: src, codeId: codeId };
  }

  function artSortNum(num) { var m = String(num).match(/^(\d+)/); return m ? parseInt(m[1], 10) : 999999; }

  function refersTo(art, digits) {
    if (!digits) return false;
    if (!art.__txt) art.__txt = norm((art.rubrica || "") + " " + (art.commi || []).join(" "));
    return new RegExp("(^|[^0-9])" + digits + "([^0-9]|$)").test(art.__txt);
  }

  // Punteggio di rilevanza: articolo esatto/principale in cima, richiami a seguire
  function scoreArticle(art, A) {
    if (A.type === "num") {
      if (numKey(art.num) === numKey(A.num)) return 1e9;     // articolo cercato: sempre primo
      return refersTo(art, A.digits) ? 1000 : 0;             // articoli che lo richiamano
    }
    if (!art.__rub) { art.__rub = norm(art.rubrica || ""); art.__body = norm((art.commi || []).join(" ")); }
    var rub = art.__rub, body = art.__body;
    var all = " " + rub + "  " + body;
    // tutte le parole presenti, a inizio di parola ("contrattuale" non corrisponde a "precontrattuale")
    if (!A.words.every(function (w) { return wordStart(all, w); })) return 0;
    var s = 0;
    if (rub.indexOf(A.phrase) !== -1) s += 100000;           // frase esatta in rubrica = articolo principale
    // parole INTERE nella rubrica (evita che "contrattuale" corrisponda a "precontrattuale")
    var whole = A.words.filter(function (w) {
      return new RegExp("(^|[^a-z0-9])" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "([^a-z0-9]|$)").test(rub);
    }).length;
    if (whole === A.words.length) s += 40000;
    s += whole * 4000;
    if (A.words.every(function (w) { return rub.indexOf(w) !== -1; })) s += 20000;
    A.words.forEach(function (w) { if (rub.indexOf(w) !== -1) s += 1500; });
    if (body.indexOf(A.phrase) !== -1) s += 8000;
    var head = body.slice(0, 90);                              // parole nell'incipit dell'articolo
    A.words.forEach(function (w) { var p = head.indexOf(w); if (p !== -1 && wordStart(head, w)) s += Math.max(500, 2500 - p * 20); });
    A.words.forEach(function (w) { if (body.indexOf(w) !== -1) s += 300; });
    return s;
  }

  function wordStart(text, w) {
    var i = text.indexOf(w);
    while (i !== -1) {
      if (i === 0 || !/[a-z0-9]/.test(text.charAt(i - 1))) return true;
      i = text.indexOf(w, i + 1);
    }
    return false;
  }

  function rankArticles(articoli, A) {
    var scored = [];
    for (var i = 0; i < articoli.length; i++) {
      var sc = scoreArticle(articoli[i], A);
      if (sc > 0) scored.push({ a: articoli[i], s: sc, n: artSortNum(articoli[i].num) });
    }
    scored.sort(function (x, y) { return (y.s - x.s) || (x.n - y.n); });
    return scored.map(function (o) { return o.a; });
  }

  // Evidenziazione multi-termine
  function highlightQuery(text, A) {
    if (!A) return esc(text);
    var terms = (A.type === "num") ? [A.digits] : A.words;
    terms = terms.filter(Boolean).map(function (t) { return norm(t); }).sort(function (a, b) { return b.length - a.length; });
    if (!terms.length) return esc(text);
    var nt = norm(text), out = "", i = 0;
    while (i < text.length) {
      var hit = 0;
      for (var k = 0; k < terms.length; k++) {
        if (nt.substr(i, terms[k].length) === terms[k]) { hit = terms[k].length; break; }
      }
      if (hit) { out += '<span class="hl">' + esc(text.substr(i, hit)) + "</span>"; i += hit; }
      else { out += esc(text[i]); i++; }
    }
    return out;
  }

  /* ----- Rimandi cliccabili ("articolo 166", "art. 2043 del codice civile") ----- */
  var XREF_RE = new RegExp("\\b(artt?\\.|articol[oi])\\s+(\\d{1,4}(?:[-\\s](?:" + SUFX + "))?(?:\\.\\d+)?)(?![\\d\\w-])", "gi");
  var OTHER_ACT = /^\s*,?\s*(?:del|della|dello|delle|dei|degli|di cui al(?:la|l')?|dal|dalla|ai sensi del(?:la)?|nel|nella)\s+(?:presente\s+(?:decreto|legge|testo|regolamento|titolo)|legge|l\.|decreto|d\.|dl|r\.d|regio|testo unico|t\.u|regolamento|trattato|direttiva|disposizioni|norme|statuto|convenzione|ordinamento|tabella|allegato|n\.|codice (?:della|del|dei|delle|in materia|antimafia|deontologico)|c\.p\.a|costituzione|tuel)/i;
  var NAMED_CODE = [
    [/^\s*,?\s*del(?:l')?\s*(?:codice civile|c\.c\.)/i, "codice-civile"],
    [/^\s*,?\s*del\s*(?:codice di procedura civile|c\.p\.c\.)/i, "cpc"],
    [/^\s*,?\s*del\s*(?:codice penale|c\.p\.)(?![a-z.])/i, "codice-penale"],
    [/^\s*,?\s*del\s*(?:codice di procedura penale|c\.p\.p\.)/i, "cpp"],
    [/^\s*,?\s*della\s*costituzione/i, "costituzione"],
    [/^\s*,?\s*del\s*(?:codice della strada)/i, "cds"]
  ];
  // nelle disposizioni di attuazione "del codice" rinvia al codice principale
  var MAIN_CODE = { "disp-att-cc": "codice-civile", "disp-att-cpc": "cpc", "disp-att-cpp": "cpp", "preleggi": "codice-civile" };
  function xrefTarget(codeId, after) {
    var tail = after.replace(/^\s*,?\s*(?:(?:primo|secondo|terzo|quarto|quinto|sesto|settimo|ottavo|nono|decimo|ultimo|penultimo)\s+comma|comm[ai]\s+[\d\w-]+(?:\s*(?:,|e)\s*[\d\w-]+)*|lettera\s+\w+\)?|numero\s+\d+\)?|n\.\s*\d+\)?)(?:\s*,)?/i, "");
    for (var i = 0; i < NAMED_CODE.length; i++) if (NAMED_CODE[i][0].test(tail)) return NAMED_CODE[i][1];
    if (/^\s*,?\s*del\s+(?:presente\s+)?codice(?![\w ]*(?:della|del|dei|delle|in materia|antimafia|di procedura))/i.test(tail)) {
      return /presente/i.test(tail.slice(0, 20)) ? codeId : (MAIN_CODE[codeId] || codeId);
    }
    if (OTHER_ACT.test(tail)) return null;
    return codeId;
  }
  function linkify(text, codeId, A) {
    if (!codeId) return highlightQuery(text, A);
    var out = "", last = 0, m;
    XREF_RE.lastIndex = 0;
    while ((m = XREF_RE.exec(text))) {
      var target = xrefTarget(codeId, text.slice(m.index + m[0].length, m.index + m[0].length + 90));
      if (!target || !metaOf(target)) continue;
      var num = m[2].replace(/\s+/g, "-").toLowerCase();
      out += highlightQuery(text.slice(last, m.index), A) +
        '<a href="#" class="xref" data-xcode="' + esc(target) + '" data-xnum="' + esc(num) + '">' + highlightQuery(m[0], A) + "</a>";
      last = m.index + m[0].length;
    }
    return out + highlightQuery(text.slice(last), A);
  }

  /* ----- Preferiti ----- */
  function favArtKey(codeId, num) { return codeId + "|" + num; }
  function isFavArt(codeId, num) { return store.get("fav_articoli", []).indexOf(favArtKey(codeId, num)) !== -1; }
  function toggleFavArt(codeId, num) {
    var list = store.get("fav_articoli", []), k = favArtKey(codeId, num), i = list.indexOf(k);
    if (i === -1) list.unshift(k); else list.splice(i, 1);
    store.set("fav_articoli", list);
    return i === -1;
  }

  // Link Normattiva al singolo articolo (formato URN-NIR); per gli allegati si apre l'atto intero
  var ART_URN = {
    "codice-civile": "urn:nir:stato:codice.civile:1942-03-16;262",
    "cpc": "urn:nir:stato:codice.procedura.civile:1940-10-28;1443",
    "codice-penale": "urn:nir:stato:codice.penale:1930-10-19;1398",
    "cpp": "urn:nir:stato:codice.procedura.penale:1988-09-22;447"
  };
  var NO_ART_LINK = { "preleggi": 1, "cpa": 1, "tu-giustizia-tributaria": 1, "disp-att-cc": 1, "disp-att-cpc": 1, "disp-att-cpp": 1, "processo-minorile": 1 };
  function normattivaURL(codeId, num) {
    var meta = metaOf(codeId); if (!meta || !meta.urn) return "";
    var base = "https://www.normattiva.it/uri-res/N2Ls?";
    if (NO_ART_LINK[codeId] || !/^\d+(-[a-z]+)?$/.test(String(num))) return base + meta.urn;
    return base + (ART_URN[codeId] || meta.urn) + "~art" + String(num).replace(/-/g, "");
  }

  function articoloHTML(codice, art, A) {
    var commi = (art.commi || []);
    var numeric = /^\d/.test(String(art.num));
    var preNum = commi.length && /^\d+(?:-[a-z]+)?\.\s/.test(commi[0]);   // commi gia' numerati nel testo ufficiale
    var showN = commi.length > 1 && numeric && !preNum;
    var commiHtml = commi.map(function (t, i) {
      return '<div class="comma">' +
        (showN ? '<span class="comma__n">' + (i + 1) + ".</span>" : "") +
        '<p class="comma__t">' + linkify(t, codice.id, A) + "</p></div>";
    }).join("");
    var heading = numeric ? "Art. " + art.num : (art.rubrica || String(art.num));
    var fav = isFavArt(codice.id, art.num);
    var url = normattivaURL(codice.id, art.num);
    return '<article class="articolo" data-code="' + esc(codice.id) + '" data-num="' + esc(art.num) + '">' +
      '<div class="articolo__head"><h3 class="articolo__num">' + highlightQuery(heading, A) + '</h3>' +
      '<span class="res-code">' + esc(codice.abbr || "") + "</span></div>" +
      (numeric && art.rubrica ? '<p class="articolo__rubrica">' + highlightQuery(art.rubrica, A) + "</p>" : "") +
      commiHtml +
      (art.note ? '<details class="articolo__note"><summary>Note di aggiornamento</summary><div>' + esc(art.note) + "</div></details>" : "") +
      '<div class="articolo__actions">' +
      '<button class="act-btn act-btn--fav' + (fav ? " is-on" : "") + '" data-fav aria-pressed="' + fav + '" title="Preferiti">' + (fav ? "&#9733;" : "&#9734;") + " Preferito</button>" +
      '<button class="act-btn" data-copy>&#x1F4CB; Copia</button>' +
      '<button class="act-btn act-btn--wa" data-wa>&#x1F4AC; WhatsApp</button>' +
      (url ? '<a class="act-btn" href="' + esc(url) + '" target="_blank" rel="noopener" title="Testo ufficiale su Normattiva">&#x1F517; Normattiva</a>' : "") +
      "</div></article>";
  }

  function plainArticolo(codice, art) {
    var numeric = /^\d/.test(String(art.num));
    var head = (numeric ? "Art. " + art.num : art.rubrica || String(art.num)) +
      (codice.abbr ? " " + codice.abbr : "") + (numeric && art.rubrica ? " — " + art.rubrica : "");
    var commi = (art.commi || []);
    var preNum = commi.length && /^\d+(?:-[a-z]+)?\.\s/.test(commi[0]);
    var body = (commi.length > 1 && numeric && !preNum)
      ? commi.map(function (t, i) { return (i + 1) + ". " + t; }).join("\n")
      : commi.join("\n");
    return head + "\n" + body;
  }

  // Azioni sugli articoli (delegate: valgono per liste, ricerca globale, preferiti, anteprime)
  document.addEventListener("click", function (e) {
    var x = e.target.closest(".xref");
    if (x) { e.preventDefault(); openXref(x.getAttribute("data-xcode"), x.getAttribute("data-xnum")); return; }
    var btn = e.target.closest("[data-copy],[data-wa],[data-fav]");
    if (!btn) return;
    var el = btn.closest(".articolo"); if (!el) return;
    var code = el.getAttribute("data-code"), num = el.getAttribute("data-num");
    var f = findArt(code, num); if (!f) return;
    if (btn.hasAttribute("data-copy")) copyText(plainArticolo(f.c, f.a), "Articolo copiato negli appunti");
    else if (btn.hasAttribute("data-wa")) shareArticoloImage(f.c, f.a);
    else {
      var on = toggleFavArt(code, num);
      btn.classList.toggle("is-on", on); btn.setAttribute("aria-pressed", on);
      btn.innerHTML = (on ? "&#9733;" : "&#9734;") + " Preferito";
      toast(on ? "Aggiunto ai preferiti" : "Rimosso dai preferiti");
    }
  });

  // Anteprima dell'articolo richiamato
  function openXref(codeId, num) {
    var box = $("#xref-body"), mod = $("#xref-modal");
    if (!box || !mod) return;
    box.innerHTML = '<p class="empty">Caricamento…</p>';
    mod.hidden = false;
    loadCodice(codeId, function (c) {
      var f = c && findArt(codeId, num);
      if (!f) { box.innerHTML = '<p class="empty">Articolo ' + esc(num) + " non trovato in " + esc((metaOf(codeId) || {}).nome || codeId) + ".</p>"; return; }
      box.innerHTML = articoloHTML(f.c, f.a, null);
      $("#xref-open").onclick = function () { mod.hidden = true; openCodice(codeId, num); };
    });
  }

  /* ===== Condivisione articolo come IMMAGINE strutturata (WhatsApp ecc.) ===== */
  function _wrapLines(ctx, text, maxW) {
    var out = [];
    String(text == null ? "" : text).split("\n").forEach(function (para) {
      var words = para.split(/\s+/).filter(Boolean);
      if (!words.length) { out.push(""); return; }
      var line = "";
      for (var i = 0; i < words.length; i++) {
        var test = line ? line + " " + words[i] : words[i];
        if (ctx.measureText(test).width > maxW && line) { out.push(line); line = words[i]; }
        else line = test;
      }
      if (line) out.push(line);
    });
    return out;
  }
  function _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function articoloImageCanvas(codice, art) {
    var W = 560, PAD = 34;
    var dpr = Math.min(3, Math.max(2, window.devicePixelRatio || 2));
    var numeric = /^\d/.test(String(art.num));
    var heading = numeric ? "Articolo " + art.num : (art.rubrica || String(art.num));
    var rubrica = numeric ? (art.rubrica || "") : "";
    var abbr = (codice.abbr || "").toUpperCase();
    var codiceNome = codice.nome || "";
    var commi = (art.commi || []);
    var preNum = commi.length && /^\d+(?:-[a-z]+)?\.\s/.test(commi[0]);
    var showN = commi.length > 1 && numeric && !preNum;

    var HEADER_H = 118;
    var textX = PAD + 16, textR = W - PAD, textW = textR - textX, numGutter = 30;
    var F_head = "700 30px Georgia,'Times New Roman',serif";
    var F_rub = "italic 17px Georgia,serif";
    var F_body = "16px Georgia,serif";
    var F_num = "700 16px Georgia,serif";

    var m = document.createElement("canvas").getContext("2d");
    var ops = [], y = HEADER_H + 40;
    m.font = F_head;
    _wrapLines(m, heading, textW).forEach(function (l) { ops.push({ t: l, x: textX, y: y, f: F_head, c: "#6b1f2a" }); y += 40; });
    if (rubrica) { y += 2; m.font = F_rub; _wrapLines(m, rubrica, textW).forEach(function (l) { ops.push({ t: l, x: textX, y: y, f: F_rub, c: "#4a5666" }); y += 24; }); }
    y += 16;
    m.font = F_body;
    commi.forEach(function (t, i) {
      var maxW = showN ? (textW - numGutter) : textW;
      var lines = _wrapLines(m, t, maxW), firstY = y;
      lines.forEach(function (l) { ops.push({ t: l, x: showN ? textX + numGutter : textX, y: y, f: F_body, c: "#1c2530" }); y += 24; });
      if (showN) ops.push({ t: (i + 1) + ".", x: textX, y: firstY, f: F_num, c: "#b58b3e" });
      y += 12;
    });
    var contentBottom = y, footerTop = contentBottom + 10, H = footerTop + 62;

    var canvas = document.createElement("canvas");
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    var ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";

    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#f7f4ee"); bg.addColorStop(1, "#efe9dd");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#dcd4c4"; ctx.lineWidth = 1; ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

    var hg = ctx.createLinearGradient(0, 0, 0, HEADER_H);
    hg.addColorStop(0, "#163756"); hg.addColorStop(1, "#0f2740");
    ctx.fillStyle = hg; ctx.fillRect(0, 0, W, HEADER_H);
    ctx.fillStyle = "#c8a15a"; ctx.fillRect(0, HEADER_H - 3, W, 3);

    ctx.fillStyle = "#c8a15a";
    ctx.font = "38px Georgia,serif"; ctx.fillText("⚖", PAD, 60);
    ctx.font = "700 30px Georgia,serif"; ctx.fillText("IN IURE", PAD + 52, 54);
    ctx.fillStyle = "rgba(255,255,255,.72)";
    ctx.font = "600 11px -apple-system,Segoe UI,Arial,sans-serif"; ctx.fillText("DIRITTO A PORTATA DI MANO", PAD + 54, 73);
    ctx.fillStyle = "rgba(255,255,255,.9)";
    ctx.font = "italic 14px Georgia,serif";
    _wrapLines(ctx, codiceNome, W - PAD * 2).slice(0, 1).forEach(function (l) { ctx.fillText(l, PAD, 101); });

    if (abbr) {
      ctx.font = "700 14px -apple-system,Segoe UI,Arial,sans-serif";
      var pw = ctx.measureText(abbr).width + 26, px = W - PAD - pw, py = 26, ph = 28;
      _roundRect(ctx, px, py, pw, ph, 14); ctx.fillStyle = "#6b1f2a"; ctx.fill();
      ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.fillText(abbr, px + pw / 2, py + 19); ctx.textAlign = "left";
    }

    ctx.fillStyle = "#c8a15a";
    ctx.fillRect(PAD, HEADER_H + 24, 4, Math.max(4, contentBottom - (HEADER_H + 24) - 6));

    ops.forEach(function (o) { ctx.font = o.f; ctx.fillStyle = o.c; ctx.fillText(o.t, o.x, o.y); });

    ctx.strokeStyle = "#dcd4c4"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PAD, footerTop); ctx.lineTo(W - PAD, footerTop); ctx.stroke();
    ctx.fillStyle = "#8a8172"; ctx.font = "12px -apple-system,Segoe UI,Arial,sans-serif";
    ctx.fillText("Testo a fini di studio: non sostituisce le fonti ufficiali.", PAD, footerTop + 22);
    ctx.fillStyle = "#b58b3e"; ctx.font = "700 12px -apple-system,Segoe UI,Arial,sans-serif";
    ctx.fillText("⚖ In Iure - Diritto a portata di mano", PAD, footerTop + 42);
    return canvas;
  }

  var _shareData = null;
  function shareArticoloImage(codice, art) {
    var canvas;
    try { canvas = articoloImageCanvas(codice, art); }
    catch (e) {
      window.open("https://wa.me/?text=" + encodeURIComponent(plainArticolo(codice, art) + "\n\n- via In Iure"), "_blank");
      return;
    }
    var numeric = /^\d/.test(String(art.num));
    var fname = safeName((numeric ? "Art " + art.num : String(art.num)) + " " + (codice.abbr || "InIure")) + ".png";
    var caption = plainArticolo(codice, art) + "\n\n- via In Iure";
    var done = false;
    function fallback(blob) { openShareModal(canvas, blob, caption, fname); }
    if (!canvas.toBlob) { fallback(null); return; }
    canvas.toBlob(function (blob) {
      if (done) return; done = true;
      if (!blob) { fallback(null); return; }
      if (window.InIureNative && InIureNative.saveAndShare) {
        InIureNative.saveAndShare(blob, fname, "In Iure", caption).catch(function () { fallback(blob); });
        return;
      }
      var file = null;
      try { file = new File([blob], fname, { type: "image/png" }); } catch (e) {}
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: "In Iure" }).catch(function () { fallback(blob); });
      } else { fallback(blob); }
    }, "image/png");
  }

  function openShareModal(canvas, blob, caption, fname) {
    var wrap = $("#share-image-wrap");
    if (wrap) {
      wrap.innerHTML = "";
      var img = new Image();
      try { img.src = canvas.toDataURL("image/png"); } catch (e) {}
      img.alt = "Anteprima articolo"; img.className = "share-image";
      wrap.appendChild(img);
    }
    _shareData = { canvas: canvas, blob: blob, caption: caption, fname: fname };
    var mod = $("#share-modal"); if (mod) mod.hidden = false;
  }

  /* ----- Elenchi lunghi: rendering progressivo (il Codice civile ha oltre 3.000 articoli) ----- */
  var PAGE = 50;
  function renderProgressive(container, items, htmlFn) {
    var i = 0;
    container.innerHTML = "";
    if (container._io) { container._io.disconnect(); container._io = null; }
    function more() {
      var old = $(".load-more", container); if (old) old.parentNode.removeChild(old);
      container.insertAdjacentHTML("beforeend", items.slice(i, i + PAGE).map(htmlFn).join(""));
      i += PAGE;
      if (i < items.length) {
        container.insertAdjacentHTML("beforeend", '<button class="btn load-more">Mostra altri ' +
          Math.min(PAGE, items.length - i) + " (" + (items.length - i) + " rimanenti)</button>");
        var b = $(".load-more", container);
        b.addEventListener("click", more);
        if ("IntersectionObserver" in window) {
          container._io = new IntersectionObserver(function (en) {
            if (en[0] && en[0].isIntersecting) { container._io.disconnect(); container._io = null; more(); }
          }, { rootMargin: "600px" });
          container._io.observe(b);
        }
      }
    }
    more();
  }

  function renderArticoli(codice, q) {
    var list = $("#articoli-list");
    var A = analyzeQuery(q);
    var tot = (codice.articoli || []).length;
    var arts = A ? rankArticles(codice.articoli || [], A) : (codice.articoli || []);
    $("#codice-count").textContent = A ? (arts.length + " risultati su " + tot + " articoli") : (tot + " articoli");
    if (!arts.length) { list.innerHTML = '<p class="empty">Nessun articolo trovato per «' + esc(q) + '».</p>'; return; }
    renderProgressive(list, arts, function (a) { return articoloHTML(codice, a, A); });
  }

  var codiceSearchTimer;
  $("#codice-search").addEventListener("input", function () {
    clearTimeout(codiceSearchTimer);
    var q = this.value.trim();
    codiceSearchTimer = setTimeout(function () {
      if (currentCodice) {
        renderArticoli(currentCodice, q);
        try { history.replaceState(null, "", "#/codice/" + currentCodice.id + (q ? "?q=" + encodeURIComponent(q) : "")); } catch (e) { }
      }
    }, 120);
  });

  // Ricerca globale su tutti i codici
  var globalTimer;
  $("#global-search-input").addEventListener("input", function () {
    clearTimeout(globalTimer);
    var q = this.value.trim();
    globalTimer = setTimeout(function () { renderGlobalSearch(q); }, 160);
  });
  function renderGlobalSearch(q) {
    var wrap = $("#codici-categorie");
    if (!q) { renderCodiciHome(); return; }
    var A = analyzeQuery(q);
    if (!A) {
      // solo il nome di un codice: mostra quel codice
      var cr = parseCodeRef(norm(q));
      if (cr.id) { wrap.innerHTML = '<div class="card-grid">' + codiceCardHTML(metaOf(cr.id)) + "</div>"; return; }
      renderCodiciHome(); return;
    }
    wrap.innerHTML = '<p class="empty">Ricerca in corso…</p>';
    // se è indicato un codice specifico, carica e cerca solo quello
    var loader = A.codeId ? function (cb) { loadCodice(A.codeId, function () { cb(); }); } : loadAllCodici;
    loader(function () {
      if ($("#global-search-input").value.trim() !== q) return;
      var results = [];
      CODICI_INDEX.forEach(function (m) {
        if (A.codeId && m.id !== A.codeId) return;   // filtro per codice
        var c = codiciCache[m.id]; if (!c) return;
        (c.articoli || []).forEach(function (a) {
          var sc = scoreArticle(a, A);
          if (sc > 0) results.push({ c: c, a: a, s: sc, n: artSortNum(a.num) });
        });
      });
      // codici il cui nome corrisponde alla ricerca (es. "privacy", "consumo")
      var nomi = A.type === "kw" ? CODICI_INDEX.filter(function (m) {
        var hay = norm(m.nome + " " + (m.abbr || "") + " " + (m.descrizione || ""));
        return A.words.every(function (w) { return hay.indexOf(w) !== -1; });
      }) : [];
      if (!results.length && !nomi.length) { wrap.innerHTML = '<p class="empty">Nessun risultato per «' + esc(q) + '».</p>'; return; }
      results.sort(function (x, y) { return (y.s - x.s) || (x.n - y.n); });
      var total = results.length;
      results = results.slice(0, 300);
      var codeName = A.codeId ? ((metaOf(A.codeId) || {}).abbr || "") : "";
      var html = "";
      if (nomi.length) html += '<div class="cat-block"><h2 class="cat-title">Codici e leggi</h2><div class="card-grid">' + nomi.map(codiceCardHTML).join("") + "</div></div>";
      var label = total + ' articoli trovati' + (codeName ? ' in ' + esc(codeName) : "") + (total > results.length ? ' (i primi ' + results.length + ')' : '');
      html += '<div class="cat-block"><h2 class="cat-title">' + label + '</h2><div class="articoli-list" id="global-results"></div></div>';
      wrap.innerHTML = html;
      renderProgressive($("#global-results"), results, function (r) { return articoloHTML(r.c, r.a, A); });
    });
  }

  function copyText(text, okMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast(okMsg || "Copiato"); },
        function () { fallbackCopy(text, okMsg); });
    } else { fallbackCopy(text, okMsg); }
  }
  function fallbackCopy(text, okMsg) {
    var ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); toast(okMsg || "Copiato"); }
    catch (e) { toast("Copia non riuscita"); }
    document.body.removeChild(ta);
  }

  /* ============================================================
     SEZIONE 2 — LEARNING QUIZ
     ============================================================ */
  function qKey(d) { return norm(d.q).replace(/[^a-z0-9]/g, "").slice(0, 120); }
  function quizStats(id) { return store.get("quiz_stats_" + id, { sessioni: 0, migliore: null, ultimo: null }); }
  function quizWrong(id) { return store.get("quiz_errori_" + id, []); }

  function renderQuizHome() {
    var wrap = $("#quiz-materie");
    if (!QUIZ.length) { wrap.innerHTML = '<p class="empty">Nessuna materia caricata.</p>'; return; }
    wrap.innerHTML = QUIZ.map(function (m) {
      var st = quizStats(m.id), err = quizWrong(m.id).length;
      return '<button class="card card--quiz" data-materia="' + esc(m.id) + '">' +
        '<span class="card__emblem" aria-hidden="true">&#9998;</span>' +
        '<span class="card__abbr">Quiz</span>' +
        '<h3 class="card__title">' + esc(m.materia) + "</h3>" +
        (st.sessioni ? '<p class="card__date">Il tuo record: ' + st.migliore + "% · ultimo " + st.ultimo + "%</p>" : "") +
        (err ? '<p class="card__date card__date--warn">' + err + " da ripassare</p>" : "") +
        "</button>";
    }).join("");
    $$("#quiz-materie .card").forEach(function (card) {
      card.addEventListener("click", function () { openQuizSetup(card.getAttribute("data-materia")); });
    });
  }

  var quizState = null;
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }
  // mescola anche l'ordine delle risposte, aggiornando l'indice della corretta
  function shuffleOptions(d) {
    var idx = d.opzioni.map(function (_, i) { return i; });
    idx = shuffle(idx);
    return {
      q: d.q,
      opzioni: idx.map(function (i) { return d.opzioni[i]; }),
      corretta: idx.indexOf(d.corretta),
      spiegazione: d.spiegazione,
      norma: d.norma || "",
      key: qKey(d)
    };
  }
  var QUIZ_SESSION = 15; // domande per sessione (predefinito)

  // Scelta della sessione: numero di domande e modalita'
  var setupMateria = null;
  function openQuizSetup(id) {
    var m = QUIZ.filter(function (x) { return x.id === id; })[0];
    var box = $("#quiz-setup");
    if (!m) return;
    if (!box) { startQuiz(id); return; }
    setupMateria = m;
    var err = quizWrong(id).length;
    $("#quiz-setup-title").textContent = m.materia;
    var last = store.get("quiz_len", QUIZ_SESSION);
    $$("#quiz-setup [data-len]").forEach(function (b) { b.classList.toggle("is-active", String(b.getAttribute("data-len")) === String(last)); });
    var rip = $("#quiz-setup-errori");
    rip.hidden = !err;
    rip.textContent = "Ripassa le " + err + " domande sbagliate";
    box.hidden = false;
  }
  function closeQuizSetup() { var b = $("#quiz-setup"); if (b) b.hidden = true; }

  function startQuiz(id, opts) {
    opts = opts || {};
    var m = QUIZ.filter(function (x) { return x.id === id; })[0];
    if (!m) return;
    var pool = m.domande;
    if (opts.soloErrori) {
      var wrong = quizWrong(id);
      pool = m.domande.filter(function (d) { return wrong.indexOf(qKey(d)) !== -1; });
      if (!pool.length) { toast("Nessuna domanda da ripassare"); return; }
    }
    var n = opts.len === "all" ? pool.length : Math.min(opts.len || QUIZ_SESSION, pool.length);
    var domande = shuffle(pool).slice(0, n).map(shuffleOptions);
    quizState = { materia: m, domande: domande, i: 0, score: 0, answered: false, errori: [], soloErrori: !!opts.soloErrori, opts: opts };
    $("#quiz-materia-title").textContent = m.materia + (opts.soloErrori ? " — ripasso errori" : "");
    showSection("quiz");
    showView($("#section-quiz"), "quiz-play");
    pushRoute("#/quiz/" + id);
    renderQuestion();
  }
  function renderQuestion() {
    var s = quizState, d = s.domande[s.i];
    s.answered = false;
    $("#quiz-counter").textContent = "Domanda " + (s.i + 1) + " di " + s.domande.length;
    $("#quiz-score").textContent = "Punteggio: " + s.score;
    $("#quiz-progress-bar").style.width = (s.i / s.domande.length * 100) + "%";
    $("#quiz-question").textContent = d.q;
    $("#quiz-explain").hidden = true;
    $("#quiz-next").hidden = true;
    var letters = ["A", "B", "C", "D", "E", "F"];
    $("#quiz-options").innerHTML = d.opzioni.map(function (o, idx) {
      return '<button class="quiz-opt" data-idx="' + idx + '">' +
        '<span class="quiz-opt__letter">' + letters[idx] + "</span>" +
        '<span class="quiz-opt__text">' + esc(o) + "</span></button>";
    }).join("");
    $$("#quiz-options .quiz-opt").forEach(function (btn) {
      btn.addEventListener("click", function () { answerQuestion(parseInt(btn.getAttribute("data-idx"), 10)); });
    });
  }
  function answerQuestion(idx) {
    var s = quizState, d = s.domande[s.i];
    if (s.answered) return;
    s.answered = true;
    var correct = d.corretta;
    var wrong = quizWrong(s.materia.id);
    if (idx === correct) {
      s.score++;
      if (wrong.indexOf(d.key) !== -1) { wrong.splice(wrong.indexOf(d.key), 1); store.set("quiz_errori_" + s.materia.id, wrong); }
    } else {
      s.errori.push({ d: d, data: idx });
      if (wrong.indexOf(d.key) === -1) { wrong.push(d.key); store.set("quiz_errori_" + s.materia.id, wrong); }
    }
    $$("#quiz-options .quiz-opt").forEach(function (btn) {
      var bi = parseInt(btn.getAttribute("data-idx"), 10);
      btn.disabled = true;
      if (bi === correct) btn.classList.add("correct");
      else if (bi === idx) btn.classList.add("wrong");
    });
    $("#quiz-score").textContent = "Punteggio: " + s.score;
    var ex = $("#quiz-explain");
    ex.innerHTML = "<strong>" + (idx === correct ? "&#x2713; Corretto. " : "&#x2717; Risposta errata. ") + "</strong>" +
      esc(d.spiegazione || "") + (d.norma ? ' <span class="quiz-norma">(' + esc(d.norma) + ")</span>" : "");
    ex.hidden = false;
    $("#quiz-next").hidden = false;
    $("#quiz-next").textContent = (s.i + 1 >= s.domande.length) ? "Vedi risultato →" : "Prossima domanda →";
    $("#quiz-next").focus({ preventScroll: true });
  }
  $("#quiz-next").addEventListener("click", function () {
    var s = quizState;
    s.i++;
    if (s.i >= s.domande.length) { showResult(); }
    else { renderQuestion(); window.scrollTo(0, 0); }
  });
  // Tastiera (computer): A-D / 1-4 per rispondere, Invio per proseguire
  document.addEventListener("keydown", function (e) {
    if (!quizState || $("#quiz-play").hidden || !$("#section-quiz").classList.contains("is-active")) return;
    if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
    var k = e.key.toLowerCase(), map = { a: 0, b: 1, c: 2, d: 3, "1": 0, "2": 1, "3": 2, "4": 3 };
    if (!quizState.answered && k in map && map[k] < quizState.domande[quizState.i].opzioni.length) { answerQuestion(map[k]); e.preventDefault(); }
    else if (quizState.answered && (k === "enter" || k === "arrowright")) { $("#quiz-next").click(); e.preventDefault(); }
  });
  function showResult() {
    var s = quizState;
    var pct = Math.round(s.score / s.domande.length * 100);
    $("#quiz-final-score").textContent = s.score + " / " + s.domande.length;
    var msg = pct >= 80 ? "Ottimo risultato! Padronanza solida della materia."
      : pct >= 60 ? "Buon lavoro. Rivedi gli argomenti sbagliati e riprova."
        : "C'è margine di miglioramento: ripassa e ritenta.";
    $("#quiz-final-msg").textContent = "Hai risposto correttamente al " + pct + "% delle domande. " + msg;
    if (!s.soloErrori) {
      var st = quizStats(s.materia.id);
      st.sessioni++; st.ultimo = pct; st.migliore = Math.max(st.migliore || 0, pct);
      store.set("quiz_stats_" + s.materia.id, st);
    }
    var rev = $("#quiz-review");
    if (rev) {
      rev.innerHTML = s.errori.length ? "<h3>Da ripassare</h3>" + s.errori.map(function (e) {
        return '<div class="review-item"><p class="review-q">' + esc(e.d.q) + "</p>" +
          '<p class="review-a review-a--no">La tua risposta: ' + esc(e.d.opzioni[e.data]) + "</p>" +
          '<p class="review-a review-a--ok">Risposta corretta: ' + esc(e.d.opzioni[e.d.corretta]) + "</p>" +
          '<p class="review-x">' + esc(e.d.spiegazione || "") + (e.d.norma ? " (" + esc(e.d.norma) + ")" : "") + "</p></div>";
      }).join("") : "";
    }
    var re = $("#quiz-retry-errors");
    if (re) re.hidden = !quizWrong(s.materia.id).length;
    $("#quiz-progress-bar").style.width = "100%";
    showView($("#section-quiz"), "quiz-result");
  }
  $("#quiz-restart").addEventListener("click", function () {
    if (quizState) startQuiz(quizState.materia.id, { len: quizState.opts.len });
  });

  /* ============================================================
     SEZIONE 3 — SCRITTURA ATTI
     ============================================================ */
  // Macro-materie e sotto-categorie degli atti
  var ATTI_MACRO_ORDER = ["Diritto civile", "Diritto penale", "Diritto del lavoro", "Diritto amministrativo", "Procure e nomine", "Altri atti"];
  function attoMacro(cat) {
    var c = norm(cat || "");
    if (c.indexOf("lavoro") !== -1) return "Diritto del lavoro";
    if (c.indexOf("penale") !== -1) return "Diritto penale";
    if (c.indexOf("amministrativ") !== -1) return "Diritto amministrativo";
    if (c.indexOf("procur") !== -1 || c.indexOf("nomine") !== -1) return "Procure e nomine";
    if (c.indexOf("civile") !== -1) return "Diritto civile";
    return "Altri atti";
  }
  function attoSub(cat) {
    cat = String(cat || "Altro");
    var i = cat.indexOf(" - ");
    return i !== -1 ? cat.slice(i + 3) : cat;
  }
  function attoHaystack(a) {
    if (a.__hay) return a.__hay;
    a.__hay = norm([a.nome, a.categoria, a.descrizione, (a.tags || []).join(" "), a.guida].join("  "));
    return a.__hay;
  }
  function attoMatches(a, words) {
    if (!words.length) return true;
    var hay = attoHaystack(a);
    return words.every(function (w) { return hay.indexOf(w) !== -1; });
  }
  function attoScore(a, words) {
    if (!words.length) return 0;
    var name = norm(a.nome), tags = norm((a.tags || []).join(" ")), desc = norm(a.descrizione || ""), cat = norm(a.categoria || "");
    var s = 0;
    words.forEach(function (w) {
      if (name.indexOf(w) !== -1) s += 100;
      if (tags.indexOf(w) !== -1) s += 60;
      if (cat.indexOf(w) !== -1) s += 20;
      if (desc.indexOf(w) !== -1) s += 15;
    });
    if (name.indexOf(words.join(" ")) !== -1) s += 200;
    return s;
  }
  function favAtti() { return store.get("fav_atti", []); }
  function hasDraft(id) { var d = store.get("bozza_" + id, null); return !!(d && Object.keys(d).some(function (k) { return d[k]; })); }
  function attoCardHTML(a) {
    var fav = favAtti().indexOf(a.id) !== -1;
    return '<button class="card" data-atto="' + esc(a.id) + '">' +
      '<span class="card__abbr">' + esc(attoSub(a.categoria) || "Atto") + "</span>" +
      '<h3 class="card__title">' + (fav ? '<span class="card__star" title="Preferito">&#9733;</span> ' : "") + esc(a.nome) + "</h3>" +
      (a.descrizione ? '<p class="card__desc">' + esc(a.descrizione) + "</p>" : "") +
      (hasDraft(a.id) ? '<p class="card__date">Bozza salvata</p>' : "") +
      "</button>";
  }

  var attiMacroFilter = null;
  function renderMaterieChips(words) {
    var cont = $("#atti-materie"); if (!cont) return 0;
    var counts = {}, total = 0, favs = favAtti(), nfav = 0;
    ATTI.forEach(function (a) {
      if (!attoMatches(a, words)) return;
      total++; var m = attoMacro(a.categoria); counts[m] = (counts[m] || 0) + 1;
      if (favs.indexOf(a.id) !== -1) nfav++;
    });
    if (attiMacroFilter === "__fav" && !nfav) attiMacroFilter = null;
    if (attiMacroFilter && attiMacroFilter !== "__fav" && !counts[attiMacroFilter]) attiMacroFilter = null;
    var macros = ATTI_MACRO_ORDER.filter(function (m) { return counts[m]; });
    Object.keys(counts).forEach(function (m) { if (macros.indexOf(m) === -1) macros.push(m); });
    var html = '<button class="chip' + (!attiMacroFilter ? " is-active" : "") + '" data-macro="">Tutte <span>' + total + "</span></button>";
    if (nfav) html += '<button class="chip' + (attiMacroFilter === "__fav" ? " is-active" : "") + '" data-macro="__fav">&#9733; Preferiti <span>' + nfav + "</span></button>";
    macros.forEach(function (m) {
      html += '<button class="chip' + (attiMacroFilter === m ? " is-active" : "") + '" data-macro="' + esc(m) + '">' + esc(m) + " <span>" + counts[m] + "</span></button>";
    });
    cont.innerHTML = macros.length ? html : "";
    $$(".chip", cont).forEach(function (ch) {
      ch.addEventListener("click", function () {
        attiMacroFilter = ch.getAttribute("data-macro") || null;
        renderAttiHome($("#atti-search").value.trim());
      });
    });
    return total;
  }

  function renderAttiHome(filter) {
    var wrap = $("#atti-list");
    if (!ATTI.length) { wrap.innerHTML = '<p class="empty">Nessun atto caricato.</p>'; return; }
    var words = norm(filter || "").split(/\s+/).filter(Boolean);
    renderMaterieChips(words);   // puo' azzerare attiMacroFilter se privo di risultati
    var favs = favAtti();
    var byMacro = {};
    ATTI.forEach(function (a) {
      if (!attoMatches(a, words)) return;
      var mac = attoMacro(a.categoria);
      if (attiMacroFilter === "__fav") { if (favs.indexOf(a.id) === -1) return; }
      else if (attiMacroFilter && mac !== attiMacroFilter) return;
      var sub = attoSub(a.categoria);
      (byMacro[mac] = byMacro[mac] || {});
      (byMacro[mac][sub] = byMacro[mac][sub] || []).push(a);
    });
    var macros = ATTI_MACRO_ORDER.filter(function (m) { return byMacro[m]; });
    Object.keys(byMacro).forEach(function (m) { if (macros.indexOf(m) === -1) macros.push(m); });
    if (!macros.length) {
      wrap.innerHTML = '<p class="empty">Nessun atto trovato. Prova con un altro termine (es. «licenziamento», «444», «sfratto», «usucapione»).</p>';
      return;
    }
    var html = "";
    macros.forEach(function (mac) {
      var subs = Object.keys(byMacro[mac]).sort(function (a, b) { return a.localeCompare(b, "it"); });
      var totMac = subs.reduce(function (s, k) { return s + byMacro[mac][k].length; }, 0);
      html += '<section class="materia-block"><h2 class="materia-title">' + esc(mac) +
        ' <span class="materia-count">' + totMac + "</span></h2>";
      subs.forEach(function (sub) {
        var arr = byMacro[mac][sub];
        if (words.length) arr.sort(function (a, b) { return attoScore(b, words) - attoScore(a, words) || a.nome.localeCompare(b.nome, "it"); });
        else arr.sort(function (a, b) { return a.nome.localeCompare(b.nome, "it"); });
        html += '<h3 class="sub-title">' + esc(sub) + "</h3><div class='card-grid'>";
        arr.forEach(function (a) { html += attoCardHTML(a); });
        html += "</div>";
      });
      html += "</section>";
    });
    wrap.innerHTML = html;
  }
  document.addEventListener("click", function (e) {
    var card = e.target.closest("[data-atto]");
    if (card && !e.defaultPrevented) openAtto(card.getAttribute("data-atto"));
  });
  $("#atti-search").addEventListener("input", function () { renderAttiHome(this.value.trim()); });

  var currentAtto = null;
  function openAtto(id) {
    var a = ATTI.filter(function (x) { return x.id === id; })[0];
    if (!a) { goHome("scrittura"); return; }
    currentAtto = a;
    $("#atto-title").textContent = a.nome;
    $("#atto-desc").textContent = a.descrizione || "";
    updateAttoFav();
    // guida
    $("#atto-guida").innerHTML = '<div class="guida-box">' + esc(a.guida || "Guida non disponibile.") + "</div>";
    // form
    var form = $("#atto-form");
    var bozza = store.get("bozza_" + a.id, {}) || {};
    form.innerHTML = (a.campi || []).map(function (f) {
      var val = bozza[f.id] || "";
      var input = f.type === "textarea"
        ? '<textarea id="f_' + esc(f.id) + '" data-field="' + esc(f.id) + '" placeholder="' + esc(f.placeholder || "") + '">' + esc(val) + "</textarea>"
        : '<input type="text" id="f_' + esc(f.id) + '" data-field="' + esc(f.id) + '" placeholder="' + esc(f.placeholder || "") + '" value="' + esc(val) + '">';
      return '<div class="field"><label for="f_' + esc(f.id) + '">' + esc(f.label) + "</label>" + input + "</div>";
    }).join("");
    $$("[data-field]", form).forEach(function (inp) {
      inp.addEventListener("input", function () { updatePreview(); saveDraft(); });
    });
    // reset tabs
    setAttoTab(Object.keys(bozza).length ? "compila" : "guida");
    updatePreview();
    showSection("scrittura");
    showView($("#section-scrittura"), "atto-detail");
    pushRoute("#/atto/" + encodeURIComponent(a.id));
  }
  var draftTimer;
  function saveDraft() {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(function () {
      if (!currentAtto) return;
      var vals = {}, any = false;
      $$("[data-field]", $("#atto-form")).forEach(function (el) { if (el.value) { vals[el.getAttribute("data-field")] = el.value; any = true; } });
      if (any) store.set("bozza_" + currentAtto.id, vals);
      else { store.del("bozza_" + currentAtto.id); }
    }, 300);
  }
  function updateAttoFav() {
    var b = $("#atto-fav"); if (!b || !currentAtto) return;
    var on = favAtti().indexOf(currentAtto.id) !== -1;
    b.innerHTML = (on ? "&#9733;" : "&#9734;") + " Preferito";
    b.classList.toggle("is-on", on);
  }
  var attoFavBtn = $("#atto-fav");
  if (attoFavBtn) attoFavBtn.addEventListener("click", function () {
    if (!currentAtto) return;
    var list = favAtti(), i = list.indexOf(currentAtto.id);
    if (i === -1) list.unshift(currentAtto.id); else list.splice(i, 1);
    store.set("fav_atti", list);
    updateAttoFav();
    toast(i === -1 ? "Atto aggiunto ai preferiti" : "Atto rimosso dai preferiti");
  });
  var attoClear = $("#atto-clear");
  if (attoClear) attoClear.addEventListener("click", function () {
    if (!currentAtto) return;
    if (!window.confirm("Svuotare tutti i campi di questa bozza?")) return;
    $$("[data-field]", $("#atto-form")).forEach(function (el) { el.value = ""; });
    store.del("bozza_" + currentAtto.id);
    updatePreview();
    toast("Campi svuotati");
  });

  function setAttoTab(tab) {
    $$(".atto-tab").forEach(function (t) { t.classList.toggle("is-active", t.getAttribute("data-atto-tab") === tab); });
    $("#atto-guida").hidden = (tab !== "guida");
    $("#atto-compila").hidden = (tab !== "compila");
  }
  $$(".atto-tab").forEach(function (t) {
    t.addEventListener("click", function () { setAttoTab(t.getAttribute("data-atto-tab")); });
  });

  var EMPTY = "________________";
  function attoValues() {
    var vals = {};
    (currentAtto.campi || []).forEach(function (f) {
      var el = $("#f_" + f.id);
      vals[f.id] = (el && el.value) ? el.value : null;
    });
    return vals;
  }
  function buildAttoText() {
    if (!currentAtto) return "";
    var vals = attoValues();
    var text = currentAtto.template || "";
    text = text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, function (m, k) {
      return (k in vals) ? (vals[k] == null ? EMPTY : vals[k]) : m;
    });
    return text;
  }
  function updatePreview() {
    if (!currentAtto) return;
    var vals = attoValues(), tot = 0, filled = 0;
    Object.keys(vals).forEach(function (k) { tot++; if (vals[k]) filled++; });
    // anteprima con evidenziazione dei campi ancora da compilare
    var html = esc(currentAtto.template || "").replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, function (m, k) {
      if (!(k in vals)) return m;
      return vals[k] == null ? '<mark class="todo">' + EMPTY + "</mark>" : esc(vals[k]);
    });
    $("#atto-preview").innerHTML = html;
    var pr = $("#atto-progress");
    if (pr) pr.textContent = "Campi compilati: " + filled + " su " + tot;
  }

  $("#atto-copy").addEventListener("click", function () { copyText(buildAttoText(), "Atto copiato negli appunti"); });

  // Download Word (.doc via HTML)
  $("#atto-word").addEventListener("click", function () {
    var text = buildAttoText();
    var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">' +
      '<head><meta charset="utf-8"><title>' + esc(currentAtto.nome) + '</title>' +
      '<style>body{font-family:"Times New Roman",serif;font-size:12pt;line-height:1.5;margin:2.5cm}p{margin:0 0 8pt;white-space:pre-wrap}</style></head><body>' +
      "<p>" + esc(text).replace(/\n/g, "<br>") + "</p></body></html>";
    var blob = new Blob(["﻿", html], { type: "application/msword" });
    downloadBlob(blob, safeName(currentAtto.nome) + ".doc");
    toast("File Word scaricato");
  });

  // Download PDF (finestra di stampa → Salva come PDF)
  $("#atto-pdf").addEventListener("click", function () {
    var text = buildAttoText();
    if (window.InIureNative && InIureNative.pdfFromText) {
      InIureNative.pdfFromText(text, safeName(currentAtto.nome) + ".pdf", currentAtto.nome)
        .catch(function () { toast("Impossibile creare il PDF"); });
      return;
    }
    var w = window.open("", "_blank");
    if (!w) { toast("Consenti i popup per il PDF"); return; }
    w.document.write('<html><head><meta charset="utf-8"><title>' + esc(currentAtto.nome) +
      '</title><style>@page{margin:2.5cm}body{font-family:"Times New Roman",serif;font-size:12pt;line-height:1.6;color:#111}' +
      'pre{white-space:pre-wrap;font-family:inherit;margin:0}</style></head><body><pre>' + esc(text) +
      '</pre><script>window.onload=function(){window.print();}<\/script></body></html>');
    w.document.close();
    toast("Usa «Salva come PDF» nella finestra di stampa");
  });

  function safeName(s) { return String(s || "atto").replace(/[^a-z0-9\-_ ]/gi, "").replace(/\s+/g, "_").slice(0, 60); }
  function downloadBlob(blob, filename) {
    if (window.InIureNative && InIureNative.saveAndShare) {
      InIureNative.saveAndShare(blob, filename).catch(function () { toast("Impossibile salvare il file"); });
      return;
    }
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
  }

  /* ============================================================
     SEZIONE 4 — PREFERITI, PROGRESSI E IMPOSTAZIONI
     ============================================================ */
  function renderPreferiti() {
    var wrap = $("#preferiti-body"); if (!wrap) return;
    var favArt = store.get("fav_articoli", []);
    var favA = favAtti().map(function (id) { return ATTI.filter(function (a) { return a.id === id; })[0]; }).filter(Boolean);
    var bozze = ATTI.filter(function (a) { return hasDraft(a.id) && favA.indexOf(a) === -1; });
    var html = '<div class="cat-block"><h2 class="cat-title">Articoli preferiti</h2>' +
      (favArt.length ? '<div class="articoli-list" id="fav-articoli"><p class="empty">Caricamento…</p></div>'
        : '<p class="empty">Tocca «&#9734; Preferito» sotto un articolo per ritrovarlo qui.</p>') + "</div>";
    html += '<div class="cat-block"><h2 class="cat-title">Atti preferiti e bozze</h2>' +
      ((favA.length || bozze.length) ? '<div class="card-grid">' + favA.concat(bozze).map(attoCardHTML).join("") + "</div>"
        : '<p class="empty">Nessun atto salvato. Le bozze che compili vengono conservate automaticamente su questo dispositivo.</p>') + "</div>";
    var righe = QUIZ.map(function (m) {
      var st = quizStats(m.id), err = quizWrong(m.id).length;
      if (!st.sessioni && !err) return "";
      return "<tr><td>" + esc(m.materia) + "</td><td>" + (st.sessioni || 0) + "</td><td>" + (st.migliore != null ? st.migliore + "%" : "-") +
        "</td><td>" + (st.ultimo != null ? st.ultimo + "%" : "-") + "</td><td>" + err + "</td></tr>";
    }).join("");
    html += '<div class="cat-block"><h2 class="cat-title">I tuoi progressi nei quiz</h2>' +
      (righe ? '<div class="table-wrap"><table class="stats"><thead><tr><th>Materia</th><th>Sessioni</th><th>Record</th><th>Ultimo</th><th>Da ripassare</th></tr></thead><tbody>' + righe + "</tbody></table></div>"
        : '<p class="empty">Completa un quiz per vedere qui i tuoi risultati.</p>') + "</div>";
    wrap.innerHTML = html;
    if (favArt.length) {
      var ids = {}; favArt.forEach(function (k) { ids[k.split("|")[0]] = 1; });
      var left = Object.keys(ids).length;
      Object.keys(ids).forEach(function (id) {
        loadCodice(id, function () {
          if (--left) return;
          var box = $("#fav-articoli"); if (!box) return;
          var items = favArt.map(function (k) { var p = k.split("|"); return findArt(p[0], p[1]); }).filter(Boolean);
          box.innerHTML = items.length ? items.map(function (f) { return articoloHTML(f.c, f.a, null); }).join("") : '<p class="empty">Gli articoli salvati non sono piu\' presenti.</p>';
        });
      });
    }
  }

  // Impostazioni: dimensione del testo e tema
  var FS = [0.9, 1, 1.12, 1.25, 1.4];
  function applySettings() {
    var fs = store.get("font", 1), th = store.get("tema", "auto");
    document.documentElement.style.setProperty("--fs", FS[fs] || 1);
    var dark = th === "scuro" || (th === "auto" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    $$("[data-font]").forEach(function (b) { b.classList.toggle("is-active", String(b.getAttribute("data-font")) === String(fs)); });
    $$("[data-tema]").forEach(function (b) { b.classList.toggle("is-active", b.getAttribute("data-tema") === th); });
    var meta = $('meta[name="theme-color"]'); if (meta) meta.setAttribute("content", dark ? "#0b1622" : "#0f2740");
  }
  document.addEventListener("click", function (e) {
    var f = e.target.closest("[data-font]"), t = e.target.closest("[data-tema]");
    if (f) { store.set("font", parseInt(f.getAttribute("data-font"), 10)); applySettings(); }
    if (t) { store.set("tema", t.getAttribute("data-tema")); applySettings(); }
    var r = e.target.closest("[data-reset]");
    if (r) {
      var what = r.getAttribute("data-reset");
      if (!window.confirm(what === "quiz" ? "Azzerare statistiche e domande da ripassare?" : "Eliminare tutti i preferiti e le bozze salvate su questo dispositivo?")) return;
      var rx = what === "quiz" ? /^(quiz_stats|quiz_errori)_/ : /^(fav_|bozza_|recenti_)/;
      try {
        Object.keys(localStorage).forEach(function (k) {
          if (k.indexOf("iniure_") === 0 && rx.test(k.slice(7))) localStorage.removeItem(k);
        });
      } catch (err) { }
      Object.keys(memStore).forEach(function (k) { if (rx.test(k)) delete memStore[k]; });
      renderPreferiti(); renderQuizHome(); renderAttiHome($("#atti-search").value.trim()); renderCodiciHome();
      toast("Dati eliminati");
    }
  });
  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    if (mq.addEventListener) mq.addEventListener("change", applySettings); else if (mq.addListener) mq.addListener(applySettings);
  }

  /* ============================================================
     INSTALLAZIONE PWA / iOS
     ============================================================ */
  var deferredPrompt = null;
  var banner = $("#install-banner");
  var installBtn = $("#install-btn");
  var iosGuide = $("#ios-guide");

  function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true ||
      !!(window.InIureNative && InIureNative.isNative);
  }
  function isiOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.hidden = false;
    if (!localStorage.getItem("iniure_install_dismissed") && !isStandalone()) banner.hidden = false;
  });

  function doInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function () {
        deferredPrompt = null; banner.hidden = true;
      });
    } else if (isiOS()) {
      iosGuide.hidden = false;
    } else {
      toast("Usa il menu del browser → «Installa app» / «Aggiungi a Home»");
    }
  }
  installBtn.addEventListener("click", doInstall);
  $("#install-top").addEventListener("click", doInstall);
  $("#install-close").addEventListener("click", function () {
    banner.hidden = true;
    try { localStorage.setItem("iniure_install_dismissed", "1"); } catch (e) { }
  });
  $$("[data-close-ios]").forEach(function (b) { b.addEventListener("click", function () { iosGuide.hidden = true; }); });
  iosGuide.addEventListener("click", function (e) { if (e.target === iosGuide) iosGuide.hidden = true; });

  // Modale di condivisione articolo (immagine)
  var shareModal = $("#share-modal");
  if (shareModal) {
    var closeShare = function () { shareModal.hidden = true; };
    $$("[data-close-share]").forEach(function (b) { b.addEventListener("click", closeShare); });
    shareModal.addEventListener("click", function (e) { if (e.target === shareModal) closeShare(); });
    $("#share-save").addEventListener("click", function () {
      if (!_shareData) return;
      if (_shareData.blob) { downloadBlob(_shareData.blob, _shareData.fname); toast("Immagine salvata"); return; }
      if (_shareData.canvas && _shareData.canvas.toBlob) {
        _shareData.canvas.toBlob(function (b) { if (b) { downloadBlob(b, _shareData.fname); toast("Immagine salvata"); } }, "image/png");
      }
    });
    $("#share-copy-text").addEventListener("click", function () {
      if (_shareData) copyText(_shareData.caption, "Testo copiato negli appunti");
    });
  }

  // Modali dell'app: chiusura con X, clic sullo sfondo, tasto Esc
  var APP_MODALS = ["#xref-modal", "#quiz-setup"];
  function closeAllModals() { APP_MODALS.concat(["#share-modal", "#ios-guide", "#salva-modal"]).forEach(function (s) { var m = $(s); if (m) m.hidden = true; }); }
  APP_MODALS.forEach(function (s) {
    var m = $(s); if (!m) return;
    m.addEventListener("click", function (e) { if (e.target === m || e.target.closest("[data-close-app-modal]")) m.hidden = true; });
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeAllModals(); });

  // Avvio quiz dalla finestra di scelta
  var qs = $("#quiz-setup");
  if (qs) {
    qs.addEventListener("click", function (e) {
      var l = e.target.closest("[data-len]");
      if (l && setupMateria) {
        var len = l.getAttribute("data-len"); len = len === "all" ? "all" : parseInt(len, 10);
        store.set("quiz_len", len);
        closeQuizSetup(); startQuiz(setupMateria.id, { len: len });
      }
    });
    $("#quiz-setup-errori").addEventListener("click", function () {
      if (!setupMateria) return; closeQuizSetup(); startQuiz(setupMateria.id, { soloErrori: true, len: "all" });
    });
  }
  var retryErr = $("#quiz-retry-errors");
  if (retryErr) retryErr.addEventListener("click", function () { if (quizState) startQuiz(quizState.materia.id, { soloErrori: true, len: "all" }); });

  // Torna su
  var toTop = $("#to-top");
  if (toTop) {
    window.addEventListener("scroll", function () { toTop.hidden = window.scrollY < 900; }, { passive: true });
    toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
  }

  // Mostra il banner iOS (nessun beforeinstallprompt su Safari)
  var dismissed = false;
  try { dismissed = !!localStorage.getItem("iniure_install_dismissed"); } catch (e) { }
  if (isiOS() && !isStandalone() && !dismissed) {
    $("#install-hint").textContent = "Su iPhone/iPad: tocca Condividi e «Aggiungi a Home» per usarlo come app.";
    installBtn.hidden = false;
    banner.hidden = false;
  }
  if (isStandalone()) { $("#install-top").hidden = true; }

  // Service worker (sito web): avvisa quando e' pronta una versione aggiornata
  if ("serviceWorker" in navigator && location.protocol !== "file:" && !(window.InIureNative && InIureNative.isNative)) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").then(function (reg) {
        reg.addEventListener("updatefound", function () {
          var nw = reg.installing; if (!nw) return;
          nw.addEventListener("statechange", function () {
            if (nw.state === "installed" && navigator.serviceWorker.controller) {
              var t = $("#update-banner"); if (t) t.hidden = false;
            }
          });
        });
      }).catch(function () { });
    });
    var ub = $("#update-reload");
    if (ub) ub.addEventListener("click", function () { location.reload(); });
  }

  /* ---------- Aggiornamento automatico: applicazione dei contenuti scaricati ---------- */
  function applyUpdated(d) {
    if (!d) return false;
    var changed = false;
    if (d["js/codici-index.js"]) { CODICI_INDEX = d["js/codici-index.js"]; changed = true; }
    if (d["js/data-atti.js"] || d["js/data-atti-extra.js"]) {
      ATTI = _arr(d["js/data-atti.js"] || window.ATTI).concat(_arr(d["js/data-atti-extra.js"] || window.ATTI_EXTRA)); changed = true;
    }
    if (d["js/data-quiz.js"] || d["js/data-quiz-extra.js"]) {
      QUIZ = buildQuiz(d["js/data-quiz.js"] || window.QUIZ, d["js/data-quiz-extra.js"] || window.QUIZ_EXTRA); changed = true;
    }
    return changed;
  }
  function refreshAll() {
    renderCodiciHome(); renderQuizHome(); renderAttiHome(($("#atti-search") || {}).value || "");
    if ($("#section-preferiti").classList.contains("is-active")) renderPreferiti();
  }
  // Nessun comando nell'app: l'aggiornamento e' silenzioso, all'apertura. Si pubblica dal PC (AGGIORNA_NORMATIVA.bat).
  function runUpdate() {
    Upd.check(false, function (stato, res) {
      if (stato === "nuovo") {
        res.codici.forEach(function (f) { CODICI_INDEX.concat([]).forEach(function (m) { if (m.file === f) delete codiciCache[m.id]; }); });
        applyUpdated(res.dati);
        refreshAll();
        if (currentCodice && !codiciCache[currentCodice.id] && !$("#codice-detail").hidden) openCodice(currentCodice.id, $("#codice-search").value.trim());
        toast("Normativa e contenuti aggiornati");
      }
    });
  }

  /* ---------- Init ---------- */
  applySettings();
  // sezioni Ricerca (SentenzeWeb) e Sentenze salvate: js/ricerca.js
  if (window.InIureRicerca) {
    try {
      InIureRicerca.init({ store: store, esc: esc, toast: toast, norm: norm, CODICI_INDEX: CODICI_INDEX, showSection: showSection, showView: showView,
        pushRoute: pushRoute, downloadBlob: downloadBlob, safeName: safeName, copyText: copyText });
    } catch (e) { if (window.console) console.error("Ricerca non avviata", e); }
  }
  renderCodiciHome();
  renderQuizHome();
  renderAttiHome("");
  if (location.hash && location.hash.length > 2) applyRoute(location.hash);
  else { try { history.replaceState(null, "", "#/codici"); } catch (e) { } }
  // contenuti gia' scaricati in precedenza, poi controllo di nuovi aggiornamenti (in background)
  Upd.init(function (d) {
    if (applyUpdated(d)) refreshAll();
    setTimeout(runUpdate, 1500);
  });
})();
