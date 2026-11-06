@echo off
rem Aggiorna la normativa di In Iure DAL PC, quando lo decidi tu.
rem Scarica da Normattiva, controlla, mostra cosa e' cambiato e pubblica SOLO se confermi.
cd /d "%~dp0In-Iure\tools"
set PYTHONIOENCODING=utf-8
python aggiorna_e_pubblica.py
