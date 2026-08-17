"use client";

import React, { useState } from 'react';
import { Timeline } from './Timeline';
import { TaskPanel } from './TaskPanel';
import { Search, Plus } from 'lucide-react';
import { useDashboardStore } from '../store/useDashboardStore';
import { NewTaskModal } from './NewTaskModal';
import { USERS } from '../data/mockData';
import { Button } from './ui/Button';

export const TimelineMain = () => {
  const { filters, setFilters } = useDashboardStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
        <div className="relative w-full sm:w-[240px]">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            type="text"
            placeholder="Buscar tarea..."
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            className="field pl-9"
          />
        </div>

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

        <Button variant="primary" onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
          <Plus size={15} /> Nueva tarea
        </Button>
      </div>

      <div className="flex flex-col gap-5 xl:h-[720px] xl:flex-row">
        <div className="min-w-0 flex-1 overflow-hidden">
          <Timeline />
        </div>
        <TaskPanel />
      </div>

      <NewTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
