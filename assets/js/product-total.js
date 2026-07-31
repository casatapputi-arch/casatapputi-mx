/* ============================================================
   Casa Tapputi — Total dinámico en páginas de producto
   Muestra precio × cantidad al cambiar el selector de cantidad.
   ============================================================ */
(function init() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
    return;
  }

  const qtyInput = document.getElementById('productQty');
  const priceEl = document.querySelector('.prod-price');
  if (!qtyInput || !priceEl) return;

  // Crear elemento para mostrar el total
  const totalEl = document.createElement('div');
  totalEl.id = 'prodTotal';
  totalEl.style.cssText =
    'font-family:var(--serif);font-size:1.3rem;color:var(--miel);' +
    'margin-top:.5rem;font-weight:500;transition:opacity .25s;min-height:1.6rem';
  priceEl.parentNode.insertBefore(totalEl, priceEl.nextSibling);

  function getUnitPrice() {
    // Re-leer el precio del DOM cada vez (soporta variantes que cambian dinámicamente)
    const priceText = priceEl.textContent.trim();
    const priceMatch = priceText.match(/\$([\d,]+)/);
    return priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : 0;
  }

  function updateTotal() {
    const qty = parseInt(qtyInput.value) || 1;
    const unitPrice = getUnitPrice();
    if (!unitPrice) return;
    const total = unitPrice * qty;
    if (qty > 1) {
      totalEl.textContent = 'Total: $' + total.toLocaleString('es-MX') + ' MXN';
      totalEl.style.opacity = '1';
    } else {
      totalEl.textContent = '';
      totalEl.style.opacity = '0';
    }
  }

  // Eventos del input (cuando el usuario escribe directamente)
  qtyInput.addEventListener('input', updateTotal);
  qtyInput.addEventListener('change', updateTotal);

  // Interceptar clicks en botones +/- (las funciones inline modifican .value,
  // lo cual no dispara eventos input/change, así que usamos rAF doble)
  document.addEventListener('click', function(e) {
    if (e.target.closest('.qty-stepper button')) {
      requestAnimationFrame(function() {
        requestAnimationFrame(updateTotal);
      });
    }
  });

  // Exponer al scope global para que paginas con variantes
  // (updateProductPrice) puedan forzar recálculo inmediato
  window._productTotalRefresh = updateTotal;

  updateTotal();
})();
