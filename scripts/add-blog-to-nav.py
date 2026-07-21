#!/usr/bin/env python3
"""Add Blog link to nav menu in all Casa Tapputi HTML pages + update blog index + update sitemap."""
from pathlib import Path

BASE = Path("/home/enrique/casatapputi-mx")
count = 0

# 1. Add Blog to nav menu on all non-blog pages
for f in BASE.rglob("*.html"):
    content = f.read_text(encoding="utf-8")
    rel = str(f.relative_to(BASE))
    
    # Skip blog pages — they already have Blog in nav
    if "blog/" in rel:
        continue
    
    # Determine relative path prefix for links
    depth = rel.count("/")
    prefix = "../" * depth if depth > 0 else ""
    
    # Add Blog link before closing </ul> of nav-links
    old_nav_end = '<li><a href="' + ("nosotros/" if depth == 0 else prefix + "nosotros/") + '">Nosotros</a></li></ul>'
    new_nav_end = '<li><a href="' + ("nosotros/" if depth == 0 else prefix + "nosotros/") + '">Nosotros</a></li><li><a href="' + (prefix + "blog/" if depth > 0 else "blog/") + '">Blog</a></li></ul>'
    
    if old_nav_end in content:
        content = content.replace(old_nav_end, new_nav_end, 1)
        f.write_text(content, encoding="utf-8")
        print(f"  ✅ nav {rel}")
        count += 1
    else:
        # Try alternative pattern (some pages have different spacing)
        print(f"  ⚠️  pattern not found in {rel}")

print(f"\nNav updated: {count} pages")

# 2. Update blog index with new Árnica article
blog_idx = BASE / "blog" / "index.html"
content = blog_idx.read_text(encoding="utf-8")

arnica_card = """  <div class="blog-card">
    <p class="card-date">18 de julio, 2026 · Plantas Medicinales</p>
    <h2><a href="guia-completa-arnica-planta-botica-mexicana/">💪 Árnica: la Planta que Toda Botica Mexicana Debería Tener</a></h2>
    <p>Golpes, moretones, dolor muscular. El árnica mexicana (Heterotheca inuloides) es el remedio natural más eficaz para el trauma físico. Guía completa con sus propiedades, usos y cómo prepararla.</p>
    <a href="guia-completa-arnica-planta-botica-mexicana/" class="read-more">Leer artículo →</a>
  </div>

  <div class="blog-card">
    <p class="card-date">18 de julio, 2026 · Plantas Medicinales</p>
    <h2><a href="guia-completa-calendula-propiedades-usos-preparaciones/">🌼 Guía Completa de la Caléndula: Propiedades, Usos y Preparaciones</a></h2>
    <p>La caléndula es probablemente la planta medicinal más subestimada del botiquín casero. Antiinflamatoria, cicatrizante y antiséptica. Guía completa con respaldo científico y tres formas de prepararla.</p>
    <a href="guia-completa-calendula-propiedades-usos-preparaciones/" class="read-more">Leer artículo →</a>
  </div>"""

old_calendula = """  <div class="blog-card">
    <p class="card-date">18 de julio, 2026 · Plantas Medicinales</p>
    <h2><a href="guia-completa-calendula-propiedades-usos-preparaciones/">🌼 Guía Completa de la Caléndula: Propiedades, Usos y Preparaciones</a></h2>
    <p>La caléndula es probablemente la planta medicinal más subestimada del botiquín casero. Antiinflamatoria, cicatrizante y antiséptica. Guía completa con respaldo científico y tres formas de prepararla.</p>
    <a href="guia-completa-calendula-propiedades-usos-preparaciones/" class="read-more">Leer artículo →</a>
  </div>"""

content = content.replace(old_calendula, arnica_card, 1)
blog_idx.write_text(content, encoding="utf-8")
print("  ✅ blog/index.html updated with Árnica article")

# 3. Update sitemap.xml with blog URLs
sitemap = BASE / "sitemap.xml"
content = sitemap.read_text(encoding="utf-8")

blog_urls = """  <url><loc>https://casatapputi.com.mx/blog/</loc><lastmod>2026-07-21</lastmod><changefreq>weekly</changefreq></url>
  <url><loc>https://casatapputi.com.mx/blog/guia-completa-calendula-propiedades-usos-preparaciones/</loc><lastmod>2026-07-21</lastmod><changefreq>monthly</changefreq></url>
  <url><loc>https://casatapputi.com.mx/blog/guia-completa-arnica-planta-botica-mexicana/</loc><lastmod>2026-07-21</lastmod><changefreq>monthly</changefreq></url>
</urlset>"""

content = content.replace("</urlset>", blog_urls, 1)
sitemap.write_text(content, encoding="utf-8")
print("  ✅ sitemap.xml updated with 3 blog URLs")

print(f"\nDone! Total nav updates: {count}")
