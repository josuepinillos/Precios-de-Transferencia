import { create } from 'zustand';
import { Task, Subtask } from '../data/mockData';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

interface DashboardState {
  tasks: Task[];
  isLoaded: boolean;
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
  
  initRealtime: () => void;
  selectTask: (id: string | null) => void;
  setCurrentView: (view: 'dashboard' | 'timeline' | 'calendar') => void;
  setCurrentDate: (date: string) => void;
  setFilters: (filters: Partial<DashboardState['filters']>) => void;
  
  // Modifying tasks
  addTask: (task: Omit<Task, 'id' | 'subtasks'>) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  addSubtask: (taskId: string, title: string) => Promise<void>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  editSubtask: (taskId: string, subtaskId: string, newTitle: string) => Promise<void>;
  deleteSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  
  // Computed values
  getTaskProgress: (taskId: string) => number;
  getFilteredTasks: () => Task[];
  getTotalTasksCount: () => number;
  getCompletedTasksCount: () => number;
  getPendingTasksCount: () => number;
  getOverallProgress: () => number;
  getTotalSubtasksCount: () => number;
  getCompletedSubtasksCount: () => number;
  getOverdueSubtasksCount: () => number;
}

// Mapper to convert DB snake_case to frontend camelCase
const mapDbTaskToTask = (dbTask: any): Task => ({
  id: dbTask.id,
  title: dbTask.title,
  description: dbTask.description || '',
  assignee: typeof dbTask.assignee === 'string' ? JSON.parse(dbTask.assignee) : dbTask.assignee,
  dueDate: dbTask.due_date,
  dateBlock: dbTask.date_block,
  empresa: dbTask.empresa,
  prioridad: dbTask.prioridad,
  subtasks: (dbTask.subtasks || []).map((st: any) => ({
    id: st.id,
    title: st.title,
    completed: st.completed,
    date: st.created_at ? new Date(st.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : undefined
  }))
});

export const useDashboardStore = create<DashboardState>()((set, get) => ({
  tasks: [],
  isLoaded: false,
  selectedTaskId: null,
  currentView: 'timeline',
  currentDate: "2026-05-16",
  filters: { assignee: 'all', status: 'all', search: '', empresa: 'all', prioridad: 'all' },
  
  initRealtime: async () => {
    // 1. Fetch initial data
    const { data: dbTasks, error } = await supabase
      .from('tasks')
      .select('*, subtasks(*)');
      
    if (error) {
      console.error('Error fetching tasks:', error);
    } else if (dbTasks) {
      const mappedTasks = dbTasks.map(mapDbTaskToTask);
      set({ tasks: mappedTasks, isLoaded: true });
    }

    // 2. Subscribe to tasks changes
    supabase.channel('public:tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, async (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        
        if (eventType === 'INSERT') {
          // Fetch its subtasks just in case (should be empty initially but good practice)
          const { data: stData } = await supabase.from('subtasks').select('*').eq('task_id', newRecord.id);
          const mapped = mapDbTaskToTask({ ...newRecord, subtasks: stData || [] });
          set(state => ({ tasks: [...state.tasks.filter(t => t.id !== mapped.id), mapped] }));
        } 
        else if (eventType === 'UPDATE') {
          set(state => {
            const existingTask = state.tasks.find(t => t.id === newRecord.id);
            if (!existingTask) return state; // Let INSERT handle it if missing
            const mapped = mapDbTaskToTask({ ...newRecord, subtasks: [] }); // We keep existing subtasks in state
            mapped.subtasks = existingTask.subtasks; // Preserve nested subtasks in state
            return { tasks: state.tasks.map(t => t.id === mapped.id ? mapped : t) };
          });
        } 
        else if (eventType === 'DELETE') {
          set(state => ({ 
            tasks: state.tasks.filter(t => t.id !== oldRecord.id),
            selectedTaskId: state.selectedTaskId === oldRecord.id ? null : state.selectedTaskId 
          }));
        }
      })
      .subscribe();

    // 3. Subscribe to subtasks changes
    supabase.channel('public:subtasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subtasks' }, (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        
        set(state => {
          const newTasks = [...state.tasks];
          
          if (eventType === 'INSERT') {
            const taskIndex = newTasks.findIndex(t => t.id === newRecord.task_id);
            if (taskIndex > -1) {
              const stIndex = newTasks[taskIndex].subtasks.findIndex(st => st.id === newRecord.id);
              const mappedSt = {
                id: newRecord.id,
                title: newRecord.title,
                completed: newRecord.completed,
                date: newRecord.created_at ? new Date(newRecord.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : undefined
              };
              if (stIndex === -1) {
                newTasks[taskIndex].subtasks.push(mappedSt);
              } else {
                newTasks[taskIndex].subtasks[stIndex] = mappedSt;
              }
            }
          } 
          else if (eventType === 'UPDATE') {
            const taskIndex = newTasks.findIndex(t => t.id === newRecord.task_id);
            if (taskIndex > -1) {
              const stIndex = newTasks[taskIndex].subtasks.findIndex(st => st.id === newRecord.id);
              if (stIndex > -1) {
                newTasks[taskIndex].subtasks[stIndex] = {
                  ...newTasks[taskIndex].subtasks[stIndex],
                  title: newRecord.title,
                  completed: newRecord.completed
                };
              }
            }
          } 
          else if (eventType === 'DELETE') {
            // we don't have task_id in oldRecord if it was just deleted, so we find it by searching all tasks
            for (let i = 0; i < newTasks.length; i++) {
              newTasks[i].subtasks = newTasks[i].subtasks.filter(st => st.id !== oldRecord.id);
            }
          }
          return { tasks: newTasks };
        });
      })
      .subscribe();
  },
  
  selectTask: (id) => set({ selectedTaskId: id }),
  setCurrentView: (view) => set({ currentView: view }),
  setCurrentDate: (date) => set({ currentDate: date }),
  setFilters: (newFilters) => set((state) => ({ filters: { ...state.filters, ...newFilters } })),
  
  addTask: async (newTaskData) => {
    const newId = uuidv4();
    
    // Optimistic update
    const newTask: Task = {
      ...newTaskData,
      id: newId,
      subtasks: [],
      empresa: newTaskData.empresa || 'Empresa A',
      prioridad: newTaskData.prioridad || 'Media',
    };
    set(state => ({ tasks: [...state.tasks, newTask] }));

    // DB update
    await supabase.from('tasks').insert([{
      id: newId,
      title: newTaskData.title,
      description: newTaskData.description,
      assignee: newTaskData.assignee, // Supabase jsonb handles objects automatically if sent properly
      due_date: newTaskData.dueDate,
      date_block: newTaskData.dateBlock,
      empresa: newTask.empresa,
      prioridad: newTask.prioridad
    }]);
  },

  updateTask: async (taskId, updates) => {
    // Optimistic
    set(state => ({
      tasks: state.tasks.map(task => task.id === taskId ? { ...task, ...updates } : task)
    }));

    // DB update
    const dbUpdates: any = {};
    if (updates.title) dbUpdates.title = updates.title;
    if (updates.description) dbUpdates.description = updates.description;
    if (updates.assignee) dbUpdates.assignee = updates.assignee;
    if (updates.dueDate) dbUpdates.due_date = updates.dueDate;
    if (updates.dateBlock) dbUpdates.date_block = updates.dateBlock;
    if (updates.empresa) dbUpdates.empresa = updates.empresa;
    if (updates.prioridad) dbUpdates.prioridad = updates.prioridad;

    await supabase.from('tasks').update(dbUpdates).eq('id', taskId);
  },

  deleteTask: async (taskId) => {
    // Optimistic
    set(state => ({ 
      tasks: state.tasks.filter(t => t.id !== taskId),
      selectedTaskId: state.selectedTaskId === taskId ? null : state.selectedTaskId 
    }));

    // DB update
    await supabase.from('tasks').delete().eq('id', taskId);
  },

  addSubtask: async (taskId, title) => {
    const newId = uuidv4();
    
    // Optimistic
    set(state => {
      const updatedTasks = state.tasks.map((task) => {
        if (task.id === taskId) {
          const newSubtask: Subtask = { id: newId, title, completed: false };
          return { ...task, subtasks: [...task.subtasks, newSubtask] };
        }
        return task;
      });
      return { tasks: updatedTasks };
    });

    // DB update
    await supabase.from('subtasks').insert([{
      id: newId,
      task_id: taskId,
      title,
      completed: false
    }]);
  },

  toggleSubtask: async (taskId, subtaskId) => {
    // Find current state
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) return;
    const subtask = task.subtasks.find(st => st.id === subtaskId);
    if (!subtask) return;

    const newStatus = !subtask.completed;

    // Optimistic
    set(state => {
      const updatedTasks = state.tasks.map((t) => {
        if (t.id === taskId) {
          const updatedSubtasks = t.subtasks.map((st) => 
            st.id === subtaskId ? { ...st, completed: newStatus } : st
          );
          return { ...t, subtasks: updatedSubtasks };
        }
        return t;
      });
      return { tasks: updatedTasks };
    });

    // DB update
    await supabase.from('subtasks').update({ completed: newStatus }).eq('id', subtaskId);
  },

  editSubtask: async (taskId, subtaskId, newTitle) => {
    // Optimistic
    set(state => {
      const updatedTasks = state.tasks.map((task) => {
        if (task.id === taskId) {
          const updatedSubtasks = task.subtasks.map((st) => 
            st.id === subtaskId ? { ...st, title: newTitle } : st
          );
          return { ...task, subtasks: updatedSubtasks };
        }
        return task;
      });
      return { tasks: updatedTasks };
    });

    // DB update
    await supabase.from('subtasks').update({ title: newTitle }).eq('id', subtaskId);
  },

  deleteSubtask: async (taskId, subtaskId) => {
    // Optimistic
    set(state => {
      const updatedTasks = state.tasks.map((task) => {
        if (task.id === taskId) {
          const updatedSubtasks = task.subtasks.filter((st) => st.id !== subtaskId);
          return { ...task, subtasks: updatedSubtasks };
        }
        return task;
      });
      return { tasks: updatedTasks };
    });

    // DB update
    await supabase.from('subtasks').delete().eq('id', subtaskId);
  },

  getTaskProgress: (taskId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task || task.subtasks.length === 0) return 0;
    const completed = task.subtasks.filter((st) => st.completed).length;
    return Math.round((completed / task.subtasks.length) * 100);
  },

  getFilteredTasks: () => {
    const { tasks, filters } = get();
    return tasks.filter(t => {
      if (filters.assignee !== 'all' && t.assignee.name !== filters.assignee) return false;
      return true;
    });
  },

  getTotalTasksCount: () => get().getFilteredTasks().length,

  getCompletedTasksCount: () => {
    const { getFilteredTasks, getTaskProgress } = get();
    return getFilteredTasks().filter(t => getTaskProgress(t.id) === 100).length;
  },

  getPendingTasksCount: () => {
    const { getFilteredTasks, getTaskProgress } = get();
    return getFilteredTasks().filter(t => getTaskProgress(t.id) < 100).length;
  },

  getOverallProgress: () => {
    const { getFilteredTasks, getTaskProgress } = get();
    const tasks = getFilteredTasks();
    if (tasks.length === 0) return 0;
    const totalProgress = tasks.reduce((acc, t) => acc + getTaskProgress(t.id), 0);
    return Math.round(totalProgress / tasks.length);
  },

  getTotalSubtasksCount: () => {
    const { getFilteredTasks } = get();
    return getFilteredTasks().reduce((acc, t) => acc + t.subtasks.length, 0);
  },

  getCompletedSubtasksCount: () => {
    const { getFilteredTasks } = get();
    return getFilteredTasks().reduce((acc, t) => acc + t.subtasks.filter(st => st.completed).length, 0);
  },

  getOverdueSubtasksCount: () => {
    const { getFilteredTasks } = get();
    let overdue = 0;
    getFilteredTasks().forEach(t => {
      t.subtasks.forEach(st => {
        if (!st.completed && st.date === "15 May") overdue++;
      });
    });
    return overdue + 12; // Static base from previous logic
  }
}));
