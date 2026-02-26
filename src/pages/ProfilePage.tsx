import { useState } from 'react';
import {
    User, Mail, Phone, Shield, Bell, Globe, Mic, Volume2,
    Camera, ChevronRight, Copy, Check, Eye, EyeOff, Key
} from 'lucide-react';

export default function ProfilePage() {
    const [copied, setCopied] = useState('');
    const [showApiKey, setShowApiKey] = useState(false);
    const [notifications, setNotifications] = useState({
        email: true,
        push: true,
        callAlerts: true,
        weeklyReport: false,
    });
    const [audioSettings, setAudioSettings] = useState({
        inputDevice: 'default',
        outputDevice: 'default',
        ringtone: 'classic',
        autoAnswer: false,
    });

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopied(field);
        setTimeout(() => setCopied(''), 2000);
    };

    const CopyButton = ({ text, field }: { text: string; field: string }) => (
        <button
            onClick={() => copyToClipboard(text, field)}
            style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: copied === field ? 'var(--primary-500)' : '#71717a',
                display: 'flex', alignItems: 'center', padding: 4,
                transition: 'var(--transition)',
            }}
            title="Copiar"
        >
            {copied === field ? <Check size={14} /> : <Copy size={14} />}
        </button>
    );

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2>Configurações</h2>
                    <p className="subtitle">Gerencie seu perfil e preferências</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

                {/* ===== PERFIL ===== */}
                <div className="card" style={{ gridColumn: '1 / -1' }}>
                    <div className="card-header">
                        <span className="card-title"><User size={14} /> Perfil</span>
                        <button className="btn btn-primary" style={{ fontSize: 12, padding: '8px 16px' }}>
                            Salvar alterações
                        </button>
                    </div>
                    <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', padding: '8px 0' }}>
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                            <div className="avatar" style={{
                                width: 88, height: 88, fontSize: 32, background: '#475569',
                                borderRadius: 20,
                            }}>U</div>
                            <button style={{
                                position: 'absolute', bottom: -4, right: -4,
                                width: 30, height: 30, borderRadius: 999,
                                background: 'var(--primary-500)', color: 'white',
                                border: '3px solid var(--bg-card)', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Camera size={13} />
                            </button>
                        </div>
                        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: '#71717a', display: 'block', marginBottom: 6 }}>
                                    Nome completo
                                </label>
                                <input
                                    type="text" defaultValue="Usuário"
                                    style={{
                                        width: '100%', padding: '10px 14px', fontSize: 14,
                                        border: '1px solid rgba(56,82,130,0.15)', borderRadius: 10,
                                        background: 'var(--bg-main)', color: 'var(--text-primary)',
                                        fontFamily: 'inherit', outline: 'none',
                                        transition: 'var(--transition)',
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: '#71717a', display: 'block', marginBottom: 6 }}>
                                    E-mail
                                </label>
                                <input
                                    type="email" defaultValue="usuario@empresa.com"
                                    style={{
                                        width: '100%', padding: '10px 14px', fontSize: 14,
                                        border: '1px solid rgba(56,82,130,0.15)', borderRadius: 10,
                                        background: 'var(--bg-main)', color: 'var(--text-primary)',
                                        fontFamily: 'inherit', outline: 'none',
                                        transition: 'var(--transition)',
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: '#71717a', display: 'block', marginBottom: 6 }}>
                                    Telefone
                                </label>
                                <input
                                    type="tel" defaultValue="+55 11 98765-4321"
                                    style={{
                                        width: '100%', padding: '10px 14px', fontSize: 14,
                                        border: '1px solid rgba(56,82,130,0.15)', borderRadius: 10,
                                        background: 'var(--bg-main)', color: 'var(--text-primary)',
                                        fontFamily: 'inherit', outline: 'none',
                                        transition: 'var(--transition)',
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: '#71717a', display: 'block', marginBottom: 6 }}>
                                    Empresa
                                </label>
                                <input
                                    type="text" defaultValue="Minha Empresa LTDA"
                                    style={{
                                        width: '100%', padding: '10px 14px', fontSize: 14,
                                        border: '1px solid rgba(56,82,130,0.15)', borderRadius: 10,
                                        background: 'var(--bg-main)', color: 'var(--text-primary)',
                                        fontFamily: 'inherit', outline: 'none',
                                        transition: 'var(--transition)',
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== SEGURANÇA ===== */}
                <div className="card">
                    <div className="card-header">
                        <span className="card-title"><Shield size={14} /> Segurança</span>
                    </div>
                    <div style={{ display: 'grid', gap: 14 }}>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 600, color: '#71717a', display: 'block', marginBottom: 6 }}>
                                Senha atual
                            </label>
                            <input
                                type="password" placeholder="••••••••"
                                style={{
                                    width: '100%', padding: '10px 14px', fontSize: 14,
                                    border: '1px solid rgba(56,82,130,0.15)', borderRadius: 10,
                                    background: 'var(--bg-main)', color: 'var(--text-primary)',
                                    fontFamily: 'inherit', outline: 'none',
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 600, color: '#71717a', display: 'block', marginBottom: 6 }}>
                                Nova senha
                            </label>
                            <input
                                type="password" placeholder="••••••••"
                                style={{
                                    width: '100%', padding: '10px 14px', fontSize: 14,
                                    border: '1px solid rgba(56,82,130,0.15)', borderRadius: 10,
                                    background: 'var(--bg-main)', color: 'var(--text-primary)',
                                    fontFamily: 'inherit', outline: 'none',
                                }}
                            />
                        </div>
                        <button className="btn btn-primary" style={{ fontSize: 12, padding: '9px 16px', marginTop: 4 }}>
                            <Key size={13} /> Alterar senha
                        </button>
                    </div>
                </div>

                {/* ===== NOTIFICAÇÕES ===== */}
                <div className="card">
                    <div className="card-header">
                        <span className="card-title"><Bell size={14} /> Notificações</span>
                    </div>
                    <div style={{ display: 'grid', gap: 0 }}>
                        {[
                            { key: 'email', label: 'Notificações por e-mail', desc: 'Receba alertas de chamadas por e-mail' },
                            { key: 'push', label: 'Notificações push', desc: 'Alertas no navegador em tempo real' },
                            { key: 'callAlerts', label: 'Alertas de chamada', desc: 'Som e vibração ao receber ligação' },
                            { key: 'weeklyReport', label: 'Relatório semanal', desc: 'Resumo das chamadas toda segunda' },
                        ].map((item) => (
                            <div key={item.key} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '13px 0', borderBottom: '1px solid rgba(56,82,130,0.08)',
                            }}>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</div>
                                    <div style={{ fontSize: 11, color: '#71717a', marginTop: 2 }}>{item.desc}</div>
                                </div>
                                <label style={{ position: 'relative', display: 'inline-flex', width: 40, height: 22, cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={notifications[item.key as keyof typeof notifications]}
                                        onChange={() => setNotifications(prev => ({
                                            ...prev,
                                            [item.key]: !prev[item.key as keyof typeof prev],
                                        }))}
                                        style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                                    />
                                    <span style={{
                                        width: 40, height: 22, borderRadius: 11,
                                        background: notifications[item.key as keyof typeof notifications] ? 'var(--primary-500)' : '#d4d4d8',
                                        display: 'flex', alignItems: 'center',
                                        padding: 2, transition: 'background 0.2s',
                                    }}>
                                        <span style={{
                                            width: 18, height: 18, borderRadius: 9,
                                            background: 'white', boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                                            transition: 'transform 0.2s',
                                            transform: notifications[item.key as keyof typeof notifications] ? 'translateX(18px)' : 'translateX(0)',
                                        }} />
                                    </span>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ===== CONFIGURAÇÕES DE ÁUDIO ===== */}
                <div className="card">
                    <div className="card-header">
                        <span className="card-title"><Mic size={14} /> Áudio e Dispositivos</span>
                    </div>
                    <div style={{ display: 'grid', gap: 14 }}>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 600, color: '#71717a', display: 'block', marginBottom: 6 }}>
                                <Mic size={12} style={{ verticalAlign: -1, marginRight: 4 }} /> Microfone
                            </label>
                            <select
                                value={audioSettings.inputDevice}
                                onChange={e => setAudioSettings(s => ({ ...s, inputDevice: e.target.value }))}
                                style={{
                                    width: '100%', padding: '10px 14px', fontSize: 13,
                                    border: '1px solid rgba(56,82,130,0.15)', borderRadius: 10,
                                    background: 'var(--bg-main)', color: 'var(--text-primary)',
                                    fontFamily: 'inherit', cursor: 'pointer', outline: 'none',
                                }}
                            >
                                <option value="default">Microfone padrão do sistema</option>
                                <option value="headset">Headset USB</option>
                                <option value="webcam">Microfone da webcam</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 600, color: '#71717a', display: 'block', marginBottom: 6 }}>
                                <Volume2 size={12} style={{ verticalAlign: -1, marginRight: 4 }} /> Alto-falante
                            </label>
                            <select
                                value={audioSettings.outputDevice}
                                onChange={e => setAudioSettings(s => ({ ...s, outputDevice: e.target.value }))}
                                style={{
                                    width: '100%', padding: '10px 14px', fontSize: 13,
                                    border: '1px solid rgba(56,82,130,0.15)', borderRadius: 10,
                                    background: 'var(--bg-main)', color: 'var(--text-primary)',
                                    fontFamily: 'inherit', cursor: 'pointer', outline: 'none',
                                }}
                            >
                                <option value="default">Alto-falante padrão</option>
                                <option value="headset">Headset USB</option>
                                <option value="external">Caixa externa</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 600, color: '#71717a', display: 'block', marginBottom: 6 }}>
                                Toque de chamada
                            </label>
                            <select
                                value={audioSettings.ringtone}
                                onChange={e => setAudioSettings(s => ({ ...s, ringtone: e.target.value }))}
                                style={{
                                    width: '100%', padding: '10px 14px', fontSize: 13,
                                    border: '1px solid rgba(56,82,130,0.15)', borderRadius: 10,
                                    background: 'var(--bg-main)', color: 'var(--text-primary)',
                                    fontFamily: 'inherit', cursor: 'pointer', outline: 'none',
                                }}
                            >
                                <option value="classic">Clássico</option>
                                <option value="modern">Moderno</option>
                                <option value="soft">Suave</option>
                                <option value="none">Sem toque</option>
                            </select>
                        </div>
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '10px 0',
                        }}>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>Atendimento automático</div>
                                <div style={{ fontSize: 11, color: '#71717a', marginTop: 2 }}>Atende chamadas automaticamente após 3 toques</div>
                            </div>
                            <label style={{ position: 'relative', display: 'inline-flex', width: 40, height: 22, cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={audioSettings.autoAnswer}
                                    onChange={() => setAudioSettings(s => ({ ...s, autoAnswer: !s.autoAnswer }))}
                                    style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                                />
                                <span style={{
                                    width: 40, height: 22, borderRadius: 11,
                                    background: audioSettings.autoAnswer ? 'var(--primary-500)' : '#d4d4d8',
                                    display: 'flex', alignItems: 'center',
                                    padding: 2, transition: 'background 0.2s',
                                }}>
                                    <span style={{
                                        width: 18, height: 18, borderRadius: 9,
                                        background: 'white', boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                                        transition: 'transform 0.2s',
                                        transform: audioSettings.autoAnswer ? 'translateX(18px)' : 'translateX(0)',
                                    }} />
                                </span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* ===== INTEGRAÇÃO/API ===== */}
                <div className="card">
                    <div className="card-header">
                        <span className="card-title"><Globe size={14} /> API e Integrações</span>
                    </div>
                    <div style={{ display: 'grid', gap: 14 }}>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 600, color: '#71717a', display: 'block', marginBottom: 6 }}>
                                Chave de API
                            </label>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '10px 14px',
                                border: '1px solid rgba(56,82,130,0.15)', borderRadius: 10,
                                background: 'var(--bg-main)',
                            }}>
                                <code style={{
                                    flex: 1, fontSize: 12, fontFamily: 'monospace',
                                    color: 'var(--text-secondary)', letterSpacing: 0.5,
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>
                                    {showApiKey ? 'bvp_sk_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6' : '•••••••••••••••••••••••••••••••••••'}
                                </code>
                                <button
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: '#71717a', display: 'flex', padding: 2,
                                    }}
                                >
                                    {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                                <CopyButton text="bvp_sk_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6" field="apiKey" />
                            </div>
                        </div>

                        <div>
                            <label style={{ fontSize: 12, fontWeight: 600, color: '#71717a', display: 'block', marginBottom: 6 }}>
                                Webhook URL
                            </label>
                            <input
                                type="url" placeholder="https://seusite.com/webhook"
                                style={{
                                    width: '100%', padding: '10px 14px', fontSize: 13,
                                    border: '1px solid rgba(56,82,130,0.15)', borderRadius: 10,
                                    background: 'var(--bg-main)', color: 'var(--text-primary)',
                                    fontFamily: 'inherit', outline: 'none',
                                }}
                            />
                        </div>

                        <div style={{ borderTop: '1px solid rgba(56,82,130,0.08)', paddingTop: 14 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#71717a', marginBottom: 10 }}>Integrações ativas</div>
                            {[
                                { name: 'Webhook', status: 'Desconectado', connected: false },
                                { name: 'Google Sheets', status: 'Desconectado', connected: false },
                                { name: 'CRM', status: 'Desconectado', connected: false },
                            ].map(item => (
                                <div key={item.name} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '10px 0', borderBottom: '1px solid rgba(56,82,130,0.06)',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{
                                            width: 8, height: 8, borderRadius: 4,
                                            background: item.connected ? 'var(--primary-500)' : '#d4d4d8',
                                        }} />
                                        <span style={{ fontSize: 13, fontWeight: 500 }}>{item.name}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontSize: 11, color: item.connected ? 'var(--primary-500)' : '#a1a1aa' }}>{item.status}</span>
                                        <ChevronRight size={14} color="#a1a1aa" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ===== DADOS DA CONTA ===== */}
                <div className="card">
                    <div className="card-header">
                        <span className="card-title"><Mail size={14} /> Dados da Conta</span>
                    </div>
                    <div style={{ display: 'grid', gap: 0 }}>
                        {[
                            { label: 'ID da conta', value: 'BVP-2025-001234' },
                            { label: 'Plano atual', value: 'Free', badge: true },
                            { label: 'Créditos restantes', value: '0 / 50' },
                            { label: 'Membro desde', value: '25 de fevereiro de 2025' },
                            { label: 'Último login', value: 'Agora mesmo' },
                        ].map(item => (
                            <div key={item.label} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '12px 0', borderBottom: '1px solid rgba(56,82,130,0.08)',
                            }}>
                                <span style={{ fontSize: 13, color: '#71717a' }}>{item.label}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    {item.badge ? (
                                        <span className="badge blue" style={{ fontSize: 11 }}>{item.value}</span>
                                    ) : (
                                        <span style={{ fontSize: 13, fontWeight: 500 }}>{item.value}</span>
                                    )}
                                    {item.label === 'ID da conta' && <CopyButton text={item.value} field="accountId" />}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ===== CONFIGURAÇÕES DE CHAMADA ===== */}
                <div className="card" style={{ gridColumn: '1 / -1' }}>
                    <div className="card-header">
                        <span className="card-title"><Phone size={14} /> Configurações de Chamada</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 600, color: '#71717a', display: 'block', marginBottom: 6 }}>
                                CallerID padrão
                            </label>
                            <input
                                type="tel" defaultValue="+55 11 4000-1234"
                                style={{
                                    width: '100%', padding: '10px 14px', fontSize: 14,
                                    border: '1px solid rgba(56,82,130,0.15)', borderRadius: 10,
                                    background: 'var(--bg-main)', color: 'var(--text-primary)',
                                    fontFamily: 'inherit', outline: 'none',
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 600, color: '#71717a', display: 'block', marginBottom: 6 }}>
                                Prefixo de discagem
                            </label>
                            <select style={{
                                width: '100%', padding: '10px 14px', fontSize: 13,
                                border: '1px solid rgba(56,82,130,0.15)', borderRadius: 10,
                                background: 'var(--bg-main)', color: 'var(--text-primary)',
                                fontFamily: 'inherit', cursor: 'pointer', outline: 'none',
                            }}>
                                <option value="+55">🇧🇷 Brasil (+55)</option>
                                <option value="+1">🇺🇸 EUA (+1)</option>
                                <option value="+351">🇵🇹 Portugal (+351)</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: 12, fontWeight: 600, color: '#71717a', display: 'block', marginBottom: 6 }}>
                                Gravação de chamadas
                            </label>
                            <select style={{
                                width: '100%', padding: '10px 14px', fontSize: 13,
                                border: '1px solid rgba(56,82,130,0.15)', borderRadius: 10,
                                background: 'var(--bg-main)', color: 'var(--text-primary)',
                                fontFamily: 'inherit', cursor: 'pointer', outline: 'none',
                            }}>
                                <option value="dual">Dual-channel (recomendado)</option>
                                <option value="single">Canal único</option>
                                <option value="off">Desativado</option>
                            </select>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
