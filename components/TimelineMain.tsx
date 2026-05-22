"use client";

import React, { useRef, useState } from 'react';
import { Timeline } from './Timeline';
import { TaskPanel } from './TaskPanel';
import { Search, Plus } from 'lucide-react';
import { useDashboardStore } from '../store/useDashboardStore';
import { NewTaskModal } from './NewTaskModal';
import { USERS } from '../data/mockData';

const TIMELINE_PANEL_SIZE_KEY = 'timeline-detail-panel-percent';
const MIN_RIGHT_PANEL = 22;
const MAX_RIGHT_PANEL = 45;
const DEFAULT_RIGHT_PANEL = 30;

const clampPanelPercent = (value: number) =>
  Math.min(MAX_RIGHT_PANEL, Math.max(MIN_RIGHT_PANEL, value));

export const TimelineMain = () => {
  const { filters, setFilters, selectedTaskId } = useDashboardStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rightPanelPercent, setRightPanelPercent] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_RIGHT_PANEL;
    const savedSize = window.localStorage.getItem(TIMELINE_PANEL_SIZE_KEY);
    const parsedSize = savedSize ? Number(savedSize) : Number.NaN;
    return Number.isFinite(parsedSize) ? clampPanelPercent(parsedSize) : DEFAULT_RIGHT_PANEL;
  });
  const [isResizing, setIsResizing] = useState(false);
  const layoutRef = useRef<HTMLDivElement>(null);
  const leftPanelPercent = 100 - rightPanelPercent;

  const startResize = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!layoutRef.current) return;
    event.preventDefault();
    setIsResizing(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleResize = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizing || !layoutRef.current) return;

    const rect = layoutRef.current.getBoundingClientRect();
    const nextLeftPercent = ((event.clientX - rect.left) / rect.width) * 100;
    const nextRightPercent = clampPanelPercent(100 - nextLeftPercent);
    setRightPanelPercent(nextRightPercent);
    window.localStorage.setItem(TIMELINE_PANEL_SIZE_KEY, String(nextRightPercent));
  };

  const stopResize = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizing) return;
    setIsResizing(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

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
      <div
        ref={layoutRef}
        className="flex flex-col gap-4 lg:gap-6 xl:h-[700px] xl:flex-row xl:gap-0"
        style={isResizing ? { cursor: 'col-resize', userSelect: 'none' } : undefined}
      >
        <div className="min-w-0 flex-1 overflow-hidden xl:flex-none" style={selectedTaskId ? { flexBasis: `${leftPanelPercent}%` } : undefined}>
          <Timeline />
        </div>
        {selectedTaskId && (
          <>
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Redimensionar panel de detalle"
              onPointerDown={startResize}
              onPointerMove={handleResize}
              onPointerUp={stopResize}
              onPointerCancel={stopResize}
              className="group hidden w-6 flex-shrink-0 cursor-col-resize items-stretch justify-center px-2 xl:flex"
            >
              <div className="my-2 w-px rounded-full bg-[#1e253c] transition-all duration-200 group-hover:w-[3px] group-hover:bg-[#506ff0] group-hover:shadow-[0_0_18px_rgba(80,111,240,0.55)]" />
            </div>
            <div className="min-w-0 xl:flex-none" style={{ flexBasis: `${rightPanelPercent}%` }}>
              <TaskPanel />
            </div>
          </>
        )}
      </div>
      
      <NewTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

