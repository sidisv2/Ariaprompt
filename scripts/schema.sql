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
