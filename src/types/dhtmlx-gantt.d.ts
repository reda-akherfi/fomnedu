declare module 'dhtmlx-gantt' {
  interface GanttEnterprise {
    config: {
      date_format: string;
      drag_progress: boolean;
      drag_resize: boolean;
      drag_move: boolean;
      columns: Array<{
        name: string;
        label: string;
        width?: string | number;
        align?: string;
        tree?: boolean;
        template?: (task: any) => string;
      }>;
    };
    init: (container: HTMLElement) => void;
    parse: (data: any) => void;
    attachEvent: (eventName: string, callback: Function) => void;
    clearAll: () => void;
    deleteTask: (id: string) => void;
    locate: (e: Event) => string | null;
  }
  
  const gantt: GanttEnterprise;
  export default gantt;
} 