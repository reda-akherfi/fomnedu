import { create } from 'zustand';
import { Note, noteService } from '../services/noteService';

interface NoteStore {
  notes: Note[];
  isLoading: boolean;
  error: string | null;
  
  // Fetch actions
  fetchAllNotes: (token: string) => Promise<void>;
  fetchNotesForTask: (token: string, taskId: number) => Promise<Note[]>;
  fetchNote: (token: string, id: number) => Promise<Note | null>;
  
  // Mutate actions
  addNote: (token: string, title: string, content: string, taskIds?: number[]) => Promise<Note | null>;
  updateNote: (token: string, id: number, title: string, content: string, taskIds?: number[]) => Promise<void>;
  deleteNote: (token: string, id: number) => Promise<void>;
  
  // Helper actions
  clearError: () => void;
}

const useNoteStore = create<NoteStore>((set, get) => ({
  notes: [],
  isLoading: false,
  error: null,
  
  fetchAllNotes: async (token: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const notes = await noteService.getAllNotes(token);
      set({ notes, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
  
  fetchNotesForTask: async (token: string, taskId: number) => {
    set({ isLoading: true, error: null });
    
    try {
      const notes = await noteService.getNotesForTask(token, taskId);
      return notes;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      return [];
    } finally {
      set({ isLoading: false });
    }
  },
  
  fetchNote: async (token: string, id: number) => {
    set({ isLoading: true, error: null });
    
    try {
      const note = await noteService.getNote(token, id);
      set({ isLoading: false });
      return note;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      return null;
    }
  },
  
  addNote: async (token: string, title: string, content: string, taskIds?: number[]) => {
    set({ isLoading: true, error: null });
    
    try {
      const newNote = await noteService.createNote(token, {
        title,
        content,
        taskIds
      });
      
      set(state => ({ 
        notes: [...state.notes, newNote],
        isLoading: false 
      }));
      
      return newNote;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      return null;
    }
  },
  
  updateNote: async (token: string, id: number, title: string, content: string, taskIds?: number[]) => {
    set({ isLoading: true, error: null });
    
    try {
      const updatedNote = await noteService.updateNote(token, id, {
        title,
        content,
        taskIds
      });
      
      set(state => ({ 
        notes: state.notes.map(note => note.id === id ? updatedNote : note),
        isLoading: false 
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
  
  deleteNote: async (token: string, id: number) => {
    set({ isLoading: true, error: null });
    
    try {
      await noteService.deleteNote(token, id);
      
      set(state => ({ 
        notes: state.notes.filter(note => note.id !== id),
        isLoading: false 
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
  
  clearError: () => set({ error: null })
}));

export default useNoteStore; 