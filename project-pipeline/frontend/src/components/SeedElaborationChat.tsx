// Seed elaboration chat component
import { useState, useRef, useEffect } from 'react'
import { detectUncertainty } from '../services/seeds.api'
import type {
  ElaborationMessage,
  ElaborationMessageExtended,
  SeedSuggestion,
  GeneratedSeed,
  QuickReply,
} from '../types/seeds'

interface SeedElaborationChatProps {
  messages: ElaborationMessage[]
  currentSeed: GeneratedSeed
  suggestions: SeedSuggestion[]
  onSendMessage: (message: string) => void
  isLoading?: boolean
  quickReplies?: QuickReply[]
  onEditMessage?: (messageId: string, newContent: string) => void
}

export default function SeedElaborationChat({
  messages,
  currentSeed,
  suggestions,
  onSendMessage,
  isLoading = false,
  quickReplies = [],
  onEditMessage,
}: SeedElaborationChatProps) {
  const [inputMessage, setInputMessage] = useState('')
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [showUncertaintyHelp, setShowUncertaintyHelp] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputMessage.trim() && !isLoading) {
      const message = inputMessage.trim()

      // Check for uncertainty
      if (detectUncertainty(message)) {
        setShowUncertaintyHelp(true)
      } else {
        setShowUncertaintyHelp(false)
      }

      // If editing, use edit handler
      if (editingMessageId && onEditMessage) {
        onEditMessage(editingMessageId, message)
        setEditingMessageId(null)
      } else {
        onSendMessage(message)
      }

      setInputMessage('')
    }
  }

  const handleSuggestionClick = (suggestion: SeedSuggestion) => {
    onSendMessage(suggestion.text)
    setShowUncertaintyHelp(false)
  }

  const handleQuickReplyClick = (quickReply: QuickReply) => {
    if (quickReply.value) {
      // Pre-defined value - auto-submit
      onSendMessage(quickReply.value)
      setShowUncertaintyHelp(false)
    } else {
      // Custom value - populate input field
      setInputMessage('')
    }
  }

  const handleEditClick = (message: ElaborationMessage, messageId: string) => {
    setInputMessage(message.content)
    setEditingMessageId(messageId)
    setShowUncertaintyHelp(false)
  }

  const handleCancelEdit = () => {
    setInputMessage('')
    setEditingMessageId(null)
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

        {messages.map((message, index) => {
          const msgExt = message as ElaborationMessageExtended
          const messageId = msgExt.id || `msg-${index}`

          return (
            <div
              key={messageId}
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
                <div className="flex items-start gap-2">
                  <p className="text-sm whitespace-pre-wrap flex-1">
                    {message.content}
                    {msgExt.isEdited && (
                      <span className="text-xs opacity-75 ml-2">(edited)</span>
                    )}
                  </p>
                  {message.role === 'user' && onEditMessage && (
                    <button
                      onClick={() => handleEditClick(message, messageId)}
                      className="text-white/70 hover:text-white transition-colors"
                      title="Edit message"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                {message.appliedChanges && (
                  <div className="mt-2 pt-2 border-t border-white/20 text-xs opacity-75">
                    Changes applied to seed
                  </div>
                )}
              </div>
            </div>
          )
        })}

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

      {/* Quick Replies */}
      {quickReplies.length > 0 && !isLoading && (
        <div className="p-4 border-t border-gray-200 bg-blue-50">
          <h5 className="text-xs font-medium text-gray-700 mb-2">
            Quick Replies:
          </h5>
          <div className="flex flex-wrap gap-2">
            {quickReplies.map((reply) => (
              <button
                key={reply.id}
                onClick={() => handleQuickReplyClick(reply)}
                className="px-4 py-2 bg-white hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition-colors font-medium text-sm"
              >
                {reply.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Uncertainty Help */}
      {showUncertaintyHelp && !isLoading && (
        <div className="p-4 border-t border-gray-200 bg-yellow-50">
          <div className="flex items-start gap-2">
            <svg
              className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">
                It's okay not to know!
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                We can estimate or skip this for now. Just let me know if you'd like to
                move on to the next question.
              </p>
              <button
                onClick={() => {
                  onSendMessage("I'd like to skip this question for now")
                  setShowUncertaintyHelp(false)
                }}
                className="mt-2 text-xs text-yellow-800 hover:text-yellow-900 underline"
              >
                Skip this question
              </button>
            </div>
          </div>
        </div>
      )}

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
        {editingMessageId && (
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-gray-600">Editing message...</span>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={
              editingMessageId
                ? 'Edit your message...'
                : 'Ask a question or request changes...'
            }
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
            maxLength={2000}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="px-6 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            {editingMessageId ? 'Update' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  )
}
