---
name: replica
description: Comando /replica - esame critico di un atto o di un provvedimento della controparte o del giudice (comparsa, memoria, ricorso, sentenza, ordinanza) e preparazione delle repliche, eccezioni o motivi di impugnazione. Usala quando l'utente scrive /replica seguito dal documento da esaminare, o chiede di rispondere a un atto avversario o di valutare un provvedimento.
---

# /replica - Esame dell'atto avversario e repliche

Il testo scritto dopo `/replica` indica il documento da esaminare (nome del file della pratica) e cosa serve (es. "memoria 171-ter n. 2 della controparte: prepara le repliche", "sentenza di primo grado: motivi di appello").

## Metodo
1. Leggi per intero il documento indicato (`leggi_documento`) e gli atti precedenti che servono a capirlo.
2. **Mappa delle tesi.** Elenca, numerandole, le affermazioni in fatto e in diritto dell'atto, con la pagina.
3. **Verifica.** Per ciascuna tesi:
   - fatti: sono provati? da quale documento? contraddicono i documenti in atti o atti precedenti della stessa parte?
   - norme: leggi su Normattiva ogni norma invocata e controlla che dica cio' che l'atto le attribuisce (testo vigente all'epoca dei fatti);
   - giurisprudenza: cerca su SentenzeWeb le decisioni citate (`cerca_per_estremi`) e controlla numero, data e contenuto; segnala citazioni inesatte o non pertinenti;
   - questioni processuali: tardivita', preclusioni, inammissibilita', novita' delle domande o delle eccezioni.
4. **Repliche.** Per ogni tesi: argomento di replica, documenti e prove a sostegno, norma e giurisprudenza verificate. Ordina dalla piu' forte alla piu' debole.
5. **Rischi.** Le tesi avversarie fondate e come limitarne gli effetti.
6. Se l'utente lo chiede, redigi l'atto di replica seguendo la skill `redazione-atto`.

## Regole
- Fatti SOLO dai documenti della cartella; normativa SOLO da Normattiva; giurisprudenza SOLO da SentenzeWeb. Mai la memoria.
- Prima di consegnare passa il testo a `verifica_citazioni`; salva con `salva_documento_word` ("Repliche a <atto>").
