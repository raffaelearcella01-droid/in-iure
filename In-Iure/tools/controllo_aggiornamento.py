# -*- coding: utf-8 -*-
"""Controlli di sicurezza prima di pubblicare un aggiornamento automatico della normativa.
Blocca la pubblicazione (uscita con errore) se qualcosa sembra anomalo: codici mancanti, articoli
spariti in massa, file non leggibili. Confronta con la versione pubblicata (git HEAD)."""
import os, sys, json, subprocess
APP = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

def load_index(txt):
    return {c["id"]: c for c in json.loads(txt[txt.index("["): txt.rindex("]") + 1])}

nuovo = load_index(open(os.path.join(APP, "js", "codici-index.js"), encoding="utf-8").read())
try:
    vecchio = load_index(subprocess.check_output(["git", "show", "HEAD:In-Iure/js/codici-index.js"], cwd=APP, stderr=subprocess.DEVNULL).decode("utf-8"))
except Exception:
    # senza repository git: confronto con la copia salvata prima dello scaricamento (aggiorna_e_pubblica.py)
    prec = os.environ.get("IN_IURE_INDICE_PRECEDENTE", "")
    vecchio = load_index(open(prec, encoding="utf-8").read()) if prec and os.path.exists(prec) else {}
errori = []
for cid, c in vecchio.items():
    if cid not in nuovo:
        errori.append("codice sparito: " + cid)
    elif nuovo[cid]["count"] < c["count"] * 0.97:
        errori.append("%s: articoli scesi da %d a %d" % (cid, c["count"], nuovo[cid]["count"]))
for cid, c in nuovo.items():
    f = os.path.join(APP, c["file"])
    t = open(f, encoding="utf-8").read()
    if not t.startswith("registerCodice(") or len(t) < 2000:
        errori.append("file non valido: " + c["file"])
        continue
    d = json.loads(t[len("registerCodice("): t.rindex(")")])
    vuoti = sum(1 for a in d["articoli"] if not a.get("commi"))
    if vuoti:
        errori.append("%s: %d articoli senza testo" % (cid, vuoti))
if errori:
    print("CONTROLLO NON SUPERATO - aggiornamento NON pubblicato:")
    print("\n".join("  - " + e for e in errori))
    sys.exit(1)
cambiati = [cid for cid in nuovo if cid in vecchio and nuovo[cid].get("aggiornato") != vecchio[cid].get("aggiornato")]
print("Controllo superato: %d codici. Con nuove modifiche: %s" % (len(nuovo), ", ".join(cambiati) or "nessuno"))
