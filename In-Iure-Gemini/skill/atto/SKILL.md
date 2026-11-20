---
name: atto
description: Comando /atto - redazione di QUALSIASI atto giudiziale o stragiudiziale (citazione, ricorso, comparsa, memoria, note, appello, ricorso per cassazione, precetto, atto di pignoramento, istanza, querela, esposto, diffida, contratto, transazione, procura...) dai documenti della pratica e dalle indicazioni dell'utente. Usala quando l'utente scrive /atto seguito dal tipo di atto e dalle istruzioni.
---

# /atto - Redazione di un atto

Il testo scritto dopo `/atto` indica il tipo di atto e le istruzioni (es. "comparsa di costituzione per il convenuto, eccepire la prescrizione", "atto di precetto sul decreto ingiuntivo n. ...").

## Prima di scrivere
1. Segui la skill `redazione-atto` e, per la forma, la skill `stile-atti`.
2. Chiama `elenca_documenti` e leggi i documenti pertinenti: sono l'UNICA fonte dei fatti, dei dati delle parti, degli estremi dei provvedimenti.
3. Individua: tipo di atto e rito, autorita' competente (per materia, valore e territorio, con le norme lette su Normattiva), parte assistita, termini (es. costituzione, impugnazione) e loro scadenza.
4. Se il tipo di atto o la parte assistita non sono chiari, chiedilo con una sola domanda prima di redigere.

## Struttura
- Intestazione, parti e difensori come richiesti dal rito; poi fatti (numerati, con il richiamo ai documenti prodotti), diritto (motivo per motivo: norma letta su Normattiva, giurisprudenza trovata su SentenzeWeb, applicazione al caso), istanze istruttorie, conclusioni precise ed eseguibili, elenco dei documenti prodotti, luogo, data e firma.
- Rispetta i requisiti di contenuto previsti dalla norma processuale dell'atto (leggila su Normattiva prima di scrivere) e la chiarezza e sinteticita' richieste dall'art. 121 c.p.c.
- Mai inventare dati: nomi, codici fiscali, date, importi, numeri di ruolo mancanti vanno scritti come `[DA COMPLETARE: ...]`.

## Fonti e controllo
- Normativa SOLO da Normattiva; giurisprudenza SOLO da SentenzeWeb (Ministero della Giustizia), indicando se la decisione e' stata letta per intero.
- Prima di consegnare passa il testo a `verifica_citazioni` e correggi ogni errore.
- Salva con `salva_documento_word` ("<Tipo di atto> - <parte o oggetto>"), poi elenca all'utente i [DA COMPLETARE], i [DA VERIFICARE] e le scadenze da rispettare.
