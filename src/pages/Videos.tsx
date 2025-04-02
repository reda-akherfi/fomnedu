import { useState, useEffect } from 'react';
import { FaFolder, FaVideo, FaPlus, FaTrash, FaLink, FaEdit, FaExternalLinkAlt, FaExclamationTriangle, FaFilter, FaPlay, FaYoutube } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import useModuleStore, { Video } from '../stores/useModuleStore';
import useVideoStore from '../stores/useVideoStore';
import useTaskStore from '../stores/useTaskStore';
import useAuthStore from '../stores/useAuthStore';
import { videoService } from '../services/videoService';
import { Task } from '../services/taskService';

const Videos = () => {
  const { modules, videos, addVideo, updateVideo, deleteVideo } = useModuleStore();
  const { token } = useAuthStore();
  const { isLoading, error, fetchAllVideos, addVideo: videoStoreAddVideo, updateVideo: videoStoreUpdateVideo, deleteVideo: videoStoreDeleteVideo } = useVideoStore();
  const { tasks, fetchAllTasks } = useTaskStore();
  
  const [showModal, setShowModal] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoThumbnail, setVideoThumbnail] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  
  // Pour l'édition des vidéos
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editThumbnail, setEditThumbnail] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [filterTaskId, setFilterTaskId] = useState<number | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  useEffect(() => {
    if (token) {
      fetchAllVideos(token);
      fetchAllTasks();
    }
  }, [token, fetchAllVideos, fetchAllTasks]);

  const handleAddVideo = async () => {
    if (!selectedModule || !videoTitle.trim() || !videoUrl.trim()) return;
    
    const videoId = videoService.getYouTubeVideoId(videoUrl);
    if (!videoId) {
      setUrlError('Please enter a valid YouTube URL');
      return;
    }
    
    if (editingVideoId) {
      await videoStoreUpdateVideo(
        token,
        editingVideoId,
        videoTitle.trim(),
        videoUrl.trim(),
        selectedTaskIds.length > 0 ? selectedTaskIds : undefined
      );
    } else {
      await videoStoreAddVideo(
        token,
        selectedModule,
        videoTitle.trim(),
        videoUrl.trim(),
        selectedTaskIds.length > 0 ? selectedTaskIds : undefined
      );
    }
    
    resetForm();
    setShowModal(false);
  };

  const startEditingVideo = (video: Video) => {
    setEditingVideoId(video.id);
    setEditTitle(video.title);
    setEditUrl(video.url);
    setEditThumbnail(video.thumbnailUrl || '');
    setEditDescription(video.description || '');
    setSelectedTaskIds(video.taskIds || []);
  };

  const saveVideoEdit = () => {
    if (!editingVideoId || !editTitle.trim() || !editUrl.trim()) return;
    
    updateVideo(
      editingVideoId,
      {
        title: editTitle.trim(),
        url: editUrl.trim(),
        thumbnailUrl: editThumbnail.trim() || undefined,
        description: editDescription.trim() || undefined
      }
    );
    
    cancelEditingVideo();
  };

  const cancelEditingVideo = () => {
    setEditingVideoId(null);
    setEditTitle('');
    setEditUrl('');
    setEditThumbnail('');
    setEditDescription('');
    setSelectedTaskIds([]);
  };

  const resetForm = () => {
    setVideoTitle('');
    setVideoUrl('');
    setVideoThumbnail('');
    setVideoDescription('');
    setSelectedTaskIds([]);
    setUrlError(null);
  };

  const openVideoModal = (moduleId: string) => {
    setSelectedModule(moduleId);
    setShowModal(true);
  };

  // Groupe les vidéos par moduleId
  const videosByModule: Record<string, Video[]> = {};
  videos.forEach(video => {
    if (!videosByModule[video.moduleId]) {
      videosByModule[video.moduleId] = [];
    }
    videosByModule[video.moduleId].push(video);
  });

  // Obtenir le nom du module à partir de son ID
  const getModuleName = (moduleId: string): string => {
    const module = modules.find(m => m.id === moduleId);
    return module ? module.name : 'Module inconnu';
  };

  const handleTaskToggle = (taskId: number) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const getYouTubeThumbnail = (url: string) => {
    const videoId = videoService.getYouTubeVideoId(url);
    return videoId ? videoService.getYouTubeThumbnailUrl(videoId) : '';
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getAssociatedTasks = (video: Video) => {
    return tasks.filter(task => video.taskIds.includes(task.id as number));
  };

  const openYouTubeVideo = (url: string) => {
    window.open(url, '_blank');
  };

  const handlePlayVideo = (video: Video) => {
    setSelectedVideo(video);
  };

  const filteredVideos = filterTaskId
    ? videos.filter(video => video.taskIds.includes(filterTaskId))
    : videos;

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
              <FaFilter /> All Videos
            </button>
            {tasks.length > 0 && (
              <div className="dropdown">
                <button className="filter-button">
                  Filter by Task
                </button>
                <div className="dropdown-content">
                  {tasks.map(task => (
                    <button
                      key={task.id}
                      onClick={() => setFilterTaskId(task.id as number)}
                    >
                      {task.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Link to="/tasks" className="tasks-link-button">
            <FaLink /> Tasks
          </Link>
          <button className="create-button" onClick={() => openVideoModal(selectedModule || '')}>
            <FaPlus /> Add Video
          </button>
        </div>
      </div>
      
      {error && (
        <div className="error-message">
          <FaExclamationTriangle /> {error}
        </div>
      )}
      
      {selectedVideo && (
        <div className="video-player-container">
          <div className="video-player-header">
            <h2>{selectedVideo.title}</h2>
            <button className="close-player-btn" onClick={() => setSelectedVideo(null)}>
              <FaTrash />
            </button>
          </div>
          <div className="video-player-frame">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${videoService.getYouTubeVideoId(selectedVideo.url)}?autoplay=1`}
              title={selectedVideo.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
      
      {!selectedVideo && (
        <div className="videos-grid-container">
          {filteredVideos.length === 0 ? (
            <div className="empty-state">
              <FaYoutube size={48} />
              <p>No videos found</p>
              <button onClick={() => openVideoModal(selectedModule || '')}>Add your first video</button>
            </div>
          ) : (
            <div className="videos-grid">
              {filteredVideos.map(video => (
                <div key={video.id} className="video-card">
                  <div className="video-thumbnail" onClick={() => handlePlayVideo(video)}>
                    <img 
                      src={getYouTubeThumbnail(video.url)} 
                      alt={video.title} 
                    />
                    <div className="video-play-btn">
                      <FaPlay />
                    </div>
                  </div>
                  <div className="video-info">
                    <h3>{video.title}</h3>
                    <div className="video-dates">
                      Added on {formatDate(video.createdAt)}
                    </div>
                    <div className="video-tasks">
                      {getAssociatedTasks(video).length > 0 ? (
                        <div className="task-chips">
                          {getAssociatedTasks(video).map(task => (
                            <span key={task.id} className="task-chip-small">
                              {task.title}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="no-tasks">No tasks associated</span>
                      )}
                    </div>
                  </div>
                  <div className="video-actions">
                    <button 
                      className="icon-button play" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayVideo(video);
                      }}
                      title="Play"
                    >
                      <FaPlay />
                    </button>
                    <button 
                      className="icon-button edit" 
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditingVideo(video);
                      }}
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button 
                      className="icon-button delete" 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Êtes-vous sûr de vouloir supprimer la vidéo "${video.title}" ?`)) {
                          videoStoreDeleteVideo(token, video.id);
                        }
                      }}
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h2>{editingVideoId ? 'Edit Video' : 'Add Video'}</h2>
            <form onSubmit={handleAddVideo}>
              <div className="form-group">
                <label htmlFor="videoTitle">Title *</label>
                <input
                  id="videoTitle"
                  type="text"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="Video title"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="videoUrl">YouTube URL *</label>
                <input
                  id="videoUrl"
                  type="text"
                  value={videoUrl}
                  onChange={(e) => {
                    setVideoUrl(e.target.value);
                    setUrlError(null); // Clear error when user modifies URL
                  }}
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                />
                {urlError && <div className="error-text">{urlError}</div>}
                {videoUrl && videoService.getYouTubeVideoId(videoUrl) && (
                  <div className="video-preview-container">
                    <img 
                      src={getYouTubeThumbnail(videoUrl)}
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
                    No tasks available. <a href="/tasks">Create some tasks</a> first.
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
                  disabled={!videoTitle.trim() || !videoUrl.trim() || isLoading}
                >
                  {isLoading ? 'Processing...' : editingVideoId ? 'Update Video' : 'Add Video'}
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