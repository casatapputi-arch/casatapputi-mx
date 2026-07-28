/* ============================================================
   Casa Tapputi — MercadoPago Checkout v2
   Integra formulario de datos del comprador, dirección de envío,
   y descuento por recoger en Huerto Roma Verde.
   Depende de cart.js (usa sus globals: medusaFetch, getOrCreateCartId,
   getLocalCart, MEDUSA_URL, API_KEY).
   ============================================================ */

const PICKUP_DISCOUNT = 0.10; // 10% descuento por recoger
const WHATSAPP_NUMBER = '525563707034';
const SHIPPING_CDMX = 80;    // Uber Direct / Rappi
const SHIPPING_FORANEO = 150; // Estafeta / Redpack
let deliveryMode = null;

// ── Control de modo de entrega ──────────────────────────
function selectDeliveryMode(mode) {
  deliveryMode = mode;
  const addrDiv = document.getElementById('deliveryAddress');
  const optD = document.getElementById('optDelivery');
  const optP = document.getElementById('optPickup');

  document.querySelector(`input[name="deliveryMode"][value="${mode}"]`).checked = true;

  if (mode === 'envio') {
    if (addrDiv) addrDiv.style.display = 'block';
    if (optD) optD.style.background = 'rgba(139,195,74,.08)';
    if (optP) optP.style.background = '';
  } else {
    if (addrDiv) addrDiv.style.display = 'none';
    if (optP) optP.style.background = 'rgba(139,195,74,.08)';
    if (optD) optD.style.background = '';
  }

  if (typeof renderBotonMercadoPago === 'function') renderBotonMercadoPago();
}

function getCustomerData() {
  const name = document.getElementById('custName')?.value?.trim() || '';
  const phone = document.getElementById('custPhone')?.value?.trim() || '';
  const address = document.getElementById('custAddress')?.value?.trim() || '';
  const cp = document.getElementById('custCP')?.value?.trim() || '';
  return { name, phone, address, cp, mode: deliveryMode };
}

// ── Detectar zona de envío por CP ────────────────────────
function getShippingInfo(cp) {
  if (!cp || cp.length < 5) return { isCDMX: false, cost: SHIPPING_FORANEO, label: 'Foráneo ~$150 MXN (Estafeta)' };
  const num = parseInt(cp, 10);
  if (num >= 1000 && num <= 17999)  return { isCDMX: true, cost: SHIPPING_CDMX, label: 'CDMX ~$80 MXN (Uber/Rappi)' };
  if (num >= 50000 && num <= 57999) return { isCDMX: true, cost: SHIPPING_CDMX, label: 'Edo. Méx ~$80 MXN (Uber/Rappi)' };
  return { isCDMX: false, cost: SHIPPING_FORANEO, label: 'Foráneo ~$150 MXN (Estafeta)' };
}

// ── Actualizar info de envío en el formulario ────────────
function actualizarInfoEnvio() {
  const cp = document.getElementById('custCP')?.value?.trim() || '';
  const info = document.getElementById('shippingInfo');
  if (!info) return;
  if (cp.length === 5) {
    const ship = getShippingInfo(cp);
    info.style.display = 'block';
    info.innerHTML = ship.isCDMX
      ? '🚀 <strong style="color:#a5d6a7">' + ship.label + '</strong> — mismo día'
      : '📦 <strong style="color:#ffb74d">' + ship.label + '</strong> — 2-5 días';
  } else {
    info.style.display = 'none';
  }
}

// ── Validar formulario de cliente ─────────────────────────
function validarFormularioCliente() {
  const data = getCustomerData();
  if (!data.name || data.name.length < 3) {
    mostrarErrorMP('Por favor ingresa tu nombre completo.');
    return null;
  }
  if (!data.phone || data.phone.length < 8) {
    mostrarErrorMP('Por favor ingresa un teléfono válido.');
    return null;
  }
  if (!data.mode) {
    mostrarErrorMP('Selecciona si quieres envío a domicilio o recoger en Huerto Roma Verde.');
    return null;
  }
  if (data.mode === 'envio' && !data.address) {
    mostrarErrorMP('Por favor ingresa tu dirección de envío.');
    return null;
  }
  if (data.mode === 'envio' && (!data.cp || data.cp.length < 5)) {
    mostrarErrorMP('Por favor ingresa tu código postal.');
    return null;
  }
  return data;
}

// ── Iniciar pago con MercadoPago ─────────────────────────
async function iniciarPagoMercadoPago() {
  const btn = document.getElementById('btn-mercadopago');
  const local = getLocalCart();
  if (!local.length) {
    mostrarErrorMP('Tu carrito está vacío.');
    return;
  }

  // Validar formulario
  const custData = validarFormularioCliente();
  if (!custData) return;

  // Loading state
  if (btn) {
    btn.disabled = true;
    btn.innerHTML =
      '<span class="mp-spinner"></span> Conectando con MercadoPago…';
  }

  try {
    // 1. Obtener/crear cart ID
    const cartId = await getOrCreateCartId();

    // 2. Obtener o crear Payment Collection (Medusa v2)
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

// 5. Guardar datos del cliente para la página de retorno
    sessionStorage.setItem('casatapputi_customer', JSON.stringify(custData));
    sessionStorage.setItem('casatapputi_cart_snapshot', JSON.stringify(local));

    // 6. Redirigir a MercadoPago
    window.location.href = checkoutUrl;
  } catch (err) {
    console.error('Error al iniciar pago con MercadoPago:', err);
    restaurarBotonMP(btn);
    if (err.message && err.message.includes('Failed to fetch')) {
      mostrarErrorMP('Error de conexión. Revisa tu internet e intenta de nuevo.', err.message);
    } else if (err.message && err.message.includes('400')) {
      mostrarErrorMP('Error al crear la sesión de pago. ¿El producto tiene precio configurado?', err.message);
    } else {
      mostrarErrorMP('No se pudo iniciar el pago con MercadoPago. Intenta con WhatsApp.', err.message);
    }
  }
}

// ── WhatsApp con descuento por recoger ────────────────────
function iniciarWhatsAppRecoger() {
  const custData = validarFormularioCliente();
  if (!custData) return;

  const local = getLocalCart();
  if (!local.length) {
    mostrarErrorMP('Tu carrito está vacío.');
    return;
  }

  // Calcular total con descuento
  let total = 0;
  const items = local.map(item => {
    const price = item.price || 0;
    total += price * (item.quantity || 1);
    return `- ${item.title || 'Producto'} x${item.quantity || 1}: $${price} MXN`;
  });

  const descuento = Math.round(total * PICKUP_DISCOUNT);
  const totalConDesc = total - descuento;

  const msg = encodeURIComponent(
    `🌿 *Pedido Casa Tapputi — Recoger en Huerto*\\n\\n` +
    `*Cliente:* ${custData.name}\\n` +
    `*Teléfono:* ${custData.phone}\\n\\n` +
    `*Productos:*\\n${items.join('\\n')}\\n\\n` +
    `Subtotal: $${total} MXN\\n` +
    `Descuento (10% recoger): -$${descuento} MXN\\n` +
    `*Total: $${totalConDesc} MXN*\\n\\n` +
    `📍 Recoger en: Jalapa 234, Roma Sur, CDMX\\n` +
    `💵 Pagaré en efectivo al recoger 🌿`
  );

  sessionStorage.setItem('casatapputi_customer', JSON.stringify(custData));
  sessionStorage.setItem('casatapputi_cart_snapshot', JSON.stringify(local));

  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
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
    '<p><strong>' + msg + '</strong></p>' +
    (detail ? '<small style="opacity:.6;word-break:break-all">' + detail + '</small>' : '') +
    '</div>';
  setTimeout(() => {
    if (container) container.innerHTML = '';
  }, 15000);
}

// ── Renderizar botones según modo de entrega ─────────────
function renderBotonMercadoPago() {
  const container = document.getElementById('mp-button-container');
  if (!container) return;

  const mode = typeof deliveryMode !== 'undefined' ? deliveryMode : null;
  const local = getLocalCart();

  // Mostrar/ocultar formulario según carrito
  const form = document.getElementById('customerForm');
  if (form) {
    form.style.display = local.length > 0 ? 'block' : 'none';
  }

  if (!local.length || !mode) {
    // Sin modo seleccionado: mostrar ambos pero deshabilitados
    container.innerHTML = `
      <div id="mp-error-container"></div>
      <p style="text-align:center;color:var(--tinta-suave);font-size:.9rem;margin-bottom:12px">
        ⬆️ Selecciona cómo quieres recibir tu pedido
      </p>`;
    return;
  }

  if (mode === 'envio') {
    // Botón de MercadoPago
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
  } else {
    // Botón de WhatsApp con descuento
    let total = 0;
    local.forEach(item => { total += (item.price || 0) * (item.quantity || 1); });
    const descuento = Math.round(total * PICKUP_DISCOUNT);
    const totalConDesc = total - descuento;

    container.innerHTML = `
      <div id="mp-error-container"></div>
      <div style="background:rgba(165,214,167,.08);border:1px solid rgba(165,214,167,.2);border-radius:6px;padding:14px 16px;margin-bottom:12px;text-align:center">
        <p style="margin:0;color:#a5d6a7;font-size:.9rem">💰 <strong>10% de descuento</strong> por recoger en Huerto Roma Verde</p>
        <p style="margin:4px 0 0;color:rgba(239,230,214,.6);font-size:.82rem">Total: $${total} → <strong style=\"color:var(--tinta)\">$${totalConDesc} MXN</strong> pagando en efectivo</p>
      </div>
      <button id="btn-whatsapp-recoger" class="btn-mp-checkout"
              style="background:#25D366"
              onclick="iniciarWhatsAppRecoger()"
              aria-label="Pedir por WhatsApp para recoger">
        <svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"currentColor\"
             style=\"vertical-align:middle;margin-right:6px\">
          <path d=\"M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347\"/>
        </svg>
        Confirmar pedido por WhatsApp
      </button>`;
  }

  const btn = document.getElementById('btn-mercadopago');
  if (btn) btn.dataset.originalHtml = btn.innerHTML;
}
