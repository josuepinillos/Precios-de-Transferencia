"use client";

import React from 'react';
import clsx from 'clsx';
import {
  Calendar,
  Check,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit2,
  Folder,
  MoreVertical,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { USERS, Task, Subtask } from '../data/mockData';
import { useDashboardStore } from '../store/useDashboardStore';
import { ClientEmailsSection } from './ClientEmailsSection';
import { ControlledOperationsSection } from './ControlledOperationsSection';
import { FormalObligationsBadge } from './FormalObligationsBadge';

const TEAM_MEMBERS = Object.values(USERS);

type TaskStatus = {
  label: string;
  color: string;
  textClass: string;
};

const getTaskStatus = (progress: number): TaskStatus => {
  if (progress === 100) {
    return { label: 'Completada', color: '#10b981', textClass: 'text-[#10b981]' };
  }
  if (progress > 0) {
    return { label: 'En progreso', color: '#f59e0b', textClass: 'text-[#f59e0b]' };
  }
  return { label: 'Pendiente', color: '#8b5cf6', textClass: 'text-[#8b5cf6]' };
};

const getProgressColor = (progress: number) => {
  if (progress === 100) return 'bg-[#10b981]';
  if (progress > 0) return 'bg-[#f59e0b]';
  return 'bg-[#8b5cf6]';
};

const getAssigneeByName = (name: string, fallback: Task['assignee']) =>
  TEAM_MEMBERS.find((member) => member.name === name) || fallback;

const getSubtaskVisualStatus = (subtask: Subtask, taskProgress: number, position: number, completedCount: number) => {
  if (subtask.completed) {
    return { label: 'Completada', color: '#10b981', bg: 'bg-[#10b981]/10', text: 'text-[#10b981]' };
  }
  if (taskProgress > 0 && position === completedCount) {
    return { label: 'En progreso', color: '#3b82f6', bg: 'bg-[#3b82f6]/10', text: 'text-[#60a5fa]' };
  }
  return { label: 'Pendiente', color: '#8b5cf6', bg: 'bg-[#1e253c]', text: 'text-slate-400' };
};

export const DashboardExecutive = () => {
  const {
    getFilteredTasks,
    getTaskProgress,
    toggleSubtask,
    editSubtask,
    deleteSubtask,
    addSubtask,
    error,
  } = useDashboardStore();
  const tasks = getFilteredTasks();
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);
  const [editingSubtaskId, setEditingSubtaskId] = React.useState<string | null>(null);
  const [editingTitle, setEditingTitle] = React.useState('');
  const [editingAssigneeName, setEditingAssigneeName] = React.useState('');
  const [isAddingSubtask, setIsAddingSubtask] = React.useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = React.useState('');
  const [newSubtaskAssigneeName, setNewSubtaskAssigneeName] = React.useState(TEAM_MEMBERS[0]?.name || '');
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const [isSavingSubtask, setIsSavingSubtask] = React.useState(false);
  const cardsRef = React.useRef<HTMLDivElement>(null);

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) || tasks[0] || null;
  const selectedProgress = selectedTask ? getTaskProgress(selectedTask.id) : 0;
  const selectedStatus = getTaskStatus(selectedProgress);
  const completedSubtasks = selectedTask?.subtasks.filter((subtask) => subtask.completed).length || 0;
  const totalSubtasks = selectedTask?.subtasks.length || 0;
  const pendingSubtasks = Math.max(totalSubtasks - completedSubtasks, 0);
  const inProgressSubtasks = selectedProgress > 0 && selectedProgress < 100 && pendingSubtasks > 0 ? 1 : 0;
  const backlogSubtasks = Math.max(pendingSubtasks - inProgressSubtasks, 0);

  const assigneeStats = selectedTask
    ? selectedTask.subtasks.reduce<Record<string, {
        assignee: Task['assignee'];
        total: number;
        completed: number;
        pending: number;
      }>>((acc, subtask) => {
        const assignee = subtask.assignee || selectedTask.assignee;
        if (!acc[assignee.name]) {
          acc[assignee.name] = { assignee, total: 0, completed: 0, pending: 0 };
        }
        acc[assignee.name].total += 1;
        if (subtask.completed) {
          acc[assignee.name].completed += 1;
        } else {
          acc[assignee.name].pending += 1;
        }
        return acc;
      }, {})
    : {};

  const assigneeRows = Object.values(assigneeStats).map((item) => ({
    ...item,
    progress: item.total === 0 ? 0 : Math.round((item.completed / item.total) * 100),
  }));

  const scrollCards = (direction: 'left' | 'right') => {
    cardsRef.current?.scrollBy({
      left: direction === 'left' ? -360 : 360,
      behavior: 'smooth',
    });
  };

  const startEditingSubtask = (subtask: Subtask) => {
    if (!selectedTask) return;
    const assignee = subtask.assignee || selectedTask.assignee;
    setEditingSubtaskId(subtask.id);
    setEditingTitle(subtask.title);
    setEditingAssigneeName(assignee.name);
    setConfirmDeleteId(null);
  };

  const cancelEditingSubtask = () => {
    setEditingSubtaskId(null);
    setEditingTitle('');
    setEditingAssigneeName('');
  };

  const handleEditSubtask = async (subtaskId: string, event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedTask || !editingTitle.trim()) return;

    try {
      await editSubtask(
        selectedTask.id,
        subtaskId,
        editingTitle.trim(),
        getAssigneeByName(editingAssigneeName, selectedTask.assignee),
      );
      cancelEditingSubtask();
    } catch (error) {
      console.error('[Supabase] No se pudo editar la subtarea desde Dashboard:', error);
    }
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    if (!selectedTask) return;

    if (confirmDeleteId === subtaskId) {
      void deleteSubtask(selectedTask.id, subtaskId).catch((error) => {
        console.error('[Supabase] No se pudo eliminar la subtarea desde Dashboard:', error);
      });
      setConfirmDeleteId(null);
      return;
    }

    setConfirmDeleteId(subtaskId);
    window.setTimeout(() => setConfirmDeleteId(null), 3000);
  };

  const handleAddSubtask = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedTask || !newSubtaskTitle.trim() || isSavingSubtask) return;

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
      console.error('[Supabase] No se pudo crear la subtarea desde Dashboard:', error);
    } finally {
      setIsSavingSubtask(false);
    }
  };

  if (tasks.length === 0) {
    return (
      <section className="glass rounded-2xl border border-[#1e253c] p-6 sm:p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1e253c] text-[#506ff0]">
          <Folder size={22} />
        </div>
        <h2 className="text-lg font-bold text-white">No hay tareas matrices</h2>
        <p className="mt-2 text-sm text-slate-400">
          Las tareas creadas desde Timeline aparecerán aquí automáticamente.
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4 sm:gap-6">
      {error && (
        <div className="rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 px-4 py-3 text-sm text-[#fecaca]">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-white">Tareas matrices</h2>
          <p className="mt-1 text-xs text-slate-400">Vista ejecutiva sincronizada con Timeline y Supabase</p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollCards('left')}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#1e253c] text-slate-400 hover:bg-[#1e253c]/50 hover:text-white transition-colors"
            aria-label="Ver tareas anteriores"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => scrollCards('right')}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#1e253c] text-slate-400 hover:bg-[#1e253c]/50 hover:text-white transition-colors"
            aria-label="Ver siguientes tareas"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div ref={cardsRef} className="flex snap-x gap-4 overflow-x-auto pb-3 scrollbar-hide">
        {tasks.map((task) => {
          const progress = getTaskProgress(task.id);
          const status = getTaskStatus(progress);
          const isSelected = selectedTask?.id === task.id;
          const completed = task.subtasks.filter((subtask) => subtask.completed).length;

          return (
            <button
              type="button"
              key={task.id}
              onClick={() => {
                setSelectedTaskId(task.id);
                cancelEditingSubtask();
                setIsAddingSubtask(false);
              }}
              className={clsx(
                "min-w-[280px] sm:min-w-[320px] max-w-[360px] flex-1 snap-start rounded-2xl border p-4 sm:p-5 text-left transition-all duration-300",
                isSelected
                  ? "border-[#6d5dfc] bg-gradient-to-br from-[#1e253c]/80 to-[#151a2b]/70 shadow-[0_0_22px_rgba(80,111,240,0.24)]"
                  : "glass border-[#1e253c] hover:border-[#506ff0]/50 hover:bg-[#1e253c]/40",
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#1e253c] text-[#60a5fa]">
                  <Folder size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-2 text-sm font-bold uppercase leading-snug text-white">{task.title}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-400">{task.description || task.empresa}</p>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#1e253c]">
                  <div className={clsx("h-full rounded-full transition-all duration-500", getProgressColor(progress))} style={{ width: `${progress}%` }} />
                </div>
                <span className="w-10 text-right text-xs font-bold text-white">{progress}%</span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 text-xs text-slate-400">
                <div className="border-r border-[#1e253c] pr-3">
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckSquare size={14} className="text-[#60a5fa]" />
                    <span className="font-semibold">{completed}/{task.subtasks.length}</span>
                  </div>
                  <span className="mt-1 block">Subtareas</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Calendar size={14} className="text-[#60a5fa]" />
                    <span className="font-semibold line-clamp-1">{task.dueDate}</span>
                  </div>
                  <span className="mt-1 block">Fecha límite</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <div className={clsx("flex h-7 w-7 items-center justify-center rounded-full text-[9px] font-bold text-white shadow-sm", task.assignee.colorClass)}>
                    {task.assignee.initials}
                  </div>
                  <span className="truncate text-xs text-slate-300">{task.assignee.name}</span>
                </div>
                <span className={clsx("rounded-full bg-[#1e253c] px-2 py-1 text-[10px] font-semibold", status.textClass)}>
                  {status.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {selectedTask && (
        <div className="glass rounded-2xl border border-[#1e253c] p-4 sm:p-5 lg:p-6 shadow-2xl">
          <div className="grid grid-cols-1 gap-4 border-b border-[#1e253c] pb-5 lg:grid-cols-[1.2fr_0.8fr_1fr] lg:items-center">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#1e253c] text-[#60a5fa]">
                <Folder size={24} />
              </div>
              <div className="min-w-0">
                <p className="mb-2 text-xs font-medium text-[#8b5cf6]">Detalle de tarea matriz</p>
                <h2 className="text-xl font-bold uppercase text-white">{selectedTask.title}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
                  {selectedTask.description || 'Sin descripción registrada.'}
                </p>
                <FormalObligationsBadge task={selectedTask} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div>
                <span className="text-xs text-slate-400">Fecha límite</span>
                <div className="mt-2 flex items-center gap-2 text-sm text-white">
                  <Calendar size={16} className="text-slate-400" />
                  {selectedTask.dueDate}
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-400">Responsable principal</span>
                <div className="mt-2 flex items-center gap-2">
                  <div className={clsx("flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-white", selectedTask.assignee.colorClass)}>
                    {selectedTask.assignee.initials}
                  </div>
                  <span className="text-sm text-white">{selectedTask.assignee.name}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-slate-400">Progreso general</span>
                <span className={clsx("text-sm font-bold", selectedStatus.textClass)}>{selectedStatus.label}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#1e253c]">
                  <div className={clsx("h-full rounded-full transition-all duration-500", getProgressColor(selectedProgress))} style={{ width: `${selectedProgress}%` }} />
                </div>
                <span className="w-12 text-right text-sm font-bold text-white">{selectedProgress}%</span>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[1.25fr_1fr_1.2fr]">
            <div className="rounded-2xl border border-[#1e253c] bg-[#0e121e]/50">
              <div className="flex items-center justify-between border-b border-[#1e253c] px-4 py-4">
                <h3 className="text-sm font-bold uppercase text-white">Subtareas ({completedSubtasks}/{totalSubtasks})</h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingSubtask(true);
                    setNewSubtaskAssigneeName(selectedTask.assignee.name);
                  }}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-[#8b5cf6] hover:bg-[#1e253c]"
                >
                  <Plus size={14} />
                  Agregar
                </button>
              </div>

              <div className="flex max-h-[460px] flex-col gap-2 overflow-y-auto p-3 scrollbar-hide">
                {selectedTask.subtasks.map((subtask, index) => {
                  const assignee = subtask.assignee || selectedTask.assignee;
                  const visualStatus = getSubtaskVisualStatus(subtask, selectedProgress, index, completedSubtasks);

                  return (
                    <div key={subtask.id} className="rounded-xl p-2 transition-colors hover:bg-[#1e253c]/50">
                      {editingSubtaskId === subtask.id ? (
                        <form onSubmit={(event) => handleEditSubtask(subtask.id, event)} className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <input
                              autoFocus
                              value={editingTitle}
                              onChange={(event) => setEditingTitle(event.target.value)}
                              className="min-w-0 flex-1 rounded-lg border border-[#506ff0] bg-[#0b0f19] px-3 py-2 text-sm text-white outline-none"
                            />
                            <button type="submit" className="flex h-10 w-10 items-center justify-center rounded-lg text-[#10b981] hover:bg-[#10b981]/10">
                              <Check size={15} />
                            </button>
                            <button type="button" onClick={cancelEditingSubtask} className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-[#1e253c] hover:text-white">
                              <X size={15} />
                            </button>
                          </div>
                          <select
                            value={editingAssigneeName}
                            onChange={(event) => setEditingAssigneeName(event.target.value)}
                            className="w-full rounded-lg border border-[#2a334e] bg-[#0b0f19] px-3 py-2 text-xs text-slate-200 outline-none focus:border-[#506ff0]"
                          >
                            {TEAM_MEMBERS.map((member) => (
                              <option key={member.name} value={member.name} className="bg-[#0e121e]">
                                {member.name}
                              </option>
                            ))}
                          </select>
                        </form>
                      ) : (
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              void toggleSubtask(selectedTask.id, subtask.id).catch((error) => {
                                console.error('[Supabase] No se pudo actualizar la subtarea desde Dashboard:', error);
                              });
                            }}
                            className={clsx(
                              "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-colors",
                              subtask.completed ? "border-[#10b981] bg-[#10b981] text-white" : "border-slate-500 text-transparent hover:border-slate-300",
                            )}
                            aria-label={subtask.completed ? 'Marcar como pendiente' : 'Marcar como completada'}
                          >
                            <Check size={13} />
                          </button>
                          <div className="min-w-0 flex-1">
                            <p className={clsx("text-sm leading-snug", subtask.completed ? "text-slate-400 line-through" : "text-slate-200")}>
                              {subtask.title}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                              <span>{subtask.date || selectedTask.dueDate}</span>
                              <span className={clsx("rounded-full px-2 py-0.5 font-medium", visualStatus.bg, visualStatus.text)}>
                                {visualStatus.label}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={clsx("flex h-7 w-7 items-center justify-center rounded-full text-[9px] font-bold text-white", assignee.colorClass)} title={assignee.name}>
                              {assignee.initials}
                            </div>
                            <button type="button" onClick={() => startEditingSubtask(subtask)} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-[#1e253c] hover:text-white" title="Editar subtarea">
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSubtask(subtask.id)}
                              className={clsx(
                                "flex h-9 items-center justify-center rounded-lg border px-2 text-slate-400 transition-colors hover:bg-[#ef4444]/10 hover:text-[#ef4444]",
                                confirmDeleteId === subtask.id ? "border-[#ef4444]/50 bg-[#ef4444]/10 text-[#ef4444]" : "border-transparent",
                              )}
                              title={confirmDeleteId === subtask.id ? 'Haz clic de nuevo para eliminar' : 'Eliminar subtarea'}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {selectedTask.subtasks.length === 0 && (
                  <div className="rounded-xl border border-dashed border-[#2a334e] py-8 text-center text-sm text-slate-500">
                    Esta tarea todavía no tiene subtareas.
                  </div>
                )}

                {isAddingSubtask && (
                  <form onSubmit={handleAddSubtask} className="mt-2 rounded-xl border border-[#2a334e] bg-[#121827] p-3">
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        value={newSubtaskTitle}
                        onChange={(event) => setNewSubtaskTitle(event.target.value)}
                        placeholder="Nombre de la subtarea..."
                        className="min-w-0 flex-1 rounded-lg border border-[#2a334e] bg-[#1e253c] px-3 py-2.5 text-sm text-white outline-none focus:border-[#506ff0]"
                      />
                      <button type="button" onClick={() => setIsAddingSubtask(false)} className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:text-white">
                        <X size={15} />
                      </button>
                      <button type="submit" disabled={isSavingSubtask} className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#506ff0] text-white disabled:opacity-60">
                        <Check size={15} />
                      </button>
                    </div>
                    <select
                      value={newSubtaskAssigneeName}
                      onChange={(event) => setNewSubtaskAssigneeName(event.target.value)}
                      className="mt-2 w-full rounded-lg border border-[#2a334e] bg-[#1e253c] px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-[#506ff0]"
                    >
                      {TEAM_MEMBERS.map((member) => (
                        <option key={member.name} value={member.name} className="bg-[#0e121e]">
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </form>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-[#1e253c] bg-[#0e121e]/50">
              <div className="border-b border-[#1e253c] px-4 py-4">
                <h3 className="text-sm font-bold uppercase text-white">Timeline interno</h3>
              </div>
              <div className="max-h-[460px] overflow-y-auto p-4 scrollbar-hide">
                <div className="relative flex flex-col gap-4 before:absolute before:left-[29px] before:top-3 before:h-[calc(100%-1.5rem)] before:w-px before:bg-gradient-to-b before:from-[#10b981] before:via-[#3b82f6] before:to-[#8b5cf6]">
                  {selectedTask.subtasks.map((subtask, index) => {
                    const assignee = subtask.assignee || selectedTask.assignee;
                    const visualStatus = getSubtaskVisualStatus(subtask, selectedProgress, index, completedSubtasks);

                    return (
                      <div key={subtask.id} className="relative grid grid-cols-[58px_1fr_auto] items-center gap-3">
                        <div className="rounded-xl bg-[#121827] px-2 py-2 text-center">
                          <span className="block text-sm font-bold text-white">{subtask.date?.split(' ')[0] || index + 1}</span>
                          <span className="text-[9px] uppercase text-slate-400">{subtask.date?.split(' ')[1] || 'Item'}</span>
                        </div>
                        <span className="absolute left-[25px] h-2.5 w-2.5 rounded-full border-2 border-[#0e121e]" style={{ backgroundColor: visualStatus.color }} />
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-sm text-slate-200">{subtask.title}</p>
                          <p className="mt-1 text-[10px] text-slate-500">{visualStatus.label}</p>
                        </div>
                        <div className={clsx("flex h-7 w-7 items-center justify-center rounded-full text-[9px] font-bold text-white", assignee.colorClass)} title={assignee.name}>
                          {assignee.initials}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="rounded-2xl border border-[#1e253c] bg-[#0e121e]/50">
                <div className="border-b border-[#1e253c] px-4 py-4">
                  <h3 className="text-sm font-bold uppercase text-white">Responsables</h3>
                </div>
                <div className="flex flex-col gap-4 p-4">
                  {assigneeRows.length > 0 ? assigneeRows.map((item) => (
                    <div key={item.assignee.name}>
                      <div className="mb-2 flex items-center gap-3">
                        <div className={clsx("flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-white", item.assignee.colorClass)}>
                          {item.assignee.initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-white">{item.assignee.name}</p>
                          <p className="text-[10px] text-slate-500">{item.completed}/{item.total} completadas</p>
                        </div>
                        <span className="text-xs font-bold text-slate-300">{item.progress}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-[#1e253c]">
                        <div className="h-full rounded-full bg-[#506ff0]" style={{ width: `${item.progress}%` }} />
                      </div>
                    </div>
                  )) : (
                    <div className="text-sm text-slate-500">No hay responsables asignados.</div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-[#1e253c] bg-[#0e121e]/50">
                <div className="border-b border-[#1e253c] px-4 py-4">
                  <h3 className="text-sm font-bold uppercase text-white">Progreso por estado</h3>
                </div>
                <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-[140px_1fr] sm:items-center xl:grid-cols-1 2xl:grid-cols-[140px_1fr]">
                  <div className="relative mx-auto h-32 w-32 rounded-full" style={{ background: `conic-gradient(#10b981 0 ${completedSubtasks * 100 / Math.max(totalSubtasks, 1)}%, #3b82f6 ${completedSubtasks * 100 / Math.max(totalSubtasks, 1)}% ${(completedSubtasks + inProgressSubtasks) * 100 / Math.max(totalSubtasks, 1)}%, #f59e0b ${(completedSubtasks + inProgressSubtasks) * 100 / Math.max(totalSubtasks, 1)}% 100%)` }}>
                    <div className="absolute inset-5 rounded-full bg-[#0e121e] flex flex-col items-center justify-center">
                      <span className="text-xl font-bold text-white">{selectedProgress}%</span>
                      <span className="text-[10px] text-slate-400">Total</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    {[
                      { label: 'Completadas', value: completedSubtasks, color: '#10b981' },
                      { label: 'En progreso', value: inProgressSubtasks, color: '#3b82f6' },
                      { label: 'Pendientes', value: backlogSubtasks, color: '#f59e0b' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                          <span className="text-slate-400">{item.label}</span>
                        </div>
                        <span className="text-slate-200">{item.value} ({totalSubtasks === 0 ? 0 : Math.round((item.value / totalSubtasks) * 100)}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <ClientEmailsSection task={selectedTask} />
          <ControlledOperationsSection task={selectedTask} />

          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
            <Clock3 size={14} />
            Los cambios hechos en Timeline se reflejan aquí usando el mismo estado sincronizado.
            <MoreVertical size={14} className="ml-auto text-slate-600" />
          </div>
        </div>
      )}
    </section>
  );
};
