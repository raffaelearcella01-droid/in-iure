---
name: scadenze
description: Comando /scadenze - cronologia della pratica e calcolo dei termini processuali e sostanziali (costituzione, memorie, impugnazioni, prescrizione, decadenza, esecuzione) dai documenti della cartella, con le norme lette su Normattiva. Usala quando l'utente scrive /scadenze o chiede termini, scadenze, cronologia o calendario della pratica.
---

# /scadenze - Cronologia e termini

Il testo scritto dopo `/scadenze` puo' indicare un termine specifico (es. "termine per l'appello", "prescrizione del credito") o restare vuoto per l'intera pratica.

## Metodo
1. Leggi i documenti della pratica e individua le date rilevanti: fatti, notifiche (data di perfezionamento per il destinatario), depositi, pubblicazioni, comunicazioni di cancelleria, udienze, provvedimenti.
2. **Cronologia.** Tabella data - evento - documento e pagina.
3. **Termini.** Per ogni termine: norma che lo prevede (letta su Normattiva nella versione applicabile), evento da cui decorre, durata, modo di computo (giorni liberi o no, termini a ritroso, sospensione feriale dal 1 al 31 agosto se applicabile, scadenza nel sabato o festivo), data di scadenza calcolata, conseguenza del mancato rispetto.
4. **Dubbi.** Se una data manca o il computo dipende da un'informazione non presente (es. data di notifica, rito applicabile), non supporla: indica `[DA VERIFICARE: ...]` e cosa serve per chiudere il calcolo.
5. **Riepilogo.** Elenco delle prossime scadenze in ordine di data, con la piu' urgente in evidenza.

## Regole
- Le date vengono SOLO dai documenti o dall'utente; le regole di computo SOLO dalle norme lette su Normattiva; eventuale giurisprudenza SOLO da SentenzeWeb.
- Ricorda sempre all'utente di verificare i calcoli prima di fare affidamento su di essi.
- Prima di consegnare passa il testo a `verifica_citazioni`; salva con `salva_documento_word` ("Scadenze - <pratica>").
