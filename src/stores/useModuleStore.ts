import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { moduleService, Module as ApiModule } from '../services/moduleService'
import useAuthStore from './useAuthStore'

export interface Module {
  id: number | string;
  name: string;
  description?: string;
  createdAt: Date;
  taskIds: number[];
}

export interface DocFile {
  id: string;
  moduleId: string;
  name: string;
  type: string;
  content?: string;
  url?: string;
  createdAt: Date;
}

export interface Note {
  id: string;
  moduleId: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Video {
  id: string;
  moduleId: string;
  title: string;
  url: string;
  thumbnailUrl?: string;
  description?: string;
  createdAt: Date;
}

interface ModuleStore {
  modules: Module[];
  documents: DocFile[];
  notes: Note[];
  videos: Video[];
  isLoading: boolean;
  error: string | null;
  
  fetchModules: () => Promise<void>;
  addModule: (name: string, description?: string, taskIds?: number[]) => Promise<Module | null>;
  updateModule: (id: number | string, name: string, description?: string, taskIds?: number[]) => Promise<void>;
  deleteModule: (id: number | string) => Promise<void>;
  
  addDocument: (moduleId: string, name: string, type: string, content?: string, url?: string) => void;
  deleteDocument: (id: string) => void;
  
  addNote: (moduleId: string, title: string, content: string) => Note;
  updateNote: (id: string, title: string, content: string) => void;
  deleteNote: (id: string) => void;
  
  addVideo: (moduleId: string, title: string, url: string, thumbnailUrl?: string, description?: string) => void;
  updateVideo: (id: string, updates: Partial<Omit<Video, 'id' | 'moduleId' | 'createdAt'>>) => void;
  deleteVideo: (id: string) => void;
}

// Helper function to convert API module to store module
const apiToStoreModule = (apiModule: ApiModule): Module => ({
  id: apiModule.id || '',
  name: apiModule.name,
  description: apiModule.description,
  taskIds: apiModule.taskIds,
  createdAt: new Date()
});

const useModuleStore = create<ModuleStore>()(
  persist(
    (set, get) => ({
      modules: [],
      documents: [],
      notes: [],
      videos: [],
      isLoading: false,
      error: null,
      
      fetchModules: async () => {
        const authStore = useAuthStore.getState();
        if (!authStore.token) {
          set({ error: 'No authentication token available' });
          return;
        }
        
        try {
          set({ isLoading: true, error: null });
          const apiModules = await moduleService.getAll(authStore.token);
          const storeModules = apiModules.map(apiToStoreModule);
          
          set({ modules: storeModules, isLoading: false });
        } catch (error) {
          console.error('Failed to fetch modules:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch modules', 
            isLoading: false 
          });
        }
      },
      
      addModule: async (name, description, taskIds = []) => {
        const authStore = useAuthStore.getState();
        if (!authStore.token) {
          set({ error: 'No authentication token available' });
          return null;
        }
        
        try {
          set({ isLoading: true, error: null });
          const newApiModule = await moduleService.create(authStore.token, {
            name,
            description: description || '',
            taskIds: taskIds || []
          });
          
          const newModule = apiToStoreModule(newApiModule);
          
          set((state) => ({
            modules: [...state.modules, newModule],
            isLoading: false
          }));
          
          return newModule;
        } catch (error) {
          console.error('Failed to create module:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create module', 
            isLoading: false 
          });
          return null;
        }
      },
      
      updateModule: async (id, name, description, taskIds = []) => {
        const authStore = useAuthStore.getState();
        if (!authStore.token) {
          set({ error: 'No authentication token available' });
          return;
        }
        
        try {
          set({ isLoading: true, error: null });
          const module = get().modules.find(m => m.id === id);
          
          if (!module) {
            throw new Error('Module not found');
          }
          
          const updatedApiModule = await moduleService.update(authStore.token, module.name, {
            name,
            description: description || '',
            taskIds: taskIds || module.taskIds || []
          });
          
          const updatedModule = apiToStoreModule(updatedApiModule);
          
          set((state) => ({
            modules: state.modules.map(m => m.id === id ? updatedModule : m),
            isLoading: false
          }));
        } catch (error) {
          console.error('Failed to update module:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update module', 
            isLoading: false 
          });
        }
      },
      
      deleteModule: async (id) => {
        const authStore = useAuthStore.getState();
        if (!authStore.token) {
          set({ error: 'No authentication token available' });
          return;
        }
        
        try {
          set({ isLoading: true, error: null });
          const module = get().modules.find(m => m.id === id);
          
          if (!module) {
            throw new Error('Module not found');
          }
          
          await moduleService.delete(authStore.token, module.name);
          
          set((state) => ({
            modules: state.modules.filter(module => module.id !== id),
            documents: state.documents.filter(doc => doc.moduleId !== id),
            notes: state.notes.filter(note => note.moduleId !== id),
            videos: state.videos.filter(video => video.moduleId !== id),
            isLoading: false
          }));
        } catch (error) {
          console.error('Failed to delete module:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete module', 
            isLoading: false 
          });
        }
      },
      
      addDocument: (moduleId, name, type, content, url) => {
        set((state) => ({
          documents: [
            ...state.documents,
            {
              id: crypto.randomUUID(),
              moduleId,
              name,
              type,
              content,
              url,
              createdAt: new Date()
            }
          ]
        }));
      },
      
      deleteDocument: (id) => {
        set((state) => ({
          documents: state.documents.filter(doc => doc.id !== id)
        }));
      },
      
      addNote: (moduleId, title, content) => {
        const now = new Date();
        const newNote = {
          id: crypto.randomUUID(),
          moduleId,
          title,
          content,
          createdAt: now,
          updatedAt: now
        };
        
        set((state) => ({
          notes: [...state.notes, newNote]
        }));
        
        return newNote;
      },
      
      updateNote: (id, title, content) => {
        set((state) => ({
          notes: state.notes.map(note => 
            note.id === id 
              ? { ...note, title, content, updatedAt: new Date() } 
              : note
          )
        }));
      },
      
      deleteNote: (id) => {
        set((state) => ({
          notes: state.notes.filter(note => note.id !== id)
        }));
      },
      
      addVideo: (moduleId, title, url, thumbnailUrl, description) => {
        set((state) => ({
          videos: [
            ...state.videos,
            {
              id: crypto.randomUUID(),
              moduleId,
              title,
              url,
              thumbnailUrl: thumbnailUrl || getYouTubeThumbnail(url),
              description,
              createdAt: new Date()
            }
          ]
        }));
      },
      
      updateVideo: (id, updates) => {
        set((state) => ({
          videos: state.videos.map(video => 
            video.id === id 
              ? { ...video, ...updates } 
              : video
          )
        }));
      },
      
      deleteVideo: (id) => {
        set((state) => ({
          videos: state.videos.filter(video => video.id !== id)
        }));
      }
    }),
    {
      name: 'module-storage'
    }
  )
);

function getYouTubeThumbnail(url: string): string {
  try {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    if (match && match[2].length === 11) {
      return `https://img.youtube.com/vi/${match[2]}/0.jpg`;
    }
    
    return 'https://via.placeholder.com/320x180.png?text=Video';
  } catch (error) {
    return 'https://via.placeholder.com/320x180.png?text=Video';
  }
}

export default useModuleStore; 