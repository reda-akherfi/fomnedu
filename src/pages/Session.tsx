import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Rnd } from 'react-rnd';
import { 
  FaPlay, FaPause, FaForward, FaStopwatch, FaExpand, FaCompress, 
  FaEye, FaEyeSlash, FaTimes, FaCog, FaChevronLeft, 
  FaChevronRight, FaPlus, FaVideo, FaCoffee, FaClock, FaSpinner, FaStepForward, FaChevronUp, FaChevronDown, FaFile
} from 'react-icons/fa';
import useModuleStore, { Module, DocFile, Video, Note } from '../stores/useModuleStore';
import useAuthStore from '../stores/useAuthStore';
import useTimerStore from '../stores/useTimerStore';
import { Timer, TimerType, TimerStatus } from '../services/timerService';
import { documentService } from '../services/documentService';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import useModuleFiles, { FileObject } from '../hooks/useModuleFiles';

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

const Session = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const { modules, documents, videos, notes, addNote, updateNote } = useModuleStore();
  const { token } = useAuthStore();
  const { files, loading, error } = useModuleFiles(moduleId);
  
  const { 
    createTimer, pauseTimer, resumeTimer, stopTimer, 
    fetchActiveTimers, activeTimer, setActiveTimer 
  } = useTimerStore();
  
  // États pour le module et ses ressources
  const [module, setModule] = useState<Module | null>(null);
  const [moduleDocuments, setModuleDocuments] = useState<DocFile[]>([]);
  const [moduleVideos, setModuleVideos] = useState<Video[]>([]);
  const [_moduleNotes, setModuleNotes] = useState<Note[]>([]);
  
  // État pour le minuteur
  const [workDuration, setWorkDuration] = useState(25 * 60); // 25 minutes in seconds
  const [breakDuration, setBreakDuration] = useState(5 * 60); // 5 minutes in seconds
  const [remainingTime, setRemainingTime] = useState(workDuration);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerSettingsOpen, setIsTimerSettingsOpen] = useState(false);
  const [isCreatingTimer, setIsCreatingTimer] = useState(false);
  const [timerError, setTimerError] = useState<string | null>(null);
  
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
  
  // New state for video search
  const [videoSearchQuery, setVideoSearchQuery] = useState<string>('');
  
  // Référence pour l'intervalle du minuteur
  const localTimerRef = useRef<NodeJS.Timeout | null>(null);
  const timerStartTimeRef = useRef<number | null>(null);

  // Add isLoadingDocument state
  const [isLoadingDocument, setIsLoadingDocument] = useState<boolean>(false);

  // Added state for video dropdown
  const [isVideoDropdownOpen, setIsVideoDropdownOpen] = useState<boolean>(false);

  // Additional state for playlist dropdown
  const [isPlaylistOpen, setIsPlaylistOpen] = useState<boolean>(false);
  
  // References for the playlist dropdowns
  const playlistRef = useRef<HTMLDivElement>(null);
  const emptyPlaylistRef = useRef<HTMLDivElement>(null);

  // Handle timer completion and transition to next timer
  const handleTimerCompletion = useCallback(async () => {
    if (!activeTimer || !activeTimer.id || !token || !moduleId) return;
    
    try {
      // Calculate actual elapsed time
      const currentElapsedTime = Math.max(
        (activeTimer.durationSeconds || 0) - remainingTime, 
        0
      );
      
      // First stop the current timer - this marks it as completed in the API
      await stopTimer(activeTimer.id);
      
      // Create the next timer with opposite break state
      const isBreak = !activeTimer.isBreak;
      
      // Create a new timer following the API contract
      const newTimer: Omit<Timer, 'id' | 'createdAt' | 'status'> = {
        timerType: TimerType.POMODORO,
        title: module?.name ? 
          `${isBreak ? 'Break' : 'Work'} Timer for ${module.name}` : 
          `${isBreak ? 'Break' : 'Work'} Session`,
        durationSeconds: isBreak ? breakDuration : workDuration,
        isBreak: isBreak
      };
      
      // Play notification sound
      const audio = new Audio('/notification.mp3');
      audio.play().catch(e => console.log('Audio error:', e));
      
      // Create the next timer after ensuring the previous one is stopped
      const newTimerResponse = await createTimer(newTimer);
      
      // Reset elapsed time for new timer
      setElapsedTime(0);
      timerStartTimeRef.current = Date.now();
      
      // Force update UI immediately
      if (newTimerResponse) {
        setActiveTimer(newTimerResponse);
        setRemainingTime(newTimerResponse.durationSeconds || (isBreak ? breakDuration : workDuration));
      }
    } catch (error) {
      setTimerError(error instanceof Error ? error.message : 'Error transitioning to next timer');
      console.error('Timer transition error:', error);
    }
  }, [activeTimer, moduleId, token, module, workDuration, breakDuration, createTimer, stopTimer, setActiveTimer, remainingTime]);

  // Skip to next timer
  const skipToNextTimer = async () => {
    if (!activeTimer || !activeTimer.id || !moduleId || !token) return;
    
    try {
      setTimerError(null);
      
      // Save the current elapsed time
      const currentElapsedTime = Math.max(
        (activeTimer.durationSeconds || 0) - remainingTime, 
        0
      );
      
      // Stop the current timer - marks it as completed in the API
      await stopTimer(activeTimer.id);
      
      // Create a new timer with opposite break state
      const isBreak = !activeTimer.isBreak;
      
      // Create a new timer following the API contract
      const newTimer: Omit<Timer, 'id' | 'createdAt' | 'status'> = {
        timerType: TimerType.POMODORO,
        title: module?.name ? 
          `${isBreak ? 'Break' : 'Work'} Timer for ${module.name}` : 
          `${isBreak ? 'Break' : 'Work'} Session`,
        durationSeconds: isBreak ? breakDuration : workDuration,
        isBreak: isBreak
      };
      
      // Create the new timer after ensuring the previous one is stopped
      const newTimerResponse = await createTimer(newTimer);
      
      // Reset elapsed time for new timer
      setElapsedTime(0);
      timerStartTimeRef.current = Date.now();
      
      // Force update UI immediately
      if (newTimerResponse) {
        setActiveTimer(newTimerResponse);
        setRemainingTime(newTimerResponse.durationSeconds || (isBreak ? breakDuration : workDuration));
      }
    } catch (error) {
      setTimerError(error instanceof Error ? error.message : 'Error skipping timer');
      console.error('Timer skip error:', error);
    }
  };

  // Load active timer on component mount
  useEffect(() => {
    const loadActiveTimer = async () => {
      try {
        const activeTimers = await fetchActiveTimers();
        if (activeTimers.length > 0) {
          // Use the most recent active timer
          const mostRecentTimer = activeTimers.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          })[0];
          
          setActiveTimer(mostRecentTimer);
          
          // Set remaining time based on the active timer
          if (mostRecentTimer.remainingSeconds !== undefined) {
            setRemainingTime(mostRecentTimer.remainingSeconds);
          } else if (mostRecentTimer.durationSeconds) {
            setRemainingTime(mostRecentTimer.durationSeconds);
          } else {
            setRemainingTime(mostRecentTimer.isBreak ? breakDuration : workDuration);
          }
          
          // Start tracking elapsed time
          timerStartTimeRef.current = Date.now();
        }
      } catch (error) {
        console.error('Error fetching active timers:', error);
      }
    };
    
    if (token) {
      loadActiveTimer();
    }
    
    return () => {
      if (localTimerRef.current) {
        clearInterval(localTimerRef.current);
        localTimerRef.current = null;
      }
    };
  }, [fetchActiveTimers, setActiveTimer, token, workDuration, breakDuration]);

  // Update UI based on active timer
  useEffect(() => {
    if (activeTimer) {
      // Update remaining time
      if (activeTimer.remainingSeconds !== undefined) {
        setRemainingTime(activeTimer.remainingSeconds);
      }
      
      // Update local timer if running
      if (activeTimer.status === TimerStatus.RUNNING && !localTimerRef.current) {
        // Set timer start time if not already set
        if (timerStartTimeRef.current === null) {
          timerStartTimeRef.current = Date.now();
        }
        
        localTimerRef.current = setInterval(() => {
          // Update remaining time
          setRemainingTime(prev => {
            if (prev <= 1) {
              // When timer reaches 0, automatically transition to next timer
              clearInterval(localTimerRef.current!);
              localTimerRef.current = null;
              handleTimerCompletion();
              return 0;
            }
            return prev - 1;
          });
          
          // Update elapsed time
          if (timerStartTimeRef.current) {
            const elapsedMs = Date.now() - timerStartTimeRef.current;
            setElapsedTime(Math.floor(elapsedMs / 1000));
          }
        }, 1000);
      } else if (activeTimer.status !== TimerStatus.RUNNING && localTimerRef.current) {
        clearInterval(localTimerRef.current);
        localTimerRef.current = null;
      }
    }
    
    return () => {
      if (localTimerRef.current) {
        clearInterval(localTimerRef.current);
        localTimerRef.current = null;
      }
    };
  }, [activeTimer, handleTimerCompletion]);

  // Fonction pour charger un document
  const loadDocument = async (url: string) => {
    try {
      setIsLoadingDocument(true);
      const response = await fetch(url);
      const blob = await response.blob();
      
      // Much more comprehensive check for text documents
      const isText = 
        // Standard text MIME types
        blob.type === 'text/plain' || 
        blob.type === 'text/html' ||
        blob.type === 'text/css' ||
        blob.type === 'text/javascript' ||
        blob.type === 'application/json' ||
        blob.type === 'application/xml' ||
        
        // Treat application/octet-stream as text if it has extensions that are typically text
        blob.type === 'application/octet-stream' || 
        blob.type === '' ||
        
        // Common text file extensions
        /\.(txt|md|markdown|log|cfg|conf|ini|xml|yml|yaml|json|js|ts|jsx|tsx|css|scss|less|html|htm|sql|java|py|c|cpp|h|hpp|cs|rb|php|sh|bash|bat|cmd|ps1|gradle|properties|config|pom|kt|scala|dart|go|rs|swift|m|r|lua)$/i.test(url) ||
        
        // If no extension or unknown extension, treat as text for application/octet-stream
        (blob.type === 'application/octet-stream' && !/\.(bin|exe|dll|obj|jpg|jpeg|png|gif|bmp|webp|mp3|mp4|wav|avi|mov|webm|pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|7z|tar|gz)$/i.test(url));
      
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
    
    // IMPORTANT: Do NOT set any videos to start with
    setCurrentVideoUrl(null);
    setCurrentVideoIndex(0);
    setSelectedVideos([]);
    
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
      if (localTimerRef.current) {
        clearInterval(localTimerRef.current);
        localTimerRef.current = null;
      }
    };
  }, [moduleId, modules, documents, videos, notes, navigate, addNote, token]);
  
  // Format time (seconds to MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Toggle timer (start/pause/resume)
  const toggleTimer = async () => {
    if (!moduleId || !token) return;
    
    try {
      setTimerError(null);
      
      if (!activeTimer) {
        // Create a new timer
        setIsCreatingTimer(true);
        
        const newTimer: Omit<Timer, 'id' | 'createdAt' | 'status'> = {
          timerType: TimerType.POMODORO,
          title: module?.name ? `Work Timer for ${module.name}` : 'Work Session',
          durationSeconds: workDuration,
          isBreak: false
        };
        
        const createdTimer = await createTimer(newTimer);
        
        // Start tracking elapsed time
        timerStartTimeRef.current = Date.now();
        setElapsedTime(0);
        
      } else if (activeTimer.status === TimerStatus.RUNNING) {
        // Pause the timer
        await pauseTimer(activeTimer.id!);
      } else if (activeTimer.status === TimerStatus.PAUSED) {
        // Resume the timer - update start time to account for pause
        if (timerStartTimeRef.current) {
          const pausedTime = Date.now() - timerStartTimeRef.current - (elapsedTime * 1000);
          timerStartTimeRef.current = Date.now() - pausedTime;
        } else {
          timerStartTimeRef.current = Date.now() - (elapsedTime * 1000);
        }
        
        await resumeTimer(activeTimer.id!);
      }
    } catch (error) {
      setTimerError(error instanceof Error ? error.message : 'Error managing timer');
      console.error('Timer error:', error);
    } finally {
      setIsCreatingTimer(false);
    }
  };
  
  // Get timer icon based on type
  const getTimerIcon = () => {
    return activeTimer?.isBreak ? <FaCoffee /> : <FaClock />;
  };
  
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
    // IMPORTANT: Explicitly disable autoplay with autoplay=0 parameter
    return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0&autoplay=0` : url;
  };

  // Filter videos based on search query
  const filteredAvailableVideos = videoSearchQuery.trim() === ''
    ? availableVideos
    : availableVideos.filter(video => 
        video.name.toLowerCase().includes(videoSearchQuery.toLowerCase())
      );

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

  // Add event listener to close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Check both playlist refs
      const isPlaylistClick = 
        (playlistRef.current && playlistRef.current.contains(event.target as Node)) ||
        (emptyPlaylistRef.current && emptyPlaylistRef.current.contains(event.target as Node));
      
      if (!isPlaylistClick) {
        setIsPlaylistOpen(false);
      }
    }
    
    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      // Remove event listener on cleanup
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [playlistRef, emptyPlaylistRef]);

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
          {/* Timer Display */}
          <div className={`timer-display ${activeTimer?.isBreak ? 'timer-break' : 'timer-work'}`}>
            <div className="timer-type-label">
              {activeTimer?.isBreak ? 'BREAK' : 'WORK'}
            </div>
            <div className="timer-time">
              {formatTime(remainingTime)}
            </div>
          </div>
          
          {/* Timer Controls */}
          <div className="timer-controls">
            <button 
              onClick={toggleTimer} 
              disabled={isCreatingTimer}
            >
              {isCreatingTimer ? (
                <FaSpinner className="loading-spinner" />
              ) : activeTimer?.status === TimerStatus.RUNNING ? (
                <FaPause />
              ) : (
                <FaPlay />
              )}
              <span>{activeTimer?.status === TimerStatus.RUNNING ? 'Pause' : 'Start'}</span>
            </button>
            
            <button onClick={skipToNextTimer} disabled={!activeTimer || isCreatingTimer}>
              <FaStepForward />
              <span>Skip</span>
            </button>
            
            <button onClick={() => setIsTimerSettingsOpen(!isTimerSettingsOpen)}>
              <FaCog />
              <span>Settings</span>
            </button>
          </div>
          
          {/* Timer Settings Dialog */}
          {isTimerSettingsOpen && (
            <div className="timer-settings-overlay" key={`timer-settings-${Date.now()}`}>
              <div className="timer-settings">
                <h3>Pomodoro Timer Settings</h3>
                <p style={{ color: '#666', marginBottom: '15px', textAlign: 'center' }}>Session Component View</p>
                
                <div className="timer-settings-options">
                  <div className="timer-duration-inputs">
                    <div className="duration-field">
                      <label>Work Duration (minutes)</label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={Math.floor(workDuration / 60)}
                        onChange={(e) => {
                          const newDuration = parseInt(e.target.value) * 60;
                          setWorkDuration(isNaN(newDuration) ? 25 * 60 : newDuration);
                        }}
                      />
                    </div>
                    
                    <div className="duration-field">
                      <label>Break Duration (minutes)</label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={Math.floor(breakDuration / 60)}
                        onChange={(e) => {
                          const newDuration = parseInt(e.target.value) * 60;
                          setBreakDuration(isNaN(newDuration) ? 5 * 60 : newDuration);
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                {timerError && <div className="timer-error">{timerError}</div>}
                
                <div className="timer-settings-actions">
                  <button onClick={() => setIsTimerSettingsOpen(false)}>Save & Close</button>
                </div>
              </div>
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
              <div className="documents-list">
                <h3>Available Documents</h3>
                {files && files.filter(file => file.type === 'document').map(file => (
                  <div 
                    key={file.id} 
                    className={`document-item ${selectedDocument && selectedDocument.id === file.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedDocument(file);
                      loadDocument(file.url);
                    }}
                  >
                    <div className="document-icon">
                      <FaFile />
                    </div>
                    <div className="document-name">
                      {file.name}
                    </div>
                  </div>
                ))}
                {(!files || files.filter(file => file.type === 'document').length === 0) && (
                  <div className="no-documents-message">
                    <p>No documents available</p>
                  </div>
                )}
              </div>
              
              <div className="document-preview">
                {isLoadingDocument ? (
                  <div className="document-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading document...</p>
                  </div>
                ) : selectedDocument ? (
                  isTextDocument ? (
                    <div className="text-document-content">
                      {textContent}
                    </div>
                  ) : (
                    <iframe
                      src={selectedDocument.url}
                      title={selectedDocument.name}
                      className="document-iframe"
                    ></iframe>
                  )
                ) : (
                  <div className="no-document">
                    <p>No document selected</p>
                    <p>Select a document from the list</p>
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
                <button onClick={() => toggleFullscreen('videos')}>
                  {sectionFullscreen.videos ? <FaCompress /> : <FaExpand />}
                </button>
                <button onClick={() => toggleSection('videos')}>
                  <FaTimes />
                </button>
              </div>
            </div>
            
            <div className="section-content videos-section">
              <div className="video-container">
                {/* Video player section */}
                <div className="video-player-container">
                  {selectedVideos.length > 0 ? (
                    <>
                      <div className="video-player">
                        <iframe
                          src={formatYouTubeUrl(selectedVideos[currentVideoIndex].url)}
                          title={selectedVideos[currentVideoIndex].name}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                      <div className="video-info-bar">
                        <div className="video-playlist" ref={playlistRef}>
                          <div 
                            className="playlist-header" 
                            onClick={() => setIsPlaylistOpen(!isPlaylistOpen)}
                          >
                            <h3>{selectedVideos[currentVideoIndex].name}</h3>
                            <button className="video-dropdown-toggle">
                              {isPlaylistOpen ? <FaChevronUp /> : <FaChevronDown />}
                            </button>
                          </div>
                          
                          {isPlaylistOpen && (
                            <div className="playlist-dropdown show">
                              <div className="video-search">
                                <input
                                  type="text"
                                  placeholder="Search videos..."
                                  value={videoSearchQuery}
                                  onChange={(e) => setVideoSearchQuery(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                              <div className="video-dropdown-list">
                                {moduleVideos
                                  .filter(video => 
                                    video.title.toLowerCase().includes(videoSearchQuery.toLowerCase())
                                  )
                                  .map(video => (
                                    <div 
                                      key={video.id}
                                      className={`video-dropdown-item ${selectedVideos.some(v => v.id === video.id) && 
                                        selectedVideos[currentVideoIndex].id === video.id ? 'active' : ''}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const videoObj: FileObject = {
                                          id: video.id || '',
                                          name: video.title,
                                          url: video.url || '',
                                          type: 'video'
                                        };
                                        
                                        if (!selectedVideos.some(v => v.id === video.id)) {
                                          setSelectedVideos([...selectedVideos, videoObj]);
                                          setCurrentVideoIndex(selectedVideos.length);
                                        } else {
                                          const indexInSelected = selectedVideos.findIndex(v => v.id === video.id);
                                          if (indexInSelected >= 0) {
                                            setCurrentVideoIndex(indexInSelected);
                                          }
                                        }
                                        setIsPlaylistOpen(false);
                                      }}
                                    >
                                      {video.title}
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {selectedVideos.length > 1 && (
                          <div className="video-navigation">
                            <button 
                              onClick={() => navigateVideo('prev')}
                              disabled={currentVideoIndex === 0}
                            >
                              <FaChevronLeft /> Previous
                            </button>
                            <span className="video-counter">
                              {currentVideoIndex + 1} / {selectedVideos.length}
                            </span>
                            <button 
                              onClick={() => navigateVideo('next')}
                              disabled={currentVideoIndex === selectedVideos.length - 1}
                            >
                              Next <FaChevronRight />
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="no-video-selected">
                      <p>No video selected</p>
                      <p>Open the playlist below to select a video</p>
                      <button 
                        className="select-video-button"
                        onClick={() => setIsPlaylistOpen(true)}
                      >
                        <FaVideo /> Browse videos
                      </button>
                      
                      {isPlaylistOpen && (
                        <div className="playlist-dropdown show" ref={emptyPlaylistRef} style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', width: '80%', maxWidth: '500px' }}>
                          <div className="video-search">
                            <input
                              type="text"
                              placeholder="Search videos..."
                              value={videoSearchQuery}
                              onChange={(e) => setVideoSearchQuery(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <div className="video-dropdown-list">
                            {moduleVideos
                              .filter(video => 
                                video.title.toLowerCase().includes(videoSearchQuery.toLowerCase())
                              )
                              .map(video => (
                                <div 
                                  key={video.id}
                                  className="video-dropdown-item"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const videoObj: FileObject = {
                                      id: video.id || '',
                                      name: video.title,
                                      url: video.url || '',
                                      type: 'video'
                                    };
                                    
                                    setSelectedVideos([videoObj]);
                                    setCurrentVideoIndex(0);
                                    setIsPlaylistOpen(false);
                                  }}
                                >
                                  {video.title}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
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