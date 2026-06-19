import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PenSquare, CalendarDays, FileText, BarChart3, Settings, X, Plug } from 'lucide-react';

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dashboard/new', icon: PenSquare, label: 'Novo Post' },
  { to: '/dashboard/calendar', icon: CalendarDays, label: 'Calendário' },
  { to: '/dashboard/posts', icon: FileText, label: 'Posts' },
  { to: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/dashboard/social', icon: Plug, label: 'Redes Sociais' },
  { to: '/dashboard/settings', icon: Settings, label: 'Configurações' },
];

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed top-0 left-0 z-30 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Navegação do dashboard"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <NavLink to="/" className="text-xl font-bold text-primary" aria-label="FlowPost Home">
            FlowPost
          </NavLink>
          <button onClick={onClose} className="lg:hidden p-1 hover:bg-gray-100 rounded-lg" aria-label="Fechar menu">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-3 space-y-1">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
              aria-label={label}
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
