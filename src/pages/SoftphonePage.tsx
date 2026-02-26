import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Phone, PhoneOff, Mic, MicOff, Pause, Volume2,
    UserCircle, Clock, Hash, AlertCircle, Wallet
} from 'lucide-react';
import { sipService, type CallStatus } from '../lib/sipService';
import { supabase } from '../lib/supabase';

// Configurações SIP dinâmicas serão carregadas do banco de dados (user_settings)

const keys = [
    { d: '1', l: '' }, { d: '2', l: 'ABC' }, { d: '3', l: 'DEF' },
    { d: '4', l: 'GHI' }, { d: '5', l: 'JKL' }, { d: '6', l: 'MNO' },
    { d: '7', l: 'PQRS' }, { d: '8', l: 'TUV' }, { d: '9', l: 'WXYZ' },
    { d: '*', l: '' }, { d: '0', l: '+' }, { d: '#', l: '' },
];

const contacts = [
    { name: 'João Silva', phone: '+55 11 98765-4321', company: 'Agência Tech', time: '14:32' },
    { name: 'Maria Oliveira', phone: '+55 21 97654-3210', company: 'Inovação Digital', time: '14:15' },
    { name: 'Roberto Lima', phone: '+55 31 99876-5432', company: 'Global Solutions', time: '13:50' },
    { name: 'Fernanda Costa', phone: '+55 41 91234-5678', company: 'Nexus Vendas', time: '13:22' },
];

export default function SoftphonePage() {
    const [status, setStatus] = useState<CallStatus>('idle');
    const [num, setNum] = useState('');
    const [muted, setMuted] = useState(false);
    const [hold, setHold] = useState(false);
    const [timer, setTimer] = useState(0);
    const [showPad, setShowPad] = useState(true);
    const [balance, setBalance] = useState<number | null>(null);
    const registeredRef = useRef(false);
    const [sipUser, setSipUser] = useState<string>('');

    // Fetch balance on mount
    useEffect(() => {
        const fetchBalance = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data, error } = await supabase
                    .from('credits_wallet')
                    .select('balance')
                    .single();

                if (data && !error) {
                    setBalance(data.balance);
                }
            }
        };

        fetchBalance();
    }, []);

    // Register with SIP on mount with dynamic credentials
    useEffect(() => {
        const fetchSipAndRegister = async () => {
            if (registeredRef.current) return;

            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data: settings } = await supabase
                    .from('user_settings')
                    .select('sip_user, sip_password, sip_extension')
                    .single();

                if (settings?.sip_user && settings?.sip_password) {
                    const dynamicConfig = {
                        sipUser: settings.sip_user,
                        sipPassword: settings.sip_password,
                        sipServer: 'sip.telnyx.com',
                        wsServer: 'wss://sip.telnyx.com',
                    };

                    setSipUser(settings.sip_user);
                    registeredRef.current = true;
                    sipService.register(dynamicConfig, {
                        onStatusChange: (newStatus) => {
                            setStatus(newStatus);
                        },
                        onCallDuration: (seconds) => {
                            setTimer(seconds);
                        },
                    });
                } else {
                    // SEGUNDA CHANCE: Tentar atribuir um ramal agora mesmo (via RPC)
                    console.log('Nenhum ramal configurado. Tentando atribuir do pool...');
                    const { data: assigned, error: assignError } = await supabase
                        .rpc('assign_ramal_from_pool', { target_user_id: user.id });

                    if (assigned && !assignError) {
                        // Se atribuiu, recarrega os dados em 1 segundo
                        setTimeout(() => fetchSipAndRegister(), 1000);
                    } else {
                        console.warn('SIP credentials not found and pool is empty');
                        setStatus('error');
                    }
                }
            } catch (err) {
                console.error('Error fetching SIP credentials:', err);
                setStatus('error');
            }
        };

        fetchSipAndRegister();

        return () => {
            // Keep connection alive
        };
    }, []);

    const fmt = (s: number) => {
        const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
        return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}` : `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    const dial = useCallback((d: string) => {
        setNum(p => p + d);
        // Send DTMF if in a call
        if (status === 'connected') {
            sipService.sendDTMF(d);
        }
    }, [status]);

    const makeCall = async () => {
        if (!num) return;
        setTimer(0);
        setMuted(false);
        setHold(false);

        // Try to use the REST API as the primary method for reliability
        const result = await sipService.makeApiCall(sipUser, num);
        if (result.success) {
            // Start a timer for the local UI
            const t = setInterval(() => setTimer(v => v + 1), 1000);
            return () => clearInterval(t);
        }
    };

    const hangup = () => {
        sipService.hangup();
        setMuted(false);
        setHold(false);
    };

    const toggleMute = () => {
        const isMuted = sipService.toggleMute();
        setMuted(isMuted);
    };

    const toggleHold = async () => {
        const isHeld = await sipService.toggleHold();
        setHold(isHeld);
    };

    // UI labels for each status
    const labels: Record<CallStatus, string> = {
        idle: 'Iniciando sistema...',
        registering: 'Conectando ao servidor...',
        registered: 'Pronto para ligar',
        dialing: 'Discando...',
        ringing: 'Chamando...',
        connected: 'Em chamada',
        ended: 'Chamada encerrada',
        error: 'Pronto para ligar',
    };

    const statusColor: Record<CallStatus, string> = {
        idle: '#a1a1aa',
        registering: '#f59e0b',
        registered: 'var(--accent-green, #12b573)',
        dialing: '#3b82f6',
        ringing: '#3b82f6',
        connected: 'var(--accent-green, #12b573)',
        ended: '#ef4444',
        error: '#a1a1aa', // Muted color for error to keep it calm
    };

    const isInCall = status === 'dialing' || status === 'ringing' || status === 'connected';

    // SIP registration status indicator
    const SipStatus = () => (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 8,
            background: 'rgba(56, 82, 130, 0.08)',
            fontSize: 11, fontWeight: 700,
            color: 'var(--text-secondary)',
        }}>
            <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: status === 'registering' ? '#f59e0b' : '#12b573',
                boxShadow: status === 'registering' ? 'none' : '0 0 8px rgba(18,181,115,0.4)',
                flexShrink: 0
            }}></div>
            {status === 'registering' ? 'Conectando...' : 'Sistema Ativo'}
        </div>
    );

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2>Discador</h2>
                    <p className="subtitle">Central de chamadas com controles profissionais</p>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '6px 12px', borderRadius: 8,
                        background: 'rgba(59, 130, 246, 0.1)',
                        fontSize: 12, fontWeight: 600, color: '#3b82f6'
                    }}>
                        <Wallet size={14} />
                        Saldo: R$ {balance !== null ? balance.toFixed(2) : '--,--'}
                    </div>
                    <SipStatus />
                </div>
            </div>

            <div className="grid-1-2">
                <div className="softphone-panel">
                    <div className="softphone-display">
                        {status === 'connected' ? (
                            <>
                                <UserCircle size={24} style={{ color: 'var(--primary-500)', opacity: 0.8, marginBottom: 4 }} />
                                <div className="softphone-number">{num || 'Desconhecido'}</div>
                                <div className="softphone-timer">{fmt(timer)}</div>
                                <div style={{ fontSize: 13, color: statusColor[status], display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                    <span className="live-dot"></span> {labels[status]}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="softphone-number">
                                    {num || <span style={{ color: 'var(--text-muted)', fontSize: 24, fontWeight: 500 }}>Digite o número</span>}
                                </div>
                                <div className="softphone-status" style={{ color: statusColor[status] }}>
                                    {labels[status]}
                                </div>
                            </>
                        )}
                    </div>

                    {isInCall && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
                            <button className="btn-icon" onClick={toggleMute}
                                style={muted ? { background: 'var(--accent-red)', color: 'white', borderColor: 'var(--accent-red)' } : {}}>
                                {muted ? <MicOff size={16} /> : <Mic size={16} />}
                            </button>
                            <button className="btn-icon" onClick={toggleHold}
                                style={hold ? { background: 'var(--accent-yellow)', color: 'white', borderColor: 'var(--accent-yellow)' } : {}}>
                                <Pause size={16} />
                            </button>
                            <button className="btn-icon" onClick={() => setShowPad(!showPad)}><Hash size={16} /></button>
                            <button className="btn-icon"><Volume2 size={16} /></button>
                        </div>
                    )}

                    {showPad && (
                        <div className="dialpad">
                            {keys.map(k => (
                                <button key={k.d} className="dialpad-btn" onClick={() => dial(k.d)}>
                                    {k.d}
                                    {k.l && <small>{k.l}</small>}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="call-actions">
                        {!isInCall ? (
                            <>
                                <button className="btn-icon" onClick={() => setNum(p => p.slice(0, -1))} style={{ fontSize: 16 }}>←</button>
                                <button className="call-btn call" onClick={makeCall} style={!num ? { opacity: 0.35 } : {}}>
                                    <Phone size={22} />
                                </button>
                                <button className="btn-icon" onClick={() => setNum('')} style={{ fontSize: 10, fontWeight: 700 }}>LIMPAR</button>
                            </>
                        ) : (
                            <button className="call-btn hangup" onClick={hangup}><PhoneOff size={22} /></button>
                        )}
                    </div>
                </div>

                <div>
                    <div className="card" style={{ marginBottom: 16 }}>
                        <div className="card-header">
                            <span className="card-title"><Clock size={14} /> Recentes</span>
                        </div>
                        {contacts.map((c, i) => (
                            <div key={i} onClick={() => setNum(c.phone.replace(/\D/g, ''))}
                                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid rgba(56,82,130,0.12)', cursor: 'pointer', transition: 'var(--transition)' }}>
                                <div className="avatar">{c.name.split(' ').map(n => n[0]).join('')}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.company}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)' }}>{c.phone}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.time}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {status === 'connected' && (
                        <div className="card">
                            <div className="card-header"><span className="card-title">Dados da chamada</span></div>
                            <div style={{ display: 'grid', gap: 10 }}>
                                <div><div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 1 }}>Número</div><div style={{ fontSize: 13, fontWeight: 600 }}>{num}</div></div>
                                <div><div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 1 }}>Duração</div><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-green)' }}>{fmt(timer)}</div></div>
                                <div><div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 1 }}>Gravação</div><span className="badge green"><span className="dot"></span> Dual-channel</span></div>
                                <div><div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 1 }}>Status SIP</div><div style={{ fontSize: 13, color: 'var(--accent-green)' }}>● Conectado</div></div>
                            </div>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="card" style={{ borderLeft: '3px solid var(--primary-500)', background: 'rgba(0, 200, 83, 0.02)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <AlertCircle size={16} color="var(--primary-500)" />
                                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary-500)' }}>Dica: Use o navegador</span>
                            </div>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                                Seu sistema está pronto para realizar chamadas diretamente pelo navegador com alta fidelidade de áudio.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
