// =============================================
// TIPOS TYPESCRIPT DO VOIP SAAS
// =============================================

// === Multi-Tenancy ===
export interface Tenant {
    id: string;
    name: string;
    slug: string;
    plan: 'starter' | 'professional' | 'enterprise';
    is_active: boolean;
    max_users: number;
    max_concurrent_calls: number;
    settings: Record<string, unknown>;
    created_at: string;
}

export interface TenantUser {
    id: string;
    tenant_id: string;
    auth_user_id: string;
    role: 'admin' | 'manager' | 'bdr' | 'viewer';
    display_name: string;
    extension?: string;
    is_active: boolean;
    twilio_identity?: string;
    created_at: string;
}

export interface TenantSettings {
    id: string;
    tenant_id: string;
    default_caller_id?: string;
    recording_enabled: boolean;
    recording_channels: 'mono' | 'dual';
    ai_analysis_enabled: boolean;
    max_call_duration_seconds: number;
    work_hours_start: string;
    work_hours_end: string;
    timezone: string;
}

// === Telefonia ===
export type CallStatus =
    | 'queued' | 'initiated' | 'ringing' | 'in-progress'
    | 'completed' | 'busy' | 'no-answer' | 'canceled' | 'failed';

export type CallDirection = 'inbound' | 'outbound';

export interface Call {
    id: string;
    tenant_id: string;
    user_id: string;
    twilio_call_sid?: string;
    direction: CallDirection;
    status: CallStatus;
    from_number: string;
    to_number: string;
    caller_name?: string;
    campaign_id?: string;
    duration_seconds: number;
    billable_seconds: number;
    cost_per_minute?: number;
    total_cost: number;
    started_at?: string;
    answered_at?: string;
    ended_at?: string;
    hangup_cause?: string;
    metadata: Record<string, unknown>;
    created_at: string;
    // Dados expandidos
    user?: TenantUser;
    recording?: CallRecording;
    analysis?: AIAnalysis;
}

export interface CallRecording {
    id: string;
    call_id: string;
    tenant_id: string;
    twilio_recording_sid?: string;
    storage_path?: string;
    storage_url?: string;
    duration_seconds: number;
    channels: number;
    file_size_bytes?: number;
    format: string;
    status: 'processing' | 'available' | 'deleted' | 'error';
    transcription_status: 'pending' | 'processing' | 'completed' | 'failed';
    created_at: string;
}

// === IA ===
export interface AITranscription {
    id: string;
    recording_id: string;
    call_id: string;
    tenant_id: string;
    full_text?: string;
    segments?: TranscriptionSegment[];
    language: string;
    confidence?: number;
    model_used: string;
    processing_time_ms?: number;
    created_at: string;
}

export interface TranscriptionSegment {
    speaker: 'bdr' | 'client';
    start: number;
    end: number;
    text: string;
}

export interface AIAnalysis {
    id: string;
    transcription_id: string;
    call_id: string;
    tenant_id: string;
    sentiment_score?: number;
    sentiment_label?: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
    objections?: Objection[];
    suggested_actions?: SuggestedAction[];
    call_summary?: string;
    key_topics?: string[];
    talk_ratio?: { bdr_percentage: number; client_percentage: number };
    energy_level?: 'low' | 'medium' | 'high';
    next_best_action?: string;
    deal_probability?: number;
    model_used: string;
    processing_time_ms?: number;
    created_at: string;
}

export interface Objection {
    objection: string;
    severity: 'high' | 'medium' | 'low';
    context: string;
    suggested_counter?: string;
}

export interface SuggestedAction {
    action: string;
    priority: 'high' | 'medium' | 'low';
    reasoning: string;
}

// === Billing ===
export interface BillingAccount {
    id: string;
    tenant_id: string;
    balance_minutes: number;
    balance_currency: number;
    credit_limit_minutes: number;
    auto_recharge: boolean;
}

export interface BillingTransaction {
    id: string;
    tenant_id: string;
    type: string;
    amount_minutes: number;
    amount_currency: number;
    balance_after_minutes?: number;
    balance_after_currency?: number;
    reference_id?: string;
    description?: string;
    created_at: string;
}

// === Campanhas ===
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';

export interface Campaign {
    id: string;
    tenant_id: string;
    created_by: string;
    name: string;
    status: CampaignStatus;
    dialer_mode: 'preview' | 'power' | 'progressive';
    total_contacts: number;
    contacted: number;
    connected: number;
    max_attempts: number;
    created_at: string;
}

export interface CampaignContact {
    id: string;
    campaign_id: string;
    phone_number: string;
    contact_name?: string;
    company_name?: string;
    status: string;
    attempts: number;
    notes?: string;
    extra_data: Record<string, unknown>;
}

export interface PowerDialQueue {
    id: string;
    tenant_id: string;
    user_id: string;
    campaign_id: string;
    contact_id: string;
    position: number;
    status: 'waiting' | 'dialing' | 'active' | 'wrap_up' | 'completed' | 'skipped';
    contact?: CampaignContact;
}

// === Dashboard ===
export interface DashboardStats {
    active_calls: number;
    total_calls_today: number;
    avg_duration: number;
    connection_rate: number;
    total_minutes_today: number;
    active_bdrs: number;
    sentiment_avg: number;
}

export interface BDRStatus {
    user: TenantUser;
    status: 'available' | 'on-call' | 'wrap-up' | 'offline' | 'break';
    current_call?: Call;
    calls_today: number;
    talk_time_today: number;
}
