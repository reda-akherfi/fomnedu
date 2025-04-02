import { useState, useEffect, FormEvent } from 'react';
import { FaPlus, FaEdit, FaTrash, FaCheck, FaPlay, FaClock, FaExclamationTriangle, FaFilter } from 'react-icons/fa';
import useTaskStore from '../stores/useTaskStore';
import useAuthStore from '../stores/useAuthStore';
import { Task, TaskStatus, TaskPriority } from '../services/taskService';

const Tasks = () => {
  const { token } = useAuthStore();
  const { tasks, isLoading, error, fetchAllTasks, addTask, updateTask, deleteTask } = useTaskStore();
  
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.PENDING);
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [dueDate, setDueDate] = useState('');
  const [filter, setFilter] = useState<{status?: TaskStatus, priority?: TaskPriority}>({});
  
  useEffect(() => {
    fetchAllTasks();
  }, [fetchAllTasks, token]);
  
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
              <FaFilter /> All Tasks
            </button>
            <div className="dropdown">
              <button className="filter-button">
                Status: {filter.status ? filter.status.replace('_', ' ') : 'All'}
              </button>
              <div className="dropdown-content">
                <button onClick={() => setFilter(f => ({ ...f, status: undefined }))}>
                  All Statuses
                </button>
                <button onClick={() => setFilter(f => ({ ...f, status: TaskStatus.PENDING }))}>
                  Pending
                </button>
                <button onClick={() => setFilter(f => ({ ...f, status: TaskStatus.IN_PROGRESS }))}>
                  In Progress
                </button>
                <button onClick={() => setFilter(f => ({ ...f, status: TaskStatus.COMPLETED }))}>
                  Completed
                </button>
              </div>
            </div>
            <div className="dropdown">
              <button className="filter-button">
                Priority: {filter.priority ? filter.priority : 'All'}
              </button>
              <div className="dropdown-content">
                <button onClick={() => setFilter(f => ({ ...f, priority: undefined }))}>
                  All Priorities
                </button>
                <button onClick={() => setFilter(f => ({ ...f, priority: TaskPriority.HIGH }))}>
                  High
                </button>
                <button onClick={() => setFilter(f => ({ ...f, priority: TaskPriority.MEDIUM }))}>
                  Medium
                </button>
                <button onClick={() => setFilter(f => ({ ...f, priority: TaskPriority.LOW }))}>
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
      
      {error && (
        <div className="error-message">
          <FaExclamationTriangle /> {error}
        </div>
      )}
      
      <div className="task-list">
        {filteredTasks.length === 0 ? (
          <div className="no-tasks">No tasks found. Create your first task!</div>
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
                
                <div className="task-dates">
                  <span>Due: {formatDate(task.dueDate)}</span>
                  {task.createdAt && (
                    <span>Created: {formatDate(task.createdAt)}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
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