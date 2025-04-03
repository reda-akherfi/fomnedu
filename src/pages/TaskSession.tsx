import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Rnd } from 'react-rnd';
import { FaPlay, FaPause, FaStopwatch, FaExpand, FaCompress, FaEye, FaEyeSlash, FaTimes, FaCog, FaChevronLeft, FaFile, FaVideo, FaStickyNote, FaSpinner } from 'react-icons/fa';
import useTaskStore from '../stores/useTaskStore';
import useDocumentStore from '../stores/useDocumentStore';
import useVideoStore from '../stores/useVideoStore';
import useNoteStore from '../stores/useNoteStore';
import useTimerStore from '../stores/useTimerStore';
import useAuthStore from '../stores/useAuthStore';
import { documentService } from '../services/documentService';
import { videoService } from '../services/videoService';
import { Timer, TimerType, TimerStatus } from '../services/timerService';
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
  const { token } = useAuthStore();
  const { 
    createTimer, pauseTimer, resumeTimer, stopTimer, 
    fetchTimersForTask, activeTimer, setActiveTimer 
  } = useTimerStore();
  
  // Task data states
  const [task, setTask] = useState<Task | null>(null);
  const [taskDocuments, setTaskDocuments] = useState<Document[]>([]);
  const [taskVideos, setTaskVideos] = useState<Video[]>([]);
  const [taskNotes, setTaskNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Timer states
  const [timerMode, setTimerMode] = useState<TimerType>(TimerType.POMODORO);
  const [workDuration, setWorkDuration] = useState(25 * 60); // 25 minutes in seconds
  const [breakDuration, setBreakDuration] = useState(5 * 60); // 5 minutes in seconds
  const [remainingTime, setRemainingTime] = useState(workDuration);
  const [isTimerSettingsOpen, setIsTimerSettingsOpen] = useState(false);
  const [timerError, setTimerError] = useState<string | null>(null);
  const [isCreatingTimer, setIsCreatingTimer] = useState(false);
  
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
  
  // Local timer update reference
  const localTimerRef = useRef<NodeJS.Timeout | null>(null);

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
        
        // Fetch timers for this task
        const timers = await fetchTimersForTask(taskId_num);
        
        // Set active timer if one exists and is running or paused
        const runningTimer = timers.find(t => t.status !== TimerStatus.COMPLETED);
        if (runningTimer) {
          setActiveTimer(runningTimer);
          if (runningTimer.remainingSeconds) {
            setRemainingTime(runningTimer.remainingSeconds);
          }
        }
        
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
          
          const newNote = await useNoteStore.getState().addNote(
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
    
    // Clean up local timer when unmounting
    return () => {
      if (localTimerRef.current) {
        clearInterval(localTimerRef.current);
      }
    };
  }, [taskId, token, fetchTaskById, fetchTimersForTask, setActiveTimer]);
  
  // Effect to update timer UI from active timer
  useEffect(() => {
    // If we have an active timer from the server
    if (activeTimer) {
      // Update UI based on timer state
      if (activeTimer.timerType) {
        setTimerMode(activeTimer.timerType);
      }
      
      // Update remaining time display
      if (activeTimer.remainingSeconds !== undefined) {
        setRemainingTime(activeTimer.remainingSeconds);
      }
      
      // Start local timer update if timer is running
      if (activeTimer.status === TimerStatus.RUNNING && !localTimerRef.current) {
        localTimerRef.current = setInterval(() => {
          setRemainingTime(prev => {
            if (prev <= 1) {
              // We'll let the server handle this case in a real implementation
              // For now, just reset the timer for demo purposes
              return activeTimer.timerType === TimerType.POMODORO ? 
                (activeTimer.isBreak ? workDuration : breakDuration) : 
                0;
            }
            return prev - 1;
          });
        }, 1000);
      } else if (activeTimer.status !== TimerStatus.RUNNING && localTimerRef.current) {
        // Clear interval if timer is paused or stopped
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
  }, [activeTimer, workDuration, breakDuration]);
  
  // Format time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Start/Stop timer
  const toggleTimer = async () => {
    if (!taskId || !token) return;
    
    try {
      setTimerError(null);
      
      if (!activeTimer) {
        // Create a new timer
        setIsCreatingTimer(true);
        
        const newTimer: Omit<Timer, 'id' | 'createdAt' | 'status'> = {
          timerType: timerMode,
          taskIds: [parseInt(taskId)],
          title: task?.title ? `Timer for ${task.title}` : 'Study Session',
          durationSeconds: timerMode !== TimerType.STOPWATCH ? workDuration : undefined,
          isBreak: false
        };
        
        await createTimer(newTimer);
      } else if (activeTimer.status === TimerStatus.RUNNING) {
        // Pause the timer
        await pauseTimer(activeTimer.id!);
      } else if (activeTimer.status === TimerStatus.PAUSED) {
        // Resume the timer
        await resumeTimer(activeTimer.id!);
      }
    } catch (error) {
      setTimerError(error instanceof Error ? error.message : 'Error managing timer');
      console.error('Timer error:', error);
    } finally {
      setIsCreatingTimer(false);
    }
  };
  
  // Reset timer
  const resetTimer = async () => {
    if (!activeTimer || !activeTimer.id) return;
    
    try {
      setTimerError(null);
      
      // Stop the current timer
      await stopTimer(activeTimer.id);
      
      // Create a new timer for next session if needed
      if (taskId && token) {
        const newTimer: Omit<Timer, 'id' | 'createdAt' | 'status'> = {
          timerType: timerMode,
          taskIds: [parseInt(taskId)],
          title: task?.title ? `Timer for ${task.title}` : 'Study Session',
          durationSeconds: timerMode !== TimerType.STOPWATCH ? workDuration : undefined,
          isBreak: false
        };
        
        await createTimer(newTimer);
      }
    } catch (error) {
      setTimerError(error instanceof Error ? error.message : 'Error resetting timer');
      console.error('Timer reset error:', error);
    }
  };
  
  // Save note content
  const saveNoteContent = async () => {
    if (currentNoteId && token) {
      await useNoteStore.getState().updateNote(
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
  
  // Toggle fullscreen mode for a section
  const toggleFullscreen = useCallback((section: SectionType) => {
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
  }, [sectionFullscreen]);
  
  // Handle keyboard shortcuts for fullscreen toggle
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Check if Alt key is pressed along with 1-4
    if (event.altKey && !event.ctrlKey && !event.shiftKey && !event.metaKey) {
      const sectionMap: Record<string, SectionType> = {
        '1': 'documents',
        '2': 'videos',
        '3': 'notes',
        '4': 'chatbot'
      };
      
      const section = sectionMap[event.key];
      
      if (section && sectionVisibility[section]) {
        event.preventDefault();
        toggleFullscreen(section);
      }
    }
    
    // Add 'alt-key-pressed' class to body when Alt is pressed
    if (event.key === 'Alt') {
      document.body.classList.add('alt-key-pressed');
    }
  }, [sectionVisibility, toggleFullscreen]);
  
  // Handle keyboard up events to remove Alt key indicator
  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Alt') {
      document.body.classList.remove('alt-key-pressed');
    }
  }, []);
  
  // Add and remove keyboard event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      // Ensure alt-key-pressed class is removed on unmount
      document.body.classList.remove('alt-key-pressed');
    };
  }, [handleKeyDown, handleKeyUp]);
  
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
  const exitSession = async () => {
    // Save notes before leaving
    await saveNoteContent();
    
    // If there's an active timer, pause it
    if (activeTimer && activeTimer.status === TimerStatus.RUNNING && activeTimer.id) {
      try {
        await pauseTimer(activeTimer.id);
      } catch (error) {
        console.error('Error pausing timer on exit:', error);
      }
    }
    
    navigate('/tasks');
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="session-container">
        <div className="loading-state">
          <FaSpinner className="loading-spinner" />
          <div>Loading session...</div>
        </div>
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
          {task?.title}
        </div>
        
        <div className="timer-container">
          <div className={`timer ${activeTimer?.isBreak ? 'timer-break' : ''}`}>
            <span className="timer-phase">
              {activeTimer?.isBreak ? 'Break' : 'Work'}
            </span>
            <span className="timer-display">{formatTime(remainingTime)}</span>
          </div>
          
          <div className="timer-controls">
            <button 
              onClick={toggleTimer} 
              disabled={isCreatingTimer}
            >
              {isCreatingTimer ? (
                <FaSpinner className="loading-spinner-small" />
              ) : activeTimer?.status === TimerStatus.RUNNING ? (
                <FaPause />
              ) : (
                <FaPlay />
              )}
            </button>
            <button onClick={resetTimer} disabled={!activeTimer || isCreatingTimer}>
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
                      checked={timerMode === TimerType.POMODORO}
                      onChange={() => {
                        setTimerMode(TimerType.POMODORO);
                        setWorkDuration(25 * 60);
                        setBreakDuration(5 * 60);
                      }}
                    />
                    Pomodoro (25/5)
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="timerMode"
                      checked={timerMode === TimerType.COUNTDOWN}
                      onChange={() => setTimerMode(TimerType.COUNTDOWN)}
                    />
                    Countdown
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="timerMode"
                      checked={timerMode === TimerType.STOPWATCH}
                      onChange={() => setTimerMode(TimerType.STOPWATCH)}
                    />
                    Stopwatch
                  </label>
                </div>
                
                {timerMode !== TimerType.STOPWATCH && (
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
                        }}
                      />
                    </div>
                    {timerMode === TimerType.POMODORO && (
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
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
              {timerError && <div className="timer-error">{timerError}</div>}
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
      
      {/* Container for sections */}
      <div className={`sections-container ${isAnyFullscreen ? 'has-fullscreen' : ''}`}>
        {/* Documents Section */}
        {sectionVisibility.documents && (
          <div className={`section ${sectionFullscreen.documents ? 'fullscreen' : ''}`}>
            <div className="section-header">
              <h2>Documents <span className="keyboard-shortcut">(Alt+1)</span></h2>
              <div className="section-controls">
                <button onClick={() => toggleFullscreen('documents')} title="Toggle fullscreen (Alt+1)">
                  {sectionFullscreen.documents ? <FaCompress /> : <FaExpand />}
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
          </div>
        )}
        
        {/* Videos Section */}
        {sectionVisibility.videos && (
          <div className={`section ${sectionFullscreen.videos ? 'fullscreen' : ''}`}>
            <div className="section-header">
              <h2>Videos <span className="keyboard-shortcut">(Alt+2)</span></h2>
              <div className="section-controls">
                <button onClick={() => toggleFullscreen('videos')} title="Toggle fullscreen (Alt+2)">
                  {sectionFullscreen.videos ? <FaCompress /> : <FaExpand />}
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
          </div>
        )}
        
        {/* Notes Section */}
        {sectionVisibility.notes && (
          <div className={`section ${sectionFullscreen.notes ? 'fullscreen' : ''}`}>
            <div className="section-header">
              <h2>Notes <span className="keyboard-shortcut">(Alt+3)</span></h2>
              <div className="section-controls">
                <button onClick={() => toggleFullscreen('notes')} title="Toggle fullscreen (Alt+3)">
                  {sectionFullscreen.notes ? <FaCompress /> : <FaExpand />}
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
          </div>
        )}
        
        {/* Chatbot Section */}
        {sectionVisibility.chatbot && (
          <div className={`section ${sectionFullscreen.chatbot ? 'fullscreen' : ''}`}>
            <div className="section-header">
              <h2>AI Assistant <span className="keyboard-shortcut">(Alt+4)</span></h2>
              <div className="section-controls">
                <button onClick={() => toggleFullscreen('chatbot')} title="Toggle fullscreen (Alt+4)">
                  {sectionFullscreen.chatbot ? <FaCompress /> : <FaExpand />}
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
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskSession; 