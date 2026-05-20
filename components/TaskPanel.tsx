"use client";

import React, { useState, useEffect } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { USERS } from '../data/mockData';
import { X, Calendar as CalendarIcon, Plus, Check, Edit2, Trash2, Pencil } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { DatePicker2026 } from './DatePicker2026';

const TEAM_MEMBERS = Object.values(USERS);

export const TaskPanel = () => {
  const { tasks, selectedTaskId, selectTask, toggleSubtask, getTaskProgress, updateTask, addSubtask, deleteTask, editSubtask, deleteSubtask, error } = useDashboardStore();
  
  const selectedTask = tasks.find(t => t.id === selectedTaskId);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDateBlock, setEditDateBlock] = useState('2026-05-16');
  
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskAssigneeName, setNewSubtaskAssigneeName] = useState(TEAM_MEMBERS[0]?.name || '');
  const [isSavingSubtask, setIsSavingSubtask] = useState(false);
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState('');
  const [editingSubtaskAssigneeName, setEditingSubtaskAssigneeName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const getAssigneeByName = (name: string, fallback = selectedTask?.assignee) =>
    TEAM_MEMBERS.find((member) => member.name === name) || fallback || TEAM_MEMBERS[0];

  const handleEditSubmit = async (subtaskId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editingSubtaskTitle.trim() && selectedTask) {
      try {
        await editSubtask(
          selectedTask.id,
          subtaskId,
          editingSubtaskTitle.trim(),
          getAssigneeByName(editingSubtaskAssigneeName, selectedTask.assignee),
        );
        setEditingSubtaskId(null);
        setEditingSubtaskTitle('');
        setEditingSubtaskAssigneeName('');
      } catch (error) {
        console.error('[Supabase] No se pudo editar la subtarea:', error);
      }
    }
  };

  const handleDeleteSubtask = (subtaskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDeleteId === subtaskId) {
      if (selectedTask) {
        void deleteSubtask(selectedTask.id, subtaskId).catch((error) => {
          console.error('[Supabase] No se pudo eliminar la subtarea:', error);
        });
      }
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(subtaskId);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  // Sync state when task changes
  useEffect(() => {
    if (selectedTask) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditTitle(selectedTask.title);
      setEditDesc(selectedTask.description);
      setEditDateBlock(selectedTask.dateBlock);
      setIsEditing(false);
      setIsAddingSubtask(false);
      setNewSubtaskTitle('');
      setNewSubtaskAssigneeName(selectedTask.assignee.name);
    }
  }, [selectedTask]);

  if (!selectedTask) return null;

  const handleSaveEdit = async () => {
    try {
      await updateTask(selectedTask.id, {
        title: editTitle,
        description: editDesc,
        dateBlock: editDateBlock,
        dueDate: editDateBlock,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('[Supabase] No se pudo actualizar la tarea:', error);
    }
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubtaskTitle.trim() && !isSavingSubtask) {
      try {
        setIsSavingSubtask(true);
        await addSubtask(
          selectedTask.id,
          newSubtaskTitle.trim(),
          getAssigneeByName(newSubtaskAssigneeName, selectedTask.assignee),
        );
        setNewSubtaskTitle('');
        setIsAddingSubtask(false);
      } catch (error) {
        console.error('[Supabase] No se pudo crear la subtarea:', error);
      } finally {
        setIsSavingSubtask(false);
      }
    }
  };

  const handleDeleteTask = () => {
    if (confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
      void deleteTask(selectedTask.id).catch((error) => {
        console.error('[Supabase] No se pudo eliminar la tarea:', error);
      });
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 24, x: 0 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        exit={{ opacity: 0, y: 24, x: 0 }}
        className="fixed inset-x-0 bottom-0 z-30 max-h-[88dvh] w-full glass rounded-t-2xl border border-[#1e253c] p-4 sm:p-5 flex flex-col shadow-2xl md:inset-x-auto md:inset-y-4 md:right-4 md:w-[360px] md:max-h-none md:rounded-2xl xl:relative xl:inset-auto xl:z-auto xl:w-[350px] xl:h-full xl:flex-shrink-0 xl:p-6"
      >
        <div className="flex justify-between items-start mb-6 gap-2">
          {isEditing ? (
            <input 
              type="text" 
              value={editTitle} 
              onChange={(e) => setEditTitle(e.target.value)}
              className="min-w-0 flex-1 bg-[#1e253c] border border-[#506ff0] text-white rounded-lg px-3 py-2 outline-none text-base sm:text-lg font-bold"
              autoFocus
            />
          ) : (
            <h2 className="text-lg font-bold text-white leading-tight flex-1">{selectedTask.title}</h2>
          )}
          
          <div className="flex items-center gap-1">
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-[#1e253c]">
                <Edit2 size={16} />
              </button>
            )}
            <button onClick={() => selectTask(null)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-[#1e253c]">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide pr-2 pb-4">
          {error && (
            <div className="mb-4 rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 px-3 py-2 text-xs text-[#fecaca]">
              {error}
            </div>
          )}

          {/* Description */}
          <div className="mb-6 relative group">
            <h3 className="text-xs text-slate-400 font-medium mb-2">Descripción</h3>
            {isEditing ? (
              <textarea 
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="w-full bg-[#1e253c] border border-[#506ff0] text-white rounded-lg px-3 py-3 sm:py-2 outline-none text-sm resize-none h-24"
              />
            ) : (
              <p className="text-sm text-slate-300 leading-relaxed">
                {selectedTask.description || <span className="italic text-slate-500">Sin descripción</span>}
              </p>
            )}
          </div>

          {isEditing && (
            <div className="flex justify-end gap-2 mb-6">
              <button onClick={() => setIsEditing(false)} className="text-xs px-3 py-2.5 sm:py-1.5 text-slate-400 hover:text-white">Cancelar</button>
              <button onClick={handleSaveEdit} className="text-xs px-3 py-2.5 sm:py-1.5 bg-[#506ff0] text-white rounded-lg flex items-center gap-1"><Check size={14}/> Guardar</button>
            </div>
          )}

          {/* Meta Info */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
              {isEditing ? (
                <DatePicker2026 value={editDateBlock} onChange={setEditDateBlock} label="" />
              ) : (
                <div className="flex items-center gap-2 text-slate-300 text-sm">
                  <CalendarIcon size={14} className="text-slate-400" />
                    <span className="break-words">{selectedTask.dueDate}</span>
                </div>
              )}
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
              {selectedTask.subtasks.map(subtask => {
                const subtaskAssignee = subtask.assignee || selectedTask.assignee;

                return (
                <div
                  key={subtask.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-[#1e253c]/50 transition-colors group"
                >
                  {editingSubtaskId === subtask.id ? (
                    <form 
                      onSubmit={(e) => handleEditSubmit(subtask.id, e)} 
                      className="flex w-full flex-col gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          autoFocus
                          value={editingSubtaskTitle}
                          onChange={(e) => setEditingSubtaskTitle(e.target.value)}
                          className="min-w-0 flex-1 bg-[#0b0f19] border border-[#506ff0] text-sm text-white rounded px-3 py-2 outline-none"
                        />
                        <button
                          type="submit"
                          className="w-9 h-9 flex items-center justify-center text-[#10b981] hover:bg-[#10b981]/10 rounded transition-colors"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSubtaskId(null);
                            setEditingSubtaskAssigneeName('');
                          }}
                          className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#1e253c] rounded transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <select
                        value={editingSubtaskAssigneeName || subtaskAssignee.name}
                        onChange={(e) => setEditingSubtaskAssigneeName(e.target.value)}
                        className="w-full bg-[#0b0f19] border border-[#2a334e] text-xs text-slate-200 rounded px-3 py-2 outline-none focus:border-[#506ff0]"
                      >
                        {TEAM_MEMBERS.map((member) => (
                          <option key={member.name} value={member.name} className="bg-[#0e121e]">
                            {member.name}
                          </option>
                        ))}
                      </select>
                    </form>
                  ) : (
                    <>
                      <div 
                        className="min-w-0 flex items-center gap-3 flex-1 cursor-pointer py-1"
                        onClick={() => {
                          void toggleSubtask(selectedTask.id, subtask.id).catch((error) => {
                            console.error('[Supabase] No se pudo actualizar la subtarea:', error);
                          });
                        }}
                      >
                        <div className={clsx(
                          "w-4 h-4 flex-shrink-0 rounded flex items-center justify-center border transition-colors",
                          subtask.completed 
                            ? "bg-[#10b981] border-[#10b981] text-white" 
                            : "border-slate-500 group-hover:border-slate-400"
                        )}>
                          {subtask.completed && <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3"><path d="M3 7.5L5.5 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                        <span className={clsx(
                          "text-sm transition-colors break-words",
                          subtask.completed ? "text-slate-400 line-through" : "text-slate-200"
                        )}>
                          {subtask.title}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div
                          className={clsx("w-7 h-7 flex-shrink-0 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm", subtaskAssignee.colorClass)}
                          title={subtaskAssignee.name}
                        >
                          {subtaskAssignee.initials}
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSubtaskId(subtask.id);
                            setEditingSubtaskTitle(subtask.title);
                            setEditingSubtaskAssigneeName(subtaskAssignee.name);
                            setConfirmDeleteId(null);
                          }}
                          className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#1e253c] rounded transition-colors"
                          title="Editar subtarea"
                        >
                          <Pencil size={14} />
                        </button>
                        <button 
                          onClick={(e) => handleDeleteSubtask(subtask.id, e)}
                          className={clsx(
                            "p-1.5 rounded transition-colors flex items-center gap-1",
                            confirmDeleteId === subtask.id 
                              ? "bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/50" 
                              : "text-slate-400 hover:text-[#ef4444] hover:bg-[#ef4444]/10 border border-transparent"
                          )}
                          title={confirmDeleteId === subtask.id ? "Haz clic de nuevo para eliminar" : "Eliminar subtarea"}
                        >
                          <Trash2 size={14} />
                          {confirmDeleteId === subtask.id && <span className="text-[10px] font-medium pr-1">Confirmar</span>}
                        </button>
                      </div>
                    </>
                  )}
                </div>
                );
              })}
            </div>

            {isAddingSubtask ? (
              <form onSubmit={handleAddSubtask} className="mt-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    autoFocus
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="Nombre de la subtarea..."
                    className="min-w-0 flex-1 bg-[#1e253c] border border-[#2a334e] text-white rounded-lg px-3 py-3 sm:py-2 text-sm outline-none focus:border-[#506ff0]"
                  />
                  <button type="button" onClick={() => setIsAddingSubtask(false)} className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-white"><X size={16}/></button>
                  <button type="submit" disabled={isSavingSubtask} className="w-11 h-11 flex items-center justify-center bg-[#506ff0] text-white rounded-lg disabled:opacity-60"><Check size={16}/></button>
                </div>
                <select
                  value={newSubtaskAssigneeName}
                  onChange={(e) => setNewSubtaskAssigneeName(e.target.value)}
                  className="w-full bg-[#1e253c] border border-[#2a334e] text-slate-200 rounded-lg px-3 py-3 sm:py-2 text-sm outline-none focus:border-[#506ff0]"
                >
                  {TEAM_MEMBERS.map((member) => (
                    <option key={member.name} value={member.name} className="bg-[#0e121e]">
                      {member.name}
                    </option>
                  ))}
                </select>
              </form>
            ) : (
              <button 
                onClick={() => setIsAddingSubtask(true)}
                className="mt-4 flex items-center gap-2 px-4 py-3 sm:py-2 bg-[#1e253c] hover:bg-[#506ff0] text-white text-sm rounded-lg transition-colors w-full justify-center"
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
