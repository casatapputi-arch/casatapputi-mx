/* Casa Tapputi · lazy search entry point */
(function () {
  const navSocial = document.querySelector('.nav-social');
  if (!navSocial || document.getElementById('btnSearch')) return;

  const button = document.createElement('button');
  button.id = 'btnSearch';
  button.className = 'search-btn';
  button.type = 'button';
  button.setAttribute('aria-label', 'Buscar');
  button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
  navSocial.prepend(button);

  let loaded = false;
  let loading;
  button.addEventListener('click', async () => {
    if (loaded) {
      if (typeof window.openCasaTapputiSearch === 'function') window.openCasaTapputiSearch();
      return;
    }
    if (!loading) {
      loading = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'assets/js/search.js';
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    }
    try {
      await loading;
      loaded = true;
      if (typeof window.openCasaTapputiSearch === 'function') window.openCasaTapputiSearch();
    } catch (_) {
      button.setAttribute('aria-label', 'Búsqueda no disponible');
    }
  });
})();
