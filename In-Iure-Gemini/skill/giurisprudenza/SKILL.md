---
name: giurisprudenza
description: Comando /giurisprudenza - ricerca giurisprudenziale sulla Cassazione SOLO su SentenzeWeb (archivio ufficiale del Ministero della Giustizia), con orientamento, contrasti e principi applicabili al caso. Usala quando l'utente scrive /giurisprudenza seguito dalla questione, o chiede precedenti, orientamenti, sentenze su un tema o su un articolo.
---

# /giurisprudenza - Ricerca giurisprudenziale

Il testo scritto dopo `/giurisprudenza` e' la questione da ricercare (es. "responsabilita' del custode per caduta su marciapiede", "art. 2051 c.c. caso fortuito condotta del danneggiato").

## Metodo
1. **Questione.** Riformula la questione in una frase; individua le norme coinvolte e leggile su Normattiva (servono per capire cosa cercare).
2. **Ricerca mirata, poche richieste.** Se la questione riguarda un articolo preciso usa `cerca_per_articolo`; altrimenti `cerca_sentenze` con 2-4 parole chiave (le parole scritte di seguito valgono come frase; separa i concetti con la virgola). Usa i filtri (anno, sezione, civile/penale) per restringere. Non ripetere ricerche identiche: la protezione anti-blocco ha dei tetti.
3. **Selezione.** Dagli estratti scegli le 3-6 decisioni piu' pertinenti e recenti; leggi per intero (`leggi_sentenza`) almeno quelle decisive.
4. **Esposizione.** Per ogni decisione: estremi completi (sezione, tipo, numero, data di decisione e di deposito, link al PDF ufficiale), principio affermato, passaggio decisivo tra virgolette copiato parola per parola, pertinenza al caso. Indica "letta per intero" o "vista negli estratti".
5. **Sintesi.** Orientamento prevalente, eventuali contrasti o evoluzioni, Sezioni Unite se presenti, e come si applica al caso dell'utente.
6. **Limiti.** SentenzeWeb copre circa gli ultimi 5 anni e non contiene le massime ufficiali: per precedenti piu' vecchi di' che non sono consultabili con le fonti disponibili. Non citare mai decisioni non trovate con lo strumento; quelle citate dentro una sentenza vanno indicate come "citata in Cass. n. .../...; non verificata direttamente".

## Regole
- Giurisprudenza SOLO da SentenzeWeb (Ministero della Giustizia); normativa SOLO da Normattiva. Nessun'altra fonte, mai la memoria.
- Nomi delle persone fisiche: mai; indica solo il ruolo (ricorrente, controricorrente...).
- Prima di consegnare passa il testo a `verifica_citazioni`. Se e' aperta una pratica, salva con `salva_documento_word` ("Ricerca giurisprudenziale - <tema>").
