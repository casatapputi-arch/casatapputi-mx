# Integración de la revisión de Claude — 12 de noviembre de 2026

Se trajeron primero los commits remotos `a705602` y `26fa602` de `diseno/estetica-06`. La entrega que había quedado local se rebasó encima de ellos, sin conflictos; su hash pasó de `80acd29` a `229389f`. Esta revisión completa el trabajo antes de subir ambos commits a la misma rama. No se modificó `main` ni se solicitó despliegue.

Se leyeron `CORRECCIONES-CLAUDE.md`, sus 18 capturas y la maqueta. La revisión de Claude era sobre `beffc2e`; por eso varios pendientes ya estaban resueltos en la entrega local, pero se volvieron a medir.

| Nº | Resultado |
|---|---|
| 1 | Tarjetas de servicios comprobadas con 32 px en escritorio y 24 px en celular; corrección ya incluida en la entrega local. |
| 2 | Párrafos de servicios en 16 px, interlineado 1.65 y marfil claro explícito. |
| 3 | Lista original de seis productos visible. Separación de títulos y párrafos de al menos 24 px; eliminado el filete de los encabezados afectados. La captura temprana reveló que las animaciones todavía desplazaban algunos títulos: se anularon sus transformaciones y transiciones. |
| 4 | Foto del origen visible desde la carga. Reducción del espacio superior e inferior del manifiesto y de la sección de origen a 64–88 px. |
| 5 | Vitrinas con degradado oscuro bajo texto, párrafos de 16 px y enlaces/índices de 14 px. Margen interior de 32/24 px medido en `.ritual-card-content` y `.exp-body`. |
| 6 | Fotos completas del catálogo con `contain` y fondo fotográfico local, sin depender de desplazar la página; se conserva la solución local sin alterar JS comercial. |
| 7 | Velo oscuro reforzado en Productos y Talleres; breadcrumb opaco verde con texto claro. |
| 8 | Encabezados de talleres separados del párrafo 24 px; texto descriptivo y fechas oscuros sobre marfil. |
| 9 | Repisa más ancha que la tarjeta, situada detrás y bajo el margen inferior, sin cubrir acciones. Se comprobaron exactamente cuatro talleres visibles: 14/21/28 de noviembre y 5 de diciembre. No se cambiaron fechas ni el filtro existente. |
| 10 | Cajas de precio de roll-on y talabartería con 32/24 px, ya incluidas en la entrega local. |
| 11 | Tarjetas de eventos con 32/24 px, ya incluidas en la entrega local. |
| 12 | En celular, el acceso a WhatsApp pasa al flujo normal después del pie: nunca se superpone a fotografías ni texto, tampoco al deslizar. Conserva enlace, icono y etiqueta accesible. En escritorio mantiene su posición flotante. |

## Evidencia y comprobaciones

- Servidor: `python3 -m http.server 8000`; Chromium headless con Playwright.
- Tres ciclos nuevos sobre las nueve rutas, a 1440 y 390 px: `revision-claude-antes/`, `revision-claude-ajustes/` y `revision-claude-finales/`. Los dos primeros conservan láminas comparativas con la maqueta y mediciones; los PNG intermedios quedan en `work/`.
- `revision-claude-finales/`: 18 PNG de página completa, dos comparaciones, mediciones y dos capturas adicionales con scroll real en Servicios y Talleres móvil.
- Capturas finales disparadas entre **228 y 1023 ms** después de load, sin esperar la entrada de elementos. El catálogo móvil se captura por tramos CDP, antes de dos segundos, para evitar el límite de superficie de Chromium; la composición conserva el tamaño original. Metodología en `capturas.cjs` y el informe original.
- `validacion-claude.json`: 18 vistas sin desbordes ni contenido transparente; márgenes, separación, tipografía, lista y cantidad de talleres correctos. Script: `validar-claude.cjs`.
- `contraste-claude.json`: cero infracciones automáticas de `color-contrast` en las 18 vistas. Las zonas sobre fotografías se revisaron visualmente; axe las deja como incompletas, no como certificadas automáticamente.
- Solo se modificó CSS del sitio en esta revisión. Los textos, precios, fechas, horarios, enlaces, carrito, WhatsApp y JS de tienda siguen intactos. No se añadieron imágenes de producto, logotipos o QR.
- `git diff --check` correcto. No se ejecutaron pagos, mensajes ni workflows de despliegue. El workflow de purga por push está limitado a `main`.
