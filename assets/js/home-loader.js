/* Casa Tapputi · Home progressive enhancement
   Keep the first impression light; load commerce/catalog behavior near intent. */
(function () {
  // Versionados igual que en el resto del sitio: sin ?v= el home seguiria
  // sirviendo el carrito cacheado despues de cada correccion.
  const scripts = ['assets/js/cart-fixed.js?v=20260818a', 'assets/js/catalog.js?v=14'];
  let loading = null;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error('No se pudo cargar ' + src));
      document.body.appendChild(script);
    });
  }

  function bootCatalog() {
    if (loading) return loading;
    loading = scripts.reduce((promise, src) => promise.then(() => loadScript(src)), Promise.resolve())
      .catch((error) => console.warn('Catálogo diferido no disponible:', error.message));
    return loading;
  }

  const target = document.getElementById('home-catalog');
  if (!target) return;

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        bootCatalog();
      }
    }, { rootMargin: '200px 0px' });
    observer.observe(target);
  } else {
    bootCatalog();
  }
})();
