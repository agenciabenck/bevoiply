// =============================================
// REALTIME DASHBOARD SERVICE
// Conecta ao Supabase Realtime (WebSocket) para
// receber atualizações em tempo real
// =============================================
import { supabase } from '../lib/supabase';
import type { Call, PowerDialQueue, DashboardStats, BDRStatus } from '../types';

type RealtimeCallback<T> = (payload: { eventType: string; new: T; old: T }) => void;

export class RealtimeDashboardService {
    private subscriptions: ReturnType<typeof supabase.channel>[] = [];

    // Subscrever mudanças na tabela calls
    subscribeToCallUpdates(tenantId: string, callback: RealtimeCallback<Call>) {
        const channel = supabase
            .channel('calls-realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'calls',
                    filter: `tenant_id=eq.${tenantId}`,
                },
                (payload) => callback(payload as any)
            )
            .subscribe();

        this.subscriptions.push(channel);
        return channel;
    }

    // Subscrever mudanças na fila de discagem
    subscribeToQueueUpdates(tenantId: string, callback: RealtimeCallback<PowerDialQueue>) {
        const channel = supabase
            .channel('queue-realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'power_dial_queues',
                    filter: `tenant_id=eq.${tenantId}`,
                },
                (payload) => callback(payload as any)
            )
            .subscribe();

        this.subscriptions.push(channel);
        return channel;
    }

    // Buscar estatísticas do dashboard
    async fetchDashboardStats(tenantId: string): Promise<DashboardStats> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data: calls } = await supabase
            .from('calls')
            .select('status, duration_seconds, billable_seconds')
            .eq('tenant_id', tenantId)
            .gte('created_at', today.toISOString());

        const activeCalls = calls?.filter(c =>
            ['queued', 'initiated', 'ringing', 'in-progress'].includes(c.status)
        ).length || 0;

        const completedCalls = calls?.filter(c => c.status === 'completed') || [];
        const totalDuration = completedCalls.reduce((sum, c) => sum + (c.duration_seconds || 0), 0);
        const avgDuration = completedCalls.length > 0 ? totalDuration / completedCalls.length : 0;

        const connectedCalls = calls?.filter(c =>
            ['in-progress', 'completed'].includes(c.status)
        ).length || 0;

        return {
            active_calls: activeCalls,
            total_calls_today: calls?.length || 0,
            avg_duration: Math.round(avgDuration),
            connection_rate: calls?.length ? (connectedCalls / calls.length) * 100 : 0,
            total_minutes_today: Math.round(totalDuration / 60),
            active_bdrs: 0,
            sentiment_avg: 0,
        };
    }

    // Buscar status dos BDRs
    async fetchBDRStatuses(tenantId: string): Promise<BDRStatus[]> {
        const { data: users } = await supabase
            .from('tenant_users')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('role', 'bdr')
            .eq('is_active', true);

        return (users || []).map(user => ({
            user,
            status: 'available' as const,
            calls_today: 0,
            talk_time_today: 0,
        }));
    }

    // Limpar todas as subscrições
    unsubscribeAll() {
        this.subscriptions.forEach(sub => supabase.removeChannel(sub));
        this.subscriptions = [];
    }
}

export const realtimeService = new RealtimeDashboardService();
