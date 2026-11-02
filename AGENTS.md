# Codex — Casa Tapputi (actualización 2026-11-02)

> **ACTUALIZACIÓN 2026-11-02 (tarde) — prevalece sobre lo de abajo:**
> - **Mercado Pago está suspendido** por decisión de la dirección (31-oct): los talleres se **apartan por WhatsApp** desde la página. No hacer pruebas de pago ni sandbox; `VENTA-02`/`PAGO-P0` quedan en espera.
> - La **auditoría COLMENA ya se ejecutó** el 31-oct (informes técnico y comercial en el cerebro privado `Claude-Wiki/casa-tapputi/colmena/`). Partir de ahí, no repetirla.
> - Verificado en código: la mezcla «Apartar por WhatsApp» / «Obtener boletos» **no ocurre en talleres** («Obtener boletos» solo está en `eventos/florecer-5/`).
> - Fricción real pendiente: `talleres/index.html` declara en HTML y JSON-LD 13 talleres (9 ya pasados) como disponibles; el JS los oculta, pero buscadores los leen.
> - Siguiente frente propuesto: vender el taller del **14-nov** por WhatsApp. Coordinación en `Claude-Wiki/casa-tapputi/operaciones/RESPUESTA-CLAUDE-AL-PLAN-MAESTRO-2026-11-02.md`.


## Instrucción prioritaria
Lee **completo** `docs/MISION-EJECUTABLE-CODEX-CLAUDE-VENTAS-Y-REDES-2026-11-02.md` antes de investigar, modificar o ejecutar. Complementa con `docs/COLMENA-PLAN-CODEX-CLAUDE-VENTA-TALLERES-2026-10-31.md`. Ambos son la orden de misión vigente para este repositorio.

**Tu rol es CODEX:** auditar y corregir de forma reproducible el camino **anuncio/landing → consulta o checkout → pago acreditado → boleto/QR o pedido**, sin intervenir producción ni inventar ventas. Primero leer código, issues #1/#2 y comparar con web publicada; preparar pruebas, informe técnico y PR en rama propia. Después revisar las propuestas de Claude Code.

**Contexto del negocio:** Casa Tapputi con doble p, WhatsApp Business terminado en 7034 atendido por la dirección; la meta es generar ventas pagadas, no solo visualizaciones. Existe un bot separado en `casatapputi-arch/casatapputi-respuestas`; el plan comercial no implica que el bot esté desplegado.

**Privacidad y permisos:** nunca exponer secretos/clientes; no hacer pagos reales, publicar piezas, enviar mensajes, modificar Meta, DNS, servidores, campañas, cuentas o políticas sin autorización puntual. Si no tienes un conector presente en ChatGPT (Metricool, Windsor.ai, etc.), marca **SIN ACCESO**; no supongas que GitHub transmite sesiones. Distingue hechos, hipótesis y tareas abiertas.

**Documentación confidencial:** con acceso autorizado, consulta el relevo de `casatapputi-arch/Claude-Wiki/casa-tapputi/operaciones/RELEVO-INTEGRAL-REDES-META-VENTAS-2026-11-02.md`. El repo web es público: no copies secretos o inventario sensible.

**Entrega mínima:** `docs/auditoria-tecnica-talleres.md`, tests, PR, hallazgos P0, evidencia de la ruta de cobro y autorizaciones pendientes. No marcar como ejecutado lo que solo esté documentado.
