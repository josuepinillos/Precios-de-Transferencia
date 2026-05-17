"use client";

import React from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { motion } from 'framer-motion';

const DAYS_OF_WEEK = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

// Generate days for the grid (May 10 to June 6, 2026 to match mockup)
const generateDays = () => {
  const days = [];
  let d = new Date(2026, 4, 10); // May 10, 2026
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
  const { getFilteredTasks, getTaskProgress, currentDate, setCurrentDate } = useDashboardStore();

  const getTaskStatusColor = (taskId: string, dueDate: string) => {
    const progress = getTaskProgress(taskId);
    if (progress === 100) return 'bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.5)]'; // Green
    if (progress > 0) return 'bg-[#f59e0b] shadow-[0_0_8px_rgba(245,158,11,0.5)]'; // Yellow
    
    // Simplistic overdue check
    if (new Date(dueDate) < new Date('2026-05-16')) return 'bg-[#ef4444] shadow-[0_0_8px_rgba(239,68,68,0.5)]'; // Red
    
    return 'bg-[#8b5cf6] shadow-[0_0_8px_rgba(139,92,246,0.5)]'; // Purple
  };

  const getTasksForDate = (dateString: string) => {
    return getFilteredTasks().filter(t => t.dateBlock === dateString);
  };

  return (
    <div className="bg-[#0e121e]/80 backdrop-blur-xl border border-[#1e253c] rounded-2xl p-6 h-full flex flex-col">
      {/* Header */}
      <div className="grid grid-cols-7 mb-4">
        {DAYS_OF_WEEK.map(day => (
          <div key={day} className="text-center text-xs font-semibold text-slate-400 tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-4 gap-3">
        {CALENDAR_DAYS.map((dayInfo, i) => {
          const dayTasks = getTasksForDate(dayInfo.dateString);
          const isSelected = currentDate === dayInfo.dateString;
          const isToday = dayInfo.dateString === '2026-05-16'; // Assuming 16 May is "Today" in mockup

          return (
            <motion.div 
              key={i}
              whileHover={{ scale: 1.02 }}
              onClick={() => setCurrentDate(dayInfo.dateString)}
              className={`
                relative rounded-xl p-3 flex flex-col cursor-pointer transition-colors
                ${isSelected ? 'bg-gradient-to-br from-[#1e253c] to-[#2a334e] border border-[#506ff0]/50 shadow-[0_0_15px_rgba(80,111,240,0.15)]' : 'bg-[#121827] border border-[#1e253c] hover:border-[#2a334e]'}
                ${!dayInfo.isCurrentMonth ? 'opacity-50' : ''}
              `}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-lg font-bold ${isToday ? 'text-white' : 'text-slate-300'}`}>
                  {dayInfo.day}
                </span>
                {isToday && (
                  <span className="text-[10px] font-bold text-[#506ff0] uppercase tracking-wider">
                    {dayInfo.month}
                  </span>
                )}
                {isSelected && !isToday && (
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {dayInfo.month}
                  </span>
                )}
              </div>

              {dayTasks.length > 0 && (
                <div className="mt-auto">
                  <div className="text-xs text-slate-400 mb-2">
                    {dayTasks.length} {dayTasks.length === 1 ? 'tarea' : 'tareas'}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {dayTasks.map(task => (
                      <div 
                        key={task.id}
                        className={`w-2.5 h-2.5 rounded-full ${getTaskStatusColor(task.id, task.dueDate)}`}
                        title={task.title}
                      />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-8 text-sm text-slate-400">
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
