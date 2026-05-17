import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MOCK_TASKS, Task, Subtask } from '../data/mockData';

interface DashboardState {
  tasks: Task[];
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
  
  selectTask: (id: string | null) => void;
  setCurrentView: (view: 'dashboard' | 'timeline' | 'calendar') => void;
  setCurrentDate: (date: string) => void;
  setFilters: (filters: Partial<DashboardState['filters']>) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  
  // Modifying tasks
  addTask: (task: Omit<Task, 'id' | 'subtasks'>) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  addSubtask: (taskId: string, title: string) => void;
  
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

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      tasks: MOCK_TASKS, // Init with mock data, but persist will overwrite if local storage exists
      selectedTaskId: null,
      currentView: 'timeline', // Default view based on the mockups
      currentDate: "2026-05-16", // Default mock date
      filters: { assignee: 'all', status: 'all', search: '', empresa: 'all', prioridad: 'all' },
      
      selectTask: (id) => set({ selectedTaskId: id }),
      setCurrentView: (view) => set({ currentView: view }),
      setCurrentDate: (date) => set({ currentDate: date }),
      setFilters: (newFilters) => set((state) => ({ filters: { ...state.filters, ...newFilters } })),
      
      toggleSubtask: (taskId, subtaskId) => set((state) => {
        const updatedTasks = state.tasks.map((task) => {
          if (task.id === taskId) {
            const updatedSubtasks = task.subtasks.map((st) => 
              st.id === subtaskId ? { ...st, completed: !st.completed } : st
            );
            return { ...task, subtasks: updatedSubtasks };
          }
          return task;
        });
        return { tasks: updatedTasks };
      }),

      addTask: (newTaskData) => set((state) => {
        const newTask: Task = {
          ...newTaskData,
          id: `t-${Date.now()}`,
          subtasks: [],
          empresa: newTaskData.empresa || 'Empresa A',
          prioridad: newTaskData.prioridad || 'Media',
        };
        return { tasks: [...state.tasks, newTask] };
      }),

      updateTask: (taskId, updates) => set((state) => {
        const updatedTasks = state.tasks.map(task => 
          task.id === taskId ? { ...task, ...updates } : task
        );
        return { tasks: updatedTasks };
      }),

      deleteTask: (taskId) => set((state) => {
        return { 
          tasks: state.tasks.filter(t => t.id !== taskId),
          selectedTaskId: state.selectedTaskId === taskId ? null : state.selectedTaskId 
        };
      }),

      addSubtask: (taskId, title) => set((state) => {
        const updatedTasks = state.tasks.map((task) => {
          if (task.id === taskId) {
            const newSubtask: Subtask = {
              id: `st-${Date.now()}`,
              title,
              completed: false,
              date: "16 May" // Default logic for mockup
            };
            return { ...task, subtasks: [...task.subtasks, newSubtask] };
          }
          return task;
        });
        return { tasks: updatedTasks };
      }),

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
          // You can add more filters here later if needed (e.g. status, search)
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
        return overdue + 12; 
      }
    }),
    {
      name: 'dashboard-storage', // name of the item in the storage (must be unique)
      partialize: (state) => ({ tasks: state.tasks, currentView: state.currentView, currentDate: state.currentDate, filters: state.filters }), // save these states
    }
  )
);
