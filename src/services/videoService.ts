const API_URL = 'http://localhost:8080/api/videos';

export interface Video {
  id?: number;
  title: string;
  url: string;
  userId?: string;
  taskIds: number[];
  createdAt?: string;
  updatedAt?: string;
}

export const videoService = {
  async createVideo(token: string, video: { title: string, url: string, taskIds?: number[] }): Promise<Video> {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(video)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create video');
    }
    
    return response.json();
  },
  
  async getAllVideos(token: string): Promise<Video[]> {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch videos');
    }
    
    return response.json();
  },
  
  async getVideo(token: string, id: number): Promise<Video> {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to fetch video with id ${id}`);
    }
    
    return response.json();
  },
  
  async getVideosForTask(token: string, taskId: number): Promise<Video[]> {
    const response = await fetch(`${API_URL}/task/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to fetch videos for task ${taskId}`);
    }
    
    return response.json();
  },
  
  async updateVideo(token: string, id: number, video: { title: string, url: string, taskIds?: number[] }): Promise<Video> {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(video)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to update video with id ${id}`);
    }
    
    return response.json();
  },
  
  async deleteVideo(token: string, id: number): Promise<void> {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to delete video with id ${id}`);
    }
  },
  
  // Helper to extract YouTube video ID from URL
  getYouTubeVideoId(url: string): string | null {
    const pattern = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(pattern);
    return match ? match[1] : null;
  },
  
  // Helper to get YouTube thumbnail URL
  getYouTubeThumbnailUrl(videoId: string): string {
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  }
}; 