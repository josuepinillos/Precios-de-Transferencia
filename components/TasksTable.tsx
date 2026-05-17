"use client";

import React from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { motion } from 'framer-motion';
import { Folder, MoreHorizontal } from 'lucide-react';
import clsx from 'clsx';

export const TasksTable = () => {
  const { tasks, selectedTaskId, selectTask, getTaskProgress } = useDashboardStore();

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case 'Alta': return { text: 'text-[#ef4444]', bg: 'bg-[#ef4444]/10', border: 'border-[#ef4444]/20' };
      case 'Media': return { text: 'text-[#f59e0b]', bg: 'bg-[#f59e0b]/10', border: 'border-[#f59e0b]/20' };
      case 'Baja': return { text: 'text-[#506ff0]', bg: 'bg-[#506ff0]/10', border: 'border-[#506ff0]/20' };
      default: return { text: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/20' };
    }
  };

  const getStatusDisplay = (progress: number) => {
    if (progress === 100) return { label: 'Completada', color: 'text-[#10b981]', border: 'border-[#10b981]/30' };
    if (progress > 0) return { label: 'En progreso', color: 'text-[#f59e0b]', border: 'border-[#f59e0b]/30' };
    return { label: 'Pendiente', color: 'text-[#8b5cf6]', border: 'border-[#8b5cf6]/30' };
  };

  const getProgressColor = (progress: number) => {
    if (progress === 100) return 'bg-[#10b981]';
    if (progress > 30) return 'bg-[#f59e0b]';
    if (progress > 0) return 'bg-[#ef4444]';
    return 'bg-[#1e253c]'; // Empty
  };

  return (
    <div className="glass rounded-2xl border border-[#1e253c] flex flex-col h-full overflow-hidden">
      {/* Table Header */}
      <div className="grid grid-cols-[auto_2.5fr_1.5fr_1fr_1fr_1fr_1.5fr_1fr_auto] gap-4 px-6 py-4 border-b border-[#1e253c] text-[10px] font-bold text-slate-400 tracking-wider uppercase items-center">
        <div className="w-4 h-4 rounded border border-slate-500 flex-shrink-0"></div>
        <div>Tarea</div>
        <div>Responsable</div>
        <div>Empresa</div>
        <div>Fecha Límite</div>
        <div>Prioridad</div>
        <div>Progreso</div>
        <div>Estado</div>
        <div className="w-8">Acciones</div>
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-2 flex flex-col gap-1">
        {tasks.map((task) => {
          const isSelected = selectedTaskId === task.id;
          const progress = getTaskProgress(task.id);
          const priorityStyles = getPriorityColor(task.prioridad);
          const statusStyles = getStatusDisplay(progress);

          return (
            <motion.div 
              key={task.id}
              onClick={() => selectTask(task.id)}
              className={clsx(
                "grid grid-cols-[auto_2.5fr_1.5fr_1fr_1fr_1fr_1.5fr_1fr_auto] gap-4 px-4 py-3 rounded-xl items-center cursor-pointer transition-colors border",
                isSelected ? "bg-[#1e253c]/80 border-[#506ff0] shadow-[0_0_15px_rgba(80,111,240,0.15)]" : "bg-transparent border-transparent hover:bg-[#1e253c]/50 hover:border-[#2a334e]"
              )}
            >
              <div className="w-4 h-4 rounded border border-slate-500 flex-shrink-0"></div>
              
              {/* Tarea */}
              <div className="flex items-center gap-3 pr-4">
                <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", isSelected ? "bg-[#506ff0]/20 text-[#506ff0]" : "bg-[#1e253c] text-[#3b82f6]")}>
                  <Folder size={16} />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium text-white truncate">{task.title}</span>
                  <span className="text-[10px] text-slate-400 truncate">{task.description}</span>
                </div>
              </div>

              {/* Responsable */}
              <div className="flex items-center gap-2">
                <div className={clsx("w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-sm", task.assignee.colorClass)}>
                  {task.assignee.initials}
                </div>
                <span className="text-xs text-slate-300 truncate">{task.assignee.name}</span>
              </div>

              {/* Empresa */}
              <div className="text-xs text-slate-400 truncate">{task.empresa}</div>

              {/* Fecha Límite */}
              <div className="text-xs text-slate-300">{task.dueDate}</div>

              {/* Prioridad */}
              <div>
                <span className={clsx("text-[10px] font-medium px-2 py-0.5 rounded border", priorityStyles.text, priorityStyles.bg, priorityStyles.border)}>
                  {task.prioridad}
                </span>
              </div>

              {/* Progreso */}
              <div className="flex items-center gap-3 pr-4">
                <div className="flex-1 h-1.5 bg-[#1e253c] rounded-full overflow-hidden">
                  <div 
                    className={clsx("h-full rounded-full transition-all duration-500", getProgressColor(progress))}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <span className="text-xs text-slate-400 font-medium w-8 text-right">{progress}%</span>
              </div>

              {/* Estado */}
              <div>
                <span className={clsx("text-[10px] font-medium px-2 py-1 rounded-full border", statusStyles.color, statusStyles.border, "bg-transparent")}>
                  {statusStyles.label}
                </span>
              </div>

              {/* Acciones */}
              <div className="flex justify-center w-8">
                <button className="text-slate-500 hover:text-white p-1 rounded transition-colors">
                  <MoreHorizontal size={16} />
                </button>
              </div>

            </motion.div>
          );
        })}
      </div>

      {/* Pagination Footer */}
      <div className="px-6 py-4 border-t border-[#1e253c] flex justify-between items-center bg-[#0b0f19]/50">
        <span className="text-xs text-slate-400">Mostrando 1 a {tasks.length} de {tasks.length} tareas</span>
        <div className="flex gap-1">
          <button className="w-8 h-8 flex items-center justify-center rounded border border-[#1e253c] text-slate-400 hover:bg-[#1e253c] hover:text-white transition-colors">&lt;</button>
          <button className="w-8 h-8 flex items-center justify-center rounded bg-[#506ff0] text-white">1</button>
          <button className="w-8 h-8 flex items-center justify-center rounded border border-[#1e253c] text-slate-400 hover:bg-[#1e253c] hover:text-white transition-colors">2</button>
          <button className="w-8 h-8 flex items-center justify-center rounded border border-[#1e253c] text-slate-400 hover:bg-[#1e253c] hover:text-white transition-colors">3</button>
          <span className="w-8 h-8 flex items-center justify-center text-slate-400">...</span>
          <button className="w-8 h-8 flex items-center justify-center rounded border border-[#1e253c] text-slate-400 hover:bg-[#1e253c] hover:text-white transition-colors">10</button>
          <button className="w-8 h-8 flex items-center justify-center rounded border border-[#1e253c] text-slate-400 hover:bg-[#1e253c] hover:text-white transition-colors">&gt;</button>
        </div>
      </div>
    </div>
  );
};
