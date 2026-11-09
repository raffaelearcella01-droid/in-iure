# In Iure - controllo del PC all'inizio di ogni sessione (qualunque PC, cartella condivisa su Google Drive).
# Uso: powershell -ExecutionPolicy Bypass -File "In-Iure\tools\controlla_pc.ps1"
# - trova Java (JDK 21) e Android SDK nei percorsi noti e riscrive android\local.properties per QUESTO PC
#   (il file e' sincronizzato da Drive e altrimenti punterebbe al PC precedente);
# - scrive in %LOCALAPPDATA%\InIure-PC\ambiente.ps1 le variabili JAVA_HOME / ANDROID_HOME da caricare prima di gradlew;
# - controlla Node, Python, Git (identita' LOCALE del repo, stato rispetto a GitHub), Antigravity CLI, credenziali NotebookLM.
# Non modifica mai la configurazione git globale ne' le credenziali (regola: mai toccare robertoarcella-bot).
$ErrorActionPreference = "Continue"
$tools = Split-Path -Parent $MyInvocation.MyCommand.Path
$sitoWeb = (Resolve-Path (Join-Path $tools "..\..")).Path
$righe = New-Object System.Collections.Generic.List[string]
function Esito($ok, $testo) { $s = $(if ($ok) { "OK      " } else { "MANCA   " }) + $testo; $righe.Add($s); Write-Host $s }

Write-Host "PC: $env:COMPUTERNAME  utente: $env:USERNAME"
Write-Host "Cartella: $sitoWeb"
Write-Host ""

# --- Java (JDK 21) ---
$jdk = $null
$candidatiJdk = @("$env:USERPROFILE\devtools", "$env:LOCALAPPDATA\Programs\Java", "C:\Program Files\Java", "C:\Program Files\Eclipse Adoptium", "C:\Program Files\Microsoft", "C:\Program Files\Android\Android Studio")
if ($env:JAVA_HOME -and (Test-Path "$env:JAVA_HOME\bin\java.exe")) { $jdk = $env:JAVA_HOME }
foreach ($c in $candidatiJdk) {
  if ($jdk) { break }
  if (Test-Path $c) {
    $j = Get-ChildItem $c -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -match "jdk-?21|jbr" -and (Test-Path (Join-Path $_.FullName "bin\java.exe")) } | Select-Object -First 1
    if ($j) { $jdk = $j.FullName }
    elseif (Test-Path "$c\jbr\bin\java.exe") { $jdk = "$c\jbr" }
  }
}
Esito ([bool]$jdk) ("Java JDK 21: " + $(if ($jdk) { $jdk } else { "non trovato (serve per l'app Android)" }))

# --- Android SDK ---
$sdk = $null
foreach ($c in @($env:ANDROID_HOME, $env:ANDROID_SDK_ROOT, "$env:LOCALAPPDATA\Android\Sdk", "$env:USERPROFILE\AndroidSdk", "C:\Android\Sdk")) {
  if ($c -and (Test-Path (Join-Path $c "platforms"))) { $sdk = $c; break }
}
Esito ([bool]$sdk) ("Android SDK: " + $(if ($sdk) { $sdk } else { "non trovato (serve per l'app Android)" }))

$lp = Join-Path $sitoWeb "In-Iure-App\android\local.properties"
if ($sdk) {
  $riga = "sdk.dir=" + ($sdk -replace "\\", "/")
  $attuale = if (Test-Path $lp) { (Get-Content $lp -Raw).Trim() } else { "" }
  if ($attuale -ne $riga) { Set-Content -Path $lp -Value $riga -Encoding ascii; Write-Host "        local.properties aggiornato per questo PC ($riga)" }
}
$dirEnv = Join-Path $env:LOCALAPPDATA "InIure-PC"
New-Item -ItemType Directory -Force $dirEnv | Out-Null
$amb = @()
if ($jdk) { $amb += "`$env:JAVA_HOME = `"$jdk`"" }
if ($sdk) { $amb += "`$env:ANDROID_HOME = `"$sdk`""; $amb += "`$env:ANDROID_SDK_ROOT = `"$sdk`"" }
Set-Content -Path (Join-Path $dirEnv "ambiente.ps1") -Value $amb -Encoding utf8
Write-Host "        variabili per gradlew: . `"$dirEnv\ambiente.ps1`""

# --- Node, Python, Git, Antigravity ---
$node = Get-Command node -ErrorAction SilentlyContinue
Esito ([bool]$node) ("Node.js: " + $(if ($node) { (& node --version) } else { "non installato" }))
$py = Get-Command python -ErrorAction SilentlyContinue
Esito ([bool]$py) ("Python: " + $(if ($py) { (& python --version 2>&1) } else { "non installato" }))
$agy = Get-Command agy -ErrorAction SilentlyContinue
if (-not $agy -and (Test-Path "$env:LOCALAPPDATA\agy\bin\agy.exe")) { $agy = "$env:LOCALAPPDATA\agy\bin\agy.exe" }
Esito ([bool]$agy) ("Antigravity CLI (agy): " + $(if ($agy) { "installato" } else { "non installato (irm https://antigravity.google/cli/install.ps1 | iex)" }))
$cc = Get-Command claude -ErrorAction SilentlyContinue
Esito ([bool]$cc) ("Claude Code (serve alla revisione automatica di quiz e atti): " + $(if ($cc) { "installato" } else { "non installato" }))

$git = Get-Command git -ErrorAction SilentlyContinue
if ($git) {
  $nome = & git -C $sitoWeb config --local user.name
  $mail = & git -C $sitoWeb config --local user.email
  $okId = ($mail -like "*raffaelearcella01-droid*")
  Esito $okId ("Git, identita' LOCALE del repo: $nome <$mail>")
  $remote = & git -C $sitoWeb remote get-url origin
  Esito ($remote -like "*raffaelearcella01-droid/in-iure*") ("Git, remote: $remote")
  $stato = & git -C $sitoWeb status -sb 2>&1 | Select-Object -First 1
  Write-Host "        $stato"
  $modificati = (& git -C $sitoWeb status --porcelain | Measure-Object).Count
  Write-Host "        file modificati non salvati in git: $modificati"
} else { Esito $false "Git: non installato" }

# --- NotebookLM (le credenziali stanno su UN solo PC) ---
$nb = Join-Path $env:LOCALAPPDATA "InIure-NotebookLM\client_secret.json"
Esito (Test-Path $nb) ("Credenziali NotebookLM su questo PC: " + $(if (Test-Path $nb) { "presenti" } else { "assenti (normale se gli aggiornamenti NotebookLM partono da un altro PC)" }))

$rapporto = Join-Path $dirEnv "ultimo_controllo.txt"
$righe.Insert(0, "Controllo del " + (Get-Date -Format "dd/MM/yyyy HH:mm") + " su $env:COMPUTERNAME")
Set-Content -Path $rapporto -Value $righe -Encoding utf8
