/**
 * Comprehensive tests for all project generation modules
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { generateTimeline } from '../../../seeds/generators/timeline-generator.js'
import { allocateBudget } from '../../../seeds/generators/budget-allocator.js'
import { analyzeRequirements } from '../../../seeds/generators/requirements-analyzer.js'
import { generatePhases } from '../../../seeds/generators/phase-generator.js'
import { generateChecklist } from '../../../seeds/generators/checklist-generator.js'
import type { RichSeedMetadata, Activity } from '../../../seeds/generators/types.js'

// ========== TEST DATA ==========

const mockActivities: Activity[] = [
  {
    id: 'act-1',
    name: 'Cultural Workshop',
    type: 'workshop',
    duration: 3,
    isOutdoor: false,
    requiresFacilitator: true
  },
  {
    id: 'act-2',
    name: 'City Tour',
    type: 'cultural_visit',
    duration: 2,
    isOutdoor: true,
    requiresFacilitator: false
  }
]

const mockSeedMetadata: RichSeedMetadata = {
  title: 'Barcelona Youth Exchange',
  description: 'A cultural exchange program',
  participants: 30,
  duration: 7,
  destination: 'Barcelona, Spain',
  participantCountries: ['TR', 'GR'],
  activities: mockActivities,
  startDate: new Date('2026-06-01'),
  estimatedBudget: 50000,
  tags: ['youth', 'exchange', 'culture'],
  isPublicEvent: false,
  hasWorkshops: true,
  requiresPermits: false
}

// ========== TIMELINE GENERATOR TESTS ==========

describe('Timeline Generator', () => {
  it('should calculate preparation period 10 weeks before exchange', () => {
    const timeline = generateTimeline(mockSeedMetadata)

    expect(timeline.preparation.durationWeeks).toBe(10)

    // Check that prep starts 10 weeks before exchange
    const daysBetween = Math.floor(
      (timeline.exchange.startDate.getTime() - timeline.preparation.startDate.getTime()) /
      (1000 * 60 * 60 * 24)
    )
    expect(daysBetween).toBeCloseTo(70, 0) // 10 weeks = 70 days
  })

  it('should extend preparation to 12 weeks if permits required', () => {
    const metadata = {
      ...mockSeedMetadata,
      requiresPermits: true
    }

    const timeline = generateTimeline(metadata)
    expect(timeline.preparation.durationWeeks).toBe(12)
  })

  it('should calculate follow-up period 4 weeks after exchange', () => {
    const timeline = generateTimeline(mockSeedMetadata)

    expect(timeline.followUp.durationWeeks).toBe(4)

    // Check that follow-up is ~30 days
    const daysBetween = Math.floor(
      (timeline.followUp.endDate.getTime() - timeline.followUp.startDate.getTime()) /
      (1000 * 60 * 60 * 24)
    )
    expect(daysBetween).toBe(30)
  })

  it('should set APPLICATION deadline 12 weeks before exchange', () => {
    const timeline = generateTimeline(mockSeedMetadata)

    const appDates = timeline.phaseDates.get('APPLICATION')
    expect(appDates).toBeDefined()

    if (appDates) {
      const weeksBeforeExchange = Math.floor(
        (timeline.exchange.startDate.getTime() - appDates.deadline.getTime()) /
        (1000 * 60 * 60 * 24 * 7)
      )
      expect(weeksBeforeExchange).toBeGreaterThanOrEqual(11)
    }
  })

  it('should throw error if start date is missing', () => {
    const metadata = {
      ...mockSeedMetadata,
      startDate: null
    }

    expect(() => generateTimeline(metadata)).toThrow('start date')
  })

  it('should throw error if duration is invalid', () => {
    const metadata = {
      ...mockSeedMetadata,
      duration: 0
    }

    expect(() => generateTimeline(metadata)).toThrow('duration')
  })
})

// ========== BUDGET ALLOCATOR TESTS ==========

describe('Budget Allocator', () => {
  it('should apply base percentages for standard project', () => {
    const budget = allocateBudget(mockSeedMetadata)

    expect(budget.totalBudget).toBe(50000)
    expect(budget.breakdown.travel).toBeGreaterThan(10000) // ~30%
    expect(budget.breakdown.accommodation).toBeGreaterThan(10000) // ~25%
    expect(budget.breakdown.food).toBeGreaterThan(5000) // ~15%
  })

  it('should increase travel budget for long-distance projects', () => {
    const metadata = {
      ...mockSeedMetadata,
      participantCountries: ['US', 'CN'] // Non-European
    }

    const budget = allocateBudget(metadata)

    // Travel should be higher for long distance
    const travelPercentage = budget.breakdown.travel / budget.totalBudget
    expect(travelPercentage).toBeGreaterThan(0.32)
  })

  it('should increase activities budget for workshop-heavy projects', () => {
    const workshops: Activity[] = [
      { id: '1', name: 'Workshop 1', type: 'workshop', duration: 3, isOutdoor: false, requiresFacilitator: true },
      { id: '2', name: 'Workshop 2', type: 'workshop', duration: 3, isOutdoor: false, requiresFacilitator: true },
      { id: '3', name: 'Workshop 3', type: 'workshop', duration: 3, isOutdoor: false, requiresFacilitator: true }
    ]

    const metadata = {
      ...mockSeedMetadata,
      activities: workshops
    }

    const budget = allocateBudget(metadata)

    // Activities budget should be increased
    const activitiesPercentage = budget.breakdown.activities / budget.totalBudget
    expect(activitiesPercentage).toBeGreaterThan(0.18)
  })

  it('should increase contingency for large groups', () => {
    const metadata = {
      ...mockSeedMetadata,
      participants: 60
    }

    const budget = allocateBudget(metadata)

    // Contingency should be higher
    const contingencyPercentage = budget.breakdown.contingency / budget.totalBudget
    expect(contingencyPercentage).toBeGreaterThanOrEqual(0.04)
  })

  it('should ensure total allocation equals total budget', () => {
    const budget = allocateBudget(mockSeedMetadata)

    const allocated = Object.values(budget.breakdown).reduce((sum, val) => sum + val, 0)
    expect(allocated).toBe(budget.totalBudget)
  })

  it('should provide justification for adjustments', () => {
    const budget = allocateBudget(mockSeedMetadata)

    expect(budget.justification).toBeDefined()
    expect(budget.justification.length).toBeGreaterThan(0)
  })
})

// ========== REQUIREMENTS ANALYZER TESTS ==========

describe('Requirements Analyzer', () => {
  it('should require Schengen visa for Turkish participants to Spain', () => {
    const requirements = analyzeRequirements(mockSeedMetadata)

    expect(requirements.visas.required).toBe(true)
    expect(requirements.visas.type).toBe('schengen')
    expect(requirements.visas.countries).toContain('TR')
  })

  it('should not require visa for EU citizens within EU', () => {
    const metadata = {
      ...mockSeedMetadata,
      participantCountries: ['DE', 'FR', 'IT']
    }

    const requirements = analyzeRequirements(metadata)
    expect(requirements.visas.required).toBe(false)
  })

  it('should require group insurance for 10+ participants', () => {
    const requirements = analyzeRequirements(mockSeedMetadata)

    expect(requirements.insurance.required).toBe(true)
    expect(requirements.insurance.type).toBe('group_travel')
    expect(requirements.insurance.coverage).toContain('medical')
    expect(requirements.insurance.coverage).toContain('liability')
  })

  it('should require individual insurance for small groups', () => {
    const metadata = {
      ...mockSeedMetadata,
      participants: 5
    }

    const requirements = analyzeRequirements(metadata)
    expect(requirements.insurance.type).toBe('individual')
  })

  it('should require event permit for public activities', () => {
    const metadata = {
      ...mockSeedMetadata,
      isPublicEvent: true
    }

    const requirements = analyzeRequirements(metadata)

    expect(requirements.permits.required).toBe(true)
    expect(requirements.permits.types).toContainEqual(
      expect.objectContaining({ type: 'event' })
    )
  })

  it('should require food handling permit for cooking activities', () => {
    const cookingActivity: Activity = {
      id: 'cook-1',
      name: 'Cooking Class',
      type: 'cooking_workshop',
      duration: 3,
      isOutdoor: false,
      requiresFacilitator: true
    }

    const metadata = {
      ...mockSeedMetadata,
      activities: [cookingActivity]
    }

    const requirements = analyzeRequirements(metadata)

    expect(requirements.permits.types).toContainEqual(
      expect.objectContaining({ type: 'food_handling' })
    )
  })

  it('should include accessibility requirements', () => {
    const requirements = analyzeRequirements(mockSeedMetadata)

    expect(requirements.accessibility.wheelchairAccess).toBe(true)
    expect(requirements.accessibility.dietaryRestrictions).toBe(true)
    expect(requirements.accessibility.languageSupport).toContain('EN')
  })
})

// ========== PHASE GENERATOR TESTS ==========

describe('Phase Generator', () => {
  let timeline: ReturnType<typeof generateTimeline>
  let budget: ReturnType<typeof allocateBudget>
  let requirements: ReturnType<typeof analyzeRequirements>

  beforeEach(() => {
    timeline = generateTimeline(mockSeedMetadata)
    budget = allocateBudget(mockSeedMetadata)
    requirements = analyzeRequirements(mockSeedMetadata)
  })

  it('should create core phases for all projects', () => {
    const { phases } = generatePhases({
      seed: mockSeedMetadata,
      timeline,
      budget,
      requirements,
      projectId: 'test-project'
    })

    const phaseTypes = phases.map(p => p.type)
    expect(phaseTypes).toContain('APPLICATION')
    expect(phaseTypes).toContain('ACCOMMODATION')
    expect(phaseTypes).toContain('TRAVEL')
    expect(phaseTypes).toContain('FOOD')
    expect(phaseTypes).toContain('REPORTING')
  })

  it('should create PERMITS phase when visa required', () => {
    const { phases } = generatePhases({
      seed: mockSeedMetadata,
      timeline,
      budget,
      requirements,
      projectId: 'test-project'
    })

    const visaPhase = phases.find(p => p.type === 'PERMITS' && p.name.toLowerCase().includes('visa'))
    expect(visaPhase).toBeDefined()
  })

  it('should create separate phases for each activity', () => {
    const { phases } = generatePhases({
      seed: mockSeedMetadata,
      timeline,
      budget,
      requirements,
      projectId: 'test-project'
    })

    const activityPhases = phases.filter(p => p.type === 'ACTIVITIES')
    expect(activityPhases.length).toBe(2) // 2 activities in mockSeedMetadata
  })

  it('should set correct dependencies between phases', () => {
    const { phases } = generatePhases({
      seed: mockSeedMetadata,
      timeline,
      budget,
      requirements,
      projectId: 'test-project'
    })

    const travelPhase = phases.find(p => p.type === 'TRAVEL' && p.name.includes('Outbound'))
    expect(travelPhase).toBeDefined()
    expect(travelPhase?.dependencies).toContain('INSURANCE')
    expect(travelPhase?.dependencies).toContain('ACCOMMODATION')
  })

  it('should order phases correctly', () => {
    const { phases } = generatePhases({
      seed: mockSeedMetadata,
      timeline,
      budget,
      requirements,
      projectId: 'test-project'
    })

    const orderedTypes = phases
      .sort((a, b) => a.order - b.order)
      .map(p => p.type)

    const appIndex = orderedTypes.indexOf('APPLICATION')
    const travelIndex = orderedTypes.indexOf('TRAVEL')
    const reportingIndex = orderedTypes.indexOf('REPORTING')

    expect(appIndex).toBeLessThan(travelIndex)
    expect(travelIndex).toBeLessThan(reportingIndex)
  })

  it('should allocate budget across all phases', () => {
    const { phases } = generatePhases({
      seed: mockSeedMetadata,
      timeline,
      budget,
      requirements,
      projectId: 'test-project'
    })

    const totalAllocated = phases.reduce((sum, phase) => sum + phase.budget_allocated, 0)

    // Should be approximately equal to total budget (within 1 EUR due to rounding)
    expect(Math.abs(totalAllocated - budget.totalBudget)).toBeLessThanOrEqual(1)
  })
})

// ========== CHECKLIST GENERATOR TESTS ==========

describe('Checklist Generator', () => {
  let mockPhase: any

  beforeEach(() => {
    mockPhase = {
      name: 'Test Phase',
      type: 'APPLICATION',
      status: 'NOT_STARTED',
      start_date: new Date('2026-03-01'),
      end_date: new Date('2026-03-15'),
      deadline: new Date('2026-03-15'),
      budget_allocated: 500,
      budget_spent: 0,
      order: 1,
      dependencies: [],
      editable: true,
      skippable: false
    }
  })

  it('should generate APPLICATION checklist with required tasks', () => {
    const checklist = generateChecklist({
      phase: mockPhase,
      seed: mockSeedMetadata,
      requirements: analyzeRequirements(mockSeedMetadata)
    })

    expect(checklist.tasks.length).toBeGreaterThan(0)
    expect(checklist.tasks.some(t => t.description.toLowerCase().includes('application'))).toBe(true)
    expect(checklist.tasks.some(t => t.priority === 'high')).toBe(true)
  })

  it('should generate ACCOMMODATION checklist with participant count', () => {
    mockPhase.type = 'ACCOMMODATION'

    const checklist = generateChecklist({
      phase: mockPhase,
      seed: mockSeedMetadata,
      requirements: analyzeRequirements(mockSeedMetadata)
    })

    // Check that participant count is mentioned
    const hasParticipantCount = checklist.tasks.some(t =>
      t.description.includes(String(mockSeedMetadata.participants))
    )
    expect(hasParticipantCount).toBe(true)
  })

  it('should generate TRAVEL checklist with destination', () => {
    mockPhase.type = 'TRAVEL'
    mockPhase.name = 'Outbound Travel Arrangements'

    const checklist = generateChecklist({
      phase: mockPhase,
      seed: mockSeedMetadata,
      requirements: analyzeRequirements(mockSeedMetadata)
    })

    // Check that destination is mentioned
    const hasDestination = checklist.tasks.some(t =>
      t.description.includes(mockSeedMetadata.destination)
    )
    expect(hasDestination).toBe(true)
  })

  it('should set due dates for high-priority tasks', () => {
    const checklist = generateChecklist({
      phase: mockPhase,
      seed: mockSeedMetadata,
      requirements: analyzeRequirements(mockSeedMetadata)
    })

    const highPriorityTasks = checklist.tasks.filter(t => t.priority === 'high')
    const tasksWithDueDates = highPriorityTasks.filter(t => t.dueDate)

    expect(tasksWithDueDates.length).toBeGreaterThan(0)
  })

  it('should include visa tasks when required', () => {
    mockPhase.type = 'PERMITS'
    mockPhase.name = 'Visa Applications'

    const requirements = analyzeRequirements(mockSeedMetadata)

    const checklist = generateChecklist({
      phase: mockPhase,
      seed: mockSeedMetadata,
      requirements
    })

    const hasVisaTasks = checklist.tasks.some(t =>
      t.description.toLowerCase().includes('visa')
    )
    expect(hasVisaTasks).toBe(true)
  })

  it('should generate different checklists for workshop vs cultural visit', () => {
    mockPhase.type = 'ACTIVITIES'

    // Workshop activity
    mockPhase.name = 'Cultural Workshop'
    const workshopChecklist = generateChecklist({
      phase: mockPhase,
      seed: mockSeedMetadata,
      requirements: analyzeRequirements(mockSeedMetadata)
    })

    // Cultural visit activity
    mockPhase.name = 'City Tour'
    const visitChecklist = generateChecklist({
      phase: mockPhase,
      seed: mockSeedMetadata,
      requirements: analyzeRequirements(mockSeedMetadata)
    })

    // Checklists should be different
    expect(workshopChecklist.tasks.length).not.toBe(visitChecklist.tasks.length)

    // Workshop should mention facilitator
    expect(workshopChecklist.tasks.some(t => t.description.includes('facilitator'))).toBe(true)

    // Visit should mention tickets
    expect(visitChecklist.tasks.some(t => t.description.includes('ticket'))).toBe(true)
  })
})
