@echo off
rem Apre l'assistente In Iure (Antigravity CLI, comando "agy") su UNA pratica: i documenti della cartella scelta
rem sono l'unica fonte dei fatti; pareri e atti vengono salvati in Word nella sottocartella "In Iure - elaborati".
rem Uso: doppio clic (si sceglie la cartella) oppure trascinare la cartella della pratica su questa icona.
setlocal
set "CARTELLA=%~1"
if "%CARTELLA%"=="" for /f "usebackq delims=" %%C in (`powershell -NoProfile -STA -Command "$s=New-Object -ComObject Shell.Application; $f=$s.BrowseForFolder(0,'Scegli la cartella della pratica',0x51,0); if($f){$f.Self.Path}"`) do set "CARTELLA=%%C"
if "%CARTELLA%"=="" (echo Nessuna cartella scelta. & pause & exit /b 1)
if not exist "%CARTELLA%\" (echo "%CARTELLA%" non e' una cartella. & pause & exit /b 1)
cd /d "%~dp0In-Iure-Gemini"
where node >nul 2>nul || (echo Node.js non e' installato: scaricalo da https://nodejs.org ^(versione LTS^). & pause & exit /b 1)
where agy >nul 2>nul || (echo Antigravity CLI non e' installato. In PowerShell esegui: irm https://antigravity.google/cli/install.ps1 ^| iex & pause & exit /b 1)
node configura.js --pratica "%CARTELLA%" || (pause & exit /b 1)
title In Iure - pratica: %CARTELLA%
agy --settings agy-impostazioni.json --add-dir "%CARTELLA%"
