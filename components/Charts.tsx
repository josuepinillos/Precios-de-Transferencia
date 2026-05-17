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
  Cell
} from 'recharts';

export const Charts = () => {
  const { getFilteredTasks, getTaskProgress, getOverallProgress, getCompletedTasksCount, getPendingTasksCount, getOverdueSubtasksCount } = useDashboardStore();
  
  const progress = getOverallProgress();
  const completed = getCompletedTasksCount();
  const pending = getPendingTasksCount();
  const overdue = getOverdueSubtasksCount();

  const dataPie = [
    { name: 'Completadas', value: completed, color: '#10b981' }, // Green
    { name: 'Pendientes', value: pending, color: '#f59e0b' },   // Yellow
    { name: 'Vencidas', value: overdue, color: '#ef4444' },     // Red
  ];

  // Calculate tasks per day for BarChart
  const dateCounts: Record<string, number> = {};
  getFilteredTasks().forEach(t => {
    if (t.dateBlock) {
      dateCounts[t.dateBlock] = (dateCounts[t.dateBlock] || 0) + 1;
    }
  });

  const dataBar = Object.keys(dateCounts).sort().slice(0, 7).map(dateStr => {
    const d = new Date(dateStr);
    const label = `${d.getDate()} ${d.toLocaleString('es-ES', { month: 'short' }).toUpperCase()}`;
    return { name: label, tareas: dateCounts[dateStr] };
  });

  // Calculate critical tasks
  const criticalTasks = tasks
    .filter(t => t.prioridad === 'Alta' && getTaskProgress(t.id) < 100)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);

  return (
    <div className="grid grid-cols-4 gap-4 mt-6">
      
      {/* Bar Chart */}
      <div className="glass rounded-2xl p-5 col-span-1 border border-[#1e253c]">
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

      {/* Donut Chart (Overall Progress) */}
      <div className="glass rounded-2xl p-5 col-span-1 border border-[#1e253c] flex flex-col items-center justify-center relative">
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

      {/* Pie Chart (Task Status) */}
      <div className="glass rounded-2xl p-5 col-span-1 border border-[#1e253c] flex">
        <div className="flex-1 flex flex-col justify-center">
          <h3 className="text-sm text-slate-300 font-medium mb-4">Estado de tareas</h3>
          <ul className="flex flex-col gap-3">
            {dataPie.map((entry, index) => (
              <li key={index} className="flex items-center gap-2">
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
              <Pie
                data={dataPie}
                cx="50%"
                cy="50%"
                innerRadius={25}
                outerRadius={45}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {dataPie.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Critical Tasks List */}
      <div className="glass rounded-2xl p-5 col-span-1 border border-[#1e253c]">
        <h3 className="text-sm text-slate-300 font-medium mb-4">Próximas tareas críticas</h3>
        <div className="flex flex-col gap-3">
          {criticalTasks.length > 0 ? (
            criticalTasks.map(task => {
              const color = task.prioridad === 'Alta' ? '#ef4444' : '#f59e0b';
              return (
                <div key={task.id} className="flex justify-between items-start">
                  <div className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-sm mt-1.5 flex-shrink-0" style={{ backgroundColor: color }}></span>
                    <div>
                      <p className="text-sm font-medium text-white leading-tight">{task.title}</p>
                      <p className="text-[10px] text-slate-400">{task.dueDate}</p>
                    </div>
                  </div>
                  <span 
                    className="text-[10px] font-medium px-2 py-0.5 rounded border"
                    style={{ color: color, backgroundColor: `${color}1A`, borderColor: `${color}33` }}
                  >
                    {task.prioridad}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="text-xs text-slate-500 py-2">No hay tareas críticas pendientes</div>
          )}
        </div>
      </div>

    </div>
  );
};

