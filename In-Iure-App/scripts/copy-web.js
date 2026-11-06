// Copia la web-app ../In-Iure in una cartella di destinazione (default: www/, impacchettata
// da Capacitor) escludendo strumenti di build, documentazione e file solo-web, e aggiunge
// lo strato nativo (js/native.js) + jsPDF. Usato anche da ../In-Iure-Desktop (con desktop.js).
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.resolve(ROOT, "..", "In-Iure");

const EXCLUDE_DIRS = new Set(["tools", "node_modules", ".git"]);
const EXCLUDE_FILES = new Set(["index-standalone.html", "sw.js", "firestore.rules", "_headers"]);
const EXCLUDE_EXT = new Set([".md", ".pdf", ".py", ".map"]);

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) { if (!EXCLUDE_DIRS.has(e.name)) copyDir(s, d); continue; }
    if (EXCLUDE_FILES.has(e.name) || EXCLUDE_EXT.has(path.extname(e.name).toLowerCase())) continue;
    fs.copyFileSync(s, d);
  }
}

// out: cartella di destinazione · layer: file JS da inserire come js/<nome> prima di app.js
function copyWeb({ out = path.join(ROOT, "www"), layer = path.join(ROOT, "native", "native.js") } = {}) {
  fs.rmSync(out, { recursive: true, force: true });
  copyDir(SRC, out);

  // Strato nativo + jsPDF
  fs.mkdirSync(path.join(out, "vendor"), { recursive: true });
  fs.copyFileSync(require.resolve("jspdf/dist/jspdf.umd.min.js", { paths: [process.cwd(), ROOT] }), path.join(out, "vendor", "jspdf.umd.min.js"));
  const layerName = path.basename(layer);
  fs.copyFileSync(layer, path.join(out, "js", layerName));

  // Inserisce lo strato prima di app.js in index.html
  const idx = path.join(out, "index.html");
  let html = fs.readFileSync(idx, "utf8");
  const tag = '<script src="js/app.js"></script>';
  if (!html.includes(tag)) throw new Error("Tag di app.js non trovato in index.html");
  html = html.replace(tag, '<script src="js/' + layerName + '"></script>\n  ' + tag);
  fs.writeFileSync(idx, html);

  let n = 0;
  (function count(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) e.isDirectory() ? count(path.join(d, e.name)) : n++; })(out);
  console.log(path.basename(out) + "/ pronta: " + n + " file copiati da " + SRC + " (+ " + layerName + ")");
}

module.exports = { copyWeb };
if (require.main === module) copyWeb();
