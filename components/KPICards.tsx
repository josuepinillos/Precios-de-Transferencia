"use client";

import React from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  ListTree, 
  ListChecks, 
  CalendarX2 
} from 'lucide-react';

export const KPICards = () => {
  const { 
    getTotalTasksCount, 
    getCompletedTasksCount, 
    getPendingTasksCount, 
    getOverallProgress,
    getTotalSubtasksCount,
    getCompletedSubtasksCount,
    getOverdueSubtasksCount
  } = useDashboardStore();

  const totalTasks = getTotalTasksCount();
  const completedTasks = getCompletedTasksCount();
  const pendingTasks = getPendingTasksCount();
  const progress = getOverallProgress();
  const totalSubtasks = getTotalSubtasksCount();
  const completedSubtasks = getCompletedSubtasksCount();
  const overdueSubtasks = getOverdueSubtasksCount();

  const cards = [
    {
      title: "Total de Tareas",
      value: totalTasks,
      percent: "100%",
      icon: <FileText size={20} className="text-[#3b82f6]" />,
      iconBg: "bg-[#3b82f6]/20",
    },
    {
      title: "Completadas",
      value: completedTasks,
      percent: `${Math.round((completedTasks/totalTasks)*100 || 0)}%`,
      icon: <CheckCircle2 size={20} className="text-[#10b981]" />,
      iconBg: "bg-[#10b981]/20",
    },
    {
      title: "Pendientes",
      value: pendingTasks,
      percent: `${Math.round((pendingTasks/totalTasks)*100 || 0)}%`,
      icon: <Clock size={20} className="text-[#f59e0b]" />,
      iconBg: "bg-[#f59e0b]/20",
    },
    {
      title: "Avance General",
      value: `${progress}%`,
      isCircle: true,
      circleProgress: progress,
    },
    {
      title: "Total Subtareas",
      value: totalSubtasks,
      icon: <ListTree size={20} className="text-[#8b5cf6]" />,
      iconBg: "bg-[#8b5cf6]/20",
    },
    {
      title: "Subtareas Completadas",
      value: completedSubtasks,
      percent: `${Math.round((completedSubtasks/totalSubtasks)*100 || 0)}%`,
      icon: <ListChecks size={20} className="text-[#10b981]" />,
      iconBg: "bg-[#10b981]/20",
    },
    {
      title: "Vencidas",
      value: overdueSubtasks,
      icon: <CalendarX2 size={20} className="text-[#ef4444]" />,
      iconBg: "bg-[#ef4444]/20",
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7 gap-3 sm:gap-4 mb-4 sm:mb-6">
      {cards.map((card, idx) => (
        <div key={idx} className="glass rounded-2xl p-4 min-h-[112px] flex flex-col justify-between hover:bg-[#1e253c]/80 transition-colors shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            {card.icon && (
              <div className={`w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                {card.icon}
              </div>
            )}
            <span className="text-xs text-slate-400 font-medium leading-tight">{card.title}</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold text-white">{card.value}</span>
            {card.percent && (
              <span className="text-xs text-slate-500 font-medium mb-1">{card.percent}</span>
            )}
            {card.isCircle && (
              <div className="relative w-10 h-10">
                <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#1e253c"
                    strokeWidth="4"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="4"
                    strokeDasharray={`${card.circleProgress}, 100`}
                  />
                </svg>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
