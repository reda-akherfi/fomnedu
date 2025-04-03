import { useState, useEffect, FormEvent } from 'react';
import { FaPlus, FaEdit, FaTrash, FaCheck, FaPlay, FaClock, FaExclamationTriangle, FaFilter, FaFile, FaFileAlt, FaLink, FaDownload, FaEye, FaVideo, FaStickyNote, FaTasks, FaClipboardList } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import useTaskStore from '../stores/useTaskStore';
import useDocumentStore from '../stores/useDocumentStore';
import useVideoStore from '../stores/useVideoStore';
import useNoteStore from '../stores/useNoteStore';
import useAuthStore from '../stores/useAuthStore';
import { Task, TaskStatus, TaskPriority } from '../services/taskService';
import { Document, documentService } from '../services/documentService';
import { Note } from '../services/noteService';
import { Video } from '../services/videoService';

const Tasks = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { tasks, isLoading, error, fetchAllTasks, addTask, updateTask, deleteTask } = useTaskStore();
  const { documents, fetchAllDocuments } = useDocumentStore();
  const { videos, fetchAllVideos } = useVideoStore();
  const { notes, fetchAllNotes } = useNoteStore();
  
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.PENDING);
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [dueDate, setDueDate] = useState('');
  const [filter, setFilter] = useState<{status?: TaskStatus, priority?: TaskPriority}>({});
  const [taskDocuments, setTaskDocuments] = useState<Record<number, Document[]>>({});
  const [taskVideos, setTaskVideos] = useState<Record<number, Video[]>>({});
  const [taskNotes, setTaskNotes] = useState<Record<number, Note[]>>({});
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'documents' | 'videos' | 'notes'>('documents');
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');
  
  useEffect(() => {
    if (token) {
      fetchAllTasks();
      fetchAllDocuments(token);
      fetchAllVideos(token);
      fetchAllNotes(token);
    }
  }, [fetchAllTasks, fetchAllDocuments, fetchAllVideos, fetchAllNotes, token]);
  
  useEffect(() => {
    // Map documents to tasks
    const docMap: Record<number, Document[]> = {};
    
    if (documents.length > 0 && tasks.length > 0) {
      tasks.forEach(task => {
        if (task.id) {
          const taskId = task.id as number;
          docMap[taskId] = documents.filter(doc => doc.taskIds.includes(taskId));
        }
      });
    }
    
    setTaskDocuments(docMap);
  }, [documents, tasks]);
  
  useEffect(() => {
    // Map videos to tasks
    const videoMap: Record<number, Video[]> = {};
    
    if (videos.length > 0 && tasks.length > 0) {
      tasks.forEach(task => {
        if (task.id) {
          const taskId = task.id as number;
          videoMap[taskId] = videos.filter(video => video.taskIds && video.taskIds.includes(taskId));
        }
      });
    }
    
    setTaskVideos(videoMap);
  }, [videos, tasks]);
  
  useEffect(() => {
    // Map notes to tasks
    const noteMap: Record<number, Note[]> = {};
    
    if (notes.length > 0 && tasks.length > 0) {
      tasks.forEach(task => {
        if (task.id) {
          const taskId = task.id as number;
          noteMap[taskId] = notes.filter(note => note.taskIds && note.taskIds.includes(taskId));
        }
      });
    }
    
    setTaskNotes(noteMap);
  }, [notes, tasks]);
  
  const handleOpenModal = (taskToEdit: Task | null = null) => {
    if (taskToEdit) {
      setIsEditMode(true);
      setCurrentTaskId(taskToEdit.id ?? null);
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description);
      setStatus(taskToEdit.status);
      setPriority(taskToEdit.priority);
      
      // Format the date for the input field (YYYY-MM-DDThh:mm)
      if (taskToEdit.dueDate) {
        const date = new Date(taskToEdit.dueDate);
        setDueDate(date.toISOString().slice(0, 16));
      } else {
        setDueDate('');
      }
    } else {
      setIsEditMode(false);
      setCurrentTaskId(null);
      setTitle('');
      setDescription('');
      setStatus(TaskStatus.PENDING);
      setPriority(TaskPriority.MEDIUM);
      setDueDate('');
    }
    setShowModal(true);
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;
    
    const taskData = {
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      dueDate: dueDate ? new Date(dueDate).toISOString() : new Date().toISOString()
    };
    
    if (isEditMode && currentTaskId !== null) {
      await updateTask(currentTaskId, taskData);
    } else {
      await addTask(taskData);
    }
    
    setShowModal(false);
    resetForm();
  };
  
  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await deleteTask(id);
    }
  };
  
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStatus(TaskStatus.PENDING);
    setPriority(TaskPriority.MEDIUM);
    setDueDate('');
  };
  
  const getStatusClass = (taskStatus: TaskStatus) => {
    switch (taskStatus) {
      case TaskStatus.COMPLETED:
        return 'completed';
      case TaskStatus.IN_PROGRESS:
        return 'in-progress';
      default:
        return 'pending';
    }
  };
  
  const getStatusIcon = (taskStatus: TaskStatus) => {
    switch (taskStatus) {
      case TaskStatus.COMPLETED:
        return <FaCheck className="status-icon completed" />;
      case TaskStatus.IN_PROGRESS:
        return <FaPlay className="status-icon in-progress" />;
      default:
        return <FaClock className="status-icon pending" />;
    }
  };
  
  const getPriorityLabel = (taskPriority: TaskPriority) => {
    switch (taskPriority) {
      case TaskPriority.HIGH:
        return <span className="priority-badge high">High</span>;
      case TaskPriority.MEDIUM:
        return <span className="priority-badge medium">Medium</span>;
      case TaskPriority.LOW:
        return <span className="priority-badge low">Low</span>;
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const filteredTasks = tasks.filter(task => {
    if (filter.status && task.status !== filter.status) {
      return false;
    }
    if (filter.priority && task.priority !== filter.priority) {
      return false;
    }
    return true;
  });
  
  const toggleExpandTask = (taskId: number | undefined) => {
    if (!taskId) return;
    if (expandedTaskId === taskId) {
      setExpandedTaskId(null);
    } else {
      setExpandedTaskId(taskId);
      setActiveTab('documents');
    }
  };
  
  const handleDownloadDocument = async (doc: Document) => {
    if (!doc.id || !token) return;
    
    try {
      setDownloadingIds(prev => new Set(prev).add(doc.id as string));
      
      const blob = await documentService.downloadDocument(token, doc.id);
      
      // Create a download link
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = doc.name;
      window.document.body.appendChild(a);
      a.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading document:', error);
    } finally {
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(doc.id as string);
        return newSet;
      });
    }
  };
  
  const handleOpenDocument = (doc: Document) => {
    if (!doc.id || !token) return;
    documentService.openDocumentInNewTab(token, doc.id, doc.name);
  };
  
  const startTaskSession = (taskId: number | undefined) => {
    if (!taskId) return;
    navigate(`/task-session/${taskId}`);
  };
  
  if (isLoading && tasks.length === 0) {
    return (
      <div className="page-container">
        <div className="loading-state">Loading tasks...</div>
      </div>
    );
  }
  
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Tasks</h1>
        <div className="header-actions">
          <div className="filter-controls">
            <button 
              className={`filter-button ${Object.keys(filter).length === 0 ? 'active' : ''}`} 
              onClick={() => setFilter({})}
            >
              All Tasks
            </button>
            <div className="dropdown">
              <button className="filter-button" onClick={() => {
                setStatusDropdownOpen(!statusDropdownOpen);
                setPriorityDropdownOpen(false);
              }}>
                Status: {filter.status ? filter.status.replace('_', ' ') : 'All'}
              </button>
              <div className={`dropdown-content ${statusDropdownOpen ? 'show' : ''}`}>
                <button onClick={() => {
                  setFilter(f => ({ ...f, status: undefined }));
                  setStatusDropdownOpen(false);
                }}>
                  All Statuses
                </button>
                <button onClick={() => {
                  setFilter(f => ({ ...f, status: TaskStatus.PENDING }));
                  setStatusDropdownOpen(false);
                }}>
                  Pending
                </button>
                <button onClick={() => {
                  setFilter(f => ({ ...f, status: TaskStatus.IN_PROGRESS }));
                  setStatusDropdownOpen(false);
                }}>
                  In Progress
                </button>
                <button onClick={() => {
                  setFilter(f => ({ ...f, status: TaskStatus.COMPLETED }));
                  setStatusDropdownOpen(false);
                }}>
                  Completed
                </button>
              </div>
            </div>
            <div className="dropdown">
              <button className="filter-button" onClick={() => {
                setPriorityDropdownOpen(!priorityDropdownOpen);
                setStatusDropdownOpen(false);
              }}>
                Priority: {filter.priority ? filter.priority : 'All'}
              </button>
              <div className={`dropdown-content ${priorityDropdownOpen ? 'show' : ''}`}>
                <button onClick={() => {
                  setFilter(f => ({ ...f, priority: undefined }));
                  setPriorityDropdownOpen(false);
                }}>
                  All Priorities
                </button>
                <button onClick={() => {
                  setFilter(f => ({ ...f, priority: TaskPriority.HIGH }));
                  setPriorityDropdownOpen(false);
                }}>
                  High
                </button>
                <button onClick={() => {
                  setFilter(f => ({ ...f, priority: TaskPriority.MEDIUM }));
                  setPriorityDropdownOpen(false);
                }}>
                  Medium
                </button>
                <button onClick={() => {
                  setFilter(f => ({ ...f, priority: TaskPriority.LOW }));
                  setPriorityDropdownOpen(false);
                }}>
                  Low
                </button>
              </div>
            </div>
          </div>
          <button className="create-button" onClick={() => handleOpenModal()}>
            <FaPlus /> New Task
          </button>
        </div>
      </div>
      
      <div className="task-content">
        <div className="task-list">
          {error && (
            <div className="error-message">
              <FaExclamationTriangle /> {error}
            </div>
          )}
          
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading tasks...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="empty-state">
              <FaClipboardList size={48} />
              <p>No tasks found</p>
              <button onClick={() => handleOpenModal()}>Create your first task</button>
            </div>
          ) : (
            <ul>
              {filteredTasks.map(task => (
                <li key={task.id} className={`task-item ${getStatusClass(task.status)}`}>
                  <div className="task-header">
                    <div className="task-title">
                      {getStatusIcon(task.status)}
                      <h4>{task.title}</h4>
                      {getPriorityLabel(task.priority)}
                    </div>
                    <div className="task-actions">
                      <button
                        className="icon-button play"
                        onClick={() => startTaskSession(task.id)}
                        title="Start Session"
                      >
                        <FaPlay />
                      </button>
                      <button
                        className="icon-button info"
                        onClick={() => toggleExpandTask(task.id)}
                        title="View Details"
                      >
                        <FaFileAlt />
                      </button>
                      <button
                        className="icon-button edit"
                        onClick={() => handleOpenModal(task)}
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="icon-button delete"
                        onClick={() => task.id && handleDelete(task.id)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  
                  {task.description && (
                    <div className="task-description">{task.description}</div>
                  )}
                  
                  {expandedTaskId === task.id && task.id && (
                    <div className="task-details">
                      <div className="task-tabs">
                        <button 
                          className={`tab-button ${activeTab === 'documents' ? 'active' : ''}`}
                          onClick={() => setActiveTab('documents')}
                        >
                          <FaFile /> Documents {taskDocuments[task.id] ? `(${taskDocuments[task.id].length})` : '(0)'}
                        </button>
                        <button 
                          className={`tab-button ${activeTab === 'videos' ? 'active' : ''}`}
                          onClick={() => setActiveTab('videos')}
                        >
                          <FaVideo /> Videos {taskVideos[task.id] ? `(${taskVideos[task.id].length})` : '(0)'}
                        </button>
                        <button 
                          className={`tab-button ${activeTab === 'notes' ? 'active' : ''}`}
                          onClick={() => setActiveTab('notes')}
                        >
                          <FaStickyNote /> Notes {taskNotes[task.id] ? `(${taskNotes[task.id].length})` : '(0)'}
                        </button>
                      </div>
                      
                      {activeTab === 'documents' && (
                        <div className="task-documents">
                          {taskDocuments[task.id] && taskDocuments[task.id].length > 0 ? (
                            <ul className="documents-list">
                              {taskDocuments[task.id].map(doc => (
                                <li key={doc.id} className="document-item-small">
                                  <div className="document-item-content">
                                    <FaFileAlt className="document-icon" />
                                    <span>{doc.name}</span>
                                  </div>
                                  <div className="document-item-actions">
                                    <button 
                                      onClick={() => handleDownloadDocument(doc)}
                                      className="icon-button small download"
                                      title="Download"
                                      disabled={downloadingIds.has(doc.id as string)}
                                    >
                                      {downloadingIds.has(doc.id as string) ? (
                                        <span className="loading-spinner-mini"></span>
                                      ) : (
                                        <FaDownload />
                                      )}
                                    </button>
                                    <button 
                                      onClick={() => handleOpenDocument(doc)}
                                      className="icon-button small view"
                                      title="View"
                                    >
                                      <FaEye />
                                    </button>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="no-documents">
                              No documents associated with this task.
                              <Link to="/documents" className="add-document-link">
                                <FaLink /> Upload documents
                              </Link>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {activeTab === 'videos' && (
                        <div className="task-videos">
                          {taskVideos[task.id] && taskVideos[task.id].length > 0 ? (
                            <ul className="videos-list">
                              {taskVideos[task.id].map(video => (
                                <li key={video.id} className="video-item-small">
                                  <div className="video-item-content">
                                    <FaVideo className="video-icon" />
                                    <span>{video.title}</span>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="no-videos">
                              No videos associated with this task.
                            </div>
                          )}
                        </div>
                      )}
                      
                      {activeTab === 'notes' && (
                        <div className="task-notes">
                          {taskNotes[task.id] && taskNotes[task.id].length > 0 ? (
                            <ul className="notes-list">
                              {taskNotes[task.id].map(note => (
                                <li key={note.id} className="note-item-small">
                                  <div className="note-item-content">
                                    <FaStickyNote className="note-icon" />
                                    <span>{note.title}</span>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="no-notes">
                              No notes associated with this task.
                            </div>
                          )}
                        </div>
                      )}
                      
                      <button 
                        className="start-session-btn"
                        onClick={() => startTaskSession(task.id)}
                      >
                        <FaPlay /> Start Session
                      </button>
                    </div>
                  )}
                  
                  <div className="task-dates">
                    <span>Due: {formatDate(task.dueDate)}</span>
                    {task.createdAt && (
                      <span>Created: {formatDate(task.createdAt)}</span>
                    )}
                    <button 
                      className="icon-button small play"
                      onClick={() => startTaskSession(task.id)}
                      title="Start Session"
                    >
                      <FaPlay /> Start Session
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h2>{isEditMode ? 'Edit Task' : 'Create New Task'}</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="taskTitle">Title *</label>
                <input
                  id="taskTitle"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Task title"
                  maxLength={100}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="taskDescription">Description</label>
                <textarea
                  id="taskDescription"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Task description"
                  rows={3}
                  maxLength={1000}
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="taskStatus">Status</label>
                  <select
                    id="taskStatus"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  >
                    <option value={TaskStatus.PENDING}>Pending</option>
                    <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
                    <option value={TaskStatus.COMPLETED}>Completed</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="taskPriority">Priority</label>
                  <select
                    id="taskPriority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  >
                    <option value={TaskPriority.LOW}>Low</option>
                    <option value={TaskPriority.MEDIUM}>Medium</option>
                    <option value={TaskPriority.HIGH}>High</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="taskDueDate">Due Date</label>
                <input
                  id="taskDueDate"
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              
              <div className="modal-actions">
                <button
                  type="submit"
                  disabled={!title.trim() || isLoading}
                >
                  {isLoading ? 'Processing...' : isEditMode ? 'Update Task' : 'Create Task'}
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

export default Tasks; 