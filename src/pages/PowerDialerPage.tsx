import { useState } from 'react';
import {
    Play, Pause, SkipForward, StopCircle, Phone,
    Users, Clock, TrendingUp, MessageSquare, ChevronRight
} from 'lucide-react';

const data = [
    { id: '1', phone: '+55 11 98765-4321', name: 'João Silva', co: 'Tech Corp', status: 'completed', att: 1 },
    { id: '2', phone: '+55 21 97654-3210', name: 'Maria Santos', co: 'Inova Soluções', status: 'completed', att: 1 },
    { id: '3', phone: '+55 31 99876-5432', name: 'Roberto Lima', co: 'Global Systems', status: 'dialing', att: 0 },
    { id: '4', phone: '+55 41 91234-5678', name: 'Fernanda Costa', co: 'Nexus Digital', status: 'pending', att: 0 },
    { id: '5', phone: '+55 48 98765-4321', name: 'André Oliveira', co: 'StartApp', status: 'pending', att: 0 },
    { id: '6', phone: '+55 51 97654-3210', name: 'Patrícia Mendes', co: 'Cloud Nine', status: 'pending', att: 0 },
    { id: '7', phone: '+55 61 99876-5432', name: 'Lucas Pereira', co: 'DataFlow', status: 'pending', att: 0 },
    { id: '8', phone: '+55 71 91234-5678', name: 'Camila Rocha', co: 'Byte Solutions', status: 'pending', att: 0 },
];

type State = 'idle' | 'running' | 'paused';

const badge: Record<string, { l: string; c: string }> = {
    pending: { l: 'Pendente', c: 'gray' }, dialing: { l: 'Discando', c: 'blue' },
    completed: { l: 'Concluída', c: 'green' }, 'no-answer': { l: 'Sem resposta', c: 'yellow' },
    busy: { l: 'Ocupado', c: 'red' },
};

export default function PowerDialerPage() {
    const [st, setSt] = useState<State>('idle');
    const [curIdx] = useState(2);
    const [notes, setNotes] = useState('');
    const done = data.filter(c => c.status === 'completed').length;
    const pct = (done / data.length) * 100;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2>Discador Automático</h2>
                    <p className="subtitle">Campanha: Prospecção Enterprise — Q1 2026</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {st === 'idle' && <button className="btn btn-primary" onClick={() => setSt('running')}><Play size={15} /> Iniciar</button>}
                    {st === 'running' && (
                        <>
                            <button className="btn btn-ghost" onClick={() => setSt('paused')}><Pause size={15} /> Pausar</button>
                            <button className="btn btn-ghost"><SkipForward size={15} /> Pular</button>
                            <button className="btn btn-danger" onClick={() => setSt('idle')}><StopCircle size={15} /> Parar</button>
                        </>
                    )}
                    {st === 'paused' && (
                        <>
                            <button className="btn btn-primary" onClick={() => setSt('running')}><Play size={15} /> Retomar</button>
                            <button className="btn btn-danger" onClick={() => setSt('idle')}><StopCircle size={15} /> Parar</button>
                        </>
                    )}
                </div>
            </div>

            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="stat-card blue"><div className="stat-icon blue"><Users size={18} /></div><div className="stat-value">{data.length}</div><div className="stat-label">Total de contatos</div></div>
                <div className="stat-card green"><div className="stat-icon green"><Phone size={18} /></div><div className="stat-value">{done}</div><div className="stat-label">Conectadas</div></div>
                <div className="stat-card cyan"><div className="stat-icon cyan"><Clock size={18} /></div><div className="stat-value">3:42</div><div className="stat-label">Duração média</div></div>
                <div className="stat-card yellow"><div className="stat-icon yellow"><TrendingUp size={18} /></div><div className="stat-value">{pct.toFixed(0)}%</div><div className="stat-label">Progresso</div></div>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Progresso da campanha</span>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{done}/{data.length}</span>
                </div>
                <div className="progress-bar"><div className="progress-fill blue" style={{ width: `${pct}%` }}></div></div>
            </div>

            <div className="grid-2-1">
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Fila de discagem</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{data.length - done} restantes</span>
                    </div>
                    <div className="dialer-queue">
                        {data.map((c, i) => {
                            const b = badge[c.status] || badge.pending;
                            const active = i === curIdx && st !== 'idle';
                            return (
                                <div key={c.id} className={`queue-item ${active ? 'active' : ''}`}>
                                    <div className="queue-position">{i + 1}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.co} • {c.phone}</div>
                                    </div>
                                    <span className={`badge ${b.c}`}>{active && c.status === 'dialing' && <span className="dot"></span>}{b.l}</span>
                                    {active && <ChevronRight size={14} style={{ color: 'var(--accent-blue)' }} />}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <div className="card" style={{ marginBottom: 12 }}>
                        <div className="card-header"><span className="card-title"><Phone size={14} /> Contato atual</span></div>
                        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 3 }}>{data[curIdx].name}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>{data[curIdx].co}</div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--accent-blue-light)', fontVariantNumeric: 'tabular-nums', marginBottom: 12 }}>{data[curIdx].phone}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Tentativas: {data[curIdx].att}/3</div>
                    </div>
                    <div className="card" style={{ marginBottom: 12 }}>
                        <div className="card-header"><span className="card-title"><MessageSquare size={14} /> Roteiro</span></div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                            <p><strong style={{ color: 'var(--accent-blue-light)' }}>Abertura:</strong> "Bom dia, [nome], tudo bem? Aqui é [seu nome]..."</p>
                            <p style={{ marginTop: 6 }}><strong style={{ color: 'var(--accent-yellow)' }}>Qualificação:</strong> "Como vocês lidam hoje com [dor]?"</p>
                            <p style={{ marginTop: 6 }}><strong style={{ color: 'var(--accent-green)' }}>Fechamento:</strong> "Posso agendar uma demonstração de 15 minutos?"</p>
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-header"><span className="card-title">Observações</span></div>
                        <textarea className="input" rows={3} placeholder="Registrar notas da chamada..." value={notes} onChange={e => setNotes(e.target.value)} style={{ resize: 'vertical' }} />
                        <button className="btn btn-primary" style={{ marginTop: 10, width: '100%', justifyContent: 'center' }}>Salvar e avançar</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
