# -*- coding: utf-8 -*-
"""Elenca le modifiche normative fra due versioni Normattiva (AKN) dello stesso codice.

Uso: python report_modifiche.py <id_codice> <xml_vecchio> <xml_nuovo> <data_vecchia YYYY-MM-DD>
Stampa in Markdown: atti modificativi successivi alla data, articoli nuovi / modificati / eliminati.
Le due versioni si scaricano con caricaAKN (parametro dataVigenza) - vedi build_normattiva.py.
"""
import sys, re, unicodedata
sys.path.insert(0, __import__("os").path.dirname(__file__))
from akn_to_codice import convert
from build_normattiva import CODES, HEUR

MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"]
TIPI = {"DECRETO-LEGGE": "D.L.", "DECRETO_LEGISLATIVO": "D.Lgs.", "LEGGE": "L.", "DECRETO_DEL_PRESIDENTE_DELLA_REPUBBLICA": "D.P.R.",
        "LEGGE_COSTITUZIONALE": "L. cost.", "SENTENZA_CORTE_COSTITUZIONALE": "Corte cost., sent."}


def n(s):
    s = unicodedata.normalize("NFD", (s or "").lower())
    return re.sub(r"[^a-z0-9]", "", "".join(c for c in s if not unicodedata.combining(c)))


def atti_modificativi(xml, dopo):
    s = open(xml, encoding="utf-8").read()
    refs = {m.group(1): m.group(2) for m in re.finditer(r'<passiveRef eId="([^"]+)" href="([^"]+)"', s)}
    out = []
    for d, src in re.findall(r'<eventRef date="([^"]+)" eId="[^"]+" source="([^"]+)"', s):
        if d <= dopo:
            continue
        h = refs.get(src, "")
        m = re.match(r"/akn/it/act/([^/]+)/[^/]+/(\d{4})-(\d{2})-(\d{2})/(\d+)", h)
        if m:
            t = TIPI.get(m.group(1).upper(), m.group(1).replace("_", " ").title())
            out.append("%s %d %s %s, n. %s (efficacia dal %s)" % (t, int(m.group(4)), MESI[int(m.group(3)) - 1], m.group(2), m.group(5), d))
        else:
            out.append("atto modificativo con efficacia dal %s (estremi non indicati nel file Normattiva)" % d)
    return out


def main():
    cid, old, new, dopo = sys.argv[1:5]
    meta = {c[0]: c for c in CODES}[cid]
    pref = meta[6]
    o = convert(old, {"id": cid}, pref, None, cid in HEUR)
    w = convert(new, {"id": cid}, pref, None, cid in HEUR)
    om = {a["num"]: a for a in o["articoli"]}
    wm = {a["num"]: a for a in w["articoli"]}
    nuovi = [k for k in wm if k not in om]
    elim = [k for k in om if k not in wm]
    mod = [k for k in wm if k in om and (n(" ".join(wm[k]["commi"])) != n(" ".join(om[k]["commi"])) or n(wm[k]["rubrica"]) != n(om[k]["rubrica"]))]
    print("### %s (%s) - modifiche dal %s al %s\n" % (meta[2], meta[3], dopo, w["aggiornato"]))
    atti = atti_modificativi(new, dopo)
    print("**Atti modificativi:** " + ("; ".join(atti) if atti else "nessuno") + "\n")

    def riga(k, a):
        return "- art. %s%s" % (k, (" - " + a["rubrica"]) if a["rubrica"] else "")
    print("**Articoli nuovi (%d):**" % len(nuovi))
    print("\n".join(riga(k, wm[k]) for k in nuovi) or "- nessuno")
    print("\n**Articoli modificati (%d):**" % len(mod))
    print("\n".join(riga(k, wm[k]) + (" *(ora abrogato)*" if re.search(r"ABROGAT", " ".join(wm[k]["commi"])[:200]) else "") for k in mod) or "- nessuno")
    print("\n**Articoli eliminati dalla banca dati (%d):** %s\n" % (len(elim), ", ".join(elim) or "nessuno"))


if __name__ == "__main__":
    main()
