# Aggiornamento normativo — 16 ottobre 2026

## Cosa è cambiato nella fonte dei testi
Fino a oggi i codici dell'app erano estratti da PDF (Altalex/Wolters Kluwer). Ora **tutti i testi sono presi da Normattiva**, che è la banca dati ufficiale dello Stato: lo script `tools/build_normattiva.py` scarica per ogni atto l'XML ufficiale (formato Akoma Ntoso) del **testo vigente** e lo converte nel formato dell'app. Gli XML scaricati restano in `../Codici e normative/Normattiva AKN/`.

Problemi della versione precedente risolti:
- il **c.p.c.** estratto dal PDF conteneva **articoli delle disposizioni di attuazione mescolati a quelli del codice** (es. l'"art. 1" mostrato era l'art. 1 disp. att., "Richiesta di comunicazione degli atti", invece di "Giurisdizione dei giudici ordinari");
- **c.c. e c.p.c.** erano "Edizione 2024": dal confronto con le versioni storiche di Normattiva il testo corrispondeva a quello in vigore tra la fine del 2024 e l'inizio del 2025;
- ora sotto ogni articolo ci sono le **note di aggiornamento** ufficiali (decorrenze, norme transitorie, pronunce della Corte costituzionale) e il link al testo ufficiale.

## Codici e leggi presenti (33)
"Ultima modifica" = data di entrata in vigore dell'ultima modifica registrata da Normattiva.

| Atto | Sigla | Articoli | Ultima modifica |
|---|---|---|---|
| Costituzione della Repubblica Italiana | Cost. | 140 | 22/10/2023 |
| Legge sul procedimento amministrativo | L. 241/1990 | 51 | 21/04/2026 |
| Codice del processo amministrativo | c.p.a. | 139 | 26/08/2026 |
| Codice dei contratti pubblici | D.Lgs. 36/2023 | 233 | 26/08/2026 |
| Testo unico dell'edilizia | D.P.R. 380/2001 | 151 | 01/03/2026 |
| Codice Civile | c.c. | 3249 | 12/08/2026 |
| Disposizioni sulla legge in generale (preleggi) | disp. prel. c.c. | 31 | 12/08/2026 |
| Disposizioni di attuazione del Codice Civile | disp. att. c.c. | 314 | 29/04/2026 |
| Legge sul divorzio | L. 898/1970 | 16 | 26/11/2024 |
| Codice del consumo | Cod. cons. | 242 | 19/06/2026 |
| Codice delle assicurazioni private | Cod. ass. | 613 | 12/08/2026 |
| Codice in materia di protezione dei dati personali | Cod. privacy | 221 | 20/02/2026 |
| Codice della crisi d'impresa e dell'insolvenza | CCII | 415 | 12/08/2026 |
| Codice di Procedura Civile | c.p.c. | 1056 | 20/02/2026 |
| Disposizioni di attuazione del Codice di Procedura Civile | disp. att. c.p.c. | 307 | 26/11/2024 |
| Mediazione civile e commerciale | D.Lgs. 28/2010 | 44 | 25/01/2025 |
| Negoziazione assistita e degiurisdizionalizzazione | D.L. 132/2014 | 39 | 25/01/2025 |
| Legge Pinto (equa riparazione) | L. 89/2001 | 15 | 12/06/2026 |
| Testo unico spese di giustizia | D.P.R. 115/2002 | 316 | 07/10/2026 |
| Codice Penale | c.p. | 997 | 30/09/2026 |
| Responsabilità amministrativa degli enti | D.Lgs. 231/2001 | 110 | 30/09/2026 |
| Testo unico stupefacenti | D.P.R. 309/1990 | 145 | 21/08/2026 |
| Codice antimafia | D.Lgs. 159/2011 | 139 | 30/09/2026 |
| Testo unico immigrazione | D.Lgs. 286/1998 | 79 | 16/07/2026 |
| Codice di Procedura Penale | c.p.p. | 907 | 30/09/2026 |
| Norme di attuazione del Codice di Procedura Penale | disp. att. c.p.p. | 324 | 30/09/2026 |
| Processo penale minorile | D.P.R. 448/1988 | 47 | 12/06/2026 |
| Ordinamento penitenziario | L. 354/1975 | 137 | 30/07/2026 |
| Statuto dei lavoratori | L. 300/1970 | 41 | 06/11/2025 |
| Testo unico sicurezza sul lavoro | D.Lgs. 81/2008 | 321 | 07/04/2026 |
| Testo unico della giustizia tributaria | D.Lgs. 175/2024 | 141 | 26/08/2026 |
| Codice della Strada | C.d.S. | 266 | 25/04/2026 |
| Ordinamento della professione forense | L. 247/2012 | 69 | 26/08/2026 |

Novità rispetto alla versione precedente: da 6 a 33 atti. Nuovi: L. 241/1990, c.p.a., Codice dei contratti pubblici, TU edilizia, preleggi, disp. att. c.c./c.p.c./c.p.p., L. 898/1970, Codice del consumo, Codice delle assicurazioni, Codice privacy, Codice della crisi, mediazione, negoziazione assistita, Legge Pinto, TU spese di giustizia, D.Lgs. 231/2001, TU stupefacenti, Codice antimafia, TU immigrazione, processo penale minorile, ordinamento penitenziario, Statuto dei lavoratori, TU sicurezza sul lavoro, TU giustizia tributaria (D.Lgs. 175/2024, che dal 1/1/2026 ha abrogato il D.Lgs. 546/1992), ordinamento forense.

## Modifiche intervenute rispetto alla versione precedente dell'app
Confronto eseguito **tra due versioni ufficiali di Normattiva** (quella in vigore alla data della vecchia edizione e quella vigente oggi), con `tools/report_modifiche.py`.
Per c.c. e c.p.c. la data della vecchia edizione non era indicata nei PDF: è stata stimata confrontando il vecchio testo con le versioni storiche (c.c. ≈ 1/3/2025, c.p.c. ≈ 1/12/2024). Costituzione: nessuna modifica dal 2023. Codice della strada: nessuna modifica dopo il 26/5/2026.

### Codice Civile (c.c.) - modifiche dal 2025-03-01 al 2026-08-12

**Atti modificativi:** L. 14 marzo 2025, n. 35 (efficacia dal 2025-03-28); D.Lgs. 19 giugno 2025, n. 88 (efficacia dal 2025-06-23); D.L. 30 giugno 2025, n. 95 (efficacia dal 2025-06-30); atto modificativo con efficacia dal 2025-07-02 (estremi non indicati nel file Normattiva); D.L. 8 agosto 2025, n. 117 (efficacia dal 2025-08-08); L. 8 agosto 2025, n. 118 (efficacia dal 2025-08-09); L. 23 settembre 2025, n. 132 (efficacia dal 2025-09-25); L. 3 ottobre 2025, n. 148 (efficacia dal 2025-10-07); L. 2 dicembre 2025, n. 182 (efficacia dal 2025-12-03); atto modificativo con efficacia dal 2025-12-13 (estremi non indicati nel file Normattiva); atto modificativo con efficacia dal 2026-01-28 (estremi non indicati nel file Normattiva); D.Lgs. 27 marzo 2026, n. 47 (efficacia dal 2026-04-14); D.L. 12 giugno 2026, n. 100 (efficacia dal 2026-06-12); D.Lgs. 7 agosto 2026, n. 147 (efficacia dal 2026-08-11)

**Articoli nuovi (19):**
- art. 2381-bis - Comitato esecutivo e organi delegati
- art. 2381-ter - Informazione consiliare
- art. 2390-bis - Utilizzazione delle informazioni
- art. 2396-bis - Divieto di concorrenza e utilizzazione delle informazioni per i direttori generali
- art. 2396-ter - Denunzia all'organo di controllo
- art. 2396-quater - Denunzia al tribunale
- art. 2396-quinquies - Doveri dell'organo di controllo
- art. 2396-sexies - Poteri dell'organo di controllo
- art. 2396-septies - Cause d'ineleggibilità e di decadenza
- art. 2396-octies - Riunioni dell'organo di controllo
- art. 2396-novies - Revisione legale dei conti
- art. 2396-decies - Amministratori
- art. 2396-undecies - Sostituzione degli amministratori
- art. 2396-duodecies - Compensi dei componenti del comitato esecutivo
- art. 2396-terdecies - Azione sociale di responsabilità
- art. 2409-duodecies.1 - Retribuzione
- art. 2409-terdecies.1 - Validità delle deliberazioni del consiglio di sorveglianza
- art. 2409-septiesdecies.1 - Sostituzione degli amministratori
- art. 2409-septiesdecies.2 - Compensi dei componenti del comitato esecutivo

**Articoli modificati (52):**
- art. 49 - Dichiarazione di assenza
- art. 58 - Dichiarazione di morte presunta dell'assente
- art. 561 - Restituzione degli immobili
- art. 562 - Insolvenza del donatario soggetto a riduzione
- art. 563 - Effetti della riduzione della donazione
- art. 1284 - Saggio degli interessi
- art. 2364 - Assemblea ordinaria nelle società prive di consiglio di sorveglianza
- art. 2369 - Seconda convocazione e convocazioni successive
- art. 2380 - Sistemi di amministrazione e di controllo
- art. 2380-bis - Amministrazione della società
- art. 2381 - Presidente
- art. 2383 - Nomina e revoca degli amministratori
- art. 2386 *(ora abrogato)*
- art. 2388 - Validità delle deliberazioni del consiglio
- art. 2389 - Compensi degli amministratori
- art. 2390 - Divieto di concorrenza
- art. 2391 - Interessi degli amministratori
- art. 2391-bis - Operazioni con parti correlate
- art. 2392 - Responsabilità verso la società
- art. 2393 - Azione sociale di responsabilità
- art. 2393-bis - Azione sociale di responsabilità esercitata dai soci
- art. 2394-bis - Azioni di responsabilità nelle procedure concorsuali
- art. 2397 - Collegio sindacale
- art. 2399 - Cause d'ineleggibilità e di decadenza *(ora abrogato)*
- art. 2403 - Controllo contabile
- art. 2403-bis - Poteri del collegio sindacale
- art. 2404 - Partecipazione alle riunioni del collegio sindacale
- art. 2406 - Omissioni degli amministratori *(ora abrogato)*
- art. 2407 - Responsabilità
- art. 2408 *(ora abrogato)*
- art. 2409 *(ora abrogato)*
- art. 2409-bis - Revisione legale dei conti *(ora abrogato)*
- art. 2409-octies *(ora abrogato)*
- art. 2409-novies - Consiglio di gestione
- art. 2409-decies - Azione sociale di responsabilità
- art. 2409-undecies *(ora abrogato)*
- art. 2409-duodecies - Consiglio di sorveglianza
- art. 2409-terdecies - Competenza del consiglio di sorveglianza
- art. 2409-quaterdecies - Delibera di approvazione del bilancio di esercizio
- art. 2409-quinquiesdecies - Revisione legale dei conti
- art. 2409-sexiesdecies *(ora abrogato)*
- art. 2409-septiesdecies - Consiglio di amministrazione
- art. 2409-octiesdecies - Comitato per il controllo sulla gestione
- art. 2409-noviesdecies - Revisione legale dei conti
- art. 2506.1 - Scissione mediante scorporo
- art. 2506-bis - Progetto di scissione
- art. 2506-ter - Norme applicabili
- art. 2510-bis - Trasferimento della sede all'estero
- art. 2637 - Aggiotaggio
- art. 2648 - Accettazione di eredità e acquisto di legato
- art. 2652 - Domande riguardanti atti soggetti a trascrizione. Effetti delle relative trascrizioni rispetto ai terzi
- art. 2690 - Domande relative ad atti soggetti a trascrizione

**Articoli eliminati dalla banca dati (0):** nessuno

### Codice di Procedura Civile (c.p.c.) - modifiche dal 2024-12-01 al 2026-02-20

**Atti modificativi:** D.L. 8 agosto 2025, n. 117 (efficacia dal 2025-08-08); L. 23 settembre 2025, n. 132 (efficacia dal 2025-09-25); L. 3 ottobre 2025, n. 148 (efficacia dal 2025-10-07); D.L. 19 febbraio 2026, n. 19 (efficacia dal 2026-02-19)

**Articoli nuovi (0):**
- nessuno

**Articoli modificati (7):**
- art. 7 - Competenza del giudice di pace
- art. 9 - Competenza del tribunale
- art. 445-bis - Accertamento tecnico preventivo obbligatorio
- art. 696 - Accertamento tecnico e ispezione giudiziale
- art. 696-bis - Consulenza tecnica preventiva ai fini della composizione della lite
- art. 764 - Opposizione
- art. 765 - Ufficiale procedente

**Articoli eliminati dalla banca dati (0):** nessuno

### Codice Penale (c.p.) - modifiche dal 2026-05-20 al 2026-09-30

**Atti modificativi:** atto modificativo con efficacia dal 2026-06-24 (estremi non indicati nel file Normattiva); D.Lgs. 12 giugno 2026, n. 115 (efficacia dal 2026-07-01); D.Lgs. 9 settembre 2026, n. 160 (efficacia dal 2026-09-15)

**Articoli nuovi (10):**
- art. 437-bis - Omessa adozione di misure di sicurezza nei sistemi di intelligenza artificiale e alterazione illecita dei sistemi
- art. 452-bis.1 - Commercio di prodotti inquinanti
- art. 452-quinquiesdecies - Nozione di abusività
- art. 452-sexiesdecies - Circostanze aggravanti
- art. 517-sexies - Frode alimentare
- art. 517-septies - Commercio di alimenti con segni mendaci
- art. 517-octies - Pena accessoria e circostanze aggravanti
- art. 518.1 - Ulteriori pene accessorie
- art. 518.2 - Confisca obbligatoria e per equivalente
- art. 601.1 - Approfittamento della vittima di riduzione in schiavitù o di tratta

**Articoli modificati (14):**
- art. 32-quater - Casi nei quali alla condanna consegue l'incapacità di contrattare con la pubblica amministrazione
- art. 240-bis - Confisca in casi particolari
- art. 452-bis - Inquinamento ambientale
- art. 452-ter - Morte o lesioni come conseguenza del delitto di inquinamento ambientale e di commercio di prodotti inquinanti
- art. 516 *(ora abrogato)*
- art. 517-bis *(ora abrogato)*
- art. 517-quater - Contraffazione dei segni di indicazione geografica e di denominazione protetta dei prodotti agroalimentari
- art. 517-quinquies - Circostanza attenuante
- art. 518 - Pubblicazione della sentenza
- art. 600 - Riduzione o mantenimento in schiavitù o in servitù
- art. 601 - Tratta di persone
- art. 602-ter - Circostanze aggravanti
- art. 609-decies - Comunicazione al tribunale per i minorenni
- art. 733-bis *(ora abrogato)*

**Articoli eliminati dalla banca dati (0):** nessuno

### Codice di Procedura Penale (c.p.p.) - modifiche dal 2026-05-20 al 2026-09-30

**Atti modificativi:** D.L. 12 giugno 2026, n. 100 (efficacia dal 2026-06-12); atto modificativo con efficacia dal 2026-07-22 (estremi non indicati nel file Normattiva); L. 17 luglio 2026, n. 131 (efficacia dal 2026-07-25); L. 5 agosto 2026, n. 140 (efficacia dal 2026-08-06); D.Lgs. 9 settembre 2026, n. 160 (efficacia dal 2026-09-15); D.L. 29 settembre 2026, n. 168 (efficacia dal 2026-09-29)

**Articoli nuovi (1):**
- art. 359-ter - Identificazione e localizzazione mediante sistemi di intelligenza artificiale per l'identificazione biometrica remota in tempo reale

**Articoli modificati (9):**
- art. 246 - Ispezione di luoghi o di cose
- art. 260 - Apposizione dei sigilli alle cose sequestrate. Cose deperibili. Distruzione di cose sequestrate
- art. 266 - Limiti di ammissibilità
- art. 292 - Ordinanza del giudice
- art. 299 - Revoca e sostituzione delle misure
- art. 347 - Obbligo di riferire la notizia del reato
- art. 371-bis - Attività di coordinamento del procuratore nazionale antimafia e antiterrorismo)
- art. 392 - Casi
- art. 656 - Esecuzione delle pene detentive

**Articoli eliminati dalla banca dati (0):** nessuno

### Codice della Strada (C.d.S.) - modifiche dal 2026-05-26 al 2026-04-25

**Atti modificativi:** nessuno

**Articoli nuovi (0):**
- nessuno

**Articoli modificati (0):**
- nessuno

**Articoli eliminati dalla banca dati (0):** nessuno

