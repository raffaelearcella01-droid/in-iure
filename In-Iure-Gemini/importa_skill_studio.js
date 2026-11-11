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

// elenco delle skill da importare: file RISERVATO, escluso da git (viaggia con Drive)
const ELENCO = path.join(__dirname, "skill-studio-elenco.txt");
function elencoSkill() {
  if (!fs.existsSync(ELENCO)) return [];
  return fs.readFileSync(ELENCO, "utf8").split(/?
/).map(x => x.trim()).filter(x => x && !x.startsWith("#"));
}

const ADATTAMENTO = `
> **Adattamento per l'assistente In Iure (Antigravity).** Questa skill e' stata scritta per un altro assistente.
> Valgono le regole di GEMINI.md, che prevalgono su quanto scritto sotto. In particolare:
> - **Fonti disponibili, e solo queste:** server \`in-iure\` (norme vigenti dell'app e modelli di atti: \`cerca_norme\`, \`leggi_articolo\`, \`cerca_modelli_atti\`, \`leggi_modello_atto\`), \`normattiva\` (norme non presenti nell'app e testi storici), \`sentenzeweb\` (Cassazione, ultimi 5 anni circa: \`cerca_sentenze\`, \`cerca_per_articolo\`, \`leggi_sentenza\`), \`pratica\` (documenti della cartella aperta: \`elenca_documenti\`, \`leggi_documento\`, \`cerca_nei_documenti\`; salvataggio: \`salva_documento_word\`).
> - Le fonti, banche dati e programmi citati sotto che NON sono nell'elenco qui sopra **non sono disponibili e non vanno usati ne' simulati**: se servirebbero, dillo all'utente ("non consultabile con le fonti disponibili"). Per la giurisprudenza usa solo \`sentenzeweb\`.
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
  const SKILL = elencoSkill();
  if (!SKILL.length) return { importate: 0, motivo: "elenco delle skill assente (" + ELENCO + "): resta la copia esistente" };
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
module.exports = { importa };
