"use client";

import React from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { motion } from 'framer-motion';
import { FileText, Calendar, ArrowRight, X } from 'lucide-react';
import clsx from 'clsx';

export const CalendarPanel = () => {
  const { getFilteredTasks, getTaskProgress, currentDate } = useDashboardStore();

  const dayTasks = getFilteredTasks().filter((task) => task.dateBlock === currentDate);
  const displayDate = new Date(currentDate).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-full xl:w-[340px] 2xl:w-[380px] bg-[#0e121e]/80 backdrop-blur-xl border border-[#1e253c] rounded-2xl flex flex-col overflow-hidden h-auto xl:h-full"
    >
      <div className="p-4 sm:p-5 border-b border-[#1e253c] flex justify-between items-center">
        <h2 className="text-lg sm:text-xl font-bold text-white capitalize">{displayDate}</h2>
        <button className="text-slate-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-5 scrollbar-hide flex flex-col">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Tareas del día</h3>
          <div className="flex flex-col gap-3">
            {dayTasks.map((task) => {
              const progress = getTaskProgress(task.id);
              const color = progress === 100 ? '#10b981' : progress > 0 ? '#f59e0b' : '#8b5cf6';

              return (
                <div key={task.id} className="bg-[#121827] border border-[#1e253c] rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex gap-2">
                      <FileText size={16} className="text-[#506ff0] mt-0.5 shrink-0" />
                      <span className="text-sm font-medium text-white line-clamp-2">{task.title}</span>
                    </div>
                    <div
                      className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(currentColor,0.5)] shrink-0 mt-1.5"
                      style={{ backgroundColor: color, color }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <div className="flex items-center gap-2">
                      <div className={clsx("w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-sm", task.assignee.colorClass)}>
                        {task.assignee.initials}
                      </div>
                      <span className="text-xs text-slate-400">{task.assignee.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Calendar size={12} />
                      <span>{task.dueDate}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {dayTasks.length === 0 && (
              <div className="text-sm text-slate-500 text-center py-4">No hay tareas programadas para este día.</div>
            )}
          </div>

          <button className="w-full mt-4 flex items-center justify-between p-3 rounded-xl bg-[#121827] border border-[#1e253c] text-slate-300 hover:text-white hover:border-[#2a334e] transition-colors">
            <span className="text-sm">Ver todas las tareas del día</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
