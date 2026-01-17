// React hook for Socket.io connection management
import { useEffect, useState, useCallback } from 'react'
import { Socket } from 'socket.io-client'
import { initializeSocket, disconnectSocket, getSocket } from '../lib/socket'
import { useAuthStore } from '../store/authStore'

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface UseSocketReturn {
  socket: Socket | null
  status: ConnectionStatus
  error: string | null
  connect: () => void
  disconnect: () => void
}

/**
 * Hook for managing Socket.io connection
 * Automatically connects when user is authenticated
 * Disconnects when component unmounts or user logs out
 */
export function useSocket(): UseSocketReturn {
  const { token, isAuthenticated } = useAuthStore()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [error, setError] = useState<string | null>(null)

  const connect = useCallback(() => {
    if (!token || !isAuthenticated) {
      setError('Not authenticated')
      return
    }

    setStatus('connecting')
    setError(null)

    try {
      const newSocket = initializeSocket(token)

      // Connection event handlers
      newSocket.on('connect', () => {
        setStatus('connected')
        setError(null)
      })

      newSocket.on('disconnect', (reason) => {
        setStatus('disconnected')
        if (reason === 'io server disconnect') {
          // Server disconnected, reconnect manually
          newSocket.connect()
        }
      })

      newSocket.on('connect_error', (err) => {
        setStatus('error')
        const errorMessage = err.message || 'Failed to connect to server'
        setError(`WebSocket connection failed: ${errorMessage}. Please check your network connection.`)
        console.error('[useSocket] Connection error:', err)
      })

      newSocket.on('error', (err) => {
        setError(err.message || 'Socket error')
      })

      setSocket(newSocket)
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Failed to initialize socket')
    }
  }, [token, isAuthenticated])

  const disconnect = useCallback(() => {
    disconnectSocket()
    setSocket(null)
    setStatus('disconnected')
    setError(null)
  }, [])

  // Auto-connect when authenticated
  useEffect(() => {
    if (isAuthenticated && token && !socket) {
      connect()
    }

    // Cleanup on unmount or when auth changes
    return () => {
      if (socket) {
        disconnect()
      }
    }
  }, [isAuthenticated, token]) // eslint-disable-line react-hooks/exhaustive-deps

  // Return existing socket if available
  useEffect(() => {
    const existingSocket = getSocket()
    if (existingSocket && existingSocket.connected) {
      setSocket(existingSocket)
      setStatus('connected')
    }
  }, [])

  return {
    socket,
    status,
    error,
    connect,
    disconnect,
  }
}
