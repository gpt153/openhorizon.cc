export interface ReportProject {
  id: string
  name: string
  type: string
  status: string
  description: string | null
  start_date: Date
  end_date: Date
  budget_total: number
  budget_spent: number
  participants_count: number
  location: string
  phases: ReportPhase[]
  creator: {
    name: string
    email: string
  }
}

export interface ReportPhase {
  id: string
  name: string
  type: string
  status: string
  start_date: Date
  end_date: Date
  budget_allocated: number
  budget_spent: number
  order: number
}

export interface ExportFormat {
  format: 'pdf' | 'excel' | 'word'
}

export interface ExportResult {
  buffer: Buffer
  filename: string
  mimeType: string
}
