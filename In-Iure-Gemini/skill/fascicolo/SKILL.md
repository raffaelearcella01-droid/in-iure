---
name: fascicolo
description: Comando /fascicolo - analisi completa del fascicolo o dei documenti della pratica aperta (parti, fatti, cronologia, domande ed eccezioni, prove, questioni giuridiche, punti di forza e di debolezza, termini, prossimi passi). Usala quando l'utente scrive /fascicolo o chiede di analizzare, studiare o riassumere il fascicolo, la causa o i documenti della pratica.
---

# /fascicolo - Analisi del fascicolo

Il testo scritto dopo `/fascicolo` indica l'obiettivo dell'analisi (es. "siamo i convenuti, udienza il 12 marzo", "valuta se appellare", "concentrati sul danno"). Se manca, fai un'analisi generale.

## Metodo
1. **Inventario.** Chiama `elenca_documenti` e leggi TUTTI i documenti pertinenti con `leggi_documento` (o `cerca_nei_documenti` per quelli lunghi). Se un documento non e' leggibile (es. scansione senza testo), segnalalo e non supporne il contenuto.
2. **Chi difendiamo.** Ricava dai documenti la parte assistita dallo studio; se non e' chiaro, dichiaralo e chiedilo alla fine.
3. **Cronologia dei fatti.** Tabella data - fatto - documento e pagina. Distingui i fatti documentati da quelli solo affermati da una parte.
4. **Stato del giudizio.** Autorita', ruolo, rito, fase, prossima udienza, termini pendenti (con il calcolo e la norma letta su Normattiva). Se il procedimento non e' ancora iniziato, dillo.
5. **Posizioni delle parti.** Per ciascuna parte: domande, eccezioni, istanze istruttorie, conclusioni, con il documento da cui risultano.
6. **Prove.** Cosa e' provato, da quale documento; cosa manca e come si puo' acquisire.
7. **Questioni giuridiche.** Per ogni questione: norme applicabili (lette SOLO su Normattiva), orientamento della Cassazione (SOLO da `sentenzeweb`, con `cerca_per_articolo` e `cerca_sentenze`; leggi per intero le decisioni decisive).
8. **Valutazione.** Punti di forza e di debolezza di ciascuna parte, rischi, esito prevedibile (alto, medio, basso: mai percentuali).
9. **Prossimi passi.** Attivita' da compiere, con scadenze, documenti da chiedere al cliente, eventuali soluzioni stragiudiziali.

## Regole
- Fatti: SOLO dai documenti della cartella (documento e pagina) o dalle parole dell'utente ("riferito dall'utente").
- Normativa SOLO da Normattiva; giurisprudenza SOLO da SentenzeWeb (Ministero della Giustizia). Nessun'altra fonte, mai la memoria.
- Prima di consegnare passa il testo a `verifica_citazioni` e correggi ogni errore.
- Salva con `salva_documento_word` ("Analisi fascicolo - <oggetto>") e indica all'utente il nome del file e le voci [DA VERIFICARE].
