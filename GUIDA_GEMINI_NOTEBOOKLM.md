# In Iure con NotebookLM e Gemini: come funziona

*Guida redatta il 5 novembre 2026.*

Ci sono due modi per far rispondere un'intelligenza artificiale di Google partendo dai contenuti dell'app In Iure:

| | **A. NotebookLM** | **B. Gemini CLI (dal PC)** |
|---|---|---|
| Dove si usa | nel browser o nell'app NotebookLM, anche da telefono | nel terminale del PC (finestra nera) |
| Fonti | **solo** i contenuti dell'app: 33 atti normativi, 255 modelli di atti, 882 quiz | **prima** l'app; poi Normattiva (norme non presenti nell'app); poi SentenzeWeb (Cassazione) |
| Come si aggiorna | i documenti su Google Drive vengono riscritti e NotebookLM li risincronizza da solo | legge direttamente i file dell'app sul PC, quindi è sempre allineato |
| Costo | gratis (piano gratuito NotebookLM) | gratis (Gemini CLI con account Google personale) |

---

## Schema generale

```
                 AGGIORNA_NORMATIVA.bat   (lo lanci tu, quando decidi)
                            |
                            v
     Normattiva --> Sito web/In-Iure/js/   (i file dell'app: codici, atti, quiz)
                            |
            +---------------+-------------------------------+
            |                                               |
            v                                               v
  In-Iure/tools/notebooklm.py                       In-Iure-MCP/server.js
  (dopo la pubblicazione)                           (legge i file a ogni domanda)
            |                                               |
            v                                               v
  Google Drive: cartella                       Gemini CLI  <-- AVVIA_GEMINI_IN_IURE.bat
  "In Iure - fonti NotebookLM"                      |   +-- sentenzeweb.js  (Cassazione, pubblico)
  (29 Google Docs)                                  |   +-- normattiva      (tramite limita-mcp.js)
            |                                       |
            v                                       v
  NotebookLM: taccuino "In Iure"             risposte con le fonti citate
  (si risincronizza da solo)
```

---

## A. NotebookLM: un taccuino basato solo sull'app

### Cosa fa
Lo script `In-Iure/tools/notebooklm.py` legge i contenuti dell'app e li distribuisce su **29 documenti di testo, sempre gli stessi**:
- 24 di norme, in cui ogni articolo è intestato "Art. 2043 c.c. - Risarcimento per fatto illecito", con la data di aggiornamento di ogni atto;
- 3 di modelli di atti;
- 2 di quiz, con risposta corretta e spiegazione.

Il numero è **fisso** e lascia circa il 40% di margine: quando l'app cresce, i documenti diventano solo un po' più grandi, ma restano gli stessi. Oggi il più grande ha 673 mila caratteri, contro un limite di circa 1 milione per un Google Doc. Ventinove fonti sono sotto il limite del piano gratuito di NotebookLM (50 per taccuino).

Lo script poi scrive i documenti sul **tuo** Google Drive come Google Docs, nella cartella **"In Iure - fonti NotebookLM"**.

### L'aggiornamento è automatico: non devi fare nessun passaggio
Ho verificato che **da maggio 2026 NotebookLM sincronizza da solo le fonti che sono Google Docs di Drive**: quando il documento su Drive cambia, la fonte nel taccuino si aggiorna senza alcuna azione da parte tua. Lo script **riscrive sempre gli stessi 29 documenti**, che mantengono lo stesso identificativo su Drive, e carica solo quelli effettivamente cambiati.

Dopo la configurazione iniziale (una volta sola, qui sotto) il flusso è questo:
1. lanci l'aggiornamento della normativa (`AGGIORNA_NORMATIVA.bat`, vedi la parte D) e confermi con **S**, come già fai per l'app;
2. **senza altri passaggi**, lo script riscrive su Drive i documenti cambiati;
3. NotebookLM recepisce le modifiche da solo. Le fonti giornalistiche dicono "ogni pochi minuti", ma Google non indica un tempo ufficiale.

Il riallineamento si recupera da solo. Se un giro non riesce (internet assente, Google non raggiungibile), riprova in automatico al successivo `AGGIORNA_NORMATIVA`, anche quando la normativa non è cambiata. Il controllo costa pochi secondi, perché si caricano solo i documenti diversi.

`AGGIORNA_NOTEBOOKLM.bat` resta disponibile per forzare a mano un riallineamento, ma non è necessario.

**Casi residui, molto improbabili, che lo script segnala:**
- se un documento superasse il limite di Google (l'app dovrebbe crescere di circa il 40%), ne nascerebbe uno aggiuntivo. Lo script scrive **"ATTENZIONE: ci sono N documenti NUOVI"** e quel documento va aggiunto al taccuino, una volta sola;
- NotebookLM non mostra un avviso quando una fonte si aggiorna. Se vuoi forzare l'aggiornamento: apri la fonte e premi "Fai clic per sincronizzare con Google Drive".

### Configurazione iniziale (una volta sola, circa 15 minuti)

**1) Permesso a Google Drive (gratis).** Per scrivere sul tuo Drive lo script ha bisogno di un "client OAuth" creato da te. È gratuito, non richiede la carta di credito e lo script potrà vedere e modificare **solo i file creati da lui** (permesso `drive.file`).
1. Vai su <https://console.cloud.google.com> con il tuo account Google e crea un progetto, ad esempio "In Iure NotebookLM".
2. Menu **API e servizi > Libreria**: cerca **Google Drive API** e premi **Abilita**.
3. Menu **Google Auth Platform** (o "Schermata consenso OAuth"): premi **Inizia**. Come nome app scrivi "In Iure NotebookLM", poi indica la tua email, scegli il pubblico **Esterno** e conferma.
4. Sezione **Pubblico > Utenti di test**: aggiungi il tuo indirizzo Gmail.
5. Sezione **Client > Crea client**: come tipo scegli **App desktop**, crea e premi **Scarica JSON**.
6. Rinomina il file scaricato in `client_secret.json` e mettilo nella cartella `%LOCALAPPDATA%\InIure-NotebookLM\`. Per aprirla, scrivi quel percorso nella barra di Esplora file e crea la cartella se non esiste.
   **Non metterlo nella cartella del progetto:** finirebbe su GitHub.

7. **Importante per non dover più rifare l'accesso:** nella sezione **Pubblico** premi **Pubblica app**, così passi da "In test" a "In produzione". Finché il progetto resta "In test", Google fa scadere l'accesso ogni 7 giorni e all'aggiornamento successivo si riaprirebbe il browser. Con il solo permesso `drive.file` Google non dovrebbe chiedere la verifica dell'app. Non l'ho potuto provare: se dovesse chiederla, dimmelo.

I nomi delle voci di Google Cloud cambiano spesso. Se non trovi una voce, cerca "OAuth client ID desktop".

**2) Prima esecuzione.** Fai doppio clic su `AGGIORNA_NOTEBOOKLM.bat`. Si apre il browser: accedi con il tuo account e concedi l'accesso. Compare l'avviso "Google non ha verificato questa app": è normale, perché l'app l'hai creata tu. Premi "Avanzate", poi "Vai a In Iure NotebookLM". Lo script crea la cartella su Drive e i 29 documenti. È l'unica volta in cui si apre il browser.

**3) Creazione del taccuino.**
1. Apri <https://notebooklm.google.com> e crea un **Nuovo taccuino**, chiamato "In Iure".
2. **Aggiungi fonte > Google Drive**: apri la cartella "In Iure - fonti NotebookLM" e seleziona **tutti i 29 documenti**, compresi quelli "di riserva" se ce ne sono.
3. Nella chat apri **Configura** (l'icona delle impostazioni) e scegli lo stile personalizzato. Incolla:

   > Rispondi in italiano usando esclusivamente le fonti di questo taccuino, che contengono il testo vigente delle norme, i modelli di atti e i quiz dell'app In Iure. Cita sempre articolo e atto (es. "art. 2043 c.c."). Se l'informazione non è nelle fonti, dillo espressamente e non integrarla con conoscenze esterne. Indica la data di aggiornamento riportata nell'intestazione dell'atto.

### Cose da sapere
- **Scadenza dell'accesso:** con l'app "In produzione" (punto 7) l'accesso resta valido. Google lo revoca se non viene usato per circa 6 mesi o se togli tu il permesso dal tuo account Google. In quel caso, al primo aggiornamento successivo, si riapre il browser e basta confermare.
- **"Esclusivamente":** NotebookLM è progettato per rispondere solo sulle fonti e cita il passaggio usato. Resta però un modello linguistico, che può sintetizzare male. **Controlla sempre la citazione.**
- **Sul telefono:** il taccuino si usa anche dall'app NotebookLM o dal browser, con lo stesso account Google.
- **Credenziali:** `client_secret.json` e `token.json` stanno solo in `%LOCALAPPDATA%\InIure-NotebookLM\` sul PC principale, mai nel progetto.

---

## B. Gemini CLI: Gemini dal PC sulle fonti dell'app

### Cosa c'è
- **`In-Iure-MCP/server.js`**, il server "in-iure". Legge **direttamente** i file dell'app (`Sito web/In-Iure/js`) e a ogni domanda controlla se sono cambiati: dopo `AGGIORNA_NORMATIVA.bat` Gemini vede subito il testo nuovo, senza riavviare nulla. Non usa la rete. Strumenti:
  - `elenca_codici`, `leggi_articolo` (accetta "c.c.", "cpc", "171 ter", "art. 2043"...), `elenca_articoli`, `cerca_norme`;
  - `cerca_modelli_atti` e `leggi_modello_atto` per i modelli.
- **`In-Iure-MCP/sentenzeweb.js`**, il server "sentenzeweb". Interroga **SentenzeWeb**, l'archivio **pubblico e gratuito** dei provvedimenti civili e penali della Corte di cassazione degli ultimi 5 anni circa, sul portale ItalgiureWeb del **Ministero della Giustizia** (italgiure.giustizia.it/sncass). **Nessuna credenziale.** Strumenti:
  - `cerca_sentenze` (parole chiave, con filtri per archivio, anno, sezione e tipo);
  - `cerca_per_estremi` e `leggi_sentenza` (testo integrale a parti, con link al PDF ufficiale);
  - `stato_protezione`.
- **Normattiva**: il server Normattiva già installato su questo PC (`Documents\MCP\Normattiva-MCP`), che Gemini raggiunge attraverso il filtro anti-blocco `limita-mcp.js`. Serve per le norme non presenti nell'app e per i testi storici.
- **`In-Iure-Gemini/`**, la cartella di lavoro di Gemini:
  - `GEMINI.md`: le regole, cioè prima l'app, poi Normattiva, poi SentenzeWeb, sempre la fonte citata, niente risposte a memoria, nessun nome di persone fisiche;
  - `.gemini/policies/in-iure.toml`: blocca la ricerca Google e la lettura di pagine web;
  - `configura.js`: ricalcola i percorsi a ogni avvio.
- **`AVVIA_GEMINI_IN_IURE.bat`**: il pulsante di avvio.

**Italgiure con credenziali non è collegato a Gemini**, come hai chiesto: al suo posto c'è SentenzeWeb, che è pubblico e ministeriale. Il server Italgiure resta disponibile solo qui in Claude Code, come prima.

### Protezione anti-blocco dell'IP
Tutte le richieste ai siti pubblici passano dal modulo `In-Iure-MCP/limitatore.js`:

| Regola | SentenzeWeb | Normattiva |
|---|---|---|
| richieste contemporanee | 1 | 1 |
| intervallo minimo tra due richieste | 3 secondi | 4 secondi |
| tetto all'ora | 120 | 90 |
| tetto nelle 24 ore | 600 | 400 |
| cache (la stessa domanda non torna al sito) | ricerche 24 ore; testi delle sentenze per sempre | 24 ore |

- **Pausa automatica:** se il sito risponde 403, 429 o 503, non risponde o rifiuta la connessione, quella fonte **non viene più contattata per 15 minuti**. La pausa raddoppia a ogni nuovo segnale, fino a 6 ore, e si azzera alla prima risposta regolare.
- Lo stato (conteggi e pause) è salvato in `%LOCALAPPDATA%\InIure-MCP\`, quindi vale anche tra sessioni diverse e tra più finestre aperte.
- Con il server Normattiva il limite vale per **chiamata**: se una chiamata fa internamente più richieste al sito, il filtro non le vede.
- Il server si presenta ai siti con un nome dichiarato ("InIure-MCP/1.0 (consultazione personale, richieste limitate)") e non si spaccia per un browser.
- Il sito del Ministero invia una catena di certificati incompleta. Invece di disattivare i controlli di sicurezza, ho incluso il certificato intermedio pubblico che manca (`In-Iure-MCP/certificati/`, emesso da TI Trust Technologies, valido fino al 2029). La verifica del certificato resta completa.

### Come attivare Gemini CLI (una volta sola, circa 3 minuti)
Gemini CLI è **già installato** su questo PC (versione 0.67.0) e i server sono già configurati. Restano due conferme, che può dare solo il tuo account:

1. **Avvia.** Apri la cartella `Desktop\app\In iure\Sito web` e fai doppio clic su **`AVVIA_GEMINI_IN_IURE.bat`**. Si apre una finestra nera: la prima riga dice "Fonti collegate a Gemini: in-iure, sentenzeweb, normattiva".
2. **Fidati della cartella.** Gemini chiede "Do you trust this folder?". Con le frecce scegli **"Trust folder"** e premi Invio.
   **È indispensabile:** nelle cartelle non attendibili Gemini spegne le fonti. Non ho potuto farlo io, perché il sistema di sicurezza di Claude Code mi ha impedito di modificare quella impostazione.
   Se Gemini chiede di riavviare, chiudi la finestra e rifai il punto 1.
3. **Accedi.** Gemini chiede come autenticarsi: scegli **"Sign in with Google"** (Accedi con Google). Si apre il browser: entra con il tuo account Google personale e conferma. Poi torna alla finestra nera.
   L'uso con account personale è gratuito, entro i limiti giornalieri di Google.
4. **Controlla le fonti.** Scrivi `/mcp` e premi Invio: devono comparire **in-iure**, **sentenzeweb** e **normattiva**, con il pallino verde (connessi).
   Se una non è connessa, chiudi e riapri con il punto 1. Se ancora non va, dimmi cosa compare.
5. **Usalo.** Scrivi la domanda e premi Invio, per esempio:
   - "Cosa prevede l'art. 1117 c.c.? Ci sono pronunce recenti della Cassazione sul lastrico solare?"
   - "Quali termini prevede l'art. 171-ter c.p.c.?"
   - "Trovami il modello di opposizione a decreto ingiuntivo e spiegami i campi."

   Se Gemini chiede il permesso di usare uno strumento, scegli "Allow always" (consenti sempre).
6. **Per uscire** scrivi `/quit`.

Dalla volta successiva basta il punto 1: accesso e fiducia nella cartella restano memorizzati.

### Come si aggiorna
- **Norme e atti dell'app:** in automatico, senza alcun passaggio. Il server legge i file di `In-Iure/js` e a ogni domanda controlla se sono cambiati. Quando confermi un aggiornamento della normativa (parte D), Gemini usa subito i testi nuovi, anche con una finestra già aperta. Se invece rifiuti l'aggiornamento, i file tornano come prima e Gemini continua a usare i testi precedenti.
- **Normattiva e SentenzeWeb:** sono online, quindi sono sempre i dati del giorno, salvo le risposte già in cache: 24 ore per le ricerche.

---

## C. Portare tutto sul PC personale

### NotebookLM
**Sul PC personale non serve nulla:** apri <https://notebooklm.google.com> con lo stesso account Google e trovi il taccuino. Gli aggiornamenti dei documenti partono solo dal PC principale, quello con `client_secret.json`. Non configurare la sincronizzazione su due PC.

### Gemini CLI
**1) Programmi da installare sul PC personale (gratis):**
- **Node.js** versione LTS, da <https://nodejs.org>;
- **Gemini CLI**: apri il Prompt dei comandi ed esegui `npm install -g @google/gemini-cli`.

**2) Cosa copiare.** Copia l'intera cartella **`Sito web`**, con una chiavetta o con OneDrive. In alternativa basta questo minimo, **mantenendo la stessa struttura**:
```
Sito web\
   AVVIA_GEMINI_IN_IURE.bat
   In-Iure\js\            (tutta la cartella: sono le norme)
   In-Iure-MCP\           (tutta, compresa la sottocartella certificati)
   In-Iure-Gemini\        (tutta, compresa la cartella nascosta .gemini)
```
I percorsi si sistemano da soli: `configura.js` li ricalcola a ogni avvio, qualunque sia la cartella.

**3) Normattiva (facoltativo).** Il server Normattiva è un programma a parte, che si trova in `Documenti\MCP\Normattiva-MCP` su questo PC. Se lo vuoi anche sul PC personale, copia quella cartella nella stessa posizione (`Documenti\MCP\Normattiva-MCP`). Se la metti altrove, imposta la variabile d'ambiente `IN_IURE_NORMATTIVA_MCP` con il percorso. Usa un browser automatico (Playwright): sul nuovo PC può servire `npx playwright install chromium` dentro quella cartella. **Non l'ho provato su un altro PC.** Se manca, Gemini funziona lo stesso con l'app e con SentenzeWeb, e all'avvio lo segnala.

**4) Primo avvio:** come al punto B, cioè `AVVIA_GEMINI_IN_IURE.bat`, accesso con Google, **Trust folder**, poi `/mcp` per il controllo.

**5) Tenerlo aggiornato.** Sul PC personale Gemini legge **la copia** dei file dell'app, che non si aggiorna da sola.
- **Oggi:** dopo ogni aggiornamento della normativa sul PC principale, ricopia la cartella `In-Iure\js` sul PC personale. Se tieni `Sito web` in OneDrive, la sincronizzazione la fa OneDrive.
- **Dopo l'attivazione di GitHub** (il passo ancora in sospeso per l'aggiornamento delle app): sul PC personale basterà scaricare la copia dal repository e aggiornarla con un comando, che preparerò allora (`git pull` dentro un file .bat).
- **Non lanciare `AGGIORNA_NORMATIVA.bat` sul PC personale:** quel comando pubblica gli aggiornamenti per tutte le app e va usato da un solo PC.

Lo stato della protezione anti-blocco è separato su ogni PC. Se i due PC sono sulla stessa rete di casa, il traffico verso i siti si somma, ma resta molto basso: al massimo una richiesta ogni 3-4 secondi per PC.

---

## D. Come far partire l'aggiornamento della normativa dell'app

L'aggiornamento parte **solo quando lo decidi tu**, dal PC principale. Non c'è nessun aggiornamento programmato e nessun pulsante nell'app.

### Come si lancia
1. Apri la cartella `Desktop\app\In iure\Sito web` e fai doppio clic su **`AGGIORNA_NORMATIVA.bat`**.
2. Si apre una finestra nera e il programma lavora da solo:
   1. **scarica** da Normattiva il testo vigente dei 33 atti. Ci vogliono alcuni minuti: lo scaricamento è volutamente lento, con pause tra un atto e l'altro, per non farsi bloccare;
   2. **controlla** che non ci siano anomalie, come atti spariti, articoli calati in massa o file illeggibili. Se trova qualcosa si ferma e **non cambia nulla**;
   3. **mostra cosa è cambiato**: apre il file `ULTIMO_AGGIORNAMENTO.md` con le modifiche articolo per articolo.
3. Leggi il riepilogo. Alla domanda **"Vuoi APPLICARE l'aggiornamento...?"**:
   - **S** e Invio: l'aggiornamento viene applicato (vedi sotto);
   - qualunque altra risposta: **tutto torna esattamente come prima**, compresi i file scaricati, e nemmeno Gemini vede le modifiche.
4. Alla fine premi Invio per chiudere la finestra.

Se Normattiva non ha novità, il programma lo dice e non chiede nulla. Si limita a riallineare NotebookLM, se un giro precedente non era riuscito.

### Cosa succede quando confermi con S
| | Oggi (GitHub non ancora attivo) | Dopo l'attivazione di GitHub |
|---|---|---|
| Gemini CLI su questo PC | usa subito i testi nuovi | uguale |
| NotebookLM | i documenti su Drive vengono riscritti da soli e il taccuino si risincronizza (dopo la configurazione del punto A) | uguale |
| App installate (telefoni, PC, iPhone) | **non** ricevono l'aggiornamento: andrebbero ricompilate | lo ricevono da sole alla prima apertura, in silenzio |
| Gemini sul PC personale | va ricopiata la cartella `In-Iure\js` (parte C.5) | con il comando di allineamento che preparerò |

**Non lanciarlo sul PC personale:** va usato da un solo PC, quello principale.

### Modifiche ad atti e quiz
Quando sono io (Claude) a modificare atti o quiz dell'app, a fine lavoro rilancio anche il riallineamento di NotebookLM: l'ho scritto tra le regole del progetto. Gemini CLI le vede subito comunque.

---

## E. Cosa non è stato fatto e cosa è incerto (leggere)
1. **NotebookLM non è ancora collegato:** mancano il tuo `client_secret.json` (punto A, configurazione iniziale) e la creazione del taccuino, che può farla solo tu dal tuo account. Ho provato lo script di esportazione sui dati veri (29 documenti) e la logica di caricamento con un **Drive simulato**: primo caricamento, nessun ricaricamento se nulla cambia, solo il documento cambiato se ne cambia uno. Il **caricamento vero su Google Drive non l'ho potuto provare**.
2. **La sincronizzazione automatica di NotebookLM** l'ho verificata su fonti giornalistiche (annuncio del 26 maggio 2026), non provandola. Non c'è un tempo ufficiale di aggiornamento.
3. **Gemini CLI non l'ho provato con un accesso vero**, perché servono il tuo login Google e la conferma di "Trust folder". Ho provato direttamente i tre server con il protocollo MCP, cioè lo stesso che usa Gemini: In Iure 20/20 verifiche (`node In-Iure-MCP\test.js`), SentenzeWeb e Normattiva interrogati dal vivo con esito corretto.
4. **"Esclusivamente" non è garantibile al 100%** da nessun sistema. Le regole in `GEMINI.md` e il blocco del web riducono molto il rischio che Gemini usi conoscenze proprie, ma il modello può comunque sbagliare. Controlla sempre la norma citata.
5. **SentenzeWeb** copre solo gli ultimi 5 anni circa (2021-2026), non contiene massime ufficiali e pubblica i testi con i nomi delle parti in chiaro. Ho dato a Gemini la regola di indicare le persone solo per ruolo.
6. **Limiti anti-blocco:** sono valori prudenti scelti da me. Né il Ministero né Normattiva pubblicano soglie ufficiali.
7. **Il PC personale** non è stato provato. In particolare il server Normattiva su un altro PC (punto C.3).
8. **L'aggiornamento automatico della copia sul PC personale** dipende dall'attivazione di GitHub, ancora in sospeso.
9. **Mai provato su Normattiva reale:** il nuovo `AGGIORNA_NORMATIVA` (funzionamento senza GitHub, ripristino in caso di rifiuto, riallineamento di NotebookLM) l'ho provato con uno scaricamento simulato, non con quello vero. Rifiuto e conferma si comportano correttamente e i file dell'app sono rimasti identici alle impronte ufficiali.
10. **Aggiornamento lanciato da GitHub:** dopo l'attivazione resterà possibile lanciare l'aggiornamento anche dal sito di GitHub ("Run workflow"). In quel caso NotebookLM e il PC si riallineano solo al successivo `AGGIORNA_NORMATIVA` lanciato dal PC. Il percorso normale, dal PC, li aggiorna subito.

## F. File creati o modificati
| File | Cosa fa |
|---|---|
| `In-Iure/tools/notebooklm.py` | esporta i contenuti dell'app e li sincronizza su Google Drive |
| `AGGIORNA_NOTEBOOKLM.bat` | lancia la sincronizzazione a mano |
| `In-Iure/tools/aggiorna_e_pubblica.py` | funziona anche senza GitHub (solo PC); se rifiuti ripristina tutto; dopo la conferma aggiorna NotebookLM e recupera i giri falliti |
| `In-Iure/tools/controllo_aggiornamento.py` | senza GitHub confronta con la copia di sicurezza |
| `In-Iure-NotebookLM/fonti/` | i 29 file generati (esclusi da GitHub, si rigenerano) |
| `In-Iure-MCP/server.js` | server MCP delle norme e degli atti dell'app |
| `In-Iure-MCP/sentenzeweb.js` | server MCP di SentenzeWeb (Cassazione, pubblico) |
| `In-Iure-MCP/limitatore.js`, `limita-mcp.js` | protezione anti-blocco e filtro per Normattiva |
| `In-Iure-MCP/mcp-base.js`, `test.js`, `certificati/` | base comune, collaudo, certificato intermedio |
| `In-Iure-Gemini/` | regole, blocco del web e configurazione di Gemini |
| `AVVIA_GEMINI_IN_IURE.bat` | avvio di Gemini con le fonti In Iure |

*Fonti sulla sincronizzazione automatica di NotebookLM:* [Android Authority](https://www.androidauthority.com/notebooklm-auto-google-drive-syncing-3671289/), [Chrome Unboxed](https://chromeunboxed.com/google-fixes-one-of-notebooklms-biggest-annoyances-with-automatic-drive-syncing/), [EdTech Innovation Hub](https://www.edtechinnovationhub.com/news/notebooklm-adds-automatic-drive-syncing-to-keep-ai-research-sources-current), [nlmtools](https://www.nlmtools.com/blog/notebooklm-source-freshness-sync).
