// Main orchestrator for conversational seed elaboration
import { useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useElaborationStore } from '../../store/elaborationStore'
import {
  elaborateSeed,
  generateMessageId,
  generateQuickReplies,
} from '../../services/seeds.api'
import SeedElaborationChat from '../SeedElaborationChat'
import ProgressIndicator from './ProgressIndicator'
import MetadataPreview from './MetadataPreview'
import type {
  GeneratedSeed,
  SeedSuggestion,
  ElaborationMessageExtended,
} from '../../types/seeds'

interface ConversationalElaborationProps {
  seedId: string
  initialSeed: GeneratedSeed
  onComplete?: () => void
}

export default function ConversationalElaboration({
  seedId,
  initialSeed,
  onComplete,
}: ConversationalElaborationProps) {
  const queryClient = useQueryClient()
  const store = useElaborationStore()

  // Initialize session on mount
  useEffect(() => {
    store.startSession(seedId, initialSeed)

    // Cleanup is optional - we keep state for back navigation
    return () => {
      // store.reset()
    }
  }, [seedId])

  // Elaborate mutation
  const elaborateMutation = useMutation({
    mutationFn: (userMessage: string) =>
      elaborateSeed(seedId, { userMessage }),
    onMutate: () => {
      store.setLoading(true)
    },
    onSuccess: (response) => {
      // Add AI message
      const aiMessage: ElaborationMessageExtended = {
        id: generateMessageId(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toISOString(),
        appliedChanges: response.updatedSeed,
      }

      store.addMessage(aiMessage)

      // Update metadata
      store.updateMetadata(response.updatedSeed)

      // Generate quick replies based on AI question
      const quickReplies = generateQuickReplies(response.message)
      store.setQuickReplies(quickReplies)

      // Invalidate seed query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['seed', seedId] })

      store.setLoading(false)
    },
    onError: () => {
      toast.error('Failed to elaborate seed')
      store.setLoading(false)
    },
  })

  const handleSendMessage = (message: string) => {
    // Add user message to store
    const userMessage: ElaborationMessageExtended = {
      id: generateMessageId(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    }

    store.addMessage(userMessage)

    // Clear quick replies
    store.setQuickReplies([])

    // Call API
    elaborateMutation.mutate(message)
  }

  const handleEditMessage = (messageId: string, newContent: string) => {
    // Update store
    store.editMessage(messageId, newContent)

    // Re-submit from this point
    elaborateMutation.mutate(newContent)
  }

  // Convert ExtendedMessages to regular messages for compatibility
  const messages = store.messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp,
    appliedChanges: msg.appliedChanges,
  }))

  // Convert suggestions (empty for now - backend provides these)
  const suggestions: SeedSuggestion[] = []

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Chat side (2/3 on desktop) */}
      <div className="md:col-span-2">
        <ProgressIndicator completeness={store.completeness} />

        <SeedElaborationChat
          messages={messages}
          currentSeed={initialSeed}
          suggestions={suggestions}
          onSendMessage={handleSendMessage}
          isLoading={store.isLoading}
        />
      </div>

      {/* Metadata side (1/3 on desktop) */}
      <div className="md:col-span-1">
        <MetadataPreview
          metadata={store.metadata}
          completeness={store.completeness}
          onConvert={onComplete}
          isConvertEnabled={store.completeness >= 80}
        />
      </div>
    </div>
  )
}
