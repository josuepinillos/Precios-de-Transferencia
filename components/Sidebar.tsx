"use client";

import React from 'react';
import { 
  LayoutDashboard, 
  ListTree, 
  Calendar, 
  Moon,
  Sun
} from 'lucide-react';
import { useDashboardStore } from '../store/useDashboardStore';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
  { icon: ListTree, label: 'Timeline', id: 'timeline' },
  { icon: Calendar, label: 'Calendario', id: 'calendar' },
];

export const Sidebar = () => {
  const { currentView, setCurrentView } = useDashboardStore();

  return (
    <aside className="w-[260px] h-screen bg-[#0e121e]/80 backdrop-blur-xl border-r border-[#1e253c] flex flex-col justify-between py-6 px-4 sticky top-0">
      <div>
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="w-10 h-10 rounded-lg bg-[#1e253c] flex items-center justify-center font-bold text-white shadow-lg border border-[#2a334e]">
            TP
          </div>
          <div>
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
                onClick={() => {
                  if (['dashboard', 'timeline', 'calendar'].includes(item.id)) {
                    setCurrentView(item.id as any);
                  }
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-gradient-to-r from-[#506ff0]/20 to-[#8b5cf6]/20 text-[#506ff0] border border-[#506ff0]/30 shadow-[0_0_15px_rgba(80,111,240,0.15)]' 
                    : 'text-slate-400 hover:text-white hover:bg-[#1e253c]/50 border border-transparent'
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`font-medium text-sm ${isActive ? 'text-white' : ''}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto pt-8 flex items-center justify-between px-2 text-slate-400">
        <span className="text-sm font-medium">Tema</span>
        <div className="flex bg-[#1e253c] rounded-full p-1 relative">
          <div className="absolute left-1 top-1 w-7 h-7 bg-[#506ff0] rounded-full shadow-lg transition-all" />
          <button className="w-7 h-7 flex items-center justify-center relative z-10 text-white">
            <Moon size={14} />
          </button>
          <button className="w-7 h-7 flex items-center justify-center relative z-10">
            <Sun size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
};

