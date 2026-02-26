import { useState, useEffect } from 'react';
import {
  Phone, Zap, ShieldCheck, Rocket,
  MousePointerClick, BarChart3, ChevronRight,
  Check, X
} from 'lucide-react';
import { supabase } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import SoftphonePage from './pages/SoftphonePage';
import PowerDialerPage from './pages/PowerDialerPage';
import AudioAIPage from './pages/AudioAIPage';
import PartnersPage from './pages/PartnersPage';
import PlansPage from './pages/PlansPage';
import ProfilePage from './pages/ProfilePage';
import './index.css';

type Page = 'landing' | 'dashboard' | 'softphone' | 'dialer' | 'audio' | 'partners' | 'plans' | 'profile';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [balance, setBalance] = useState<string>('R$ 0,00');

  useEffect(() => {
    if (session) {
      fetchBalance();
    }
  }, [session]);

  const fetchBalance = async () => {
    try {
      const { data } = await supabase
        .from('credits_wallet')
        .select('balance')
        .single();
      if (data) setBalance(`R$ ${data.balance.toFixed(2)}`);
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  };
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    (localStorage.getItem('voip-theme') as 'light' | 'dark') || 'light'
  );

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('voip-theme', theme);
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  const navItems = [
    { id: 'dashboard' as Page, label: 'Início', icon: Home },
    { id: 'softphone' as Page, label: 'Telefone', icon: Phone },
    { id: 'dialer' as Page, label: 'Discador', icon: Headphones },
    { id: 'audio' as Page, label: 'Áudio & IA', icon: AudioLines },
    { id: 'partners' as Page, label: 'Afiliado', icon: Gift },
    { id: 'plans' as Page, label: 'Assinatura', icon: Wallet },
  ];

  const dailyPhrases = [
    "A persistência é o caminho do êxito.",
    "O sucesso nasce do querer, da determinação e persistência.",
    "Cada dia é uma nova oportunidade de ser melhor.",
    "Acredite em você e todo o resto virá naturalmente.",
    "O único limite para o seu sucesso é a sua imaginação.",
    "Grandes conquistas começam com pequenos passos.",
    "Sua atitude determina a sua direção.",
    "O segredo do sucesso é começar antes de estar pronto.",
    "Não espere por oportunidades, crie-as.",
    "O fracasso é apenas uma oportunidade de recomeçar com mais inteligência.",
    "Quem tem um porquê enfrenta qualquer como.",
    "A disciplina é a ponte entre metas e realizações.",
    "Faça hoje o que os outros não querem, amanhã terá o que os outros não têm.",
    "A melhor maneira de prever o futuro é criá-lo.",
    "Tudo o que você sempre quis está do outro lado do medo.",
    "O sucesso é a soma de pequenos esforços repetidos diariamente.",
    "Não conte os dias, faça os dias contarem.",
    "A única pessoa que você deve tentar ser melhor é quem você foi ontem.",
    "Sonhe grande, comece pequeno, aja agora.",
    "A sorte favorece os audaciosos.",
    "Seu potencial é ilimitado, não aceite menos.",
    "O impossível é apenas uma opinião.",
    "A jornada de mil quilômetros começa com um único passo.",
    "Transforme obstáculos em oportunidades.",
    "O esforço de hoje é a recompensa de amanhã.",
    "Não desista. O começo é sempre o mais difícil.",
    "Quanto maior a luta, mais glorioso o triunfo.",
    "Acredite que você pode e já estará no meio do caminho.",
    "A excelência não é um ato, mas um hábito.",
    "Caia sete vezes, levante-se oito.",
    "O que te desafia, te transforma.",
    "Cada amanhecer é um convite para uma nova vitória.",
    "A motivação te leva longe, a disciplina te leva mais longe.",
    "Você é mais forte do que imagina.",
    "O trabalho duro supera o talento quando o talento não trabalha duro.",
    "Plante sementes de esforço e colha frutos de sucesso.",
    "O melhor momento para começar é agora.",
    "Não tenha medo de falhar, tenha medo de não tentar.",
    "Sua história não termina aqui, continue escrevendo.",
    "A vida começa no fim da sua zona de conforto.",
    "Foco, força e fé. Essa é a fórmula.",
    "Cada pequena vitória é um passo em direção ao seu sonho.",
    "Você não precisa ser perfeito para ser incrível.",
    "Construa pontes, não muros.",
    "A gratidão transforma o que temos em suficiente.",
    "O progresso, não a perfeição, é o que importa.",
    "Seja a mudança que você quer ver no mundo.",
    "O conhecimento é o investimento que mais paga.",
    "Quem planta coragem, colhe liberdade.",
    "O otimismo é a fé em ação.",
    "A verdadeira riqueza está em ajudar os outros.",
    "Nunca pare de aprender, nunca pare de crescer.",
    "Desafios existem para revelar sua força.",
    "Cada problema tem uma solução esperando ser encontrada.",
    "A criatividade exige coragem.",
    "Você é o autor da sua própria história.",
    "Faça mais do que o esperado, entregue excelência.",
    "Quem se arrisca, conquista.",
    "A paciência é a chave para toda conquista.",
    "Sua energia determina seus resultados.",
    "Abrace as mudanças, elas trazem crescimento.",
    "O sol nasce para todos, aproveite o seu dia.",
    "Onde há vontade, há um caminho.",
    "Invista em você, é o melhor investimento.",
    "O sucesso é construído, não encontrado.",
    "Ações falam mais alto que palavras.",
    "Cada conquista começa com a decisão de tentar.",
    "Mantenha os olhos nas estrelas e os pés no chão.",
    "A confiança em si mesmo é o primeiro segredo do sucesso.",
    "O presente é tudo o que temos, faça valer a pena.",
    "A resiliência é a arte de se reinventar.",
    "Só falha de verdade quem desiste de tentar.",
    "A consistência é mais poderosa que a intensidade.",
    "Deixe que seus resultados façam o barulho.",
    "Todo expert já foi um iniciante.",
    "A simplicidade é a sofisticação máxima.",
    "Gentileza gera gentileza.",
    "O sucesso é o melhor professor.",
    "Não espere o momento perfeito, faça o momento perfeito.",
    "A persistência transforma o impossível em possível.",
    "O que importa não é de onde você veio, mas para onde está indo.",
    "Coragem não é ausência de medo, é agir apesar dele.",
    "A melhor versão de você começa hoje.",
    "Sonhos não têm prazo de validade.",
    "Para grandes resultados, é preciso grande dedicação.",
    "A única forma de fazer um ótimo trabalho é amar o que se faz.",
    "Lidere pelo exemplo, inspire com ações.",
    "O mundo pertence aos que ousam.",
    "Comece de onde você está, use o que tem, faça o que puder.",
  ];

  function getDailyPhrase(): string {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000);
    return dailyPhrases[dayOfYear % dailyPhrases.length];
  }

  const userName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'Usuário';

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardPage />;
      case 'softphone': return <SoftphonePage />;
      case 'dialer': return <PowerDialerPage />;
      case 'audio': return <AudioAIPage />;
      case 'partners': return <PartnersPage />;
      case 'plans': return <PlansPage />;
      case 'profile': return <ProfilePage />;
    }
  };

  // Loading state while checking auth
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 50%, #f5f3ff 100%)',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: '#12b573',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}>
            <Phone size={24} color="white" />
          </div>
          <div style={{ fontSize: 14, color: '#71717a' }}>Carregando...</div>
        </div>
      </div>
    );
  }

  const [showAuth, setShowAuth] = useState(false);

  // Not logged in -> show landing page or auth page
  if (!session) {
    if (showAuth) {
      return <AuthPage onAuth={() => {
        supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
      }} />;
    }
    return <LandingPage onGetStarted={() => setShowAuth(true)} />;
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        {/* Logo + Subtitle */}
        <div className="sidebar-logo">
          <img src="/logo_bevoiply.png" alt="bevoiply" />
          <p style={{
            fontSize: 11, color: '#64748b', marginTop: 8,
            display: 'flex', alignItems: 'center', gap: 4
          }}>
            Feito com <Heart size={10} fill="#f97316" color="#f97316" /> por{' '}
            <a href="https://agenciabenck.com/" target="_blank" rel="noopener noreferrer"
              style={{ color: '#64748b', textDecoration: 'none' }}
            >Agência Benck.</a>
          </p>
        </div>

        {/* Separator */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 18px 6px' }} />

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => setCurrentPage(item.id)}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Plan Card */}
        <div className="sidebar-plan">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Saldo na conta</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>{balance}</span>
          </div>
          <button
            onClick={() => setCurrentPage('plans')}
            style={{
              width: '100%', padding: '9px 0',
              background: 'rgba(18,181,115,0.1)', color: 'var(--primary-400)',
              border: '1px solid rgba(18,181,115,0.2)', borderRadius: 'var(--radius-sm)',
              fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'var(--transition)',
            }}
          >
            Recarregar créditos
          </button>
        </div>

        {/* User + Settings */}
        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setCurrentPage('profile')}>
            <div className="avatar" style={{ width: 36, height: 36, fontSize: 13, background: '#475569' }}>{userName.charAt(0).toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userName}</div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>Ver configurações</div>
            </div>
            <button
              title="Configurações"
              onClick={(e) => { e.stopPropagation(); setCurrentPage('profile'); }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#64748b', display: 'flex', padding: 4,
                transition: 'var(--transition)',
              }}
            >
              <Settings size={18} />
            </button>
          </div>

          <button onClick={async () => {
            await supabase.auth.signOut();
            setSession(null);
            setCurrentPage('dashboard');
          }} style={{
            width: '100%', marginTop: 14, padding: '10px 0',
            background: 'none', border: 'none',
            color: '#94a3b8', fontSize: 12, fontWeight: 400,
            fontFamily: 'inherit', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 14,
            transition: 'var(--transition)',
          }}>
            Sair da conta <LogOut size={14} color="#ef4444" />
          </button>
        </div>
      </aside>

      <main className="main-content">
        {/* Header bar — only on dashboard */}
        {currentPage === 'dashboard' && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 24,
          }}>
            <div>
              <h1 style={{ fontSize: 36, fontWeight: 700, lineHeight: '40px', letterSpacing: -0.5, marginBottom: 8 }}>Olá, {userName}!</h1>
              <p style={{ fontSize: 14, color: '#71717a', marginTop: 0 }}>
                {getDailyPhrase()}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 13, color: '#959fa3' }}>
                {theme === 'light' ? 'Modo light ativo.' : 'Modo dark ativo.'}
              </span>
              <button
                onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
                title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
                style={{
                  width: 28, height: 28, borderRadius: 9999,
                  background: 'white', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  transition: 'var(--transition)',
                }}
              >
                {theme === 'light' ? <Sun size={14} color="#71717a" /> : <Moon size={14} color="#71717a" />}
              </button>
              <button
                onClick={() => setCurrentPage('plans')}
                style={{
                  fontSize: 15, fontWeight: 700, padding: '14px 24px',
                  borderRadius: 12, background: 'var(--primary-500)', color: 'white',
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'var(--transition)',
                }}
              >
                Fazer upgrade de plano
              </button>
            </div>
          </div>
        )}
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
