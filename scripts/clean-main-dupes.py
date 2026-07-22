#!/usr/bin/env python3
"""Limpia duplicados de OG/Plausible en paginas principales y actualiza breadcrumbs."""
import re
import os

ROOT = '/home/enrique/casatapputi-mx'

FILES = [
    'index.html',
    'tienda/carrito.html',
    'experiencias/index.html',
    'talleres/index.html',
    'nosotros/index.html',
    'servicios/index.html',
]

def clean_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content

    # Remove duplicate OG+canonical+Twitter+Plausible blocks (keep first only)
    # Find first Plausible script end
    pattern = re.compile(r'(<!-- Plausible Analytics -->.*?</script>\s*)', re.DOTALL)
    matches = list(pattern.finditer(content))
    if len(matches) >= 2:
        first_end = matches[0].end()
        after = content[first_end:]

        dup = re.compile(
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
        after = dup.sub('', after)
        content = content[:first_end] + after

    # Update breadcrumb separators
    content = content.replace(' › ', ' <span class="breadcrumb-sep">›</span> ')

    # Collapse multiple blank lines
    content = re.sub(r'\n{3,}', '\n\n', content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    count = 0
    for f in FILES:
        path = os.path.join(ROOT, f)
        if os.path.exists(path) and clean_file(path):
            print(f"✅ Limpiado: {f}")
            count += 1
    print(f"\n📊 {count} archivos actualizados de {len(FILES)}")

if __name__ == '__main__':
    main()
