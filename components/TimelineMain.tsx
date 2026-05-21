"use client";

import React, { useState } from 'react';
import { Timeline } from './Timeline';
import { TaskPanel } from './TaskPanel';
import { Search, Plus } from 'lucide-react';
import { useDashboardStore } from '../store/useDashboardStore';
import { NewTaskModal } from './NewTaskModal';
import { USERS } from '../data/mockData';

export const TimelineMain = () => {
  const { filters, setFilters } = useDashboardStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-[#1e253c] pb-4">
        <div className="flex items-center">
          <h2 className="text-sm font-semibold text-white">Timeline</h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap lg:flex-nowrap sm:items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-lg bg-[#506ff0] text-white text-sm hover:bg-[#3f5bc4] transition-colors shadow-lg"
          >
            <Plus size={14} /> Nueva Tarea
          </button>
          
          <select
            value={filters.assignee}
            onChange={(e) => setFilters({ assignee: e.target.value })}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-lg border border-[#1e253c] bg-transparent text-slate-300 text-sm hover:bg-[#1e253c]/50 transition-colors focus:outline-none focus:border-[#506ff0] appearance-none cursor-pointer"
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
              className="pl-9 pr-4 py-2.5 sm:py-2 rounded-lg border border-[#1e253c] bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#506ff0] transition-colors w-full sm:w-[220px] lg:w-[200px]"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col xl:flex-row gap-4 lg:gap-6 xl:h-[700px]">
        <div className="min-w-0 flex-1 overflow-hidden">
          <Timeline />
        </div>
        <TaskPanel />
      </div>
      
      <NewTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

