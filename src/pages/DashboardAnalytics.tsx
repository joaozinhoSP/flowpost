import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, BarChart3, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { SkeletonCard } from '../components/ui/skeleton';

const COLORS = ['#14B8A6', '#F59E0B', '#3B82F6', '#8B5CF6', '#EF4444'];
const periods = ['7 dias', '30 dias', '90 dias', 'Este ano'];

interface AnalyticsData {
  overview: { label: string; value: string; change: string; up: boolean }[];
  postsByNetwork: { name: string; posts: number }[];
  engagementByNetwork: { name: string; value: number }[];
}

export default function DashboardAnalytics() {
  const { user } = useAuth();
  const [period, setPeriod] = useState('30 dias');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/analytics/overview', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setData(await res.json());
    } catch {}
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex gap-2 mb-6 flex-wrap">
        {periods.map((p) => (
          <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${period === p ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}>
            {p}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {(data?.overview || []).map((item, i) => (
          <div key={item.label} className="animate-slide-up bg-white rounded-xl border border-gray-200 p-5 shadow-card" style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'both' }}>
            <p className="text-sm text-gray-500 mb-1">{item.label}</p>
            <p className="text-2xl font-bold text-gray-900">{item.value}</p>
            <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${item.up ? 'text-green-600' : 'text-red-500'}`}>
              {item.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {item.change}
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-accent" /> Posts por Rede
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.postsByNetwork || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                <Bar dataKey="posts" fill="#14B8A6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-accent" /> Engajamento por Rede
          </h3>
          <div className="h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie data={data?.engagementByNetwork || []} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                  {(data?.engagementByNetwork || []).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
              </RePieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-4 justify-center">
            {(data?.engagementByNetwork || []).map((n, i) => (
              <div key={n.name} className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                {n.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
