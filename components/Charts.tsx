"use client";

import React from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const Charts = () => {
  const {
    getFilteredTasks,
    getOverallProgress,
    getCompletedTasksCount,
    getPendingTasksCount,
    getOverdueSubtasksCount,
    getAssigneeStats,
  } = useDashboardStore();

  const progress = getOverallProgress();
  const completed = getCompletedTasksCount();
  const pending = getPendingTasksCount();
  const overdue = getOverdueSubtasksCount();
  const assigneeStats = getAssigneeStats();

  const dataPie = [
    { name: 'Completadas', value: completed, color: '#10b981' },
    { name: 'Pendientes', value: pending, color: '#f59e0b' },
    { name: 'Vencidas', value: overdue, color: '#ef4444' },
  ];

  const dateCounts: Record<string, number> = {};
  getFilteredTasks().forEach((task) => {
    if (task.dateBlock) {
      dateCounts[task.dateBlock] = (dateCounts[task.dateBlock] || 0) + 1;
    }
  });

  const dataBar = Object.keys(dateCounts)
    .sort()
    .slice(0, 7)
    .map((dateStr) => {
      const date = new Date(dateStr);
      const label = `${date.getDate()} ${date.toLocaleString('es-ES', { month: 'short' }).toUpperCase()}`;
      return { name: label, tareas: dateCounts[dateStr] };
    });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4 mt-4 sm:mt-6">
      <div className="glass rounded-2xl p-4 sm:p-5 border border-[#1e253c]">
        <h3 className="text-sm text-slate-300 font-medium mb-4">Avance por día (Tareas programadas)</h3>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataBar}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} width={20} />
              <Tooltip
                cursor={{ fill: 'rgba(30, 37, 60, 0.5)' }}
                contentStyle={{ backgroundColor: '#1e253c', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Bar dataKey="tareas" fill="#506ff0" radius={[4, 4, 0, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass rounded-2xl p-4 sm:p-5 border border-[#1e253c] flex flex-col items-center justify-center relative min-h-[220px]">
        <h3 className="text-sm text-slate-300 font-medium mb-2 absolute top-5 left-5">Avance general</h3>
        <div className="relative w-32 h-32 mt-4">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#1e253c"
              strokeWidth="5"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#506ff0"
              strokeWidth="5"
              strokeDasharray={`${progress}, 100`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white">{progress}%</span>
            <span className="text-[10px] text-slate-400">Completado</span>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-4 sm:p-5 border border-[#1e253c] flex">
        <div className="flex-1 flex flex-col justify-center">
          <h3 className="text-sm text-slate-300 font-medium mb-4">Estado de tareas</h3>
          <ul className="flex flex-col gap-3">
            {dataPie.map((entry) => (
              <li key={entry.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color }}></span>
                <span className="text-xs text-slate-400 flex-1">{entry.name}</span>
                <span className="text-xs text-white font-medium">{entry.value}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="w-24 h-24 relative self-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={dataPie} cx="50%" cy="50%" innerRadius={25} outerRadius={45} paddingAngle={2} dataKey="value" stroke="none">
                {dataPie.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass rounded-2xl p-4 sm:p-5 border border-[#1e253c]">
        <h3 className="text-sm text-slate-300 font-medium mb-4">Carga por responsable</h3>
        <div className="flex flex-col gap-3">
          {assigneeStats.map((item) => (
            <div key={item.assignee.name} className="space-y-1">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-sm ${item.assignee.colorClass}`}>
                  {item.assignee.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-white">{item.assignee.name}</p>
                  <p className="text-[10px] text-slate-500">{item.completed}/{item.total} subtareas</p>
                </div>
                <span className="text-xs font-semibold text-slate-200">{item.progress}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#1e253c]">
                <div className="h-full rounded-full bg-[#506ff0] transition-all duration-500" style={{ width: `${item.progress}%` }} />
              </div>
            </div>
          ))}
          {assigneeStats.every((item) => item.total === 0) && (
            <div className="text-xs text-slate-500 py-2">No hay subtareas asignadas</div>
          )}
        </div>
      </div>
    </div>
  );
};
