# Integración Frontend ↔ Medusa — Casa Tapputi

> Cómo el sitio estático consume el backend Medusa. Para agentes/dev que continúan por `pull`.
> Backend documentado en el repo `casatapputi-medusa` → `docs/RUNBOOK.md`.
> Última actualización: 2026-07-15.

## Arquitectura
Sitio **estático** (HTML/CSS/JS puro, sin build) que consume la **Store API de Medusa** por fetch.
- Backend: `https://casatapputi-medusa.duckdns.org`
- Publishable API key (pública, va en el front): `pk_377afadbf71f64f6027bdb8b13691017648b70f6270ff38e4d9d3961585d2c62`

## Scripts (`assets/js/`)
| Archivo | Rol |
|---|---|
| **`catalog.js`** | Sincroniza el catálogo: `GET /store/products` → renderiza grilla (`productos/`) y carrusel (`index.html`). Cache en `sessionStorage` 15 min. |
| **`cart.js`** | Carrito con Store API real de Medusa (crea cart, agrega line items por `variant_id`) + checkout por WhatsApp. |
| **`checkout.js`** | Checkout con **MercadoPago**: `POST /store/carts/{id}/payment-sessions` con `provider_id: 'mercadopago'`, toma `init_point` y redirige. **Depende de que el backend tenga el provider activo** (ver RUNBOOK §6). |
| **`main.js`** | UI general del sitio. |

## `PRODUCT_META` — el punto de mantenimiento manual
La Store API **no expone precios ni categorías** en el endpoint de productos. `catalog.js` los complementa con el objeto `PRODUCT_META` (mapa `handle → {cat, price, priceLabel, img, desc}`).
- **Al agregar/renombrar un producto en Medusa hay que actualizar `PRODUCT_META`** con su handle, o saldrá sin precio/categoría (cae a "Consultar precio" / categoría "todos").
- Los handles deben coincidir con los de Medusa (`esencia-miel`, `jabones`, `tisanas`, …).

## Flujo de edición
| Cambio en Medusa Dashboard | Reflejo en la web |
|---|---|
| Título, descripción, foto, variantes | ✅ Automático (máx. 15 min por el cache) |
| Producto nuevo / eliminado | ✅ Automático en grilla y carrusel |
| Precio | ⚠️ Display usa `PRODUCT_META` (manual). El carrito usa el precio real de Medusa ✅ |
| Categoría | ⚠️ Manual — editar `PRODUCT_META` |

## Estado de pagos (2026-07-15)
- **WhatsApp**: activo (checkout principal hoy). Se mantiene para pedidos personalizados / "a consultar".
- **MercadoPago**: `checkout.js` listo en el front, **pendiente** que el backend active el provider `mercadopago` (en curso). Cuando `/store/payment-providers` liste `mercadopago`, el botón funcionará.
- **Stripe + OXXO**: pendiente en backend; aún sin botón en el front.

## ⚠️ Despliegue — IMPORTANTE
Hoy el sitio se publica por **`rsync` directo a `/var/www/casatapputi` en el VPS** (Caddy lo sirve). Ese flujo **se salta git**, por eso el repo llegó a estar atrás de producción.
- **Regla:** todo cambio debe commitearse y pushearse a `main` ANTES (o junto con) el `rsync`, para que el repo sea la fuente de verdad y los agentes puedan continuar por `pull`.
- Deploy: `rsync -avz --exclude node_modules --exclude .git ./ ubuntu@10.10.10.1:/var/www/casatapputi/` (acceso por canal seguro; ver RUNBOOK del backend §1).
