# -*- coding: utf-8 -*-
"""Scarica da Normattiva il testo VIGENTE (XML Akoma Ntoso) dei codici e delle leggi
e rigenera i file js/codici/<id>.js + js/codici-index.js + js/codici-versioni.json.

Uso (dalla cartella tools/):
  python build_normattiva.py            -> scarica (se serve) e rigenera tutto
  python build_normattiva.py --fetch    -> forza il nuovo download di tutti gli XML
  python build_normattiva.py cpc cds    -> solo alcuni codici
Gli XML scaricati restano in ../../Codici e normative/Normattiva AKN/ (fonte, non distribuita).
"""
import os, sys, re, json, time, urllib.request, http.cookiejar, datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from akn_to_codice import convert

HERE = os.path.dirname(os.path.abspath(__file__))
APP = os.path.abspath(os.path.join(HERE, ".."))
OUT = os.path.join(APP, "js", "codici")
SRC = os.path.abspath(os.path.join(APP, "..", "Codici e normative", "Normattiva AKN"))
os.makedirs(OUT, exist_ok=True); os.makedirs(SRC, exist_ok=True)

# id, urn, nome, abbr, categoria, descrizione, prefisso dei <doc> (None = articolato strutturato)
CODES = [
 ("costituzione", "urn:nir:stato:costituzione:1947-12-27", "Costituzione della Repubblica Italiana", "Cost.", "Diritto Pubblico", "Testo vigente.", None),
 ("l241", "urn:nir:stato:legge:1990-08-07;241", "Legge sul procedimento amministrativo", "L. 241/1990", "Diritto Pubblico", "Legge 7 agosto 1990, n. 241.", None),
 ("cpa", "urn:nir:stato:decreto.legislativo:2010-07-02;104", "Codice del processo amministrativo", "c.p.a.", "Diritto Pubblico", "D.Lgs. 2 luglio 2010, n. 104 (Allegato 1).", r"^Allegato 1 Codice del processo amministrativo-art\. (.+)$"),
 ("contratti-pubblici", "urn:nir:stato:decreto.legislativo:2023-03-31;36", "Codice dei contratti pubblici", "D.Lgs. 36/2023", "Diritto Pubblico", "D.Lgs. 31 marzo 2023, n. 36 (articolato, senza allegati).", None),
 ("tu-edilizia", "urn:nir:stato:decreto.del.presidente.della.repubblica:2001-06-06;380", "Testo unico dell'edilizia", "D.P.R. 380/2001", "Diritto Pubblico", "D.P.R. 6 giugno 2001, n. 380.", None),

 ("codice-civile", "urn:nir:stato:regio.decreto:1942-03-16;262", "Codice Civile", "c.c.", "Diritto Civile", "Regio Decreto 16 marzo 1942, n. 262.", r"^CODICE CIVILE-art\. (.+)$"),
 ("preleggi", "urn:nir:stato:regio.decreto:1942-03-16;262", "Disposizioni sulla legge in generale (preleggi)", "disp. prel. c.c.", "Diritto Civile", "Disposizioni preliminari al Codice Civile.", r"^Disposizioni sulla legge in generale-art\. (.+)$"),
 ("disp-att-cc", "urn:nir:stato:regio.decreto:1942-03-30;318", "Disposizioni di attuazione del Codice Civile", "disp. att. c.c.", "Diritto Civile", "R.D. 30 marzo 1942, n. 318.", r"^Disposizioni per l'attuazione del Codice Civile e disposizioni transitorie-art\. (.+)$"),
 ("legge-divorzio", "urn:nir:stato:legge:1970-12-01;898", "Legge sul divorzio", "L. 898/1970", "Diritto Civile", "Legge 1 dicembre 1970, n. 898.", None),
 ("consumo", "urn:nir:stato:decreto.legislativo:2005-09-06;206", "Codice del consumo", "Cod. cons.", "Diritto Civile", "D.Lgs. 6 settembre 2005, n. 206.", None),
 ("assicurazioni", "urn:nir:stato:decreto.legislativo:2005-09-07;209", "Codice delle assicurazioni private", "Cod. ass.", "Diritto Civile", "D.Lgs. 7 settembre 2005, n. 209.", None),
 ("privacy", "urn:nir:stato:decreto.legislativo:2003-06-30;196", "Codice in materia di protezione dei dati personali", "Cod. privacy", "Diritto Civile", "D.Lgs. 30 giugno 2003, n. 196.", None),
 ("crisi-impresa", "urn:nir:stato:decreto.legislativo:2019-01-12;14", "Codice della crisi d'impresa e dell'insolvenza", "CCII", "Diritto Civile", "D.Lgs. 12 gennaio 2019, n. 14.", None),

 ("cpc", "urn:nir:stato:regio.decreto:1940-10-28;1443", "Codice di Procedura Civile", "c.p.c.", "Procedura Civile", "Regio Decreto 28 ottobre 1940, n. 1443.", r"^CODICE DI PROCEDURA CIVILE-art\. (.+)$"),
 ("disp-att-cpc", "urn:nir:stato:regio.decreto:1941-12-18;1368", "Disposizioni di attuazione del Codice di Procedura Civile", "disp. att. c.p.c.", "Procedura Civile", "R.D. 18 dicembre 1941, n. 1368.", r"^DISPOSIZIONI DI ATTUAZIONE DEL CODICE DI PROCEDURA CIVILE-art\. (.+)$"),
 ("mediazione", "urn:nir:stato:decreto.legislativo:2010-03-04;28", "Mediazione civile e commerciale", "D.Lgs. 28/2010", "Procedura Civile", "D.Lgs. 4 marzo 2010, n. 28.", None),
 ("negoziazione-assistita", "urn:nir:stato:decreto.legge:2014-09-12;132", "Negoziazione assistita e degiurisdizionalizzazione", "D.L. 132/2014", "Procedura Civile", "D.L. 12 settembre 2014, n. 132, conv. L. 162/2014.", None),
 ("legge-pinto", "urn:nir:stato:legge:2001-03-24;89", "Legge Pinto (equa riparazione)", "L. 89/2001", "Procedura Civile", "Legge 24 marzo 2001, n. 89.", None),
 ("tu-spese-giustizia", "urn:nir:stato:decreto.del.presidente.della.repubblica:2002-05-30;115", "Testo unico spese di giustizia", "D.P.R. 115/2002", "Procedura Civile", "D.P.R. 30 maggio 2002, n. 115.", None),

 ("codice-penale", "urn:nir:stato:regio.decreto:1930-10-19;1398", "Codice Penale", "c.p.", "Diritto Penale", "Regio Decreto 19 ottobre 1930, n. 1398.", r"^Codice Penale-art\. (.+)$"),
 ("dlgs231", "urn:nir:stato:decreto.legislativo:2001-06-08;231", "Responsabilità amministrativa degli enti", "D.Lgs. 231/2001", "Diritto Penale", "D.Lgs. 8 giugno 2001, n. 231.", None),
 ("tu-stupefacenti", "urn:nir:stato:decreto.del.presidente.della.repubblica:1990-10-09;309", "Testo unico stupefacenti", "D.P.R. 309/1990", "Diritto Penale", "D.P.R. 9 ottobre 1990, n. 309.", None),
 ("antimafia", "urn:nir:stato:decreto.legislativo:2011-09-06;159", "Codice antimafia", "D.Lgs. 159/2011", "Diritto Penale", "D.Lgs. 6 settembre 2011, n. 159.", None),
 ("tu-immigrazione", "urn:nir:stato:decreto.legislativo:1998-07-25;286", "Testo unico immigrazione", "D.Lgs. 286/1998", "Diritto Penale", "D.Lgs. 25 luglio 1998, n. 286.", None),

 ("cpp", "urn:nir:stato:decreto.del.presidente.della.repubblica:1988-09-22;447", "Codice di Procedura Penale", "c.p.p.", "Procedura Penale", "D.P.R. 22 settembre 1988, n. 447.", None),
 ("disp-att-cpp", "urn:nir:stato:decreto.legislativo:1989-07-28;271", "Norme di attuazione del Codice di Procedura Penale", "disp. att. c.p.p.", "Procedura Penale", "D.Lgs. 28 luglio 1989, n. 271.", r"^Norme(?: di attuazione del Codice di Procedura Penale)?-art\. (.+)$"),
 ("processo-minorile", "urn:nir:stato:decreto.del.presidente.della.repubblica:1988-09-22;448", "Processo penale minorile", "D.P.R. 448/1988", "Procedura Penale", "D.P.R. 22 settembre 1988, n. 448.", r"^Disposizioni sul processo penale a carico di imputati minorenni - Art\. (.+)$"),
 ("ord-penitenziario", "urn:nir:stato:legge:1975-07-26;354", "Ordinamento penitenziario", "L. 354/1975", "Procedura Penale", "Legge 26 luglio 1975, n. 354.", None),

 ("statuto-lavoratori", "urn:nir:stato:legge:1970-05-20;300", "Statuto dei lavoratori", "L. 300/1970", "Diritto del Lavoro", "Legge 20 maggio 1970, n. 300.", None),
 ("tu-sicurezza-lavoro", "urn:nir:stato:decreto.legislativo:2008-04-09;81", "Testo unico sicurezza sul lavoro", "D.Lgs. 81/2008", "Diritto del Lavoro", "D.Lgs. 9 aprile 2008, n. 81 (articolato, senza allegati).", None),

 ("tu-giustizia-tributaria", "urn:nir:stato:decreto.legislativo:2024-11-14;175", "Testo unico della giustizia tributaria", "D.Lgs. 175/2024", "Diritto Tributario", "D.Lgs. 14 novembre 2024, n. 175 (in vigore dal 1 gennaio 2026).", r"^Allegato-art\. (.+)$"),

 ("cds", "urn:nir:stato:decreto.legislativo:1992-04-30;285", "Codice della Strada", "C.d.S.", "Codici Speciali", "D.Lgs. 30 aprile 1992, n. 285.", None),
 ("ordinamento-forense", "urn:nir:stato:legge:2012-12-31;247", "Ordinamento della professione forense", "L. 247/2012", "Codici Speciali", "Legge 31 dicembre 2012, n. 247.", None),
]

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36"
_cj = http.cookiejar.CookieJar()
_op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(_cj))
_op.addheaders = [("User-Agent", UA)]


def get(url):
    for i in range(4):
        try:
            with _op.open(url, timeout=120) as r:
                return r.read()
        except Exception as e:
            if i == 3: raise
            time.sleep(3 * (i + 1))


def xml_path(urn):
    return os.path.join(SRC, re.sub(r"[^A-Za-z0-9]+", "_", urn) + ".xml")


def fetch(urn, force=False):
    p = xml_path(urn)
    if os.path.exists(p) and not force:
        return p
    page = get("https://www.normattiva.it/uri-res/N2Ls?" + urn).decode("utf-8", "replace")
    m = re.search(r'/do/atto/caricaAKN\?[^"]+', page)
    if not m:
        raise RuntimeError("link AKN non trovato per " + urn)
    data = get("https://www.normattiva.it" + m.group(0).replace("&amp;", "&"))
    if not data.lstrip().startswith(b"<?xml"):
        raise RuntimeError("risposta non XML per " + urn)
    with open(p, "wb") as f:
        f.write(data)
    time.sleep(1)
    return p


def load_local(cid):
    """Rubriche dell'estrazione dai PDF (luglio 2026): usate SOLO per confermare una rubrica senza parentesi."""
    f = os.path.join(HERE, "rubriche_pdf.json")
    try:
        return json.load(open(f, encoding="utf-8")).get(cid, {})
    except Exception:
        return {}


# codici con rubrica ufficiale per ogni articolo: solo qui si riconosce la rubrica anche senza parentesi
HEUR = {"codice-civile", "cpc", "codice-penale", "cpa", "processo-minorile", "tu-giustizia-tributaria"}


def costituzione_transitorie(xmlp):
    """Le Disposizioni transitorie e finali (I-XVIII) sono allegati separati: un'unica voce come in precedenza."""
    import xml.etree.ElementTree as ET
    from akn_to_codice import NS, text_of, clean
    root = ET.parse(xmlp).getroot()
    commi = []
    for d in root.iter(NS + "doc"):
        if not d.get("name", "").startswith("Allegato-"):
            continue
        t = clean(text_of(d.find(NS + "mainBody")))
        t = t.replace("DISPOSIZIONI TRANSITORIE E FINALI", "")
        lines = [l.strip() for l in t.split("\n") if l.strip()]
        if not lines:
            continue
        roman = lines[0] if re.match(r"^[IVXL]+$", lines[0]) else ""
        rest = lines[1:] if roman else lines
        commi.append((roman + ". " if roman else "") + " ".join(rest))
    return {"num": "Disp. trans.", "rubrica": "Disposizioni transitorie e finali", "commi": commi}


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    force = "--fetch" in sys.argv
    index = []
    prev_idx = {}
    try:   # data di aggiornamento precedente: cambia solo se cambia il testo (evita aggiornamenti "a vuoto")
        t = open(os.path.join(APP, "js", "codici-index.js"), encoding="utf-8").read()
        prev_idx = {c["id"]: c for c in json.loads(t[t.index("["): t.rindex("]") + 1])}
    except Exception:
        pass
    for cid, urn, nome, abbr, cat, desc, pref in CODES:
        p = fetch(urn, force)
        if args and cid not in args:
            pass
        meta = {"id": cid, "nome": nome, "abbr": abbr, "categoria": cat, "descrizione": desc}
        code = convert(p, meta, pref, load_local(cid), cid in HEUR)
        if cid == "costituzione":
            code["articoli"].append(costituzione_transitorie(p))
        vuoti = [a["num"] for a in code["articoli"] if not a["commi"]]
        if vuoti:
            print("  ATTENZIONE %s: articoli senza testo su Normattiva, omessi: %s" % (cid, ", ".join(vuoti)))
            code["articoli"] = [a for a in code["articoli"] if a["commi"]]
        payload = json.dumps(code, ensure_ascii=False, separators=(",", ":"))
        dest = os.path.join(OUT, cid + ".js")
        nuovo = "registerCodice(" + payload + ");\n"
        cambiato = not os.path.exists(dest) or open(dest, encoding="utf-8").read() != nuovo
        if not (args and cid not in args) and cambiato:
            with open(dest, "w", encoding="utf-8", newline="") as f:
                f.write(nuovo)
        if not (args and cid not in args):
            print("%-24s art=%5d  agg=%s  %7.1f KB" % (cid, len(code["articoli"]), code["aggiornato"], len(payload.encode("utf-8")) / 1024))
        index.append({"id": cid, "nome": nome, "abbr": abbr, "categoria": cat, "descrizione": desc,
                      "count": len(code["articoli"]), "aggiornato": code["aggiornato"], "verificato": (datetime.date.today().isoformat() if cambiato or cid not in prev_idx else prev_idx[cid].get("verificato", datetime.date.today().isoformat())), "urn": urn,
                      "file": "js/codici/" + cid + ".js"})
    with open(os.path.join(APP, "js", "codici-index.js"), "w", encoding="utf-8", newline="") as f:
        f.write("var CODICI_INDEX = " + json.dumps(index, ensure_ascii=False, indent=1) + ";\n")
    print("Indice: %d codici." % len(index))
    import versioni
    versioni.main()


if __name__ == "__main__":
    main()
