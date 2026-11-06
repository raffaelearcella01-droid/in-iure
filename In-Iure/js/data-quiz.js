// data-quiz.js - banca base (revisionata ottobre 2026)
var QUIZ = [
 {
  "materia": "Diritto Civile",
  "id": "civile",
  "domande": [
   {
    "q": "Che cosa si intende per contratto secondo il codice civile?",
    "opzioni": [
     "Qualsiasi atto giuridico posto in essere da un soggetto capace",
     "L'accordo di due o piu' parti per costituire, regolare o estinguere tra loro un rapporto giuridico patrimoniale",
     "La dichiarazione unilaterale diretta a produrre effetti obbligatori",
     "Il fatto illecito produttivo di obbligazioni risarcitorie"
    ],
    "corretta": 1,
    "spiegazione": "L'art. 1321 c.c. definisce il contratto come l'accordo di due o piu' parti per costituire, regolare o estinguere tra loro un rapporto giuridico patrimoniale. Il carattere plurilaterale (accordo) e la patrimonialita' del rapporto sono elementi essenziali."
   },
   {
    "q": "Quali sono i requisiti del contratto indicati dall'art. 1325 c.c.?",
    "opzioni": [
     "Accordo, causa, oggetto e forma quando prescritta dalla legge a pena di nullita'",
     "Accordo, capacita', buona fede e forma scritta",
     "Volonta', motivo, prezzo e consegna",
     "Consenso, condizione, termine e modo"
    ],
    "corretta": 0,
    "spiegazione": "L'art. 1325 c.c. elenca come requisiti del contratto l'accordo delle parti, la causa, l'oggetto e la forma, quest'ultima quando risulta prescritta dalla legge sotto pena di nullita'."
   },
   {
    "q": "Entro quale termine si prescrive ordinariamente il diritto secondo il codice civile?",
    "opzioni": [
     "In cinque anni",
     "In venti anni",
     "In dieci anni",
     "In tre anni"
    ],
    "corretta": 2,
    "spiegazione": "L'art. 2946 c.c. stabilisce la prescrizione ordinaria in dieci anni, salvi i casi in cui la legge disponga diversamente (es. prescrizioni brevi quinquennali ex art. 2948 c.c.)."
   },
   {
    "q": "Che cosa distingue l'obbligazione naturale da quella civile?",
    "opzioni": [
     "L'obbligazione naturale e' sempre nulla",
     "L'obbligazione naturale non e' coercibile ma il pagamento spontaneo non e' ripetibile (soluti retentio)",
     "L'obbligazione naturale produce interessi legali",
     "L'obbligazione naturale deve avere forma scritta"
    ],
    "corretta": 1,
    "spiegazione": "L'art. 2034 c.c. stabilisce che i doveri morali e sociali non danno azione per il pagamento, ma non e' ammessa la ripetizione di quanto sia stato spontaneamente prestato da chi era capace (soluti retentio)."
   },
   {
    "q": "Che cos'e' la solidarieta' passiva nelle obbligazioni?",
    "opzioni": [
     "Ciascun creditore puo' esigere l'intera prestazione",
     "Ciascuno dei piu' debitori e' obbligato per l'intera prestazione e l'adempimento di uno libera gli altri",
     "Il debitore puo' liberarsi pagando solo la propria quota",
     "L'obbligazione si estingue alla morte di uno dei condebitori"
    ],
    "corretta": 1,
    "spiegazione": "Ai sensi dell'art. 1292 c.c., nell'obbligazione solidale passiva piu' debitori sono obbligati tutti per la medesima prestazione, in modo che ciascuno puo' essere costretto all'adempimento per la totalita' e l'adempimento da parte di uno libera gli altri."
   },
   {
    "q": "Qual e' il termine di prescrizione dell'azione di risarcimento del danno da fatto illecito extracontrattuale?",
    "opzioni": [
     "Dieci anni dal fatto",
     "Cinque anni dal giorno in cui il fatto si e' verificato",
     "Tre anni dalla scoperta del danno",
     "Un anno dal fatto"
    ],
    "corretta": 1,
    "spiegazione": "L'art. 2947, comma 1, c.c. prevede che il diritto al risarcimento del danno derivante da fatto illecito si prescrive in cinque anni dal giorno in cui il fatto si e' verificato (due anni per i danni da circolazione di veicoli)."
   },
   {
    "q": "Che cosa si intende per usucapione?",
    "opzioni": [
     "L'acquisto della proprieta' per effetto del possesso continuato per il tempo previsto dalla legge",
     "L'acquisto per contratto a titolo oneroso",
     "L'estinzione del diritto per mancato esercizio",
     "Il trasferimento coattivo disposto dal giudice"
    ],
    "corretta": 0,
    "spiegazione": "L'usucapione (artt. 1158 ss. c.c.) e' un modo di acquisto a titolo originario della proprieta' e degli altri diritti reali di godimento mediante il possesso continuato, pacifico e non interrotto per il tempo stabilito dalla legge (di regola venti anni per i beni immobili)."
   },
   {
    "q": "Nel contratto a prestazioni corrispettive, cosa consente l'eccezione di inadempimento (art. 1460 c.c.)?",
    "opzioni": [
     "Di risolvere automaticamente il contratto",
     "Di rifiutare la propria prestazione se l'altra parte non adempie o non offre di adempiere la propria contemporaneamente",
     "Di chiedere sempre gli interessi moratori",
     "Di trasferire il contratto a un terzo"
    ],
    "corretta": 1,
    "spiegazione": "L'art. 1460 c.c. consente a ciascun contraente di rifiutare l'adempimento della propria obbligazione se l'altro non adempie o non offre di adempiere contemporaneamente la propria, salvo che le parti abbiano fissato termini diversi e salvo il limite della buona fede."
   },
   {
    "q": "Quale forma richiede a pena di nullita' il contratto di compravendita di beni immobili?",
    "opzioni": [
     "La forma orale con due testimoni",
     "La forma scritta (atto pubblico o scrittura privata)",
     "Nessuna forma particolare",
     "La sola registrazione fiscale"
    ],
    "corretta": 1,
    "spiegazione": "L'art. 1350 c.c. impone la forma scritta, a pena di nullita', per i contratti che trasferiscono la proprieta' di beni immobili o costituiscono, modificano o trasferiscono diritti reali immobiliari."
   },
   {
    "q": "Che cosa caratterizza la responsabilita' del debitore per inadempimento ex art. 1218 c.c.?",
    "opzioni": [
     "Il creditore deve provare la colpa del debitore",
     "Il debitore che non esegue esattamente la prestazione e' tenuto al risarcimento se non prova che l'inadempimento e' stato determinato da impossibilita' derivante da causa a lui non imputabile",
     "La responsabilita' e' sempre esclusa in caso di semplice ritardo",
     "Il debitore risponde solo per dolo"
    ],
    "corretta": 1,
    "spiegazione": "L'art. 1218 c.c. addossa al debitore inadempiente il risarcimento del danno, salvo che egli provi che l'inadempimento o il ritardo e' stato determinato da impossibilita' della prestazione derivante da causa a lui non imputabile. Grava dunque sul debitore l'onere della prova liberatoria."
   },
   {
    "q": "In tema di successioni, cos'e' la quota di legittima?",
    "opzioni": [
     "La parte del patrimonio di cui il testatore puo' liberamente disporre",
     "La quota di eredita' riservata dalla legge ai legittimari, di cui il testatore non puo' disporre a loro danno",
     "La quota devoluta sempre allo Stato",
     "La parte gravata dai debiti ereditari"
    ],
    "corretta": 1,
    "spiegazione": "Gli artt. 536 ss. c.c. riservano ai legittimari (coniuge, figli, ascendenti) una quota di eredita' detta legittima o riserva, di cui il de cuius non puo' disporre; la parte residua e' la quota disponibile."
   },
   {
    "q": "Che cos'e' la condizione risolutiva in un contratto?",
    "opzioni": [
     "Un evento futuro e incerto dal cui avverarsi dipende la cessazione degli effetti del contratto",
     "Un evento passato gia' verificatosi",
     "Il termine finale di adempimento",
     "La causa del contratto"
    ],
    "corretta": 0,
    "spiegazione": "Ai sensi dell'art. 1353 c.c., la condizione risolutiva e' l'evento futuro e incerto al cui verificarsi le parti subordinano la risoluzione (cessazione) degli effetti del contratto, che si producono immediatamente ma vengono meno se la condizione si avvera."
   },
   {
    "q": "Quale disciplina si applica alla vendita di cosa altrui?",
    "opzioni": [
     "E' nulla per impossibilita' dell'oggetto",
     "E' valida e obbliga il venditore a procurare l'acquisto della proprieta' al compratore",
     "E' sempre annullabile per errore",
     "Trasferisce immediatamente la proprieta' al compratore"
    ],
    "corretta": 1,
    "spiegazione": "L'art. 1478 c.c. prevede che la vendita di cosa altrui e' valida: il venditore e' obbligato a procurarne l'acquisto al compratore, il quale ne diviene proprietario nel momento in cui il venditore acquista la proprieta' dal titolare."
   },
   {
    "q": "Che cosa si intende per compensazione legale tra debiti e crediti?",
    "opzioni": [
     "L'estinzione dei due debiti reciproci per le quantita' corrispondenti quando sono omogenei, liquidi ed esigibili",
     "La rinuncia di un creditore al proprio credito",
     "Il pagamento eseguito da un terzo",
     "La cessione del credito a un altro soggetto"
    ],
    "corretta": 0,
    "spiegazione": "L'art. 1243 c.c. disciplina la compensazione legale: quando due persone sono obbligate l'una verso l'altra, i due debiti si estinguono per le quantita' corrispondenti se hanno ad oggetto somme di denaro o quantita' di cose fungibili dello stesso genere, liquide ed esigibili."
   },
   {
    "q": "Quale rimedio spetta al compratore per i vizi della cosa venduta (garanzia per vizi)?",
    "opzioni": [
     "Solo il risarcimento del danno",
     "La risoluzione del contratto (azione redibitoria) o la riduzione del prezzo (azione estimatoria), a sua scelta",
     "La sostituzione obbligatoria del bene",
     "La sola sospensione del pagamento"
    ],
    "corretta": 1,
    "spiegazione": "L'art. 1492 c.c. attribuisce al compratore, in presenza di vizi che rendano la cosa inidonea all'uso o ne diminuiscano in modo apprezzabile il valore, la scelta tra la risoluzione del contratto (azione redibitoria) e la riduzione del prezzo (azione estimatoria), salvo in ogni caso il risarcimento del danno ex art. 1494 c.c."
   },
   {
    "q": "Che cos'e' la clausola penale?",
    "opzioni": [
     "Una sanzione irrogata dal giudice",
     "La clausola con cui si conviene che, in caso di inadempimento o ritardo, un contraente sara' tenuto a una determinata prestazione, con effetto di limitare il risarcimento alla penale pattuita",
     "Una condizione sospensiva del contratto",
     "La caparra versata alla conclusione del contratto"
    ],
    "corretta": 1,
    "spiegazione": "L'art. 1382 c.c. definisce la clausola penale come quella con cui si stabilisce che, in caso di inadempimento o ritardo, il debitore sia tenuto a una determinata prestazione; essa limita il risarcimento alla prestazione promessa, salvo che sia stato convenuto il risarcimento del danno ulteriore, e puo' essere ridotta dal giudice se manifestamente eccessiva (art. 1384 c.c.)."
   }
  ]
 },
 {
  "materia": "Diritto Penale",
  "id": "penale",
  "domande": [
   {
    "q": "Che cosa distingue il dolo dalla colpa?",
    "opzioni": [
     "Il dolo riguarda solo i delitti, la colpa solo le contravvenzioni",
     "Nel dolo l'evento e' previsto e voluto come conseguenza della propria azione; nella colpa l'evento non e' voluto e si verifica per negligenza, imprudenza, imperizia o inosservanza di norme",
     "Non vi e' alcuna differenza pratica",
     "La colpa e' sempre piu' grave del dolo"
    ],
    "corretta": 1,
    "spiegazione": "L'art. 43 c.p. definisce il delitto doloso quando l'evento e' dall'agente preveduto e voluto come conseguenza della propria azione od omissione, e colposo quando l'evento, anche se preveduto, non e' voluto e si verifica a causa di negligenza, imprudenza, imperizia o inosservanza di leggi, regolamenti, ordini o discipline."
   },
   {
    "q": "Qual e' la differenza tra delitto e contravvenzione nel codice penale?",
    "opzioni": [
     "Il criterio distintivo e' la specie delle pene comminate dalla legge",
     "Il delitto e' sempre doloso, la contravvenzione sempre colposa",
     "La contravvenzione e' piu' grave del delitto",
     "Non esiste alcuna distinzione formale"
    ],
    "corretta": 0,
    "spiegazione": "L'art. 39 c.p. distingue i reati in delitti e contravvenzioni secondo la diversa specie delle pene stabilite: per i delitti ergastolo, reclusione e multa; per le contravvenzioni arresto e ammenda (art. 17 c.p.)."
   },
   {
    "q": "Che cosa si intende per reato omissivo improprio (o commissivo mediante omissione)?",
    "opzioni": [
     "Un reato che consiste nel semplice non fare senza rilievo dell'evento",
     "La mancata impedizione di un evento che si aveva l'obbligo giuridico di impedire, equiparata al cagionarlo",
     "Una contravvenzione stradale",
     "Un reato che puo' essere commesso solo dal pubblico ufficiale"
    ],
    "corretta": 1,
    "spiegazione": "L'art. 40, comma 2, c.p. stabilisce che non impedire un evento che si ha l'obbligo giuridico di impedire equivale a cagionarlo; su tale clausola si fonda la responsabilita' per reato omissivo improprio in capo al titolare di una posizione di garanzia."
   },
   {
    "q": "Che cosa disciplina l'art. 47 c.p. in tema di errore?",
    "opzioni": [
     "L'errore sul fatto che costituisce reato esclude la punibilita' dell'agente (salvo che si tratti di errore determinato da colpa e il fatto sia previsto come delitto colposo)",
     "L'errore e' sempre irrilevante",
     "L'errore sulla legge penale scusa sempre",
     "L'errore raddoppia la pena"
    ],
    "corretta": 0,
    "spiegazione": "L'art. 47 c.p. prevede che l'errore sul fatto che costituisce il reato esclude la punibilita' dell'agente, incidendo sul dolo; se pero' l'errore e' determinato da colpa, la punibilita' non e' esclusa quando il fatto sia previsto dalla legge come delitto colposo."
   },
   {
    "q": "Quale principio esprime l'art. 27, comma 1, della Costituzione?",
    "opzioni": [
     "La responsabilita' penale e' oggettiva",
     "La responsabilita' penale e' personale",
     "La pena e' sempre l'ergastolo",
     "Il reo risponde anche per fatto altrui"
    ],
    "corretta": 1,
    "spiegazione": "L'art. 27, comma 1, Cost. sancisce che la responsabilita' penale e' personale: si risponde solo per fatto proprio e colpevole, con esclusione di forme di responsabilita' per fatto altrui o meramente oggettiva."
   },
   {
    "q": "Che cosa prevede il principio di irretroattivita' della legge penale?",
    "opzioni": [
     "La legge penale si applica sempre retroattivamente",
     "Nessuno puo' essere punito per un fatto che, secondo la legge del tempo in cui fu commesso, non costituiva reato",
     "La legge penale piu' severa si applica ai fatti pregressi",
     "L'irretroattivita' riguarda solo le contravvenzioni"
    ],
    "corretta": 1,
    "spiegazione": "L'art. 2, comma 1, c.p. (in linea con l'art. 25 Cost.) vieta l'applicazione retroattiva della norma incriminatrice: nessuno puo' essere punito per un fatto che secondo la legge del tempo in cui fu commesso non costituiva reato; per le modifiche successive vige di regola il principio del favor rei."
   },
   {
    "q": "Che differenza c'e' tra truffa (art. 640 c.p.) e appropriazione indebita (art. 646 c.p.)?",
    "opzioni": [
     "Nella truffa l'agente ottiene il bene mediante artifizi o raggiri inducendo in errore la vittima; nell'appropriazione indebita si appropria di un bene di cui aveva gia' il possesso",
     "Sono lo stesso reato con nomi diversi",
     "La truffa riguarda solo beni immobili",
     "L'appropriazione indebita richiede sempre violenza"
    ],
    "corretta": 0,
    "spiegazione": "Nella truffa (art. 640 c.p.) l'ingiusto profitto con altrui danno si ottiene mediante artifizi o raggiri che inducono taluno in errore determinando l'atto di disposizione; nell'appropriazione indebita (art. 646 c.p.) l'agente ha gia' il possesso della cosa mobile altrui e se ne appropria per procurarsi un ingiusto profitto."
   }
  ]
 },
 {
  "materia": "Diritto Costituzionale",
  "id": "costituzionale",
  "domande": [
   {
    "q": "Quali sono gli organi che compongono il Parlamento italiano?",
    "opzioni": [
     "La Camera dei deputati e il Senato della Repubblica",
     "Il Governo e il Presidente della Repubblica",
     "La Corte costituzionale e il CSM",
     "Le Regioni e i Comuni"
    ],
    "corretta": 0,
    "spiegazione": "L'art. 55 Cost. stabilisce che il Parlamento si compone della Camera dei deputati e del Senato della Repubblica, secondo il modello del bicameralismo perfetto (paritario)."
   },
   {
    "q": "Chi elegge il Presidente della Repubblica?",
    "opzioni": [
     "Il popolo a suffragio universale diretto",
     "Il Parlamento in seduta comune, integrato dai delegati regionali",
     "Il solo Senato della Repubblica",
     "La Corte costituzionale"
    ],
    "corretta": 1,
    "spiegazione": "Ai sensi dell'art. 83 Cost., il Presidente della Repubblica e' eletto dal Parlamento in seduta comune dei suoi membri, con la partecipazione di tre delegati per ogni Regione (uno per la Valle d'Aosta) eletti dai Consigli regionali."
   },
   {
    "q": "Quanti anni dura in carica il Presidente della Repubblica?",
    "opzioni": [
     "Cinque anni",
     "Sette anni",
     "Quattro anni",
     "A vita"
    ],
    "corretta": 1,
    "spiegazione": "L'art. 85 Cost. dispone che il Presidente della Repubblica e' eletto per sette anni."
   },
   {
    "q": "Quale principio esprime l'art. 3 della Costituzione?",
    "opzioni": [
     "Il principio di uguaglianza formale e sostanziale dei cittadini",
     "La liberta' di iniziativa economica",
     "La separazione tra Stato e Chiesa",
     "Il diritto di voto"
    ],
    "corretta": 0,
    "spiegazione": "L'art. 3 Cost. sancisce l'uguaglianza formale (pari dignita' sociale e uguaglianza davanti alla legge senza distinzioni) al comma 1 e l'uguaglianza sostanziale al comma 2, imponendo alla Repubblica di rimuovere gli ostacoli che limitano di fatto la liberta' e l'uguaglianza dei cittadini."
   },
   {
    "q": "Quale organo giudica sulla legittimita' costituzionale delle leggi?",
    "opzioni": [
     "La Corte di cassazione",
     "Il Consiglio di Stato",
     "La Corte costituzionale",
     "Il Consiglio superiore della magistratura"
    ],
    "corretta": 2,
    "spiegazione": "L'art. 134 Cost. attribuisce alla Corte costituzionale il giudizio sulle controversie relative alla legittimita' costituzionale delle leggi e degli atti aventi forza di legge dello Stato e delle Regioni, sui conflitti di attribuzione e sulle accuse contro il Presidente della Repubblica."
   },
   {
    "q": "Da quanti giudici e' composta la Corte costituzionale e come sono nominati?",
    "opzioni": [
     "Da dodici giudici tutti nominati dal Presidente della Repubblica",
     "Da quindici giudici, nominati per un terzo dal Presidente della Repubblica, un terzo dal Parlamento in seduta comune e un terzo dalle supreme magistrature",
     "Da nove giudici eletti dal popolo",
     "Da venti giudici nominati dal Governo"
    ],
    "corretta": 1,
    "spiegazione": "L'art. 135 Cost. prevede che la Corte costituzionale sia composta di quindici giudici, nominati per un terzo dal Presidente della Repubblica, per un terzo dal Parlamento in seduta comune e per un terzo dalle supreme magistrature ordinaria e amministrative; durano in carica nove anni."
   },
   {
    "q": "Che cosa disciplina l'art. 21 della Costituzione?",
    "opzioni": [
     "La liberta' di manifestazione del pensiero",
     "Il diritto di sciopero",
     "La liberta' di circolazione",
     "L'inviolabilita' del domicilio"
    ],
    "corretta": 0,
    "spiegazione": "L'art. 21 Cost. tutela la liberta' di manifestazione del pensiero: tutti hanno diritto di manifestare liberamente il proprio pensiero con la parola, lo scritto e ogni altro mezzo di diffusione, con divieto di censura e limiti a tutela del buon costume."
   },
   {
    "q": "In cosa consiste la riserva di legge?",
    "opzioni": [
     "Nell'obbligo di riservare una copia della legge all'archivio",
     "Nel principio per cui la disciplina di determinate materie e' riservata dalla Costituzione alla legge, con esclusione o limitazione di fonti secondarie",
     "Nella facolta' del Governo di legiferare senza limiti",
     "Nel potere del giudice di disapplicare la legge"
    ],
    "corretta": 1,
    "spiegazione": "La riserva di legge e' il principio, previsto in numerose disposizioni costituzionali (es. artt. 13, 23, 25 Cost.), per cui la disciplina di certe materie e' riservata alla legge (o ad atti aventi forza di legge), a garanzia contro l'arbitrio dell'esecutivo; puo' essere assoluta o relativa."
   },
   {
    "q": "Che cosa prevede l'art. 138 della Costituzione?",
    "opzioni": [
     "L'ordinaria approvazione delle leggi",
     "Il procedimento aggravato di revisione costituzionale, con doppia deliberazione di ciascuna Camera e possibile referendum",
     "L'elezione del Governo",
     "La nomina dei prefetti"
    ],
    "corretta": 1,
    "spiegazione": "L'art. 138 Cost. disciplina il procedimento di revisione costituzionale: le leggi di revisione e le altre leggi costituzionali sono adottate da ciascuna Camera con due successive deliberazioni a intervallo non minore di tre mesi; se non si raggiungono i due terzi, e' ammesso il referendum confermativo."
   },
   {
    "q": "Chi concede la grazia e commuta le pene?",
    "opzioni": [
     "Il Ministro della giustizia",
     "Il Presidente della Repubblica",
     "La Corte di cassazione",
     "Il Presidente del Consiglio dei ministri"
    ],
    "corretta": 1,
    "spiegazione": "L'art. 87, comma 11, Cost. attribuisce al Presidente della Repubblica il potere di concedere grazia e di commutare le pene; il relativo decreto e' controfirmato dal Ministro della giustizia."
   },
   {
    "q": "Che cosa comporta l'immunita' parlamentare di cui all'art. 68 Cost.?",
    "opzioni": [
     "I parlamentari non pagano imposte",
     "I membri del Parlamento non possono essere chiamati a rispondere delle opinioni espresse e dei voti dati nell'esercizio delle loro funzioni",
     "I parlamentari sono esenti da ogni processo civile",
     "I parlamentari non possono mai essere arrestati"
    ],
    "corretta": 1,
    "spiegazione": "L'art. 68, comma 1, Cost. prevede l'insindacabilita': i membri del Parlamento non possono essere chiamati a rispondere delle opinioni espresse e dei voti dati nell'esercizio delle funzioni; i commi successivi subordinano ad autorizzazione della Camera talune misure limitative della liberta' personale."
   },
   {
    "q": "Che cosa disciplina l'art. 13 della Costituzione?",
    "opzioni": [
     "La liberta' di associazione",
     "L'inviolabilita' della liberta' personale",
     "Il diritto al lavoro",
     "La liberta' religiosa"
    ],
    "corretta": 1,
    "spiegazione": "L'art. 13 Cost. sancisce l'inviolabilita' della liberta' personale: non e' ammessa forma alcuna di detenzione, ispezione o perquisizione personale se non per atto motivato dell'autorita' giudiziaria e nei soli casi e modi previsti dalla legge (riserva di legge e di giurisdizione)."
   },
   {
    "q": "In cosa consiste il rapporto di fiducia tra Governo e Parlamento?",
    "opzioni": [
     "Il Governo puo' operare senza alcun controllo parlamentare",
     "Il Governo deve avere la fiducia di entrambe le Camere, accordata mediante mozione motivata e votata per appello nominale",
     "Solo il Senato accorda la fiducia",
     "La fiducia e' concessa dal Presidente della Repubblica"
    ],
    "corretta": 1,
    "spiegazione": "L'art. 94 Cost. stabilisce che il Governo deve avere la fiducia delle due Camere; ciascuna la accorda o la revoca mediante mozione motivata votata per appello nominale, ed entro dieci giorni dalla formazione il Governo si presenta alle Camere per ottenerla."
   },
   {
    "q": "Che cosa stabilisce l'art. 101 della Costituzione in tema di giurisdizione?",
    "opzioni": [
     "I giudici sono nominati dal Governo",
     "La giustizia e' amministrata in nome del popolo e i giudici sono soggetti soltanto alla legge",
     "Il potere giudiziario dipende dal Parlamento",
     "Le sentenze sono revocabili dal Presidente della Repubblica"
    ],
    "corretta": 1,
    "spiegazione": "L'art. 101 Cost. afferma che la giustizia e' amministrata in nome del popolo e che i giudici sono soggetti soltanto alla legge, principio cardine dell'indipendenza e della soggezione del giudice unicamente alla legge."
   },
   {
    "q": "Quale organo assicura l'autonomia e l'indipendenza della magistratura ordinaria?",
    "opzioni": [
     "Il Ministero della giustizia",
     "Il Consiglio superiore della magistratura",
     "La Corte dei conti",
     "Il Consiglio di Stato"
    ],
    "corretta": 1,
    "spiegazione": "L'art. 104 e ss. Cost. istituiscono il Consiglio superiore della magistratura (CSM), organo di autogoverno cui competono assunzioni, assegnazioni, trasferimenti, promozioni e provvedimenti disciplinari nei riguardi dei magistrati, a garanzia dell'autonomia e indipendenza dell'ordine giudiziario."
   }
  ]
 },
 {
  "materia": "Procedura Civile",
  "id": "procedura-civile",
  "domande": [
   {
    "q": "Con quale atto si introduce il processo ordinario di cognizione davanti al tribunale?",
    "opzioni": [
     "Con ricorso depositato in cancelleria",
     "Con atto di citazione notificato al convenuto",
     "Con semplice istanza orale",
     "Con decreto del giudice"
    ],
    "corretta": 1,
    "spiegazione": "L'art. 163 c.p.c. prevede che la domanda si propone mediante citazione a comparire a udienza fissa: l'atto di citazione, contenente gli elementi ivi elencati, e' notificato al convenuto per instaurare il processo ordinario di cognizione."
   },
   {
    "q": "Che cos'e' la competenza per territorio?",
    "opzioni": [
     "Il criterio che ripartisce le cause tra giudici di diverso grado",
     "Il criterio che individua, tra piu' giudici dello stesso tipo, quello geograficamente competente a conoscere della causa",
     "Il criterio fondato sul valore della domanda",
     "La ripartizione tra giudice ordinario e amministrativo"
    ],
    "corretta": 1,
    "spiegazione": "La competenza per territorio (artt. 18 ss. c.p.c.) individua, fra i vari uffici giudiziari dello stesso tipo distribuiti sul territorio, quello competente a conoscere della singola causa; il foro generale delle persone fisiche e' quello di residenza o domicilio del convenuto (art. 18 c.p.c.)."
   },
   {
    "q": "Quale onere probatorio grava sulle parti secondo l'art. 2697 c.c.?",
    "opzioni": [
     "Chi vuol far valere un diritto in giudizio deve provare i fatti che ne costituiscono il fondamento",
     "La prova grava sempre sul convenuto",
     "La prova e' assunta d'ufficio dal giudice",
     "Nessuna parte deve provare i propri assunti"
    ],
    "corretta": 0,
    "spiegazione": "L'art. 2697 c.c. pone la regola dell'onere della prova: chi vuol far valere un diritto in giudizio deve provare i fatti che ne costituiscono il fondamento, mentre chi eccepisce l'inefficacia di tali fatti o modificazioni/estinzioni deve provare i fatti su cui l'eccezione si fonda."
   },
   {
    "q": "Che cosa e' il litisconsorzio necessario (art. 102 c.p.c.)?",
    "opzioni": [
     "La facolta' di piu' soggetti di riunirsi liberamente in un processo",
     "L'ipotesi in cui, non potendo la decisione pronunciarsi che in confronto di piu' parti, queste devono agire o essere convenute nello stesso processo",
     "La sostituzione di una parte con un'altra",
     "L'intervento del pubblico ministero"
    ],
    "corretta": 1,
    "spiegazione": "L'art. 102 c.p.c. disciplina il litisconsorzio necessario: se la decisione non puo' pronunciarsi che in confronto di piu' parti, queste devono agire o essere convenute nello stesso processo; in difetto il giudice ordina l'integrazione del contraddittorio."
   },
   {
    "q": "Qual e' il termine ordinario per proporre appello contro una sentenza notificata?",
    "opzioni": [
     "Dieci giorni dalla notificazione",
     "Trenta giorni dalla notificazione della sentenza",
     "Sei mesi dalla pubblicazione",
     "Un anno dalla notificazione"
    ],
    "corretta": 1,
    "spiegazione": "L'art. 325, primo comma, c.p.c. fissa in trenta giorni il termine per proporre appello e l'art. 326 c.p.c. lo fa decorrere dalla notificazione della sentenza; in mancanza di notificazione opera il termine lungo di sei mesi dalla pubblicazione ex art. 327 c.p.c."
   },
   {
    "q": "Che cosa caratterizza il procedimento per decreto ingiuntivo?",
    "opzioni": [
     "E' un processo a cognizione piena con contraddittorio anticipato",
     "E' un procedimento sommario in cui, su ricorso del creditore con prova scritta, il giudice ingiunge il pagamento senza previo contraddittorio, salva l'opposizione del debitore",
     "E' riservato alle sole cause di lavoro",
     "Richiede sempre l'udienza di comparizione delle parti"
    ],
    "corretta": 1,
    "spiegazione": "Gli artt. 633 ss. c.p.c. disciplinano il procedimento d'ingiunzione: chi e' creditore di una somma liquida ed esigibile o di cose fungibili, munito di prova scritta, puo' chiedere al giudice un decreto ingiuntivo emesso inaudita altera parte; il contraddittorio e' eventuale e differito all'opposizione ex art. 645 c.p.c."
   },
   {
    "q": "Che cosa si intende per giudicato sostanziale (art. 2909 c.c.)?",
    "opzioni": [
     "L'accertamento contenuto nella sentenza passata in giudicato fa stato a ogni effetto tra le parti, i loro eredi o aventi causa",
     "La provvisoria esecutorieta' della sentenza di primo grado",
     "La sospensione del processo",
     "L'archiviazione della causa"
    ],
    "corretta": 0,
    "spiegazione": "L'art. 2909 c.c. definisce il giudicato sostanziale: l'accertamento contenuto nella sentenza passata in giudicato fa stato a ogni effetto tra le parti, i loro eredi o aventi causa, precludendo un nuovo esame della medesima questione."
   },
   {
    "q": "Che cos'e' la domanda riconvenzionale?",
    "opzioni": [
     "La rinuncia agli atti del giudizio",
     "La domanda con cui il convenuto, oltre a difendersi, propone a sua volta una domanda contro l'attore ampliando l'oggetto del giudizio",
     "L'istanza di sospensione del processo",
     "La chiamata in causa di un terzo"
    ],
    "corretta": 1,
    "spiegazione": "La domanda riconvenzionale (art. 167, comma 2, c.p.c.) e' quella con cui il convenuto, nella comparsa di risposta, non si limita a resistere ma propone contro l'attore una propria domanda, a pena di decadenza, ampliando l'oggetto del processo."
   },
   {
    "q": "Quale funzione ha il provvedimento cautelare?",
    "opzioni": [
     "Definisce il merito della controversia",
     "Assicura provvisoriamente gli effetti della futura decisione, in presenza del fumus boni iuris e del periculum in mora",
     "Sostituisce la sentenza di appello",
     "Estingue il processo"
    ],
    "corretta": 1,
    "spiegazione": "I procedimenti cautelari (artt. 669-bis ss. c.p.c.) mirano ad assicurare in via provvisoria e strumentale gli effetti della decisione di merito, presupponendo il fumus boni iuris (verosimile fondatezza del diritto) e il periculum in mora (pericolo di pregiudizio nel tempo occorrente per la tutela ordinaria)."
   },
   {
    "q": "Che cosa dispone l'art. 112 c.p.c. sul principio della corrispondenza tra chiesto e pronunciato?",
    "opzioni": [
     "Il giudice puo' pronunciare su qualsiasi domanda anche non proposta",
     "Il giudice deve pronunciare su tutta la domanda e non oltre i suoi limiti, senza pronunciare d'ufficio su eccezioni riservate alle parti",
     "Il giudice decide solo su cio' che ritiene opportuno",
     "Il giudice non e' vincolato alle domande delle parti"
    ],
    "corretta": 1,
    "spiegazione": "L'art. 112 c.p.c. sancisce il principio della corrispondenza tra il chiesto e il pronunciato: il giudice deve pronunciare su tutta la domanda e non oltre i limiti di essa (divieto di ultra e extra petizione) e non puo' rilevare d'ufficio eccezioni riservate alle parti."
   },
   {
    "q": "Che cos'e' il regolamento di competenza?",
    "opzioni": [
     "Un mezzo di gravame contro le sole sentenze di merito",
     "Il mezzo di impugnazione specifico avverso i provvedimenti che decidono sulla competenza",
     "Un accordo tra le parti sulla competenza",
     "Un provvedimento del CSM"
    ],
    "corretta": 1,
    "spiegazione": "Il regolamento di competenza (artt. 42-43 c.p.c.) e' lo strumento di impugnazione, deciso dalla Corte di cassazione, avverso i provvedimenti che pronunciano sulla competenza; puo' essere necessario (contro le sole decisioni sulla competenza) o facoltativo."
   },
   {
    "q": "Quale valore probatorio ha l'atto pubblico ex art. 2700 c.c.?",
    "opzioni": [
     "Nessun valore particolare",
     "Fa piena prova, fino a querela di falso, della provenienza dal pubblico ufficiale e degli atti da lui compiuti o avvenuti in sua presenza",
     "Ha lo stesso valore di una testimonianza",
     "Puo' essere liberamente contestato con qualsiasi mezzo"
    ],
    "corretta": 1,
    "spiegazione": "L'art. 2700 c.c. attribuisce all'atto pubblico efficacia di piena prova, fino a querela di falso, della provenienza del documento dal pubblico ufficiale che lo ha formato, nonche' delle dichiarazioni delle parti e degli altri fatti che il pubblico ufficiale attesta avvenuti in sua presenza o da lui compiuti."
   },
   {
    "q": "In che cosa consiste il litisconsorzio facoltativo?",
    "opzioni": [
     "Nell'obbligo di tutte le parti di partecipare al processo",
     "Nella possibilita' che piu' cause connesse, tra soggetti diversi, siano trattate in un unico processo per ragioni di connessione",
     "Nella sostituzione processuale",
     "Nell'intervento necessario del pubblico ministero"
    ],
    "corretta": 1,
    "spiegazione": "L'art. 103 c.p.c. disciplina il litisconsorzio facoltativo: piu' parti possono agire o essere convenute nello stesso processo quando tra le cause proposte esiste connessione per l'oggetto o per il titolo, oppure la decisione dipende, totalmente o parzialmente, dalla risoluzione di identiche questioni."
   },
   {
    "q": "Che cosa comporta la contumacia del convenuto?",
    "opzioni": [
     "L'automatico accoglimento della domanda dell'attore (ficta confessio)",
     "La mancata costituzione della parte regolarmente citata, che non implica ammissione dei fatti e non impedisce la prosecuzione del processo",
     "L'estinzione immediata del giudizio",
     "La nullita' dell'atto di citazione"
    ],
    "corretta": 1,
    "spiegazione": "La contumacia (artt. 291 ss. c.p.c.) e' la mancata costituzione in giudizio della parte regolarmente citata; nel processo civile italiano non equivale ad ammissione dei fatti (non opera la ficta confessio): l'attore deve comunque provare la propria domanda e il processo prosegue."
   },
   {
    "q": "Quali sono i mezzi di impugnazione ordinari nel processo civile?",
    "opzioni": [
     "Solo il ricorso per cassazione",
     "Il regolamento di competenza, l'appello, il ricorso per cassazione e la revocazione per i motivi di cui ai nn. 4 e 5 dell'art. 395 c.p.c.",
     "L'opposizione di terzo revocatoria e la revocazione straordinaria",
     "Il reclamo cautelare e l'istanza di sospensione"
    ],
    "corretta": 1,
    "spiegazione": "L'art. 323 c.p.c. elenca i mezzi di impugnazione; sono ordinari quelli la cui proponibilita' impedisce il passaggio in giudicato ex art. 324 c.p.c.: regolamento di competenza, appello, ricorso per cassazione e revocazione per i motivi di cui ai nn. 4 e 5 dell'art. 395. La revocazione per i nn. 1, 2, 3 e 6 e l'opposizione di terzo sono mezzi straordinari."
   }
  ]
 },
 {
  "materia": "Procedura Penale",
  "id": "procedura-penale",
  "domande": [
   {
    "q": "Chi esercita l'azione penale e con quale carattere?",
    "opzioni": [
     "Il giudice, in modo discrezionale",
     "Il pubblico ministero, che ha l'obbligo di esercitarla",
     "La persona offesa, facoltativamente",
     "La polizia giudiziaria, a sua scelta"
    ],
    "corretta": 1,
    "spiegazione": "L'art. 112 Cost. e l'art. 50 c.p.p. sanciscono l'obbligatorieta' dell'azione penale, il cui esercizio spetta al pubblico ministero; questi la esercita quando non sussistono i presupposti per la richiesta di archiviazione."
   },
   {
    "q": "Che cosa esprime la presunzione di non colpevolezza?",
    "opzioni": [
     "L'imputato e' colpevole fino a prova contraria",
     "L'imputato non e' considerato colpevole sino alla condanna definitiva",
     "L'imputato deve provare la propria innocenza",
     "La colpevolezza si presume dopo il rinvio a giudizio"
    ],
    "corretta": 1,
    "spiegazione": "L'art. 27, comma 2, Cost. stabilisce che l'imputato non e' considerato colpevole sino alla condanna definitiva; da cio' discendono, tra l'altro, la regola dell'onere della prova a carico dell'accusa e il canone dell'oltre ogni ragionevole dubbio (art. 533 c.p.p.)."
   },
   {
    "q": "Quali sono le fasi del procedimento penale ordinario?",
    "opzioni": [
     "Solo il dibattimento",
     "Indagini preliminari, udienza preliminare e giudizio (dibattimento)",
     "Solo indagini e sentenza",
     "Archiviazione ed esecuzione"
    ],
    "corretta": 1,
    "spiegazione": "Il procedimento penale ordinario si articola nelle indagini preliminari (dirette dal PM con la polizia giudiziaria e sotto il controllo del GIP), nell'udienza preliminare (davanti al GUP) e nel giudizio dibattimentale, secondo l'impianto del codice di procedura penale (d.P.R. 447/1988)."
   },
   {
    "q": "Chi dispone le misure cautelari personali?",
    "opzioni": [
     "Il pubblico ministero autonomamente",
     "Il giudice, su richiesta del pubblico ministero",
     "La polizia giudiziaria",
     "Il difensore dell'imputato"
    ],
    "corretta": 1,
    "spiegazione": "L'art. 291 c.p.p. prevede che le misure cautelari personali sono disposte dal giudice competente su richiesta del pubblico ministero; il giudice non puo' applicarle d'ufficio, in coerenza con la separazione dei ruoli e la riserva di giurisdizione ex art. 13 Cost."
   },
   {
    "q": "Quali sono le esigenze cautelari che giustificano una misura ex art. 274 c.p.p.?",
    "opzioni": [
     "Solo la gravita' del reato",
     "Il pericolo per l'acquisizione o la genuinita' della prova, il pericolo di fuga e il pericolo di reiterazione del reato",
     "La sola richiesta della persona offesa",
     "L'assenza di un difensore"
    ],
    "corretta": 1,
    "spiegazione": "L'art. 274 c.p.p. individua tre esigenze cautelari: pericolo per l'acquisizione o la genuinita' della prova, pericolo di fuga e pericolo che l'imputato commetta gravi delitti o reati della stessa specie; e' inoltre necessaria la sussistenza di gravi indizi di colpevolezza ex art. 273 c.p.p."
   },
   {
    "q": "Che cosa caratterizza il giudizio abbreviato?",
    "opzioni": [
     "Si celebra sempre in dibattimento con testimoni",
     "E' un rito speciale che si svolge, di regola, allo stato degli atti e comporta, in caso di condanna, la diminuzione della pena di un terzo per i delitti e della meta' per le contravvenzioni",
     "E' riservato ai soli reati contravvenzionali",
     "Non prevede alcuno sconto di pena"
    ],
    "corretta": 1,
    "spiegazione": "Il giudizio abbreviato (artt. 438 ss. c.p.p.) e' un rito speciale, richiesto dall'imputato, in cui il processo e' definito all'udienza preliminare allo stato degli atti (salva l'integrazione probatoria ex artt. 438, comma 5, e 441, comma 5). In caso di condanna la pena e' diminuita di un terzo se si procede per un delitto e della meta' se si procede per una contravvenzione (art. 442, comma 2, c.p.p.); non e' ammesso per i delitti puniti con l'ergastolo (art. 438, comma 1-bis)."
   },
   {
    "q": "In cosa consiste l'applicazione della pena su richiesta delle parti (patteggiamento)?",
    "opzioni": [
     "In una confessione resa in dibattimento",
     "Nell'accordo tra imputato e PM sull'applicazione di una pena, entro certi limiti, sottoposto al vaglio del giudice",
     "Nella rinuncia all'azione penale",
     "Nell'archiviazione del procedimento"
    ],
    "corretta": 1,
    "spiegazione": "L'art. 444 c.p.p. disciplina l'applicazione della pena su richiesta delle parti: imputato e pubblico ministero possono chiedere al giudice l'applicazione di una sanzione, eventualmente diminuita fino a un terzo, purche' la pena in concreto non superi i limiti di legge; il giudice verifica la correttezza della qualificazione e della congruita' della pena."
   },
   {
    "q": "Che cos'e' l'archiviazione?",
    "opzioni": [
     "Una sentenza di condanna",
     "Il provvedimento con cui, su richiesta del PM, il giudice dispone di non procedere per infondatezza della notizia di reato o altre cause",
     "L'inizio del dibattimento",
     "Una misura cautelare reale"
    ],
    "corretta": 1,
    "spiegazione": "Gli artt. 408 ss. c.p.p. disciplinano l'archiviazione: il PM la richiede al GIP quando gli elementi acquisiti non consentono di formulare una ragionevole previsione di condanna (art. 408) e, ai sensi dell'art. 411, quando manca una condizione di procedibilita', l'indagato non e' punibile per particolare tenuita' del fatto, il reato e' estinto o il fatto non e' previsto dalla legge come reato. Il giudice provvede con decreto motivato o, all'esito della camera di consiglio, con ordinanza (art. 409)."
   },
   {
    "q": "Chi puo' proporre ricorso per cassazione avverso le sentenze penali?",
    "opzioni": [
     "Solo il giudice che ha emesso la sentenza",
     "Il pubblico ministero e l'imputato (oltre alle altre parti legittimate), nei casi previsti dalla legge",
     "Esclusivamente la persona offesa",
     "Chiunque ne abbia interesse morale"
    ],
    "corretta": 1,
    "spiegazione": "L'art. 606 c.p.p. individua i motivi di ricorso per cassazione; sono legittimati a proporlo, tra gli altri, il pubblico ministero e l'imputato (a mezzo del difensore), nonche' le altre parti nei limiti del proprio interesse. Il ricorso e' ammesso solo per motivi di legittimita' tassativamente indicati."
   },
   {
    "q": "Che valore ha il principio del contraddittorio nella formazione della prova?",
    "opzioni": [
     "La prova si forma unilateralmente nelle indagini",
     "Il processo penale e' regolato dal principio del contraddittorio nella formazione della prova, di regola in dibattimento",
     "Il contraddittorio riguarda solo la fase esecutiva",
     "Le prove sono decise dalla sola accusa"
    ],
    "corretta": 1,
    "spiegazione": "L'art. 111, comma 4, Cost. sancisce che il processo penale e' regolato dal principio del contraddittorio nella formazione della prova; coerentemente, la prova si forma di regola in dibattimento nel confronto tra le parti (es. esame incrociato ex art. 498 c.p.p.), salve le eccezioni previste dalla legge."
   },
   {
    "q": "Che cosa e' l'incidente probatorio?",
    "opzioni": [
     "Un errore nella raccolta della prova",
     "Il procedimento con cui, gia' nella fase delle indagini, si assume anticipatamente una prova non rinviabile al dibattimento, nel contraddittorio delle parti",
     "Una misura cautelare reale",
     "La rinuncia alla prova"
    ],
    "corretta": 1,
    "spiegazione": "Gli artt. 392 ss. c.p.p. disciplinano l'incidente probatorio: consente di assumere anticipatamente, davanti al GIP e nel contraddittorio delle parti, una prova che non potrebbe essere rinviata al dibattimento (es. testimonianza a rischio, perizia complessa), cristallizzandola per il futuro giudizio."
   },
   {
    "q": "Quali giudici sono competenti per materia, in primo grado, per i reati che non appartengono alla competenza del giudice di pace?",
    "opzioni": [
     "Il giudice di pace",
     "Il tribunale (in composizione monocratica o collegiale) e la corte d'assise per i reati piu' gravi",
     "La corte d'appello",
     "La Corte di cassazione"
    ],
    "corretta": 1,
    "spiegazione": "La corte di assise e' competente per i delitti piu' gravi elencati dall'art. 5 c.p.p. (es. delitti puniti con l'ergastolo o la reclusione non inferiore nel massimo a ventiquattro anni, omicidio del consenziente, istigazione al suicidio); il tribunale e' competente per i reati che non appartengono alla competenza della corte di assise o del giudice di pace (art. 6 c.p.p.) e giudica in composizione collegiale o monocratica secondo gli artt. 33-bis e 33-ter c.p.p."
   },
   {
    "q": "Che cosa comporta l'inutilizzabilita' della prova (art. 191 c.p.p.)?",
    "opzioni": [
     "La prova acquisita in violazione dei divieti di legge non puo' essere utilizzata",
     "La prova puo' essere sempre valutata dal giudice",
     "La prova diventa piu' forte",
     "La prova va restituita alla parte"
    ],
    "corretta": 0,
    "spiegazione": "L'art. 191 c.p.p. dispone che le prove acquisite in violazione dei divieti stabiliti dalla legge non possono essere utilizzate; l'inutilizzabilita' e' rilevabile anche d'ufficio in ogni stato e grado del procedimento, a garanzia della legalita' nella formazione della prova."
   },
   {
    "q": "Chi ha la direzione delle indagini preliminari?",
    "opzioni": [
     "Il giudice per le indagini preliminari",
     "Il pubblico ministero, che si avvale della polizia giudiziaria",
     "Il difensore dell'indagato",
     "La corte d'appello"
    ],
    "corretta": 1,
    "spiegazione": "L'art. 327 c.p.p. attribuisce al pubblico ministero la direzione delle indagini preliminari e la disponibilita' diretta della polizia giudiziaria; il GIP interviene invece a garanzia, decidendo su misure cautelari, incidenti probatori e archiviazioni."
   },
   {
    "q": "Che funzione ha l'udienza preliminare?",
    "opzioni": [
     "Decidere nel merito la responsabilita' dell'imputato",
     "Filtrare l'esercizio dell'azione penale, verificando se gli elementi acquisiti consentono di formulare una ragionevole previsione di condanna",
     "Eseguire la pena",
     "Assumere le prove in contraddittorio pieno"
    ],
    "corretta": 1,
    "spiegazione": "L'udienza preliminare (artt. 416 ss. c.p.p.), celebrata davanti al GUP, ha funzione di filtro: il giudice dispone il rinvio a giudizio con decreto ex art. 429 c.p.p. ovvero pronuncia sentenza di non luogo a procedere, tra l'altro, quando gli elementi acquisiti non consentono di formulare una ragionevole previsione di condanna (art. 425, comma 3, c.p.p.)."
   }
  ]
 },
 {
  "materia": "Diritto Amministrativo",
  "id": "amministrativo",
  "domande": [
   {
    "q": "Che cos'e' il provvedimento amministrativo?",
    "opzioni": [
     "Un contratto tra privati",
     "La manifestazione di volonta' della pubblica amministrazione, espressione di un potere autoritativo, idonea a incidere unilateralmente sulle situazioni giuridiche dei destinatari",
     "Una semplice comunicazione interna",
     "Una sentenza del giudice ordinario"
    ],
    "corretta": 1,
    "spiegazione": "Il provvedimento amministrativo e' l'atto con cui la P.A., nell'esercizio di un potere autoritativo, dispone unilateralmente sugli interessi dei destinatari; e' caratterizzato da tipicita', autoritativita', esecutivita' ed esecutorieta', nel quadro della legge n. 241/1990."
   },
   {
    "q": "Che cosa distingue la nullita' dall'annullabilita' del provvedimento?",
    "opzioni": [
     "Non vi e' alcuna differenza",
     "La nullita' ricorre nei casi tassativi dell'art. 21-septies (mancanza elementi essenziali, difetto assoluto di attribuzione, ecc.); l'annullabilita' consegue ai vizi di legittimita' ex art. 21-octies",
     "La nullita' produce sempre effetti fino all'annullamento",
     "L'annullabilita' non e' impugnabile"
    ],
    "corretta": 1,
    "spiegazione": "L'art. 21-septies l. 241/1990 prevede la nullita' del provvedimento che manca degli elementi essenziali, e' viziato da difetto assoluto di attribuzione, e' stato adottato in violazione o elusione del giudicato o negli altri casi di legge; l'art. 21-octies disciplina invece l'annullabilita' per incompetenza, violazione di legge o eccesso di potere."
   },
   {
    "q": "Che cosa si intende per interesse legittimo?",
    "opzioni": [
     "La pretesa a una prestazione patrimoniale determinata",
     "La posizione soggettiva del privato correlata all'esercizio del potere amministrativo, tutelata in quanto coincidente con l'interesse pubblico alla legittimita' dell'azione",
     "Un diritto soggettivo assoluto",
     "Un mero interesse di fatto irrilevante"
    ],
    "corretta": 1,
    "spiegazione": "L'interesse legittimo e' la situazione giuridica soggettiva del privato che si correla all'esercizio del potere della P.A., tutelata dall'ordinamento (artt. 24, 103 e 113 Cost.); la sua lesione da parte di un provvedimento illegittimo e' devoluta, di regola, alla giurisdizione del giudice amministrativo."
   },
   {
    "q": "Che cosa disciplina la legge n. 241/1990?",
    "opzioni": [
     "Il codice della strada",
     "Il procedimento amministrativo e il diritto di accesso ai documenti amministrativi",
     "L'ordinamento giudiziario",
     "Il codice civile"
    ],
    "corretta": 1,
    "spiegazione": "La legge n. 241/1990 detta le norme generali sul procedimento amministrativo (avvio, responsabile del procedimento, partecipazione, termine di conclusione, motivazione) e sul diritto di accesso ai documenti amministrativi, ispirandosi ai principi di economicita', efficacia, imparzialita', pubblicita' e trasparenza."
   },
   {
    "q": "Che cosa comporta l'obbligo di motivazione del provvedimento (art. 3 l. 241/1990)?",
    "opzioni": [
     "La motivazione e' facolta' discrezionale della P.A.",
     "Ogni provvedimento deve essere motivato, con indicazione dei presupposti di fatto e delle ragioni giuridiche che ne hanno determinato la decisione",
     "La motivazione e' richiesta solo per gli atti favorevoli",
     "Solo gli atti normativi vanno motivati"
    ],
    "corretta": 1,
    "spiegazione": "L'art. 3 l. 241/1990 impone che ogni provvedimento amministrativo, compresi quelli concernenti l'organizzazione e il personale, sia motivato, salvo per gli atti normativi e a contenuto generale; la motivazione deve indicare i presupposti di fatto e le ragioni giuridiche in relazione alle risultanze dell'istruttoria."
   },
   {
    "q": "Che cosa e' la conferenza di servizi?",
    "opzioni": [
     "Una riunione informale priva di effetti",
     "Il modulo di semplificazione con cui piu' amministrazioni acquisiscono in modo contestuale gli assensi e le valutazioni necessari a un provvedimento",
     "Un organo giurisdizionale",
     "Una gara d'appalto"
    ],
    "corretta": 1,
    "spiegazione": "Gli artt. 14 ss. l. 241/1990 disciplinano la conferenza di servizi, strumento di semplificazione e coordinamento che consente l'esame contestuale dei vari interessi pubblici coinvolti in un procedimento, acquisendo in un'unica sede gli atti di assenso, pareri e valutazioni delle amministrazioni competenti."
   },
   {
    "q": "In quali casi sussiste la giurisdizione esclusiva del giudice amministrativo?",
    "opzioni": [
     "Sempre e per ogni controversia",
     "Nelle materie indicate dalla legge, in cui il g.a. conosce anche dei diritti soggettivi",
     "Mai, perche' i diritti spettano al g.o.",
     "Solo per le controversie tra privati"
    ],
    "corretta": 1,
    "spiegazione": "L'art. 133 c.p.a. elenca le materie di giurisdizione esclusiva del giudice amministrativo (es. pubblici servizi, accordi ex art. 11 l. 241/1990, edilizia e urbanistica), nelle quali, in deroga al criterio generale del petitum sostanziale, il g.a. conosce anche delle controversie relative a diritti soggettivi, secondo l'art. 103 Cost."
   },
   {
    "q": "Che cosa e' l'autotutela amministrativa?",
    "opzioni": [
     "Il potere del privato di farsi giustizia da se'",
     "Il potere della P.A. di riesaminare i propri atti, annullandoli d'ufficio (art. 21-nonies) o revocandoli (art. 21-quinquies) nei casi previsti",
     "L'impugnazione davanti al giudice",
     "Il ricorso gerarchico"
    ],
    "corretta": 1,
    "spiegazione": "L'autotutela decisoria e' il potere della P.A. di intervenire sui propri provvedimenti: l'annullamento d'ufficio (art. 21-nonies l. 241/1990) rimuove l'atto illegittimo sussistendo ragioni di interesse pubblico ed entro un termine ragionevole; la revoca (art. 21-quinquies) incide su atti a efficacia durevole per sopravvenuti motivi di opportunita'."
   },
   {
    "q": "Che cosa e' l'espropriazione per pubblica utilita'?",
    "opzioni": [
     "Una donazione volontaria del privato",
     "Il procedimento con cui la P.A. priva coattivamente il privato della proprieta' per finalita' di pubblico interesse, dietro indennizzo",
     "Una compravendita ordinaria",
     "Una sanzione penale"
    ],
    "corretta": 1,
    "spiegazione": "L'espropriazione per pubblica utilita' (d.P.R. 327/2001, in attuazione dell'art. 42, comma 3, Cost.) e' l'istituto mediante il quale la P.A., per motivi di interesse generale e nei casi previsti dalla legge, sacrifica il diritto di proprieta' del privato, riconoscendogli un indennizzo."
   },
   {
    "q": "Che cosa e' il ricorso gerarchico?",
    "opzioni": [
     "Un ricorso giurisdizionale al TAR",
     "Un rimedio amministrativo con cui si impugna un atto non definitivo davanti all'organo gerarchicamente sovraordinato a quello che lo ha emanato",
     "Un ricorso alla Corte di cassazione",
     "Il ricorso straordinario al Capo dello Stato"
    ],
    "corretta": 1,
    "spiegazione": "Il ricorso gerarchico (d.P.R. 1199/1971) e' un rimedio amministrativo (non giurisdizionale) proponibile, entro trenta giorni, avverso atti non definitivi, all'organo gerarchicamente superiore a quello che ha emesso l'atto, per motivi di legittimita' e di merito."
   },
   {
    "q": "Che cosa prevede il principio di legalita' dell'azione amministrativa?",
    "opzioni": [
     "La P.A. puo' agire liberamente senza base normativa",
     "L'azione amministrativa deve svolgersi in conformita' alla legge, che ne costituisce fondamento e limite del potere",
     "La P.A. e' sottratta a ogni controllo",
     "I provvedimenti non richiedono base legislativa"
    ],
    "corretta": 1,
    "spiegazione": "Il principio di legalita' (desumibile dagli artt. 97 e 113 Cost. e ribadito dall'art. 1 l. 241/1990) impone che l'attivita' amministrativa persegua i fini determinati dalla legge e si svolga secondo le norme di diritto: la legge e' al contempo fondamento (nessun potere senza norma attributiva) e limite del potere pubblico."
   }
  ]
 }
];
