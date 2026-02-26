import { useState, useEffect } from 'react';
import {
    Clock, TrendingUp, Activity,
    ArrowUpRight, Zap, Phone, PhoneOff
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        activeCalls: 0,
        todayCalls: 0,
        avgDuration: '0:00',
        connectionRate: '0%',
        balance: 'R$ 0,00'
    });
    const [recentCalls, setRecentCalls] = useState<any[]>([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // 1. Fetch real calls
            const { data: calls, error: callsError } = await supabase
                .from('calls')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            if (callsError) throw callsError;
            setRecentCalls(calls || []);

            // 2. Fetch all calls for stats
            const { data: allCalls } = await supabase
                .from('calls')
                .select('duration_seconds, status, created_at');

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const todayCalls = allCalls?.filter(c => new Date(c.created_at) >= today) || [];
            const completedCalls = allCalls?.filter(c => c.status === 'completed') || [];

            const totalDuration = completedCalls.reduce((acc, c) => acc + (c.duration_seconds || 0), 0);
            const avgSecs = completedCalls.length > 0 ? totalDuration / completedCalls.length : 0;
            const avgFmt = `${Math.floor(avgSecs / 60)}:${(avgSecs % 60).toFixed(0).padStart(2, '0')}`;

            const connRate = allCalls && allCalls.length > 0
                ? ((completedCalls.length / allCalls.length) * 100).toFixed(1) + '%'
                : '0%';

            // 3. Fetch balance
            const { data: wallet } = await supabase
                .from('credits_wallet')
                .select('balance')
                .maybeSingle();

            setStats({
                activeCalls: 0,
                todayCalls: todayCalls.length,
                avgDuration: avgFmt,
                connectionRate: connRate,
                balance: `R$ ${wallet?.balance ? Number(wallet.balance).toFixed(2) : '0,00'}`
            });
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Carregando dados...</div>;

    return (
        <div>
            <div className="stats-grid">
                <div className="stat-card blue">
                    <div className="stat-icon blue"><Zap size={20} /></div>
                    <div className="stat-value">{stats.balance}</div>
                    <div className="stat-label">Saldo Disponível</div>
                    <div className="stat-change up">Pronto para ligar</div>
                </div>
                <div className="stat-card green">
                    <div className="stat-icon green"><Activity size={20} /></div>
                    <div className="stat-value">{stats.todayCalls}</div>
                    <div className="stat-label">Chamadas hoje</div>
                    <div className="stat-change up"><ArrowUpRight size={13} /> +12% vs ontem</div>
                </div>
                <div className="stat-card purple">
                    <div className="stat-icon purple"><Clock size={20} /></div>
                    <div className="stat-value">{stats.avgDuration}</div>
                    <div className="stat-label">Duração média</div>
                </div>
                <div className="stat-card yellow">
                    <div className="stat-icon yellow"><TrendingUp size={20} /></div>
                    <div className="stat-value">{stats.connectionRate}</div>
                    <div className="stat-label">Taxa de conexão</div>
                </div>
            </div>

            <div className="grid-2" style={{ marginTop: 24 }}>
                {/* Recent Calls List */}
                <div className="card">
                    <div className="card-header">
                        <span className="card-title"><Activity size={14} /> Chamadas Recentes</span>
                    </div>
                    {recentCalls.length === 0 ? (
                        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                            Nenhuma chamada registrada ainda.
                        </div>
                    ) : (
                        recentCalls.map(c => (
                            <div key={c.id} style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '12px 0', borderBottom: '1px solid rgba(56,82,130,0.12)'
                            }}>
                                <div className={`avatar ${c.status === 'completed' ? 'green' : 'blue'}`}>
                                    {c.status === 'completed' ? <Phone size={14} /> : <PhoneOff size={14} />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600 }}>{c.to_number}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                        {new Date(c.created_at).toLocaleTimeString()} • {c.direction === 'outbound' ? 'Saída' : 'Entrada'}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span className={`badge ${c.status === 'completed' ? 'green' : 'blue'}`}>
                                        {c.status === 'completed' ? 'Sucesso' : 'Iniciada'}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Upsell/CTA */}
                <div className="card" style={{
                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                    color: 'white', border: 'none', padding: 32,
                    display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center'
                }}>
                    <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Potencialize suas Vendas</h3>
                    <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 20 }}>
                        Adicione créditos para continuar realizando chamadas de alta qualidade.
                    </p>
                    <button style={{
                        padding: '12px 24px', borderRadius: 10,
                        background: 'var(--primary-500)', color: 'white',
                        border: 'none', fontSize: 14, fontWeight: 700,
                        cursor: 'pointer', transition: 'transform 0.2s'
                    }}>
                        Comprar Créditos
                    </button>
                </div>
            </div>
        </div>
    );
}
