import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, MessageCircle } from 'lucide-react';

type AuthView = 'login' | 'signup' | 'forgot';

interface AuthPageProps {
    onAuth: () => void;
}

export default function AuthPage({ onAuth }: AuthPageProps) {
    const [view, setView] = useState<AuthView>('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Form fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const resetForm = () => {
        setError('');
        setSuccess('');
        setPassword('');
        setConfirmPassword('');
        setShowPassword(false);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                if (error.message.includes('Invalid login')) {
                    setError('E-mail ou senha incorretos.');
                } else if (error.message.includes('Email not confirmed')) {
                    setError('E-mail ainda não confirmado. Verifique sua caixa de entrada.');
                } else {
                    setError('Erro ao entrar. Tente novamente.');
                }
            } else {
                onAuth();
            }
        } catch {
            setError('Erro de conexão. Verifique sua internet.');
        }
        setLoading(false);
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }
        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }
        if (!fullName.trim()) {
            setError('Informe seu nome completo.');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: fullName },
                },
            });
            if (error) {
                if (error.message.includes('already registered')) {
                    setError('Este e-mail já está cadastrado.');
                } else {
                    setError('Erro ao criar conta. Tente novamente.');
                }
            } else {
                // Acesso imediato para testes (confirmação por e-mail desativada)
                onAuth();
            }
        } catch {
            setError('Erro de conexão. Verifique sua internet.');
        }
        setLoading(false);
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email.trim()) {
            setError('Informe seu e-mail.');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error) {
                setError('Erro ao enviar e-mail. Tente novamente.');
            } else {
                setSuccess('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
            }
        } catch {
            setError('Erro de conexão. Verifique sua internet.');
        }
        setLoading(false);
    };

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '12px 14px 12px 42px', fontSize: 14,
        border: '1px solid rgba(56,82,130,0.15)', borderRadius: 12,
        background: 'rgba(255,255,255,0.8)', color: '#18181b',
        fontFamily: "'DM Sans', sans-serif", outline: 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
    };

    const labelStyle: React.CSSProperties = {
        fontSize: 13, fontWeight: 600, color: '#52525b',
        display: 'block', marginBottom: 6,
    };

    const iconStyle: React.CSSProperties = {
        position: 'absolute', left: 14, top: '50%',
        transform: 'translateY(-50%)', color: '#a1a1aa',
        pointerEvents: 'none',
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 50%, #f5f3ff 100%)',
            fontFamily: "'DM Sans', sans-serif",
            padding: 20,
        }}>
            <div style={{
                width: '100%', maxWidth: 440,
                background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
                borderRadius: 24, padding: '40px 36px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
                border: '1px solid rgba(255,255,255,0.6)',
            }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 6 }}>
                        <div style={{
                            width: 42, height: 42, borderRadius: 12,
                            background: 'var(--primary-500, #12b573)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <MessageCircle size={22} color="white" />
                        </div>
                        <span style={{ fontSize: 28, fontWeight: 700, color: '#18181b', letterSpacing: -0.5 }}>
                            bevoiply
                        </span>
                    </div>
                    <p style={{ fontSize: 13, color: '#71717a', marginTop: 8 }}>
                        {view === 'login' && 'Entre na sua conta para continuar'}
                        {view === 'signup' && 'Crie sua conta gratuita'}
                        {view === 'forgot' && 'Recupere o acesso à sua conta'}
                    </p>
                </div>

                {/* Error / Success messages */}
                {error && (
                    <div style={{
                        padding: '10px 14px', borderRadius: 10, marginBottom: 16,
                        background: '#fef2f2', border: '1px solid #fecaca',
                        color: '#dc2626', fontSize: 13, fontWeight: 500,
                    }}>
                        {error}
                    </div>
                )}
                {success && (
                    <div style={{
                        padding: '10px 14px', borderRadius: 10, marginBottom: 16,
                        background: '#f0fdf4', border: '1px solid #bbf7d0',
                        color: '#16a34a', fontSize: 13, fontWeight: 500,
                    }}>
                        {success}
                    </div>
                )}

                {/* ===== LOGIN ===== */}
                {view === 'login' && (
                    <form onSubmit={handleLogin}>
                        <div style={{ marginBottom: 16 }}>
                            <label style={labelStyle}>E-mail</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={16} style={iconStyle} />
                                <input
                                    type="email" required value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    style={inputStyle}
                                />
                            </div>
                        </div>
                        <div style={{ marginBottom: 8 }}>
                            <label style={labelStyle}>Senha</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} style={iconStyle} />
                                <input
                                    type={showPassword ? 'text' : 'password'} required value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Sua senha"
                                    style={inputStyle}
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', cursor: 'pointer', color: '#a1a1aa', display: 'flex',
                                    }}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div style={{ textAlign: 'right', marginBottom: 20 }}>
                            <button type="button" onClick={() => { setView('forgot'); resetForm(); }}
                                style={{
                                    background: 'none', border: 'none', color: '#12b573',
                                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                }}
                            >
                                Esqueceu a senha?
                            </button>
                        </div>

                        <button type="submit" disabled={loading}
                            style={{
                                width: '100%', padding: '13px 0', fontSize: 15, fontWeight: 700,
                                background: loading ? '#86efac' : '#12b573', color: 'white',
                                border: 'none', borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', gap: 8,
                                transition: 'background 0.2s',
                            }}
                        >
                            {loading ? 'Entrando...' : <><span>Entrar</span><ArrowRight size={16} /></>}
                        </button>

                        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#71717a' }}>
                            Não tem uma conta?{' '}
                            <button type="button" onClick={() => { setView('signup'); resetForm(); }}
                                style={{
                                    background: 'none', border: 'none', color: '#12b573',
                                    fontWeight: 700, cursor: 'pointer', fontSize: 13,
                                }}
                            >
                                Criar conta grátis
                            </button>
                        </div>
                    </form>
                )}

                {/* ===== SIGNUP ===== */}
                {view === 'signup' && (
                    <form onSubmit={handleSignup}>
                        <div style={{ marginBottom: 16 }}>
                            <label style={labelStyle}>Nome completo</label>
                            <div style={{ position: 'relative' }}>
                                <User size={16} style={iconStyle} />
                                <input
                                    type="text" required value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                    placeholder="Seu nome completo"
                                    style={inputStyle}
                                />
                            </div>
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <label style={labelStyle}>E-mail</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={16} style={iconStyle} />
                                <input
                                    type="email" required value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    style={inputStyle}
                                />
                            </div>
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <label style={labelStyle}>Senha</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} style={iconStyle} />
                                <input
                                    type={showPassword ? 'text' : 'password'} required value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                    style={inputStyle}
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', cursor: 'pointer', color: '#a1a1aa', display: 'flex',
                                    }}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <div style={{ marginBottom: 24 }}>
                            <label style={labelStyle}>Confirmar senha</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} style={iconStyle} />
                                <input
                                    type="password" required value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="Repita a senha"
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        <button type="submit" disabled={loading}
                            style={{
                                width: '100%', padding: '13px 0', fontSize: 15, fontWeight: 700,
                                background: loading ? '#86efac' : '#12b573', color: 'white',
                                border: 'none', borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', gap: 8,
                                transition: 'background 0.2s',
                            }}
                        >
                            {loading ? 'Criando conta...' : <><span>Criar conta</span><ArrowRight size={16} /></>}
                        </button>

                        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#71717a' }}>
                            Já tem uma conta?{' '}
                            <button type="button" onClick={() => { setView('login'); resetForm(); }}
                                style={{
                                    background: 'none', border: 'none', color: '#12b573',
                                    fontWeight: 700, cursor: 'pointer', fontSize: 13,
                                }}
                            >
                                Entrar
                            </button>
                        </div>
                    </form>
                )}

                {/* ===== FORGOT PASSWORD ===== */}
                {view === 'forgot' && (
                    <form onSubmit={handleForgotPassword}>
                        <div style={{ marginBottom: 24 }}>
                            <label style={labelStyle}>E-mail cadastrado</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={16} style={iconStyle} />
                                <input
                                    type="email" required value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    style={inputStyle}
                                />
                            </div>
                            <p style={{ fontSize: 12, color: '#a1a1aa', marginTop: 8 }}>
                                Enviaremos um link para redefinir sua senha.
                            </p>
                        </div>

                        <button type="submit" disabled={loading}
                            style={{
                                width: '100%', padding: '13px 0', fontSize: 15, fontWeight: 700,
                                background: loading ? '#86efac' : '#12b573', color: 'white',
                                border: 'none', borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', gap: 8,
                                transition: 'background 0.2s',
                            }}
                        >
                            {loading ? 'Enviando...' : <><span>Enviar link de recuperação</span><ArrowRight size={16} /></>}
                        </button>

                        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#71717a' }}>
                            Lembrou a senha?{' '}
                            <button type="button" onClick={() => { setView('login'); resetForm(); }}
                                style={{
                                    background: 'none', border: 'none', color: '#12b573',
                                    fontWeight: 700, cursor: 'pointer', fontSize: 13,
                                }}
                            >
                                Voltar ao login
                            </button>
                        </div>
                    </form>
                )}

                {/* Footer */}
                <div style={{
                    textAlign: 'center', marginTop: 28, paddingTop: 20,
                    borderTop: '1px solid rgba(0,0,0,0.06)',
                    fontSize: 11, color: '#a1a1aa',
                }}>
                    Feito com 🧡 por{' '}
                    <a href="https://agenciabenck.com/" target="_blank" rel="noopener noreferrer"
                        style={{ color: '#12b573', fontWeight: 600, textDecoration: 'none' }}
                    >
                        Agência Benck
                    </a>
                </div>
            </div>
        </div>
    );
}
