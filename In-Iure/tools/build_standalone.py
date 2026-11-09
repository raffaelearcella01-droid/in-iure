# -*- coding: utf-8 -*-
"""Crea un unico file HTML autonomo (index-standalone.html) con tutto incorporato."""
import os, re, base64

APP = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
def rd(p):
    with open(os.path.join(APP, p), encoding="utf-8") as f: return f.read()
def b64(p):
    with open(os.path.join(APP, p), "rb") as f: return base64.b64encode(f.read()).decode()

html = rd("index.html")
css = rd("css/styles.css")

# 1) CSS: sostituisci gli sfondi con data URI
for name in ["bg-codici", "bg-quiz", "bg-scrittura"]:
    data = "data:image/svg+xml;base64," + b64("icons/%s.svg" % name)
    css = css.replace('url("../icons/%s.svg")' % name, 'url("%s")' % data)

# 2) inserisci il CSS al posto del <link>
html = re.sub(r'<link rel="stylesheet" href="css/styles.css">',
              lambda m: "<style>\n" + css + "\n</style>", html)

# 3) logo come data URI
logo_uri = "data:image/svg+xml;base64," + b64("icons/logo.svg")
html = html.replace('src="icons/logo.svg"', 'src="%s"' % logo_uri)

# 4) togli manifest e apple-touch-icon (file assenti nello standalone)
html = re.sub(r'\s*<link rel="manifest"[^>]*>', "", html)
html = re.sub(r'\s*<link rel="icon"[^>]*>', "", html)
html = re.sub(r'\s*<link rel="apple-touch-icon"[^>]*>', "", html)

# 5) costruisci lo script unico: shim + dati + app
parts = []
parts.append("window.__CODICI_PRELOAD=[];window.registerCodice=function(c){window.__CODICI_PRELOAD.push(c);};")
parts.append(rd("js/codici-index.js"))
for cid in re.findall(r'"id":\s*"([^"]+)"', rd("js/codici-index.js")):
    parts.append(rd("js/codici/%s.js" % cid))
parts.append(rd("js/data-quiz.js"))
parts.append(rd("js/data-quiz-extra.js"))
parts.append(rd("js/data-atti.js"))
parts.append(rd("js/data-atti-extra.js"))
parts.append(rd("js/ricerca.js"))
parts.append(rd("js/app.js"))
big = "\n".join(parts).replace("</script>", "<\\/script>")  # sicurezza

# 6) sostituisci il blocco degli <script src=...> con l'unico script inline
html = re.sub(r'  <!-- Dati -->.*?<script src="js/app\.js"></script>',
              lambda m: "<script>\n" + big + "\n</script>", html, flags=re.S)

out = os.path.join(APP, "index-standalone.html")
# newline="" evita la traduzione LF->CRLF su Windows: mantiene i file identici ai sorgenti (parità byte-per-byte)
with open(out, "w", encoding="utf-8", newline="") as f:
    f.write(html)
print("Creato:", out)
print("Dimensione: %.1f MB" % (os.path.getsize(out) / 1024 / 1024))
