# -*- coding: utf-8 -*-
"""Calcola l'impronta (SHA-1) di tutti i contenuti aggiornabili e scrive:
  - js/codici-versioni.json  -> letto dalle app installate per scoprire se ci sono aggiornamenti
  - js/versioni.js           -> la stessa informazione, inclusa nell'installer (versione "di fabbrica")
La data "generato" cambia SOLO se cambia almeno un file: cosi' l'aggiornamento automatico settimanale
non produce nuove versioni quando la normativa non e' cambiata.
Uso: python versioni.py   (va eseguito dopo build_normattiva.py o dopo ogni modifica ad atti/quiz)
"""
import os, json, hashlib, datetime

APP = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
JS = os.path.join(APP, "js")
DATA_FILES = ["js/data-atti.js", "js/data-atti-extra.js", "js/data-quiz.js", "js/data-quiz-extra.js"]


def sha1(path):
    h = hashlib.sha1()
    with open(path, "rb") as f:
        h.update(f.read())
    return h.hexdigest()


def main():
    idx_txt = open(os.path.join(JS, "codici-index.js"), encoding="utf-8").read()
    idx = json.loads(idx_txt[idx_txt.index("["): idx_txt.rindex("]") + 1])
    files = {"js/codici-index.js": sha1(os.path.join(JS, "codici-index.js"))}
    for c in idx:
        files[c["file"]] = sha1(os.path.join(APP, c["file"]))
    for f in DATA_FILES:
        files[f] = sha1(os.path.join(APP, f))
    out_json = os.path.join(JS, "codici-versioni.json")
    prev = {}
    if os.path.exists(out_json):
        try:
            prev = json.load(open(out_json, encoding="utf-8"))
        except Exception:
            prev = {}
    if prev.get("files") == files and prev.get("generato"):
        generato = prev["generato"]
    else:
        generato = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    data = {"generato": generato, "codici": {c["id"]: c.get("aggiornato", "") for c in idx}, "files": files}
    with open(out_json, "w", encoding="utf-8", newline="") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    with open(os.path.join(JS, "versioni.js"), "w", encoding="utf-8", newline="") as f:
        f.write("var CONTENUTI_VERSIONI = " + json.dumps(data, ensure_ascii=False) + ";\n")
    print("Versioni: %d file, generato %s%s" % (len(files), generato, "" if generato != prev.get("generato") else " (invariato)"))


if __name__ == "__main__":
    main()
