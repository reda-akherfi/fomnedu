import { Task } from '../stores/useTaskStore';
import { FaTrash, FaEdit, FaCheckCircle, FaHourglass, FaRegCircle } from 'react-icons/fa';

interface TaskListProps {
  tasks: Task[];
  onDeleteTask: (id: string) => void;
  onUpdateTask: (id: string, updates: Partial<Omit<Task, 'id'>>) => void;
}

const TaskList = ({ tasks, onDeleteTask, onUpdateTask }: TaskListProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <FaCheckCircle className="status-icon completed" />;
      case 'in-progress':
        return <FaHourglass className="status-icon in-progress" />;
      default:
        return <FaRegCircle className="status-icon todo" />;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const toggleStatus = (task: Task) => {
    const statusMap: Record<string, 'todo' | 'in-progress' | 'completed'> = {
      'todo': 'in-progress',
      'in-progress': 'completed',
      'completed': 'todo'
    };
    
    onUpdateTask(task.id, { status: statusMap[task.status] });
  };

  return (
    <div className="task-list">
      <h3>Liste des tâches</h3>
      
      {tasks.length === 0 ? (
        <p className="no-tasks">Aucune tâche à afficher</p>
      ) : (
        <ul>
          {tasks.map(task => (
            <li key={task.id} className={`task-item ${task.status}`} style={{ borderLeft: `4px solid ${task.color || '#ccc'}` }}>
              <div className="task-header">
                <div className="task-title" onClick={() => toggleStatus(task)}>
                  {getStatusIcon(task.status)}
                  <h4>{task.title}</h4>
                </div>
                <div className="task-actions">
                  <button className="icon-button edit">
                    <FaEdit />
                  </button>
                  <button 
                    className="icon-button delete"
                    onClick={() => {
                      if (window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche?')) {
                        onDeleteTask(task.id);
                      }
                    }}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
              
              {task.description && (
                <p className="task-description">{task.description}</p>
              )}
              
              <div className="task-dates">
                <span>Du {formatDate(task.startDate)}</span>
                <span>au {formatDate(task.endDate)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TaskList; 