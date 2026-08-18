"use client";

import React, { useState } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import clsx from 'clsx';
import { getCalendarDays, getTodayDateKey, isBeforeDateKey } from '../lib/date';

const DAYS_OF_WEEK = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

const LEGEND = [
  { label: 'Completadas', dot: 'bg-positive' },
  { label: 'En progreso', dot: 'bg-caution' },
  { label: 'Pendientes', dot: 'bg-line-strong' },
  { label: 'Vencidas', dot: 'bg-critical' },
];

interface CalendarGridProps {
  displayedMonth: Date;
  onSelectDate: (dateKey: string) => void;
}

export const CalendarGrid = ({ displayedMonth, onSelectDate }: CalendarGridProps) => {
  const { tasks, getFilteredTasks, getTaskProgress, currentDate, updateTask } = useDashboardStore();
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dropTargetDate, setDropTargetDate] = useState<string | null>(null);
  const filteredTasks = getFilteredTasks();
  const calendarDays = getCalendarDays(displayedMonth);
  const todayDateKey = getTodayDateKey();

  const getTaskStatusColor = (taskId: string, dateBlock: string) => {
    const progress = getTaskProgress(taskId);
    if (progress === 100) return 'bg-positive';
    if (progress > 0) return 'bg-caution';

    if (isBeforeDateKey(dateBlock, todayDateKey)) return 'bg-critical';

    return 'bg-line-strong';
  };

  const getTasksForDate = (dateString: string) => {
    return filteredTasks.filter(t => t.dateBlock === dateString);
  };

  const moveTaskToDate = async (taskId: string, targetDate: string) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task || task.dateBlock === targetDate) return;

    try {
      await updateTask(taskId, {
        dateBlock: targetDate,
        dueDate: targetDate,
      });
    } catch (error) {
      console.error('[Supabase] No se pudo mover la tarea desde calendario:', error);
    }
  };

  const handleDragStart = (event: React.DragEvent<HTMLButtonElement>, taskId: string) => {
    event.stopPropagation();
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/x-dashboard-task-id', taskId);
    event.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>, targetDate: string) => {
    event.preventDefault();
    event.stopPropagation();
    const taskId = event.dataTransfer.getData('application/x-dashboard-task-id') || event.dataTransfer.getData('text/plain');
    setDropTargetDate(null);
    setDraggedTaskId(null);

    if (taskId) {
      await moveTaskToDate(taskId, targetDate);
    }
  };

  return (
    <div className="card flex h-auto min-h-[520px] flex-col overflow-hidden p-3 sm:p-4 lg:p-5">
      {/* Weekday header */}
      <div className="mb-2 grid grid-cols-7">
        {DAYS_OF_WEEK.map(day => (
          <div key={day} className="pb-2 text-center text-[11px] font-medium tracking-wide text-ink-faint">
            {day}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid flex-1 grid-cols-7 grid-rows-6 gap-1 sm:gap-1.5">
        {calendarDays.map((dayInfo) => {
          const dayTasks = getTasksForDate(dayInfo.dateKey);
          const isSelected = currentDate === dayInfo.dateKey;
          const isToday = dayInfo.dateKey === todayDateKey;
          const isDropTarget = dropTargetDate === dayInfo.dateKey;

          return (
            <div
              key={dayInfo.dateKey}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
                setDropTargetDate(dayInfo.dateKey);
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setDropTargetDate(null);
                }
              }}
              onDrop={(event) => {
                void handleDrop(event, dayInfo.dateKey);
              }}
              onClick={() => onSelectDate(dayInfo.dateKey)}
              className={clsx(
                'relative flex min-h-[86px] cursor-pointer flex-col rounded-[10px] border p-1.5 transition-colors duration-150 sm:min-h-[100px] sm:p-2',
                isSelected
                  ? 'border-accent bg-accent-soft'
                  : 'border-transparent bg-surface-muted hover:border-line-strong',
                isDropTarget && 'border-accent bg-accent-soft',
                !dayInfo.isCurrentMonth && 'opacity-45',
              )}
            >
              <div className="mb-1 flex items-start justify-between">
                <span
                  className={clsx(
                    'flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-[13px] tabular',
                    isToday
                      ? 'bg-brand font-semibold text-white'
                      : isSelected
                        ? 'font-semibold text-accent-ink'
                        : 'font-medium text-ink-soft',
                  )}
                >
                  {dayInfo.day}
                </span>
                {dayTasks.length > 0 && (
                  <span className="text-[10px] font-medium tabular text-ink-faint">{dayTasks.length}</span>
                )}
              </div>

              {dayTasks.length > 0 && (
                <div className="mt-auto flex max-h-[64px] flex-col gap-1 overflow-y-auto scrollbar-hide">
                  {dayTasks.map(task => (
                    <button
                      key={task.id}
                      type="button"
                      draggable
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectDate(dayInfo.dateKey);
                      }}
                      onDragStart={(event) => handleDragStart(event, task.id)}
                      onDragEnd={() => {
                        setDraggedTaskId(null);
                        setDropTargetDate(null);
                      }}
                      className={clsx(
                        'flex min-w-0 cursor-grab items-center gap-1.5 rounded-md bg-surface px-1.5 py-1 text-left text-[10px] text-ink-soft shadow-card transition-colors hover:text-ink active:cursor-grabbing',
                        draggedTaskId === task.id && 'opacity-55',
                      )}
                      title={task.title}
                    >
                      <span className={clsx('h-1.5 w-1.5 flex-shrink-0 rounded-full', getTaskStatusColor(task.id, task.dateBlock))} />
                      <span className="hidden min-w-0 truncate sm:block">{task.title}</span>
                    </button>
                  ))}
                </div>
              )}

              {isDropTarget && dayTasks.length === 0 && (
                <div className="mt-auto rounded-md border border-dashed border-accent px-1 py-1.5 text-center text-[10px] text-accent-ink">
                  Soltar aquí
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-line pt-4 text-xs text-ink-soft">
        {LEGEND.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span className={clsx('h-2 w-2 rounded-full', item.dot)} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
