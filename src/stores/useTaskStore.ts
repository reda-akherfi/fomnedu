import { create } from 'zustand'
import { taskService, Task, TaskStatus, TaskPriority } from '../services/taskService'
import useAuthStore from './useAuthStore'

interface TaskStore {
  tasks: Task[]
  isLoading: boolean
  error: string | null
  
  fetchAllTasks: () => Promise<void>
  fetchTaskById: (id: number) => Promise<Task | null>
  fetchTasksByStatus: (status: TaskStatus) => Promise<void>
  fetchTasksByPriority: (priority: TaskPriority) => Promise<void>
  fetchOverdueTasks: () => Promise<void>
  fetchTasksByBatchIds: (ids: number[]) => Promise<Task[]>
  
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Task | null>
  updateTask: (id: number, task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Task | null>
  deleteTask: (id: number) => Promise<void>
}

const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,
  
  fetchAllTasks: async () => {
    const authStore = useAuthStore.getState()
    if (!authStore.token) {
      set({ error: 'No authentication token available' })
      return
    }
    
    try {
      set({ isLoading: true, error: null })
      const tasks = await taskService.getAllTasks(authStore.token)
      set({ tasks, isLoading: false })
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch tasks',
        isLoading: false
      })
    }
  },
  
  fetchTaskById: async (id: number) => {
    const authStore = useAuthStore.getState()
    if (!authStore.token) {
      set({ error: 'No authentication token available' })
      return null
    }
    
    try {
      set({ isLoading: true, error: null })
      const task = await taskService.getTaskById(authStore.token, id)
      set({ isLoading: false })
      return task
    } catch (error) {
      console.error(`Failed to fetch task with ID ${id}:`, error)
      set({
        error: error instanceof Error ? error.message : `Failed to fetch task with ID ${id}`,
        isLoading: false
      })
      return null
    }
  },
  
  fetchTasksByStatus: async (status: TaskStatus) => {
    const authStore = useAuthStore.getState()
    if (!authStore.token) {
      set({ error: 'No authentication token available' })
      return
    }
    
    try {
      set({ isLoading: true, error: null })
      const tasks = await taskService.getTasksByStatus(authStore.token, status)
      set({ tasks, isLoading: false })
    } catch (error) {
      console.error(`Failed to fetch ${status} tasks:`, error)
      set({
        error: error instanceof Error ? error.message : `Failed to fetch ${status} tasks`,
        isLoading: false
      })
    }
  },
  
  fetchTasksByPriority: async (priority: TaskPriority) => {
    const authStore = useAuthStore.getState()
    if (!authStore.token) {
      set({ error: 'No authentication token available' })
      return
    }
    
    try {
      set({ isLoading: true, error: null })
      const tasks = await taskService.getTasksByPriority(authStore.token, priority)
      set({ tasks, isLoading: false })
    } catch (error) {
      console.error(`Failed to fetch ${priority} priority tasks:`, error)
      set({
        error: error instanceof Error ? error.message : `Failed to fetch ${priority} priority tasks`,
        isLoading: false
      })
    }
  },
  
  fetchOverdueTasks: async () => {
    const authStore = useAuthStore.getState()
    if (!authStore.token) {
      set({ error: 'No authentication token available' })
      return
    }
    
    try {
      set({ isLoading: true, error: null })
      const tasks = await taskService.getOverdueTasks(authStore.token)
      set({ tasks, isLoading: false })
    } catch (error) {
      console.error('Failed to fetch overdue tasks:', error)
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch overdue tasks',
        isLoading: false
      })
    }
  },
  
  fetchTasksByBatchIds: async (ids: number[]) => {
    const authStore = useAuthStore.getState()
    if (!authStore.token) {
      set({ error: 'No authentication token available' })
      return []
    }
    
    if (ids.length === 0) {
      return []
    }
    
    try {
      set({ isLoading: true, error: null })
      const tasks = await taskService.getTasksByBatchIds(authStore.token, ids)
      set({ isLoading: false })
      return tasks
    } catch (error) {
      console.error('Failed to fetch tasks by batch IDs:', error)
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch tasks by batch IDs',
        isLoading: false
      })
      return []
    }
  },
  
  addTask: async (task) => {
    const authStore = useAuthStore.getState()
    if (!authStore.token) {
      set({ error: 'No authentication token available' })
      return null
    }
    
    try {
      set({ isLoading: true, error: null })
      const newTask = await taskService.createTask(authStore.token, task)
      set(state => ({
        tasks: [...state.tasks, newTask],
        isLoading: false
      }))
      return newTask
    } catch (error) {
      console.error('Failed to create task:', error)
      set({
        error: error instanceof Error ? error.message : 'Failed to create task',
        isLoading: false
      })
      return null
    }
  },
  
  updateTask: async (id, task) => {
    const authStore = useAuthStore.getState()
    if (!authStore.token) {
      set({ error: 'No authentication token available' })
      return null
    }
    
    try {
      set({ isLoading: true, error: null })
      const updatedTask = await taskService.updateTask(authStore.token, id, task)
      set(state => ({
        tasks: state.tasks.map(t => t.id === id ? updatedTask : t),
        isLoading: false
      }))
      return updatedTask
    } catch (error) {
      console.error(`Failed to update task with ID ${id}:`, error)
      set({
        error: error instanceof Error ? error.message : `Failed to update task with ID ${id}`,
        isLoading: false
      })
      return null
    }
  },
  
  deleteTask: async (id) => {
    const authStore = useAuthStore.getState()
    if (!authStore.token) {
      set({ error: 'No authentication token available' })
      return
    }
    
    try {
      set({ isLoading: true, error: null })
      await taskService.deleteTask(authStore.token, id)
      set(state => ({
        tasks: state.tasks.filter(task => task.id !== id),
        isLoading: false
      }))
    } catch (error) {
      console.error(`Failed to delete task with ID ${id}:`, error)
      set({
        error: error instanceof Error ? error.message : `Failed to delete task with ID ${id}`,
        isLoading: false
      })
    }
  }
}))

export default useTaskStore 