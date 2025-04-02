const API_URL = 'http://localhost:8080/api/modules';

export interface Module {
  id?: number;
  name: string;
  description: string;
  taskIds: number[];
}

export const moduleService = {
  async getAll(token: string): Promise<Module[]> {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch modules');
    }
    
    return response.json();
  },
  
  async getByName(token: string, name: string): Promise<Module> {
    const response = await fetch(`${API_URL}/${name}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch module');
    }
    
    return response.json();
  },
  
  async create(token: string, module: Module): Promise<Module> {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(module)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create module');
    }
    
    return response.json();
  },
  
  async update(token: string, name: string, module: Module): Promise<Module> {
    const response = await fetch(`${API_URL}/${name}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(module)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update module');
    }
    
    return response.json();
  },
  
  async delete(token: string, name: string): Promise<void> {
    const response = await fetch(`${API_URL}/${name}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete module');
    }
  }
}; 