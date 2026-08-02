/* ============================================================
   Casa Tapputi — Cliente de cuentas (Supabase Auth)

   Inerte mientras CT_AUTH_CONFIG.enabled sea false: no descarga el SDK, no
   toca el DOM y no altera en nada el flujo de compra actual.

   Métodos: Google SSO · correo+contraseña · enlace mágico por correo ·
   código por WhatsApp (este último exige Twilio Verify en el proyecto).

   La compra sigue siendo posible SIN cuenta. Al iniciar sesión, los boletos
   que la persona ya tenga guardados en este navegador se adoptan solos
   mediante la función claim_ticket(token) — ver 0001_auth_boletos.sql.
   ============================================================ */

(function(window){
  'use strict';

  var SDK = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';

  var Auth = {
    _client: null,
    _ready: null,

    cfg: function(){ return window.CT_AUTH_CONFIG || { enabled:false }; },
    habilitado: function(){
      var c = this.cfg();
      return !!(c.enabled && c.supabaseUrl && c.supabaseAnonKey);
    },

    // Carga el SDK sólo si hace falta; devuelve una promesa del cliente.
    init: function(){
      var self = this;
      if (!this.habilitado()) return Promise.resolve(null);
      if (this._ready) return this._ready;

      this._ready = new Promise(function(resolve){
        function build(){
          var c = self.cfg();
          self._client = window.supabase.createClient(c.supabaseUrl, c.supabaseAnonKey);
          resolve(self._client);
        }
        if (window.supabase && window.supabase.createClient) return build();
        var s = document.createElement('script');
        s.src = SDK;
        s.async = true;
        s.onload = build;
        s.onerror = function(){ console.error('No se pudo cargar el SDK de Supabase'); resolve(null); };
        document.head.appendChild(s);
      });
      return this._ready;
    },

    // ── Sesión ───────────────────────────────────────────────
    sesion: function(){
      return this.init().then(function(c){
        if (!c) return null;
        return c.auth.getSession().then(function(r){ return r.data ? r.data.session : null; });
      });
    },

    usuario: function(){
      return this.sesion().then(function(s){ return s ? s.user : null; });
    },

    alCambiar: function(cb){
      return this.init().then(function(c){
        if (c) c.auth.onAuthStateChange(function(evt, session){ cb(evt, session); });
      });
    },

    salir: function(){
      return this.init().then(function(c){ return c ? c.auth.signOut() : null; });
    },

    // ── Métodos de acceso ────────────────────────────────────
    conGoogle: function(){
      var self = this;
      return this.init().then(function(c){
        if (!c) return { error: { message: 'Cuentas no configuradas' } };
        return c.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: self.cfg().redirectTo }
        });
      });
    },

    conPassword: function(email, password){
      return this.init().then(function(c){
        if (!c) return { error: { message: 'Cuentas no configuradas' } };
        return c.auth.signInWithPassword({ email: email, password: password });
      });
    },

    registrar: function(email, password, datos){
      var self = this;
      return this.init().then(function(c){
        if (!c) return { error: { message: 'Cuentas no configuradas' } };
        return c.auth.signUp({
          email: email,
          password: password,
          options: { data: datos || {}, emailRedirectTo: self.cfg().redirectTo }
        });
      });
    },

    // Enlace mágico: sólo por CORREO. Por teléfono Supabase manda código, no enlace.
    conEnlaceCorreo: function(email){
      var self = this;
      return this.init().then(function(c){
        if (!c) return { error: { message: 'Cuentas no configuradas' } };
        return c.auth.signInWithOtp({
          email: email,
          options: { emailRedirectTo: self.cfg().redirectTo }
        });
      });
    },

    /* Código por WhatsApp. Exige un proveedor Twilio/Twilio Verify configurado
       en el proyecto con canal WhatsApp; sin eso Supabase responde error.
       `whatsapp` se normaliza a E.164 con TicketsClient si está disponible. */
    enviarCodigoWhatsApp: function(whatsapp){
      var tel = this._e164(whatsapp);
      if (!tel) return Promise.resolve({ error: { message: 'Número de WhatsApp inválido' } });
      return this.init().then(function(c){
        if (!c) return { error: { message: 'Cuentas no configuradas' } };
        return c.auth.signInWithOtp({ phone: tel, options: { channel: 'whatsapp' } });
      });
    },

    verificarCodigoWhatsApp: function(whatsapp, codigo){
      var tel = this._e164(whatsapp);
      if (!tel) return Promise.resolve({ error: { message: 'Número de WhatsApp inválido' } });
      return this.init().then(function(c){
        if (!c) return { error: { message: 'Cuentas no configuradas' } };
        return c.auth.verifyOtp({ phone: tel, token: String(codigo).trim(), type: 'sms' });
      });
    },

    _e164: function(v){
      if (window.TicketsClient && window.TicketsClient.normalizeMX) {
        var n = window.TicketsClient.normalizeMX(v);
        return n.ok ? '+' + n.e164 : null;
      }
      var d = String(v || '').replace(/\D/g, '');
      return d.length === 10 ? '+52' + d : null;
    },

    // ── Boletos ──────────────────────────────────────────────
    misBoletos: function(){
      return this.init().then(function(c){
        if (!c) return [];
        return c.from('tickets')
          .select('id,evento,short_code,nombre,apellido,usado,usado_en,creado_en')
          .order('creado_en', { ascending: false })
          .then(function(r){ return r.error ? [] : (r.data || []); });
      });
    },

    /* Adopta un boleto comprado como invitado. El servidor sólo acepta el token
       completo y jamás reasigna un boleto que ya tenga dueño. */
    adoptar: function(token){
      return this.init().then(function(c){
        if (!c) return null;
        return c.rpc('claim_ticket', { p_token: token })
          .then(function(r){ return r.error ? null : (r.data && r.data[0]) || null; });
      });
    },

    /* Recorre los boletos guardados en este navegador e intenta adoptarlos.
       Se llama sola tras iniciar sesión. Devuelve cuántas adopciones nuevas hubo. */
    adoptarLocales: function(){
      var self = this;
      if (!this.habilitado()) return Promise.resolve(0);
      var tokens = [];
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (!k || k.indexOf('casatapputi_tickets_') !== 0) continue;
          var parsed = JSON.parse(localStorage.getItem(k) || 'null');
          (parsed && parsed.tickets || []).forEach(function(t){
            if (t && t.token) tokens.push(t.token);
          });
        }
      } catch (e) { return Promise.resolve(0); }

      if (!tokens.length) return Promise.resolve(0);
      return Promise.all(tokens.map(function(t){ return self.adoptar(t); }))
        .then(function(rs){
          return rs.filter(function(r){ return r && r.claimed && r.motivo === 'adoptado'; }).length;
        });
    }
  };

  window.CasaTapputiAuth = Auth;
})(window);
