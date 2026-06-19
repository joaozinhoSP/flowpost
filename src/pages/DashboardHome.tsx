import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PenSquare, CalendarDays, FileText, TrendingUp, Users, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Skeleton, SkeletonCard } from '../components/ui/skeleton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const quickActions = [
  { icon: PenSquare, label: 'Novo Post', to: '/dashboard/new', color: 'bg-accent/10 text-accent' },
  { icon: CalendarDays, label: 'Calendário', to: '/dashboard/calendar', color: 'bg-blue-500/10 text-blue-600' },
  { icon: FileText, label: 'Posts', to: '/dashboard/posts', color: 'bg-purple-500/10 text-purple-600' },
];

interface Post {
  id: number;
  content: string;
  networks: string[];
  status: string;
  created_at: string;
}

interface Stats {
  published: number;
  scheduled: number;
  drafts: number;
  total: number;
  engagementThisMonth: number;
  chart: { name: string; posts: number }[];
}

export default function DashboardHome() {
  const { user, status } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    if (!user) return;

    async function fetchData() {
      const token = await user.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, recentRes] = await Promise.all([
        fetch('/api/posts/stats', { headers }),
        fetch('/api/posts/recent', { headers }),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (recentRes.ok) {
        const posts = await recentRes.json();
        setRecentPosts(posts.slice(0, 3));
      }
      setLoading(false);
    }

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const statCards = [
    { label: 'Posts publicados', value: String(stats?.published || 0), icon: FileText, change: '', color: 'bg-accent/10 text-accent' },
    { label: 'Agendados', value: String(stats?.scheduled || 0), icon: CalendarDays, change: '', color: 'bg-blue-500/10 text-blue-600' },
    { label: 'Engajamento', value: formatEngagement(stats?.engagementThisMonth || 0), icon: TrendingUp, change: '', color: 'bg-purple-500/10 text-purple-600' },
    { label: 'Redes ativas', value: String(stats?.published || 0) + (stats && stats.published >= 0 ? '+' : ''), icon: Users, change: '', color: 'bg-orange-500/10 text-orange-600' },
  ];

  const statusLabel = status?.planId === 'free' ? 'Free' : status?.planId === 'pro_monthly' ? 'Pro' : 'Business';

  return (
    <div className={`transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Bem-vindo ao FlowPost</h2>
        <p className="text-gray-500 text-sm mt-1">Plano {statusLabel} &middot; {stats?.total || 0} posts no total</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="animate-slide-up bg-white rounded-xl border border-gray-200 p-5 shadow-card hover:shadow-card-hover transition-shadow"
              style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'both' }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Posts da Semana</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.chart || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }} />
                <Line type="monotone" dataKey="posts" stroke="#14B8A6" strokeWidth={2} dot={{ r: 4, fill: '#14B8A6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
          <div className="space-y-3">
            {quickActions.map((a) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.label}
                  onClick={() => navigate(a.to)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition group"
                >
                  <div className={`w-10 h-10 rounded-lg ${a.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 flex-1 text-left">{a.label}</span>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition" />
                </button>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-2">Posts usados este mês</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div
                  className="bg-accent h-2 rounded-full transition-all duration-1000"
                  style={{
                    width: status?.postsLimit && status.postsLimit > 0
                      ? `${Math.min((status.postsUsed / status.postsLimit) * 100, 100)}%`
                      : '0%',
                  }}
                />
              </div>
              <span className="text-xs font-medium text-gray-600">
                {status?.postsLimit === -1 ? 'Ilimitado' : `${status?.postsUsed || 0}/${status?.postsLimit || 5}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Posts Recentes</h3>
          <button onClick={() => navigate('/dashboard/posts')} className="text-sm text-accent hover:underline">Ver todos</button>
        </div>
        {recentPosts.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">Nenhum post ainda. Crie seu primeiro post!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentPosts.map((post) => {
              const network = post.networks?.[0] || 'Rede';
              return (
                <div key={post.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400">
                    {network.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{post.content}</p>
                    <p className="text-xs text-gray-500">{new Date(post.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    post.status === 'published' ? 'bg-green-50 text-green-700' :
                    post.status === 'scheduled' ? 'bg-blue-50 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {post.status === 'published' ? 'Publicado' : post.status === 'scheduled' ? 'Agendado' : 'Rascunho'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function formatEngagement(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
