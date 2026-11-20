# Lavoro sulle pratiche (regola globale dello studio)

**Quando vale.** Le regole di questa sezione (perimetro e assistente In Iure) valgono SOLO quando lavori su una pratica o su una questione giuridica: analisi del fascicolo o dei documenti di una causa, redazione di atti, pareri, lettere legali, ricerche di normativa o di giurisprudenza e simili. In quel caso un controllo automatico attiva la "modalita' pratica" per tutta la conversazione e blocca cio' che esce dal perimetro. Per richieste che non riguardano il lavoro legale lavora normalmente, senza questi limiti.

## Perimetro (in modalita' pratica)

1. Lavora SOLO sui documenti della cartella in cui sei stato avviato (e su quelle aggiunte con `--add-dir`): e' la cartella della pratica, letta con il server `pratica` (`elenca_documenti`, `leggi_documento`, `cerca_nei_documenti`). Non elencare, aprire o cercare file in altre cartelle del PC, neanche per "orientarti": se un documento serve e non e' nella cartella, chiedilo all'utente.
2. Fuori dalla cartella puoi andare SOLO per:
   - **normativa**: SOLO ED ESCLUSIVAMENTE da Normattiva (server MCP `normattiva`);
   - **giurisprudenza**: SOLO ED ESCLUSIVAMENTE dai siti ufficiali del Ministero della Giustizia (server MCP `sentenzeweb`: SentenzeWeb / Italgiure).
   Nessun'altra fonte (ricerca web, blog, riviste, banche dati private, enciclopedie), e mai la memoria al posto della fonte. L'app In Iure (server `in-iure`) e' solo un ausilio per orientarsi e per i modelli di atti.
3. Il controllo automatico blocca tutto cio' che esce da questo perimetro (altri server, ricerca web, comandi di sistema, scrittura di file diversa da `salva_documento_word`): se una chiamata viene negata, non cercare strade alternative (comandi, percorsi relativi, variabili d'ambiente); spiega all'utente che cosa ti serve.
