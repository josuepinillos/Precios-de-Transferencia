"use client";

import React, { useState } from 'react';
import { Timeline } from './Timeline';
import { TaskPanel } from './TaskPanel';
import { Filter, Search, Plus } from 'lucide-react';
import { useDashboardStore } from '../store/useDashboardStore';
import { NewTaskModal } from './NewTaskModal';
import { USERS } from '../data/mockData';

export const TimelineMain = () => {
  const { currentView, setCurrentView, filters, setFilters } = useDashboardStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      {/* Tabs & Filters */}
      <div className="flex items-center justify-between border-b border-[#1e253c] pb-4">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setCurrentView('timeline')}
            className={`text-sm font-medium transition-colors ${currentView === 'timeline' ? 'text-white border-b-2 border-[#506ff0] pb-4 -mb-[17px]' : 'text-slate-400 hover:text-white'}`}
          >
            Timeline
          </button>
          <button 
            onClick={() => setCurrentView('calendar')}
            className={`text-sm font-medium transition-colors ${currentView === 'calendar' ? 'text-white border-b-2 border-[#506ff0] pb-4 -mb-[17px]' : 'text-slate-400 hover:text-white'}`}
          >
            Calendario
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#506ff0] text-white text-sm hover:bg-[#3f5bc4] transition-colors shadow-lg"
          >
            <Plus size={14} /> Nueva Tarea
          </button>

          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#1e253c] text-slate-300 text-sm hover:bg-[#1e253c]/50 transition-colors">
            <Filter size={16} />
            <span>Filtros</span>
          </button>
          
          <select
            value={filters.assignee}
            onChange={(e) => setFilters({ assignee: e.target.value })}
            className="px-4 py-2 rounded-lg border border-[#1e253c] bg-transparent text-slate-300 text-sm hover:bg-[#1e253c]/50 transition-colors focus:outline-none focus:border-[#506ff0] appearance-none cursor-pointer"
          >
            <option value="all" className="bg-[#0e121e]">Todos los responsables</option>
            {Object.values(USERS).map(u => (
              <option key={u.name} value={u.name} className="bg-[#0e121e]">{u.name}</option>
            ))}
          </select>

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Buscar tarea..." 
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              className="pl-9 pr-4 py-2 rounded-lg border border-[#1e253c] bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#506ff0] transition-colors w-[200px]"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-6 h-[700px]">
        <div className="flex-1 overflow-hidden">
          <Timeline />
        </div>
        <TaskPanel />
      </div>
      
      <NewTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

