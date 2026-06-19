import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, ChevronRight, Quote, Zap, BarChart3, CalendarDays, Globe, Star } from 'lucide-react';
import BackToTop from '../components/ui/back-to-top';

const testimonials = [
  { name: 'Ana Silva', role: 'Social Media', text: 'Economizo 10h por semana agendando tudo de uma vez.', rating: 5 },
  { name: 'Carlos Oliveira', role: 'CEO, TechStart', text: 'A IA sugere os melhores horários. Incrível!', rating: 5 },
  { name: 'Mariana Costa', role: 'Influencer', text: 'Publiquei em 4 redes em 5 minutos.', rating: 5 },
];

const plans = [
  { name: 'Free', price: 'R$ 0', posts: '5 posts/mês', features: ['5 posts por mês', '1 rede social', 'Agendamento básico'] },
  { name: 'Pro', price: 'R$ 29', posts: '50 posts/mês', features: ['50 posts por mês', 'Todas as redes', 'Agendamento avançado', 'Analytics', 'Suporte prioritário'], popular: true },
  { name: 'Business', price: 'R$ 69', posts: 'Ilimitado', features: ['Posts ilimitados', 'Todas as redes', 'Agendamento avançado', 'Analytics completo', 'Suporte 24h', 'Múltiplos usuários'] },
];

const stats = [
  { label: 'Posts agendados', value: 12543, suffix: '+' },
  { label: 'Usuários ativos', value: 892, suffix: '+' },
  { label: 'Redes integradas', value: 6, suffix: '' },
  { label: 'Tempo economizado', value: 1200, suffix: 'h+' },
];

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const counted = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !counted.current) {
          counted.current = true;
          const duration = 2000;
          const steps = 60;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}{suffix}
    </span>
  );
}

function TypewriterTitle({ texts }: { texts: string[] }) {
  const [index, setIndex] = useState(0);
  const [display, setDisplay] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = texts[index];
    let timeout: ReturnType<typeof setTimeout>;

    if (!deleting && display === current) {
      timeout = setTimeout(() => setDeleting(true), 2000);
    } else if (deleting && display === '') {
      setDeleting(false);
      setIndex((i) => (i + 1) % texts.length);
    } else {
      timeout = setTimeout(
        () => {
          setDisplay(deleting ? current.slice(0, display.length - 1) : current.slice(0, display.length + 1));
        },
        deleting ? 40 : 80
      );
    }

    return () => clearTimeout(timeout);
  }, [display, deleting, index, texts]);

  return (
    <span>
      {display}
      <span className="animate-blink border-r-2 border-accent ml-0.5">&nbsp;</span>
    </span>
  );
}

function TestimonialCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrent((c) => (c + 1) % testimonials.length), 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-48 md:h-36">
      {testimonials.map((t, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-all duration-700 ${
            i === current ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
          }`}
        >
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-card h-full flex flex-col justify-center">
            <Quote className="w-6 h-6 text-accent/40 mb-2" />
            <p className="text-gray-700 italic text-sm md:text-base">&ldquo;{t.text}&rdquo;</p>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">
                {t.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-xs text-gray-500">{t.role}</p>
              </div>
              <div className="flex gap-0.5 ml-auto">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const featuresRef = useRef<HTMLDivElement>(null);

  return (
    <div className="overflow-hidden">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="text-xl font-bold text-primary">FlowPost</span>
          <nav className="flex items-center gap-4">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 hidden sm:block">Recursos</a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 hidden sm:block">Planos</a>
            {user ? (
              <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-light transition">
                Dashboard
              </button>
            ) : (
              <button onClick={() => navigate('/auth/login')} className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-light transition">
                Entrar
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center pt-16">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-light to-accent/20 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-white/80 text-sm mb-8 animate-fade-in">
            <Zap className="w-3.5 h-3.5 text-accent" />
            Nova plataforma de agendamento com IA
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-6 animate-fade-in">
            Agende posts para<br />
            <span className="text-accent">
              <TypewriterTitle texts={['todas as redes', 'com IA', 'em segundos', 'sem estresse']} />
            </span>
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10 animate-fade-in">
            Crie, agende e publique conteúdo em múltiplas plataformas com inteligência artificial. Tudo em um só lugar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
            {user ? (
              <button onClick={() => navigate('/dashboard')} className="px-8 py-4 bg-accent text-white font-semibold rounded-xl hover:bg-accent/90 transition shadow-lg shadow-accent/30 flex items-center justify-center gap-2 text-lg">
                Ir para Dashboard <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button onClick={() => navigate('/auth/login')} className="px-8 py-4 bg-accent text-white font-semibold rounded-xl hover:bg-accent/90 transition shadow-lg shadow-accent/30 flex items-center justify-center gap-2 text-lg">
                Começar Grátis <ArrowRight className="w-5 h-5" />
              </button>
            )}
            <button onClick={() => navigate('/pricing')} className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition">
              Ver Planos
            </button>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-surface to-transparent" />
      </section>

      {/* STATS */}
      <section className="py-16 md:py-20 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((s) => (
              <div key={s.label} className="animate-slide-up">
                <p className="text-3xl md:text-4xl font-extrabold text-primary">
                  <AnimatedCounter target={s.value} suffix={s.suffix} />
                </p>
                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" ref={featuresRef} className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">Tudo que você precisa</h2>
            <p className="text-gray-500 max-w-lg mx-auto">Ferramentas completas para criar e gerenciar seu conteúdo.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Zap, title: 'IA Generativa', text: 'Crie textos criativos com IA em segundos. Sugestões automáticas de hashtags e legendas.' },
              { icon: CalendarDays, title: 'Calendário Visual', text: 'Arraste e solte seus posts. Visualize o mês inteiro de conteúdo de uma só vez.' },
              { icon: Globe, title: 'Multi-plataforma', text: 'Publique no Instagram, Twitter, LinkedIn, Facebook, TikTok e muito mais.' },
              { icon: BarChart3, title: 'Analytics', text: 'Acompanhe o desempenho de cada post com gráficos e métricas detalhadas.' },
              { icon: Star, title: 'Melhores Horários', text: 'IA analisa seu engajamento e sugere os melhores horários para publicar.' },
              { icon: Quote, title: 'Equipe', text: 'Convide membros, colabore em tempo real e gerencie permissões.' },
            ].map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div
                  key={i}
                  className="group p-6 rounded-2xl bg-white border border-gray-200 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                    <Icon className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feat.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feat.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">O que dizem</h2>
            <p className="text-gray-500">Quem usa o FlowPost recomenda.</p>
          </div>
          <TestimonialCarousel />
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">Planos simples</h2>
            <p className="text-gray-500">Comece grátis, faça upgrade quando precisar.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-6 md:p-8 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover ${
                  plan.popular ? 'border-accent ring-2 ring-accent/20 scale-105 md:scale-110' : 'border-gray-200 shadow-card'
                }`}
                style={{ animationDelay: `${i * 150}ms` }}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-semibold px-4 py-1 rounded-full">
                    MAIS POPULAR
                  </span>
                )}
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-3 mb-2">
                  <span className="text-4xl font-extrabold text-primary">{plan.price}</span>
                  {plan.price !== 'R$ 0' && <span className="text-gray-500 text-sm ml-1">/mês</span>}
                </div>
                <p className="text-sm font-medium text-gray-700 mb-5">{plan.posts}</p>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 mt-0.5 text-accent shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate(user ? '/pricing' : '/auth/login')}
                  className={`w-full py-3 rounded-xl font-medium transition flex items-center justify-center gap-2 ${
                    plan.popular
                      ? 'bg-accent text-white hover:bg-accent/90 shadow-lg shadow-accent/20'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {plan.price === 'R$ 0' ? 'Começar Grátis' : 'Assinar'} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Pronto para simplificar?</h2>
          <p className="text-white/70 mb-8">Milhares de criadores já usam o FlowPost. Junte-se a eles.</p>
          <button
            onClick={() => navigate('/auth/login')}
            className="px-8 py-4 bg-accent text-white font-semibold rounded-xl hover:bg-accent/90 transition shadow-lg shadow-accent/30 inline-flex items-center gap-2"
          >
            Começar Grátis <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-sm text-gray-500">&copy; {new Date().getFullYear()} FlowPost. Todos os direitos reservados.</span>
          <div className="flex gap-4 text-sm text-gray-500">
            <a href="#features" className="hover:text-gray-900">Recursos</a>
            <a href="#pricing" className="hover:text-gray-900">Planos</a>
          </div>
        </div>
      </footer>

      <BackToTop />
    </div>
  );
}
