import { GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Github, Chrome, ArrowLeft } from 'lucide-react';

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, error, loginWithProvider } = useAuth();
  const [emailLoading, setEmailLoading] = useState(false);

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  async function handleGoogle() {
    await loginWithProvider(googleProvider);
  }

  async function handleGithub() {
    await loginWithProvider(githubProvider);
  }

  async function handleEmail() {
    try {
      setEmailLoading(true);
      const { sendSignInLinkToEmail } = await import('firebase/auth');
      const email = window.prompt('Digite seu email:');
      if (!email) { setEmailLoading(false); return; }
      await sendSignInLinkToEmail(auth, email, {
        url: window.location.origin + '/auth/login',
        handleCodeInApp: true,
      });
      localStorage.setItem('emailForSignIn', email);
      alert('Link de login enviado para seu email!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setEmailLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-light to-accent/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate('/')}
          className="text-white/70 hover:text-white flex items-center gap-1 text-sm mb-8 transition"
          aria-label="Voltar para home"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-slide-up">
          <div className="text-center mb-8">
            <span className="text-2xl font-bold text-primary">FlowPost</span>
            <h1 className="text-2xl font-bold text-gray-900 mt-4">Entrar</h1>
            <p className="text-gray-500 text-sm mt-1">Escolha como deseja entrar</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 text-center animate-shake" role="alert">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleGoogle}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition font-medium text-sm flex items-center justify-center gap-3 group"
              aria-label="Entrar com Google"
            >
              <Chrome className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
              <span>Continuar com Google</span>
            </button>

            <button
              onClick={handleGithub}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition font-medium text-sm flex items-center justify-center gap-3 group"
              aria-label="Entrar com GitHub"
            >
              <Github className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
              <span>Continuar com GitHub</span>
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-gray-400">ou</span>
              </div>
            </div>

            <button
              onClick={handleEmail}
              disabled={emailLoading}
              className="w-full px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary-light transition font-medium text-sm flex items-center justify-center gap-3 disabled:opacity-60"
              aria-label="Enviar link de login por email"
            >
              {emailLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Mail className="w-5 h-5" />
              )}
              <span>{emailLoading ? 'Enviando...' : 'Login com Email'}</span>
            </button>
          </div>

          <p className="text-center mt-6">
            <a href="/pricing" className="text-sm text-gray-400 hover:text-gray-600 underline">
              Ver planos
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
