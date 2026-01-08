// AI Chat page with project/phase selection
import { useState, useEffect } from 'react'
import { useSocket } from '../hooks/useSocket'
import { useChat, type ChatContext } from '../hooks/useChat'
import { useProjects } from '../hooks/useProjects'
import ChatWindow from '../components/ChatWindow'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Chat() {
  const { socket, status, error: socketError } = useSocket()
  const { data: projects, isLoading: projectsLoading } = useProjects()

  const [selectedProject, setSelectedProject] = useState<string | undefined>()
  const [context, setContext] = useState<ChatContext | undefined>()

  const { messages, isTyping, sendMessage, clearMessages, setContext: updateChatContext } = useChat({
    socket,
    context,
  })

  // Update chat context when project selection changes
  useEffect(() => {
    if (selectedProject) {
      const newContext: ChatContext = { projectId: selectedProject }
      setContext(newContext)
      updateChatContext(newContext)
    } else {
      setContext(undefined)
      updateChatContext({})
    }
  }, [selectedProject, updateChatContext])

  // Connection status indicator
  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-500'
      case 'connecting':
        return 'bg-yellow-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-gray-400'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Connected'
      case 'connecting':
        return 'Connecting...'
      case 'error':
        return `Error: ${socketError || 'Connection failed'}`
      default:
        return 'Disconnected'
    }
  }

  if (projectsLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header with connection status and project selector */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
              <p className="text-sm text-gray-600 mt-1">
                Get help with your projects, budgets, and planning
              </p>
            </div>

            {/* Connection Status */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2" data-testid="connection-status">
                <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
                <span className="text-sm text-gray-700">{getStatusText()}</span>
              </div>
            </div>
          </div>

          {/* Project Selector and Controls */}
          <div className="mt-4 flex items-center gap-4">
            {/* Project Selector */}
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <label htmlFor="project-select" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Project Context:
              </label>
              <select
                id="project-select"
                value={selectedProject || ''}
                onChange={(e) => setSelectedProject(e.target.value || undefined)}
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              >
                <option value="">General Chat (no project)</option>
                {projects?.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Chat Button */}
            <button
              onClick={() => {
                if (confirm('Clear all messages?')) {
                  clearMessages()
                }
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              disabled={messages.length === 0}
            >
              Clear Chat
            </button>
          </div>
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ChatWindow
          messages={messages}
          isTyping={isTyping}
          onSendMessage={sendMessage}
          context={context}
          disabled={status !== 'connected'}
        />
      </div>

      {/* Help Footer */}
      {messages.length === 0 && (
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">What can I help you with?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Ask questions about your projects and budgets</li>
              <li>• Get recommendations for phase planning</li>
              <li>• Generate reports and summaries</li>
              <li>• Analyze project timelines and resource allocation</li>
              <li>• Find vendors or get quote comparisons</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
