# Correcciones de Claude para Codex — revisión 2026-11-12

**Commit revisado:** beffc2e (rama diseno/estetica-06; último diseño: 4453852). Es la primera revisión de Claude con capturas (carpeta `revision-claude/`, *_d = 1440 px, *_m = 390 px). Codex no ha subido commits propios nuevos.
**Texto/precios/enlaces:** `git diff main...rama` solo muestra cambios de estructura (blog con héroe, clases e06, saltos de línea del pie). No vi textos, precios, fechas ni enlaces cambiados. **Hecho:** sin desbordes horizontales a 390 px en las 9 páginas. **No inventó** logotipo ni QR (el QR de la foto de Performance con Fuego es de la foto original).

## Veredicto por página
| Página | Veredicto |
|---|---|
| /servicios/ | **Casi bien.** Héroe, onda de latón, tarjetas verdes con repisa de nogal y marfil se parecen a la maqueta. Faltan detalles (1, 2, 3). |
| / (inicio) | **Falta.** Huecos vacíos grandes y texto poco legible en tarjetas (4, 5). |
| /productos/ | **Falta.** Imágenes en blanco hasta hacer scroll; subtítulo del héroe con poco contraste (6, 7). |
| /talleres/ | **Falta.** Título pegado al subtítulo; texto gris claro; fecha 5 DIC y tarjetas con repisa que corta el borde (8, 9). |
| /productos/roll-on/, /talabarteria/ | **Falta poco.** Caja de precio con 26 px de margen (10). |
| /eventos/ | **Falta.** Tarjetas con 16 px de margen (11). |
| /nosotros/, /blog/ | **Bien** a simple vista (no se midieron más detalles). |

## Correcciones numeradas
1. **/servicios/ — tarjetas `.servicio-card`:** margen interior medido 28 px en escritorio; debe ser **≥32 px** (24 px en celular, ya cumple).
2. **/servicios/ — texto en tarjetas verdes:** el párrafo es pequeño y gris verdoso; subir a ~16 px y color marfil claro (contraste ≥4.5:1). Como la maqueta (texto claro y legible).
3. **/servicios/ — títulos de sección («Formación con Fundación EBAC», «Esquema de proveedores»):** la línea del título se encima/pega con el subtítulo (se ve una raya cruzando el texto). Dar ≥16 px de separación y quitar la raya sobre el texto. Además, «PRODUCTOS DISPONIBLES PARA MARCA PRIVADA:» queda sin lista debajo (hueco): mostrar la lista que ya existe en el HTML o ajustar el espacio, sin cambiar textos.
4. **/ (inicio) — huecos vacíos:** bajo «Una forma más profunda de cuidar la piel» (~150 px de crema vacío) y bajo «Del jardín medicinal…» (~300 px vacío). Quitar el espacio o asegurar que el contenido aparezca sin esperar scroll/animación.
5. **/ (inicio) — tarjetas «Descansar / Cuidar / Despertar»:** texto pequeño claro sobre foto oscura con lavanda; añadir degradado oscuro bajo el texto y subir tamaño a ≥14 px; «EXPLORAR FÓRMULAS» casi no se lee. Margen interior ≥32 px (medí 0 en `.ritual-card` y `.exp-card`: confirmar que el relleno está en el elemento interior).
6. **/productos/ — fotos de producto:** al cargar la página, ~9 tarjetas muestran recuadro vacío (carga diferida). Mostrar la foto completa (sin recorte) con `object-fit: contain` y un fondo de carga; no debe verse hueco al hacer scroll.
7. **/productos/ — héroe:** el subtítulo («Elaborados artesanalmente…») queda sobre zona clara de la foto; añadir velo oscuro para contraste AA. Igual en /talleres/ (subtítulo y breadcrumb).
8. **/talleres/ — encabezado «Próximos talleres de herbolaria»:** título pegado al párrafo; separar ≥16 px. Párrafos en gris claro sobre marfil: oscurecer a contraste ≥4.5:1 (también las descripciones de tarjetas).
9. **/talleres/ — tarjetas:** la repisa de nogal queda como una tira debajo y corta el borde de la tarjeta; hacerla ancha y detrás, como en la maqueta, sin tapar botones. Revisar que haya solo 4 tarjetas vigentes sin cambiar fechas.
10. **/productos/roll-on/ y /talabarteria/ — `.prod-price-box`:** margen 26 px → **≥32 px**.
11. **/eventos/ — `.servicio-card`:** margen 16 px → **≥32 px** escritorio / ≥24 px celular.
12. **Todas las páginas — cuidado con** el botón verde de WhatsApp flotante: en celular tapa parte de la foto/tarjeta (servicios); reducir o moverlo para no cubrir texto.

Nota: las capturas son de página completa; el recorte a 2600 px de alto deja fuera pies de página. Pendiente revisar con scroll real en la próxima ronda.
