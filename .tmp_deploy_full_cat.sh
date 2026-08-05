#!/usr/bin/env bash
cd /Users/jorgefrancolara/casatapputi-mx
git add assets/js/catalog.js productos/index.html
git commit -m "fix(catalog): invalidar cache ct_catalog_v20260803_v3 e implementar busqueda difusa de handles para desplegar los 20 productos integrales"
git push origin main
