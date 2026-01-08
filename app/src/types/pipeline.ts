import { Prisma } from '@prisma/client'

// Base types from Prisma
export type PipelineProject = Prisma.PipelineProjectGetPayload<{
  include: {
    phases: true
  }
}>

export type PipelineProjectWithDetails = Prisma.PipelineProjectGetPayload<{
  include: {
    phases: {
      include: {
        communications: true
        quotes: {
          include: {
            vendor: true
          }
        }
        aiConversations: true
      }
    }
    communications: true
    aiConversations: true
  }
}>

export type PipelinePhase = Prisma.PipelinePhaseGetPayload<{
  include: {
    project: true
    communications: true
    quotes: {
      include: {
        vendor: true
      }
    }
    aiConversations: true
  }
}>

export type Quote = Prisma.QuoteGetPayload<{
  include: {
    vendor: true
  }
}>

export type Vendor = Prisma.VendorGetPayload<{}>

// Enums from Prisma
export { ProjectType, PipelineProjectStatus, PhaseType, PhaseStatus, VendorType, QuoteStatus } from '@prisma/client'

// Utility types for profit calculations
export type ProfitData = {
  projectId: string
  projectName: string
  participantCount: number
  grantAmount: number | null
  estimatedCosts: number | null
  profit: number | null
  profitMargin: number | null
}

export type ProfitSummary = {
  totalIncome: number
  totalCosts: number
  totalProfit: number
  averageMargin: number
  projectCount: number
}

// Form types
export type CreateProjectInput = {
  name: string
  type: 'STUDENT_EXCHANGE' | 'TRAINING' | 'CONFERENCE' | 'CUSTOM'
  description?: string
  startDate: string
  endDate: string
  budgetTotal: number
  participantCount: number
  location: string
  originCountry?: string
  hostCountry?: string
}

export type GrantCalculationInput = {
  participantCount: number
  activityDays: number
  travelDays: number
  originCity: string
  destinationCity: string
  hostCountryCode: string
  includeGreenTravel?: boolean
  participantsWithFewerOpportunities?: number
}

export type GrantCalculationResult = {
  organisationalSupport: number
  individualSupport: number
  travel: number
  greenTravelSupplement: number
  inclusionSupport: number
  totalGrant: number
  breakdown: {
    organisationalRate: number
    individualRate: number
    travelDistance: number
    travelAmount: number
  }
}

// Utility function to get profit margin color
export function getProfitMarginColor(margin: number | null): string {
  if (margin === null) return 'text-zinc-500'
  if (margin >= 30) return 'text-green-600'
  if (margin >= 15) return 'text-yellow-600'
  return 'text-red-600'
}

// Utility function to get profit margin badge variant
export function getProfitMarginBadgeVariant(margin: number | null): 'default' | 'success' | 'warning' | 'destructive' {
  if (margin === null) return 'default'
  if (margin >= 30) return 'success'
  if (margin >= 15) return 'warning'
  return 'destructive'
}

// Utility function to calculate profit margin percentage
export function calculateProfitMarginPercentage(income: number | null, costs: number | null): number | null {
  if (!income || income === 0) return null
  if (!costs) return 100
  const profit = income - costs
  return (profit / income) * 100
}

// Utility function to format currency
export function formatCurrency(amount: number | null | undefined, currency = 'EUR'): string {
  if (amount === null || amount === undefined) return 'N/A'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(Number(amount))
}
