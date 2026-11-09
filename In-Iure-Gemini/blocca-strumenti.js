/* Hook "PreToolUse" di Antigravity CLI (agy) per la cartella In-Iure-Gemini.
 * Antigravity passa su stdin la chiamata allo strumento ({ toolCall: { name, args }, ... }) e legge
 * su stdout la decisione. Qui si bloccano ricerca web, lettura di pagine web, browser, comandi di
 * sistema e modifica di file: l'assistente deve usare SOLO le fonti dell'app (server MCP in-iure,
 * sentenzeweb, normattiva), come gia' faceva la policy .gemini/policies/in-iure.toml per Gemini CLI.
 * Collegato da .agents/hooks.json, che viene riscritto da configura.js a ogni avvio. */
"use strict";
let dati = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", c => { dati += c; });
process.stdin.on("end", () => {
  let nome = "";
  try { nome = (JSON.parse(dati).toolCall || {}).name || ""; } catch (e) { /* input non leggibile: si blocca */ }
  process.stdout.write(JSON.stringify({
    decision: "deny",
    reason: "In questa cartella l'assistente usa solo le fonti dell'app In Iure (in-iure, sentenzeweb, normattiva): " +
      "strumento \"" + (nome || "sconosciuto") + "\" disattivato.",
  }));
});
