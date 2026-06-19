import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './ui/toast';
import { Loader2 } from 'lucide-react';

interface InstagramStatus {
  connected: boolean;
  username: string | null;
  avatar: string | null;
  connectedAt: string | null;
}

export default function ConnectInstagram() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<InstagramStatus>({ connected: false, username: null, avatar: null, connectedAt: null });
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/instagram/status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setStatus(await res.json());
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchStatus();
    const params = new URLSearchParams(window.location.search);
    if (params.get('instagram') === 'connected') {
      toast('Conta Instagram conectada com sucesso!', 'success');
      window.history.replaceState({}, '', window.location.pathname);
      fetchStatus();
    } else if (params.get('instagram') === 'error') {
      toast(`Erro ao conectar: ${params.get('message') || 'Erro desconhecido'}`, 'error');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [fetchStatus, toast]);

  function handleConnect() {
    const state = user ? btoa(JSON.stringify({ uid: user.uid })) : '';
    window.location.href = `/api/auth/instagram${state ? `?state=${state}` : ''}`;
  }

  async function handleDisconnect() {
    if (!confirm('Desconectar conta Instagram?')) return;
    setDisconnecting(true);
    try {
      const token = await user!.getIdToken();
      const res = await fetch('/api/instagram/disconnect', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setStatus({ connected: false, username: null, avatar: null, connectedAt: null });
        toast('Conta Instagram desconectada', 'success');
      }
    } catch {
      toast('Erro ao desconectar', 'error');
    }
    setDisconnecting(false);
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500">Verificando conexão...</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border transition ${
      status.connected
        ? 'bg-green-50 border-green-200'
        : 'bg-gray-50 border-gray-100'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          status.connected ? 'bg-pink-500' : 'bg-gray-300'
        }`}>
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">Instagram</p>
          {status.connected ? (
            <p className="text-xs text-green-600 font-medium">Conectado como @{status.username}</p>
          ) : (
            <p className="text-xs text-gray-500">Não conectado</p>
          )}
        </div>
      </div>
      {status.connected ? (
        <button
          onClick={handleDisconnect}
          disabled={disconnecting}
          className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
        >
          {disconnecting ? 'Desconectando...' : 'Desconectar'}
        </button>
      ) : (
        <button
          onClick={handleConnect}
          className="px-3 py-1.5 text-xs font-medium text-white bg-pink-500 rounded-lg hover:bg-pink-600 transition flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
          Conectar
        </button>
      )}
    </div>
  );
}
