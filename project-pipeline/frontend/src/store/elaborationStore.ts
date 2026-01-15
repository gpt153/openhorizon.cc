// Zustand elaboration store for conversational seed elaboration
import { create } from 'zustand'
import type {
  ElaborationMessageExtended,
  SeedMetadata,
  QuickReply,
  GeneratedSeed,
} from '../types/seeds'

interface ElaborationState {
  // Session management
  sessionId: string | null
  seedId: string | null

  // Conversation
  messages: ElaborationMessageExtended[]

  // Metadata tracking
  metadata: SeedMetadata | null
  completeness: number

  // UI state
  isLoading: boolean
  currentQuestion: string | null
  quickReplies: QuickReply[]

  // Actions
  startSession: (seedId: string, initialSeed: GeneratedSeed) => void
  addMessage: (message: ElaborationMessageExtended) => void
  editMessage: (messageId: string, newContent: string) => void
  updateMetadata: (seed: GeneratedSeed) => void
  setQuickReplies: (replies: QuickReply[]) => void
  setLoading: (loading: boolean) => void
  setCompleteness: (completeness: number) => void
  reset: () => void
}

const initialState = {
  sessionId: null,
  seedId: null,
  messages: [],
  metadata: null,
  completeness: 0,
  isLoading: false,
  currentQuestion: null,
  quickReplies: [],
}

export const useElaborationStore = create<ElaborationState>()((set, get) => ({
  ...initialState,

  startSession: (seedId: string, initialSeed: GeneratedSeed) => {
    const sessionId = `session-${Date.now()}`

    // Convert GeneratedSeed to SeedMetadata
    const metadata: SeedMetadata = {
      title: initialSeed.title,
      description: initialSeed.description,
      theme: undefined,
      estimatedDuration: initialSeed.estimatedDuration,
      estimatedParticipants: initialSeed.estimatedParticipants,
      targetAgeGroup: undefined,
      geographicScope: undefined,
      projectType: undefined,
      budgetRange: undefined,
      requiredResources: undefined,
      completedFields: [],
      totalFields: [],
      completenessPercentage: 0,
    }

    set({
      sessionId,
      seedId,
      metadata,
      messages: [],
      completeness: calculateCompleteness(metadata),
      isLoading: false,
      quickReplies: [],
      currentQuestion: null,
    })
  },

  addMessage: (message: ElaborationMessageExtended) => {
    set((state) => ({
      messages: [...state.messages, message],
      currentQuestion:
        message.role === 'assistant' ? message.content : state.currentQuestion,
    }))
  },

  editMessage: (messageId: string, newContent: string) => {
    set((state) => {
      const messageIndex = state.messages.findIndex((m) => m.id === messageId)

      if (messageIndex === -1) {
        return state
      }

      // Mark message as edited
      const editedMessage = {
        ...state.messages[messageIndex],
        content: newContent,
        isEdited: true,
        originalContent: state.messages[messageIndex].content,
      }

      // Truncate conversation after edited message
      const truncatedMessages = [
        ...state.messages.slice(0, messageIndex),
        editedMessage,
      ]

      return {
        messages: truncatedMessages,
      }
    })
  },

  updateMetadata: (seed: GeneratedSeed) => {
    const metadata: SeedMetadata = {
      title: seed.title,
      description: seed.description,
      theme: undefined, // Will be populated by backend
      estimatedDuration: seed.estimatedDuration,
      estimatedParticipants: seed.estimatedParticipants,
      targetAgeGroup: undefined,
      geographicScope: undefined,
      projectType: undefined,
      budgetRange: undefined,
      requiredResources: undefined,
      completedFields: [],
      totalFields: [],
      completenessPercentage: 0,
    }

    const completeness = calculateCompleteness(metadata)

    set({
      metadata,
      completeness,
    })
  },

  setQuickReplies: (replies: QuickReply[]) => {
    set({ quickReplies: replies })
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading })
  },

  setCompleteness: (completeness: number) => {
    set({ completeness })
  },

  reset: () => {
    set(initialState)
  },
}))

// Helper function to calculate completeness percentage
function calculateCompleteness(metadata: SeedMetadata | null): number {
  if (!metadata) return 0

  // Required fields (60% weight)
  const requiredFields = [
    'title',
    'description',
    'theme',
    'estimatedDuration',
    'estimatedParticipants',
  ] as const

  // Optional fields (40% weight)
  const optionalFields = [
    'targetAgeGroup',
    'geographicScope',
    'projectType',
    'budgetRange',
  ] as const

  // Count completed required fields
  const completedRequired = requiredFields.filter((field) => {
    const value = metadata[field]
    return value !== null && value !== undefined && value !== ''
  }).length

  // Count completed optional fields
  const completedOptional = optionalFields.filter((field) => {
    const value = metadata[field]
    return value !== null && value !== undefined && value !== ''
  }).length

  // Calculate weighted score
  const requiredScore = (completedRequired / requiredFields.length) * 60
  const optionalScore = (completedOptional / optionalFields.length) * 40

  return Math.round(requiredScore + optionalScore)
}
