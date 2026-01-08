// TypeScript types matching Prisma schema
// Aligned with backend/prisma/schema.prisma

export type Role = 'ADMIN' | 'COORDINATOR' | 'TEAM_MEMBER' | 'VIEWER' | 'USER'

export type ProjectType = 'STUDENT_EXCHANGE' | 'TRAINING' | 'CONFERENCE' | 'CUSTOM'

export type ProjectStatus = 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export type PhaseType =
  | 'ACCOMMODATION'
  | 'TRAVEL'
  | 'FOOD'
  | 'ACTIVITIES'
  | 'EVENTS'
  | 'INSURANCE'
  | 'EMERGENCY_PLANNING'
  | 'PERMITS'
  | 'APPLICATION'
  | 'REPORTING'
  | 'CUSTOM'

export type PhaseStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'BLOCKED'

export type VendorType =
  | 'HOTEL'
  | 'HOSTEL'
  | 'RESTAURANT'
  | 'TRANSPORT'
  | 'ACTIVITY_PROVIDER'
  | 'VENUE'
  | 'INSURANCE'
  | 'OTHER'

export type QuoteStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'

export type CommunicationType = 'EMAIL' | 'PHONE' | 'OTHER'

export type Direction = 'OUTBOUND' | 'INBOUND'

export type CommStatus = 'DRAFT' | 'SENT' | 'DELIVERED' | 'OPENED' | 'RESPONDED' | 'FAILED'

export interface User {
  id: string
  email: string
  name: string
  role: Role
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  name: string
  type: ProjectType
  status: ProjectStatus
  description?: string
  start_date: string
  end_date: string
  budget_total: number
  budget_spent: number
  participants_count: number
  location: string
  metadata?: Record<string, unknown>
  created_by: string
  created_at: string
  updated_at: string
  phases?: Phase[]
  creator?: User
  _count?: {
    phases: number
    communications: number
  }
}

export interface Phase {
  id: string
  project_id: string
  name: string
  type: PhaseType
  status: PhaseStatus
  start_date: string
  end_date: string
  deadline?: string
  budget_allocated: number
  budget_spent: number
  order: number
  dependencies: string[]
  checklist?: Record<string, unknown>
  editable: boolean
  skippable: boolean
  created_at: string
  updated_at: string
  project?: Project
  quotes?: Quote[]
  assignments?: PhaseAssignment[]
  _count?: {
    communications: number
    conversations: number
  }
}

export interface PhaseAssignment {
  id: string
  phase_id: string
  user_id: string
  assigned_at: string
  user?: User
  phase?: Phase
}

export interface Vendor {
  id: string
  name: string
  type: VendorType
  email?: string
  phone?: string
  website?: string
  location?: string
  rating?: number
  response_rate?: number
  avg_response_time_hours?: number
  successful_bookings: number
  total_contacts: number
  notes?: string
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
  _count?: {
    quotes: number
    communications: number
  }
}

export interface Quote {
  id: string
  phase_id: string
  vendor_id: string
  amount: number
  currency: string
  valid_until?: string
  status: QuoteStatus
  details?: Record<string, unknown>
  notes?: string
  received_at: string
  updated_at: string
  vendor?: Vendor
  phase?: Phase
}

export interface Communication {
  id: string
  project_id: string
  phase_id?: string
  vendor_id?: string
  type: CommunicationType
  direction: Direction
  subject?: string
  body: string
  status: CommStatus
  sent_at?: string
  response_received_at?: string
  follow_up_scheduled?: string
  parsed_data?: Record<string, unknown>
  created_at: string
  updated_at: string
  project?: Project
  phase?: Phase
  vendor?: Vendor
}

export interface AIConversation {
  id: string
  project_id: string
  phase_id?: string
  user_id: string
  messages: Record<string, unknown>
  context?: Record<string, unknown>
  created_at: string
  updated_at: string
  project?: Project
  phase?: Phase
  user?: User
}

// API Response types
export interface LoginResponse {
  user: User
  token: string
}

export interface ApiError {
  error: string
  details?: unknown
  message?: string
}

// Form types
export interface LoginFormData {
  email: string
  password: string
}

export interface ProjectFormData {
  name: string
  type: ProjectType
  status?: ProjectStatus
  description?: string
  start_date: string
  end_date: string
  budget_total: number
  participants_count: number
  location: string
  metadata?: Record<string, unknown>
}

export interface PhaseFormData {
  project_id: string
  name: string
  type: PhaseType
  status?: PhaseStatus
  start_date: string
  end_date: string
  deadline?: string
  budget_allocated: number
  order: number
  dependencies?: string[]
  checklist?: Record<string, unknown>
  editable?: boolean
  skippable?: boolean
}
