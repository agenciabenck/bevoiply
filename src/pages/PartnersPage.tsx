import { useState } from 'react';
import {
    Gift, Users, Copy, Check, TrendingUp, DollarSign,
    Share2, ArrowRight, ExternalLink
} from 'lucide-react';

const tiers = [
    { min: 1, max: 5, pct: 15 },
    { min: 6, max: 15, pct: 20 },
    { min: 16, max: 50, pct: 25 },
    { min: 51, max: Infinity, pct: 30 },
];

const referrals = [
    { name: 'AgênciaX Digital', plan: 'Professional', status: 'active', since: '12/01/2026', rev: 4700 },
    { name: 'CallCenter Norte', plan: 'Enterprise', since: '05/02/2026', status: 'active', rev: 9700 },
    { name: 'TechVendas SP', plan: 'Start', since: '18/02/2026', status: 'pending', rev: 0 },
];

const steps = [
    { n: '1', title: 'Compartilhe seu link', desc: 'Envie seu link exclusivo para indicados.' },
    { n: '2', title: 'Eles assinam', desc: 'Quando assinarem qualquer plano, a comissão é creditada.' },
    { n: '3', title: 'Receba comissão', desc: 'Receba recorrente enquanto o cliente estiver ativo.' },
];

export default function PartnersPage() {
    const [copied, setCopied] = useState(false);
    const link = 'https://app.bevoiply.com?ref=erik-benck';
    const activeCount = referrals.filter(r => r.status === 'active').length;
    const totalRev = referrals.reduce((a, r) => a + r.rev, 0);

    const copy = () => {
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2>Programa de Parceiros</h2>
                    <p className="subtitle">Indique e ganhe comissão recorrente em todos os planos</p>
                </div>
            </div>

            {/* How it works */}
            <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-header"><span className="card-title"><Gift size={14} /> Como funciona</span></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                    {steps.map(s => (
                        <div key={s.n} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: '50%',
                                background: 'var(--primary-500)', color: 'white',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 14, fontWeight: 700, flexShrink: 0,
                            }}>{s.n}</div>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{s.title}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Your link + KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
                <div className="card" style={{ gridColumn: 'span 1' }}>
                    <div className="card-header"><span className="card-title"><Share2 size={14} /> Seu link exclusivo</span></div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <input className="input" readOnly value={link} style={{ fontSize: 12 }} />
                        <button className="btn btn-primary" onClick={copy} style={{ whiteSpace: 'nowrap' }}>
                            {copied ? <><Check size={14} /> Copiado</> : <><Copy size={14} /> Copiar</>}
                        </button>
                    </div>
                </div>

                <div className="stat-card blue">
                    <div className="stat-icon blue"><Users size={18} /></div>
                    <div className="stat-value">{activeCount}</div>
                    <div className="stat-label">Clientes ativos indicados</div>
                </div>

                <div className="stat-card green">
                    <div className="stat-icon green"><DollarSign size={18} /></div>
                    <div className="stat-value">R$ {totalRev.toLocaleString('pt-BR')}</div>
                    <div className="stat-label">Receita gerada este mês</div>
                </div>
            </div>

            {/* Tiers + Referrals */}
            <div className="grid-2">
                <div className="card">
                    <div className="card-header">
                        <span className="card-title"><TrendingUp size={14} /> Faixas de comissão</span>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Clientes ativos</th>
                                <th>Comissão</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tiers.map((t, i) => (
                                <tr key={i} style={activeCount >= t.min && activeCount <= t.max ? { background: 'rgba(0,200,83,0.04)' } : {}}>
                                    <td style={{ fontSize: 13 }}>{t.max === Infinity ? `${t.min}+` : `${t.min} - ${t.max}`}</td>
                                    <td>
                                        <span className={`badge ${activeCount >= t.min && activeCount <= t.max ? 'blue' : 'gray'}`}>
                                            {t.pct}% recorrente
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="card">
                    <div className="card-header">
                        <span className="card-title"><Users size={14} /> Seus indicados</span>
                        <span className="badge blue">{referrals.length}</span>
                    </div>
                    {referrals.map((r, i) => (
                        <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '12px 0',
                            borderBottom: i < referrals.length - 1 ? '1px solid var(--border-color)' : 'none',
                        }}>
                            <div className="avatar">{r.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 700 }}>{r.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.plan} — desde {r.since}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span className={`badge ${r.status === 'active' ? 'green' : 'yellow'}`}>
                                    {r.status === 'active' ? 'Ativo' : 'Pendente'}
                                </span>
                                {r.rev > 0 && (
                                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--success-500)', marginTop: 2 }}>
                                        R$ {r.rev.toLocaleString('pt-BR')}/mês
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 14 }}>
                        Ver painel completo <ExternalLink size={13} />
                    </button>
                </div>
            </div>
        </div>
    );
}
