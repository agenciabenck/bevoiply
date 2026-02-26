import { useState } from 'react';
import {
    Search, Play, Download, Brain, MessageCircle,
    AlertTriangle, CheckCircle, Clock, Filter
} from 'lucide-react';

const recs = [
    { id: '1', name: 'João Silva', co: 'Tech Corp', phone: '+55 11 98765-4321', dur: 312, date: '24/02/2026 14:32', score: 0.78, sent: 'positive' as const, ok: true, sum: 'Cliente interessado no plano Enterprise. Solicitou proposta formal.' },
    { id: '2', name: 'Maria Santos', co: 'Inova Soluções', phone: '+55 21 97654-3210', dur: 485, date: '24/02/2026 14:15', score: 0.45, sent: 'neutral' as const, ok: true, sum: 'Reunião agendada para sexta. Comparando com concorrente.' },
    { id: '3', name: 'Roberto Lima', co: 'Global Systems', phone: '+55 31 99876-5432', dur: 198, date: '24/02/2026 13:50', score: -0.2, sent: 'negative' as const, ok: true, sum: 'Objeção de preço. Solicitou desconto. Sem urgência.' },
    { id: '4', name: 'Fernanda Costa', co: 'Nexus Digital', phone: '+55 41 91234-5678', dur: 267, date: '24/02/2026 13:22', score: 0.85, sent: 'very_positive' as const, ok: false, sum: '' },
];

const analysis = {
    summary: 'O cliente demonstrou alto interesse no plano Enterprise. Mencionou que a empresa está crescendo e precisa de uma solução escalável. Solicitou proposta formal com valores para 50 ramais.',
    objections: [
        { text: 'Preço acima do orçamento atual', sev: 'high' as const, ctx: 'No minuto 3:45, o cliente mencionou que o orçamento aprovado é limitado.', counter: 'Destacar o ROI e oferecer plano de pagamento.' },
        { text: 'Contrato longo demais', sev: 'low' as const, ctx: 'No minuto 4:20, questionou a necessidade de contrato anual.', counter: 'Oferecer teste grátis de 30 dias sem compromisso.' },
    ],
    actions: [
        { text: 'Enviar proposta personalizada em até 24h', pri: 'high' as const, why: 'Cliente pronto para avançar, comparando com concorrente.' },
        { text: 'Agendar demonstração técnica com equipe de TI', pri: 'medium' as const, why: 'Quer validar integração com sistema atual.' },
        { text: 'Follow-up em 3 dias se não responder', pri: 'low' as const, why: 'Manter cadência para não perder timing.' },
    ],
    topics: ['plano enterprise', 'escalabilidade', 'integração CRM', 'preço', '50 ramais'],
    ratio: { bdr: 42, cli: 58 },
    deal: 0.72,
    sentiment: 0.78,
};

const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

const sentColors: Record<string, string> = {
    very_positive: '#34d399', positive: '#4ade80', neutral: '#fbbf24', negative: '#f87171', very_negative: 'var(--accent-red)',
};

const sentLabels: Record<string, string> = {
    very_positive: 'Muito positivo', positive: 'Positivo', neutral: 'Neutro', negative: 'Negativo', very_negative: 'Muito negativo',
};

const transcript = [
    { who: 'bdr', t: '0:00', txt: 'Bom dia João, aqui é da VoIP SaaS. Tudo bem?' },
    { who: 'cli', t: '0:05', txt: 'Bom dia! Sim, tudo ótimo. Estava esperando sua ligação.' },
    { who: 'bdr', t: '0:12', txt: 'Que bom! Vi que vocês estão crescendo bastante. Quantos ramais precisam atualmente?' },
    { who: 'cli', t: '0:22', txt: 'Hoje temos 30, mas estamos planejando expandir para 50 no próximo trimestre.' },
    { who: 'bdr', t: '0:35', txt: 'Perfeito. Nosso plano Enterprise é ideal para esse volume. Posso preparar uma proposta?' },
    { who: 'cli', t: '0:45', txt: 'Sim, seria ótimo. Mas preciso que caiba no orçamento que foi aprovado.' },
];

export default function AudioAIPage() {
    const [selId, setSelId] = useState('1');
    const [tab, setTab] = useState<'ai' | 'tr'>('ai');
    const sel = recs.find(r => r.id === selId)!;
    const bars = Array.from({ length: 55 }, () => 10 + Math.random() * 42);

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2>Repositório de Áudio & IA</h2>
                    <p className="subtitle">Gravações com análise inteligente — Gemini 1.5 Pro</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <div className="search-box">
                        <Search />
                        <input className="input" placeholder="Buscar gravações..." style={{ width: 220 }} />
                    </div>
                    <button className="btn-icon"><Filter size={16} /></button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
                {/* Lista */}
                <div className="card" style={{ maxHeight: 'calc(100vh - 140px)', overflowY: 'auto', padding: 0 }}>
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="card-title" style={{ margin: 0 }}>Gravações</span>
                        <span className="badge blue">{recs.length}</span>
                    </div>
                    {recs.map(r => (
                        <div key={r.id} onClick={() => setSelId(r.id)} style={{
                            padding: '12px 16px', cursor: 'pointer',
                            background: selId === r.id ? 'rgba(59,130,246,0.06)' : 'transparent',
                            borderLeft: selId === r.id ? '3px solid var(--accent-blue)' : '3px solid transparent',
                            borderBottom: '1px solid rgba(56,82,130,0.1)',
                            transition: 'var(--transition)',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                <span style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</span>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmt(r.dur)}</span>
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5 }}>{r.co} • {r.date}</div>
                            <div style={{ display: 'flex', gap: 5 }}>
                                <span style={{ fontSize: 10, fontWeight: 600, color: sentColors[r.sent], background: `${sentColors[r.sent]}12`, padding: '2px 6px', borderRadius: 4 }}>{sentLabels[r.sent]}</span>
                                {!r.ok && <span className="badge yellow" style={{ fontSize: 10 }}>Processando...</span>}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Detalhe */}
                <div>
                    <div className="card" style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                            <button className="call-btn call" style={{ width: 42, height: 42 }}><Play size={18} /></button>
                            <div style={{ flex: 1 }}>
                                <div className="audio-waveform">
                                    {bars.map((h, i) => <div key={i} className="waveform-bar" style={{ height: `${h}%`, opacity: i < 18 ? 1 : 0.35 }} />)}
                                </div>
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)' }}>1:23 / {fmt(sel.dur)}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-ghost" style={{ fontSize: 11 }}><Download size={13} /> WAV</button>
                            <button className="btn btn-ghost" style={{ fontSize: 11 }}><Download size={13} /> MP3</button>
                            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>Dual-channel (estéreo) • {sel.name}</span>
                        </div>
                    </div>

                    <div className="tabs">
                        <button className={`tab ${tab === 'ai' ? 'active' : ''}`} onClick={() => setTab('ai')}><Brain size={13} /> Análise IA</button>
                        <button className={`tab ${tab === 'tr' ? 'active' : ''}`} onClick={() => setTab('tr')}><MessageCircle size={13} /> Transcrição</button>
                    </div>

                    {tab === 'ai' && (
                        <div className="grid-2">
                            <div className="card">
                                <div className="card-header"><span className="card-title"><Brain size={14} /> Resumo da chamada</span></div>
                                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 16 }}>{analysis.summary}</p>
                                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div className="sentiment-gauge"><span className="sentiment-value" style={{ color: sentColors.positive }}>{(analysis.sentiment * 100).toFixed(0)}%</span></div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Sentimento</div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ marginBottom: 12 }}>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Probabilidade de negócio</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div className="progress-bar" style={{ flex: 1 }}><div className="progress-fill green" style={{ width: `${analysis.deal * 100}%` }}></div></div>
                                                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-green)' }}>{(analysis.deal * 100).toFixed(0)}%</span>
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Proporção de fala</div>
                                            <div style={{ display: 'flex', gap: 3, fontSize: 11 }}>
                                                <div style={{ background: 'var(--accent-blue)', padding: '2px 8px', borderRadius: 4, color: 'white', width: `${analysis.ratio.bdr}%`, textAlign: 'center' }}>BDR {analysis.ratio.bdr}%</div>
                                                <div style={{ background: 'var(--accent-purple)', padding: '2px 8px', borderRadius: 4, color: 'white', width: `${analysis.ratio.cli}%`, textAlign: 'center' }}>Cliente {analysis.ratio.cli}%</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ marginTop: 14 }}>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5 }}>Tópicos principais</div>
                                    {analysis.topics.map(t => <span key={t} className="tag">{t}</span>)}
                                </div>
                            </div>

                            <div>
                                <div className="card" style={{ marginBottom: 14 }}>
                                    <div className="card-header"><span className="card-title"><AlertTriangle size={14} /> Objeções detectadas</span><span className="badge red">{analysis.objections.length}</span></div>
                                    {analysis.objections.map((o, i) => (
                                        <div key={i} className={`objection-item ${o.sev === 'low' ? 'low' : o.sev === 'high' ? '' : 'medium'}`}>
                                            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{o.text}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} />{o.ctx}</div>
                                            <div style={{ fontSize: 11, color: 'var(--accent-green)' }}>💡 {o.counter}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="card">
                                    <div className="card-header"><span className="card-title"><CheckCircle size={14} /> Próximas ações</span></div>
                                    {analysis.actions.map((a, i) => (
                                        <div key={i} className="action-item">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                                <span style={{ fontSize: 13, fontWeight: 600 }}>{a.text}</span>
                                                <span className={`badge ${a.pri === 'high' ? 'red' : a.pri === 'medium' ? 'yellow' : 'blue'}`}>{a.pri === 'high' ? 'Alta' : a.pri === 'medium' ? 'Média' : 'Baixa'}</span>
                                            </div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.why}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {tab === 'tr' && (
                        <div className="card">
                            {transcript.map((s, i) => (
                                <div key={i} style={{
                                    display: 'flex', gap: 10, padding: '10px 12px', marginBottom: 6,
                                    background: s.who === 'bdr' ? 'rgba(59,130,246,0.04)' : 'rgba(139,92,246,0.04)',
                                    borderRadius: 'var(--radius-md)',
                                    borderLeft: `3px solid ${s.who === 'bdr' ? 'var(--accent-blue)' : 'var(--accent-purple)'}`,
                                }}>
                                    <div style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap', paddingTop: 2, fontVariantNumeric: 'tabular-nums' }}>{s.t}</div>
                                    <div>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: s.who === 'bdr' ? 'var(--accent-blue-light)' : 'var(--accent-purple)', marginBottom: 1 }}>{s.who === 'bdr' ? 'BDR' : 'Cliente'}</div>
                                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.txt}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
