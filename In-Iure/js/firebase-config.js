/* ============================================================
   In Iure — CONFIGURAZIONE account e abbonamenti
   ------------------------------------------------------------
   QUESTO E' L'UNICO FILE CHE DEVI MODIFICARE A MANO.
   Sostituisci i valori "INSERISCI_QUI" seguendo la guida
   SETUP_ABBONAMENTI.md (bastano copia-incolla dal pannello
   Firebase e da quello Stripe). Finche' non lo fai, l'app
   continua a funzionare ma mostra un avviso al login.
   ============================================================ */
window.INIURE_CONFIG = {

  /* 1) Dati del progetto FIREBASE
     Da: console.firebase.google.com -> tua app -> Impostazioni
     progetto -> "Le tue app" (icona </>) -> Configurazione SDK. */
  firebase: {
    apiKey:            "INSERISCI_QUI",
    authDomain:        "INSERISCI_QUI",   // es. in-iure.firebaseapp.com
    projectId:         "INSERISCI_QUI",   // es. in-iure
    storageBucket:     "INSERISCI_QUI",   // es. in-iure.appspot.com
    messagingSenderId: "INSERISCI_QUI",
    appId:             "INSERISCI_QUI"
  },

  /* INTERRUTTORE ABBONAMENTO.
     false = sito GRATUITO: basta registrarsi (nessun pagamento richiesto).
             Usa questo finche' non hai la P. IVA e i prezzi pronti.
     true  = sito a pagamento: per usare le sezioni serve un abbonamento
             attivo (o essere admin). Metti true SOLO dopo aver aperto la
             P. IVA e inserito i prezzi qui sotto. */
  richiediAbbonamento: true,

  /* 2) PREZZI Stripe (ID dei "Prezzi" creati nel catalogo Stripe).
     Iniziano con "price_". Li imposti DOPO aver deciso l'importo. */
  stripe: {
    priceMensile: "INSERISCI_QUI",   // es. price_1AbCdEf...  (abbonamento mensile)
    priceAnnuale: "INSERISCI_QUI"    // es. price_1XyZ...     (abbonamento annuale)
  },

  /* Etichette mostrate nel pop-up di abbonamento (solo testo). */
  prezzi: {
    mensileLabel: "Mensile",
    mensilePrezzo: "— € / mese",
    annualeLabel: "Annuale",
    annualePrezzo: "— € / anno",
    annualeNota: "(risparmi rispetto al mensile)"
  },

  /* 3) ACCESSO LIBERO (admin).
     Chi rientra qui usa il sito senza pagare l'abbonamento.
     - adminUsernames: comodo per l'avvio. Registra TU per primo
       questi username (cosi' nessun altro puo' prenderli).
     - Il metodo definitivo e a prova di manomissione e' aggiungere
       il tuo UID nella collezione "admins" di Firestore (vedi guida).
     La tua password NON e' qui: la scegli tu al primo accesso. */
  adminUsernames: ["raffaele.arcella"],
  adminEmails: []   // opzionale: email con accesso libero (dopo verifica email)
};
