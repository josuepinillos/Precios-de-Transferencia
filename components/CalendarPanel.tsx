"use client";

import React from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { FileText, CheckCircle2, Clock, Calendar, ArrowRight, X } from 'lucide-react';
import clsx from 'clsx';

export const CalendarPanel = () => {
  const { getFilteredTasks, getTaskProgress, currentDate } = useDashboardStore();

  const dayTasks = getFilteredTasks().filter(t => t.dateBlock === currentDate);
  const completedTasks = dayTasks.filter(t => getTaskProgress(t.id) === 100).length;
  const pendingTasks = dayTasks.length - completedTasks;

  // Format date for display (e.g., "16 Mayo 2026")
  const displayDate = new Date(currentDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

  // Calculate monthly stats
  const monthlyTasks = getFilteredTasks().filter(t => t.dateBlock.startsWith('2026-05'));
  const stats = {
    completed: monthlyTasks.filter(t => getTaskProgress(t.id) === 100).length,
    inProgress: monthlyTasks.filter(t => getTaskProgress(t.id) > 0 && getTaskProgress(t.id) < 100).length,
    pending: monthlyTasks.filter(t => getTaskProgress(t.id) === 0).length,
    overdue: monthlyTasks.filter(t => new Date(t.dueDate) < new Date('2026-05-16') && getTaskProgress(t.id) < 100).length,
  };
  const totalMonthly = monthlyTasks.length;

  const chartData = [
    { name: 'Completadas', value: stats.completed, color: '#10b981' },
    { name: 'En progreso', value: stats.inProgress, color: '#f59e0b' },
    { name: 'Pendientes', value: stats.pending, color: '#8b5cf6' },
    { name: 'Vencidas', value: stats.overdue, color: '#ef4444' },
  ].filter(d => d.value > 0);

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

      <div className="flex-1 overflow-y-auto p-4 sm:p-5 scrollbar-hide flex flex-col gap-5 sm:gap-6">
        
        {/* Resumen del día */}
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Resumen del día</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3 gap-2">
            <div className="bg-[#121827] border border-[#1e253c] rounded-xl p-3 flex flex-col items-center justify-center gap-1">
              <div className="flex items-center gap-1.5 text-[#506ff0]">
                <FileText size={14} />
                <span className="font-bold">{dayTasks.length}</span>
              </div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Tareas</span>
            </div>
            <div className="bg-[#121827] border border-[#1e253c] rounded-xl p-3 flex flex-col items-center justify-center gap-1">
              <div className="flex items-center gap-1.5 text-[#10b981]">
                <CheckCircle2 size={14} />
                <span className="font-bold">{completedTasks}</span>
              </div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Completadas</span>
            </div>
            <div className="bg-[#121827] border border-[#1e253c] rounded-xl p-3 flex flex-col items-center justify-center gap-1">
              <div className="flex items-center gap-1.5 text-[#f59e0b]">
                <Clock size={14} />
                <span className="font-bold">{pendingTasks}</span>
              </div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Pendientes</span>
            </div>
          </div>
        </div>

        {/* Tareas del día */}
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Tareas del día</h3>
          <div className="flex flex-col gap-3">
            {dayTasks.map(task => {
              const progress = getTaskProgress(task.id);
              const color = progress === 100 ? '#10b981' : progress > 0 ? '#f59e0b' : '#8b5cf6';
              return (
                <div key={task.id} className="bg-[#121827] border border-[#1e253c] rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex gap-2">
                      <FileText size={16} className="text-[#506ff0] mt-0.5 shrink-0" />
                      <span className="text-sm font-medium text-white line-clamp-2">{task.title}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold">{progress}%</span>
                      <div className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(currentColor,0.5)]" style={{ backgroundColor: color, color }}></div>
                    </div>
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

        {/* Estadísticas del mes */}
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Estadísticas del mes</h3>
          <div className="flex flex-col sm:flex-row xl:flex-col 2xl:flex-row items-center gap-4">
            <div className="w-24 h-24 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={45}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e253c', borderColor: '#2a334e', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-white leading-tight">{totalMonthly}</span>
                <span className="text-[10px] text-slate-400 uppercase">Total</span>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col gap-2">
              {[
                { label: 'Completadas', value: stats.completed, color: '#10b981' },
                { label: 'En progreso', value: stats.inProgress, color: '#f59e0b' },
                { label: 'Pendientes', value: stats.pending, color: '#8b5cf6' },
                { label: 'Vencidas', value: stats.overdue, color: '#ef4444' }
              ].map(stat => (
                <div key={stat.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: stat.color }}></div>
                    <span className="text-slate-400">{stat.label}</span>
                  </div>
                  <span className="text-slate-300">{stat.value} ({totalMonthly > 0 ? Math.round((stat.value / totalMonthly) * 100) : 0}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
};
