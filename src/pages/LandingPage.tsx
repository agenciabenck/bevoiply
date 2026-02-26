import { useEffect, useRef } from 'react';
import {
    Phone, Zap, ShieldCheck, Rocket,
    MousePointerClick, BarChart3, ChevronRight,
    Check, X, MessageSquare, PlayCircle
} from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage({ onGetStarted }: { onGetStarted: () => void }) {
    const heroRef = useRef<HTMLDivElement>(null);
    const mockupRef = useRef<HTMLDivElement>(null);
    const featuresRef = useRef<HTMLDivElement>(null);
    const tableRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Hero Animations
        const heroTl = gsap.timeline();
        heroTl.from('.hero-content > *', {
            y: 30,
            opacity: 0,
            duration: 1,
            stagger: 0.2,
            ease: 'power3.out'
        }).from(mockupRef.current, {
            scale: 0.95,
            opacity: 0,
            duration: 1.2,
            ease: 'power2.out'
        }, '-=0.5');

        // Reveal elements on scroll
        gsap.utils.toArray('.reveal').forEach((elem: any) => {
            gsap.from(elem, {
                scrollTrigger: {
                    trigger: elem,
                    start: 'top 85%',
                },
                y: 40,
                opacity: 0,
                duration: 0.8,
                ease: 'power2.out'
            });
        });

        // Feature Cards Stagger
        gsap.from('.feature-card', {
            scrollTrigger: {
                trigger: featuresRef.current,
                start: 'top 75%',
            },
            y: 50,
            opacity: 0,
            duration: 0.6,
            stagger: 0.15,
            ease: 'back.out(1.2)'
        });

        // Comparison Table Reveal
        gsap.from(tableRef.current, {
            scrollTrigger: {
                trigger: tableRef.current,
                start: 'top 80%',
            },
            scale: 0.98,
            opacity: 0,
            duration: 1,
            ease: 'power1.out'
        });

        return () => {
            ScrollTrigger.getAll().forEach(t => t.kill());
        };
    }, []);

    return (
        <div className="landing-container" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {/* 1. HERO SECTION */}
            <section className="hero dark" ref={heroRef} style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: 'white',
                padding: '120px 24px 80px',
                textAlign: 'center',
                overflow: 'hidden'
            }}>
                <div className="container hero-content">
                    <div className="badge-promo reveal" style={{
                        background: 'rgba(18, 181, 115, 0.15)',
                        color: '#12b573',
                        padding: '8px 16px',
                        borderRadius: 99,
                        fontSize: 13,
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 24
                    }}>
                        <Zap size={14} fill="#12b573" /> PARA TIMES DE SDR & BDR PRO
                    </div>

                    <h1 className="reveal" style={{
                        fontSize: 'max(42px, 5vw)',
                        fontWeight: 800,
                        lineHeight: 1.1,
                        letterSpacing: '-2px',
                        maxWidth: 1000,
                        margin: '0 auto 24px'
                    }}>
                        Pare de discar. <span style={{ color: '#12b573' }}>Comece a fechar.</span>
                    </h1>

                    <p className="reveal" style={{
                        fontSize: 'max(18px, 1.2vw)',
                        color: '#94a3b8',
                        maxWidth: 700,
                        margin: '0 auto 40px',
                        lineHeight: 1.6
                    }}>
                        A Telefonia Inteligente que multiplica as reuniões do seu time de Outbound
                        eliminando o atrito da discagem manual. Setup em segundos.
                    </p>

                    <div className="hero-actions reveal" style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 60 }}>
                        <button className="btn-primary" onClick={onGetStarted} style={{
                            background: '#12b573',
                            color: 'white',
                            padding: '18px 36px',
                            borderRadius: 12,
                            fontSize: 16,
                            fontWeight: 700,
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            boxShadow: '0 10px 20px rgba(18, 181, 115, 0.3)',
                            transition: 'transform 0.2s'
                        }}>
                            Inicie seu Onboarding em Segundos <ChevronRight size={18} />
                        </button>
                        <button className="btn-secondary" style={{
                            background: 'rgba(255,255,255,0.05)',
                            color: 'white',
                            padding: '18px 36px',
                            borderRadius: 12,
                            fontSize: 16,
                            fontWeight: 700,
                            border: '1px solid rgba(255,255,255,0.1)',
                            cursor: 'pointer',
                            backdropFilter: 'blur(10px)'
                        }}>
                            Ver Demonstração
                        </button>
                    </div>

                    <div ref={mockupRef} className="hero-mockup" style={{
                        maxWidth: 1100,
                        margin: '0 auto',
                        borderRadius: '24px 24px 0 0',
                        background: 'rgba(255,255,255,0.03)',
                        padding: 20,
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 40px 100px rgba(0,0,0,0.5)'
                    }}>
                        <img
                            src="/bevoiply_softphone_mockup.png"
                            alt="Bevoiply Dashboard"
                            style={{ width: '100%', borderRadius: 16, display: 'block' }}
                        />
                    </div>
                </div>
            </section>

            {/* 2. THE PAIN SECTION */}
            <section className="pain-section light" style={{ padding: '100px 24px', background: '#f8fafc' }}>
                <div className="container" style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
                    <h2 className="reveal" style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', marginBottom: 24 }}>
                        Sua telefonia atual está matando seu ROI?
                    </h2>
                    <div className="pain-grid" style={{ display: 'grid', gap: 20, marginTop: 40 }}>
                        {[
                            "SDRs perdendo 3h/dia discando números manualmente.",
                            "Minutos caros com taxas ocultas de operadoras tradicionais.",
                            "Ligações marcadas como SPAM logo na primeira semana."
                        ].map((text, i) => (
                            <div key={i} className="reveal pain-card" style={{
                                background: 'white',
                                padding: '20px 32px',
                                borderRadius: 16,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 16,
                                boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
                                border: '1px solid #e2e8f0',
                                color: '#64748b'
                            }}>
                                <X size={20} color="#ef4444" />
                                <span style={{ fontSize: 16, fontWeight: 500 }}>{text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 3. THE 5 PILARS (FEATURES) */}
            <section className="features-section" ref={featuresRef} style={{ padding: '120px 24px', background: 'white' }}>
                <div className="container" style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 80 }}>
                        <h2 style={{ fontSize: 42, fontWeight: 800, color: '#0f172a', letterSpacing: '-1px' }}>
                            Acelerando a Voz rumo ao Fechamento
                        </h2>
                    </div>

                    <div className="features-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: 32
                    }}>
                        {[
                            {
                                title: "Power Dialer",
                                desc: "O fim do tempo morto. O algoritmo disca, seu vendedor apenas fala. Mais volume, menos esforço.",
                                icon: Rocket,
                                color: "#12b573"
                            },
                            {
                                title: "Anti-Spam (Number Pooling)",
                                desc: "Rotação automática de números de saída para blindar sua reputação e garantir maior atendibilidade.",
                                icon: ShieldCheck,
                                color: "#3b82f6"
                            },
                            {
                                title: "Escalabilidade Imediata",
                                desc: "De 1 a 100 SDRs em minutos. Sem fios, sem aparelhos físicos e sem burocracia comercial.",
                                icon: Zap,
                                color: "#f59e0b"
                            },
                            {
                                title: "Simplicidade Radical",
                                desc: "O Softphone mais limpo do Brasil. Funciona direto no navegador com áudio em alta fidelidade.",
                                icon: MousePointerClick,
                                color: "#8b5cf6"
                            },
                            {
                                title: "Custo de Atacado",
                                desc: "Margens que sobram para você investir onde importa: no crescimento do seu time de vendas.",
                                icon: BarChart3,
                                color: "#06b6d4"
                            }
                        ].map((f, i) => (
                            <div key={i} className="feature-card" style={{
                                padding: 40,
                                borderRadius: 24,
                                border: '1px solid #f1f5f9',
                                background: '#f8fafc',
                                transition: 'transform 0.3s'
                            }}>
                                <div style={{
                                    width: 54, height: 54, borderRadius: 14,
                                    background: 'white', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', marginBottom: 24,
                                    boxShadow: '0 8px 16px rgba(0,0,0,0.05)'
                                }}>
                                    <f.icon size={28} color={f.color} />
                                </div>
                                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>{f.title}</h3>
                                <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.6 }}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 4. COMPARISON TABLE */}
            <section className="comparison-section" style={{ padding: '100px 24px', background: '#f8fafc' }}>
                <div className="container" style={{ maxWidth: 1000, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 60 }}>
                        <h2 className="reveal" style={{ fontSize: 36, fontWeight: 800, color: '#0f172a' }}>O Xeque-Mate na Obsoleto</h2>
                    </div>

                    <div ref={tableRef} className="comparison-table" style={{
                        background: 'white',
                        borderRadius: 24,
                        overflow: 'hidden',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
                        border: '1px solid #f1f5f9'
                    }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                            <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                    <th style={{ padding: '24px 32px', textAlign: 'left', color: '#64748b', fontSize: 13, fontWeight: 700 }}>RECURSO</th>
                                    <th style={{ padding: '24px 32px', textAlign: 'center', color: '#12b573', fontSize: 15, fontWeight: 800, background: 'rgba(18,181,115,0.05)' }}>BEVOIPLY</th>
                                    <th style={{ padding: '24px 32px', textAlign: 'center', color: '#94a3b8', fontSize: 13, fontWeight: 600 }}>TRADICIONAL</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { label: "Discagem Automática", be: true, trad: false },
                                    { label: "Setup em 60 segundos", be: true, trad: false },
                                    { label: "Rotação de Números (Pool)", be: true, trad: false },
                                    { label: "Uso via Browser (Sem Apps)", be: true, trad: "Depende" },
                                    { label: "Burocracia em Vendas", be: false, trad: true }
                                ].map((row, i) => (
                                    <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '20px 32px', borderTop: '1px solid #f1f5f9', fontWeight: 600, color: '#334155' }}>{row.label}</td>
                                        <td style={{ padding: '20px 32px', borderTop: '1px solid #f1f5f9', textAlign: 'center', background: 'rgba(18,181,115,0.02)' }}>
                                            {row.be === true ? <Check color="#12b573" /> : <X color="#cbd5e1" />}
                                        </td>
                                        <td style={{ padding: '20px 32px', borderTop: '1px solid #f1f5f9', textAlign: 'center', color: '#94a3b8' }}>
                                            {row.trad === true ? <Check color="#cbd5e1" /> : (row.trad === false ? <X color="#cbd5e1" /> : row.trad)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* 5. CTA FINAL */}
            <section className="cta-final" style={{
                padding: '120px 24px',
                textAlign: 'center',
                background: 'linear-gradient(135deg, #12b573 0%, #059669 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div className="container reveal" style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 1 }}>
                    <h2 style={{ fontSize: 'max(36px, 4vw)', fontWeight: 800, lineHeight: 1.1, marginBottom: 24 }}>
                        Sua operação merece <br /> escala profissional.
                    </h2>
                    <p style={{ fontSize: 20, opacity: 0.9, marginBottom: 48, fontWeight: 500 }}>
                        Cada dia sem o Bevoiply é dinheiro na mesa e leads perdidos.
                    </p>
                    <button className="pulse" onClick={onGetStarted} style={{
                        background: 'white',
                        color: '#12b573',
                        padding: '22px 54px',
                        borderRadius: 16,
                        fontSize: 18,
                        fontWeight: 800,
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                    }}>
                        COMEÇAR AGORA
                    </button>
                </div>

                {/* Background Elements */}
                <div style={{ position: 'absolute', top: '-10%', right: '-5%', opacity: 0.1 }}>
                    <Phone size={400} />
                </div>
            </section>

            <footer style={{ padding: '40px 24px', textAlign: 'center', background: '#0f172a', color: '#64748b', fontSize: 13 }}>
                © 2026 Bevoiply. Desenvolvido pela Agência Benck. All rights reserved.
            </footer>

            <style>{`
        .container { width: 100%; }
        .feature-card:hover { transform: translateY(-5px); border-color: #12b573; }
        .btn-primary:hover { transform: scale(1.02); background: #0fa368; }
        .pulse { animation: pulse-btn 2s infinite; }
        @keyframes pulse-btn {
          0% { box-shadow: 0 0 0 0 rgba(255,255,255, 0.4); }
          70% { box-shadow: 0 0 0 20px rgba(255,255,255, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255,255,255, 0); }
        }
        .live-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #12b573; display: inline-block;
          animation: blink 1s infinite;
        }
        @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
      `}</style>
        </div>
    );
}
