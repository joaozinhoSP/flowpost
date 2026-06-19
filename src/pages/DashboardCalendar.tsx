import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Circle } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';

interface CalendarPost {
  id: number;
  content: string;
  networks: string[];
  scheduled_date: string | null;
  created_at: string;
  status: string;
}

export default function DashboardCalendar() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(false);
  const [postsByDate, setPostsByDate] = useState<Record<string, CalendarPost[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => { setVisible(true); }, []);

  const fetchPosts = useCallback(async (month: Date) => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const m = month.getMonth() + 1;
      const y = month.getFullYear();
      const res = await fetch(`/api/posts/calendar?month=${m}&year=${y}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setPostsByDate(await res.json());
    } catch {}
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchPosts(currentMonth); }, [currentMonth, fetchPosts]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const selectedKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const selectedPosts = selectedKey ? postsByDate[selectedKey] || [] : [];
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const hasPosts = (day: Date) => {
    const key = format(day, 'yyyy-MM-dd');
    return key in postsByDate;
  };

  function changeMonth(dir: number) {
    setCurrentMonth(dir < 0 ? subMonths(currentMonth, 1) : addMonths(currentMonth, 1));
    setExpanded(false);
    setSelectedDate(null);
  }

  const networkColor = (networks: string[]) => {
    const map: Record<string, string> = { twitter: 'bg-sky-500', instagram: 'bg-pink-500', linkedin: 'bg-blue-700', facebook: 'bg-blue-600', tiktok: 'bg-gray-900' };
    return map[networks[0]?.toLowerCase()] || 'bg-gray-400';
  };

  return (
    <div className={`max-w-5xl mx-auto transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`grid gap-6 ${expanded ? 'lg:grid-cols-1' : 'lg:grid-cols-3'}`}>
        <div className={`${expanded ? '' : 'lg:col-span-2'} bg-white rounded-xl border border-gray-200 shadow-card`}>
          <div className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Mês anterior">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-semibold text-gray-900">
                {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
              </h3>
              <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Próximo mês">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 mb-2">
              {dayNames.map((d) => (
                <div key={d} className="text-xs text-gray-400 font-medium text-center py-2">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {days.map((day) => {
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isCurrentMonthDay = isSameMonth(day, currentMonth);
                const hasPost = hasPosts(day);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => { setSelectedDate(day); setExpanded(true); }}
                    className={`relative p-2 md:p-3 text-sm transition flex flex-col items-center min-h-[3rem] ${
                      !isCurrentMonthDay ? 'text-gray-300' :
                      isSelected ? 'text-white' :
                      isToday(day) ? 'text-accent font-semibold' :
                      'text-gray-700 hover:bg-gray-50'
                    } ${isSelected ? 'bg-accent rounded-lg' : ''}`}
                    aria-label={format(day, "dd 'de' MMMM", { locale: ptBR })}
                  >
                    <span>{format(day, 'd')}</span>
                    {hasPost && (
                      <Circle className={`w-1.5 h-1.5 mt-0.5 ${isSelected ? 'fill-white text-white' : 'fill-accent text-accent'} animate-pulse-dot`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {expanded && (
          <div className="animate-slide-right bg-white rounded-xl border border-gray-200 shadow-card p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">
                {selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : 'Selecione um dia'}
              </h3>
              <span className="text-xs text-gray-400">{selectedPosts.length} post(s)</span>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent mx-auto" />
              </div>
            ) : selectedPosts.length > 0 ? (
              <div className="space-y-3">
                {selectedPosts.map((post) => (
                  <div key={post.id} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-2 h-2 rounded-full ${networkColor(post.networks)}`} />
                      <span className="text-xs font-medium text-gray-500">{post.networks?.[0] || 'Rede'}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ml-auto ${
                        post.status === 'published' ? 'bg-green-100 text-green-700' :
                        post.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-200 text-gray-600'
                      }`}>
                        {post.status === 'published' ? 'Publicado' : post.status === 'scheduled' ? 'Agendado' : 'Rascunho'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">Nenhum post para este dia</p>
              </div>
            )}

            <button onClick={() => setExpanded(false)} className="mt-4 w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition">
              Recolher
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
