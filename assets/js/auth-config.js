/* ============================================================
   Casa Tapputi — Configuración de cuentas (PLANTILLA)

   Rellenar con el proyecto Supabase DEDICADO de Casa Tapputi, en la cuenta
   del Dr. Barrera. NO usar el proyecto de Jorge (eiobhxovdpraotfmthpk):
   ese es de EBAC/Amotep y hoy el vault apunta ahí por confusión — ver el
   pendiente registrado en la wiki.

   Mientras `enabled` sea false, auth-client.js no carga nada ni toca la
   página: el sitio funciona exactamente igual que hoy.

   La anon key es pública por diseño (va en el navegador); lo que protege los
   datos es RLS, no el secreto de esta llave. La service_role key NUNCA
   debe aparecer en este archivo ni en ningún archivo del sitio.
   ============================================================ */

window.CT_AUTH_CONFIG = {
  enabled: false,                    // poner true cuando existan las credenciales
  supabaseUrl: '',                   // https://<ref>.supabase.co
  supabaseAnonKey: '',               // anon / publishable key

  // Métodos ofrecidos en la pantalla de acceso
  metodos: {
    google:   true,                  // requiere OAuth configurado en Google Cloud del Dr. Barrera
    password: true,                  // correo + contraseña
    magicLink: true,                 // enlace por CORREO (nativo)
    whatsappOtp: false               // CÓDIGO por WhatsApp — requiere Twilio Verify; ver pendiente
  },

  // A dónde vuelve el usuario tras Google / enlace por correo
  redirectTo: 'https://casatapputi.com.mx/mis-boletos.html'
};
