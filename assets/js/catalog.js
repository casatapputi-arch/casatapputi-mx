/* ============================================================
   Casa Tapputi — Catalog Sync (Medusa API → Frontend)
   Sincroniza el catálogo de productos desde Medusa y renderiza
   la grilla (productos/) y el carrusel (index.html) dinámicamente.
   ============================================================ */

const CATALOG_URL  = 'https://casatapputi-medusa.duckdns.org';
const CATALOG_KEY  = 'pk_377afadbf71f64f6027bdb8b13691017648b70f6270ff38e4d9d3961585d2c62';
const CATALOG_CACHE_KEY = 'ct_catalog';
const CATALOG_CACHE_TTL = 15 * 60 * 1000; // 15 minutos

// ── Metadata por producto (no disponible en Store API) ────
// La API de Medusa Store no expone precios ni categorías en el endpoint
// de productos. Este objeto complementa lo que el API sí entrega:
// título, handle, descripción, variantes e imágenes.
const PRODUCT_META = {
  'esencia-miel':       { cat:'esencias', price:400,  priceLabel:'desde $400 MXN',     img:'assets/images/esencias-amber.jpg',       desc:'Extraída por alambique de floración natural. Favorece la producción de dopamina y oxitocina; promueve relajación y concentración. Uso corporal o difusor.' },
  'esencias-naturales': { cat:'esencias', price:400,  priceLabel:'desde $400 MXN',     img:'assets/images/esencias-naturales.jpg',   desc:'18 aromas por alambique: Violetas, Nardo, Mandarina, Menta, Rosas, Canela, Lavanda, Eucalipto, Romero, Jazmín, Sándalo, Geranio, Limón, Bergamota, Mirra, Pino, Tabaco, Lilas. Uso corporal o difusor.' },
  'perfume-solido':     { cat:'esencias', price:80,   priceLabel:'desde $80 MXN',      img:'assets/images/perfume-solido.jpg',       desc:'Cera de abeja, aceite de oliva y aceites esenciales botánicos. Nutre la piel mientras perfuma. 18 aromas disponibles.' },
  'lagrimas-rosas':     { cat:'esencias', price:100,  priceLabel:'desde $100 MXN',     img:'assets/images/lagrimas-rosas.jpg',       desc:'Resina sagrada para saumerios. Limpia el aire, crea un ambiente de calma y armonía.' },
  'oleo-masaje':        { cat:'corporal', price:150,  priceLabel:'desde $150 MXN',     img:'assets/images/oleo-masaje.jpg',          desc:'Fusión de ingredientes naturales y esencias seleccionadas. Nutre la piel y ofrece beneficios emocionales.' },
  'roll-on':            { cat:'corporal', price:200,  priceLabel:'$200 MXN',           img:'assets/images/roll-on.jpg',              desc:'Menta, Pino y Eucalipto. Menta despeja la mente; Pino equilibra las emociones; Eucalipto purifica y facilita la respiración profunda. 15 ml.' },
  'miel-melipona':      { cat:'corporal', price:350,  priceLabel:'$350 MXN',           img:'assets/images/miel-melipona.jpg',        desc:'Recolectada por abejas sin aguijón. Tesoro sagrado ancestral de poderosas propiedades curativas.' },
  'friega-cannabis':    { cat:'corporal', price:90,   priceLabel:'desde $90 MXN',      img:'assets/images/friega-cannabis.jpg',      desc:'Sinergia de cannabis, veneno de hormiga roja y plantas medicinales. Analgésico profundo y antiinflamatorio.' },
  'chilcuague':         { cat:'corporal', price:100,  priceLabel:'$100 MXN',           img:'assets/images/chilcuague.jpg',           desc:'Spray oral de raíz medicinal. Acción antibacteriana y antiinflamatoria sobre encías, mucosas y tejidos orales. 30 ml.' },
  'jabones':            { cat:'corporal', price:90,   priceLabel:'$90 MXN / pz',       img:'assets/images/jabones-herbales.jpg',     desc:'7 variedades con aceite de coco: Miel & Avena, Menta & Romero, Manzanilla & Bergamota, Manzana & Canela, Lavanda & Violeta, Rosas & Anís Estrella, Carbón Activado.' },
  'agua-rosas':         { cat:'facial',   price:150,  priceLabel:'$150 MXN',           img:'assets/images/agua-rosas.jpg',           desc:'Tónico natural de pétalos frescos. Calma, hidrata y equilibra la piel. Sin alcohol ni químicos agresivos. 30 ml.' },
  'gel-rosas':          { cat:'facial',   price:150,  priceLabel:'$150 MXN',           img:'assets/images/gel-rosas.jpg',            desc:'Hidratante con extracto de pétalos frescos. Textura ligera de rápida absorción. Propiedades antioxidantes. 100 ml.' },
  'gel-cafe':           { cat:'facial',   price:150,  priceLabel:'$150 MXN',           img:'assets/images/mascarilla-cafe.jpg',      desc:'Tratamiento revitalizante. La cafeína estimula la circulación y despierta la piel. Tonifica, refresca y deja el rostro suave y luminoso. 30 ml.' },
  'pomada-calendula':   { cat:'facial',   price:100,  priceLabel:'desde $100 MXN',     img:'assets/images/pomada-calendula.jpg',     desc:'Cera de abeja y lípido vegetal. Antiinflamatoria y cicatrizante para heridas menores, quemaduras leves e irritaciones.' },
  'pomada-cannabis':    { cat:'facial',   price:100,  priceLabel:'desde $100 MXN',     img:'assets/images/pomada-cannabis.jpg',      desc:'Sinergia de cannabis, veneno de hormiga roja y plantas medicinales. Para dolores musculares y articulares.' },
  'salsa-matcha':       { cat:'cocina',   price:200,  priceLabel:'$200 MXN / pz',      img:'assets/images/salsa-matcha.jpg',         desc:'4 variedades con semillas, chiles secos e ingredientes de temporada: Chapulines, Frutos Rojos, Ajo y Habanero.' },
  'tisanas':            { cat:'cocina',   price:1300, priceLabel:'$1,300 MXN / kg',    img:'assets/images/t13-01264.jpg',            desc:'Mezclas con ingredientes naturales y orgánicos del jardín medicinal de Huerto Roma Verde. Sin aditivos. 1 kg.' },
  'leche-dorada':       { cat:'cocina',   price:0,    priceLabel:'Consultar precio',   img:'assets/images/leche-dorada.jpg',         desc:'Mezcla ancestral de cúrcuma, pimienta negra, clavo y especias. Potente antiinflamatoria y reconfortante.' },
  'terrarios':          { cat:'hogar',    price:0,    priceLabel:'Medidas personalizadas', img:'assets/images/terrarios-vidrio.jpg',  desc:'Piezas decorativas de vidrio en medidas personalizadas: candeleros, joyeros, aparadores y mostradores.' },
  'talabarteria':       { cat:'estilo',   price:0,    priceLabel:'Piezas personalizadas',  img:'assets/images/talabarteria.jpg',      desc:'Piel reciclada transformada en piezas elegantes y funcionales: cinturones, pulseras, carteras, mochilas.' }
};

// Catálogo cacheado en memoria
let _catalog = null;

// ── Fetch ─────────────────────────────────────────────────
async function catalogFetch(path, opts = {}) {
  const res = await fetch(`${CATALOG_URL}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'x-publishable-api-key': CATALOG_KEY,
      ...(opts.headers || {})
    }
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${err}`);
  }
  return res.json();
}

// ── Obtener catálogo (con cache) ──────────────────────────
async function fetchCatalog(force = false) {
  if (_catalog && !force) return _catalog;

  // Intentar sessionStorage
  if (!force) {
    try {
      const raw = sessionStorage.getItem(CATALOG_CACHE_KEY);
      if (raw) {
        const { data, ts } = JSON.parse(raw);
        if (Date.now() - ts < CATALOG_CACHE_TTL) {
          _catalog = data;
          return _catalog;
        }
      }
    } catch (e) { /* ignorar */ }
  }

  try {
    const data = await catalogFetch('/store/products?limit=50');
    _catalog = data.products || [];
    try {
      sessionStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify({
        data: _catalog,
        ts: Date.now()
      }));
    } catch (e) { /* ignorar */ }
    return _catalog;
  } catch (e) {
    console.warn('No se pudo cargar el catálogo de Medusa:', e.message);
    return [];
  }
}

// ── Helper: enriquecer producto con metadata local ────────
function enrichProduct(p) {
  const meta = PRODUCT_META[p.handle] || {};
  const variants = p.variants || [];
  const single = variants.length === 1;
  const firstVariant = variants[0] || {};

  return {
    id: p.handle,
    title: p.title,
    handle: p.handle,
    description: p.description || meta.desc || '',
    subtitle: p.subtitle || '',
    thumbnail: p.thumbnail || '',  // URL absoluta de Medusa (siempre funciona)
    localImg: meta.img || '',       // fallback local (se resuelve con assetPath)
    cat: meta.cat || 'todos',
    price: meta.price || 0,
    priceLabel: meta.priceLabel || 'Consultar precio',
    variants: variants,
    single: single,
    defaultVariantId: firstVariant.id || '',
    detailUrl: 'productos/' + p.handle + '/'
  };
}

// ── Helpers de rutas (para páginas en distintos niveles) ──
function assetPath() {
  if (window.location.pathname.includes('/productos/') && !window.location.pathname.endsWith('/productos/')) {
    return '../../assets/';   // desde productos/handle/index.html
  }
  if (window.location.pathname.includes('/productos')) {
    return '../assets/';       // desde productos/index.html
  }
  return 'assets/';            // desde index.html
}

function productoUrl(handle) {
  if (window.location.pathname.includes('/productos/') && !window.location.pathname.endsWith('/productos/')) {
    return '../' + handle + '/';   // desde productos/handle/ → ../esencia-miel/
  }
  if (window.location.pathname.includes('/productos')) {
    return handle + '/';           // desde productos/ → esencia-miel/
  }
  return 'productos/' + handle + '/';  // desde raíz
}

// ── Render tarjeta de shop grid ───────────────────────────
function renderShopCard(p, assets) {
  const hasVariants = p.variants && p.variants.length > 1;
  const variantId = p.defaultVariantId;
  // Preferir thumbnail de Medusa (URL absoluta); fallback a imagen local con ruta corregida
  const img = p.thumbnail || (p.localImg ? assets + p.localImg.replace(/^assets\//, '') : (assets + 'images/casa-tapputi-logo.png'));
  // Para data-product-image, usar la local (el carrito la necesita como fallback display)
  const dataImg = p.localImg ? assets + p.localImg.replace(/^assets\//, '') : img;

  let actionHtml;
  if (hasVariants) {
    actionHtml = `<a href="${productoUrl(p.handle)}" class="btn btn-add-cart shop-cta">👁️ Ver opciones</a>`;
  } else {
    actionHtml = `<button class="btn btn-add-cart shop-cta"
      data-product-id="${p.id}"
      onclick="addToCart(getProductData(this))">🛒 Agregar al carrito</button>`;
  }

  return `
    <article class="shop-card"
      data-cat="${p.cat}"
      data-product-id="${p.id}"
      ${variantId ? `data-variant-id="${variantId}"` : ''}
      data-product-name="${p.title}"
      data-product-price="${p.price}"
      data-product-price-label="${p.priceLabel}"
      data-product-image="${dataImg}">
      <img src="${img}" alt="${p.title}" loading="lazy"
           onerror="this.src='${assets}images/casa-tapputi-logo.png'">
      <div class="shop-body">
        <h3><a href="${productoUrl(p.handle)}">${p.title}</a></h3>
        <p class="shop-desc">${p.description || ''}</p>
        <span class="shop-price">${p.priceLabel}</span>
        ${actionHtml}
      </div>
    </article>`;
}

// ── Render grilla de productos ────────────────────────────
async function renderShopGrid(containerId) {
  const grid = document.getElementById(containerId || 'shopGrid');
  if (!grid) return;

  grid.innerHTML = '<div class="catalog-loading" style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--clay)">Cargando catálogo…</div>';

  const products = await fetchCatalog();
  if (!products.length) {
    grid.innerHTML = '<div class="catalog-error" style="grid-column:1/-1;text-align:center;padding:2rem">No se pudo cargar el catálogo. <a href=".">Reintentar</a></div>';
    return;
  }

  const assets = assetPath();
  const enriched = products.map(enrichProduct);

  // Orden: primero los que tienen categoría conocida, luego el resto
  enriched.sort((a, b) => {
    const order = ['esencias','corporal','facial','cocina','hogar','estilo','todos'];
    return order.indexOf(a.cat) - order.indexOf(b.cat);
  });

  grid.innerHTML = enriched.map(p => renderShopCard(p, assets)).join('');
}

// ── Render carrusel (marquee) ─────────────────────────────
async function renderMarquee(containerSelector) {
  const inner = document.querySelector(containerSelector || '.marquee-inner');
  if (!inner) return;

  const products = await fetchCatalog();
  if (!products.length) {
    // Silencioso: si falla la API, el carrusel queda vacío pero la sección sigue visible
    console.warn('Catálogo no disponible para el carrusel');
    return;
  }

  const assets = assetPath();
  const enriched = products.map(enrichProduct);

  function cardHTML(p, withButton) {
    // Preferir thumbnail de Medusa (URL absoluta); fallback a imagen local
    const img = p.thumbnail || (p.localImg ? assets + p.localImg.replace(/^assets\//, '') : (assets + 'images/casa-tapputi-logo.png'));
    const dataImg = p.localImg ? assets + p.localImg.replace(/^assets\//, '') : img;
    const vid = p.defaultVariantId;
    const btnAttrs = withButton ? ` data-product-id="${p.id}" data-variant-id="${vid}" data-product-name="${p.title}" data-product-price="${p.price}" data-product-price-label="${p.priceLabel}" data-product-image="${dataImg}"` : '';
    const btn = withButton
      ? `<button class="marquee-add" onclick="addToCart(getProductData(this));event.preventDefault();event.stopPropagation()" aria-label="Agregar al carrito">+</button>`
      : '';
    const aria = withButton ? '' : ' aria-hidden="true"';

    return `<a href="${productoUrl(p.handle)}" class="marquee-card"${btnAttrs}${aria}><img src="${img}" alt="${p.title}" loading="lazy"><span>${p.title}${btn}</span></a>`;
  }

  // Primera vuelta: con data attributes y botones
  // Segunda vuelta: sin botones para loop seamless
  inner.innerHTML = enriched.map(p => cardHTML(p, true)).join('')
    + enriched.map(p => cardHTML(p, false)).join('');

  // LQIP Blur-Up: main.js ya corrió su querySelectorAll('.marquee-card img')
  // en DOMContentLoaded, antes de que este fetch async insertara estas imágenes.
  // Sin esto, .loaded nunca se agrega y el blur(12px) de main.css se queda para siempre.
  inner.querySelectorAll('.marquee-card img').forEach(img => {
    if (img.complete) {
      img.classList.add('loaded');
    } else {
      img.addEventListener('load', () => img.classList.add('loaded'));
      img.addEventListener('error', () => img.classList.add('loaded'));
    }
  });
}

// ── Detectar y renderizar automáticamente ─────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const path = window.location.pathname;

  // Shop grid (productos/index.html o productos/)
  if (document.getElementById('shopGrid')) {
    await renderShopGrid('shopGrid');
  }

  // Marquee carrusel (index.html)
  if (document.querySelector('.marquee-inner')) {
    await renderMarquee('.marquee-inner');
  }
});
