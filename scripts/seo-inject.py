#!/usr/bin/env python3
"""Add Plausible Analytics + OG tags + canonical to all Casa Tapputi HTML pages."""

import re
import os
from pathlib import Path

BASE_DIR = Path("/home/enrique/casatapputi-mx")
BASE_URL = "https://fundacionebac.com.mx/casatapputi-mx"
PLAUSIBLE_SCRIPT = '<script defer data-domain="fundacionebac.com.mx/casatapputi-mx" src="https://plausible.io/js/script.js"></script>'
OG_IMAGE = f"{BASE_URL}/assets/images/casa-tapputi-logo.png"

# Product name mapping (slug → display name + description snippet)
PRODUCTS = {
    "agua-rosas": ("Agua de Rosas", "Tónico de pétalos frescos sin alcohol. Hidratante y refrescante para todo tipo de piel."),
    "chilcuague": ("Chilcuague", "Raíz medicinal mexicana con propiedades analgésicas y antimicrobianas. Presentación en polvo o tintura."),
    "esencia-miel": ("Esencia de Miel", "Perfume botánico con notas de miel melipona, flores silvestres y resinas. Aroma cálido y envolvente."),
    "esencias-naturales": ("Esencias Naturales", "Colección de esencias puras destiladas artesanalmente. Aromaterapia de la más alta calidad."),
    "friega-cannabis": ("Friega Cannabis", "Analgésico herbal líquido de alta potencia para dolores musculares y articulares."),
    "gel-cafe": ("Gel de Café", "Gel exfoliante con café orgánico. Estimula la circulación y renueva la piel."),
    "gel-rosas": ("Gel de Rosas", "Hidratante facial ligera con extracto de pétalos de rosa. Para piel sensible y madura."),
    "jabones": ("Jabones Herbales", "Jabones artesanales elaborados con aceites vegetales y plantas medicinales. Sin químicos agresivos."),
    "lagrimas-rosas": ("Lágrimas de Rosas", "Suero facial concentrado con rosa damascena. Regenerador celular nocturno."),
    "leche-dorada": ("Leche Dorada", "Mezcla de cúrcuma, jengibre y especias para preparar la bebida antiinflamatoria tradicional."),
    "miel-melipona": ("Miel Melipona", "Miel pura de abeja melipona, la abeja sagrada maya. Propiedades medicinales superiores."),
    "oleo-masaje": ("Óleo de Masaje", "Aceite de masaje terapéutico con extractos de árnica, romero y caléndula."),
    "perfume-solido": ("Perfume Sólido", "Perfume botánico en formato sólido. Cera de abeja, aceites esenciales y resinas naturales."),
    "pomada-calendula": ("Pomada de Caléndula", "Pomada cicatrizante y antiinflamatoria con cera de abeja y extracto puro de caléndula. Para heridas menores, quemaduras e irritaciones."),
    "pomada-cannabis": ("Pomada Cannabis", "Pomada con extracto de cannabis y árnica para dolores musculares y articulares. Efecto calmante profundo."),
    "roll-on": ("Roll-On Terapéutico", "Roll-on con aceites esenciales para alivio localizado. Práctico y portátil."),
    "salsa-matcha": ("Salsa Matcha", "Aderezo artesanal con matcha orgánico y especias. Para ensaladas, bowls y platillos."),
    "talabarteria": ("Talabartería", "Piezas de cuero artesanal: estuches, porta-esencias y accesorios para tu botica personal."),
    "terrarios": ("Terrarios Vivos", "Mini-ecosistemas con plantas medicinales. Decoración viva que purifica el aire."),
    "tisanas": ("Tisanas Medicinales", "Mezclas de hierbas medicinales para infusión. Digestión, relajación, inmunidad y más."),
}

PAGES = {
    "": ("Casa Tapputi — Herbolaria y Perfumería Botánica en CDMX",
          "Casa Tapputi: taller de herbolaria en Huerto Roma Verde, CDMX. Pomadas, perfumes sólidos, esencias, jabones artesanales y tisanas medicinales. Talleres presenciales."),
    "productos": ("Catálogo de Productos — Casa Tapputi",
                  "Catálogo completo de productos Casa Tapputi: pomadas herbales, esencias naturales, perfumes sólidos, jabones artesanales, tisanas medicinales y más. Hecho en CDMX."),
    "experiencias": ("Experiencias — Casa Tapputi",
                     "Aromaterapia, spa en la naturaleza y eventos sensoriales en Huerto Roma Verde. Vive la herbolaria mexicana en CDMX."),
    "servicios": ("Servicios B2B — Casa Tapputi",
                  "Marca privada y eventos corporativos con Casa Tapputi. Formulamos productos herbales con tu marca. Talleres para empresas en CDMX."),
    "talleres": ("Talleres y Cursos — Casa Tapputi",
                 "Talleres de herbolaria en Huerto Roma Verde, CDMX. Aprende a hacer pomadas, perfumes, jabones y tinturas con plantas medicinales mexicanas."),
    "nosotros": ("Nosotros — Casa Tapputi",
                 "Conoce la historia de Casa Tapputi: 12 años de herbolaria en Huerto Roma Verde. Nuestros valores, alianzas y el legado de Tapputi, la primera química de la historia."),
    "tienda/carrito": ("Carrito de Compras — Casa Tapputi", "Revisa tu carrito de compras en Casa Tapputi."),
    "tienda/gracias": ("¡Gracias por tu compra! — Casa Tapputi", "Tu pedido en Casa Tapputi ha sido recibido. Gracias por elegir herbolaria mexicana artesanal."),
}


def generate_og_tags(title, description, url, image=OG_IMAGE):
    """Generate OG meta tags block."""
    return f"""  <!-- Open Graph -->
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{description}">
  <meta property="og:image" content="{image}">
  <meta property="og:url" content="{url}">
  <meta property="og:type" content="{'product' if '/productos/' in url else 'website'}">
  <meta property="og:site_name" content="Casa Tapputi">
  <meta property="og:locale" content="es_MX">
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{title}">
  <meta name="twitter:description" content="{description}">
  <meta name="twitter:image" content="{image}">"""


def generate_canonical(url):
    """Generate canonical link tag."""
    return f'  <link rel="canonical" href="{url}">'


def process_html_file(filepath: Path):
    """Add SEO tags to a single HTML file."""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Determine page type and URL
    rel_path = filepath.relative_to(BASE_DIR)
    rel_dir = str(rel_path.parent)
    is_product = rel_dir.startswith("productos/")
    
    if is_product:
        slug = rel_dir.split("/", 1)[1]
        prod_name, prod_desc = PRODUCTS.get(slug, (slug.replace("-", " ").title(), ""))
        page_title = f"{prod_name} — Casa Tapputi"
        page_desc = prod_desc
        page_url = f"{BASE_URL}/{rel_dir}/"
    else:
        page_key = rel_dir.rstrip("/") if rel_dir != "." else ""
        title_default, desc_default = PAGES.get(page_key, ("Casa Tapputi", ""))
        page_title = title_default
        page_desc = desc_default
        page_url = f"{BASE_URL}/{rel_dir}/" if rel_dir else f"{BASE_URL}/"

    # Update title if needed (not for products, they already have good titles)
    if not is_product and page_key in PAGES:
        old_title_match = re.search(r'<title>(.*?)</title>', content)
        if old_title_match:
            content = content.replace(f"<title>{old_title_match.group(1)}</title>", f"<title>{page_title}</title>")

    # Update meta description if needed
    if page_desc:
        old_meta = re.search(r'<meta name="description" content="(.*?)"', content)
        if old_meta:
            content = content.replace(
                f'<meta name="description" content="{old_meta.group(1)}"',
                f'<meta name="description" content="{page_desc}"'
            )
        elif '<meta charset="UTF-8"' in content:
            content = content.replace(
                '<meta charset="UTF-8" />',
                f'<meta charset="UTF-8" />\n  <meta name="description" content="{page_desc}" />'
            )

    # Generate SEO tags to insert
    og_block = generate_og_tags(page_title, page_desc, page_url)
    canonical = generate_canonical(page_url)
    
    seo_block = f"""{canonical}
{og_block}
  <!-- Plausible Analytics -->
  {PLAUSIBLE_SCRIPT}"""

    # Insert before </head>
    if "</head>" in content:
        content = content.replace("</head>", f"\n{seo_block}\n</head>", 1)
    else:
        print(f"WARNING: No </head> found in {filepath}")
        return False

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

    return True


def fix_robots_txt():
    """Fix robots.txt to use correct URL."""
    robots_path = BASE_DIR / "robots.txt"
    content = """User-agent: *
Allow: /
Disallow: /tienda/carrito.html
Disallow: /tienda/gracias.html

Sitemap: https://fundacionebac.com.mx/casatapputi-mx/sitemap.xml
"""
    with open(robots_path, "w", encoding="utf-8") as f:
        f.write(content)


def fix_sitemap_xml():
    """Fix sitemap.xml URLs."""
    sitemap_path = BASE_DIR / "sitemap.xml"
    with open(sitemap_path, "r", encoding="utf-8") as f:
        content = f.read()
    content = content.replace("https://casatapputi-medusa.duckdns.org", BASE_URL)
    with open(sitemap_path, "w", encoding="utf-8") as f:
        f.write(content)


def add_schema_to_homepage():
    """Add Schema.org Organization to homepage."""
    homepage = BASE_DIR / "index.html"
    with open(homepage, "r", encoding="utf-8") as f:
        content = f.read()

    schema = """<!-- Schema.org Organization -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Casa Tapputi",
  "url": "https://fundacionebac.com.mx/casatapputi-mx/",
  "description": "Perfumería botánica y herbolaria mexicana. Talleres, terapias y productos artesanales en Huerto Roma Verde, CDMX.",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Jalapa 234, Roma Sur",
    "addressLocality": "Ciudad de México",
    "addressRegion": "CDMX",
    "addressCountry": "MX",
    "postalCode": "06760"
  },
  "telephone": "+525563707034",
  "sameAs": [
    "https://www.instagram.com/casatapputi/",
    "https://www.facebook.com/casatapputi/"
  ]
}
</script>"""

    # Insert schema before closing body tag, after the last script
    if "</body>" in content:
        content = content.replace("</body>", f"\n{schema}\n</body>", 1)
    
    with open(homepage, "w", encoding="utf-8") as f:
        f.write(content)


def main():
    html_files = list(BASE_DIR.rglob("*.html"))
    print(f"Found {len(html_files)} HTML files to process")
    
    success = 0
    for f in sorted(html_files):
        if process_html_file(f):
            success += 1
            print(f"  ✅ {f.relative_to(BASE_DIR)}")
        else:
            print(f"  ❌ {f.relative_to(BASE_DIR)}")
    
    fix_robots_txt()
    print("  ✅ robots.txt fixed")
    
    fix_sitemap_xml()
    print("  ✅ sitemap.xml fixed")
    
    add_schema_to_homepage()
    print("  ✅ Schema.org added to homepage")
    
    print(f"\nDone: {success}/{len(html_files)} files processed successfully")


if __name__ == "__main__":
    main()
