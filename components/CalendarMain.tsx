"use client";

import React, { useState } from 'react';
import { CalendarGrid } from './CalendarGrid';
import { CalendarPanel } from './CalendarPanel';
import { ChevronLeft, ChevronRight, Filter, ChevronDown } from 'lucide-react';
import { useDashboardStore } from '../store/useDashboardStore';
import { USERS } from '../data/mockData';
import { addMonths, formatMonthLabel, getDateKeyInMonth, getTodayDateKey, parseDateKey, startOfMonth } from '../lib/date';

export const CalendarMain = () => {
  const { filters, setFilters, currentDate, setCurrentDate } = useDashboardStore();
  const [displayedMonth, setDisplayedMonth] = useState(() => startOfMonth(parseDateKey(currentDate) ?? new Date()));

  const selectDate = (dateKey: string) => {
    const date = parseDateKey(dateKey);
    if (!date) return;
    setCurrentDate(dateKey);
    setDisplayedMonth(startOfMonth(date));
  };

  const navigateMonth = (amount: number) => {
    const nextMonth = addMonths(displayedMonth, amount);
    const selectedDay = parseDateKey(currentDate)?.getDate() ?? 1;
    setDisplayedMonth(nextMonth);
    setCurrentDate(getDateKeyInMonth(nextMonth, selectedDay));
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Tabs (optional, to match Timeline if they share the same area, or we can just keep Calendar specific header) */}
      <h2 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">Calendario</h2>
      
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <button onClick={() => selectDate(getTodayDateKey())} className="px-4 py-2.5 sm:py-2 rounded-lg bg-[#1e253c] text-white text-sm font-medium hover:bg-[#2a334e] transition-colors border border-[#2a334e]">
            Hoy
          </button>
          
          <div className="flex items-center gap-1">
            <button onClick={() => navigateMonth(-1)} aria-label="Mes anterior" className="p-2.5 sm:p-2 rounded-lg bg-[#1e253c] text-white hover:bg-[#2a334e] transition-colors border border-[#2a334e]">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => navigateMonth(1)} aria-label="Mes siguiente" className="p-2.5 sm:p-2 rounded-lg bg-[#1e253c] text-white hover:bg-[#2a334e] transition-colors border border-[#2a334e]">
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="flex items-center gap-2 px-2">
            <span className="text-base sm:text-lg font-bold capitalize">{formatMonthLabel(displayedMonth)}</span>
            <ChevronDown size={16} className="text-slate-400" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-lg border border-[#1e253c] text-slate-300 text-sm hover:bg-[#1e253c]/50 transition-colors">
            <Filter size={16} />
            <span>Filtros</span>
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
          
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-lg border border-[#1e253c] text-slate-300 text-sm hover:bg-[#1e253c]/50 transition-colors">
            <span>Mes</span>
            <ChevronDown size={16} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col xl:flex-row gap-4 lg:gap-6 xl:h-[700px]">
        <div className="min-w-0 flex-1 overflow-hidden">
          <CalendarGrid displayedMonth={displayedMonth} onSelectDate={selectDate} />
        </div>
        <CalendarPanel />
      </div>
    </div>
  );
};
