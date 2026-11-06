// Ordina gli articoli di ogni codice in sequenza numero+suffisso (127, 127-bis, 127-ter, 128...)
const fs = require("fs");
const DIR = require("path").resolve(__dirname, "..", "js", "codici");

const SUF = { "": 0, bis: 1, ter: 2, quater: 3, quinquies: 4, sexies: 5, septies: 6, octies: 7,
  novies: 8, decies: 9, undecies: 10, duodecies: 11, terdecies: 12, quaterdecies: 13,
  quinquiesdecies: 14, sexiesdecies: 15, septiesdecies: 16, duodevicies: 17, undevicies: 18, vicies: 19 };

function keyOf(num) {
  const s = String(num).toLowerCase();
  const base = s.match(/^\d+/) ? parseInt(s.match(/^\d+/)[0], 10) : 1e9;
  const sufs = s.replace(/^\d+/, "").split(/[\s\-]+/).filter(Boolean);
  const ranks = sufs.map(x => (SUF[x] !== undefined ? SUF[x] : 99));
  return [base].concat(ranks);
}
function cmp(a, b) {
  const ka = keyOf(a.num), kb = keyOf(b.num);
  const n = Math.max(ka.length, kb.length);
  for (let i = 0; i < n; i++) {
    const x = ka[i] || 0, y = kb[i] || 0;
    if (x !== y) return x - y;
  }
  return 0;
}

const files = fs.readdirSync(DIR).filter(f => f.endsWith(".js"));
files.forEach(f => {
  const p = DIR + "/" + f;
  let X = null; global.registerCodice = c => X = c;
  eval(fs.readFileSync(p, "utf8"));
  const before = X.articoli.map(a => a.num);
  X.articoli.sort(cmp);
  const after = X.articoli.map(a => a.num);
  const changed = before.join("|") !== after.join("|");
  fs.writeFileSync(p, "registerCodice(" + JSON.stringify(X) + ");\n", "utf8");
  console.log(f + ": " + X.articoli.length + " articoli " + (changed ? "riordinati" : "gia' ordinati"));
});

// verifica sequenza attorno al 127 nel c.p.c.
let CPC = null; global.registerCodice = c => CPC = c; eval(fs.readFileSync(DIR + "/cpc.js", "utf8"));
const idx = CPC.articoli.findIndex(a => a.num === "127");
console.log("\nSequenza c.p.c. attorno all'art. 127:", CPC.articoli.slice(idx, idx + 5).map(a => a.num).join("  ,  "));
