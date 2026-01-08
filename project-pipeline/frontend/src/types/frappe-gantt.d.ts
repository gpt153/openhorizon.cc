// Type declarations for frappe-gantt
declare module 'frappe-gantt' {
  export interface Task {
    id: string
    name: string
    start: string
    end: string
    progress: number
    dependencies?: string
    custom_class?: string
  }

  export interface GanttOptions {
    view_mode?: 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month'
    date_format?: string
    custom_popup_html?: (task: Task) => string
    on_date_change?: (task: Task, start: Date, end: Date) => void
    on_click?: (task: Task) => void
    on_view_change?: (mode: string) => void
  }

  export default class Gantt {
    constructor(element: HTMLElement, tasks: Task[], options?: GanttOptions)
    change_view_mode(mode: string): void
    refresh(tasks: Task[]): void
    $destroy?(): void
  }
}
