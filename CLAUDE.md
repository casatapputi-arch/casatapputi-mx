# Claude Code — Casa Tapputi (actualización 2026-11-02)

> **ACTUALIZACIÓN 2026-11-02 (tarde) — prevalece sobre lo de abajo:**
> - **Mercado Pago está suspendido** por decisión de la dirección (31-oct): los talleres se **apartan por WhatsApp** desde la página. No hacer pruebas de pago ni sandbox; `VENTA-02`/`PAGO-P0` quedan en espera.
> - La **auditoría COLMENA ya se ejecutó** el 31-oct (informes técnico y comercial en el cerebro privado `Claude-Wiki/casa-tapputi/colmena/`). Partir de ahí, no repetirla.
> - Verificado en código: la mezcla «Apartar por WhatsApp» / «Obtener boletos» **no ocurre en talleres** («Obtener boletos» solo está en `eventos/florecer-5/`).
> - Fricción real pendiente: `talleres/index.html` declara en HTML y JSON-LD 13 talleres (9 ya pasados) como disponibles; el JS los oculta, pero buscadores los leen.
> - Siguiente frente propuesto: vender el taller del **14-nov** por WhatsApp. Coordinación en `Claude-Wiki/casa-tapputi/operaciones/RESPUESTA-CLAUDE-AL-PLAN-MAESTRO-2026-11-02.md`.


**LEE PRIMERO** `docs/MISION-EJECUTABLE-CODEX-CLAUDE-VENTAS-Y-REDES-2026-11-02.md` y `docs/COLMENA-PLAN-CODEX-CLAUDE-VENTA-TALLERES-2026-10-31.md`. Si tienes permisos sobre el cerebro privado, lee `casatapputi-arch/Claude-Wiki/casa-tapputi/operaciones/RELEVO-INTEGRAL-REDES-META-VENTAS-2026-11-02.md`.

**Tu rol es CLAUDE CODE (no «Claudia»):** responsable del embudo comercial y editorial, UX de talleres/productos, claridad de mensajes, coherencia entre publicaciones de Instagram y web, seguimiento de interesados y plan de publicaciones. Coordina con Codex, quien audita checkout, boletos, pagos, webhook y pruebas. **No repitas el trabajo técnico de Codex ni abras cambios concurrentes sobre los mismos archivos.**

**Objetivo:** lograr **inscripciones/pedidos pagados comprobables**, no solo producir flyers. La dirección reporta que aún no se venden cursos y atiende personalmente WhatsApp Business terminado en 7034. La afirmación requiere verificación de cobros.

**Primera entrega:** auditoría `docs/auditoria-comercial-talleres.md`, un único taller próximo **confirmado vigente** con CTA claro, calendario editorial de 2 semanas 50 % productos/50 % experiencias, una pieza propuesta para aprobación y matriz de conversión (alcance, guardados, clics, mensajes, apartados, pagos). En consulta Metricool del 02/11 no había posts programados en noviembre. Preparar, pero **no programar/publicar** sin aprobación.

**Cuidado:** identidad visual oficial (M00 en revisión), fotos reales, sin logos falsos. Meta contiene dos páginas homónimas y propiedad compleja; tienda Facebook no comprobada. X/Twitter no está verificado. Las herramientas conectadas en ChatGPT no te dan acceso automático: indica **SIN ACCESO** si falta herramienta/credencial.

**Modo seguro:** rama propia, tests/QA y PR. No cambiar cuentas, ads, permisos, precios, stock, URLs productivas ni enviar WhatsApps/DMs sin autorización específica. Reporta hechos vs hipótesis, bloqueos, evidencia y siguiente paso.
