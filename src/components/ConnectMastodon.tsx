import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './ui/toast';
import { Loader2 } from 'lucide-react';

interface MastodonStatus {
  connected: boolean;
  username: string | null;
  avatar: string | null;
  connectedAt: string | null;
}

export default function ConnectMastodon() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<MastodonStatus>({ connected: false, username: null, avatar: null, connectedAt: null });
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/mastodon/status', {
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
    if (params.get('mastodon') === 'connected') {
      toast('Conta Mastodon conectada com sucesso!', 'success');
      window.history.replaceState({}, '', window.location.pathname);
      fetchStatus();
    } else if (params.get('mastodon') === 'error') {
      toast(`Erro ao conectar: ${params.get('message') || 'Erro desconhecido'}`, 'error');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [fetchStatus, toast]);

  function handleConnect() {
    const state = user ? btoa(JSON.stringify({ uid: user.uid })) : '';
    window.location.href = `/api/auth/mastodon${state ? `?state=${state}` : ''}`;
  }

  async function handleDisconnect() {
    if (!confirm('Desconectar conta Mastodon?')) return;
    setDisconnecting(true);
    try {
      const token = await user!.getIdToken();
      const res = await fetch('/api/mastodon/disconnect', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setStatus({ connected: false, username: null, avatar: null, connectedAt: null });
        toast('Conta Mastodon desconectada', 'success');
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
          status.connected ? 'bg-green-500' : 'bg-gray-300'
        }`}>
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.268 5.313c-.35-2.578-2.617-4.61-5.304-5.004C17.51.238 14.373 0 12 0S6.49.238 5.036.309C2.348.703.08 2.735-.27 5.313c-.566 3.9-.598 7.411.056 10.706.425 2.137 1.555 4.086 3.133 5.601 1.578 1.516 3.555 2.572 5.633 2.955l.41.082c1.34.262 2.703.34 4.064.292 1.684-.05 3.39-.274 5.02-.56 1.174-.213 2.297-.685 3.196-1.355.899-.67 1.613-1.555 2.016-2.56 1.351-3.28 1.426-7.306.53-11.474zm-5.58 8.163c0 .364-.34.712-.85.712a.77.77 0 01-.554-.214 2.72 2.72 0 00-.435-.296c-1.126-.67-2.372-.965-3.406-.965-1.467 0-2.403.4-2.956 1.025-.376.426-.503.933-.503 1.397 0 1.634 4.1 2.074 6.753 2.634.576.126 1.118.58.88 1.307-.174.532-.762.923-1.32 1.038-1.782.368-3.7.32-5.478-.143-.5-.13-.93-.287-1.348-.458v3.097c.87.372 1.807.627 2.757.756 1.492.188 3.018.234 4.537.116 1.188-.127 2.476-.37 3.644-.9.953-.442 1.81-1.145 2.232-2.037.777-1.613.492-3.137-.048-4.068-.443-.766-1.31-1.401-2.34-1.76-1.374-.48-3.332-.69-5.153-.78-1.702-.095-2.86-.232-3.268-.476-.206-.124-.412-.35-.232-.75.142-.318.526-.473 1.063-.53.986-.104 2.19-.02 3.75.246 1.106.188 2.408.627 3.614 1.33.465.27.928.467 1.37.628.29.105.567.166.831.2.383.047.604-.244.604-.598z"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">Mastodon</p>
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
          className="px-3 py-1.5 text-xs font-medium text-white bg-accent rounded-lg hover:bg-accent/90 transition flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.268 5.313c-.35-2.578-2.617-4.61-5.304-5.004C17.51.238 14.373 0 12 0S6.49.238 5.036.309C2.348.703.08 2.735-.27 5.313c-.566 3.9-.598 7.411.056 10.706.425 2.137 1.555 4.086 3.133 5.601 1.578 1.516 3.555 2.572 5.633 2.955l.41.082c1.34.262 2.703.34 4.064.292 1.684-.05 3.39-.274 5.02-.56 1.174-.213 2.297-.685 3.196-1.355.899-.67 1.613-1.555 2.016-2.56 1.351-3.28 1.426-7.306.53-11.474zm-5.58 8.163c0 .364-.34.712-.85.712a.77.77 0 01-.554-.214 2.72 2.72 0 00-.435-.296c-1.126-.67-2.372-.965-3.406-.965-1.467 0-2.403.4-2.956 1.025-.376.426-.503.933-.503 1.397 0 1.634 4.1 2.074 6.753 2.634.576.126 1.118.58.88 1.307-.174.532-.762.923-1.32 1.038-1.782.368-3.7.32-5.478-.143-.5-.13-.93-.287-1.348-.458v3.097c.87.372 1.807.627 2.757.756 1.492.188 3.018.234 4.537.116 1.188-.127 2.476-.37 3.644-.9.953-.442 1.81-1.145 2.232-2.037.777-1.613.492-3.137-.048-4.068-.443-.766-1.31-1.401-2.34-1.76-1.374-.48-3.332-.69-5.153-.78-1.702-.095-2.86-.232-3.268-.476-.206-.124-.412-.35-.232-.75.142-.318.526-.473 1.063-.53.986-.104 2.19-.02 3.75.246 1.106.188 2.408.627 3.614 1.33.465.27.928.467 1.37.628.29.105.567.166.831.2.383.047.604-.244.604-.598z"/>
          </svg>
          Conectar
        </button>
      )}
    </div>
  );
}
