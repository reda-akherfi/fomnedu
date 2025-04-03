import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Rnd } from 'react-rnd';
import { 
  FaPlay, FaPause, FaStopwatch, FaExpand, FaCompress, 
  FaEye, FaEyeSlash, FaTimes, FaCog, FaChevronLeft, 
  FaChevronRight, FaPlus, FaVideo 
} from 'react-icons/fa';
import useModuleStore, { Module, DocFile, Video, Note } from '../stores/useModuleStore';
import useAuthStore from '../stores/useAuthStore';
import { documentService } from '../services/documentService';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import useModuleFiles from '../hooks/useModuleFiles';

// Définir les types pour les sections
type SectionType = 'documents' | 'videos' | 'notes' | 'chatbot';
type SectionVisibility = Record<SectionType, boolean>;
type SectionFullscreen = Record<SectionType, boolean>;

interface SectionPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

type SectionPositions = Record<SectionType, SectionPosition>;

// Define types for file objects
interface FileObject {
  id: string;
  name: string;
  url: string;
  type: string;
  thumbnail?: string;
}

// Mock hook to satisfy TypeScript until real hook is created
const useModuleFiles = (moduleId: string | undefined) => {
  const [files, setFiles] = useState<FileObject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Mock implementation - in reality, this would fetch files from an API
    if (moduleId) {
      // Simulate loading
      setTimeout(() => {
        setFiles([]);
        setLoading(false);
      }, 500);
    }
  }, [moduleId]);

  return { files, loading, error };
};

const Session = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const { modules, documents, videos, notes, addNote, updateNote } = useModuleStore();
  const { token } = useAuthStore();
  const { files, loading, error } = useModuleFiles(moduleId);
  
  // États pour le module et ses ressources
  const [module, setModule] = useState<Module | null>(null);
  const [moduleDocuments, setModuleDocuments] = useState<DocFile[]>([]);
  const [moduleVideos, setModuleVideos] = useState<Video[]>([]);
  const [_moduleNotes, setModuleNotes] = useState<Note[]>([]);
  
  // État pour le minuteur
  const [timerMode, setTimerMode] = useState<'pomodoro' | 'custom'>('pomodoro');
  const [workDuration, setWorkDuration] = useState(25 * 60); // 25 minutes en secondes
  const [breakDuration, setBreakDuration] = useState(5 * 60); // 5 minutes en secondes
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerPhase, setTimerPhase] = useState<'work' | 'break'>('work');
  const [remainingTime, setRemainingTime] = useState(workDuration);
  const [isTimerSettingsOpen, setIsTimerSettingsOpen] = useState(false);
  
  // États pour les sections
  const [sectionVisibility, setSectionVisibility] = useState<SectionVisibility>({
    documents: true,
    videos: true,
    notes: true,
    chatbot: true
  });
  
  const [sectionFullscreen, setSectionFullscreen] = useState<SectionFullscreen>({
    documents: false,
    videos: false,
    notes: false,
    chatbot: false
  });
  
  // Positions des sections par défaut
  const defaultPositions: SectionPositions = {
    documents: { x: 0, y: 0, width: 500, height: 350 },
    videos: { x: 510, y: 0, width: 500, height: 350 },
    notes: { x: 0, y: 360, width: 500, height: 350 },
    chatbot: { x: 510, y: 360, width: 500, height: 350 }
  };
  
  const [sectionPositions, setSectionPositions] = useState<SectionPositions>(defaultPositions);
  
  // État pour l'éditeur de notes
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  
  // État pour le lecteur vidéo
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number>(0);
  
  // État pour le document actuel
  const [currentDocumentUrl, setCurrentDocumentUrl] = useState<string | null>(null);
  
  // Add state for document blob URL
  const [documentBlobUrl, setDocumentBlobUrl] = useState<string | null>(null);
  
  // State for text content
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isTextDocument, setIsTextDocument] = useState(false);
  
  // Added state for text content handling
  const [selectedDocument, setSelectedDocument] = useState<FileObject | null>(null);
  const [selectedVideos, setSelectedVideos] = useState<FileObject[]>([]);
  const [videonote, setVideonote] = useState<string>('');
  const [note, setNote] = useState<string>('');
  
  // Add state for video selection dropdown
  const [showVideoSelector, setShowVideoSelector] = useState<boolean>(false);
  const [availableVideos, setAvailableVideos] = useState<FileObject[]>([]);
  
  // Référence pour l'intervalle du minuteur
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  // Fonction pour charger un document
  const loadDocument = async (url: string) => {
    try {
      setIsLoadingDocument(true);
      const response = await fetch(url);
      const blob = await response.blob();
      
      // Check if this is a text document (based on MIME type or extension)
      const isText = 
        blob.type === 'text/plain' || 
        blob.type === 'application/octet-stream' || 
        /\.(txt|md|js|ts|jsx|tsx|css|html|json)$/i.test(url);
      
      if (isText) {
        // For text files, display the text content directly
        setIsTextDocument(true);
        const text = await blob.text();
        setTextContent(text);
      } else {
        // For other documents, create a blob URL to display in iframe
        setIsTextDocument(false);
        const blobUrl = URL.createObjectURL(blob);
        setDocumentBlobUrl(blobUrl);
      }
    } catch (error) {
      console.error('Error loading document:', error);
    } finally {
      setIsLoadingDocument(false);
    }
  };
  
  // Update the document selection logic
  const selectDocument = (doc: DocFile) => {
    if (doc.url) {
      loadDocument(doc.url);
    }
  };
  
  // Clean up blob URLs when component unmounts
  useEffect(() => {
    return () => {
      if (documentBlobUrl) {
        URL.revokeObjectURL(documentBlobUrl);
      }
    };
  }, [documentBlobUrl]);
  
  // Charger les données du module au chargement
  useEffect(() => {
    if (!moduleId) return;
    
    const currentModule = modules.find(m => m.id === moduleId);
    if (!currentModule) {
      navigate('/module');
      return;
    }
    
    setModule(currentModule);
    setModuleDocuments(documents.filter(doc => doc.moduleId === moduleId));
    const filteredVideos = videos.filter(video => video.moduleId === moduleId);
    setModuleVideos(filteredVideos);
    setModuleNotes(notes.filter(note => note.moduleId === moduleId));
    
    // Initialiser la première vidéo si disponible
    if (filteredVideos.length > 0) {
      setCurrentVideoUrl(filteredVideos[0].url);
      setCurrentVideoIndex(0);
    }
    
    // Initialize the first document if available
    if (documents.filter(doc => doc.moduleId === moduleId).length > 0) {
      const firstDoc = documents.filter(doc => doc.moduleId === moduleId)[0];
      if (firstDoc.url) {
        loadDocument(firstDoc.url);
      }
    }
    
    // Créer une nouvelle note pour la session si aucune n'existe
    if (notes.filter(note => note.moduleId === moduleId).length === 0) {
      const newNoteTitle = `Notes de session - ${currentModule.name}`;
      const emptyContent = '';
      
      // Ajouter une nouvelle note
      const newNote = addNote(moduleId, newNoteTitle, emptyContent);
      setCurrentNoteId(newNote.id);
      setNoteTitle(newNoteTitle);
      setNoteContent(emptyContent);
    } else {
      // Utiliser la première note existante
      const firstNote = notes.filter(note => note.moduleId === moduleId)[0];
      setCurrentNoteId(firstNote.id);
      setNoteTitle(firstNote.title);
      setNoteContent(firstNote.content);
    }
    
    // Nettoyer le timer à la désinscription
    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [moduleId, modules, documents, videos, notes, navigate, addNote, token]);
  
  // Logique du minuteur
  useEffect(() => {
    if (isTimerRunning) {
      timerInterval.current = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            // Changer de phase (travail <-> pause)
            const newPhase = timerPhase === 'work' ? 'break' : 'work';
            setTimerPhase(newPhase);
            // Jouer un son de notification
            const audio = new Audio('/notification.mp3');
            audio.play().catch(e => console.log('Erreur audio:', e));
            // Définir la nouvelle durée
            return newPhase === 'work' ? workDuration : breakDuration;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }
    
    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [isTimerRunning, timerPhase, workDuration, breakDuration]);
  
  // Formater le temps restant
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Démarrer/Arrêter le minuteur
  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };
  
  // Réinitialiser le minuteur
  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerPhase('work');
    setRemainingTime(workDuration);
  };
  
  // Sauvegarder le contenu de la note
  const saveNoteContent = () => {
    if (currentNoteId) {
      updateNote(currentNoteId, noteTitle, noteContent);
    }
  };
  
  // Autosave toutes les 5 secondes
  useEffect(() => {
    const saveInterval = setInterval(() => {
      saveNoteContent();
    }, 5000);
    
    return () => clearInterval(saveInterval);
  }, [noteContent, noteTitle, currentNoteId]);
  
  // Gérer le changement de note
  const handleNoteChange = (content: string) => {
    setNoteContent(content);
  };
  
  // Activer/désactiver une section
  const toggleSection = (section: SectionType) => {
    setSectionVisibility(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // Activer/désactiver le mode plein écran d'une section
  const toggleFullscreen = (section: SectionType) => {
    // Si une autre section est déjà en plein écran, la désactiver
    const currentFullscreen = Object.entries(sectionFullscreen).find(([_, value]) => value === true);
    if (currentFullscreen && currentFullscreen[0] !== section) {
      setSectionFullscreen(prev => ({
        ...prev,
        [currentFullscreen[0]]: false
      }));
    }
    
    setSectionFullscreen(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // Gérer le changement de position/taille d'une section
  const handleSectionChange = (section: SectionType, position: { x: number, y: number, width: number, height: number }) => {
    setSectionPositions(prev => ({
      ...prev,
      [section]: position
    }));
  };
  
  // Déterminer si au moins une section est en mode plein écran
  const isAnyFullscreen = Object.values(sectionFullscreen).some(value => value);
  
  // Quitter la session
  const exitSession = () => {
    // Sauvegarder les notes avant de quitter
    saveNoteContent();
    navigate('/module');
  };

  // Modification des styles CSS pour les boutons
  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#f0f0f0',
    border: 'none',
    cursor: 'pointer',
    margin: '0 5px',
    transition: 'all 0.2s ease'
  };

  // Navigate to previous/next video
  const navigateVideo = (direction: 'prev' | 'next'): void => {
    if (selectedVideos.length === 0) return;
    
    if (direction === 'prev') {
      setCurrentVideoIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else {
      setCurrentVideoIndex(prev => (prev < selectedVideos.length - 1 ? prev + 1 : prev));
    }
  };

  useEffect(() => {
    if (files && !loading) {
      // Filter available videos
      const videos = files.filter((file: FileObject) => file.type === 'video');
      setAvailableVideos(videos);
    }
  }, [files, loading]);
  
  const addVideoToPlaylist = (video: FileObject): void => {
    if (!selectedVideos.some(v => v.id === video.id)) {
      setSelectedVideos([...selectedVideos, video]);
    }
    setShowVideoSelector(false);
  };
  
  const removeVideoFromPlaylist = (videoId: string): void => {
    const newVideos = selectedVideos.filter(v => v.id !== videoId);
    setSelectedVideos(newVideos);
    
    // Adjust current index if needed
    if (currentVideoIndex >= newVideos.length) {
      setCurrentVideoIndex(Math.max(0, newVideos.length - 1));
    }
  };

  // Fonction pour formater l'URL YouTube
  const formatYouTubeUrl = (url: string) => {
    // Gérer différents formats d'URL YouTube
    const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
    // Retourner l'URL d'embed YouTube sans autoplay
    return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0` : url;
  };

  return (
    <div className="session-container">
      {/* Barre supérieure avec minuteur et contrôles */}
      <div className="session-header">
        <button className="back-button" onClick={exitSession}>
          <FaChevronLeft />
          Retour aux modules
        </button>
        
        <div className="module-title">
          {module?.name} - Session d'étude
        </div>
        
        <div className="timer-container">
          <div className={`timer ${timerPhase === 'break' ? 'timer-break' : ''}`}>
            <span className="timer-phase">{timerPhase === 'work' ? 'Travail' : 'Pause'}</span>
            <span className="timer-display">{formatTime(remainingTime)}</span>
          </div>
          
          <div className="timer-controls">
            <button style={buttonStyle} onClick={toggleTimer} title={isTimerRunning ? "Pause" : "Play"}>
              {isTimerRunning ? <FaPause /> : <FaPlay />}
            </button>
            <button style={buttonStyle} onClick={resetTimer} title="Reset">
              <FaStopwatch />
            </button>
            <button style={buttonStyle} onClick={() => setIsTimerSettingsOpen(!isTimerSettingsOpen)} title="Settings">
              <FaCog />
            </button>
          </div>
          
          {isTimerSettingsOpen && (
            <div className="timer-settings">
              <h3>Paramètres du minuteur</h3>
              <div className="timer-settings-options">
                <div className="timer-mode-selector">
                  <label>
                    <input
                      type="radio"
                      name="timerMode"
                      checked={timerMode === 'pomodoro'}
                      onChange={() => {
                        setTimerMode('pomodoro');
                        setWorkDuration(25 * 60);
                        setBreakDuration(5 * 60);
                        resetTimer();
                      }}
                    />
                    Pomodoro (25/5)
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="timerMode"
                      checked={timerMode === 'custom'}
                      onChange={() => setTimerMode('custom')}
                    />
                    Personnalisé
                  </label>
                </div>
                
                {timerMode === 'custom' && (
                  <div className="custom-timer-inputs">
                    <div>
                      <label>Durée de travail (min)</label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={Math.floor(workDuration / 60)}
                        onChange={(e) => {
                          const newDuration = parseInt(e.target.value) * 60;
                          setWorkDuration(newDuration);
                          if (timerPhase === 'work') {
                            setRemainingTime(newDuration);
                          }
                        }}
                      />
                    </div>
                    <div>
                      <label>Durée de pause (min)</label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={Math.floor(breakDuration / 60)}
                        onChange={(e) => {
                          const newDuration = parseInt(e.target.value) * 60;
                          setBreakDuration(newDuration);
                          if (timerPhase === 'break') {
                            setRemainingTime(newDuration);
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <button onClick={() => setIsTimerSettingsOpen(false)}>Fermer</button>
            </div>
          )}
        </div>
        
        <div className="session-controls">
          <button className="end-session-btn" onClick={exitSession}>
            Fin de la session
          </button>
        </div>
      </div>
      
      {/* Barre d'outils pour les sections */}
      <div className="sections-toolbar">
        <div className="section-toggles">
          <button 
            className={`section-toggle ${sectionVisibility.documents ? 'active' : ''}`}
            onClick={() => toggleSection('documents')}
          >
            {sectionVisibility.documents ? <FaEye /> : <FaEyeSlash />} Documents
          </button>
          <button 
            className={`section-toggle ${sectionVisibility.videos ? 'active' : ''}`}
            onClick={() => toggleSection('videos')}
          >
            {sectionVisibility.videos ? <FaEye /> : <FaEyeSlash />} Vidéos
          </button>
          <button 
            className={`section-toggle ${sectionVisibility.notes ? 'active' : ''}`}
            onClick={() => toggleSection('notes')}
          >
            {sectionVisibility.notes ? <FaEye /> : <FaEyeSlash />} Notes
          </button>
          <button 
            className={`section-toggle ${sectionVisibility.chatbot ? 'active' : ''}`}
            onClick={() => toggleSection('chatbot')}
          >
            {sectionVisibility.chatbot ? <FaEye /> : <FaEyeSlash />} Chatbot
          </button>
        </div>
      </div>
      
      {/* Conteneur pour les sections */}
      <div className="sections-container">
        {/* Section Documents */}
        {sectionVisibility.documents && (
          <Rnd
            default={sectionPositions.documents}
            minWidth={300}
            minHeight={200}
            bounds=".sections-container"
            disableDragging={isAnyFullscreen}
            enableResizing={!isAnyFullscreen}
            className={`section ${sectionFullscreen.documents ? 'fullscreen' : ''}`}
            onDragStop={(_e, d) => {
              handleSectionChange('documents', {
                ...sectionPositions.documents,
                x: d.x,
                y: d.y
              });
            }}
            onResizeStop={(_e, _direction, ref, _delta, position) => {
              handleSectionChange('documents', {
                width: parseInt(ref.style.width),
                height: parseInt(ref.style.height),
                x: position.x,
                y: position.y
              });
            }}
          >
            <div className="section-header">
              <h2>Documents</h2>
              <div className="section-controls">
                <button onClick={() => toggleFullscreen('documents')}>
                  {sectionFullscreen.documents ? <FaCompress /> : <FaExpand />}
                </button>
                <button onClick={() => toggleSection('documents')}>
                  <FaTimes />
                </button>
              </div>
            </div>
            
            <div className="section-content documents-section">
              <div className="document-selector">
                <select
                  value={selectedDocument ? selectedDocument.id : ''}
                  onChange={(e) => {
                    const docId = e.target.value;
                    const doc = files.find(file => file.id === docId);
                    if (doc) {
                      setSelectedDocument(doc);
                      loadDocument(doc.url);
                    }
                  }}
                >
                  <option value="">Select a document</option>
                  {files && files.filter(file => file.type === 'document').map(file => (
                    <option key={file.id} value={file.id}>{file.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="document-preview">
                {selectedDocument ? (
                  isTextDocument ? (
                    <div className="text-document-content">
                      {textContent}
                    </div>
                  ) : (
                    <iframe
                      src={selectedDocument.url}
                      title={selectedDocument.name}
                      width="100%"
                      height="100%"
                    ></iframe>
                  )
                ) : (
                  <div className="no-document">
                    <p>No document selected</p>
                  </div>
                )}
              </div>
            </div>
          </Rnd>
        )}
        
        {/* Section Vidéos */}
        {sectionVisibility.videos && (
          <Rnd
            default={sectionPositions.videos}
            minWidth={300}
            minHeight={200}
            bounds=".sections-container"
            disableDragging={isAnyFullscreen}
            enableResizing={!isAnyFullscreen}
            className={`section ${sectionFullscreen.videos ? 'fullscreen' : ''}`}
            onDragStop={(_e, d) => {
              handleSectionChange('videos', {
                ...sectionPositions.videos,
                x: d.x,
                y: d.y
              });
            }}
            onResizeStop={(_e, _direction, ref, _delta, position) => {
              handleSectionChange('videos', {
                width: parseInt(ref.style.width),
                height: parseInt(ref.style.height),
                x: position.x,
                y: position.y
              });
            }}
          >
            <div className="section-header">
              <h2>Videos</h2>
              <div className="section-controls">
                <button onClick={() => setShowVideoSelector(!showVideoSelector)}>
                  <FontAwesomeIcon icon={FaPlus} />
                </button>
                <button onClick={() => toggleFullscreen('videos')}>
                  {sectionFullscreen.videos ? <FaCompress /> : <FaExpand />}
                </button>
                <button onClick={() => toggleSection('videos')}>
                  <FaTimes />
                </button>
              </div>
            </div>
            
            {showVideoSelector && (
              <div className="video-selector-dropdown">
                <div className="video-selector-header">
                  <h3>Select a video to add</h3>
                  <button onClick={() => setShowVideoSelector(false)}>
                    <FaTimes />
                  </button>
                </div>
                <div className="video-selector-list">
                  {availableVideos.length > 0 ? (
                    availableVideos.map(video => (
                      <div 
                        key={video.id} 
                        className="video-selector-item"
                        onClick={() => addVideoToPlaylist(video)}
                      >
                        <div className="video-thumbnail">
                          {video.thumbnail ? (
                            <img src={video.thumbnail} alt={video.name} />
                          ) : (
                            <div className="video-placeholder">
                              <FontAwesomeIcon icon={FaVideo} />
                            </div>
                          )}
                        </div>
                        <div className="video-info">
                          <div className="video-title">{video.name}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p>No videos available</p>
                  )}
                </div>
              </div>
            )}
            
            <div className="section-content videos-section">
              <div className="video-player-container">
                {selectedVideos.length > 0 && currentVideoIndex < selectedVideos.length ? (
                  <>
                    <div className="video-player">
                      <iframe
                        src={formatYouTubeUrl(selectedVideos[currentVideoIndex].url)}
                        title={selectedVideos[currentVideoIndex].name}
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                    
                    <div className="video-navigation">
                      <button 
                        onClick={() => navigateVideo('prev')}
                        disabled={currentVideoIndex === 0}
                      >
                        <FaChevronLeft />
                      </button>
                      <span className="video-counter">
                        {currentVideoIndex + 1} / {selectedVideos.length}
                      </span>
                      <button 
                        onClick={() => navigateVideo('next')}
                        disabled={currentVideoIndex === selectedVideos.length - 1}
                      >
                        <FaChevronRight />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="no-video">
                    <p>No videos selected</p>
                    <button onClick={() => setShowVideoSelector(true)}>
                      <FaPlus /> Add Videos
                    </button>
                  </div>
                )}
              </div>
              
              {selectedVideos.length > 0 && (
                <div className="video-playlist">
                  <h3>Playlist</h3>
                  <div className="video-list">
                    {selectedVideos.map((video, index) => (
                      <div 
                        key={video.id} 
                        className={`video-item ${index === currentVideoIndex ? 'active' : ''}`}
                        onClick={() => setCurrentVideoIndex(index)}
                      >
                        <div className="video-thumbnail">
                          {video.thumbnail ? (
                            <img src={video.thumbnail} alt={video.name} />
                          ) : (
                            <div className="video-placeholder">
                              <FontAwesomeIcon icon={FaVideo} />
                            </div>
                          )}
                        </div>
                        <div className="video-info">
                          <div className="video-title">{video.name}</div>
                        </div>
                        <button 
                          className="remove-video"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeVideoFromPlaylist(video.id);
                          }}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Rnd>
        )}
        
        {/* Section Notes */}
        {sectionVisibility.notes && (
          <Rnd
            default={sectionPositions.notes}
            minWidth={300}
            minHeight={200}
            bounds=".sections-container"
            disableDragging={isAnyFullscreen}
            enableResizing={!isAnyFullscreen}
            className={`section ${sectionFullscreen.notes ? 'fullscreen' : ''}`}
            onDragStop={(_e, d) => {
              handleSectionChange('notes', {
                ...sectionPositions.notes,
                x: d.x,
                y: d.y
              });
            }}
            onResizeStop={(_e, _direction, ref, _delta, position) => {
              handleSectionChange('notes', {
                width: parseInt(ref.style.width),
                height: parseInt(ref.style.height),
                x: position.x,
                y: position.y
              });
            }}
          >
            <div className="section-header">
              <h2>Notes</h2>
              <div className="section-controls">
                <button onClick={() => toggleFullscreen('notes')}>
                  {sectionFullscreen.notes ? <FaCompress /> : <FaExpand />}
                </button>
                <button onClick={() => toggleSection('notes')}>
                  <FaTimes />
                </button>
              </div>
            </div>
            
            <div className="section-content notes-section">
              <div className="note-editor-container">
                <div className="note-title-container">
                  <input
                    type="text"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder="Titre de la note"
                    className="note-title-input"
                  />
                </div>
                
                <ReactQuill
                  value={noteContent}
                  onChange={handleNoteChange}
                  preserveWhitespace
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'color': [] }, { 'background': [] }],
                      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                      ['link', 'image'],
                      ['clean']
                    ]
                  }}
                  placeholder="Commencez à prendre des notes..."
                />
                
                <div className="note-status">
                  Sauvegarde automatique activée
                </div>
              </div>
            </div>
          </Rnd>
        )}
        
        {/* Section Chatbot */}
        {sectionVisibility.chatbot && (
          <Rnd
            default={sectionPositions.chatbot}
            minWidth={300}
            minHeight={200}
            bounds=".sections-container"
            disableDragging={isAnyFullscreen}
            enableResizing={!isAnyFullscreen}
            className={`section ${sectionFullscreen.chatbot ? 'fullscreen' : ''}`}
            onDragStop={(_e, d) => {
              handleSectionChange('chatbot', {
                ...sectionPositions.chatbot,
                x: d.x,
                y: d.y
              });
            }}
            onResizeStop={(_e, _direction, ref, _delta, position) => {
              handleSectionChange('chatbot', {
                width: parseInt(ref.style.width),
                height: parseInt(ref.style.height),
                x: position.x,
                y: position.y
              });
            }}
          >
            <div className="section-header">
              <h2>Chatbot Assistant</h2>
              <div className="section-controls">
                <button onClick={() => toggleFullscreen('chatbot')}>
                  {sectionFullscreen.chatbot ? <FaCompress /> : <FaExpand />}
                </button>
                <button onClick={() => toggleSection('chatbot')}>
                  <FaTimes />
                </button>
              </div>
            </div>
            
            <div className="section-content chatbot-section">
              <div className="chatbot-messages">
                <div className="chatbot-message assistant">
                  <div className="message-content">
                    Bonjour ! Je suis votre assistant d'étude pour le module "{module?.name}". 
                    Je peux vous aider à comprendre vos documents et vidéos. 
                    (Fonctionnalité pas encore connectée au backend)
                  </div>
                </div>
              </div>
              
              <div className="chatbot-input-container">
                <input
                  type="text"
                  placeholder="Posez une question sur vos documents..."
                  className="chatbot-input"
                  disabled
                />
                <button className="chatbot-send-button" disabled>
                  Envoyer
                </button>
              </div>
              
              <div className="chatbot-info">
                Note: Le RAG AI sera intégré ultérieurement via le backend
              </div>
            </div>
          </Rnd>
        )}
      </div>
    </div>
  );
};

export default Session;