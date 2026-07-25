-- ====================================================================
-- SUPABASE DATABASE MIGRATION SCRIPT FOR ARIA PROP
-- Executable in Supabase SQL Editor (dashboard.supabase.com)
-- ====================================================================

-- 1. TABLA 'profiles' (Usuarios y Agencias)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  agency_name TEXT DEFAULT 'Mi Agencia Inmobiliaria',
  estado_cuenta TEXT DEFAULT 'activo',
  plan_id TEXT DEFAULT 'solo_agent',
  fecha_registro TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA 'propiedades' (Catálogo de Inmuebles de la Agencia)
CREATE TABLE IF NOT EXISTS public.propiedades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  code TEXT UNIQUE,
  type TEXT NOT NULL DEFAULT 'apartment',
  status TEXT NOT NULL DEFAULT 'available',
  price NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  location JSONB NOT NULL DEFAULT '{}'::jsonb,
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  documents TEXT[] DEFAULT ARRAY[]::TEXT[],
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA 'leads' (Prospectos y Mensajes Cualificados por la IA)
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  channel TEXT NOT NULL DEFAULT 'web_widget', -- 'web_widget', 'whatsapp', 'instagram'
  status TEXT NOT NULL DEFAULT 'nuevo', -- 'nuevo', 'contactado', 'agendado', 'cerrado', 'descartado'
  temperature TEXT NOT NULL DEFAULT 'warm', -- 'hot', 'warm', 'cold'
  score INTEGER DEFAULT 50, -- 0 a 100
  budget NUMERIC,
  currency TEXT DEFAULT 'USD',
  operation_type TEXT DEFAULT 'buy', -- 'buy', 'rent'
  property_interest TEXT,
  notes TEXT,
  chat_summary TEXT,
  last_interaction TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_propiedades_agency_id ON public.propiedades(agency_id);
CREATE INDEX IF NOT EXISTS idx_leads_agency_id ON public.leads(agency_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);

-- 5. HABILITAR ROW LEVEL SECURITY (RLS) MULTI-TENANCY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.propiedades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 6. POLÍTICAS RLS EN 'profiles'
CREATE POLICY "Profiles_Select_Policy" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Profiles_Insert_Policy" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Profiles_Update_Policy" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 7. POLÍTICAS RLS EN 'propiedades' (4 Cláusulas Separadas)
CREATE POLICY "Propiedades_Select_Policy" ON public.propiedades FOR SELECT TO authenticated USING (auth.uid() = agency_id);
CREATE POLICY "Propiedades_Insert_Policy" ON public.propiedades FOR INSERT TO authenticated WITH CHECK (auth.uid() = agency_id);
CREATE POLICY "Propiedades_Update_Policy" ON public.propiedades FOR UPDATE TO authenticated USING (auth.uid() = agency_id) WITH CHECK (auth.uid() = agency_id);
CREATE POLICY "Propiedades_Delete_Policy" ON public.propiedades FOR DELETE TO authenticated USING (auth.uid() = agency_id);

-- 8. POLÍTICAS RLS EN 'leads' (4 Cláusulas Separadas)
CREATE POLICY "Leads_Select_Policy" ON public.leads FOR SELECT TO authenticated USING (auth.uid() = agency_id);
CREATE POLICY "Leads_Insert_Policy" ON public.leads FOR INSERT TO authenticated WITH CHECK (auth.uid() = agency_id);
CREATE POLICY "Leads_Update_Policy" ON public.leads FOR UPDATE TO authenticated USING (auth.uid() = agency_id) WITH CHECK (auth.uid() = agency_id);
CREATE POLICY "Leads_Delete_Policy" ON public.leads FOR DELETE TO authenticated USING (auth.uid() = agency_id);

-- 9. TABLA 'usage_records' (Registro de Consumo por Agencia y Período Mensual)
CREATE TABLE IF NOT EXISTS public.usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  period TEXT NOT NULL, -- Formato 'YYYY-MM', ej. '2026-07'
  leads_count INTEGER NOT NULL DEFAULT 0,
  properties_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agency_id, period)
);

-- 10. ÍNDICES Y RLS MULTI-TENANT EN 'usage_records'
CREATE INDEX IF NOT EXISTS idx_usage_records_agency_period ON public.usage_records(agency_id, period);

ALTER TABLE public.usage_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "UsageRecords_Select_Policy" ON public.usage_records FOR SELECT TO authenticated USING (auth.uid() = agency_id);
CREATE POLICY "UsageRecords_Insert_Policy" ON public.usage_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = agency_id);
CREATE POLICY "UsageRecords_Update_Policy" ON public.usage_records FOR UPDATE TO authenticated USING (auth.uid() = agency_id) WITH CHECK (auth.uid() = agency_id);
CREATE POLICY "UsageRecords_Delete_Policy" ON public.usage_records FOR DELETE TO authenticated USING (auth.uid() = agency_id);

-- 11. COLUMNAS DE INTEGRACIÓN CRM EN 'propiedades'
ALTER TABLE public.propiedades ADD COLUMN IF NOT EXISTS source_crm TEXT DEFAULT 'manual';
ALTER TABLE public.propiedades ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE public.propiedades ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ;
ALTER TABLE public.propiedades ADD COLUMN IF NOT EXISTS source_label TEXT DEFAULT 'Catálogo Directo de la Agencia';

-- 12. TABLA 'crm_integrations' (Credenciales y Estado de Sincronización Tokko Broker & EasyBroker)
CREATE TABLE IF NOT EXISTS public.crm_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('tokko', 'easybroker')),
  api_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'error', 'syncing')),
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  synced_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agency_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_crm_integrations_agency_id ON public.crm_integrations(agency_id);

ALTER TABLE public.crm_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CrmIntegrations_Select_Policy" ON public.crm_integrations FOR SELECT TO authenticated USING (auth.uid() = agency_id);
CREATE POLICY "CrmIntegrations_Insert_Policy" ON public.crm_integrations FOR INSERT TO authenticated WITH CHECK (auth.uid() = agency_id);
CREATE POLICY "CrmIntegrations_Update_Policy" ON public.crm_integrations FOR UPDATE TO authenticated USING (auth.uid() = agency_id) WITH CHECK (auth.uid() = agency_id);
CREATE POLICY "CrmIntegrations_Delete_Policy" ON public.crm_integrations FOR DELETE TO authenticated USING (auth.uid() = agency_id);

-- 13. FUNCIÓN RPC PARA INCREMENTO ATÓMICO DE LEADS DE LA AGENCIA
CREATE OR REPLACE FUNCTION public.increment_lead_usage(p_agency_id UUID, p_period TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_count INTEGER;
BEGIN
  INSERT INTO public.usage_records (agency_id, period, leads_count, updated_at)
  VALUES (p_agency_id, p_period, 1, NOW())
  ON CONFLICT (agency_id, period)
  DO UPDATE SET
    leads_count = public.usage_records.leads_count + 1,
    updated_at = NOW()
  RETURNING leads_count INTO v_new_count;

  RETURN v_new_count;
END;
$$;

