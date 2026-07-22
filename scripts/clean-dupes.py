#!/usr/bin/env python3
"""
Limpia tags OG/Plausible/canonical/Twitter duplicados de las páginas de producto
y mejora los separadores del breadcrumb.
"""
import re
import os
import glob

PRODUCT_DIR = "/home/enrique/casatapputi-mx/productos"

def clean_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # ── 1. Eliminar bloques duplicados de OG + canonical + Twitter + Plausible ──
    # El bloque que se repite es:
    #   <link rel="canonical" ...>
    #   <!-- Open Graph -->
    #   ... og tags ...
    #   <!-- Twitter Card -->
    #   ... twitter tags ...
    #   <!-- Plausible Analytics -->
    #   ... plausible script ...
    #   </script>
    #
    # Estrategia: encontrar la PRIMERA ocurrencia del bloque y eliminar las siguientes

    pattern = re.compile(
        r'(<!-- Plausible Analytics -->.*?</script>\s*)',
        re.DOTALL
    )

    matches = list(pattern.finditer(content))
    if len(matches) >= 2:
        # Keep only the first Plausible block, remove the rest
        # We need to also remove the canonical + OG + Twitter before each duplicate Plausible
        # The full duplicate block pattern (after the first one):
        dup_block = re.compile(
            r'\n\s*<link rel="canonical" href="[^"]+">\s*\n'
            r'\s*<!-- Open Graph -->\s*\n'
            r'\s*<meta property="og:title" content="[^"]*">\s*\n'
            r'\s*<meta property="og:description" content="[^"]*">\s*\n'
            r'\s*<meta property="og:image" content="[^"]*">\s*\n'
            r'\s*<meta property="og:url" content="[^"]*">\s*\n'
            r'\s*<meta property="og:type" content="[^"]*">\s*\n'
            r'\s*<meta property="og:site_name" content="[^"]*">\s*\n'
            r'\s*<meta property="og:locale" content="[^"]*">\s*\n'
            r'\s*<!-- Twitter Card -->\s*\n'
            r'\s*<meta name="twitter:card" content="[^"]*">\s*\n'
            r'\s*<meta name="twitter:title" content="[^"]*">\s*\n'
            r'\s*<meta name="twitter:description" content="[^"]*">\s*\n'
            r'\s*<meta name="twitter:image" content="[^"]*">\s*\n'
            r'\s*<!-- Plausible Analytics -->\s*\n'
            r'\s*<!--[^>]*-->\s*\n'
            r'\s*<script async src="[^"]*"></script>\s*\n'
            r'\s*<script>\s*\n'
            r'\s*window\.plausible[^<]*</script>',
            re.DOTALL
        )

        # Remove all duplicate blocks (keep only the first occurrence)
        # Find where the first Plausible block ends
        first_end = matches[0].end()

        # Remove everything from the end of first Plausible to the end of last Plausible
        # that matches the duplicate pattern
        after_first = content[first_end:]

        # Remove duplicate blocks from after_first
        cleaned_after = dup_block.sub('', after_first)

        content = content[:first_end] + cleaned_after

    # ── 2. Mejorar separadores del breadcrumb ──
    # Reemplazar ' › ' por <span class="breadcrumb-sep">›</span>
    content = content.replace(' › ', ' <span class="breadcrumb-sep">›</span> ')

    # ── 3. Eliminar líneas vacías múltiples (> 2 saltos de línea seguidos) ──
    content = re.sub(r'\n{3,}', '\n\n', content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    files = glob.glob(os.path.join(PRODUCT_DIR, '*/index.html'))
    count = 0
    for f in sorted(files):
        if clean_file(f):
            rel = os.path.relpath(f, PRODUCT_DIR)
            print(f"✅ Limpiado: {rel}")
            count += 1
    print(f"\n📊 {count} archivos actualizados de {len(files)} totales")

if __name__ == '__main__':
    main()
