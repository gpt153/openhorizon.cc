import { useState, useEffect, useRef } from 'react'
import { useSocket } from '../hooks/useSocket'
import { useAuthStore } from '../store/authStore'
import { getSocket } from '../lib/socket'

interface Message {
  id: string
  sender: 'user' | 'ai'
  content: string
  timestamp: Date
}

interface ChatBoxProps {
  phaseId: string
  projectId: string
}

export const ChatBox = ({ phaseId, projectId }: ChatBoxProps) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const user = useAuthStore((state) => state.user)

  const { isConnected, emit } = useSocket('chat:response', (data: unknown) => {
    const messageData = data as { message: string }
    setMessages((prev) => [...prev, {
      id: Date.now().toString(),
      sender: 'ai',
      content: messageData.message,
      timestamp: new Date(),
    }])
    setIsSending(false)
  })

  useEffect(() => {
    // Join phase room
    if (isConnected && user) {
      const socket = getSocket()
      socket.emit('join:phase', { phaseId, userId: user.id })
    }
  }, [isConnected, phaseId, user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim() || isSending) return

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsSending(true)

    const socket = getSocket()
    socket.emit('chat:message', {
      phaseId,
      projectId,
      userId: user?.id,
      message: input,
    })

    setInput('')
  }

  return (
    <div className="bg-white rounded-lg shadow h-[600px] flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">AI Assistant</h2>
        <div className="text-sm text-gray-600">
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-md px-4 py-2 rounded-lg ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="text-sm">{msg.content}</div>
              <div className="text-xs mt-1 opacity-70">
                {msg.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        {isSending && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-2 rounded-lg text-gray-600">
              AI is typing...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSending || !isConnected}
          />
          <button
            onClick={handleSend}
            disabled={isSending || !input.trim() || !isConnected}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
