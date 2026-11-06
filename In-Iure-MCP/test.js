/* Collaudo del server MCP In Iure: protocollo stdio reale + ricarica automatica dopo un aggiornamento.
 * Uso: node test.js   (non modifica i dati dell'app: la prova di ricarica lavora su una copia temporanea) */
"use strict";
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const ORIG = path.resolve(__dirname, "..", "In-Iure", "js");
let ok = 0, ko = 0;
const verifica = (cond, nome) => { if (cond) { ok++; console.log("  ok  " + nome); } else { ko++; console.log("  NO  " + nome); } };

function avvia(jsDir) {
  const p = spawn(process.execPath, [path.join(__dirname, "server.js")], { env: Object.assign({}, process.env, { IN_IURE_JS: jsDir }) });
  let buf = "", attese = {}, n = 0;
  p.stdout.setEncoding("utf8");
  p.stdout.on("data", d => {
    buf += d; let i;
    while ((i = buf.indexOf("\n")) >= 0) { const m = JSON.parse(buf.slice(0, i)); buf = buf.slice(i + 1); if (attese[m.id]) { attese[m.id](m); delete attese[m.id]; } }
  });
  const chiama = (method, params) => new Promise(res => { const id = ++n; attese[id] = res; p.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n"); });
  const strumento = async (name, args) => (await chiama("tools/call", { name, arguments: args })).result.content[0].text;
  return { p, chiama, strumento, notifica: m => p.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: m }) + "\n") };
}

function copiaDir(da, a) {
  fs.mkdirSync(a, { recursive: true });
  for (const f of fs.readdirSync(da)) {
    const s = path.join(da, f), d = path.join(a, f);
    if (fs.statSync(s).isDirectory()) copiaDir(s, d); else fs.copyFileSync(s, d);
  }
}

(async () => {
  console.log("1) Protocollo MCP sui dati reali dell'app");
  const s = avvia(ORIG);
  const init = await s.chiama("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test", version: "1" } });
  verifica(init.result && init.result.serverInfo.name === "in-iure", "initialize");
  s.notifica("notifications/initialized");
  const lista = await s.chiama("tools/list", {});
  verifica(lista.result.tools.length === 6, "tools/list: 6 strumenti");
  verifica(/\(33\)/.test(await s.strumento("elenca_codici", {})), "elenca_codici: 33 atti");
  verifica(/danno ingiusto/.test(await s.strumento("leggi_articolo", { codice: "c.c.", articolo: "2043" })), "art. 2043 c.c.");
  verifica(/Memorie integrative/.test(await s.strumento("leggi_articolo", { codice: "cpc", articolo: "171 ter" })), "art. 171-ter c.p.c. (scritto '171 ter')");
  verifica(/non e' presente/.test(await s.strumento("leggi_articolo", { codice: "c.c.", articolo: "99999" })), "articolo inesistente segnalato");
  verifica(/non presente nell'app/.test(await s.strumento("leggi_articolo", { codice: "codice inventato", articolo: "1" })), "atto inesistente segnalato");
  verifica(/art\. 1120/.test(await s.strumento("cerca_norme", { testo: "\"lastrico solare\"" })), "cerca_norme con locuzione");
  verifica(/opposizione-decreto-ingiuntivo/.test(await s.strumento("cerca_modelli_atti", { testo: "opposizione decreto ingiuntivo" })), "cerca_modelli_atti");
  verifica(/TESTO DEL MODELLO/.test(await s.strumento("leggi_modello_atto", { id: "atto-citazione" })), "leggi_modello_atto");
  const err = await s.chiama("tools/call", { name: "inesistente", arguments: {} });
  verifica(!!err.error, "strumento sconosciuto -> errore");
  s.p.kill();

  console.log("2) Ricarica automatica dopo un aggiornamento (copia temporanea)");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "iniure-mcp-"));
  copiaDir(ORIG, tmp);
  const t = avvia(tmp);
  await t.chiama("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test", version: "1" } });
  verifica(/danno ingiusto/.test(await t.strumento("leggi_articolo", { codice: "c.c.", articolo: "2043" })), "testo prima dell'aggiornamento");
  const f = path.join(tmp, "codici", "codice-civile.js");
  fs.writeFileSync(f, fs.readFileSync(f, "utf8").replace("cagiona ad altri un danno ingiusto", "TESTO-DI-PROVA-AGGIORNATO"));
  verifica(/TESTO-DI-PROVA-AGGIORNATO/.test(await t.strumento("leggi_articolo", { codice: "c.c.", articolo: "2043" })), "testo nuovo letto senza riavviare il server");
  t.p.kill();
  fs.rmSync(tmp, { recursive: true, force: true });

  console.log("3) Protezione anti-blocco (senza rete, stato in cartella temporanea)");
  const dati = fs.mkdtempSync(path.join(os.tmpdir(), "iniure-lim-"));
  process.env.IN_IURE_MCP_DATI = dati;
  delete require.cache[require.resolve("./limitatore")];
  const { Limitatore, ErroreLimite } = require("./limitatore");
  const L = new Limitatore("prova", { intervalloMs: 300, orari: 3, giornalieri: 10 });
  const t0 = Date.now();
  await L.esegui(async () => 1); await L.esegui(async () => 2);
  verifica(Date.now() - t0 >= 300, "intervallo minimo tra due richieste");
  await L.esegui(async () => 3);
  let bloccata = false; try { await L.esegui(async () => 4); } catch (e) { bloccata = e instanceof ErroreLimite; }
  verifica(bloccata, "tetto orario: la quarta richiesta non parte");
  const L2 = new Limitatore("prova2", { intervalloMs: 0 });
  try { await L2.esegui(async () => { const e = new Error("HTTP 429"); e.segnaleBlocco = true; throw e; }); } catch (e) { /* atteso */ }
  let chiamato = false, inPausa = false;
  try { await L2.esegui(async () => { chiamato = true; }); } catch (e) { inPausa = /in pausa/.test(e.message); }
  verifica(inPausa && !chiamato, "dopo un HTTP 429 il sito non viene piu' contattato (pausa)");
  verifica(new Limitatore("prova2").stato().pausaFino > Date.now(), "la pausa e' salvata su disco (vale anche per le sessioni successive)");
  let n = 0;
  const L3 = new Limitatore("prova3", { intervalloMs: 0 });
  await L3.conCache({ q: "x" }, 60000, async () => ++n); const v = await L3.conCache({ q: "x" }, 60000, async () => ++n);
  verifica(n === 1 && v === 1, "cache: la stessa domanda non viene ripetuta al sito");
  const sw = require("./sentenzeweb");
  verifica(sw.testoInQuery('"lastrico solare" infiltr* OR umidita') === '"lastrico solare" AND infiltr* OR umidita', "SentenzeWeb: costruzione della query");
  verifica(sw.testoInQuery("a:b (c)") === "a AND b AND c", "SentenzeWeb: caratteri speciali neutralizzati");
  fs.rmSync(dati, { recursive: true, force: true });

  console.log("\n" + ok + "/" + (ok + ko) + " verifiche superate");
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
