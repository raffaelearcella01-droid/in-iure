# -*- coding: utf-8 -*-
"""Crea lo zip del sito/app web da caricare su Netlify (installazione su iPhone da Safari).
Uso: python build_netlify_zip.py [versione]  -> ../../In-Iure-App/INSTALLER/InIure-<versione>-iphone-web-netlify.zip
     python build_netlify_zip.py --dir <cartella>  -> copia il sito in una cartella (usato da GitHub Pages)"""
import os, sys, zipfile
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.abspath(os.path.join(HERE, ".."))
VER = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("--") else "1.2"
OUT = os.path.abspath(os.path.join(SRC, "..", "In-Iure-App", "INSTALLER", "InIure-%s-iphone-web-netlify.zip" % VER))
EX_DIRS = {"tools", "node_modules", ".git"}
EX_FILES = {"index-standalone.html", "firestore.rules"}
EX_EXT = {".md", ".pdf", ".py", ".map"}
def files():
    for root, dirs, fs_ in os.walk(SRC):
        dirs[:] = [d for d in dirs if d not in EX_DIRS]
        for f in fs_:
            if f in EX_FILES or os.path.splitext(f)[1].lower() in EX_EXT:
                continue
            p = os.path.join(root, f)
            yield p, os.path.relpath(p, SRC).replace("\\", "/")

if "--dir" in sys.argv:
    import shutil
    dest = os.path.abspath(sys.argv[sys.argv.index("--dir") + 1])
    shutil.rmtree(dest, ignore_errors=True)
    k = 0
    for p, rel in files():
        os.makedirs(os.path.dirname(os.path.join(dest, rel)), exist_ok=True)
        shutil.copy2(p, os.path.join(dest, rel)); k += 1
    open(os.path.join(dest, ".nojekyll"), "w").close()
    print("Sito copiato in %s (%d file)" % (dest, k))
    sys.exit(0)

n = 0
with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for root, dirs, files in os.walk(SRC):
        dirs[:] = [d for d in dirs if d not in EX_DIRS]
        for f in files:
            if f in EX_FILES or os.path.splitext(f)[1].lower() in EX_EXT:
                continue
            p = os.path.join(root, f)
            z.write(p, os.path.relpath(p, SRC).replace("\\", "/")); n += 1
print("Creato %s (%d file, %.1f MB)" % (OUT, n, os.path.getsize(OUT) / 1e6))
