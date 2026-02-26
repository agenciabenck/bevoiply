-- =============================================
-- MIGRAÇÃO 005: CAMPANHAS & POWER DIALER
-- =============================================

CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  created_by UUID NOT NULL REFERENCES public.tenant_users(id),
  name TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','active','paused','completed','archived')),
  dialer_mode TEXT DEFAULT 'power' CHECK (dialer_mode IN ('preview','power','progressive')),
  caller_id TEXT,
  total_contacts INTEGER DEFAULT 0,
  contacted INTEGER DEFAULT 0,
  connected INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  retry_delay_minutes INTEGER DEFAULT 30,
  script_template TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.campaign_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  phone_number TEXT NOT NULL,
  contact_name TEXT,
  company_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','dialing','connected','no-answer','busy','failed','completed','skipped','callback')),
  priority INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  last_call_id UUID REFERENCES public.calls(id),
  callback_at TIMESTAMPTZ,
  notes TEXT,
  extra_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.power_dial_queues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  user_id UUID NOT NULL REFERENCES public.tenant_users(id),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id),
  contact_id UUID NOT NULL REFERENCES public.campaign_contacts(id),
  position INTEGER NOT NULL,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting','dialing','active','wrap_up','completed','skipped')),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_campaigns_tenant ON public.campaigns(tenant_id);
CREATE INDEX idx_contacts_campaign ON public.campaign_contacts(campaign_id, status);
CREATE INDEX idx_queue_user ON public.power_dial_queues(user_id, status);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.power_dial_queues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaigns_tenant" ON public.campaigns
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE auth_user_id = auth.uid()));

CREATE POLICY "contacts_tenant" ON public.campaign_contacts
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE auth_user_id = auth.uid()));

CREATE POLICY "queue_tenant" ON public.power_dial_queues
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE auth_user_id = auth.uid()));
