/* ============================================================
   Casa Tapputi — Total dinámico en páginas de producto
   Muestra precio × cantidad al cambiar el selector de cantidad.
   ============================================================ */
(function() {
  const qtyInput = document.getElementById('productQty');
  const priceEl = document.querySelector('.prod-price');
  if (!qtyInput || !priceEl) return;

  // Extraer precio numérico del texto (ej: "$200 MXN" o "desde $400 MXN" → 200, 400)
  const priceText = priceEl.textContent.trim();
  const priceMatch = priceText.match(/\$?([\d,]+)/);
  if (!priceMatch) return;
  const unitPrice = parseInt(priceMatch[1].replace(/,/g, ''));

  // Crear elemento para mostrar el total
  const totalEl = document.createElement('div');
  totalEl.id = 'prodTotal';
  totalEl.style.cssText =
    'font-family:var(--serif);font-size:1.3rem;color:var(--miel);' +
    'margin-top:.5rem;font-weight:500;transition:opacity .25s;min-height:1.6rem';
  priceEl.parentNode.insertBefore(totalEl, priceEl.nextSibling);

  function updateTotal() {
    const qty = parseInt(qtyInput.value) || 1;
    const total = unitPrice * qty;
    if (qty > 1) {
      totalEl.textContent = 'Total: $' + total.toLocaleString('es-MX') + ' MXN';
      totalEl.style.opacity = '1';
    } else {
      totalEl.textContent = '';
      totalEl.style.opacity = '0';
    }
  }

  // Eventos del input
  qtyInput.addEventListener('input', updateTotal);
  qtyInput.addEventListener('change', updateTotal);

  // Interceptar clicks en botones +/- (las funciones inline usan setTimeout 0)
  document.addEventListener('click', function(e) {
    if (e.target.closest('.qty-stepper button')) {
      setTimeout(updateTotal, 60);
    }
  });

  updateTotal();
})();
