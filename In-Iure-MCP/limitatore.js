/* Protezione anti-blocco dell'IP per le fonti online (SentenzeWeb, Normattiva).
 *
 * Regole, uguali per tutte le fonti (valori per fonte in LIMITI):
 *  - una richiesta alla volta, con un intervallo minimo tra l'una e l'altra;
 *  - tetto di richieste all'ora e al giorno: raggiunto il tetto si risponde senza contattare il sito;
 *  - se il sito risponde 403/429/503, va in errore di rete o in timeout, scatta una PAUSA (15 minuti,
 *    che raddoppia a ogni nuovo segnale fino a 6 ore) durante la quale il sito non viene contattato;
 *  - cache su disco: la stessa domanda non viene mai ripetuta al sito entro la durata della cache.
 * Lo stato (conteggi e pause) e' salvato in %LOCALAPPDATA%\InIure-MCP, quindi vale anche tra una sessione
 * di Gemini e l'altra e tra piu' finestre aperte insieme.
 */
"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");

const BASE = process.env.IN_IURE_MCP_DATI || path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), ".cache"), "InIure-MCP");

const LIMITI = {
  sentenzeweb: { intervalloMs: 3000, orari: 120, giornalieri: 600 },
  normattiva: { intervalloMs: 4000, orari: 90, giornalieri: 400 },
  default: { intervalloMs: 4000, orari: 60, giornalieri: 300 },
};
const PAUSA_INIZIALE_MS = 15 * 60 * 1000;
const PAUSA_MAX_MS = 6 * 60 * 60 * 1000;

const attesa = ms => new Promise(r => setTimeout(r, ms));
const ora = () => Date.now();

class ErroreLimite extends Error {}

class Limitatore {
  constructor(nome, opzioni) {
    this.nome = nome;
    this.lim = Object.assign({}, LIMITI[nome] || LIMITI.default, opzioni || {});
    this.fileStato = path.join(BASE, "stato-" + nome + ".json");
    this.dirCache = path.join(BASE, "cache", nome);
    this.coda = Promise.resolve();
    fs.mkdirSync(this.dirCache, { recursive: true });
  }

  stato() {
    try { return JSON.parse(fs.readFileSync(this.fileStato, "utf8")); }
    catch (e) { return { richieste: [], pausaFino: 0, pausaMs: 0, ultimoMotivo: "" }; }
  }

  salva(s) {
    const tmp = this.fileStato + "." + process.pid + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(s));
    fs.renameSync(tmp, this.fileStato);
  }

  /* ---- cache */
  chiave(oggetto) { return crypto.createHash("sha1").update(JSON.stringify(oggetto)).digest("hex"); }

  leggiCache(chiave, durataMs) {
    const f = path.join(this.dirCache, chiave + ".json");
    try {
      const c = JSON.parse(fs.readFileSync(f, "utf8"));
      if (durataMs === Infinity || ora() - c.t < durataMs) return c.v;
    } catch (e) { /* assente */ }
    return undefined;
  }

  scriviCache(chiave, valore) {
    try { fs.writeFileSync(path.join(this.dirCache, chiave + ".json"), JSON.stringify({ t: ora(), v: valore })); }
    catch (e) { /* cache non essenziale */ }
  }

  /* ---- controllo prima di contattare il sito */
  verifica(s) {
    const adesso = ora();
    if (s.pausaFino > adesso) {
      const min = Math.ceil((s.pausaFino - adesso) / 60000);
      throw new ErroreLimite("Protezione anti-blocco: " + this.nome + " e' in pausa per altri " + min + " minuti" +
        (s.ultimoMotivo ? " (ultimo segnale dal sito: " + s.ultimoMotivo + ")" : "") + ". Riprova piu' tardi.");
    }
    s.richieste = (s.richieste || []).filter(t => adesso - t < 24 * 3600 * 1000);
    const ultimaOra = s.richieste.filter(t => adesso - t < 3600 * 1000).length;
    if (ultimaOra >= this.lim.orari)
      throw new ErroreLimite("Protezione anti-blocco: raggiunto il tetto di " + this.lim.orari + " richieste all'ora verso " + this.nome + ". Riprova tra un po'.");
    if (s.richieste.length >= this.lim.giornalieri)
      throw new ErroreLimite("Protezione anti-blocco: raggiunto il tetto di " + this.lim.giornalieri + " richieste nelle ultime 24 ore verso " + this.nome + ".");
  }

  segnalaProblema(motivo) {
    const s = this.stato();
    s.pausaMs = Math.min(s.pausaMs ? s.pausaMs * 2 : PAUSA_INIZIALE_MS, PAUSA_MAX_MS);
    s.pausaFino = ora() + s.pausaMs;
    s.ultimoMotivo = motivo;
    this.salva(s);
  }

  segnalaSuccesso() {
    const s = this.stato();
    if (s.pausaMs) { s.pausaMs = 0; s.ultimoMotivo = ""; this.salva(s); }
  }

  /* Esegue fn() rispettando coda, intervallo e tetti. fn deve restituire il risultato o lanciare un errore
     con .segnaleBlocco = true se il sito ha dato segni di fastidio. */
  esegui(fn) {
    const giro = this.coda.then(async () => {
      let s = this.stato();
      this.verifica(s);
      const ultima = s.richieste.length ? s.richieste[s.richieste.length - 1] : 0;
      const manca = ultima + this.lim.intervalloMs - ora();
      if (manca > 0) await attesa(manca);
      s = this.stato();
      this.verifica(s);
      s.richieste.push(ora());
      this.salva(s);
      try {
        const r = await fn();
        this.segnalaSuccesso();
        return r;
      } catch (e) {
        if (e.segnaleBlocco) this.segnalaProblema(e.message);
        throw e;
      }
    });
    this.coda = giro.catch(() => {});
    return giro;
  }

  /* Con cache: se la risposta e' in cache non contatta il sito. */
  async conCache(oggettoChiave, durataMs, fn) {
    const k = this.chiave(oggettoChiave);
    const c = this.leggiCache(k, durataMs);
    if (c !== undefined) return c;
    const v = await this.esegui(fn);
    this.scriviCache(k, v);
    return v;
  }

  riepilogo() {
    const s = this.stato(), adesso = ora();
    const r = (s.richieste || []);
    return {
      fonte: this.nome,
      ultima_ora: r.filter(t => adesso - t < 3600e3).length + "/" + this.lim.orari,
      ultime_24_ore: r.filter(t => adesso - t < 86400e3).length + "/" + this.lim.giornalieri,
      in_pausa: s.pausaFino > adesso ? "si', per " + Math.ceil((s.pausaFino - adesso) / 60000) + " minuti" : "no",
    };
  }
}

/* Autorita' di certificazione: quelle standard di Node + gli intermedi in ./certificati.
   Serve perche' alcuni siti pubblici (es. italgiure.giustizia.it) inviano una catena incompleta:
   la verifica del certificato resta COMPLETA, si fornisce solo l'anello mancante (pubblico). */
const tls = require("tls");
const https = require("https");
const DIR_CERT = path.join(__dirname, "certificati");
const CA = tls.rootCertificates.slice();
try { for (const f of fs.readdirSync(DIR_CERT)) if (f.endsWith(".pem")) CA.push(fs.readFileSync(path.join(DIR_CERT, f), "utf8")); } catch (e) { /* nessun intermedio */ }
const agente = new https.Agent({ ca: CA, keepAlive: false, maxSockets: 1 });

// errori di rete che possono indicare un rifiuto del sito (non gli errori di configurazione, es. certificati)
const RETE_SOSPETTA = new Set(["ECONNRESET", "ECONNREFUSED", "ETIMEDOUT", "EPIPE", "TIMEOUT"]);

/* GET con timeout; classifica le risposte "di fastidio" come segnale di blocco. Restituisce { status, testo, json() } */
function scarica(url, opzioni) {
  const timeoutMs = (opzioni && opzioni.timeoutMs) || 30000;
  return new Promise((ok, ko) => {
    const req = https.get(url, { agent: agente, headers: { "User-Agent": "InIure-MCP/1.0 (consultazione personale, richieste limitate)", "Accept": "application/json" } }, res => {
      const pezzi = [];
      res.on("data", c => pezzi.push(c));
      res.on("end", () => {
        const testo = Buffer.concat(pezzi).toString("utf8");
        if ([403, 429, 503].includes(res.statusCode)) { const e = new Error("HTTP " + res.statusCode); e.segnaleBlocco = true; return ko(e); }
        if (res.statusCode < 200 || res.statusCode >= 300) return ko(new Error("HTTP " + res.statusCode));
        ok({ status: res.statusCode, testo, json: async () => JSON.parse(testo) });
      });
      res.on("error", ko);
    });
    req.setTimeout(timeoutMs, () => { const e = new Error("timeout"); e.code = "TIMEOUT"; req.destroy(e); });
    req.on("error", e => {
      const err = new Error("rete non raggiungibile o timeout (" + (e.code || e.message) + ")");
      err.segnaleBlocco = RETE_SOSPETTA.has(e.code);
      ko(err);
    });
  });
}

module.exports = { Limitatore, ErroreLimite, scarica, BASE, LIMITI };
