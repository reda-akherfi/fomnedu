import { create } from 'zustand';
import { Document, documentService } from '../services/documentService';

interface DocumentStore {
  documents: Document[];
  isLoading: boolean;
  error: string | null;
  
  // Fetch actions
  fetchAllDocuments: (token: string) => Promise<void>;
  fetchDocumentsForTask: (token: string, taskId: number) => Promise<Document[]>;
  
  // Mutate actions
  uploadDocument: (token: string, file: File, taskIds?: number[]) => Promise<Document>;
  deleteDocument: (token: string, id: string) => Promise<void>;
  
  // Helper actions
  clearError: () => void;
}

const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: [],
  isLoading: false,
  error: null,
  
  fetchAllDocuments: async (token: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const documents = await documentService.getAllDocuments(token);
      set({ documents, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
  
  fetchDocumentsForTask: async (token: string, taskId: number) => {
    set({ isLoading: true, error: null });
    
    try {
      const documents = await documentService.getDocumentsForTask(token, taskId);
      return documents;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      return [];
    } finally {
      set({ isLoading: false });
    }
  },
  
  uploadDocument: async (token: string, file: File, taskIds?: number[]) => {
    set({ isLoading: true, error: null });
    
    try {
      const newDocument = await documentService.uploadDocument(token, file, taskIds);
      set(state => ({ 
        documents: [...state.documents, newDocument],
        isLoading: false 
      }));
      return newDocument;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },
  
  deleteDocument: async (token: string, id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      await documentService.deleteDocument(token, id);
      set(state => ({ 
        documents: state.documents.filter(doc => doc.id !== id),
        isLoading: false 
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },
  
  clearError: () => set({ error: null })
}));

export default useDocumentStore; 