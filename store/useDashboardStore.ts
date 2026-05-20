import { RealtimeChannel } from '@supabase/supabase-js';
import { create } from 'zustand';
import { Task, Subtask, USERS } from '../data/mockData';
import { Database, getSupabaseClient, isSupabaseConfigured, Json } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

type TaskRow = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type TaskUpdate = Database['public']['Tables']['tasks']['Update'];
type SubtaskRow = Database['public']['Tables']['subtasks']['Row'];
type SubtaskInsert = Database['public']['Tables']['subtasks']['Insert'];
type SubtaskUpdate = Database['public']['Tables']['subtasks']['Update'];

type TaskWithSubtasks = TaskRow & {
  subtasks?: SubtaskRow[];
};

type Assignee = Task['assignee'];

type AssigneeStats = {
  assignee: Assignee;
  total: number;
  completed: number;
  pending: number;
  progress: number;
};

interface DashboardState {
  tasks: Task[];
  isLoaded: boolean;
  error: string | null;
  selectedTaskId: string | null;
  currentView: 'dashboard' | 'timeline' | 'calendar';
  currentDate: string;
  filters: {
    assignee: string;
    status: string;
    search: string;
    empresa: string;
    prioridad: string;
  };

  initRealtime: () => () => void;
  reloadTasks: () => Promise<void>;
  clearError: () => void;
  selectTask: (id: string | null) => void;
  setCurrentView: (view: 'dashboard' | 'timeline' | 'calendar') => void;
  setCurrentDate: (date: string) => void;
  setFilters: (filters: Partial<DashboardState['filters']>) => void;

  addTask: (task: Omit<Task, 'id' | 'subtasks'>) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  addSubtask: (taskId: string, title: string, assignee?: Assignee) => Promise<void>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  editSubtask: (taskId: string, subtaskId: string, newTitle: string, assignee?: Assignee) => Promise<void>;
  deleteSubtask: (taskId: string, subtaskId: string) => Promise<void>;

  getTaskProgress: (taskId: string) => number;
  getFilteredTasks: () => Task[];
  getTotalTasksCount: () => number;
  getCompletedTasksCount: () => number;
  getPendingTasksCount: () => number;
  getOverallProgress: () => number;
  getTotalSubtasksCount: () => number;
  getCompletedSubtasksCount: () => number;
  getOverdueSubtasksCount: () => number;
  getAssigneeStats: () => AssigneeStats[];
}

let realtimeChannels: RealtimeChannel[] = [];
const recentSubtaskCompletions = new Map<string, { completed: boolean; confirmedAt: number }>();
const RECENT_CONFIRMATION_MS = 10_000;

const isAssignee = (value: unknown): value is Assignee => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<Assignee>;
  return (
    typeof candidate.name === 'string' &&
    typeof candidate.role === 'string' &&
    typeof candidate.initials === 'string' &&
    typeof candidate.colorClass === 'string'
  );
};

const parseAssignee = (value: Json): Assignee => {
  if (isAssignee(value)) return value;

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (isAssignee(parsed)) return parsed;
    } catch {
      // Keep the fallback below for legacy malformed rows.
    }
  }

  return {
    name: 'Sin responsable',
    role: 'Sin rol',
    initials: 'SR',
    colorClass: 'bg-gradient-to-r from-[#64748b] to-[#94a3b8]',
  };
};

const formatSubtaskDate = (createdAt?: string) => {
  if (!createdAt) return undefined;
  return new Intl.DateTimeFormat('es-PE', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(createdAt));
};

const formatTaskDate = (date: string) => {
  const parsedDate = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) return date;

  return new Intl.DateTimeFormat('es-PE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsedDate);
};

const mapDbSubtaskToSubtask = (subtask: SubtaskRow, fallbackAssignee?: Assignee): Subtask => ({
  id: subtask.id,
  title: subtask.title,
  completed: subtask.completed,
  date: formatSubtaskDate(subtask.created_at),
  assignee: subtask.assignee ? parseAssignee(subtask.assignee) : fallbackAssignee,
});

const mapDbTaskToTask = (task: TaskWithSubtasks): Task => {
  const assignee = parseAssignee(task.assignee);

  return {
    id: task.id,
    title: task.title,
    description: task.description || '',
    assignee,
    dueDate: formatTaskDate(task.due_date),
    dateBlock: task.date_block,
    empresa: task.empresa,
    prioridad: task.prioridad,
    subtasks: (task.subtasks || []).map((subtask) => mapDbSubtaskToSubtask(subtask, assignee)),
  };
};

const rememberConfirmedSubtaskCompletion = (subtaskId: string, completed: boolean) => {
  recentSubtaskCompletions.set(subtaskId, { completed, confirmedAt: Date.now() });
};

const applyRecentSubtaskConfirmations = (tasks: Task[]) => {
  const now = Date.now();

  return tasks.map((task) => ({
    ...task,
    subtasks: task.subtasks.map((subtask) => {
      const recentCompletion = recentSubtaskCompletions.get(subtask.id);
      if (!recentCompletion) return subtask;

      if (now - recentCompletion.confirmedAt > RECENT_CONFIRMATION_MS) {
        recentSubtaskCompletions.delete(subtask.id);
        return subtask;
      }

      return { ...subtask, completed: recentCompletion.completed };
    }),
  }));
};

const mergeSubtaskIntoTasks = (tasks: Task[], subtaskRow: SubtaskRow) => {
  return tasks.map((task) => {
    if (task.id !== subtaskRow.task_id) return task;

    const mappedSubtask = mapDbSubtaskToSubtask(subtaskRow, task.assignee);
    const exists = task.subtasks.some((subtask) => subtask.id === subtaskRow.id);
    return {
      ...task,
      subtasks: exists
        ? task.subtasks.map((subtask) => (subtask.id === subtaskRow.id ? mappedSubtask : subtask))
        : [...task.subtasks, mappedSubtask],
    };
  });
};

const removeSubtaskFromTasks = (tasks: Task[], subtaskId: string) =>
  tasks.map((task) => ({
    ...task,
    subtasks: task.subtasks.filter((subtask) => subtask.id !== subtaskId),
  }));

const taskToInsert = (id: string, task: Omit<Task, 'id' | 'subtasks'>): TaskInsert => ({
  id,
  title: task.title,
  description: task.description || null,
  assignee: task.assignee as unknown as Json,
  due_date: task.dueDate,
  date_block: task.dateBlock,
  empresa: task.empresa || 'Empresa A',
  prioridad: task.prioridad || 'Media',
});

const taskUpdatesToDb = (updates: Partial<Task>): TaskUpdate => {
  const dbUpdates: TaskUpdate = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description || null;
  if (updates.assignee !== undefined) dbUpdates.assignee = updates.assignee as unknown as Json;
  if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
  if (updates.dateBlock !== undefined) dbUpdates.date_block = updates.dateBlock;
  if (updates.empresa !== undefined) dbUpdates.empresa = updates.empresa;
  if (updates.prioridad !== undefined) dbUpdates.prioridad = updates.prioridad;
  return dbUpdates;
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'Error desconocido al sincronizar con Supabase.';
};

const failWithStoreError = (error: unknown, set: (partial: Partial<DashboardState>) => void): never => {
  const message = getErrorMessage(error);
  set({ error: message });
  console.error('[Supabase]', message, error);
  throw new Error(message);
};

const withRevertedTasks = async (
  optimisticUpdate: () => void,
  operation: () => PromiseLike<{ error: { message: string } | null }>,
  set: (partial: Partial<DashboardState>) => void,
  get: () => DashboardState,
) => {
  const previousTasks = get().tasks;
  optimisticUpdate();

  const { error } = await operation();
  if (error) {
    set({ tasks: previousTasks, error: error.message });
    console.error('[Supabase]', error.message, error);
    throw new Error(error.message);
  }

  set({ error: null });
};

const clearRealtimeChannels = () => {
  realtimeChannels.forEach((channel) => {
    if (isSupabaseConfigured()) {
      getSupabaseClient().removeChannel(channel);
    }
  });
  realtimeChannels = [];
};

export const useDashboardStore = create<DashboardState>()((set, get) => ({
  tasks: [],
  isLoaded: false,
  error: null,
  selectedTaskId: null,
  currentView: 'dashboard',
  currentDate: '2026-05-16',
  filters: { assignee: 'all', status: 'all', search: '', empresa: 'all', prioridad: 'all' },

  reloadTasks: async () => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('tasks')
        .select('*, subtasks(*)')
        .order('date_block', { ascending: true })
        .order('created_at', { ascending: true })
        .order('created_at', { referencedTable: 'subtasks', ascending: true });

      if (error) {
        set({ error: error.message, isLoaded: true });
        console.error('[Supabase]', error.message, error);
        return;
      }

      set({
        tasks: applyRecentSubtaskConfirmations((data || []).map((task) => mapDbTaskToTask(task as TaskWithSubtasks))),
        isLoaded: true,
        error: null,
      });
    } catch (error) {
      set({ error: getErrorMessage(error), isLoaded: true });
      console.error('[Supabase]', getErrorMessage(error), error);
    }
  },

  initRealtime: () => {
    clearRealtimeChannels();
    void get().reloadTasks();

    if (!isSupabaseConfigured()) {
      return clearRealtimeChannels;
    }

    const supabase = getSupabaseClient();
    const tasksChannel = supabase
      .channel('dashboard-tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        void get().reloadTasks();
      })
      .subscribe();

    const subtasksChannel = supabase
      .channel('dashboard-subtasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subtasks' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          const oldSubtask = payload.old as Partial<SubtaskRow>;
          const oldSubtaskId = oldSubtask.id;
          if (oldSubtaskId) {
            set((state) => ({
              tasks: removeSubtaskFromTasks(state.tasks, oldSubtaskId),
              error: null,
            }));
          }
          return;
        }

        const subtaskRow = payload.new as SubtaskRow;
        if (!subtaskRow?.id || !subtaskRow.task_id) {
          void get().reloadTasks();
          return;
        }

        console.info('[Supabase Realtime] public.subtasks', {
          event: payload.eventType,
          subtaskId: subtaskRow.id,
          taskId: subtaskRow.task_id,
          completed: subtaskRow.completed,
        });

        rememberConfirmedSubtaskCompletion(subtaskRow.id, subtaskRow.completed);
        set((state) => ({
          tasks: mergeSubtaskIntoTasks(state.tasks, subtaskRow),
          error: null,
        }));
      })
      .subscribe();

    realtimeChannels = [tasksChannel, subtasksChannel];

    return clearRealtimeChannels;
  },

  clearError: () => set({ error: null }),
  selectTask: (id) => set({ selectedTaskId: id }),
  setCurrentView: (view) => set({ currentView: view }),
  setCurrentDate: (date) => set({ currentDate: date }),
  setFilters: (newFilters) => set((state) => ({ filters: { ...state.filters, ...newFilters } })),

  addTask: async (newTaskData) => {
    const id = uuidv4();
    const insertPayload = taskToInsert(id, newTaskData);

    try {
      console.info('[Supabase] INSERT public.tasks', insertPayload);
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.from('tasks').insert(insertPayload).select('*, subtasks(*)').single();

      if (error) {
        failWithStoreError(error, set);
      }

      if (!data) {
        failWithStoreError(new Error('Supabase no devolvió la tarea creada.'), set);
      }

      const createdTask = mapDbTaskToTask(data as TaskWithSubtasks);
      set((state) => ({
        tasks: [...state.tasks.filter((task) => task.id !== createdTask.id), createdTask],
        selectedTaskId: createdTask.id,
        error: null,
      }));
      void get().reloadTasks();
    } catch (error) {
      failWithStoreError(error, set);
    }
  },

  updateTask: async (taskId, updates) => {
    await withRevertedTasks(
      () =>
        set((state) => ({
          tasks: state.tasks.map((task) => (task.id === taskId ? { ...task, ...updates } : task)),
        })),
      () => getSupabaseClient().from('tasks').update(taskUpdatesToDb(updates)).eq('id', taskId).select('id').single(),
      set,
      get,
    );
  },

  deleteTask: async (taskId) => {
    await withRevertedTasks(
      () =>
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== taskId),
          selectedTaskId: state.selectedTaskId === taskId ? null : state.selectedTaskId,
        })),
      () => getSupabaseClient().from('tasks').delete().eq('id', taskId),
      set,
      get,
    );
  },

  addSubtask: async (taskId, title, assignee) => {
    const id = uuidv4();
    const parentTask = get().tasks.find((task) => task.id === taskId);
    const subtaskAssignee = assignee || parentTask?.assignee;
    const insertPayload: SubtaskInsert = {
      id,
      task_id: taskId,
      title,
      completed: false,
      assignee: subtaskAssignee ? (subtaskAssignee as unknown as Json) : null,
    };

    try {
      console.info('[Supabase] INSERT public.subtasks', insertPayload);
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.from('subtasks').insert(insertPayload).select('*').single();

      if (error) {
        failWithStoreError(error, set);
      }

      if (!data) {
        failWithStoreError(new Error('Supabase no devolvió la subtarea creada.'), set);
      }

      const newSubtask: Subtask = mapDbSubtaskToSubtask(data as SubtaskRow, parentTask?.assignee);
      rememberConfirmedSubtaskCompletion(newSubtask.id, newSubtask.completed);
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId ? { ...task, subtasks: [...task.subtasks.filter((st) => st.id !== id), newSubtask] } : task,
        ),
        error: null,
      }));
      void get().reloadTasks();
    } catch (error) {
      failWithStoreError(error, set);
    }
  },

  toggleSubtask: async (taskId, subtaskId) => {
    const task = get().tasks.find((item) => item.id === taskId);
    const subtask = task?.subtasks.find((item) => item.id === subtaskId);
    if (!subtask) return;

    const nextCompleted = !subtask.completed;

    console.info('[Supabase] UPDATE public.subtasks.completed', {
      taskId,
      subtaskId,
      previousCompleted: subtask.completed,
      nextCompleted,
    });

    try {
      const { data, error } = await getSupabaseClient()
        .from('subtasks')
        .update({ completed: nextCompleted })
        .eq('id', subtaskId)
        .eq('task_id', taskId)
        .select('*')
        .single();

      if (error) {
        failWithStoreError(error, set);
      }

      if (!data) {
        failWithStoreError(new Error('Supabase no devolvió la subtarea actualizada.'), set);
      }

      const updatedSubtask = data as SubtaskRow;

      if (updatedSubtask.completed !== nextCompleted) {
        failWithStoreError(
          new Error(`Supabase devolvió completed=${updatedSubtask.completed} al intentar guardar completed=${nextCompleted}.`),
          set,
        );
      }

      rememberConfirmedSubtaskCompletion(updatedSubtask.id, updatedSubtask.completed);
      set((state) => {
        const tasks = mergeSubtaskIntoTasks(state.tasks, updatedSubtask);
        const updatedTask = tasks.find((item) => item.id === taskId);
        const completedCount = updatedTask?.subtasks.filter((item) => item.completed).length || 0;
        const totalCount = updatedTask?.subtasks.length || 0;

        console.info('[Zustand] public.subtasks.completed applied', {
          taskId,
          subtaskId,
          completed: updatedSubtask.completed,
          completedCount,
          totalCount,
          progress: totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100),
        });

        return { tasks, error: null };
      });
    } catch (error) {
      failWithStoreError(error, set);
    }
  },

  editSubtask: async (taskId, subtaskId, newTitle, assignee) => {
    const subtaskUpdate: SubtaskUpdate = { title: newTitle };
    if (assignee) subtaskUpdate.assignee = assignee as unknown as Json;

    await withRevertedTasks(
      () =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  subtasks: task.subtasks.map((subtask) =>
                    subtask.id === subtaskId ? { ...subtask, title: newTitle, assignee: assignee || subtask.assignee } : subtask,
                  ),
                }
              : task,
          ),
        })),
      () => getSupabaseClient().from('subtasks').update(subtaskUpdate).eq('id', subtaskId).eq('task_id', taskId).select('id').single(),
      set,
      get,
    );
  },

  deleteSubtask: async (taskId, subtaskId) => {
    await withRevertedTasks(
      () =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? { ...task, subtasks: task.subtasks.filter((subtask) => subtask.id !== subtaskId) }
              : task,
          ),
        })),
      () => getSupabaseClient().from('subtasks').delete().eq('id', subtaskId),
      set,
      get,
    );
  },

  getTaskProgress: (taskId) => {
    const task = get().tasks.find((item) => item.id === taskId);
    if (!task || task.subtasks.length === 0) return 0;
    const completed = task.subtasks.filter((subtask) => subtask.completed).length;
    return Math.round((completed / task.subtasks.length) * 100);
  },

  getFilteredTasks: () => {
    const { tasks, filters } = get();
    const search = filters.search.trim().toLowerCase();

    return tasks.filter((task) => {
      if (
        filters.assignee !== 'all' &&
        task.assignee.name !== filters.assignee &&
        !task.subtasks.some((subtask) => (subtask.assignee || task.assignee).name === filters.assignee)
      ) {
        return false;
      }
      if (filters.empresa !== 'all' && task.empresa !== filters.empresa) return false;
      if (filters.prioridad !== 'all' && task.prioridad !== filters.prioridad) return false;
      if (filters.status !== 'all') {
        const progress = get().getTaskProgress(task.id);
        if (filters.status === 'completed' && progress !== 100) return false;
        if (filters.status === 'pending' && progress === 100) return false;
      }
      if (search && !`${task.title} ${task.description} ${task.empresa}`.toLowerCase().includes(search)) {
        return false;
      }
      return true;
    });
  },

  getTotalTasksCount: () => get().getFilteredTasks().length,

  getCompletedTasksCount: () => {
    const { getFilteredTasks, getTaskProgress } = get();
    return getFilteredTasks().filter((task) => getTaskProgress(task.id) === 100).length;
  },

  getPendingTasksCount: () => {
    const { getFilteredTasks, getTaskProgress } = get();
    return getFilteredTasks().filter((task) => getTaskProgress(task.id) < 100).length;
  },

  getOverallProgress: () => {
    const { getFilteredTasks, getTaskProgress } = get();
    const tasks = getFilteredTasks();
    if (tasks.length === 0) return 0;
    const totalProgress = tasks.reduce((acc, task) => acc + getTaskProgress(task.id), 0);
    return Math.round(totalProgress / tasks.length);
  },

  getTotalSubtasksCount: () => {
    const { getFilteredTasks } = get();
    return getFilteredTasks().reduce((acc, task) => acc + task.subtasks.length, 0);
  },

  getCompletedSubtasksCount: () => {
    const { getFilteredTasks } = get();
    return getFilteredTasks().reduce(
      (acc, task) => acc + task.subtasks.filter((subtask) => subtask.completed).length,
      0,
    );
  },

  getOverdueSubtasksCount: () => {
    const today = new Date();
    const { getFilteredTasks } = get();

    return getFilteredTasks().reduce((total, task) => {
      const taskDate = new Date(`${task.dateBlock}T23:59:59`);
      if (Number.isNaN(taskDate.getTime()) || taskDate >= today) return total;
      return total + task.subtasks.filter((subtask) => !subtask.completed).length;
    }, 0);
  },

  getAssigneeStats: () => {
    const stats = Object.values(USERS).reduce<Record<string, AssigneeStats>>((acc, assignee) => {
      acc[assignee.name] = {
        assignee,
        total: 0,
        completed: 0,
        pending: 0,
        progress: 0,
      };
      return acc;
    }, {});

    get().getFilteredTasks().forEach((task) => {
      task.subtasks.forEach((subtask) => {
        const assignee = subtask.assignee || task.assignee;
        if (!stats[assignee.name]) {
          stats[assignee.name] = {
            assignee,
            total: 0,
            completed: 0,
            pending: 0,
            progress: 0,
          };
        }

        stats[assignee.name].total += 1;
        if (subtask.completed) {
          stats[assignee.name].completed += 1;
        } else {
          stats[assignee.name].pending += 1;
        }
      });
    });

    return Object.values(stats).map((item) => ({
      ...item,
      progress: item.total === 0 ? 0 : Math.round((item.completed / item.total) * 100),
    }));
  },
}));
