-- =============================================
-- MIGRAÇÃO 001: MULTI-TENANCY
-- tenants, tenant_users, tenant_settings + RLS
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabela principal de Tenants (empresas)
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter','professional','enterprise')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_users INTEGER NOT NULL DEFAULT 5,
  max_concurrent_calls INTEGER NOT NULL DEFAULT 2,
  settings JSONB NOT NULL DEFAULT '{}',
  twilio_account_sid TEXT,
  twilio_auth_token_encrypted TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de usuários vinculados ao tenant
CREATE TABLE public.tenant_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'bdr' CHECK (role IN ('admin','manager','bdr','viewer')),
  display_name TEXT NOT NULL,
  extension TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  twilio_identity TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, auth_user_id),
  UNIQUE(tenant_id, extension)
);

-- Configurações específicas do tenant
CREATE TABLE public.tenant_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE UNIQUE,
  default_caller_id TEXT,
  recording_enabled BOOLEAN DEFAULT true,
  recording_channels TEXT DEFAULT 'dual' CHECK (recording_channels IN ('mono','dual')),
  ai_analysis_enabled BOOLEAN DEFAULT true,
  max_call_duration_seconds INTEGER DEFAULT 3600,
  work_hours_start TIME DEFAULT '08:00',
  work_hours_end TIME DEFAULT '18:00',
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: Row Level Security
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_users_see_own_tenant" ON public.tenants
  FOR SELECT USING (
    id IN (SELECT tenant_id FROM public.tenant_users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "tenant_users_see_colleagues" ON public.tenant_users
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "admins_manage_users" ON public.tenant_users
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users
      WHERE auth_user_id = auth.uid() AND role IN ('admin','manager')
    )
  );

CREATE POLICY "tenant_settings_read" ON public.tenant_settings
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "admins_manage_settings" ON public.tenant_settings
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );
