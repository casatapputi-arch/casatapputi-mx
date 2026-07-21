#!/usr/bin/env python3
"""Inject Schema.org Product/Event markup into Casa Tapputi HTML pages."""

import re
from pathlib import Path

BASE_DIR = Path("/home/enrique/casatapputi-mx")
BASE_URL = "https://casatapputi.com.mx"

# Product data: slug → (name, description, price, priceLabel, image)
PRODUCTS = {
    "agua-rosas": ("Agua de Rosas", "Tónico de pétalos frescos sin alcohol. Hidratante y refrescante.", "150", "MXN", "agua-rosas.jpg"),
    "chilcuague": ("Chilcuague", "Raíz medicinal mexicana con propiedades analgésicas y antimicrobianas.", "120", "MXN", "chilcuague.jpg"),
    "esencia-miel": ("Esencia de Miel", "Perfume botánico con notas de miel melipona y flores silvestres.", "200", "MXN", "esencia-miel.jpg"),
    "esencias-naturales": ("Esencias Naturales", "Colección de esencias puras destiladas artesanalmente.", "180", "MXN", "esencias-naturales.jpg"),
    "friega-cannabis": ("Friega Cannabis", "Analgésico herbal líquido para dolores musculares y articulares.", "90", "MXN", "friega-cannabis.jpg"),
    "gel-cafe": ("Gel de Café", "Gel exfoliante con café orgánico. Estimula la circulación.", "130", "MXN", "gel-cafe.jpg"),
    "gel-rosas": ("Gel de Rosas", "Hidratante facial ligera con extracto de pétalos de rosa.", "150", "MXN", "gel-rosas.jpg"),
    "jabones": ("Jabones Herbales", "Jabones artesanales con aceites vegetales y plantas medicinales.", "80", "MXN", "jabones.jpg"),
    "lagrimas-rosas": ("Lágrimas de Rosas", "Suero facial concentrado con rosa damascena. Regenerador nocturno.", "250", "MXN", "lagrimas-rosas.jpg"),
    "leche-dorada": ("Leche Dorada", "Mezcla de cúrcuma, jengibre y especias. Bebida antiinflamatoria.", "100", "MXN", "leche-dorada.jpg"),
    "miel-melipona": ("Miel Melipona", "Miel pura de abeja melipona, la abeja sagrada maya.", "180", "MXN", "miel-melipona.jpg"),
    "oleo-masaje": ("Óleo de Masaje", "Aceite terapéutico con árnica, romero y caléndula.", "140", "MXN", "oleo-masaje.jpg"),
    "perfume-solido": ("Perfume Sólido", "Perfume botánico en formato sólido con cera de abeja y resinas.", "160", "MXN", "perfume-solido.jpg"),
    "pomada-calendula": ("Pomada de Caléndula", "Pomada cicatrizante y antiinflamatoria con cera de abeja y extracto de caléndula.", "100", "MXN", "pomada-calendula.jpg"),
    "pomada-cannabis": ("Pomada Cannabis", "Pomada con extracto de cannabis y árnica para dolores musculares.", "100", "MXN", "pomada-cannabis.jpg"),
    "roll-on": ("Roll-On Terapéutico", "Roll-on con aceites esenciales para alivio localizado.", "110", "MXN", "roll-on.jpg"),
    "salsa-matcha": ("Salsa Matcha", "Aderezo artesanal con matcha orgánico y especias.", "90", "MXN", "salsa-matcha.jpg"),
    "talabarteria": ("Talabartería", "Piezas de cuero artesanal para tu botica personal.", "300", "MXN", "talabarteria.jpg"),
    "terrarios": ("Terrarios Vivos", "Mini-ecosistemas con plantas medicinales.", "350", "MXN", "terrarios.jpg"),
    "tisanas": ("Tisanas Medicinales", "Mezclas de hierbas medicinales para infusión.", "100", "MXN", "tisanas.jpg"),
}


def generate_product_schema(name, description, price, currency, image, url):
    """Generate Schema.org Product JSON-LD."""
    return f"""<!-- Schema.org Product -->
<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "{name}",
  "description": "{description}",
  "image": "{BASE_URL}/assets/images/{image}",
  "url": "{url}",
  "brand": {{
    "@type": "Brand",
    "name": "Casa Tapputi"
  }},
  "offers": {{
    "@type": "Offer",
    "price": "{price}",
    "priceCurrency": "{currency}",
    "availability": "https://schema.org/InStock",
    "url": "{url}",
    "seller": {{
      "@type": "Organization",
      "name": "Casa Tapputi",
      "url": "{BASE_URL}/"
    }}
  }}
}}
</script>"""


def generate_talleres_schema():
    """Generate Schema.org ItemList + Events for talleres page."""
    return f"""<!-- Schema.org ItemList + Events -->
<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Talleres Casa Tapputi — Ciclo 2026",
  "description": "18 talleres de herbolaria presenciales en Huerto Roma Verde, CDMX. $500 por curso.",
  "url": "{BASE_URL}/talleres/",
  "numberOfItems": 18,
  "itemListElement": [
    {{
      "@type": "ListItem",
      "position": 1,
      "item": {{
        "@type": "Event",
        "name": "Salud Digestiva Herbal",
        "description": "Plantas medicinales que apoyan el sistema digestivo.",
        "startDate": "2026-06-13T11:30:00-06:00",
        "endDate": "2026-06-13T14:30:00-06:00",
        "location": {{ "@type": "Place", "name": "Huerto Roma Verde", "address": {{ "@type": "PostalAddress", "streetAddress": "Jalapa 234, Roma Sur", "addressLocality": "Ciudad de México", "addressRegion": "CDMX", "addressCountry": "MX", "postalCode": "06760" }} }},
        "offers": {{ "@type": "Offer", "price": "500", "priceCurrency": "MXN", "availability": "https://schema.org/InStock" }}
      }}
    }},
    {{
      "@type": "ListItem",
      "position": 2,
      "item": {{
        "@type": "Event",
        "name": "Plantas para Estrés y Ansiedad",
        "description": "Plantas que favorecen la calma y el equilibrio emocional.",
        "startDate": "2026-06-20T11:30:00-06:00",
        "endDate": "2026-06-20T14:30:00-06:00",
        "location": {{ "@type": "Place", "name": "Huerto Roma Verde", "address": {{ "@type": "PostalAddress", "streetAddress": "Jalapa 234, Roma Sur", "addressLocality": "Ciudad de México", "addressRegion": "CDMX", "addressCountry": "MX", "postalCode": "06760" }} }},
        "offers": {{ "@type": "Offer", "price": "500", "priceCurrency": "MXN", "availability": "https://schema.org/InStock" }}
      }}
    }},
    {{
      "@type": "ListItem",
      "position": 3,
      "item": {{
        "@type": "Event",
        "name": "Elixires Herbales",
        "description": "Preparados líquidos tradicionales que concentran las propiedades de las plantas.",
        "startDate": "2026-07-04T11:30:00-06:00",
        "endDate": "2026-07-04T14:30:00-06:00",
        "location": {{ "@type": "Place", "name": "Huerto Roma Verde", "address": {{ "@type": "PostalAddress", "streetAddress": "Jalapa 234, Roma Sur", "addressLocality": "Ciudad de México", "addressRegion": "CDMX", "addressCountry": "MX", "postalCode": "06760" }} }},
        "offers": {{ "@type": "Offer", "price": "500", "priceCurrency": "MXN", "availability": "https://schema.org/InStock" }}
      }}
    }},
    {{
      "@type": "ListItem",
      "position": 4,
      "item": {{
        "@type": "Event",
        "name": "Plantas de Poder",
        "description": "Valor histórico, cultural y simbólico de plantas centrales en tradiciones herbolarias.",
        "startDate": "2026-07-18T11:30:00-06:00",
        "endDate": "2026-07-18T14:30:00-06:00",
        "location": {{ "@type": "Place", "name": "Huerto Roma Verde", "address": {{ "@type": "PostalAddress", "streetAddress": "Jalapa 234, Roma Sur", "addressLocality": "Ciudad de México", "addressRegion": "CDMX", "addressCountry": "MX", "postalCode": "06760" }} }},
        "offers": {{ "@type": "Offer", "price": "500", "priceCurrency": "MXN", "availability": "https://schema.org/InStock" }}
      }}
    }},
    {{
      "@type": "ListItem",
      "position": 5,
      "item": {{
        "@type": "Event",
        "name": "Diafanización y Tinción",
        "description": "Técnica de transparentación de tejidos vegetales y tinción con colorantes naturales.",
        "startDate": "2026-07-25T11:30:00-06:00",
        "endDate": "2026-07-25T14:30:00-06:00",
        "location": {{ "@type": "Place", "name": "Huerto Roma Verde", "address": {{ "@type": "PostalAddress", "streetAddress": "Jalapa 234, Roma Sur", "addressLocality": "Ciudad de México", "addressRegion": "CDMX", "addressCountry": "MX", "postalCode": "06760" }} }},
        "offers": {{ "@type": "Offer", "price": "2000", "priceCurrency": "MXN", "availability": "https://schema.org/InStock" }}
      }}
    }},
    {{
      "@type": "ListItem",
      "position": 6,
      "item": {{
        "@type": "Event",
        "name": "Jabones Herbales Artesanales",
        "description": "Creación de jabones con plantas, aceites y esencias naturales.",
        "startDate": "2026-08-08T11:30:00-06:00",
        "endDate": "2026-08-08T14:30:00-06:00",
        "location": {{ "@type": "Place", "name": "Huerto Roma Verde", "address": {{ "@type": "PostalAddress", "streetAddress": "Jalapa 234, Roma Sur", "addressLocality": "Ciudad de México", "addressRegion": "CDMX", "addressCountry": "MX", "postalCode": "06760" }} }},
        "offers": {{ "@type": "Offer", "price": "500", "priceCurrency": "MXN", "availability": "https://schema.org/InStock" }}
      }}
    }},
    {{
      "@type": "ListItem",
      "position": 7,
      "item": {{
        "@type": "Event",
        "name": "Pomadas Herbales",
        "description": "Elaboración de pomadas artesanales con plantas, ceras y aceites naturales.",
        "startDate": "2026-08-22T11:30:00-06:00",
        "endDate": "2026-08-22T14:30:00-06:00",
        "location": {{ "@type": "Place", "name": "Huerto Roma Verde", "address": {{ "@type": "PostalAddress", "streetAddress": "Jalapa 234, Roma Sur", "addressLocality": "Ciudad de México", "addressRegion": "CDMX", "addressCountry": "MX", "postalCode": "06760" }} }},
        "offers": {{ "@type": "Offer", "price": "500", "priceCurrency": "MXN", "availability": "https://schema.org/InStock" }}
      }}
    }},
    {{
      "@type": "ListItem",
      "position": 8,
      "item": {{
        "@type": "Event",
        "name": "Perfume Sólido Herbal",
        "description": "Arte de la extracción y formulación aromática para crear un perfume sólido botánico.",
        "startDate": "2026-09-05T11:30:00-06:00",
        "endDate": "2026-09-05T14:30:00-06:00",
        "location": {{ "@type": "Place", "name": "Huerto Roma Verde", "address": {{ "@type": "PostalAddress", "streetAddress": "Jalapa 234, Roma Sur", "addressLocality": "Ciudad de México", "addressRegion": "CDMX", "addressCountry": "MX", "postalCode": "06760" }} }},
        "offers": {{ "@type": "Offer", "price": "500", "priceCurrency": "MXN", "availability": "https://schema.org/InStock" }}
      }}
    }},
    {{
      "@type": "ListItem",
      "position": 9,
      "item": {{
        "@type": "Event",
        "name": "Cuidado Capilar Herbal",
        "description": "Uso de plantas e ingredientes naturales para el cuidado del cabello.",
        "startDate": "2026-09-19T11:30:00-06:00",
        "endDate": "2026-09-19T14:30:00-06:00",
        "location": {{ "@type": "Place", "name": "Huerto Roma Verde", "address": {{ "@type": "PostalAddress", "streetAddress": "Jalapa 234, Roma Sur", "addressLocality": "Ciudad de México", "addressRegion": "CDMX", "addressCountry": "MX", "postalCode": "06760" }} }},
        "offers": {{ "@type": "Offer", "price": "500", "priceCurrency": "MXN", "availability": "https://schema.org/InStock" }}
      }}
    }},
    {{
      "@type": "ListItem",
      "position": 10,
      "item": {{
        "@type": "Event",
        "name": "Gel Facial Herbal",
        "description": "Elaboración de un gel facial con ingredientes herbales y botánicos.",
        "startDate": "2026-09-26T11:30:00-06:00",
        "endDate": "2026-09-26T14:30:00-06:00",
        "location": {{ "@type": "Place", "name": "Huerto Roma Verde", "address": {{ "@type": "PostalAddress", "streetAddress": "Jalapa 234, Roma Sur", "addressLocality": "Ciudad de México", "addressRegion": "CDMX", "addressCountry": "MX", "postalCode": "06760" }} }},
        "offers": {{ "@type": "Offer", "price": "500", "priceCurrency": "MXN", "availability": "https://schema.org/InStock" }}
      }}
    }},
    {{
      "@type": "ListItem",
      "position": 11,
      "item": {{
        "@type": "Event",
        "name": "Bálsamo Reparador Herbal",
        "description": "Elaboración de un bálsamo herbal aromático para la relajación profunda.",
        "startDate": "2026-10-10T11:30:00-06:00",
        "endDate": "2026-10-10T14:30:00-06:00",
        "location": {{ "@type": "Place", "name": "Huerto Roma Verde", "address": {{ "@type": "PostalAddress", "streetAddress": "Jalapa 234, Roma Sur", "addressLocality": "Ciudad de México", "addressRegion": "CDMX", "addressCountry": "MX", "postalCode": "06760" }} }},
        "offers": {{ "@type": "Offer", "price": "500", "priceCurrency": "MXN", "availability": "https://schema.org/InStock" }}
      }}
    }},
    {{
      "@type": "ListItem",
      "position": 12,
      "item": {{
        "@type": "Event",
        "name": "Kit Medicinal Herbal",
        "description": "Taller intensivo: infusión, bálsamo tópico, jabón de carbón, bálsamo respiratorio y spray desinfectante.",
        "startDate": "2026-10-24T11:30:00-06:00",
        "endDate": "2026-10-24T14:30:00-06:00",
        "location": {{ "@type": "Place", "name": "Huerto Roma Verde", "address": {{ "@type": "PostalAddress", "streetAddress": "Jalapa 234, Roma Sur", "addressLocality": "Ciudad de México", "addressRegion": "CDMX", "addressCountry": "MX", "postalCode": "06760" }} }},
        "offers": {{ "@type": "Offer", "price": "500", "priceCurrency": "MXN", "availability": "https://schema.org/InStock" }}
      }}
    }},
    {{
      "@type": "ListItem",
      "position": 13,
      "item": {{
        "@type": "Event",
        "name": "Masaje Descontracturante",
        "description": "Técnicas básicas para liberar tensión muscular y contracturas leves.",
        "startDate": "2026-11-14T11:30:00-06:00",
        "endDate": "2026-11-14T14:30:00-06:00",
        "location": {{ "@type": "Place", "name": "Huerto Roma Verde", "address": {{ "@type": "PostalAddress", "streetAddress": "Jalapa 234, Roma Sur", "addressLocality": "Ciudad de México", "addressRegion": "CDMX", "addressCountry": "MX", "postalCode": "06760" }} }},
        "offers": {{ "@type": "Offer", "price": "500", "priceCurrency": "MXN", "availability": "https://schema.org/InStock" }}
      }}
    }},
    {{
      "@type": "ListItem",
      "position": 14,
      "item": {{
        "@type": "Event",
        "name": "Masaje Deportivo",
        "description": "Técnicas de masaje para el cuidado muscular antes y después de la actividad física.",
        "startDate": "2026-11-28T11:30:00-06:00",
        "endDate": "2026-11-28T14:30:00-06:00",
        "location": {{ "@type": "Place", "name": "Huerto Roma Verde", "address": {{ "@type": "PostalAddress", "streetAddress": "Jalapa 234, Roma Sur", "addressLocality": "Ciudad de México", "addressRegion": "CDMX", "addressCountry": "MX", "postalCode": "06760" }} }},
        "offers": {{ "@type": "Offer", "price": "500", "priceCurrency": "MXN", "availability": "https://schema.org/InStock" }}
      }}
    }},
    {{
      "@type": "ListItem",
      "position": 15,
      "item": {{
        "@type": "Event",
        "name": "Masaje Relajante",
        "description": "Bases del masaje relajante para reducir el estrés y mejorar la circulación.",
        "startDate": "2026-12-05T11:30:00-06:00",
        "endDate": "2026-12-05T14:30:00-06:00",
        "location": {{ "@type": "Place", "name": "Huerto Roma Verde", "address": {{ "@type": "PostalAddress", "streetAddress": "Jalapa 234, Roma Sur", "addressLocality": "Ciudad de México", "addressRegion": "CDMX", "addressCountry": "MX", "postalCode": "06760" }} }},
        "offers": {{ "@type": "Offer", "price": "500", "priceCurrency": "MXN", "availability": "https://schema.org/InStock" }}
      }}
    }}
  ]
}}
</script>"""


def inject_product_schema(filepath, slug):
    """Inject Product schema into a product page."""
    name, desc, price, currency, image = PRODUCTS[slug]
    url = f"{BASE_URL}/productos/{slug}/"
    schema = generate_product_schema(name, desc, price, currency, image, url)

    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Remove any existing Schema.org Product
    content = re.sub(
        r'<!-- Schema\.org Product -->.*?</script>',
        '',
        content,
        flags=re.DOTALL
    )

    # Remove any existing Schema.org (not Organization on homepage)
    if "index.html" not in str(filepath) or "productos/" in str(filepath):
        content = re.sub(
            r'<!-- Schema\.org .*?-->.*?</script>',
            '',
            content,
            flags=re.DOTALL
        )

    # Inject before </body>
    if "</body>" in content:
        content = content.replace("</body>", f"\n{schema}\n</body>", 1)
    else:
        return False

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

    return True


def inject_talleres_schema():
    """Inject Event/ItemList schema into talleres page."""
    filepath = BASE_DIR / "talleres" / "index.html"
    schema = generate_talleres_schema()

    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Remove any existing Schema.org
    content = re.sub(
        r'<!-- Schema\.org .*?-->.*?</script>',
        '',
        content,
        flags=re.DOTALL
    )

    # Inject before </body>
    if "</body>" in content:
        content = content.replace("</body>", f"\n{schema}\n</body>", 1)
    else:
        return False

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

    return True


def main():
    product_dir = BASE_DIR / "productos"
    success = 0
    
    # Inject Product schema on all product pages
    for product_path in sorted(product_dir.iterdir()):
        if not product_path.is_dir():
            continue
        index_file = product_path / "index.html"
        if not index_file.exists():
            continue
        slug = product_path.name
        if slug not in PRODUCTS:
            print(f"  ⚠️  {slug}: no data, skipping")
            continue
        if inject_product_schema(index_file, slug):
            print(f"  ✅ productos/{slug}/ — Product schema")
            success += 1
        else:
            print(f"  ❌ productos/{slug}/ — failed")
    
    # Inject Event schema on talleres
    if inject_talleres_schema():
        print(f"  ✅ talleres/ — Event schema (15 workshops)")
        success += 1
    
    print(f"\nDone: {success} pages with Schema.org injected")


if __name__ == "__main__":
    main()
