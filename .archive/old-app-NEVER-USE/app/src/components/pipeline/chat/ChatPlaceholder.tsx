'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Bot, Send, AlertCircle } from 'lucide-react'

type ChatPlaceholderProps = {
  agentType?: 'accommodation' | 'activities' | 'emergency' | 'general'
}

const agentNames = {
  accommodation: 'Accommodation Research Assistant',
  activities: 'Activities Planning Assistant',
  emergency: 'Emergency Planning Assistant',
  general: 'AI Assistant',
}

export function ChatPlaceholder({ agentType = 'general' }: ChatPlaceholderProps) {
  const agentName = agentNames[agentType]

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-600" />
          {agentName}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Info Banner */}
        <div className="flex items-start gap-3 rounded-lg bg-blue-50 dark:bg-blue-950 p-4 border border-blue-200 dark:border-blue-800">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              AI Chat Coming Soon
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Chat with AI to research vendors, compose emails, and manage communications.
              This feature is currently in development.
            </p>
          </div>
        </div>

        {/* Mock Chat Messages */}
        <div className="space-y-3 opacity-50">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 flex-shrink-0">
              <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 p-3">
              <p className="text-sm">
                Hello! I can help you research {agentType === 'accommodation' ? 'hotels and hostels' :
                  agentType === 'activities' ? 'activities and excursions' :
                  agentType === 'emergency' ? 'emergency contacts and procedures' :
                  'vendors and services'}.
              </p>
            </div>
          </div>
        </div>

        {/* Disabled Input */}
        <div className="space-y-2">
          <Textarea
            placeholder="Type your message..."
            disabled
            className="resize-none"
            rows={3}
          />
          <Button disabled className="w-full">
            <Send className="h-4 w-4 mr-2" />
            Send Message (Disabled)
          </Button>
        </div>

        {/* Note about Email */}
        <div className="text-sm text-zinc-500 dark:text-zinc-400 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900">
          <p className="font-medium">Note:</p>
          <p className="mt-1">
            Email sending is not yet enabled. When available, you'll be able to compose and send
            quote requests directly from this interface.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
