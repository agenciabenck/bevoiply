-- =============================================
-- MIGRAÇÃO 006: DLQ, AUDIT LOG & REALTIME
-- =============================================

CREATE TABLE public.dead_letter_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id),
  task_type TEXT NOT NULL CHECK (task_type IN (
    'recording_download','transcription','ai_analysis',
    'billing_debit','webhook_delivery','status_update'
  )),
  payload JSONB NOT NULL,
  error_message TEXT,
  error_stack TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 5,
  next_retry_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','retrying','completed','permanently_failed')),
  original_created_at TIMESTAMPTZ DEFAULT now(),
  last_attempt_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id),
  user_id UUID REFERENCES public.tenant_users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dlq_status ON public.dead_letter_queue(status, next_retry_at)
  WHERE status IN ('pending','retrying');
CREATE INDEX idx_audit_tenant ON public.audit_log(tenant_id, created_at DESC);

-- Função de retry exponencial para DLQ
CREATE OR REPLACE FUNCTION process_dlq_retry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.retry_count >= NEW.max_retries THEN
    NEW.status := 'permanently_failed';
  ELSE
    NEW.next_retry_at := now() + (power(2, NEW.retry_count) || ' minutes')::INTERVAL;
    NEW.status := 'pending';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_dlq_retry
  BEFORE UPDATE OF retry_count ON public.dead_letter_queue
  FOR EACH ROW EXECUTE FUNCTION process_dlq_retry();

-- Habilitar Realtime nas tabelas críticas
ALTER PUBLICATION supabase_realtime ADD TABLE public.calls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.power_dial_queues;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_contacts;
