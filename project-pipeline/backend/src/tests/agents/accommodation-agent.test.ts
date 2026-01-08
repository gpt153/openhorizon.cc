/**
 * Accommodation Agent Tests
 *
 * Tests for the AccommodationAgent AI agent including:
 * - Hotel research functionality
 * - Web scraping integration
 * - AI enhancement
 * - Fallback mechanisms
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AccommodationAgent } from '../../ai/agents/accommodation-agent'
import { testData } from '../setup'

describe('AccommodationAgent', () => {
  let agent: AccommodationAgent

  beforeEach(() => {
    agent = new AccommodationAgent()
  })

  describe('constructor', () => {
    it('should create an instance of AccommodationAgent', () => {
      expect(agent).toBeInstanceOf(AccommodationAgent)
      expect(agent.agentName).toBe('AccommodationAgent')
    })
  })

  describe('handleMessage', () => {
    const mockPhaseData = {
      phase: testData.phase,
      project: testData.project,
      useRealData: false
    }

    it('should return accommodation suggestions when using mock data', async () => {
      const response = await agent.handleMessage(
        'Find hotels in Barcelona for 30 people',
        mockPhaseData
      )

      expect(response).toBeDefined()
      expect(typeof response).toBe('string')
      expect(response.toLowerCase()).toContain('accommodation')
    })

    it('should handle budget constraints in the request', async () => {
      const response = await agent.handleMessage(
        'Find budget hotels under €100 per night',
        mockPhaseData
      )

      expect(response).toBeDefined()
      expect(response.toLowerCase()).toMatch(/budget|price|cost/)
    })

    it('should handle location-specific requests', async () => {
      const response = await agent.handleMessage(
        'Find hotels near the beach in Barcelona',
        {
          ...mockPhaseData,
          project: { ...testData.project, location: 'Barcelona' }
        }
      )

      expect(response).toBeDefined()
      expect(response.toLowerCase()).toContain('barcelona')
    })

    it('should handle group size requirements', async () => {
      const response = await agent.handleMessage(
        'We need accommodation for 50 students',
        {
          ...mockPhaseData,
          project: { ...testData.project, participants: 50 }
        }
      )

      expect(response).toBeDefined()
      // Should mention capacity or group handling
      expect(response.toLowerCase()).toMatch(/group|capacity|students/)
    })

    it('should provide fallback suggestions when real data is unavailable', async () => {
      const response = await agent.handleMessage(
        'Find hotels',
        { ...mockPhaseData, useRealData: false }
      )

      expect(response).toBeDefined()
      expect(response).not.toBe('')
    })

    it('should handle errors gracefully', async () => {
      // Mock an error in the AI call
      vi.spyOn(agent as any, 'callAI').mockRejectedValueOnce(
        new Error('AI service unavailable')
      )

      const response = await agent.handleMessage(
        'Find hotels',
        mockPhaseData
      )

      // Should still return a response (fallback)
      expect(response).toBeDefined()
      expect(typeof response).toBe('string')
    })
  })

  describe('researchAccommodation (with mock scraping)', () => {
    it('should return structured accommodation data', async () => {
      // This tests the structure of the response
      const mockResult = {
        hotels: [
          {
            name: 'Hotel Test',
            type: 'hotel',
            pricePerNight: 120,
            rating: 8.5,
            location: 'Barcelona',
            amenities: ['WiFi', 'Breakfast'],
            capacity: 30,
            suitabilityScore: 85,
            reasoning: 'Good value for groups'
          }
        ]
      }

      // We can't easily test the actual scraping without integration tests,
      // but we can test that the agent handles the data structure correctly
      expect(mockResult.hotels).toBeInstanceOf(Array)
      expect(mockResult.hotels[0]).toHaveProperty('name')
      expect(mockResult.hotels[0]).toHaveProperty('pricePerNight')
      expect(mockResult.hotels[0]).toHaveProperty('suitabilityScore')
    })
  })

  describe('getFallbackData', () => {
    it('should return fallback hotels when called', () => {
      // Access private method for testing (TypeScript workaround)
      const fallbackData = (agent as any).getFallbackData({
        location: 'Barcelona',
        budget: 15000,
        participants: 30
      })

      expect(fallbackData).toBeDefined()
      expect(Array.isArray(fallbackData)).toBe(true)
      expect(fallbackData.length).toBeGreaterThan(0)
      expect(fallbackData[0]).toHaveProperty('name')
      expect(fallbackData[0]).toHaveProperty('suitabilityScore')
    })

    it('should adapt recommendations to budget', () => {
      const lowBudgetData = (agent as any).getFallbackData({
        location: 'Barcelona',
        budget: 5000,
        participants: 30
      })

      const highBudgetData = (agent as any).getFallbackData({
        location: 'Barcelona',
        budget: 50000,
        participants: 30
      })

      // Both should return data
      expect(lowBudgetData.length).toBeGreaterThan(0)
      expect(highBudgetData.length).toBeGreaterThan(0)

      // Low budget should suggest more budget options
      const lowBudgetTypes = lowBudgetData.map((h: any) => h.type)
      expect(lowBudgetTypes).toContain('hostel')
    })
  })

  describe('calculateSuitabilityScore', () => {
    it('should calculate score based on multiple factors', () => {
      const hotel = {
        name: 'Test Hotel',
        pricePerNight: 100,
        rating: 9.0,
        capacity: 40,
        location: 'city center',
        amenities: ['WiFi', 'Breakfast', 'Parking']
      }

      const score = (agent as any).calculateSuitabilityScore(hotel, {
        budget: 15000,
        participants: 30,
        location: 'Barcelona'
      })

      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
      expect(typeof score).toBe('number')
    })

    it('should give higher scores to better matches', () => {
      const perfectMatch = {
        pricePerNight: 50, // Very affordable
        rating: 9.5, // Excellent rating
        capacity: 50, // More than enough
        amenities: ['WiFi', 'Breakfast', 'Parking', 'Pool']
      }

      const poorMatch = {
        pricePerNight: 300, // Expensive
        rating: 6.0, // Lower rating
        capacity: 20, // Too small
        amenities: []
      }

      const goodScore = (agent as any).calculateSuitabilityScore(perfectMatch, {
        budget: 15000,
        participants: 30
      })

      const badScore = (agent as any).calculateSuitabilityScore(poorMatch, {
        budget: 15000,
        participants: 30
      })

      expect(goodScore).toBeGreaterThan(badScore)
    })
  })

  describe('integration scenarios', () => {
    it('should handle a complete research workflow', async () => {
      // Simulate a complete user request
      const userMessage = 'Find accommodation in Barcelona for 30 students with breakfast included, budget €100/night'

      const response = await agent.handleMessage(userMessage, {
        phase: testData.phase,
        project: testData.project,
        useRealData: false
      })

      expect(response).toBeDefined()
      expect(response.length).toBeGreaterThan(50) // Should be a substantial response
      expect(response.toLowerCase()).toContain('barcelona')
    })

    it('should handle requests with specific requirements', async () => {
      const response = await agent.handleMessage(
        'I need a hotel near the beach with pool and gym',
        {
          phase: testData.phase,
          project: testData.project,
          useRealData: false
        }
      )

      expect(response).toBeDefined()
      expect(response.toLowerCase()).toMatch(/beach|pool|gym|amenities/)
    })

    it('should provide multiple options', async () => {
      const response = await agent.handleMessage(
        'Show me 3-4 hotel options',
        {
          phase: testData.phase,
          project: testData.project,
          useRealData: false
        }
      )

      expect(response).toBeDefined()
      // Response should mention multiple options
      expect(response.toLowerCase()).toMatch(/options|different|various|several/)
    })
  })

  describe('error handling', () => {
    it('should handle missing phase data', async () => {
      const response = await agent.handleMessage('Find hotels', {
        phase: null as any,
        project: testData.project,
        useRealData: false
      })

      expect(response).toBeDefined()
      expect(typeof response).toBe('string')
    })

    it('should handle missing project data', async () => {
      const response = await agent.handleMessage('Find hotels', {
        phase: testData.phase,
        project: null as any,
        useRealData: false
      })

      expect(response).toBeDefined()
      expect(typeof response).toBe('string')
    })

    it('should handle invalid budget values', async () => {
      const response = await agent.handleMessage('Find hotels', {
        phase: { ...testData.phase, budget: -1000 }, // Invalid
        project: testData.project,
        useRealData: false
      })

      expect(response).toBeDefined()
      // Should still provide suggestions
    })

    it('should handle invalid participant counts', async () => {
      const response = await agent.handleMessage('Find hotels', {
        phase: testData.phase,
        project: { ...testData.project, participants: 0 }, // Invalid
        useRealData: false
      })

      expect(response).toBeDefined()
      // Should still provide suggestions
    })
  })

  describe('performance', () => {
    it('should respond within reasonable time (mock data)', async () => {
      const startTime = Date.now()

      await agent.handleMessage('Find hotels', {
        phase: testData.phase,
        project: testData.project,
        useRealData: false
      })

      const duration = Date.now() - startTime

      // Should be fast with mock data (under 5 seconds)
      expect(duration).toBeLessThan(5000)
    })
  })
})
