# -*- coding: utf-8 -*-
"""Revisione AUTOMATICA di quiz e modelli di atti dopo un aggiornamento della normativa.

La chiama aggiorna_e_pubblica.py DOPO la tua conferma (S), prima della pubblicazione (scelta dell'utente, 06/11/2026).
1. trova gli articoli cambiati (testo prima/dopo) confrontando i codici vecchi con quelli appena scaricati;
2. lancia Claude Code in modalita' automatica e ISOLATA: lavora su una COPIA dei file di quiz e atti in una cartella
   temporanea, puo' solo leggere e modificare file (niente comandi, niente internet, niente server MCP);
   corregge cio' che non e' piu' esatto e, dal 09/11/2026 (scelta dell'utente), AGGIUNGE le novita' rilevanti mancanti;
3. controlla il risultato: i file devono restare JSON validi, solo ASCII, con la stessa struttura (nessuna domanda o atto
   aggiunto/eliminato, risposta corretta valida, segnaposto {{id}} corrispondenti ai campi). Se un controllo fallisce
   NON applica nulla;
4. scrive CORREZIONI_QUIZ_ATTI.md: il resoconto di Claude e, sotto, l'elenco CALCOLATO dal programma di ogni campo
   effettivamente cambiato (prima/dopo), cosi' nulla puo' essere modificato senza comparire.
Se Claude non e' disponibile o qualcosa va storto, gli articoli restano in tools/_revisione_in_sospeso.json e la revisione
viene ritentata al successivo AGGIORNA_NORMATIVA (anche se la normativa non e' cambiata).
"""
import os, sys, json, re, shutil, subprocess, tempfile, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
APP = os.path.abspath(os.path.join(HERE, ".."))
ROOT = os.path.abspath(os.path.join(APP, ".."))
JS = os.path.join(APP, "js")
DATI = ["data-quiz.js", "data-quiz-extra.js", "data-atti.js", "data-atti-extra.js"]
SOSPESO = os.path.join(HERE, "_revisione_in_sospeso.json")
REPORT = os.path.join(ROOT, "CORREZIONI_QUIZ_ATTI.md")
TOKEN = os.path.join(os.environ.get("LOCALAPPDATA") or os.path.expanduser("~"), "InIure-Claude", "token.txt")
TEMPO_MAX = 90 * 60          # secondi concessi a Claude
MAX_ARTICOLI = 150           # oltre, la revisione si divide su piu' giri (resta in sospeso la parte eccedente)

ISTRUZIONI = r"""# Compito: allineare quiz e modelli di atti di In Iure alla normativa aggiornata

Lavori in modo AUTOMATICO: nessuno ti rispondera'. Non fare domande. Lavora solo dentro questa cartella.

## File
- `modifiche.json`: elenco degli articoli cambiati. Per ognuno: codice, abbr (abbreviazione), num, stato
  (modificato / nuovo / eliminato), rubrica, testo_prima, testo_dopo. E' il testo vigente ufficiale (Normattiva).
- `codici/*.js`: testo vigente COMPLETO di tutti i codici dell'app (formato registerCodice({...articoli:[{num,rubrica,commi}]})).
- `dati/data-quiz.js`, `dati/data-quiz-extra.js`: quiz. Ogni domanda: q, opzioni (4), corretta (indice da 0), spiegazione, a volte norma.
- `dati/data-atti.js`, `dati/data-atti-extra.js`: modelli di atti: id, nome, categoria, descrizione, guida, campi, template.

## Cosa fare
1. Per OGNI articolo di `modifiche.json` cerca (Grep) in `dati/` tutti i quiz e gli atti che lo riguardano:
   citazioni in ogni forma ("art. 129 cod. cons.", "art. 129 del Codice del consumo", "artt. 128-135",
   "d.lgs. 206/2005", campo norma...) e anche domande o atti che trattano la stessa regola senza citare l'articolo.
2. Confronta ciascuno con `testo_dopo` (e, se serve, con il testo completo in `codici/`).
3. Se NON e' piu' esatto rispetto al testo vigente, correggilo con Edit, cambiando il MINIMO indispensabile:
   - quiz: correggi q, opzioni, corretta e/o spiegazione perche' la risposta corretta sia esatta e UNICA secondo il
     testo vigente; la spiegazione deve citare l'articolo con il contenuto vigente;
   - atti: correggi citazioni, testo del template, guida o descrizione.
   Se un articolo e' "eliminato" o abrogato, togli o sostituisci il riferimento solo se il testo vigente indica con
   certezza la norma che lo sostituisce; altrimenti non modificare e segnalalo.
4. AGGIUNGI LE NOVITA' (scelta dell'avvocato del 09/11/2026): se il quiz o l'atto e' ancora esatto ma il testo
   vigente introduce una novita' RILEVANTE per la regola che tratta (nuovo comma, nuovo periodo, nuova facolta',
   nuovo termine, nuova eccezione, articolo "nuovo" collegato), integrala nel posto giusto:
   - quiz: aggiungi la novita' alla spiegazione, citando articolo e comma; cambia domanda, opzioni o risposta
     corretta SOLO se senza la novita' la risposta non sarebbe piu' esatta e unica;
   - atti: aggiungi la novita' alla guida (e alla descrizione se serve); nel template solo se l'atto, redatto
     secondo il testo vigente, deve contenerla (per esempio una nuova dichiarazione obbligatoria), senza creare
     segnaposto nuovi.
   Non aggiungere novita' marginali o che non riguardano la regola trattata dal quiz o dall'atto.
5. Se e' gia' esatto e completo, NON toccarlo.

## Regole vincolanti
- Niente contenuti giuridici inventati: ogni affermazione deve risultare dal testo in `modifiche.json` o in `codici/`.
  Non usare la tua memoria per il contenuto delle norme. Se non sei certo, NON modificare: mettilo in "DA VERIFICARE".
- Solo ASCII: lettere accentate scritte con l'apostrofo (puo', e', perche', citta'). Niente virgolette tipografiche.
- I file devono restare JSON validi dentro "var NOME = [ ... ];". Non aggiungere ne' eliminare domande, atti o campi;
  non cambiare id. Nei template i segnaposto {{id}} devono corrispondere ai campi esistenti.
- Non modificare `modifiche.json`, `codici/` o altri file: SOLO i quattro file in `dati/`.

## Risposta finale (in italiano, Markdown, e' il resoconto per l'avvocato)
## Correzioni fatte
Per ognuna: file, materia o id dell'atto, inizio della domanda, articolo, motivo (cosa dice ora la norma).
## Novita' aggiunte
Per ognuna: file, materia o id dell'atto, inizio della domanda, articolo e comma, novita' aggiunta. Se niente, "Nessuna".
## Gia' esatti e completi (nessuna modifica)
Elenco sintetico di cio' che hai controllato.
## DA VERIFICARE
Cio' che non hai potuto decidere con certezza, con il motivo. Se niente, scrivi "Nessuno".
"""


def leggi_var(path):
    t = open(path, encoding="utf-8").read()
    m = re.search(r"var\s+\w+\s*=\s*", t)
    return json.loads(t[m.end():].rstrip().rstrip(";"))


def leggi_codice(path):
    t = open(path, encoding="utf-8").read()
    return json.loads(t[t.index("(") + 1: t.rindex(")")])


def testo(art):
    return ((art.get("rubrica") or "") + "\n" + "\n".join(art.get("commi") or [])).strip()


def articoli_cambiati(js_prima, js_dopo):
    """Articoli diversi tra due cartelle js (prima/dopo l'aggiornamento)."""
    out = []
    for f in sorted(os.listdir(os.path.join(js_dopo, "codici"))):
        nuovo_p, vecchio_p = os.path.join(js_dopo, "codici", f), os.path.join(js_prima, "codici", f)
        if not os.path.exists(vecchio_p) or open(nuovo_p, "rb").read() == open(vecchio_p, "rb").read():
            continue
        n, v = leggi_codice(nuovo_p), leggi_codice(vecchio_p)
        na = {a["num"]: a for a in n.get("articoli", [])}
        va = {a["num"]: a for a in v.get("articoli", [])}
        for num in list(na) + [x for x in va if x not in na]:
            a, b = va.get(num), na.get(num)
            if a and b and testo(a) == testo(b):
                continue
            out.append({"codice": n["id"], "nome": n.get("nome"), "abbr": n.get("abbr"), "num": num,
                        "stato": "nuovo" if not a else ("eliminato" if not b else "modificato"),
                        "rubrica": (b or a).get("rubrica"),
                        "testo_prima": testo(a) if a else "", "testo_dopo": testo(b) if b else ""})
    return out


def in_sospeso():
    if os.path.exists(SOSPESO):
        try:
            return json.load(open(SOSPESO, encoding="utf-8")).get("articoli", [])
        except Exception:
            return []
    return []


def salva_sospeso(articoli, motivo):
    if not articoli:
        if os.path.exists(SOSPESO):
            os.remove(SOSPESO)
        return
    json.dump({"motivo": motivo, "data": datetime.date.today().isoformat(), "articoli": articoli},
              open(SOSPESO, "w", encoding="utf-8"), ensure_ascii=True, indent=1)


def unisci(vecchi, nuovi):
    """Articoli in sospeso + nuovi; per ogni articolo resta il testo_prima piu' vecchio e il testo_dopo vigente."""
    ris = {}
    for a in vecchi + nuovi:
        k = (a["codice"], a["num"])
        if k in ris:
            a = dict(a, testo_prima=ris[k]["testo_prima"])
        ris[k] = a
    # il testo vigente e' quello dei file attuali
    for (cod, num), a in ris.items():
        p = os.path.join(JS, "codici")
        for f in os.listdir(p):
            if f.endswith(".js") and open(os.path.join(p, f), encoding="utf-8").read(300).find('"%s"' % cod) >= 0:
                arts = {x["num"]: x for x in leggi_codice(os.path.join(p, f)).get("articoli", [])}
                a["testo_dopo"] = testo(arts[num]) if num in arts else ""
                break
    return [a for a in ris.values() if a["testo_prima"] != a["testo_dopo"]]


def stringhe(x):
    if isinstance(x, str):
        yield x
    elif isinstance(x, list):
        for y in x: yield from stringhe(y)
    elif isinstance(x, dict):
        for y in x.values(): yield from stringhe(y)


def valida(prima_dir, dopo_dir):
    """Errori introdotti dalle modifiche (struttura, ASCII, segnaposto). Lista vuota = tutto a posto."""
    err = []
    for f in DATI:
        p_dopo = os.path.join(dopo_dir, f)
        raw = open(p_dopo, "rb").read()
        try:
            raw.decode("ascii")
        except UnicodeDecodeError:
            err.append("%s: contiene caratteri non ASCII" % f)
        try:
            d, v = leggi_var(p_dopo), leggi_var(os.path.join(prima_dir, f))
        except Exception as e:
            err.append("%s: non e' piu' un file valido (%s)" % (f, e)); continue
        if any(ord(ch) > 127 for s in stringhe(d) for ch in s):
            err.append("%s: contiene caratteri non ASCII (in forma codificata)" % f)
        if len(d) != len(v):
            err.append("%s: numero di elementi cambiato" % f); continue
        if f.startswith("data-quiz"):
            for m_d, m_v in zip(d, v):
                if m_d.get("id") != m_v.get("id") or len(m_d.get("domande", [])) != len(m_v.get("domande", [])):
                    err.append("%s: materia %s, domande aggiunte o tolte" % (f, m_v.get("id"))); continue
                for i, (q, qv) in enumerate(zip(m_d["domande"], m_v["domande"])):
                    if set(q) - set(qv) - {"norma"} or not isinstance(q.get("q"), str) or not q["q"].strip():
                        err.append("%s: %s n.%d struttura non valida" % (f, m_v["id"], i + 1))
                    elif not isinstance(q.get("opzioni"), list) or len(q["opzioni"]) != len(qv["opzioni"]):
                        err.append("%s: %s n.%d numero di opzioni cambiato" % (f, m_v["id"], i + 1))
                    elif not isinstance(q.get("corretta"), int) or not 0 <= q["corretta"] < len(q["opzioni"]):
                        err.append("%s: %s n.%d risposta corretta non valida" % (f, m_v["id"], i + 1))
                    elif len(set(o.strip().lower() for o in q["opzioni"])) != len(q["opzioni"]):
                        err.append("%s: %s n.%d opzioni duplicate" % (f, m_v["id"], i + 1))
        else:
            for a, av in zip(d, v):
                if a.get("id") != av.get("id") or set(a) != set(av):
                    err.append("%s: atto %s, id o campi principali cambiati" % (f, av.get("id"))); continue
                ids = {c.get("id") for c in a.get("campi", [])}
                if ids != {c.get("id") for c in av.get("campi", [])}:
                    err.append("%s: atto %s, campi del modulo cambiati" % (f, a["id"]))
                prima_bad = set(re.findall(r"\{\{(\w+)\}\}", av.get("template", ""))) - ids
                bad = set(re.findall(r"\{\{(\w+)\}\}", a.get("template", ""))) - ids - prima_bad
                if bad:
                    err.append("%s: atto %s, segnaposto senza campo: %s" % (f, a["id"], ", ".join(sorted(bad))))
    return err


def differenze(prima_dir, dopo_dir):
    """Elenco calcolato (non dichiarato da Claude) di ogni campo cambiato."""
    righe = []
    for f in DATI:
        d, v = leggi_var(os.path.join(dopo_dir, f)), leggi_var(os.path.join(prima_dir, f))
        if f.startswith("data-quiz"):
            for m_d, m_v in zip(d, v):
                for i, (q, qv) in enumerate(zip(m_d["domande"], m_v["domande"])):
                    for k in ("q", "opzioni", "corretta", "spiegazione", "norma"):
                        if q.get(k) != qv.get(k):
                            righe.append("- **%s**, %s, domanda n. %d (\"%s...\"), campo `%s`\n  - prima: %s\n  - dopo: %s"
                                         % (f, m_v.get("materia"), i + 1, qv["q"][:70], k,
                                            json.dumps(qv.get(k), ensure_ascii=False), json.dumps(q.get(k), ensure_ascii=False)))
        else:
            for a, av in zip(d, v):
                for k in sorted(set(a) | set(av)):
                    if a.get(k) != av.get(k):
                        pa, pd = av.get(k), a.get(k)
                        if isinstance(pa, str) and isinstance(pd, str) and len(pa) > 400:
                            import difflib
                            dd = [x for x in difflib.unified_diff(pa.splitlines(), pd.splitlines(), lineterm="", n=0)
                                  if not x.startswith(("---", "+++", "@@"))]
                            righe.append("- **%s**, atto `%s`, campo `%s` (righe cambiate):\n%s"
                                         % (f, av["id"], k, "\n".join("    " + x for x in dd)))
                        else:
                            righe.append("- **%s**, atto `%s`, campo `%s`\n  - prima: %s\n  - dopo: %s"
                                         % (f, av["id"], k, json.dumps(pa, ensure_ascii=False), json.dumps(pd, ensure_ascii=False)))
    return righe


def trova_claude():
    return shutil.which("claude")


def revisiona(js_prima=None):
    """js_prima = cartella js PRIMA dell'aggiornamento (None = solo articoli in sospeso).
    Ritorna (cambiato: bool, messaggio: str)."""
    nuovi = articoli_cambiati(js_prima, JS) if js_prima else []
    articoli = unisci(in_sospeso(), nuovi)
    if not articoli:
        salva_sospeso([], "")
        return False, "Quiz e atti: nessun articolo cambiato da controllare."
    resto = articoli[MAX_ARTICOLI:]
    articoli = articoli[:MAX_ARTICOLI]
    print("\nQuiz e atti: %d articoli cambiati da controllare%s." % (len(articoli), " (+%d al prossimo giro)" % len(resto) if resto else ""))
    claude = trova_claude()
    if not claude:
        salva_sospeso(articoli + resto, "Claude Code non installato su questo PC")
        return False, "Quiz e atti NON controllati: Claude Code non e' installato su questo PC. Restano in sospeso (tools/_revisione_in_sospeso.json)."

    lavoro = tempfile.mkdtemp(prefix="iniure-revisione-")
    orig = os.path.join(tempfile.mkdtemp(prefix="iniure-originali-"), "dati")
    try:
        os.makedirs(os.path.join(lavoro, "dati"))
        for f in DATI:
            shutil.copy2(os.path.join(JS, f), os.path.join(lavoro, "dati", f))
        shutil.copytree(os.path.join(lavoro, "dati"), orig)   # copia di confronto FUORI dalla cartella di Claude
        shutil.copytree(os.path.join(JS, "codici"), os.path.join(lavoro, "codici"))
        json.dump(articoli, open(os.path.join(lavoro, "modifiche.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        open(os.path.join(lavoro, "ISTRUZIONI.md"), "w", encoding="utf-8").write(ISTRUZIONI)

        env = dict(os.environ)
        if os.path.exists(TOKEN):
            env["CLAUDE_CODE_OAUTH_TOKEN"] = open(TOKEN, encoding="utf-8").read().strip()
        cmd = [claude, "-p", "Leggi ISTRUZIONI.md in questa cartella ed eseguile fino in fondo. Rispondi solo con il resoconto finale richiesto.",
               "--restricted", "--strict-mcp-config", "--no-session-persistence",
               "--permission-mode", "acceptEdits",
               "--allowedTools", "Read", "Grep", "Glob", "Edit",
               "--disallowedTools", "Write", "WebSearch", "WebFetch",
               "--output-format", "text"]
        print("Claude controlla quiz e atti (puo' richiedere da qualche minuto a mezz'ora; non chiudere la finestra)...")
        try:
            r = subprocess.run(cmd, cwd=lavoro, env=env, text=True, encoding="utf-8", errors="replace",
                               stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=TEMPO_MAX)
            uscita, avvisi, codice = r.stdout or "", r.stderr or "", r.returncode
        except subprocess.TimeoutExpired:
            uscita, avvisi, codice = "", "tempo scaduto", -1
        # gli avvisi di Claude (es. scadenza dell'accesso) non vanno nel resoconto
        uscita = "\n".join(x for x in uscita.splitlines() if not x.startswith("Warning: this sign-in"))
        if codice != 0:
            salva_sospeso(articoli + resto, "Claude non ha completato la revisione (codice %s)" % codice)
            return False, ("Quiz e atti NON corretti: Claude non ha completato (tempo scaduto, limiti d'uso o accesso scaduto).\n"
                           "Restano in sospeso e verranno ritentati al prossimo aggiornamento.\n" + (uscita + "\n" + avvisi)[-1500:])

        errori = valida(orig, os.path.join(lavoro, "dati"))
        if errori:
            salva_sospeso(articoli + resto, "controlli falliti sulle correzioni proposte")
            return False, "Quiz e atti NON corretti: le modifiche proposte non hanno superato i controlli:\n  - " + "\n  - ".join(errori[:20])

        righe = differenze(orig, os.path.join(lavoro, "dati"))
        oggi = datetime.date.today().strftime("%d/%m/%Y")
        testo_rep = ["# Revisione automatica di quiz e atti del %s\n" % oggi,
                     "Articoli controllati: %d. Campi corretti: %d.\n" % (len(articoli), len(righe)),
                     "## Resoconto di Claude\n", uscita.strip(), "\n",
                     "## Elenco verificato dal programma di OGNI campo cambiato (prima / dopo)\n",
                     "\n".join(righe) if righe else "Nessun campo cambiato.", "\n",
                     "## Articoli controllati\n",
                     "\n".join("- art. %s %s (%s)" % (a["num"], a.get("abbr") or a["codice"], a["stato"]) for a in articoli)]
        if resto:
            testo_rep.append("\n\n**Restano %d articoli in sospeso, controllati al prossimo aggiornamento.**" % len(resto))
        open(REPORT, "w", encoding="utf-8").write("\n".join(testo_rep))
        if righe:
            for f in DATI:
                shutil.copy2(os.path.join(lavoro, "dati", f), os.path.join(JS, f))
        salva_sospeso(resto, "parte eccedente il limite per giro")
        try:
            os.startfile(REPORT)
        except Exception:
            pass
        return bool(righe), "Quiz e atti: %d campi corretti. Resoconto: %s" % (len(righe), REPORT)
    finally:
        shutil.rmtree(lavoro, ignore_errors=True)
        shutil.rmtree(os.path.dirname(orig), ignore_errors=True)


if __name__ == "__main__":
    # uso manuale: python revisione_quiz_atti.py <cartella_js_prima>   (oppure senza argomenti: solo articoli in sospeso)
    print(revisiona(sys.argv[1] if len(sys.argv) > 1 else None)[1])
