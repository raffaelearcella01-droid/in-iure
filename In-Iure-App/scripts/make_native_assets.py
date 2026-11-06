# -*- coding: utf-8 -*-
# Genera in assets/ le immagini sorgente (1024px icone, 2732px splash) per
# `npm run icons` (@capacitor/assets), riusando il disegno di In-Iure/tools/make_icons.py.
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "..", "In-Iure", "tools", "make_icons.py")
OUT = os.path.join(ROOT, "assets")
os.makedirs(OUT, exist_ok=True)

# Carica solo le definizioni (colori e funzioni), non le chiamate finali a make()
code = open(SRC, encoding="utf-8").read().split("\nmake(")[0]
ns = {}
exec(compile(code.replace("os.makedirs(OUT, exist_ok=True)", ""), SRC, "exec"), ns)
gradient_bg, draw_emblem = ns["gradient_bg"], ns["draw_emblem"]
NAVY2 = ns["NAVY2"]

S = 1024

def emblem_layer(size, scale):
    """Emblema su fondo trasparente, ridotto a `scale` e centrato."""
    big = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    draw_emblem(big, S)
    e = int(size * scale)
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    layer.paste(big.resize((e, e), Image.LANCZOS), ((size - e) // 2, (size - e) // 2))
    return layer

# Icona completa (iOS: niente trasparenza; il sistema arrotonda gli angoli)
icon = gradient_bg(S)
draw_emblem(icon, S)
icon.save(os.path.join(OUT, "icon-only.png"))

# Icona adattiva Android: sfondo + primo piano nella zona sicura (~66%)
gradient_bg(S).save(os.path.join(OUT, "icon-background.png"))
emblem_layer(S, 0.70).save(os.path.join(OUT, "icon-foreground.png"))

# Splash: fondo navy con emblema al centro
SP = 2732
splash = Image.new("RGBA", (SP, SP), NAVY2 + (255,))
splash.alpha_composite(emblem_layer(SP, 0.30))
splash.convert("RGB").save(os.path.join(OUT, "splash.png"))
splash.convert("RGB").save(os.path.join(OUT, "splash-dark.png"))

print("Asset generati in", OUT, ":", sorted(os.listdir(OUT)))
