# -*- coding: utf-8 -*-
# Icone desktop (build/icon.png 1024 e build/icon.ico multi-risoluzione) dal disegno di In-Iure/tools/make_icons.py
import os
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "..", "In-Iure", "tools", "make_icons.py")
code = open(SRC, encoding="utf-8").read().split("\nmake(")[0].replace("os.makedirs(OUT, exist_ok=True)", "")
ns = {}; exec(compile(code, SRC, "exec"), ns)
out = os.path.join(ROOT, "build"); os.makedirs(out, exist_ok=True)
png = os.path.join(out, "icon.png")
ns["make"](1024, png)
Image.open(png).save(os.path.join(out, "icon.ico"), sizes=[(16,16),(24,24),(32,32),(48,48),(64,64),(128,128),(256,256)])
print("Icone desktop:", os.listdir(out))
