/* ============================================================
   Casa Tapputi — Buscador Global
   Inyecta un buscador en la nav y busca productos en tiempo real.
   ============================================================ */

(function() {
  const MEDUSA_URL = 'https://medusa.casatapputi.com.mx';
  const API_KEY = 'pk_377afadbf71f64f6027bdb8b13691017648b70f6270ff38e4d9d3961585d2c62';
  const CACHE_KEY = 'ct_search_cache';
  const CACHE_TTL = 15 * 60 * 1000; // 15 min

  let _products = null;

  // ── Escapar HTML contra XSS ─────────────────────────────
  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  let _pages = [
    { title: 'Inicio', url: '/', keywords: 'casa tapputi herbolaria perfumeria botanica' },
    { title: 'Productos', url: '/productos/', keywords: 'catalogo esencias pomadas jabones tisanas perfumes' },
    { title: 'Experiencias', url: '/experiencias/', keywords: 'aromaterapia spa eventos sensoriales' },
    { title: 'Talleres', url: '/talleres/', keywords: 'cursos herbolaria jabones perfumes solido' },
    { title: 'Servicios', url: '/servicios/', keywords: 'marca privada eventos corporativos' },
    { title: 'Nosotros', url: '/nosotros/', keywords: 'historia valores alianzas huerto roma verde' },
    { title: 'Blog', url: '/blog/', keywords: 'guias plantas medicinales herbolaria' }
  ];

  // ── Obtener productos de Medusa ──────────────────────────
  async function getProducts() {
    if (_products) return _products;
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) {
        const { data, ts } = JSON.parse(raw);
        if (Date.now() - ts < CACHE_TTL) {
          _products = data;
          return _products;
        }
      }
    } catch (e) { /* ignore */ }
    try {
      const res = await fetch(`${MEDUSA_URL}/store/products?limit=50`, {
        headers: { 'x-publishable-api-key': API_KEY }
      });
      if (!res.ok) return [];
      const json = await res.json();
      _products = (json.products || []).filter(p => p.handle && !p.handle.includes('prueba'));
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: _products, ts: Date.now() })); } catch (e) { /* ignore */ }
      return _products;
    } catch (e) {
      return [];
    }
  }

  // ── Buscar productos ─────────────────────────────────────
  function searchProducts(query, products) {
    const q = query.toLowerCase().trim();
    if (!q || q.length < 2) return [];
    const results = [];
    products.forEach(p => {
      const title = (p.title || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      const handle = (p.handle || '').toLowerCase();
      const score = 
        (title.includes(q) ? 3 : 0) +
        (handle.includes(q) ? 2 : 0) +
        (desc.includes(q) ? 1 : 0);
      if (score > 0) {
        results.push({
          title: escapeHTML(p.title || handle),
          url: `/productos/${escapeHTML(handle)}/`,
          type: 'producto',
          thumbnail: p.thumbnail || '',
          score
        });
      }
    });
    return results.sort((a, b) => b.score - a.score).slice(0, 8);
  }

  // ── Buscar páginas ───────────────────────────────────────
  function searchPages(query) {
    const q = query.toLowerCase().trim();
    if (!q || q.length < 2) return [];
    return _pages.filter(p => 
      p.title.toLowerCase().includes(q) || p.keywords.toLowerCase().includes(q)
    ).slice(0, 4);
  }

  // ── Renderizar resultados ────────────────────────────────
  function renderResults(products, pages, container) {
    if (!products.length && !pages.length) {
      container.innerHTML = '<p style="text-align:center;color:rgba(239,230,214,.4);padding:24px">No encontramos resultados. Prueba con otra palabra.</p>';
      return;
    }

    let html = '';
    if (products.length) {
      html += '<div style="font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;color:rgba(239,230,214,.4);padding:8px 16px 4px">Productos</div>';
      products.forEach(p => {
        html += `<a href="${p.url}" class="search-result" style="display:flex;align-items:center;gap:12px;padding:10px 16px;text-decoration:none;color:var(--tinta);transition:background .15s">
          <div style="width:40px;height:40px;border-radius:4px;background:rgba(255,255,255,.05);flex-shrink:0;overflow:hidden">
            ${p.thumbnail ? `<img src="${p.thumbnail}" alt="${p.title}" style="width:100%;height:100%;object-fit:cover" loading="lazy">` : '<span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:1.2rem">🌿</span>'}
          </div>
          <div style="min-width:0">
            <div style="font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.title}</div>
            <div style="font-size:.78rem;color:var(--tinta-suave)">${p.type}</div>
          </div>
        </a>`;
      });
    }
    if (pages.length) {
      html += '<div style="font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;color:rgba(239,230,214,.4);padding:8px 16px 4px;border-top:1px solid rgba(239,230,214,.06)">Páginas</div>';
      pages.forEach(p => {
        html += `<a href="${p.url}" class="search-result" style="display:block;padding:10px 16px;text-decoration:none;color:var(--tinta);transition:background .15s">${p.title}</a>`;
      });
    }

    container.innerHTML = html;
  }

  // ── Crear UI del buscador ────────────────────────────────
  function createSearchUI() {
    const style = document.createElement('style');
    style.textContent = `
      .search-overlay { position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9998;display:none;backdrop-filter:blur(4px); }
      .search-overlay.active { display:block; }
      .search-panel { position:fixed;top:0;left:0;right:0;z-index:9999;background:var(--negro);border-bottom:1px solid rgba(239,230,214,.08);padding:16px var(--pad);display:none; }
      .search-panel.active { display:block; }
      .search-panel-inner { max-width:640px;margin:0 auto; }
      .search-input-wrap { display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.04);border:1px solid rgba(239,230,214,.15);border-radius:8px;padding:10px 16px;transition:border-color .2s; }
      .search-input-wrap:focus-within { border-color:var(--miel); }
      .search-input-wrap input { flex:1;background:none;border:none;color:var(--tinta);font-family:inherit;font-size:1.1rem;outline:none; }
      .search-input-wrap input::placeholder { color:rgba(239,230,214,.3); }
      .search-input-wrap button { background:none;border:none;color:var(--tinta-suave);cursor:pointer;padding:4px;font-size:1.1rem; }
      .search-results { max-width:640px;margin:0 auto;max-height:60vh;overflow-y:auto;padding:8px 0; }
      .search-result:hover { background:rgba(255,255,255,.05); }
      .search-btn { background:none;border:none;color:var(--tinta);cursor:pointer;padding:6px;display:flex;align-items:center;transition:color .2s; }
      .search-btn:hover { color:var(--miel); }
    `;
    document.head.appendChild(style);

    // Inyectar overlay + panel
    document.body.insertAdjacentHTML('beforeend', `
      <div class="search-overlay" id="searchOverlay"></div>
      <div class="search-panel" id="searchPanel">
        <div class="search-panel-inner">
          <div class="search-input-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" id="searchInput" placeholder="Buscar productos, esencias, pomadas..." autocomplete="off">
            <button id="searchClose" aria-label="Cerrar búsqueda">✕</button>
          </div>
          <div class="search-results" id="searchResults"></div>
        </div>
      </div>
    `);
  }

  // ── Inyectar ícono de búsqueda en la nav ────────────────
  function injectSearchButton() {
    const navSocial = document.querySelector('.nav-social');
    if (!navSocial) return;
    
    // No duplicar si ya existe
    if (document.getElementById('btnSearch')) return;

    const btn = document.createElement('button');
    btn.id = 'btnSearch';
    btn.className = 'search-btn';
    btn.setAttribute('aria-label', 'Buscar');
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
    btn.onclick = openSearch;
    navSocial.prepend(btn);
  }

  // ── Abrir/Cerrar búsqueda ────────────────────────────────
  function openSearch() {
    document.getElementById('searchOverlay').classList.add('active');
    document.getElementById('searchPanel').classList.add('active');
    document.getElementById('searchInput').focus();
    document.body.style.overflow = 'hidden';
    loadProducts();
  }

  function closeSearch() {
    document.getElementById('searchOverlay').classList.remove('active');
    document.getElementById('searchPanel').classList.remove('active');
    document.getElementById('searchInput').value = '';
    document.getElementById('searchResults').innerHTML = '';
    document.body.style.overflow = '';
  }

  let productsLoaded = false;
  async function loadProducts() {
    if (productsLoaded) return;
    await getProducts();
    productsLoaded = true;
    // Re-disparar búsqueda si el usuario ya escribió algo
    const input = document.getElementById('searchInput');
    if (input && input.value.trim().length >= 2) {
      handleInput({ target: input });
    }
  }

  // ── Manejar input ─────────────────────────────────────────
  function handleInput(e) {
    const query = e.target.value;
    if (!_products) return;
    const prodResults = searchProducts(query, _products);
    const pageResults = searchPages(query);
    renderResults(prodResults, pageResults, document.getElementById('searchResults'));
  }

  // ── Init ──────────────────────────────────────────────────
  function init() {
    createSearchUI();
    injectSearchButton();
    createSearchUI();
    injectSearchButton();

    document.getElementById('searchInput').addEventListener('input', handleInput);
    document.getElementById('searchClose').addEventListener('click', closeSearch);
    document.getElementById('searchOverlay').addEventListener('click', closeSearch);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeSearch();
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
