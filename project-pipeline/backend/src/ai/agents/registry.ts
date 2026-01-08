import { BaseAgent } from './base-agent.js'
import { AccommodationAgent } from './accommodation-agent.js'

export function getAgentForPhaseType(phaseType: string): BaseAgent {
  switch (phaseType) {
    case 'ACCOMMODATION':
      return new AccommodationAgent()
    case 'TRAVEL':
    case 'FOOD':
    case 'ACTIVITIES':
    case 'EVENTS':
    case 'INSURANCE':
    case 'EMERGENCY_PLANNING':
    default:
      // Return base agent for now, will implement specialized agents in Phase 6
      return new BaseAgent()
  }
}
