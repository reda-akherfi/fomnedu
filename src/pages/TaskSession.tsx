import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Rnd } from 'react-rnd';
import { FaPlay, FaPause, FaStopwatch, FaExpand, FaCompress, FaEye, FaEyeSlash, FaTimes, FaCog, FaChevronLeft, FaFile, FaVideo, FaStickyNote } from 'react-icons/fa';
import useTaskStore from '../stores/useTaskStore';
import useDocumentStore from '../stores/useDocumentStore';
import useVideoStore from '../stores/useVideoStore';
import useNoteStore from '../stores/useNoteStore';
import useAuthStore from '../stores/useAuthStore';
import { documentService } from '../services/documentService';
import { videoService } from '../services/videoService';
import { Task } from '../services/taskService';
import { Document } from '../services/documentService';
import { Video } from '../services/videoService';
import { Note } from '../services/noteService';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Define types for sections
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

const TaskSession = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { fetchTaskById } = useTaskStore();
  const { fetchAllDocuments } = useDocumentStore();
  const { fetchAllVideos } = useVideoStore();
  const { fetchAllNotes, addNote, updateNote } = useNoteStore();
  const { token } = useAuthStore();
  
  // Task data states
  const [task, setTask] = useState<Task | null>(null);
  const [taskDocuments, setTaskDocuments] = useState<Document[]>([]);
  const [taskVideos, setTaskVideos] = useState<Video[]>([]);
  const [taskNotes, setTaskNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Timer states
  const [timerMode, setTimerMode] = useState<'pomodoro' | 'custom'>('pomodoro');
  const [workDuration, setWorkDuration] = useState(25 * 60); // 25 minutes in seconds
  const [breakDuration, setBreakDuration] = useState(5 * 60); // 5 minutes in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerPhase, setTimerPhase] = useState<'work' | 'break'>('work');
  const [remainingTime, setRemainingTime] = useState(workDuration);
  const [isTimerSettingsOpen, setIsTimerSettingsOpen] = useState(false);
  
  // Section visibility states
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
  
  // Default positions for the sections
  const defaultPositions: SectionPositions = {
    documents: { x: 0, y: 0, width: 500, height: 350 },
    videos: { x: 510, y: 0, width: 500, height: 350 },
    notes: { x: 0, y: 360, width: 500, height: 350 },
    chatbot: { x: 510, y: 360, width: 500, height: 350 }
  };
  
  const [sectionPositions, setSectionPositions] = useState<SectionPositions>(defaultPositions);
  
  // Note editor states
  const [currentNoteId, setCurrentNoteId] = useState<number | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  
  // Video player states
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number>(0);
  
  // Document viewer states
  const [currentDocumentUrl, setCurrentDocumentUrl] = useState<string | null>(null);
  const [documentBlobUrl, setDocumentBlobUrl] = useState<string | null>(null);
  
  // Timer interval reference
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  // Format YouTube URL for embedding
  const formatYouTubeUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0&autoplay=1` : url;
  };
  
  // Load document with authentication
  const loadDocument = async (doc: Document) => {
    if (!doc.id || !token) return;
    
    try {
      // Clean up previous blob URL if it exists
      if (documentBlobUrl) {
        URL.revokeObjectURL(documentBlobUrl);
      }
      
      const blob = await documentService.downloadDocument(token, doc.id);
      const newBlobUrl = URL.createObjectURL(blob);
      setDocumentBlobUrl(newBlobUrl);
      setCurrentDocumentUrl(null); // Clear the original URL since we're using blob now
    } catch (error) {
      console.error('Error loading document:', error);
    }
  };
  
  // Select a document to view
  const selectDocument = (doc: Document) => {
    loadDocument(doc);
  };
  
  // Clean up blob URLs when component unmounts
  useEffect(() => {
    return () => {
      if (documentBlobUrl) {
        URL.revokeObjectURL(documentBlobUrl);
      }
    };
  }, [documentBlobUrl]);
  
  // Load task data
  useEffect(() => {
    const loadTaskData = async () => {
      if (!taskId || !token) return;
      
      setIsLoading(true);
      
      try {
        // Fetch the task
        const taskId_num = parseInt(taskId);
        const taskData = await fetchTaskById(taskId_num);
        setTask(taskData);
        
        // Fetch resources for this specific task
        
        // Fetch documents for this task
        const taskDocs = await useDocumentStore.getState().fetchDocumentsForTask(token, taskId_num);
        setTaskDocuments(taskDocs);
        
        // Fetch videos for this task
        const taskVids = await useVideoStore.getState().fetchVideosForTask(token, taskId_num);
        setTaskVideos(taskVids);
        
        // Fetch notes for this task
        const taskNts = await useNoteStore.getState().fetchNotesForTask(token, taskId_num);
        setTaskNotes(taskNts);
        
        // Initialize first video if available
        if (taskVids.length > 0) {
          setCurrentVideoUrl(taskVids[0].url);
          setCurrentVideoIndex(0);
        }
        
        // Initialize first document if available
        if (taskDocs.length > 0) {
          loadDocument(taskDocs[0]);
        }
        
        // Create a new note for the session if none exists
        if (taskNts.length === 0 && taskData) {
          const newNoteTitle = `Notes for ${taskData.title}`;
          const emptyContent = '';
          
          const newNote = await addNote(
            token,
            newNoteTitle,
            emptyContent,
            [taskId_num]
          );
          
          if (newNote) {
            setCurrentNoteId(newNote.id ?? null);
            setNoteTitle(newNoteTitle);
            setNoteContent(emptyContent);
          }
        } else if (taskNts.length > 0) {
          // Use the first existing note
          const firstNote = taskNts[0];
          setCurrentNoteId(firstNote.id ?? null);
          setNoteTitle(firstNote.title);
          setNoteContent(firstNote.content);
        }
      } catch (error) {
        console.error('Error loading task data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTaskData();
    
    // Clean up timer when unmounting
    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [taskId, token, fetchTaskById, addNote]);
  
  // Timer logic
  useEffect(() => {
    if (isTimerRunning) {
      timerInterval.current = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            // Change phase (work <-> break)
            const newPhase = timerPhase === 'work' ? 'break' : 'work';
            setTimerPhase(newPhase);
            // Play notification sound
            const audio = new Audio('/notification.mp3');
            audio.play().catch(e => console.log('Audio error:', e));
            // Set new duration
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
  
  // Format time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Start/Stop timer
  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };
  
  // Reset timer
  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerPhase('work');
    setRemainingTime(workDuration);
  };
  
  // Save note content
  const saveNoteContent = async () => {
    if (currentNoteId && token) {
      await updateNote(
        token,
        currentNoteId,
        noteTitle,
        noteContent,
        taskId ? [parseInt(taskId)] : []
      );
    }
  };
  
  // Autosave every 5 seconds
  useEffect(() => {
    const saveInterval = setInterval(() => {
      saveNoteContent();
    }, 5000);
    
    return () => clearInterval(saveInterval);
  }, [noteContent, noteTitle, currentNoteId]);
  
  // Handle note change
  const handleNoteChange = (content: string) => {
    setNoteContent(content);
  };
  
  // Toggle section visibility
  const toggleSection = (section: SectionType) => {
    setSectionVisibility(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // Toggle fullscreen mode for a section
  const toggleFullscreen = (section: SectionType) => {
    // If another section is already fullscreen, disable it
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
  
  // Handle section position/size change
  const handleSectionChange = (section: SectionType, position: { x: number, y: number, width: number, height: number }) => {
    setSectionPositions(prev => ({
      ...prev,
      [section]: position
    }));
  };
  
  // Check if any section is in fullscreen mode
  const isAnyFullscreen = Object.values(sectionFullscreen).some(value => value);
  
  // Exit session
  const exitSession = () => {
    // Save notes before leaving
    saveNoteContent();
    navigate('/tasks');
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="session-container">
        <div className="loading-state">Loading session...</div>
      </div>
    );
  }

  return (
    <div className="session-container">
      {/* Top bar with timer and controls */}
      <div className="session-header">
        <button className="back-button" onClick={exitSession}>
          <FaChevronLeft /> Back
        </button>
        
        <div className="module-title">
          {task?.title} - Study Session
        </div>
        
        <div className="timer-container">
          <div className={`timer ${timerPhase === 'break' ? 'timer-break' : ''}`}>
            <span className="timer-phase">{timerPhase === 'work' ? 'Work' : 'Break'}</span>
            <span className="timer-display">{formatTime(remainingTime)}</span>
          </div>
          
          <div className="timer-controls">
            <button onClick={toggleTimer}>
              {isTimerRunning ? <FaPause /> : <FaPlay />}
            </button>
            <button onClick={resetTimer}>
              <FaStopwatch />
            </button>
            <button onClick={() => setIsTimerSettingsOpen(!isTimerSettingsOpen)}>
              <FaCog />
            </button>
          </div>
          
          {isTimerSettingsOpen && (
            <div className="timer-settings">
              <h3>Timer Settings</h3>
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
                    Custom
                  </label>
                </div>
                
                {timerMode === 'custom' && (
                  <div className="custom-timer-inputs">
                    <div>
                      <label>Work duration (min)</label>
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
                      <label>Break duration (min)</label>
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
              <button onClick={() => setIsTimerSettingsOpen(false)}>Close</button>
            </div>
          )}
        </div>
        
        <div className="session-controls">
          <button className="end-session-btn" onClick={exitSession}>
            End Session
          </button>
        </div>
      </div>
      
      {/* Toolbar for sections */}
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
            {sectionVisibility.videos ? <FaEye /> : <FaEyeSlash />} Videos
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
            {sectionVisibility.chatbot ? <FaEye /> : <FaEyeSlash />} AI Assistant
          </button>
        </div>
      </div>
      
      {/* Container for sections */}
      <div className="sections-container">
        {/* Documents Section */}
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
                {taskDocuments.length === 0 ? (
                  <div className="empty-message">No documents available</div>
                ) : (
                  taskDocuments.map(doc => (
                    <div 
                      key={doc.id} 
                      className={`document-item ${doc.id && documentBlobUrl !== null ? 'active' : ''}`}
                      onClick={() => selectDocument(doc)}
                    >
                      <div className="document-icon"><FaFile /></div>
                      <div className="document-name">{doc.name}</div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="document-preview">
                {documentBlobUrl ? (
                  <iframe 
                    src={documentBlobUrl} 
                    title="Document Preview" 
                    className="document-iframe"
                  />
                ) : (
                  <div className="no-document-selected">
                    Select a document to view
                  </div>
                )}
              </div>
            </div>
          </Rnd>
        )}
        
        {/* Videos Section */}
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
              <div className="video-player">
                {currentVideoUrl ? (
                  <iframe
                    src={formatYouTubeUrl(currentVideoUrl)}
                    title="YouTube Video Player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="no-video-selected">
                    Select a video to play
                  </div>
                )}
              </div>
              
              <div className="video-playlist">
                {taskVideos.length === 0 ? (
                  <div className="empty-message">No videos available</div>
                ) : (
                  taskVideos.map((video, index) => (
                    <div 
                      key={video.id} 
                      className={`video-item ${index === currentVideoIndex ? 'active' : ''}`}
                      onClick={() => {
                        setCurrentVideoIndex(index);
                        setCurrentVideoUrl(video.url);
                      }}
                    >
                      <div className="video-thumbnail">
                        <img 
                          src={videoService.getYouTubeThumbnailUrl(videoService.getYouTubeVideoId(video.url) || '')} 
                          alt={video.title} 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/120x68?text=No+Thumbnail';
                          }}
                        />
                      </div>
                      <div className="video-info">
                        <div className="video-title">{video.title}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Rnd>
        )}
        
        {/* Notes Section */}
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
                    placeholder="Note title"
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
                  placeholder="Start taking notes..."
                />
                
                <div className="note-status">
                  Autosave enabled
                </div>
              </div>
            </div>
          </Rnd>
        )}
        
        {/* Chatbot Section */}
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
              <h2>AI Assistant</h2>
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
                    Hello! I'm your study assistant for this task: "{task?.title}". 
                    I can help you understand your documents and videos. 
                    (Feature not yet connected to backend)
                  </div>
                </div>
              </div>
              
              <div className="chatbot-input-container">
                <input
                  type="text"
                  placeholder="Ask a question about your documents..."
                  className="chatbot-input"
                  disabled
                />
                <button className="chatbot-send-button" disabled>
                  Send
                </button>
              </div>
              
              <div className="chatbot-info">
                Note: RAG AI will be integrated later via the backend
              </div>
            </div>
          </Rnd>
        )}
      </div>
    </div>
  );
};

export default TaskSession; 