# COLMENA — Plan operativo para Codex + Claude Code
**Casa Tapputi | 31 de octubre de 2026 | Versión 1.0 | Documento de trabajo**

## 0. Orden de misión (leer primero)

**Problema:** Casa Tapputi ha producido contenidos, materiales e infraestructura digital, pero se reporta que no se ha vendido ningún curso. Esto es un dato operativo comunicado por la dirección, **no un resultado verificado contra el registro de pagos**.

**Objetivo único de esta fase:** descubrir por qué el interés no termina en inscripciones pagadas y corregir, de manera comprobable y segura, los obstáculos en el trayecto **descubrir taller → entender oferta → seleccionar boleto → iniciar pago → pago confirmado → boleto entregado**.

**Forma de trabajo:** Codex y Claude Code trabajan en paralelo, por ramas y entregables separados de GitHub, se auditan mutuamente y cierran con un informe único. No competir por redactar 100 versiones; producir evidencia y resolver problemas.

**Regla fundamental:** primero diagnóstico reproducible, luego cambios propuestos, después pruebas en entorno seguro y únicamente finalmente posible despliegue **con aprobación expresa**. No hacer cobros reales de prueba ni actuar sobre compradores.

## 1. Lo que ya sabemos y lo que NO sabemos

### Hechos documentados
- Sitio: https://casatapputi.com.mx/ ; código del frontend: este repositorio (casatapputi-arch/casatapputi-mx).
- Ruta de talleres: 'talleres/index.html'; página comercial concreta: 'talleres/masaje-descontracturante/index.html'.
- El catálogo de talleres contiene varias fechas históricas visibles y futuras, por lo que debe revisarse la jerarquía de fechas en la experiencia real.
- El taller de Masaje Descontracturante aparece en el código con fecha **14 de noviembre de 2026, 11:30–14:30**, y precio **$500 MXN**. Confirmar vigencia con dirección antes de promocionar.
- Las páginas de taller llevan a un flujo de selección de boletos y al servicio 'https://tickets.casatapputi.com.mx'.
- El código de taller contempla una solicitud de checkout, redirección a Mercado Pago, descuentos y emisión de códigos QR, con ruta alternativa de atención por WhatsApp.
- 'scripts/tickets-server.js' contiene lógica de boletaje, descuentos y pagos; el servicio y su configuración en producción **no** están verificados en esta misión.
- 'docs/INTEGRACION-MEDUSA.md' y el 'docs/RUNBOOK.md' del repo privado 'casatapputi-medusa' contienen información histórica de despliegue e integraciones, parte fechada en julio/agosto de 2026; no tomar esos estados históricos como estado actual.
- Una publicación de Instagram sobre el taller Plantas de Poder del 31 de octubre se publicó el **30 de octubre**, con un día de anticipación; llama a escribir por DM para inscribirse. El manejo de mensajes y cierres aún no está auditado.
- La cuenta de Instagram está conectada a Metricool, pero los indicadores de alcance **no** demuestran por sí mismos ventas ni fallas de pago.
- Identidad: **Casa Tapputi**, con doble p en Tapputi. Conservar logo, tipografía, estética y fotos reales oficiales; no crear logotipos ni alegaciones terapéuticas nuevas.

### Incógnitas obligatorias
1. ¿Qué versión del sitio está realmente publicada y cómo se despliega? Comparar 'main' y producción sin modificar ninguna de las dos.
2. ¿El servicio de boletos responde, los webhooks verifican el pago y la confirmación se entrega correctamente?
3. ¿Existe entorno de pruebas de Mercado Pago y cómo hacer una compra simulada sin dinero real?
4. ¿Cuántas personas vieron la página, iniciaron compra, abandonaron, escribieron por WhatsApp, pagaron y recibieron boleto? Si faltan registros, decir 'sin dato'.
5. ¿Cuántos mensajes entraron, cuánto tardaron en recibir respuesta y cuántos llegaron al cobro? Acceder solo a canales autorizados; no copiar datos personales al repositorio.
6. ¿Los datos de fecha, precio, horario, cupo, condiciones, mapa, confirmación y contacto son correctos hoy?
7. ¿Qué fallas son técnicas, cuáles de propuesta comercial y cuáles de distribución/seguimiento? Separar evidencia e hipótesis.

## 2. Roles y entregables

### CODEX — Responsable técnico del embudo
**Misión:** auditar y reparar la ruta técnica de venta sin afectar producción.

1. Inspeccionar 'talleres/index.html', páginas individuales, JS asociado, 'scripts/tickets-server.js', 'tickets/' y documentación de checkout; dibujar flujo cliente-servidor-pago-webhook-QR.
2. Comprobar que precios y cantidades provienen de una fuente de verdad confiable en backend; que nadie pueda emitir boletos sin pago acreditado (salvo descuentos autorizados); y que la devolución desde Mercado Pago no se trate por sí sola como prueba de pago.
3. Identificar enlaces rotos, errores JavaScript, endpoints no disponibles, validaciones defectuosas, mensajes insuficientes, fallos móviles y desajustes entre código y producción.
4. Verificar estados y logs **solo lectura**, si tiene acceso permitido. No usar tokens productivos en consola visible ni escribir secretos en issues, commits o reportes.
5. Crear plan mínimo de medición de eventos no personales: 'workshop_view', 'buy_click', 'checkout_start', 'checkout_failure', 'payment_confirmed' (solo servidor), 'ticket_delivered' y 'whatsapp_click'. Documentar definición, fuente y forma de evitar doble conteo. No introducir analítica invasiva.
6. Proponer y ejecutar pruebas automatizadas locales y pruebas de checkout **en sandbox** cuando existan credenciales de prueba proporcionadas de forma segura.
7. Corregir defectos **en su propia rama**, añadir pruebas y abrir PR con evidencia, screenshots o registros saneados. No hacer merge ni despliegue unilateral.

**Entregables Codex:** 'docs/auditoria-tecnica-talleres.md', diagrama del embudo, defectos priorizados, pruebas reproducibles, PR(s) de corrección técnica y listado de bloqueos que requieren autorización.

### CLAUDE CODE — Responsable comercial, UX y comunicación
**Misión:** auditar el proceso desde los ojos del comprador y reconstruir la oferta comercial con evidencia.

1. Recorrer las páginas como visitante nuevo en móvil y escritorio; inventariar fricciones, exceso de pasos y dudas que impiden pagar.
2. Revisar claridad de fechas, vigencia de talleres, temario, qué elaboran o aprenden, materiales, ubicación, duración, precio, cupo, condiciones y llamados a la acción.
3. Comparar la promesa del contenido en redes con lo que encuentra el visitante en el sitio; detectar enlaces que mandan a mensajes en lugar de una página comprable y las dificultades para seguimiento.
4. Proponer un solo flujo comercial prioritario para el siguiente taller **confirmado vigente**, con contenido auténtico y sin inventar testimonios, descuentos, cupos ni resultados.
5. Diseñar seguimiento de interesados por etapas: nuevo → respondido → inscrito pendiente de pago → pagado → confirmado → asistió, con responsables y tiempos de atención como propuestas, no como resultados ya existentes.
6. Preparar propuesta de mensajes de seguimiento, página optimizada, preguntas frecuentes y material de campaña breve. No publicar, enviar mensajes ni cambiar precios sin aprobación.
7. Implementar, si corresponde, cambios UX y de textos **en una rama distinta de Codex**, y abrir PR para revisión recíproca.

**Entregables Claude Code:** 'docs/auditoria-comercial-talleres.md', recorrido del comprador, propuestas de copy/UX, registro de hipótesis y PR(s) de cambios comerciales.

### CHATGPT — Coordinación y revisión
- Recibir los dos informes desde GitHub; comprobar consistencia, evidencia y prioridades.
- Contrastar análisis técnico y comercial y señalar contradicciones y riesgos.
- Preparar plan integrado de ejecución, criterios de aceptación y tablero simple de resultados.
- No asumir que esta conversación ejecuta por sí sola un proceso permanente: la dirección debe activar Codex y Claude Code o conectar una automatización oficial.
- Las decisiones sobre pagos reales, publicación, atención de clientes y despliegue pertenecen a la persona responsable de Casa Tapputi.

## 3. Flujo de colaboración en GitHub

**Repositorio de ejecución:** 'casatapputi-arch/casatapputi-mx'. **Repo relacionado solo para consulta técnica si se concede acceso:** 'casatapputi-arch/casatapputi-medusa'. No editar el repo de memoria 'Claude-Wiki' como reemplazo del código de la tienda.

1. Ambos hacen 'git pull' de 'main' y leen este documento.
2. Codex abre rama 'colmena/codex-auditoria-pagos' y Claude rama 'colmena/claude-auditoria-conversion'. No editar los mismos archivos simultáneamente; comunicar el alcance en cada PR.
3. Fase inicial de **solo lectura**. Emitir las dos auditorías con distinción 'hecho comprobado', 'hipótesis', 'pendiente de acceso' y 'recomendación'.
4. Después realizar reparaciones locales / staging y pruebas. Un agente revisa el PR del otro; discrepancias se registran en el PR, no se ocultan.
5. ChatGPT integra hallazgos y propone orden de aprobación: P0 compra/pago/seguridad; P1 disponibilidad y claridad de oferta; P2 captación y analítica; P3 estética y optimizaciones secundarias.
6. Nadie fusiona ni despliega sin permiso explícito; confirmar equivalencia entre repo y código publicado antes de llevar cambios a producción.
7. Documentar resultados en GitHub para que otro desarrollador pueda reproducirlos sin depender de una conversación privada.

**Formato obligatorio por hallazgo:** ID · severidad · URL/ruta · evidencia observable · forma de reproducir · causa probable · riesgo · corrección sugerida · verificación posterior · estado.

## 4. Criterios de aceptación del primer ciclo

La misión **no** termina cuando hay un nuevo flyer, una página más bonita o un chatbot.

- [ ] Se confirma qué código y versión están en producción.
- [ ] Se documenta el proceso de compra completo y todos los servicios involucrados.
- [ ] Se prueba un pago **de sandbox** o se declara explícitamente el bloqueo por falta de entorno de pruebas.
- [ ] Se prueba la emisión de boleto/QR solo tras acreditación del pago, y el caso de pago rechazado/pending.
- [ ] La página principal de talleres diferencia claramente próximos, pasados y sin fecha confirmada.
- [ ] El siguiente taller confirmado tiene oferta verificable, CTA inequívoco, precio/horario correctos y vía real de inscripción.
- [ ] Hay forma de contar visitas, intención de compra, pago confirmado y entrega sin exponer datos personales.
- [ ] Cada cambio propuesto tiene PR, revisión cruzada y un plan de revertirlo.
- [ ] La dirección recibe un resumen de una página: qué fallaba, qué se corrigió, qué sigue pendiente, métricas disponibles y qué debe aprobar.

**Indicador principal:** cantidad de inscripciones pagadas verificadas, no visualizaciones o likes. Secundarios: tasa de paso entre etapas, tiempo de respuesta, abandono, costos y asistentes reales. No inventar baselines ni prometer ventas.

## 5. Límites y protección del negocio

- No compartir credenciales, tokens secretos, listas de clientes, pagos, correos privados, archivos de producción ni datos sensibles en GitHub público.
- No ejecutar cargos reales de prueba, reembolsos, modificaciones de precios, campañas pagadas o mensajes masivos.
- No automatizar cuentas personales de IA mediante contraseñas ni mezclar cuotas individuales; usar herramientas autorizadas.
- No tocar DNS, despliegue, firewall, base de datos, credenciales ni servidores productivos sin aprobación específica.
- No borrar campañas, pedidos, boletos ni registros existentes.
- Preservar la marca oficial Casa Tapputi; no inventar testimonios ni afirmar beneficios de salud sin sustento.
- No 'arreglar' un problema ocultando el error: dejar observabilidad y pruebas.

## 6. Instrucción de arranque para cada agente

**Para Codex:**
> Lee docs/COLMENA-PLAN-CODEX-CLAUDE-VENTA-TALLERES-2026-10-31.md en main de casatapputi-arch/casatapputi-mx. Ejecuta SOLO tu rol CODEX: primero auditoría técnica reproducible, sin cambios de producción. Crea rama de trabajo, documento de hallazgos y PR; coordina con la rama de Claude Code. Da prioridad a comprobar el checkout, el servidor de boletos, la confirmación de pago y QR, sin cobros reales.

**Para Claude Code:**
> Lee docs/COLMENA-PLAN-CODEX-CLAUDE-VENTA-TALLERES-2026-10-31.md en main de casatapputi-arch/casatapputi-mx. Ejecuta SOLO tu rol CLAUDE CODE: auditoría comercial/UX y ruta de inscripción, primero sin modificar producción. Crea tu rama, informe de hallazgos y PR; revisa los PR de Codex. No cambies precios, campañas ni publiques sin aprobación.

## 7. Próximo hito

**Hito 1:** entregar las dos auditorías y un diagnóstico conjunto que distinga si la ausencia de ventas se origina en falta de tráfico, falta de oferta/convicción, dificultad para pagar, fallas de confirmación o falta de seguimiento. **No presuponer causa única.**

**Hito 2:** corregir P0/P1 en entorno seguro, demostrar que el flujo funciona y solicitar autorización para el despliegue.

**Hito 3:** una campaña de captación dirigida a un taller realmente confirmado, con medición del embudo y revisión semanal de inscripciones pagadas.

---
**Estado al redactar:** plan de trabajo subido a GitHub; ninguna corrección técnica o publicación comercial ejecutada por este documento. **Codex y Claude Code deben iniciarse en sus sesiones o en una automatización configurada: GitHub por sí solo no los ejecuta.**
