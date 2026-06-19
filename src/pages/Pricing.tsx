import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 'R$ 0',
    period: '/mês',
    description: 'Para começar',
    posts: '5 posts/mês',
    features: ['5 posts por mês', '1 rede social', 'Agendamento básico'],
    highlighted: false,
  },
  {
    id: 'pro_monthly',
    name: 'Pro',
    price: 'R$ 29',
    period: '/mês',
    description: 'Para criadores',
    posts: '50 posts/mês',
    features: ['50 posts por mês', 'Todas as redes sociais', 'Agendamento avançado', 'Analytics', 'Suporte prioritário'],
    highlighted: true,
  },
  {
    id: 'business_monthly',
    name: 'Business',
    price: 'R$ 69',
    period: '/mês',
    description: 'Para equipes',
    posts: 'Posts ilimitados',
    features: ['Posts ilimitados', 'Todas as redes sociais', 'Agendamento avançado', 'Analytics completo', 'Suporte 24h', 'Múltiplos usuários'],
    highlighted: false,
  },
];

export default function PricingPage() {
  const { user, status, refreshStatus } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe(planId: string) {
    if (!user) {
      navigate('/auth/login');
      return;
    }

    setLoading(planId);
    setError(null);

    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planId }),
      });

      let data: any;
      try { data = await res.json(); } catch { data = {}; }

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao criar checkout');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-bold">FlowPost</a>
          <nav className="flex gap-4">
            {user ? (
              <button onClick={() => navigate('/dashboard')} className="text-sm text-gray-600 hover:text-gray-900">
                Dashboard
              </button>
            ) : (
              <button onClick={() => navigate('/auth/login')} className="text-sm text-gray-600 hover:text-gray-900">
                Entrar
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Escolha seu plano</h1>
          <p className="text-lg text-gray-600">
            Comece grátis e faça upgrade quando precisar
          </p>
        </div>

        {status && status.planId !== 'free' && (
          <div className="max-w-md mx-auto mb-8 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
            <p className="text-green-800 font-medium">
              Plano atual: {plans.find(p => p.id === status.planId)?.name || status.planId}
            </p>
          </div>
        )}

        {status && status.planId === 'free' && !status.canPost && (
          <div className="max-w-md mx-auto mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
            <p className="text-yellow-800 font-medium">
              Você atingiu o limite de posts grátis. Faça upgrade para continuar.
            </p>
          </div>
        )}

        {error && (
          <div className="max-w-md mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-center">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const isCurrentPlan = status?.planId === plan.id;
            const isLoading = loading === plan.id;

            return (
              <div
                key={plan.id}
                className={`rounded-2xl border p-8 flex flex-col ${
                  plan.highlighted
                    ? 'border-black bg-white ring-2 ring-black scale-105'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {plan.highlighted && (
                  <span className="text-xs font-semibold text-black bg-gray-100 px-3 py-1 rounded-full self-start mb-4">
                    MAIS POPULAR
                  </span>
                )}

                <h2 className="text-xl font-bold text-gray-900">{plan.name}</h2>
                <p className="text-sm text-gray-500 mt-1">{plan.description}</p>

                <div className="mt-4 mb-6">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500 ml-1">{plan.period}</span>
                </div>

                <p className="text-sm font-medium text-gray-700 mb-4">{plan.posts}</p>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 mt-0.5 text-green-500 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {plan.id === 'free' ? (
                  <button
                    onClick={() => navigate('/auth/login')}
                    className="w-full py-3 px-4 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
                  >
                    {user ? 'Plano Atual' : 'Começar Grátis'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isLoading || isCurrentPlan}
                    className={`w-full py-3 px-4 rounded-xl font-medium transition flex items-center justify-center gap-2 ${
                      isCurrentPlan
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Processando...
                      </>
                    ) : isCurrentPlan ? (
                      'Plano Atual'
                    ) : (
                      'Assinar'
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
