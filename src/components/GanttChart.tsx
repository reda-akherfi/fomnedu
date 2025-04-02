import { useEffect, useRef } from 'react'
import { Task } from '../stores/useTaskStore'
import gantt from 'dhtmlx-gantt'
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css'

interface GanttChartProps {
  tasks: Task[]
  onTaskUpdate: (id: string, updates: Partial<Omit<Task, 'id'>>) => void
  onTaskDelete: (id: string) => void
}

const GanttChart = ({ tasks, onTaskUpdate, onTaskDelete }: GanttChartProps) => {
  const ganttContainer = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ganttContainer.current) return

    gantt.config.date_format = "%Y-%m-%d %H:%i";
    gantt.config.drag_progress = true;
    gantt.config.drag_resize = true;
    gantt.config.drag_move = true;
    
    // Ajouter le bouton de suppression dans la colonne des actions
    gantt.config.columns = [
      { name: "text", label: "Tâche", tree: true, width: '*' },
      { name: "start_date", label: "Début", align: "center" },
      { name: "duration", label: "Durée", align: "center" },
      { 
        name: "delete", 
        label: "", 
        width: 44, 
        template: function(_task) {
          return "<div class='gantt-delete-btn'>×</div>";
        }
      }
    ];
    
    gantt.init(ganttContainer.current);
    
    // Format tasks for dhtmlx-gantt
    const ganttTasks = {
      data: tasks.map(task => ({
        id: task.id,
        text: task.title,
        start_date: task.startDate,
        end_date: task.endDate,
        progress: task.status === 'completed' ? 1 : task.status === 'in-progress' ? 0.5 : 0,
        color: task.color
      }))
    };
    
    gantt.parse(ganttTasks);
    
    // Handle task updates
    gantt.attachEvent("onAfterTaskUpdate", (id: string, item: { 
      start_date: string | Date; 
      end_date: string | Date;
      progress: number;
    }) => {
      onTaskUpdate(id, {
        startDate: new Date(item.start_date),
        endDate: new Date(item.end_date),
        status: item.progress === 1 ? 'completed' : item.progress > 0 ? 'in-progress' : 'todo'
      });
    });
    
    // Gérer le clic sur le bouton de suppression
    gantt.attachEvent("onGridHeaderClick", function(column_name: string, e: Event) {
      if(column_name === "delete") {
        const taskId = gantt.locate(e);
        if(taskId) {
          if(confirm("Êtes-vous sûr de vouloir supprimer cette tâche?")) {
            onTaskDelete(taskId);
            gantt.deleteTask(taskId);
          }
        }
      }
    });
    
    return () => {
      gantt.clearAll();
    };
  }, [tasks, onTaskUpdate, onTaskDelete]);

  return (
    <div className="gantt-wrapper">
      <div ref={ganttContainer} style={{ width: '100%', height: '500px' }}></div>
    </div>
  );
};

export default GanttChart; 