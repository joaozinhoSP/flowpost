import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, Home } from 'lucide-react';

export default function PaymentCancelPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-10 text-center animate-slide-up">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-400" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Pagamento Cancelado</h1>
          <p className="text-gray-500 mb-8">
            O pagamento foi cancelado. Seu plano permanece o mesmo.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/pricing')}
              className="flex-1 py-3 px-4 rounded-xl bg-primary text-white font-medium hover:bg-primary-light transition flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Ver Planos
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-1 py-3 px-4 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" /> Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
