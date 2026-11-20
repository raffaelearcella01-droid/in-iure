/* Installa (o aggiorna) sul PC in uso il PERIMETRO GLOBALE di Antigravity CLI (agy), che vale in qualunque
 * cartella si avvii agy, anche fuori da In Iure (richiesta dell'utente del 20/11/2026):
 *  1. ~/.gemini/config/hooks/limita-cartella.js  (sempre aggiornato dalla copia in git di questa cartella)
 *     ~/.gemini/config/hooks/limita-cartella.json (copiato solo se manca: le modifiche locali restano;
 *                                                  i domini ammessi sono comunque riportati a quelli ufficiali)
 *  2. ~/.gemini/config/hooks.json: voce "limita-alla-cartella" (le altre voci dell'utente restano);
 *  3. ~/.gemini/GEMINI.md: regola globale tra i segnaposto IN-IURE-PERIMETRO (il resto del file resta);
 *  4. ~/.gemini/antigravity-cli/settings.json: "allowNonWorkspaceAccess": false (copia di sicurezza se cambia).
 * Lo chiama configura.js a ogni avvio (AVVIA_GEMINI_IN_IURE.bat, APRI_PRATICA_IN_IURE.bat); si puo' anche
 * lanciare a mano: node installa.js   (--home <cartella> solo per i test). Non tocca nulla delle skill di Claude. */
"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");

const DOMINI = ["normattiva.it", "giustizia.it"];
const VOCE = "limita-alla-cartella";
const MATCHER = "read_.*|view_.*|list_.*|grep.*|find_.*|.*search.*|glob.*|write_.*|edit_.*|.*replace.*|run_.*|.*command.*|.*url.*|browser_.*|.*file.*";
const INIZIO = "<!-- IN-IURE-PERIMETRO-INIZIO (aggiornato da In-Iure-Gemini/perimetro/installa.js) -->";
const FINE = "<!-- IN-IURE-PERIMETRO-FINE -->";

function installa(home) {
  const fatto = [];
  const gem = path.join(home, ".gemini");
  const cfg = path.join(gem, "config");
  const dirHook = path.join(cfg, "hooks");
  fs.mkdirSync(dirHook, { recursive: true });
  const leggi = f => { try { return fs.readFileSync(f, "utf8"); } catch (e) { return null; } };
  const scriviSeDiverso = (f, testo, nome) => { if (leggi(f) !== testo) { fs.writeFileSync(f, testo); fatto.push(nome); } };

  // 1. script dell'hook e configurazione
  scriviSeDiverso(path.join(dirHook, "limita-cartella.js"), fs.readFileSync(path.join(__dirname, "limita-cartella.js"), "utf8"), "hook");
  const fConf = path.join(dirHook, "limita-cartella.json");
  let conf = null;
  try { conf = JSON.parse(leggi(fConf)); } catch (e) { conf = null; }
  if (!conf || typeof conf !== "object") conf = JSON.parse(fs.readFileSync(path.join(__dirname, "limita-cartella.json"), "utf8"));
  conf.dominiGiuridici = DOMINI.slice();   // solo Normattiva e Ministero: non si allarga localmente
  scriviSeDiverso(fConf, JSON.stringify(conf, null, 2) + "\n", "configurazione dell'hook");

  // 2. collegamento in hooks.json
  const fHooks = path.join(cfg, "hooks.json");
  let hooks = {};
  const testoHooks = leggi(fHooks);
  if (testoHooks != null) {
    try { hooks = JSON.parse(testoHooks); } catch (e) {
      fs.copyFileSync(fHooks, fHooks + ".non-valido-" + Date.now()); hooks = {}; fatto.push("hooks.json non valido (copia conservata)");
    }
  }
  hooks[VOCE] = { PreToolUse: [{ matcher: MATCHER, hooks: [{ type: "command", command: "node hooks/limita-cartella.js", timeout: 10 }] }] };
  scriviSeDiverso(fHooks, JSON.stringify(hooks, null, 2) + "\n", "hooks.json");

  // 3. regola globale
  const fMd = path.join(gem, "GEMINI.md");
  const regola = fs.readFileSync(path.join(__dirname, "GEMINI-globale.md"), "utf8").replace(/\r\n/g, "\n").trim();
  const blocco = INIZIO + "\n" + regola + "\n" + FINE;
  let md = (leggi(fMd) || "").replace(/\r\n/g, "\n");
  const i = md.indexOf(INIZIO.slice(0, 30)), j = md.indexOf(FINE);
  if (i >= 0 && j > i) md = md.slice(0, i) + blocco + md.slice(j + FINE.length);
  else if (md.trim().startsWith("# Perimetro di lavoro (regola globale dello studio)")) md = blocco + "\n";   // prima versione (PC A5, 20/11)
  else md = (md.trim() ? md.replace(/\s*$/, "\n\n") : "") + blocco + "\n";
  scriviSeDiverso(fMd, md, "GEMINI.md");

  // 4. niente accesso fuori dalla cartella di lavoro
  const fSet = path.join(gem, "antigravity-cli", "settings.json");
  const testoSet = leggi(fSet);
  let set = {};
  if (testoSet != null) { try { set = JSON.parse(testoSet); } catch (e) { set = null; } }
  if (set && set.allowNonWorkspaceAccess !== false) {
    if (testoSet != null) {   // copia di sicurezza con data e ora: non sovrascrive mai una copia precedente
      let bak = fSet + ".bak-" + new Date().toISOString().slice(0, 19).replace(/[-:]/g, "").replace("T", "-");
      const base = bak;
      for (let n = 2; fs.existsSync(bak); n++) bak = base + "-" + n;
      fs.copyFileSync(fSet, bak);
    }
    set.allowNonWorkspaceAccess = false;
    fs.mkdirSync(path.dirname(fSet), { recursive: true });
    fs.writeFileSync(fSet, JSON.stringify(set, null, 2) + "\n");
    fatto.push("settings.json (accesso fuori cartella disattivato)");
  } else if (!set) fatto.push("ATTENZIONE: settings.json di agy non valido, non modificato");
  return fatto;
}

module.exports = { installa };

if (require.main === module) {
  const iH = process.argv.indexOf("--home");
  const home = iH > 0 ? path.resolve(process.argv[iH + 1]) : os.homedir();
  const fatto = installa(home);
  console.log("Perimetro di Antigravity: " + (fatto.length ? "aggiornato (" + fatto.join(", ") + ")" : "gia' attivo"));
}
