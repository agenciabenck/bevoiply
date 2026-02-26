import { useState } from 'react';
import { Check, Zap, Shield, Crown } from 'lucide-react';
import { supabase } from '../lib/supabase';

const plans = [
    {
        name: 'Starter',
        price: '97',
        icon: <Zap size={24} />,
        color: '#3b82f6',
        features: [
            '1 Agente (Ramal)',
            'Softphone WebRTC',
            'Até 300 min/mês (créditos extras)',
            'Histórico de chamadas',
            'Suporte via e-mail'
        ],
        buttonText: 'Assinar Starter',
        popular: false
    },
    {
        name: 'Pro',
        price: '197',
        icon: <Shield size={24} />,
        color: '#12b573',
        features: [
            '3 Agentes (Ramais)',
            'Bina Inteligente (Local Presence)',
            'Gravação de todas as chamadas',
            'URA Básica',
            'Power Dialer integrado',
            'Suporte prioritário'
        ],
        buttonText: 'Assinar Pro',
        popular: true
    },
    {
        name: 'Business',
        price: '397',
        icon: <Crown size={24} />,
        color: '#f59e0b',
        features: [
            '10 Agentes (Ramais)',
            'Tudo do Plano Pro',
            'URA Avançada',
            'APIs e Webhooks',
            'Relatórios avançados',
            'Gerente de conta dedicado'
        ],
        buttonText: 'Assinar Business',
        popular: false
    }
];

export default function PlansPage() {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    const handleSubscribe = (planName: string) => {
        alert(`Iniciando contratação do plano ${planName} (${billingCycle})...\nEstrutura de pagamento Stripe preparada!`);
    };

    const handleTopUp = async (amount: number) => {
        try {
            const { error } = await supabase.rpc('increment_balance', { amount_to_add: amount });

            // Fallback se a RPC não existir
            if (error) {
                const { data: current } = await supabase.from('credits_wallet').select('balance').single();
                await supabase.from('credits_wallet')
                    .update({ balance: (current?.balance || 0) + amount })
                    .eq('id', (await supabase.from('credits_wallet').select('id').single()).data?.id);
            }

            alert(`Sucesso! R$ ${amount},00 foram adicionais ao seu saldo.\nRecarregue a página para ver a atualização.`);
        } catch (err) {
            console.error('Erro na recarga:', err);
            alert('Erro ao processar recarga. Tente novamente.');
        }
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2>Planos e Assinaturas</h2>
                    <p className="subtitle">Escolha o plano ideal para sua operação</p>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
                <div style={{
                    background: 'rgba(56, 82, 130, 0.08)',
                    padding: 4,
                    borderRadius: 12,
                    display: 'flex',
                    gap: 4
                }}>
                    <button
                        onClick={() => setBillingCycle('monthly')}
                        style={{
                            padding: '8px 16px',
                            borderRadius: 8,
                            border: 'none',
                            background: billingCycle === 'monthly' ? 'white' : 'transparent',
                            boxShadow: billingCycle === 'monthly' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                            fontWeight: 600,
                            fontSize: 13,
                            cursor: 'pointer',
                            color: billingCycle === 'monthly' ? 'var(--primary-700)' : 'var(--text-muted)',
                            transition: 'var(--transition)'
                        }}
                    >
                        Mensal
                    </button>
                    <button
                        onClick={() => setBillingCycle('yearly')}
                        style={{
                            padding: '8px 16px',
                            borderRadius: 8,
                            border: 'none',
                            background: billingCycle === 'yearly' ? 'white' : 'transparent',
                            boxShadow: billingCycle === 'yearly' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                            fontWeight: 600,
                            fontSize: 13,
                            cursor: 'pointer',
                            color: billingCycle === 'yearly' ? 'var(--primary-700)' : 'var(--text-muted)',
                            transition: 'var(--transition)'
                        }}
                    >
                        Anual <span style={{ color: 'var(--accent-green)', marginLeft: 4 }}>-20%</span>
                    </button>
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: 24,
                maxWidth: 1100,
                margin: '0 auto'
            }}>
                {plans.map((plan) => (
                    <div key={plan.name} className="card" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        padding: 32,
                        position: 'relative',
                        border: plan.popular ? `2px solid ${plan.color}` : '1px solid rgba(56, 82, 130, 0.12)',
                        transform: plan.popular ? 'scale(1.05)' : 'none',
                        zIndex: plan.popular ? 1 : 0
                    }}>
                        {plan.popular && (
                            <div style={{
                                position: 'absolute',
                                top: -14,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: plan.color,
                                color: 'white',
                                padding: '4px 12px',
                                borderRadius: 20,
                                fontSize: 11,
                                fontWeight: 800,
                                textTransform: 'uppercase'
                            }}>
                                Mais Popular
                            </div>
                        )}

                        <div style={{
                            width: 48,
                            height: 48,
                            borderRadius: 12,
                            background: `${plan.color}15`,
                            color: plan.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 20
                        }}>
                            {plan.icon}
                        </div>

                        <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>{plan.name}</h3>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 24 }}>
                            <span style={{ fontSize: 28, fontWeight: 800 }}>R$ {billingCycle === 'yearly' ? (parseInt(plan.price) * 0.8).toFixed(0) : plan.price}</span>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/mês</span>
                        </div>

                        <div style={{ flex: 1, marginBottom: 32 }}>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
                                {plan.features.map((feature) => (
                                    <li key={feature} style={{ display: 'flex', gap: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
                                        <Check size={16} color={plan.color} style={{ flexShrink: 0 }} />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <button
                            onClick={() => handleSubscribe(plan.name)}
                            style={{
                                width: '100%',
                                padding: '12px 24px',
                                borderRadius: 12,
                                border: 'none',
                                background: plan.popular ? plan.color : 'rgba(56, 82, 130, 0.1)',
                                color: plan.popular ? 'white' : 'var(--primary-700)',
                                fontWeight: 700,
                                fontSize: 14,
                                cursor: 'pointer',
                                transition: 'var(--transition)'
                            }}>
                            {plan.buttonText}
                        </button>
                    </div>
                ))}
            </div>

            <div className="card" style={{ marginTop: 48, padding: 32, textAlign: 'center' }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Precisa de uma carga de créditos?</h3>
                <p className="subtitle" style={{ marginBottom: 24 }}>Adicione saldo à sua carteira para continuar fazendo chamadas.</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
                    {[29, 59, 99].map((val) => (
                        <button key={val}
                            onClick={() => handleTopUp(val)}
                            className="card" style={{
                                padding: '16px 32px',
                                cursor: 'pointer',
                                borderColor: 'rgba(59, 130, 246, 0.4)',
                                transition: 'var(--transition)',
                                textAlign: 'center'
                            }}>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Recarga de</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: '#3b82f6' }}>R$ {val},00</div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
