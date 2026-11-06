@echo off
rem Avvia Gemini CLI collegato alle norme dell'app In Iure (server MCP "in-iure").
rem Le norme sono lette dai file dell'app sul PC: dopo AGGIORNA_NORMATIVA.bat Gemini vede subito il testo nuovo.
cd /d "%~dp0In-Iure-Gemini"
where node >nul 2>nul || (echo Node.js non e' installato: scaricalo da https://nodejs.org ^(versione LTS^). & pause & exit /b 1)
where gemini >nul 2>nul || (echo Gemini CLI non e' installato. Esegui: npm install -g @google/gemini-cli & pause & exit /b 1)
node configura.js || (pause & exit /b 1)
gemini
