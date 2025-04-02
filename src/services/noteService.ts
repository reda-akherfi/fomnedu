const API_URL = 'http://localhost:8080/api/notes';

export interface Note {
  id?: number;
  title: string;
  content: string;
  taskIds: number[];
  createdAt?: string;
}

export const noteService = {
  async createNote(token: string, note: { title: string, content: string, taskIds?: number[] }): Promise<Note> {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(note)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create note');
    }
    
    return response.json();
  },
  
  async getAllNotes(token: string): Promise<Note[]> {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch notes');
    }
    
    return response.json();
  },
  
  async getNote(token: string, id: number): Promise<Note> {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to fetch note with id ${id}`);
    }
    
    return response.json();
  },
  
  async getNotesForTask(token: string, taskId: number): Promise<Note[]> {
    const response = await fetch(`${API_URL}/task/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to fetch notes for task ${taskId}`);
    }
    
    return response.json();
  },
  
  async updateNote(token: string, id: number, note: { title: string, content: string, taskIds?: number[] }): Promise<Note> {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(note)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to update note with id ${id}`);
    }
    
    return response.json();
  },
  
  async deleteNote(token: string, id: number): Promise<void> {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to delete note with id ${id}`);
    }
  }
}; 