/* ============================================================
   Casa Tapputi — Client de Boletos & Reservación de Talleres
   Soporta:
   1. Timeout (8s) y fallback automático a WhatsApp si falla la API.
   2. Persistencia de boletos QR en localStorage (recuperación tras refresco).
   3. Carga diferida (lazy load) de SDK MercadoPago V2 y QRCode.js.
   4. Sanitización dinámica de teléfonos WhatsApp (+52).
   ============================================================ */

(function(window){
  'use strict';

  var TicketsClient = {
    TICKETS_API: 'https://tickets.casatapputi.com.mx',
    MP_PUBLIC_KEY: 'APP_USR-5215e212-ea55-41df-ad06-c828ebdfc562',
    TIMEOUT_MS: 8000,

    // Carga de scripts de forma asíncrona (Lazy Loading)
    loadScript: function(src, callback) {
      if (document.querySelector('script[src="' + src + '"]')) {
        if (callback) callback();
        return;
      }
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = function() { if (callback) callback(); };
      s.onerror = function() { console.error('Error cargando script:', src); };
      document.head.appendChild(s);
    },

    // Asegura SDKs de MP y QRCode
    ensureSDKs: function(callback) {
      var self = this;
      self.loadScript('https://sdk.mercadopago.com/js/v2', function(){
        self.loadScript('https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js', function(){
          if (callback) callback();
        });
      });
    },

    // Sanitizar número de WhatsApp a formato de 10 dígitos (o con prefijo 52)
    cleanWhatsApp: function(val) {
      var num = (val || '').toString().replace(/\D/g, '');
      if (num.length === 12 && num.startsWith('52')) {
        num = num.slice(2);
      } else if (num.length > 10) {
        num = num.slice(-10);
      }
      return num;
    },

    // Petición con Timeout utilizando AbortController
    fetchWithTimeout: function(url, options, timeoutMs) {
      var ms = timeoutMs || this.TIMEOUT_MS;
      var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var signal = controller ? controller.signal : null;
      var opts = Object.assign({}, options, signal ? { signal: signal } : {});

      var timer = controller ? setTimeout(function(){ controller.abort(); }, ms) : null;

      return fetch(url, opts)
        .then(function(res){
          if (timer) clearTimeout(timer);
          return res;
        })
        .catch(function(err){
          if (timer) clearTimeout(timer);
          throw err;
        });
    },

    // Guardar boletos en localStorage
    saveTicketsLocal: function(eventPrefix, tickets) {
      try {
        var key = 'casatapputi_tickets_' + eventPrefix;
        var data = {
          timestamp: Date.now(),
          tickets: tickets
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
