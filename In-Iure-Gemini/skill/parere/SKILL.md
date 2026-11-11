---
name: parere
description: Parere legale scritto o valutazione di un caso (pro veritate, difensivo, strategico, sulla proponibilita' di un'azione o di un'impugnazione, sui rischi di una lite). Usala quando l'utente chiede un parere, una valutazione, "che possibilita' abbiamo", "conviene agire", o quando, esaminata una pratica, serve una presa di posizione motivata.
---

# Parere

1. **Quesito.** Riformula in una o due frasi la domanda a cui il parere risponde. Se e' ambigua, scegli l'interpretazione piu' utile e dichiarala.
2. **Fatti.** Solo quelli rilevanti, dai documenti della pratica (con documento e pagina) o dalle parole dell'utente (indicati come "riferito dal cliente"). Elenca a parte i fatti mancanti che potrebbero cambiare la conclusione.
3. **Norme.** Verifica ogni norma con `leggi_articolo` (o Normattiva) e riporta tra virgolette il passaggio decisivo. Controlla anche termini di prescrizione o decadenza, competenza, condizioni di procedibilita', onere della prova.
4. **Giurisprudenza.** Cerca con `cerca_per_articolo` e `cerca_sentenze`; leggi per intero (`leggi_sentenza`) le due o tre decisioni piu' pertinenti. Indica se l'orientamento e' costante o se ci sono contrasti. Niente precedenti non trovati con gli strumenti.
5. **Analisi.** Applica norme e precedenti ai fatti, questione per questione. Esamina anche le difese prevedibili della controparte e i punti deboli della propria posizione.
6. **Conclusioni.** Rispondi al quesito con chiarezza: esito probabile (alto, medio o basso, con il motivo; MAI percentuali o numeri di probabilita', che nessuna fonte puo' fondare), rischi principali, alternative (stragiudiziale, transazione, azione diversa), passi operativi con le scadenze, documenti da acquisire.
7. **Controllo finale prima di salvare.** Elenca tutte le norme citate: ognuna deve essere stata letta con `leggi_articolo` o Normattiva in questa conversazione, altrimenti leggila ora o toglila. Ogni sentenza citata deve venire da `sentenzeweb`, con l'indicazione "letta per intero" o "vista negli estratti"; una decisione che conosci solo perche' e' citata dentro un'altra sentenza va indicata come "citata in Cass. n. .../...; non verificata direttamente" (oppure cercala con `cerca_per_estremi`). Rileggi l'elenco delle norme alla fine: anche quelle citate di passaggio (es. articoli procedurali collegati) vanno lette. Ogni fatto deve avere il suo documento.
8. **Forma.** Paragrafi titolati e numerati; registro tecnico ma leggibile dal cliente; distingui sempre i dati delle fonti dalle valutazioni. Se e' aperta una pratica salva con `salva_documento_word` (es. "Parere - <oggetto>").
