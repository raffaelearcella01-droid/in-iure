# -*- coding: utf-8 -*-
import os
from PIL import Image, ImageDraw, ImageFont

OUT = os.path.join(os.path.dirname(os.path.abspath(globals().get("__file__", "."))), "..", "icons")  # = In-Iure/icons
os.makedirs(OUT, exist_ok=True)

NAVY1 = (22, 55, 86)
NAVY2 = (15, 39, 64)
GOLD  = (208, 170, 100)
GOLD2 = (181, 139, 62)

def font(size):
    for p in [r"C:\Windows\Fonts\georgiab.ttf", r"C:\Windows\Fonts\georgia.ttf",
              r"C:\Windows\Fonts\timesbd.ttf", r"C:\Windows\Fonts\arialbd.ttf"]:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

def gradient_bg(size):
    img = Image.new("RGB", (size, size))
    px = img.load()
    for y in range(size):
        t = y / (size - 1)
        for x in range(size):
            tx = (x / (size - 1) + t) / 2
            r = int(NAVY1[0] + (NAVY2[0]-NAVY1[0])*tx)
            g = int(NAVY1[1] + (NAVY2[1]-NAVY1[1])*tx)
            b = int(NAVY1[2] + (NAVY2[2]-NAVY1[2])*tx)
            px[x, y] = (r, g, b)
    return img

def rounded_mask(size, radius):
    m = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(m)
    d.rounded_rectangle([0, 0, size-1, size-1], radius=radius, fill=255)
    return m

def draw_emblem(img, size, maskable=False):
    d = ImageDraw.Draw(img)
    s = size
    cx = s // 2
    # scala della giustizia stilizzata (bilancia)
    top = int(s*0.24)
    bottom = int(s*0.78)
    lw = max(4, s//60)
    # asta verticale
    d.line([(cx, top), (cx, bottom)], fill=GOLD, width=lw)
    # pomello
    r0 = s//45
    d.ellipse([cx-r0, top-r0*2, cx+r0, top], fill=GOLD)
    # braccio orizzontale
    armY = int(s*0.33)
    armL = int(s*0.23)
    d.line([(cx-armL, armY), (cx+armL, armY)], fill=GOLD, width=lw)
    # piatti (archi) sinistra e destra
    dish_r = int(s*0.11)
    drop = int(s*0.16)
    for sx in (cx-armL, cx+armL):
        # cordine
        d.line([(sx, armY), (sx-dish_r, armY+drop)], fill=GOLD, width=max(2, lw//2))
        d.line([(sx, armY), (sx+dish_r, armY+drop)], fill=GOLD, width=max(2, lw//2))
        d.arc([sx-dish_r, armY+drop-dish_r, sx+dish_r, armY+drop+dish_r], 0, 180, fill=GOLD, width=lw)
    # base
    baseW = int(s*0.14)
    baseY = bottom
    d.rounded_rectangle([cx-baseW, baseY, cx+baseW, baseY+lw*2], radius=lw, fill=GOLD)
    # § al centro
    f = font(int(s*0.20))
    txt = "§"
    bb = d.textbbox((0,0), txt, font=f)
    tw, th = bb[2]-bb[0], bb[3]-bb[1]
    d.text((cx-tw/2-bb[0], int(s*0.46)-th/2-bb[1]), txt, font=f, fill=GOLD)

def make(size, path, maskable=False):
    bg = gradient_bg(size)
    if maskable:
        emblem = bg.copy()
        draw_emblem(emblem, size, maskable=True)
        emblem.save(path)
        return
    radius = int(size*0.22)
    mask = rounded_mask(size, radius)
    draw_emblem(bg, size)
    out = Image.new("RGBA", (size, size), (0,0,0,0))
    out.paste(bg, (0,0), mask)
    out.save(path)

make(192, os.path.join(OUT, "icon-192.png"))
make(512, os.path.join(OUT, "icon-512.png"))
make(512, os.path.join(OUT, "icon-maskable-512.png"), maskable=True)
make(180, os.path.join(OUT, "apple-touch-icon.png"))
print("Icone generate:", os.listdir(OUT))
