-- =============================================
-- MIGRAÇÃO 002: SIP TRUNKS & ROTEAMENTO
-- =============================================

CREATE TABLE public.sip_trunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'twilio',
  twilio_trunk_sid TEXT,
  origination_url TEXT,
  termination_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 1,
  capacity INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.phone_numbers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL UNIQUE,
  friendly_name TEXT,
  twilio_sid TEXT,
  trunk_id UUID REFERENCES public.sip_trunks(id),
  capabilities JSONB DEFAULT '{"voice": true, "sms": false}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  monthly_cost DECIMAL(10,4) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.routing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 1,
  condition_type TEXT NOT NULL CHECK (condition_type IN ('prefix','regex','time_based','percentage')),
  condition_value TEXT NOT NULL,
  destination_type TEXT NOT NULL CHECK (destination_type IN ('trunk','user','queue','ivr','external')),
  destination_id TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sip_trunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trunk_tenant_access" ON public.sip_trunks
  FOR SELECT USING (
    tenant_id IS NULL OR tenant_id IN (
      SELECT tenant_id FROM public.tenant_users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "phone_tenant_access" ON public.phone_numbers
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "routing_tenant_access" ON public.routing_rules
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE auth_user_id = auth.uid())
  );
