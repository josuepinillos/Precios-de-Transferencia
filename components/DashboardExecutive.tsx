"use client";

import React from 'react';
import clsx from 'clsx';
import {
  Calendar,
  Check,
  Clock3,
  Edit2,
  Folder,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { USERS, Task, Subtask } from '../data/mockData';
import { useDashboardStore } from '../store/useDashboardStore';
import { Avatar } from './ui/Avatar';
import { Badge, toneForProgress } from './ui/Badge';
import { ProgressBar } from './ui/Progress';
import { ClientEmailsSection } from './ClientEmailsSection';
import { ControlledOperationsSection } from './ControlledOperationsSection';
import { FormalObligationsBadge } from './FormalObligationsBadge';
import { HistoricalResultsSection } from './HistoricalResultsSection';

const TEAM_MEMBERS = Object.values(USERS);

type TaskStatus = {
  label: string;
  color: string;
  textClass: string;
};

const getTaskStatus = (progress: number): TaskStatus => {
  if (progress === 100) {
    return { label: 'Completada', color: '#10b981', textClass: 'text-positive-ink' };
  }
  if (progress > 0) {
    return { label: 'En progreso', color: '#f59e0b', textClass: 'text-caution-ink' };
  }
  return { label: 'Pendiente', color: '#8b5cf6', textClass: 'text-accent' };
};

const getAssigneeByName = (name: string, fallback: Task['assignee']) =>
  TEAM_MEMBERS.find((member) => member.name === name) || fallback;

const getSubtaskVisualStatus = (subtask: Subtask, taskProgress: number, position: number, completedCount: number) => {
  if (subtask.completed) {
    return { label: 'Completada', color: '#10b981', bg: 'bg-positive-soft', text: 'text-positive-ink' };
  }
  if (taskProgress > 0 && position === completedCount) {
    return { label: 'En progreso', color: '#3b82f6', bg: 'bg-accent-soft', text: 'text-accent' };
  }
  return { label: 'Pendiente', color: '#8b5cf6', bg: 'bg-surface-sunken', text: 'text-ink-soft' };
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
  const [matrixSearch, setMatrixSearch] = React.useState('');

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) || tasks[0] || null;
  const normalizedMatrixSearch = matrixSearch.trim().toLowerCase();
  const visibleMatrixTasks = normalizedMatrixSearch
    ? tasks.filter((task) =>
        [task.title, task.empresa, task.description]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedMatrixSearch)),
      )
    : tasks;
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
      <section className="card rounded-2xl border border-line p-6 sm:p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-sunken text-accent">
          <Folder size={22} />
        </div>
        <h2 className="text-lg font-bold text-ink">No hay tareas matrices</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Las tareas creadas desde Timeline aparecerán aquí automáticamente.
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4 sm:gap-6">
      {error && (
        <div className="rounded-lg border border-critical/30 bg-critical-soft px-4 py-3 text-sm text-critical-ink">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-ink">Tareas matrices</h2>
          <p className="mt-1 text-[13px] text-ink-soft">
            {visibleMatrixTasks.length} de {tasks.length} {tasks.length === 1 ? 'expediente' : 'expedientes'} · selecciona uno para ver su detalle
          </p>
        </div>
        <div className="relative w-full md:w-[300px] lg:w-[340px]">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            type="text"
            value={matrixSearch}
            onChange={(event) => setMatrixSearch(event.target.value)}
            placeholder="Buscar tarea matriz..."
            className="field pl-9"
          />
        </div>
      </div>

      <div className="flex snap-x gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {visibleMatrixTasks.map((task) => {
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
                "card card-interactive w-[290px] flex-shrink-0 snap-start p-4 text-left sm:w-[310px]",
                isSelected && "border-accent shadow-focus",
              )}
            >
              <div className="flex items-start justify-between gap-2.5">
                <h3 className="line-clamp-2 text-[13px] font-semibold uppercase leading-snug tracking-tight text-ink">
                  {task.title}
                </h3>
                <Badge tone={toneForProgress(progress)} dot>{status.label}</Badge>
              </div>
              <p className="mt-1.5 line-clamp-1 text-xs text-ink-faint">{task.description || task.empresa}</p>

              <div className="mt-4 flex items-baseline justify-between gap-2">
                <span className="text-2xl font-semibold leading-none tracking-[-0.02em] tabular text-ink">{progress}%</span>
                <span className="text-xs tabular text-ink-soft">{completed}/{task.subtasks.length} subtareas</span>
              </div>
              <ProgressBar value={progress} tone={toneForProgress(progress)} className="mt-2.5" />

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Avatar
                    initials={task.assignee.initials}
                    colorClass={task.assignee.colorClass}
                    name={task.assignee.name}
                    size="xs"
                  />
                  <span className="truncate text-xs text-ink-soft">{task.assignee.name}</span>
                </div>
                <span className="flex flex-shrink-0 items-center gap-1.5 text-xs text-ink-faint">
                  <Calendar size={12} />
                  {task.dueDate}
                </span>
              </div>
            </button>
          );
        })}
        {visibleMatrixTasks.length === 0 && (
          <div className="flex min-h-[180px] min-w-full items-center justify-center rounded-2xl border border-dashed border-line bg-surface px-4 py-8 text-center">
            <p className="text-sm font-semibold text-ink-soft">No se encontraron tareas matrices</p>
          </div>
        )}
      </div>

      {selectedTask && (
        <div className="card p-4 sm:p-5 lg:p-6">
          <div className="grid grid-cols-1 items-stretch gap-4 border-b border-line pb-5 lg:grid-cols-[minmax(240px,1fr)_minmax(360px,1.25fr)] xl:grid-cols-[minmax(260px,1fr)_minmax(420px,1.35fr)_minmax(280px,0.85fr)]">
            <div className="panel flex h-full min-w-0 items-center gap-3.5 p-4">
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[10px] bg-accent-soft text-accent">
                <Folder size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="eyebrow mb-1">Detalle de tarea matriz</p>
                <h2 className="truncate text-lg font-semibold tracking-tight text-ink">{selectedTask.title}</h2>
                <p className="mt-0.5 truncate text-[13px] text-ink-soft">{selectedTask.empresa}</p>
              </div>
            </div>

            <FormalObligationsBadge task={selectedTask} />

            <div className="panel flex h-full flex-col justify-between p-4">
              <p className="eyebrow">Progreso general</p>
              <div className="mt-4 flex items-end justify-between gap-4">
                <span className="text-3xl font-semibold leading-none tracking-[-0.02em] tabular text-ink">{selectedProgress}%</span>
                <Badge tone={toneForProgress(selectedProgress)} dot>{selectedStatus.label}</Badge>
              </div>
              <ProgressBar value={selectedProgress} tone={toneForProgress(selectedProgress)} size="md" className="mt-3" />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[1.25fr_1fr_1.2fr]">
            <div className="panel flex flex-col">
              <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
                <h3 className="text-[13px] font-semibold tracking-tight text-ink">Subtareas ({completedSubtasks}/{totalSubtasks})</h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingSubtask(true);
                    setNewSubtaskAssigneeName(selectedTask.assignee.name);
                  }}
                  className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent-soft"
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
                    <div
                      key={subtask.id}
                      className="rounded-xl border border-transparent p-2 transition-colors hover:bg-surface-sunken"
                    >
                      {editingSubtaskId === subtask.id ? (
                        <form onSubmit={(event) => handleEditSubtask(subtask.id, event)} className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <input
                              autoFocus
                              value={editingTitle}
                              onChange={(event) => setEditingTitle(event.target.value)}
                              className="min-w-0 flex-1 rounded-lg border border-accent bg-canvas px-3 py-2 text-sm text-ink outline-none"
                            />
                            <button type="submit" className="flex h-10 w-10 items-center justify-center rounded-lg text-positive-ink hover:bg-positive-soft">
                              <Check size={15} />
                            </button>
                            <button type="button" onClick={cancelEditingSubtask} className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-soft hover:bg-surface-sunken hover:text-ink">
                              <X size={15} />
                            </button>
                          </div>
                          <select
                            value={editingAssigneeName}
                            onChange={(event) => setEditingAssigneeName(event.target.value)}
                            className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-xs text-ink outline-none focus:border-accent"
                          >
                            {TEAM_MEMBERS.map((member) => (
                              <option key={member.name} value={member.name} className="bg-surface">
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
                              subtask.completed ? "border-positive bg-positive text-white" : "border-line-strong text-transparent hover:border-ink-faint",
                            )}
                            aria-label={subtask.completed ? 'Marcar como pendiente' : 'Marcar como completada'}
                          >
                            <Check size={13} />
                          </button>
                          <div className="min-w-0 flex-1">
                            <p className={clsx("text-sm leading-snug", subtask.completed ? "text-ink-soft line-through" : "text-ink")}>
                              {subtask.title}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-ink-faint">
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
                            <button type="button" onClick={() => startEditingSubtask(subtask)} className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft hover:bg-surface-sunken hover:text-ink" title="Editar subtarea">
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSubtask(subtask.id)}
                              className={clsx(
                                "flex h-9 items-center justify-center rounded-lg border px-2 text-ink-soft transition-colors hover:bg-critical-soft hover:text-critical-ink",
                                confirmDeleteId === subtask.id ? "border-critical/30 bg-critical-soft text-critical-ink" : "border-transparent",
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
                  <div className="rounded-xl border border-dashed border-line py-8 text-center text-sm text-ink-faint">
                    Esta tarea todavía no tiene subtareas.
                  </div>
                )}

                {isAddingSubtask && (
                  <form onSubmit={handleAddSubtask} className="mt-2 rounded-xl border border-line bg-surface-muted p-3">
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        value={newSubtaskTitle}
                        onChange={(event) => setNewSubtaskTitle(event.target.value)}
                        placeholder="Nombre de la subtarea..."
                        className="min-w-0 flex-1 rounded-lg border border-line bg-surface-sunken px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
                      />
                      <button type="button" onClick={() => setIsAddingSubtask(false)} className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-soft hover:text-ink">
                        <X size={15} />
                      </button>
                      <button type="submit" disabled={isSavingSubtask} className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-white disabled:opacity-60">
                        <Check size={15} />
                      </button>
                    </div>
                    <select
                      value={newSubtaskAssigneeName}
                      onChange={(event) => setNewSubtaskAssigneeName(event.target.value)}
                      className="mt-2 w-full rounded-lg border border-line bg-surface-sunken px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
                    >
                      {TEAM_MEMBERS.map((member) => (
                        <option key={member.name} value={member.name} className="bg-surface">
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </form>
                )}
              </div>
            </div>

            <div className="panel">
              <div className="border-b border-line px-4 py-3.5">
                <h3 className="text-[13px] font-semibold tracking-tight text-ink">Timeline interno</h3>
              </div>
              <div className="max-h-[460px] overflow-y-auto p-4 scrollbar-hide">
                <div className="relative flex flex-col gap-4 before:absolute before:left-[29px] before:top-3 before:h-[calc(100%-1.5rem)] before:w-px before:bg-line">
                  {selectedTask.subtasks.map((subtask, index) => {
                    const assignee = subtask.assignee || selectedTask.assignee;
                    const visualStatus = getSubtaskVisualStatus(subtask, selectedProgress, index, completedSubtasks);

                    return (
                      <div key={subtask.id} className="relative grid grid-cols-[58px_1fr_auto] items-center gap-3">
                        <div className="rounded-xl bg-surface-muted px-2 py-2 text-center">
                          <span className="block text-sm font-bold text-ink">{subtask.date?.split(' ')[0] || index + 1}</span>
                          <span className="text-[9px] uppercase text-ink-soft">{subtask.date?.split(' ')[1] || 'Item'}</span>
                        </div>
                        <span className="absolute left-[25px] h-2.5 w-2.5 rounded-full border-2 border-surface" style={{ backgroundColor: visualStatus.color }} />
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-sm text-ink">{subtask.title}</p>
                          <p className="mt-1 text-[10px] text-ink-faint">{visualStatus.label}</p>
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
              <div className="panel">
                <div className="border-b border-line px-4 py-3.5">
                  <h3 className="text-[13px] font-semibold tracking-tight text-ink">Responsables</h3>
                </div>
                <div className="flex flex-col gap-4 p-4">
                  {assigneeRows.length > 0 ? assigneeRows.map((item) => (
                    <div key={item.assignee.name}>
                      <div className="mb-2 flex items-center gap-3">
                        <div className={clsx("flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-white", item.assignee.colorClass)}>
                          {item.assignee.initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-ink">{item.assignee.name}</p>
                          <p className="text-[10px] text-ink-faint">{item.completed}/{item.total} completadas</p>
                        </div>
                        <span className="text-xs font-bold text-ink-soft">{item.progress}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-surface-sunken">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${item.progress}%` }} />
                      </div>
                    </div>
                  )) : (
                    <div className="text-sm text-ink-faint">No hay responsables asignados.</div>
                  )}
                </div>
              </div>

              <div className="panel">
                <div className="border-b border-line px-4 py-3.5">
                  <h3 className="text-[13px] font-semibold tracking-tight text-ink">Progreso por estado</h3>
                </div>
                <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-[140px_1fr] sm:items-center xl:grid-cols-1 2xl:grid-cols-[140px_1fr]">
                  <div className="relative mx-auto h-32 w-32 rounded-full" style={{ background: `conic-gradient(#10b981 0 ${completedSubtasks * 100 / Math.max(totalSubtasks, 1)}%, #3b82f6 ${completedSubtasks * 100 / Math.max(totalSubtasks, 1)}% ${(completedSubtasks + inProgressSubtasks) * 100 / Math.max(totalSubtasks, 1)}%, #f59e0b ${(completedSubtasks + inProgressSubtasks) * 100 / Math.max(totalSubtasks, 1)}% 100%)` }}>
                    <div className="absolute inset-5 rounded-full bg-surface flex flex-col items-center justify-center">
                      <span className="text-xl font-bold text-ink">{selectedProgress}%</span>
                      <span className="text-[10px] text-ink-soft">Total</span>
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
                          <span className="text-ink-soft">{item.label}</span>
                        </div>
                        <span className="text-ink">{item.value} ({totalSubtasks === 0 ? 0 : Math.round((item.value / totalSubtasks) * 100)}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <ClientEmailsSection task={selectedTask} />
          <ControlledOperationsSection task={selectedTask} />
          <HistoricalResultsSection task={selectedTask} />

          <div className="mt-4 flex items-center gap-2 text-xs text-ink-faint">
            <Clock3 size={14} />
            Los cambios hechos en Timeline se reflejan aquí usando el mismo estado sincronizado.
            <MoreVertical size={14} className="ml-auto text-ink-faint" />
          </div>
        </div>
      )}
    </section>
  );
};
