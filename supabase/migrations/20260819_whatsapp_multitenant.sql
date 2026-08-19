-- ==============================================================================
-- MIGRACIÓN DE BASE DE DATOS: AUTOMATIZACIÓN MULTI-TENANT DE WHATSAPP
-- Plataforma: Aria Prop (https://ariaprop.online)
-- ==============================================================================

-- 1. EXTENDER TABLA DE ORGANIZACIONES / INMOBILIARIAS
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    wa_phone_number_id TEXT UNIQUE, -- ID del número de teléfono asignado en Meta Business
    wa_waba_id TEXT,               -- ID de la cuenta de WhatsApp Business (WABA)
    wa_access_token TEXT,          -- Access Token permanente / System User Token específico
    wa_connected BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Si la tabla 'organizations' ya existía sin las columnas de WhatsApp, agregarlas de forma segura:
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'wa_phone_number_id') THEN
        ALTER TABLE public.organizations ADD COLUMN wa_phone_number_id TEXT UNIQUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'wa_waba_id') THEN
        ALTER TABLE public.organizations ADD COLUMN wa_waba_id TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'wa_access_token') THEN
        ALTER TABLE public.organizations ADD COLUMN wa_access_token TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'wa_connected') THEN
        ALTER TABLE public.organizations ADD COLUMN wa_connected BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 2. TABLA DE CONVERSACIONES MULTI-TENANT (WA LEADS)
CREATE TABLE IF NOT EXISTS public.wa_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_phone TEXT NOT NULL,
    user_name TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'qualified', 'handover', 'closed')),
    budget_max_usd NUMERIC,
    preferred_zone TEXT,
    property_type TEXT,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_org_user_phone UNIQUE (organization_id, user_phone)
);

-- 3. TABLA DE HISTORIAL DE MENSAJES DE WHATSAPP
CREATE TABLE IF NOT EXISTS public.wa_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.wa_conversations(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    wamid TEXT UNIQUE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'assistant', 'system')),
    message_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA DE DEBUG/LOG DE WEBHOOKS (CAPTURA CRUDA)
CREATE TABLE IF NOT EXISTS public.webhook_debug_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    received_at TIMESTAMPTZ DEFAULT NOW(),
    raw_body TEXT
);

-- 5. ÍNDICES DE ALTO RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_organizations_wa_phone ON public.organizations(wa_phone_number_id);
CREATE INDEX IF NOT EXISTS idx_wa_conversations_org_phone ON public.wa_conversations(organization_id, user_phone);
CREATE INDEX IF NOT EXISTS idx_wa_messages_conv_id ON public.wa_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_wa_messages_created_at ON public.wa_messages(created_at DESC);

-- 6. POLÍTICAS DE SEGURIDAD RLS (Row Level Security)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wa_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wa_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_debug_log ENABLE ROW LEVEL SECURITY;

-- Permitir lectura y escritura completa al Service Role Key (Backend Serverless)
CREATE POLICY "Service Role full access on organizations" ON public.organizations
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service Role full access on wa_conversations" ON public.wa_conversations
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service Role full access on wa_messages" ON public.wa_messages
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service Role full access on webhook_debug_log" ON public.webhook_debug_log
    FOR ALL TO service_role USING (true) WITH CHECK (true);
