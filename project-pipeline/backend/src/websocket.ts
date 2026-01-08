import { Server as HTTPServer } from 'http'
import { Server as SocketServer } from 'socket.io'
import { ChatService } from './ai/chat.service.js'

export function setupWebSocket(httpServer: HTTPServer) {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  })

  // Initialize chat service
  const chatService = new ChatService(io)

  console.log('✅ WebSocket server initialized')

  return io
}
