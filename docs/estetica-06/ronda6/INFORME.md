# Estética 06 — cierre de ronda 6

> Informe de la entrega local original. La integración y subida autorizadas posteriormente, con las 12 correcciones, se documentan en `CIERRE-CLAUDE.md`.

Rama: `diseno/estetica-06`. Base revisada: commits `1f2d7c3` y `4453852`.
Trabajo local, sin push, PR, publicación ni modificación de `main`.

## Los seis puntos de INSTRUCCIONES-RONDA-6.md

1. **Inicio / héroe.** Se completó la composición fotográfica de ancho completo iniciada en los commits previos. Una regla heredada colocaba la imagen en una segunda columna inexistente y le daba ancho cero en escritorio; ahora comparte explícitamente la celda del texto. Libro visible, sin filtros de desenfoque; texto marfil sobre velo cálido.
2. **Contenido inmediato.** Se conservaron las correcciones de visibilidad progresiva previas y se verificaron títulos, tarjetas y formulario sin desplazamiento ni activación manual de `.visible`. Las imágenes estáticas de las páginas revisadas se cargan de inmediato; las del inicio se decodifican sin depender del desplazamiento. Comprobación adicional de inicio y talleres sin JavaScript y con movimiento reducido.
3. **Servicios / Tu marca.** Se fijó explícitamente `top: auto` para que la rama decorativa permanezca en el margen inferior, fuera del panel y del encabezado. En celular sigue desactivada. El panel tiene margen interior uniforme.
4. **Productos.** Se conservó la fotografía real `esencias-amber.webp` seleccionada en el avance. Se limitó el encuadre con `contain`: foto completa, sin recorte ni ampliación superior a 1.3× en los anchos comprobados. Las tarjetas del catálogo tienen un respaldo fotográfico CSS con sus mismas imágenes locales para pintarse aunque su etiqueta conserve el lazy-loading del JS comercial.
5. **Roll-on y fichas.** Se conservó la foto auténtica `roll-on.webp`, con encuadre completo también en el héroe. Lo mismo se aplicó a talabartería y al héroe de servicios. Se corrigió el contraste del subtítulo, caja de precio y variantes; se ampliaron los márgenes interiores de las fichas y tarjetas relacionadas.
6. **Inicio / productos y Valores.** El respaldo HTML del carrusel iniciado anteriormente ya muestra fotos y nombres de inmediato; se normalizaron tamaño, visibilidad, encuadre y espacio para el texto. Las vitrinas separan fotografía completa y texto, y los Valores conservan fondo verde y texto claro. Se aclararon los enlaces e índices de las vitrinas.

## Sistema visual y espacio interior

Se mantuvo el lenguaje de la maqueta: bosque, nogal, marfil, latón, ondas y sombras. Se aplicó un mínimo uniforme de **32 px en escritorio y 24 px hasta 900 px** a las tarjetas, paneles de texto, formularios, precios y cuerpos de vitrinas. Los controles compactos (botones, etiquetas y campos) conservan sus dimensiones de control; el margen se mide en el panel que los contiene.

`verificacion.json`: 18 vistas, sin desbordamiento horizontal, sin contenido transparente y sin incumplimientos de esos márgenes en las clases de panel comprobadas.

## Método y evidencia

Servidor utilizado desde la raíz: `python3 -m http.server 8000`.
Chrome/Chromium headless mediante Playwright, con viewport de 1440 × 1000 y 390 × 1000. Capturas de página completa de las nueve rutas solicitadas, sin desplazar la página ni forzar clases de entrada.

- **Iteración 1:** estado heredado; detectados héroe sin imagen, márgenes insuficientes y fotos inferiores vacías.
- **Iteración 2:** márgenes y carga de imágenes; comparación reveló la columna heredada del héroe y vitrinas todavía demasiado oscuras.
- **Iteración 3:** imagen del héroe en su celda y vitrinas con imagen/texto separados; cierre de contrastes y encuadres completos tras la comparación.
- **Finales:** recaptura del código definitivo. En `finales/` están las 18 PNG, dos láminas de comparación y las mediciones. Los disparos definitivos quedaron entre 321 y 1496 ms tras load. El disparo de cada captura se registra en `captureAfterLoadMs`, tras 800 ms desde el evento load (150 ms para el catálogo móvil) y siempre antes de 2 s. `ms` incluye navegación y escritura de la imagen y no representa la espera tras load. El catálogo móvil supera los 22 000 px: la captura completa de Chromium dejaba blanco a partir del límite de su superficie; se capturó por dos tramos vía CDP y se unieron sin redimensionar. `tileStarts` registra el disparo de ambos tramos, también antes de 2 s; ambos usan JPEG de calidad 95 y la composición se guarda como PNG.

Cada carpeta de iteración conserva comparaciones lado a lado con la maqueta y mediciones. Los PNG intermedios se mantienen como archivos de trabajo, fuera del commit; las 18 PNG definitivas sí se incluyen.

En las mediciones, `broken` heredó un nombre demasiado amplio: incluye imágenes diferidas que aún no han hecho su petición, no necesariamente errores HTTP. Las fotos del catálogo se pintan mediante el respaldo CSS aunque esas etiquetas sigan diferidas. No se modificó su JavaScript para cambiar ese comportamiento.

Scripts incluidos para reproducir: `capturas.cjs`, `comparar.py`, `verificar.cjs`, `contraste.cjs`; requieren Node, Playwright, Chromium, Pillow y axe-core. Ejecutar desde la raíz del repo. La prueba de contraste usa axe-core instalado temporalmente en `work/node_modules`.

## Verificación de reglas

- Comparación mediante analizador HTML contra la base: textos, enlaces y bloques de scripts idénticos; los cambios HTML se limitan a atributos de carga y decodificación de imágenes.
- Ningún archivo JavaScript de tienda modificado. Sin cambios en carrito, WhatsApp, fechas, horarios o precios.
- Ninguna imagen nueva de logotipo, producto, envase o QR. Sin WebGL ni vídeo añadido.
- Fotografías de producto completas en las tarjetas, fichas y héroes revisados.
- axe-core, regla `color-contrast`, sobre las 18 vistas: **cero infracciones automáticas** después de corregir los tres avisos de enlace/variantes. Las zonas sobre imágenes requieren revisión visual y aparecen como comprobaciones incompletas de axe; no se presentan como certificación automática. Se revisaron en las capturas.
- `git diff --check` correcto. Se incluyen resultados de visibilidad sin JS en `sin-js.json`.

No se probaron pagos ni se enviaron mensajes. No hubo despliegue.
