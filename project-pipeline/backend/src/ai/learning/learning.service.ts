import { prisma } from '../../config/database.js'
import { getVectorStore, SearchResult } from './vector-store.js'
import { v4 as uuidv4 } from 'uuid'

export interface LearnedPattern {
  id: string
  type: 'vendor_preference' | 'budget_allocation' | 'timeline_adjustment' | 'phase_dependency' | 'location_insight' | 'custom'
  phaseType: string
  projectType: string
  location: string
  description: string
  actionable: string
  confidence: number
  frequency: number
  examples: string[]
  metadata: Record<string, any>
}

export class LearningService {
  private vectorStore = getVectorStore()

  /**
   * Extract patterns from a completed project
   */
  async learnFromProject(projectId: string): Promise<LearnedPattern[]> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        phases: {
          include: {
            quotes: {
              include: { vendor: true }
            },
            communications: true
          }
        }
      }
    })

    if (!project) {
      throw new Error('Project not found')
    }

    const patterns: LearnedPattern[] = []

    // Extract vendor preference patterns
    const vendorPatterns = await this.extractVendorPatterns(project)
    patterns.push(...vendorPatterns)

    // Extract budget allocation patterns
    const budgetPatterns = await this.extractBudgetPatterns(project)
    patterns.push(...budgetPatterns)

    // Extract timeline patterns
    const timelinePatterns = await this.extractTimelinePatterns(project)
    patterns.push(...timelinePatterns)

    // Store patterns in vector database
    for (const pattern of patterns) {
      await this.storePattern(pattern)
    }

    // Store in PostgreSQL as well for queryability
    for (const pattern of patterns) {
      await prisma.learningPattern.create({
        data: {
          project_id: projectId,
          type: pattern.type,
          phase_type: pattern.phaseType,
          pattern_data: pattern as any,
          confidence: pattern.confidence,
          metadata: pattern.metadata as any
        }
      })
    }

    console.log(`✅ Learned ${patterns.length} patterns from project ${project.name}`)
    return patterns
  }

  /**
   * Extract vendor preference patterns
   */
  private async extractVendorPatterns(project: any): Promise<LearnedPattern[]> {
    const patterns: LearnedPattern[] = []

    for (const phase of project.phases) {
      const acceptedQuotes = phase.quotes.filter((q: any) => q.status === 'ACCEPTED')

      if (acceptedQuotes.length > 0) {
        for (const quote of acceptedQuotes) {
          const pattern: LearnedPattern = {
            id: uuidv4(),
            type: 'vendor_preference',
            phaseType: phase.type,
            projectType: project.type,
            location: project.location,
            description: `Preferred vendor for ${phase.type}: ${quote.vendor.name}`,
            actionable: `Consider reaching out to ${quote.vendor.name} for ${phase.type} in ${project.location}`,
            confidence: 70, // Initial confidence
            frequency: 1,
            examples: [`${project.name} - €${quote.total_price}`],
            metadata: {
              vendorId: quote.vendor_id,
              vendorName: quote.vendor.name,
              vendorEmail: quote.vendor.email,
              pricePoint: Number(quote.total_price),
              participants: project.participants_count
            }
          }

          patterns.push(pattern)
        }
      }
    }

    return patterns
  }

  /**
   * Extract budget allocation patterns
   */
  private async extractBudgetPatterns(project: any): Promise<LearnedPattern[]> {
    const patterns: LearnedPattern[] = []

    const totalBudget = Number(project.budget_total)
    const phaseGroups = new Map<string, number>()

    for (const phase of project.phases) {
      const allocated = Number(phase.budget_allocated)
      const current = phaseGroups.get(phase.type) || 0
      phaseGroups.set(phase.type, current + allocated)
    }

    for (const [phaseType, totalAllocated] of phaseGroups) {
      const percentage = (totalAllocated / totalBudget) * 100

      const pattern: LearnedPattern = {
        id: uuidv4(),
        type: 'budget_allocation',
        phaseType,
        projectType: project.type,
        location: project.location,
        description: `${phaseType} typically receives ${percentage.toFixed(1)}% of total budget in ${project.location}`,
        actionable: `Allocate approximately ${percentage.toFixed(1)}% of budget to ${phaseType}`,
        confidence: 65,
        frequency: 1,
        examples: [`${project.name}: €${totalAllocated} / €${totalBudget} (${percentage.toFixed(1)}%)`],
        metadata: {
          percentage,
          amount: totalAllocated,
          totalBudget,
          participants: project.participants_count,
          costPerPerson: totalAllocated / project.participants_count
        }
      }

      patterns.push(pattern)
    }

    return patterns
  }

  /**
   * Extract timeline patterns
   */
  private async extractTimelinePatterns(project: any): Promise<LearnedPattern[]> {
    const patterns: LearnedPattern[] = []

    const projectDuration = Math.ceil(
      (new Date(project.end_date).getTime() - new Date(project.start_date).getTime()) / (1000 * 60 * 60 * 24)
    )

    for (const phase of project.phases) {
      const phaseDuration = Math.ceil(
        (new Date(phase.end_date).getTime() - new Date(phase.start_date).getTime()) / (1000 * 60 * 60 * 24)
      )

      const daysBeforeProject = Math.ceil(
        (new Date(project.start_date).getTime() - new Date(phase.start_date).getTime()) / (1000 * 60 * 60 * 24)
      )

      const pattern: LearnedPattern = {
        id: uuidv4(),
        type: 'timeline_adjustment',
        phaseType: phase.type,
        projectType: project.type,
        location: project.location,
        description: `${phase.type} planning typically starts ${daysBeforeProject} days before project and takes ${phaseDuration} days`,
        actionable: `Start ${phase.type} planning ${daysBeforeProject} days before project start date`,
        confidence: 60,
        frequency: 1,
        examples: [`${project.name}: Started ${daysBeforeProject} days early, duration ${phaseDuration} days`],
        metadata: {
          phaseDuration,
          daysBeforeProject,
          projectDuration,
          phaseOrder: phase.order
        }
      }

      patterns.push(pattern)
    }

    return patterns
  }

  /**
   * Store pattern in vector database
   */
  private async storePattern(pattern: LearnedPattern): Promise<void> {
    await this.vectorStore.addDocument({
      id: pattern.id,
      content: `${pattern.description}. ${pattern.actionable}`,
      patternType: pattern.type,
      phaseType: pattern.phaseType,
      projectType: pattern.projectType,
      location: pattern.location,
      confidence: pattern.confidence,
      frequency: pattern.frequency,
      lastObserved: new Date(),
      metadata: pattern.metadata
    })
  }

  /**
   * Get recommendations for a new project/phase
   */
  async getRecommendations(params: {
    phaseType: string
    projectType: string
    location: string
    budget?: number
    participants?: number
  }): Promise<{
    vendors: Array<{ name: string; email: string; confidence: number; reason: string }>
    budgetAllocation: { suggested: number; reasoning: string } | null
    timeline: { startDaysBeforeProject: number; durationDays: number; reasoning: string } | null
    insights: string[]
  }> {
    // Search for relevant patterns
    const query = `${params.phaseType} for ${params.projectType} project in ${params.location}`

    const [vendorPatterns, budgetPatterns, timelinePatterns] = await Promise.all([
      this.vectorStore.search({
        query,
        patternType: 'vendor_preference',
        phaseType: params.phaseType,
        location: params.location,
        limit: 5,
        minConfidence: 60
      }),
      this.vectorStore.search({
        query,
        patternType: 'budget_allocation',
        phaseType: params.phaseType,
        projectType: params.projectType,
        limit: 3,
        minConfidence: 60
      }),
      this.vectorStore.search({
        query,
        patternType: 'timeline_adjustment',
        phaseType: params.phaseType,
        projectType: params.projectType,
        limit: 3,
        minConfidence: 60
      })
    ])

    // Process vendor recommendations
    const vendorRecs = vendorPatterns.map(p => ({
      name: p.metadata.vendorName,
      email: p.metadata.vendorEmail,
      confidence: p.score * 100,
      reason: `Used successfully in ${p.metadata.frequency || 1} similar project(s). Average price: €${p.metadata.pricePoint}`
    }))

    // Process budget recommendation
    let budgetRec = null
    if (budgetPatterns.length > 0 && params.budget) {
      const avgPercentage = budgetPatterns.reduce((sum, p) => sum + p.metadata.percentage, 0) / budgetPatterns.length
      const suggested = (params.budget * avgPercentage) / 100

      budgetRec = {
        suggested: Math.round(suggested),
        reasoning: `Based on ${budgetPatterns.length} similar projects, ${params.phaseType} typically uses ${avgPercentage.toFixed(1)}% of total budget`
      }
    }

    // Process timeline recommendation
    let timelineRec = null
    if (timelinePatterns.length > 0) {
      const avgDaysBefore = timelinePatterns.reduce((sum, p) => sum + (p.metadata.daysBeforeProject || 0), 0) / timelinePatterns.length
      const avgDuration = timelinePatterns.reduce((sum, p) => sum + (p.metadata.phaseDuration || 7), 0) / timelinePatterns.length

      timelineRec = {
        startDaysBeforeProject: Math.round(avgDaysBefore),
        durationDays: Math.round(avgDuration),
        reasoning: `Based on ${timelinePatterns.length} similar projects`
      }
    }

    // General insights
    const insights: string[] = []
    if (vendorRecs.length > 0) {
      insights.push(`${vendorRecs.length} recommended vendors based on past success`)
    }
    if (budgetRec) {
      insights.push(`Budget allocation: €${budgetRec.suggested} recommended`)
    }
    if (timelineRec) {
      insights.push(`Timeline: Start ${timelineRec.startDaysBeforeProject} days early, plan for ${timelineRec.durationDays} days`)
    }

    return {
      vendors: vendorRecs,
      budgetAllocation: budgetRec,
      timeline: timelineRec,
      insights
    }
  }

  /**
   * Update pattern confidence based on new observation
   */
  async reinforcePattern(params: {
    phaseType: string
    projectType: string
    location: string
    patternType: string
    metadata: Record<string, any>
  }): Promise<void> {
    // Search for similar patterns
    const query = `${params.phaseType} ${params.projectType} ${params.location}`
    const patterns = await this.vectorStore.search({
      query,
      patternType: params.patternType,
      phaseType: params.phaseType,
      projectType: params.projectType,
      location: params.location,
      limit: 1,
      minConfidence: 50
    })

    if (patterns.length > 0) {
      // Pattern exists, reinforce it
      const pattern = patterns[0]
      const newFrequency = (pattern.metadata.frequency || 1) + 1
      const newConfidence = Math.min(100, (pattern.metadata.confidence || 70) + 5)

      await this.vectorStore.updatePattern(pattern.id, {
        frequency: newFrequency,
        confidence: newConfidence,
        lastObserved: new Date()
      })

      console.log(`✅ Reinforced pattern ${pattern.id}: confidence ${newConfidence}, frequency ${newFrequency}`)
    } else {
      // New pattern, create it
      const newPattern: LearnedPattern = {
        id: uuidv4(),
        type: params.patternType as any,
        phaseType: params.phaseType,
        projectType: params.projectType,
        location: params.location,
        description: `New ${params.patternType} pattern observed`,
        actionable: `Consider this approach for ${params.phaseType}`,
        confidence: 50,
        frequency: 1,
        examples: [],
        metadata: params.metadata
      }

      await this.storePattern(newPattern)
      console.log(`✅ Created new pattern: ${newPattern.id}`)
    }
  }

  /**
   * Get pattern statistics
   */
  async getPatternStats(): Promise<{
    totalPatterns: number
    byType: Record<string, number>
    byPhaseType: Record<string, number>
    avgConfidence: number
  }> {
    const patterns = await prisma.learningPattern.findMany()

    const byType: Record<string, number> = {}
    const byPhaseType: Record<string, number> = {}
    let totalConfidence = 0

    for (const pattern of patterns) {
      byType[pattern.type] = (byType[pattern.type] || 0) + 1
      byPhaseType[pattern.phase_type] = (byPhaseType[pattern.phase_type] || 0) + 1
      totalConfidence += pattern.confidence
    }

    return {
      totalPatterns: patterns.length,
      byType,
      byPhaseType,
      avgConfidence: patterns.length > 0 ? totalConfidence / patterns.length : 0
    }
  }
}

// Singleton instance
let learningServiceInstance: LearningService | null = null

export function getLearningService(): LearningService {
  if (!learningServiceInstance) {
    learningServiceInstance = new LearningService()
  }
  return learningServiceInstance
}
