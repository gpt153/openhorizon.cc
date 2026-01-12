import { BaseAgent } from './base-agent'
import { AccommodationAgent } from './accommodation-agent'
import { ActivitiesAgent } from './activities-agent'
import { EmergencyAgent } from './emergency-agent'
import { TravelAgent } from './travel-agent'

export function getAgentForPhaseType(phaseType: string): BaseAgent {
  switch (phaseType) {
    case 'ACCOMMODATION':
      return new AccommodationAgent()
    case 'ACTIVITIES':
      return new ActivitiesAgent()
    case 'EMERGENCY':
      return new EmergencyAgent()
    case 'TRAVEL':
      return new TravelAgent()
    case 'FOOD':
    case 'INSURANCE':
    case 'CUSTOM':
    default:
      // Return base agent with generic responses for other phase types
      return new BaseAgent()
  }
}
