"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useDashboardStore } from '../store/useDashboardStore';
import { USERS } from '../data/mockData';
import { DatePicker2026 } from './DatePicker2026';

type Priority = 'Alta' | 'Media' | 'Baja';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MOCK_USERS = Object.values(USERS);
const DEFAULT_TASK_DATE = '2026-05-16';

export const NewTaskModal = ({ isOpen, onClose }: NewTaskModalProps) => {
  const addTask = useDashboardStore((state) => state.addTask);
  const storeError = useDashboardStore((state) => state.error);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateBlock, setDateBlock] = useState(DEFAULT_TASK_DATE);
  const [assigneeIdx, setAssigneeIdx] = useState(0);
  const [prioridad, setPrioridad] = useState<Priority | ''>('');
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle || isSaving) return;

    try {
      setIsSaving(true);
      setSubmitError(null);
      await addTask({
        title: cleanTitle,
        description: description.trim(),
        dateBlock,
        dueDate: dateBlock,
        empresa: "Empresa A",
        assignee: MOCK_USERS[assigneeIdx],
        prioridad: prioridad || 'Media',
      });

      setTitle('');
      setDescription('');
      setDateBlock(DEFAULT_TASK_DATE);
      setAssigneeIdx(0);
      setPrioridad('');
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo crear la tarea en Supabase.';
      setSubmitError(message);
      console.error('[Supabase] No se pudo crear la tarea:', error);
    } finally {
      setIsSaving(false);
    }
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
            className="fixed inset-0 bg-[#0b0f19]/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass border border-[#2a334e] rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[92dvh] overflow-y-auto p-4 sm:p-6 shadow-2xl relative"
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1"
              >
                <X size={20} />
              </button>

              <h2 className="text-xl font-bold text-white mb-6">Nueva Tarea</h2>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {(submitError || storeError) && (
                  <div className="rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#fecaca]">
                    {submitError || storeError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Título de la Tarea *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#1e253c] border border-[#2a334e] text-white rounded-lg px-4 py-3 sm:py-2 outline-none focus:border-[#506ff0] transition-colors"
                    placeholder="Ej. Análisis de comparables..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Descripción</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-[#1e253c] border border-[#2a334e] text-white rounded-lg px-4 py-3 sm:py-2 outline-none focus:border-[#506ff0] transition-colors resize-none h-24"
                    placeholder="Detalles de la tarea..."
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <DatePicker2026 value={dateBlock} onChange={setDateBlock} label="Día asignado" />
                  </div>

                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-400 mb-1">Prioridad</label>
                    <select
                      value={prioridad}
                      onChange={(e) => setPrioridad(e.target.value as Priority | '')}
                      className="w-full bg-[#1e253c] border border-[#2a334e] text-white rounded-lg px-4 py-3 sm:py-2 outline-none focus:border-[#506ff0] transition-colors appearance-none"
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
                    className="w-full bg-[#1e253c] border border-[#2a334e] text-white rounded-lg px-4 py-3 sm:py-2 outline-none focus:border-[#506ff0] transition-colors appearance-none"
                  >
                    {MOCK_USERS.map((user, idx) => (
                      <option key={idx} value={idx}>{user.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-3 sm:py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-[#1e253c] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-3 sm:py-2 rounded-lg text-sm font-medium text-white bg-[#506ff0] hover:bg-[#3f5bc4] transition-colors shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Guardando...' : 'Crear Tarea'}
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
