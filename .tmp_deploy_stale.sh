#!/usr/bin/env bash
cd /Users/jorgefrancolara/casatapputi-mx
git add assets/js/catalog.js productos/index.html
git commit -m "fix(catalog): maxima estabilidad Medusa con AbortController Timeout y Stale-While-Revalidate"
git push origin main
