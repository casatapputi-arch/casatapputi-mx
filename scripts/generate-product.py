#!/usr/bin/env python3
"""
generate-product.py — Generador de páginas de producto para Casa Tapputi

Uso:
  python3 scripts/generate-product.py datos/mi-producto.json
  python3 scripts/generate-product.py --template  # crea un JSON de ejemplo

El script:
  1. Lee un archivo JSON con los datos del producto
  2. Crea la carpeta productos/<slug>/
  3. Genera un index.html completo con header, hero, variantes, beneficios, related, SEO y schema.org
  4. Soporta productos con variante única o múltiples variantes (radio buttons)

Para Erandi: solo necesitas editar el archivo JSON y correr este script. Cero HTML.
"""

import json
import os
import sys
from pathlib import Path

# ─── Configuración ───────────────────────────────────────────────
REPO_ROOT = Path(__file__).resolve().parent.parent  # /home/enrique/casatapputi-mx
PRODUCTOS_DIR = REPO_ROOT / "productos"
DOMAIN = "https://casatapputi.com.mx"
WA_NUMBER = "525563707034"

# ─── Template HTML ────────────────────────────────────────────────
HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title} — Casa Tapputi</title>
  <meta name="description" content="{meta_description}" />
  <link rel="stylesheet" href="../../assets/css/main.css" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Montserrat:wght@300;400;500;600&display=swap" rel="stylesheet">
  <link rel="icon" type="image/png" href="../../assets/images/casa-tapputi-logo.webp">

  <link rel="canonical" href="{canonical_url}">
  <!-- Open Graph -->
  <meta property="og:title" content="{og_title}">
  <meta property="og:description" content="{og_description}">
  <meta property="og:image" content="{og_image}">
  <meta property="og:url" content="{canonical_url}">
  <meta property="og:type" content="product">
  <meta property="og:site_name" content="Casa Tapputi">
  <meta property="og:locale" content="es_MX">
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{og_title}">
  <meta name="twitter:description" content="{og_description}">
  <meta name="twitter:image" content="{og_image}">
  <!-- Plausible Analytics -->
  <!-- Privacy-friendly analytics by Plausible -->
<script async src="https://plausible.io/js/pa-KVB5ye4NhSFIsTbFNkW0V.js"></script>
<script>
  window.plausible=window.plausible||function(){{(plausible.q=plausible.q||[]).push(arguments)}},plausible.init=plausible.init||function(i){{plausible.o=i||{{}}}};
  plausible.init()
</script>
</head>
<body>
  <a href="#main-content" class="skip-link">Saltar al contenido principal</a>

<div class="topbar">Llevando la salud natural a tu hogar</div>

<nav>
  <div class="nav-inner">
    <a href="../../" class="nav-logo">
      <img src="../../assets/images/casa-tapputi-logo.webp" alt="Casa Tapputi" />
      <span class="wordmark">CASA TAPPUTI</span>
    </a>
    <ul class="nav-links">
      <li><a href="../../productos/">Productos</a></li>
      <li><a href="../../experiencias/">Experiencias</a></li>
      <li><a href="../../servicios/">Servicios</a></li>
      <li><a href="../../talleres/">Talleres &amp; Cursos</a></li>
      <li><a href="../../nosotros/">Nosotros</a></li>
          <li><a href="../../sitemap.html">Mapa del sitio</a></li>
    </ul>
    <a href="../../tienda/carrito.html" class="cart-icon" aria-label="Carrito de compras">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
      <span class="cart-count" style="display:none" aria-live="polite" aria-label="0 productos en el carrito">0</span>
    </a>
    <div class="nav-social">
      <a href="https://www.facebook.com/casatapputi/?ref=NONE_xav_ig_profile_page_web" aria-label="Facebook" target="_blank" rel="noopener"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z"/></svg></a>
      <a href="https://www.instagram.com/casatapputi?utm_source=ig_web_button_share_sheet&amp;igsh=ZDNlZDc0MzIxNw==" aria-label="Instagram" target="_blank" rel="noopener"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg></a>
      <a href="https://wa.me/525563707034?text=Hola%20Casa%20Tapputi" aria-label="WhatsApp" target="_blank" rel="noopener">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
      </a>
    </div>
    <button class="hamburger" onclick="toggleMenu()" aria-label="Abrir menú"><span></span><span></span><span></span></button>
  </div>
</nav>
<div class="mobile-menu" id="mobileMenu">
  <a href="../../productos/" onclick="toggleMenu()">Productos</a>
  <a href="../../experiencias/" onclick="toggleMenu()">Experiencias</a>
  <a href="../../servicios/" onclick="toggleMenu()">Servicios</a>
  <a href="../../talleres/" onclick="toggleMenu()">Talleres &amp; Cursos</a>
  <a href="../../nosotros/" onclick="toggleMenu()">Nosotros</a>
</div>

<header class="prod-hero" style="background-image:url('../../assets/images/{hero_image}')">
  <div class="container">
    <nav class="prod-breadcrumb" aria-label="Breadcrumb"><a href="../../">Inicio</a> <span class="breadcrumb-sep">›</span> <a href="../../productos/">Productos</a> <span class="breadcrumb-sep">›</span> <span aria-current="page">{breadcrumb_name}</span></nav>
    <main id="main-content">
<p class="prod-eyebrow">{prod_eyebrow}</p>
    <h1 class="prod-title">{prod_title}</h1>
    <p class="prod-subtitle">{prod_subtitle}</p>
  </div>
</header>

<section class="prod-section">
  <div class="container">
    <div class="prod-layout">
      <div class="prod-img-wrap">
        <img src="../../assets/images/{product_image}" alt="{title}" loading="lazy" />
      </div>
      <div class="prod-info">
        <p class="eyebrow">{eyebrow}</p>
        <h1>{h1}</h1>
        <p class="prod-subtitle">{subtitle_short}</p>
        <div class="prod-desc">
{description}
        </div>
        <hr class="prod-divider" />
{variant_section}
        <div class="prod-price-box">
          <div class="prod-price-label">Precio</div>
          <div class="prod-price" {price_display_id}>{price_display}</div>
          <div class="prod-price-present">{price_present}</div>
        </div>
        <div class="add-to-cart-wrapper">
          <div class="qty-stepper">
            <button type="button" aria-label="Restar cantidad" onclick="decrementQty()">−</button>
            <input type="number" id="productQty" value="1" min="1" aria-label="Cantidad"/>
            <button type="button" aria-label="Sumar cantidad" onclick="incrementQty()">+</button>
          </div>
          <button class="btn btn-add-cart prod-add-btn" data-product-id="{slug}" onclick="addCurrentProduct()">🛒 Agregar al carrito</button>
        </div>
        <p class="prod-meta-note">{meta_note}</p>
      </div>
    </div>
  </div>
</section>
{howto_html}
{benefits_html}
{related_html}

<section class="prod-cta-band">
  <h2>{cta_title}</h2>
  <p>{cta_subtitle}</p>
  <a href="https://wa.me/{wa_number}?text={wa_text}" class="btn-wa-message" target="_blank" rel="noopener">
    <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg>
    Preguntar por WhatsApp
  </a>
</section>

</main>
<footer>
  <div class="container">
    <div class="footer-inner">
      <div class="footer-brand">
        <span class="wordmark">CASA TAPPUTI</span>
        <p>Taller de herbolaria<br>Conservando las fórmulas de Tapputi, la primera química y perfumista de la historia quién destilaba flores, mirra y bálsamos para capturar el alma de la naturaleza.</p>
      </div>
      <div class="footer-col">
        <h4>Explorar</h4>
        <ul>
          <li><a href="../../productos/">Productos</a></li>
          <li><a href="../../experiencias/">Experiencias</a></li>
          <li><a href="../../servicios/">Servicios</a></li>
          <li><a href="../../talleres/">Talleres &amp; Cursos</a></li>
          <li><a href="../../nosotros/">Nosotros</a></li>
          <li><a href="../../sitemap.html">Mapa del sitio</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Contacto</h4>
        <ul>
          <li>Lunes – Viernes · 8am – 4pm</li>
          <li>Taller de Herbolaria en Jalapa 234, Roma Sur,<br>Cuauhtémoc, 06760, CDMX</li>
          <li><a href="tel:+525563707034">55-6370-7034</a></li>
          <li><a href="tel:+525563707034">(52) 55-6370-7034</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2026 Casa Tapputi — Todos los derechos reservados.</span>
      <span style="font-style:italic">Llevando la salud natural a tu hogar.</span>
    </div>
  </div>
</footer>

<script src="../../assets/js/main.js"></script>
<script src="../../assets/js/catalog.js?v=4"></script>
<script src="../../assets/js/cart-fixed.js"></script>
<script>
function incrementQty(){{const i=document.getElementById('productQty');i.value=parseInt(i.value)+1;}}
function decrementQty(){{const i=document.getElementById('productQty');if(parseInt(i.value)>1)i.value=parseInt(i.value)-1;}}
{product_js}
</script>

<a href="https://wa.me/525563707034?text=Hola%20Casa%20Tapputi" class="wa-float" target="_blank" rel="noopener" aria-label="Chatea por WhatsApp">
  <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
</a>

{schema_html}
</body>
</html>"""


def build_description(parrafos):
    """Genera el HTML de los párrafos de descripción."""
    return "\n".join(f"          <p>{p}</p>" for p in parrafos)


def build_variants_single(variants):
    """
    Variante única o múltiples variantes estáticas (sin selección de radio).
    Muestra todas las presentaciones pero solo la primera se usa en addCurrentProduct().
    """
    spans = "\n".join(
        f'          <span class="prod-variant">{v["label"]} <strong>{v["price_label"]}</strong></span>'
        for v in variants
    )
    return f"""        <p class="eyebrow" style="margin-bottom:.6rem">{variants[0].get('section_label', 'Presentación')}</p>
        <div class="prod-variants">
{spans}
        </div>"""


def build_variants_radio(variants):
    """Variantes con radio buttons para seleccionar presentación (como esencia-miel)."""
    radios = []
    for i, v in enumerate(variants):
        checked = " checked" if i == 0 else ""
        radios.append(
            f'          <label class="prod-variant-radio">\n'
            f'            <input type="radio" name="presSelect" value="{v["label"]}" '
            f'data-price="{v["price"]}" data-variant-id="{v["variant_id"]}"{checked} '
            f'onchange="updateProductPrice()">\n'
            f'            <span class="prod-variant-content"><strong>{v["label"]}</strong>'
            f'<span class="prod-variant-price">{v["price_label"]}</span></span>\n'
            f'          </label>'
        )
    radios_html = "\n".join(radios)

    return f"""        <p class="eyebrow" style="margin-bottom:.6rem">{variants[0].get('section_label', 'Elige tu presentación')}</p>
        <div class="prod-variant-radios">
{radios_html}
        </div>"""


def build_variant_section(data):
    """Construye la sección de variantes + precio según el tipo."""
    variants = data.get("variants", [])
    variant_type = data.get("variant_type", "single")

    if variant_type == "radio" and len(variants) > 1:
        variant_html = build_variants_radio(variants)
        price_display_id = ' id="displayPrice" aria-live="polite" aria-atomic="true"'
        price_display = variants[0]["price_label"]
    else:
        variant_html = build_variants_single(variants)
        price_display_id = ""
        price_display = data.get("price_display", variants[0]["price_label"] if variants else "$? MXN")

    price_present = data.get("price_present", "")

    return variant_html, price_display_id, price_display, price_present


def build_product_js(data):
    """Genera el JavaScript inline del producto (addCurrentProduct + precio dinámico)."""
    slug = data["slug"]
    variants = data.get("variants", [])
    variant_type = data.get("variant_type", "single")
    product_image = data.get("product_image", "")

    if variant_type == "radio" and len(variants) > 1:
        # Multi-variante con selección de precio
        first = variants[0]
        return f"""function updateProductPrice(){{
  const pres=document.querySelector('input[name="presSelect"]:checked');
  const price=parseInt(pres.dataset.price);
  document.getElementById('displayPrice').textContent='$'+price.toLocaleString('es-MX')+' MXN';
}}
updateProductPrice();
function addCurrentProduct(){{
  const presEl=document.querySelector('input[name="presSelect"]:checked');
  const size=presEl.value;
  const price=parseInt(presEl.dataset.price);
  const variantId=presEl.dataset.variantId;
  addToCart({{
    id:'{slug}',
    variantId:variantId,
    name:'{data["title"]} '+size,
    price:price,
    priceLabel:'$'+price.toLocaleString('es-MX')+' MXN',
    image:'../../assets/images/{product_image}',
    quantity:Math.max(1,parseInt(document.getElementById("productQty").value)||1)
  }});
}}"""
    else:
        # Variante única o estática
        first = variants[0] if variants else {}
        price = first.get("price", 0)
        price_label = first.get("price_label", f"${price} MXN")
        variant_id = first.get("variant_id", "")
        return f"""function addCurrentProduct(){{
  addToCart({{
    id:'{slug}',
    variantId:'{variant_id}',
    name:'{data["title"]}',
    price:{price},
    priceLabel:'{price_label}',
    image:'../../assets/images/{product_image}',
    quantity:Math.max(1,parseInt(document.getElementById("productQty").value)||1)
  }});
}}"""


def build_howto_html(howto):
    """Genera la sección de 'formas de uso'."""
    if not howto:
        return ""
    items_html = "\n".join(
        f'      <div class="prod-howto reveal"><span class="prod-howto-num">{i+1}</span><h3>{item["title"]}</h3><p>{item["description"]}</p></div>'
        for i, item in enumerate(howto.get("items", []))
    )
    return f"""<section class="prod-section prod-section-dark">
  <div class="container">
    <p class="eyebrow">{howto['eyebrow']}</p>
    <h2 class="section-title">{howto['title']}</h2>
    <div class="prod-howto-grid">
{items_html}
    </div>
  </div>
</section>"""


def build_benefits_html(benefits):
    """Genera la sección de beneficios."""
    if not benefits:
        return ""
    items_html = "\n".join(
        f'      <div class="prod-benefit reveal"><span class="prod-benefit-icon">{item["icon"]}</span><h3>{item["title"]}</h3><p>{item["description"]}</p></div>'
        for item in benefits.get("items", [])
    )
    return f"""<section class="prod-section">
  <div class="container">
    <p class="eyebrow">{benefits['eyebrow']}</p>
    <h2 class="section-title">{benefits['title']}</h2>
    <div class="prod-benefits">
{items_html}
    </div>
  </div>
</section>"""


def build_related_html(related):
    """Genera la sección de productos relacionados."""
    if not related:
        return ""
    products = related.get("products", [])
    if not products:
        return ""
    cards = []
    for r in products:
        link_type = r.get("link_type", "button")
        if link_type == "link":
            action = f'<a href="../{r["slug"]}/" class="btn btn-add-cart shop-cta">👁️ Ver opciones</a>'
        else:
            action = f'<button class="btn btn-add-cart shop-cta" data-product-id="{r["id"]}" onclick="addToCart(getProductData(this))">🛒 Agregar</button>'
        cards.append(
            f'      <article class="shop-card" data-product-id="{r["id"]}" data-product-name="{r["name"]}" data-product-price="{r["price"]}" data-product-price-label="{r["price_label"]}" data-product-image="../../assets/images/{r["image"]}">\n'
            f'        <a href="../{r["slug"]}/"><img src="../../assets/images/{r["image"]}" alt="{r["name"]}" loading="lazy"></a>\n'
            f'        <div class="shop-body">\n'
            f'          <h3><a href="../{r["slug"]}/">{r["name"]}</a></h3>\n'
            f'          <p class="shop-desc">{r["desc"]}</p>\n'
            f'          <span class="shop-price">{r["price_label"]}</span>\n'
            f'          {action}\n'
            f'        </div>\n'
            f'      </article>'
        )
    cards_html = "\n".join(cards)
    return f"""<section class="prod-section prod-section-dark">
  <div class="container">
    <p class="eyebrow">{related.get('eyebrow', 'Complementa tu experiencia')}</p>
    <h2 class="section-title">{related.get('title', 'También te puede interesar')}</h2>
    <div class="related-grid">
{cards_html}
    </div>
  </div>
</section>"""


def build_schema(data):
    """Genera los bloques JSON-LD de Schema.org (Product + BreadcrumbList)."""
    slug = data["slug"]
    url = f"{DOMAIN}/productos/{slug}/"
    name = data.get("schema_name", data["title"])
    description = data.get("schema_description", data["meta_description"])
    image = data.get("schema_image", data.get("product_image", ""))
    image_url = f"{DOMAIN}/assets/images/{image}" if image else ""
    price = str(data.get("schema_price", data.get("variants", [{}])[0].get("price", "0")))

    product_schema = f"""<!-- Schema.org Product -->
<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "{name}",
  "description": "{description}",
  "image": "{image_url}",
  "url": "{url}",
  "brand": {{
    "@type": "Brand",
    "name": "Casa Tapputi"
  }},
  "offers": {{
    "@type": "Offer",
    "price": "{price}",
    "priceCurrency": "MXN",
    "availability": "https://schema.org/InStock",
    "url": "{url}",
    "seller": {{
      "@type": "Organization",
      "name": "Casa Tapputi",
      "url": "{DOMAIN}/"
    }}
  }}
}}
</script>"""

    breadcrumb_name = data.get("breadcrumb_name", name)
    breadcrumb_schema = f"""<!-- Schema.org BreadcrumbList -->
<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {{
      "@type": "ListItem",
      "position": 1,
      "name": "Inicio",
      "item": "{DOMAIN}/"
    }},
    {{
      "@type": "ListItem",
      "position": 2,
      "name": "Catálogo",
      "item": "{DOMAIN}/productos/"
    }},
    {{
      "@type": "ListItem",
      "position": 3,
      "name": "{breadcrumb_name}",
      "item": "{url}"
    }}
  ]
}}
</script>"""

    return f"\n{product_schema}\n\n{breadcrumb_schema}\n"


def generate_product(data):
    """Genera el HTML completo y lo escribe en productos/<slug>/index.html."""
    slug = data["slug"]
    out_dir = PRODUCTOS_DIR / slug
    out_dir.mkdir(parents=True, exist_ok=True)

    # Variantes y precio
    variant_html, price_display_id, price_display, price_present = build_variant_section(data)

    # Descripción
    desc_parrafos = data.get("description", [])
    desc_html = build_description(desc_parrafos)

    # Secciones opcionales
    howto_html = build_howto_html(data.get("howto"))
    benefits_html = build_benefits_html(data.get("benefits"))
    related_html = build_related_html(data.get("related"))

    # Product JS
    product_js = build_product_js(data)

    # Schema
    schema_html = build_schema(data)

    # WhatsApp text
    wa_text = data.get("wa_text", f"Hola%20Casa%20Tapputi%2C%20me%20interesa%20{data['title'].replace(' ', '%20')}")

    # CTA
    cta = data.get("cta", {})
    cta_title = cta.get("title", "¿Tienes dudas sobre este producto?")
    cta_subtitle = cta.get("subtitle", "Escríbenos por WhatsApp y te asesoramos personalmente con gusto.")

    html = HTML_TEMPLATE.format(
        title=data["title"],
        meta_description=data["meta_description"],
        canonical_url=f"{DOMAIN}/productos/{slug}/",
        og_title=data.get("og_title", data["title"] + " — Casa Tapputi"),
        og_description=data.get("og_description", data["meta_description"]),
        og_image=data.get("og_image", f"{DOMAIN}/assets/images/casa-tapputi-logo.webp"),
        hero_image=data["hero_image"],
        breadcrumb_name=data.get("breadcrumb_name", data["title"]),
        prod_eyebrow=data["prod_eyebrow"],
        prod_title=data["prod_title"],
        prod_subtitle=data["prod_subtitle"],
        product_image=data["product_image"],
        eyebrow=data["eyebrow"],
        h1=data["h1"],
        subtitle_short=data["subtitle_short"],
        description=desc_html,
        variant_section=variant_html,
        price_display_id=price_display_id,
        price_display=price_display,
        price_present=price_present,
        meta_note=data.get("meta_note", "Elaborado artesanalmente en Huerto Roma Verde."),
        slug=slug,
        howto_html=howto_html,
        benefits_html=benefits_html,
        related_html=related_html,
        cta_title=cta_title,
        cta_subtitle=cta_subtitle,
        wa_number=WA_NUMBER,
        wa_text=wa_text,
        product_js=product_js,
        schema_html=schema_html,
    )

    out_path = out_dir / "index.html"
    out_path.write_text(html, encoding="utf-8")
    print(f"✅ Producto generado: {out_path}")
    print(f"   URL: {DOMAIN}/productos/{slug}/")
    return out_path


def create_template():
    """Crea un archivo JSON de ejemplo para que Erandi lo edite."""
    template = {
        "_instrucciones": "Edita este archivo con los datos de tu producto. Luego corre: python3 scripts/generate-product.py datos/tu-producto.json",
        "slug": "mi-producto-nuevo",
        "title": "Mi Producto Nuevo",
        "meta_description": "Descripción corta para Google y redes sociales (máx 160 caracteres).",
        "og_title": "Mi Producto Nuevo — Casa Tapputi",
        "og_description": "Descripción para Facebook/Twitter cuando compartan el link.",
        "og_image": "https://casatapputi.com.mx/assets/images/casa-tapputi-logo.webp",
        "hero_image": "mi-producto.webp",
        "product_image": "mi-producto.webp",
        "breadcrumb_name": "Mi Producto Nuevo",
        "prod_eyebrow": "Categoría del producto",
        "prod_title": "Mi Producto Nuevo",
        "prod_subtitle": "Frase corta debajo del título en el hero",
        "eyebrow": "Colección X",
        "h1": "Mi Producto Nuevo",
        "subtitle_short": "Frase atractiva junto al precio",
        "description": [
            "Primer párrafo descriptivo del producto. Explica qué es y por qué es especial.",
            "Segundo párrafo con más detalles: ingredientes, beneficios, modo de uso."
        ],
        "variant_type": "single",
        "_variant_type_opciones": "single (una presentación), radio (varias con selector de precio)",
        "variants": [
            {
                "section_label": "Presentación",
                "label": "30 ml",
                "price": 150,
                "price_label": "$150 MXN",
                "variant_id": "variant_01XXXXXXXXXXXXX"
            }
        ],
        "price_display": "$150 MXN",
        "price_present": "30 ml — descripción breve de la presentación",
        "meta_note": "Elaborado artesanalmente en Huerto Roma Verde. Envíos a toda CDMX.",
        "howto": {
            "eyebrow": "Cómo integrarlo a tu día",
            "title": "Tres formas de uso",
            "items": [
                {"title": "Uso 1", "description": "Descripción del primer uso."},
                {"title": "Uso 2", "description": "Descripción del segundo uso."},
                {"title": "Uso 3", "description": "Descripción del tercer uso."}
            ]
        },
        "benefits": {
            "eyebrow": "Por qué lo elegimos",
            "title": "Beneficios principales",
            "items": [
                {"icon": "🌿", "title": "Beneficio 1", "description": "Descripción del beneficio."},
                {"icon": "✨", "title": "Beneficio 2", "description": "Descripción del beneficio."},
                {"icon": "💚", "title": "Beneficio 3", "description": "Descripción del beneficio."}
            ]
        },
        "related": {
            "eyebrow": "Complementa tu experiencia",
            "title": "También te puede interesar",
            "products": [
                {
                    "id": "producto-relacionado-1",
                    "name": "Producto Relacionado 1",
                    "slug": "producto-relacionado-1",
                    "desc": "Descripción corta para la card.",
                    "price": 100,
                    "price_label": "$100 MXN",
                    "image": "producto-relacionado-1.webp",
                    "link_type": "button"
                }
            ]
        },
        "cta": {
            "title": "¿Tienes dudas sobre este producto?",
            "subtitle": "Escríbenos por WhatsApp y te asesoramos personalmente con gusto."
        },
        "wa_text": "Hola%20Casa%20Tapputi%2C%20me%20interesa%20Mi%20Producto%20Nuevo",
        "schema_name": "Mi Producto Nuevo",
        "schema_description": "Descripción corta para Schema.org.",
        "schema_image": "mi-producto.webp",
        "schema_price": 150
    }

    # Crear directorio datos/
    datos_dir = REPO_ROOT / "datos"
    datos_dir.mkdir(parents=True, exist_ok=True)

    out_path = datos_dir / "producto-ejemplo.json"
    out_path.write_text(json.dumps(template, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"📝 Template creado: {out_path}")
    print(f"   Edítalo y luego corre:")
    print(f"   python3 scripts/generate-product.py datos/producto-ejemplo.json")


# ─── Main ─────────────────────────────────────────────────────────
if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] == "--template":
        create_template()
        sys.exit(0)

    json_path = Path(sys.argv[1])
    if not json_path.is_absolute():
        json_path = REPO_ROOT / json_path

    if not json_path.exists():
        print(f"❌ Archivo no encontrado: {json_path}")
        sys.exit(1)

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Validaciones mínimas
    required = ["slug", "title", "meta_description", "hero_image", "product_image",
                "prod_eyebrow", "prod_title", "prod_subtitle", "eyebrow", "h1", "subtitle_short"]
    missing = [k for k in required if k not in data]
    if missing:
        print(f"❌ Faltan campos requeridos en el JSON: {missing}")
        sys.exit(1)

    if "description" not in data or not data["description"]:
        print("❌ El campo 'description' debe tener al menos un párrafo.")
        sys.exit(1)

    if "variants" not in data or not data["variants"]:
        print("❌ El campo 'variants' debe tener al menos una presentación.")
        sys.exit(1)

    generate_product(data)
    print("\n🎉 ¡Listo! La página ya está generada. Solo falta hacer commit y push para publicar.")
