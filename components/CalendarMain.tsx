"use client";

import React, { useState } from 'react';
import { CalendarGrid } from './CalendarGrid';
import { CalendarPanel } from './CalendarPanel';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useDashboardStore } from '../store/useDashboardStore';
import { USERS } from '../data/mockData';
import { addMonths, formatMonthLabel, getDateKeyInMonth, getTodayDateKey, parseDateKey, startOfMonth } from '../lib/date';
import { Button } from './ui/Button';

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
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold capitalize tracking-[-0.01em] text-ink sm:text-[22px]">
            {formatMonthLabel(displayedMonth)}
          </h2>
          <div className="flex items-center rounded-control border border-line-strong bg-surface">
            <button
              type="button"
              onClick={() => navigateMonth(-1)}
              aria-label="Mes anterior"
              className="flex h-9 w-9 items-center justify-center rounded-l-control text-ink-soft transition-colors hover:bg-surface-sunken hover:text-ink"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="h-5 w-px bg-line" />
            <button
              type="button"
              onClick={() => navigateMonth(1)}
              aria-label="Mes siguiente"
              className="flex h-9 w-9 items-center justify-center rounded-r-control text-ink-soft transition-colors hover:bg-surface-sunken hover:text-ink"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
          <select
            value={filters.assignee}
            onChange={(e) => setFilters({ assignee: e.target.value })}
            className="field w-full sm:w-[210px]"
            aria-label="Filtrar por responsable"
          >
            <option value="all">Todos los responsables</option>
            {Object.values(USERS).map(u => (
              <option key={u.name} value={u.name}>{u.name}</option>
            ))}
          </select>

          <Button onClick={() => selectDate(getTodayDateKey())} className="w-full sm:w-auto">
            Hoy
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-5 xl:h-[720px] xl:flex-row">
        <div className="min-w-0 flex-1 overflow-hidden">
          <CalendarGrid displayedMonth={displayedMonth} onSelectDate={selectDate} />
        </div>
        <CalendarPanel />
      </div>
    </div>
  );
};
