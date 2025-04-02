import { create } from 'zustand';
import { Timer, TimerType, TimerStatus, timerService } from '../services/timerService';
import useAuthStore from './useAuthStore';

interface TimerStore {
  timers: Timer[];
  activeTimer: Timer | null;
  isLoading: boolean;
  error: string | null;
  
  // Fetch actions
  fetchActiveTimers: () => Promise<Timer[]>;
  fetchBreakTimers: () => Promise<Timer[]>;
  fetchTimerById: (id: number) => Promise<Timer | null>;
  fetchAllTimers: () => Promise<Timer[]>;
  fetchTimersForTask: (taskId: number) => Promise<Timer[]>;
  
  // Manage timer actions
  createTimer: (timer: Omit<Timer, 'id' | 'createdAt' | 'status'>) => Promise<Timer | null>;
  pauseTimer: (id: number) => Promise<Timer | null>;
  resumeTimer: (id: number) => Promise<Timer | null>;
  stopTimer: (id: number) => Promise<Timer | null>;
  deleteTimer: (id: number) => Promise<void>;
  
  // Helper actions
  setActiveTimer: (timer: Timer | null) => void;
  clearError: () => void;
}

const useTimerStore = create<TimerStore>((set, get) => ({
  timers: [],
  activeTimer: null,
  isLoading: false,
  error: null,
  
  fetchActiveTimers: async () => {
    const { token } = useAuthStore.getState();
    if (!token) {
      set({ error: 'No authentication token available' });
      return [];
    }
    
    try {
      set({ isLoading: true, error: null });
      const timers = await timerService.getActiveTimers(token);
      set({ timers, isLoading: false });
      return timers;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch active timers',
        isLoading: false
      });
      return [];
    }
  },
  
  fetchBreakTimers: async () => {
    const { token } = useAuthStore.getState();
    if (!token) {
      set({ error: 'No authentication token available' });
      return [];
    }
    
    try {
      set({ isLoading: true, error: null });
      const timers = await timerService.getBreakTimers(token);
      set({ isLoading: false });
      return timers;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch break timers',
        isLoading: false
      });
      return [];
    }
  },
  
  fetchTimerById: async (id: number) => {
    const { token } = useAuthStore.getState();
    if (!token) {
      set({ error: 'No authentication token available' });
      return null;
    }
    
    try {
      set({ isLoading: true, error: null });
      const timer = await timerService.getTimerById(token, id);
      set({ isLoading: false });
      return timer;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch timer',
        isLoading: false
      });
      return null;
    }
  },
  
  fetchAllTimers: async () => {
    const { token } = useAuthStore.getState();
    if (!token) {
      set({ error: 'No authentication token available' });
      return [];
    }
    
    try {
      set({ isLoading: true, error: null });
      const timers = await timerService.getAllTimers(token);
      set({ timers, isLoading: false });
      return timers;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch all timers',
        isLoading: false
      });
      return [];
    }
  },
  
  fetchTimersForTask: async (taskId: number) => {
    const { token } = useAuthStore.getState();
    if (!token) {
      set({ error: 'No authentication token available' });
      return [];
    }
    
    try {
      set({ isLoading: true, error: null });
      const timers = await timerService.getTimersForTask(token, taskId);
      set({ isLoading: false });
      return timers;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch timers for task',
        isLoading: false
      });
      return [];
    }
  },
  
  createTimer: async (timer) => {
    const { token } = useAuthStore.getState();
    if (!token) {
      set({ error: 'No authentication token available' });
      return null;
    }
    
    try {
      set({ isLoading: true, error: null });
      const newTimer = await timerService.createTimer(token, timer);
      set(state => ({
        timers: [...state.timers, newTimer],
        activeTimer: newTimer,
        isLoading: false
      }));
      return newTimer;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create timer',
        isLoading: false
      });
      return null;
    }
  },
  
  pauseTimer: async (id: number) => {
    const { token } = useAuthStore.getState();
    if (!token) {
      set({ error: 'No authentication token available' });
      return null;
    }
    
    try {
      set({ isLoading: true, error: null });
      const updatedTimer = await timerService.pauseTimer(token, id);
      set(state => ({
        timers: state.timers.map(t => t.id === id ? updatedTimer : t),
        activeTimer: state.activeTimer?.id === id ? updatedTimer : state.activeTimer,
        isLoading: false
      }));
      return updatedTimer;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to pause timer',
        isLoading: false
      });
      return null;
    }
  },
  
  resumeTimer: async (id: number) => {
    const { token } = useAuthStore.getState();
    if (!token) {
      set({ error: 'No authentication token available' });
      return null;
    }
    
    try {
      set({ isLoading: true, error: null });
      const updatedTimer = await timerService.resumeTimer(token, id);
      set(state => ({
        timers: state.timers.map(t => t.id === id ? updatedTimer : t),
        activeTimer: state.activeTimer?.id === id ? updatedTimer : state.activeTimer,
        isLoading: false
      }));
      return updatedTimer;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to resume timer',
        isLoading: false
      });
      return null;
    }
  },
  
  stopTimer: async (id: number) => {
    const { token } = useAuthStore.getState();
    if (!token) {
      set({ error: 'No authentication token available' });
      return null;
    }
    
    try {
      set({ isLoading: true, error: null });
      const updatedTimer = await timerService.stopTimer(token, id);
      set(state => ({
        timers: state.timers.map(t => t.id === id ? updatedTimer : t),
        activeTimer: state.activeTimer?.id === id ? updatedTimer : state.activeTimer,
        isLoading: false
      }));
      return updatedTimer;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to stop timer',
        isLoading: false
      });
      return null;
    }
  },
  
  deleteTimer: async (id: number) => {
    const { token } = useAuthStore.getState();
    if (!token) {
      set({ error: 'No authentication token available' });
      return;
    }
    
    try {
      set({ isLoading: true, error: null });
      await timerService.deleteTimer(token, id);
      set(state => ({
        timers: state.timers.filter(t => t.id !== id),
        activeTimer: state.activeTimer?.id === id ? null : state.activeTimer,
        isLoading: false
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete timer',
        isLoading: false
      });
    }
  },
  
  setActiveTimer: (timer: Timer | null) => {
    set({ activeTimer: timer });
  },
  
  clearError: () => set({ error: null })
}));

export default useTimerStore; 