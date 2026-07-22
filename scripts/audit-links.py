#!/usr/bin/env python3
"""Audita enlaces, breadcrumbs y navegación del sitio Casa Tapputi."""

import re, os, sys
from pathlib import Path
from collections import Counter

BASE = Path("/home/enrique/casatapputi-mx")

def find_all_html():
    return sorted(f for f in BASE.rglob("*.html") if ".git" not in str(f))

def extract_internal_links(html_path: Path):
    """Extrae hrefs internos (sin http://, mailto:, tel:, o #puros)."""
    content = html_path.read_text(encoding="utf-8")
    hrefs = re.findall(r'href="((?!https?://|mailto:|tel:)[^"]*)"', content)
    links = []
    rel_dir = html_path.parent
    for h in hrefs:
        # Ignorar anchors puros
        if h.startswith("#"): continue
        # Resolver ruta relativa
        resolved = (rel_dir / h).resolve()
        try:
            relative = resolved.relative_to(BASE)
            links.append(str(relative))
        except ValueError:
            links.append(str(resolved))
    return links

def link_exists(link: str) -> bool:
    """Verifica si un link resuelto existe como archivo o directorio con index.html."""
    path = BASE / link
    if path.exists():
        return True
    # Si es directorio, verificar si tiene index.html
    if (path / "index.html").exists():
        return True
    return False

def extract_breadcrumbs(html_path: Path):
    """Extrae la estructura del breadcrumb."""
    content = html_path.read_text(encoding="utf-8")
    # Buscar último span con aria-current
    current = re.findall(r'aria-current="page"[^>]*>([^<]+)', content)
    # Buscar todos los links en el breadcrumb
    bc_links = re.findall(r'prod-breadcrumb[^<]*<a[^>]*href="([^"]*)"[^>]*>([^<]+)', content)
    return {"current": current, "links": bc_links}

def check_navigation(html_path: Path):
    """Verifica si la página tiene nav completa."""
    content = html_path.read_text(encoding="utf-8")
    has_topbar = "topbar" in content
    has_nav_links = "nav-links" in content
    has_mobile_menu = "mobile-menu" in content or "mobileMenu" in content
    has_footer = "<footer>" in content
    has_wa_float = "wa-float" in content
    return {
        "topbar": has_topbar,
        "nav_links": has_nav_links,
        "mobile_menu": has_mobile_menu,
        "footer": has_footer,
        "wa_float": has_wa_float,
    }

def main():
    html_files = find_all_html()
    found_issues = False
    print(f"📊 Auditando {len(html_files)} páginas HTML...\n")
    
    # ─── 1. ENLACES ROTOS ───
    print("=" * 60)
    print("🔗 ENLACES INTERNOS")
    print("=" * 60)
    
    all_links = set()
    broken = []
    for f in html_files:
        for link in extract_internal_links(f):
            all_links.add(link)
            if not link_exists(link):
                broken.append((str(f.relative_to(BASE)), link))
    
    print(f"   Total enlaces únicos: {len(all_links)}")
    
    if broken:
        print(f"\n   ❌ ENLACES ROTOS ({len(broken)}):")
        # Agrupar por link
        link_counts = Counter(l for _, l in broken)
        for link, count in link_counts.most_common():
            pages = [p for p, l in broken if l == link]
            print(f"   ❌ {link}  (desde {len(pages)} páginas: {', '.join(pages[:3])}{'...' if len(pages)>3 else ''})")
        found_issues = True
    else:
        print("   ✅ 0 enlaces rotos encontrados")
    
    # ─── 2. BREADCRUMBS ───
    print(f"\n{'='*60}")
    print("🍞 BREADCRUMBS")
    print("=" * 60)
    
    pages_with_bc = 0
    pages_without_bc = []
    bc_issues = []
    
    for f in html_files:
        bc = extract_breadcrumbs(f)
        rel = str(f.relative_to(BASE))
        if bc["current"]:
            pages_with_bc += 1
        else:
            # Solo reportar páginas que deberían tener breadcrumb (productos, subpáginas)
            if "/" in rel and "index.html" == f.name and rel not in ["index.html", "404.html", "sitemap.html", "google13560271d0e583b6.html"]:
                pages_without_bc.append(rel)
    
    print(f"   Páginas con breadcrumb: {pages_with_bc}")
    if pages_without_bc:
        print(f"   ⚠️  Podrían necesitar breadcrumb ({len(pages_without_bc)}):")
        for p in pages_without_bc[:10]:
            print(f"      {p}")
    
    # ─── 3. NAVEGACIÓN ───
    print(f"\n{'='*60}")
    print("🧭 NAVEGACIÓN")
    print("=" * 60)
    
    nav_issues = []
    for f in html_files:
        nav = check_navigation(f)
        rel = str(f.relative_to(BASE))
        missing = []
        if not nav["nav_links"]:
            missing.append("nav-links")
        if not nav["mobile_menu"]:
            missing.append("mobile-menu")
        if not nav["footer"]:
            missing.append("footer")
        if missing:
            nav_issues.append((rel, missing))
    
    if nav_issues:
        print(f"   ⚠️  Páginas con navegación incompleta ({len(nav_issues)}):")
        for page, missing in nav_issues:
            print(f"      {page}: falta {', '.join(missing)}")
    else:
        print("   ✅ Todas las páginas tienen navegación completa")
    
    # ─── 4. PÁGINAS HUÉRFANAS ───
    print(f"\n{'='*60}")
    print("👻 PÁGINAS SIN ENLACES ENTRANTES")
    print("=" * 60)
    
    # Construir mapa de qué páginas son enlazadas
    linked_pages = set()
    for f in html_files:
        for link in extract_internal_links(f):
            linked_pages.add(link)
    
    orphans = []
    for f in html_files:
        rel = str(f.relative_to(BASE))
        # Varias formas de referenciar la misma página
        variants = [
            rel,
            rel.replace("index.html", ""),
            rel.replace("/index.html", "/"),
            "./" + rel,
            "../" + rel.split("/", 1)[-1] if "/" in rel else None,
        ]
        variants = [v for v in variants if v is not None]
        if not any(v in linked_pages for v in variants):
            orphans.append(rel)
    
    if orphans:
        print(f"   ⚠️  Páginas sin enlaces entrantes ({len(orphans)}):")
        for p in orphans:
            # Excluir archivos que no deberían ser enlazados
            if p not in ["404.html", "sitemap.html", "google13560271d0e583b6.html", "tienda/gracias.html"]:
                print(f"      {p}")
    
    print(f"\n{'='*60}")
    if found_issues:
        print("❌ Auditoría encontró problemas. Corrígelos antes de deployar.")
    else:
        print("✅ Auditoría completada — todo limpio.")
    print(f"{'='*60}")
    
    sys.exit(1 if found_issues else 0)

if __name__ == "__main__":
    main()
