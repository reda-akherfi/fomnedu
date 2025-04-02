import GanttChart from '../components/GanttChart'
import CalendarWidget from '../components/CalendarWidget'
import TaskList from '../components/TaskList'
import useTaskStore from '../stores/useTaskStore'

const Home = () => {
  const { tasks, addTask, updateTask, deleteTask } = useTaskStore()

  return (
    <div className="page-container">
      <h1>Tableau de bord</h1>
      
      <div className="gantt-calendar-container">
        <div className="gantt-container">
          <h2>Diagramme de Gantt</h2>
          <GanttChart 
            tasks={tasks} 
            onTaskUpdate={updateTask} 
            onTaskDelete={deleteTask} 
          />
        </div>
        
        <div className="calendar-container">
          <CalendarWidget tasks={tasks} onAddTask={addTask} />
        </div>
      </div>
      
      <TaskList 
        tasks={tasks} 
        onDeleteTask={deleteTask} 
        onUpdateTask={updateTask} 
      />
    </div>
  )
}

export default Home 