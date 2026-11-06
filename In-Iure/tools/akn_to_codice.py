# -*- coding: utf-8 -*-
"""Converte l'XML Akoma Ntoso (AKN) "vigente" esportato da Normattiva nel formato
dei codici di In Iure: {id, nome, abbr, categoria, descrizione, aggiornato, articoli:[{num, rubrica, commi, note?}]}.

Gestisce i due formati prodotti da Normattiva:
  - "docs": i codici storici (c.c., c.p.c., c.p., disp. att., c.p.a. ...) in cui ogni articolo
    e' un <doc> allegato con il testo in un unico blocco ("Art. N. (Rubrica). commi...");
  - "articles": gli atti strutturati (c.p.p., C.d.S., leggi e decreti) con <article>/<paragraph>.
Il testo NON viene generato: e' quello ufficiale pubblicato da Normattiva.
"""
import re
import xml.etree.ElementTree as ET

NS = "{http://docs.oasis-open.org/legaldocml/ns/akn/3.0}"
SUFX = ("bis|ter|quater|quinquies|sexies|septies|octies|novies|nonies|decies|undecies|duodecies|"
        "terdecies|quaterdecies|quinquiesdecies|sexiesdecies|septiesdecies|octiesdecies|noviesdecies|vicies")
BLOCK = {"p", "point", "intro", "list", "item", "wrapUp", "tr", "blockList", "alinea"}


def tag(el):
    return el.tag.replace(NS, "")


def text_of(el):
    """Testo di un elemento, con a-capo sugli elementi di blocco e senza le note d'autore."""
    out = []

    def walk(e):
        t = tag(e)
        if t in ("authorialNote", "noteRef"):
            if e.tail: out.append(e.tail)
            return
        if t in BLOCK: out.append("\n")
        if t == "num" and e.text:
            out.append(e.text.strip() + " ")
        elif e.text:
            out.append(e.text)
        for c in e:
            walk(c)
        if t in BLOCK: out.append("\n")
        if t == "td": out.append(" | ")
        if e.tail: out.append(e.tail)
    walk(el)
    return "".join(out)


# ---- ripristino degli accenti (Normattiva scrive "e'" per "è") ----
_CHE = re.compile(r"\b(perch|poich|affinch|bench|sicch|cosicch|giacch|finch|purch|nonch|anzich|allorch|fuorch|dacch|ancorch|"
                  r"tantoch|nient|macch|caff|trentatr|ventitr|quarantatr|cinquantatr|sessantatr|settantatr|ottantatr|novantatr|centotr)e'(?=[\s,.;:)\]!?\"]|$)", re.I)


def fix_accents(s):
    s = _CHE.sub(lambda m: m.group(1) + ("É" if m.group(0)[-2].isupper() else "é"), s)
    s = re.sub(r"\b([Nn]|[Ss])e'(?=[\s,.;:)\]!?]|$)", lambda m: m.group(1) + "é", s)       # né, sé
    s = re.sub(r"\bE'(?=\s)", "È", s)
    s = re.sub(r"\bpo'", "po'", s)                                                           # elisione
    mp = {"a": "à", "e": "è", "i": "ì", "o": "ò", "u": "ù", "A": "À", "E": "È", "I": "Ì", "O": "Ò", "U": "Ù"}

    def rep(m):
        w = m.group(1)
        if w.lower() == "po":           # "po'" e' un troncamento, non un accento
            return m.group(0)
        return w[:-1] + mp[w[-1]]
    s = re.sub(r"\b([A-Za-zÀ-ÿ]*[aeiouAEIOU])'(?=[\s,.;:)\]!?\"»]|$)", rep, s)
    return s


def clean(s):
    s = s.replace(" ", " ").replace("\r", "")
    s = re.sub(r"\(\(\s*\d{1,4}[a-z]?\s*\)\)", "", s)    # rinvii alle note "((178))", "((90a))"
    s = re.sub(r"\[\[\s*\d{1,4}[a-z]?\s*\]\]", "", s)
    s = s.replace("((", "").replace("))", "")             # marcatori di modifica
    s = re.sub(r"(?<=[.;:,])\s*\(\d{1,3}[a-z]?\)(?=\s|$|\()", "", s)   # rinvii "(14)" a fine frase
    s = re.sub(r"(?<=[.;:,])\s*\(\d{1,3}[a-z]?\)(?=\s|$)", "", s)
    s = re.sub(r"(?<=\s)\(\d{1,3}\)(?=\s*$)", "", s, flags=re.M)
    s = re.sub(r"[ \t]+", " ", s)
    return fix_accents(s)


def norm_num(n):
    """'Art. 171 bis.' -> '171-bis'; '518-duodevicies' resta intero; '25-octies.1' conservato."""
    n = n.strip().strip(".").strip()
    n = re.sub(r"^(art(icolo)?\.?\s*)", "", n, flags=re.I).strip()
    m = re.match(r"^(\d+)(?:\s*-?\s*([a-z]+(?:[\s-][a-z]+)*))?\s*([./]\d+)?", n, re.I)
    if not m:
        return re.sub(r"\s+", "", n).lower()
    out = m.group(1)
    if m.group(2):
        out += "-" + re.sub(r"\s+", "-", m.group(2).lower())
    if m.group(3):
        out += m.group(3)
    return out


LIST_START = re.compile(r"^(\d+[)°]|\d+-?[a-z]{3,15}\)|[a-z]{1,2}\)|[a-z]-?[a-z]{3,15}\)|[-–•]\s|n\.\s?\d+\))", re.I)


def lines_to_commi(lines):
    lines = [l for l in lines if re.search(r"\w", l)]
    commi = []
    for ln in lines:
        ln = ln.strip()
        if not ln:
            continue
        if commi and (LIST_START.match(ln) or ln[0].islower() or commi[-1].endswith(":")):
            commi[-1] += "\n" + ln
        else:
            commi.append(ln)
    return commi


def split_notes(paragraphs):
    """paragraphs: lista di testi. Ritorna (testo, note) separando le note di aggiornamento."""
    body, notes, in_notes = [], [], False
    for t in paragraphs:
        st = t.strip()
        if re.match(r"^-{5,}", st) or re.match(r"^AGGIORNAMENTO\b", st):
            in_notes = True
        (notes if in_notes else body).append(t)
    note = "\n".join(re.sub(r"^-{5,}\s*", "", x.strip()) for x in notes).strip()
    return body, note


_VERB = re.compile(r"\b(è|sono|deve|devono|può|possono|si applica|si applicano|ha|hanno|chiunque|quando|se|qualora)\b", re.I)


def _n(x):
    return re.sub(r"[^a-z0-9]", "", x.lower())


def pick_rubrica(lines, local_rub="", heur=True):
    """Individua la rubrica: tra parentesi (formato Normattiva), uguale a quella gia' nota, o riga breve iniziale."""
    if not lines:
        return "", lines
    first = lines[0]
    # rubrica tra parentesi spezzata su piu' righe
    if first.startswith("(") and ")" not in first and len(lines) > 1 and ")" in lines[1]:
        first = first + " " + lines[1]
        lines = [first] + lines[2:]
    if first.startswith("("):
        depth, close = 0, -1
        for k, ch in enumerate(first):          # parentesi bilanciate: "(... lettera a) ...)"
            depth += (ch == "(") - (ch == ")")
            if depth == 0:
                close = k
                break
        if 0 < close < 400:
            inner = re.sub(r"\s+", " ", first[1:close]).strip().rstrip(".").strip()
            tail = first[close + 1:].strip().lstrip(".").strip()
            if not tail:
                return inner, lines[1:]
            if len(tail) < 160 and not _VERB.search(tail) and not re.match(r"^\d", tail):
                return inner + ". " + tail.rstrip("."), lines[1:]
            return inner, [tail] + lines[1:]          # dopo la rubrica inizia gia' il testo
    if len(lines) < 2:
        return "", lines
    f2 = re.sub(r"\s*\(\d{1,4}\)\s*$", "", first).strip()
    if local_rub and (_n(f2) == _n(local_rub) or (_n(f2).startswith(_n(local_rub)) and len(_n(local_rub)) > 8)):
        return f2.rstrip(".").strip(), lines[1:]
    if heur and len(f2) < 260 and not f2.endswith(":") and not _VERB.search(f2) and len(f2.split()) <= 40 and f2[:1].isupper():
        return f2.rstrip(".").strip(), lines[1:]
    return "", lines


def parse_doc_article(doc, local_rub="", heur=True):
    mb = doc.find(NS + "mainBody")
    if mb is None:
        return None
    paras = [text_of(p) for p in mb.iter(NS + "paragraph")] or [text_of(mb)]
    body, note = split_notes(paras)
    txt = clean("\n".join(body))
    lines = [l.strip() for l in txt.split("\n")]
    lines = [l for l in lines if l]
    if not lines:
        return None
    for i, l in enumerate(lines):           # scarta intestazioni (nome del codice, LIBRO...) prima di "Art. N."
        if re.match(r"^Art(?:icolo)?\.?\s*\d", l, re.I):
            lines = lines[i:]
            break
    m = re.match(r"^Art(?:icolo)?\.?\s*([0-9]+(?:\s*[-.]?\s*(?:" + SUFX + r"))*(?:\.\d+)?)\s*\.?\s*(.*)$", lines[0], re.I)
    if m:
        rest = m.group(2).strip()
        lines = ([rest] if rest else []) + lines[1:]
    # righe residue con il solo "Art." o il solo numero dell'articolo
    while lines and re.match(r"^(Art(icolo)?\.?)?\s*(\d+(\s*[-.]?\s*(" + SUFX + r"))*(\.\d+)?)?\s*\.?$", lines[0], re.I):
        lines = lines[1:]
    for i, l in enumerate(lines):           # note di aggiornamento nello stesso paragrafo del testo
        if re.match(r"^(-{5,}|AGGIORNAMENTO\b)", l):
            note = (note + "\n" if note else "") + "\n".join(lines[i:])
            lines = lines[:i]
            break
    rub, lines = pick_rubrica(lines, local_rub, heur)
    lines = [l for l in lines if re.search(r"\w", l)]
    return {"rubrica": rub, "commi": lines_to_commi(lines), "note": clean(note) if note else ""}


def parse_structured_article(art):
    numel = art.find(NS + "num")
    num = norm_num(numel.text if numel is not None and numel.text else "")
    h = art.find(NS + "heading")
    rub = clean(text_of(h)).strip() if h is not None else ""
    paras = []
    # rubrica + testo finiti entrambi nell'heading (es. art. 549 c.p.p.)
    mh = re.match(r"^\((.*?)\)[\s.]*\n\s*(.+)$", rub, re.S)
    if mh:
        rub, extra = mh.group(1), mh.group(2)
        paras.append(extra)
    rub = re.sub(r"^\((.*)\)\.?$", r"\1", rub.strip(), flags=re.S).strip().rstrip(".").strip()
    for p in art.findall(NS + "paragraph"):
        paras.append(text_of(p))
    if not paras:  # articoli senza commi strutturati
        paras = [text_of(c) for c in art if tag(c) not in ("num", "heading")]
    # testo storico non strutturato che ripete "Art. N." (+ rubrica tra parentesi) nel primo paragrafo
    if paras:
        p0 = [l for l in clean(paras[0]).split("\n") if l.strip()]
        if p0 and re.match(r"^\s*Art(icolo)?\.?\s*\d+[\w\s.-]*\.?\s*$", p0[0], re.I):
            p0 = p0[1:]
            if p0 and not rub:
                mr0 = re.match(r"^\s*\((.*?)\)[\s.]*$", p0[0])
                if mr0:
                    rub = mr0.group(1).strip().rstrip(".")
                    p0 = p0[1:]
            paras[0] = "\n".join(p0)
    # rubrica come primo paragrafo non numerato: "(Rubrica)"
    if not rub and paras:
        first = clean(paras[0]).strip()
        mr = re.match(r"^\(\s*(.*?)\s*\)[\s.]*$", first, re.S)
        if mr and len(first) < 300:
            rub = re.sub(r"\s+", " ", mr.group(1)).strip().rstrip(".")
            paras = paras[1:]
        else:
            # rubrica senza parentesi in un paragrafo non numerato seguito da commi numerati
            pls = art.findall(NS + "paragraph")
            if (len(pls) > 1 and pls[0].find(NS + "num") is None and pls[1].find(NS + "num") is not None
                    and first and len(first) < 220 and first.count("\n") <= 1 and not first.endswith((":", ";"))
                    and not _VERB.search(first)):
                rub = re.sub(r"\s*\n\s*", ". ", first)
                rub = re.sub(r"\s+", " ", rub).strip().rstrip(".").replace("..", ".")
                paras = paras[1:]
    body, note = split_notes(paras)
    commi = []
    for t in body:
        t = clean(t)
        t = re.sub(r"(^|\n)\s*(\d+(?:-[a-z]+)?\.|[a-z]{1,3}(?:-[a-z]+)?\)|\d+[)°])\s*\n\s*", r"\1\2 ", t)
        lines = [l.strip() for l in t.split("\n") if l.strip()]
        if not lines:
            continue
        c = lines[0]
        for l in lines[1:]:
            c += "\n" + l
        commi.append(c)
    # commi non numerati del testo storico (es. Costituzione): una riga = un comma
    if len(commi) == 1 and not re.match(r"^\d+(-\w+)?\.\s", commi[0]):
        commi = lines_to_commi(commi[0].split("\n"))
    return num, {"rubrica": rub, "commi": commi, "note": clean(note) if note else ""}


def numkey(n):
    m = re.match(r"^(\d+)(.*)$", n)
    order = ["", "bis", "ter", "quater", "quinquies", "sexies", "septies", "octies", "novies", "nonies", "decies",
             "undecies", "duodecies", "terdecies", "quaterdecies", "quinquiesdecies", "quindecies", "sexiesdecies", "septiesdecies", "octiesdecies", "duodevicies", "noviesdecies", "undevicies", "vicies"]
    if not m:
        return (999999, 0, n)
    suf = m.group(2).strip("-").split(".")[0].lower()
    sub = m.group(2).split(".")[1] if "." in m.group(2) else "0"
    si = order.index(suf) if suf in order else 50
    try:
        sub = int(sub)
    except ValueError:
        sub = 0
    return (int(m.group(1)), si, sub)


def convert(xml_path, meta, doc_prefix=None, local=None, heur=True):
    """meta: dict con id, nome, abbr, categoria, descrizione. doc_prefix: regex del nome dei <doc> da usare."""
    tree = ET.parse(xml_path)
    root = tree.getroot()
    eli = ""
    for a in root.iter(NS + "FRBRalias"):
        if a.get("name") == "eli":
            eli = a.get("value", ""); break
    m = re.search(r"CONSOLIDATED/(\d{8})", eli)
    agg = "%s-%s-%s" % (m.group(1)[:4], m.group(1)[4:6], m.group(1)[6:]) if m else ""

    arts = {}
    if doc_prefix:
        rx = re.compile(doc_prefix)
        for d in root.iter(NS + "doc"):
            name = d.get("name", "")
            mm = rx.match(name)
            if not mm:
                continue
            num = norm_num(mm.group(1))
            r = parse_doc_article(d, (local or {}).get(num, ""), heur)
            if r and num and num not in arts:
                arts[num] = r
    else:
        body = root.find(".//" + NS + "body")
        for art in body.iter(NS + "article"):
            num, r = parse_structured_article(art)
            if num and num not in arts:
                arts[num] = r
    out = []
    for num in sorted(arts, key=numkey):
        r = arts[num]
        rub = r["rubrica"].strip()
        for _ in range(3):                      # "( (Verifiche preliminari). )" -> "Verifiche preliminari"
            rub = re.sub(r"^\(\s*(.*?)\s*\)$", r"\1", rub.strip(" .")).strip()
        if rub.endswith(")") and rub.count(")") > rub.count("("):
            rub = rub[:-1].strip()
        a = {"num": num, "rubrica": rub, "commi": r["commi"]}
        if r.get("note"):
            a["note"] = r["note"]
        out.append(a)
    code = dict(meta)
    code["aggiornato"] = agg
    code["fonte"] = "Normattiva (testo vigente)"
    code["articoli"] = out
    return code
