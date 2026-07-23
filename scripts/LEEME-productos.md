# 🛍️ Cómo agregar un producto nuevo al catálogo

> **Para:** Erandi y Franco  
> **Actualizado:** Julio 2026 · **Última prueba:** 22 julio 2026 ✅  
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

## ✅ Prueba verificada — 22 julio 2026

El script fue probado con un producto real (**Aceite de Masaje Herbal**, 3 tamaños con selector de precio) y revisado visualmente en celular (iPhone SE, 375px). Resultado: **9 de 9 checks aprobados.**

| Verificación | Resultado |
|---|---|
| 🖼️ Hero con imagen, breadcrumb, título | ✅ |
| 📝 Descripción y párrafos legibles | ✅ |
| 🔘 Selector de precio (60ml→$180, 120ml→$320, 250ml→$580) | ✅ |
| 🛒 Botón carrito + stepper de cantidad (+/−) | ✅ |
| 📋 3 formas de uso numeradas | ✅ |
| 🌿 3 beneficios con íconos | ✅ |
| 🃏 4 productos relacionados con imágenes | ✅ |
| 📱 Sin desbordes horizontales, espaciado profesional | ✅ |
| 👣 Footer + botón WhatsApp flotante | ✅ |

---

## ❓ Preguntas frecuentes

### ¿Cómo obtengo el `variant_id`?

El `variant_id` lo necesitas para que el botón de "Agregar al carrito" funcione con MercadoPago. Lo obtienes del panel de **Medusa**:

1. Entra al panel de administración de Medusa (la URL la tiene Franco)
2. Ve a **Products** → busca tu producto (o créalo si es nuevo)
3. Dentro del producto, ve a la pestaña **Variants**
4. Cada variante tiene un ID que empieza con `variant_`. Cópialo y pégalo en el JSON.

> ⚠️ **Si el producto NO existe en Medusa**, necesitas crearlo primero en el panel antes de generar la página. Pídele ayuda a Franco para esta parte.

### ¿Qué hago si no tengo imagen del producto?

Tienes tres opciones:

| Opción | Cuándo usarla |
|---|---|
| **Usar una imagen genérica** | Si el producto es nuevo y aún no tienes foto. Usa `casa-tapputi-logo.webp` como placeholder temporal. |
| **Usar imagen de un producto similar** | Si es de la misma familia (ej. otra esencia, otra pomada). Revisa qué hay en `assets/images/`. |
| **Convertir una foto que ya tengas** | Si tienes un JPG o PNG en tu compu, conviértelo a WebP y súbelo (ver abajo). |

Para convertir una imagen a WebP:
```bash
# Si tienes ImageMagick instalado:
convert mi-foto.jpg assets/images/mi-producto.webp

# O con cwebp (más ligero):
cwebp -q 80 mi-foto.jpg -o assets/images/mi-producto.webp
```

> 💡 **Tip:** Las imágenes no necesitan ser perfectas. Con que se vea el producto claramente es suficiente. Erandi puede mandarle la foto a Franco por WhatsApp y él la convierte.

### ¿Qué pasa si me equivoqué en algo?

Tranquila. Solo corrige el JSON y vuelve a correr el script:
```bash
python3 scripts/generate-product.py datos/tu-producto.json
```
El script **sobrescribe** la página anterior con los nuevos datos. Luego haces commit y push otra vez.

### ¿Puedo borrar un producto?

Sí. Elimina la carpeta y el JSON:
```bash
rm -rf productos/mi-producto datos/mi-producto.json
git add -A && git commit -m "eliminar: Mi Producto" && git push
```

### ¿Necesito actualizar el catálogo manualmente?

**No.** El catálogo (`productos/index.html`) se carga automáticamente desde Medusa. Solo necesitas:
1. Crear el producto en Medusa (panel de admin)
2. Generar la página de detalle con este script

### El script dice "module not found" o "python3 no encontrado"

Pídele a Franco que revise. Es probable que necesite instalar Python 3:
```bash
sudo apt install python3
```

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
