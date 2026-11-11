/* Profundidad mínima para héroes. Sin dependencias y sin trabajo en móviles modestos. */
(() => {
  const reducir = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const movil = matchMedia('(max-width: 700px)').matches;
  const pocaMemoria = 'deviceMemory' in navigator && navigator.deviceMemory <= 4;
  if (reducir || (movil && (pocaMemoria || navigator.hardwareConcurrency <= 4))) return;

  const heroes = document.querySelectorAll('.page-hero, .prod-hero, .home-hero');
  if (!heroes.length) return;
  let pendiente = false;

  const pintar = () => {
    const y = scrollY;
    heroes.forEach((hero) => {
      const caja = hero.getBoundingClientRect();
      if (caja.bottom > 0 && caja.top < innerHeight) {
        const avance = Math.max(-1, Math.min(1, y / Math.max(hero.offsetHeight, 1)));
        hero.style.setProperty('--e06-profundidad-y', `${(avance * 8).toFixed(2)}px`);
      }
    });
    pendiente = false;
  };

  addEventListener('scroll', () => {
    if (!pendiente) requestAnimationFrame(pintar);
    pendiente = true;
  }, { passive: true });
  pintar();
})();
