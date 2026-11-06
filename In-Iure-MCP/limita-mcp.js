#!/usr/bin/env node
/* Filtro anti-blocco da mettere DAVANTI a un server MCP esistente che consulta un sito pubblico
 * (es. il server Normattiva), senza modificarne il codice:
 *
 *   node limita-mcp.js --fonte normattiva [--cache-ore 24] -- node C:/.../Normattiva-MCP/dist/server.js
 *
 * Ogni chiamata a uno strumento (tools/call) passa dal limitatore (limitatore.js): una alla volta,
 * intervallo minimo, tetti orari e giornalieri, pausa automatica se il server riporta errori di
 * blocco (403, 429, "too many requests", captcha...) o non risponde. Le risposte riuscite vanno in cache:
 * la stessa domanda entro la durata della cache non raggiunge il sito.
 * Nota: il limite vale per CHIAMATA; se il server interno fa piu' richieste per una chiamata, non le vede. */
"use strict";
const { spawn } = require("child_process");
const { Limitatore, ErroreLimite } = require("./limitatore");

const argv = process.argv.slice(2);
const sep = argv.indexOf("--");
if (sep < 0 || sep === argv.length - 1) { console.error("Uso: limita-mcp.js --fonte NOME [--cache-ore N] -- comando argomenti..."); process.exit(2); }
const opz = argv.slice(0, sep), cmd = argv.slice(sep + 1);
const val = (k, d) => { const i = opz.indexOf(k); return i >= 0 ? opz[i + 1] : d; };
const fonte = val("--fonte", "sito");
const cacheMs = parseFloat(val("--cache-ore", "24")) * 3600 * 1000;
const TIMEOUT_MS = parseFloat(val("--timeout-sec", "170")) * 1000;
const lim = new Limitatore(fonte);
const SEGNALI = /\b(403|429|503)\b|too many requests|forbidden|captcha|rate.?limit|access denied|accesso negato|bloccat/i;

const figlio = spawn(cmd[0], cmd.slice(1), { stdio: ["pipe", "pipe", "inherit"], cwd: process.cwd() });
figlio.on("exit", c => process.exit(c || 0));
figlio.on("error", e => { process.stderr.write("[limita-mcp] impossibile avviare " + cmd[0] + ": " + e.message + "\n"); process.exit(1); });

const out = m => process.stdout.write(JSON.stringify(m) + "\n");
const alFiglio = m => figlio.stdin.write(JSON.stringify(m) + "\n");
const inAttesa = new Map();   // id -> resolve

function righe(stream, fn) {
  let buf = "";
  stream.setEncoding("utf8");
  stream.on("data", c => {
    buf += c; let i;
    while ((i = buf.indexOf("\n")) >= 0) { const r = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (r) fn(r); }
  });
}

righe(figlio.stdout, r => {
  let m; try { m = JSON.parse(r); } catch (e) { process.stdout.write(r + "\n"); return; }
  if (m.id !== undefined && inAttesa.has(m.id)) { const f = inAttesa.get(m.id); inAttesa.delete(m.id); f(m); }
  else out(m);
});

function testoRisultato(m) {
  if (m.error) return String(m.error.message || "");
  return ((m.result && m.result.content) || []).map(c => c.text || "").join(" ");
}

async function chiamata(m) {
  const chiave = lim.chiave({ name: m.params && m.params.name, arguments: (m.params && m.params.arguments) || {} });
  const inCache = lim.leggiCache(chiave, cacheMs);
  if (inCache !== undefined) return out(Object.assign({}, inCache, { id: m.id }));
  try {
    const risposta = await lim.esegui(() => new Promise((ok, ko) => {
      const t = setTimeout(() => {
        inAttesa.delete(m.id);
        const e = new Error("il server " + fonte + " non ha risposto entro " + TIMEOUT_MS / 1000 + " secondi"); e.segnaleBlocco = true; ko(e);
      }, TIMEOUT_MS);
      inAttesa.set(m.id, r => {
        clearTimeout(t);
        const errore = r.error || (r.result && r.result.isError);
        const testo = testoRisultato(r);
        if (errore && SEGNALI.test(testo)) {
          const e = new Error("segnale di blocco da " + fonte + ": " + testo.slice(0, 160)); e.segnaleBlocco = true; e.risposta = r; return ko(e);
        }
        ok(r);
      });
      alFiglio(m);
    }));
    if (!risposta.error && !(risposta.result && risposta.result.isError)) lim.scriviCache(chiave, { jsonrpc: "2.0", result: risposta.result });
    out(risposta);
  } catch (e) {
    const msg = e instanceof ErroreLimite ? e.message
      : "Protezione anti-blocco: " + e.message + ". " + fonte + " non verra' contattato per un po' (pausa automatica).";
    out({ jsonrpc: "2.0", id: m.id, result: { content: [{ type: "text", text: msg }], isError: true } });
  }
}

righe(process.stdin, r => {
  let m; try { m = JSON.parse(r); } catch (e) { figlio.stdin.write(r + "\n"); return; }
  if (m.method === "tools/call" && m.id !== undefined) chiamata(m);
  else alFiglio(m);
});
process.stdin.on("end", () => figlio.stdin.end());
