/**
 * Integration tests for complete seed-to-project conversion
 *
 * Tests the full workflow from seed to generated project with phases and checklists
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { prisma } from '../../../config/database.js'
import { convertSeedToProject } from '../../../seeds/seeds.service.js'
import type { User, Seed } from '@prisma/client'

describe('Seed to Project Conversion Integration', () => {
  let testUser: User
  let testSeed: Seed

  beforeEach(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
        password_hash: 'hash',
        role: 'COORDINATOR'
      }
    })

    // Create test seed with rich metadata
    testSeed = await prisma.seed.create({
      data: {
        user_id: testUser.id,
        title: 'Barcelona Youth Exchange',
        description: 'Cultural exchange program for youth',
        title_formal: 'Barcelona Intercultural Youth Exchange 2026',
        description_formal: 'An Erasmus+ youth exchange program promoting intercultural learning',
        approval_likelihood: 0.75,
        approval_likelihood_formal: 0.85,
        estimated_participants: 30,
        estimated_duration: 7,
        tags: ['youth', 'exchange', 'culture', 'erasmus+'],
        current_version: {
          destination: 'Barcelona, Spain',
          participantCountries: ['TR', 'GR'],
          startDate: '2026-06-01T00:00:00.000Z',
          estimatedBudget: 50000,
          isPublicEvent: false,
          requiresPermits: false,
          activities: [
            {
              name: 'Cultural Workshop',
              type: 'workshop',
              duration: 3,
              isOutdoor: false,
              requiresFacilitator: true,
              description: 'Workshop on cultural diversity'
            },
            {
              name: 'City Tour',
              type: 'cultural_visit',
              duration: 2,
              isOutdoor: true,
              requiresFacilitator: false,
              description: 'Guided tour of Barcelona'
            }
          ]
        },
        is_saved: true,
        is_dismissed: false
      }
    })
  })

  afterEach(async () => {
    // Clean up in reverse order due to foreign keys
    await prisma.phase.deleteMany({
      where: {
        project: {
          created_by: testUser.id
        }
      }
    })
    await prisma.project.deleteMany({
      where: {
        created_by: testUser.id
      }
    })
    await prisma.seed.deleteMany({
      where: {
        user_id: testUser.id
      }
    })
    await prisma.user.delete({
      where: {
        id: testUser.id
      }
    })
  })

  it('should convert seed to complete project with all phases', async () => {
    const result = await convertSeedToProject(testSeed.id, testUser.id)

    // Project created
    expect(result.project).toBeDefined()
    expect(result.project.name).toContain('Barcelona')
    expect(result.project.participants_count).toBe(30)
    expect(result.project.status).toBe('PLANNING')
    expect(result.project.type).toBe('STUDENT_EXCHANGE')

    // Budget allocated
    expect(Number(result.project.budget_total)).toBe(50000)

    // Phases created
    expect(result.phases.length).toBeGreaterThan(5)

    // Core phases exist
    const phaseTypes = result.phases.map(p => p.type)
    expect(phaseTypes).toContain('APPLICATION')
    expect(phaseTypes).toContain('ACCOMMODATION')
    expect(phaseTypes).toContain('TRAVEL')
    expect(phaseTypes).toContain('FOOD')
    expect(phaseTypes).toContain('REPORTING')

    // Timeline generated
    expect(result.timeline).toBeDefined()
    expect(result.timeline.preparation).toBeDefined()
    expect(result.timeline.exchange.startDate).toContain('2026-06-01')

    // Budget breakdown exists
    expect(result.budget).toBeDefined()
    expect(result.budget.totalBudget).toBe(50000)
    expect(result.budget.breakdown.travel).toBeGreaterThan(0)

    // Requirements analyzed
    expect(result.requirements).toBeDefined()
    expect(result.requirements.visas.required).toBe(true) // Turkish participants
    expect(result.requirements.insurance.required).toBe(true)
  })

  it('should create phases with checklists', async () => {
    const result = await convertSeedToProject(testSeed.id, testUser.id)

    const accommodationPhase = result.phases.find(p => p.type === 'ACCOMMODATION')
    expect(accommodationPhase).toBeDefined()
    expect(accommodationPhase!.checklist).toBeDefined()

    const checklist = accommodationPhase!.checklist as any
    expect(checklist.tasks).toBeDefined()
    expect(checklist.tasks.length).toBeGreaterThan(0)
    expect(checklist.tasks[0]).toHaveProperty('description')
    expect(checklist.tasks[0]).toHaveProperty('completed')
    expect(checklist.tasks[0]).toHaveProperty('priority')
  })

  it('should create activity-specific phases', async () => {
    const result = await convertSeedToProject(testSeed.id, testUser.id)

    const activityPhases = result.phases.filter(p => p.type === 'ACTIVITIES')
    expect(activityPhases.length).toBe(2) // 2 activities in seed

    const phaseNames = activityPhases.map(p => p.name)
    expect(phaseNames).toContain('Cultural Workshop')
    expect(phaseNames).toContain('City Tour')
  })

  it('should allocate budget across all phases', async () => {
    const result = await convertSeedToProject(testSeed.id, testUser.id)

    const totalAllocated = result.phases.reduce(
      (sum, phase) => sum + Number(phase.budget_allocated),
      0
    )

    // Total should be close to budget (within 10 EUR due to rounding)
    expect(Math.abs(totalAllocated - 50000)).toBeLessThanOrEqual(10)
  })

  it('should set dependencies correctly', async () => {
    const result = await convertSeedToProject(testSeed.id, testUser.id)

    const travelPhase = result.phases.find(p =>
      p.type === 'TRAVEL' && p.name.includes('Outbound')
    )
    expect(travelPhase).toBeDefined()
    expect(travelPhase!.dependencies.length).toBeGreaterThan(0)

    // Travel should depend on insurance and accommodation
    expect(travelPhase!.dependencies).toContain('INSURANCE')
    expect(travelPhase!.dependencies).toContain('ACCOMMODATION')
  })

  it('should create visa phase for non-EU participants', async () => {
    const result = await convertSeedToProject(testSeed.id, testUser.id)

    // Turkish participants require visa to Spain
    const visaPhase = result.phases.find(p =>
      p.type === 'PERMITS' && p.name.toLowerCase().includes('visa')
    )
    expect(visaPhase).toBeDefined()
  })

  it('should store metadata in project', async () => {
    const result = await convertSeedToProject(testSeed.id, testUser.id)

    const metadata = result.project.metadata as any
    expect(metadata).toBeDefined()
    expect(metadata.converted_from_seed_id).toBe(testSeed.id)
    expect(metadata.timeline_summary).toBeDefined()
    expect(metadata.budget_breakdown).toBeDefined()
    expect(metadata.requirements_summary).toBeDefined()
    expect(metadata.generation_timestamp).toBeDefined()
  })

  it('should use formal versions if available', async () => {
    const result = await convertSeedToProject(testSeed.id, testUser.id)

    expect(result.project.name).toContain('Intercultural')
    expect(result.project.description).toContain('Erasmus+')
  })

  it('should handle seeds without start date gracefully', async () => {
    // Create seed without start date in current_version
    const seedNoDate = await prisma.seed.create({
      data: {
        user_id: testUser.id,
        title: 'Test Project',
        description: 'Test description',
        estimated_participants: 20,
        estimated_duration: 5,
        tags: ['test'],
        current_version: {
          destination: 'Paris, France',
          participantCountries: ['DE'],
          activities: []
        },
        is_saved: true,
        is_dismissed: false
      }
    })

    const result = await convertSeedToProject(seedNoDate.id, testUser.id)

    // Should create project with default start date (~60 days in future)
    expect(result.project).toBeDefined()
    expect(result.project.start_date).toBeDefined()

    const startDate = new Date(result.project.start_date)
    const now = new Date()
    const daysDiff = Math.floor((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    expect(daysDiff).toBeGreaterThan(40) // ~60 days minus processing time
    expect(daysDiff).toBeLessThan(80)
  })

  it('should handle minimal seed data with defaults', async () => {
    // Create minimal seed
    const minimalSeed = await prisma.seed.create({
      data: {
        user_id: testUser.id,
        title: 'Minimal Seed',
        description: 'Minimal description',
        tags: [],
        is_saved: true,
        is_dismissed: false
      }
    })

    const result = await convertSeedToProject(minimalSeed.id, testUser.id)

    // Should still create valid project with defaults
    expect(result.project).toBeDefined()
    expect(result.project.participants_count).toBe(20) // Default
    expect(Number(result.project.budget_total)).toBe(50000) // Default
    expect(result.phases.length).toBeGreaterThan(0)
  })

  it('should validate timeline is realistic', async () => {
    const result = await convertSeedToProject(testSeed.id, testUser.id)

    // Preparation should be 8-12 weeks
    expect(result.timeline.preparation.durationWeeks).toBeGreaterThanOrEqual(8)
    expect(result.timeline.preparation.durationWeeks).toBeLessThanOrEqual(12)

    // Follow-up should be ~4 weeks
    expect(result.timeline.followUp.durationWeeks).toBe(4)

    // Exchange should match seed duration
    expect(result.timeline.exchange.durationDays).toBe(7)
  })

  it('should create project with correct project type from tags', async () => {
    // Training project
    const trainingSeed = await prisma.seed.create({
      data: {
        user_id: testUser.id,
        title: 'Training Course',
        description: 'Professional training',
        tags: ['training', 'professional'],
        estimated_participants: 15,
        estimated_duration: 5,
        is_saved: true,
        is_dismissed: false
      }
    })

    const result = await convertSeedToProject(trainingSeed.id, testUser.id)
    expect(result.project.type).toBe('TRAINING')
  })

  it('should ensure phases are ordered correctly', async () => {
    const result = await convertSeedToProject(testSeed.id, testUser.id)

    // Get phases sorted by order
    const sortedPhases = [...result.phases].sort((a, b) => a.order - b.order)

    // Check sequential ordering
    sortedPhases.forEach((phase, index) => {
      expect(phase.order).toBe(index + 1)
    })

    // APPLICATION should be first
    expect(sortedPhases[0].type).toBe('APPLICATION')

    // REPORTING should be last
    expect(sortedPhases[sortedPhases.length - 1].type).toBe('REPORTING')
  })
})
