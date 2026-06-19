import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/toast';
import ConnectMastodon from '../components/ConnectMastodon';
import { Plug, Plus, Trash2, Check, X, Globe, RefreshCw, AlertCircle } from 'lucide-react';

interface SocialAccount {
  id: string;
  network: string;
  label: string;
  accountName?: string;
  avatar?: string;
  active: boolean;
  createdAt: string;
}

const networkColors: Record<string, string> = {
  twitter: 'bg-sky-500', instagram: 'bg-pink-500', linkedin: 'bg-blue-700',
  facebook: 'bg-blue-600', tiktok: 'bg-gray-900', mastodon: 'bg-purple-500',
};

const networkIcons: Record<string, string> = {
  twitter: 'X', instagram: 'Ig', linkedin: 'in', facebook: 'Fb', tiktok: 'Tk', mastodon: 'M',
};

export default function DashboardSocial() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formNetwork, setFormNetwork] = useState('twitter');
  const [formLabel, setFormLabel] = useState('');
  const [formToken, setFormToken] = useState('');
  const [formAccountId, setFormAccountId] = useState('');
  const [saving, setSaving] = useState(false);

  async function fetchAccounts() {
    try {
      const token = await user!.getIdToken();
      const res = await fetch('/api/social', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setAccounts(await res.json());
    } catch {}
    setLoading(false);
  }

  useEffect(() => { fetchAccounts(); }, [user]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!formToken.trim()) { toast('Token é obrigatório', 'error'); return; }
    setSaving(true);
    try {
      const token = await user!.getIdToken();
      const res = await fetch('/api/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          network: formNetwork,
          label: formLabel || formNetwork,
          accessToken: formToken,
          accountId: formAccountId || undefined,
        }),
      });
      if (res.ok) {
        toast('Conta conectada!', 'success');
        setShowForm(false);
        setFormToken('');
        setFormLabel('');
        setFormAccountId('');
        fetchAccounts();
      } else {
        let errMsg = 'Erro ao conectar';
        try { const err = await res.json(); errMsg = err.error || errMsg; } catch { errMsg = await res.text(); }
        throw new Error(errMsg);
      }
    } catch (err: any) {
      toast(err.message, 'error');
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover esta conta?')) return;
    const token = await user!.getIdToken();
    const res = await fetch(`/api/social/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setAccounts(prev => prev.filter(a => a.id !== id));
      toast('Conta removida', 'success');
    }
  }

  async function toggleActive(id: string, current: boolean) {
    const token = await user!.getIdToken();
    await fetch(`/api/social/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ active: !current }),
    });
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, active: !current } : a));
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Redes Sociais</h2>
          <p className="text-sm text-gray-500 mt-1">Conecte suas contas para publicar automaticamente</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium rounded-xl hover:bg-accent/90 transition">
          <Plus className="w-4 h-4" /> Conectar Conta
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-card mb-6 animate-slide-up">
          <h3 className="font-semibold text-gray-900 mb-4">Nova Conexão</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Rede Social</label>
                <select value={formNetwork} onChange={e => setFormNetwork(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-accent text-sm">
                  <option value="twitter">Twitter / X</option>
                  <option value="instagram">Instagram</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="facebook">Facebook</option>
                  <option value="tiktok">TikTok</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nome (opcional)</label>
                <input type="text" value={formLabel} onChange={e => setFormLabel(e.target.value)} placeholder="Ex: Meu Twitter" className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-accent text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Token / Access Token
                <a href="#how-to-get-token" className="text-accent ml-1 underline">(Como obter?)</a>
              </label>
              <input type="text" value={formToken} onChange={e => setFormToken(e.target.value)} placeholder="Cole seu token aqui" className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-accent text-sm font-mono" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Account ID (opcional, necessário para algumas redes)</label>
              <input type="text" value={formAccountId} onChange={e => setFormAccountId(e.target.value)} placeholder="ID da conta ou página" className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-accent text-sm" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="px-6 py-2.5 bg-accent text-white font-medium rounded-xl hover:bg-accent/90 transition disabled:opacity-60">
                {saving ? 'Conectando...' : 'Conectar'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent mx-auto" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-card">
          <Plug className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma conta conectada</h3>
          <p className="text-sm text-gray-500 mb-6">Conecte suas redes sociais para publicar automaticamente seus posts</p>
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white font-medium rounded-xl hover:bg-accent/90 transition">
            <Plus className="w-4 h-4" /> Conectar Primeira Conta
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {accounts.map((acc) => {
            const color = networkColors[acc.network] || 'bg-gray-400';
            const icon = networkIcons[acc.network] || '?';
            return (
              <div key={acc.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-card flex items-center gap-4 hover:shadow-card-hover transition">
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{acc.label}</p>
                  {acc.accountName && <p className="text-xs text-gray-500">{acc.accountName}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${acc.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {acc.active ? 'Ativo' : 'Inativo'}
                  </span>
                  <button onClick={() => toggleActive(acc.id, acc.active)} className="p-1.5 hover:bg-gray-100 rounded-lg" title={acc.active ? 'Desativar' : 'Ativar'}>
                    {acc.active ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-gray-400" />}
                  </button>
                  <button onClick={() => handleDelete(acc.id)} className="p-1.5 hover:bg-red-50 rounded-lg" title="Remover">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6">
        <h3 className="font-semibold text-gray-900 mb-3">Mastodon</h3>
        <p className="text-xs text-gray-500 mb-3">Conecte sua conta do Mastodon para publicar posts automaticamente.</p>
        <ConnectMastodon />
      </div>

        <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6 shadow-card">
        <h3 className="font-semibold text-gray-900 mb-3">Como conectar cada rede</h3>
        <div className="space-y-3 text-sm text-gray-600">
          <p><strong className="text-gray-900">Mastodon:</strong> Clique em "Conectar" ao lado, autorize no Mastodon e pronto! A conexão é feita via OAuth com 1 clique.</p>
          <p><strong className="text-gray-900">Twitter / X:</strong> Vá para o <a href="https://developer.twitter.com" target="_blank" className="text-accent hover:underline">Portal do Desenvolvedor</a>, crie um app e gere um Bearer Token.</p>
          <p><strong className="text-gray-900">Instagram:</strong> Precisa de uma conta Business/Criadora + App do Facebook. Use o <a href="https://developers.facebook.com" target="_blank" className="text-accent hover:underline">Graph API Explorer</a> para gerar um token de página.</p>
          <p><strong className="text-gray-900">LinkedIn:</strong> Crie um app em <a href="https://developer.linkedin.com" target="_blank" className="text-accent hover:underline">developer.linkedin.com</a> e solicite os escopos w_member_social.</p>
          <p><strong className="text-gray-900">Facebook:</strong> Crie um app em <a href="https://developers.facebook.com" target="_blank" className="text-accent hover:underline">developers.facebook.com</a> e gere um Page Access Token.</p>
          <p><strong className="text-gray-900">TikTok:</strong> Crie um app em <a href="https://developers.tiktok.com" target="_blank" className="text-accent hover:underline">developers.tiktok.com</a> e solicite o escopo video.publish.</p>
        </div>
      </div>
    </div>
  );
}
