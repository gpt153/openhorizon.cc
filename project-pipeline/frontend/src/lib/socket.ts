import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io('http://localhost:4000', {
      autoConnect: false,
    })
  }
  return socket
}

export const connectSocket = (userId: string) => {
  const sock = getSocket()
  if (!sock.connected) {
    sock.connect()
    sock.emit('user:connected', { userId })
  }
  return sock
}

export const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect()
  }
}
