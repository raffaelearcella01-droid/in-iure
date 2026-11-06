# -*- coding: utf-8 -*-
"""Fonti per NotebookLM ricavate SOLO dai contenuti dell'app In Iure.

1. ESPORTA: legge js/codici/*.js, js/codici-index.js, gli atti e i quiz dell'app e scrive file di testo in
   Sito web/In-Iure-NotebookLM/fonti/ (ognuno sotto il limite di un Google Doc, ~1 milione di caratteri).
2. SINCRONIZZA: carica quei file sul TUO Google Drive come Google Docs, nella cartella
   "In Iure - fonti NotebookLM". Alle esecuzioni successive SOVRASCRIVE gli stessi documenti (stesso ID):
   NotebookLM sincronizza in automatico le fonti Google Docs di Drive, quindi il taccuino si aggiorna da solo.

Uso:  python notebooklm.py               esporta e sincronizza
      python notebooklm.py --solo-esporta solo i file locali (nessun accesso a Google)

Credenziali (MAI nel repository): %LOCALAPPDATA%\\InIure-NotebookLM\\
   client_secret.json  -> scaricato una volta da Google Cloud Console (vedi GUIDA_GEMINI_NOTEBOOKLM.md)
   token.json          -> creato da solo al primo accesso dal browser
Permesso richiesto a Google: drive.file = lo script vede e modifica SOLO i file che ha creato lui.
"""
import os, sys, json, glob, re, datetime, hashlib

HERE = os.path.dirname(os.path.abspath(__file__))
APP = os.path.abspath(os.path.join(HERE, ".."))
ROOT = os.path.abspath(os.path.join(APP, ".."))
JS = os.path.join(APP, "js")
OUT = os.path.join(ROOT, "In-Iure-NotebookLM", "fonti")
CRED_DIR = os.path.join(os.environ.get("LOCALAPPDATA") or os.path.expanduser("~"), "InIure-NotebookLM")
CARTELLA_DRIVE = "In Iure - fonti NotebookLM"
MAX_CAR = 850000          # limite Google Docs ~1.020.000 caratteri: margine di sicurezza
# numero FISSO di documenti (29 in tutto, limite gratuito NotebookLM 50 fonti): ~40% di margine di crescita
DOC_NORME, DOC_ATTI, DOC_QUIZ = 24, 3, 2
SCOPES = ["https://www.googleapis.com/auth/drive.file"]


# ------------------------------------------------------------------ lettura dati dell'app
def json_tra(testo, apertura, chiusura):
    return json.loads(testo[testo.index(apertura): testo.rindex(chiusura) + 1])


def leggi_var(nome_file):
    p = os.path.join(JS, nome_file)
    if not os.path.exists(p):
        return []
    return json_tra(open(p, encoding="utf-8").read(), "[", "]")


def leggi_codici():
    indice = json_tra(open(os.path.join(JS, "codici-index.js"), encoding="utf-8").read(), "[", "]")
    codici = []
    for meta in indice:
        p = os.path.join(APP, meta["file"].replace("/", os.sep))
        t = open(p, encoding="utf-8").read()
        c = json.loads(t[t.index("{"): t.rindex("}") + 1])
        c["verificato"] = meta.get("verificato", "")
        c["urn"] = meta.get("urn", "")
        codici.append(c)
    return codici


def unisci_quiz(base, extra):
    out, per_id = [], {}
    for m in base + extra:
        if m["id"] in per_id:
            per_id[m["id"]]["domande"] += m.get("domande", [])
        else:
            nm = {"materia": m["materia"], "id": m["id"], "domande": list(m.get("domande", []))}
            per_id[m["id"]] = nm
            out.append(nm)
    return out


# ------------------------------------------------------------------ testo dei blocchi
def blocchi_codice(c):
    intest = ("=" * 70 + "\nATTO NORMATIVO: %s (%s)\n%s\nFonte: %s. Ultima modifica in vigore: %s. Testo verificato su Normattiva il %s.\n"
              % (c["nome"], c["abbr"], c.get("descrizione", ""), c.get("fonte", "Normattiva"), c.get("aggiornato", "n.d."), c.get("verificato", "n.d."))
              + ("Normattiva: https://www.normattiva.it/uri-res/N2Ls?%s\n" % c["urn"] if c.get("urn") else "") + "=" * 70 + "\n")
    out = [(c["abbr"], intest)]
    for a in c["articoli"]:
        righe = ["", "Art. %s %s%s" % (a["num"], c["abbr"], (" - " + a["rubrica"]) if a.get("rubrica") else "")]
        righe.append("\n".join(a.get("commi") or ["(articolo senza testo nella fonte ufficiale)"]))
        if a.get("note"):
            note = "\n".join(a["note"]) if isinstance(a["note"], list) else str(a["note"])
            note = re.sub(r"\n\s*\n\s*", "\n", note).strip()
            righe.append("[Nota di aggiornamento della fonte ufficiale all'art. %s %s] %s" % (a["num"], c["abbr"], note))
        out.append((c["abbr"], "\n".join(righe) + "\n"))
    return out


def blocchi_atti(atti):
    out = [("modelli", "=" * 70 + "\nMODELLI DI ATTI DELL'APP IN IURE (sezione Scrittura atti)\n"
            "I testi tra {{ }} sono campi da compilare.\n" + "=" * 70 + "\n")]
    for a in atti:
        campi = "\n".join("- {{%s}}: %s" % (f["id"], f.get("label", "")) for f in a.get("campi", []))
        out.append(("modelli", "\n".join(["", "-" * 70, "MODELLO: %s" % a["nome"], "Categoria: %s" % a.get("categoria", ""),
                                          "Descrizione: %s" % a.get("descrizione", ""), "", "Guida alla redazione:", a.get("guida", ""),
                                          "", "Campi da compilare:", campi, "", "Testo del modello:", a.get("template", "")]) + "\n"))
    return out


def blocchi_quiz(quiz):
    out = [("quiz", "=" * 70 + "\nDOMANDE DI ESERCITAZIONE DELL'APP IN IURE (sezione Quiz), con risposta corretta e spiegazione\n" + "=" * 70 + "\n")]
    for m in quiz:
        out.append(("quiz", "\n\nMATERIA: %s (%d domande)\n" % (m["materia"], len(m["domande"]))))
        for i, d in enumerate(m["domande"], 1):
            opz = "\n".join("  %s) %s" % ("ABCDEFGH"[j], o) for j, o in enumerate(d["opzioni"]))
            r = ["", "%s - domanda %d: %s" % (m["materia"], i, d["q"]), opz,
                 "Risposta corretta: %s) %s" % ("ABCDEFGH"[d["corretta"]], d["opzioni"][d["corretta"]]),
                 "Spiegazione: %s" % d.get("spiegazione", "")]
            if d.get("norma"):
                r.append("Norma di riferimento: %s" % d["norma"])
            out.append(("quiz", "\n".join(r) + "\n"))
    return out


def impacchetta(prefisso, titolo, blocchi, n_fissi):
    """Distribuisce i contenuti su un numero FISSO di documenti (n_fissi), riempiti in modo uniforme e senza mai
    spezzare un articolo/modello/domanda. Il numero fisso, con ampio margine, fa si' che il taccuino NotebookLM
    non debba mai cambiare composizione: quando l'app cresce, i documenti diventano solo un po' piu' grandi.
    Solo se un documento superasse MAX_CAR se ne aggiunge uno (caso segnalato: va aggiunto al taccuino)."""
    totale = sum(len(b) for _, b in blocchi)
    obiettivo = max(-(-totale // n_fissi), 1)
    docs, cur, cont, dim = [], [], [], 0
    def chiudi():
        docs.append({"testo": "".join(cur), "contenuto": list(dict.fromkeys(cont))})
    for etichetta, b in blocchi:
        if cur and ((len(docs) < n_fissi - 1 and dim + len(b) > obiettivo) or dim + len(b) > MAX_CAR):
            chiudi(); cur, cont, dim = [], [], 0
        cur.append(b); cont.append(etichetta); dim += len(b)
    if cur:
        chiudi()
    while len(docs) < n_fissi:
        docs.append({"testo": "Documento di riserva: verra' riempito in automatico se i contenuti dell'app crescono.\n", "contenuto": []})
    oggi = datetime.date.today().strftime("%d/%m/%Y")
    out = []
    for i, d in enumerate(docs, 1):
        chiave = "%s-%02d" % (prefisso, i)
        nome = ("In Iure - %s %02d di %02d" % (titolo, i, n_fissi)) if i <= n_fissi else ("In Iure - %s %02d (aggiuntivo)" % (titolo, i))
        testa = ("FONTE: app In Iure (diritto italiano). Documento %s, generato il %s dai contenuti dell'app.\n"
                 "Contiene: %s.\n\n" % (chiave, oggi, ", ".join(d["contenuto"]) or "nessun contenuto (riserva)"))
        out.append({"chiave": chiave, "nome": nome, "testo": testa + d["testo"]})
    return out


def esporta():
    codici = leggi_codici()
    atti = leggi_var("data-atti.js") + leggi_var("data-atti-extra.js")
    quiz = unisci_quiz(leggi_var("data-quiz.js"), leggi_var("data-quiz-extra.js"))
    blocchi = []
    for c in codici:
        blocchi += blocchi_codice(c)
    docs = (impacchetta("norme", "Norme", blocchi, DOC_NORME) + impacchetta("atti", "Modelli di atti", blocchi_atti(atti), DOC_ATTI)
            + impacchetta("quiz", "Quiz", blocchi_quiz(quiz), DOC_QUIZ))
    os.makedirs(OUT, exist_ok=True)
    for f in glob.glob(os.path.join(OUT, "*.txt")):
        os.remove(f)
    for d in docs:
        open(os.path.join(OUT, d["chiave"] + ".txt"), "w", encoding="utf-8", newline="\n").write(d["testo"])
    elenco = {d["chiave"]: {"nome": d["nome"], "caratteri": len(d["testo"])} for d in docs}
    json.dump({"generato": datetime.datetime.now().isoformat(timespec="seconds"), "documenti": elenco},
              open(os.path.join(OUT, "_elenco.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    n_art = sum(len(c["articoli"]) for c in codici)
    print("Esportati %d documenti in %s" % (len(docs), OUT))
    print("  %d atti normativi (%d articoli), %d modelli di atti, %d domande di quiz"
          % (len(codici), n_art, len(atti), sum(len(m["domande"]) for m in quiz)))
    print("  documento piu' grande: %d caratteri (limite Google Docs ~1.020.000)" % max(len(d["testo"]) for d in docs))
    return docs


# ------------------------------------------------------------------ Google Drive
def servizio_drive():
    try:
        from google.oauth2.credentials import Credentials
        from google.auth.transport.requests import Request
        from google_auth_oauthlib.flow import InstalledAppFlow
        from googleapiclient.discovery import build
    except ImportError:
        raise SystemExit("Mancano le librerie Google. Esegui: pip install google-api-python-client google-auth-oauthlib")
    secret = os.path.join(CRED_DIR, "client_secret.json")
    token = os.path.join(CRED_DIR, "token.json")
    if not os.path.exists(secret):
        raise SystemExit("Manca %s.\nSegui il paragrafo 'Collegare Google Drive (una tantum)' di GUIDA_GEMINI_NOTEBOOKLM.md." % secret)
    creds = Credentials.from_authorized_user_file(token, SCOPES) if os.path.exists(token) else None
    if creds and creds.expired and creds.refresh_token:
        try:
            creds.refresh(Request())
        except Exception:
            creds = None        # accesso scaduto (succede se il progetto Google Cloud e' rimasto "in test"): nuovo login
    if not creds or not creds.valid:
        print("Si apre il browser: accedi con il TUO account Google e concedi l'accesso ai file creati da questo script.")
        creds = InstalledAppFlow.from_client_secrets_file(secret, SCOPES).run_local_server(port=0)
    open(token, "w", encoding="utf-8").write(creds.to_json())
    return build("drive", "v3", credentials=creds, cache_discovery=False)


def sincronizza(docs):
    from googleapiclient.http import MediaFileUpload
    drive = servizio_drive()
    DOC = "application/vnd.google-apps.document"
    q = "name = '%s' and mimeType = 'application/vnd.google-apps.folder' and trashed = false" % CARTELLA_DRIVE
    trovate = drive.files().list(q=q, fields="files(id)").execute().get("files", [])
    if trovate:
        cartella = trovate[0]["id"]
    else:
        cartella = drive.files().create(body={"name": CARTELLA_DRIVE, "mimeType": "application/vnd.google-apps.folder"},
                                        fields="id").execute()["id"]
        print("Creata su Drive la cartella '%s'" % CARTELLA_DRIVE)
    esistenti = {}
    token_pag = None
    while True:
        r = drive.files().list(q="'%s' in parents and trashed = false" % cartella, pageToken=token_pag,
                               fields="nextPageToken, files(id, name, appProperties)").execute()
        for f in r.get("files", []):
            k = (f.get("appProperties") or {}).get("iniure_chiave")
            if k:
                esistenti[k] = f
        token_pag = r.get("nextPageToken")
        if not token_pag:
            break
    nuovi, invariati = [], 0
    for d in docs:
        # impronta del contenuto (senza la data di generazione nell'intestazione): si carica solo cio' che e' cambiato
        impronta = hashlib.sha1(d["testo"].split("\n", 1)[1].encode("utf-8")).hexdigest()
        props = {"iniure_chiave": d["chiave"], "iniure_hash": impronta}
        media = MediaFileUpload(os.path.join(OUT, d["chiave"] + ".txt"), mimetype="text/plain", resumable=True)
        if d["chiave"] in esistenti:
            f = esistenti[d["chiave"]]
            if (f.get("appProperties") or {}).get("iniure_hash") == impronta and f.get("name") == d["nome"]:
                invariati += 1
                continue
            drive.files().update(fileId=f["id"], body={"name": d["nome"], "appProperties": props}, media_body=media).execute()
            print("  aggiornato  " + d["nome"])
        else:
            drive.files().create(body={"name": d["nome"], "mimeType": DOC, "parents": [cartella],
                                       "appProperties": props}, media_body=media, fields="id").execute()
            nuovi.append(d["nome"])
            print("  NUOVO       " + d["nome"])
    if invariati:
        print("  %d documenti gia' allineati (non ricaricati)" % invariati)
    obsoleti = [f for k, f in esistenti.items() if k not in {d["chiave"] for d in docs}]
    for f in obsoleti:
        drive.files().update(fileId=f["id"], body={"trashed": True}).execute()
        print("  nel cestino " + f["name"] + " (non piu' necessario)")
    print("\nDrive aggiornato: cartella '%s' (%d documenti)." % (CARTELLA_DRIVE, len(docs)))
    if nuovi and not esistenti:
        print("\nPRIMO CARICAMENTO: crea il taccuino e aggiungi TUTTI i %d documenti della cartella '%s' (solo questa volta;\n"
              "dopo si aggiornano da soli)." % (len(nuovi), CARTELLA_DRIVE))
    elif nuovi:
        print("\nATTENZIONE: ci sono %d documenti NUOVI. Vanno aggiunti a mano al taccuino NotebookLM\n"
              "(Aggiungi fonte > Google Drive > cartella '%s'):\n  - %s" % (len(nuovi), CARTELLA_DRIVE, "\n  - ".join(nuovi)))
    if obsoleti:
        print("\nATTENZIONE: %d documenti sono stati messi nel cestino di Drive: eliminali anche dal taccuino se restano elencati." % len(obsoleti))
    print("I documenti gia' presenti nel taccuino si aggiornano da soli (sincronizzazione automatica di NotebookLM).")


def main():
    docs = esporta()
    if "--solo-esporta" in sys.argv:
        return
    print("\nSincronizzo con Google Drive...")
    sincronizza(docs)


if __name__ == "__main__":
    main()
