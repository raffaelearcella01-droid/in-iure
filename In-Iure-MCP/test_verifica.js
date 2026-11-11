/* Collaudo del verificatore delle citazioni (verifica-citazioni.js), senza rete: SentenzeWeb simulato,
 * registro di Normattiva in una cartella temporanea. Uso: node test_verifica.js */
"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");
const dati = fs.mkdtempSync(path.join(os.tmpdir(), "iniure-verifica-"));
process.env.IN_IURE_MCP_DATI = dati;
const { verifica, estraiNorme, estraiSentenze } = require("./verifica-citazioni");

let ok = 0, ko = 0;
const verifica_ = (c, nome) => { if (c) { ok++; console.log("  ok  " + nome); } else { ko++; console.log("  NO  " + nome); } };

const DOCS = {
  "14424/2023": [{ id: "snciv2023314424O", kind: "snciv", szdec: "3", anno: 2023, numdec: "14424", tipoprov: "Ordinanza", datdec: "20230404", datdep: ["20230524"] }],
  "13404/2023": [
    { id: "snpen2023713404O", kind: "snpen", szdec: "7", anno: 2023, numdec: "13404", tipoprov: "Ordinanza", datdec: "20230303", datdep: ["20230330"] },
    { id: "snciv2023313404O", kind: "snciv", szdec: "3", anno: 2023, numdec: "13404", tipoprov: "Ordinanza", datdec: "20230221", datdep: ["20230516"] }],
};
const TESTI = { snciv2023314424O: "... il conduttore puo' sollevare l'eccezione di inadempimento, ai sensi dell'art. 1460 c.c., non solo quando venga completamente a mancare la prestazione del locatore ... come gia' affermato da Cass. n. 2154 del 2021 ..." };
const swFinto = {
  perEstremi: async (n, a) => DOCS[n + "/" + a] || [],
  testoIntegrale: async id => TESTI[id] || "",
  estremi: d => "Cass. " + (d.kind === "snpen" ? "pen." : "civ.") + ", Sez. " + d.szdec + ", " + d.tipoprov + " n. " + d.numdec + "/" + d.anno,
};
const prova = t => verifica(t, { sentenzeweb: swFinto, documenti: ["Il canone e' di euro 800 mensili, da pagare entro il giorno 5 di ogni mese."] });

(async () => {
  console.log("1) Riconoscimento");
  const n = estraiNorme("artt. 1575 e 1576 c.c.; art. 183, comma 4, c.p.c.; art. 5, commi 1 e 6 lett. b), D.Lgs. 28/2010; d.lgs. 28/2010, art. 5; art. 171-ter c.p.c.; art. 4 del contratto; art. 116 disp. att. c.p.c.; art. 55 della legge 27 luglio 1978, n. 392")
    .map(x => x.articolo + "|" + (x.fonte && (x.fonte.id || x.fonte.tipo + (x.fonte.numero ? ":" + x.fonte.numero + "/" + x.fonte.anno : ""))));
  verifica_(JSON.stringify(n) === JSON.stringify(["1575|codice-civile", "1576|codice-civile", "183|cpc", "5|mediazione", "5|mediazione", "171-ter|cpc", "4|contratto", "116|disp-att-cpc", "55|legge:392/1978"]), "norme: elenchi, commi, forma inversa, contratto, disp. att., legge per esteso (" + n.join(", ") + ")");
  const ff = estraiNorme("Si applica l'art. 1455 c.c. Il giudice valuta. Vale l'art. 1460, comma 2, c.c. Ne consegue l'art. 658 c.p.c. Infine l'art. 5 L. 392/1978. Fine.")
    .map(x => x.articolo + "|" + (x.fonte && (x.fonte.id || x.fonte.tipo + ":" + x.fonte.numero)));
  verifica_(JSON.stringify(ff) === JSON.stringify(["1455|codice-civile", "1460|codice-civile", "658|cpc", "5|legge:392"]), "norme a fine frase seguite da maiuscola (" + ff.join(", ") + ")");
  const s = estraiSentenze("Cass. civ., Sez. 3, Ordinanza n. 14424/2023 (decisa il 04/04/2023); Cass., S.U., 12 maggio 2020, n. 8770; Cass. n. 2154/2021, citata in Cass. civ., Sez. 3, ord. n. 14424/2023.");
  verifica_(s.length === 4 && s[0].sezione === "3" && s[0].archivio === "snciv" && s[1].sezione === "U" && s[1].anno === "2020" && !s[1].ospite && !!s[2].ospite, "sentenze: estremi, Sezioni Unite con data, \"citata in\"");

  console.log("2) Citazioni giuste");
  const g = await prova("Ai sensi dell'art. 1460 c.c. e dell'art. 121 c.p.c., «Tutti gli atti del processo sono redatti in modo chiaro e sintetico». Cass. civ., Sez. 3, Ordinanza n. 14424/2023 (decisa il 04/04/2023, depositata il 24/05/2023): \"il conduttore puo' sollevare l'eccezione di inadempimento, ai sensi dell'art. 1460 c.c., non solo quando venga completamente a mancare la prestazione\". Dal contratto: \"Il canone e' di euro 800 mensili, da pagare entro il giorno 5\".");
  verifica_(g.errori.length === 0, "nessun errore su norme, sentenza, date e citazioni testuali vere" + (g.errori.length ? ": " + g.errori.join(" | ") : ""));
  verifica_(g.ok.some(x => /documenti|parola per parola/.test(x)) && g.ok.filter(x => /parola per parola/.test(x)).length === 3, "tre citazioni testuali trovate (codice, sentenza, documento della pratica)");

  console.log("3) Citazioni inventate o sbagliate");
  const e = async (t, re, nome) => { const r = await prova(t); verifica_(r.errori.some(x => re.test(x)), nome + (r.errori.length ? "" : " (nessun errore rilevato!)")); };
  await e("art. 9999 c.c.", /NON ESISTE/, "articolo inesistente");
  await e("art. 3 c.c.", /ABROGATO/, "articolo abrogato");
  await e("Cass. n. 99999/2024", /NON trovata su SentenzeWeb/, "sentenza inesistente");
  await e("Cass. civ., Sez. 1, n. 13404/2023", /estremi diversi/, "sezione sbagliata");
  await e("Cass. pen., Sez. 3, n. 14424/2023", /estremi diversi/, "archivio sbagliato (pen. invece di civ.)");
  await e("Cass. civ., Sez. 3, n. 14424/2023, depositata il 01/01/2023", /data depositata sbagliata/, "data di deposito sbagliata");
  await e("Cass. n. 14424", /manca l'anno/, "sentenza senza anno");
  await e("Secondo Cass. civ., Sez. 3, n. 14424/2023 «il locatore risponde sempre di ogni infiltrazione senza eccezioni».", /NON trovata parola per parola/, "frase tra virgolette inventata");
  await e("Tribunale di Roma, sent. n. 1234/2024", /autorita' diversa/, "sentenza di merito non verificabile");
  await e("Corte cost. n. 5/2021", /autorita' diversa/, "sentenza della Corte costituzionale non verificabile");
  await e("art. 5 L. 392/1978", /NON scaricato da Normattiva/, "norma fuori dall'app non scaricata");
  await e("Cass. n. 3333/2021, citata in Cass. civ., Sez. 3, ord. n. 14424/2023", /NON risulta citata/, "\"citata in\" falso: la sentenza ospite non la cita");

  console.log("4) Casi ammessi");
  const c = await prova("Cass. n. 2154/2021, citata in Cass. civ., Sez. 3, ord. n. 14424/2023.");
  verifica_(!c.errori.length && c.ok.some(x => /citata in/.test(x)), "\"citata in\" vero: la sentenza ospite la cita davvero");
  const m = await prova("Tribunale di Roma, sent. n. 1234/2024 [DA VERIFICARE]; art. 7 L. 392/1978 [DA VERIFICARE].");
  verifica_(!m.errori.length && m.daVerificare.length === 2, "voci marcate [DA VERIFICARE]: non bloccano ma sono elencate");
  fs.mkdirSync(dati, { recursive: true });
  fs.writeFileSync(path.join(dati, "registro-normattiva.jsonl"), JSON.stringify({ t: Date.now(), strumento: "estrai_articolo", argomenti: { tipo: "legge", numero: 392, anno: 1978, numeroArticolo: "5" }, testo: "Art. 5 (Inadempimento del conduttore) Salvo quanto previsto dall'articolo 55, il mancato pagamento del canone decorsi venti giorni dalla scadenza prevista costituisce motivo di risoluzione" }) + "\n");
  const nm = await prova("art. 5 L. 392/1978: «il mancato pagamento del canone decorsi venti giorni dalla scadenza prevista».");
  verifica_(!nm.errori.length && nm.ok.some(x => /Normattiva/.test(x)), "norma scaricata da Normattiva (registro) e citazione dal suo testo");
  const vecchio = JSON.stringify({ t: Date.now() - 40 * 86400e3, strumento: "estrai_articolo", argomenti: { tipo: "legge", numero: 300, anno: 1970, numeroArticolo: "18" }, testo: "Art. 18 ..." });
  fs.appendFileSync(path.join(dati, "registro-normattiva.jsonl"), vecchio + "\n");
  verifica_((await prova("art. 18 L. 300/1970")).errori.length === 0, "statuto dei lavoratori: e' nell'app, verificato sul testo dell'app");

  fs.rmSync(dati, { recursive: true, force: true });
  console.log("\n" + ok + "/" + (ok + ko) + " verifiche superate");
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
