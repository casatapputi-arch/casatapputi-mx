/* ============================================================
   Casa Tapputi — Client de Boletos & Reservación de Talleres
   Soporta:
   1. Timeout (8s) y fallback automático a WhatsApp si falla la API.
   2. Persistencia de boletos QR en localStorage (recuperación tras refresco).

   NOTA: el SDK de MercadoPago se carga de forma síncrona en cada página
   a propósito. Aunque la instancia `mp` no se use (el pago es por redirect
   a checkout_url), cargar el SDK es lo que recolecta el Device ID que
   MercadoPago usa para antifraude y tasa de aprobación. No diferirlo ni
   retirarlo sin confirmarlo antes con MercadoPago.
   ============================================================ */

(function(window){
  'use strict';

  var TicketsClient = {
    TIMEOUT_MS: 8000,

    // Petición con Timeout utilizando AbortController
    fetchWithTimeout: function(url, options, timeoutMs) {
      var ms = timeoutMs || this.TIMEOUT_MS;
      var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var signal = controller ? controller.signal : null;
      var opts = Object.assign({}, options, signal ? { signal: signal } : {});

      var timer = controller ? setTimeout(function(){ controller.abort(); }, ms) : null;

      // El timer sigue vivo tras recibir los headers: así el abort también corta
      // un cuerpo de respuesta colgado (res.json() sin límite). Abortar una
      // respuesta ya consumida es no-op, de modo que no afecta al caso feliz.
      return fetch(url, opts)
        .catch(function(err){
          if (timer) clearTimeout(timer);
          throw err;
        });
    },

    // Guardar boletos en localStorage.
    // Acumula por token en vez de sobrescribir: una segunda compra del mismo
    // taller no borra los boletos de la primera. El timestamp (base del TTL)
    // solo se refresca si de verdad entraron boletos nuevos — mirarlos no
    // debe posponer la expiración indefinidamente.
    saveTicketsLocal: function(eventPrefix, tickets) {
      try {
        var key = 'casatapputi_tickets_' + eventPrefix;
        var prev = null;
        try { prev = JSON.parse(localStorage.getItem(key) || 'null'); } catch(e) { prev = null; }

        var merged = (prev && prev.tickets && prev.tickets.length) ? prev.tickets.slice() : [];
        var seen = {};
        merged.forEach(function(t){ if (t && t.token) seen[t.token] = true; });

        var added = false;
        (tickets || []).forEach(function(t){
          if (!t || !t.token || seen[t.token]) return;
          seen[t.token] = true;
          merged.push(t);
          added = true;
        });

        var data = {
          timestamp: (prev && prev.timestamp && !added) ? prev.timestamp : Date.now(),
          tickets: merged
        };
        localStorage.setItem(key, JSON.stringify(data));
      } catch(e) {
        console.warn('No se pudo guardar tickets en localStorage:', e);
      }
    },

    // Obtener boletos guardados en localStorage
    getTicketsLocal: function(eventPrefix) {
      try {
        var key = 'casatapputi_tickets_' + eventPrefix;
        var raw = localStorage.getItem(key);
        if (!raw) return null;
        var parsed = JSON.parse(raw);
        // Expiración a 30 días
        if (Date.now() - parsed.timestamp > 30 * 24 * 60 * 60 * 1000) {
          localStorage.removeItem(key);
          return null;
        }
        return parsed.tickets;
      } catch(e) {
        return null;
      }
    }
  };

  window.TicketsClient = TicketsClient;
})(window);
