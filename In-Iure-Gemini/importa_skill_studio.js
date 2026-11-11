/* Importa nell'assistente Antigravity le skill di Claude dello studio (pareri e atti), adattandole alle fonti
 * di In Iure. Sorgente: %USERPROFILE%\.claude\skills (o variabile IN_IURE_SKILL_STUDIO). Destinazione:
 * In-Iure-Gemini/skill-studio/ (ESCLUSA da git: sono materiali dello studio e il repository In Iure e' pubblico;
 * Google Drive la porta comunque sugli altri PC). Se la sorgente non c'e' (altro PC), resta la copia gia' fatta.
 * Si copiano solo i file .md (istruzioni e riferimenti): script e modelli .docx non sono utilizzabili da Antigravity.
 * Uso: node importa_skill_studio.js   (lo chiama anche configura.js a ogni avvio) */
"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");

const SKILL = [
  // pareri, analisi e ricerca
  "parere-legale", "quesito-giuridico", "analisi-fascicolo", "mappatura-fatti", "analisi-transattiva",
  "valutazione-rischio-legale", "valutazione-giudice-terzo", "revisione-contratti", "screening-nda", "conformita",
  "ricerca-rapida", "ricerca-approfondita", "audit-citazioni", "stile-forense",
  // atti
  "atto-di-citazione-DM110_23", "atto-di-citazione-tradizionale", "comparsa-costituzione", "memorie-171ter",
  "memoria-replica", "comparsa-conclusionale", "atto-di-appello", "ricorso-cassazione", "controricorso-cassazione",
  "ricorso-civile", "ricorso-semplificato", "ricorso-gdp", "rito-famiglia", "rito-ordinario-riformato",
  "nota-a-verbale", "note-trattazione-scritta", "negoziazione-assistita-famiglia", "precetto-aggiornato",
];

const ADATTAMENTO = `
> **Adattamento per l'assistente In Iure (Antigravity).** Questa skill e' stata scritta per un altro assistente.
> Valgono le regole di GEMINI.md, che prevalgono su quanto scritto sotto. In particolare:
> - **Fonti disponibili, e solo queste:** server \`in-iure\` (norme vigenti dell'app e modelli di atti: \`cerca_norme\`, \`leggi_articolo\`, \`cerca_modelli_atti\`, \`leggi_modello_atto\`), \`normattiva\` (norme non presenti nell'app e testi storici), \`sentenzeweb\` (Cassazione, ultimi 5 anni circa: \`cerca_sentenze\`, \`cerca_per_articolo\`, \`leggi_sentenza\`), \`pratica\` (documenti della cartella aperta: \`elenca_documenti\`, \`leggi_documento\`, \`cerca_nei_documenti\`; salvataggio: \`salva_documento_word\`).
> - Le fonti citate sotto e NON disponibili qui (Italgiure con credenziali, Dirittopratico, OneLegale, BDM, banche dati di merito, NotebookLM, gestionale dello studio, database SQLite, posta) **non vanno usate ne' simulate**: se servirebbero, dillo all'utente ("non consultabile con le fonti disponibili"). Per la giurisprudenza usa solo \`sentenzeweb\`.
> - Non eseguire script, comandi o programmi (Python, PowerShell, ecc.) e non cercare modelli .docx o carta intestata: non sono disponibili. Scrivi il testo completo e salvalo con \`salva_documento_word\` nella cartella della pratica. I calcoli (interessi, compensi, termini) vanno svolti per esteso nel testo, mostrando i passaggi, e segnalati come da verificare.
> - Non scrivere file in altro modo e non creare file di appoggio (.md, checkpoint, report): le eventuali parti intermedie si mostrano all'utente nella risposta.
`;

function dividiFrontmatter(t) {
  const m = t.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
  return m ? [m[0], t.slice(m[0].length)] : ["", t];
}
function copiaMd(da, a) {
  let n = 0;
  for (const v of fs.readdirSync(da, { withFileTypes: true })) {
    if (v.name.startsWith(".")) continue;
    const x = path.join(da, v.name), y = path.join(a, v.name);
    if (v.isDirectory()) { const k = copiaMd(x, y); n += k; }
    else if (/\.md$/i.test(v.name)) { fs.mkdirSync(a, { recursive: true }); fs.copyFileSync(x, y); n++; }
  }
  return n;
}

function importa(opzioni) {
  const sorg = (opzioni && opzioni.sorgente) || process.env.IN_IURE_SKILL_STUDIO || path.join(os.homedir(), ".claude", "skills");
  const dest = (opzioni && opzioni.destinazione) || path.join(__dirname, "skill-studio");
  if (!fs.existsSync(sorg)) return { importate: 0, motivo: "sorgente assente (" + sorg + "): resta la copia esistente" };
  const nuova = dest + ".nuova";
  fs.rmSync(nuova, { recursive: true, force: true });
  const mancanti = [];
  let n = 0;
  for (const nome of SKILL) {
    const d = path.join(sorg, nome);
    if (!fs.existsSync(path.join(d, "SKILL.md"))) { mancanti.push(nome); continue; }
    copiaMd(d, path.join(nuova, nome));
    const f = path.join(nuova, nome, "SKILL.md");
    const [fm, corpo] = dividiFrontmatter(fs.readFileSync(f, "utf8"));
    if (!/\ndescription:/.test("\n" + fm)) { mancanti.push(nome + " (senza description)"); fs.rmSync(path.join(nuova, nome), { recursive: true, force: true }); continue; }
    fs.writeFileSync(f, fm + ADATTAMENTO + "\n" + corpo);
    n++;
  }
  if (!n) { fs.rmSync(nuova, { recursive: true, force: true }); return { importate: 0, mancanti, motivo: "nessuna skill trovata" }; }
  fs.rmSync(dest, { recursive: true, force: true });
  fs.renameSync(nuova, dest);
  return { importate: n, mancanti };
}

if (require.main === module) {
  const r = importa();
  console.log("Skill dello studio importate: " + r.importate + (r.motivo ? " - " + r.motivo : "") + (r.mancanti && r.mancanti.length ? "; non trovate: " + r.mancanti.join(", ") : ""));
}
module.exports = { importa, SKILL };
