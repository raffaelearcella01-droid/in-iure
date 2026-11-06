# -*- coding: utf-8 -*-
"""Aumenta la versione della cache del service worker (sw.js), cosi' il sito/PWA scarica i contenuti nuovi."""
import os, re
P = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "sw.js")
s = open(P, encoding="utf-8").read()
m = re.search(r'var CACHE = "iniure-v(\d+)";', s)
n = int(m.group(1)) + 1
open(P, "w", encoding="utf-8", newline="").write(s.replace(m.group(0), 'var CACHE = "iniure-v%d";' % n))
print("Cache del service worker: iniure-v%d" % n)
