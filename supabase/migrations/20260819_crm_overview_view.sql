-- ==============================================================================
-- MIGRACIÓN SQL: VISTA DE CRM Y MÉTRICAS MULTI-TENANT (crm_leads_overview)
-- Plataforma: Aria Prop (https://ariaprop.online)
-- ==============================================================================

-- 1. CREAR VISTA CONSOLIDADA DE LEADS CRM CON SECURITY INVOKER
CREATE OR REPLACE VIEW public.crm_leads_overview
WITH (security_invoker = true) AS
SELECT 
    c.id AS id,
    c.organization_id AS organization_id,
    c.user_phone AS user_phone,
    c.user_name AS user_name,
    c.status AS status,
    c.budget_max_usd AS budget_max_usd,
    c.preferred_zone AS preferred_zone,
    c.property_type AS property_type,
    c.created_at AS created_at,
    c.last_message_at AS last_message_at,
    lm.message_text AS last_message,
    COALESCE(mc.total_messages, 0) AS total_messages
FROM public.wa_conversations c
LEFT JOIN LATERAL (
    SELECT m.message_text
    FROM public.wa_messages m
    WHERE m.conversation_id = c.id
    ORDER BY m.created_at DESC
    LIMIT 1
) lm ON true
LEFT JOIN LATERAL (
    SELECT COUNT(*)::INT AS total_messages
    FROM public.wa_messages m
    WHERE m.conversation_id = c.id
) mc ON true;

-- 2. OTORGAR PERMISOS A ROLES DE SUPABASE
GRANT SELECT ON public.crm_leads_overview TO authenticated;
GRANT SELECT ON public.crm_leads_overview TO service_role;

-- 3. POLÍTICAS RLS PARA ISOLAMIENTO MULTI-TENANT
DO $$
BEGIN
    -- Política RLS en wa_conversations para lectura de usuarios de la organización
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'wa_conversations' AND policyname = 'Users can view their org wa_conversations'
    ) THEN
        CREATE POLICY "Users can view their org wa_conversations" ON public.wa_conversations
            FOR SELECT TO authenticated
            USING (
                organization_id IN (
                    SELECT p.organization_id FROM public.profiles p WHERE p.id = auth.uid()
                    WHERE p.organization_id IS NOT NULL
                )
            );
    END IF;

    -- Política RLS en wa_messages para lectura de usuarios de la organización
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'wa_messages' AND policyname = 'Users can view their org wa_messages'
    ) THEN
        CREATE POLICY "Users can view their org wa_messages" ON public.wa_messages
            FOR SELECT TO authenticated
            USING (
                organization_id IN (
                    SELECT p.organization_id FROM public.profiles p WHERE p.id = auth.uid()
                    WHERE p.organization_id IS NOT NULL
                )
            );
    END IF;
END $$;
