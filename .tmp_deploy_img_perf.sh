#!/usr/bin/env bash
cd /Users/jorgefrancolara/casatapputi-mx
git add index.html assets/js/catalog.js productos/index.html
git commit -m "perf(images): precarga prioritaria, fetchpriority high y decoding async en imagenes del catalogo para cero latencia"
git push origin main
