/* Casa Tapputi · lightweight home cart badge */
(function () {
  const CART_KEY = 'casatapputi_cart';

  function renderCount() {
    let items = [];
    try { items = JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (_) {}
    const count = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    document.querySelectorAll('.cart-count').forEach((el) => {
      el.textContent = count;
      el.setAttribute('aria-label', `${count} producto${count === 1 ? '' : 's'} en el carrito`);
      el.style.display = count > 0 ? 'flex' : 'none';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderCount, { once: true });
  } else {
    renderCount();
  }
  window.addEventListener('storage', (event) => {
    if (event.key === CART_KEY) renderCount();
  });
})();
