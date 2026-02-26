-- =============================================
-- MIGRAÇÃO 004: CHAMADAS, GRAVAÇÕES E IA
-- =============================================

CREATE TYPE call_status AS ENUM (
  'queued','initiated','ringing','in-progress',
  'completed','busy','no-answer','canceled','failed'
);

CREATE TYPE call_direction AS ENUM ('inbound','outbound');

CREATE TABLE public.calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  user_id UUID NOT NULL REFERENCES public.tenant_users(id),
  twilio_call_sid TEXT UNIQUE,
  direction call_direction NOT NULL,
  status call_status NOT NULL DEFAULT 'queued',
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  caller_name TEXT,
  campaign_id UUID,
  duration_seconds INTEGER DEFAULT 0,
  billable_seconds INTEGER DEFAULT 0,
  cost_per_minute DECIMAL(10,6),
  total_cost DECIMAL(10,4) DEFAULT 0,
  started_at TIMESTAMPTZ,
  answered_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  hangup_cause TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.call_legs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id UUID NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
  twilio_leg_sid TEXT,
  leg_type TEXT NOT NULL CHECK (leg_type IN ('caller','callee','conference','transfer')),
  status call_status NOT NULL DEFAULT 'queued',
  from_number TEXT,
  to_number TEXT,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.call_recordings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id UUID NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  twilio_recording_sid TEXT UNIQUE,
  storage_path TEXT,
  storage_url TEXT,
  duration_seconds INTEGER DEFAULT 0,
  channels INTEGER DEFAULT 2,
  file_size_bytes BIGINT,
  format TEXT DEFAULT 'wav',
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing','available','deleted','error')),
  transcription_status TEXT DEFAULT 'pending' CHECK (transcription_status IN ('pending','processing','completed','failed')),
  retention_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_transcriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recording_id UUID NOT NULL REFERENCES public.call_recordings(id) ON DELETE CASCADE,
  call_id UUID NOT NULL REFERENCES public.calls(id),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  full_text TEXT,
  segments JSONB,
  language TEXT DEFAULT 'pt-BR',
  confidence DECIMAL(5,4),
  model_used TEXT DEFAULT 'gemini-1.5-pro',
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transcription_id UUID NOT NULL REFERENCES public.ai_transcriptions(id),
  call_id UUID NOT NULL REFERENCES public.calls(id),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  sentiment_score DECIMAL(5,4),
  sentiment_label TEXT CHECK (sentiment_label IN ('very_negative','negative','neutral','positive','very_positive')),
  objections JSONB,
  suggested_actions JSONB,
  call_summary TEXT,
  key_topics JSONB,
  talk_ratio JSONB,
  energy_level TEXT,
  next_best_action TEXT,
  deal_probability DECIMAL(5,4),
  model_used TEXT DEFAULT 'gemini-1.5-pro',
  processing_time_ms INTEGER,
  raw_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_calls_tenant ON public.calls(tenant_id, created_at DESC);
CREATE INDEX idx_calls_user ON public.calls(user_id, created_at DESC);
CREATE INDEX idx_calls_status ON public.calls(status) WHERE status IN ('queued','ringing','in-progress');
CREATE INDEX idx_calls_twilio ON public.calls(twilio_call_sid);
CREATE INDEX idx_recordings_call ON public.call_recordings(call_id);
CREATE INDEX idx_recordings_status ON public.call_recordings(transcription_status) WHERE transcription_status != 'completed';

ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_legs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "calls_tenant_access" ON public.calls
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "call_legs_tenant_access" ON public.call_legs
  FOR SELECT USING (
    call_id IN (SELECT id FROM public.calls WHERE tenant_id IN (
      SELECT tenant_id FROM public.tenant_users WHERE auth_user_id = auth.uid()
    ))
  );

CREATE POLICY "recordings_tenant_access" ON public.call_recordings
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "transcriptions_tenant_access" ON public.ai_transcriptions
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "analyses_tenant_access" ON public.ai_analyses
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE auth_user_id = auth.uid())
  );
