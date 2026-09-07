#!/usr/bin/env python3
import json
from pathlib import Path
from xml.sax.saxutils import escape

BASE = Path(__file__).resolve().parent.parent
DATOS_DIR = BASE / "datos"

def build_merchant_feed():
    items_xml = []
    for p in sorted(DATOS_DIR.glob("*.json")):
        if p.name == "producto-ejemplo.json":
            continue
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
            slug = data.get("slug", p.stem)
            # Omitir productos sin página publicada (el link del feed daría 404)
            if not (BASE / "productos" / slug / "index.html").exists():
                print(f"Omitido {slug}: no existe productos/{slug}/index.html")
                continue
            title = data.get("title", slug.replace("-", " ").title())
            desc = data.get("meta_description") or (data.get("description", [""])[0] if isinstance(data.get("description"), list) else str(data.get("description", "")))
            price = data.get("schema_price") or 100
            if "variants" in data and len(data["variants"]) > 0:
                price = data["variants"][0].get("price", price)
            img = data.get("og_image") or f"https://casatapputi.com.mx/assets/images/{data.get('product_image', 'casa-tapputi-logo.webp')}"
            link = f"https://casatapputi.com.mx/productos/{slug}/"

            item_str = (
                "    <item>\n"
                f"      <g:id>{escape(slug)}</g:id>\n"
                f"      <title>{escape(title)}</title>\n"
                f"      <description>{escape(desc)}</description>\n"
                f"      <link>{escape(link)}</link>\n"
                f"      <g:image_link>{escape(img)}</g:image_link>\n"
                "      <g:brand>Casa Tapputi</g:brand>\n"
                "      <g:condition>new</g:condition>\n"
                "      <g:availability>in_stock</g:availability>\n"
                f"      <g:price>{price} MXN</g:price>\n"
                "      <g:google_product_category>Health &amp; Beauty &gt; Personal Care</g:google_product_category>\n"
                "    </item>"
            )
            items_xml.append(item_str)
        except Exception as e:
            print(f"Error procesando {p.name}: {e}")

    xml_body = "\n".join(items_xml)
    feed_str = f"""<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n  <channel>\n    <title>Casa Tapputi — Herbolaria y Perfumería Botánica</title>\n    <link>https://casatapputi.com.mx</link>\n    <description>Catálogo de productos artesanales, pomadas herbales, esencias naturales y calzado artesanal.</description>\n{xml_body}\n  </channel>\n</rss>\n"""
    out_file = BASE / "feed-google-merchant.xml"
    out_file.write_text(feed_str, encoding="utf-8")
    print(f"✅ Feed Google Merchant generado en {out_file} ({len(items_xml)} productos)")

if __name__ == "__main__":
    build_merchant_feed()