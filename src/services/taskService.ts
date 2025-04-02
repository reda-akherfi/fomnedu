const API_URL = 'http://localhost:8080/api/tasks';

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export interface Task {
  id?: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  createdAt?: string;
  updatedAt?: string;
}

export const taskService = {
  async getAllTasks(token: string): Promise<Task[]> {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch tasks');
    }
    
    return response.json();
  },
  
  async getTaskById(token: string, id: number): Promise<Task> {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch task');
    }
    
    return response.json();
  },
  
  async getTasksByStatus(token: string, status: TaskStatus): Promise<Task[]> {
    const response = await fetch(`${API_URL}/status/${status}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to fetch ${status} tasks`);
    }
    
    return response.json();
  },
  
  async getTasksByPriority(token: string, priority: TaskPriority): Promise<Task[]> {
    const response = await fetch(`${API_URL}/priority/${priority}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to fetch ${priority} priority tasks`);
    }
    
    return response.json();
  },
  
  async getOverdueTasks(token: string): Promise<Task[]> {
    const response = await fetch(`${API_URL}/overdue`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch overdue tasks');
    }
    
    return response.json();
  },
  
  async getTasksByBatchIds(token: string, ids: number[]): Promise<Task[]> {
    const idsParam = ids.join(',');
    const response = await fetch(`${API_URL}/batch?ids=${idsParam}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch tasks by batch IDs');
    }
    
    return response.json();
  },
  
  async createTask(token: string, task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(task)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create task');
    }
    
    return response.json();
  },
  
  async updateTask(token: string, id: number, task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(task)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update task');
    }
    
    return response.json();
  },
  
  async deleteTask(token: string, id: number): Promise<void> {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete task');
    }
  }
}; 