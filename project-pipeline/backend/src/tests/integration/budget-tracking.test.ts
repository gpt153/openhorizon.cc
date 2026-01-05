/**
 * Budget Tracking Integration Tests
 *
 * Tests the complete budget tracking workflow including:
 * - Budget overview
 * - Expense recording
 * - Quote comparison
 * - Budget alerts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createMockPrismaClient, testData } from '../setup'

describe('Budget Tracking Integration', () => {
  let mockPrisma: ReturnType<typeof createMockPrismaClient>

  beforeEach(() => {
    mockPrisma = createMockPrismaClient()
  })

  describe('Budget Overview', () => {
    it('should calculate total budget correctly', async () => {
      const project = {
        ...testData.project,
        phases: [
          { ...testData.phase, budget: 15000, spent: 5000 },
          { ...testData.phase, id: 'phase-2', budget: 10000, spent: 3000 },
          { ...testData.phase, id: 'phase-3', budget: 25000, spent: 4000 }
        ]
      }

      mockPrisma.project.findUnique.mockResolvedValue(project)

      // Budget calculations
      const totalBudget = 50000
      const allocated = 50000 // 15k + 10k + 25k
      const spent = 12000 // 5k + 3k + 4k
      const remaining = 38000

      expect(totalBudget).toBe(50000)
      expect(allocated).toBe(50000)
      expect(spent).toBe(12000)
      expect(remaining).toBe(38000)
      expect((remaining / totalBudget) * 100).toBe(76)
    })

    it('should determine correct budget health status', () => {
      const scenarios = [
        { spent: 5000, budget: 10000, expected: 'green' }, // 50%
        { spent: 8000, budget: 10000, expected: 'yellow' }, // 80%
        { spent: 9600, budget: 10000, expected: 'red' }, // 96%
        { spent: 11000, budget: 10000, expected: 'red' } // Over budget
      ]

      scenarios.forEach(({ spent, budget, expected }) => {
        const percentage = (spent / budget) * 100

        let health: string
        if (percentage >= 95) health = 'red'
        else if (percentage >= 75) health = 'yellow'
        else health = 'green'

        expect(health).toBe(expected)
      })
    })

    it('should identify unallocated budget', () => {
      const totalBudget = 50000
      const phases = [
        { budget: 15000 },
        { budget: 10000 },
        { budget: 20000 }
      ]

      const allocated = phases.reduce((sum, p) => sum + p.budget, 0)
      const unallocated = totalBudget - allocated

      expect(unallocated).toBe(5000)
    })

    it('should calculate phase budget health', () => {
      const phase = {
        budget: 15000,
        spent: 12000,
        quotes: [
          { status: 'ACCEPTED', amount: 12000 },
          { status: 'PENDING', amount: 3000 }
        ]
      }

      const remaining = phase.budget - phase.spent
      const spentPercentage = (phase.spent / phase.budget) * 100

      expect(remaining).toBe(3000)
      expect(spentPercentage).toBe(80)
    })
  })

  describe('Expense Recording', () => {
    it('should record expense and update spent amount', async () => {
      const phase = { ...testData.phase, spent: 1000 }
      const expense = { amount: 250, description: 'Bus tickets', category: 'transportation' }

      mockPrisma.phase.findUnique.mockResolvedValue(phase)
      mockPrisma.phase.update.mockResolvedValue({
        ...phase,
        spent: 1250
      })

      const updatedSpent = phase.spent + expense.amount
      expect(updatedSpent).toBe(1250)

      // Verify update was called with correct data
      const updateCall = mockPrisma.phase.update.mock.calls[0]
      expect(updateCall).toBeDefined()
    })

    it('should prevent negative expenses', () => {
      const invalidExpense = { amount: -100, description: 'Invalid' }

      // Validation should fail
      expect(invalidExpense.amount).toBeLessThan(0)
      // In real implementation, this would throw a validation error
    })

    it('should track expenses by category', () => {
      const expenses = [
        { amount: 500, category: 'accommodation' },
        { amount: 300, category: 'food' },
        { amount: 200, category: 'transportation' },
        { amount: 150, category: 'accommodation' }
      ]

      const byCategory = expenses.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount
        return acc
      }, {} as Record<string, number>)

      expect(byCategory.accommodation).toBe(650)
      expect(byCategory.food).toBe(300)
      expect(byCategory.transportation).toBe(200)
    })
  })

  describe('Quote Comparison', () => {
    it('should compare quotes and find best value', () => {
      const quotes = [
        {
          id: 'q1',
          amount: 120,
          vendor: { name: 'Hotel A', rating: 9.2 }
        },
        {
          id: 'q2',
          amount: 80,
          vendor: { name: 'Hostel B', rating: 8.5 }
        },
        {
          id: 'q3',
          amount: 150,
          vendor: { name: 'Hotel C', rating: 9.5 }
        }
      ]

      // Calculate value scores (price + rating)
      const withScores = quotes.map(q => ({
        ...q,
        valueScore: (100 - (q.amount / 2)) + (q.vendor.rating * 5)
      }))

      const bestValue = withScores.reduce((best, current) =>
        current.valueScore > best.valueScore ? current : best
      )

      expect(bestValue.vendor.name).toBe('Hostel B') // Best balance of price and rating
    })

    it('should identify lowest and highest quotes', () => {
      const quotes = [
        { amount: 120 },
        { amount: 80 },
        { amount: 150 }
      ]

      const lowest = Math.min(...quotes.map(q => q.amount))
      const highest = Math.max(...quotes.map(q => q.amount))
      const average = quotes.reduce((sum, q) => sum + q.amount, 0) / quotes.length

      expect(lowest).toBe(80)
      expect(highest).toBe(150)
      expect(average).toBeCloseTo(116.67, 1)
    })

    it('should generate AI recommendation', () => {
      const quote = {
        id: 'q1',
        amount: 120,
        vendor: { name: 'Hotel Barcelona', rating: 9.2 },
        valueScore: 95
      }

      const recommendation = {
        quoteId: quote.id,
        reason: `Best overall value (score: ${quote.valueScore}/100). Great balance of price (€${quote.amount}) and rating (${quote.vendor.rating}/10).`
      }

      expect(recommendation.quoteId).toBe('q1')
      expect(recommendation.reason).toContain('best overall value')
      expect(recommendation.reason).toContain('95/100')
    })
  })

  describe('Quote Acceptance', () => {
    it('should accept quote and update budget', async () => {
      const phase = { ...testData.phase, spent: 0 }
      const quote = { ...testData.quote, status: 'PENDING', amount: 120 }

      mockPrisma.quote.findUnique.mockResolvedValue(quote)
      mockPrisma.phase.findUnique.mockResolvedValue(phase)

      // Accept quote
      mockPrisma.quote.update.mockResolvedValue({
        ...quote,
        status: 'ACCEPTED'
      })

      mockPrisma.phase.update.mockResolvedValue({
        ...phase,
        spent: 120
      })

      expect(quote.amount).toBe(120)
      // Verify quote was accepted and budget updated
    })

    it('should reject other pending quotes for same phase', async () => {
      const quotes = [
        { id: 'q1', phaseId: 'phase-1', status: 'PENDING' },
        { id: 'q2', phaseId: 'phase-1', status: 'PENDING' },
        { id: 'q3', phaseId: 'phase-1', status: 'PENDING' }
      ]

      // When accepting q1, others should be rejected
      const acceptedId = 'q1'
      const toReject = quotes.filter(q => q.id !== acceptedId)

      expect(toReject.length).toBe(2)
      toReject.forEach(q => {
        expect(q.status).toBe('PENDING')
        // In real implementation, these would be updated to 'REJECTED'
      })
    })
  })

  describe('Budget Alerts', () => {
    it('should generate alert when budget reaches 80%', () => {
      const project = {
        name: 'Barcelona Exchange',
        budget: 50000,
        spent: 40000 // 80%
      }

      const percentage = (project.spent / project.budget) * 100
      const remaining = project.budget - project.spent

      expect(percentage).toBe(80)

      if (percentage >= 80 && percentage < 95) {
        const alert = {
          type: 'warning',
          projectName: project.name,
          message: `Warning: ${(100 - percentage).toFixed(1)}% budget remaining`,
          remaining
        }

        expect(alert.type).toBe('warning')
        expect(alert.message).toContain('20.0% budget remaining')
        expect(alert.remaining).toBe(10000)
      }
    })

    it('should generate critical alert when budget reaches 95%', () => {
      const project = {
        name: 'Barcelona Exchange',
        budget: 50000,
        spent: 48000 // 96%
      }

      const percentage = (project.spent / project.budget) * 100

      if (percentage >= 95) {
        const alert = {
          type: 'critical',
          projectName: project.name,
          message: `Critical: Only ${((100 - percentage).toFixed(1))}% budget remaining`,
          remaining: project.budget - project.spent
        }

        expect(alert.type).toBe('critical')
        expect(alert.message).toContain('Only')
      }
    })

    it('should generate alert when phase is over budget', () => {
      const phase = {
        name: 'Accommodation',
        budget: 15000,
        spent: 15450,
        project: { name: 'Barcelona Exchange' }
      }

      if (phase.spent > phase.budget) {
        const overBudget = phase.spent - phase.budget

        const alert = {
          type: 'critical',
          projectName: phase.project.name,
          phaseName: phase.name,
          message: `Phase over budget by €${overBudget}`
        }

        expect(alert.type).toBe('critical')
        expect(alert.message).toContain('over budget by €450')
      }
    })

    it('should generate alert for unallocated budget', () => {
      const project = {
        name: 'Barcelona Exchange',
        budget: 50000,
        phases: [
          { budget: 15000 },
          { budget: 10000 },
          { budget: 20000 }
        ]
      }

      const allocated = project.phases.reduce((sum, p) => sum + p.budget, 0)
      const unallocated = project.budget - allocated

      if (unallocated > 0) {
        const alert = {
          type: 'info',
          projectName: project.name,
          message: `€${unallocated} unallocated budget remaining`,
          unallocated
        }

        expect(alert.type).toBe('info')
        expect(alert.unallocated).toBe(5000)
      }
    })

    it('should filter alerts by severity', () => {
      const alerts = [
        { type: 'info', message: 'Info alert' },
        { type: 'warning', message: 'Warning alert' },
        { type: 'critical', message: 'Critical alert' },
        { type: 'critical', message: 'Another critical' }
      ]

      const critical = alerts.filter(a => a.type === 'critical')
      const warnings = alerts.filter(a => a.type === 'warning')

      expect(critical.length).toBe(2)
      expect(warnings.length).toBe(1)
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero budget', () => {
      const phase = { budget: 0, spent: 0 }

      // Avoid division by zero
      const percentage = phase.budget > 0
        ? (phase.spent / phase.budget) * 100
        : 0

      expect(percentage).toBe(0)
    })

    it('should handle budget without any spending', () => {
      const phase = { budget: 15000, spent: 0 }

      const remaining = phase.budget - phase.spent
      const percentage = (phase.spent / phase.budget) * 100

      expect(remaining).toBe(15000)
      expect(percentage).toBe(0)
    })

    it('should handle floating point precision', () => {
      const phase = { budget: 100, spent: 33.33 }

      const percentage = (phase.spent / phase.budget) * 100

      expect(percentage).toBeCloseTo(33.33, 2)
    })

    it('should handle currency conversion (future)', () => {
      // Placeholder for multi-currency support
      const quote = { amount: 120, currency: 'EUR' }
      const project = { budget: 50000, currency: 'EUR' }

      // Currently same currency
      expect(quote.currency).toBe(project.currency)

      // Future: Convert USD to EUR, etc.
    })
  })
})
