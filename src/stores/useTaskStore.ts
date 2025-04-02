import { create } from 'zustand'

export interface Task {
  id: string
  title: string
  startDate: Date
  endDate: Date
  description?: string
  status: 'todo' | 'in-progress' | 'completed'
  color?: string
}

interface TaskStore {
  tasks: Task[]
  addTask: (task: Omit<Task, 'id'>) => void
  updateTask: (id: string, updates: Partial<Omit<Task, 'id'>>) => void
  deleteTask: (id: string) => void
}

const useTaskStore = create<TaskStore>((set) => ({
  tasks: [
    {
      id: '1',
      title: 'Conception du projet',
      startDate: new Date(2023, 9, 1),
      endDate: new Date(2023, 9, 5),
      status: 'completed',
      color: '#4caf50'
    },
    {
      id: '2',
      title: 'Développement frontend',
      startDate: new Date(2023, 9, 6),
      endDate: new Date(2023, 9, 15),
      status: 'in-progress',
      color: '#2196f3'
    },
    {
      id: '3',
      title: 'Tests et déploiement',
      startDate: new Date(2023, 9, 16),
      endDate: new Date(2023, 9, 20),
      status: 'todo',
      color: '#ff9800'
    }
  ],
  
  addTask: (task) => set((state) => ({
    tasks: [...state.tasks, { ...task, id: crypto.randomUUID() }]
  })),
  
  updateTask: (id, updates) => set((state) => ({
    tasks: state.tasks.map(task => 
      task.id === id ? { ...task, ...updates } : task
    )
  })),
  
  deleteTask: (id) => set((state) => ({
    tasks: state.tasks.filter(task => task.id !== id)
  }))
}))

export default useTaskStore 