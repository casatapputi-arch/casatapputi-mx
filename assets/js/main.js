function toggleMenu() {
  const menu = document.getElementById('mobileMenu');
  const overlay = document.getElementById('menuOverlay');
  const hamburger = document.querySelector('.hamburger');
  const isOpen = menu.classList.toggle('open');
  if (overlay) overlay.classList.toggle('open', isOpen);
  if (hamburger) hamburger.classList.toggle('active', isOpen);
  document.body.classList.toggle('menu-open', isOpen);
}

// Cerrar menú con tecla Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const menu = document.getElementById('mobileMenu');
    if (menu && menu.classList.contains('open')) toggleMenu();
  }
});

// Endpoint de Formspree de Casa Tapputi — reemplazar TU_FORM_ID por el id real.
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xaqkplnb';

function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('.form-submit');
  const original = btn.textContent;
  btn.textContent = 'Enviando...';
  btn.disabled = true;
  fetch(FORMSPREE_ENDPOINT, {
    method: 'POST',
    body: new FormData(form),
    headers: { 'Accept': 'application/json' }
  })
  .then(r => {
    if (r.ok) {
      const ok = form.parentElement.querySelector('.form-success');
      if (ok) ok.style.display = 'block';
      form.style.display = 'none';
    } else {
      btn.textContent = original;
      btn.disabled = false;
      alert('Error al enviar. Intenta de nuevo o llámanos al (52) 1 56-1611-8734.');
    }
  })
  .catch(() => {
    btn.textContent = original;
    btn.disabled = false;
    alert('Error de conexión. Intenta de nuevo o llámanos al (52) 1 56-1611-8734.');
  });
}

/* ============================================================
   Interactividad y elevación estética (2026-06-12)
   Inspirado en monumentalidad y profundidad de monumental.jpeg
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Lightweight interaction telemetry ---------- */
  document.querySelectorAll('[data-track]').forEach((el) => {
    el.addEventListener('click', () => {
      if (typeof window.plausible === 'function') {
        window.plausible('Home CTA', { props: { action: el.dataset.track } });
      }
    }, { passive: true });
  });

  /* ---------- Scroll Reveal ---------- */
  // Función expuesta globalmente para que catalog.js pueda revelar elementos dinámicos
  window.initReveal = function(target) {
    if (!target) return;
    const els = target.querySelectorAll ?
      target.querySelectorAll('.shop-card, .prod-card, .valor, .exp-card, .servicio-card, .taller-card, .alianza, .form-card') :
      [target];
    els.forEach(el => {
      if (!el.classList.contains('reveal') && !el.classList.contains('reveal-left') && !el.classList.contains('reveal-right')) {
        el.classList.add('reveal');
        el.style.setProperty('--i', [...el.parentElement.children].indexOf(el));
      }
      // Dejar que IntersectionObserver determine visibilidad sin forzar
      // un layout síncrono durante el arranque.
      revealObserver.observe(el);
    });
  };

  const revealTargets = document.querySelectorAll(
    '.section-title, .valor, .exp-card, .servicio-card, .taller-card, .alianza, .form-card, .split'
  );

  revealTargets.forEach((el, i) => {
    if (el.classList.contains('split')) {
      const left = el.querySelector('.split > *:first-child');
      const right = el.querySelector('.split > *:last-child');
      if (left) { left.classList.add('reveal-left'); left.style.setProperty('--i', i); }
      if (right) { right.classList.add('reveal-right'); right.style.setProperty('--i', i); }
    } else {
      el.classList.add('reveal');
      el.style.setProperty('--i', i);
    }
  });

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

  // Observar todos los reveals evita el patrón write → getBoundingClientRect
  // → write que provocaba reflows forzados en la primera carga.
  document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
    revealObserver.observe(el);
  });

  /* ---------- LQIP Blur-Up (solo <img> tags) ---------- */
  const lqipTargets = document.querySelectorAll(
    '.prod-hero-img, .prod-img-wrap img, .marquee-card img'
  );
  lqipTargets.forEach(img => {
    if (img.complete) {
      img.classList.add('loaded');
    } else {
      img.addEventListener('load', () => img.classList.add('loaded'));
      img.addEventListener('error', () => img.classList.add('loaded'));
    }
  });

  /* ---------- Parallax Hero ----------
     La home ya tiene movimiento editorial en la imagen; evitar el listener de
     scroll y las lecturas de geometría reduce trabajo de layout en móviles.
     Las páginas internas conservan el efecto original. */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isHome = document.body.classList.contains('home-premium');
  if (!isHome && window.innerWidth > 768 && !reduceMotion) {
    const parallaxTargets = document.querySelectorAll('.hero, .page-hero, .prod-hero');
    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          parallaxTargets.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.bottom < 0 || rect.top > window.innerHeight) return;
            const offset = (scrollY - el.offsetTop) * 0.18;
            el.style.backgroundPosition = `center calc(50% + ${offset}px)`;
          });
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ---------- Fallback para navegadores sin soporte :has() (Firefox < 121, etc.) ---------- */
  const variantRadios = document.querySelectorAll('.prod-variant-radio');
  if (variantRadios.length) {
    const syncChecked = (target) => {
      const name = target.name;
      document.querySelectorAll(`.prod-variant-radio input[name="${name}"]`).forEach(other => {
        const wrap = other.closest('.prod-variant-radio');
        if (wrap) wrap.classList.toggle('is-checked', other.checked);
      });
    };
    variantRadios.forEach(radio => {
      const input = radio.querySelector('input[type="radio"]');
      if (!input) return;
      if (input.checked) radio.classList.add('is-checked');
      input.addEventListener('change', () => syncChecked(input));
    });
  }

});
