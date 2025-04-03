import { useState, useEffect, FormEvent } from 'react';
import { FaPlus, FaTrash, FaLink, FaEdit, FaExclamationTriangle, FaFilter, FaPlay, FaYoutube, FaVideo, FaPlayCircle } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import useVideoStore from '../stores/useVideoStore';
import useTaskStore from '../stores/useTaskStore';
import useAuthStore from '../stores/useAuthStore';
import { Video, videoService } from '../services/videoService';

const Videos = () => {
  const { token } = useAuthStore();
  const { videos, isLoading, error, fetchAllVideos, addVideo, updateVideo, deleteVideo } = useVideoStore();
  const { tasks, fetchAllTasks } = useTaskStore();
  
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [filterTaskId, setFilterTaskId] = useState<number | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [taskDropdownOpen, setTaskDropdownOpen] = useState(false);
  
  // Fetch initial data
  useEffect(() => {
    if (token) {
      fetchAllVideos(token);
      fetchAllTasks();
    }
  }, [token, fetchAllVideos, fetchAllTasks]);
  
  // Open modal for adding/editing
  const handleOpenModal = (videoToEdit: Video | null = null) => {
    if (videoToEdit) {
      // Edit mode
      setIsEditMode(true);
      setCurrentVideoId(videoToEdit.id ?? null);
      setTitle(videoToEdit.title);
      setUrl(videoToEdit.url);
      setSelectedTaskIds(videoToEdit.taskIds || []);
    } else {
      // Create mode
      setIsEditMode(false);
      setCurrentVideoId(null);
      setTitle('');
      setUrl('');
      setSelectedTaskIds([]);
    }
    setUrlError(null);
    setShowModal(true);
  };
  
  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    console.log("Form submitted with:", { title, url, selectedTaskIds });
    
    // Validate input
    if (!title.trim()) return;
    if (!url.trim()) {
      setUrlError('URL is required');
      return;
    }
    if (!token) return;
    
    // Validate YouTube URL
    const youtubeId = videoService.getYouTubeVideoId(url);
    if (!youtubeId) {
      setUrlError('Please enter a valid YouTube URL');
      return;
    }
    
    try {
      console.log("About to save video with data:", {
        isEditMode,
        currentVideoId,
        title: title.trim(),
        url: url.trim(),
        selectedTaskIds
      });
      
      if (isEditMode && currentVideoId) {
        // Update existing video
        await updateVideo(
          token, 
          currentVideoId, 
          title.trim(), 
          url.trim(), 
          selectedTaskIds
        );
        console.log("Video updated successfully");
      } else {
        // Create new video
        await addVideo(
          token,
          title.trim(),
          url.trim(),
          selectedTaskIds
        );
        console.log("Video added successfully");
      }
      
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving video:', error);
    }
  };
  
  // Delete a video
  const handleDeleteVideo = async (id: number) => {
    if (!token) return;
    if (window.confirm(`Are you sure you want to delete this video?`)) {
      await deleteVideo(token, id);
    }
  };
  
  // Reset the form
  const resetForm = () => {
    setTitle('');
    setUrl('');
    setSelectedTaskIds([]);
    setUrlError(null);
  };
  
  // Toggle task selection
  const handleTaskToggle = (taskId: number) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };
  
  // Get YouTube thumbnail from URL
  const getYouTubeThumbnail = (url: string) => {
    const videoId = videoService.getYouTubeVideoId(url);
    if (videoId) {
      return videoService.getYouTubeThumbnailUrl(videoId);
    }
    return '';
  };
  
  // Format date for display
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Get tasks associated with a video
  const getAssociatedTasks = (video: Video) => {
    if (!video.taskIds) return [];
    return tasks.filter(task => video.taskIds.includes(task.id as number));
  };
  
  // Handle video playback
  const handlePlayVideo = (video: Video) => {
    setSelectedVideo(video);
  };
  
  // Filter videos by task
  const filteredVideos = filterTaskId
    ? videos.filter(video => video.taskIds && video.taskIds.includes(filterTaskId))
    : videos;
  
  // Function to determine the source of a video
  const getVideoSource = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return 'YouTube';
    }
    if (url.includes('vimeo.com')) {
      return 'Vimeo';
    }
    return 'External Link';
  };
  
  // Show loading state
  if (isLoading && videos.length === 0) {
    return (
      <div className="page-container">
        <div className="loading-state">Loading videos...</div>
      </div>
    );
  }
  
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Videos</h1>
        <div className="header-actions">
          <div className="filter-controls">
            <button 
              className={`filter-button ${filterTaskId === null ? 'active' : ''}`} 
              onClick={() => setFilterTaskId(null)}
            >
              All Videos
            </button>
            {tasks.length > 0 && (
              <div className="dropdown">
                <button className="filter-button" onClick={() => setTaskDropdownOpen(!taskDropdownOpen)}>
                  Filter by Task
                </button>
                <div className={`dropdown-content ${taskDropdownOpen ? 'show' : ''}`}>
                  {tasks.map(task => (
                    <button
                      key={task.id}
                      onClick={() => {
                        setFilterTaskId(task.id as number);
                        setTaskDropdownOpen(false);
                      }}
                    >
                      {task.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button className="create-button" onClick={() => setShowModal(true)}>
            <FaPlus /> Add Video
          </button>
        </div>
      </div>
      
      <div className="video-content">
        <div className="videos-grid-container">
          {error && (
            <div className="error-message">
              <FaExclamationTriangle /> {error}
            </div>
          )}
          
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading videos...</p>
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="empty-state">
              <FaVideo size={48} />
              <p>No videos found</p>
              <button onClick={() => setShowModal(true)}>Add your first video</button>
            </div>
          ) : (
            <div className="videos-grid">
              {filteredVideos.map(video => (
                <div key={video.id} className="video-card">
                  <div className="video-thumbnail" onClick={() => handlePlayVideo(video)}>
                    {video.url ? (
                      <img src={getYouTubeThumbnail(video.url)} alt={video.title} />
                    ) : (
                      <div className="video-placeholder">
                        <FaPlayCircle size={50} />
                      </div>
                    )}
                  </div>
                  <div className="video-info">
                    <h3 className="video-title">{video.title}</h3>
                    <div className="video-meta">
                      <span className="video-source">{getVideoSource(video.url)}</span>
                      {video.createdAt && (
                        <span className="video-date">{formatDate(video.createdAt)}</span>
                      )}
                    </div>
                    <div className="task-chips">
                      {getAssociatedTasks(video).map(task => (
                        <span key={task.id} className="task-chip-small">
                          {task.title}
                        </span>
                      ))}
                      {video.taskIds.length === 0 && (
                        <span className="no-tasks">No tasks</span>
                      )}
                    </div>
                    <div className="video-actions">
                      <button 
                        className="icon-button view"
                        title="Watch Video"
                        onClick={() => handlePlayVideo(video)}
                      >
                        <FaPlay /> Watch
                      </button>
                      {video.id && (
                        <button 
                          className="icon-button delete"
                          title="Delete"
                          onClick={() => handleDeleteVideo(video.id as number)}
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h2>{isEditMode ? 'Edit Video' : 'Add Video'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="videoTitle">Title *</label>
                <input
                  id="videoTitle"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Video title"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="videoUrl">YouTube URL *</label>
                <input
                  id="videoUrl"
                  type="text"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setUrlError(null); // Clear error when user modifies URL
                  }}
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                />
                {urlError && <div className="error-text">{urlError}</div>}
                {url && videoService.getYouTubeVideoId(url) && (
                  <div className="video-preview-container">
                    <img 
                      src={getYouTubeThumbnail(url)}
                      alt="Video thumbnail"
                      className="video-preview-thumbnail"
                    />
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label>Associate with Tasks (optional)</label>
                {tasks.length === 0 ? (
                  <div className="no-tasks-message">
                    No tasks available. <Link to="/tasks">Create some tasks</Link> first.
                  </div>
                ) : (
                  <div className="tasks-selection">
                    {tasks.map(task => (
                      <div key={task.id} className="task-checkbox">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={selectedTaskIds.includes(task.id as number)}
                            onChange={() => handleTaskToggle(task.id as number)}
                          />
                          <span className="checkbox-custom"></span>
                          {task.title}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="modal-actions">
                <button 
                  type="submit"
                  disabled={!title.trim() || !url.trim() || isLoading}
                >
                  {isLoading ? 'Processing...' : isEditMode ? 'Update Video' : 'Add Video'}
                </button>
                <button 
                  type="button" 
                  className="secondary" 
                  onClick={() => setShowModal(false)}
                  disabled={isLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Videos; 