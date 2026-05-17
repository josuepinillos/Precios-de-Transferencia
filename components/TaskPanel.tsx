"use client";

import React, { useState, useEffect } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { X, Calendar as CalendarIcon, MessageSquare, Plus, Check, Edit2, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

export const TaskPanel = () => {
  const { tasks, selectedTaskId, selectTask, toggleSubtask, getTaskProgress, updateTask, addSubtask, deleteTask } = useDashboardStore();
  
  const selectedTask = tasks.find(t => t.id === selectedTaskId);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Sync state when task changes
  useEffect(() => {
    if (selectedTask) {
      setEditTitle(selectedTask.title);
      setEditDesc(selectedTask.description);
      setIsEditing(false);
      setIsAddingSubtask(false);
      setNewSubtaskTitle('');
    }
  }, [selectedTaskId, selectedTask?.title, selectedTask?.description]);

  if (!selectedTask) return null;

  const handleSaveEdit = () => {
    updateTask(selectedTask.id, { title: editTitle, description: editDesc });
    setIsEditing(false);
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubtaskTitle.trim()) {
      addSubtask(selectedTask.id, newSubtaskTitle.trim());
      setNewSubtaskTitle('');
      setIsAddingSubtask(false);
    }
  };

  const handleDeleteTask = () => {
    if (confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
      deleteTask(selectedTask.id);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="w-[350px] flex-shrink-0 glass rounded-2xl p-6 flex flex-col h-[600px] relative"
      >
        <div className="flex justify-between items-start mb-6 gap-2">
          {isEditing ? (
            <input 
              type="text" 
              value={editTitle} 
              onChange={(e) => setEditTitle(e.target.value)}
              className="flex-1 bg-[#1e253c] border border-[#506ff0] text-white rounded-lg px-2 py-1 outline-none text-lg font-bold"
              autoFocus
            />
          ) : (
            <h2 className="text-lg font-bold text-white leading-tight flex-1">{selectedTask.title}</h2>
          )}
          
          <div className="flex items-center gap-1">
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} className="text-slate-400 hover:text-white p-1">
                <Edit2 size={16} />
              </button>
            )}
            <button onClick={() => selectTask(null)} className="text-slate-400 hover:text-white p-1">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide pr-2 pb-4">
          {/* Description */}
          <div className="mb-6 relative group">
            <h3 className="text-xs text-slate-400 font-medium mb-2">Descripción</h3>
            {isEditing ? (
              <textarea 
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="w-full bg-[#1e253c] border border-[#506ff0] text-white rounded-lg px-2 py-2 outline-none text-sm resize-none h-24"
              />
            ) : (
              <p className="text-sm text-slate-300 leading-relaxed">
                {selectedTask.description || <span className="italic text-slate-500">Sin descripción</span>}
              </p>
            )}
          </div>

          {isEditing && (
            <div className="flex justify-end gap-2 mb-6">
              <button onClick={() => setIsEditing(false)} className="text-xs px-3 py-1.5 text-slate-400 hover:text-white">Cancelar</button>
              <button onClick={handleSaveEdit} className="text-xs px-3 py-1.5 bg-[#506ff0] text-white rounded-lg flex items-center gap-1"><Check size={14}/> Guardar</button>
            </div>
          )}

          {/* Meta Info */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <h3 className="text-xs text-slate-400 font-medium mb-2">Responsable</h3>
              <div className="flex items-center gap-2">
                <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg", selectedTask.assignee.colorClass)}>
                  {selectedTask.assignee.initials}
                </div>
                <div>
                  <p className="text-sm font-medium text-white leading-tight">{selectedTask.assignee.name}</p>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xs text-slate-400 font-medium mb-2">Fecha límite</h3>
              <div className="flex items-center gap-2 text-slate-300 text-sm">
                <CalendarIcon size={14} className="text-slate-400" />
                {selectedTask.dueDate}
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <h3 className="text-xs text-slate-400 font-medium mb-2">Progreso General</h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-[#1e253c] rounded-full overflow-hidden">
                <div 
                  className={clsx(
                    "h-full rounded-full transition-all duration-500",
                    getTaskProgress(selectedTask.id) <= 30 ? 'bg-[#ef4444]' : 
                    getTaskProgress(selectedTask.id) <= 70 ? 'bg-[#f59e0b]' : 'bg-[#10b981]'
                  )}
                  style={{ width: `${getTaskProgress(selectedTask.id)}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-white">{getTaskProgress(selectedTask.id)}%</span>
            </div>
          </div>

          {/* Subtasks */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs text-slate-400 font-medium">
                Subtareas ({selectedTask.subtasks.filter(s => s.completed).length}/{selectedTask.subtasks.length})
              </h3>
            </div>
            
            <div className="flex flex-col gap-2">
              {selectedTask.subtasks.map(subtask => (
                <div 
                  key={subtask.id} 
                  onClick={() => toggleSubtask(selectedTask.id, subtask.id)}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-[#1e253c]/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={clsx(
                      "w-4 h-4 flex-shrink-0 rounded flex items-center justify-center border transition-colors",
                      subtask.completed 
                        ? "bg-[#10b981] border-[#10b981] text-white" 
                        : "border-slate-500 group-hover:border-slate-400"
                    )}>
                      {subtask.completed && <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3"><path d="M3 7.5L5.5 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <span className={clsx(
                      "text-sm transition-colors",
                      subtask.completed ? "text-slate-400 line-through" : "text-slate-200"
                    )}>
                      {subtask.title}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                    {subtask.date && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <CalendarIcon size={10} /> {subtask.date}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {isAddingSubtask ? (
              <form onSubmit={handleAddSubtask} className="mt-4 flex items-center gap-2">
                <input 
                  type="text" 
                  autoFocus
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="Nombre de la subtarea..."
                  className="flex-1 bg-[#1e253c] border border-[#2a334e] text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-[#506ff0]"
                />
                <button type="button" onClick={() => setIsAddingSubtask(false)} className="p-2 text-slate-400 hover:text-white"><X size={16}/></button>
                <button type="submit" className="p-2 bg-[#506ff0] text-white rounded-lg"><Check size={16}/></button>
              </form>
            ) : (
              <button 
                onClick={() => setIsAddingSubtask(true)}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-[#1e253c] hover:bg-[#506ff0] text-white text-sm rounded-lg transition-colors w-full justify-center"
              >
                <Plus size={16} /> Agregar Subtarea
              </button>
            )}
          </div>

          <div className="mt-12 flex justify-center">
            <button 
              onClick={handleDeleteTask}
              className="flex items-center gap-2 text-xs text-[#ef4444]/70 hover:text-[#ef4444] transition-colors"
            >
              <Trash2 size={14}/> Eliminar Tarea
            </button>
          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
};
