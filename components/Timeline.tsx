"use client";

import React from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { TIMELINE_DAYS } from '../data/mockData';
import { Folder } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export const Timeline = () => {
  const { getFilteredTasks, getTaskProgress, selectTask, selectedTaskId } = useDashboardStore();

  const getProgressColor = (progress: number) => {
    if (progress <= 30) return 'bg-[#ef4444]'; // Red
    if (progress <= 70) return 'bg-[#f59e0b]'; // Yellow
    return 'bg-[#10b981]'; // Green
  };

  return (
    <div className="glass rounded-2xl p-6 relative h-[600px] flex flex-col">
      {/* Timeline List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide relative pr-2">
        {/* Luminous Vertical Line */}
        <div className="absolute left-[44px] top-4 bottom-4 w-px bg-gradient-to-b from-[#506ff0]/50 via-[#8b5cf6]/50 to-transparent"></div>

        <div className="flex flex-col gap-10">
          {TIMELINE_DAYS.map((day, idx) => {
            const dayTasks = getFilteredTasks().filter(t => t.dateBlock === day.date);
            
            return (
              <div key={idx} className="flex gap-6 relative">
                {/* Date Block */}
                <div className="w-[100px] flex-shrink-0 flex flex-col items-center z-10 relative">
                  <div className="bg-[#1e253c] rounded-xl w-[60px] h-[70px] flex flex-col items-center justify-center border border-[#2a334e] shadow-lg mb-2">
                    <span className="text-2xl font-bold text-white leading-none">{day.label.split(' ')[0]}</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">
                      {day.label.split(' ')[1]}<br/>{day.label.split(' ')[2]}
                    </span>
                  </div>
                  {/* Purple Dot on Line */}
                  <div className="w-3 h-3 rounded-full bg-[#8b5cf6] border-2 border-[#0e121e] shadow-[0_0_10px_rgba(139,92,246,0.8)] absolute top-8 -right-[18px]"></div>
                </div>

                {/* Tasks for the day */}
                <div className="flex-1 flex flex-col gap-3 pt-2">
                  {dayTasks.length > 0 ? (
                    dayTasks.map(task => {
                      const progress = getTaskProgress(task.id);
                      const isSelected = selectedTaskId === task.id;
                      
                      return (
                        <motion.div 
                          key={task.id}
                          whileHover={{ scale: 1.01 }}
                          onClick={() => selectTask(task.id)}
                          className={clsx(
                            "glass rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all border",
                            isSelected 
                              ? "border-[#506ff0] bg-[#1e253c]/80 shadow-[0_0_15px_rgba(80,111,240,0.15)]" 
                              : "border-[#2a334e] hover:border-[#3f4b73]"
                          )}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className={clsx(
                              "w-8 h-8 rounded-lg flex items-center justify-center",
                              isSelected ? "bg-[#506ff0]/20 text-[#506ff0]" : "bg-[#1e253c] text-[#3b82f6]"
                            )}>
                              <Folder size={16} />
                            </div>
                            <span className="text-sm font-medium text-white">{task.title}</span>
                          </div>
                          
                          <div className="flex items-center gap-8 w-1/3 justify-end">
                            {/* Progress Bar */}
                            <div className="flex items-center gap-3 w-40">
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
                    <div className="h-[70px] border border-dashed border-[#2a334e] rounded-xl flex items-center justify-center text-slate-500 text-xs">
                      Sin tareas asignadas
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
