// Seed elaboration chat component
import { useState, useRef, useEffect } from 'react'
import type {
  ElaborationMessage,
  SeedSuggestion,
  GeneratedSeed,
} from '../types/seeds'

interface SeedElaborationChatProps {
  messages: ElaborationMessage[]
  currentSeed: GeneratedSeed
  suggestions: SeedSuggestion[]
  onSendMessage: (message: string) => void
  isLoading?: boolean
}

export default function SeedElaborationChat({
  messages,
  currentSeed,
  suggestions,
  onSendMessage,
  isLoading = false,
}: SeedElaborationChatProps) {
  const [inputMessage, setInputMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputMessage.trim() && !isLoading) {
      onSendMessage(inputMessage.trim())
      setInputMessage('')
    }
  }

  const handleSuggestionClick = (suggestion: SeedSuggestion) => {
    onSendMessage(suggestion.text)
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'title':
        return 'bg-purple-100 text-purple-700'
      case 'description':
        return 'bg-blue-100 text-blue-700'
      case 'theme':
        return 'bg-green-100 text-green-700'
      case 'scope':
        return 'bg-yellow-100 text-yellow-700'
      case 'feasibility':
        return 'bg-orange-100 text-orange-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      {/* Current Seed Summary */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Current Seed
        </h4>
        <p className="text-lg font-semibold text-gray-900 line-clamp-1">
          {currentSeed.title}
        </p>
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
          {currentSeed.description}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-8">
            Start a conversation to elaborate on your seed idea!
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              {message.appliedChanges && (
                <div className="mt-2 pt-2 border-t border-white/20 text-xs opacity-75">
                  Changes applied to seed
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="animate-pulse flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animation-delay-200"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animation-delay-400"></div>
                </div>
                <span className="text-sm text-gray-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && !isLoading && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <h5 className="text-xs font-medium text-gray-700 mb-2">
            Suggestions:
          </h5>
          <div className="space-y-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left p-3 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded ${getCategoryColor(
                      suggestion.category
                    )}`}
                  >
                    {suggestion.category}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{suggestion.text}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {suggestion.rationale}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask a question or request changes..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
            maxLength={2000}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="px-6 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}
