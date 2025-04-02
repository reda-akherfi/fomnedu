const API_URL = 'http://localhost:8080/api/auth';

interface AuthCredentials {
  username: string;
  password: string;
}

interface AuthResponse {
  token?: string;
  message?: string;
}

export const authService = {
  async register(credentials: AuthCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }
    
    return data;
  },
  
  async login(credentials: AuthCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }
    
    return data;
  },
  
  async verifyToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}; 