"use client";

import React from 'react';
import { CalendarGrid } from './CalendarGrid';
import { CalendarPanel } from './CalendarPanel';
import { ChevronLeft, ChevronRight, Filter, ChevronDown } from 'lucide-react';
import { useDashboardStore } from '../store/useDashboardStore';
import { USERS } from '../data/mockData';

export const CalendarMain = () => {
  const { filters, setFilters } = useDashboardStore();

  return (
    <div className="flex flex-col gap-6">
      {/* Tabs (optional, to match Timeline if they share the same area, or we can just keep Calendar specific header) */}
      <h2 className="text-xl font-semibold mb-2">Calendario</h2>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="px-4 py-2 rounded-lg bg-[#1e253c] text-white text-sm font-medium hover:bg-[#2a334e] transition-colors border border-[#2a334e]">
            Hoy
          </button>
          
          <div className="flex items-center gap-1">
            <button className="p-2 rounded-lg bg-[#1e253c] text-white hover:bg-[#2a334e] transition-colors border border-[#2a334e]">
              <ChevronLeft size={16} />
            </button>
            <button className="p-2 rounded-lg bg-[#1e253c] text-white hover:bg-[#2a334e] transition-colors border border-[#2a334e]">
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="flex items-center gap-2 px-2">
            <span className="text-lg font-bold">Mayo 2026</span>
            <ChevronDown size={16} className="text-slate-400" />
          </div>
        </div>

        <div className="flex items-center gap-3">
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
          
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#1e253c] text-slate-300 text-sm hover:bg-[#1e253c]/50 transition-colors">
            <span>Mes</span>
            <ChevronDown size={16} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-6 h-[700px]">
        <div className="flex-1 overflow-hidden">
          <CalendarGrid />
        </div>
        <CalendarPanel />
      </div>
    </div>
  );
};
