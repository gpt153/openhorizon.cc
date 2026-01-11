// Phase-specific AI agent chat component
import { useEffect, useState } from 'react'
import type { Phase, Project } from '../types'
import ChatWindow from './ChatWindow'
import { useChat } from '../hooks/useChat'
import { useSocket } from '../hooks/useSocket'

interface PhaseAgentChatProps {
  phase: Phase
  project: Project
}

// Map phase types to agent names
const agentNames: Record<string, string> = {
  ACCOMMODATION: 'Accommodation Agent',
  TRAVEL: 'Travel Agent',
  FOOD: 'Food & Meal Agent',
  ACTIVITIES: 'Activities Agent',
  EVENTS: 'Events Agent',
  INSURANCE: 'Insurance Agent',
  EMERGENCY_PLANNING: 'Emergency Planning Agent',
  PERMITS: 'Permits & Documentation Agent',
  APPLICATION: 'Application Agent',
  REPORTING: 'Reporting Agent',
  CUSTOM: 'Planning Assistant',
}

// Agent capability descriptions
const agentDescriptions: Record<string, string> = {
  ACCOMMODATION: 'Get hotel recommendations, budget optimization tips, and booking strategies',
  TRAVEL: 'Ask about transportation options, route planning, and group travel logistics',
  FOOD: 'Get meal planning suggestions, restaurant recommendations, and catering options',
  ACTIVITIES: 'Find activity ideas, venue suggestions, and scheduling tips',
  EVENTS: 'Get help with event planning, venue booking, and coordination',
  INSURANCE: 'Ask about insurance options, coverage requirements, and policy recommendations',
  EMERGENCY_PLANNING: 'Get emergency planning guidance, risk assessment, and contingency strategies',
  PERMITS: 'Learn about permit requirements, documentation processes, and compliance',
  APPLICATION: 'Get help with application processes, requirements, and deadlines',
  REPORTING: 'Ask about reporting requirements, templates, and best practices',
  CUSTOM: 'Ask questions about this phase',
}

// Starter prompts for each agent type
const starterPrompts: Record<string, string[]> = {
  ACCOMMODATION: [
    'Find hotels for our group',
    'What are budget-friendly options?',
    'Show me hotels with conference facilities',
  ],
  TRAVEL: [
    'What are the transport options?',
    'Plan route from airport to hotel',
    'Compare travel costs',
  ],
  FOOD: [
    'Suggest restaurants for group dining',
    'What are local food options?',
    'Plan meal budget',
  ],
  ACTIVITIES: [
    'Suggest activities for our group',
    'What are popular local activities?',
    'Help plan our activity schedule',
  ],
  EVENTS: [
    'Help plan our main event',
    'Suggest event venues',
    'What are event planning best practices?',
  ],
  INSURANCE: [
    'What insurance do we need?',
    'Compare insurance providers',
    'Explain coverage options',
  ],
  EMERGENCY_PLANNING: [
    'Create emergency contact list',
    'What are key risks to consider?',
    'Help create contingency plan',
  ],
  PERMITS: [
    'What permits do we need?',
    'Explain the permit process',
    'Help with documentation checklist',
  ],
  APPLICATION: [
    'What are the application requirements?',
    'Help with application timeline',
    'Review application checklist',
  ],
  REPORTING: [
    'What reports are required?',
    'Help create report outline',
    'Explain reporting deadlines',
  ],
}

export default function PhaseAgentChat({ phase, project }: PhaseAgentChatProps) {
  const { socket } = useSocket()
  const [connectionError, setConnectionError] = useState<string | null>(null)

  // Get agent name and description
  const agentName = agentNames[phase.type] || 'Planning Assistant'
  const agentDescription = agentDescriptions[phase.type] || 'Ask questions about this phase'
  const prompts = starterPrompts[phase.type] || []

  // Set up chat with phase context
  const { messages, isTyping, sendMessage } = useChat({
    socket,
    context: {
      projectId: project.id,
      phaseId: phase.id,
    },
  })

  // Handle socket connection events
  useEffect(() => {
    if (!socket) return

    const handleConnectError = (error: Error) => {
      setConnectionError('Failed to connect to AI assistant. Please refresh the page.')
      console.error('Socket connection error:', error)
    }

    const handleDisconnect = () => {
      setConnectionError('Connection lost. Attempting to reconnect...')
    }

    const handleConnect = () => {
      setConnectionError(null)
    }

    socket.on('connect_error', handleConnectError)
    socket.on('disconnect', handleDisconnect)
    socket.on('connect', handleConnect)

    return () => {
      socket.off('connect_error', handleConnectError)
      socket.off('disconnect', handleDisconnect)
      socket.off('connect', handleConnect)
    }
  }, [socket])

  // Show error if connection fails
  if (connectionError) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <p className="text-yellow-800">{connectionError}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Agent Info Header */}
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-blue-800">
            <strong>{agentName}</strong>
          </p>
          {/* Connection Status Indicator */}
          <div className="flex items-center gap-2">
            {socket?.connected ? (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                Connected
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-red-600">
                <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                Disconnected
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-blue-700">{agentDescription}</p>
      </div>

      {/* Starter Prompts - only show when no messages */}
      {messages.length === 0 && prompts.length > 0 && (
        <div className="mb-4 space-y-2">
          <p className="text-xs font-medium text-gray-700">Quick Start:</p>
          {prompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => sendMessage(prompt)}
              disabled={!socket?.connected}
              className="block w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Empty State with Agent Introduction */}
      {messages.length === 0 && (
        <div className="text-center py-8">
          <div className="mx-auto h-16 w-16 text-blue-600 mb-4">
            {/* Robot/AI icon */}
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">{agentName} Ready</h3>
          <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto">{agentDescription}</p>
        </div>
      )}

      {/* Chat Window */}
      <div className="flex-1 min-h-0">
        <ChatWindow
          messages={messages}
          isTyping={isTyping}
          onSendMessage={sendMessage}
          context={{
            projectId: project.id,
            phaseId: phase.id,
          }}
          disabled={!socket?.connected}
        />
      </div>
    </div>
  )
}
