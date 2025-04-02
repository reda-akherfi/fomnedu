import { create } from 'zustand';
import { Video, videoService } from '../services/videoService';

interface VideoStore {
  videos: Video[];
  isLoading: boolean;
  error: string | null;
  
  // Fetch actions
  fetchAllVideos: (token: string) => Promise<void>;
  fetchVideosForTask: (token: string, taskId: number) => Promise<Video[]>;
  fetchVideo: (token: string, id: number) => Promise<Video | null>;
  
  // Mutate actions
  addVideo: (token: string, title: string, url: string, taskIds?: number[]) => Promise<Video | null>;
  updateVideo: (token: string, id: number, title: string, url: string, taskIds?: number[]) => Promise<void>;
  deleteVideo: (token: string, id: number) => Promise<void>;
  
  // Helper actions
  clearError: () => void;
}

const useVideoStore = create<VideoStore>((set, get) => ({
  videos: [],
  isLoading: false,
  error: null,
  
  fetchAllVideos: async (token: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const videos = await videoService.getAllVideos(token);
      set({ videos, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
  
  fetchVideosForTask: async (token: string, taskId: number) => {
    set({ isLoading: true, error: null });
    
    try {
      const videos = await videoService.getVideosForTask(token, taskId);
      return videos;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      return [];
    } finally {
      set({ isLoading: false });
    }
  },
  
  fetchVideo: async (token: string, id: number) => {
    set({ isLoading: true, error: null });
    
    try {
      const video = await videoService.getVideo(token, id);
      set({ isLoading: false });
      return video;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      return null;
    }
  },
  
  addVideo: async (token: string, title: string, url: string, taskIds?: number[]) => {
    set({ isLoading: true, error: null });
    
    try {
      const newVideo = await videoService.createVideo(token, {
        title,
        url,
        taskIds
      });
      
      set(state => ({ 
        videos: [...state.videos, newVideo],
        isLoading: false 
      }));
      
      return newVideo;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      return null;
    }
  },
  
  updateVideo: async (token: string, id: number, title: string, url: string, taskIds?: number[]) => {
    set({ isLoading: true, error: null });
    
    try {
      const updatedVideo = await videoService.updateVideo(token, id, {
        title,
        url,
        taskIds
      });
      
      set(state => ({ 
        videos: state.videos.map(video => video.id === id ? updatedVideo : video),
        isLoading: false 
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
  
  deleteVideo: async (token: string, id: number) => {
    set({ isLoading: true, error: null });
    
    try {
      await videoService.deleteVideo(token, id);
      
      set(state => ({ 
        videos: state.videos.filter(video => video.id !== id),
        isLoading: false 
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
  
  clearError: () => set({ error: null })
}));

export default useVideoStore; 