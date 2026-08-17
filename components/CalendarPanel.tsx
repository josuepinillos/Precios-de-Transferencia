"use client";

import React from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { Calendar } from 'lucide-react';
import { Avatar } from './ui/Avatar';
import { Badge, labelForProgress, toneForProgress } from './ui/Badge';
import { ProgressBar } from './ui/Progress';

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const formatCalendarPanelDate = (dateValue: string) => {
  const [year, month, day] = dateValue.split('-').map(Number);
  if (!year || !month || !day || month < 1 || month > 12) return dateValue;
  return `${day} de ${MONTH_NAMES[month - 1]} de ${year}`;
};

export const CalendarPanel = () => {
  const { getFilteredTasks, getTaskProgress, currentDate } = useDashboardStore();

  const dayTasks = getFilteredTasks().filter((task) => task.dateBlock === currentDate);
  const displayDate = formatCalendarPanelDate(currentDate);

  return (
    <aside className="card flex h-auto w-full flex-col overflow-hidden xl:h-full xl:w-[340px] 2xl:w-[380px]">
      <div className="border-b border-line px-5 py-4">
        <p className="eyebrow mb-1">Día seleccionado</p>
        <h2 className="text-base font-semibold tracking-tight text-ink">{displayDate}</h2>
        <p className="mt-1 text-[13px] text-ink-soft">
          {dayTasks.length === 0
            ? 'Sin tareas programadas'
            : `${dayTasks.length} ${dayTasks.length === 1 ? 'tarea programada' : 'tareas programadas'}`}
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-4 scrollbar-hide">
        {dayTasks.map((task) => {
          const progress = getTaskProgress(task.id);
          const tone = toneForProgress(progress);

          return (
            <div key={task.id} className="panel flex flex-col gap-3 p-3.5 transition-colors hover:border-line-strong">
              <div className="flex items-start justify-between gap-2.5">
                <p className="line-clamp-2 text-sm font-medium leading-snug text-ink">{task.title}</p>
                <Badge tone={tone} dot>{labelForProgress(progress)}</Badge>
              </div>

              <div className="flex items-center gap-2.5">
                <ProgressBar value={progress} tone={tone} />
                <span className="w-9 text-right text-xs font-medium tabular text-ink-soft">{progress}%</span>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-line pt-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  <Avatar
                    initials={task.assignee.initials}
                    colorClass={task.assignee.colorClass}
                    name={task.assignee.name}
                    size="xs"
                  />
                  <span className="truncate text-xs text-ink-soft">{task.assignee.name}</span>
                </div>
                <span className="flex flex-shrink-0 items-center gap-1.5 text-xs text-ink-faint">
                  <Calendar size={12} />
                  {task.dueDate}
                </span>
              </div>
            </div>
          );
        })}

        {dayTasks.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">
            <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface-sunken text-ink-faint">
              <Calendar size={18} />
            </span>
            <p className="text-sm font-medium text-ink">Día sin actividad</p>
            <p className="mt-1 text-[13px] text-ink-soft">Selecciona otro día o arrastra una tarea hasta aquí.</p>
          </div>
        )}
      </div>
    </aside>
  );
};
