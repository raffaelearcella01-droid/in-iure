---
name: redazione-atto
description: Redazione di QUALSIASI atto giudiziale o stragiudiziale (citazione, ricorso, comparsa, memoria, appello, precetto, diffida, lettera, contratto, istanza, querela, esposto, procura...) a partire dalla richiesta dell'avvocato e dai documenti della pratica aperta. Usala ogni volta che l'utente chiede di scrivere, preparare o redigere un atto, anche se esiste una skill specifica (in quel caso seguila insieme a questa).
---

# Redazione di un atto

1. **Inquadra la richiesta.** Individua tipo di atto, autorita' e rito (o destinatario, se stragiudiziale), parte assistita, controparti, domanda o scopo. Se manca un elemento decisivo che non risulta dai documenti, chiedilo all'utente con UNA domanda riepilogativa prima di scrivere; per gli elementi secondari procedi e lascia il segnaposto.
2. **Skill specifica.** Se tra le skill ce n'e' una per quell'atto (es. atto-di-citazione-DM110_23, comparsa-costituzione, atto-di-appello, ricorso-semplificato, memorie-171ter, precetto-aggiornato, negoziazione-assistita-famiglia), seguila per struttura e contenuti; per lo stile segui stile-forense.
3. **Modello dell'app.** Cerca sempre con `cerca_modelli_atti` un modello In Iure dello stesso tipo e leggilo con `leggi_modello_atto`: usalo come traccia di struttura e formule, adattandolo al caso.
4. **Fatti.** Se e' aperta una pratica, ricava i fatti SOLO dai documenti (`elenca_documenti`, `cerca_nei_documenti`, `leggi_documento`) e dalle parole dell'utente. Ogni fatto rilevante va ancorato a un documento, da produrre come allegato numerato ("doc. 1 - contratto del ...").
5. **Diritto.** Verifica OGNI norma citata con `leggi_articolo` (o Normattiva) sul testo vigente, compresi termini, competenza e condizioni di procedibilita' (mediazione, negoziazione assistita). La giurisprudenza solo da `sentenzeweb`, con estremi esatti, e solo se l'hai trovata; altrimenti argomenta sulle norme.
6. **Dati mancanti.** Mai inventare nomi, date, importi, codici fiscali, numeri di ruolo, indirizzi o udienze: scrivi `[DA COMPLETARE: ...]` indicando cosa serve.
7. **Testo completo.** Scrivi l'atto per intero, pronto da firmare: intestazione, parti, fatto, diritto, conclusioni o richieste, istanze istruttorie ed elenco documenti quando previsti, luogo, data e firma.
8. **Salvataggio.** Salva con `salva_documento_word` (nome file chiaro, es. "Atto di citazione Rossi c. Condominio - bozza"). Poi riferisci all'utente: nome del file, norme verificate, sentenze lette per intero, segnaposto da completare, punti incerti da controllare.
