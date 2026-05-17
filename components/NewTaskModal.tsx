"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useDashboardStore } from '../store/useDashboardStore';
import { TIMELINE_DAYS, USERS } from '../data/mockData';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MOCK_USERS = Object.values(USERS);

export const NewTaskModal = ({ isOpen, onClose }: NewTaskModalProps) => {
  const addTask = useDashboardStore(state => state.addTask);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateBlock, setDateBlock] = useState(TIMELINE_DAYS[0].date);
  const [assigneeIdx, setAssigneeIdx] = useState(0);
  const [prioridad, setPrioridad] = useState<'Alta' | 'Media' | 'Baja' | ''>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const selectedDay = TIMELINE_DAYS.find(d => d.date === dateBlock);
    
    addTask({
      title,
      description,
      dateBlock,
      dueDate: selectedDay ? selectedDay.label : "Fecha sin asignar",
      empresa: "Empresa A",
      assignee: MOCK_USERS[assigneeIdx],
      prioridad: prioridad ? (prioridad as any) : undefined
    });

    // Reset form
    setTitle('');
    setDescription('');
    setDateBlock(TIMELINE_DAYS[0].date);
    setAssigneeIdx(0);
    setPrioridad('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0b0f19]/80 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass border border-[#2a334e] rounded-2xl w-full max-w-lg p-6 shadow-2xl relative"
            >
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1"
              >
                <X size={20} />
              </button>

              <h2 className="text-xl font-bold text-white mb-6">Nueva Tarea</h2>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Título de la Tarea *</label>
                  <input 
                    type="text" 
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#1e253c] border border-[#2a334e] text-white rounded-lg px-4 py-2 outline-none focus:border-[#506ff0] transition-colors"
                    placeholder="Ej. Análisis de comparables..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Descripción</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-[#1e253c] border border-[#2a334e] text-white rounded-lg px-4 py-2 outline-none focus:border-[#506ff0] transition-colors resize-none h-24"
                    placeholder="Detalles de la tarea..."
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-400 mb-1">Día asignado</label>
                    <select 
                      value={dateBlock}
                      onChange={(e) => setDateBlock(e.target.value)}
                      className="w-full bg-[#1e253c] border border-[#2a334e] text-white rounded-lg px-4 py-2 outline-none focus:border-[#506ff0] transition-colors appearance-none"
                    >
                      {TIMELINE_DAYS.map(day => (
                        <option key={day.date} value={day.date}>{day.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-400 mb-1">Prioridad</label>
                    <select 
                      value={prioridad}
                      onChange={(e) => setPrioridad(e.target.value as any)}
                      className="w-full bg-[#1e253c] border border-[#2a334e] text-white rounded-lg px-4 py-2 outline-none focus:border-[#506ff0] transition-colors appearance-none"
                    >
                      <option value="">Normal (Ninguna)</option>
                      <option value="Alta">Alta</option>
                      <option value="Media">Media</option>
                      <option value="Baja">Baja</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Responsable</label>
                  <select 
                    value={assigneeIdx}
                    onChange={(e) => setAssigneeIdx(Number(e.target.value))}
                    className="w-full bg-[#1e253c] border border-[#2a334e] text-white rounded-lg px-4 py-2 outline-none focus:border-[#506ff0] transition-colors appearance-none"
                  >
                    {MOCK_USERS.map((user, idx) => (
                      <option key={idx} value={idx}>{user.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <button 
                    type="button" 
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-[#1e253c] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#506ff0] hover:bg-[#3f5bc4] transition-colors shadow-lg"
                  >
                    Crear Tarea
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
