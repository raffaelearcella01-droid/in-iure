# -*- coding: utf-8 -*-
"""Converte il riepilogo dei lavori (Markdown semplice) in un documento Word sul Desktop.
Uso: python riepilogo_docx.py   (legge Sito web/RIEPILOGO_LAVORI.md, scrive "Desktop/In Iure - riepilogo lavori.docx")
Supporta: # titoli, - elenchi, 1. elenchi numerati, **grassetto**, `codice`, righe vuote."""
import os, re
from docx import Document
from docx.shared import Pt, RGBColor

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.abspath(os.path.join(HERE, "..", "..", "RIEPILOGO_LAVORI.md"))
DESK = os.path.join(os.environ.get("USERPROFILE", os.path.expanduser("~")), "Desktop")
OUT = os.path.join(DESK, "In Iure - riepilogo lavori.docx")


def inline(par, testo):
    for pezzo in re.split(r"(\*\*[^*]+\*\*|`[^`]+`)", testo):
        if not pezzo:
            continue
        if pezzo.startswith("**"):
            par.add_run(pezzo[2:-2]).bold = True
        elif pezzo.startswith("`"):
            r = par.add_run(pezzo[1:-1]); r.font.name = "Consolas"; r.font.color.rgb = RGBColor(0x80, 0x20, 0x20)
        else:
            par.add_run(pezzo)


doc = Document()
doc.styles["Normal"].font.name = "Calibri"
doc.styles["Normal"].font.size = Pt(11)
for riga in open(SRC, encoding="utf-8").read().splitlines():
    s = riga.rstrip()
    if not s.strip():
        continue
    m = re.match(r"^(#{1,3}) (.*)", s)
    if m:
        doc.add_heading(m.group(2), level=len(m.group(1)) - 1 if len(m.group(1)) > 1 else 0); continue
    rientro = (len(s) - len(s.lstrip())) // 2
    m = re.match(r"^\s*- (.*)", s)
    if m:
        p = doc.add_paragraph(style="List Bullet 2" if rientro else "List Bullet"); inline(p, m.group(1)); continue
    m = re.match(r"^\s*(\d+)\. (.*)", s)
    if m:
        p = doc.add_paragraph(style="List Number 2" if rientro else "List Number"); inline(p, m.group(2)); continue
    inline(doc.add_paragraph(), s.strip())
doc.save(OUT)
print("Creato:", OUT)
