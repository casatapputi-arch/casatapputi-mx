# CASA TAPPUTI — ORDEN DE MISIÓN EJECUTABLE PARA CODEX Y CLAUDE CODE
**Corte:** 2026-11-02 · **Repositorio de implementación:** `casatapputi-arch/casatapputi-mx` · **Estado:** instrucciones de trabajo, no ejecución ni despliegue.

> **Primera orden:** dejar de confundir «hicimos publicaciones / creamos bot / tenemos web / tenemos repositorio» con **ventas pagadas y confirmadas**. La dirección reporta que no se han vendido cursos; verificar el dato antes de convertirlo en métrica. **Objetivo prioritario: lograr que una persona interesada encuentre un taller vigente, comprenda el valor, pregunte o reserve, pague por un medio válido, reciba confirmación, y que el negocio pueda medirlo.**
>
> **Agentes:** **Codex** (ingeniería y pruebas), **Claude Code** (experiencia comercial, estrategia editorial y conversiones), **ChatGPT** (consolidación y auditoría de entregas), **Dirección de Casa Tapputi** (ventas reales, identidad y autorización). **Claude no se llama «Claudia»**. Estos agentes no se despiertan por un push; requieren sesión/flujo habilitado y acceso a cada repo.

## 0. Lectura obligatoria y orden de evidencia

> **ACTUALIZACIÓN 2026-11-02 (tarde) — prevalece sobre lo de abajo:**
> - **Mercado Pago está suspendido** por decisión de la dirección (31-oct): los talleres se **apartan por WhatsApp** desde la página. No hacer pruebas de pago ni sandbox; `VENTA-02`/`PAGO-P0` quedan en espera.
> - La **auditoría COLMENA ya se ejecutó** el 31-oct (informes técnico y comercial en el cerebro privado `Claude-Wiki/casa-tapputi/colmena/`). Partir de ahí, no repetirla.
> - Verificado en código: la mezcla «Apartar por WhatsApp» / «Obtener boletos» **no ocurre en talleres** («Obtener boletos» solo está en `eventos/florecer-5/`).
> - Fricción real pendiente: `talleres/index.html` declara en HTML y JSON-LD 13 talleres (9 ya pasados) como disponibles; el JS los oculta, pero buscadores los leen.
> - Siguiente frente propuesto: vender el taller del **14-nov** por WhatsApp. Coordinación en `Claude-Wiki/casa-tapputi/operaciones/RESPUESTA-CLAUDE-AL-PLAN-MAESTRO-2026-11-02.md`.


1. **Este documento** — contrato ejecutivo de trabajo desde el 2 de noviembre.
2. `docs/COLMENA-PLAN-CODEX-CLAUDE-VENTA-TALLERES-2026-10-31.md` — especificación de auditoría del embudo y roles. Se mantiene vigente en lo compatible.
3. **Cerebro privado** (si tienes permiso): `casatapputi-arch/Claude-Wiki/casa-tapputi/operaciones/RELEVO-INTEGRAL-REDES-META-VENTAS-2026-11-02.md` — cronología de Meta, Facebook, Instagram, WhatsApp, diseño y evidencias. **No copiar a este repo público información interna sin revisar clasificación.**
4. **Bot privado:** `casatapputi-arch/casatapputi-respuestas/docs/BRIEFING-WHATSAPP-IMPLEMENTACION.md`, `docs/PRUEBA-REAL-WHATSAPP-8149.md`, `CAMBIOS-BOT.md`.
5. Código y servicios reales, CI, estado de despliegue y datos anónimos. Si un documento histórico contradice evidencia actual, **registrar discrepancia** y preferir una prueba verificable.

**Etiquetas de certeza en cualquier hallazgo:** `CONFIRMADO_EN_CODIGO`, `CONFIRMADO_EN_PRODUCCION`, `REPORTADO_POR_DIRECCION`, `REPORTADO_POR_TERCERO`, `HIPOTESIS`, `SIN_DATOS`, `PENDIENTE_AUTORIZACION`. Fecha y fuente obligatorias.

## 1. Alcance del negocio, identidad y control

- Marca **Casa Tapputi** (doble p), perfumería/herbolaria botánica premium y talleres/experiencias en Huerto Roma Verde, CDMX. Sede comunicada: Jalapa 234, Roma Sur. Antes de una publicación, confirmar dirección, disponibilidad y horario específico.
- Dirección de arte: solo logotipo/símbolo y tipografía **oficiales**; fotografía real de producto; envases fieles; imagen sobria, minimalista y editorial. Preferencias visuales recientes: madera muy oscura o escenarios gris/frío, latón envejecido, poca saturación, sin luz solar ficticia ni plantas inventadas. No reutilizar imágenes rechazadas ni inventar claims de salud.
- El módulo de manual visual **M00 está en revisión**; **M01–M09 no aprobados**. Consultar `casa-tapputi/identidad-visual/` del cerebro privado y originales del logo; no presentar borradores como guía definitiva.
- La dirección gestiona **manualmente WhatsApp Business terminado en 7034** y es fuente de verdad sobre conversaciones y ventas cobradas. El WhatsApp personal terminado en **8149** es destinatario autorizado de prueba/briefing, no el número de negocio a migrar. **No publicar números completos**.
- Productos: esencias/perfumes, aceites de masaje, jabones herbales, roll-on, sprays, pomadas; experiencias: talleres presenciales y activaciones. No prometer inventario, resultados clínicos ni precio sin fuente autorizada.

## 2. Situación observable al corte: ni más ni menos

### Redes y conectores
- **Metricool**: cuenta de marca `casatapputi` identificada, Instagram `@casatapputi` conectado, zona `America/Mexico_City`. **Consulta real del 2/11 para 1–30 de noviembre: 0 publicaciones pendientes/programadas**. Esto NO significa que no haya publicaciones ya realizadas ni impide preparar borradores.
- **Windsor.ai**: se observó conector Meta Ads con una cuenta denominada `Enrique Ayala` y conector Instagram con `@casatapputi` y un perfil personal. No demuestra propiedad de portafolios de Meta ni autorización para gastar.
- **Facebook:** hay dos páginas llamadas Casa Tapputi detectadas en sesiones/documentos distintos, más de un portafolio y cuentas publicitarias; identidad de la página operativa, tienda Commerce Manager, propiedad y control total **pendientes de reconciliar**. La apelación del 19/10 quedó **sin incidencias publicitarias visibles** al 25/10; Meta AI dijo favorable, **sin expediente formal inspeccionado**. Sin movimientos de activos, nuevos portafolios o campañas.
- **X/Twitter:** no está comprobada una cuenta oficial, ni conexión activa en Metricool, ni publicaciones. **NO crear ni afirmar cobertura de X** por un anuncio comercial de funciones de la plataforma.
- **Métricas históricas** aportadas: 8/jul–7/oct, 44,598 visualizaciones, 2,251 espectadores, +100 seguidores netos, 876 interacciones. Sirven de referencia **histórica**, NO de panel actualizado, y no miden dinero cobrado.
- **Publicación del 30/10:** promoción de Plantas de Poder para 31/10 con CTA a DM; no volver a anunciar esa fecha vencida. Un plan editorial histórico incluía **9 productos + 9 experiencias** (50/50), stories frecuentes y CTAs rastreables; los calendarios históricos están en modo **PROPUESTO/SIN PROGRAMAR**, no se ejecutan sin comprobar fechas y aprobación.

### Talleres, web, cobros
- El código del bot indicaba, al 31/10, próximas fechas 14/11 (Masaje Descontracturante), 21/11 (Salud Digestiva Herbal), 28/11 (Masaje Deportivo), 5/12 (Masaje Relajante), con respuesta modelo 11:30–14:30 y $500. **No confirmar esta oferta como vigente antes de validarla con dirección.**
- El 2/11 se reportó fricción: páginas con CTA **«Apartar por WhatsApp»** aún conservan mensajes de **boletos/compras/«Obtener boletos»**. **Hay que reproducir el recorrido móvil actual** para documentar y corregir la incoherencia en rama, sin romper los pagos válidos ni prometer cupo automáticamente.
- El checkout web, el servidor `tickets`, Medusa/Mercado Pago y emisión QR tienen antecedentes históricos de pruebas. **No sustituirlos por una prueba vigente ni afirmar compra real habilitada.**
- Existe `docs/COLMENA-PLAN-CODEX-CLAUDE-VENTA-TALLERES-2026-10-31.md` en main, y issues en GitHub de auditoría. **Publicar instrucciones no ejecutó esas auditorías.**

### Bot y automatización
- `casatapputi-respuestas`: webhook y respuestas deterministas en código, calendario con expiración, transferencia a humano `ATENCION_HUMANA`, logs de simulación sin datos identificables. **Bot en DRY_RUN** hasta integración/autorización; un PR de ventas y atención humana continúa abierto.
- Existe **prueba de envío WhatsApp `hello_world`** desde emisor API de prueba autorizado a personal terminado en 8149; no hay evidencia de **entrega real**. No migrar ni desconectar el 7034. Se requieren app Meta, WABA, número remitente, permisos y tokens en almacén de secretos, aprobación destinatario, webhook y evidencia de entrega.
- Existe briefing diario de ChatGPT y un **MVP técnico de informe GitHub→WhatsApp**. La automatización de ChatGPT y el cron de GitHub **son flujos distintos**. La generación de un informe no es evidencia de envío a teléfono.

## 3. Objetivo comercial, funnel y medición

**North Star:** `inscripciones_pagadas_verificadas` y, después, `ingresos_cobrados_verificados` y `pedidos_productos_pagados`, con origen rastreable cuando exista. Nunca completar valores faltantes con cero supuesto; `sin dato` no equivale a 0.

**Funnel de talleres (mínimo):**
`impresión / alcance → perfil/landing → workshop_view → CTA (checkout_click o whatsapp_click) → consulta atendida → apartado pendiente de pago → payment_confirmed (servidor) → ticket_delivered → asistencia`.

**Funnel de productos:**
`publicación → visita producto / mensaje → pregunta respondida → producto/precio/stock confirmado → pago confirmado → pedido entregado`.

**Métricas semanales por pieza, sin información personal:** fecha, red, formato, enlace/campaign ID, producto o experiencia, alcance, vistas, guardados, compartidos, clics CTA, conversaciones atribuibles (si existe seguimiento), apartados, pagos y cancelaciones. Además fecha y titular de fuente; si no hay acceso a un indicador, anotar `sin dato`. **No medir éxito solo en likes**.

**Registro humano:** dirección conserva el control de WhatsApp; diseñar hoja/CRM con estados `nuevo → respondido → interesado → pendiente de pago → pagado → confirmado → asistió/entregado`; evitar nombres, chats, teléfonos, comprobantes, tokens o datos bancarios en GitHub. Identificadores agregados o anonimizados para reporte público.

## 4. Reparto de trabajo y entregables concretos

### CODEX — P0 ingeniería, automatización y pruebas
1. Hacer `git pull --ff-only`, revisar issues #1 y #2 de este repo. Leer código, comparar commit vigente vs web publicada, sin tocar producción.
2. Recorrer `talleres/`, `tickets/`, JS, `scripts/tickets-server.js`, backend documentado, pago y WhatsApp; localizar pasos rotos en móvil (incluida contradicción **Apartar por WhatsApp ↔ Obtener boletos**). Documentar URL/pantalla/ruta y forma de reproducir.
3. Comprobar seguridad del servidor: webhook acredita pago, manejo pending/rechazado, QR no entregado solo por retorno navegador, monto calculado por backend, sin boletos sin pago salvo autorización explícita.
4. Si hay claves sandbox autorizadas, ejecutar **solo** pago de prueba sin dinero real; si no, marcar bloqueo. Preparar tests y PR en rama `colmena/codex-auditoria-pagos`.
5. Auditar interfaces del bot con dueño del repo `casatapputi-respuestas`: qué está desplegado, URL HTTPS y health, endpoints Meta y firma, DRY_RUN, idempotencia, atención humana y logs anonimizados. No ejecutar pruebas con el 7034.
6. Definir tracking mínimo sin PII ni llamadas innecesarias de marketing. Si encuentras fallo P0, abrir issue con severidad/evidencia/test y PR separado de corrección **sin merge/despliegue**.
7. Entregar `docs/auditoria-tecnica-talleres.md`, matriz **problema → impacto en cobros → corrección → test → PR**, e informe del estado del webhook/pagos.

### CLAUDE CODE — P0 marketing, UX, embudo y contenido
1. Leer el mismo plan y revisar issues #1/#2. Recorrer web móvil como cliente y preparar `docs/auditoria-comercial-talleres.md`: vigencia de talleres, temario, materiales, precio/cupo, sede, prueba social real, CTA y mensajes.
2. Comparar **Instagram → landing → WhatsApp → apartado → pago**. Preparar CTA unívoco para el **siguiente taller validado**; no anunciar eventos vencidos ni crear promociones falsas.
3. Crear un **plan editorial de 2 semanas**, 50 % producto y 50 % experiencias. Para cada pieza: objetivo, formato, propuesta visual, copy breve, CTA verificable, enlace y medida de conversión, evidencia de stock/fecha, responsable de aprobar y estado `BORRADOR`. Preparar 1 publicación prioritaria para aprobación y variantes story/reel, **no publicar automáticamente**.
4. Incorporar resultados previos de Metricool (alcance, guardados, mejores horas) si hay acceso real al conector. Si la terminal no lo tiene, registrar `SIN ACCESO`; no fabricar estadísticas.
5. Diseñar guiones de atención humana y escalamiento: catálogo real, dudas frecuentes, fecha/cupo, retomar interés, seguimiento de pendientes y cierre de inscripción **solo cuando dirección confirme pago**. El bot ayuda a responder y enrutar; no finge cobrar ni reservar.
6. Preparar plan de FB/Instagram Shop **solo después** de verificar cuenta/propiedad y diferencias entre las dos páginas; X/Twitter queda fuera de publicación hasta confirmar existencia e integración.
7. Abrir PR desde rama `colmena/claude-auditoria-conversion` para mejoras de experiencia, contenido y landing. No desplegar, publicar, enviar DM, cambiar precios o crear anuncios unilateralmente.

### REVISIÓN CRUZADA
- Codex revisa las hipótesis de Claude Code contra código y métricas reales.
- Claude Code valida que los parches de Codex faciliten la compra y no confundan al visitante.
- ChatGPT/dirección reciben **un informe de una página** con: qué impide cobrar, qué se comprobó, qué se corrigió en PR, qué falta, cómo se medirá la primera venta y qué autorización puntual se requiere.
- Trabajar sobre **una** próxima oferta validada en lugar de producir docenas de publicaciones sin compra posible.

## 5. Inventario de integraciones y dónde pueden realmente usarse

| Sistema | Evidencia/capacidad | Pendiente real | Regla |
|---|---|---|---|
| **GitHub** | Repos `casatapputi-mx`, `casatapputi-respuestas`, `Claude-Wiki`; issues/PRs y documentos accesibles en cuenta autorizada | Sincronizar clones; verificar CI y permisos por agente | Push documental no ejecuta agentes |
| **Metricool** | Conector de ChatGPT a `@casatapputi`, lecturas de datos y calendario; nov 2026 sin publicaciones programadas al 2/11 | Acceso de terminal/credenciales de integración, planificación aprobada y métricas de conversión | No copiar ni exhibir tokens; no calendarizar sin visto bueno |
| **Windsor.ai** | Conector a Instagram y Meta Ads disponible en sesión autorizada | Conciliar propiedad portafolio y atribución; no se verificó compra | No gastar ni mutar campaña |
| **Meta Business** | Apelación de 19/10 favorable según Meta AI, sin incidencias publicitarias visibles; activos parcialmente identificados | Control total, 2FA, dos páginas homónimas, tienda, ad accounts, WABA | No crear/traspasar/borrar sin identificación |
| **WhatsApp Cloud API** | Scripts + workflows de simulación y prueba preparados en repo bot | Emisor API, app/WABA, webhook firmado, token secreto, plantilla y entrega real | Preservar 7034 y autorización del destinatario |
| **Gmail / Google Calendar / Google Drive** | Conectores de ChatGPT disponibles en sesiones autorizadas | Su disponibilidad **NO se transmite a Codex/Claude ni a GitHub**; comprobar permisos y autorización particular | Solo mínimo dato necesario; no subas correos ni archivos privados |
| **GitHub Actions** | CI, documentación de briefing y workflow manual de prueba | Revisar workflow y su estado actual; variables, plantilla, entorno, envío/entrega | Mantener modo simulación hasta pruebas |
| **X/Twitter** | No hay cuenta oficial ni conector verificados para esta marca | Confirmar si existe y hay acceso | No fingir actividad |
| **Tienda Facebook/Instagram** | Hay páginas y activos Meta; tienda funcional no corroborada | Reconcilia propietario, Commerce Manager, catálogo, checkout/Meta policy | Una página ≠ tienda |

**Regla de portabilidad:** un conector visible en este chat no se convierte en credencial de terminal, ni el «cerebro» obtiene automáticamente acceso a Meta/Metricool. Cualquier acceso requerido se documenta como permiso mínimo y se conecta mediante método aprobado y seguro. Nunca colocar secretos, 2FA, datos personales, claves API o lista de clientes en Git.

## 6. Backlog priorizado y criterios de aceptación

| ID | Prioridad | Entregable y condición de cierre | Dependencias |
|---|---|---|---|
| **VENTA-01** | P0 | Evidencia de versión web en producción y CTA de próximo taller; contradicciones resueltas en PR con screenshot móvil, sin romper pagos | Codex + Claude |
| **VENTA-02** | P0 | Ruta técnica compra → pago acreditado → QR probada en sandbox, o bloqueo documentado | Codex |
| **VENTA-03** | P0 | Oferta de taller vigente confirmada por dirección; landing y mensajes claros | Dirección + Claude |
| **META-01** | P0 | Mapa de portafolios, las 2 páginas y cuentas publicitarias con pruebas de titularidad, permisos y controles de seguridad; sin mutaciones | Acceso Meta autorizado |
| **BOT-01** | P0 | Verificar PR de bot, CI/DRY_RUN y transferencia humana; **no** reportar que está desplegado sin webhook de producción | Repo bot + Meta |
| **BOT-02** | P0 | Mensaje API de prueba al personal **8149**, captura o confirmación de entrega; no alterar canal **7034** | Emisor/test WABA/tokens seguros |
| **SOCIAL-01** | P1 | Calendario de 2 semanas 50/50 + 1 pieza para aprobación con CTA y enlace medible, no publicaciones fingidas | Claude + dirección |
| **SOCIAL-02** | P1 | Reconciliar perfil/tienda Facebook y canales Metricool; plan de X solo si está conectado | Meta/Metricool |
| **DATOS-01** | P1 | Tablero semanal con alcance, guardados, clics, leads, pagos cobrados y origen, sin PII | Dirección + agentes |
| **OPS-01** | P1 | Verificar CI/seguridad de repos, comparar PRs abiertos, actualizar checklist y próximos pasos | Codex + revisión cruzada |

**Aceptación global:** demostrar camino real de inscripción/cobro antes de invertir energía en más producción de imágenes. **Ningún agente puede marcar «implementado» una integración sin evidencia de ejecución y comprobación de entrega.**

## 7. Secuencia de trabajo sin pedir al usuario otra recapitulación

**Primer ciclo, sin cambios externos:** leer documentos → comparar repos con producción → analizar conversación/compra con datos autorizados → auditar Meta sin mutar → entregar 2 informes y 1 plan editorial preparado → revisar PRs.

**Segundo ciclo, cambios aislados:** cada agente trabaja en su rama, añade pruebas y screenshots saneados, abre PR; el otro revisa y reporta riesgos.

**Tercer ciclo, con autorización específica:** merge y despliegue, prueba controlada en entorno adecuado, una publicación aprobada, registro de respuestas, primer pago comprobable. **La decisión de publicar, gastar, enviar mensajes o alterar producción corresponde a la dirección.**

**Formato de resultado por agente:** fecha/hora CDMX; `LO_VERIFICADO`; `LO_NO_VERIFICADO`; `FALLAS_P0`; `ARCHIVOS_CAMBIADOS`; `PR/commit`; `TESTS`; `BLOQUEOS`; `AUTORIZACIONES`; `SIGUIENTE_ACCION`. Sin afirmar actividad de otro agente sin prueba.

## 8. Arranque de terminal

En el clon **`casatapputi-mx`**:
```bash
git pull --ff-only origin main
cat docs/MISION-EJECUTABLE-CODEX-CLAUDE-VENTAS-Y-REDES-2026-11-02.md
cat docs/COLMENA-PLAN-CODEX-CLAUDE-VENTA-TALLERES-2026-10-31.md
```

**Para Codex:** revisa `AGENTS.md`, ejecuta **primero** VENTA-01/02 y BOT-01 en solo lectura, produce pruebas y PR.  
**Para Claude Code:** revisa `CLAUDE.md`, ejecuta **primero** VENTA-03/SOCIAL-01, produce auditoría de conversión y contenidos listos para revisión, no programación.  
**Para ambos:** no compartáis ramas ni sobrescribáis cambios; comunicad hallazgos por issue/PR y mantened seguridad.

## 9. URLs operativas y referencias

- Web: https://casatapputi.com.mx/
- [Issues de venta](https://github.com/casatapputi-arch/casatapputi-mx/issues/1) y [embudo web→WhatsApp](https://github.com/casatapputi-arch/casatapputi-mx/issues/2).
- [Plan COLMENA del 31/10](COLMENA-PLAN-CODEX-CLAUDE-VENTA-TALLERES-2026-10-31.md).
- [Bot de respuestas (repo privado)](https://github.com/casatapputi-arch/casatapputi-respuestas) y [PR abierto del bot](https://github.com/casatapputi-arch/casatapputi-respuestas/pull/2).
- [Cerebro privado, relevo integral de redes y Meta](https://github.com/casatapputi-arch/Claude-Wiki/blob/main/casa-tapputi/operaciones/RELEVO-INTEGRAL-REDES-META-VENTAS-2026-11-02.md).

**Responsabilidad editorial:** evitar reimprimir nombres personales, identificaciones, correos, números completos, permisos secretos o detalles internos en el repositorio web público. La matriz granular de activos Meta pertenece al cerebro **privado**, no a esta ficha pública.

---
**Estado documental al 2/11/2026:** misión preparada; sin nuevos pagos, publicaciones, envíos de WhatsApp, cambios de Meta ni despliegues acreditados por este commit.
