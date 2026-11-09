@echo off
rem Avvia l'assistente Gemini (Antigravity CLI, comando "agy") collegato alle norme dell'app In Iure.
rem Dal 18/06/2026 Gemini CLI non e' piu' disponibile con account Google personale: si usa Antigravity CLI.
rem Le norme sono lette dai file dell'app sul PC: dopo AGGIORNA_NORMATIVA.bat l'assistente vede subito il testo nuovo.
cd /d "%~dp0In-Iure-Gemini"
where node >nul 2>nul || (echo Node.js non e' installato: scaricalo da https://nodejs.org ^(versione LTS^). & pause & exit /b 1)
where agy >nul 2>nul || (echo Antigravity CLI non e' installato. In PowerShell esegui: irm https://antigravity.google/cli/install.ps1 ^| iex & pause & exit /b 1)
node configura.js || (pause & exit /b 1)
agy --settings agy-impostazioni.json
