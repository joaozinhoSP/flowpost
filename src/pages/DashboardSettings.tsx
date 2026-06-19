import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Bell, Shield, TicketCheck, Globe, ChevronRight } from 'lucide-react';
import { useToast } from '../components/ui/toast';
import ConnectMastodon from '../components/ConnectMastodon';

const sections = [
  { id: 'profile', icon: User, label: 'Perfil' },
  { id: 'networks', icon: Globe, label: 'Redes Sociais' },
  { id: 'notifications', icon: Bell, label: 'Notificações' },
  { id: 'security', icon: Shield, label: 'Segurança' },
  { id: 'subscription', icon: TicketCheck, label: 'Assinatura' },
];

export default function DashboardSettings() {
  const { user, status } = useAuth();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [visible, setVisible] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => { setVisible(true); }, []);

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName || '');

    async function loadProfile() {
      const token = await user.getIdToken();
      const res = await fetch('/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDisplayName(data.displayName || '');
        setBio(data.bio || '');
      }
    }
    loadProfile();
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const token = await user!.getIdToken();
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ displayName, bio }),
      });
      if (res.ok) toast('Perfil atualizado!', 'success');
      else throw new Error('Erro ao salvar');
    } catch {
      toast('Erro ao salvar perfil', 'error');
    }
    setSaving(false);
  }

  function ActiveSection() {
    switch (activeSection) {
      case 'profile':
        return (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input id="name" type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 text-sm" aria-label="Nome" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input id="email" type="email" value={user?.email || ''} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 text-sm cursor-not-allowed" disabled aria-label="Email" />
            </div>
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea id="bio" rows={3} value={bio} onChange={e => setBio(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 text-sm resize-none" placeholder="Conte um pouco sobre você" aria-label="Bio" />
            </div>
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-accent text-white font-medium rounded-xl hover:bg-accent/90 transition disabled:opacity-60">
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>
        );
      case 'networks':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Redes Conectadas</h4>
              <p className="text-xs text-gray-500 mb-4">Conecte sua conta do Mastodon para publicar posts automaticamente.</p>
              <ConnectMastodon />
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="space-y-4">
            {[
              { label: 'Email de confirmação de post', desc: 'Quando um post for publicado' },
              { label: 'Relatório semanal', desc: 'Resumo de desempenho toda segunda' },
              { label: 'Lembrete de agendamento', desc: '24h antes de cada post' },
            ].map((item) => (
              <label key={item.label} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-gray-300 text-accent focus:ring-accent" />
              </label>
            ))}
          </div>
        );
      case 'security':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Gerencie sua segurança e sessões ativas.</p>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-sm font-medium text-gray-900 mb-1">Sessões ativas</p>
              <p className="text-xs text-gray-500">Você está logado em 1 dispositivo.</p>
            </div>
            <button className="text-sm text-red-600 hover:text-red-700 font-medium">Deslogar de todos os dispositivos</button>
          </div>
        );
      case 'subscription':
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-sm font-medium text-gray-900 mb-1">Plano atual</p>
              <p className="text-lg font-bold text-primary capitalize">
                {status?.planId === 'pro_monthly' ? 'Pro' : status?.planId === 'business_monthly' ? 'Business' : 'Free'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {status?.planId === 'free' ? '5 posts/mês' : status?.planId === 'pro_monthly' ? '50 posts/mês' : 'Posts ilimitados'}
              </p>
            </div>
            {status?.planId !== 'free' && (
              <button className="text-sm text-red-600 hover:text-red-700 font-medium">Cancelar assinatura</button>
            )}
          </div>
        );
    }
  }

  return (
    <div className={`max-w-4xl mx-auto transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="grid md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 shadow-card p-2">
            {sections.map((s) => {
              const Icon = s.icon;
              return (
                <button key={s.id} onClick={() => setActiveSection(s.id)} className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition ${activeSection === s.id ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <Icon className="w-4 h-4" />
                  {s.label}
                  {activeSection === s.id && <ChevronRight className="w-4 h-4 ml-auto" />}
                </button>
              );
            })}
          </div>
        </div>
        <div className="md:col-span-3">
          <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 capitalize">{sections.find(s => s.id === activeSection)?.label}</h3>
            <ActiveSection />
          </div>
        </div>
      </div>
    </div>
  );
}
