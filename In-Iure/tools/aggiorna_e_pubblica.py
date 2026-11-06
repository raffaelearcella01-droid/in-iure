# -*- coding: utf-8 -*-
"""Aggiornamento della normativa DAL PC, quando lo decidi tu (si avvia con Sito web/AGGIORNA_NORMATIVA.bat).

1. scarica da Normattiva il testo vigente dei codici e lo converte;
2. esegue i controlli di sicurezza;
3. ti mostra cosa e' cambiato (report dettagliato articolo per articolo in ULTIMO_AGGIORNAMENTO.md);
4. SOLO se confermi, applica l'aggiornamento:
   - Gemini CLI (server MCP in-iure) legge subito i file nuovi sul PC;
   - NotebookLM: i documenti su Google Drive vengono riscritti e il taccuino si risincronizza da solo;
   - app installate: se GitHub e' attivo, salva su GitHub (il TUO account) e GitHub Pages mette online i nuovi
     testi, che le app scaricano da sole alla prima apertura. Se GitHub non e' ancora attivo, questo passo e' saltato.
   Se NON confermi, i file dell'app tornano esattamente come prima: nulla cambia, neanche per Gemini.
"""
import os, sys, json, shutil, subprocess, datetime, glob, hashlib, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
APP = os.path.abspath(os.path.join(HERE, ".."))
ROOT = os.path.abspath(os.path.join(APP, ".."))           # "Sito web" = radice del repository
AKN = os.path.join(ROOT, "Codici e normative", "Normattiva AKN")
JS = os.path.join(APP, "js")
VIETATO = "robertoarcella-bot"                             # account che NON va mai usato per questo progetto


def run(cmd, cwd=HERE, check=True, capture=False, env=None):
    r = subprocess.run(cmd, cwd=cwd, text=True, encoding="utf-8", errors="replace", env=env,
                       stdout=subprocess.PIPE if capture else None, stderr=subprocess.STDOUT if capture else None)
    if check and r.returncode != 0:
        if capture: print(r.stdout)
        raise SystemExit("\nOperazione interrotta: errore in " + " ".join(cmd))
    return r.stdout if capture else r.returncode


def git(*a, check=True):
    return run(["git"] + list(a), cwd=ROOT, check=check, capture=True).strip()


def controlla_git():
    """(nome, remoto) se GitHub e' configurato correttamente; None se non e' ancora attivo (solo PC).
    Si blocca se trova l'account vietato o una configurazione sbagliata."""
    if not os.path.isdir(os.path.join(ROOT, ".git")):
        return None
    nome = git("config", "--local", "user.name", check=False)
    remoto = git("remote", "get-url", "origin", check=False)
    if not nome or VIETATO in nome.lower() or VIETATO in remoto.lower() or "github.com" not in remoto:
        raise SystemExit("Configurazione Git non valida (identita' o indirizzo del repository). Pubblicazione bloccata.")
    return nome, remoto


def leggi_indice(testo):
    return {c["id"]: c for c in json.loads(testo[testo.index("["): testo.rindex("]") + 1])}


def impronta_js():
    h = hashlib.sha1()
    for f in sorted(glob.glob(os.path.join(JS, "**", "*"), recursive=True)):
        if os.path.isfile(f):
            h.update(os.path.relpath(f, JS).encode()); h.update(open(f, "rb").read())
    return h.hexdigest()


def ripristina(copia):
    shutil.rmtree(JS)
    shutil.copytree(copia, JS)


def aggiorna_notebooklm():
    """Riallinea le fonti del taccuino NotebookLM (solo se Google Drive e' collegato). Carica solo i documenti
    cambiati, quindi rilanciarlo quando e' gia' tutto allineato non costa nulla: recupera anche un giro fallito."""
    cred = os.path.join(os.environ.get("LOCALAPPDATA") or os.path.expanduser("~"), "InIure-NotebookLM", "client_secret.json")
    if not os.path.exists(cred):
        print("\nNotebookLM: Google Drive non ancora collegato, fonti non aggiornate (vedi GUIDA_GEMINI_NOTEBOOKLM.md).")
        return
    print("\nNotebookLM: riallineo le fonti su Google Drive...")
    if run([sys.executable, "notebooklm.py"], check=False) != 0:
        print("NotebookLM NON aggiornato (errore sopra, es. internet assente). Verra' recuperato in automatico al prossimo AGGIORNA_NORMATIVA.")


def main():
    print("=== In Iure - aggiornamento della normativa da Normattiva ===\n")
    gitinfo = controlla_git()
    if gitinfo:
        print("Repository: %s (autore: %s)\n" % (gitinfo[1], gitinfo[0]))
        # prima di tutto: prendi gli aggiornamenti gia' pubblicati dall'altro PC (o da "Run workflow" su GitHub)
        if git("status", "--porcelain", "--untracked-files=no", check=False):
            raise SystemExit("Ci sono file del progetto modificati e non ancora pubblicati su questo PC.\n"
                             "Aggiornamento bloccato per non mescolarli: chiedi a Claude di controllarli.")
        print("0) Scarico da GitHub gli aggiornamenti gia' pubblicati...")
        if run(["git", "pull", "--ff-only", "origin", "main"], cwd=ROOT, check=False) != 0:
            raise SystemExit("Non riesco ad allineare questo PC con GitHub (internet assente o versioni divergenti).\n"
                             "Aggiornamento bloccato: nessun file e' stato modificato.")
        print()
    else:
        print("GitHub non ancora attivo: l'aggiornamento vale per questo PC (Gemini CLI) e per NotebookLM.\n"
              "Le app installate su telefoni e PC lo riceveranno solo dopo l'attivazione di GitHub.\n")
    vecchio_idx = leggi_indice(open(os.path.join(JS, "codici-index.js"), encoding="utf-8").read())

    # copia di sicurezza dei file dell'app: se non confermi, tutto torna com'era
    tmp = tempfile.mkdtemp(prefix="iniure-prima-")
    copia_js = os.path.join(tmp, "js")
    shutil.copytree(JS, copia_js)
    impronta_prima = impronta_js()
    # copia delle versioni attuali (servono per il confronto articolo per articolo)
    prima = os.path.join(AKN + "_precedente")
    shutil.rmtree(prima, ignore_errors=True)
    if os.path.isdir(AKN):
        shutil.copytree(AKN, prima)
    confermato = False
    try:
        print("1) Scarico il testo vigente da Normattiva (qualche minuto)...")
        run([sys.executable, "build_normattiva.py", "--fetch"])
        print("\n2) Controlli di sicurezza...")
        env = dict(os.environ, IN_IURE_INDICE_PRECEDENTE=os.path.join(copia_js, "codici-index.js"))
        run([sys.executable, "controllo_aggiornamento.py"], env=env)

        nuovo_idx = leggi_indice(open(os.path.join(JS, "codici-index.js"), encoding="utf-8").read())
        if impronta_js() == impronta_prima:
            print("\nNessuna modifica: la normativa dell'app e' gia' aggiornata.")
            confermato = True          # nulla da ripristinare
            aggiorna_notebooklm()      # recupera un eventuale riallineamento non riuscito in precedenza
            return

        # report dettagliato
        sys.path.insert(0, HERE)
        from build_normattiva import CODES, xml_path
        righe = ["# Aggiornamento normativa del %s\n" % datetime.date.today().strftime("%d/%m/%Y")]
        codici_cambiati = [c for c in CODES if c[0] in nuovo_idx and nuovo_idx[c[0]].get("aggiornato") != (vecchio_idx.get(c[0]) or {}).get("aggiornato")]
        for cid, urn, nome_c, *_ in codici_cambiati:
            old = os.path.join(prima, os.path.basename(xml_path(urn)))
            new = xml_path(urn)
            if os.path.exists(old):
                dopo = (vecchio_idx.get(cid) or {}).get("aggiornato", "2000-01-01")
                righe.append(run([sys.executable, "report_modifiche.py", cid, old, new, dopo], capture=True))
            elif cid in vecchio_idx:
                righe.append("### %s: modificato (ultima modifica in vigore dal %s)\n\nDettaglio articolo per articolo "
                             "non disponibile su questo PC: manca la copia precedente del testo scaricato da Normattiva "
                             "(capita al primo aggiornamento fatto da un PC nuovo).\n" % (nome_c, nuovo_idx[cid]["aggiornato"]))
            else:
                righe.append("### %s: atto nuovo nell'app\n" % nome_c)
        if not codici_cambiati:
            righe.append("Nessun codice ha nuove modifiche normative (cambiano solo dati tecnici o atti/quiz).\n")
        report = os.path.join(ROOT, "ULTIMO_AGGIORNAMENTO.md")
        open(report, "w", encoding="utf-8").write("\n".join(righe))

        print("\n3) Cosa e' cambiato:")
        for cid, urn, nome_c, *_ in codici_cambiati:
            print("   - %s: ultima modifica in vigore dal %s" % (nome_c, nuovo_idx[cid]["aggiornato"]))
        print("   Dettaglio articolo per articolo: " + report)
        try:
            os.startfile(report)          # apre il report (Windows)
        except Exception:
            pass

        dove = "app installate (GitHub), Gemini CLI e NotebookLM" if gitinfo else "Gemini CLI e NotebookLM (GitHub non ancora attivo)"
        risposta = input("\n4) Vuoi APPLICARE l'aggiornamento a: %s? Scrivi S e premi Invio (altro = no): " % dove).strip().lower()
        if risposta not in ("s", "si", "sì"):
            print("Non applicato: i file dell'app tornano come prima. Puoi ripetere quando vuoi.")
            return
        confermato = True
        if gitinfo:
            run([sys.executable, "bump_sw.py"])
            git("add", "In-Iure/js", "In-Iure/sw.js")
            git("commit", "-m", "Aggiornamento normativa %s" % datetime.date.today().isoformat())
            print("\nInvio a GitHub...")
            run(["git", "push", "origin", "HEAD:main"], cwd=ROOT)
            print("\nFatto. Entro pochi minuti GitHub pubblica il sito; le app ricevono i nuovi testi alla prossima apertura.")
        else:
            print("\nFatto per questo PC: Gemini CLI usa gia' i testi nuovi.")
        aggiorna_notebooklm()
    finally:
        if not confermato:
            ripristina(copia_js)
            if os.path.isdir(prima):            # anche gli XML scaricati tornano alla versione precedente
                shutil.rmtree(AKN, ignore_errors=True)
                shutil.copytree(prima, AKN)
        shutil.rmtree(tmp, ignore_errors=True)
        shutil.rmtree(prima, ignore_errors=True)


if __name__ == "__main__":
    try:
        main()
    finally:
        if os.name == "nt" and sys.stdin.isatty():
            try:
                input("\nPremi Invio per chiudere...")
            except EOFError:
                pass
