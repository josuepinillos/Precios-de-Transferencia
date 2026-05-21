"use client";

import React from 'react';
import { 
  LayoutDashboard, 
  ListTree, 
  Calendar, 
  Moon,
  Sun,
  Menu,
  X
} from 'lucide-react';
import { useDashboardStore } from '../store/useDashboardStore';

type ViewId = 'dashboard' | 'timeline' | 'calendar';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
  { icon: ListTree, label: 'Timeline', id: 'timeline' },
  { icon: Calendar, label: 'Calendario', id: 'calendar' },
] satisfies Array<{
  icon: typeof LayoutDashboard;
  label: string;
  id: ViewId;
}>;

const getCurrentTheme = (): 'dark' | 'light' => {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
};

export const Sidebar = () => {
  const { currentView, setCurrentView } = useDashboardStore();
  const [isOpen, setIsOpen] = React.useState(false);
  const [theme, setTheme] = React.useState<'dark' | 'light'>(getCurrentTheme);

  const handleNavigate = (id: ViewId) => {
    setCurrentView(id);
    setIsOpen(false);
  };

  const applyTheme = (nextTheme: 'dark' | 'light') => {
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem('dashboard-theme', nextTheme);
    document.cookie = `dashboard-theme=${nextTheme}; path=/; max-age=31536000; samesite=lax`;
    setTheme(nextTheme);
  };

  const renderSidebarContent = () => (
    <>
      <div>
        <div className="flex items-center gap-3 px-2 mb-8 lg:mb-10">
          <div className="w-10 h-10 rounded-lg bg-[#1e253c] flex items-center justify-center font-bold text-white shadow-lg border border-[#2a334e]">
            TP
          </div>
          <div className="md:hidden lg:block">
            <h1 className="font-bold text-white text-sm tracking-wide leading-tight uppercase">Transfer<br />Pricing</h1>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`flex items-center md:justify-center lg:justify-start gap-3 px-4 md:px-3 lg:px-4 py-3 min-h-11 rounded-xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-gradient-to-r from-[#506ff0]/20 to-[#8b5cf6]/20 text-[#506ff0] border border-[#506ff0]/30 shadow-[0_0_15px_rgba(80,111,240,0.15)]' 
                    : 'text-slate-400 hover:text-white hover:bg-[#1e253c]/50 border border-transparent'
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`font-medium text-sm md:hidden lg:inline ${isActive ? 'text-white' : ''}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto pt-8 flex items-center md:justify-center lg:justify-between px-2 text-slate-400">
        <span className="text-sm font-medium md:hidden lg:inline">Tema</span>
        <div className="flex bg-[#1e253c] rounded-full p-1 relative">
          <div className={`absolute left-1 top-1 w-7 h-7 bg-[#506ff0] rounded-full shadow-lg transition-transform duration-300 ${theme === 'light' ? 'translate-x-7' : 'translate-x-0'}`} />
          <button
            type="button"
            onClick={() => applyTheme('dark')}
            className={`theme-toggle-control w-7 h-7 flex items-center justify-center relative z-10 transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-400'}`}
            aria-label="Activar modo oscuro"
            aria-pressed={theme === 'dark'}
          >
            <Moon size={14} />
          </button>
          <button
            type="button"
            onClick={() => applyTheme('light')}
            className={`theme-toggle-control w-7 h-7 flex items-center justify-center relative z-10 transition-colors ${theme === 'light' ? 'text-white' : 'text-slate-400'}`}
            aria-label="Activar modo claro"
            aria-pressed={theme === 'light'}
          >
            <Sun size={14} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-[#0e121e]/95 backdrop-blur-xl border-b border-[#1e253c] flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#1e253c] flex items-center justify-center font-bold text-white shadow-lg border border-[#2a334e]">
            TP
          </div>
          <span className="font-bold text-white text-xs tracking-wide uppercase">Transfer Pricing</span>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-11 h-11 rounded-xl border border-[#1e253c] bg-[#121827] text-white flex items-center justify-center"
          aria-label="Abrir menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {isOpen && (
        <button
          type="button"
          aria-label="Cerrar menu"
          onClick={() => setIsOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-[#0b0f19]/70 backdrop-blur-sm"
        />
      )}

      <aside className={`md:hidden fixed top-0 left-0 z-50 h-dvh w-[min(82vw,320px)] bg-[#0e121e] border-r border-[#1e253c] flex flex-col justify-between py-6 px-4 shadow-2xl transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 w-10 h-10 rounded-xl text-slate-400 hover:text-white hover:bg-[#1e253c] flex items-center justify-center"
          aria-label="Cerrar menu"
        >
          <X size={18} />
        </button>
        {renderSidebarContent()}
      </aside>

      <aside className="hidden md:flex md:w-[88px] lg:w-[260px] h-screen bg-[#0e121e]/80 backdrop-blur-xl border-r border-[#1e253c] flex-col justify-between py-6 px-4 sticky top-0 flex-shrink-0">
        {renderSidebarContent()}
      </aside>
    </>
  );
};

