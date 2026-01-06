export interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'COORDINATOR' | 'TEAM_MEMBER' | 'VIEWER'
  created_at: string
}

export interface Project {
  id: string
  name: string
  type: 'STUDENT_EXCHANGE' | 'TRAINING' | 'CONFERENCE' | 'CUSTOM'
  status: 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  description?: string
  start_date: string
  end_date: string
  budget_total: number
  budget_spent: number
  participants_count: number
  location: string
  created_at: string
  phases?: Phase[]
}

export interface Phase {
  id: string
  project_id: string
  name: string
  type: 'ACCOMMODATION' | 'TRAVEL' | 'FOOD' | 'ACTIVITIES' | 'INSURANCE' | 'EMERGENCY_PLANNING' | 'REPORTING' | 'OTHER'
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'
  start_date: string
  end_date: string
  budget_allocated: number
  budget_spent: number
  order: number
}

export interface AuthResponse {
  user: User
  token: string
}

export interface ApiError {
  error: string
  details?: unknown
}
