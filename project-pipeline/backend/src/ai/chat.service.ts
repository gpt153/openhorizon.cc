import { Server as SocketServer, Socket } from 'socket.io'
import { prisma } from '../config/database.js'
import { getAgentForPhaseType } from './agents/registry.js'
import { AccommodationAgent } from './agents/accommodation-agent.js'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export class ChatService {
  private io: SocketServer

  constructor(io: SocketServer) {
    this.io = io
    this.registerHandlers()
  }

  private registerHandlers() {
    this.io.on('connection', (socket: Socket) => {
      console.log('Client connected:', socket.id)

      // Join room for specific phase
      socket.on('join:phase', async (data: { phaseId: string; userId: string }) => {
        socket.join(`phase:${data.phaseId}`)
        console.log(`User ${data.userId} joined phase ${data.phaseId}`)
      })

      // Handle chat messages
      socket.on('chat:message', async (data) => {
        try {
          await this.handleChatMessage(socket, data)
        } catch (error: any) {
          socket.emit('chat:error', {
            error: error.message || 'Failed to process message'
          })
        }
      })

      // Handle research request
      socket.on('chat:research', async (data) => {
        try {
          await this.handleResearchRequest(socket, data)
        } catch (error: any) {
          socket.emit('chat:error', {
            error: error.message || 'Failed to research'
          })
        }
      })

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id)
      })
    })
  }

  private async handleChatMessage(socket: Socket, data: {
    phaseId: string
    projectId: string
    userId: string
    message: string
    conversationId?: string
  }) {
    const { phaseId, projectId, userId, message, conversationId } = data

    // Load or create conversation
    let conversation
    if (conversationId) {
      conversation = await prisma.aIConversation.findUnique({
        where: { id: conversationId }
      })
    }

    const messages: ChatMessage[] = conversation?.messages as ChatMessage[] || []
    messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    })

    // Get phase and project context
    const phase = await prisma.phase.findUnique({
      where: { id: phaseId },
      include: { project: true }
    })

    if (!phase) {
      throw new Error('Phase not found')
    }

    // Get appropriate agent
    const agent = getAgentForPhaseType(phase.type)

    // Generate response
    const aiMessages = messages.map(m => ({
      role: m.role,
      content: m.content
    }))

    const responseContent = await agent.chat(aiMessages)

    messages.push({
      role: 'assistant',
      content: responseContent,
      timestamp: new Date()
    })

    // Save conversation
    if (conversationId) {
      await prisma.aIConversation.update({
        where: { id: conversationId },
        data: {
          messages: messages as any,
          updated_at: new Date()
        }
      })
    } else {
      conversation = await prisma.aIConversation.create({
        data: {
          project_id: projectId,
          phase_id: phaseId,
          user_id: userId,
          messages: messages as any,
          context: {
            project: phase.project,
            phase: {
              id: phase.id,
              name: phase.name,
              type: phase.type
            }
          }
        }
      })
    }

    // Send response to client
    socket.emit('chat:response', {
      conversationId: conversation.id,
      message: responseContent,
      timestamp: new Date()
    })

    // Broadcast to room
    socket.to(`phase:${phaseId}`).emit('chat:update', {
      conversationId: conversation.id,
      lastMessage: responseContent
    })
  }

  private async handleResearchRequest(socket: Socket, data: {
    phaseId: string
    userId: string
  }) {
    const { phaseId } = data

    // Get phase and project
    const phase = await prisma.phase.findUnique({
      where: { id: phaseId },
      include: { project: true }
    })

    if (!phase) {
      throw new Error('Phase not found')
    }

    // Only accommodation agent has research capability for now
    if (phase.type !== 'ACCOMMODATION') {
      socket.emit('chat:research:result', {
        suggestions: [],
        message: 'Research capability coming soon for this phase type'
      })
      return
    }

    const agent = new AccommodationAgent()
    const suggestions = await agent.research({
      project: phase.project,
      phase
    })

    // Store suggestions
    await agent.storeSuggestions(phaseId, suggestions)

    // Send results
    socket.emit('chat:research:result', {
      suggestions,
      timestamp: new Date()
    })
  }
}
