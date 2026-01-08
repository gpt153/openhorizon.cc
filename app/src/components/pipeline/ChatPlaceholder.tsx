import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, Sparkles } from 'lucide-react'

export function ChatPlaceholder() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          AI Agent Chat
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex min-h-[400px] flex-col items-center justify-center text-center p-8">
          <Sparkles className="h-12 w-12 text-zinc-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">AI Agent Coming Soon</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Chat with specialized AI agents to get recommendations for accommodations, activities, and emergency planning.
          </p>
          <div className="mt-6 space-y-2 text-left w-full max-w-md">
            <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800 p-3">
              <p className="text-sm font-medium">🏨 Accommodation Agent</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Find hotels, hostels, and lodging options</p>
            </div>
            <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800 p-3">
              <p className="text-sm font-medium">🎉 Activities Agent</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Discover workshops and cultural experiences</p>
            </div>
            <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800 p-3">
              <p className="text-sm font-medium">🚨 Emergency Agent</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Plan for safety and contingencies</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
