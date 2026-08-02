-- ============================================================================
-- Casa Tapputi — Cuentas de compradores y boletos ligados a usuario
-- ============================================================================
-- Proyecto destino: Supabase DEDICADO de Casa Tapputi (cuenta del Dr. Barrera).
-- NO aplicar sobre el proyecto de Jorge (eiobhxovdpraotfmthpk).
--
-- Modelo: la compra sigue siendo posible SIN cuenta (invitado). La cuenta es
-- opcional y sirve para conservar los boletos. Un boleto de invitado nace con
-- user_id NULL y se adopta después vía claim_ticket(token).
--
-- Aislamiento: RLS en las tres tablas. Cada persona ve exclusivamente lo suyo.
-- El backend de boletos escribe con service_role (BYPASSRLS nativo).
-- ============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── perfiles ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
    id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre     TEXT,
    apellido   TEXT,
    whatsapp   TEXT,                        -- 10 dígitos nacionales, normalizado en el cliente
    creado_en  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT profiles_whatsapp_10d CHECK (whatsapp IS NULL OR whatsapp ~ '^[0-9]{10}$')
);

-- ── órdenes ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    order_ref  TEXT NOT NULL UNIQUE,        -- p.ej. 'taller-jabones-herbales-1754...'
    evento     TEXT NOT NULL,               -- ORDER_PREFIX del taller
    monto      NUMERIC(10,2),
    estado     TEXT NOT NULL DEFAULT 'pagada'
               CHECK (estado IN ('pendiente','pagada','cancelada','reembolsada')),
    creado_en  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── boletos ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tickets (
    id          BIGSERIAL PRIMARY KEY,
    order_id    UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    evento      TEXT NOT NULL,
    token_hash  TEXT NOT NULL UNIQUE,       -- sha256 del token; el crudo NUNCA se guarda
    short_code  TEXT NOT NULL,
    nombre      TEXT,
    apellido    TEXT,
    whatsapp    TEXT,
    usado       BOOLEAN NOT NULL DEFAULT false,
    usado_en    TIMESTAMPTZ,
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tickets_user    ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_order   ON public.tickets(order_id);
CREATE INDEX IF NOT EXISTS idx_tickets_evento  ON public.tickets(evento);
CREATE INDEX IF NOT EXISTS idx_orders_user     ON public.orders(user_id);

-- ── perfil automático al registrarse ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, nombre, apellido)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data ->> 'nombre',
        NEW.raw_user_meta_data ->> 'apellido'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── adopción de boletos comprados como invitado ─────────────────────────────
-- Se reclama con el TOKEN COMPLETO (32 hex), nunca con el short_code de 4
-- dígitos: ese espacio es de 10 000 combinaciones y sería adivinable.
-- Sólo adopta boletos huérfanos; jamás roba un boleto ya asociado a otra cuenta.
CREATE OR REPLACE FUNCTION public.claim_ticket(p_token TEXT)
RETURNS TABLE (claimed BOOLEAN, motivo TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid  UUID := auth.uid();
    v_hash TEXT;
    v_row  public.tickets%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN
        RETURN QUERY SELECT false, 'sin_sesion'::TEXT; RETURN;
    END IF;
    IF p_token IS NULL OR p_token !~ '^[a-f0-9]{32}$' THEN
        RETURN QUERY SELECT false, 'token_invalido'::TEXT; RETURN;
    END IF;

    v_hash := encode(digest(p_token, 'sha256'), 'hex');

    SELECT * INTO v_row FROM public.tickets WHERE token_hash = v_hash;
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'no_encontrado'::TEXT; RETURN;
    END IF;
    IF v_row.user_id IS NOT NULL THEN
        RETURN QUERY SELECT (v_row.user_id = v_uid),
            CASE WHEN v_row.user_id = v_uid THEN 'ya_era_tuyo'::TEXT ELSE 'de_otra_cuenta'::TEXT END;
        RETURN;
    END IF;

    UPDATE public.tickets SET user_id = v_uid WHERE id = v_row.id;
    UPDATE public.orders  SET user_id = v_uid
        WHERE id = v_row.order_id AND user_id IS NULL;

    RETURN QUERY SELECT true, 'adoptado'::TEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_ticket(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_ticket(TEXT) TO authenticated;

-- ── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "perfil propio"        ON public.profiles;
DROP POLICY IF EXISTS "perfil propio update" ON public.profiles;
DROP POLICY IF EXISTS "ordenes propias"      ON public.orders;
DROP POLICY IF EXISTS "boletos propios"      ON public.tickets;

CREATE POLICY "perfil propio" ON public.profiles
    FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "perfil propio update" ON public.profiles
    FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "ordenes propias" ON public.orders
    FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Sólo lectura desde el navegador: emitir y marcar usado son operaciones del
-- backend con service_role. Así nadie puede auto-asignarse ni "des-usar" un boleto.
CREATE POLICY "boletos propios" ON public.tickets
    FOR SELECT TO authenticated USING (user_id = auth.uid());

COMMIT;
