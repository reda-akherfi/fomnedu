import React, { useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaExclamationTriangle, FaStickyNote } from 'react-icons/fa';
import { formatDate } from '../utils/dateUtils';

// Define the Note and Task interfaces
interface Task {
  id: number;
  title: string;
}

interface Note {
  id: number;
  title: string;
  content: string;
  taskIds: number[];
  createdAt: string;
}

const Notes: React.FC = () => {
  const [filterTaskId, setFilterTaskId] = useState<number | null>(null);
  const [taskDropdownOpen, setTaskDropdownOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const handleEditNote = (note: Note) => {
    // Implement the edit note logic
  };

  const handleDeleteNote = (id: number) => {
    // Implement the delete note logic
  };

  const getAssociatedTasks = (note: Note): Task[] => {
    // Implement the logic to get associated tasks
    return tasks.filter(task => note.taskIds.includes(task.id));
  };

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
              All Notes
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
            <FaPlus /> Add Note
          </button>
        </div>
      </div>
      
      <div className="content-separator"></div>
      
      <div className="list-wrapper">
        <div className="notes-grid-container">
          {error && (
            <div className="error-message">
              <FaExclamationTriangle /> {error}
            </div>
          )}
          
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading notes...</p>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="empty-state">
              <FaStickyNote size={48} />
              <p>No notes found</p>
              <button onClick={() => setShowModal(true)}>Create your first note</button>
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
                        title="Edit"
                        onClick={() => handleEditNote(note)}
                      >
                        <FaEdit />
                      </button>
                      {note.id && (
                        <button 
                          className="icon-button delete"
                          title="Delete"
                          onClick={() => handleDeleteNote(note.id as number)}
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="note-content">
                    {note.content}
                  </div>
                  
                  <div className="note-footer">
                    <div className="task-chips">
                      {getAssociatedTasks(note).map(task => (
                        <span key={task.id} className="task-chip-small">
                          {task.title}
                        </span>
                      ))}
                      {note.taskIds.length === 0 && (
                        <span className="no-tasks">No tasks</span>
                      )}
                    </div>
                    <div className="note-date">
                      {formatDate(note.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Add/Edit Note Modal */}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Add Note</h2>
            <form>
              {/* Note form content would go here */}
            </form>
            <div className="modal-actions">
              <button 
                className="button secondary"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button 
                className="button primary"
                type="submit"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes; 