const API_URL = 'http://localhost:8080/api/timer';

export enum TimerType {
  STOPWATCH = 'STOPWATCH',
  COUNTDOWN = 'COUNTDOWN',
  POMODORO = 'POMODORO'
}

export enum TimerStatus {
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED'
}

export interface Timer {
  id?: number;
  userId?: string;
  taskIds?: number[];
  title?: string;
  timerType: TimerType;
  durationSeconds?: number;
  remainingSeconds?: number;
  startTime?: string;
  isPaused?: boolean;
  isCompleted?: boolean;
  isBreak?: boolean;
  status?: TimerStatus;
  createdAt?: string;
}

export const timerService = {
  async createTimer(token: string, timer: Timer): Promise<Timer> {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(timer)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create timer');
    }
    
    return response.json();
  },
  
  async getActiveTimers(token: string): Promise<Timer[]> {
    const response = await fetch(`${API_URL}/active`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get active timers');
    }
    
    return response.json();
  },
  
  async getBreakTimers(token: string): Promise<Timer[]> {
    const response = await fetch(`${API_URL}/breaks`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get break timers');
    }
    
    return response.json();
  },
  
  async getTimerById(token: string, id: number): Promise<Timer> {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get timer');
    }
    
    return response.json();
  },
  
  async getAllTimers(token: string): Promise<Timer[]> {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get all timers');
    }
    
    return response.json();
  },
  
  async getTimersForTask(token: string, taskId: number): Promise<Timer[]> {
    const response = await fetch(`${API_URL}/task/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get timers for task');
    }
    
    return response.json();
  },
  
  async pauseTimer(token: string, id: number): Promise<Timer> {
    const response = await fetch(`${API_URL}/${id}/pause`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to pause timer');
    }
    
    return response.json();
  },
  
  async resumeTimer(token: string, id: number): Promise<Timer> {
    const response = await fetch(`${API_URL}/${id}/resume`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to resume timer');
    }
    
    return response.json();
  },
  
  async stopTimer(token: string, id: number): Promise<Timer> {
    const response = await fetch(`${API_URL}/${id}/stop`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to stop timer');
    }
    
    return response.json();
  },
  
  async deleteTimer(token: string, id: number): Promise<void> {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete timer');
    }
  }
}; 