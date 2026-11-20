---
name: controlla-citazioni
description: Comando /controlla-citazioni - controllo di tutte le citazioni normative e giurisprudenziali di un atto o testo gia' scritto (anche della controparte): esistenza, estremi, testo citato tra virgolette, pertinenza, norme abrogate o modificate. Usala quando l'utente scrive /controlla-citazioni seguito dal nome del documento o dal testo.
---

# /controlla-citazioni - Controllo delle citazioni

Il testo scritto dopo `/controlla-citazioni` e' il nome di un documento della pratica oppure il testo da controllare.

## Metodo
1. Leggi il documento (`leggi_documento`) o prendi il testo incollato.
2. Passa il testo a `verifica_citazioni`: e' il controllo automatico sulle fonti vere.
3. Per ogni citazione che lo strumento non chiude da solo:
   - **norme**: leggi l'articolo su Normattiva nella versione applicabile all'epoca dei fatti; verifica che esista, che non sia abrogato o modificato, che il testo tra virgolette sia identico e che dica cio' che l'atto gli attribuisce;
   - **sentenze**: cercale su SentenzeWeb con `cerca_per_estremi`; verifica sezione, numero, anno, data e che il principio attribuito corrisponda al testo (leggi la decisione con `leggi_sentenza`); se non si trova, scrivi "non trovata su SentenzeWeb (copre circa gli ultimi 5 anni)".
4. **Resoconto.** Tabella: citazione - esito (corretta / errata / non verificabile) - correzione proposta - fonte. In fondo il conteggio e le correzioni piu' importanti.
5. Se l'atto e' dello studio e l'utente lo chiede, prepara la versione corretta e salvala con `salva_documento_word`.

## Regole
- Normativa SOLO da Normattiva; giurisprudenza SOLO da SentenzeWeb (Ministero della Giustizia). Mai dichiarare verificata una citazione che lo strumento non ha verificato.
