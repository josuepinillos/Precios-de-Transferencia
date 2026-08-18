"use client";

import React, { useState } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Avatar } from './ui/Avatar';
import { ProgressBar } from './ui/Progress';
import { toneForProgress } from './ui/Badge';

type TimelineDay = {
  date: string;
  label: string;
};

const MONTH_LABELS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

const isValidTimelineDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value);

const parseDateBlock = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const formatTimelineLabel = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return `${String(day).padStart(2, '0')} ${MONTH_LABELS[month - 1]} ${year}`;
};

const toDateBlock = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildTimelineDays = (dateBlocks: string[]): TimelineDay[] => {
  const validDateBlocks = [...new Set(dateBlocks.filter(isValidTimelineDate))].sort();
  if (validDateBlocks.length === 0) return [];

  const days: TimelineDay[] = [];
  const cursor = parseDateBlock(validDateBlocks[0]);
  const end = parseDateBlock(validDateBlocks[validDateBlocks.length - 1]);

  while (cursor <= end) {
    const date = toDateBlock(cursor);
    days.push({ date, label: formatTimelineLabel(date) });
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
};

export const Timeline = () => {
  const { tasks, getFilteredTasks, getTaskProgress, selectTask, selectedTaskId, updateTask } = useDashboardStore();
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dropTargetDate, setDropTargetDate] = useState<string | null>(null);
  const filteredTasks = getFilteredTasks();
  const timelineDays = buildTimelineDays(filteredTasks.map((task) => task.dateBlock));

  const moveTaskToDate = async (taskId: string, targetDate: string) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task || task.dateBlock === targetDate) return;

    try {
      await updateTask(taskId, {
        dateBlock: targetDate,
        dueDate: targetDate,
      });
    } catch (error) {
      console.error('[Supabase] No se pudo mover la tarea:', error);
    }
  };

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, taskId: string) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/x-dashboard-task-id', taskId);
    event.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>, targetDate: string) => {
    event.preventDefault();
    const taskId = event.dataTransfer.getData('application/x-dashboard-task-id') || event.dataTransfer.getData('text/plain');
    setDropTargetDate(null);
    setDraggedTaskId(null);

    if (taskId) {
      await moveTaskToDate(taskId, targetDate);
    }
  };

  return (
    <div className="card flex h-auto min-h-[520px] flex-col p-4 sm:p-5">
      <div className="relative flex-1 overflow-x-hidden">
        {/* Spine connecting the day markers. */}
        <div className="absolute bottom-6 left-[27px] top-6 w-px bg-line sm:left-[39px]" />

        <div className="flex flex-col gap-7">
          {timelineDays.map((day) => {
            const dayTasks = filteredTasks.filter(t => t.dateBlock === day.date);
            const isDropTarget = dropTargetDate === day.date;
            const [dayNumber, monthLabel, yearLabel] = day.label.split(' ');

            return (
              <div
                key={day.date}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = 'move';
                  setDropTargetDate(day.date);
                }}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                    setDropTargetDate(null);
                  }
                }}
                onDrop={(event) => {
                  void handleDrop(event, day.date);
                }}
                className={clsx(
                  'relative flex gap-3 rounded-card p-1 transition-colors sm:gap-5',
                  isDropTarget && 'bg-accent-soft',
                )}
              >
                {/* Date marker */}
                <div className="relative z-10 flex w-[54px] flex-shrink-0 flex-col items-center sm:w-[74px]">
                  <div
                    className={clsx(
                      'flex h-[54px] w-[54px] flex-col items-center justify-center rounded-card border bg-surface transition-colors',
                      isDropTarget ? 'border-accent' : 'border-line',
                    )}
                  >
                    <span className="text-lg font-semibold leading-none tabular text-ink">{dayNumber}</span>
                    <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-faint">
                      {monthLabel}
                    </span>
                  </div>
                  <span className="mt-1 text-[10px] text-ink-faint">{yearLabel}</span>
                </div>

                {/* Tasks for the day */}
                <div className="flex min-w-0 flex-1 flex-col gap-2.5 pt-1">
                  {dayTasks.length > 0 ? (
                    dayTasks.map(task => {
                      const progress = getTaskProgress(task.id);
                      const isSelected = selectedTaskId === task.id;

                      return (
                        <motion.div
                          key={task.id}
                          draggable
                          whileHover={{ y: -1 }}
                          transition={{ duration: 0.15 }}
                          onDragStartCapture={(event) => handleDragStart(event, task.id)}
                          onDragEnd={() => {
                            setDraggedTaskId(null);
                            setDropTargetDate(null);
                          }}
                          onClick={() => selectTask(task.id)}
                          className={clsx(
                            'flex cursor-grab flex-col gap-3 rounded-card border bg-surface p-3.5 transition-[border-color,box-shadow] duration-150 active:cursor-grabbing sm:flex-row sm:items-center sm:justify-between sm:gap-5',
                            isSelected
                              ? 'border-accent shadow-focus'
                              : 'border-line hover:border-line-strong hover:shadow-card',
                            draggedTaskId === task.id && 'opacity-55',
                          )}
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <span
                              className={clsx(
                                'h-8 w-1 flex-shrink-0 rounded-pill',
                                progress === 100 ? 'bg-positive' : progress > 0 ? 'bg-caution' : 'bg-line-strong',
                              )}
                            />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-ink">{task.title}</p>
                              <p className="mt-0.5 truncate text-xs text-ink-faint">{task.empresa}</p>
                            </div>
                          </div>

                          <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:min-w-[210px] sm:justify-end">
                            <div className="flex flex-1 items-center gap-2.5 sm:w-32 sm:flex-none">
                              <ProgressBar value={progress} tone={toneForProgress(progress)} />
                              <span className="w-9 text-right text-xs font-medium tabular text-ink-soft">{progress}%</span>
                            </div>
                            <Avatar
                              initials={task.assignee.initials}
                              colorClass={task.assignee.colorClass}
                              name={task.assignee.name}
                            />
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div
                      className={clsx(
                        'flex h-[62px] items-center justify-center rounded-card border border-dashed text-xs transition-colors',
                        isDropTarget ? 'border-accent bg-accent-soft text-accent-ink' : 'border-line text-ink-faint',
                      )}
                    >
                      {isDropTarget ? 'Soltar tarea aquí' : 'Sin tareas asignadas'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {timelineDays.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm font-medium text-ink">Sin tareas en el rango actual</p>
              <p className="mt-1 text-sm text-ink-soft">Ajusta los filtros para ver el plan de trabajo.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
