'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageSquare, Send, Loader2, Bot, User } from 'lucide-react'
import { toast } from 'sonner'

type PhaseChatProps = {
  phaseId: string
  phaseType: string
  phaseName: string
}

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function PhaseChat({ phaseId, phaseType, phaseName }: PhaseChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')

  const chatMutation = trpc.pipeline.phases.chat.useMutation({
    onSuccess: (data) => {
      // Add AI response to messages
      setMessages((prev) => [
        ...prev,
        {
          id: data.conversationId,
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
        },
      ])
    },
    onError: (error) => {
      toast.error(`Chat error: ${error.message}`)
    },
  })

  const handleSendMessage = () => {
    if (!inputValue.trim() || chatMutation.isPending) return

    const userMessage = inputValue.trim()
    setInputValue('')

    // Add user message to UI immediately
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
      },
    ])

    // Send to API
    chatMutation.mutate({
      phaseId,
      userMessage,
    })
  }

  const getAgentTitle = () => {
    switch (phaseType) {
      case 'ACCOMMODATION':
        return '🏨 Accommodation Assistant'
      case 'ACTIVITIES':
        return '🎯 Activities Planner'
      case 'EMERGENCY':
        return '🚨 Emergency Planning Assistant'
      case 'TRAVEL':
        return '✈️ Travel Coordinator'
      case 'FOOD':
        return '🍽️ Catering Advisor'
      case 'INSURANCE':
        return '🛡️ Insurance Advisor'
      default:
        return '🤖 AI Assistant'
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          {getAgentTitle()}
        </CardTitle>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Ask questions about {phaseName.toLowerCase()} planning
        </p>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto max-h-[500px]">
          {messages.length === 0 && (
            <div className="text-center py-8 text-zinc-500">
              <Bot className="h-12 w-12 mx-auto mb-4 text-zinc-400" />
              <p className="text-sm">
                Start a conversation! Ask me about recommendations, budget planning, or logistics.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                  </div>
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>

              {message.role === 'user' && (
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                    <User className="h-5 w-5 text-zinc-600 dark:text-zinc-300" />
                  </div>
                </div>
              )}
            </div>
          ))}

          {chatMutation.isPending && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                </div>
              </div>
              <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg px-4 py-2">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            placeholder="Type your message..."
            disabled={chatMutation.isPending}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || chatMutation.isPending}
          >
            {chatMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
