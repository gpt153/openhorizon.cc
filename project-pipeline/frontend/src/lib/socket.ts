// Socket.io client configuration
import { io, Socket } from 'socket.io-client'

// In production, use the same origin (Nginx proxies to backend)
// In development, connect directly to backend at localhost:4000
const getSocketUrl = (): string => {
  // If explicitly set via environment variable, use that
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL
  }

  // In production (built app), use same origin (Nginx proxy handles routing)
  if (import.meta.env.PROD) {
    return window.location.origin
  }

  // In development, connect to local backend
  return 'http://localhost:4000'
}

const SOCKET_URL = getSocketUrl()

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

  console.log(`[Socket.IO] Connecting to: ${SOCKET_URL}`)

  // Create new socket instance with auth
  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
    autoConnect: config.autoConnect !== false,
    reconnection: config.reconnection !== false,
    reconnectionAttempts: config.reconnectionAttempts || 5,
    reconnectionDelay: config.reconnectionDelay || 1000,
    reconnectionDelayMax: config.reconnectionDelay ? config.reconnectionDelay * 5 : 5000,
    timeout: 20000, // 20 second connection timeout
    transports: ['websocket', 'polling'], // Try websocket first, fall back to polling
  })

  // Add debug logging for connection events
  socket.on('connect', () => {
    console.log('[Socket.IO] Connected successfully')
  })

  socket.on('connect_error', (error) => {
    console.error('[Socket.IO] Connection error:', error.message)
  })

  socket.on('disconnect', (reason) => {
    console.log('[Socket.IO] Disconnected:', reason)
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
