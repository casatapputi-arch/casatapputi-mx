/* ============================================================
   Casa Tapputi — Shopping Cart (Medusa API + localStorage)
   Usa la Store API de Medusa v2.16 para gestionar el carrito.
   Mantiene localStorage como caché para UI instantánea y
   resiliencia offline. Checkout vía WhatsApp.
   ============================================================ */

const MEDUSA_URL = 'https://medusa.casatapputi.com.mx';
const API_KEY  = 'pk_377afadbf71f64f6027bdb8b13691017648b70f6270ff38e4d9d3961585d2c62';
const CART_ID_KEY = 'casatapputi_cart_id';
const CART_KEY    = 'casatapputi_cart';   // localStorage fallback
const WA_NUMBER   = '525563707034';
const REGION_ID   = 'reg_01KXKKX4D00R5GCSX91T9YE2Q9';

let medusaCart = null;   // cache del último fetch del cart de Medusa

// ── Cupón de descuento ───────────────────────────────────
const COUPONS = {
  'BIENVENIDA': { type: 'percent', value: 10, label: '10% de descuento' },
  'HERBOLARIA': { type: 'percent', value: 15, label: '15% de descuento' },
  'TAPPUTI': { type: 'percent', value: 20, label: '20% de descuento' },
  'ENVIOGRATIS': { type: 'fixed', value: 50, label: '$50 MXN de descuento' }
};
let appliedCoupon = null; // { code, type, value, label }

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
    // PRIORIZAR datos locales (source of truth) sobre Medusa
    let image = '';
    let name = li.title;
    let price = li.unit_price || 0;
    let priceLabel = formatPrice(li.unit_price);
    if (existingLocal) {
      const prev = existingLocal.find(i => i.id === id || i.variantId === li.variant_id);
      if (prev) {
        // Preservar imagen local (Medusa puede tener thumbnails corruptos)
        if (prev.image) image = prev.image;
        // Preservar nombre local si tiene info de variedades
        if (prev.name && prev.name !== li.title && prev.name.length > li.title.length) {
          name = prev.name;
        }
        // Preservar precio local si Medusa devuelve 0 (evita que el subtotal desaparezca)
        if (!price && prev.price) {
          price = prev.price;
          priceLabel = prev.priceLabel || formatPrice(prev.price);
        }
      }
    }
    // Solo usar thumbnail de Medusa si no hay imagen local
    if (!image) image = li.variant?.product?.thumbnail || '';
    return {
      id: id,
      variantId: li.variant_id,
      name: name,
      price: price,
      priceLabel: priceLabel,
    image: sanitizeImagePath(image),
    quantity: li.quantity
  };
  });
}

// Sincroniza localStorage desde el cart de Medusa + preserva items locales no sincronizados
async function syncLocalFromMedusa() {
  try {
    const cart = await fetchMedusaCart();
    if (cart && cart.items) {
      const existing = getLocalCart();
      const medusaItems = medusaItemsToLocal(cart.items, existing);
      const medusaMap = new Map(medusaItems.map(i => [i.id, i]));
      // Preservar orden local (evita que items se cambien de lugar)
      // Items existentes mantienen su posicion; nuevos items de Medusa se agregan al final
      const merged = [];
      for (const item of existing) {
        if (medusaMap.has(item.id)) {
          merged.push(medusaMap.get(item.id));
          medusaMap.delete(item.id);
        } else {
          merged.push(item);
        }
      }
      // Agregar items de Medusa que no estaban localmente
      for (const item of medusaMap.values()) {
        merged.push(item);
      }
      saveLocalCart(merged);
      return merged;
    }
  } catch (e) { /* fallback a localStorage */ }
  return null;
}

// ── Mutex para serializar sync con Medusa (evita race condition) ──
let _addToCartLock = Promise.resolve();

// ── Public API (misma interfaz que antes) ────────────────
async function addToCart(product) {
  if (!product || !product.id) return;
  if (!product.variantId) {
    console.warn('addToCart: falta variantId, no se sincroniza con Medusa');
    return;
  }

  // 1. Optimistic UI: actualizar localStorage al instante (fuera del lock)
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

  // 2. Serializar sync con Medusa para evitar race condition
  const prevLock = _addToCartLock;
  let releaseLock;
  _addToCartLock = new Promise(resolve => { releaseLock = resolve; });
  await prevLock;

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
    console.warn('Sincronizacion con Medusa fallo, usando carrito local:', e.message);
  } finally {
    releaseLock();
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
        refreshCartUI();
      }
    }
  } catch (e) {
    console.warn('Error al actualizar en Medusa:', e.message);
  }
}

function getTotal() {
  const subtotal = getLocalCart().reduce((sum, i) => sum + (cleanPrice(i.price) * i.quantity), 0);
  return applyDiscount(subtotal);
}

function getSubtotal() {
  return getLocalCart().reduce((sum, i) => sum + (cleanPrice(i.price) * i.quantity), 0);
}

function getDiscountAmount() {
  if (!appliedCoupon) return 0;
  const subtotal = getSubtotal();
  if (appliedCoupon.type === 'percent') {
    return Math.round(subtotal * appliedCoupon.value / 100);
  }
  return appliedCoupon.value;
}

function applyDiscount(subtotal) {
  if (!appliedCoupon) return subtotal;
  const discount = getDiscountAmount();
  return Math.max(0, subtotal - discount);
}

async function applyCouponCode(code) {
  const upper = code.trim().toUpperCase();
  const coupon = COUPONS[upper];
  if (!coupon) return { success: false, msg: 'Cupón no válido' };
  if (appliedCoupon && appliedCoupon.code === upper) return { success: false, msg: 'Este cupón ya está aplicado' };
  appliedCoupon = { code: upper, ...coupon };
  await refreshCartUI();
  return { success: true, msg: '¡Cupón aplicado! ' + coupon.label };
}

function clearCoupon() {
  appliedCoupon = null;
  refreshCartUI();
}

async function applyCouponFromInput() {
  const input = document.getElementById('couponInput');
  if (!input) return;
  const result = await applyCouponCode(input.value);
  const msgEl = document.getElementById('couponMsg');
  if (msgEl) {
    msgEl.textContent = result.msg;
    msgEl.className = 'cart-coupon-msg ' + (result.success ? 'success' : 'error');
  }
  if (result.success) input.value = '';
}

function clearCart() {
  appliedCoupon = null;
  localStorage.removeItem(CART_KEY);
  localStorage.removeItem(CART_ID_KEY);
  medusaCart = null;
  refreshCartUI();
}

function checkoutWhatsApp(e) {
  e.preventDefault();
  const waUrl = generateWhatsAppMessage();
  window.open(waUrl, '_blank', 'noopener');
  clearCart();
  setTimeout(() => { window.location.href = 'gracias-wa.html'; }, 500);
}

// ── Sanitizar ruta de imagen (previene images/images/ por bugs upstream) ──
function sanitizeImagePath(path) {
  if (!path) return '';
  return path.replace(/images\/images\//g, 'images/');
}

// ── Helper: convierte precio con/sin comas a número entero ──
function cleanPrice(p) {
  return parseInt(String(p || 0).replace(/,/g, '')) || 0;
}

function formatPrice(p) {
  if (!p || p === 0) return 'A consultar';
  return '$' + cleanPrice(p).toLocaleString('es-MX') + ' MXN';
}

// ── WhatsApp checkout ────────────────────────────────────
function generarRefPedido() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = '';
  for (let i = 0; i < 6; i++) ref += chars.charAt(Math.floor(Math.random() * chars.length));
  return 'CT' + ref;
}

function trackWAEvent(action, label) {
  if (typeof plausible === 'function') {
    plausible('WhatsApp', { props: { action: action, label: label } });
  }
}

function generateWhatsAppMessage() {
  const local = getLocalCart();
  if (!local.length) return '';

  const ref = generarRefPedido();
  const now = new Date();
  const fecha = now.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  const hora = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  let msg = '🛒 *PEDIDO NUEVO — Casa Tapputi* 🌿\n';
  msg += '📋 Ref: ' + ref + '\n';
  msg += '📅 ' + fecha + ' · ' + hora + '\n\n';
  msg += '*Productos solicitados:*\n';
  local.forEach(item => {
    const price = cleanPrice(item.price);
    const subtotal = price > 0 ? price * item.quantity : 0;
    msg += '• ' + item.name;
    if (item.variantId) msg += ' (var:' + item.variantId.slice(-6) + ')';
    if (item.quantity > 1) msg += ' ×' + item.quantity;
    msg += subtotal > 0
      ? ' — $' + subtotal.toLocaleString('es-MX') + ' MXN\n'
      : ' — *Precio a consultar*\n';
  });
  const subtotalWA = getSubtotal();
  const totalWA = getTotal();
  const discountWA = getDiscountAmount();
  if (subtotalWA > 0) {
    if (discountWA > 0) {
      msg += '\n💵 Subtotal: $' + subtotalWA.toLocaleString('es-MX') + ' MXN';
      msg += '\n🎫 Cupón ' + appliedCoupon.code + ' (' + appliedCoupon.label + '): − $' + discountWA.toLocaleString('es-MX') + ' MXN';
    }
    msg += '\n💰 *Total: $' + totalWA.toLocaleString('es-MX') + ' MXN*';
  }
  msg += '\n\n📦 Solicito información de envío y pago.\n📍 Huerto Roma Verde, CDMX\n\n🧾 Ref: ' + ref;

  trackWAEvent('checkout_cart', 'cart_' + ref);
  return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg);
}

// ── Product data from DOM ─────────────────────────────────
function getProductData(el) {
  const card = el.closest('.shop-card') || el.closest('.specimen-card') || el.closest('.marquee-card');
  if (!card) return null;
  return {
    id: card.dataset.productId,
    variantId: card.dataset.variantId || '',
    name: card.dataset.productName,
    price: cleanPrice(card.dataset.productPrice),
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
    // Bounce animation
    el.classList.remove('pop');
    void el.offsetWidth; // reflow trigger
    if (count > 0) el.classList.add('pop');
  });
}

// ── Render cart page (tienda/carrito.html) ─────────────────
// ── CSS para input de cantidad en el carrito (se inyecta una vez) ──
(function injectCartQtyCSS() {
  if (document.getElementById('cartQtyCSS')) return;
  const style = document.createElement('style');
  style.id = 'cartQtyCSS';
  style.textContent = `
    .cart-qty-input {
      width:44px; text-align:center; font-size:.9rem; font-family:inherit;
      background:rgba(255,255,255,.04); border:1px solid rgba(239,230,214,.12);
      border-radius:4px; padding:4px; color:inherit; outline:none;
      -moz-appearance:textfield;
    }
    .cart-qty-input::-webkit-inner-spin-button,
    .cart-qty-input::-webkit-outer-spin-button { -webkit-appearance:none; margin:0; }
  `;
  document.head.appendChild(style);
})();

async function renderCartPage() {
  const container = document.getElementById('cartContainer');
  if (!container) return;

  // Usar localStorage primero (siempre tiene los datos reales)
  let items = getLocalCart();
  // Si esta vacio, intentar recuperar desde Medusa como fallback
  if (!items || !items.length) {
    items = await syncLocalFromMedusa();
    if (!items || !items.length) {
      items = [];
    }
  } else {
    // Background sync: esperar a que addToCart pendientes terminen, luego sync
    _addToCartLock.then(() => syncLocalFromMedusa()).catch(() => {});
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
    const price = cleanPrice(item.price);
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
          <input type="number" class="cart-qty-input" value="${item.quantity}" min="1" max="999"
                 onchange="updateQuantity('${item.id}', parseInt(this.value) || 1)"
                 onfocus="this.select()" aria-label="Cantidad">
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

  const subtotal = getSubtotal();
  const total = getTotal();
  const discount = getDiscountAmount();
  container.innerHTML = `
    <div class="cart-list">${itemsHTML}</div>
    <div class="cart-coupon">
      <input type="text" id="couponInput" placeholder="¿Tienes un cupón?" aria-label="Código de cupón" maxlength="30"
             onkeydown="if(event.key==='Enter')document.getElementById('btnApplyCoupon').click()">
      <button class="btn-coupon" id="btnApplyCoupon" onclick="applyCouponFromInput()">Aplicar</button>
    </div>
    <div class="cart-coupon-msg" id="couponMsg"></div>
    <div class="cart-summary">
      <div class="cart-summary-row">
        <span>Subtotal</span>
        <span>${subtotal > 0 ? '$' + subtotal.toLocaleString('es-MX') + ' MXN' : 'A consultar'}</span>
      </div>
      ${discount > 0 ? `
      <div class="cart-summary-row cart-discount-row">
        <span>Descuento${appliedCoupon ? ' (' + appliedCoupon.label + ')' : ''}</span>
        <span>− $${discount.toLocaleString('es-MX')} MXN</span>
      </div>` : ''}
      <div class="cart-summary-row cart-total">
        <span>Total</span>
        <span>${total > 0 ? '$' + total.toLocaleString('es-MX') + ' MXN' : 'A consultar'}</span>
      </div>
      <a href="${generateWhatsAppMessage()}" class="btn-wa-checkout" target="_blank" rel="noopener" onclick="checkoutWhatsApp(event)">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        Comprar por WhatsApp
      </a>
      <div id="mp-button-container" style="margin-top:12px"></div>
      ${appliedCoupon ? `<button onclick="clearCoupon()" style="background:none;border:0;color:var(--tinta-suave);cursor:pointer;font-size:.78rem;margin-top:8px;text-decoration:underline">Quitar cupón</button>` : ''}
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

// ── WhatsApp tracking global (event delegation) ───────────
document.addEventListener('click', (e) => {
  const wa = e.target.closest('.wa-float, .btn-wa-checkout, .btn-wa-message');
  if (wa && typeof plausible === 'function') {
    const label = wa.classList.contains('wa-float') ? 'flotante'
      : wa.classList.contains('btn-wa-checkout') ? 'checkout'
      : 'producto';
    plausible('WhatsApp', { props: { action: 'click_' + label, href: wa.getAttribute('href') || '' } });
  }
});