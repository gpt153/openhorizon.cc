// Socket.io client configuration
import { io, Socket } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000'

let socket: Socket | null = null

export interface SocketConfig {
  autoConnect?: boolean
  reconnection?: boolean
  reconnectionAttempts?: number
  reconnectionDelay?: number
}

/**
 * Initialize Socket.io connection
 * @param token JWT token for authentication
 * @param config Socket configuration options
 * @returns Socket instance
 */
export function initializeSocket(token: string, config: SocketConfig = {}): Socket {
  // If socket already exists and is connected, return it
  if (socket && socket.connected) {
    return socket
  }

  // Disconnect existing socket if any
  if (socket) {
    socket.disconnect()
  }

  // Create new socket instance with auth
  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
    autoConnect: config.autoConnect !== false,
    reconnection: config.reconnection !== false,
    reconnectionAttempts: config.reconnectionAttempts || 5,
    reconnectionDelay: config.reconnectionDelay || 1000,
    transports: ['websocket', 'polling'],
  })

  return socket
}

/**
 * Get existing socket instance
 * @returns Socket instance or null
 */
export function getSocket(): Socket | null {
  return socket
}

/**
 * Disconnect and cleanup socket
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

/**
 * Check if socket is connected
 */
export function isSocketConnected(): boolean {
  return socket?.connected || false
}
