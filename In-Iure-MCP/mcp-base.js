/* Trasporto MCP su stdio (JSON-RPC, un messaggio per riga), condiviso dai server In Iure. Nessuna dipendenza. */
"use strict";

function avviaServer({ nome, versione, istruzioni, strumenti, gestori, alAvvio }) {
  const invia = msg => process.stdout.write(JSON.stringify(msg) + "\n");
  const log = s => process.stderr.write("[" + nome + "] " + s + "\n");

  async function gestisci(msg) {
    const { id, method, params } = msg;
    const conId = id !== undefined && id !== null;
    const risposta = result => { if (conId) invia({ jsonrpc: "2.0", id, result }); };
    const errore = (code, message) => { if (conId) invia({ jsonrpc: "2.0", id, error: { code, message } }); };
    try {
      switch (method) {
        case "initialize":
          return risposta({
            protocolVersion: (params && params.protocolVersion) || "2025-06-18",
            capabilities: { tools: { listChanged: false } },
            serverInfo: { name: nome, version: versione },
            instructions: istruzioni,
          });
        case "ping": return risposta({});
        case "tools/list": return risposta({ tools: strumenti });
        case "tools/call": {
          const g = gestori[params && params.name];
          if (!g) return errore(-32602, "Strumento sconosciuto: " + (params && params.name));
          let testo, isError = false;
          try { testo = await g((params && params.arguments) || {}); }
          catch (e) { testo = e.message; isError = true; if (!e.silenzioso) log(e.stack || e.message); }
          return risposta({ content: [{ type: "text", text: String(testo) }], isError });
        }
        case "resources/list": return risposta({ resources: [] });
        case "prompts/list": return risposta({ prompts: [] });
        default:
          if (method && method.startsWith("notifications/")) return;
          return errore(-32601, "Metodo non supportato: " + method);
      }
    } catch (e) { log(e.stack); errore(-32603, e.message); }
  }

  let buf = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", chunk => {
    buf += chunk;
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const riga = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
      if (!riga) continue;
      let msg;
      try { msg = JSON.parse(riga); } catch (e) { invia({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "JSON non valido" } }); continue; }
      gestisci(msg);
    }
  });
  process.stdin.on("end", () => process.exit(0));
  if (alAvvio) try { log(alAvvio()); } catch (e) { log("ATTENZIONE: " + e.message); }
}

module.exports = { avviaServer };
