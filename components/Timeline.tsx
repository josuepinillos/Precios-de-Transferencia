"use client";

import React, { useState } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { TIMELINE_DAYS } from '../data/mockData';
import { Folder } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export const Timeline = () => {
  const { tasks, getFilteredTasks, getTaskProgress, selectTask, selectedTaskId, updateTask } = useDashboardStore();
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dropTargetDate, setDropTargetDate] = useState<string | null>(null);
  const filteredTasks = getFilteredTasks();

  const getProgressColor = (progress: number) => {
    if (progress <= 30) return 'bg-[#ef4444]'; // Red
    if (progress <= 70) return 'bg-[#f59e0b]'; // Yellow
    return 'bg-[#10b981]'; // Green
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
    <div className="glass rounded-2xl p-4 sm:p-5 lg:p-6 relative h-auto min-h-[520px] lg:h-full xl:h-[600px] flex flex-col">
      {/* Timeline List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide relative pr-0 sm:pr-2">
        {/* Luminous Vertical Line */}
        <div className="absolute left-[30px] sm:left-[44px] top-4 bottom-4 w-px bg-gradient-to-b from-[#506ff0]/50 via-[#8b5cf6]/50 to-transparent"></div>

        <div className="flex flex-col gap-6 sm:gap-8 lg:gap-10">
          {TIMELINE_DAYS.map((day, idx) => {
            const dayTasks = filteredTasks.filter(t => t.dateBlock === day.date);
            const isDropTarget = dropTargetDate === day.date;
            
            return (
              <div
                key={idx}
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
                  "flex gap-3 sm:gap-6 relative rounded-2xl transition-all",
                  isDropTarget && "bg-[#506ff0]/10 ring-1 ring-[#506ff0]/50 shadow-[0_0_20px_rgba(80,111,240,0.18)]",
                )}
              >
                {/* Date Block */}
                <div className="w-[58px] sm:w-[100px] flex-shrink-0 flex flex-col items-center z-10 relative">
                  <div className={clsx(
                    "bg-[#1e253c] rounded-xl w-[46px] h-[58px] sm:w-[60px] sm:h-[70px] flex flex-col items-center justify-center border shadow-lg mb-2 transition-all",
                    isDropTarget ? "border-[#506ff0] shadow-[0_0_18px_rgba(80,111,240,0.25)]" : "border-[#2a334e]",
                  )}>
                    <span className="text-xl sm:text-2xl font-bold text-white leading-none">{day.label.split(' ')[0]}</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">
                      {day.label.split(' ')[1]}<br/>{day.label.split(' ')[2]}
                    </span>
                  </div>
                  {/* Purple Dot on Line */}
                  <div className="w-3 h-3 rounded-full bg-[#8b5cf6] border-2 border-[#0e121e] shadow-[0_0_10px_rgba(139,92,246,0.8)] absolute top-7 sm:top-8 -right-[8px] sm:-right-[18px]"></div>
                </div>

                {/* Tasks for the day */}
                <div className="min-w-0 flex-1 flex flex-col gap-3 pt-1 sm:pt-2">
                  {dayTasks.length > 0 ? (
                    dayTasks.map(task => {
                      const progress = getTaskProgress(task.id);
                      const isSelected = selectedTaskId === task.id;
                      
                      return (
                        <motion.div 
                          key={task.id}
                          draggable
                          whileHover={{ scale: 1.01 }}
                          onDragStartCapture={(event) => handleDragStart(event, task.id)}
                          onDragEnd={() => {
                            setDraggedTaskId(null);
                            setDropTargetDate(null);
                          }}
                          onClick={() => selectTask(task.id)}
                          className={clsx(
                            "glass rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 cursor-grab active:cursor-grabbing transition-all border",
                            isSelected 
                              ? "border-[#506ff0] bg-[#1e253c]/80 shadow-[0_0_15px_rgba(80,111,240,0.15)]" 
                              : "border-[#2a334e] hover:border-[#3f4b73]",
                            draggedTaskId === task.id && "opacity-60 scale-[0.99] border-[#8b5cf6] shadow-[0_0_24px_rgba(139,92,246,0.22)]"
                          )}
                        >
                          <div className="min-w-0 flex items-center gap-3 sm:gap-4 flex-1">
                            <div className={clsx(
                              "w-8 h-8 rounded-lg flex items-center justify-center",
                              isSelected ? "bg-[#506ff0]/20 text-[#506ff0]" : "bg-[#1e253c] text-[#3b82f6]"
                            )}>
                              <Folder size={16} />
                            </div>
                            <span className="text-sm font-medium text-white leading-snug break-words">{task.title}</span>
                          </div>
                          
                          <div className="flex items-center gap-3 sm:gap-8 w-full sm:w-auto sm:min-w-[220px] justify-between sm:justify-end">
                            {/* Progress Bar */}
                            <div className="flex items-center gap-3 flex-1 sm:w-40">
                              <div className="flex-1 h-1.5 bg-[#1e253c] rounded-full overflow-hidden">
                                <div 
                                  className={clsx("h-full rounded-full transition-all duration-500", getProgressColor(progress))}
                                  style={{ width: `${progress}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-slate-400 font-medium w-8 text-right">{progress}%</span>
                            </div>
                            
                            <div 
                              className={clsx("w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg", task.assignee.colorClass)}
                              title={task.assignee.name}
                            >
                              {task.assignee.initials}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className={clsx(
                      "h-[70px] border border-dashed rounded-xl flex items-center justify-center text-xs transition-colors",
                      isDropTarget ? "border-[#506ff0] text-[#93c5fd] bg-[#506ff0]/10" : "border-[#2a334e] text-slate-500",
                    )}>
                      {isDropTarget ? "Soltar tarea aquí" : "Sin tareas asignadas"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
