---
name: lavoro-sulla-pratica
description: Ricerca, analisi o parere che deve tenere conto dei documenti della cartella della pratica aperta, considerando SOLO quelli come fonte dei fatti. Usala quando l'utente chiede di esaminare la pratica, i documenti, il fascicolo, di rispondere "in base ai documenti", di individuare questioni, termini, eccezioni o strategia, o di dare un parere sul caso.
---

# Lavoro sulla pratica

1. Chiama `elenca_documenti`. Se nessuna pratica e' aperta, dillo e fermati.
2. Leggi i documenti pertinenti con `leggi_documento` (tutte le parti, se lunghi); per richieste mirate usa prima `cerca_nei_documenti`. Segnala i documenti che non e' stato possibile leggere (scansioni senza testo, .doc vecchi) e chiedi all'utente se vuole fornirli in altro formato.
3. **Fatti solo dai documenti.** Ricostruisci i fatti citando sempre documento e pagina ("citazione.pdf, pag. 2"). Non usare documenti di altre cartelle, non colmare lacune con supposizioni: elenca a parte i fatti che mancano e che servirebbero.
4. Individua le questioni giuridiche e, per ciascuna, cerca le norme (`cerca_norme`, `leggi_articolo`, Normattiva) e i precedenti (`cerca_per_articolo`, `cerca_sentenze`, `leggi_sentenza`).
5. Rispondi distinguendo: (a) fatti risultanti dai documenti, con il riferimento; (b) norme, con il testo decisivo tra virgolette; (c) precedenti, distinguendo quelli letti per intero da quelli visti negli estratti; (d) valutazione, segnalata come tale; (e) termini e scadenze da controllare; (f) documenti o informazioni da acquisire.
6. Se l'utente chiede un parere o un atto, segui anche parere-legale o redazione-atto e salva il risultato con `salva_documento_word`.
