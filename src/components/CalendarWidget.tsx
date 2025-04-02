import { useState } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Task } from '../stores/useTaskStore'
import AddTaskModal from './AddTaskModal'

const localizer = momentLocalizer(moment)

interface CalendarWidgetProps {
  tasks: Task[]
  onAddTask: (task: Omit<Task, 'id'>) => void
}

const CalendarWidget = ({ tasks, onAddTask }: CalendarWidgetProps) => {
  const [showModal, setShowModal] = useState(false)
  const [selectedDates, setSelectedDates] = useState<{ start: Date, end: Date } | null>(null)

  const events = tasks.map(task => ({
    id: task.id,
    title: task.title,
    start: task.startDate,
    end: task.endDate,
    allDay: true,
    resource: task
  }))

  const handleSelectSlot = ({ start, end }: { start: Date, end: Date }) => {
    setSelectedDates({ start, end })
    setShowModal(true)
  }

  const handleAddTask = (task: Omit<Task, 'id'>) => {
    onAddTask(task)
    setShowModal(false)
  }

  return (
    <div className="calendar-widget">
      <div className="calendar-header">
        <h3>Calendrier</h3>
        <button onClick={() => setShowModal(true)}>Ajouter une tâche</button>
      </div>
      
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 400 }}
        selectable
        onSelectSlot={handleSelectSlot}
      />
      
      {showModal && (
        <AddTaskModal 
          onClose={() => setShowModal(false)}
          onAddTask={handleAddTask}
          initialDates={selectedDates}
        />
      )}
    </div>
  )
}

export default CalendarWidget 