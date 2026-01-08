import axios, { AxiosInstance } from 'axios'
import { env } from '../config/env.js'

export interface OpenProjectWorkPackage {
  id: number
  subject: string
  description?: string
  startDate?: string
  dueDate?: string
  estimatedTime?: string
  spentTime?: string
  percentageDone?: number
  priority?: string
  status?: string
  customFields?: Record<string, any>
}

export interface OpenProjectBudget {
  id: number
  subject: string
  amount: number
  spent: number
}

export class OpenProjectClient {
  private client: AxiosInstance
  private baseURL: string
  private apiKey: string

  constructor() {
    this.baseURL = env.OPENPROJECT_URL || ''
    this.apiKey = env.OPENPROJECT_API_KEY || ''

    if (!this.baseURL || !this.apiKey) {
      console.warn('OpenProject URL or API key not configured. Integration will be disabled.')
    }

    this.client = axios.create({
      baseURL: `${this.baseURL}/api/v3`,
      headers: {
        'Authorization': `Basic ${Buffer.from(`apikey:${this.apiKey}`).toString('base64')}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    })
  }

  isConfigured(): boolean {
    return !!(this.baseURL && this.apiKey)
  }

  async testConnection(): Promise<boolean> {
    if (!this.isConfigured()) return false

    try {
      const response = await this.client.get('/projects')
      return response.status === 200
    } catch (error) {
      console.error('OpenProject connection test failed:', error)
      return false
    }
  }

  async getProjects() {
    const response = await this.client.get('/projects')
    return response.data._embedded?.elements || []
  }

  async getProject(id: string) {
    const response = await this.client.get(`/projects/${id}`)
    return response.data
  }

  async createProject(data: {
    name: string
    identifier: string
    description?: string
    public?: boolean
  }) {
    const response = await this.client.post('/projects', {
      name: data.name,
      identifier: data.identifier,
      description: data.description,
      public: data.public ?? false
    })
    return response.data
  }

  async createWorkPackage(projectId: string, data: {
    subject: string
    description?: string
    startDate?: string
    dueDate?: string
    estimatedTime?: string
    customFields?: Record<string, any>
  }): Promise<OpenProjectWorkPackage> {
    const payload: any = {
      subject: data.subject,
      _links: {
        project: {
          href: `/api/v3/projects/${projectId}`
        }
      }
    }

    if (data.description) {
      payload.description = {
        format: 'markdown',
        raw: data.description
      }
    }

    if (data.startDate) payload.startDate = data.startDate
    if (data.dueDate) payload.dueDate = data.dueDate
    if (data.estimatedTime) payload.estimatedTime = data.estimatedTime

    const response = await this.client.post('/work_packages', payload)
    return response.data
  }

  async updateWorkPackage(id: number, data: Partial<OpenProjectWorkPackage>) {
    const response = await this.client.patch(`/work_packages/${id}`, data)
    return response.data
  }

  async getWorkPackages(projectId: string) {
    const response = await this.client.get(`/projects/${projectId}/work_packages`)
    return response.data._embedded?.elements || []
  }

  async createBudget(projectId: string, data: {
    subject: string
    amount: number
    description?: string
  }) {
    const response = await this.client.post('/budgets', {
      subject: data.subject,
      amount: data.amount,
      description: data.description,
      _links: {
        project: {
          href: `/api/v3/projects/${projectId}`
        }
      }
    })
    return response.data
  }

  async updateBudget(id: number, data: { amount?: number; spent?: number }) {
    const response = await this.client.patch(`/budgets/${id}`, data)
    return response.data
  }

  async logTime(workPackageId: number, data: {
    hours: number
    spentOn: string
    activity: string
    comment?: string
  }) {
    const response = await this.client.post('/time_entries', {
      hours: data.hours,
      spentOn: data.spentOn,
      activity: data.activity,
      comment: data.comment,
      _links: {
        workPackage: {
          href: `/api/v3/work_packages/${workPackageId}`
        }
      }
    })
    return response.data
  }
}

export const openProjectClient = new OpenProjectClient()
