import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshStatus } = useAuth();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      refreshStatus();
    }
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-accent/10 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-10 text-center animate-bounce-in">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>

          <Sparkles className="w-6 h-6 text-yellow-400 mx-auto mb-2" />

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Pagamento Confirmado!</h1>
          <p className="text-gray-500 mb-8">
            Sua assinatura foi ativada com sucesso. Bem-vindo ao FlowPost!
          </p>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 px-4 rounded-xl bg-primary text-white font-medium hover:bg-primary-light transition flex items-center justify-center gap-2"
          >
            Ir para o Dashboard <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
