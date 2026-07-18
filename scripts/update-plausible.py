#!/usr/bin/env python3
"""Replace generic Plausible script with site-specific one in all HTML files."""
from pathlib import Path

BASE = Path("/home/enrique/casatapputi-mx")
OLD = '<script defer data-domain="fundacionebac.com.mx/casatapputi-mx" src="https://plausible.io/js/script.js"></script>'
NEW = """<!-- Privacy-friendly analytics by Plausible -->
<script async src="https://plausible.io/js/pa-KVB5ye4NhSFIsTbFNkW0V.js"></script>
<script>
  window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};
  plausible.init()
</script>"""

count = 0
for f in BASE.rglob("*.html"):
    content = f.read_text(encoding="utf-8")
    if OLD in content:
        content = content.replace(OLD, NEW)
        f.write_text(content, encoding="utf-8")
        print(f"  ✅ {f.relative_to(BASE)}")
        count += 1

print(f"\nDone: {count} files updated")
