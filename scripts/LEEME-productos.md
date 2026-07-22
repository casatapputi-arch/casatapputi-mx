# 🛍️ Cómo agregar un producto nuevo al catálogo

> **Para:** Erandi y Franco  
> **Actualizado:** Julio 2026  
> **Tiempo estimado:** 5-10 minutos por producto

---

## Paso a paso

### 1️⃣ Crea el archivo de datos del producto

Copia el template de ejemplo y renómbralo con el nombre de tu producto:

```bash
cp datos/producto-ejemplo.json datos/tu-producto.json
```

También puedes empezar desde cero copiando un JSON de otro producto.

### 2️⃣ Edita el JSON con los datos de tu producto

Abre el archivo en cualquier editor de texto y llena los campos. Los más importantes:

| Campo | Qué poner |
|---|---|
| `slug` | Nombre corto para la URL: `balsamo-lavanda` → `casatapputi.com.mx/productos/balsamo-lavanda/` |
| `title` | Nombre del producto: "Bálsamo de Lavanda" |
| `meta_description` | Descripción para Google (~150 caracteres) |
| `hero_image` | Imagen de fondo del hero: `balsamo-lavanda.webp` |
| `product_image` | Imagen principal del producto |
| `prod_eyebrow` | Categoría en el hero: "Cuidado Corporal" |
| `prod_subtitle` | Frase corta debajo del título |
| `description` | 2 párrafos describiendo el producto |
| `variants` | Presentaciones y precios (ver abajo) |
| `howto` | 3 formas de uso con título y descripción |
| `benefits` | 3 beneficios con ícono, título y descripción |
| `related` | 4 productos relacionados (cards al final) |

### 3️⃣ Sube la imagen del producto (si es nueva)

Pon la imagen en `assets/images/` con extensión `.webp`:

```bash
# Si tienes la imagen en tu computadora:
cp ~/Descargas/mi-producto.webp assets/images/
```

### 4️⃣ Genera la página

```bash
cd /home/enrique/casatapputi-mx
python3 scripts/generate-product.py datos/tu-producto.json
```

Verás:
```
✅ Producto generado: /home/enrique/casatapputi-mx/productos/balsamo-lavanda/index.html
   URL: https://casatapputi.com.mx/productos/balsamo-lavanda/
```

### 5️⃣ Publica (git commit + push)

```bash
git add -A
git commit -m "nuevo: Bálsamo de Lavanda"
git push
```

En ~30 segundos el producto estará vivo en el sitio.

---

## 📝 Tipos de variantes

### Variante única (la más común)

El producto tiene una sola presentación. Ejemplo:

```json
"variant_type": "single",
"variants": [
  {
    "label": "15 gr",
    "price": 120,
    "price_label": "$120 MXN",
    "variant_id": "variant_01XXXXXXXXXXXXX"
  }
]
```

### Variantes múltiples con selector de precio

El cliente puede elegir entre varias presentaciones y el precio cambia automáticamente:

```json
"variant_type": "radio",
"variants": [
  {
    "label": "4 ml",
    "price": 400,
    "price_label": "$400 MXN",
    "variant_id": "variant_01KXKRE3SV6FA8G7ACK4KQS4ZJ"
  },
  {
    "label": "8 ml",
    "price": 800,
    "price_label": "$800 MXN",
    "variant_id": "variant_01KXKRE3SWH1NJXA2Z1K8RR4ZD"
  },
  {
    "label": "15 ml",
    "price": 1500,
    "price_label": "$1,500 MXN",
    "variant_id": "variant_01KXKRE3SWGNW7T8SGJ54RBBVW"
  }
]
```

---

## ⚠️ Notas importantes

1. **El `variant_id` debe ser real.** Lo obtienes del panel de Medusa (Products → tu producto → Variants → copiar ID). Sin esto, el carrito no funciona.

2. **Las imágenes deben estar en WebP.** Si tienes JPG o PNG, conviértelas primero:
   ```bash
   convert imagen.jpg assets/images/imagen.webp
   ```

3. **El catálogo (`productos/index.html`) se actualiza solo** — se carga desde Medusa automáticamente. No necesitas editar el listado de productos.

4. **Si algo falla**, revisa que el JSON esté bien formado. Puedes validarlo con:
   ```bash
   python3 -c "import json; json.load(open('datos/tu-producto.json'))" && echo "✅ JSON válido"
   ```

---

## 🧪 Probar antes de publicar

Para ver la página generada sin hacer push:

```bash
python3 -m http.server 8000 -d .
```

Luego abre `http://localhost:8000/productos/tu-producto/` en tu navegador.

---

## 📂 Estructura de archivos

```
casatapputi-mx/
├── datos/                          ← JSONs de productos (editables)
│   ├── producto-ejemplo.json       ← template para copiar
│   ├── balsamo-lavanda.json        ← ejemplo real
│   └── ...
├── scripts/
│   └── generate-product.py         ← el generador (no tocar)
├── assets/images/                  ← imágenes .webp
└── productos/
    ├── balsamo-lavanda/
    │   └── index.html              ← GENERADO, no editar a mano
    └── ...
```
