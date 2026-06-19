import { useState, useEffect, useCallback } from 'react';
import { Search, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/toast';
import { SkeletonTable } from '../components/ui/skeleton';

interface Post {
  id: number;
  content: string;
  networks: string[];
  status: string;
  scheduled_date: string | null;
  created_at: string;
  engagement: number;
}

const statusLabels: Record<string, string> = { published: 'Publicado', scheduled: 'Agendado', draft: 'Rascunho' };
const statusColors: Record<string, string> = { published: 'bg-green-50 text-green-700', scheduled: 'bg-blue-50 text-blue-700', draft: 'bg-gray-100 text-gray-600' };
const networkColor = (net: string) => {
  const colors: Record<string, string> = { twitter: 'bg-sky-500', instagram: 'bg-pink-500', linkedin: 'bg-blue-700', facebook: 'bg-blue-600', tiktok: 'bg-gray-900' };
  return colors[net.toLowerCase()] || 'bg-gray-400';
};

export default function DashboardPosts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      if (search) params.set('search', search);

      const res = await fetch(`/api/posts?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch {}
    setLoading(false);
  }, [user, filter, search]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  useEffect(() => {
    const timer = setTimeout(() => fetchPosts(), 400);
    return () => clearTimeout(timer);
  }, [search]);

  async function handleDelete(id: number) {
    if (!confirm('Tem certeza que deseja excluir este post?')) return;
    try {
      const token = await user!.getIdToken();
      const res = await fetch(`/api/posts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== id));
        toast('Post excluído', 'success');
      }
    } catch {}
    setMenuOpen(null);
  }

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar posts..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 text-sm" aria-label="Buscar posts" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'published', 'scheduled', 'draft'].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-2 rounded-lg text-xs font-medium transition ${filter === f ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}>
              {f === 'all' ? 'Todos' : statusLabels[f]}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Post</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Rede</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">Data</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Engaj.</th>
                <th className="w-10 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-3"><SkeletonTable rows={4} /></td></tr>
              ) : posts.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Nenhum post encontrado</td></tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 truncate max-w-xs">{post.content}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`inline-block w-2 h-2 rounded-full ${networkColor(post.networks?.[0] || '')} mr-2`} />
                      <span className="text-gray-600">{post.networks?.[0] || '-'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[post.status] || ''}`}>
                        {statusLabels[post.status] || post.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                      {post.scheduled_date
                        ? new Date(post.scheduled_date).toLocaleDateString('pt-BR')
                        : new Date(post.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                      {post.engagement > 0 ? post.engagement.toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-3 relative">
                      <button onClick={() => setMenuOpen(menuOpen === post.id ? null : post.id)} className="p-1 hover:bg-gray-100 rounded-lg" aria-label="Ações">
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </button>
                      {menuOpen === post.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                          <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-lg py-1 z-20 w-32">
                            <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                              <Edit2 className="w-4 h-4" /> Editar
                            </button>
                            <button onClick={() => handleDelete(post.id)} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                              <Trash2 className="w-4 h-4" /> Excluir
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
