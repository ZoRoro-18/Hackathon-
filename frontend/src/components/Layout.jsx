import { Outlet, NavLink } from 'react-router-dom';
import { Home, FileText, Upload, Bot, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const navItems = [
    { name: 'Dashboard', icon: Home, path: '/' },
    { name: 'Documents', icon: FileText, path: '/documents' },
    { name: 'Ask AI', icon: Bot, path: '/ask' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-50">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-800 border-r border-slate-700 shadow-lg p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 bg-teal-500 rounded-lg shadow-lg shadow-teal-500/20"></div>
          <h2 className="text-2xl font-bold text-white tracking-tight">KhaataAI</h2>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-900/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`
              }
            >
              <item.icon size={20} />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-slate-700 pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-slate-700 p-2 rounded-full text-slate-300">
              <User size={18} />
            </div>
            <div className="overflow-hidden">
              <div className="font-medium text-slate-200 truncate">{user?.full_name || 'Demo User'}</div>
              <div className="text-xs text-slate-500 truncate">{user?.email || 'demo@khaata.ai'}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg font-medium transition-all">
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full mx-auto animate-fade-in pb-20 md:pb-0 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Nav for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 p-3 z-50 flex justify-around">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-[10px] ${
                isActive ? 'text-teal-400' : 'text-slate-400'
              }`
            }
          >
            <item.icon size={20} />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
