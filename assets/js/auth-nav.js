(function(window){ 'use strict';
  // Inyecta/actualiza el item "Mis Boletos" en el navbar según la sesión de Supabase Auth.
  // Si auth no está habilitado, deja el nav intacto (fallback estático).
  var NAV_ITEM_TEXT = 'Mis Boletos';
  var NAV_ITEM_TEXT_SESION = 'Mi Cuenta';

  function hrefRelativo() {
    // Calcula la ruta relativa a mis-boletos.html desde cualquier profundidad (/talleres/x/ → ../../)
    var seg = (window.location.pathname.match(/\//g) || []).length - 1;
    var prefix = '';
    for (var i = 0; i < seg; i++) { prefix += '../'; }
    return prefix + 'mis-boletos.html';
  }

  function existeLink(container, href) {
    if (!container) return false;
    var links = container.querySelectorAll('a[href$="mis-boletos.html"], a[href$="mis-boletos.html/"]');
    for (var i = 0; i < links.length; i++) {
      if (links[i].getAttribute('href').indexOf(href) !== -1 || href.indexOf(links[i].getAttribute('href')) !== -1) return true;
    }
    return false;
  }

  function aplicarEstado(nombre) {
    var href = hrefRelativo();
    var desktop = document.querySelector('ul.nav-links');
    var movil = document.getElementById('mobileMenu');

    var texto = nombre ? NAV_ITEM_TEXT_SESION + ' (' + nombre + ')' : NAV_ITEM_TEXT;

    if (desktop && !existeLink(desktop, href)) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = href;
      a.textContent = texto;
      a.className = 'nav-auth-item';
      li.appendChild(a);
      desktop.appendChild(li);
    } else if (desktop) {
      var linksD = desktop.querySelectorAll('a[href$="mis-boletos.html"], a[href$="mis-boletos.html/"]');
      for (var j = 0; j < linksD.length; j++) {
        if (linksD[j].textContent !== texto) linksD[j].textContent = texto;
      }
    }

    if (movil && !existeLink(movil, href)) {
      var ma = document.createElement('a');
      ma.href = href;
      ma.textContent = texto;
      ma.className = 'nav-auth-item';
      movil.appendChild(ma);
    } else if (movil) {
      var linksM = movil.querySelectorAll('a[href$="mis-boletos.html"], a[href$="mis-boletos.html/"]');
      for (var k = 0; k < linksM.length; k++) {
        if (linksM[k].textContent !== texto) linksM[k].textContent = texto;
      }
    }
  }

  function init() {
    var auth = window.CasaTapputiAuth;
    if (!auth || !auth.habilitado()) return; // fallback: nav estático actual
    auth.sesion().then(function(s) {
      var nombre = s && s.user ? (s.user.user_metadata && (s.user.user_metadata.full_name || s.user.user_metadata.name)) || s.user.email || null : null;
      aplicarEstado(nombre);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
