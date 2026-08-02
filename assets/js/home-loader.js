/* Casa Tapputi · Home progressive enhancement
   Keep the first impression light; load commerce/catalog behavior near intent. */
(function () {
  const scripts = ['assets/js/cart-fixed.js', 'assets/js/catalog.js'];
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
