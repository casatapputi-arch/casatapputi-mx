/* ============================================================
   Casa Tapputi — MercadoPago Checkout
   Depende de cart.js (usa sus globals: medusaFetch, getOrCreateCartId,
   getLocalCart, MEDUSA_URL, API_KEY).
   ============================================================ */

// ── Iniciar pago con MercadoPago ─────────────────────────
async function iniciarPagoMercadoPago() {
  const btn = document.getElementById('btn-mercadopago');
  const local = getLocalCart();
  if (!local.length) {
    mostrarErrorMP('Tu carrito está vacío.');
    return;
  }

  // Loading state (originalHtml se guarda en renderBotonMercadoPago)
  if (btn) {
    btn.disabled = true;
    btn.innerHTML =
      '<span class="mp-spinner"></span> Conectando con MercadoPago…';
  }

  try {
    // 1. Obtener/crear cart ID
    const cartId = await getOrCreateCartId();

    // 2. Obtener o crear Payment Collection (Medusa v2)
    // medusaCart ya fue poblado por getOrCreateCartId()
    let paymentCollectionId = medusaCart?.payment_collection?.id;

    if (!paymentCollectionId) {
      const collectionData = await medusaFetch('/store/payment-collections', {
        method: 'POST',
        body: JSON.stringify({ cart_id: cartId }),
      });
      paymentCollectionId = collectionData?.payment_collection?.id;
      if (!paymentCollectionId) {
        throw new Error(
          'No se pudo crear la sesión de pago. Intenta de nuevo.'
        );
      }
    }

    // 3. Inicializar sesión de pago con MercadoPago
    const sessionData = await medusaFetch(
      `/store/payment-collections/${paymentCollectionId}/payment-sessions`,
      {
        method: 'POST',
        body: JSON.stringify({ provider_id: 'pp_mercadopago_mercadopago' }),
      }
    );

    // 4. Extraer URL de checkout de MercadoPago
    const sessions =
      sessionData?.payment_collection?.payment_sessions || [];
    const mpSession = sessions.find(
      s => s.provider_id === 'pp_mercadopago_mercadopago'
    );

    const checkoutUrl = mpSession.data?.init_point || mpSession.data?.sandbox_init_point;
    if (!mpSession || !checkoutUrl) {
      throw new Error(
        'MercadoPago no está configurado en el servidor. El provider "pp_mercadopago_mercadopago" no respondió con una URL de pago.'
      );
    }

    // 5. Guardar cart ID para la página de retorno
    sessionStorage.setItem('casatapputi_mp_cart_id', cartId);

    // 6. Redirigir a MercadoPago (preferir sandbox si estamos en modo TEST)
    window.location.href = checkoutUrl;
  } catch (err) {
    console.error('Error al iniciar pago con MercadoPago:', err);
    restaurarBotonMP(btn);

    // Diferenciar tipo de error
    if (err.message && err.message.includes('Failed to fetch')) {
      mostrarErrorMP(
        'Error de conexión. Revisa tu internet e intenta de nuevo.',
        err.message
      );
    } else if (err.message && err.message.includes('400')) {
      mostrarErrorMP(
        'Error al crear la sesión de pago. ¿El producto tiene precio configurado?',
        err.message
      );
    } else {
      mostrarErrorMP(
        'No se pudo iniciar el pago con MercadoPago. Intenta con WhatsApp.',
        err.message
      );
    }
  }
}

function restaurarBotonMP(btn) {
  if (!btn) return;
  btn.disabled = false;
  if (btn.dataset.originalHtml) {
    btn.innerHTML = btn.dataset.originalHtml;
  }
}

// ── Mostrar error amigable ────────────────────────────────
function mostrarErrorMP(msg, detail) {
  const container = document.getElementById('mp-error-container');
  if (!container) return;
  container.innerHTML =
    '<div class="mp-error">' +
    '<p><strong>' +
    msg +
    '</strong></p>' +
    (detail ? '<small style="opacity:.6;word-break:break-all">' + detail + '</small>' : '') +
    '</div>';
  setTimeout(() => {
    if (container) container.innerHTML = '';
  }, 15000);
}

// ── Renderizar el botón de MercadoPago ────────────────────
// Llamado por cart.js DESPUÉS de que renderCartPage() inyecta el HTML
function renderBotonMercadoPago() {
  const container = document.getElementById('mp-button-container');
  if (!container) return;

  container.innerHTML = `
    <div id="mp-error-container"></div>
    <button id="btn-mercadopago" class="btn-mp-checkout"
            onclick="iniciarPagoMercadoPago()"
            aria-label="Pagar con MercadoPago">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
           style="vertical-align:middle;margin-right:6px">
        <rect width="24" height="24" rx="5" fill="#009ee3"/>
        <path d="M6.5 8.5h2.8c1.5 0 2.5.6 2.5 1.8 0 .9-.5 1.5-1.3 1.7v.1c.9.1 1.5.8 1.5 1.7 0 1.3-1.1 2-2.7 2H6.5V8.5zm2.7 2.8c.8 0 1.3-.4 1.3-1.1 0-.7-.5-1.1-1.3-1.1h-.9v2.2h.9zm.2 2.6c.9 0 1.4-.4 1.4-1.2 0-.7-.5-1.2-1.4-1.2h-1.1v2.4h1.1zM13.5 13.2c0-1.6 1.2-2.7 2.8-2.7s2.8 1.1 2.8 2.7-1.2 2.7-2.8 2.7-2.8-1.1-2.8-2.7zm1.5 0c0 .9.6 1.5 1.3 1.5s1.3-.6 1.3-1.5-.6-1.5-1.3-1.5-1.3.6-1.3 1.5z" fill="#fff"/>
      </svg>
      Pagar con MercadoPago
    </button>`;

  // Guardar HTML original para restaurar en errores
  const btn = document.getElementById('btn-mercadopago');
  if (btn) btn.dataset.originalHtml = btn.innerHTML;
}
