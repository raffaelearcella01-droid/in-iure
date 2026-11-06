# In Iure

App web per la consultazione di **codici e normative**, **quiz di apprendimento** e **redazione di atti** forensi.

## Contenuti attuali
- **Codici** (6 — 6.393 articoli, testo integrale estratto dai PDF ufficiali):
  Costituzione (127), Codice Civile (3.181), Codice di Procedura Civile (993),
  Codice Penale (907), Codice di Procedura Penale (919), Codice della Strada (266).
- **Quiz**: 6 materie, 522 domande con spiegazione e riferimento normativo. Ogni
  sessione estrae 15 domande a caso e mescola anche le risposte: sempre diverse,
  tutto offline e senza costi.
- **Atti**: 81 modelli di formulario compilabili, soprattutto civili (cognizione,
  impugnazioni, esecuzione, cautelare, monitorio, volontaria giurisdizione,
  locazioni/sfratto, famiglia, successioni, diritti reali/possessorie, ADR),
  più lavoro, penale e amministrativo.

## Ricerca articoli
- **Per numero**: scrivi il numero in qualsiasi forma — `2043`, `art 2043`, `Art. 2043`,
  `ART 2043`, `articolo 2043`, `570-bis` — esce **prima l'articolo esatto**, poi in
  sequenza gli articoli che lo richiamano.
- **Per numero + codice** (ricerca globale): indica anche il codice in forma libera —
  `art. 127 ter c.p.c.`, `cpc 127-ter`, `1453 c.c.`, `cc 1453`, `575 codice penale` —
  la ricerca si limita a quel codice e mostra prima l'articolo esatto, poi i richiami
  nello stesso codice. Abbreviazioni riconosciute: cost, cc, cpc, cp, cpp, cds (con o
  senza punti) e i nomi estesi.
- **Per parole chiave**: es. `risarcimento danno`, `nullità contratto` — compaiono per
  primi gli articoli la cui rubrica corrisponde (l'articolo "principale"), poi gli altri.


È una **PWA** (Progressive Web App): funziona nel browser, si installa come app su iPhone e Android e funziona anche **offline**.

---

## 1. Struttura dei file

```
In-Iure/
├── index.html            ← pagina principale (apri questa)
├── manifest.json         ← configurazione installazione app
├── sw.js                 ← service worker (cache offline)
├── css/
│   └── styles.css
├── js/
│   ├── app.js            ← logica dell'app
│   ├── codici-index.js   ← elenco dei codici (metadati)
│   ├── codici/           ← un file per codice, caricato solo quando lo apri
│   │   ├── costituzione.js
│   │   ├── codice-civile.js
│   │   ├── cpc.js
│   │   ├── codice-penale.js
│   │   ├── cpp.js
│   │   └── cds.js
│   ├── data-quiz.js      ← domande dei quiz (6 materie)
│   └── data-atti.js      ← formulario atti (12 modelli)
└── icons/                ← icone dell'app

> I testi dei codici sono estratti automaticamente dai PDF ufficiali (Altalex)
> presenti nella cartella. Ogni codice è in un file separato e viene caricato
> solo quando lo apri: così l'avvio dell'app resta immediato. La ricerca globale
> carica tutti i codici alla prima ricerca.
```

---

## File unico da inviare a un telefono
Il solo `index.html` **non** funziona se inviato da solo (richiama gli altri file).
Per mandarla a un telefono in un colpo solo usa **`index-standalone.html`**: è un
**unico file** (~6,4 MB) con dentro tutto (stili, codice, dati, immagini). Lo invii
via WhatsApp/email e lo apri nel browser del telefono. Funziona offline; su iPhone i
pulsanti di download Word/PDF possono essere limitati (in quel caso conviene pubblicarlo
online — vedi punto 3). Il file va **rigenerato** se i contenuti cambiano.

## 2. Come provarla subito (sul computer)

**Basta fare doppio clic su `index.html`**: si apre nel browser e tutte le funzioni principali (codici, quiz, scrittura atti, copia, WhatsApp, download Word/PDF) funzionano.

> Nota: l'installazione come app e la modalità offline richiedono che il sito sia servito da un indirizzo web (http/https), non dal file locale. Vedi sotto.

Per provare anche installazione e offline in locale, avvia un piccolo server dalla cartella `In-Iure`:

```bash
# con Python (già presente su questo PC)
python -m http.server 8080
```
Poi apri **http://localhost:8080** nel browser.

---

## 3. Pubblicare online (consigliato)

Per usarla dal telefono e installarla come app serve un indirizzo https. Opzioni gratuite:

- **Netlify Drop** — vai su https://app.netlify.com/drop e trascina la cartella `In-Iure`. Ottieni subito un link https.
- **GitHub Pages** — carica la cartella in un repository e attiva Pages.
- **Vercel**, **Cloudflare Pages**, o qualsiasi hosting statico.

Carica **tutta** la cartella `In-Iure` mantenendo la struttura.

---

## 4. Installare l'app sul telefono

### iPhone / iPad (Apple)
Safari non ha un pulsante automatico, ma l'app guida l'utente:
1. Apri il sito in **Safari**.
2. Tocca **Condividi** (l'icona con la freccia verso l'alto).
3. Scegli **«Aggiungi a Home»** → **Aggiungi**.
4. Comparirà l'icona di *In Iure*: si aprirà a schermo intero, **come un'app**.

Nella pagina compare in alto il pulsante **«Installa app»** e un banner che mostra questi passaggi.

### Android
1. Apri il sito in **Chrome**.
2. Comparirà il banner **«Installa In Iure»** (oppure menu ⋮ → **«Installa app»**).
3. Conferma: l'icona viene aggiunta e l'app si apre in finestra propria.

---

## 5. Creare l'APK per Android (facoltativo)

Non serve un APK per usarla su Android (l'installazione PWA basta). Se però vuoi un vero file **.apk / .aab** da distribuire:

### Metodo semplice — PWABuilder (Microsoft, gratuito)
1. Pubblica prima il sito online (punto 3) e prendi il link https.
2. Vai su **https://www.pwabuilder.com**
3. Incolla il link e premi **Start**.
4. Sezione **Android** → **Generate Package** → scarica l'APK/AAB firmato di test.
5. Installa l'APK sul telefono (abilita «origini sconosciute») o pubblicalo sul Play Store con l'AAB.

### Metodo avanzato — Bubblewrap (Google, CLI)
```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://IL-TUO-SITO/manifest.json
bubblewrap build
```
Genera un APK come *Trusted Web Activity*.

> Perché non un APK già pronto qui: un APK Android va **compilato e firmato** con l'Android SDK e richiede l'URL pubblico del sito. PWABuilder fa tutto in automatico partendo dal link, senza installare nulla.

---

## 6. Funzioni

**Codici e normative**
- Codici suddivisi per categoria; ricerca per **numero** o per **parola chiave** (nel testo e nella rubrica), con evidenziazione.
- Ricerca globale su tutti i codici dalla home.
- Ogni articolo è impaginato **comma per comma**, con pulsanti **Copia** e **Condividi su WhatsApp**.

**Learning Quiz**
- 6 materie; domande in ordine casuale, punteggio e barra di avanzamento.
- Dopo ogni risposta compare la **spiegazione** con il riferimento normativo.

**Scrittura di atti**
- 12 modelli di formulario con **guida alla redazione** e **modulo compilabile** con anteprima in tempo reale.
- Download del testo compilato in **Word (.doc)** e **PDF** (via finestra di stampa → «Salva come PDF»), più copia negli appunti.

---

## 7. Aggiungere contenuti

- **Nuovo codice/articolo**: modifica `js/data-codici-a.js` o `-b.js` seguendo lo schema (`num`, `rubrica`, `commi: [...]`).
- **Nuove domande**: `js/data-quiz.js`.
- **Nuovi atti**: `js/data-atti.js` (i segnaposto `{{campo}}` nel `template` devono corrispondere agli `id` dei `campi`).

I contenuti hanno finalità di studio e consultazione: verifica sempre il testo vigente sulle fonti ufficiali (Normattiva, Gazzetta Ufficiale).
