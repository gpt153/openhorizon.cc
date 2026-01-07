// Individual chat message component
import { format } from 'date-fns'
import type { ChatMessage as ChatMessageType } from '../hooks/useChat'

interface ChatMessageProps {
  message: ChatMessageType
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[70%] ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Message bubble */}
        <div
          className={`rounded-lg px-4 py-2 ${
            isUser
              ? 'bg-blue-600 text-white'
              : isSystem
              ? 'bg-gray-100 text-gray-700 border border-gray-300'
              : 'bg-gray-200 text-gray-900'
          }`}
        >
          {/* Role label for system messages */}
          {isSystem && (
            <div className="text-xs font-semibold text-gray-600 mb-1">System</div>
          )}

          {/* Message content */}
          <div className="text-sm whitespace-pre-wrap break-words">{message.content}</div>

          {/* Timestamp */}
          <div
            className={`text-xs mt-1 ${
              isUser ? 'text-blue-100' : isSystem ? 'text-gray-500' : 'text-gray-600'
            }`}
          >
            {format(new Date(message.timestamp), 'HH:mm')}
          </div>
        </div>

        {/* Avatar/Icon */}
        {!isUser && !isSystem && (
          <div className="flex items-center gap-2 mt-1">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <span className="text-xs text-gray-600">AI Assistant</span>
          </div>
        )}
      </div>
    </div>
  )
}
