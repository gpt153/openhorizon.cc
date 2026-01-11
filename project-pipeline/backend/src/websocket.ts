import { Server as HTTPServer } from 'http'
import { Server as SocketServer, Socket } from 'socket.io'
import { ChatService } from './ai/chat.service.js'
import jwt from 'jsonwebtoken'

// Extend Socket type to include user data
interface AuthenticatedSocket extends Socket {
  userId?: string
  role?: string
}

export function setupWebSocket(httpServer: HTTPServer) {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  })

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token

      if (!token) {
        console.warn('WebSocket connection attempt without token')
        return next(new Error('Authentication required'))
      }

      // Verify JWT token
      const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
      const decoded = jwt.verify(token, jwtSecret) as { userId: string; role: string }

      // Attach user info to socket
      socket.userId = decoded.userId
      socket.role = decoded.role

      console.log(`✅ WebSocket authenticated: User ${decoded.userId}`)
      next()
    } catch (error) {
      console.error('WebSocket authentication failed:', error)
      next(new Error('Authentication failed'))
    }
  })

  // Initialize chat service
  const chatService = new ChatService(io)

  console.log('✅ WebSocket server initialized with authentication')

  return io
}
