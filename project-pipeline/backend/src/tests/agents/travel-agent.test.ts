/**
 * Travel Agent Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { TravelAgent } from '../../ai/agents/travel-agent'
import { testData } from '../setup'

describe('TravelAgent', () => {
  let agent: TravelAgent

  beforeEach(() => {
    agent = new TravelAgent()
  })

  it('should create an instance', () => {
    expect(agent).toBeInstanceOf(TravelAgent)
    expect(agent.agentName).toBe('TravelAgent')
  })

  it('should provide travel options', async () => {
    const response = await agent.handleMessage(
      'Find flights from Amsterdam to Barcelona for 30 people',
      {
        phase: { ...testData.phase, type: 'TRAVEL' },
        project: testData.project,
        useRealData: false
      }
    )

    expect(response).toBeDefined()
    expect(response.toLowerCase()).toMatch(/flight|train|bus|travel/)
  })

  it('should consider group size', async () => {
    const response = await agent.handleMessage(
      'Transport for 50 students',
      {
        phase: { ...testData.phase, type: 'TRAVEL' },
        project: { ...testData.project, participants: 50 },
        useRealData: false
      }
    )

    expect(response).toBeDefined()
    expect(response.toLowerCase()).toMatch(/group|students|people/)
  })

  it('should handle budget constraints', async () => {
    const response = await agent.handleMessage(
      'Budget-friendly travel options',
      {
        phase: { ...testData.phase, type: 'TRAVEL', budget: 5000 },
        project: testData.project,
        useRealData: false
      }
    )

    expect(response).toBeDefined()
    expect(response.toLowerCase()).toMatch(/budget|affordable|economy/)
  })

  it('should suggest multiple transport types', async () => {
    const response = await agent.handleMessage(
      'All transport options',
      {
        phase: { ...testData.phase, type: 'TRAVEL' },
        project: testData.project,
        useRealData: false
      }
    )

    expect(response).toBeDefined()
    // Should mention at least 2 types
    const lowerResponse = response.toLowerCase()
    const types = ['flight', 'train', 'bus', 'ferry'].filter(type =>
      lowerResponse.includes(type)
    )
    expect(types.length).toBeGreaterThanOrEqual(2)
  })
})
