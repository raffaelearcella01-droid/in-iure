/* ============================================================
   In Iure — Autenticazione, blocco sezioni e abbonamenti
   ------------------------------------------------------------
   Usa Firebase (account + email di conferma/recupero) e
   l'estensione Firebase "Run Payments with Stripe" (abbonamenti).
   Il codice funziona anche se la configurazione non e' ancora
   compilata: in quel caso mostra un avviso e non blocca nulla.
   ============================================================ */
(function () {
  "use strict";

  var CFG = window.INIURE_CONFIG || {};
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Stato corrente dell'utente ---------- */
  var state = {
    configured: false,   // Firebase configurato?
    ready: false,        // primo controllo auth completato?
    user: null,          // oggetto utente Firebase (o null)
    emailVerified: false,
    isAdmin: false,      // accesso libero (non paga)
    isSubscribed: false, // abbonamento attivo
    username: ""
  };
  var subsUnsub = null;  // disiscrizione listener abbonamento

  // L'app puo' usare/allargarsi solo se: admin OPPURE (email verificata + abbonato)
  function isAllowed() {
    if (!state.configured) return true; // non configurato: non bloccare
    if (!state.user) return false;
    if (state.isAdmin) return true;
    // Modalita' gratuita: basta registrarsi e verificare l'email.
    if (CFG.richiediAbbonamento === false) return state.emailVerified;
    // Modalita' a pagamento: serve anche l'abbonamento attivo.
    return state.emailVerified && state.isSubscribed;
  }

  /* ---------- Memoria locale (tolleranza offline) ---------- */
  // Se l'utente e' gia' stato riconosciuto come "abilitato", in assenza
  // di rete non lo blocchiamo (l'app resta usabile offline).
  function rememberAllowed(v) {
    try { localStorage.setItem("iniure_allowed", v ? "1" : "0"); } catch (e) {}
  }
  function lastAllowed() {
    try { return localStorage.getItem("iniure_allowed") === "1"; } catch (e) { return false; }
  }

  /* ---------- Toast (riusa quello dell'app se presente) ---------- */
  function toast(msg) {
    if (typeof window.iniureToast === "function") { window.iniureToast(msg); return; }
    var t = $("#toast");
    if (!t) { return; }
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.hidden = true; }, 2600);
  }

  /* ============================================================
     INIZIALIZZAZIONE FIREBASE
     ============================================================ */
  var auth = null, db = null, functions = null;

  function configLooksReady() {
    var f = CFG.firebase || {};
    return f.apiKey && f.apiKey.indexOf("INSERISCI") === -1 &&
           f.projectId && f.projectId.indexOf("INSERISCI") === -1;
  }

  function initFirebase() {
    if (!window.firebase || !configLooksReady()) {
      state.configured = false;
      state.ready = true;
      updateAccountUI();
      return;
    }
    try {
      firebase.initializeApp(CFG.firebase);
      auth = firebase.auth();
      db = firebase.firestore();
      if (firebase.functions) { try { functions = firebase.functions(); } catch (e) {} }
      // Persistenza locale: l'utente resta loggato tra le sessioni e offline.
      try { db.enablePersistence({ synchronizeTabs: true }).catch(function () {}); } catch (e) {}
      state.configured = true;
      auth.onAuthStateChanged(onAuthChanged);
    } catch (e) {
      state.configured = false;
      state.ready = true;
      updateAccountUI();
    }
  }

  /* ---------- Cambio stato di autenticazione ---------- */
  function onAuthChanged(user) {
    if (subsUnsub) { subsUnsub(); subsUnsub = null; }
    state.user = user || null;
    state.emailVerified = !!(user && user.emailVerified);
    state.isAdmin = false;
    state.isSubscribed = false;
    state.username = "";

    if (!user) {
      state.ready = true;
      rememberAllowed(false);
      updateAccountUI();
      return;
    }

    // Profilo (username) + verifica admin + ascolto abbonamento, in parallelo.
    loadProfile(user).then(function () {
      state.ready = true;
      updateAccountUI();
    });
    watchSubscription(user);
  }

  function loadProfile(user) {
    var jobs = [];
    // username dal documento profilo
    jobs.push(db.collection("users").doc(user.uid).get().then(function (d) {
      if (d.exists && d.data().username) state.username = d.data().username;
    }).catch(function () {}));
    // admin da Firestore (metodo definitivo, non manomettibile dal client)
    jobs.push(db.collection("admins").doc(user.uid).get().then(function (d) {
      if (d.exists) state.isAdmin = true;
    }).catch(function () {}));
    return Promise.all(jobs).then(function () {
      // admin "di comodo" via configurazione (username/email)
      var un = (state.username || "").toLowerCase();
      var adminU = (CFG.adminUsernames || []).map(function (x) { return String(x).toLowerCase(); });
      var adminE = (CFG.adminEmails || []).map(function (x) { return String(x).toLowerCase(); });
      if (un && adminU.indexOf(un) !== -1) state.isAdmin = true;
      if (user.email && state.emailVerified && adminE.indexOf(user.email.toLowerCase()) !== -1) state.isAdmin = true;
      if (isAllowed()) rememberAllowed(true);
    });
  }

  function watchSubscription(user) {
    try {
      subsUnsub = db.collection("customers").doc(user.uid)
        .collection("subscriptions")
        .where("status", "in", ["trialing", "active"])
        .onSnapshot(function (snap) {
          state.isSubscribed = !snap.empty;
          if (isAllowed()) rememberAllowed(true);
          updateAccountUI();
        }, function () {/* offline / permessi: ignora */});
    } catch (e) {}
  }

  /* ============================================================
     REGISTRAZIONE / LOGIN / RECUPERO PASSWORD
     ============================================================ */
  function usernameToEmail(username) {
    // Cerca l'email associata a uno username (per il login con username).
    return db.collection("usernames").doc(username.toLowerCase()).get().then(function (d) {
      return (d.exists && d.data().email) ? d.data().email : null;
    });
  }

  function doRegister(username, email, password) {
    if (!state.configured) return Promise.reject(new Error("not-configured"));
    username = String(username || "").trim();
    email = String(email || "").trim();
    var uLower = username.toLowerCase();
    if (!/^[a-z0-9._-]{3,30}$/.test(uLower)) {
      return Promise.reject({ code: "app/username-invalid" });
    }
    // 1) username gia' preso?
    return db.collection("usernames").doc(uLower).get().then(function (d) {
      if (d.exists) throw { code: "app/username-taken" };
      // 2) crea l'account
      return auth.createUserWithEmailAndPassword(email, password);
    }).then(function (cred) {
      var user = cred.user;
      // 3) salva profilo + mappa username -> email + invia email di conferma
      var p1 = db.collection("users").doc(user.uid).set({
        username: username, email: email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      var p2 = db.collection("usernames").doc(uLower).set({ uid: user.uid, email: email });
      var p3 = user.updateProfile({ displayName: username }).catch(function () {});
      var p4 = user.sendEmailVerification();
      return Promise.all([p1, p2, p3, p4]);
    });
  }

  function doLogin(identifier, password) {
    if (!state.configured) return Promise.reject(new Error("not-configured"));
    identifier = String(identifier || "").trim();
    var getEmail = identifier.indexOf("@") !== -1
      ? Promise.resolve(identifier)
      : usernameToEmail(identifier);
    return getEmail.then(function (email) {
      if (!email) throw { code: "auth/user-not-found" };
      return auth.signInWithEmailAndPassword(email, password);
    });
  }

  function doReset(identifier) {
    if (!state.configured) return Promise.reject(new Error("not-configured"));
    identifier = String(identifier || "").trim();
    var getEmail = identifier.indexOf("@") !== -1
      ? Promise.resolve(identifier)
      : usernameToEmail(identifier);
    return getEmail.then(function (email) {
      if (!email) throw { code: "auth/user-not-found" };
      return auth.sendPasswordResetEmail(email);
    });
  }

  function doLogout() {
    if (auth) auth.signOut();
    closeAllModals();
  }

  function resendVerification() {
    if (state.user) {
      state.user.sendEmailVerification()
        .then(function () { toast("Email di conferma inviata di nuovo."); })
        .catch(function () { toast("Riprova tra qualche minuto."); });
    }
  }

  // Ricontrolla se l'email e' stata verificata (dopo che l'utente clicca il link).
  function refreshVerification() {
    if (!state.user) return;
    state.user.reload().then(function () {
      state.emailVerified = !!state.user.emailVerified;
      if (state.emailVerified) {
        toast("Email verificata!");
        closeAllModals();
        if (isAllowed()) rememberAllowed(true);
        updateAccountUI();
      } else {
        toast("Non risulta ancora verificata. Controlla la mail.");
      }
    });
  }

  /* ============================================================
     ABBONAMENTO (Stripe via estensione Firebase)
     ============================================================ */
  function startCheckout(priceId) {
    if (!state.configured || !state.user) { openAuth("login"); return; }
    if (!priceId || priceId.indexOf("INSERISCI") !== -1) {
      toast("Prezzi non ancora configurati (vedi SETUP_ABBONAMENTI.md).");
      return;
    }
    toast("Apertura del pagamento sicuro…");
    var back = window.location.origin + window.location.pathname;
    db.collection("customers").doc(state.user.uid)
      .collection("checkout_sessions").add({
        price: priceId,
        mode: "subscription",
        success_url: back,
        cancel_url: back,
        allow_promotion_codes: true
      }).then(function (docRef) {
        docRef.onSnapshot(function (snap) {
          var data = snap.data() || {};
          if (data.error) { toast("Errore pagamento: " + data.error.message); }
          if (data.url) { window.location.assign(data.url); }
        });
      }).catch(function (e) {
        toast("Impossibile avviare il pagamento.");
      });
  }

  function openBillingPortal() {
    if (!functions || !state.user) { toast("Gestione non disponibile."); return; }
    toast("Apertura area abbonamento…");
    var fn = functions.httpsCallable("ext-firestore-stripe-payments-createPortalLink");
    fn({ returnUrl: window.location.origin + window.location.pathname })
      .then(function (res) {
        if (res.data && res.data.url) window.location.assign(res.data.url);
      })
      .catch(function () { toast("Area abbonamento non disponibile."); });
  }

  /* ============================================================
     BLOCCO DELLE SEZIONI (il "cancello")
     ------------------------------------------------------------
     Intercetta in fase di cattura i click/focus sugli elementi
     che "usano" una sezione. Se l'utente non e' abilitato,
     ferma l'azione e apre il pop-up giusto.
     ============================================================ */
  var GATE_CLICK = ".tab, [data-codice], [data-materia], [data-atto]";
  var GATE_FOCUS = 'input[type="search"]';

  function gate(e, useCapture) {
    // Se non configurato o gia' abilitato: lascia passare.
    if (isAllowed()) return true;
    // Tolleranza offline: se eravamo abilitati e ora siamo offline, passa.
    if (!navigator.onLine && lastAllowed()) return true;
    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    promptAccess();
    return false;
  }

  function promptAccess() {
    if (!state.user) { openAuth("login"); return; }
    if (!state.emailVerified) { openVerify(); return; }
    openPaywall(); // loggato e verificato ma senza abbonamento
  }

  function installGate() {
    document.addEventListener("click", function (e) {
      var t = e.target.closest(GATE_CLICK);
      if (!t) return;
      gate(e, true);
    }, true); // fase di cattura: prima dei gestori dell'app
    document.addEventListener("focusin", function (e) {
      if (!e.target.matches || !e.target.matches(GATE_FOCUS)) return;
      if (isAllowed()) return;
      if (!navigator.onLine && lastAllowed()) return;
      e.target.blur();
      promptAccess();
    }, true);
  }

  /* ============================================================
     INTERFACCIA (pulsante account + finestre)
     ============================================================ */
  function updateAccountUI() {
    var btn = $("#account-btn");
    if (btn) {
      if (state.user) {
        var name = state.username || (state.user.email || "").split("@")[0];
        btn.textContent = name.length > 14 ? name.slice(0, 13) + "…" : name;
        btn.classList.add("is-logged");
      } else {
        btn.textContent = "Accedi";
        btn.classList.remove("is-logged");
      }
    }
    // Badge stato (facoltativo) nel menu account
    var badge = $("#account-status");
    if (badge) {
      if (!state.user) badge.textContent = "";
      else if (state.isAdmin) badge.textContent = "Accesso libero attivo";
      else if (state.isSubscribed) badge.textContent = "Abbonamento attivo";
      else if (!state.emailVerified) badge.textContent = "Email da verificare";
      else badge.textContent = "Nessun abbonamento attivo";
    }
    var manageBtn = $("#account-manage");
    if (manageBtn) manageBtn.hidden = !(state.isSubscribed && functions);
    var subBtn = $("#account-subscribe");
    if (subBtn) subBtn.hidden = state.isAdmin || state.isSubscribed;
  }

  /* ---------- Apertura/chiusura finestre ---------- */
  function closeAllModals() {
    ["#auth-modal", "#verify-modal", "#paywall-modal", "#account-modal"].forEach(function (id) {
      var m = $(id); if (m) m.hidden = true;
    });
  }
  function openAuth(tab) {
    if (!state.configured) { toast("Registrazione non ancora configurata (SETUP_ABBONAMENTI.md)."); }
    closeAllModals();
    var m = $("#auth-modal"); if (!m) return;
    m.hidden = false;
    switchAuthTab(tab || "login");
  }
  function openVerify() { closeAllModals(); var m = $("#verify-modal"); if (m) { m.hidden = false; var e = $("#verify-email-addr"); if (e && state.user) e.textContent = state.user.email; } }
  function openPaywall() {
    closeAllModals();
    var m = $("#paywall-modal"); if (!m) return;
    // Riempi etichette e prezzi dalla configurazione
    var p = CFG.prezzi || {};
    setText("#pw-mensile-label", p.mensileLabel || "Mensile");
    setText("#pw-mensile-prezzo", p.mensilePrezzo || "");
    setText("#pw-annuale-label", p.annualeLabel || "Annuale");
    setText("#pw-annuale-prezzo", p.annualePrezzo || "");
    setText("#pw-annuale-nota", p.annualeNota || "");
    m.hidden = false;
  }
  function openAccount() {
    if (!state.user) { openAuth("login"); return; }
    closeAllModals();
    updateAccountUI();
    var m = $("#account-modal"); if (m) {
      m.hidden = false;
      setText("#account-name", state.username || (state.user.email || ""));
      setText("#account-email", state.user.email || "");
    }
  }
  function setText(sel, txt) { var el = $(sel); if (el) el.textContent = txt; }

  function switchAuthTab(tab) {
    $$("#auth-modal [data-auth-tab]").forEach(function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-auth-tab") === tab);
    });
    $$("#auth-modal [data-auth-pane]").forEach(function (p) {
      p.hidden = p.getAttribute("data-auth-pane") !== tab;
    });
    var err = $("#auth-error"); if (err) { err.hidden = true; err.textContent = ""; }
  }

  function showAuthError(code) {
    var map = {
      "auth/invalid-email": "Indirizzo email non valido.",
      "auth/user-not-found": "Nessun account con questi dati.",
      "auth/wrong-password": "Password errata.",
      "auth/invalid-credential": "Credenziali non valide.",
      "auth/email-already-in-use": "Esiste gia' un account con questa email.",
      "auth/weak-password": "La password deve avere almeno 6 caratteri.",
      "auth/too-many-requests": "Troppi tentativi. Riprova tra poco.",
      "app/username-taken": "Questo username e' gia' in uso.",
      "app/username-invalid": "Username non valido (3-30 caratteri: lettere, numeri, . _ -)."
    };
    var err = $("#auth-error");
    if (err) { err.textContent = map[code] || "Si e' verificato un errore. Riprova."; err.hidden = false; }
  }

  /* ============================================================
     COLLEGAMENTO EVENTI DELL'INTERFACCIA
     ============================================================ */
  function wireUI() {
    // Pulsante account nella barra
    var acc = $("#account-btn");
    if (acc) acc.addEventListener("click", function () { state.user ? openAccount() : openAuth("login"); });

    // Tab del pop-up accedi/registrati/recupera
    $$("#auth-modal [data-auth-tab]").forEach(function (b) {
      b.addEventListener("click", function () { switchAuthTab(b.getAttribute("data-auth-tab")); });
    });
    // Chiusure
    $$("[data-close-modal]").forEach(function (b) {
      b.addEventListener("click", function () {
        var sel = b.getAttribute("data-close-modal");
        var m = sel ? $(sel) : b.closest(".modal");
        if (m) m.hidden = true;
      });
    });
    // Clic sullo sfondo = chiudi
    ["#auth-modal", "#verify-modal", "#paywall-modal", "#account-modal"].forEach(function (id) {
      var m = $(id);
      if (m) m.addEventListener("click", function (e) { if (e.target === m) m.hidden = true; });
    });

    // Form: registrazione
    var regForm = $("#reg-form");
    if (regForm) regForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var u = $("#reg-username").value, em = $("#reg-email").value, pw = $("#reg-password").value;
      setBusy("#reg-submit", true);
      doRegister(u, em, pw).then(function () {
        setBusy("#reg-submit", false);
        openVerify();
        toast("Registrazione completata! Ti abbiamo inviato una email di conferma.");
      }).catch(function (err) { setBusy("#reg-submit", false); showAuthError(err && err.code); });
    });

    // Form: login
    var logForm = $("#login-form");
    if (logForm) logForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var id = $("#login-id").value, pw = $("#login-password").value;
      setBusy("#login-submit", true);
      doLogin(id, pw).then(function () {
        setBusy("#login-submit", false);
        closeAllModals();
        toast("Accesso eseguito.");
      }).catch(function (err) { setBusy("#login-submit", false); showAuthError(err && err.code); });
    });

    // Form: recupero password
    var resForm = $("#reset-form");
    if (resForm) resForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var id = $("#reset-id").value;
      setBusy("#reset-submit", true);
      doReset(id).then(function () {
        setBusy("#reset-submit", false);
        toast("Ti abbiamo inviato una email per reimpostare la password.");
        switchAuthTab("login");
      }).catch(function (err) { setBusy("#reset-submit", false); showAuthError(err && err.code); });
    });

    // Finestra "verifica email"
    var rv = $("#verify-refresh"); if (rv) rv.addEventListener("click", refreshVerification);
    var rs = $("#verify-resend"); if (rs) rs.addEventListener("click", resendVerification);

    // Pop-up abbonamento
    var bm = $("#pw-buy-mensile"); if (bm) bm.addEventListener("click", function () { startCheckout((CFG.stripe || {}).priceMensile); });
    var ba = $("#pw-buy-annuale"); if (ba) ba.addEventListener("click", function () { startCheckout((CFG.stripe || {}).priceAnnuale); });

    // Menu account
    var lo = $("#account-logout"); if (lo) lo.addEventListener("click", doLogout);
    var sub = $("#account-subscribe"); if (sub) sub.addEventListener("click", function () { openPaywall(); });
    var mng = $("#account-manage"); if (mng) mng.addEventListener("click", openBillingPortal);

    // Se torniamo dal pagamento con successo, un avviso
    if (/[?&]checkout=success/.test(window.location.search)) {
      toast("Grazie! L'abbonamento sara' attivo tra pochi secondi.");
    }
  }

  function setBusy(sel, busy) {
    var b = $(sel); if (!b) return;
    b.disabled = busy;
    if (busy) { b.dataset._t = b.textContent; b.textContent = "Attendi…"; }
    else if (b.dataset._t) { b.textContent = b.dataset._t; }
  }

  /* ---------- API pubblica (usata da app.js se serve) ---------- */
  window.InIureAuth = {
    isAllowed: isAllowed,
    promptAccess: promptAccess,
    openAuth: openAuth,
    openPaywall: openPaywall,
    getState: function () { return state; }
  };

  /* ---------- Avvio ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    wireUI();
    installGate();
    caricaFirebase(initFirebase);
    updateAccountUI();
  });

  /* Scarica le librerie Firebase solo se la configurazione e' compilata:
     con l'area riservata spenta nessuna richiesta parte verso i server Google. */
  function caricaFirebase(poi) {
    if (window.firebase || !configLooksReady()) { poi(); return; }
    var base = "https://www.gstatic.com/firebasejs/10.14.1/";
    var lib = ["firebase-app-compat.js", "firebase-auth-compat.js",
               "firebase-firestore-compat.js", "firebase-functions-compat.js"];
    (function prossima(i) {
      if (i >= lib.length) { poi(); return; }
      var s = document.createElement("script");
      s.src = base + lib[i];
      s.onload = function () { prossima(i + 1); };
      s.onerror = function () { poi(); };   // offline o bloccato: initFirebase gestisce l'assenza
      document.head.appendChild(s);
    })(0);
  }
})();
