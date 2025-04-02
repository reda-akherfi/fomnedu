import { useState, useEffect, FormEvent } from 'react';
import { FaPlus, FaTrash, FaLink, FaEdit, FaExclamationTriangle, FaFilter, FaStickyNote } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import useNoteStore from '../stores/useNoteStore';
import useTaskStore from '../stores/useTaskStore';
import useAuthStore from '../stores/useAuthStore';
import { Note } from '../services/noteService';

const NoteView = () => {
  const { token } = useAuthStore();
  const { notes, isLoading, error, fetchAllNotes, addNote, updateNote, deleteNote } = useNoteStore();
  const { tasks, fetchAllTasks } = useTaskStore();
  
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentNoteId, setCurrentNoteId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);
  const [filterTaskId, setFilterTaskId] = useState<number | null>(null);
  
  // Fetch initial data
  useEffect(() => {
    if (token) {
      fetchAllNotes(token);
      fetchAllTasks();
    }
  }, [token, fetchAllNotes, fetchAllTasks]);
  
  // Open modal for adding/editing
  const handleOpenModal = (noteToEdit: Note | null = null) => {
    if (noteToEdit) {
      // Edit mode
      setIsEditMode(true);
      setCurrentNoteId(noteToEdit.id ?? null);
      setTitle(noteToEdit.title);
      setContent(noteToEdit.content);
      setSelectedTaskIds(noteToEdit.taskIds || []);
    } else {
      // Create mode
      setIsEditMode(false);
      setCurrentNoteId(null);
      setTitle('');
      setContent('');
      setSelectedTaskIds([]);
    }
    setShowModal(true);
  };
  
  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validate input
    if (!title.trim()) return;
    if (!content.trim()) return;
    if (!token) return;
    
    try {
      if (isEditMode && currentNoteId) {
        // Update existing note
        await updateNote(
          token, 
          currentNoteId, 
          title.trim(), 
          content.trim(), 
          selectedTaskIds
        );
      } else {
        // Create new note
        await addNote(
          token,
          title.trim(),
          content.trim(),
          selectedTaskIds
        );
      }
      
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };
  
  // Delete a note
  const handleDeleteNote = async (id: number) => {
    if (!token) return;
    if (window.confirm(`Are you sure you want to delete this note?`)) {
      await deleteNote(token, id);
    }
  };
  
  // Reset the form
  const resetForm = () => {
    setTitle('');
    setContent('');
    setSelectedTaskIds([]);
  };
  
  // Toggle task selection
  const handleTaskToggle = (taskId: number) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
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
  
  // Get tasks associated with a note
  const getAssociatedTasks = (note: Note) => {
    if (!note.taskIds) return [];
    return tasks.filter(task => note.taskIds.includes(task.id as number));
  };
  
  // Filter notes by task
  const filteredNotes = filterTaskId
    ? notes.filter(note => note.taskIds && note.taskIds.includes(filterTaskId))
    : notes;
  
  // Truncate content for preview
  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };
  
  // Show loading state
  if (isLoading && notes.length === 0) {
    return (
      <div className="page-container">
        <div className="loading-state">Loading notes...</div>
      </div>
    );
  }
  
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Notes</h1>
        <div className="header-actions">
          <div className="filter-controls">
            <button 
              className={`filter-button ${filterTaskId === null ? 'active' : ''}`} 
              onClick={() => setFilterTaskId(null)}
            >
              <FaFilter /> All Notes
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
          <button className="create-button" onClick={() => handleOpenModal()}>
            <FaPlus /> Add Note
          </button>
        </div>
      </div>
      
      {error && (
        <div className="error-message">
          <FaExclamationTriangle /> {error}
        </div>
      )}
      
      <div className="notes-grid-container">
        {filteredNotes.length === 0 ? (
          <div className="empty-state">
            <FaStickyNote size={48} />
            <p>No notes found</p>
            <button onClick={() => handleOpenModal()}>Add your first note</button>
          </div>
        ) : (
          <div className="notes-grid">
            {filteredNotes.map(note => (
              <div key={note.id} className="note-card">
                <div className="note-header">
                  <h3>{note.title}</h3>
                  <div className="note-actions">
                    <button 
                      className="icon-button edit" 
                      onClick={() => handleOpenModal(note)}
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button 
                      className="icon-button delete" 
                      onClick={() => note.id && handleDeleteNote(note.id)}
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
                <div className="note-content">
                  {truncateContent(note.content)}
                </div>
                <div className="note-footer">
                  <div className="note-date">
                    Created: {formatDate(note.createdAt)}
                  </div>
                  <div className="note-tasks">
                    {getAssociatedTasks(note).length > 0 ? (
                      <div className="task-chips">
                        {getAssociatedTasks(note).map(task => (
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
              </div>
            ))}
          </div>
        )}
      </div>
      
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h2>{isEditMode ? 'Edit Note' : 'Add Note'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="noteTitle">Title *</label>
                <input
                  id="noteTitle"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Note title"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="noteContent">Content *</label>
                <textarea
                  id="noteContent"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Note content..."
                  rows={5}
                  required
                />
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
                  disabled={!title.trim() || !content.trim() || isLoading}
                >
                  {isLoading ? 'Processing...' : isEditMode ? 'Update Note' : 'Add Note'}
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

export default NoteView; 