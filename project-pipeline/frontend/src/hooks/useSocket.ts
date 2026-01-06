import { useEffect, useState } from 'react'
import { getSocket } from '../lib/socket'

export const useSocket = (event: string, handler: (data: unknown) => void) => {
  const [isConnected, setIsConnected] = useState(() => getSocket().connected)

  useEffect(() => {
    const socket = getSocket()

    // Connect socket if not already connected
    if (!socket.connected) {
      socket.connect()
    }

    const onConnect = () => setIsConnected(true)
    const onDisconnect = () => setIsConnected(false)

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on(event, handler)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off(event, handler)
    }
  }, [event, handler])

  return { isConnected, emit: (data: unknown) => getSocket().emit(event, data) }
}
