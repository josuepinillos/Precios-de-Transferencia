"use client";

import React, { useState } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { TasksTable } from './TasksTable';
import { TaskPanel } from './TaskPanel';
import { NewTaskModal } from './NewTaskModal';
import { Search, ChevronDown, Plus, SlidersHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';

export const TasksMain = () => {
  const { selectedTaskId } = useDashboardStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Header & Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Tareas</h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#506ff0] to-[#8b5cf6] text-white text-sm font-medium hover:opacity-90 transition-opacity shadow-[0_0_15px_rgba(80,111,240,0.3)]"
          >
            <Plus size={16} /> Nueva Tarea
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-[300px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Buscar tarea..." 
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#121827] border border-[#1e253c] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#506ff0] transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#121827] border border-[#1e253c] text-slate-300 text-sm hover:border-[#2a334e] transition-colors">
              <span>Todos los estados</span>
              <ChevronDown size={14} className="text-slate-500" />
            </button>
            <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#121827] border border-[#1e253c] text-slate-300 text-sm hover:border-[#2a334e] transition-colors">
              <span>Todos los responsables</span>
              <ChevronDown size={14} className="text-slate-500" />
            </button>
            <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#121827] border border-[#1e253c] text-slate-300 text-sm hover:border-[#2a334e] transition-colors">
              <span>Todas las prioridades</span>
              <ChevronDown size={14} className="text-slate-500" />
            </button>
            <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#121827] border border-[#1e253c] text-slate-300 text-sm hover:border-[#2a334e] transition-colors">
              <span>Todas las empresas</span>
              <ChevronDown size={14} className="text-slate-500" />
            </button>
            
            <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#121827] border border-[#1e253c] text-slate-300 hover:text-white hover:border-[#2a334e] transition-colors ml-1">
              <SlidersHorizontal size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex gap-6 h-[700px]">
        <motion.div 
          className="flex-1 overflow-hidden"
          layout
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <TasksTable />
        </motion.div>
        
        {selectedTaskId && (
          <TaskPanel />
        )}
      </div>

      <NewTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
