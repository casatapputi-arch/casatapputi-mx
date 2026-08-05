#!/bin/bash
# Casa Tapputi — Build Script (pre-deploy)
# ==========================================
# Minifica CSS y JS para producción.
# Uso: bash scripts/build.sh
#
# Para restaurar originales después del deploy:
#   python3 scripts/minify.py --restore

set -e
cd "$(dirname "$0")/.."

echo "🔨 Casa Tapputi — Build"
echo ""

# Paso 1: Minificar CSS/JS
echo "📦 Minificando CSS/JS..."
python3 scripts/minify.py --all --in-place

echo ""
echo "✅ Build completado."
echo ""
echo "📋 Próximos pasos:"
echo "   git add -A"
echo "   git commit -m 'build: minificar CSS/JS para producción'"
echo "   git push origin main"
echo ""
echo "♻️  Para restaurar originales: python3 scripts/minify.py --restore"
