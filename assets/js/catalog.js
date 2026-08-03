/* ============================================================
   Casa Tapputi — Catalog Sync (Medusa API → Frontend)
   Sincroniza el catálogo de productos desde Medusa y renderiza
   la grilla (productos/) y el carrusel (index.html) dinámicamente.
   ============================================================ */

const CATALOG_URL  = 'https://medusa.casatapputi.com.mx';
const CATALOG_KEY  = 'pk_377afadbf71f64f6027bdb8b13691017648b70f6270ff38e4d9d3961585d2c62';
const CATALOG_CACHE_KEY = 'ct_catalog';
const CATALOG_CACHE_TTL = 15 * 60 * 1000; // 15 minutos

// ── Metadata por producto (no disponible en Store API) ────
// La API de Medusa Store no expone precios ni categorías en el endpoint
// de productos. Este objeto complementa lo que el API sí entrega:
// título, handle, descripción, variantes e imágenes.
const PRODUCT_META = {
  'esencia-miel':       { cat:'esencias', price:100,  priceLabel:'desde $100 MXN',    img:'assets/images/esencias-amber.webp',      desc:'Extraída por alambique de floración natural. Favorece dopamina y oxitocina; promueve relajación y concentración.', latin:'Apis mellifera',              usage:'Aromaterapia' },
  'esencias-naturales': { cat:'esencias', price:400,  priceLabel:'desde $400 MXN',    img:'assets/images/esencias-naturales.webp',  desc:'18 aromas por alambique: Violetas, Nardo, Mandarina, Menta, Rosas, Canela, Lavanda, Eucalipto, Romero, Jazmín, Sándalo, Geranio, Limón, Bergamota, Mirra, Pino, Tabaco, Lilas.', latin:'(Species variae)',          usage:'Aromaterapia' },
  'perfume-solido':     { cat:'esencias', price:200,  priceLabel:'$200 MXN',          img:'assets/images/perfume-solido.webp',      desc:'Cera de abeja, aceite de oliva y aceites esenciales botánicos. Nutre la piel mientras perfuma. 18 aromas.',            latin:'Rosa damascena · Santalum', usage:'Fragancia personal' },
  'lagrimas-rosas':     { cat:'esencias', price:80,   priceLabel:'desde $80 MXN',     img:'assets/images/lagrimas-rosas.webp',      desc:'Resina sagrada para saumerios. Limpia el aire, crea un ambiente de calma y armonía. 5 gr / 10 gr.',                    latin:'Rosa damascena',             usage:'Saumerio' },
  'oleo-masaje':        { cat:'corporal', price:150,  priceLabel:'desde $150 MXN',    img:'assets/images/oleo-masaje.webp',         desc:'Fusión de ingredientes naturales y esencias seleccionadas. Nutre la piel y ofrece beneficios emocionales.',              latin:'Olea europaea · Lavandula',  usage:'Masaje corporal' },
  'roll-on':            { cat:'corporal', price:200,  priceLabel:'$200 MXN',          img:'assets/images/roll-on.webp',             desc:'Menta, Pino y Eucalipto. Despeja la mente, equilibra emociones y facilita la respiración profunda. 15 ml.',              latin:'Mentha piperita · Pinus',    usage:'Respiratorio' },
  'miel-melipona':      { cat:'corporal', price:350,  priceLabel:'$350 MXN',          img:'assets/images/miel-melipona.webp',       desc:'Recolectada por abejas sin aguijón. Tesoro sagrado ancestral de poderosas propiedades curativas.',                       latin:'Melipona beecheii',          usage:'Nutritivo' },
  'friega-cannabis':    { cat:'corporal', price:120,  priceLabel:'$120 MXN',          img:'assets/images/friega-cannabis.webp',     desc:'Sinergia de cannabis, veneno de hormiga roja y plantas medicinales. Analgésico profundo y antiinflamatorio. 60 ml.',        latin:'Cannabis sativa',            usage:'Analgésico' },
  'chilcuague':         { cat:'corporal', price:100,  priceLabel:'$100 MXN',          img:'assets/images/chilcuague.webp',          desc:'Spray oral de raíz medicinal. Acción antibacteriana y antiinflamatoria sobre encías, mucosas y tejidos orales. 30 ml.',   latin:'Heliopsis longipes',         usage:'Salud bucal' },
  'jabones':            { cat:'corporal', price:90,   priceLabel:'desde $90 MXN',     img:'assets/images/jabones-herbales.webp',    desc:'4 variedades con aceite de coco: Menta Romero, Miel Avena, Violetas Lavanda y Jamaica Mandarina. Paquetes desde 1 hasta 12 pzas.', latin:'(Species variae)', usage:'Limpieza corporal' },
  'agua-rosas':         { cat:'facial',   price:150,  priceLabel:'$150 MXN',          img:'assets/images/agua-rosas.webp',          desc:'Tónico natural de pétalos frescos. Calma, hidrata y equilibra la piel. Sin alcohol ni químicos agresivos. 30 ml.',        latin:'Rosa damascena',             usage:'Tónico facial' },
  'gel-rosas':          { cat:'facial',   price:150,  priceLabel:'$150 MXN',          img:'assets/images/gel-rosas.webp',           desc:'Hidratante con extracto de pétalos frescos. Textura ligera de rápida absorción. Propiedades antioxidantes. 100 ml.',      latin:'Rosa damascena',             usage:'Hidratante facial' },
  'gel-cafe':           { cat:'facial',   price:150,  priceLabel:'$150 MXN',          img:'assets/images/mascarilla-cafe.webp',     desc:'Tratamiento revitalizante. La cafeína estimula la circulación y despierta la piel. Tonifica, refresca y deja el rostro suave y luminoso. 30 ml.', latin:'Coffea arabica', usage:'Revitalizante facial' },
  'pomada-calendula':   { cat:'facial',   price:100,  priceLabel:'desde $100 MXN',    img:'assets/images/pomada-calendula.webp',    desc:'Cera de abeja y lípido vegetal. Antiinflamatoria y cicatrizante para heridas menores, quemaduras leves e irritaciones.',  latin:'Calendula officinalis',      usage:'Cicatrizante' },
  'pomada-cannabis':    { cat:'facial',   price:100,  priceLabel:'desde $100 MXN',    img:'assets/images/pomada-cannabis.webp',     desc:'Sinergia de cannabis y plantas medicinales. Para dolores musculares y articulares.',                                        latin:'Cannabis sativa',            usage:'Analgésico muscular' },
  'salsa-matcha':       { cat:'cocina',   price:200,  priceLabel:'$200 MXN / pz',     img:'assets/images/salsa-matcha.webp',        desc:'4 variedades con semillas, chiles secos e ingredientes de temporada: Chapulines, Frutos Rojos, Ajo y Habanero.',          latin:'Camellia sinensis',          usage:'Gourmet' },
  'tisanas':            { cat:'cocina',   price:1300, priceLabel:'$1,300 MXN / kg',   img:'assets/images/t13-01264.webp',           desc:'Mezclas con ingredientes naturales y orgánicos del jardín medicinal de Huerto Roma Verde. Sin aditivos. 1 kg.',            latin:'(Species variae)',          usage:'Infusión medicinal' },
  'leche-dorada':       { cat:'cocina',   price:300,  priceLabel:'$300 MXN',          img:'assets/images/leche-dorada.webp',        desc:'Mezcla ancestral de cúrcuma, pimienta negra, clavo y especias. Potente antiinflamatoria y reconfortante. 150 gr.',         latin:'Curcuma longa',              usage:'Antiinflamatorio' },
  'terrarios':          { cat:'hogar',    price:0,    priceLabel:'Medidas personalizadas', img:'assets/images/terrarios-vidrio.webp', desc:'Piezas decorativas de vidrio en medidas personalizadas: candeleros, joyeros, aparadores y mostradores.',                latin:'Vitrum arte',                usage:'Decoración' },
  'talabarteria':       { cat:'estilo',   price:0,    priceLabel:'Piezas personalizadas', img:'assets/images/talabarteria.webp',     desc:'Piel reciclada transformada en piezas elegantes y funcionales: cinturones, pulseras, carteras, mochilas.',                latin:'Corium arte',                usage:'Accesorios' },
  'muestra-de-regalo':  { cat:'esencias', price:10,   priceLabel:'$10 MXN',           img:'assets/images/esencias-amber.webp',      desc:'Producto simbólico para verificar el flujo de compra del carrito.' }
};

// Catálogo cacheado en memoria
let _catalog = null;

// ── Fetch resiliente con AbortController Timeout (3.5s) ───
async function catalogFetch(path, opts = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const res = await fetch(`${CATALOG_URL}${path}`, {
      ...opts,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': CATALOG_KEY,
        ...(opts.headers || {})
      }
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`API ${res.status}: ${err}`);
    }
    return res.json();
  } catch (e) {
    clearTimeout(timeoutId);
    throw e;
  }
}

// ── Catalogo local de respaldo infalible ─────────────────
function getFallbackCatalog() {
  const titles = {
    'esencia-miel':       'Esencia de Miel Silvestre y Melisa',
    'esencias-naturales': 'Colección de Esencias Naturales',
    'perfume-solido':     'Perfume Sólido de Cacao y Vainilla',
    'lagrimas-rosas':     'Lágrimas de Rosas para Saumerio',
    'oleo-masaje':        'Óleo de Masaje Botánico',
    'roll-on':            'Roll-On Respiratorio de Menta y Pino',
    'miel-melipona':      'Miel Melipona Ancestral Curativa',
    'friega-cannabis':    'Friega de Cannabis y Hormiga Roja',
    'chilcuague':         'Spray Oral de Raíz de Chilcuague',
    'jabones':            'Jabones Artesanales Herbales',
    'agua-rosas':         'Agua de Rosas Tónico Facial',
    'gel-rosas':          'Gel Facial de Rosas Antioxidante',
    'gel-cafe':           'Gel Facial Revitalizante de Café',
    'pomada-calendula':   'Pomada de Caléndula Cicatrizante',
    'pomada-cannabis':    'Pomada de Cannabis Analgésica',
    'salsa-matcha':       'Salsa Matcha Artesanal Gourmet',
    'tisanas':            'Tisanas Medicinales de Huerto Roma',
    'leche-dorada':       'Leche Dorada con Cúrcuma y Especias',
    'terrarios':          'Terrarios y Vitrales en Vidrio',
    'talabarteria':       'Talabartería Ritual en Piel Reciclada'
  };

  return Object.keys(PRODUCT_META).filter(k => k !== 'muestra-de-regalo').map(handle => ({
    id: handle,
    handle: handle,
    title: titles[handle] || handle.replace(/-/g, ' ').toUpperCase(),
    description: PRODUCT_META[handle].desc,
    thumbnail: '',
    variants: [{ id: handle + '-var1' }]
  }));
}

// ── Obtener catálogo (Medusa + Stale-While-Revalidate + Fallback) ──
async function fetchCatalog(force = false) {
  if (_catalog && !force) return _catalog;

  // 1. Intentar responder de inmediato desde localStorage (Cero Latencia / Offline Ready)
  let cachedData = null;
  try {
    const raw = localStorage.getItem(CATALOG_CACHE_KEY) || sessionStorage.getItem(CATALOG_CACHE_KEY);
    if (raw) {
      const { data, ts } = JSON.parse(raw);
      if (Array.isArray(data) && data.length > 0) {
        cachedData = data;
        // Si la caché está fresca (< 15 min), usarla de inmediato sin consultar la red
        if (!force && (Date.now() - ts < CATALOG_CACHE_TTL)) {
          _catalog = cachedData;
          return _catalog;
        }
      }
    }
  } catch (e) { /* ignorar */ }

  let medusaProducts = [];
  try {
    const data = await catalogFetch('/store/products?limit=100');
    medusaProducts = (data.products || []).filter(p => !p.handle || !p.handle.includes('prueba'));
  } catch (e) {
    console.warn('Medusa API no disponible o timeout (522/Cloudflare). Usando caché previa o local:', e.message);
    if (cachedData) {
      _catalog = cachedData;
      return _catalog;
    }
  }

  // 2. Fusión: tomar productos de Medusa y completar con cualquier producto local que falte
  const fallbacks = getFallbackCatalog();
  const medusaHandles = new Set(medusaProducts.map(p => p.handle));
  const missingFallbacks = fallbacks.filter(f => !medusaHandles.has(f.handle));

  _catalog = [...medusaProducts, ...missingFallbacks];

  // 3. Persistir en localStorage
  try {
    localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify({
      data: _catalog,
      ts: Date.now()
    }));
  } catch (e) { /* ignorar */ }

  return _catalog;
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
    detailUrl: 'productos/' + p.handle + '/',
    _meta: {
      latin: meta.latin || '',
      usage: meta.usage || ''
    }
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

// ── Render tarjeta espécimen botánico ───────────────────
function renderShopCard(p, assets) {
  const hasVariants = p.variants && p.variants.length > 1;
  const variantId = p.defaultVariantId;
  const localSrc = p.localImg ? assets + p.localImg.replace(/^assets\//, '') : '';
  const img = localSrc || p.thumbnail || (assets + 'images/casa-tapputi-logo.webp');
  const dataImg = localSrc || img;

  // Datos de espécimen
  const latinName = (p._meta && p._meta.latin) || '';
  const usageTag  = (p._meta && p._meta.usage)  || '';

  let actionHtml;
  if (hasVariants) {
    actionHtml = `<a href="${productoUrl(p.handle)}" class="btn btn-add-cart specimen-cta">Ver opciones</a>`;
  } else if (!p.price || p.price <= 0) {
    // Productos sin precio fijo → link a página de detalle
    actionHtml = `<a href="${productoUrl(p.handle)}" class="btn btn-add-cart specimen-cta">Ver detalles</a>`;
  } else {
    actionHtml = `<button class="btn btn-add-cart specimen-cta"
      data-product-id="${p.id}"
      onclick="addToCart(getProductData(this))">🛒 Agregar al carrito</button>`;
  }

  return `
    <article class="specimen-card"
      data-cat="${p.cat}"
      data-product-id="${p.id}"
      ${variantId ? `data-variant-id="${variantId}"` : ''}
      data-product-name="${p.title}"
      data-product-price="${p.price}"
      data-product-price-label="${p.priceLabel}"
      data-product-image="${dataImg}">
      ${latinName ? `<p class="specimen-latin">${latinName}</p>` : ''}
      <div class="specimen-line"></div>
      <h3><a href="${productoUrl(p.handle)}">${p.title}</a></h3>
      <div class="specimen-img-wrap">
        <img src="${img}" alt="${p.title}" loading="lazy"
             onerror="this.onerror=null;this.src='${dataImg}'">
      </div>
      <div class="specimen-tags">
        ${usageTag ? `<span class="specimen-usage">${usageTag}</span>` : ''}
      </div>
      <span class="specimen-price">${p.priceLabel}</span>
      ${p.description ? `<p class="specimen-desc">${p.description}</p>` : ''}
      ${actionHtml}
    </article>`;
}

// ── Render grilla de productos ────────────────────────────
async function renderShopGrid(containerId) {
  const grid = document.getElementById(containerId || 'shopGrid');
  if (!grid) return;

  // Si hay skeletons, se quedan mientras carga (efecto shimmer)
  const hasSkeleton = grid.querySelector('.skeleton-specimen');
  if (!hasSkeleton) {
    grid.innerHTML = '<div class="catalog-loading" style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--clay)">Cargando catálogo…</div>';
  }

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

  // Activar scroll reveal en las tarjetas recién renderizadas
  if (typeof window.initReveal === 'function') {
    window.initReveal(grid);
  }
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

  function cardHTML(p, isFirstLoop) {
    // Preferir imagen local (siempre existe); fallback a thumbnail de Medusa; último recurso: logo
    const localSrc = p.localImg ? assets + p.localImg.replace(/^assets\//, '') : '';
    const img = localSrc || p.thumbnail || (assets + 'images/casa-tapputi-logo.webp');
    const dataImg = localSrc || img;
    const vid = p.defaultVariantId;
    const btnAttrs = ` data-product-id="${p.id}" data-variant-id="${vid}" data-product-name="${p.title}" data-product-price="${p.price}" data-product-price-label="${p.priceLabel}" data-product-image="${dataImg}"`;
    
    // No mostrar botón + en productos sin precio
    const hasPrice = p.price && p.price > 0;
    const btn = hasPrice
      ? `<button class="marquee-add" onclick="addToCart(getProductData(this));event.preventDefault();event.stopPropagation()" aria-label="Agregar al carrito">+</button>`
      : '';

    // En la segunda vuelta omitimos el foco de teclado duplicado pero MANTENEMOS los clics del mouse 100% habilitados sin 'inert'
    const accessibilityAttrs = isFirstLoop ? '' : ' tabindex="-1"';

    return `<a href="${productoUrl(p.handle)}" class="marquee-card"${btnAttrs}${accessibilityAttrs}><img src="${img}" alt="${p.title}" loading="lazy"><span>${p.title}${btn}</span></a>`;
  }

  // Primera y segunda vuelta: 100% clicables y navegables
  inner.innerHTML = enriched.map(p => cardHTML(p, true)).join('')
    + enriched.map(p => cardHTML(p, false)).join('');

  // Activar scroll reveal en marquee si aplica (aunque marquee no usa reveal)
  if (typeof window.initReveal === 'function') {
    window.initReveal(inner);
  }

  // LQIP Blur-Up: main.js ya corrió su querySelectorAll('.marquee-card img')
  // en DOMContentLoaded, antes de que este fetch async insertara estas imágenes.
  // Sin esto, .loaded nunca se agrega y el blur(12px) de main.v4.css se queda para siempre.
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
async function initCatalog() {
  const path = window.location.pathname;

  // Shop grid (productos/index.html o productos/)
  if (document.getElementById('shopGrid')) {
    await renderShopGrid('shopGrid');
  }

  // Marquee carrusel de la home: diferir la API hasta acercarse a la sección.
  // Esto evita descargar/renderizar 50 productos durante el primer viewport móvil.
  const marquee = document.querySelector('.marquee-inner');
  const marqueeTrack = document.getElementById('home-catalog');
  if (marquee && marqueeTrack && 'IntersectionObserver' in window) {
    const loadMarquee = () => {
      renderMarquee('.marquee-inner');
      marqueeObserver.disconnect();
    };
    const marqueeObserver = new IntersectionObserver((entries) => {
      if (entries.some(entry => entry.isIntersecting)) loadMarquee();
    }, { rootMargin: '500px 0px' });
    marqueeObserver.observe(marqueeTrack);
  } else if (marquee) {
    await renderMarquee('.marquee-inner');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCatalog, { once: true });
} else {
  initCatalog();
}
