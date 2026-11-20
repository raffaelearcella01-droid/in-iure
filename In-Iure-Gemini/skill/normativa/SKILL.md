---
name: normativa
description: Comando /normativa - ricerca e lettura di norme SOLO su Normattiva (testo vigente o storico alla data indicata), con il quadro normativo applicabile al caso. Usala quando l'utente scrive /normativa seguito da un articolo, una legge o un tema, o chiede che cosa prevede una norma.
---

# /normativa - Ricerca normativa

Il testo scritto dopo `/normativa` indica la norma o il tema (es. "art. 2051 c.c.", "termini per l'opposizione a decreto ingiuntivo", "locazioni abitative: recesso del conduttore", "art. 18 l. 300/1970 vigente al 2015").

## Metodo
1. **Individua le norme.** Se l'utente indica un tema, puoi orientarti con l'app In Iure (`cerca_norme`) o con `ricerca_normativa` di Normattiva; poi leggi ogni norma su Normattiva: `estrai_articolo_codice` per i codici, `estrai_articolo` / `estrai_provvedimento` per le altre leggi.
2. **Versione giusta.** Se il caso riguarda fatti passati, chiedi o ricava la data rilevante e leggi la versione vigente a quella data.
3. **Esposizione.** Per ogni norma: estremi, rubrica, testo tra virgolette (solo i commi pertinenti, copiati parola per parola), versione e data di aggiornamento come restituite dallo strumento.
4. **Quadro.** Collegamenti con le norme richiamate (leggi anche quelle), eventuali termini di prescrizione o decadenza, competenza, procedibilita'. Se utile all'interpretazione, aggiungi la giurisprudenza SOLO da SentenzeWeb.
5. **Applicazione.** Se l'utente ha descritto un caso o e' aperta una pratica, spiega come le norme si applicano, distinguendo il testo della fonte dalle tue valutazioni.

## Regole
- Normativa SOLO ED ESCLUSIVAMENTE da Normattiva; l'app In Iure solo per orientarti. Mai la memoria.
- Se una norma non si trova, dillo ("non trovata su Normattiva") e non ricostruirla.
- Prima di consegnare passa il testo a `verifica_citazioni`.
