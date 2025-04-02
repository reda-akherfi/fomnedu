import { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaFolder, FaPlay, FaEdit, FaExclamationTriangle, FaCheck } from 'react-icons/fa';
import useModuleStore, { Module as ModuleType } from '../stores/useModuleStore';
import useTaskStore from '../stores/useTaskStore';
import useAuthStore from '../stores/useAuthStore';
import { Task } from '../services/taskService';
import { useNavigate } from 'react-router-dom';

const Module = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { modules, isLoading, error, fetchModules, addModule, updateModule, deleteModule } = useModuleStore();
  const { 
    tasks, 
    isLoading: tasksLoading, 
    error: tasksError, 
    fetchAllTasks,
    fetchTasksByBatchIds
  } = useTaskStore();
  
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentModuleId, setCurrentModuleId] = useState<number | string | null>(null);
  const [moduleName, setModuleName] = useState('');
  const [moduleDescription, setModuleDescription] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [moduleTasksMap, setModuleTasksMap] = useState<Record<string | number, Task[]>>({});
  
  useEffect(() => {
    fetchModules();
    fetchAllTasks();
  }, [fetchModules, fetchAllTasks, token]);
  
  // Load tasks details for modules
  useEffect(() => {
    const loadModuleTasks = async () => {
      const tasksMap: Record<string | number, Task[]> = {};
      
      for (const module of modules) {
        if (module.taskIds && module.taskIds.length > 0) {
          const moduleTasks = await fetchTasksByBatchIds(module.taskIds);
          tasksMap[module.id] = moduleTasks;
        } else {
          tasksMap[module.id] = [];
        }
      }
      
      setModuleTasksMap(tasksMap);
    };
    
    if (modules.length > 0 && !tasksLoading) {
      loadModuleTasks();
    }
  }, [modules, fetchTasksByBatchIds, tasksLoading]);
  
  useEffect(() => {
    if (!tasksLoading) {
      setAvailableTasks(tasks);
    }
  }, [tasks, tasksLoading]);

  const handleOpenModal = (moduleToEdit: ModuleType | null = null) => {
    if (moduleToEdit) {
      setIsEditMode(true);
      setCurrentModuleId(moduleToEdit.id);
      setModuleName(moduleToEdit.name);
      setModuleDescription(moduleToEdit.description || '');
      setSelectedTaskIds(moduleToEdit.taskIds || []);
    } else {
      setIsEditMode(false);
      setCurrentModuleId(null);
      setModuleName('');
      setModuleDescription('');
      setSelectedTaskIds([]);
    }
    setShowModal(true);
  };

  const handleSubmitModule = async () => {
    if (!moduleName.trim()) return;
    
    if (isEditMode && currentModuleId) {
      await updateModule(
        currentModuleId, 
        moduleName.trim(), 
        moduleDescription.trim() || undefined, 
        selectedTaskIds
      );
    } else {
      await addModule(
        moduleName.trim(), 
        moduleDescription.trim() || undefined, 
        selectedTaskIds
      );
    }
    
    setModuleName('');
    setModuleDescription('');
    setSelectedTaskIds([]);
    setShowModal(false);
  };

  const handleDeleteModule = async (id: number | string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the module "${name}" and all associated documents and notes?`)) {
      await deleteModule(id);
    }
  };
  
  const handleTaskToggle = (taskId: number) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };
  
  const startSession = (moduleId: string | number) => {
    navigate(`/session/${moduleId}`);
  };
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if ((isLoading && modules.length === 0) || tasksLoading) {
    return (
      <div className="page-container">
        <div className="loading-state">Loading modules...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Modules</h1>
        <button className="create-button" onClick={() => handleOpenModal()}>
          <FaPlus /> New Module
        </button>
      </div>

      {(error || tasksError) && (
        <div className="error-message">
          <FaExclamationTriangle /> {error || tasksError}
        </div>
      )}

      {modules.length === 0 ? (
        <div className="empty-state">
          <FaFolder size={48} />
          <p>You haven't created any modules yet</p>
          <button onClick={() => handleOpenModal()}>Create your first module</button>
        </div>
      ) : (
        <div className="module-grid">
          {modules.map(module => {
            const moduleTasks = moduleTasksMap[module.id] || [];
            
            return (
              <div key={module.id} className="module-card">
                <div className="module-card-header">
                  <h3>{module.name}</h3>
                  <div className="module-actions">
                    <button 
                      className="icon-button edit" 
                      onClick={() => handleOpenModal(module)}
                    >
                      <FaEdit />
                    </button>
                    <button 
                      className="icon-button delete" 
                      onClick={() => handleDeleteModule(module.id, module.name)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
                
                {module.description && (
                  <p className="module-description">{module.description}</p>
                )}
                
                <div className="module-info">
                  <span>Tasks: {module.taskIds ? module.taskIds.length : 0}</span>
                </div>
                
                {moduleTasks.length > 0 && (
                  <div className="module-tasks">
                    <h4>Associated Tasks:</h4>
                    <ul className="task-chips">
                      {moduleTasks.map(task => (
                        <li key={task.id} className="task-chip">
                          {task.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="module-footer">
                  <span>Created on {formatDate(module.createdAt)}</span>
                  <button 
                    className="start-session-btn"
                    onClick={() => startSession(module.id)}
                  >
                    <FaPlay /> Start Session
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h2>{isEditMode ? 'Edit Module' : 'Create New Module'}</h2>
            
            <div className="form-group">
              <label htmlFor="moduleName">Module Name *</label>
              <input
                id="moduleName"
                type="text"
                value={moduleName}
                onChange={(e) => setModuleName(e.target.value)}
                placeholder="Ex: Algebra, Physics, History..."
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="moduleDescription">Description (optional)</label>
              <textarea
                id="moduleDescription"
                value={moduleDescription}
                onChange={(e) => setModuleDescription(e.target.value)}
                placeholder="Brief description of the module..."
                rows={3}
              />
            </div>
            
            <div className="form-group">
              <label>Associated Tasks</label>
              {availableTasks.length === 0 ? (
                <div className="no-tasks-message">
                  No tasks available. <a href="/tasks" onClick={(e) => { e.preventDefault(); navigate('/tasks'); }}>Create some tasks</a> first.
                </div>
              ) : (
                <div className="tasks-selection">
                  {availableTasks.map(task => (
                    <div key={task.id} className="task-checkbox">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={selectedTaskIds.includes(task.id as number)}
                          onChange={() => handleTaskToggle(task.id as number)}
                        />
                        <span className="checkbox-custom">
                          {selectedTaskIds.includes(task.id as number) && <FaCheck className="checkbox-icon" />}
                        </span>
                        {task.title}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="modal-actions">
              <button 
                onClick={handleSubmitModule}
                disabled={!moduleName.trim() || isLoading}
              >
                {isLoading ? 'Processing...' : isEditMode ? 'Update Module' : 'Create Module'}
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
          </div>
        </div>
      )}
    </div>
  );
};

export default Module; 