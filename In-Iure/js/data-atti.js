/* data-atti.js - formulario base (revisionato ottobre 2026) */
var ATTI = [
 {
  "id": "atto-citazione",
  "nome": "Atto di citazione",
  "categoria": "Civile - Cognizione",
  "descrizione": "Atto introduttivo del giudizio ordinario di cognizione dinanzi al Tribunale (artt. 163 ss. c.p.c.).",
  "guida": "L'atto di citazione e' l'atto introduttivo del giudizio ordinario di cognizione. Contiene due parti essenziali: la vocatio in ius (chiamata in giudizio del convenuto) e l'editio actionis (esposizione della domanda).\n\nDeve contenere gli elementi dell'art. 163, comma 3, c.p.c. (sono causa di NULLITA' ex art. 164 c.p.c. l'omissione o l'assoluta incertezza dei nn. 1, 2, 3 e 4, la mancanza della data dell'udienza, l'assegnazione di un termine a comparire inferiore a quello di legge e la mancanza dell'avvertimento del n. 7):\n- l'indicazione del tribunale (n. 1);\n- nome, cognome, residenza e codice fiscale dell'attore, nome, cognome, C.F. e residenza del convenuto (n. 2);\n- la determinazione della cosa oggetto della domanda - petitum (n. 3);\n- l'indicazione, nei casi in cui la domanda e' soggetta a condizione di procedibilita', dell'assolvimento degli oneri previsti per il suo superamento (n. 3-bis);\n- l'esposizione in modo chiaro e specifico dei fatti e degli elementi di diritto costituenti le ragioni della domanda - causa petendi, con le relative conclusioni (n. 4);\n- l'indicazione specifica dei mezzi di prova e dei documenti offerti (n. 5);\n- nome e cognome del procuratore e la procura (n. 6);\n- la data dell'udienza di comparizione, l'invito a costituirsi nel termine di settanta giorni prima dell'udienza ai sensi dell'art. 166 e a comparire dinanzi al giudice designato ex art. 168-bis, con l'AVVERTIMENTO (n. 7) che la costituzione oltre i termini implica le decadenze di cui agli artt. 38 e 167, che la difesa tecnica mediante avvocato e' obbligatoria in tutti i giudizi davanti al tribunale (salvi i casi dell'art. 86 o di leggi speciali) e che la parte, sussistendone i presupposti, puo' chiedere l'ammissione al patrocinio a spese dello Stato.\n\nDopo la Riforma Cartabia (d.lgs. 149/2022) il termine a comparire e' di almeno CENTOVENTI giorni (art. 163-bis c.p.c.). E' opportuno indicare l'avvenuto (o non dovuto) espletamento della mediazione/negoziazione assistita nelle materie di condizione di procedibilita'.\n\nAvvertenze pratiche:\n- notificare l'atto con congruo anticipo rispetto all'udienza;\n- allegare la procura e i documenti offerti in comunicazione;\n- curare la chiarezza e sinteticita' ex art. 121 c.p.c.",
  "campi": [
   {
    "id": "tribunale",
    "label": "Tribunale competente",
    "type": "text",
    "placeholder": "es. Tribunale di Napoli"
   },
   {
    "id": "attore",
    "label": "Attore (nome, dati anagrafici, C.F., residenza)",
    "type": "textarea",
    "placeholder": "Tizio Rossi, nato a ... il ..., C.F. ..., residente in ..."
   },
   {
    "id": "difensore",
    "label": "Difensore e procura",
    "type": "textarea",
    "placeholder": "rappresentato e difeso dall'Avv. ..., C.F. ..., giusta procura ..."
   },
   {
    "id": "convenuto",
    "label": "Convenuto (nome e dati)",
    "type": "textarea",
    "placeholder": "Caio Bianchi, nato a ..., C.F. ..., residente in ..."
   },
   {
    "id": "fatto",
    "label": "Esposizione dei fatti",
    "type": "textarea",
    "placeholder": "Ricostruzione cronologica della vicenda..."
   },
   {
    "id": "diritto",
    "label": "Motivi di diritto",
    "type": "textarea",
    "placeholder": "Norme e principi a fondamento della domanda..."
   },
   {
    "id": "conclusioni",
    "label": "Conclusioni",
    "type": "textarea",
    "placeholder": "Voglia il Tribunale, ogni contraria istanza respinta, ..."
   },
   {
    "id": "udienza",
    "label": "Data udienza di comparizione",
    "type": "text",
    "placeholder": "es. 15 marzo 2027, ore di rito"
   },
   {
    "id": "luogo_data",
    "label": "Luogo e data",
    "type": "text",
    "placeholder": "es. Napoli, 3 luglio 2026"
   }
  ],
  "template": "TRIBUNALE ORDINARIO DI {{tribunale}}\n\nATTO DI CITAZIONE\n\nPER: {{attore}}\n{{difensore}}\n- attore -\n\nCONTRO: {{convenuto}}\n- convenuto -\n\n* * *\n\nPREMESSO IN FATTO\n\n{{fatto}}\n\nRAGIONI DI DIRITTO\n\n{{diritto}}\n\nTutto cio' premesso, l'attore come sopra rappresentato e difeso\n\nCITA\n\nil sig. {{convenuto}} a comparire dinanzi al Tribunale di {{tribunale}}, all'udienza del {{udienza}}, dinanzi al Giudice designato ai sensi dell'art. 168-bis c.p.c., con invito a costituirsi nel termine di settanta giorni prima di detta udienza ai sensi e nelle forme stabilite dall'art. 166 c.p.c., con l'espresso AVVERTIMENTO che la costituzione oltre il suddetto termine implica le decadenze di cui agli artt. 38 e 167 c.p.c., che la difesa tecnica mediante avvocato e' obbligatoria in tutti i giudizi davanti al tribunale, fatta eccezione per i casi previsti dall'art. 86 c.p.c. o da leggi speciali, che la parte, sussistendone i presupposti di legge, puo' presentare istanza per l'ammissione al patrocinio a spese dello Stato, e che in difetto di costituzione si procedera' in sua legale contumacia, per ivi sentir accogliere le seguenti\n\nCONCLUSIONI\n\n{{conclusioni}}\n\nIn via istruttoria si producono i documenti in comunicazione e ci si riserva ogni ulteriore deduzione e produzione nei termini di legge.\n\nAi fini del contributo unificato si dichiara il valore della causa come da conclusioni.\n\n{{luogo_data}}\n\nAvv. ______________________\n\n* * *\nRELATA DI NOTIFICA\n(a cura dell'ufficiale giudiziario / notifica a mezzo PEC ai sensi della L. 53/1994)"
 },
 {
  "id": "comparsa-costituzione-risposta",
  "nome": "Comparsa di costituzione e risposta",
  "categoria": "Civile - Cognizione",
  "descrizione": "Atto difensivo con cui il convenuto si costituisce in giudizio (art. 167 c.p.c.).",
  "guida": "La comparsa di costituzione e risposta e' l'atto con cui il convenuto si costituisce in giudizio e prende posizione sulla domanda attorea. Deve essere depositata almeno SETTANTA giorni prima dell'udienza indicata in citazione (art. 166 c.p.c.), termine perentorio.\n\nAi sensi dell'art. 167 c.p.c. il convenuto deve, A PENA DI DECADENZA:\n- proporre le eventuali domande RICONVENZIONALI;\n- sollevare le eccezioni processuali e di merito NON rilevabili d'ufficio;\n- dichiarare, a pena di decadenza, di voler chiamare un terzo in causa (con contestuale richiesta di spostamento dell'udienza).\n\nDeve inoltre:\n- prendere posizione in modo chiaro e specifico sui fatti posti dall'attore a fondamento della domanda (onere di contestazione specifica ex art. 115 c.p.c.: i fatti non contestati si considerano provati);\n- proporre tutte le difese ed indicare i mezzi di prova e i documenti (salvo le successive facolta' ex art. 171-ter c.p.c.).\n\nStruttura tipica:\n- intestazione e costituzione del convenuto con procura;\n- posizione sui fatti (contestazioni specifiche);\n- eccezioni e difese in diritto;\n- eventuale domanda riconvenzionale;\n- conclusioni;\n- istanze istruttorie.\n\nAvvertenze: le preclusioni sono rigorose; la mancata contestazione e la tardiva proposizione di eccezioni non rilevabili d'ufficio precludono difese successive. Le domande riconvenzionali e le eccezioni processuali vanno formulate necessariamente in questa sede.",
  "campi": [
   {
    "id": "tribunale",
    "label": "Tribunale",
    "type": "text",
    "placeholder": "es. Tribunale di Roma"
   },
   {
    "id": "rg",
    "label": "Numero di R.G.",
    "type": "text",
    "placeholder": "es. R.G. n. 1234/2026"
   },
   {
    "id": "convenuto",
    "label": "Convenuto costituito (nome e dati)",
    "type": "textarea",
    "placeholder": "Caio Bianchi, nato a ..., C.F. ..., residente ..."
   },
   {
    "id": "difensore",
    "label": "Difensore e procura",
    "type": "textarea",
    "placeholder": "rappresentato e difeso dall'Avv. ..., giusta procura ..."
   },
   {
    "id": "attore",
    "label": "Attore (contro cui ci si costituisce)",
    "type": "text",
    "placeholder": "Tizio Rossi"
   },
   {
    "id": "posizione_fatti",
    "label": "Posizione sui fatti (contestazioni)",
    "type": "textarea",
    "placeholder": "Si contesta specificamente quanto dedotto ex adverso in ordine a..."
   },
   {
    "id": "difese_diritto",
    "label": "Difese ed eccezioni in diritto",
    "type": "textarea",
    "placeholder": "Eccezione di prescrizione, difetto di legittimazione, ecc."
   },
   {
    "id": "riconvenzionale",
    "label": "Domanda riconvenzionale (eventuale)",
    "type": "textarea",
    "placeholder": "In via riconvenzionale si chiede..."
   },
   {
    "id": "conclusioni",
    "label": "Conclusioni",
    "type": "textarea",
    "placeholder": "Voglia il Tribunale rigettare la domanda attorea..."
   },
   {
    "id": "luogo_data",
    "label": "Luogo e data",
    "type": "text",
    "placeholder": "es. Roma, 3 luglio 2026"
   }
  ],
  "template": "TRIBUNALE ORDINARIO DI {{tribunale}}\n{{rg}}\n\nCOMPARSA DI COSTITUZIONE E RISPOSTA\n(art. 167 c.p.c.)\n\nPER: {{convenuto}}\n{{difensore}}\n- convenuto -\n\nNEL GIUDIZIO promosso da {{attore}}\n- attore -\n\n* * *\n\nSi costituisce in giudizio il convenuto, in persona come sopra rappresentato e difeso, e contesta integralmente la domanda avversaria in quanto infondata in fatto e in diritto, per i seguenti motivi.\n\nSUI FATTI\n\n{{posizione_fatti}}\n\nIN DIRITTO - DIFESE ED ECCEZIONI\n\n{{difese_diritto}}\n\nDOMANDA RICONVENZIONALE\n\n{{riconvenzionale}}\n\nTutto cio' premesso, il convenuto come sopra rappresentato e difeso\n\nCHIEDE\n\nche l'Ill.mo Tribunale adito, contrariis reiectis, voglia cosi' provvedere:\n\n{{conclusioni}}\n\nIn via istruttoria si producono i documenti in comunicazione e ci si riserva ogni ulteriore deduzione e prova nei termini di cui all'art. 171-ter c.p.c.\n\nCon vittoria di spese, competenze ed onorari di lite.\n\n{{luogo_data}}\n\nAvv. ______________________"
 },
 {
  "id": "ricorso-decreto-ingiuntivo",
  "nome": "Ricorso per decreto ingiuntivo",
  "categoria": "Civile - Cognizione",
  "descrizione": "Ricorso per l'emissione di ingiunzione di pagamento o consegna (artt. 633 ss. c.p.c.).",
  "guida": "Il ricorso per decreto ingiuntivo introduce il procedimento monitorio, volto ad ottenere un provvedimento (decreto) che ingiunge il pagamento di una somma o la consegna di una cosa determinata. E' proposto con RICORSO al giudice competente (Giudice di Pace o Tribunale in composizione monocratica) secondo il valore.\n\nPresupposti (art. 633 c.p.c.):\n- credito avente ad oggetto una somma liquida ed esigibile di denaro o una determinata quantita' di cose fungibili;\n- prova scritta del credito (art. 634 c.p.c.): polizze, promesse unilaterali, telegrammi, e per gli imprenditori estratti autentici delle scritture contabili e delle fatture.\n\nRequisiti dell'atto:\n- indicazione del giudice, delle parti, del credito e del suo ammontare;\n- esposizione dei fatti e dei documenti a prova del credito;\n- la richiesta di ingiunzione con l'indicazione delle somme per capitale, interessi e spese;\n- la richiesta della provvisoria esecutorieta' ex art. 642 c.p.c. ove ricorrano i presupposti (credito fondato su cambiale, assegno bancario o circolare, certificato di liquidazione di borsa o atto ricevuto da notaio o da altro pubblico ufficiale autorizzato; ovvero pericolo di grave pregiudizio nel ritardo o produzione di documentazione sottoscritta dal debitore comprovante il diritto fatto valere).\n\nIl decreto ingiunge il pagamento entro QUARANTA giorni con l'avvertimento che entro lo stesso termine puo' essere proposta opposizione (art. 641 c.p.c.) e che, in mancanza, si procedera' ad esecuzione forzata.\n\nAvvertenze:\n- allegare in originale/copia autentica i documenti probatori (fatture, estratti conto, contratti);\n- per i crediti dei professionisti, allegare la parcella con parere di congruita' dell'ordine ove richiesto;\n- valutare la richiesta di provvisoria esecuzione.",
  "campi": [
   {
    "id": "giudice",
    "label": "Giudice competente",
    "type": "text",
    "placeholder": "es. Tribunale di Milano"
   },
   {
    "id": "ricorrente",
    "label": "Ricorrente/creditore (dati)",
    "type": "textarea",
    "placeholder": "Alfa S.r.l., P.IVA ..., con sede in ..., in persona del legale rappr. ..."
   },
   {
    "id": "difensore",
    "label": "Difensore e procura",
    "type": "textarea",
    "placeholder": "rappresentata e difesa dall'Avv. ..., giusta procura ..."
   },
   {
    "id": "debitore",
    "label": "Debitore/ingiungendo (dati)",
    "type": "textarea",
    "placeholder": "Beta S.r.l., P.IVA ..., con sede in ..."
   },
   {
    "id": "credito",
    "label": "Fatti e titolo del credito",
    "type": "textarea",
    "placeholder": "In forza di contratto/fatture n. ... il ricorrente vanta un credito di euro..."
   },
   {
    "id": "importo",
    "label": "Importo capitale",
    "type": "text",
    "placeholder": "es. euro 15.000,00"
   },
   {
    "id": "documenti",
    "label": "Documenti a prova del credito",
    "type": "textarea",
    "placeholder": "1) fattura n. ...; 2) estratto scritture contabili; 3) contratto..."
   },
   {
    "id": "esecutivita",
    "label": "Richiesta di provvisoria esecutorieta' (eventuale)",
    "type": "textarea",
    "placeholder": "Ricorrendo i presupposti ex art. 642 c.p.c. in quanto il credito e' fondato su..."
   },
   {
    "id": "luogo_data",
    "label": "Luogo e data",
    "type": "text",
    "placeholder": "es. Milano, 3 luglio 2026"
   }
  ],
  "template": "ILL.MO {{giudice}}\n\nRICORSO PER DECRETO INGIUNTIVO\n(artt. 633 e ss. c.p.c.)\n\nPER: {{ricorrente}}\n{{difensore}}\n- ricorrente -\n\nCONTRO: {{debitore}}\n- debitore ingiungendo -\n\n* * *\n\nESPONE QUANTO SEGUE\n\n{{credito}}\n\nIl credito, pari a {{importo}}, oltre interessi e spese, e' certo, liquido ed esigibile ed e' documentalmente provato ai sensi degli artt. 633 e 634 c.p.c. dai seguenti documenti che si producono:\n\n{{documenti}}\n\nRICHIESTA DI PROVVISORIA ESECUTORIETA'\n\n{{esecutivita}}\n\nTutto cio' premesso, il ricorrente come sopra rappresentato e difeso\n\nCHIEDE\n\nche l'Ill.mo Giudice adito, ritenuti sussistenti i presupposti di legge, voglia ingiungere a {{debitore}} di pagare al ricorrente la somma di {{importo}}, oltre interessi ex D.Lgs. 231/2002 (o interessi legali) dalla scadenza al saldo, oltre spese, competenze ed onorari della presente procedura come da nota, con termine di quaranta giorni per il pagamento e per l'eventuale opposizione ai sensi dell'art. 641 c.p.c., con espressa richiesta di concessione della provvisoria esecutorieta' ex art. 642 c.p.c.\n\nSi deposita fascicolo con i documenti indicati. Ai fini del contributo unificato si dichiara il valore di {{importo}}.\n\n{{luogo_data}}\n\nAvv. ______________________"
 },
 {
  "id": "atto-appello",
  "nome": "Atto di appello",
  "categoria": "Civile - Cognizione",
  "descrizione": "Impugnazione della sentenza di primo grado dinanzi alla Corte d'Appello o al Tribunale (art. 342 c.p.c.).",
  "guida": "L'atto di appello e' l'impugnazione con cui si chiede la riforma, totale o parziale, della sentenza di primo grado. Ha forma di CITAZIONE (nel rito ordinario) e va proposto alla Corte d'Appello competente (o al Tribunale per le sentenze del Giudice di Pace).\n\nTERMINI: appello entro trenta giorni dalla notificazione della sentenza (termine breve, art. 325 c.p.c.), ovvero entro sei mesi dalla pubblicazione (termine lungo, art. 327 c.p.c.).\n\nA PENA DI INAMMISSIBILITA' (art. 342 c.p.c., come riformato dal d.lgs. 149/2022) l'appello deve essere motivato e deve indicare, in modo CHIARO, SINTETICO e SPECIFICO:\n- i capi della decisione che vengono impugnati;\n- le censure proposte alla ricostruzione dei fatti compiuta dal giudice di primo grado;\n- le violazioni di legge denunciate e la loro rilevanza ai fini della decisione impugnata.\n\nOccorre inoltre rispettare l'art. 345 c.p.c. sul DIVIETO di NOVA: non possono proporsi nuove domande ne', di regola, nuove eccezioni non rilevabili d'ufficio; nuovi mezzi di prova e documenti non sono ammessi salvo che la parte dimostri di non aver potuto proporli nel giudizio di primo grado per causa ad essa non imputabile.\n\nAvvertenze:\n- riprodurre l'avvertimento ex art. 163, terzo comma, n. 7, c.p.c. e rispettare i termini liberi a comparire di novanta giorni (centocinquanta se la notificazione si esegue all'estero) previsti dall'art. 342, secondo comma, c.p.c.; l'appellato si costituisce almeno venti giorni prima dell'udienza (art. 347 c.p.c.);\n- individuare con precisione i capi impugnati per superare il filtro di ammissibilita';\n- l'eventuale istanza di sospensione dell'efficacia esecutiva ex art. 283 c.p.c. va proposta con l'atto di appello (successivamente solo per mutamenti nelle circostanze).",
  "campi": [
   {
    "id": "corte",
    "label": "Corte d'Appello / Giudice ad quem",
    "type": "text",
    "placeholder": "es. Corte d'Appello di Napoli"
   },
   {
    "id": "appellante",
    "label": "Appellante (dati e difensore)",
    "type": "textarea",
    "placeholder": "Tizio Rossi, ..., rappresentato e difeso dall'Avv. ..."
   },
   {
    "id": "appellato",
    "label": "Appellato (dati)",
    "type": "textarea",
    "placeholder": "Caio Bianchi, ..., residente in ..."
   },
   {
    "id": "sentenza",
    "label": "Sentenza impugnata (estremi)",
    "type": "textarea",
    "placeholder": "Sentenza del Tribunale di ... n. .../2026, pubblicata il ..., notificata il ..."
   },
   {
    "id": "capi_impugnati",
    "label": "Capi impugnati e motivi di appello",
    "type": "textarea",
    "placeholder": "PRIMO MOTIVO - Erronea valutazione delle prove sul capo relativo a..."
   },
   {
    "id": "conclusioni",
    "label": "Conclusioni (riforma richiesta)",
    "type": "textarea",
    "placeholder": "In riforma della sentenza impugnata, Voglia la Corte..."
   },
   {
    "id": "udienza",
    "label": "Data udienza di comparizione",
    "type": "text",
    "placeholder": "es. 10 aprile 2027"
   },
   {
    "id": "luogo_data",
    "label": "Luogo e data",
    "type": "text",
    "placeholder": "es. Napoli, 3 luglio 2026"
   }
  ],
  "template": "CORTE D'APPELLO DI {{corte}}\n\nATTO DI CITAZIONE IN APPELLO\n(art. 342 c.p.c.)\n\nPER: {{appellante}}\n- appellante -\n\nCONTRO: {{appellato}}\n- appellato -\n\nAVVERSO la seguente sentenza:\n{{sentenza}}\n\n* * *\n\nSVOLGIMENTO DEL PROCESSO DI PRIMO GRADO\n\nCon la sentenza in epigrafe il Giudice di primo grado ha statuito come in atti. La decisione e' ingiusta ed errata e va riformata per i motivi che seguono, con impugnazione dei capi qui di seguito specificamente indicati.\n\nMOTIVI DI APPELLO\n\n{{capi_impugnati}}\n\nTutto cio' premesso, l'appellante come sopra rappresentato e difeso\n\nCITA\n\n{{appellato}} a comparire dinanzi alla Corte d'Appello di {{corte}}, all'udienza del {{udienza}}, con invito a costituirsi almeno venti giorni prima dell'udienza indicata ai sensi dell'art. 347 c.p.c., con l'AVVERTIMENTO che la costituzione oltre il suddetto termine implica le decadenze di cui agli artt. 38 e 167 c.p.c. e, quanto all'appello incidentale, quella di cui all'art. 343 c.p.c., che la difesa tecnica mediante avvocato e' obbligatoria e che la parte, sussistendone i presupposti di legge, puo' presentare istanza per l'ammissione al patrocinio a spese dello Stato, e che in difetto si procedera' in contumacia, per ivi sentir accogliere le seguenti\n\nCONCLUSIONI\n\n{{conclusioni}}\n\nCon vittoria di spese di entrambi i gradi di giudizio.\n\nSi depositano copia autentica della sentenza impugnata, il fascicolo di primo grado e i documenti in comunicazione.\n\n{{luogo_data}}\n\nAvv. ______________________"
 },
 {
  "id": "ricorso-281-decies",
  "nome": "Ricorso ex art. 281-decies c.p.c. (rito semplificato)",
  "categoria": "Civile - Cognizione",
  "descrizione": "Atto introduttivo del procedimento semplificato di cognizione dinanzi al Tribunale (artt. 281-decies ss. c.p.c.).",
  "guida": "Il rito semplificato di cognizione (artt. 281-decies e ss. c.p.c., introdotto dal d.lgs. 149/2022) sostituisce il previgente procedimento sommario ex art. 702-bis. Si introduce con RICORSO ed e' utilizzabile quando i fatti di causa non sono controversi, oppure la domanda e' fondata su prova documentale o di pronta soluzione, ovvero richiede un'istruzione non complessa.\n\nIl ricorso deve contenere (art. 281-undecies, comma 1, che richiama l'art. 163, comma 3, nn. 1, 2, 3, 3-bis, 4, 5 e 6 c.p.c., oltre all'avvertimento sulle decadenze, sull'obbligatorieta' della difesa tecnica e sulla facolta' di chiedere il patrocinio a spese dello Stato):\n- l'indicazione del tribunale;\n- le parti e i loro dati;\n- il petitum (oggetto della domanda);\n- l'esposizione CHIARA e SPECIFICA dei fatti e degli elementi di diritto (causa petendi) con le conclusioni;\n- l'indicazione SPECIFICA dei mezzi di prova e dei documenti;\n- il difensore e la procura.\n\nIl giudice fissa con decreto l'udienza di comparizione delle parti, assegnando il termine per la costituzione del convenuto (che deve avvenire non oltre DIECI giorni prima dell'udienza); il ricorso e il decreto sono notificati a cura dell'attore con termini liberi non minori di quaranta giorni (sessanta se la notificazione si esegue all'estero). Il convenuto, a pena di decadenza, deve proporre eventuali domande riconvenzionali, chiamate di terzo ed eccezioni non rilevabili d'ufficio.\n\nAvvertenze:\n- verificare l'idoneita' della controversia al rito semplificato (istruzione non complessa); il giudice puo' disporre il passaggio al rito ordinario ex art. 281-duodecies;\n- allegare tempestivamente i documenti e indicare i mezzi di prova, poiche' i termini istruttori sono ridotti;\n- osservare le condizioni di procedibilita' (mediazione/negoziazione assistita) ove previste.",
  "campi": [
   {
    "id": "tribunale",
    "label": "Tribunale competente",
    "type": "text",
    "placeholder": "es. Tribunale di Torino"
   },
   {
    "id": "ricorrente",
    "label": "Ricorrente (dati e difensore)",
    "type": "textarea",
    "placeholder": "Tizio Rossi, ..., rappresentato e difeso dall'Avv. ..., giusta procura ..."
   },
   {
    "id": "resistente",
    "label": "Resistente (dati)",
    "type": "textarea",
    "placeholder": "Caio Bianchi, ..., residente in ..."
   },
   {
    "id": "oggetto",
    "label": "Oggetto della domanda (petitum)",
    "type": "text",
    "placeholder": "es. pagamento della somma di euro ... / risoluzione contratto"
   },
   {
    "id": "fatto",
    "label": "Esposizione dei fatti",
    "type": "textarea",
    "placeholder": "Ricostruzione della vicenda, non controversa o di pronta soluzione..."
   },
   {
    "id": "diritto",
    "label": "Elementi di diritto",
    "type": "textarea",
    "placeholder": "Norme e principi a fondamento..."
   },
   {
    "id": "prove",
    "label": "Mezzi di prova e documenti",
    "type": "textarea",
    "placeholder": "Prova documentale; eventuale prova testimoniale sui capitoli..."
   },
   {
    "id": "conclusioni",
    "label": "Conclusioni",
    "type": "textarea",
    "placeholder": "Voglia il Tribunale accogliere..."
   },
   {
    "id": "luogo_data",
    "label": "Luogo e data",
    "type": "text",
    "placeholder": "es. Torino, 3 luglio 2026"
   }
  ],
  "template": "TRIBUNALE ORDINARIO DI {{tribunale}}\n\nRICORSO PER PROCEDIMENTO SEMPLIFICATO DI COGNIZIONE\n(artt. 281-decies e ss. c.p.c.)\n\nPER: {{ricorrente}}\n- ricorrente -\n\nCONTRO: {{resistente}}\n- resistente -\n\nOGGETTO: {{oggetto}}\n\n* * *\n\nIL RICORRENTE ESPONE\n\nIN FATTO\n\n{{fatto}}\n\nLa presente controversia e' idonea alla trattazione con rito semplificato ex art. 281-decies c.p.c., in quanto i fatti non sono controversi e/o la domanda e' fondata su prova documentale ovvero e' di pronta soluzione o richiede un'istruzione non complessa.\n\nIN DIRITTO\n\n{{diritto}}\n\nMEZZI DI PROVA E DOCUMENTI\n\n{{prove}}\n\nTutto cio' premesso, il ricorrente come sopra rappresentato e difeso\n\nCHIEDE\n\nche l'Ill.mo Tribunale, fissata con decreto l'udienza di comparizione ai sensi dell'art. 281-undecies c.p.c. con assegnazione al resistente del termine per costituirsi almeno dieci giorni prima dell'udienza e con l'avvertimento delle decadenze di legge, voglia, all'esito, cosi' provvedere:\n\n{{conclusioni}}\n\nCon vittoria di spese, competenze ed onorari di lite.\n\nAVVERTIMENTI (art. 281-undecies, primo comma, c.p.c.)\nSi avverte il resistente che la costituzione oltre il termine assegnato dal giudice implica le decadenze di cui all'art. 281-undecies, terzo e quarto comma, c.p.c., che la difesa tecnica mediante avvocato e' obbligatoria in tutti i giudizi davanti al tribunale, fatta eccezione per i casi previsti dall'art. 86 c.p.c. o da leggi speciali, e che la parte, sussistendone i presupposti di legge, puo' presentare istanza per l'ammissione al patrocinio a spese dello Stato.\n\nSi deposita fascicolo con i documenti indicati.\n\n{{luogo_data}}\n\nAvv. ______________________"
 },
 {
  "id": "diffida-adempiere",
  "nome": "Diffida ad adempiere con effetto risolutivo (art. 1454 c.c.)",
  "categoria": "Civile - ADR e stragiudiziale",
  "descrizione": "Intimazione scritta ad adempiere entro un termine con effetto risolutivo (art. 1454 c.c.).",
  "guida": "La diffida ad adempiere e' l'atto stragiudiziale con cui il creditore intima per iscritto al debitore inadempiente di adempiere la propria obbligazione entro un congruo termine, con dichiarazione che, decorso inutilmente il termine, il contratto si intendera' senz'altro RISOLTO (art. 1454 c.c.).\n\nRequisiti essenziali (art. 1454 c.c.):\n- forma SCRITTA (raccomandata A/R o PEC per la prova della ricezione);\n- intimazione ad adempiere;\n- fissazione di un termine congruo, non inferiore a QUINDICI giorni salvo diversa pattuizione o usi (il termine minore e' possibile se congruo per la natura del contratto);\n- dichiarazione espressa che, decorso il termine, il contratto si intendera' risolto di diritto.\n\nEffetti: alla scadenza del termine, in caso di persistente inadempimento, la risoluzione opera automaticamente (ipso iure), senza necessita' di pronuncia giudiziale, fatta salva la domanda di risarcimento del danno.\n\nLa diffida vale anche come atto di costituzione in mora ex art. 1219 c.c., con effetti sulla decorrenza degli interessi moratori e sul passaggio del rischio (perpetuatio obligationis).\n\nAvvertenze:\n- indicare con precisione l'obbligazione inadempiuta e il titolo (contratto);\n- calcolare un termine effettivamente congruo per evitare l'inefficacia della diffida;\n- inviare a mezzo PEC o raccomandata per costituire prova della data e della ricezione;\n- riservare espressamente il risarcimento del danno e ogni ulteriore azione.",
  "campi": [
   {
    "id": "mittente",
    "label": "Diffidante (creditore)",
    "type": "textarea",
    "placeholder": "Alfa S.r.l., con sede in ..., in persona del legale rappr. ..."
   },
   {
    "id": "destinatario",
    "label": "Diffidato (debitore)",
    "type": "textarea",
    "placeholder": "Sig. Caio Bianchi, residente in ... / PEC ..."
   },
   {
    "id": "contratto",
    "label": "Contratto/obbligazione di riferimento",
    "type": "textarea",
    "placeholder": "In forza del contratto di ... stipulato in data ..."
   },
   {
    "id": "inadempimento",
    "label": "Descrizione dell'inadempimento",
    "type": "textarea",
    "placeholder": "La S.V. non ha provveduto a ... nonostante..."
   },
   {
    "id": "prestazione",
    "label": "Prestazione richiesta",
    "type": "textarea",
    "placeholder": "il pagamento della somma di euro ... / la consegna di ..."
   },
   {
    "id": "termine",
    "label": "Termine per adempiere",
    "type": "text",
    "placeholder": "es. quindici (15) giorni dal ricevimento"
   },
   {
    "id": "luogo_data",
    "label": "Luogo e data",
    "type": "text",
    "placeholder": "es. Napoli, 3 luglio 2026"
   }
  ],
  "template": "{{mittente}}\n\nRaccomandata A/R anticipata a mezzo PEC\n\nSpett.le / Egr.\n{{destinatario}}\n\nOGGETTO: Diffida ad adempiere e contestuale costituzione in mora ex artt. 1454 e 1219 c.c.\n\n{{luogo_data}}\n\nLa presente in relazione a quanto segue.\n\n{{contratto}}\n\nRilevato che {{inadempimento}}.\n\nTutto cio' premesso, la scrivente, come sopra rappresentata,\n\nDIFFIDA E INTIMA\n\nla S.V. ad adempiere, entro e non oltre il termine di {{termine}} decorrente dal ricevimento della presente, alla seguente prestazione: {{prestazione}}.\n\nAi sensi e per gli effetti dell'art. 1454 c.c. si dichiara espressamente che, decorso inutilmente il predetto termine, il contratto si intendera' senz'altro RISOLTO DI DIRITTO, con ogni conseguenza di legge.\n\nLa presente vale altresi' quale formale COSTITUZIONE IN MORA ai sensi dell'art. 1219 c.c., con decorrenza degli interessi e salvi gli ulteriori effetti di legge.\n\nCon espressa riserva di agire in ogni sede per il risarcimento di tutti i danni subiti e subendi e per il recupero coattivo del credito.\n\nDistinti saluti.\n\n______________________\n(firma)"
 },
 {
  "id": "costituzione-in-mora",
  "nome": "Lettera di costituzione in mora e interruzione della prescrizione (artt. 1219 e 2943 c.c.)",
  "categoria": "Civile - ADR e stragiudiziale",
  "descrizione": "Intimazione scritta di pagamento con effetti costitutivi della mora del debitore (art. 1219 c.c.).",
  "guida": "La costituzione in mora e' l'atto con cui il creditore intima o richiede per iscritto al debitore l'adempimento dell'obbligazione (art. 1219 c.c.). E' l'atto tipico del recupero credito stragiudiziale.\n\nRequisiti:\n- forma SCRITTA (art. 1219, comma 1, c.c.);\n- intimazione o richiesta di adempimento rivolta al debitore.\n\nEffetti della costituzione in mora (mora debendi):\n- decorrenza degli INTERESSI MORATORI (art. 1224 c.c.);\n- passaggio del rischio per impossibilita' sopravvenuta a carico del debitore (perpetuatio obligationis, art. 1221 c.c.);\n- interruzione della PRESCRIZIONE ai sensi dell'art. 2943, ultimo comma, c.c. (l'atto di costituzione in mora interrompe la prescrizione e ne fa decorrere uno nuovo).\n\nNon e' necessaria la costituzione in mora quando (art. 1219, comma 2, c.c.): il debito deriva da fatto illecito; il debitore ha dichiarato per iscritto di non voler adempiere; e' scaduto il termine per la prestazione da eseguirsi al domicilio del creditore (mora ex re).\n\nAvvertenze:\n- inviare a mezzo PEC o raccomandata A/R per prova della ricezione e della data (rilevante per l'interruzione della prescrizione);\n- quantificare con precisione la somma dovuta, interessi e spese;\n- fissare un termine per il pagamento e riservare le azioni giudiziali.",
  "campi": [
   {
    "id": "mittente",
    "label": "Creditore",
    "type": "textarea",
    "placeholder": "Alfa S.r.l., con sede in ..., in persona del legale rappr. ... / Avv. ..."
   },
   {
    "id": "destinatario",
    "label": "Debitore",
    "type": "textarea",
    "placeholder": "Sig. Caio Bianchi, residente in ... / PEC ..."
   },
   {
    "id": "titolo",
    "label": "Titolo del credito",
    "type": "textarea",
    "placeholder": "In forza di fattura/contratto/mutuo del ..."
   },
   {
    "id": "importo",
    "label": "Importo dovuto",
    "type": "text",
    "placeholder": "es. euro 8.500,00 oltre interessi"
   },
   {
    "id": "termine",
    "label": "Termine per il pagamento",
    "type": "text",
    "placeholder": "es. dieci (10) giorni dal ricevimento"
   },
   {
    "id": "modalita",
    "label": "Modalita' di pagamento",
    "type": "textarea",
    "placeholder": "a mezzo bonifico bancario IBAN ..."
   },
   {
    "id": "luogo_data",
    "label": "Luogo e data",
    "type": "text",
    "placeholder": "es. Napoli, 3 luglio 2026"
   }
  ],
  "template": "{{mittente}}\n\nRaccomandata A/R / PEC\n\nSpett.le / Egr.\n{{destinatario}}\n\nOGGETTO: Costituzione in mora e intimazione di pagamento ex art. 1219 c.c. - Atto interruttivo della prescrizione ex art. 2943 c.c.\n\n{{luogo_data}}\n\nCon la presente, in nome e per conto della scrivente, si rappresenta quanto segue.\n\n{{titolo}}\n\nA fronte del predetto titolo la S.V. risulta debitrice della somma complessiva di {{importo}}, ad oggi non corrisposta nonostante i solleciti.\n\nTanto premesso, si\n\nINTIMA E SI COSTITUISCE IN MORA\n\nla S.V., ai sensi e per gli effetti dell'art. 1219 c.c., affinche' provveda al pagamento della somma di {{importo}}, oltre interessi maturati e maturandi fino al saldo, entro e non oltre il termine di {{termine}} decorrente dal ricevimento della presente, con le seguenti modalita': {{modalita}}.\n\nLa presente vale quale atto formale di costituzione in mora, con decorrenza degli interessi moratori ex art. 1224 c.c., e quale atto interruttivo della prescrizione ai sensi dell'art. 2943 c.c.\n\nSi avverte che, in difetto di riscontro nel termine indicato, si procedera' senz'altro all'azione giudiziale per il recupero coattivo del credito, con aggravio di spese e competenze legali a carico della S.V.\n\nCon riserva di ogni diritto ed azione.\n\nDistinti saluti.\n\n______________________\n(firma)"
 },
 {
  "id": "ricorso-separazione-consensuale",
  "nome": "Ricorso per separazione consensuale",
  "categoria": "Civile - Famiglia",
  "descrizione": "Ricorso congiunto dei coniugi per la separazione personale consensuale (art. 473-bis.51 c.p.c.).",
  "guida": "Il ricorso per separazione consensuale e' l'atto con cui entrambi i coniugi chiedono congiuntamente al Tribunale l'omologazione delle condizioni concordate per la loro separazione personale. Dopo la Riforma Cartabia il procedimento e' disciplinato nell'ambito del rito unitario per le persone, i minorenni e le famiglie (art. 473-bis.51 c.p.c.), con ricorso congiunto.\n\nContenuto del ricorso:\n- indicazione del Tribunale competente (luogo di residenza/domicilio di uno dei coniugi);\n- dati anagrafici dei coniugi e del difensore/i;\n- estremi dell'atto di matrimonio;\n- indicazione dei figli (minori, maggiorenni non autosufficienti, portatori di handicap);\n- le CONDIZIONI concordate: affidamento e collocamento dei figli, tempi di frequentazione, contributo al mantenimento dei figli e/o del coniuge, assegnazione della casa familiare, eventuali accordi patrimoniali;\n- le indicazioni relative alle disponibilita' reddituali e patrimoniali dell'ultimo triennio e agli oneri a carico delle parti; il ricorso e' sottoscritto anche dalle parti (art. 473-bis.51, comma 2, c.p.c.);\n- i documenti di cui all'art. 473-bis.12, comma 3, c.p.c. (dichiarazioni dei redditi ed estratti conto dell'ultimo triennio, documentazione su diritti reali e quote sociali) vanno depositati se le parti chiedono di sostituire l'udienza con note scritte (art. 473-bis.51, comma 3) e possono comunque essere richiesti dal giudice (comma 5).\n\nAvvertenze:\n- le condizioni relative ai figli sono soggette al controllo del Tribunale nell'interesse del minore (possibile modifica/rigetto);\n- e' possibile chiedere contestualmente separazione e, cumulativamente, lo scioglimento/cessazione degli effetti civili (divorzio) alle condizioni di legge;\n- in alternativa e' esperibile la negoziazione assistita (art. 6 d.l. 132/2014) o l'accordo innanzi all'ufficiale di stato civile.",
  "campi": [
   {
    "id": "tribunale",
    "label": "Tribunale competente",
    "type": "text",
    "placeholder": "es. Tribunale di Salerno"
   },
   {
    "id": "coniuge1",
    "label": "Primo coniuge (dati)",
    "type": "textarea",
    "placeholder": "Tizio Rossi, nato a ... il ..., C.F. ..., residente in ..."
   },
   {
    "id": "coniuge2",
    "label": "Secondo coniuge (dati)",
    "type": "textarea",
    "placeholder": "Caia Verdi, nata a ... il ..., C.F. ..., residente in ..."
   },
   {
    "id": "matrimonio",
    "label": "Estremi del matrimonio",
    "type": "textarea",
    "placeholder": "Matrimonio contratto in ... il ..., atto n. ... parte ... serie ..."
   },
   {
    "id": "figli",
    "label": "Figli (dati ed eta')",
    "type": "textarea",
    "placeholder": "Dal matrimonio sono nati: 1) ... nato il ...; 2) ..."
   },
   {
    "id": "condizioni",
    "label": "Condizioni concordate",
    "type": "textarea",
    "placeholder": "Affidamento condiviso; collocamento presso la madre; contributo di mantenimento euro ...; assegnazione casa familiare; tempi di visita..."
   },
   {
    "id": "difensori",
    "label": "Difensore/i e procura",
    "type": "textarea",
    "placeholder": "rappresentati e difesi dall'Avv. ..., giusta procura ..."
   },
   {
    "id": "luogo_data",
    "label": "Luogo e data",
    "type": "text",
    "placeholder": "es. Salerno, 3 luglio 2026"
   }
  ],
  "template": "TRIBUNALE ORDINARIO DI {{tribunale}}\nSezione per la famiglia e le persone\n\nRICORSO CONGIUNTO PER SEPARAZIONE CONSENSUALE\n(art. 473-bis.51 c.p.c.)\n\nI coniugi:\n{{coniuge1}}\ne\n{{coniuge2}}\n{{difensori}}\n\nESPONGONO\n\nche hanno contratto matrimonio come da seguenti estremi:\n{{matrimonio}}\n\nche dalla loro unione sono nati i seguenti figli:\n{{figli}}\n\nche, essendo venuta meno l'affectio coniugalis e non essendo piu' possibile la prosecuzione della convivenza, hanno concordato di separarsi consensualmente, disciplinando i propri rapporti personali e patrimoniali e quelli con la prole alle condizioni di seguito indicate:\n\nCONDIZIONI DELLA SEPARAZIONE\n\n{{condizioni}}\n\nTutto cio' premesso, i coniugi ricorrenti, come sopra rappresentati e difesi,\n\nCHIEDONO\n\nche l'Ill.mo Tribunale adito, verificata la regolarita' degli accordi e la loro rispondenza all'interesse dei figli, voglia pronunciare la separazione personale consensuale dei coniugi alle condizioni sopra indicate, dando atto delle stesse ed omologando/recependo il presente accordo, con ogni conseguente statuizione di legge.\n\nSi allegano: estratto per riassunto dell'atto di matrimonio; stato di famiglia; dichiarazioni dei redditi degli ultimi tre anni di ciascun coniuge; (in presenza di figli minori) piano genitoriale.\n\n{{luogo_data}}\n\nAvv. ______________________"
 },
 {
  "id": "ricorso-414-lavoro",
  "nome": "Ricorso generico ex art. 414 c.p.c. (controversie di lavoro)",
  "categoria": "Lavoro - Cognizione",
  "descrizione": "Atto introduttivo delle controversie individuali di lavoro dinanzi al Tribunale in funzione di Giudice del Lavoro (art. 414 c.p.c.).",
  "guida": "Il ricorso ex art. 414 c.p.c. e' l'atto introduttivo del processo del lavoro (rito speciale, artt. 409 e ss. c.p.c.). Si deposita presso il Tribunale in funzione di Giudice del Lavoro competente per territorio ai sensi dell'art. 413 c.p.c. (luogo di costituzione del rapporto, di ubicazione dell'azienda o della dipendenza).\n\nA PENA DI NULLITA' (art. 414 c.p.c.) il ricorso deve contenere:\n1) l'indicazione del giudice;\n2) il nome, cognome, residenza/domicilio del ricorrente e del convenuto (per gli enti, denominazione e sede);\n3) la determinazione dell'oggetto della domanda (petitum);\n4) l'esposizione dei FATTI e degli elementi di DIRITTO sui quali si fonda la domanda, con le relative conclusioni;\n5) l'indicazione SPECIFICA dei mezzi di prova, in particolare dei documenti (da depositare) e dei testimoni con i relativi capitoli di prova e le generalita'.\n\nParticolarita' del rito del lavoro:\n- rigido sistema di PRECLUSIONI: le prove e i documenti vanno indicati e prodotti a pena di decadenza con il ricorso (art. 414 n. 5) e con la memoria di costituzione (art. 416);\n- il giudice fissa con decreto l'udienza di discussione; il convenuto deve costituirsi almeno DIECI giorni prima con memoria difensiva a pena di decadenza dalle eccezioni non rilevabili d'ufficio e dalle prove;\n- e' opportuno indicare l'eventuale esperimento del tentativo di conciliazione, ove obbligatorio.\n\nAvvertenze: massima cura nella formulazione dei capitoli di prova testimoniale e nell'allegazione documentale (buste paga, contratto, lettere di licenziamento), stante le preclusioni immediate.",
  "campi": [
   {
    "id": "tribunale",
    "label": "Tribunale - Giudice del Lavoro",
    "type": "text",
    "placeholder": "es. Tribunale di Bari, Sezione Lavoro"
   },
   {
    "id": "ricorrente",
    "label": "Ricorrente/lavoratore (dati e difensore)",
    "type": "textarea",
    "placeholder": "Tizio Rossi, ..., rappresentato e difeso dall'Avv. ..., giusta procura ..."
   },
   {
    "id": "resistente",
    "label": "Resistente/datore di lavoro (dati)",
    "type": "textarea",
    "placeholder": "Alfa S.p.A., con sede in ..., in persona del legale rappr. ..."
   },
   {
    "id": "oggetto",
    "label": "Oggetto della domanda",
    "type": "text",
    "placeholder": "es. impugnazione licenziamento / differenze retributive"
   },
   {
    "id": "fatto",
    "label": "Esposizione dei fatti",
    "type": "textarea",
    "placeholder": "Il ricorrente e' stato assunto in data ... con mansioni di ..."
   },
   {
    "id": "diritto",
    "label": "Elementi di diritto",
    "type": "textarea",
    "placeholder": "Violazione degli artt. ... c.c., del CCNL ..., della L. 300/1970..."
   },
   {
    "id": "prove",
    "label": "Mezzi di prova (documenti e testi con capitoli)",
    "type": "textarea",
    "placeholder": "Documenti: 1) contratto...; Testi: sig. ... sui capitoli: 1) Vero che..."
   },
   {
    "id": "conclusioni",
    "label": "Conclusioni",
    "type": "textarea",
    "placeholder": "Voglia il Giudice del Lavoro accertare... e condannare..."
   },
   {
    "id": "luogo_data",
    "label": "Luogo e data",
    "type": "text",
    "placeholder": "es. Bari, 3 luglio 2026"
   }
  ],
  "template": "TRIBUNALE ORDINARIO DI {{tribunale}}\nIn funzione di Giudice del Lavoro\n\nRICORSO EX ART. 414 c.p.c.\n\nPER: {{ricorrente}}\n- ricorrente -\n\nCONTRO: {{resistente}}\n- resistente -\n\nOGGETTO: {{oggetto}}\n\n* * *\n\nIL RICORRENTE, come sopra rappresentato e difeso, ESPONE QUANTO SEGUE\n\nIN FATTO\n\n{{fatto}}\n\nIN DIRITTO\n\n{{diritto}}\n\nMEZZI DI PROVA\n\nAi sensi dell'art. 414 n. 5 c.p.c. si indicano specificamente i seguenti mezzi di prova, con espressa riserva ai sensi di legge:\n{{prove}}\n\nTutto cio' premesso, il ricorrente\n\nCHIEDE\n\nche l'Ill.mo Giudice adito, fissata con decreto l'udienza di discussione e disposta la notifica al resistente con l'avvertimento di costituirsi almeno dieci giorni prima ai sensi dell'art. 416 c.p.c., voglia, ogni contraria istanza disattesa, cosi' provvedere:\n\n{{conclusioni}}\n\nCon vittoria di spese, competenze ed onorari, oltre accessori di legge.\n\nSi deposita fascicolo con i documenti indicati.\n\n{{luogo_data}}\n\nAvv. ______________________"
 },
 {
  "id": "denuncia-querela",
  "nome": "Denuncia-querela per reati procedibili a querela (artt. 336-337 c.p.p.)",
  "categoria": "Penale - Indagini e cautele",
  "descrizione": "Atto con cui la persona offesa manifesta la volonta' di perseguire il reato (artt. 336 e ss. c.p.p.).",
  "guida": "La querela e' la manifestazione di volonta', da parte della persona offesa dal reato, che si proceda in ordine a un fatto previsto dalla legge come reato perseguibile a querela (art. 336 c.p.p.). Spesso e' redatta come denuncia-querela, cumulando la notizia di reato (denuncia) e l'istanza di punizione (querela).\n\nRequisiti e regole:\n- TERMINE: la querela deve essere proposta, a pena di decadenza, entro TRE MESI dal giorno in cui la persona offesa ha avuto notizia del fatto costituente reato (art. 124 c.p.); per alcuni reati il termine e' diverso (es. dodici mesi per la violenza sessuale, art. 609-septies c.p.; sei mesi per gli atti persecutori, art. 612-bis c.p.);\n- FORMA: puo' essere proposta oralmente o per iscritto, personalmente o a mezzo procuratore speciale, e presentata a un ufficiale di P.G., al pubblico ministero o a un agente consolare (artt. 337 c.p.p.);\n- CONTENUTO: la descrizione del fatto, l'indicazione delle persone offese/danneggiate e, se noto, del presunto autore, gli elementi di prova disponibili;\n- deve contenere la MANIFESTAZIONE ESPRESSA della volonta' che si proceda penalmente;\n- nomina di difensore e, se del caso, dichiarazione di voler essere informati circa l'eventuale archiviazione (art. 408 c.p.p.).\n\nAvvertenze:\n- attenzione al rispetto del termine trimestrale (decorrenza dalla conoscenza del fatto e dell'autore);\n- la querela e' di regola RIMETTIBILE (art. 152 c.p.), salvi i casi di irrevocabilita' previsti dalla legge (es. art. 609-septies c.p.); la remissione non produce effetto solo se il querelato l'ha espressamente o tacitamente ricusata (art. 155 c.p.);\n- e' opportuno chiedere di essere avvisati della richiesta di archiviazione e dell'eventuale proroga delle indagini;\n- valutare l'eventuale costituzione di parte civile nel futuro processo.",
  "campi": [
   {
    "id": "autorita",
    "label": "Autorita' destinataria",
    "type": "text",
    "placeholder": "es. Ill.mo Procuratore della Repubblica presso il Tribunale di ... / Comando CC di ..."
   },
   {
    "id": "querelante",
    "label": "Querelante/persona offesa (dati)",
    "type": "textarea",
    "placeholder": "Tizio Rossi, nato a ... il ..., C.F. ..., residente in ..."
   },
   {
    "id": "querelato",
    "label": "Persona denunciata (se nota)",
    "type": "textarea",
    "placeholder": "Caio Bianchi, ... ovvero: soggetto ad oggi non identificato"
   },
   {
    "id": "fatto",
    "label": "Descrizione del fatto",
    "type": "textarea",
    "placeholder": "In data ..., presso ..., il denunciato ha ..."
   },
   {
    "id": "qualificazione",
    "label": "Qualificazione giuridica (eventuale)",
    "type": "text",
    "placeholder": "es. truffa ex art. 640 c.p., appropriazione indebita ex art. 646 c.p."
   },
   {
    "id": "prove",
    "label": "Elementi di prova e testimoni",
    "type": "textarea",
    "placeholder": "Si allegano: documenti ...; possono riferire i sigg. ..."
   },
   {
    "id": "luogo_data",
    "label": "Luogo e data",
    "type": "text",
    "placeholder": "es. Napoli, 3 luglio 2026"
   }
  ],
  "template": "{{autorita}}\n\nATTO DI DENUNCIA-QUERELA\n(artt. 336 e ss. c.p.p. - art. 124 c.p.)\n\nIl sottoscritto {{querelante}}\n\nESPONE QUANTO SEGUE\n\n{{fatto}}\n\nI fatti sopra descritti appaiono integrare la seguente ipotesi di reato: {{qualificazione}}, ed ogni altra fattispecie che l'Autorita' Giudiziaria ravvisera' nei fatti narrati.\n\nLa presente denuncia-querela e' proposta nei confronti di:\n{{querelato}}\n\nELEMENTI DI PROVA\n\n{{prove}}\n\nTutto cio' premesso, il sottoscritto\n\nSPORGE FORMALE DENUNCIA-QUERELA\n\nnei confronti delle persone sopra indicate e/o di ogni altro soggetto che risultera' responsabile dei fatti narrati, MANIFESTANDO ESPRESSAMENTE LA VOLONTA' CHE SI PROCEDA PENALMENTE nei loro confronti per i reati ravvisabili.\n\nChiede sin d'ora di essere informato ai sensi dell'art. 408 c.p.p. dell'eventuale richiesta di archiviazione e dichiara di volersi riservare la costituzione di parte civile per il risarcimento dei danni patiti.\n\nSi riserva la facolta' di nominare difensore di fiducia e di depositare ulteriore documentazione.\n\n{{luogo_data}}\n\n______________________\n(firma del querelante)"
 },
 {
  "id": "nomina-difensore-fiducia",
  "nome": "Nomina del difensore di fiducia nel procedimento penale (artt. 96 e 101 c.p.p.)",
  "categoria": "Penale - Difesa e memorie",
  "descrizione": "Atto di nomina del difensore di fiducia con contestuale istanza (artt. 96 e 99 c.p.p.).",
  "guida": "La nomina del difensore di fiducia e' l'atto con cui l'indagato/imputato (o la persona offesa) conferisce il mandato difensivo a un avvocato (art. 96 c.p.p.; per la persona offesa art. 101 c.p.p., che rinvia alle forme dell'art. 96, comma 2). Puo' essere effettuata con dichiarazione resa all'autorita' procedente o consegnata dal difensore, ovvero trasmessa con raccomandata.\n\nRegole principali:\n- l'imputato puo' nominare fino a DUE difensori di fiducia (art. 96, comma 1, c.p.p.);\n- la nomina puo' essere fatta all'atto delle indagini o in qualsiasi stato del procedimento;\n- il difensore nominato subentra al difensore d'ufficio eventualmente designato (art. 97 c.p.p.);\n- con la nomina possono essere conferiti poteri speciali (es. procura speciale per riti alternativi, per la remissione di querela, per la costituzione di parte civile).\n\nContenuto:\n- generalita' del nominante e la sua qualita' (indagato/imputato/persona offesa);\n- estremi del procedimento penale (n. R.G.N.R., autorita' procedente);\n- indicazione del difensore nominato con i suoi dati e recapiti (PEC, fax);\n- eventuali istanze contestuali (es. richiesta di rilascio copia atti ex art. 116 c.p.p., avviso ex art. 415-bis c.p.p., accesso al fascicolo, differimento di attivita').\n\nAvvertenze:\n- allegare la nomina alla prima difesa utile e comunicarla all'autorita' procedente;\n- specificare l'eventuale conferimento di facolta' e poteri speciali;\n- per gli atti a contenuto dispositivo (es. patteggiamento) e' richiesta procura speciale.",
  "campi": [
   {
    "id": "autorita",
    "label": "Autorita' procedente",
    "type": "text",
    "placeholder": "es. Procura della Repubblica presso il Tribunale di ... / Ill.mo GIP"
   },
   {
    "id": "procedimento",
    "label": "Estremi del procedimento",
    "type": "text",
    "placeholder": "es. Proc. pen. n. .../2026 R.G.N.R. mod. 21"
   },
   {
    "id": "nominante",
    "label": "Nominante (dati e qualita')",
    "type": "textarea",
    "placeholder": "Tizio Rossi, nato a ..., C.F. ..., indagato/imputato nel procedimento in oggetto"
   },
   {
    "id": "difensore",
    "label": "Difensore nominato (dati)",
    "type": "textarea",
    "placeholder": "Avv. ..., del Foro di ..., C.F. ..., PEC ..., con studio in ..."
   },
   {
    "id": "poteri",
    "label": "Poteri e facolta' conferiti",
    "type": "textarea",
    "placeholder": "Conferisce ogni piu' ampia facolta' di legge, ivi compreso il potere di..."
   },
   {
    "id": "istanza",
    "label": "Istanza contestuale (eventuale)",
    "type": "textarea",
    "placeholder": "Si chiede il rilascio di copia degli atti ex art. 116 c.p.p. / l'avviso di..."
   },
   {
    "id": "luogo_data",
    "label": "Luogo e data",
    "type": "text",
    "placeholder": "es. Napoli, 3 luglio 2026"
   }
  ],
  "template": "{{autorita}}\n{{procedimento}}\n\nNOMINA DI DIFENSORE DI FIDUCIA E CONTESTUALE ISTANZA\n(artt. 96 e 99 c.p.p.)\n\nIl sottoscritto {{nominante}}\n\nDICHIARA\n\ndi nominare, ai sensi dell'art. 96 c.p.p., proprio difensore di fiducia nel procedimento penale in epigrafe:\n\n{{difensore}}\n\nconferendo allo stesso il mandato a rappresentarlo e difenderlo, con i seguenti poteri e facolta':\n\n{{poteri}}\n\nISTANZA\n\nContestualmente alla presente nomina, il difensore come sopra nominato\n\nCHIEDE\n\n{{istanza}}\n\nSi comunicano i recapiti del difensore (PEC e fax) per ogni notifica e avviso di legge, eleggendo domicilio presso il suo studio ai sensi dell'art. 162 c.p.p.\n\n{{luogo_data}}\n\nIl nominante ______________________\n\nPer autentica della firma e per accettazione, il difensore\nAvv. ______________________"
 },
 {
  "id": "ricorso-tar",
  "nome": "Ricorso al TAR",
  "categoria": "Amministrativo",
  "descrizione": "Ricorso giurisdizionale amministrativo per l'annullamento di un provvedimento (art. 40 c.p.a.).",
  "guida": "Il ricorso al Tribunale Amministrativo Regionale e' l'atto introduttivo del giudizio amministrativo di primo grado, tipicamente volto all'annullamento di un provvedimento amministrativo illegittimo (azione di annullamento). Il contenuto e' disciplinato dall'art. 40 del Codice del processo amministrativo (d.lgs. 104/2010).\n\nAi sensi dell'art. 40, comma 1, c.p.a. il ricorso deve contenere distintamente (sono INAMMISSIBILI, ex art. 40, comma 2, i motivi proposti senza la specificita' richiesta dalla lettera d):\n- gli elementi identificativi del ricorrente, del suo difensore e delle parti nei cui confronti il ricorso e' proposto (controinteressati);\n- l'indicazione dell'OGGETTO della domanda, ivi compreso l'atto o il provvedimento eventualmente impugnato, e la data della sua notificazione, comunicazione o conoscenza;\n- l'esposizione sommaria dei FATTI;\n- i MOTIVI specifici su cui si fonda il ricorso (censure di legittimita': incompetenza, violazione di legge, eccesso di potere);\n- l'indicazione dei mezzi di prova;\n- l'indicazione dei provvedimenti chiesti al giudice (petitum: annullamento e, se del caso, risarcimento).\n\nTERMINE: il ricorso di annullamento va notificato, a pena di decadenza, entro SESSANTA giorni dalla notificazione, comunicazione o piena conoscenza del provvedimento (art. 29 e 41 c.p.a.); va poi depositato entro trenta giorni dall'ultima notificazione.\n\nAvvertenze:\n- notificare all'amministrazione resistente e ad almeno un controinteressato individuato;\n- valutare l'istanza cautelare di sospensione ex artt. 55 ss. c.p.a. in presenza di pregiudizio grave e irreparabile;\n- individuare correttamente la giurisdizione (esclusiva o di legittimita') e la competenza territoriale del TAR.",
  "campi": [
   {
    "id": "tar",
    "label": "TAR competente",
    "type": "text",
    "placeholder": "es. T.A.R. Campania - Napoli"
   },
   {
    "id": "ricorrente",
    "label": "Ricorrente (dati e difensore)",
    "type": "textarea",
    "placeholder": "Tizio Rossi, ..., rappresentato e difeso dall'Avv. ..., giusta procura ..."
   },
   {
    "id": "amministrazione",
    "label": "Amministrazione resistente",
    "type": "textarea",
    "placeholder": "Comune di ..., in persona del Sindaco p.t. / Ministero ..."
   },
   {
    "id": "controinteressati",
    "label": "Controinteressati (eventuali)",
    "type": "textarea",
    "placeholder": "Sig. ..., residente in ... (aggiudicatario/beneficiario del provvedimento)"
   },
   {
    "id": "provvedimento",
    "label": "Provvedimento impugnato",
    "type": "textarea",
    "placeholder": "Determinazione dirigenziale n. ... del ..., notificata/conosciuta il ..."
   },
   {
    "id": "fatto",
    "label": "Esposizione dei fatti",
    "type": "textarea",
    "placeholder": "Con il provvedimento impugnato l'Amministrazione ha ..."
   },
   {
    "id": "motivi",
    "label": "Motivi di ricorso",
    "type": "textarea",
    "placeholder": "I. VIOLAZIONE DI LEGGE ... II. ECCESSO DI POTERE per ..."
   },
   {
    "id": "istanza_cautelare",
    "label": "Istanza cautelare (eventuale)",
    "type": "textarea",
    "placeholder": "Ricorrendo il fumus e il periculum, si chiede la sospensione ex art. 55 c.p.a...."
   },
   {
    "id": "conclusioni",
    "label": "Conclusioni",
    "type": "textarea",
    "placeholder": "Voglia l'Ill.mo T.A.R. annullare il provvedimento impugnato..."
   },
   {
    "id": "luogo_data",
    "label": "Luogo e data",
    "type": "text",
    "placeholder": "es. Napoli, 3 luglio 2026"
   }
  ],
  "template": "ECC.MO TRIBUNALE AMMINISTRATIVO REGIONALE\n{{tar}}\n\nRICORSO\n(art. 40 d.lgs. 104/2010 - c.p.a.)\n\nPER: {{ricorrente}}\n- ricorrente -\n\nCONTRO: {{amministrazione}}\n- resistente -\n\nE NEI CONFRONTI DI: {{controinteressati}}\n- controinteressati -\n\nPER L'ANNULLAMENTO, previa sospensione dell'efficacia, del seguente provvedimento:\n{{provvedimento}}\n\nnonche' di ogni altro atto presupposto, connesso e consequenziale.\n\n* * *\n\nFATTO\n\n{{fatto}}\n\nDIRITTO - MOTIVI DI RICORSO\n\n{{motivi}}\n\nISTANZA CAUTELARE\n\n{{istanza_cautelare}}\n\nTutto cio' premesso, il ricorrente come sopra rappresentato e difeso\n\nCHIEDE\n\nche l'Ecc.mo T.A.R. adito, ogni contraria istanza disattesa, voglia:\n\n{{conclusioni}}\n\nCon vittoria di spese, competenze ed onorari del giudizio.\n\nAi fini del contributo unificato si dichiara la natura della controversia. Si deposita la documentazione in comunicazione.\n\n{{luogo_data}}\n\nAvv. ______________________"
 }
];
