const API_URL = 'http://localhost:8080/api/documents';

export interface Document {
  id?: string;
  name: string;
  contentType: string;
  size: number;
  uploadDate: string;
  downloadUrl?: string;
  userId: string;
  taskIds: number[];
  description?: string;
}

export const documentService = {
  async uploadDocument(token: string, file: File, taskIds?: number[]): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (taskIds && taskIds.length > 0) {
      formData.append('taskIds', taskIds.join(','));
    }
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload document');
    }
    
    return response.json();
  },
  
  async getAllDocuments(token: string): Promise<Document[]> {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch documents');
    }
    
    return response.json();
  },
  
  async getDocumentsForTask(token: string, taskId: number): Promise<Document[]> {
    const response = await fetch(`${API_URL}/task/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to fetch documents for task ${taskId}`);
    }
    
    return response.json();
  },
  
  async deleteDocument(token: string, id: string): Promise<void> {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete document');
    }
  },
  
  async downloadDocument(token: string, id: string): Promise<Blob> {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to download document');
    }
    
    return response.blob();
  },
  
  openDocumentInNewTab(token: string, id: string, filename: string): void {
    // Create an authenticated blob URL
    this.downloadDocument(token, id)
      .then(blob => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      })
      .catch(error => {
        console.error('Error opening document:', error);
      });
  },
  
  createObjectURL(token: string, id: string, filename: string): Promise<string> {
    return this.downloadDocument(token, id)
      .then(blob => {
        return URL.createObjectURL(blob);
      });
  }
}; 