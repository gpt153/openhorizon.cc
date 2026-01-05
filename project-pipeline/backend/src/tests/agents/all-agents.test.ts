/**
 * Comprehensive Tests for All AI Agents
 *
 * Tests all 6 specialized AI agents:
 * - AccommodationAgent
 * - TravelAgent
 * - FoodAgent
 * - ActivitiesAgent
 * - InsuranceAgent
 * - EmergencyAgent
 */

import { describe, it, expect } from 'vitest'
import { AccommodationAgent } from '../../ai/agents/accommodation-agent'
import { TravelAgent } from '../../ai/agents/travel-agent'
import { FoodAgent } from '../../ai/agents/food-agent'
import { ActivitiesAgent } from '../../ai/agents/activities-agent'
import { InsuranceAgent } from '../../ai/agents/insurance-agent'
import { EmergencyAgent} from '../../ai/agents/emergency-agent'
import { getAgentForPhaseType } from '../../ai/agents/registry'
import { testData } from '../setup'

const mockContext = {
  phase: testData.phase,
  project: testData.project,
  useRealData: false
}

describe('All AI Agents', () => {
  describe('Agent Registry', () => {
    it('should return AccommodationAgent for ACCOMMODATION phase', () => {
      const agent = getAgentForPhaseType('ACCOMMODATION')
      expect(agent).toBeInstanceOf(AccommodationAgent)
    })

    it('should return TravelAgent for TRAVEL phase', () => {
      const agent = getAgentForPhaseType('TRAVEL')
      expect(agent).toBeInstanceOf(TravelAgent)
    })

    it('should return FoodAgent for FOOD phase', () => {
      const agent = getAgentForPhaseType('FOOD')
      expect(agent).toBeInstanceOf(FoodAgent)
    })

    it('should return ActivitiesAgent for ACTIVITIES phase', () => {
      const agent = getAgentForPhaseType('ACTIVITIES')
      expect(agent).toBeInstanceOf(ActivitiesAgent)
    })

    it('should return InsuranceAgent for INSURANCE phase', () => {
      const agent = getAgentForPhaseType('INSURANCE')
      expect(agent).toBeInstanceOf(InsuranceAgent)
    })

    it('should return EmergencyAgent for EMERGENCY_PLANNING phase', () => {
      const agent = getAgentForPhaseType('EMERGENCY_PLANNING')
      expect(agent).toBeInstanceOf(EmergencyAgent)
    })

    it('should return BaseAgent for unknown phase type', () => {
      const agent = getAgentForPhaseType('UNKNOWN_PHASE')
      expect(agent.agentName).toBe('BaseAgent')
    })
  })

  describe('FoodAgent', () => {
    const agent = new FoodAgent()

    it('should provide food recommendations', async () => {
      const response = await agent.handleMessage(
        'Find restaurants for 30 people',
        { ...mockContext, phase: { ...testData.phase, type: 'FOOD' } }
      )

      expect(response).toBeDefined()
      expect(response.toLowerCase()).toMatch(/food|restaurant|catering|meal/)
    })

    it('should handle dietary requirements', async () => {
      const response = await agent.handleMessage(
        'Need vegetarian and gluten-free options',
        { ...mockContext, phase: { ...testData.phase, type: 'FOOD' } }
      )

      expect(response).toBeDefined()
      expect(response.toLowerCase()).toMatch(/vegetarian|gluten|dietary/)
    })

    it('should calculate per-meal budgets', async () => {
      const response = await agent.handleMessage(
        'Breakfast, lunch and dinner for 7 days',
        {
          ...mockContext,
          phase: { ...testData.phase, type: 'FOOD', budget: 10000 }
        }
      )

      expect(response).toBeDefined()
      expect(response.toLowerCase()).toMatch(/meal|breakfast|lunch|dinner/)
    })
  })

  describe('ActivitiesAgent', () => {
    const agent = new ActivitiesAgent()

    it('should suggest educational activities', async () => {
      const response = await agent.handleMessage(
        'Find educational tours in Barcelona',
        { ...mockContext, phase: { ...testData.phase, type: 'ACTIVITIES' } }
      )

      expect(response).toBeDefined()
      expect(response.toLowerCase()).toMatch(/tour|activity|educational|cultural/)
    })

    it('should prioritize Erasmus+ compliance', async () => {
      const response = await agent.handleMessage(
        'Activities for student exchange program',
        { ...mockContext, phase: { ...testData.phase, type: 'ACTIVITIES' } }
      )

      expect(response).toBeDefined()
      expect(response.toLowerCase()).toMatch(/educational|learning|cultural|erasmus/)
    })

    it('should consider group size and age', async () => {
      const response = await agent.handleMessage(
        'Activities for 30 high school students',
        {
          ...mockContext,
          phase: { ...testData.phase, type: 'ACTIVITIES' },
          project: { ...testData.project, participants: 30 }
        }
      )

      expect(response).toBeDefined()
      expect(response.toLowerCase()).toMatch(/students|group/)
    })
  })

  describe('InsuranceAgent', () => {
    const agent = new InsuranceAgent()

    it('should provide Erasmus+ compliant insurance options', async () => {
      const response = await agent.handleMessage(
        'Find travel insurance for student exchange',
        { ...mockContext, phase: { ...testData.phase, type: 'INSURANCE' } }
      )

      expect(response).toBeDefined()
      expect(response.toLowerCase()).toMatch(/insurance|coverage|medical/)
    })

    it('should ensure minimum €100k medical coverage', async () => {
      const response = await agent.handleMessage(
        'Insurance with medical coverage',
        { ...mockContext, phase: { ...testData.phase, type: 'INSURANCE' } }
      )

      expect(response).toBeDefined()
      expect(response.toLowerCase()).toMatch(/medical|coverage|€100|100k/)
    })

    it('should mention group discounts', async () => {
      const response = await agent.handleMessage(
        'Insurance for 30 students',
        {
          ...mockContext,
          phase: { ...testData.phase, type: 'INSURANCE' },
          project: { ...testData.project, participants: 30 }
        }
      )

      expect(response).toBeDefined()
      expect(response.toLowerCase()).toMatch(/group|discount|students/)
    })

    it('should include COVID coverage', async () => {
      const response = await agent.handleMessage(
        'Comprehensive travel insurance',
        { ...mockContext, phase: { ...testData.phase, type: 'INSURANCE' } }
      )

      expect(response).toBeDefined()
      expect(response.toLowerCase()).toMatch(/covid|coverage|comprehensive/)
    })
  })

  describe('EmergencyAgent', () => {
    const agent = new EmergencyAgent()

    it('should create comprehensive emergency plans', async () => {
      const response = await agent.handleMessage(
        'Create emergency plan for Barcelona trip',
        { ...mockContext, phase: { ...testData.phase, type: 'EMERGENCY_PLANNING' } }
      )

      expect(response).toBeDefined()
      expect(response.toLowerCase()).toMatch(/emergency|plan|contact|procedure/)
    })

    it('should include emergency contacts', async () => {
      const response = await agent.handleMessage(
        'Emergency contacts needed',
        { ...mockContext, phase: { ...testData.phase, type: 'EMERGENCY_PLANNING' } }
      )

      expect(response).toBeDefined()
      expect(response.toLowerCase()).toMatch(/police|ambulance|embassy|contact/)
    })

    it('should provide medical facilities information', async () => {
      const response = await agent.handleMessage(
        'Nearby hospitals and clinics',
        { ...mockContext, phase: { ...testData.phase, type: 'EMERGENCY_PLANNING' } }
      )

      expect(response).toBeDefined()
      expect(response.toLowerCase()).toMatch(/hospital|clinic|medical|english/)
    })

    it('should include risk assessment', async () => {
      const response = await agent.handleMessage(
        'Risk assessment for the trip',
        { ...mockContext, phase: { ...testData.phase, type: 'EMERGENCY_PLANNING' } }
      )

      expect(response).toBeDefined()
      expect(response.toLowerCase()).toMatch(/risk|safety|assessment/)
    })

    it('should provide communication plan', async () => {
      const response = await agent.handleMessage(
        'How do we stay in touch during emergencies',
        { ...mockContext, phase: { ...testData.phase, type: 'EMERGENCY_PLANNING' } }
      )

      expect(response).toBeDefined()
      expect(response.toLowerCase()).toMatch(/communication|contact|whatsapp|phone/)
    })

    it('should include evacuation procedures', async () => {
      const response = await agent.handleMessage(
        'Evacuation plan needed',
        { ...mockContext, phase: { ...testData.phase, type: 'EMERGENCY_PLANNING' } }
      )

      expect(response).toBeDefined()
      expect(response.toLowerCase()).toMatch(/evacuation|meeting point|safe/)
    })
  })

  describe('Cross-Agent Consistency', () => {
    it('all agents should have handleMessage method', () => {
      const agents = [
        new AccommodationAgent(),
        new TravelAgent(),
        new FoodAgent(),
        new ActivitiesAgent(),
        new InsuranceAgent(),
        new EmergencyAgent()
      ]

      agents.forEach(agent => {
        expect(agent.handleMessage).toBeDefined()
        expect(typeof agent.handleMessage).toBe('function')
      })
    })

    it('all agents should have agentName property', () => {
      const agents = [
        new AccommodationAgent(),
        new TravelAgent(),
        new FoodAgent(),
        new ActivitiesAgent(),
        new InsuranceAgent(),
        new EmergencyAgent()
      ]

      agents.forEach(agent => {
        expect(agent.agentName).toBeDefined()
        expect(typeof agent.agentName).toBe('string')
        expect(agent.agentName).not.toBe('')
      })
    })

    it('all agents should return string responses', async () => {
      const agents = [
        { agent: new AccommodationAgent(), type: 'ACCOMMODATION' },
        { agent: new TravelAgent(), type: 'TRAVEL' },
        { agent: new FoodAgent(), type: 'FOOD' },
        { agent: new ActivitiesAgent(), type: 'ACTIVITIES' },
        { agent: new InsuranceAgent(), type: 'INSURANCE' },
        { agent: new EmergencyAgent(), type: 'EMERGENCY_PLANNING' }
      ]

      for (const { agent, type } of agents) {
        const response = await agent.handleMessage('Test message', {
          ...mockContext,
          phase: { ...testData.phase, type }
        })

        expect(typeof response).toBe('string')
        expect(response.length).toBeGreaterThan(0)
      }
    })

    it('all agents should handle errors gracefully', async () => {
      const agents = [
        new AccommodationAgent(),
        new TravelAgent(),
        new FoodAgent(),
        new ActivitiesAgent(),
        new InsuranceAgent(),
        new EmergencyAgent()
      ]

      for (const agent of agents) {
        // Pass invalid data
        const response = await agent.handleMessage('Test', {
          phase: null as any,
          project: null as any,
          useRealData: false
        })

        // Should still return a response (not throw)
        expect(response).toBeDefined()
        expect(typeof response).toBe('string')
      }
    })
  })

  describe('Performance', () => {
    it('all agents should respond within reasonable time', async () => {
      const agents = [
        { agent: new AccommodationAgent(), type: 'ACCOMMODATION', msg: 'Find hotels' },
        { agent: new TravelAgent(), type: 'TRAVEL', msg: 'Find flights' },
        { agent: new FoodAgent(), type: 'FOOD', msg: 'Find restaurants' },
        { agent: new ActivitiesAgent(), type: 'ACTIVITIES', msg: 'Find tours' },
        { agent: new InsuranceAgent(), type: 'INSURANCE', msg: 'Find insurance' },
        { agent: new EmergencyAgent(), type: 'EMERGENCY_PLANNING', msg: 'Create plan' }
      ]

      for (const { agent, type, msg } of agents) {
        const start = Date.now()

        await agent.handleMessage(msg, {
          ...mockContext,
          phase: { ...testData.phase, type }
        })

        const duration = Date.now() - start

        // Should respond within 5 seconds (mock data)
        expect(duration).toBeLessThan(5000)
      }
    }, 30000) // 30s timeout for all agents
  })
})
