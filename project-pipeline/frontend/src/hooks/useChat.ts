// React hook for AI chat message management
import { useState, useEffect, useCallback, useRef } from 'react'
import { Socket } from 'socket.io-client'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  projectId?: string
  phaseId?: string
}

export interface ChatContext {
  projectId?: string
  phaseId?: string
}

export interface UseChatOptions {
  socket: Socket | null
  context?: ChatContext
  onMessageReceived?: (message: ChatMessage) => void
}

export interface UseChatReturn {
  messages: ChatMessage[]
  isTyping: boolean
  sendMessage: (content: string) => void
  clearMessages: () => void
  setContext: (context: ChatContext) => void
}

/**
 * Hook for managing AI chat messages and interactions
 * Handles sending messages, receiving responses, and typing indicators
 */
export function useChat({ socket, context: initialContext, onMessageReceived }: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [context, setContextState] = useState<ChatContext | undefined>(initialContext)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuthStore()

  // Send message to AI
  const sendMessage = useCallback(
    (content: string) => {
      if (!socket || !socket.connected) {
        toast.error('Not connected to chat server')
        return
      }

      if (!content.trim()) {
        return
      }

      if (!user?.id) {
        toast.error('User not authenticated')
        return
      }

      // Validate required context - projectId is required, phaseId is optional
      if (!context?.projectId) {
        toast.error('Please select a project to chat about')
        return
      }

      // Create user message
      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: content.trim(),
        timestamp: new Date().toISOString(),
        projectId: context?.projectId,
        phaseId: context?.phaseId,
      }

      // Add to messages immediately
      setMessages((prev) => [...prev, userMessage])

      // Send to server with correct format expected by backend
      socket.emit('chat:message', {
        message: content.trim(), // Backend expects 'message', not 'content'
        projectId: context.projectId,
        phaseId: context.phaseId || null, // phaseId is optional
        userId: user.id, // Backend expects userId
      })

      // Show typing indicator
      setIsTyping(true)
    },
    [socket, context, user]
  )

  // Clear all messages
  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  // Update context
  const setContext = useCallback((newContext: ChatContext) => {
    setContextState(newContext)
  }, [])

  // Socket event listeners
  useEffect(() => {
    if (!socket) return

    // Handle incoming AI response
    const handleResponse = (data: { content: string; messageId?: string }) => {
      setIsTyping(false)

      const assistantMessage: ChatMessage = {
        id: data.messageId || `msg-${Date.now()}`,
        role: 'assistant',
        content: data.content,
        timestamp: new Date().toISOString(),
        projectId: context?.projectId,
        phaseId: context?.phaseId,
      }

      setMessages((prev) => [...prev, assistantMessage])

      if (onMessageReceived) {
        onMessageReceived(assistantMessage)
      }
    }

    // Handle streaming response chunks
    const handleResponseChunk = (data: { chunk: string; messageId: string; done: boolean }) => {
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1]

        // If last message is from assistant with same ID, append chunk
        if (lastMessage && lastMessage.role === 'assistant' && lastMessage.id === data.messageId) {
          return [
            ...prev.slice(0, -1),
            {
              ...lastMessage,
              content: lastMessage.content + data.chunk,
            },
          ]
        }

        // Otherwise create new assistant message
        return [
          ...prev,
          {
            id: data.messageId,
            role: 'assistant' as const,
            content: data.chunk,
            timestamp: new Date().toISOString(),
            projectId: context?.projectId,
            phaseId: context?.phaseId,
          },
        ]
      })

      if (data.done) {
        setIsTyping(false)
      }
    }

    // Handle typing indicator
    const handleTyping = () => {
      setIsTyping(true)
    }

    // Handle errors
    const handleError = (data: { error: string }) => {
      setIsTyping(false)
      toast.error(data.error || 'Chat error occurred')
    }

    // Register event listeners
    socket.on('chat:response', handleResponse)
    socket.on('chat:response:chunk', handleResponseChunk)
    socket.on('chat:typing', handleTyping)
    socket.on('chat:error', handleError)

    // Cleanup
    return () => {
      socket.off('chat:response', handleResponse)
      socket.off('chat:response:chunk', handleResponseChunk)
      socket.off('chat:typing', handleTyping)
      socket.off('chat:error', handleError)
    }
  }, [socket, context, onMessageReceived])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return {
    messages,
    isTyping,
    sendMessage,
    clearMessages,
    setContext,
  }
}
