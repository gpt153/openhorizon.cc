/**
 * Test suite for SeedElaborationAgent
 *
 * Tests the conversational elaboration agent's ability to:
 * - Ask progressive questions
 * - Extract structured data from natural language
 * - Validate against Erasmus+ requirements
 * - Calculate completeness scores
 * - Handle various answer formats
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { SeedElaborationAgent } from '../ai/agents/seed-elaboration-agent.js'
import type { GeneratedSeed, SeedMetadata } from '../seeds/seeds.types.js'

describe('SeedElaborationAgent', () => {
  let agent: SeedElaborationAgent
  let mockSeed: GeneratedSeed

  beforeEach(() => {
    agent = new SeedElaborationAgent()
    mockSeed = {
      title: 'Digital Skills Exchange',
      description: 'A youth exchange focused on digital literacy and technology',
      approvalLikelihood: 0.7,
      titleFormal: 'Digital Competencies Development Programme',
      descriptionFormal: 'A structured learning exchange programme targeting digital literacy development',
      approvalLikelihoodFormal: 0.75,
      suggestedTags: ['digital', 'technology', 'education'],
      estimatedDuration: 7,
      estimatedParticipants: 28
    }
  })

  describe('Question Flow', () => {
    it('should start with participant count question', async () => {
      const response = await agent.startSession(mockSeed)

      expect(response.sessionId).toBeDefined()
      expect(response.question).toContain('participants')
      expect(response.metadata.completeness).toBe(0)
    })

    it('should skip questions where data already exists', async () => {
      const existingMetadata: Partial<SeedMetadata> = {
        participantCount: 30,
        completeness: 0
      }

      const response = await agent.startSession(mockSeed, existingMetadata)

      // Should skip participant count and ask about budget
      expect(response.question).toContain('budget')
    })

    it('should mark complete when all required fields filled', async () => {
      const completeMetadata: SeedMetadata = {
        participantCount: 30,
        budgetPerParticipant: 400,
        totalBudget: 12000,
        duration: 7,
        destination: {
          country: 'ES',
          city: 'Barcelona'
        },
        participantCountries: ['DE', 'FR', 'IT'],
        completeness: 100
      }

      const response = await agent.startSession(mockSeed, completeMetadata)

      expect(response.metadata.completeness).toBe(100)
    })
  })

  describe('Data Extraction', () => {
    it('should extract participant count from natural language', async () => {
      const metadata: SeedMetadata = {
        participantCount: undefined,
        completeness: 0,
        sessionId: 'test-session'
      }

      const response = await agent.processAnswer(
        'test-session',
        'We are planning for about 30 young people',
        metadata,
        mockSeed
      )

      expect(response.metadata.participantCount).toBe(30)
    })

    it('should parse budget from various formats', async () => {
      const metadata: SeedMetadata = {
        participantCount: 30,
        completeness: 0,
        sessionId: 'test-session',
        currentQuestionIndex: 1 // Budget question
      }

      const response = await agent.processAnswer(
        'test-session',
        'Around €400 per participant',
        metadata,
        mockSeed
      )

      expect(response.metadata.budgetPerParticipant).toBeCloseTo(400, 0)
      expect(response.metadata.totalBudget).toBeCloseTo(12000, 0)
    })

    it('should parse duration in days and weeks', async () => {
      const metadata: SeedMetadata = {
        participantCount: 30,
        budgetPerParticipant: 400,
        completeness: 0,
        sessionId: 'test-session',
        currentQuestionIndex: 2 // Duration question
      }

      const response = await agent.processAnswer(
        'test-session',
        'It will last 2 weeks',
        metadata,
        mockSeed
      )

      expect(response.metadata.duration).toBe(14)
    })

    it('should extract location details', async () => {
      const metadata: SeedMetadata = {
        participantCount: 30,
        budgetPerParticipant: 400,
        duration: 7,
        completeness: 0,
        sessionId: 'test-session',
        currentQuestionIndex: 3 // Destination question
      }

      const response = await agent.processAnswer(
        'test-session',
        'We are thinking Barcelona, Spain. Probably at the youth center in Gràcia.',
        metadata,
        mockSeed
      )

      expect(response.metadata.destination).toBeDefined()
      expect(response.metadata.destination?.country).toBe('ES')
      expect(response.metadata.destination?.city).toContain('Barcelona')
      expect(response.metadata.destination?.venue).toContain('Gràcia')
    })
  })

  describe('Validation', () => {
    it('should validate participant count within Erasmus+ range', async () => {
      const metadata: SeedMetadata = {
        completeness: 0,
        sessionId: 'test-session'
      }

      const response = await agent.processAnswer(
        'test-session',
        '10 participants', // Too few
        metadata,
        mockSeed
      )

      expect(response.validationErrors).toBeDefined()
      expect(response.validationErrors).toHaveLength(1)
      expect(response.validationErrors![0]).toContain('16-60')
    })

    it('should accept valid participant count', async () => {
      const metadata: SeedMetadata = {
        completeness: 0,
        sessionId: 'test-session'
      }

      const response = await agent.processAnswer(
        'test-session',
        '28 participants',
        metadata,
        mockSeed
      )

      expect(response.validationErrors).toBeUndefined()
      expect(response.metadata.participantCount).toBe(28)
    })

    it('should warn about unusual budget', async () => {
      const metadata: SeedMetadata = {
        participantCount: 30,
        completeness: 0,
        sessionId: 'test-session',
        currentQuestionIndex: 1
      }

      const response = await agent.processAnswer(
        'test-session',
        '€100 per person', // Unusually low
        metadata,
        mockSeed
      )

      expect(response.validationErrors).toBeDefined()
    })
  })

  describe('Intelligent Defaults', () => {
    it('should suggest budget based on duration and participants', async () => {
      const metadata: SeedMetadata = {
        participantCount: 30,
        duration: 10,
        completeness: 0,
        sessionId: 'test-session',
        currentQuestionIndex: 1
      }

      const response = await agent.startSession(mockSeed, metadata)

      expect(response.suggestions).toBeDefined()
      expect(response.suggestions!.length).toBeGreaterThan(0)
      // Should suggest budget based on 10 days and 30 participants
      expect(response.suggestions![0]).toContain('€')
    })

    it('should suggest EU priorities based on seed description', async () => {
      const digitalSeed: GeneratedSeed = {
        ...mockSeed,
        description: 'A youth exchange focused on digital literacy, inclusion, and environmental sustainability'
      }

      const metadata: SeedMetadata = {
        participantCount: 30,
        budgetPerParticipant: 400,
        duration: 7,
        destination: { country: 'ES', city: 'Barcelona' },
        participantCountries: ['DE', 'FR'],
        completeness: 0,
        sessionId: 'test-session',
        currentQuestionIndex: 6 // EU priorities question
      }

      const response = await agent.startSession(digitalSeed, metadata)

      expect(response.suggestions).toBeDefined()
      expect(response.suggestions![0]).toContain('Digital')
      expect(response.suggestions![0]).toContain('Inclusion')
      expect(response.suggestions![0]).toContain('Environment')
    })
  })

  describe('Completeness Calculation', () => {
    it('should calculate 0% for empty metadata', () => {
      const metadata: SeedMetadata = {
        completeness: 0
      }

      const completeness = agent.calculateCompleteness(metadata)

      expect(completeness).toBe(0)
    })

    it('should calculate 100% for complete metadata', () => {
      const metadata: SeedMetadata = {
        participantCount: 30,
        participantCountries: ['DE', 'FR', 'IT'],
        budgetPerParticipant: 400,
        totalBudget: 12000,
        duration: 7,
        destination: {
          country: 'ES',
          city: 'Barcelona'
        },
        activities: [
          { name: 'Workshop 1', duration: '2 days' }
        ],
        erasmusPriorities: ['Digital transformation', 'Inclusion'],
        completeness: 0 // Will be recalculated
      }

      const completeness = agent.calculateCompleteness(metadata)

      expect(completeness).toBeGreaterThan(90)
    })

    it('should weight critical fields higher', () => {
      // Metadata with only critical fields
      const criticalMetadata: SeedMetadata = {
        participantCount: 30,
        budgetPerParticipant: 400,
        duration: 7,
        destination: {
          country: 'ES',
          city: 'Barcelona'
        },
        participantCountries: ['DE', 'FR'],
        completeness: 0
      }

      // Metadata with only optional fields
      const optionalMetadata: SeedMetadata = {
        activities: [{ name: 'Workshop', duration: '1 day' }],
        erasmusPriorities: ['Digital'],
        completeness: 0
      }

      const criticalCompleteness = agent.calculateCompleteness(criticalMetadata)
      const optionalCompleteness = agent.calculateCompleteness(optionalMetadata)

      expect(criticalCompleteness).toBeGreaterThan(optionalCompleteness)
    })

    it('should identify missing required fields', () => {
      const metadata: SeedMetadata = {
        participantCount: 30,
        duration: 7,
        completeness: 0
      }

      const missingFields = agent.identifyMissingFields(metadata)

      expect(missingFields).toContain('budgetPerParticipant')
      expect(missingFields).toContain('destination')
      expect(missingFields).toContain('participantCountries')
    })
  })

  describe('Auto-calculations', () => {
    it('should calculate visa requirements based on destination and participant countries', async () => {
      const metadata: SeedMetadata = {
        participantCount: 30,
        budgetPerParticipant: 400,
        duration: 7,
        destination: {
          country: 'ES', // Spain (EU)
          city: 'Barcelona'
        },
        completeness: 0,
        sessionId: 'test-session',
        currentQuestionIndex: 4
      }

      const response = await agent.processAnswer(
        'test-session',
        'Germany, France, and Poland',
        metadata,
        mockSeed
      )

      expect(response.metadata.requirements).toBeDefined()
      expect(response.metadata.requirements?.visas).toBeDefined()
      expect(response.metadata.requirements?.visas.length).toBeGreaterThan(0)

      // Within EU, no visas needed
      const visaNeeded = response.metadata.requirements?.visas.some(v => v.needed)
      expect(visaNeeded).toBe(false)
    })

    it('should calculate total budget from per-person budget', async () => {
      const metadata: SeedMetadata = {
        participantCount: 25,
        completeness: 0,
        sessionId: 'test-session',
        currentQuestionIndex: 1
      }

      const response = await agent.processAnswer(
        'test-session',
        '€400 per participant',
        metadata,
        mockSeed
      )

      expect(response.metadata.budgetPerParticipant).toBe(400)
      expect(response.metadata.totalBudget).toBe(10000) // 25 * 400
    })
  })

  describe('Edge Cases', () => {
    it('should handle uncertain user responses', async () => {
      const metadata: SeedMetadata = {
        completeness: 0,
        sessionId: 'test-session'
      }

      const response = await agent.processAnswer(
        'test-session',
        "I'm not sure yet, what's typical?",
        metadata,
        mockSeed
      )

      // Should provide suggestions even if no data extracted
      expect(response.suggestions).toBeDefined()
    })

    it('should handle multi-part answers', async () => {
      const metadata: SeedMetadata = {
        participantCount: 30,
        budgetPerParticipant: 400,
        duration: 7,
        completeness: 0,
        sessionId: 'test-session',
        currentQuestionIndex: 3
      }

      const response = await agent.processAnswer(
        'test-session',
        'Barcelona, Spain. The exchange will be at the youth center in Gràcia district. It has wheelchair access and is near public transport.',
        metadata,
        mockSeed
      )

      expect(response.metadata.destination).toBeDefined()
      expect(response.metadata.destination?.country).toBe('ES')
      expect(response.metadata.destination?.city).toContain('Barcelona')
      expect(response.metadata.destination?.venue).toBeDefined()
      expect(response.metadata.destination?.accessibility).toBeDefined()
    })
  })
})

/**
 * Integration tests would include:
 * - Full conversational flows end-to-end
 * - Database integration with SeedElaboration model
 * - API endpoint testing
 * - Error handling and recovery
 */
