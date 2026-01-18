/**
 * Food Agent Tests
 *
 * Tests the FoodAgent AI research and analysis capabilities
 */

import { describe, it, expect, beforeAll } from '@jest/globals'
import { FoodAgent } from '@/lib/ai/agents/food-agent'
import type { AgentContext } from '@/lib/ai/agents/base-agent'

describe('FoodAgent', () => {
  let foodAgent: FoodAgent
  let mockContext: AgentContext

  beforeAll(() => {
    foodAgent = new FoodAgent()

    // Mock context for Barcelona youth exchange
    mockContext = {
      project: {
        name: 'Digital Skills Youth Exchange',
        location: 'Barcelona',
        participantCount: 30,
        startDate: new Date('2026-03-15'),
        endDate: new Date('2026-03-22'),
      },
      phase: {
        name: 'Food & Catering',
        type: 'FOOD',
        budgetAllocated: 3000,
        startDate: new Date('2026-03-15'),
        endDate: new Date('2026-03-22'),
      },
    }
  })

  describe('research()', () => {
    it('should return food options with proper structure', async () => {
      const options = await foodAgent.research(mockContext)

      expect(Array.isArray(options)).toBe(true)
      expect(options.length).toBeGreaterThan(0)

      // Check first option has all required fields
      const firstOption = options[0]
      expect(firstOption).toHaveProperty('name')
      expect(firstOption).toHaveProperty('type')
      expect(['caterer', 'restaurant']).toContain(firstOption.type)
      expect(firstOption).toHaveProperty('cuisineType')
      expect(firstOption).toHaveProperty('estimatedPricePerPerson')
      expect(firstOption).toHaveProperty('location')
      expect(firstOption).toHaveProperty('features')
      expect(Array.isArray(firstOption.features)).toBe(true)
      expect(firstOption).toHaveProperty('dietaryOptions')
      expect(Array.isArray(firstOption.dietaryOptions)).toBe(true)
      expect(firstOption).toHaveProperty('suitabilityScore')
      expect(firstOption.suitabilityScore).toBeGreaterThanOrEqual(0)
      expect(firstOption.suitabilityScore).toBeLessThanOrEqual(100)
      expect(firstOption).toHaveProperty('reasoning')
      expect(firstOption).toHaveProperty('pros')
      expect(Array.isArray(firstOption.pros)).toBe(true)
      expect(firstOption).toHaveProperty('cons')
      expect(Array.isArray(firstOption.cons)).toBe(true)
    })

    it('should include both caterers and restaurants', async () => {
      const options = await foodAgent.research(mockContext)

      const caterers = options.filter((o) => o.type === 'caterer')
      const restaurants = options.filter((o) => o.type === 'restaurant')

      // Should have at least one of each type
      expect(caterers.length).toBeGreaterThan(0)
      expect(restaurants.length).toBeGreaterThan(0)
    })

    it('should include common dietary options', async () => {
      const options = await foodAgent.research(mockContext)

      // At least one option should have vegan/vegetarian
      const hasVegetarian = options.some((o) =>
        o.dietaryOptions.some((d) => d.toLowerCase().includes('vegetarian'))
      )
      const hasVegan = options.some((o) =>
        o.dietaryOptions.some((d) => d.toLowerCase().includes('vegan'))
      )

      expect(hasVegetarian).toBe(true)
      expect(hasVegan).toBe(true)
    })
  })

  describe('analyzeFoodOption()', () => {
    it('should provide detailed analysis with pros, cons, and verdict', async () => {
      const mockOption = {
        name: 'Mediterranean Catering Barcelona',
        type: 'caterer' as const,
        cuisineType: 'Mediterranean',
        estimatedPricePerPerson: 18,
        features: ['Buffet style', 'Delivery included', 'Dietary accommodations'],
        capacity: { min: 20, max: 100 },
        dietaryOptions: ['Vegetarian', 'Vegan', 'Gluten-free', 'Halal'],
      }

      const analysis = await foodAgent.analyzeFoodOption(mockOption, mockContext)

      expect(analysis).toHaveProperty('pros')
      expect(Array.isArray(analysis.pros)).toBe(true)
      expect(analysis.pros.length).toBeGreaterThan(0)

      expect(analysis).toHaveProperty('cons')
      expect(Array.isArray(analysis.cons)).toBe(true)
      expect(analysis.cons.length).toBeGreaterThan(0)

      expect(analysis).toHaveProperty('verdict')
      expect(typeof analysis.verdict).toBe('string')
      expect(analysis.verdict.length).toBeGreaterThan(0)
    })
  })

  describe('generateQuoteEmail()', () => {
    it('should generate professional quote request email', async () => {
      const mockOption = {
        name: 'Barcelona Catering Co.',
        type: 'caterer' as const,
        cuisineType: 'Mediterranean',
        estimatedPricePerPerson: 20,
        location: 'Barcelona, City-wide delivery',
        contact: {
          email: 'contact@barcelonacatering.com',
          phone: '+34 123 456 789',
        },
        features: ['Buffet style', 'Delivery', 'Flexible menus'],
        capacity: { min: 20, max: 100 },
        dietaryOptions: ['Vegetarian', 'Vegan', 'Halal', 'Gluten-free'],
        suitabilityScore: 85,
        reasoning: 'Experienced with youth groups',
        pros: ['Flexible menus', 'Good dietary options'],
        cons: ['Requires 48h notice'],
      }

      const email = await foodAgent.generateQuoteEmail(mockOption, mockContext)

      expect(email).toHaveProperty('subject')
      expect(email.subject).toContain('Quote Request')
      expect(email.subject).toContain(mockContext.project!.name)

      expect(email).toHaveProperty('body')
      expect(email.body).toContain('Barcelona Catering Co.')
      expect(email.body).toContain('30')
      expect(email.body).toContain('Erasmus+')
      expect(email.body.toLowerCase()).toContain('dietary')
      expect(email.body.toLowerCase()).toContain('vegetarian')
      expect(email.body.toLowerCase()).toContain('vegan')
    })

    it('should differentiate between caterer and restaurant emails', async () => {
      const catererOption = {
        name: 'Test Caterer',
        type: 'caterer' as const,
        cuisineType: 'International',
        estimatedPricePerPerson: 15,
        location: 'Barcelona',
        features: [],
        capacity: { min: 20, max: 50 },
        dietaryOptions: ['Vegetarian'],
        suitabilityScore: 75,
        reasoning: 'Test',
        pros: [],
        cons: [],
      }

      const restaurantOption = {
        ...catererOption,
        name: 'Test Restaurant',
        type: 'restaurant' as const,
      }

      const catererEmail = await foodAgent.generateQuoteEmail(catererOption, mockContext)
      const restaurantEmail = await foodAgent.generateQuoteEmail(restaurantOption, mockContext)

      // Caterer email should mention delivery
      expect(catererEmail.body.toLowerCase()).toContain('delivery')

      // Restaurant email should mention dining/booking
      expect(restaurantEmail.body.toLowerCase()).toMatch(/dining|booking/)
    })
  })

  describe('handleChat()', () => {
    it('should respond to user questions about food options', async () => {
      const response = await foodAgent.handleChat(
        mockContext,
        'What dietary restrictions can you accommodate for group catering?'
      )

      expect(typeof response).toBe('string')
      expect(response.length).toBeGreaterThan(0)
      expect(response.toLowerCase()).toMatch(/dietary|vegetarian|vegan|halal/)
    })

    it('should provide budget advice', async () => {
      const response = await foodAgent.handleChat(
        mockContext,
        'What is a reasonable budget per person for group meals?'
      )

      expect(typeof response).toBe('string')
      expect(response.length).toBeGreaterThan(0)
      expect(response.toLowerCase()).toMatch(/budget|price|cost|€|euro/)
    })
  })
})
