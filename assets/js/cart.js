/* ============================================================
   Casa Tapputi — Shopping Cart (localStorage + WhatsApp)
   Sin servidor, sin comisiones. El pedido se envía por WhatsApp.
   ============================================================ */

const CART_KEY = 'casatapputi_cart';
const WA_NUMBER = '525563707034';

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch(e) { return []; }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function addToCart(product) {
  if (!product || !product.id) return;
  const cart = getCart();
  const existing = cart.find(item => item.id === product.id);
  if (existing) {
    existing.quantity += product.quantity || 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price || 0,
      priceLabel: product.priceLabel || '',
      image: product.image || '',
      quantity: product.quantity || 1,
    });
  }
  saveCart(cart);
  refreshCartUI();
  showAddedFeedback(product.id);
}

function removeFromCart(id) {
  const cart = getCart().filter(item => item.id !== id);
  saveCart(cart);
  refreshCartUI();
}

function updateQuantity(id, qty) {
  if (qty < 1) return;
  const cart = getCart();
  const item = cart.find(item => item.id === id);
  if (item) {
    item.quantity = qty;
    saveCart(cart);
    refreshCartUI();
  }
}

function getTotal() {
  return getCart().reduce((sum, item) => sum + ((parseInt(item.price) || 0) * item.quantity), 0);
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  refreshCartUI();
}

function formatPrice(price) {
  if (!price || price === 0) return 'A consultar';
  return '$' + parseInt(price).toLocaleString('es-MX') + ' MXN';
}

function renderCartCount() {
  const cart = getCart();
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = count;
    el.setAttribute('aria-label', count + ' producto' + (count !== 1 ? 's' : '') + ' en el carrito');
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

function generateWhatsAppMessage() {
  const cart = getCart();
  if (!cart.length) return '';

  let msg = '🛒 *Pedido — Casa Tapputi* 🌿\n\n';

  cart.forEach(item => {
    const price = parseInt(item.price) || 0;
    const subtotal = price > 0 ? price * item.quantity : 0;
    msg += '• ' + item.name;
    if (item.quantity > 1) msg += ' ×' + item.quantity;
    if (subtotal > 0) {
      msg += ' — $' + subtotal.toLocaleString('es-MX') + ' MXN';
    } else {
      msg += ' — *Precio a consultar*';
    }
    msg += '\n';
  });

  const total = getTotal();
  if (total > 0) {
    msg += '\n💰 *Total: $' + total.toLocaleString('es-MX') + ' MXN*';
  }
  msg += '\n\n📦 Solicito información de envío/entrega.\n📍 Huerto Roma Verde, CDMX';

  return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg);
}

function getProductData(el) {
  const card = el.closest('.shop-card');
  if (!card) return null;
  return {
    id: card.dataset.productId,
    name: card.dataset.productName,
    price: parseInt(card.dataset.productPrice) || 0,
    priceLabel: card.dataset.productPriceLabel || '',
    image: card.dataset.productImage || '',
    quantity: 1
  };
}

function showAddedFeedback(productId) {
  const btns = document.querySelectorAll('[data-product-id="' + productId + '"]');
  btns.forEach(btn => {
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<span class="check-icon">✓</span> Agregado';
    btn.classList.add('added');
    btn.disabled = true;
    setTimeout(() => {
      btn.innerHTML = originalHTML;
      btn.classList.remove('added');
      btn.disabled = false;
    }, 1600);
  });
}

// ── Render cart page ──
function renderCartPage() {
  const container = document.getElementById('cartContainer');
  if (!container) return;

  const cart = getCart();

  if (!cart.length) {
    container.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🛒</div>
        <h2>Tu carrito está vacío</h2>
        <p>Explora nuestro catálogo de productos herbales artesanales.</p>
        <a href="../productos/" class="btn btn-dark">Ver catálogo</a>
      </div>`;
    return;
  }

  let itemsHTML = '';
  cart.forEach(item => {
    const price = parseInt(item.price) || 0;
    const subtotal = price > 0 ? price * item.quantity : 0;
    itemsHTML += `
      <div class="cart-item">
        <div class="cart-item-img">
          <img src="${item.image}" alt="${item.name}" loading="lazy" onerror="this.src='../assets/images/casa-tapputi-logo.png'">
        </div>
        <div class="cart-item-info">
          <h3>${item.name}</h3>
          <p class="cart-item-price">${item.priceLabel || formatPrice(price)}</p>
        </div>
        <div class="cart-item-qty">
          <button onclick="updateQuantity('${item.id}', ${item.quantity - 1})" aria-label="Restar">−</button>
          <span>${item.quantity}</span>
          <button onclick="updateQuantity('${item.id}', ${item.quantity + 1})" aria-label="Sumar">+</button>
        </div>
        <div class="cart-item-subtotal">
          ${subtotal > 0 ? '$' + subtotal.toLocaleString('es-MX') : '—'}
        </div>
        <button class="cart-item-remove" onclick="removeFromCart('${item.id}')" aria-label="Eliminar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
        </button>
      </div>`;
  });

  const total = getTotal();

  container.innerHTML = `
    <div class="cart-list">
      ${itemsHTML}
    </div>
    <div class="cart-summary">
      <div class="cart-summary-row">
        <span>Subtotal</span>
        <span>${total > 0 ? '$' + total.toLocaleString('es-MX') + ' MXN' : 'A consultar'}</span>
      </div>
      <div class="cart-summary-row cart-total">
        <span>Total</span>
        <span>${total > 0 ? '$' + total.toLocaleString('es-MX') + ' MXN' : 'A consultar'}</span>
      </div>
      <a href="${generateWhatsAppMessage()}" class="btn-wa-checkout" target="_blank" rel="noopener">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        Comprar por WhatsApp
      </a>
      <button onclick="clearCart()" class="btn-clear-cart">Vaciar carrito</button>
    </div>`;
}

function refreshCartUI() {
  renderCartCount();
  if (window.location.pathname.includes('/tienda/carrito')) {
    renderCartPage();
  }
}

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  renderCartCount();
  renderCartPage();
});

// ── Cross-tab sync ──
// El evento 'storage' se dispara en OTRAS pestañas/ventanas cuando
// esta clave de localStorage cambia. La pestaña que hizo el cambio
// NO recibe el evento, así que el flujo local sigue intacto.
window.addEventListener('storage', (e) => {
  if (e.key !== CART_KEY) return;
  refreshCartUI();
});
