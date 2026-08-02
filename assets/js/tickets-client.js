/* ============================================================
   Casa Tapputi — Client de Boletos & Reservación de Talleres

   1. Timeout (8s) y fallback automático a WhatsApp si falla la API.
   2. Persistencia de boletos QR en localStorage (recuperación tras refresco).
   3. Normalización de teléfonos mexicanos y construcción de enlaces wa.me.
   4. Carga bajo demanda de qrcodejs (solo cuando hay QRs que dibujar).

   NOTA MercadoPago: el SDK se carga con `async` en cada página y ya no se
   instancia (`new MercadoPago(...)` no se usaba: el pago es por redirect a
   checkout_url). El SDK se conserva porque al CARGARSE genera la variable
   global MP_DEVICE_SESSION_ID — el Device ID que MercadoPago usa para
   antifraude y tasa de aprobación. No retirar el <script>.
   ============================================================ */

(function(window){
  'use strict';

  var QRCODE_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';

  var TicketsClient = {
    TIMEOUT_MS: 8000,

    // ── Red ──────────────────────────────────────────────────

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

    // ── Carga bajo demanda ───────────────────────────────────

    loadScript: function(src, callback) {
      var existing = document.querySelector('script[data-src="' + src + '"]');
      if (existing) {
        if (existing.getAttribute('data-loaded') === '1') { if (callback) callback(); }
        else existing.addEventListener('load', function(){ if (callback) callback(); });
        return;
      }
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.setAttribute('data-src', src);
      s.onload = function(){ s.setAttribute('data-loaded', '1'); if (callback) callback(); };
      s.onerror = function(){ console.error('Error cargando script:', src); if (callback) callback(); };
      document.head.appendChild(s);
    },

    // Asegura qrcodejs antes de dibujar. Evita 20 KB bloqueantes en cada visita:
    // solo se descarga cuando de verdad hay boletos que renderizar.
    ensureQRCode: function(callback) {
      if (typeof window.QRCode !== 'undefined') { if (callback) callback(); return; }
      this.loadScript(QRCODE_SRC, callback);
    },

    // ── Teléfonos ────────────────────────────────────────────

    /* Normaliza un teléfono mexicano a 10 dígitos nacionales.
       Acepta: "55 1234 5678", "+52 55 1234 5678", "0052...", "521..." (formato
       móvil viejo), "(55) 1234-5678".
       IMPORTANTE: un número ya nacional de 10 dígitos NO se toca aunque empiece
       con "52" — existen ladas 52x (527, 528…) y recortarlas rompía el enlace. */
    normalizeMX: function(val) {
      var d = (val == null ? '' : String(val)).replace(/\D/g, '');
      if (!d) return { ok: false, national: '', e164: '' };

      if (d.length > 10 && d.slice(0, 2) === '00') d = d.slice(2);          // 00 internacional
      if (d.length === 13 && d.slice(0, 3) === '521') d = d.slice(3);       // 52 + 1 (móvil viejo)
      else if (d.length === 12 && d.slice(0, 2) === '52') d = d.slice(2);   // 52 + nacional
      else if (d.length === 11 && d.charAt(0) === '1') d = d.slice(1);      // 1 + nacional

      return d.length === 10
        ? { ok: true,  national: d, e164: '52' + d }
        : { ok: false, national: d, e164: '' };
    },

    // Formato legible: "55 1234 5678" (lada 2 dígitos) o "477 123 4567" (lada 3)
    formatMX: function(national) {
      if (!national || national.length !== 10) return national || '';
      var lada2 = { '55':1, '56':1, '33':1, '81':1 };
      if (lada2[national.slice(0, 2)]) {
        return national.slice(0,2) + ' ' + national.slice(2,6) + ' ' + national.slice(6);
      }
      return national.slice(0,3) + ' ' + national.slice(3,6) + ' ' + national.slice(6);
    },

    // Enlace wa.me válido, o null si el número no sirve.
    waLink: function(val, text) {
      var n = this.normalizeMX(val);
      if (!n.ok) return null;
      return 'https://wa.me/' + n.e164 + (text ? '?text=' + encodeURIComponent(text) : '');
    },

    /* Engancha limpieza en vivo a los <input type="tel"> del contenedor.
       Mientras escribe solo se descartan caracteres imposibles (no pelea con el
       cursor); al salir del campo se normaliza y se formatea. */
    attachPhoneSanitizer: function(root) {
      var scope = root || document;
      var inputs = scope.querySelectorAll('input[type="tel"]');
      for (var i = 0; i < inputs.length; i++) this.sanitizePhoneInput(inputs[i]);
    },

    sanitizePhoneInput: function(input) {
      if (!input || input.getAttribute('data-wa-bound') === '1') return;
      input.setAttribute('data-wa-bound', '1');
      input.setAttribute('inputmode', 'tel');
      input.setAttribute('autocomplete', 'tel');
      var self = this;

      input.addEventListener('input', function(){
        var clean = input.value.replace(/[^\d+\s().-]/g, '');
        if (clean !== input.value) {
          var drop = input.value.length - clean.length;
          var pos = (input.selectionStart || clean.length) - drop;
          input.value = clean;
          try { input.setSelectionRange(pos, pos); } catch (e) {}
        }
        self.markPhone(input, true);   // no marcar en rojo a medio escribir
      });

      input.addEventListener('blur', function(){
        if (!input.value.trim()) { self.markPhone(input, true); return; }
        var n = self.normalizeMX(input.value);
        if (n.ok) input.value = self.formatMX(n.national);
        self.markPhone(input, n.ok);
      });
    },

    markPhone: function(input, ok) {
      input.style.borderColor = ok ? '' : '#e06c6c';
      input.setAttribute('aria-invalid', ok ? 'false' : 'true');
    },

    // ── Persistencia local ───────────────────────────────────

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
