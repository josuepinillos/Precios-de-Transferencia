"use client";

import React, { useState } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const DAYS_OF_WEEK = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

// Generate days for the grid (May 10 to June 6, 2026 to match mockup)
const generateDays = () => {
  const days = [];
  const d = new Date(2026, 4, 10); // May 10, 2026
  for (let i = 0; i < 28; i++) {
    days.push({
      date: new Date(d),
      dateString: d.toISOString().split('T')[0],
      day: d.getDate(),
      month: d.toLocaleString('es-ES', { month: 'short' }).toUpperCase(),
      isCurrentMonth: d.getMonth() === 4 // May
    });
    d.setDate(d.getDate() + 1);
  }
  return days;
};

const CALENDAR_DAYS = generateDays();

export const CalendarGrid = () => {
  const { tasks, getFilteredTasks, getTaskProgress, currentDate, setCurrentDate, updateTask } = useDashboardStore();
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dropTargetDate, setDropTargetDate] = useState<string | null>(null);
  const filteredTasks = getFilteredTasks();

  const getTaskStatusColor = (taskId: string, dueDate: string) => {
    const progress = getTaskProgress(taskId);
    if (progress === 100) return 'bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.5)]'; // Green
    if (progress > 0) return 'bg-[#f59e0b] shadow-[0_0_8px_rgba(245,158,11,0.5)]'; // Yellow
    
    // Simplistic overdue check
    if (new Date(dueDate) < new Date('2026-05-16')) return 'bg-[#ef4444] shadow-[0_0_8px_rgba(239,68,68,0.5)]'; // Red
    
    return 'bg-[#8b5cf6] shadow-[0_0_8px_rgba(139,92,246,0.5)]'; // Purple
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
    <div className="bg-[#0e121e]/80 backdrop-blur-xl border border-[#1e253c] rounded-2xl p-3 sm:p-4 lg:p-6 h-auto min-h-[520px] xl:h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-7 mb-3 sm:mb-4">
        {DAYS_OF_WEEK.map(day => (
          <div key={day} className="text-center text-[10px] sm:text-xs font-semibold text-slate-400 tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-4 gap-1.5 sm:gap-2 lg:gap-3">
        {CALENDAR_DAYS.map((dayInfo, i) => {
          const dayTasks = getTasksForDate(dayInfo.dateString);
          const isSelected = currentDate === dayInfo.dateString;
          const isToday = dayInfo.dateString === '2026-05-16'; // Assuming 16 May is "Today" in mockup
          const isDropTarget = dropTargetDate === dayInfo.dateString;

          return (
            <motion.div 
              key={i}
              whileHover={{ scale: 1.02 }}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
                setDropTargetDate(dayInfo.dateString);
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setDropTargetDate(null);
                }
              }}
              onDrop={(event) => {
                void handleDrop(event, dayInfo.dateString);
              }}
              onClick={() => setCurrentDate(dayInfo.dateString)}
              className={clsx(
                `
                relative rounded-lg sm:rounded-xl p-1.5 sm:p-2 lg:p-3 min-h-[88px] sm:min-h-[104px] flex flex-col cursor-pointer transition-colors
                ${isSelected ? 'bg-gradient-to-br from-[#1e253c] to-[#2a334e] border border-[#506ff0]/50 shadow-[0_0_15px_rgba(80,111,240,0.15)]' : 'bg-[#121827] border border-[#1e253c] hover:border-[#2a334e]'}
                ${!dayInfo.isCurrentMonth ? 'opacity-50' : ''}
              `,
                isDropTarget && 'border-[#506ff0] bg-[#506ff0]/10 shadow-[0_0_20px_rgba(80,111,240,0.22)]',
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-sm sm:text-base lg:text-lg font-bold ${isToday ? 'text-white' : 'text-slate-300'}`}>
                  {dayInfo.day}
                </span>
                {isToday && (
                  <span className="text-[9px] sm:text-[10px] font-bold text-[#506ff0] uppercase tracking-wider">
                    {dayInfo.month}
                  </span>
                )}
                {isSelected && !isToday && (
                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {dayInfo.month}
                  </span>
                )}
              </div>

              {dayTasks.length > 0 && (
                <div className="mt-auto">
                  <div className="text-[10px] sm:text-xs text-slate-400 mb-2 leading-tight">
                    {dayTasks.length} {dayTasks.length === 1 ? 'tarea' : 'tareas'}
                  </div>
                  <div className="flex max-h-[70px] flex-col gap-1.5 overflow-y-auto scrollbar-hide">
                    {dayTasks.map(task => (
                      <button
                        key={task.id}
                        type="button"
                        draggable
                        onClick={(event) => {
                          event.stopPropagation();
                          setCurrentDate(dayInfo.dateString);
                        }}
                        onDragStart={(event) => handleDragStart(event, task.id)}
                        onDragEnd={() => {
                          setDraggedTaskId(null);
                          setDropTargetDate(null);
                        }}
                        className={clsx(
                          "flex min-w-0 items-center gap-1.5 rounded-md border border-[#1e253c] bg-[#0e121e]/70 px-1.5 py-1 text-left text-[10px] text-slate-300 transition-all hover:border-[#506ff0]/60 cursor-grab active:cursor-grabbing",
                          draggedTaskId === task.id && "opacity-60 border-[#8b5cf6] shadow-[0_0_14px_rgba(139,92,246,0.22)]",
                        )}
                        title={task.title}
                      >
                        <span className={`h-2 w-2 flex-shrink-0 rounded-full ${getTaskStatusColor(task.id, task.dueDate)}`} />
                        <span className="hidden min-w-0 truncate sm:block">{task.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {isDropTarget && dayTasks.length === 0 && (
                <div className="mt-auto rounded-lg border border-dashed border-[#506ff0]/60 bg-[#506ff0]/10 px-2 py-2 text-center text-[10px] text-[#93c5fd]">
                  Soltar aquí
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="mt-4 sm:mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-5 lg:gap-8 text-xs sm:text-sm text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
          <span>Completadas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
          <span>En progreso</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6] shadow-[0_0_8px_rgba(139,92,246,0.5)]"></div>
          <span>Pendientes</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444] shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
          <span>Vencidas</span>
        </div>
      </div>
    </div>
  );
};
