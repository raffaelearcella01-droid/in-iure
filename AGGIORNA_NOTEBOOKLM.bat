@echo off
rem Rigenera dai contenuti dell'app le fonti del taccuino NotebookLM e le aggiorna su Google Drive.
rem Si usa da solo (es. dopo modifiche ad atti o quiz); AGGIORNA_NORMATIVA.bat lo fa gia' in automatico dopo la pubblicazione.
cd /d "%~dp0In-Iure\tools"
set PYTHONIOENCODING=utf-8
python notebooklm.py
pause
