import { useState, FormEvent } from 'react'
import { Task } from '../stores/useTaskStore'

interface AddTaskModalProps {
  onClose: () => void
  onAddTask: (task: Omit<Task, 'id'>) => void
  initialDates: { start: Date, end: Date } | null
}

const AddTaskModal = ({ onClose, onAddTask, initialDates }: AddTaskModalProps) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState(
    initialDates?.start ? initialDates.start.toISOString().split('T')[0] : ''
  )
  const [endDate, setEndDate] = useState(
    initialDates?.end ? initialDates.end.toISOString().split('T')[0] : ''
  )
  const [status, setStatus] = useState<'todo' | 'in-progress' | 'completed'>('todo')
  const [color, setColor] = useState('#2196f3')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    
    if (!title || !startDate || !endDate) return
    
    onAddTask({
      title,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status,
      color
    })
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>Ajouter une nouvelle tâche</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Titre</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="startDate">Date de début</label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="endDate">Date de fin</label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="status">Statut</label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'todo' | 'in-progress' | 'completed')}
            >
              <option value="todo">À faire</option>
              <option value="in-progress">En cours</option>
              <option value="completed">Terminé</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="color">Couleur</label>
            <input
              id="color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>
          
          <div className="modal-actions">
            <button type="submit">Ajouter</button>
            <button type="button" className="secondary" onClick={onClose}>Annuler</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddTaskModal 