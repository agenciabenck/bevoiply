-- =============================================
-- MIGRAÇÃO 003: BILLING & CRÉDITOS
-- =============================================

CREATE TABLE public.billing_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE UNIQUE,
  balance_minutes DECIMAL(12,2) NOT NULL DEFAULT 0,
  balance_currency DECIMAL(12,2) NOT NULL DEFAULT 0,
  credit_limit_minutes DECIMAL(12,2) NOT NULL DEFAULT 0,
  auto_recharge BOOLEAN DEFAULT false,
  auto_recharge_threshold DECIMAL(12,2) DEFAULT 100,
  auto_recharge_amount DECIMAL(12,2) DEFAULT 500,
  last_recharge_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.billing_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  billing_account_id UUID NOT NULL REFERENCES public.billing_accounts(id),
  type TEXT NOT NULL CHECK (type IN (
    'credit_purchase','credit_bonus','call_debit',
    'recording_debit','ai_analysis_debit','refund','adjustment'
  )),
  amount_minutes DECIMAL(12,4) NOT NULL DEFAULT 0,
  amount_currency DECIMAL(12,4) NOT NULL DEFAULT 0,
  balance_after_minutes DECIMAL(12,2),
  balance_after_currency DECIMAL(12,2),
  reference_id TEXT,
  reference_type TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.credit_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  minutes INTEGER NOT NULL,
  price_brl DECIMAL(10,2) NOT NULL,
  bonus_minutes INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.rate_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  prefix TEXT NOT NULL,
  destination_type TEXT NOT NULL CHECK (destination_type IN ('local_fixed','local_mobile','long_distance','international')),
  rate_per_minute DECIMAL(10,6) NOT NULL,
  billing_increment INTEGER DEFAULT 6,
  connection_fee DECIMAL(10,4) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  effective_from TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_billing_tx_tenant ON public.billing_transactions(tenant_id, created_at DESC);
CREATE INDEX idx_billing_tx_type ON public.billing_transactions(type);
CREATE INDEX idx_rate_cards_prefix ON public.rate_cards(prefix);

ALTER TABLE public.billing_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "billing_tenant_access" ON public.billing_accounts
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "billing_tx_tenant_access" ON public.billing_transactions
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "credit_packages_public" ON public.credit_packages
  FOR SELECT USING (is_active = true);

CREATE POLICY "rate_cards_public" ON public.rate_cards
  FOR SELECT USING (is_active = true);
