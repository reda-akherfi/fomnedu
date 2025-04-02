import { useState } from 'react';
import { FaFolder, FaVideo, FaPlus, FaTrash, FaLink, FaEdit, FaExternalLinkAlt } from 'react-icons/fa';
import useModuleStore, { Video } from '../stores/useModuleStore';

const Videos = () => {
  const { modules, videos, addVideo, updateVideo, deleteVideo } = useModuleStore();
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

  const handleAddVideo = () => {
    if (!selectedModule || !videoTitle.trim() || !videoUrl.trim()) return;
    
    addVideo(
      selectedModule,
      videoTitle.trim(),
      videoUrl.trim(),
      videoThumbnail.trim() || undefined,
      videoDescription.trim() || undefined
    );
    
    resetForm();
    setShowModal(false);
  };

  const startEditingVideo = (video: Video) => {
    setEditingVideoId(video.id);
    setEditTitle(video.title);
    setEditUrl(video.url);
    setEditThumbnail(video.thumbnailUrl || '');
    setEditDescription(video.description || '');
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
  };

  const resetForm = () => {
    setVideoTitle('');
    setVideoUrl('');
    setVideoThumbnail('');
    setVideoDescription('');
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

  return (
    <div className="page-container">
      <h1>Bibliothèque de Vidéos</h1>
      
      {modules.length === 0 ? (
        <div className="empty-state">
          <FaFolder size={48} />
          <p>Vous n'avez pas encore créé de modules</p>
          <p>Allez dans la section "Module" pour commencer</p>
        </div>
      ) : (
        <div className="videos-container">
          {modules.map(module => (
            <div key={module.id} className="module-section">
              <div className="module-section-header">
                <h2>
                  <FaFolder /> {module.name}
                </h2>
                <button className="small-button" onClick={() => openVideoModal(module.id)}>
                  <FaPlus /> Ajouter une vidéo
                </button>
              </div>
              
              <div className="videos-grid">
                {!videosByModule[module.id] || videosByModule[module.id].length === 0 ? (
                  <p className="empty-folder">Ce module ne contient pas encore de vidéos.</p>
                ) : (
                  videosByModule[module.id].map(video => (
                    <div key={video.id} className="video-card">
                      {editingVideoId === video.id ? (
                        // Mode édition
                        <div className="video-edit-form">
                          <div className="form-group">
                            <label>Titre</label>
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              placeholder="Titre de la vidéo"
                            />
                          </div>
                          <div className="form-group">
                            <label>URL</label>
                            <input
                              type="url"
                              value={editUrl}
                              onChange={(e) => setEditUrl(e.target.value)}
                              placeholder="https://..."
                            />
                          </div>
                          <div className="form-group">
                            <label>URL de la miniature (optionnel)</label>
                            <input
                              type="url"
                              value={editThumbnail}
                              onChange={(e) => setEditThumbnail(e.target.value)}
                              placeholder="https://..."
                            />
                          </div>
                          <div className="form-group">
                            <label>Description</label>
                            <textarea
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              rows={3}
                            />
                          </div>
                          <div className="video-edit-actions">
                            <button onClick={saveVideoEdit}>Enregistrer</button>
                            <button className="secondary" onClick={cancelEditingVideo}>Annuler</button>
                          </div>
                        </div>
                      ) : (
                        // Mode affichage
                        <>
                          <div className="video-thumbnail">
                            <img 
                              src={video.thumbnailUrl || 'https://via.placeholder.com/320x180.png?text=Video'} 
                              alt={video.title}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/320x180.png?text=Image+Error';
                              }}
                            />
                            <a 
                              href={video.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="video-play-btn"
                            >
                              <FaExternalLinkAlt />
                            </a>
                          </div>
                          <div className="video-info">
                            <h3>{video.title}</h3>
                            {video.description && (
                              <p className="video-description">{video.description}</p>
                            )}
                            <div className="video-footer">
                              <span className="video-module">{getModuleName(video.moduleId)}</span>
                              <span className="video-date">
                                {new Date(video.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="video-actions">
                            <button 
                              className="icon-button edit" 
                              onClick={() => startEditingVideo(video)}
                            >
                              <FaEdit />
                            </button>
                            <button 
                              className="icon-button delete" 
                              onClick={() => {
                                if(window.confirm(`Êtes-vous sûr de vouloir supprimer la vidéo "${video.title}" ?`)) {
                                  deleteVideo(video.id);
                                }
                              }}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h2>Ajouter une vidéo</h2>
            
            <div className="form-group">
              <label htmlFor="videoTitle">Titre de la vidéo *</label>
              <input
                id="videoTitle"
                type="text"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="videoUrl">URL de la vidéo *</label>
              <input
                id="videoUrl"
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                required
              />
              <small>Les URL YouTube seront automatiquement associées à leurs miniatures.</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="videoThumbnail">URL de la miniature (optionnel)</label>
              <input
                id="videoThumbnail"
                type="url"
                value={videoThumbnail}
                onChange={(e) => setVideoThumbnail(e.target.value)}
                placeholder="https://..."
              />
              <small>Laissez vide pour utiliser la miniature par défaut de YouTube.</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="videoDescription">Description (optionnel)</label>
              <textarea
                id="videoDescription"
                value={videoDescription}
                onChange={(e) => setVideoDescription(e.target.value)}
                placeholder="Description de la vidéo..."
                rows={3}
              />
            </div>
            
            <div className="modal-actions">
              <button 
                onClick={handleAddVideo}
                disabled={!videoTitle.trim() || !videoUrl.trim()}
              >
                Ajouter
              </button>
              <button 
                type="button" 
                className="secondary" 
                onClick={() => setShowModal(false)}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Videos; 