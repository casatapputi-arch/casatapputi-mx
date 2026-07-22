/* ============================================================
   Casa Tapputi — Shopping Cart (Medusa API + localStorage)
   Usa la Store API de Medusa v2.16 para gestionar el carrito.
   Mantiene localStorage como caché para UI instantánea y
   resiliencia offline. Checkout vía WhatsApp.
   ============================================================ */

const MEDUSA_URL = 'https://casatapputi-medusa.duckdns.org';
const API_KEY  = 'pk_377afadbf71f64f6027bdb8b13691017648b70f6270ff38e4d9d3961585d2c62';
const CART_ID_KEY = 'casatapputi_cart_id';
const CART_KEY    = 'casatapputi_cart';   // localStorage fallback
const WA_NUMBER   = '525563707034';
const REGION_ID   = 'reg_01KXKKX4D00R5GCSX91T9YE2Q9';

let medusaCart = null;   // cache del último fetch del cart de Medusa

// ── Helpers ──────────────────────────────────────────────
async function medusaFetch(path, opts = {}) {
  const res = await fetch(`${MEDUSA_URL}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'x-publishable-api-key': API_KEY,
      ...(opts.headers || {})
    }
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`Medusa ${res.status}: ${err}`);
  }
  return res.json();
}

// ── Medusa Cart ──────────────────────────────────────────
async function getOrCreateCartId() {
  let cartId = localStorage.getItem(CART_ID_KEY);
  if (cartId) {
    try {
      const data = await medusaFetch(`/store/carts/${cartId}`);
      medusaCart = data.cart;
      return cartId;
    } catch (e) {
      localStorage.removeItem(CART_ID_KEY);
    }
  }
  const data = await medusaFetch('/store/carts', {
    method: 'POST',
    body: JSON.stringify({ region_id: REGION_ID })
  });
  const id = data.cart.id;
  localStorage.setItem(CART_ID_KEY, id);
  medusaCart = data.cart;
  return id;
}

async function fetchMedusaCart() {
  const cartId = localStorage.getItem(CART_ID_KEY);
  if (!cartId) return null;
  try {
    const data = await medusaFetch(`/store/carts/${cartId}`);
    medusaCart = data.cart;
    return medusaCart;
  } catch (e) {
    return null;
  }
}

// ── localStorage (espejo de Medusa) ──────────────────────
function getLocalCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch (e) { return []; }
}
function saveLocalCart(c) { localStorage.setItem(CART_KEY, JSON.stringify(c)); }

// Convierte line items de Medusa al formato del carrito local
function medusaItemsToLocal(items, existingLocal) {
  return items.map(li => {
    const handle = li.variant?.product?.handle || '';
    const id = handle || li.variant_id;
    // PRIORIZAR imagen local (source of truth) sobre la de Medusa
    // Medusa puede tener thumbnails corruptos o desactualizados
    let image = '';
    if (existingLocal) {
      const prev = existingLocal.find(i => i.id === id || i.variantId === li.variant_id);
      if (prev && prev.image) image = prev.image;
    }
    // Solo usar thumbnail de Medusa si no hay imagen local
    if (!image) image = li.variant?.product?.thumbnail || '';
    return {
      id: id,
      variantId: li.variant_id,
      name: li.title,
      price: li.unit_price || 0,
      priceLabel: formatPrice(li.unit_price),
    image: sanitizeImagePath(image),
    quantity: li.quantity
  };
  });
}

// Sincroniza localStorage desde el cart de Medusa (source of truth)
async function syncLocalFromMedusa() {
  try {
    const cart = await fetchMedusaCart();
    if (cart && cart.items) {
      const existing = getLocalCart();
      const merged = medusaItemsToLocal(cart.items, existing);
      saveLocalCart(merged);
      return merged;
    }
  } catch (e) { /* fallback a localStorage */ }
  return null;
}

// ── Public API (misma interfaz que antes) ────────────────
async function addToCart(product) {
  if (!product || !product.id) return;
  if (!product.variantId) {
    console.warn('addToCart: falta variantId, no se sincroniza con Medusa');
    return;
  }

  // 1. Optimistic UI: actualizar localStorage al instante
  const local = getLocalCart();
  const exists = local.find(i => i.id === product.id);
  if (exists) {
    exists.quantity += product.quantity || 1;
  } else {
    local.push({
      id: product.id,
      variantId: product.variantId,
      name: product.name,
      price: product.price || 0,
      priceLabel: product.priceLabel || '',
      image: sanitizeImagePath(product.image || ''),
      quantity: product.quantity || 1
    });
  }
  saveLocalCart(local);
  renderCartCount();
  showAddedFeedback(product.id);

  // 2. Sincronizar con Medusa y actualizar localStorage desde Medusa
  try {
    const cartId = await getOrCreateCartId();
    await medusaFetch(`/store/carts/${cartId}/line-items`, {
      method: 'POST',
      body: JSON.stringify({
        variant_id: product.variantId,
        quantity: product.quantity || 1
      })
    });
    // Refrescar localStorage desde Medusa (source of truth)
    await syncLocalFromMedusa();
  } catch (e) {
    console.warn('Sincronización con Medusa falló, usando carrito local:', e.message);
  }
}

async function removeFromCart(productId) {
  // Guardar referencia ANTES de filtrar (para sync con Medusa)
  const oldCart = getLocalCart();
  const removedItem = oldCart.find(i => i.id === productId);

  // 1. localStorage
  const local = oldCart.filter(i => i.id !== productId);
  saveLocalCart(local);
  refreshCartUI();

  // 2. Medusa — buscar line_item por variant_id del producto eliminado
  try {
    const cart = await fetchMedusaCart();
    if (cart && cart.items && removedItem) {
      const lineItem = cart.items.find(li => li.variant_id === removedItem.variantId);
      if (lineItem) {
        await medusaFetch(`/store/carts/${cart.id}/line-items/${lineItem.id}`, {
          method: 'DELETE'
        });
        const data = await medusaFetch(`/store/carts/${cart.id}`);
        medusaCart = data.cart;
        await syncLocalFromMedusa();
      }
    }
  } catch (e) {
    console.warn('Error al eliminar de Medusa:', e.message);
  }
}

async function updateQuantity(productId, qty) {
  if (qty < 1) return;

  // 1. localStorage
  const local = getLocalCart();
  const item = local.find(i => i.id === productId);
  if (item) item.quantity = qty;
  saveLocalCart(local);
  refreshCartUI();

  // 2. Medusa — reemplazar line item con nueva cantidad
  try {
    const cart = await fetchMedusaCart();
    if (cart && cart.items && item) {
      const lineItem = cart.items.find(li => li.variant_id === item.variantId);
      if (lineItem) {
        // Delete + re-add con nueva cantidad
        await medusaFetch(`/store/carts/${cart.id}/line-items/${lineItem.id}`, {
          method: 'DELETE'
        });
      }
      if (item.variantId) {
        await medusaFetch(`/store/carts/${cart.id}/line-items`, {
          method: 'POST',
          body: JSON.stringify({ variant_id: item.variantId, quantity: qty })
        });
        const data = await medusaFetch(`/store/carts/${cart.id}`);
        medusaCart = data.cart;
        await syncLocalFromMedusa();
      }
    }
  } catch (e) {
    console.warn('Error al actualizar en Medusa:', e.message);
  }
}

function getTotal() {
  return getLocalCart().reduce((sum, i) => sum + ((parseInt(i.price) || 0) * i.quantity), 0);
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  localStorage.removeItem(CART_ID_KEY);
  medusaCart = null;
  refreshCartUI();
}

// ── Sanitizar ruta de imagen (previene images/images/ por bugs upstream) ──
function sanitizeImagePath(path) {
  if (!path) return '';
  return path.replace(/images\/images\//g, 'images/');
}

function formatPrice(p) {
  if (!p || p === 0) return 'A consultar';
  return '$' + parseInt(p).toLocaleString('es-MX') + ' MXN';
}

// ── WhatsApp checkout ────────────────────────────────────
function generateWhatsAppMessage() {
  const local = getLocalCart();
  if (!local.length) return '';

  let msg = '🛒 *Pedido — Casa Tapputi* 🌿\n\n';
  local.forEach(item => {
    const price = parseInt(item.price) || 0;
    const subtotal = price > 0 ? price * item.quantity : 0;
    msg += '• ' + item.name;
    if (item.quantity > 1) msg += ' ×' + item.quantity;
    msg += subtotal > 0
      ? ' — $' + subtotal.toLocaleString('es-MX') + ' MXN\n'
      : ' — *Precio a consultar*\n';
  });
  const total = getTotal();
  if (total > 0) msg += '\n💰 *Total: $' + total.toLocaleString('es-MX') + ' MXN*';
  msg += '\n\n📦 Solicito información de envío/entrega.\n📍 Huerto Roma Verde, CDMX';

  return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg);
}

// ── Product data from DOM ─────────────────────────────────
function getProductData(el) {
  const card = el.closest('.shop-card') || el.closest('.marquee-card');
  if (!card) return null;
  return {
    id: card.dataset.productId,
    variantId: card.dataset.variantId || '',
    name: card.dataset.productName,
    price: parseInt(card.dataset.productPrice) || 0,
    priceLabel: card.dataset.productPriceLabel || '',
    image: card.dataset.productImage || '',
    quantity: 1
  };
}

// ── UI feedback ───────────────────────────────────────────
function showAddedFeedback(productId) {
  document.querySelectorAll('[data-product-id="' + productId + '"]').forEach(btn => {
    const orig = btn.innerHTML;
    btn.innerHTML = '<span class="check-icon">✓</span> Agregado';
    btn.classList.add('added');
    btn.disabled = true;
    setTimeout(() => {
      btn.innerHTML = orig;
      btn.classList.remove('added');
      btn.disabled = false;
    }, 1600);
  });
}

// ── Cart count badge ──────────────────────────────────────
function renderCartCount() {
  const cart = getLocalCart();
  const count = cart.reduce((sum, i) => sum + i.quantity, 0);
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = count;
    el.setAttribute('aria-label', count + ' producto' + (count !== 1 ? 's' : '') + ' en el carrito');
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

// ── Render cart page (tienda/carrito.html) ─────────────────
async function renderCartPage() {
  const container = document.getElementById('cartContainer');
  if (!container) return;

  // Siempre sincronizar desde Medusa primero (source of truth)
  let items = await syncLocalFromMedusa();
  if (!items || !items.length) {
    items = getLocalCart();
  }

  if (!items.length) {
    container.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🌿</div>
        <h2>Tu carrito está vacío</h2>
        <p>Explora nuestro catálogo de productos herbales artesanales.<br>Hechos a mano en Huerto Roma Verde, CDMX.</p>
        <a href="../productos/" class="btn-continue-shopping">← Descubrir productos</a>
      </div>`;
    return;
  }

  let itemsHTML = '';
  items.forEach(item => {
    const price = parseInt(item.price) || 0;
    const subtotal = price > 0 ? price * item.quantity : 0;
    itemsHTML += `
      <div class="cart-item">
        <div class="cart-item-img">
          <img src="${item.image}" alt="${item.name}" loading="lazy"
               onerror="this.src='../assets/images/casa-tapputi-logo.webp'">
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
    <div class="cart-list">${itemsHTML}</div>
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
      <div id="mp-button-container" style="margin-top:12px"></div>
      <button onclick="clearCart()" class="btn-clear-cart">Vaciar carrito</button>
    </div>`;

  // Renderizar botón de MercadoPago dentro del summary recién inyectado
  await renderMercadoPagoIfAvailable();
}

async function renderMercadoPagoIfAvailable() {
  if (typeof renderBotonMercadoPago !== 'function') {
    await loadCheckoutJS();
  }
  if (typeof renderBotonMercadoPago === 'function') {
    renderBotonMercadoPago();
  }
}

async function refreshCartUI() {
  renderCartCount();
  if (window.location.pathname.includes('/tienda/carrito')) {
    await renderCartPage();
  }
}

// ── Dynamic load de checkout.js (bypassea caché del HTML) ─
let checkoutLoaded = false;
let checkoutLoading = null;

function loadCheckoutJS() {
  if (checkoutLoaded) return Promise.resolve();
  if (checkoutLoading) return checkoutLoading;

  checkoutLoading = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = '../assets/js/checkout.js?v=' + Date.now();
    script.onload = () => {
      checkoutLoaded = true;
      checkoutLoading = null;
      resolve();
    };
    script.onerror = () => {
      checkoutLoading = null;
      resolve(); // no bloquea si falla
    };
    document.head.appendChild(script);
  });
  return checkoutLoading;
}

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  renderCartCount();
  if (window.location.pathname.includes('/tienda/carrito')) {
    await renderCartPage();
  }
  // Precargar cart de Medusa en background
  if (localStorage.getItem(CART_ID_KEY)) {
    fetchMedusaCart().catch(() => {});
  }
});

// Cross-tab sync
window.addEventListener('storage', (e) => {
  if (e.key === CART_KEY || e.key === CART_ID_KEY) refreshCartUI();
});
